function formatBrowseDisplayName(profile) {
  const first = profile.first_name || "";
  const lastInitial = profile.last_name ? `${profile.last_name.charAt(0)}.` : "";
  return `${first} ${lastInitial}`.trim();
}

function getBrowseReviewSummary(entityId, reviewMap) {
  const reviews = reviewMap[entityId] || [];
  if (!reviews.length) return "";

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return `
    <p><strong>Rating:</strong> ${buildStars(avg)} (${reviews.length} review${reviews.length === 1 ? "" : "s"})</p>
  `;
}

function getBrowseRecentReview(entityId, reviewMap) {
  const reviews = reviewMap[entityId] || [];
  if (!reviews.length) return "";

  const latest = reviews[0];
  if (!latest.review_text) return "";

  return `
    <p><strong>Recent Review:</strong> “${latest.review_text}”</p>
  `;
}
