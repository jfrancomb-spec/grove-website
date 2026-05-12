const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("apply page uses caregiver profile context and only asks for a message", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      {
        id: "cg-v1",
        name_display: "Jenni F.",
        location: "Belle Plaine",
        care_types: ["Childcare", "Pet Care"],
        years_experience: "10+"
      }
    ],
    jobPosts: [
      {
        id: "job-1",
        user_id: "family-user-1",
        title: "After-school nanny",
        care_type: "Childcare",
        location: "Belle Plaine",
        schedule: "Weekdays",
        pay_range: "$18-$22/hr",
        description: "Help with pickup, snacks, and after-school routines."
      }
    ]
  });

  await page.goto("/apply.html?job_id=job-1");

  await expect(page.getByRole("heading", { name: "Apply with your Grove profile" })).toBeVisible();
  await expect(page.getByText("Job Details")).toBeVisible();
  await expect(page.locator("#jobSubtitle")).toHaveText("After-school nanny");
  await expect(page.getByText("Belle Plaine • Childcare")).toBeVisible();
  await expect(page.getByText("Schedule: Weekdays")).toBeVisible();
  await expect(page.getByText("Pay: $18-$22/hr")).toBeVisible();
  await expect(page.getByText("Help with pickup, snacks, and after-school routines.")).toBeVisible();
  await expect(page.getByText("Applying As")).toBeVisible();
  await expect(page.getByText("Jenni F.")).toBeVisible();
  await expect(page.getByLabel("Message to the family")).toBeVisible();
  await expect(page.getByRole("link", { name: "Preview Profile" })).toHaveAttribute("href", "./caregiver.html?returnTo=apply&job_id=job-1");
  await expect(page.locator("#app_name")).toHaveCount(0);
  await expect(page.locator("#app_email")).toHaveCount(0);
  await expect(page.locator("#app_phone")).toHaveCount(0);
  await expect(page.locator("#app_location")).toHaveCount(0);
});

test("previewing from apply page keeps a back-to-application path and preserves the draft message", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      {
        id: "cg-v1",
        is_live: true,
        content_status: "published",
        name_display: "Jenni F.",
        first_name: "Jenni",
        last_name: "Francomb",
        location: "Belle Plaine",
        care_types: ["Childcare"],
        years_experience: "10+",
        bio: "Experienced caregiver."
      }
    ],
    jobPosts: [
      {
        id: "job-1",
        user_id: "family-user-1",
        title: "After-school nanny",
        care_type: "Childcare",
        location: "Belle Plaine",
        schedule: "Weekdays"
      }
    ]
  });

  await page.goto("/apply.html?job_id=job-1");
  await page.getByLabel("Message to the family").fill("I would love to help with this routine.");
  await page.getByRole("link", { name: "Preview Profile" }).click();

  await expect(page).toHaveURL(/caregiver\.html\?returnTo=apply&job_id=job-1$/);
  await expect(page.getByRole("link", { name: "Back to Application" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Application" }).click();

  await expect(page).toHaveURL(/apply\.html\?job_id=job-1$/);
  await expect(page.getByLabel("Message to the family")).toHaveValue("I would love to help with this routine.");
});

test("apply page blocks duplicate applications and links to the existing thread", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      {
        id: "cg-v1",
        name_display: "Jenni F.",
        location: "Belle Plaine",
        care_types: ["Childcare"],
        years_experience: "10+"
      }
    ],
    jobApplications: [
      { id: "app-1", job_id: "job-1", applicant_email: "jenni@example.com", created_at: "2026-04-20T12:00:00.000Z" }
    ],
    jobPosts: [
      {
        id: "job-1",
        user_id: "family-user-1",
        title: "After-school nanny",
        care_type: "Childcare",
        location: "Belle Plaine",
        schedule: "Weekdays"
      }
    ]
  });

  await page.goto("/apply.html?job_id=job-1");

  await expect(page.getByText("You already applied to this job.")).toBeVisible();
  await expect(page.getByRole("link", { name: "View Application" })).toHaveAttribute(
    "href",
    "./messages.html?targetUser=family-user-1&familyProfileId=family-1&caregiverProfileId=cg-v1&jobId=job-1"
  );
  await expect(page.locator("#applyForm")).toBeHidden();
});

test("apply page blocks users from applying to their own family job", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      {
        id: "cg-v1",
        name_display: "Jenni F.",
        location: "Belle Plaine",
        care_types: ["Childcare"],
        years_experience: "10+"
      }
    ],
    jobPosts: [
      {
        id: "job-1",
        user_id: "user-1",
        title: "After-school nanny",
        care_type: "Childcare",
        location: "Belle Plaine",
        schedule: "Weekdays"
      }
    ]
  });

  await page.goto("/apply.html?job_id=job-1");

  await expect(page.getByText("You cannot apply to your own job post.")).toBeVisible();
  await expect(page.locator("#applyBlockedMessage").getByRole("link", { name: "Back to Jobs" })).toHaveAttribute("href", "./jobs.html");
  await expect(page.locator("#applyForm")).toBeHidden();
});
