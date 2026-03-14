function buildStars(rating) {
  const numericRating = Number(rating);

  if (Number.isNaN(numericRating) || numericRating <= 0) return "";

  const fullStars = Math.round(numericRating);
  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

function buildBrowsePhotoGallery(profile, displayName) {
  const photos = getProfilePhotoArray(profile);

  if (!photos.length) return "";

  return `
    <div class="profile-photo-gallery">
      <img
        class="profile-main-photo"
        src="${photos[0]}"
        alt="${displayName}"
        data-main-photo
      >
      <div class="profile-gallery">
        ${photos.map((photo, index) => `
          <button
            type="button"
            class="profile-thumb-button${index === 0 ? " active" : ""}"
            data-photo="${photo}"
            aria-label="View photo ${index + 1}"
          >
            <img src="${photo}" alt="${displayName} photo ${index + 1}">
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function buildProfileBadges(badges) {
  if (!Array.isArray(badges) || !badges.length) return "";

  return `
    <div class="profile-badges">
      ${badges.map(badge => `<span class="profile-badge">${badge}</span>`).join("")}
    </div>
  `;
}

function buildProfileReviewBlock(reviewSummary, recentReview, averageRating) {
  if (!reviewSummary && !recentReview) return "";

  return `
    <div class="profile-review-block">
      ${reviewSummary ? `
        <div class="profile-review-summary">
          ${averageRating ? `<span class="profile-stars">${buildStars(averageRating)}</span>` : ""}
          <span>${reviewSummary}</span>
        </div>
      ` : ""}
      ${recentReview ? `
        <div class="profile-recent-review">“${recentReview}”</div>
      ` : ""}
    </div>
  `;
}

function buildProfileActions(actions) {
  if (!Array.isArray(actions) || !actions.length) return "";

  return `
    <div class="profile-actions">
      ${actions.map((action) => {
        if (action.action === "message") {
          return `
            <button
              type="button"
              class="${action.className || "button"}"
              data-message-target-user="${action.targetUserId || ""}"
              data-message-family-profile="${action.familyProfileId || ""}"
              data-message-caregiver-profile="${action.caregiverProfileId || ""}"
            >
              ${action.label}
            </button>
          `;
        }

        return `
          <a class="${action.className || "button"}" href="${action.href}">
            ${action.label}
          </a>
        `;
      }).join("")}
    </div>
  `;
}

function buildProfileCardShell(profile, config) {
  const displayName = config.getDisplayName(profile);
  const summary = config.getSummary(profile);
  const badges = config.getBadges(profile);
  const actions = config.getActions(profile);
  const reviewSummary = config.getReviewSummary(profile);
  const recentReview = config.getRecentReview(profile);
  const averageRating = config.getAverageRating ? config.getAverageRating(profile) : null;
  const metaLine = config.getMetaLine ? config.getMetaLine(profile) : "";

  return `
    <article class="profile-card">
      ${buildBrowsePhotoGallery(profile, displayName)}

      <div class="profile-card-body">
        <div class="profile-card-header">
          <h3 class="profile-name">${displayName}</h3>
          ${metaLine ? `<div class="profile-meta">${metaLine}</div>` : ""}
        </div>

        ${summary ? `<p class="profile-summary">${summary}</p>` : ""}

        ${buildProfileBadges(badges)}

        ${buildProfileReviewBlock(reviewSummary, recentReview, averageRating)}

        ${buildProfileActions(actions)}
      </div>
    </article>
  `;
}

function renderBrowseCards(container, items, config) {
  if (!container) return;

  if (!Array.isArray(items) || !items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No results found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items
    .map(item => buildProfileCardShell(item, config))
    .join("");

  wireBrowseCardGallery(container);
  wireBrowseActionButtons(container);
}

function wireBrowseCardGallery(container = document) {
  const galleries = container.querySelectorAll(".profile-photo-gallery");

  galleries.forEach(gallery => {
    const mainPhoto = gallery.querySelector("[data-main-photo]");
    const buttons = gallery.querySelectorAll(".profile-thumb-button");

    buttons.forEach(button => {
      button.addEventListener("click", () => {
        const newPhoto = button.dataset.photo;
        if (!mainPhoto || !newPhoto) return;

        mainPhoto.src = newPhoto;

        buttons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
      });
    });
  });
}

function wireBrowseActionButtons(container = document) {
  const buttons = container.querySelectorAll("[data-message-target-user]");

  buttons.forEach((button) => {
    button.addEventListener("click", async () => {
      const targetUserId = button.dataset.messageTargetUser || "";
      const familyProfileId = button.dataset.messageFamilyProfile || "";
      const caregiverProfileId = button.dataset.messageCaregiverProfile || "";

      if (!targetUserId || !window.openGroveConversation) return;

      await window.openGroveConversation({
        targetUserId,
        familyProfileId: familyProfileId || null,
        caregiverProfileId: caregiverProfileId || null
      });
    });
  });
}

function setBrowseCount(elementOrSelector, count, label = "results") {
  const element =
    typeof elementOrSelector === "string"
      ? document.querySelector(elementOrSelector)
      : elementOrSelector;

  if (!element) return;

  element.textContent = `${count} ${label}`;
}

function wireBrowseSidebar({
  openButtonSelector = "[data-open-filters]",
  closeButtonSelector = "[data-close-filters]",
  sidebarSelector = ".filter-sidebar",
  overlaySelector = ".filter-overlay"
} = {}) {
  const openButton = document.querySelector(openButtonSelector);
  const closeButton = document.querySelector(closeButtonSelector);
  const sidebar = document.querySelector(sidebarSelector);
  const overlay = document.querySelector(overlaySelector);

  if (!sidebar) return;

  const openSidebar = () => {
    sidebar.classList.add("open");
    if (overlay) overlay.classList.add("open");
    document.body.classList.add("filters-open");
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
    document.body.classList.remove("filters-open");
  };

  if (openButton) openButton.addEventListener("click", openSidebar);
  if (closeButton) closeButton.addEventListener("click", closeSidebar);
  if (overlay) overlay.addEventListener("click", closeSidebar);

  return { openSidebar, closeSidebar };
}

function closeBrowseSidebar({
  sidebarSelector = ".filter-sidebar",
  overlaySelector = ".filter-overlay"
} = {}) {
  const sidebar = document.querySelector(sidebarSelector);
  const overlay = document.querySelector(overlaySelector);

  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.classList.remove("filters-open");
}
