const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("login redirects dual-profile users to chooser", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/login.html");

  await expect(page).toHaveURL(/\/chooser\.html$/);
});

test("login redirects family-only users to my jobs", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null }
  });

  await page.goto("/login.html");

  await expect(page).toHaveURL(/\/my-postings\.html$/);
});

test("login redirects caregiver-only users to my applications", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/login.html");

  await expect(page).toHaveURL(/\/my-applications\.html$/);
});
