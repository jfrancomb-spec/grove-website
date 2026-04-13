const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("chooser shows family and caregiver role options for dual-profile users", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/chooser.html");

  await expect(page.getByRole("heading", { name: "What do you want to do today?" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find a Caregiver.*Switch to Family/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Find a Job.*Switch to Caregiver/i })).toBeVisible();
});
