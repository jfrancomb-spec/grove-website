async function loadPart(id, file) {
  const el = document.getElementById(id);
  if (!el) return;

  const res = await fetch(file);
  el.innerHTML = await res.text();

  if (id === "header-placeholder") highlightCurrentNav();
}

function highlightCurrentNav() {
  const file = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".nav a").forEach((a) => {
    const hrefRaw = a.getAttribute("href") || "";
    const href = hrefRaw.replace("./", "");

    if (href === file) a.classList.add("active");
    if (file === "index.html" && href === "index.html") a.classList.add("active");
  });
}

// Supabase client (global)
const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JwsPcXgi_T-NQZo1tGZY_w_kcRc9kWc";
window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function prefillFromQuery() {
  const params = new URLSearchParams(window.location.search);

  const applyJob = params.get("apply_job");
  const careType = (params.get("care_type") || "").trim();
  const location = (params.get("location") || "").trim();

  // Only run on caregiver page (needs these elements)
  const exp = document.getElementById("cg_experience");
  if (!exp) return;

  // Location
  const loc = document.getElementById("cg_location");
  if (loc && location) loc.value = location;

  // Care type (case-insensitive match)
  const sel = document.getElementById("cg_care_type");
  if (sel && careType) {
    const match = Array.from(sel.options).find(
      (o) => (o.value || o.textContent).trim().toLowerCase() === careType.toLowerCase()
    );
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

window.addEventListener("DOMContentLoaded", () => {
  // shared header/footer
  loadPart("header-placeholder", "./header.html");
  loadPart("footer-placeholder", "./footer.html");

  // highlight + prefill
  prefillFromQuery();

  // Find Care form
  const careForm = document.getElementById("careForm");
  if (careForm) {
    careForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        care_type: document.getElementById("care_type").value,
        location: document.getElementById("location").value,
        schedule: document.getElementById("schedule")?.value || "Not specified",
        details: document.getElementById("details").value,
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

  // Caregiver form
  const caregiverForm = document.getElementById("caregiverForm");
  if (caregiverForm) {
    caregiverForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const payload = {
        name: document.getElementById("cg_name").value,
        phone: document.getElementById("cg_phone").value,
        email: document.getElementById("cg_email").value,
        location: document.getElementById("cg_location").value,
        care_type: document.getElementById("cg_care_type").value,
        experience: document.getElementById("cg_experience").value,
      };

      const { error } = await window.db.from("caregiver_applications").insert([payload]);

      if (error) {
        alert(`Request failed: ${error?.message || "Unknown error"}`);
        console.error(error);
        return;
      }

      const msg = document.getElementById("caregiverSuccess");
      if (msg) msg.style.display = "block";
      caregiverForm.style.display = "none";

      if (msg) msg.scrollIntoView({ behavior: "smooth" });
    });
  }
});
window.addEventListener("DOMContentLoaded", () => {

  const toggle = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");

  if(toggle && nav){
    toggle.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

});
