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
      photo_urls: "[\"https://example.com/family-photo.jpg\"]"
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
      description: "Need dependable care after school.",
      photo_urls: ["https://example.com/job-photo.jpg"]
    }]
  });

  await page.goto("/jobs.html");

  await expect(page.getByRole("heading", { name: "Care Jobs" })).toBeVisible();
  await expect(page.locator(".hero .button")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "After-school childcare" })).toBeVisible();
  await expect(page.getByText("Family: Casey H.")).toBeVisible();
  await expect(page.getByText("Austin")).toBeVisible();
  await expect(page.locator(".job-card-photo")).toHaveAttribute("src", "https://example.com/job-photo.jpg");
  await expect(page.locator(".job-family-avatar")).toHaveAttribute("src", "https://example.com/family-photo.jpg");
  await expect(page.getByRole("link", { name: "View Details" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Family" })).toHaveAttribute("href", "./family-profile.html?id=family-1&returnTo=jobs");
  await expect(page.getByRole("link", { name: "Login to Apply" })).toBeVisible();
});

test("jobs page shows view application after a caregiver already applied", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: {
      id: "caregiver-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true
    },
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
      photo_urls: "[\"https://example.com/family-photo.jpg\"]"
    }],
    jobApplications: [{
      id: "app-1",
      job_id: "job-1",
      applicant_email: "jenni@example.com",
      created_at: "2026-04-20T12:00:00Z"
    }],
    conversations: [{
      id: "conv-1",
      caregiver_profile_id: "caregiver-1",
      family_profile_id: "family-1",
      job_post_id: "job-1",
      status: "active"
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

  await expect(page.getByRole("link", { name: "View Application" })).toHaveAttribute("href", "./messages.html?conversation=conv-1");
  await expect(page.getByRole("link", { name: "Apply for this job" })).toHaveCount(0);
});

test("jobs page does not allow a caregiver to apply to their own family job", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: {
      id: "caregiver-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfile: {
      id: "family-1",
      user_id: "user-1",
      current_visible_version_id: "fam-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Jenni",
      last_name: "Francomb",
      name_display: "Jenni F.",
      location: "Austin"
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "user-1",
      current_visible_version_id: "job-v1",
      is_active: true,
      content_status: "published",
      created_at: "2026-04-01T12:00:00Z"
    }],
    jobPostVersions: [{
      id: "job-v1",
      is_live: true,
      content_status: "published",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm"
    }]
  });

  await page.goto("/jobs.html");

  const ownApplyButton = page.locator(".browse-card-actions").getByText("Apply for this job");
  await expect(ownApplyButton).toBeVisible();
  await expect(ownApplyButton).toHaveAttribute("aria-disabled", "true");
  await expect(ownApplyButton).toHaveAttribute("title", "You cannot apply to your own listing.");
  await expect(ownApplyButton).toHaveCSS("cursor", "not-allowed");
});
