const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("account settings page keeps contact info separate from dashboard", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" }
  });

  await page.goto("/account-settings.html");

  await expect(page.getByRole("heading", { name: "Account Settings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact Info" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save Contact Info" })).toBeDisabled();
});

test("account settings save button only enables after a real change", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: {
      id: "user-1",
      email: "jenni@example.com",
      user_metadata: {
        first_name: "Jenni",
        last_name: "Francomb",
        phone: "5551112222"
      }
    }
  });

  await page.goto("/account-settings.html");

  const saveButton = page.getByRole("button", { name: "Save Contact Info" });
  await expect(saveButton).toBeDisabled();

  await page.getByLabel("First Name").fill("Jennifer");
  await expect(saveButton).toBeEnabled();

  await page.getByLabel("First Name").fill("Jenni");
  await expect(saveButton).toBeDisabled();
});
