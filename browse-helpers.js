function formatBrowseDisplayName(profile) {
  if (profile.name_display && profile.name_display.trim()) {
    return profile.name_display.trim();
  }

  const first = profile.first_name ? profile.first_name.trim() : "";
  const last = profile.last_name ? profile.last_name.trim() : "";

  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`;
  if (first) return first;
  if (last) return last;

  return "Profile";
}

function createStableHash(value) {
  const text = String(value || "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function rotateItems(items, seed, count = items.length) {
  if (!Array.isArray(items) || !items.length) return [];

  const start = seed % items.length;
  const rotated = items.slice(start).concat(items.slice(0, start));
  return rotated.slice(0, Math.min(count, rotated.length));
}

function buildMockReviewDate(seed, index) {
  const month = (seed + index) % 12;
  const day = 5 + ((seed * 3 + index * 7) % 22);
  return new Date(Date.UTC(2025, month, day, 15, 0, 0)).toISOString();
}

function getMockCaregiverReviewTemplates(profile = {}) {
  const firstName = (profile.first_name || profile.name_display || "This caregiver").toString().trim().split(/\s+/)[0];
  const caregiverName = firstName || "This caregiver";
  const location = profile.location || "our area";

  return [
    {
      reviewer_name: "The Martinez Family",
      rating: 5,
      review_text: `${caregiverName} was dependable, calm, and easy to communicate with. We always felt prepared and supported.`
    },
    {
      reviewer_name: "A Grove Parent",
      rating: 5,
      review_text: `Wonderful with routines and transitions. ${caregiverName} brought a steady presence and genuine warmth every visit.`
    },
    {
      reviewer_name: "The Johnsons",
      rating: 4,
      review_text: `Very responsive and thoughtful. We especially appreciated the clear updates after each shift in ${location}.`
    },
    {
      reviewer_name: "Repeat Family Client",
      rating: 5,
      review_text: `${caregiverName} is the kind of caregiver you hope to find: punctual, kind, and attentive to details that matter.`
    }
  ];
}

function getMockFamilyReviewTemplates(profile = {}) {
  const familyName = formatBrowseDisplayName(profile);
  const location = profile.location || "their area";

  return [
    {
      reviewer_name: "A Grove Caregiver",
      rating: 5,
      review_text: `${familyName} was welcoming, organized, and very clear about what support was needed. Communication was easy from the start.`
    },
    {
      reviewer_name: "Returning Caregiver",
      rating: 5,
      review_text: `This was a respectful family to work with. Expectations were thoughtful, and the schedule details were always clear.`
    },
    {
      reviewer_name: "Local Care Professional",
      rating: 4,
      review_text: `Kind household and smooth coordination in ${location}. I appreciated how prepared the family was for each visit.`
    },
    {
      reviewer_name: "Grove Community Member",
      rating: 5,
      review_text: `${familyName} created a warm environment and made it easy to step in and help right away.`
    }
  ];
}

function buildMockReviews(profileType, profile = {}, count = 3) {
  const profileId = profile.id || profile.user_id || profile.current_visible_version_id || profile.name_display || profile.first_name || "profile";
  const seed = createStableHash(`${profileType}:${profileId}`);
  const templates = profileType === "caregiver"
    ? getMockCaregiverReviewTemplates(profile)
    : getMockFamilyReviewTemplates(profile);

  return rotateItems(templates, seed, count).map((template, index) => ({
    id: `mock-${profileType}-${profileId}-${index}`,
    [`${profileType}_profile_id`]: profile.id || null,
    reviewer_name: template.reviewer_name,
    rating: template.rating,
    review_text: template.review_text,
    content_status: "published",
    is_visible: true,
    is_mock: true,
    created_at: buildMockReviewDate(seed, index)
  }));
}

function getDisplayReviews(profileType, profile, reviews) {
  if (Array.isArray(reviews) && reviews.length) {
    return reviews;
  }

  return buildMockReviews(profileType, profile);
}

function getProfilePhotoArray(profile) {
  let photoUrls = profile.photo_urls;

  if (typeof photoUrls === "string") {
    const trimmed = photoUrls.trim();

    if (trimmed) {
      try {
        const parsed = JSON.parse(trimmed);
        photoUrls = Array.isArray(parsed) ? parsed : [trimmed];
      } catch {
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          const inner = trimmed.slice(1, -1).trim();
          photoUrls = inner
            ? inner
                .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
                .map((value) => value.trim().replace(/^"(.*)"$/, "$1"))
            : [];
        } else {
          photoUrls = trimmed.includes(",")
            ? trimmed.split(",").map((value) => value.trim())
            : [trimmed];
        }
      }
    }
  }

  const photos =
    Array.isArray(photoUrls) && photoUrls.length
      ? photoUrls.filter(Boolean)
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

window.buildMockReviews = buildMockReviews;
window.getDisplayReviews = getDisplayReviews;
