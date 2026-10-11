import { expect, test } from "@playwright/test";

test("the home page lists the published works and links to each", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("もかるな");
  const cards = page.locator("#works article");
  await expect(cards).toHaveCount(6);
  await cards.filter({ hasText: "Memoca" }).getByRole("link").click();
  await expect(page).toHaveURL(/\/works\/memoca$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Memoca");
});

test("a work page shows its document, images, video and contents", async ({ page }) => {
  await page.goto("/works/memoca");
  await expect(page.getByRole("heading", { name: "見どころ" })).toBeVisible();
  await expect(page.locator("video source")).toHaveAttribute("src", /\/api\/storage\//);
  const doc = page.locator(".doc");
  await expect(doc.getByRole("heading", { level: 2 }).first()).toBeVisible();
  // Every image of the document is a stored file, none a broken relative path.
  const sources = await doc
    .locator("img")
    .evaluateAll((images) =>
      images.map((img) => (img as HTMLImageElement).currentSrc || (img as HTMLImageElement).src),
    );
  expect(sources.length).toBeGreaterThan(3);
  for (const src of sources) expect(src).toMatch(/\/_next\/image\?url=|\/api\/storage\//);
  // The real name is never shown.
  await expect(page.locator("body")).not.toContainText("氏名");
});

test("the table of contents jumps to its heading", async ({ page, isMobile }) => {
  test.skip(isMobile, "the sidebar is for wide screens");
  await page.goto("/works/manualy");
  const toc = page.getByRole("navigation", { name: "目次" });
  const link = toc.getByRole("link").nth(3);
  const href = await link.getAttribute("href");
  await link.click();
  const id = decodeURIComponent(href!.slice(1));
  await expect(page.locator(`[id="${id}"]`)).toBeInViewport();
});

test("an unknown work is a 404 page", async ({ page }) => {
  await page.goto("/works/no-such-work");
  await expect(page.getByText("ページが見つかりません")).toBeVisible();
});
