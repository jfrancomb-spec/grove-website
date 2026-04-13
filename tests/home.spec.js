const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("homepage updates profile CTA labels for signed-in users with profiles", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/");

  await expect(page.getByRole("link", { name: "View Your Family Profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Your Caregiver Profile" })).toBeVisible();
});

test("homepage keeps create profile labels for signed-out users", async ({ page }) => {
  await stubExternalDeps(page);

  await page.goto("/");

  await expect(page.getByRole("link", { name: "Create Family Profile" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create Caregiver Profile" })).toBeVisible();
});
