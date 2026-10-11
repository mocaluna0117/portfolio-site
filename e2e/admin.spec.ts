import { expect, test } from "@playwright/test";
import { signIn, signInAsAdmin } from "./helpers";

test("the admin screens send a visitor to the sign-in page", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login0117$/);
});

test("the sign-in page is kept out of search engines", async ({ page }) => {
  const response = await page.goto("/login0117");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("button", { name: "Google でログイン" })).toBeVisible();
});

test("no account but the owner's can be made", async ({ page }) => {
  await signIn(page, `stranger-${Date.now()}@example.test`, "some-password-123");
  await expect(page.getByText(/管理者だけ/)).toBeVisible();
  await expect(page).toHaveURL(/\/login0117$/);
});

test("unpublishing a work takes it off the site, and publishing brings it back", async ({
  page,
  context,
}) => {
  await signInAsAdmin(page);
  const row = page.locator("li", { hasText: "/works/todo" });
  const toggle = row.getByRole("switch");
  await expect(toggle).toBeChecked();

  await toggle.click();
  await expect(toggle).not.toBeChecked();
  const visitor = await context.newPage();
  await expect(async () => {
    await visitor.goto("/");
    await expect(visitor.locator("#works article")).toHaveCount(5, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });

  await toggle.click();
  await expect(toggle).toBeChecked();
  await expect(async () => {
    await visitor.goto("/");
    await expect(visitor.locator("#works article")).toHaveCount(6, { timeout: 1_000 });
  }).toPass({ timeout: 20_000 });
});

test("a message sent from the form reaches the admin screen", async ({ page }) => {
  const body = `E2E のお問い合わせ ${Date.now()}`;
  await page.goto("/#contact");
  await page.getByLabel("お名前").fill("テスト");
  // A new sender each run: one address may send only a few an hour.
  await page.getByLabel("メールアドレス").fill(`visitor-${Date.now()}@example.test`);
  await page.getByLabel("内容").fill(body);
  // Turnstile's test site key always passes.
  await expect(page.getByRole("button", { name: "送信する" })).toBeEnabled({ timeout: 30_000 });
  await page.getByRole("button", { name: "送信する" }).click();
  await expect(page.getByText("送信しました。ありがとうございます。")).toBeVisible();

  await signInAsAdmin(page);
  await page.goto("/admin/messages");
  await expect(page.getByText(body)).toBeVisible();
});

test("every admin screen works when opened directly", async ({ page }) => {
  await signInAsAdmin(page);
  // A fresh load each: the browser's Convex client starts without a token.
  for (const [path, heading] of [
    ["/admin", "作品"],
    ["/admin/profile", "プロフィール"],
    ["/admin/messages", "お問い合わせ"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    await expect(page.getByText("表示できませんでした")).toHaveCount(0);
  }
  await page.goto("/admin");
  const edit = page.locator("li", { hasText: "/works/memoca" }).getByRole("link", { name: "編集" });
  const href = await edit.getAttribute("href");
  await page.goto(href!);
  await expect(page.getByRole("heading", { name: "Memoca", level: 1 })).toBeVisible();
});
