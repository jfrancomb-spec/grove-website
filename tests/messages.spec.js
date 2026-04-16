const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("messages page uses family profile context from query and shows profile inbox copy", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/messages.html?profileType=family&profileId=family-1");

  await expect(page.locator("#profileScopeCard")).toBeVisible();
  await expect(page.locator("#profileScopeText")).toHaveText("Viewing conversations for your family profile.");
  await expect(page.locator("#profileScopeActions")).toContainText("Family profile");
  await expect(page.locator("#profileScopeActions")).toContainText("Caregiver profile");
});
