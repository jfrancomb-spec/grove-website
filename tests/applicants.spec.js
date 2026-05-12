const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("family dashboard job cards include an applicants button", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null },
    jobPosts: [{
      id: "job-1",
      user_id: "user-1",
      current_visible_version_id: "job-v1",
      is_active: true,
      content_status: "published",
      created_at: "2026-04-01T12:00:00Z",
      updated_at: "2026-04-20T12:00:00Z"
    }],
    jobPostVersions: [{
      id: "job-v1",
      is_live: true,
      content_status: "published",
      title: "After-school childcare",
      care_type: "childcare",
      location: "Austin"
    }],
    conversations: [{
      id: "conv-1",
      family_profile_id: "family-1",
      caregiver_profile_id: "caregiver-2",
      job_post_id: "job-1",
      status: "active",
      last_visible_message_at: "2026-04-22T12:00:00Z",
      last_visible_message_preview: "I would love to help."
    }],
    conversationParticipants: [
      {
        id: "cp-1",
        conversation_id: "conv-1",
        user_id: "user-1",
        profile_id: "family-1",
        is_archived: false,
        has_unread_visible_messages: true,
        last_read_at: "2026-04-21T12:00:00Z"
      },
      {
        id: "cp-2",
        conversation_id: "conv-1",
        user_id: "caregiver-user-2",
        profile_id: "caregiver-2",
        is_archived: false,
        has_unread_visible_messages: false,
        last_read_at: "2026-04-22T12:00:00Z"
      }
    ],
    messages: [{
      id: "m-1",
      conversation_id: "conv-1",
      sender_user_id: "caregiver-user-2",
      message_text: "I would love to help.",
      visible_to_sender: true,
      visible_to_recipient: true,
      created_at: "2026-04-22T12:00:00Z"
    }]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "family");
  });

  await page.goto("/account.html");

  await expect(page.getByRole("link", { name: "View Applications" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Applications" })).toHaveAttribute("href", "./messages.html?profileType=family&profileId=family-1&jobFilter=job-1");
});

test("applicants page only shows conversations for the selected job", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-own-1", current_visible_version_id: "own-cg-v1", current_pending_version_id: null },
    caregiverProfiles: [
      { id: "caregiver-1", user_id: "caregiver-user-1", current_visible_version_id: "cg-v1", is_active: true },
      { id: "caregiver-2", user_id: "caregiver-user-2", current_visible_version_id: "cg-v2", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" },
      { id: "cg-v2", name_display: "Maya R.", photo_url: "" },
      { id: "own-cg-v1", name_display: "Jenni F.", photo_url: "" }
    ],
    jobPosts: [
      { id: "job-1", user_id: "user-1", title: "After-school childcare", current_visible_version_id: "job-v1" },
      { id: "job-2", user_id: "user-1", title: "Weekend pet care", current_visible_version_id: "job-v2" }
    ],
    jobPostVersions: [
      { id: "job-v1", title: "After-school childcare" },
      { id: "job-v2", title: "Weekend pet care" }
    ],
    conversations: [
      {
        id: "conv-1",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-05-01T10:00:00.000Z",
        last_visible_message_preview: "I would love to help."
      },
      {
        id: "conv-2",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-2",
        job_post_id: "job-2",
        status: "active",
        last_visible_message_at: "2026-05-01T11:00:00.000Z",
        last_visible_message_preview: "I am available this weekend."
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-1", user_id: "caregiver-user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: true },
      { id: "cp-3", conversation_id: "conv-2", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-4", conversation_id: "conv-2", user_id: "caregiver-user-2", profile_id: "caregiver-2", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-1", sender_user_id: "caregiver-user-1", message_text: "I would love to help.", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-05-01T10:00:00.000Z" },
      { id: "m-2", conversation_id: "conv-2", sender_user_id: "caregiver-user-2", message_text: "I am available this weekend.", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-05-01T11:00:00.000Z" }
    ]
  });

  await page.goto("/applicants.html?job_id=job-1");

  await expect(page.getByRole("heading", { name: "Applicants" })).toBeVisible();
  await expect(page.locator("#applicantsSubtitle")).toHaveText("Conversations for After-school childcare.");
  await expect(page.getByRole("button", { name: /Jenni F\./i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Maya R\./i })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View Job" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Caregiver" })).toBeVisible();
  await expect(page.locator("#messageThread")).toContainText("I would love to help.");
});

test("applicants landing page shows applicants across family job posts", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "fam-v1", current_pending_version_id: null },
    caregiverProfiles: [
      { id: "caregiver-1", user_id: "caregiver-user-1", current_visible_version_id: "cg-v1", is_active: true },
      { id: "caregiver-2", user_id: "caregiver-user-2", current_visible_version_id: "cg-v2", is_active: true }
    ],
    caregiverProfileVersions: [
      { id: "cg-v1", name_display: "Jenni F.", photo_url: "" },
      { id: "cg-v2", name_display: "Maya R.", photo_url: "" }
    ],
    jobPosts: [
      { id: "job-1", user_id: "user-1", title: "After-school childcare", current_visible_version_id: "job-v1" },
      { id: "job-2", user_id: "user-1", title: "Weekend pet care", current_visible_version_id: "job-v2" }
    ],
    jobPostVersions: [
      { id: "job-v1", title: "After-school childcare" },
      { id: "job-v2", title: "Weekend pet care" }
    ],
    conversations: [
      {
        id: "conv-1",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-1",
        job_post_id: "job-1",
        status: "active",
        last_visible_message_at: "2026-05-01T10:00:00.000Z",
        last_visible_message_preview: "I would love to help."
      },
      {
        id: "conv-2",
        family_profile_id: "family-1",
        caregiver_profile_id: "caregiver-2",
        job_post_id: "job-2",
        status: "active",
        last_visible_message_at: "2026-05-01T11:00:00.000Z",
        last_visible_message_preview: "I am available this weekend."
      }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: false },
      { id: "cp-2", conversation_id: "conv-1", user_id: "caregiver-user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: true },
      { id: "cp-3", conversation_id: "conv-2", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: true },
      { id: "cp-4", conversation_id: "conv-2", user_id: "caregiver-user-2", profile_id: "caregiver-2", is_archived: false, has_unread_visible_messages: false }
    ],
    messages: [
      { id: "m-1", conversation_id: "conv-1", sender_user_id: "caregiver-user-1", message_text: "I would love to help.", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-05-01T10:00:00.000Z" },
      { id: "m-2", conversation_id: "conv-2", sender_user_id: "caregiver-user-2", message_text: "I am available this weekend.", visible_to_sender: true, visible_to_recipient: true, created_at: "2026-05-01T11:00:00.000Z" }
    ]
  });

  await page.goto("/applicants.html");

  await expect(page.locator("#applicantsSubtitle")).toHaveText("Review caregivers who have applied to your job posts.");
  await expect(page.getByRole("button", { name: /Jenni F\./i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Maya R\./i })).toBeVisible();
  await expect(page.locator("#conversationList")).toContainText("After-school childcare");
  await expect(page.locator("#conversationList")).toContainText("Weekend pet care");
  await expect(page.getByRole("link", { name: "View Job" })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Caregiver" })).toBeVisible();
});
