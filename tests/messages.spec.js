const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("messages page uses the shared viewing-as row and switch button", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null }
  });

  await page.goto("/messages.html?profileType=family&profileId=family-1");

  await expect(page.locator("#globalActingRoleNotice")).toBeVisible();
  await expect(page.locator("#globalActingRoleValue")).toHaveText("Family");
  await expect(page.getByRole("button", { name: "Switch to Caregiver" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to Account" })).toHaveCount(0);
});

test("messages page only shows view job for job-linked conversations", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", first_name: "Jenni", last_name: "Francomb", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", first_name: "Casey", last_name: "Home", name_display: "Casey H.", photo_url: "" }
    ],
    jobPosts: [
      { id: "job-1", title: "After-school nanny" }
    ],
    conversations: [
      {
        id: "conv-job",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-04-28T12:00:00.000Z",
        last_visible_message_preview: "Checking in"
      },
      {
        id: "conv-general",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: null,
        status: "active",
        last_visible_message_at: "2026-04-28T13:00:00.000Z",
        last_visible_message_preview: "General question"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-job", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-job", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-3", conversation_id: "conv-general", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-4", conversation_id: "conv-general", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-job", sender_user_id: "family-user-1", message_text: "Checking in", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" },
      { id: "m-2", conversation_id: "conv-general", sender_user_id: "family-user-1", message_text: "General question", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T13:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=caregiver&profileId=caregiver-1&conversation=conv-job");
  await expect(page.getByRole("link", { name: "View Job" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Job" })).toHaveAttribute("href", "./job-details.html?job_id=job-1&returnTo=messages&profileType=caregiver&profileId=caregiver-1&conversation=conv-job");
  await expect(page.getByRole("link", { name: "View Family" })).toHaveAttribute("href", "./family-profile.html?id=family-1");

  await page.goto("/messages.html?profileType=caregiver&profileId=caregiver-1&conversation=conv-general");
  await expect(page.getByRole("link", { name: /View Job/i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View Family" })).toHaveAttribute("href", "./family-profile.html?id=family-1");
});

test("messages page shows view caregiver for family-side job conversations", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "family-user-1", email: "family@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null },
    caregiverProfiles: [
      { id: "caregiver-1", user_id: "caregiver-user-1", current_visible_version_id: "cg-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", name_display: "Casey H.", photo_url: "" }
    ],
    jobPosts: [
      { id: "job-1", title: "After-school nanny" }
    ],
    conversations: [
      {
        id: "conv-job",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-04-28T12:00:00.000Z",
        last_visible_message_preview: "Checking in"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-job", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-job", user_id: "caregiver-user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-job", sender_user_id: "caregiver-user-1", message_text: "Checking in", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=family&profileId=family-1&conversation=conv-job");

  await expect(page.getByRole("link", { name: "View Job" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Caregiver" })).toHaveAttribute("href", "./caregiver-profile.html?id=caregiver-1");
});

test("messages page shows view caregiver without view job for family-side non-job conversations", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "family-user-1", email: "family@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null },
    caregiverProfiles: [
      { id: "caregiver-1", user_id: "caregiver-user-1", current_visible_version_id: "cg-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", name_display: "Casey H.", photo_url: "" }
    ],
    conversations: [
      {
        id: "conv-general",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: null,
        status: "active",
        last_visible_message_at: "2026-04-28T12:00:00.000Z",
        last_visible_message_preview: "General question"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-general", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-general", user_id: "caregiver-user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-general", sender_user_id: "caregiver-user-1", message_text: "General question", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=family&profileId=family-1&conversation=conv-general");

  await expect(page.getByRole("link", { name: "View Caregiver" })).toHaveAttribute("href", "./caregiver-profile.html?id=caregiver-1");
  await expect(page.getByRole("link", { name: "View Job" })).toHaveCount(0);
});

test("messages inbox shows job title instead of latest message text for job-linked conversations", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", name_display: "Casey H.", photo_url: "" }
    ],
    jobPosts: [
      { id: "job-1", title: "After-school nanny" }
    ],
    conversations: [
      {
        id: "conv-job",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-04-28T12:00:00.000Z",
        last_visible_message_preview: "Checking in"
      },
      {
        id: "conv-general",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: null,
        status: "active",
        last_visible_message_at: "2026-04-28T13:00:00.000Z",
        last_visible_message_preview: "General question"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-job", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-job", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-3", conversation_id: "conv-general", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-4", conversation_id: "conv-general", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-job", sender_user_id: "family-user-1", message_text: "Checking in", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" },
      { id: "m-2", conversation_id: "conv-general", sender_user_id: "family-user-1", message_text: "General question", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T13:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=caregiver&profileId=caregiver-1");

  await expect(page.locator(".conversation-item").filter({ hasText: "After-school nanny" })).toBeVisible();
  await expect(page.locator(".conversation-item").filter({ hasText: "Checking in" })).toHaveCount(0);
  await expect(page.locator(".conversation-item").filter({ hasText: "General question" })).toBeVisible();
});

test("messages page still loads legacy conversations when participant profile ids are missing", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", first_name: "Jenni", last_name: "Francomb", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", first_name: "Casey", last_name: "Home", name_display: "Casey H.", photo_url: "" }
    ],
    conversations: [
      {
        id: "conv-legacy",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: null,
        status: "active",
        last_visible_message_at: "2026-04-28T12:00:00.000Z",
        last_visible_message_preview: "Legacy conversation"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-legacy", user_id: "user-1", profile_id: null, is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-legacy", user_id: "family-user-1", profile_id: null, is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-legacy", sender_user_id: "family-user-1", message_text: "Legacy conversation", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=caregiver&profileId=caregiver-1");

  await expect(page.getByRole("button", { name: /Casey H\./i })).toBeVisible();
  await expect(page.getByText("Legacy conversation")).toBeVisible();
});

test("messages page clearly labels your messages versus the other person's", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "cg-v1", current_pending_version_id: null },
    familyProfiles: [
      { id: "family-1", user_id: "family-user-1", current_visible_version_id: "fam-v1", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" }
    ],
    familyProfileVersions: [
      { id: "fam-v1", name_display: "Casey H.", photo_url: "" }
    ],
    conversations: [
      {
        id: "conv-1",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: null,
        status: "active",
        last_visible_message_at: "2026-04-28T13:00:00.000Z",
        last_visible_message_preview: "Sounds good"
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-1", user_id: "family-user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-1", sender_user_id: "user-1", message_text: "Hi there", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T12:00:00.000Z" },
      { id: "m-2", conversation_id: "conv-1", sender_user_id: "family-user-1", message_text: "Sounds good", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-04-28T13:00:00.000Z" }
    ]
  });

  await page.goto("/messages.html?profileType=caregiver&profileId=caregiver-1&conversation=conv-1");

  await expect(page.locator(".message-bubble.sent .message-sender")).toHaveText("You");
  await expect(page.locator(".message-bubble.received .message-sender")).toHaveText("Casey H.");
});
