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

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    pendingList.innerHTML = `<div class="admin-empty">Error loading profiles.</div>`;
    approvedList.innerHTML = "";
    deniedList.innerHTML = "";
    console.error(error);
    return;
  }

  const pending = data.filter(profile => profile.approval_status === "pending");
  const approved = data.filter(profile => profile.approval_status === "approved");
  const denied = data.filter(profile => profile.approval_status === "denied");

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
    const badges = Array.isArray(profile.badges) ? profile.badges : [];
    const roleLabel = profile.role === "family" ? "Family" : "Caregiver";

    return `
      <div class="admin-card">
        <div class="admin-card-top">
          <div>
            <h3>${escapeHtml(profile.display_name || "Unnamed Profile")}</h3>
            <div class="admin-meta">
              ${roleLabel} • ${escapeHtml(profile.city || "")}${profile.city && profile.state ? ", " : ""}${escapeHtml(profile.state || "")}
            </div>
            <div>${escapeHtml(profile.headline || "")}</div>
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
                ? `<button class="button-admin button-approve" onclick="updateApprovalStatus('${profile.id}', 'approved')">Approve</button>`
                : ""
            }
            ${
              sectionType !== "denied"
                ? `<button class="button-admin button-deny" onclick="updateApprovalStatus('${profile.id}', 'denied')">Deny</button>`
                : ""
            }
            <button class="button-admin button-delete" onclick="deleteProfile('${profile.id}')">Delete</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function updateApprovalStatus(profileId, newStatus) {
  const { error } = await supabase
    .from("profiles")
    .update({ approval_status: newStatus })
    .eq("id", profileId);

  if (error) {
    console.error("Error updating approval status:", error);
    alert("Could not update approval status.");
    return;
  }

  loadAdminDashboard();
}

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
