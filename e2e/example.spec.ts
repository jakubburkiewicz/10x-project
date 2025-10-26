import { test, expect } from "@playwright/test";

test("should redirect to login page and have correct title", async ({ page }) => {
  await page.goto("/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Logowanie/);
});

test("should show login form on login page", async ({ page }) => {
  await page.goto("/");

  // Verify redirection to the login page and presence of the login form elements
  await expect(page).toHaveURL(/.*login/);
  await expect(page.getByText("Witaj z powrotem!")).toBeVisible();
  await expect(page.getByLabel("Adres e-mail")).toBeVisible();
  await expect(page.getByLabel("Hasło")).toBeVisible();
  await expect(page.getByRole("button", { name: "Zaloguj się" })).toBeVisible();
});
