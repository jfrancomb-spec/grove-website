// -----------------------------
// Supabase client (global)
// -----------------------------
const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JwsPcXgi_T-NQZo1tGZY_w_kcRc9kWc";
window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -----------------------------
// Header / Footer injection
// -----------------------------
async function loadPart(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const res = await fetch(file);
  el.innerHTML = await res.text();

  // After header is injected, wire behaviors that depend on it existing
  if (id === "header-placeholder") {
    highlightCurrentNav();
    wireMobileMenu();
  }
}

// -----------------------------
// Nav + Mobile menu
// -----------------------------
function getCurrentFileName() {
  // Handles:
  //  - /grove-website/            => index.html
  //  - /grove-website/index.html  => index.html
  const last = window.location.pathname.split("/").pop();
  return last && last.length ? last : "index.html";
}

function highlightCurrentNav() {
  const file = getCurrentFileName();

  document.querySelectorAll(".nav a").forEach((a) => {
    const hrefRaw = a.getAttribute("href") || "";
    const href = hrefRaw.replace("./", "");
    a.classList.toggle("active", href === file);
  });
}

function wireMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if (!toggle || !nav) return;

  // Prevent double-wiring if header is reloaded
  if (toggle.dataset.wired === "1") return;
  toggle.dataset.wired = "1";

  // Sync aria-expanded for accessibility
  const setExpanded = (isOpen) => toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

  toggle.addEventListener("click", () => {
    nav.classList.toggle("open");
    setExpanded(nav.classList.contains("open"));
  });

  // Close menu after tapping a link (mobile UX)
  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      setExpanded(false);
    });
  });

  // Initialize
  setExpanded(nav.classList.contains("open"));
}

// -----------------------------
// Prefill (caregiver apply from job)
// -----------------------------
function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);

  const applyJob = params.get("apply_job");
  const careType = (params.get("care_type") || "").trim();
  const location = (params.get("location") || "").trim();

  // Only run on caregiver page
  const exp = document.getElementById("cg_experience");
  if (!exp) return;

  // Location
  const loc = document.getElementById("cg_location");
  if (loc && location) loc.value = location;

  // Care type (case-insensitive match)
  const sel = document.getElementById("cg_care_type");
  if (sel && careType) {
    const match = Array.from(sel.options).find((o) => {
      const val = (o.value || o.textContent || "").trim().toLowerCase();
      return val === careType.toLowerCase();
    });
    if (match) sel.value = match.value || match.textContent;
  }

  // Experience textarea
  if (applyJob) {
    exp.value =
      `Applying for job: ${applyJob}\n` +
      (location ? `Location: ${location}\n` : "") +
      (careType ? `Care type: ${careType}\n` : "") +
      `\n` +
      (exp.value || "");
  }
}

// -----------------------------
// Forms
// -----------------------------
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
      details: document.getElementById("details")?.value || "",
    };

    const { error } = await window.db.from("care_requests").insert([payload]);

    if (error) {
      alert(`Request failed: ${error?.message || "Unknown error"}`);
      console.error(error);
      return;
    }

    const msg = document.getElementById("careSuccess");
    if (msg) msg.style.display = "block";
    careForm.style.display = "none";

    if (msg) msg.scrollIntoView({ behavior: "smooth" });
  });
}

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
      experience: document.getElementById("cg_experience")?.value || "",
    };

    const { error } = await window.db.from("caregiver_applications").insert([payload]);

    if (error) {
      alert(`Application failed: ${error?.message || "Unknown error"`);
      console.error(error);
      return;
    }

    const msg = document.getElementById("caregiverSuccess");
    if (msg) msg.style.display = "block";
    caregiverForm.style.display = "none";

    if (msg) msg.scrollIntoView({ behavior: "smooth" });
  });
}

// -----------------------------
// Init
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
  loadPart("header-placeholder", "./header.html");
  loadPart("footer-placeholder", "./footer.html");

  prefillFromQuery();

  wireFindCareForm();
  wireCaregiverForm();
});
