const { test, expect } = require("@playwright/test");
const { stubExternalDeps } = require("./helpers");

test("signed-out header shows both public browse links and login", async ({ page }) => {
  await stubExternalDeps(page);

  await page.goto("/");

  await expect(page.locator("#navBrowseLink")).toHaveText("Browse Caregivers");
  await expect(page.locator("#navBrowseOpportunitiesLink")).toHaveText("Browse Opportunities");
  await expect(page.locator("#navLoginLink")).toHaveText("Login");
  await expect(page.locator("#navMessagesLink")).toBeHidden();
});

test("signed-in family role header shows the family navigation and my account menu", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null },
    conversations: [
      { id: "conv-1", family_profile_id: "family-1", caregiver_profile_id: "cg-2", job_post_id: "job-1", status: "active" },
      { id: "conv-2", family_profile_id: "family-1", caregiver_profile_id: "cg-3", job_post_id: null, status: "active" }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: true },
      { id: "cp-2", conversation_id: "conv-2", user_id: "user-1", profile_id: "family-1", is_archived: false, has_unread_visible_messages: true }
    ]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "family");
  });

  await page.goto("/");

  await expect(page.locator("#navBrowseLink")).toHaveText("Browse Caregivers");
  await expect(page.locator("#navSignedInDivider")).toBeVisible();
  await expect(page.locator("#navMyPostingsLink")).toHaveText("My Jobs");
  await expect(page.locator("#navMyPostingsLink")).toHaveAttribute("href", "./my-postings.html");
  await expect(page.locator("#navApplicantsTopLink")).toBeHidden();
  await expect(page.locator("#navMessagesLink .nav-link-label")).toHaveText("Messages");
  await expect(page.locator("#navMessagesCount")).toBeVisible();
  await expect(page.locator("#navMessagesCount")).toHaveText("2");
  await expect(page.locator("#navDashboardLink")).toBeHidden();
  await expect(page.locator("#navAccountMenuButton")).toHaveText("My Account");
  await expect(page.locator("#navSettingsLink")).toHaveText("Account Details");
});

test("signed-in caregiver role header shows browse opportunities, messages, dashboard, and my account", async ({ page }) => {
  await stubExternalDeps(page, {
    sessionUser: { id: "user-1", email: "jenni@example.com" },
    familyProfile: { id: "family-1", current_visible_version_id: "v1", current_pending_version_id: null },
    caregiverProfile: { id: "caregiver-1", current_visible_version_id: "v2", current_pending_version_id: null },
    conversations: [
      { id: "conv-1", family_profile_id: "family-1", caregiver_profile_id: "caregiver-1", job_post_id: "job-1", status: "active" }
    ],
    conversationParticipants: [
      { id: "cp-1", conversation_id: "conv-1", user_id: "user-1", profile_id: "caregiver-1", is_archived: false, has_unread_visible_messages: true }
    ]
  });

  await page.addInitScript(() => {
    window.localStorage.setItem("groveActingRole", "caregiver");
  });

  await page.goto("/");

  await expect(page.locator("#navBrowseLink")).toHaveText("Browse Opportunities");
  await expect(page.locator("#navMyPostingsLink")).toHaveText("My Applications");
  await expect(page.locator("#navMyPostingsLink")).toHaveAttribute("href", "./my-applications.html");
  await expect(page.locator("#navApplicantsTopLink")).toBeHidden();
  await expect(page.locator("#navMessagesLink .nav-link-label")).toHaveText("Messages");
  await expect(page.locator("#navMessagesCount")).toBeVisible();
  await expect(page.locator("#navMessagesCount")).toHaveText("1");
  await expect(page.locator("#navDashboardLink")).toBeHidden();
  await expect(page.locator("#navAccountMenuButton")).toHaveText("My Account");
  await expect(page.locator("#navSettingsLink")).toHaveText("Account Details");
});
