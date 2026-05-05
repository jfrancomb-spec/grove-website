const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("dashboard page renders family role copy and next-step guidance", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null },
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
        location: "Austin"
      },
      {
        id: "job-v2",
        is_live: true,
        content_status: "published",
        title: "Weekend pet care",
        care_type: "pet care",
        location: "Jordan"
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

  await page.goto("/account.html");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What to do next" })).toHaveCount(0);
  await expect(page.getByText("Viewing as")).toBeVisible();
  await expect(page.getByText("Family", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch to Caregiver" })).toBeVisible();
  await expect(page.locator("#statusGrid")).toBeHidden();
  await expect(page.getByRole("heading", { name: "Your Job Posts" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Live" })).toHaveCount(0);
  await expect(page.getByText("New application")).toBeVisible();
  await expect(page.locator(".job-card").first().getByRole("heading", { name: "After-school childcare" })).toBeVisible();
  await expect(page.locator(".job-card").first().getByRole("link", { name: "View Applications" })).toBeVisible();
  await expect(page.locator(".job-card").first().getByRole("link", { name: "View Applications" })).toHaveAttribute("href", "./applicants.html?job_id=job-1");
  await expect(page.locator(".job-card").nth(1).getByText("No Applicants Yet")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quick Links" })).toBeVisible();
});

test("caregiver dashboard shows applied jobs, full-width messages, and streamlined quick links", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null },
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
      { id: "job-1", title: "After-school nanny", care_type: "Childcare", location: "Belle Plaine", schedule: "Weekdays", description: "Help with school pickup and afternoon play.", pay_range: "$18-$22/hr", user_id: "family-user-1" }
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

  await page.goto("/account.html");

  await expect(page.getByRole("heading", { name: "Jobs I Applied To" })).toBeVisible();
  await expect(page.locator("#caregiverTopGrid").getByRole("heading", { name: "Messages" })).toHaveCount(0);
  await expect(page.locator("#caregiverTopGrid")).toHaveClass(/single-column/);
  await expect(page.getByRole("heading", { name: "Job Favorites" })).toHaveCount(0);
  await expect(page.locator("#appliedJobsList").getByText("After-school nanny")).toBeVisible();
  await expect(page.locator("#appliedJobsList").getByText("Casey H.")).toBeVisible();
  await expect(page.getByText("Childcare • Belle Plaine")).toBeVisible();
  await expect(page.locator("#appliedJobsList").getByText("Applied: Apr 20, 2026")).toBeVisible();
  await expect(page.locator("#appliedJobsList").getByText("Schedule: Weekdays")).toBeVisible();
  await expect(page.locator("#appliedJobsList").getByText("Pay: $18-$22/hr")).toBeVisible();
  await expect(page.locator("#appliedJobsList").getByText("Details: Help with school pickup and afternoon play.")).toBeVisible();
  await expect(page.locator("#appliedJobsList .application-card-avatar")).toHaveAttribute("src", "https://example.com/family-photo.jpg");
  await expect(page.getByText(/A message thread exists/i)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View Family" }).first()).toHaveAttribute("href", "./family-profile.html?id=family-1&returnTo=account");
  await expect(page.getByRole("link", { name: "View Messages" }).first()).toBeVisible();
  await expect(page.locator("#statusGrid")).toHaveClass(/single-column/);
  await expect(page.locator("#messageStatusCard")).toBeVisible();
  await expect(page.locator("#familyProfileCard")).toBeHidden();
  await expect(page.getByRole("heading", { name: "What to do next" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Caregiver Profile" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Preview/Edit profile" })).toBeVisible();
  await expect(page.locator("#familyQuickLink")).toBeHidden();
  await expect(page.locator("#caregiverTopGrid").getByRole("link", { name: "Browse Jobs" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browse jobs" })).toHaveCount(0);
  await expect(page.locator("#familiesQuickLink")).toBeVisible();
  await expect(page.getByText("Your Grove home base")).toHaveCount(0);
});

test("browse opportunities navigation keeps the current caregiver viewing role", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfileVersions: [{
      id: "fam-v1",
      is_live: true,
      content_status: "published",
      first_name: "Casey",
      last_name: "Home"
    }],
    jobPosts: [{
      id: "job-1",
      user_id: "family-user-1",
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
      location: "Austin"
    }]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "caregiver");
  });

  await page.goto("/account.html");
  await page.locator("#familiesQuickLink").click();

  await expect(page).toHaveURL(/jobs\.html$/);
  await expect(page.getByText("Viewing as")).toBeVisible();
  await expect(page.getByText("Caregiver", { exact: true })).toBeVisible();
  await expect(page.evaluate(() => window.localStorage.getItem("groveActingRole"))).resolves.toBe("caregiver");
});
