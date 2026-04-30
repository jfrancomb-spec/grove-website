const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("job details page shows view application when the caregiver already applied", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: {
      id: "caregiver-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfiles: [{
      id: "family-1",
      user_id: "family-user-1",
      current_visible_version_id: "fam-v1",
      is_active: true
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
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
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

  await page.goto("/job-details.html?job_id=job-1&returnTo=messages&profileType=caregiver&profileId=caregiver-1&conversation=conv-1");

  await expect(page.getByRole("link", { name: "View Application" })).toHaveAttribute("href", "./messages.html?conversation=conv-1");
  await expect(page.getByRole("link", { name: "Apply for this job" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Back to Messages" })).toHaveAttribute("href", "./messages.html?profileType=caregiver&profileId=caregiver-1&conversation=conv-1");
});

test("job details page does not allow applying to your own family job", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: {
      id: "caregiver-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfiles: [{
      id: "family-1",
      user_id: "user-1",
      current_visible_version_id: "fam-v1",
      is_active: true
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "user-1",
      current_visible_version_id: "job-v1",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
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

  await page.goto("/job-details.html?job_id=job-1");

  const ownApplyButton = page.locator("#applyBtn");
  await expect(ownApplyButton).toHaveText("Apply for this job");
  await expect(ownApplyButton).not.toHaveAttribute("href", /.+/);
  await expect(ownApplyButton).toHaveAttribute("aria-disabled", "true");
  await expect(ownApplyButton).toHaveAttribute("title", "You cannot apply to your own listing.");
  await expect(ownApplyButton).toHaveCSS("cursor", "not-allowed");
});

test("job details page returns to dashboard when opened from account", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: {
      id: "caregiver-1",
      current_visible_version_id: "cg-v1",
      current_pending_version_id: null,
      is_active: true
    },
    familyProfiles: [{
      id: "family-1",
      user_id: "family-user-1",
      current_visible_version_id: "fam-v1",
      is_active: true
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "family-user-1",
      current_visible_version_id: "job-v1",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin",
      schedule: "Weekdays 3pm-6pm",
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

  await page.goto("/job-details.html?job_id=job-1&returnTo=account");

  await expect(page.getByRole("link", { name: "Back to Dashboard" })).toHaveAttribute("href", "./account.html");
});
