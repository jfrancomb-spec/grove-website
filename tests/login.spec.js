const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("login redirects signed-in users with a profile to the dashboard", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/login.html");

  await expect(page).toHaveURL(/\/account\.html$/);
});
