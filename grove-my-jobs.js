document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initMyJobsSection();
  } catch (err) {
    console.error("My Jobs init failed:", err);
  }
});

async function initMyJobsSection() {
  const supabase = window.db;

  if (!supabase) {
    console.error("Supabase client not found on window.db");
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("No logged-in user found for My Jobs section.");
    return;
  }

  const section = ensureMyJobsSection();
  setMyJobsLoading(section, true);
  clearMyJobsMessage(section);

  try {
    const jobPosts = await fetchUserJobPosts(supabase, user.id);

    if (!jobPosts.length) {
      renderEmptyMyJobs(section);
      return;
    }

    const versionIds = collectVersionIds(jobPosts);
    const versionsById = await fetchJobVersionsByIds(supabase, versionIds);

    const normalizedJobs = jobPosts.map((job) => normalizeJob(job, versionsById));
    renderMyJobs(section, normalizedJobs);
  } catch (error) {
    console.error("Failed loading My Jobs:", error);
    renderMyJobsError(section, error.message || "Unable to load your job posts.");
  } finally {
    setMyJobsLoading(section, false);
  }
}

function ensureMyJobsSection() {
  let section = document.getElementById("myJobsSection");
  if (section) return section;

  const mountPoint =
    document.getElementById("accountContent") ||
    document.getElementById("accountPageContent") ||
    document.querySelector(".account-content") ||
    document.querySelector("main") ||
    document.body;

  section = document.createElement("section");
  section.id = "myJobsSection";
  section.className = "account-section my-jobs-section";
  section.innerHTML = `
    <div class="section-header">
      <h2>Your Job Posts</h2>
      <p class="section-subtitle">Manage the care requests you have posted through Grove.</p>
    </div>

    <div class="my-jobs-toolbar">
      <a class="button-family" href="./findcare.html">Post a New Job</a>
    </div>

    <div id="myJobsLoading" class="my-jobs-loading" style="display:none;">
      Loading your job posts...
    </div>

    <div id="myJobsMessage" class="my-jobs-message" style="display:none;"></div>

    <div id="myJobsGroups" class="my-jobs-groups"></div>
  `;

  mountPoint.appendChild(section);
  return section;
}

async function fetchUserJobPosts(supabase, userId) {
  const { data, error } = await supabase
    .from("job_posts")
    .select(`
      id,
      user_id,
      title,
      care_type,
      location,
      schedule,
      description,
      pay_range,
      is_active,
      content_status,
      current_visible_version_id,
      current_pending_version_id,
      status_reason,
      updated_at
    `)
    .eq("user_id", userId)
    .neq("content_status", "deleted")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load job posts: ${error.message}`);
  }

  return data || [];
}

function collectVersionIds(jobPosts) {
  const ids = new Set();

  for (const job of jobPosts) {
    if (job.current_visible_version_id) ids.add(job.current_visible_version_id);
    if (job.current_pending_version_id) ids.add(job.current_pending_version_id);
  }

  return Array.from(ids);
}

async function fetchJobVersionsByIds(supabase, versionIds) {
  if (!versionIds.length) return {};

  const { data, error } = await supabase
    .from("job_post_versions")
    .select(`
      id,
      job_post_id,
      version_number,
      title,
      care_type,
      location,
      schedule,
      description,
      pay_range,
      content_status,
      review_status,
      moderation_reason,
      rejection_reason,
      is_live,
      approved_at,
      submitted_at,
      updated_at,
      status_reason
    `)
    .in("id", versionIds);

  if (error) {
    throw new Error(`Failed to load job post versions: ${error.message}`);
  }

  const map = {};
  for (const row of data || []) {
    map[row.id] = row;
  }

  return map;
}

function normalizeJob(job, versionsById) {
  const visibleVersion = job.current_visible_version_id
    ? versionsById[job.current_visible_version_id] || null
    : null;

  const pendingVersion = job.current_pending_version_id
    ? versionsById[job.current_pending_version_id] || null
    : null;

  const displayVersion = pendingVersion || visibleVersion || null;

  const title =
    displayVersion?.title ||
    job.title ||
    generateFallbackJobTitle(job.care_type);

  const careType =
    displayVersion?.care_type ||
    job.care_type ||
    "";

  const location =
    displayVersion?.location ||
    job.location ||
    "";

  const schedule =
    displayVersion?.schedule ||
    job.schedule ||
    "";

  const payRange =
    displayVersion?.pay_range ||
    job.pay_range ||
    "";

  const description =
    displayVersion?.description ||
    job.description ||
    "";

  const statusMeta = deriveJobStatus(job, visibleVersion, pendingVersion);

  return {
    id: job.id,
    title,
    careType,
    location,
    schedule,
    payRange,
    description,
    isActive: job.is_active,
    updatedAt: job.updated_at,
    visibleVersion,
    pendingVersion,
    statusKey: statusMeta.key,
    statusLabel: statusMeta.label,
    statusReason: statusMeta.reason,
    group: statusMeta.group,
  };
}

function deriveJobStatus(job, visibleVersion, pendingVersion) {
  if (!job.is_active && job.content_status !== "deleted") {
    return {
      key: "inactive",
      label: "Inactive",
      reason: job.status_reason || "This job post is not currently active.",
      group: "inactive",
    };
  }

  if (pendingVersion) {
    if (pendingVersion.content_status === "queued") {
      return {
        key: "queued",
        label: "Pending Review",
        reason:
          pendingVersion.status_reason ||
          pendingVersion.review_status ||
          "This job post is waiting for moderation review.",
        group: "pending",
      };
    }

    if (pendingVersion.content_status === "flagged") {
      return {
        key: "flagged",
        label: "Flagged",
        reason:
          pendingVersion.moderation_reason ||
          pendingVersion.status_reason ||
          "This job post was flagged for review.",
        group: "attention",
      };
    }

    if (pendingVersion.content_status === "rejected") {
      return {
        key: "rejected",
        label: "Rejected",
        reason:
          pendingVersion.rejection_reason ||
          pendingVersion.moderation_reason ||
          pendingVersion.status_reason ||
          "This job post needs changes before it can go live.",
        group: "attention",
      };
    }
  }

  if (visibleVersion && visibleVersion.content_status === "published" && visibleVersion.is_live) {
    return {
      key: "published",
      label: "Published",
      reason:
        visibleVersion.status_reason ||
        "This job post is live and visible to caregivers.",
      group: "live",
    };
  }

  if (job.content_status === "queued") {
    return {
      key: "queued",
      label: "Pending Review",
      reason: job.status_reason || "This job post is waiting for moderation review.",
      group: "pending",
    };
  }

  if (job.content_status === "rejected") {
    return {
      key: "rejected",
      label: "Rejected",
      reason: job.status_reason || "This job post needs changes before it can go live.",
      group: "attention",
    };
  }

  return {
    key: "draft",
    label: "Draft",
    reason: job.status_reason || "This job post is not yet published.",
    group: "inactive",
  };
}

function renderMyJobs(section, jobs) {
  const groupsContainer = section.querySelector("#myJobsGroups");
  groupsContainer.innerHTML = "";

  const grouped = {
    live: jobs.filter((job) => job.group === "live"),
    pending: jobs.filter((job) => job.group === "pending"),
    attention: jobs.filter((job) => job.group === "attention"),
    inactive: jobs.filter((job) => job.group === "inactive"),
  };

  const configs = [
    {
      key: "live",
      title: "Live",
      emptyText: "",
    },
    {
      key: "pending",
      title: "Pending Review",
      emptyText: "",
    },
    {
      key: "attention",
      title: "Needs Attention",
      emptyText: "",
    },
    {
      key: "inactive",
      title: "Inactive",
      emptyText: "",
    },
  ];

  let renderedAny = false;

  for (const config of configs) {
    const items = grouped[config.key];
    if (!items.length) continue;

    renderedAny = true;

    const block = document.createElement("div");
    block.className = "my-jobs-group";
    block.innerHTML = `
      <h3>${config.title}</h3>
      <div class="my-jobs-grid"></div>
    `;

    const grid = block.querySelector(".my-jobs-grid");

    items.forEach((job) => {
      grid.appendChild(buildJobCard(job));
    });

    groupsContainer.appendChild(block);
  }

  if (!renderedAny) {
    renderEmptyMyJobs(section);
  }
}

function buildJobCard(job) {
  const card = document.createElement("article");
  card.className = `job-card status-${job.statusKey}`;

  const updatedText = formatDate(job.updatedAt);

  card.innerHTML = `
    <div class="job-card-top">
      <div>
        <h4>${escapeHtml(job.title)}</h4>
        <div class="job-meta-line">
          ${job.careType ? `<span>${escapeHtml(job.careType)}</span>` : ""}
          ${job.location ? `<span>• ${escapeHtml(job.location)}</span>` : ""}
        </div>
      </div>
      <span class="status-badge status-${job.statusKey}">
        ${escapeHtml(job.statusLabel)}
      </span>
    </div>

    <div class="job-details">
      ${job.schedule ? `<p><strong>Schedule:</strong> ${escapeHtml(job.schedule)}</p>` : ""}
      ${job.payRange ? `<p><strong>Pay:</strong> ${escapeHtml(job.payRange)}</p>` : ""}
      ${job.statusReason ? `<p><strong>Status:</strong> ${escapeHtml(job.statusReason)}</p>` : ""}
      <p><strong>Updated:</strong> ${escapeHtml(updatedText)}</p>
    </div>

    <div class="job-actions">
      <a class="button-family" href="./findcare.html?job_post_id=${encodeURIComponent(job.id)}">
        Edit
      </a>
    </div>
  `;

  return card;
}

function renderEmptyMyJobs(section) {
  const groupsContainer = section.querySelector("#myJobsGroups");
  groupsContainer.innerHTML = `
    <div class="my-jobs-empty">
      <p>You have not posted any care requests yet.</p>
      <a class="button-family" href="./findcare.html">Post Your First Job</a>
    </div>
  `;
}

function renderMyJobsError(section, message) {
  const groupsContainer = section.querySelector("#myJobsGroups");
  groupsContainer.innerHTML = "";
  showMyJobsMessage(section, message, "error");
}

function setMyJobsLoading(section, isLoading) {
  const el = section.querySelector("#myJobsLoading");
  if (!el) return;
  el.style.display = isLoading ? "block" : "none";
}

function showMyJobsMessage(section, message, type = "info") {
  const el = section.querySelector("#myJobsMessage");
  if (!el) return;

  el.textContent = message;
  el.className = `my-jobs-message ${type}`;
  el.style.display = "block";
}

function clearMyJobsMessage(section) {
  const el = section.querySelector("#myJobsMessage");
  if (!el) return;

  el.textContent = "";
  el.className = "my-jobs-message";
  el.style.display = "none";
}

function generateFallbackJobTitle(careType) {
  const normalized = (careType || "").toLowerCase();

  if (normalized === "childcare") return "Childcare Needed";
  if (normalized === "senior care") return "Senior Care Needed";
  if (normalized === "pet care") return "Pet Care Needed";
  if (normalized === "household help") return "Household Help Needed";

  return "Care Needed";
}

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
