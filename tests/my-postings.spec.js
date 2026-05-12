const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("my postings page shows family jobs with dashboard-level detail and actions", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null, is_active: true },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    jobPosts: [
      {
        id: "job-1",
        user_id: "user-1",
        current_visible_version_id: "job-v1",
        is_active: true,
        content_status: "published",
        created_at: "2026-04-01T12:00:00Z",
        updated_at: "2026-04-20T12:00:00Z"
      },
      {
        id: "job-2",
        user_id: "user-1",
        current_visible_version_id: "job-v2",
        is_active: true,
        content_status: "published",
        created_at: "2026-04-01T12:00:00Z",
        updated_at: "2026-04-25T12:00:00Z"
      }
    ],
    jobPostVersions: [
      {
        id: "job-v1",
        is_live: true,
        content_status: "published",
        title: "After-school childcare",
        care_type: "childcare",
        location: "Austin",
        schedule: "Weekdays 3-6 PM",
        description: "School pickup and snacks.",
        pay_range: "$18-$22/hr"
      },
      {
        id: "job-v2",
        is_live: true,
        content_status: "published",
        title: "Weekend pet care",
        care_type: "pet care",
        location: "Jordan",
        schedule: "Saturday mornings",
        description: "Walk and feed our dog.",
        pay_range: "$20/hr"
      }
    ],
    conversations: [
      {
        id: "conv-1",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-other-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-05-02T09:00:00Z"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false, last_read_at: null },
      { id: "cp-2", conversation_id: "conv-1", user_id: "caregiver-user-2", profile_id: "caregiver-other-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-1", sender_user_id: "caregiver-user-2", message_text: "I would love to apply.", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-05-02T09:00:00Z" }
    ]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "family");
  });

  await page.goto("/my-postings.html");

  await expect(page.getByRole("heading", { name: "My Postings" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your Job Posts" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Post a New Job" })).toHaveAttribute("href", "./findcare.html");
  await expect(page.locator(".job-card").first().getByRole("heading", { name: "After-school childcare" })).toBeVisible();
  await expect(page.locator(".job-card").first().getByText("Schedule: Weekdays 3-6 PM")).toBeVisible();
  await expect(page.locator(".job-card").first().getByText("Pay: $18-$22/hr")).toBeVisible();
  await expect(page.locator(".job-card").first().getByText("Details: School pickup and snacks.")).toBeVisible();
  await expect(page.getByText("New application")).toBeVisible();
  await expect(page.locator(".job-card").first().getByRole("link", { name: "Preview Job" })).toHaveAttribute("href", "./job-details.html?job_id=job-1&returnTo=my-jobs");
  await expect(page.locator(".job-card").first().getByRole("link", { name: "View Applications" })).toHaveAttribute("href", /messages\.html\?(?:profileType=family&jobFilter=job-1&profileId=family-1|profileType=family&profileId=family-1&jobFilter=job-1)/);
  await expect(page.locator(".job-card").nth(1).getByText("No Applicants Yet")).toBeVisible();
});
