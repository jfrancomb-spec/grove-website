const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("my applications page shows caregiver applications with dashboard-level detail and actions", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    familyProfileVersions: [
      { id: "fam-v1", name_display: "Casey H.", photo_urls: "[\"https://example.com/family-photo.jpg\"]" }
    ],
    jobApplications: [
      { id: "app-1", job_id: "job-1", applicant_email: "jenni@example.com", created_at: "2026-04-20T12:00:00.000Z" }
    ],
    jobPosts: [
      { id: "job-1", title: "After-school nanny", care_type: "Childcare", location: "Belle Plaine", schedule: "Weekdays", description: "Help with school pickup and afternoon play.", pay_range: "$18-$22/hr", user_id: "family-user-1", current_visible_version_id: "job-v1" }
    ],
    jobPostVersions: [
      { id: "job-v1", title: "After-school nanny", care_type: "Childcare", location: "Belle Plaine", schedule: "Weekdays", description: "Help with school pickup and afternoon play.", pay_range: "$18-$22/hr" }
    ],
    conversations: [
      { id: "conv-1", family_profile_id: "family-1", caregiver_profile_id: "caregiver-1", job_post_id: "job-1", status: "active" }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: true },
      { id: "cp-2", conversation_id: "conv-1", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false }
    ]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "caregiver");
  });

  await page.goto("/my-applications.html");

  await expect(page.getByRole("heading", { name: "My Applications" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jobs I Applied To" })).toBeVisible();
  await expect(page.locator("main").getByRole("link", { name: "Browse Opportunities" })).toHaveAttribute("href", "./jobs.html");
  await expect(page.locator(".application-card").first().getByRole("heading", { name: "After-school nanny" })).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("Casey H.")).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("Applied: Apr 20, 2026")).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("Schedule: Weekdays")).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("Pay: $18-$22/hr")).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("Details: Help with school pickup and afternoon play.")).toBeVisible();
  await expect(page.locator(".application-card").first().getByText("New message")).toBeVisible();
  await expect(page.locator(".application-card .application-card-avatar")).toHaveAttribute("src", "https://example.com/family-photo.jpg");
  await expect(page.getByRole("link", { name: "View Family" }).first()).toHaveAttribute("href", "./family-profile.html?id=family-1&returnTo=my-applications");
  await expect(page.getByRole("link", { name: "View Job" }).first()).toHaveAttribute("href", "./job-details.html?job_id=job-1&returnTo=my-applications");
  await expect(page.getByRole("link", { name: "View Messages" }).first()).toBeVisible();
});
