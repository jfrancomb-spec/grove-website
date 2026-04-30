const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("family profile page shows visible jobs posted by that family", async ({ page }) => {
  await stubExternalDeps(page, {
    familyProfile: {
      id: "family-1",
      user_id: "family-user-1",
      current_visible_version_id: "fam-v1",
      current_pending_version_id: null,
      is_active: true,
      average_response_minutes: 30,
      confirmed_encounters: 2
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Casey",
      last_name: "Home",
      location: "Austin"
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "family-user-1",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
      pay_range: "$20-$25/hr",
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
      schedule: "Weekdays 3pm-6pm",
      pay_range: "$20-$25/hr",
      description: "Need dependable care after school."
    }]
  });

  await page.goto("/family-profile.html?id=family-1");

  await expect(page.getByRole("heading", { name: "Posted Jobs" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "After-school childcare" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Details" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login to Apply" })).toBeVisible();
});

test("family profile page shows view application for caregivers who already applied", async ({ page }) => {
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
      is_active: true,
      average_response_minutes: 30,
      confirmed_encounters: 2
    },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Casey",
      last_name: "Home",
      location: "Austin"
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
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
      pay_range: "$20-$25/hr",
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
      schedule: "Weekdays 3pm-6pm",
      pay_range: "$20-$25/hr",
      description: "Need dependable care after school."
    }]
  });

  await page.goto("/family-profile.html?id=family-1");

  await expect(page.getByRole("link", { name: "View Application" })).toHaveAttribute("href", "./messages.html?conversation=conv-1");
  await expect(page.getByRole("link", { name: "Apply for this job" })).toHaveCount(0);
});

test("family profile page does not allow applying to your own family job", async ({ page }) => {
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
      is_active: true,
      average_response_minutes: 30,
      confirmed_encounters: 2
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
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
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

  await page.goto("/family-profile.html?id=family-1");

  await expect(page.getByRole("link", { name: "Your Job Post" })).toHaveAttribute("href", "./job-details.html?job_id=job-1");
  await expect(page.getByRole("link", { name: "Apply for this job" })).toHaveCount(0);
});
