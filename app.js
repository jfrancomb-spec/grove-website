const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JwsPcXgi_T-NQZo1tGZY_w_kcRc9kWc";

window.addEventListener("DOMContentLoaded", () => {
  // UMD build exposes a global "supabase" object
  window.db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Find Care form (index.html)
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
        alert("Request failed. Please try again.");
        console.error(error);
        return;
      }
document.getElementById("careSuccess").style.display = "block";
document.getElementById("careForm").style.display = "none";
     document.getElementById("careSuccess").style.display = "block";
careForm.style.display = "none";
careForm.scrollIntoView({ behavior: "smooth" });
      careForm.reset();
    });
  }

  // Caregiver form (caregiver.html)
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
        alert("Application failed. Please try again.");
        console.error(error);
        return;
      }
document.getElementById("caregiverSuccess").style.display = "block";
document.getElementById("caregiverForm").style.display = "none";
document.getElementById("caregiverSuccess").style.display = "block";
      caregiverForm.style.display = "none";
caregiverForm.reset();
document.getElementById("caregiverSuccess").scrollIntoView({ behavior: "smooth" });
    });
  }
});
