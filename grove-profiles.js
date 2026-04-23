(function () {
  const GroveProfiles = {
    formatPhoneNumber(value) {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 10);
      if (digits.length === 0) return "";
      if (digits.length < 4) return digits;
      if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    },

    getCheckedValues(selector) {
      return Array.from(document.querySelectorAll(selector))
        .filter((el) => el.checked)
        .map((el) => el.value);
    },

    setCheckedValues(selector, values) {
      const selected = Array.isArray(values) ? values : [];
      document.querySelectorAll(selector).forEach((el) => {
        el.checked = selected.includes(el.value);
      });
    },

    async getCurrentUser() {
      const { data, error } = await window.db.auth.getSession();
      if (error) throw error;
      return data?.session?.user || null;
    },

    getAccountEmail(user) {
      return user?.email || "";
    },

    getAccountFirstName(user, fallbackValue = "") {
      return (user?.user_metadata?.first_name || fallbackValue || "").trim();
    },

    getAccountLastName(user, fallbackValue = "") {
      return (user?.user_metadata?.last_name || fallbackValue || "").trim();
    },

    getAccountPhone(user, fallbackValue = "") {
      const metadataPhone =
        user?.user_metadata?.phone ||
        user?.user_metadata?.phone_number ||
        "";

      return this.formatPhoneNumber(metadataPhone || fallbackValue || "");
    },

    buildDefaultDisplayName({ firstName = "", lastName = "" } = {}) {
      const first = String(firstName || "").trim();
      const last = String(lastName || "").trim();
      const lastInitial = last ? `${last.charAt(0).toUpperCase()}.` : "";

      return `${first}${first && lastInitial ? " " : ""}${lastInitial}`.trim();
    },

    async updateAccountProfile({ firstName = "", lastName = "", phone = "" } = {}) {
      const normalizedPhone = this.formatPhoneNumber(phone);
      const { data, error } = await window.db.auth.updateUser({
        data: {
          first_name: String(firstName || "").trim(),
          last_name: String(lastName || "").trim(),
          phone: normalizedPhone
        }
      });

      if (error) throw error;
      return data?.user || null;
    },

    async loadParentProfile(tableName, userId) {
      const { data, error } = await window.db
        .from(tableName)
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },

    async loadProfileVersion(versionTable, versionId) {
      if (!versionId) return null;

      const { data, error } = await window.db
        .from(versionTable)
        .select("*")
        .eq("id", versionId)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },

    async loadProfileBundle({ parentTable, versionTable, userId }) {
      const parent = await this.loadParentProfile(parentTable, userId);

      if (!parent) {
        return {
          parent: null,
          visibleVersion: null,
          pendingVersion: null,
          workingVersion: null
        };
      }

      const visibleVersion = await this.loadProfileVersion(
        versionTable,
        parent.current_visible_version_id
      );

      const pendingVersion = await this.loadProfileVersion(
        versionTable,
        parent.current_pending_version_id
      );

      return {
        parent,
        visibleVersion,
        pendingVersion,
        workingVersion: pendingVersion || visibleVersion || null
      };
    },

    getProfileStatusHtml(bundle) {
      if (bundle?.pendingVersion) {
        return `<span class="badge badge-pending">Pending Review</span>`;
      }

      if (bundle?.visibleVersion) {
        return `<span class="badge badge-approved">Approved</span>`;
      }

      return `<span class="badge badge-pending">Not Submitted</span>`;
    },

    async loadMessageCount(userId) {
      const { count, error } = await window.db
        .from("conversation_participants")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_archived", false);

      if (error) throw error;
      return count || 0;
    },

    getExistingPhotoUrls(profileVersion) {
      if (!profileVersion) return [];
      if (Array.isArray(profileVersion.photo_urls) && profileVersion.photo_urls.length) {
        return profileVersion.photo_urls.filter(Boolean);
      }
      if (profileVersion.photo_url) {
        return [profileVersion.photo_url];
      }
      return [];
    },

    async uploadPhotos({ bucket = "profile-photos", folder, userId, files }) {
      const uploadFiles = Array.from(files || []).slice(0, 5);
      if (!uploadFiles.length) return [];

      const photoUrls = [];

      for (const file of uploadFiles) {
        const safeName = file.name.replace(/\s+/g, "_");
        const filePath = `${folder}/${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName}`;

        const { error: uploadError } = await window.db
          .storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = window.db
          .storage
          .from(bucket)
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          photoUrls.push(publicData.publicUrl);
        }
      }

      return photoUrls;
    },

    async resolvePhotoUrls({ folder, userId, files, existingVersion, retainedPhotoUrls = [] }) {
      const keptPhotoUrls = Array.isArray(retainedPhotoUrls)
        ? retainedPhotoUrls.filter(Boolean).slice(0, 5)
        : this.getExistingPhotoUrls(existingVersion);
      const remainingSlots = Math.max(0, 5 - keptPhotoUrls.length);
      const uploadFiles = Array.from(files || []).slice(0, remainingSlots);

      if (!uploadFiles.length) {
        return keptPhotoUrls;
      }

      const uploadedPhotoUrls = await this.uploadPhotos({
        folder,
        userId,
        files: uploadFiles
      });

      return keptPhotoUrls.concat(uploadedPhotoUrls).slice(0, 5);
    },

async submitCaregiverProfile({
  caregiverProfileId = null,
  values
}) {
  const user = await this.getCurrentUser();

  if (!user) {
    throw new Error("You are not signed in. Please use the sign-in link and try again.");
  }

  const payload = {
    name_display: values.name_display || "",
    location: values.location,
    care_types: Array.isArray(values.care_types) ? values.care_types : [],
    years_experience: values.years_experience || "",
    availability: values.availability || "",
    has_drivers_license: !!values.has_drivers_license,
    cpr_certified: !!values.cpr_certified,
    non_smoker: !!values.non_smoker,
    non_vaper: !!values.non_vaper,
    comfortable_with_cats: !!values.comfortable_with_cats,
    comfortable_with_dogs: !!values.comfortable_with_dogs,
    bio: values.bio || "",
    photo_urls: Array.isArray(values.photo_urls) ? values.photo_urls : []
  };

  if (caregiverProfileId) {
    payload.caregiver_profile_id = caregiverProfileId;
  }

  console.log("Submitting caregiver profile for user:", user.id);

  const {
    data: { session },
    error: sessionError
  } = await window.db.auth.getSession();

  if (sessionError) {
    console.error("submit-caregiver-profile-version session error:", sessionError);
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error("No active access token found.");
  }

  const { data, error } = await window.db.functions.invoke(
    "submit-caregiver-profile-version",
    {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  );

  if (error) {
    console.error("submit-caregiver-profile-version error:", error);
    let details = "";
    try {
      if (error.context) {
        const responseBody = await error.context.text();
        if (responseBody) {
          details = responseBody;
        }
      }
    } catch (contextError) {
      console.error("submit-caregiver-profile-version context read error:", contextError);
    }

    if (details) {
      throw new Error(`submit-caregiver-profile-version failed: ${details}`);
    }

    throw error;
  }

  if (!data?.success) {
    console.error("submit-caregiver-profile-version returned:", data);
    throw new Error(data?.error || "submit-caregiver-profile-version failed");
  }

  return data;
},

async submitFamilyProfile({
  familyProfileId = null,
  values
}) {
  const user = await this.getCurrentUser();

  if (!user) {
    throw new Error("You are not signed in. Please log in and try again.");
  }

  const payload = {
    name_display: values.name_display || "",
    location: values.location,
    care_types_needed: Array.isArray(values.care_types_needed)
      ? values.care_types_needed
      : [],
    has_cats: !!values.has_cats,
    has_dogs: !!values.has_dogs,
    smoking_in_home: !!values.smoking_in_home,
    driving_needed: !!values.driving_needed,
    household_description: values.household_description || "",
    children_description: values.children_description || "",
    pets_description: values.pets_description || "",
    bio: values.bio || "",
    photo_urls: Array.isArray(values.photo_urls) ? values.photo_urls : []
  };

  if (familyProfileId) {
    payload.family_profile_id = familyProfileId;
  }

  console.log("Submitting family profile for user:", user.id);
  console.log("submit-family-profile-version payload:", payload);

  const {
    data: { session },
    error: sessionError
  } = await window.db.auth.getSession();

  if (sessionError) {
    console.error("submit-family-profile-version session error:", sessionError);
    throw sessionError;
  }

  if (!session?.access_token) {
    throw new Error("No active access token found.");
  }

  const { data, error } = await window.db.functions.invoke(
    "submit-family-profile-version",
    {
      body: payload,
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    }
  );

  console.log("submit-family-profile-version response data:", data);
  console.log("submit-family-profile-version response error:", error);

  if (error) {
    console.error("submit-family-profile-version error:", error);
    throw error;
  }

  if (!data?.success) {
    console.error("submit-family-profile-version returned:", data);
    throw new Error(data?.error || "submit-family-profile-version failed");
  }

  return data;
},    
    async lookupProfileParentByEmailPhone({ parentTable, email, phone }) {
      const { data, error } = await window.db
        .from(parentTable)
        .select("*")
        .eq("email", email)
        .eq("phone", phone)
        .limit(1);

      if (error) throw error;
      return data && data.length ? data[0] : null;
    },

    async loadLookupProfileBundle({ parentTable, versionTable, email, phone }) {
      const parent = await this.lookupProfileParentByEmailPhone({
        parentTable,
        email,
        phone
      });

      if (!parent) {
        return {
          parent: null,
          visibleVersion: null,
          pendingVersion: null,
          workingVersion: null
        };
      }

      const visibleVersion = await this.loadProfileVersion(
        versionTable,
        parent.current_visible_version_id
      );

      const pendingVersion = await this.loadProfileVersion(
        versionTable,
        parent.current_pending_version_id
      );

      return {
        parent,
        visibleVersion,
        pendingVersion,
        workingVersion: pendingVersion || visibleVersion || null
      };
    }
  };

  window.GroveProfiles = GroveProfiles;
})();
