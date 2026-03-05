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

  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if (!toggle || !nav) return;

  // Prevent menu wiring twice
  if (toggle.dataset.wired === "1") return;

  toggle.dataset.wired = "1";

  const setExpanded = (isOpen) =>
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

  toggle.addEventListener("click", () => {

    nav.classList.toggle("open");

    setExpanded(nav.classList.contains("open"));

  });

  // Close menu when a link is clicked
  nav.querySelectorAll("a").forEach((a) => {

    a.addEventListener("click", () => {

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
