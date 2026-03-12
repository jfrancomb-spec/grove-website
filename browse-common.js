function buildBrowsePhotoGallery(profile, displayName, photoLabel) {
  const photos =
    Array.isArray(profile.photo_urls) && profile.photo_urls.length
      ? profile.photo_urls.filter(Boolean)
      : (profile.photo_url ? [profile.photo_url] : []);

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
            aria-label="View ${photoLabel} photo ${index + 1}"
          >
            <img src="${photo}" alt="${photoLabel} photo ${index + 1}">
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function wireBrowseCardGallery(card) {
  const mainPhoto = card.querySelector("[data-main-photo]");
  const thumbButtons = card.querySelectorAll(".profile-thumb-button");

  if (!mainPhoto || !thumbButtons.length) return;

  thumbButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const newPhoto = button.getAttribute("data-photo");
      if (!newPhoto) return;

      mainPhoto.src = newPhoto;

      thumbButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
    });
  });
}

function setBrowseCount(countEl, count, label) {
  if (!countEl) return;
  countEl.textContent = `${count} ${label}${count === 1 ? "" : "s"} shown`;
}

function renderBrowseCards({
  list,
  container,
  countEl,
  countLabel,
  emptyMessage,
  renderCard
}) {
  if (!container) return;

  setBrowseCount(countEl, list.length, countLabel);
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<p>${emptyMessage}</p>`;
    return;
  }

  list.forEach((item) => {
    const card = document.createElement("div");
    card.className = "card profile-card";
    card.innerHTML = renderCard(item);
    container.appendChild(card);
    wireBrowseCardGallery(card);
  });
}

function wireBrowseSidebar({
  sidebarId,
  openButtonId,
  closeButtonId
}) {
  const sidebar = document.getElementById(sidebarId);
  const openButton = document.getElementById(openButtonId);
  const closeButton = document.getElementById(closeButtonId);

  openButton?.addEventListener("click", () => {
    sidebar?.classList.add("open");
  });

  closeButton?.addEventListener("click", () => {
    sidebar?.classList.remove("open");
  });
}

function closeBrowseSidebar(sidebarId) {
  document.getElementById(sidebarId)?.classList.remove("open");
}

function buildStars(avg) {
  if (!avg) return "";
  const rounded = Math.round(avg * 10) / 10;
  return `⭐ ${rounded}`;
}
