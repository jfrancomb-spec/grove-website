const SUPABASE_URL = "https://apjdknqppglnamndwwya.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JwsPcXgi_T-NQZo1tGZY_w_kcRc9kWc";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
document.getElementById("careForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const { error } = await supabase
    .from("care_requests")
    .insert([
      {
        name: document.getElementById("name").value,
        email: document.getElementById("email").value,
        care_type: document.getElementById("care_type").value,
        location: document.getElementById("location").value,
        schedule: "Not specified",
        details: document.getElementById("details").value
      }
    ]);

  if (error) {
    alert("Something went wrong. Please try again.");
    console.error(error);
  } else {
    alert("Request submitted! Grove will contact you soon.");
    document.getElementById("careForm").reset();
  }
});
