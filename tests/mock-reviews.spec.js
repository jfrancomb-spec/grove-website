const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("family profile shows sample reviews when there are no live reviews yet", async ({ page }) => {
  await stubExternalDeps(page, {
    familyProfile: {
      id: "family-1",
      user_id: "family-user-1",
      current_visible_version_id: "fam-v1",
      is_active: true
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Casey",
      last_name: "Home",
      location: "Austin"
    }]
  });

  await page.goto("/family-profile.html?id=family-1");

  await expect(page.getByText("Sample reviews shown for preview.")).toBeVisible();
  await expect(page.getByText(/welcoming, organized, and very clear/i)).toBeVisible();
});

test("caregiver profile shows sample reviews when there are no live reviews yet", async ({ page }) => {
  await stubExternalDeps(page, {
    caregiverProfile: {
      id: "caregiver-1",
      user_id: "caregiver-user-1",
      current_visible_version_id: "cg-v1",
      is_active: true
    },
    caregiverProfileVersions: [{
      id: "cg-v1",
      is_live: true,
      content_status: "published",
      first_name: "Jordan",
      last_name: "Lee",
      location: "Austin"
    }]
  });

  await page.goto("/caregiver-profile.html?id=caregiver-1");

  await expect(page.getByText("Sample reviews shown for preview.")).toBeVisible();
  await expect(page.getByText(/dependable, calm, and easy to communicate with/i)).toBeVisible();
});
