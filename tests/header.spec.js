const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("signed-in family role header shows browse caregivers, messages, and my account", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "family");
  });

  await page.goto("/");

  await expect(page.locator("#navBrowseLink")).toHaveText("Browse Caregivers");
  await expect(page.locator("#navMessagesLink")).toHaveText("Messages");
  await expect(page.locator("#navAccountMenuButton")).toHaveText("My Account");
});

test("signed-in caregiver role header shows browse opportunities, messages, and my account", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "caregiver");
  });

  await page.goto("/");

  await expect(page.locator("#navBrowseLink")).toHaveText("Browse Opportunities");
  await expect(page.locator("#navMessagesLink")).toHaveText("Messages");
  await expect(page.locator("#navAccountMenuButton")).toHaveText("My Account");
});
