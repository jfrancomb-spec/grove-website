const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("account page renders family role copy and toggle labels", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "family");
  });

  await page.goto("/account.html");

  await expect(page.getByText("Viewing As")).toBeVisible();
  await expect(page.getByText("Family", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Family" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Caregiver" })).toBeVisible();
  await expect(page.getByText("Buttons and shortcuts through-out Grove will update based on the profile you are using.")).toBeVisible();
});
