const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("account settings page keeps contact info separate from dashboard", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" }
  });

  await page.goto("/account-settings.html");

  await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact Info" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Dashboard" })).toBeVisible();
});
