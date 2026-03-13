function formatBrowseDisplayName(profile) {
  if (profile.name_display && profile.name_display.trim()) {
    return profile.name_display.trim();
  }

  const first = profile.first_name ? profile.first_name.trim() : "";
  const last = profile.last_name ? profile.last_name.trim() : "";

  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;

  return "Profile";
}

function getProfilePhotoArray(profile) {
  const photos =
    Array.isArray(profile.photo_urls) && profile.photo_urls.length
      ? profile.photo_urls.filter(Boolean)
      : (profile.photo_url ? [profile.photo_url] : []);

  return photos;
}

function getBrowseReviewSummary(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) {
    return "No reviews yet";
  }

  const ratings = reviews
    .map(review => Number(review.rating))
    .filter(rating => !Number.isNaN(rating));

  if (!ratings.length) {
    return `${reviews.length} review${reviews.length === 1 ? "" : "s"}`;
  }

  const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;

  return `${average.toFixed(1)} (${reviews.length} review${reviews.length === 1 ? "" : "s"})`;
}

function getBrowseRecentReview(reviews) {
  if (!Array.isArray(reviews) || !reviews.length) return "";

  const sorted = [...reviews].sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime();
    const bTime = new Date(b.created_at || 0).getTime();
    return bTime - aTime;
  });

  const latest = sorted[0];
  const text = (latest.review_text || latest.review || "").trim();

  return text || "";
}

function truncateText(text, maxLength = 140) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

function joinList(items, separator = ", ") {
  if (!Array.isArray(items)) return "";
  return items.filter(Boolean).join(separator);
}

function formatResponseTime(minutes) {
  const value = Number(minutes);

  if (Number.isNaN(value) || value <= 0) return "";

  if (value < 60) {
    return `${value} min response`;
  }

  const hours = Math.round((value / 60) * 10) / 10;

  if (hours === 1) return "1 hr response";

  return `${hours} hr response`;
}
