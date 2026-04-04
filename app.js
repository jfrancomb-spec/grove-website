// ======================================================
// GROVE WEBSITE MAIN SCRIPT
// Handles:
// - Supabase connection
// - Shared header/footer loading
// - Navigation highlighting
// - Mobile hamburger menu
// - Public form submissions
// - Prefilling caregiver forms from job links
// - Admin moderation dashboard
// ======================================================

// ======================================================
// Supabase client (global)
// IMPORTANT:
// Use the LEGACY JWT-BASED ANON KEY here, not sb_publishable_...
// Dashboard path:
// Project Settings -> API -> Project API keys -> anon (legacy JWT)
// ======================================================
const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwamRrbnFwcGdsbmFtbmR3d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0NTIyODgsImV4cCI6MjA4ODAyODI4OH0.Q3B9ZkgxSoUshDM4zw5m30qAIVwjn-B57REjhV-Wo68";

window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
console.log("SUPABASE URL:", SUPABASE_URL);
console.log("KEY PREFIX:", SUPABASE_ANON_KEY.slice(0, 20));

// ======================================================
// Header auth state (NEW)
// ======================================================

async function updateHeaderAuth() {
  if (!window.db || !window.db.auth) return;

  const loginLink = document.getElementById("navLoginLink");
  const messagesLink = document.getElementById("navMessagesLink");
  const adminLink = document.getElementById("navAdminLink");
  const accountLink = document.getElementById("navAccountLink");
  const signOutBtn = document.getElementById("navSignOutBtn");

  try {
    const { data } = await window.db.auth.getSession();
    const session = data?.session || null;
    const user = session?.user || null;
    const isSignedIn = !!user;
    let isAdmin = false;
    if (user && typeof window.getAdminRecord === "function") {
      const adminRecord = await window.getAdminRecord(user.id);
      isAdmin = !!adminRecord;
    }
    if (loginLink) {
      loginLink.style.display = isSignedIn ? "none" : "";
    }
    if (messagesLink) {
      messagesLink.style.display = isSignedIn ? "" : "none";
    }
    if (adminLink) {
      adminLink.style.display = isSignedIn && isAdmin ? "" : "none";
    }
    if (accountLink) {
      accountLink.style.display = isSignedIn ? "" : "none";
    }
    if (signOutBtn) {
      signOutBtn.style.display = isSignedIn ? "" : "none";
      signOutBtn.onclick = async () => {
        const { error } = await window.db.auth.signOut();
        if (error) {
          handleError(error, "Sign out failed");
          return;
        }
        window.location.href = "./login.html";
      };
    }
  } catch (err) {
    console.error("Header auth error:", err);
  }
}
window.getCurrentSessionUser = getCurrentSessionUser;
window.getAdminRecord = getAdminRecord;
window.requireAdminUser = requireAdminUser;

// ======================================================
// Error handler
// ======================================================
function handleError(error, message = "Something went wrong") {
  const text = `${message}: ${error?.message || "Unknown error"}`;
  alert(text);
  console.error(text, error);
}

// ======================================================
// Success helper
// ======================================================
function showSuccess(messageId, formElement) {
  const msg = document.getElementById(messageId);
  if (msg) msg.style.display = "block";
  if (formElement) formElement.style.display = "none";
  if (msg) msg.scrollIntoView({ behavior: "smooth" });
}

// ======================================================
// Safe HTML escaping
// ======================================================
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// ======================================================
// Moderation engine helpers
// ======================================================
async function callModerationEngine(action, payload, actorUserId = null) {
  const { data, error } = await window.db.rpc("moderation_engine", {
    p_action: action,
    p_payload: payload,
    p_actor_user_id: actorUserId
  });

  if (error) throw error;
  return data;
}

function getModerationMessage(result) {
  switch (result?.content_status) {
    case "posted":
    case "approved":
      return "Submitted successfully.";
    case "queued":
      return "Submitted successfully. It is queued and not visible yet.";
    case "watched":
      return "Submitted successfully. It is waiting for review.";
    case "flagged":
      return "Submitted successfully. It has been flagged for review.";
    default:
      return "Submitted successfully.";
  }
}

// ======================================================
// Auth / role helpers
// ======================================================
async function getCurrentSessionUser() {
  const { data, error } = await window.db.auth.getSession();

  if (error) {
    throw error;
  }

  return data?.session?.user || null;
}

async function getAdminRecord(userId) {
  if (!userId) return null;
  const { data, error } = await window.db
    .from("admin_users")
    .select("user_id, email, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data || null;
}

async function requireAdminUser() {
  const user = await getCurrentSessionUser();
  if (!user) {
    window.location.href = "./login.html";
    return null;
  }
  const adminRecord = await getAdminRecord(user.id);
  if (!adminRecord) {
    window.location.href = "./account.html";
    return null;
  }
  return user;
}

// ======================================================
// Header / Footer injection
// ======================================================
async function loadPart(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const res = await fetch(file);
  el.innerHTML = await res.text();

  if (id === "header-placeholder") {
    highlightCurrentNav();
    wireMobileMenu();
    updateHeaderAuth();
  }
}

// ======================================================
// Navigation helper
// ======================================================
function getCurrentFileName() {
  const last = window.location.pathname.split("/").pop();
  return last && last.length ? last : "index.html";
}

// ======================================================
// Navigation highlighting
// ======================================================
function highlightCurrentNav() {
  const file = getCurrentFileName();
  document.querySelectorAll(".nav a").forEach((a) => {
    const hrefRaw = a.getAttribute("href") || "";
    const href = hrefRaw.replace("./", "");
    a.classList.toggle("active", href === file);
  });
}

// ======================================================
// Mobile hamburger menu
// ======================================================
function wireMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;
  if (toggle.dataset.wired === "1") return;

  toggle.dataset.wired = "1";

  const setExpanded = (open) => {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  };

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    setExpanded(open);
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      setExpanded(false);
    });
  });

  setExpanded(nav.classList.contains("open"));
}

// ======================================================
// Prefill caregiver form from job query params
// ======================================================
function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const applyJob = params.get("apply_job");
  const careType = (params.get("care_type") || "").trim();
  const location = (params.get("location") || "").trim();

  const exp = document.getElementById("cg_experience");
  if (!exp) return;

  const loc = document.getElementById("cg_location");
  if (loc && location) loc.value = location;

  const sel = document.getElementById("cg_care_type");
  if (sel && careType) {
    const match = Array.from(sel.options).find((o) => {
      const val = (o.value || o.textContent || "").trim().toLowerCase();
      return val === careType.toLowerCase();
    });
    if (match) sel.value = match.value || match.textContent;
  }

  if (applyJob) {
    exp.value =
      `Applying for job: ${applyJob}\n` +
      (location ? `Location: ${location}\n` : "") +
      (careType ? `Care type: ${careType}\n` : "") +
      `\n` +
      (exp.value || "");
  }
}

// ======================================================
// Find Care form
// ======================================================
function wireFindCareForm() {
  const careForm = document.getElementById("careForm");
  if (!careForm) return;

  careForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: document.getElementById("name")?.value || "",
        email: document.getElementById("email")?.value || "",
        care_type: document.getElementById("care_type")?.value || "",
        location: document.getElementById("location")?.value || "",
        schedule: document.getElementById("schedule")?.value || "Not specified",
        details: document.getElementById("details")?.value || "",
        content_status: "draft"
      };

      const { data: inserted, error: insertError } = await window.db
        .from("care_requests")
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      const modResult = await callModerationEngine("submit_content", {
        related_table: "care_requests",
        related_id: inserted.id,
        user_id: null,
        is_suspicious: false,
        reason: null,
        summary: "Care request submitted",
        success_status: "posted"
      });

      const successEl = document.getElementById("careSuccess");
      if (successEl) {
        successEl.textContent = getModerationMessage(modResult);
      }

      showSuccess("careSuccess", careForm);
    } catch (error) {
      handleError(error, "Request failed");
    }
  });
}

// ======================================================
// Phone formatting helper
// ======================================================
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function wirePhoneFormatting() {
  const phoneInput = document.getElementById("cg_phone");
  if (!phoneInput) return;

  phoneInput.addEventListener("input", (e) => {
    e.target.value = formatPhoneNumber(e.target.value);
  });
}

// ======================================================
// Caregiver form
// ======================================================
function wireCaregiverForm() {
  const caregiverForm = document.getElementById("caregiverForm");
  if (!caregiverForm) return;

  caregiverForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const payload = {
        name: document.getElementById("cg_name")?.value || "",
        phone: document.getElementById("cg_phone")?.value || "",
        email: document.getElementById("cg_email")?.value || "",
        location: document.getElementById("cg_location")?.value || "",
        care_type: document.getElementById("cg_care_type")?.value || "",
        experience: document.getElementById("cg_experience")?.value || "",
        content_status: "draft"
      };

      const { data: inserted, error: insertError } = await window.db
        .from("caregiver_applications")
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      const modResult = await callModerationEngine("submit_content", {
        related_table: "caregiver_applications",
        related_id: inserted.id,
        user_id: null,
        is_suspicious: false,
        reason: null,
        summary: "Caregiver application submitted",
        success_status: "posted"
      });

      const successEl = document.getElementById("caregiverSuccess");
      if (successEl) {
        successEl.textContent = getModerationMessage(modResult);
      }

      showSuccess("caregiverSuccess", caregiverForm);
    } catch (error) {
      handleError(error, "Application failed");
    }
  });
}

// ======================================================
// Messaging helpers
// ======================================================
async function openOrStartMessageThread({
  targetUserId,
  caregiverProfileId = null,
  familyProfileId = null
}) {
  if (!targetUserId) return;

  const params = new URLSearchParams();
  params.set("targetUser", targetUserId);

  if (caregiverProfileId) {
    params.set("caregiverProfileId", caregiverProfileId);
  }

  if (familyProfileId) {
    params.set("familyProfileId", familyProfileId);
  }

  window.location.href = `./messages.html?${params.toString()}`;
}

async function openGroveConversation({
  targetUserId,
  familyProfileId = null,
  caregiverProfileId = null
}) {
  if (!targetUserId) return;

  const params = new URLSearchParams();
  params.set("targetUser", targetUserId);

  if (familyProfileId) {
    params.set("familyProfileId", familyProfileId);
  }

  if (caregiverProfileId) {
    params.set("caregiverProfileId", caregiverProfileId);
  }

  window.location.href = `./messages.html?${params.toString()}`;
}

window.openGroveConversation = openGroveConversation;

// ======================================================
// Admin queue rendering
// ======================================================
function renderQueueCard(item) {
  return `
    <div class="admin-card">
      <div class="admin-card-top">
        <div>
          <h3>${escapeHtml(item.summary || "Queue item")}</h3>
          <div class="admin-meta">
            ${escapeHtml(item.queue_type || "")}
            ${item.review_type ? ` • ${escapeHtml(item.review_type)}` : ""}
          </div>
          <div class="admin-meta">Status: ${escapeHtml(item.status || "")}</div>
          ${item.related_table ? `<div class="admin-meta">Table: ${escapeHtml(item.related_table)}</div>` : ""}
          ${item.created_at ? `<div class="admin-meta">Created: ${new Date(item.created_at).toLocaleString()}</div>` : ""}
        </div>

        <div class="admin-actions">
          <button class="button-admin button-approve" onclick="resolveQueueItem('${item.id}', 'approve_item')">Approve</button>
          <button class="button-admin button-deny" onclick="resolveQueueItem('${item.id}', 'reject_only')">Reject</button>
          <button class="button-admin" onclick="resolveQueueItem('${item.id}', 'reject_and_watch')">Reject + Watch</button>
          <button class="button-admin button-delete" onclick="resolveQueueItem('${item.id}', 'reject_and_ban')">Reject + Ban</button>
        </div>
      </div>
    </div>
  `;
}

function renderResolvedQueueCard(item) {
  return `
    <div class="admin-card">
      <div class="admin-card-top">
        <div>
          <h3>${escapeHtml(item.summary || "Queue item")}</h3>
          <div class="admin-meta">${escapeHtml(item.queue_type || "")}</div>
          <div class="admin-meta">Resolved: ${escapeHtml(item.resolution_action || "")}</div>
          ${item.resolved_at ? `<div class="admin-meta">Resolved: ${new Date(item.resolved_at).toLocaleString()}</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

// ======================================================
// Admin page load
// ======================================================
async function loadAdminDashboard() {
  const pendingList = document.getElementById("pending-list");
  const approvedList = document.getElementById("approved-list");
  const deniedList = document.getElementById("denied-list");

  if (!pendingList || !approvedList || !deniedList) return;

  pendingList.innerHTML = `<div class="admin-empty">Loading...</div>`;
  approvedList.innerHTML = `<div class="admin-empty">Loading...</div>`;
  deniedList.innerHTML = `<div class="admin-empty">Loading...</div>`;

  try {
    const { data, error } = await window.db
      .from("admin_review_queue")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const queueItems = data || [];

    const openItems = queueItems.filter(
      (item) => item.status === "open" || item.status === "in_review"
    );

    const resolvedApproved = queueItems.filter(
      (item) => item.status === "resolved" && item.resolution_action === "approve_item"
    );

    const resolvedRejected = queueItems.filter(
      (item) =>
        item.status === "resolved" &&
        ["reject_only", "reject_and_watch", "reject_and_ban"].includes(item.resolution_action)
    );

    pendingList.innerHTML = openItems.length
      ? openItems.map(renderQueueCard).join("")
      : `<div class="admin-empty">No queue items.</div>`;

    approvedList.innerHTML = resolvedApproved.length
      ? resolvedApproved.map(renderResolvedQueueCard).join("")
      : `<div class="admin-empty">No approved items.</div>`;

    deniedList.innerHTML = resolvedRejected.length
      ? resolvedRejected.map(renderResolvedQueueCard).join("")
      : `<div class="admin-empty">No rejected items.</div>`;
  } catch (error) {
    console.error("Admin dashboard load error:", error);
    pendingList.innerHTML = `<div class="admin-empty">Error: ${escapeHtml(error.message || "Unknown error")}</div>`;
    approvedList.innerHTML = `<div class="admin-empty">Error loading queue.</div>`;
    deniedList.innerHTML = `<div class="admin-empty">Error loading queue.</div>`;
  }
}

// ======================================================
// Admin actions
// ======================================================
async function resolveQueueItem(queueId, resolutionAction, options = {}) {
  try {
    const adminUserId = window.currentUser?.id || null;

    const payload = {
      queue_id: queueId,
      resolution_action: resolutionAction,
      reason: options.reason || null,
      rejection_reason: options.rejectionReason || null,
      auto_approve_remaining: options.autoApproveRemaining || false,
      approve_current_item: options.approveCurrentItem || false
    };

    const { error } = await window.db.rpc("moderation_engine", {
      p_action: "resolve_queue_item",
      p_payload: payload,
      p_actor_user_id: adminUserId
    });

    if (error) throw error;

    await loadAdminDashboard();
  } catch (error) {
    handleError(error, "Could not resolve queue item");
  }
}
window.getCurrentSessionUser = getCurrentSessionUser;
window.getAdminRecord = getAdminRecord;
window.requireAdminUser = requireAdminUser;
window.resolveQueueItem = resolveQueueItem;

// ======================================================
// Legacy delete helper (kept for generic use if needed)
// ======================================================
async function deleteProfile(tableName, profileId) {
  const confirmed = confirm("Are you sure you want to permanently delete this profile?");
  if (!confirmed) return;

  const { error } = await window.db
    .from(tableName)
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("Error deleting profile:", error);
    alert(error.message || "Could not delete profile.");
    return;
  }

  loadAdminDashboard();
}

// ======================================================
// Page initialization
// ======================================================
window.addEventListener("DOMContentLoaded", () => {
  loadPart("header-placeholder", "./header.html");
  loadPart("footer-placeholder", "./footer.html");

  highlightCurrentNav();
  wireMobileMenu();

  prefillFromQuery();
  wireFindCareForm();
  wireCaregiverForm();
  wirePhoneFormatting();
  loadAdminDashboard();
});
