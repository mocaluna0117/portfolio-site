import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@example.test", password: "e2e-admin-password" };

/** Signs in with the development-only email form on /login0117. */
export async function signIn(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto("/login0117");
  await page.getByLabel("メールアドレス").fill(email);
  await page.getByLabel("パスワード").fill(password);
  await page.getByRole("button", { name: "メールアドレスでログイン" }).click();
}

export async function signInAsAdmin(page: Page) {
  await signIn(page);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "作品", level: 1 })).toBeVisible();
}
