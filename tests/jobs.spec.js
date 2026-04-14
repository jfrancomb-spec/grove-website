const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("jobs page hides hero buttons and renders published opportunities", async ({ page }) => {
  await stubExternalDeps(page, {
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
});
