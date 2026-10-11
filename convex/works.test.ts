import { convexTest } from "convex-test";
import { beforeEach, describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const ADMIN = "owner@example.test";
const issuer = "https://convex.test";

beforeEach(() => {
  process.env.CONVEX_SITE_URL = issuer;
  process.env.ADMIN_EMAILS = ADMIN;
  // No site to tell: convex/revalidate.ts does nothing without these.
  delete process.env.SITE_URL;
  delete process.env.REVALIDATE_SECRET;
});

function setup() {
  const t = convexTest(schema, modules);
  const admin = t.withIdentity({ issuer, subject: "u1", email: ADMIN });
  return { t, admin };
}

const SOURCE = { repo: "owner/repo", ref: "main", docPath: "docs/portfolio/PORTFOLIO.md" };

async function addWork(
  admin: ReturnType<typeof setup>["admin"],
  slug: string,
  published = true,
): Promise<Id<"works">> {
  const id = await admin.mutation(api.works.create, { slug, title: slug, source: SOURCE });
  if (published) await admin.mutation(api.works.setPublished, { id, published: true });
  return id;
}

describe("admin access", () => {
  test("is the address in ADMIN_EMAILS, from this deployment's tokens only", async () => {
    const { t, admin } = setup();
    await expect(admin.query(api.works.listAll, {})).resolves.toEqual([]);
    await expect(t.query(api.works.listAll, {})).rejects.toThrow(/ログインが必要/);
    await expect(
      t
        .withIdentity({ issuer, subject: "u2", email: "stranger@example.test" })
        .query(api.works.listAll, {}),
    ).rejects.toThrow(/管理者だけ/);
    await expect(
      t
        .withIdentity({ issuer: "https://elsewhere.test", subject: "u1", email: ADMIN })
        .query(api.works.listAll, {}),
    ).rejects.toThrow(/ログインが必要/);
  });

  test("every change is refused to a visitor", async () => {
    const { t, admin } = setup();
    const id = await addWork(admin, "a");
    await expect(t.mutation(api.works.setPublished, { id, published: false })).rejects.toThrow();
    await expect(t.mutation(api.works.reorder, { ids: [id] })).rejects.toThrow();
    await expect(t.mutation(api.works.remove, { id })).rejects.toThrow();
    await expect(t.mutation(api.importWork.start, { workId: id })).rejects.toThrow();
    await expect(t.mutation(api.works.generateUploadUrl, {})).rejects.toThrow();
    await expect(
      t.mutation(api.site.updateProfile, {
        handle: "x",
        intro: "",
        githubUrl: "https://github.com/x",
      }),
    ).rejects.toThrow();
  });
});

describe("what visitors see", () => {
  test("published works only, in the order set", async () => {
    const { t, admin } = setup();
    const a = await addWork(admin, "a");
    const b = await addWork(admin, "b");
    await addWork(admin, "hidden", false);
    await admin.mutation(api.works.reorder, { ids: [b, a] });
    const listed = await t.query(api.works.listPublished, {});
    expect(listed.map((work) => work.slug)).toEqual(["b", "a"]);
    expect(await t.query(api.works.getBySlug, { slug: "hidden" })).toBeNull();
    expect((await t.query(api.works.listPublishedSlugs, {})).map((s) => s.slug)).toEqual([
      "b",
      "a",
    ]);
  });

  test("the document's own highlights until some are written", async () => {
    const { t, admin } = setup();
    const id = await addWork(admin, "a");
    await t.run((ctx) =>
      ctx.db.insert("workDocs", {
        workId: id,
        markdown: "# x",
        docTitle: "x",
        docHighlights: ["from the document"],
        importedAt: 1,
        charCount: 3,
      }),
    );
    expect((await t.query(api.works.getBySlug, { slug: "a" }))?.highlights).toEqual([
      "from the document",
    ]);
    await admin.mutation(api.works.update, {
      id,
      title: "A",
      subtitle: "",
      tagline: "",
      tags: [" React ", "React", ""],
      highlights: ["written here"],
      status: "public",
      links: [{ label: "コード", url: "https://github.com/owner/repo" }],
    });
    const work = await t.query(api.works.getBySlug, { slug: "a" });
    expect(work?.highlights).toEqual(["written here"]);
    expect(work?.tags).toEqual(["React"]);
  });

  test("a link must be a web address", async () => {
    const { admin } = setup();
    const id = await addWork(admin, "a");
    await expect(
      admin.mutation(api.works.update, {
        id,
        title: "A",
        subtitle: "",
        tagline: "",
        tags: [],
        highlights: [],
        status: "public",
        links: [{ label: "x", url: "javascript:alert(1)" }],
      }),
    ).rejects.toThrow(/URL が正しくありません/);
  });
});

describe("works.create", () => {
  test("refuses a bad or taken URL name", async () => {
    const { admin } = setup();
    await addWork(admin, "taken");
    await expect(
      admin.mutation(api.works.create, { slug: "Bad Slug", title: "x", source: SOURCE }),
    ).rejects.toThrow(/URL 名/);
    await expect(
      admin.mutation(api.works.create, { slug: "taken", title: "x", source: SOURCE }),
    ).rejects.toThrow(/すでに使われて/);
    await expect(
      admin.mutation(api.works.create, {
        slug: "ok",
        title: "x",
        source: { ...SOURCE, repo: "not a repo" },
      }),
    ).rejects.toThrow(/owner\/name/);
  });
});

describe("importWork.commit", () => {
  test("swaps the imported files, keeps uploads, and repairs the thumbnail", async () => {
    const { t, admin } = setup();
    const workId = await addWork(admin, "a");
    const store = () => t.run((ctx) => ctx.storage.store(new Blob(["x"], { type: "image/png" })));

    // A first import and an uploaded thumbnail…
    const oldImage = await store();
    const upload = await store();
    await t.run(async (ctx) => {
      await ctx.db.insert("workFiles", {
        workId,
        role: "image",
        path: "images/old.png",
        storageId: oldImage,
        mime: "image/png",
        bytes: 1,
        importedAt: 1,
      });
      await ctx.db.insert("workFiles", {
        workId,
        role: "upload",
        path: "uploads/1-thumb.png",
        storageId: upload,
        mime: "image/png",
        bytes: 1,
        importedAt: 1,
      });
      await ctx.db.patch(workId, { thumbnailPath: "images/old.png" });
    });

    // …then an import that no longer has the old image.
    const runId = await t.run((ctx) =>
      ctx.db.insert("importRuns", { workId, startedAt: Date.now(), status: "running" }),
    );
    const newImage = await store();
    await t.mutation(internal.importWork.commit, {
      workId,
      runId,
      markdown: "本文",
      docTitle: "A",
      docHighlights: ["h"],
      sourceSha: "a".repeat(40),
      files: [
        {
          role: "image",
          path: "images/new.png",
          storageId: newImage,
          mime: "image/png",
          bytes: 1,
          width: 10,
          height: 5,
        },
      ],
    });

    const files = await t.run((ctx) => ctx.db.query("workFiles").collect());
    expect(files.map((file) => file.path).sort()).toEqual([
      "images/new.png",
      "uploads/1-thumb.png",
    ]);
    expect(await t.run((ctx) => ctx.storage.getUrl(oldImage))).toBeNull();
    const work = await t.run((ctx) => ctx.db.get(workId));
    expect(work?.thumbnailPath).toBe("images/new.png");
    const run = await t.run((ctx) => ctx.db.get(runId));
    expect(run?.status).toBe("ok");
    expect(run?.stats?.images).toBe(1);

    const page = await t.query(api.works.getBySlug, { slug: "a" });
    expect(page?.doc?.markdown).toBe("本文");
    expect(page?.images).toEqual([
      expect.objectContaining({ path: "images/new.png", width: 10, height: 5 }),
    ]);
  });

  test("throws away what a superseded run fetched", async () => {
    const { t, admin } = setup();
    const workId = await addWork(admin, "a");
    const runId = await t.run((ctx) =>
      ctx.db.insert("importRuns", { workId, startedAt: 1, status: "error", finishedAt: 2 }),
    );
    const fetched = await t.run((ctx) => ctx.storage.store(new Blob(["x"])));
    await t.mutation(internal.importWork.commit, {
      workId,
      runId,
      markdown: "x",
      docTitle: "x",
      docHighlights: [],
      files: [
        { role: "image", path: "images/a.png", storageId: fetched, mime: "image/png", bytes: 1 },
      ],
    });
    expect(await t.run((ctx) => ctx.storage.getUrl(fetched))).toBeNull();
    expect(await t.run((ctx) => ctx.db.query("workFiles").collect())).toEqual([]);
  });

  test("one import at a time", async () => {
    const { admin } = setup();
    const workId = await addWork(admin, "a");
    await admin.mutation(api.importWork.start, { workId });
    await expect(admin.mutation(api.importWork.start, { workId })).rejects.toThrow(
      /取り込みの途中/,
    );
  });
});

describe("site.updateProfile", () => {
  test("keeps the GitHub address to a GitHub profile", async () => {
    const { t, admin } = setup();
    await expect(
      admin.mutation(api.site.updateProfile, {
        handle: "x",
        intro: "",
        githubUrl: "https://evil.example",
      }),
    ).rejects.toThrow(/GitHub/);
    await admin.mutation(api.site.updateProfile, {
      handle: " もかるな ",
      intro: "紹介",
      githubUrl: "https://github.com/mocaluna0117",
    });
    expect(await t.query(api.site.profile, {})).toMatchObject({
      handle: "もかるな",
      intro: "紹介",
    });
  });
});
