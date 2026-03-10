// ======================================================
// GROVE WEBSITE MAIN SCRIPT
// Handles:
// - Supabase connection
// - Shared header/footer loading
// - Navigation highlighting
// - Mobile hamburger menu
// - Form submissions
// - Prefilling caregiver forms from job links
// ======================================================

// ======================================================
// Supabase client (global)
// Creates a connection used for all database actions
// ======================================================
const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JwsPcXgi_T-NQZo1tGZY_w_kcRc9kWc";

window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ======================================================
// Error handler
// Displays user-friendly errors and logs details
// ======================================================
function handleError(error, message = "Something went wrong") {
  const text = `${message}: ${error?.message || "Unknown error"}`;
  alert(text);
  console.error(text, error);
}

// ======================================================
// Success helper
// Displays success messages consistently
// ======================================================
function showSuccess(messageId, formElement) {
  const msg = document.getElementById(messageId);
  if (msg) msg.style.display = "block";
  if (formElement) formElement.style.display = "none";
  if (msg) msg.scrollIntoView({ behavior: "smooth" });
}

// ======================================================
// Header / Footer injection
// Loads shared header.html and footer.html into pages
// ======================================================
async function loadPart(id, file) {
  const el = document.getElementById(id);
  if (!el) return;
  const res = await fetch(file);
  el.innerHTML = await res.text();
  // After header loads we can enable menu/nav features
  if (id === "header-placeholder") {
    highlightCurrentNav();
    wireMobileMenu();
  }
}

// ======================================================
// Navigation helper
// Determines which page we are on
// ======================================================
function getCurrentFileName() {
  const last = window.location.pathname.split("/").pop();
  return last && last.length ? last : "index.html";
}

// ======================================================
// Navigation highlighting
// Adds an "active" class to the current page link
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
// Controls opening/closing navigation on small screens
// ======================================================
function wireMobileMenu() {
  const toggle=document.getElementById("menuToggle");
  const nav=document.getElementById("mainNav");
  if(!toggle||!nav) return;
  if(toggle.dataset.wired==="1") return;
  toggle.dataset.wired="1";

  const setExpanded=(open)=>toggle.setAttribute("aria-expanded",open?"true":"false");

  toggle.addEventListener("click",()=>{
    const open=nav.classList.toggle("open");
    setExpanded(open);
  });

  nav.querySelectorAll("a").forEach(a=>{
    a.addEventListener("click",()=>{
      nav.classList.remove("open");
      setExpanded(false);
    });
  });

  setExpanded(nav.classList.contains("open"));
}

// ======================================================
// Prefill caregiver form when applying from a job post
// Reads parameters from the URL and fills fields
// ======================================================
function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const applyJob = params.get("apply_job");
  const careType = (params.get("care_type") || "").trim();
  const location = (params.get("location") || "").trim();
  const exp = document.getElementById("cg_experience");
  // If not on caregiver page, stop
  if (!exp) return;

  // Prefill location
  const loc = document.getElementById("cg_location");
  if (loc && location) loc.value = location;

  // Prefill care type
  const sel = document.getElementById("cg_care_type");
  if (sel && careType) {
    const match = Array.from(sel.options).find((o) => {
      const val = (o.value || o.textContent || "").trim().toLowerCase();
      return val === careType.toLowerCase();
    });
    if (match) sel.value = match.value || match.textContent;
  }

  // Prefill experience field
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
// Submits family care requests to Supabase
// ======================================================
function wireFindCareForm() {
  const careForm = document.getElementById("careForm");
  if (!careForm) return;
  careForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("name")?.value || "",
      email: document.getElementById("email")?.value || "",
      care_type: document.getElementById("care_type")?.value || "",
      location: document.getElementById("location")?.value || "",
      schedule: document.getElementById("schedule")?.value || "Not specified",
      details: document.getElementById("details")?.value || ""
    };
    const { error } =
      await window.db.from("care_requests").insert([payload]);
    if (error) {
      handleError(error, "Request failed");
      return;
    }
    showSuccess("careSuccess", careForm);
  });
}
function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

const phoneInput = document.getElementById("cg_phone");
phoneInput?.addEventListener("input", (e) => {
  e.target.value = formatPhoneNumber(e.target.value);
});
// ======================================================
// Caregiver form
// Submits caregiver applications to Supabase
// ======================================================
function wireCaregiverForm() {
  const caregiverForm = document.getElementById("caregiverForm");
  if (!caregiverForm) return;
  caregiverForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("cg_name")?.value || "",
      phone: document.getElementById("cg_phone")?.value || "",
      email: document.getElementById("cg_email")?.value || "",
      location: document.getElementById("cg_location")?.value || "",
      care_type: document.getElementById("cg_care_type")?.value || "",
      experience: document.getElementById("cg_experience")?.value || ""
    };

    const { error } =
      await window.db.from("caregiver_applications").insert([payload]);
    if (error) {
      handleError(error, "Application failed");
      return;
    }
    showSuccess("caregiverSuccess", caregiverForm);
  });
}

// ======================================================
// Page initialization
// Runs when the page loads
// ======================================================
window.addEventListener("DOMContentLoaded", () => {

  // Load shared header and footer
  loadPart("header-placeholder", "./header.html");
  loadPart("footer-placeholder", "./footer.html");

  // Prefill caregiver form if arriving from job link
  prefillFromQuery();

  // Enable forms if they exist on the page
  wireFindCareForm();
  wireCaregiverForm();
});

async function loadAdminDashboard() {
  const pendingList = document.getElementById("pending-list");
  const approvedList = document.getElementById("approved-list");
  const deniedList = document.getElementById("denied-list");

  if (!pendingList || !approvedList || !deniedList) return;

  pendingList.innerHTML = `<div class="admin-empty">Loading...</div>`;
  approvedList.innerHTML = `<div class="admin-empty">Loading...</div>`;
  deniedList.innerHTML = `<div class="admin-empty">Loading...</div>`;

  const [
    { data: caregiverData, error: caregiverError },
    { data: familyData, error: familyError }
  ] = await Promise.all([
    supabase
      .from("caregiver_profiles")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("family_profiles")
      .select("*")
      .order("created_at", { ascending: false })
  ]);

  if (caregiverError || familyError) {
    console.error("Error loading admin dashboard:", caregiverError || familyError);
    pendingList.innerHTML = `<div class="admin-empty">Error loading profiles.</div>`;
    approvedList.innerHTML = `<div class="admin-empty">Error loading profiles.</div>`;
    deniedList.innerHTML = `<div class="admin-empty">Error loading profiles.</div>`;
    return;
  }

  const caregivers = (caregiverData || []).map(profile => ({
    ...profile,
    profile_type: "caregiver",
    table_name: "caregiver_profiles"
  }));

  const families = (familyData || []).map(profile => ({
    ...profile,
    profile_type: "family",
    table_name: "family_profiles"
  }));

  const allProfiles = [...caregivers, ...families].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const pending = allProfiles.filter(profile => profile.approval_status === "pending");
  const approved = allProfiles.filter(profile => profile.approval_status === "approved");
  const denied = allProfiles.filter(profile => profile.approval_status === "denied");

  renderAdminSection(pendingList, pending, "pending");
  renderAdminSection(approvedList, approved, "approved");
  renderAdminSection(deniedList, denied, "denied");
}

function renderAdminSection(container, profiles, sectionType) {
  if (!profiles.length) {
    container.innerHTML = `<div class="admin-empty">No profiles in this section.</div>`;
    return;
  }

  container.innerHTML = profiles.map(profile => {
    const roleLabel = profile.profile_type === "family" ? "Family" : "Caregiver";

    const details =
      profile.profile_type === "caregiver"
        ? [
            profile.location,
            Array.isArray(profile.care_types) ? profile.care_types.join(", ") : "",
            profile.years_experience ? `${profile.years_experience} experience` : ""
          ].filter(Boolean).join(" • ")
        : [
            profile.location,
            Array.isArray(profile.care_types_needed) ? profile.care_types_needed.join(", ") : ""
          ].filter(Boolean).join(" • ");

    const badges = getAdminBadges(profile);

    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div>
            <h3>${escapeHtml(profile.name_display || "Unnamed Profile")}</h3>
            <div class="admin-meta">${roleLabel}</div>
            ${details ? `<div class="admin-meta">${escapeHtml(details)}</div>` : ""}
            ${profile.bio ? `<div>${escapeHtml(profile.bio)}</div>` : ""}
            ${
              badges.length
                ? `<div class="admin-badges">
                    ${badges.map(badge => `<span class="admin-badge">${escapeHtml(badge)}</span>`).join("")}
                  </div>`
                : ""
            }
          </div>

          <div class="admin-actions">
            ${
              sectionType !== "approved"
                ? `<button class="button-admin button-approve" onclick="updateApprovalStatus('${profile.table_name}', '${profile.id}', 'approved')">Approve</button>`
                : ""
            }
            ${
              sectionType !== "denied"
                ? `<button class="button-admin button-deny" onclick="updateApprovalStatus('${profile.table_name}', '${profile.id}', 'denied')">Deny</button>`
                : ""
            }
            ${
              sectionType !== "pending"
                ? `<button class="button-admin" onclick="updateApprovalStatus('${profile.table_name}', '${profile.id}', 'pending')">Move to Pending</button>`
                : ""
            }
            <button class="button-admin button-delete" onclick="deleteProfile('${profile.table_name}', '${profile.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function getAdminBadges(profile) {
  const badges = [];

  if (profile.profile_type === "caregiver") {
    if (profile.cpr_certified) badges.push("CPR");
    if (profile.non_smoker) badges.push("Non-smoker");
    if (profile.non_vaper) badges.push("Non-vaper");
    if (profile.has_drivers_license) badges.push("Driver’s License");
    if (profile.comfortable_with_cats) badges.push("Comfortable with Cats");
    if (profile.comfortable_with_dogs) badges.push("Comfortable with Dogs");
  }

  if (profile.profile_type === "family") {
    if (profile.has_cats) badges.push("Has Cats");
    if (profile.has_dogs) badges.push("Has Dogs");
    if (profile.smoking_in_home) badges.push("Smoking in Home");
    if (profile.driving_needed) badges.push("Driving Needed");
  }

  return badges;
}

async function updateApprovalStatus(tableName, profileId, newStatus) {
  const updates = {
    approval_status: newStatus,
    is_active: newStatus === "approved"
  };

  const { error } = await supabase
    .from(tableName)
    .update(updates)
    .eq("id", profileId);

  if (error) {
    console.error("Error updating approval status:", error);
    alert("Could not update approval status.");
    return;
  }

  loadAdminDashboard();
}

async function deleteProfile(tableName, profileId) {
  const confirmed = confirm("Are you sure you want to permanently delete this profile?");
  if (!confirmed) return;

  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("Error deleting profile:", error);
    alert("Could not delete profile.");
    return;
  }

  loadAdminDashboard();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminDashboard();
});

async function deleteProfile(profileId) {
  const confirmed = confirm("Are you sure you want to permanently delete this profile?");
  if (!confirmed) return;

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", profileId);

  if (error) {
    console.error("Error deleting profile:", error);
    alert("Could not delete profile.");
    return;
  }

  loadAdminDashboard();
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

document.addEventListener("DOMContentLoaded", () => {
  loadAdminDashboard();
});
