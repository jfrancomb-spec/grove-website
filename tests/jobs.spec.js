const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("jobs page hides hero buttons and renders published opportunities", async ({ page }) => {
  await stubExternalDeps(page, {
    familyProfile: {
      id: "family-1",
      user_id: "family-user-1",
      current_visible_version_id: "fam-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Casey",
      last_name: "Home",
      location: "Austin",
      photo_url: "https://example.com/family-photo.jpg"
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "family-user-1",
      current_visible_version_id: "job-v1",
      is_active: true,
      content_status: "queued",
      created_at: "2026-04-01T12:00:00Z"
    }],
    jobPostVersions: [{
      id: "job-v1",
      is_live: true,
      content_status: "published",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
      pay_range: "$20-$25/hr",
      description: "Need dependable care after school."
    }]
  });

  await page.goto("/jobs.html");

  await expect(page.getByRole("heading", { name: "Care Jobs" })).toBeVisible();
  await expect(page.locator(".hero .button")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "After-school childcare" })).toBeVisible();
  await expect(page.getByText("Austin")).toBeVisible();
  await expect(page.locator(".job-family-avatar")).toHaveAttribute("src", "https://example.com/family-photo.jpg");
  await expect(page.getByRole("link", { name: "View Details" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Family" })).toHaveAttribute("href", "./family-profile.html?id=family-1&returnTo=jobs");
  await expect(page.getByRole("link", { name: "Login to Apply" })).toBeVisible();
});
