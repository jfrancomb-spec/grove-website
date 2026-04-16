const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("signed-out caregivers page shows login to message buttons", async ({ page }) => {
  await stubExternalDeps(page, {
    caregiverProfile: {
      id: "caregiver-1",
      user_id: "other-user-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true,
      average_response_minutes: 30,
      confirmed_encounters: 2
    },
    caregiverProfileVersions: [{
      id: "cg-v1",
      is_live: true,
      content_status: "published",
      first_name: "Ava",
      last_name: "Care",
      location: "Austin"
    }]
  });

  await page.goto("/caregivers.html");

  await expect(page.getByRole("button", { name: "Login to Message" }).first()).toBeVisible();
});

test("signed-out families page shows login to message buttons", async ({ page }) => {
  await stubExternalDeps(page, {
    familyProfile: {
      id: "family-1",
      user_id: "other-user-2",
      current_visible_version_id: "fam-v1",
      current_pending_version_id: null,
      is_active: true,
      average_response_minutes: 45,
      confirmed_encounters: 1
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "River",
      last_name: "Home",
      location: "Dallas"
    }]
  });

  await page.goto("/families.html");

  await expect(page.getByRole("button", { name: "Login to Message" }).first()).toBeVisible();
});
