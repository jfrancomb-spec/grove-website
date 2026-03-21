(function () {
  const GroveAdmin = {
    state: {
      adminUser: null,
      queueItems: [],
      userRiskMap: {}
    },

    escapeHtml(value) {
      if (value === null || value === undefined) return "";
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    },

    fmtDate(ts) {
      try {
        return new Date(ts).toLocaleString();
      } catch {
        return ts || "";
      }
    },

    truncateText(value, max = 220) {
      const text = (value || "").trim();
      if (!text) return "";
      return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
    },

    statusBadge(status) {
      const normalized = (status || "").toLowerCase();

      if (normalized === "open") return `<span class="badge badge-pending">Open</span>`;
      if (normalized === "in_review") return `<span class="badge badge-pending">In Review</span>`;
      if (normalized === "resolved") return `<span class="badge badge-approved">Resolved</span>`;

      if (normalized === "flagged") return `<span class="badge badge-pending">Flagged</span>`;
      if (normalized === "normal") return `<span class="badge badge-approved">Normal</span>`;
      if (normalized === "frozen") return `<span class="badge badge-denied">Frozen</span>`;
      if (normalized === "banned") return `<span class="badge badge-denied">Banned</span>`;

      if (normalized === "held") return `<span class="badge badge-pending">Held</span>`;
      if (normalized === "queued") return `<span class="badge badge-pending">Queued</span>`;
      if (normalized === "visible") return `<span class="badge badge-approved">Visible</span>`;
      if (normalized === "approved") return `<span class="badge badge-approved">Approved</span>`;
      if (normalized === "rejected") return `<span class="badge badge-denied">Rejected</span>`;

      return `<span class="badge badge-pending">${this.escapeHtml(status || "Unknown")}</span>`;
    },

    priorityBadge(priority) {
      const normalized = (priority || "").toLowerCase();
      if (normalized === "urgent") return `<span class="badge badge-denied">Urgent</span>`;
      if (normalized === "high") return `<span class="badge badge-pending">High</span>`;
      if (normalized === "normal") return `<span class="badge badge-approved">Normal</span>`;
      if (normalized === "low") return `<span class="badge">Low</span>`;
      return `<span class="badge">${this.escapeHtml(priority || "Unknown")}</span>`;
    },

    getQueueTitle(item) {
      const type = item.queue_type || "account";
      const labelMap = {
        message: "Message Review",
        caregiver_profile: "Caregiver Profile Review",
        family_profile: "Family Profile Review",
        job_listing: "Job Listing Review",
        caregiver_review: "Caregiver Review",
        family_review: "Family Review",
        account: "Account Review"
      };

      return labelMap[type] || "Moderation Review";
    },

    async loadSession() {
      const { data } = await window.db.auth.getSession();
      this.state.adminUser = data?.session?.user || null;
      return this.state.adminUser;
    },

    async fetchUserRiskProfiles(userIds) {
      if (!userIds.length) {
        this.state.userRiskMap = {};
        return {};
      }

      const { data, error } = await window.db
        .from("user_risk_profiles")
        .select("*")
        .in("user_id", userIds);

      if (error) {
        console.error(error);
        this.state.userRiskMap = {};
        return {};
      }

      const map = {};
      (data || []).forEach((row) => {
        map[row.user_id] = row;
      });

      this.state.userRiskMap = map;
      return map;
    },

    async loadRelatedItem(item) {
      if (!item.related_table || !item.related_id) return null;

      const { data, error } = await window.db
        .from(item.related_table)
        .select("*")
        .eq("id", item.related_id)
        .maybeSingle();

      if (error) {
        console.error(`Failed to load related item from ${item.related_table}`, error);
        return null;
      }

      return data || null;
    },

    async loadQueueData() {
      const { data, error } = await window.db
        .from("admin_review_queue")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      this.state.queueItems = data || [];

      const userIds = Array.from(
        new Set(this.state.queueItems.map((item) => item.user_id).filter(Boolean))
      );

      await this.fetchUserRiskProfiles(userIds);

      for (const item of this.state.queueItems) {
        item._related = await this.loadRelatedItem(item);
        item._risk = this.state.userRiskMap[item.user_id] || null;
      }

      return this.state.queueItems;
    },

    getStats() {
      const items = this.state.queueItems || [];
      const openItems = items.filter((item) => item.status === "open");
      const inReviewItems = items.filter((item) => item.status === "in_review");
      const resolvedItems = items.filter((item) => item.status === "resolved");
      const flaggedUsers = Object.values(this.state.userRiskMap || {}).filter(
        (risk) => risk.account_status === "flagged"
      );

      return {
        open: openItems.length,
        inReview: inReviewItems.length,
        resolved: resolvedItems.length,
        flaggedUsers: flaggedUsers.length
      };
    },

    getSections() {
      const items = this.state.queueItems || [];
      return {
        open: items.filter((item) => item.status === "open"),
        inReview: items.filter((item) => item.status === "in_review"),
        resolved: items.filter((item) => item.status === "resolved")
      };
    },

    buildRelatedContentHtml(item) {
      const related = item._related;
      if (!related) {
        return `<div class="admin-meta"><strong>Related Content:</strong> Not found</div>`;
      }

      if (item.related_table === "messages") {
        return `
          <div class="admin-meta"><strong>Message Status:</strong> ${this.statusBadge(related.moderation_status)}</div>
          <div class="admin-meta"><strong>Delivery:</strong> ${this.escapeHtml(related.delivery_status || "")}</div>
          <div class="admin-meta"><strong>Risk Score:</strong> ${related.risk_score ?? 0}</div>
          ${related.moderation_reason ? `<div><strong>Reason:</strong> ${this.escapeHtml(related.moderation_reason)}</div>` : ""}
          <div><strong>Message:</strong> ${this.escapeHtml(related.message_text || "")}</div>
        `;
      }

      if (item.related_table === "caregiver_profile_versions") {
        return `
          <div class="admin-meta"><strong>Version Status:</strong> ${this.statusBadge(related.content_status)}</div>
          <div class="admin-meta"><strong>Name:</strong> ${this.escapeHtml(related.name_display || "")}</div>
          <div class="admin-meta"><strong>Location:</strong> ${this.escapeHtml(related.location || "")}</div>
          <div class="admin-meta"><strong>Care Types:</strong> ${this.escapeHtml(Array.isArray(related.care_types) ? related.care_types.join(", ") : "")}</div>
          ${related.bio ? `<div><strong>Bio:</strong> ${this.escapeHtml(this.truncateText(related.bio, 300))}</div>` : ""}
        `;
      }

      if (item.related_table === "family_profile_versions") {
        return `
          <div class="admin-meta"><strong>Version Status:</strong> ${this.statusBadge(related.content_status)}</div>
          <div class="admin-meta"><strong>Name:</strong> ${this.escapeHtml(related.name_display || "")}</div>
          <div class="admin-meta"><strong>Location:</strong> ${this.escapeHtml(related.location || "")}</div>
          <div class="admin-meta"><strong>Care Needed:</strong> ${this.escapeHtml(Array.isArray(related.care_types_needed) ? related.care_types_needed.join(", ") : "")}</div>
          ${related.household_description ? `<div><strong>Household:</strong> ${this.escapeHtml(this.truncateText(related.household_description, 300))}</div>` : ""}
        `;
      }

      if (item.related_table === "caregiver_reviews" || item.related_table === "family_reviews") {
        return `
          <div class="admin-meta"><strong>Review Status:</strong> ${this.statusBadge(related.content_status)}</div>
          <div class="admin-meta"><strong>Rating:</strong> ${this.escapeHtml(related.rating || "")}</div>
          <div><strong>Review Text:</strong> ${this.escapeHtml(related.review_text || "")}</div>
        `;
      }

      if (item.related_table === "job_post_versions") {
        return `
          <div class="admin-meta"><strong>Job Status:</strong> ${this.statusBadge(related.content_status)}</div>
          <div class="admin-meta"><strong>Title:</strong> ${this.escapeHtml(related.title || "")}</div>
          <div class="admin-meta"><strong>Care Type:</strong> ${this.escapeHtml(related.care_type || "")}</div>
          <div class="admin-meta"><strong>Location:</strong> ${this.escapeHtml(related.location || "")}</div>
          ${related.description ? `<div><strong>Description:</strong> ${this.escapeHtml(this.truncateText(related.description, 300))}</div>` : ""}
        `;
      }

      if (item.related_table === "user_risk_profiles") {
        return `
          <div class="admin-meta"><strong>Account Status:</strong> ${this.statusBadge(related.account_status)}</div>
          <div class="admin-meta"><strong>Risk Score:</strong> ${related.risk_score ?? 0}</div>
          <div class="admin-meta"><strong>Risk Level:</strong> ${this.escapeHtml(related.risk_level || "")}</div>
        `;
      }

      return `<pre style="white-space:pre-wrap;">${this.escapeHtml(JSON.stringify(related, null, 2))}</pre>`;
    },

    buildUserRiskHtml(item) {
      const risk = item._risk;

      if (!risk) {
        return `<div class="admin-meta"><strong>User Risk:</strong> No user risk profile found</div>`;
      }

      return `
        <div class="admin-meta"><strong>Account:</strong> ${this.statusBadge(risk.account_status)}</div>
        <div class="admin-meta"><strong>Risk Score:</strong> ${risk.risk_score ?? 0}</div>
        <div class="admin-meta"><strong>Risk Level:</strong> ${this.escapeHtml(risk.risk_level || "")}</div>
        ${risk.flag_reason ? `<div><strong>Flag Reason:</strong> ${this.escapeHtml(risk.flag_reason)}</div>` : ""}
        ${risk.flag_source_type ? `<div><strong>Flag Source:</strong> ${this.escapeHtml(risk.flag_source_type)}</div>` : ""}
      `;
    },

    canApprove(item) {
      return [
        "messages",
        "caregiver_profile_versions",
        "family_profile_versions"
      ].includes(item.related_table);
    },

    canReject(item) {
      return [
        "messages",
        "caregiver_profile_versions",
        "family_profile_versions"
      ].includes(item.related_table);
    },

    buildActionButtons(item) {
      const canAssign = item.status === "open";
      const canMoveInReview = item.status === "open";
      const canResolve = item.status === "open" || item.status === "in_review";

      return `
        <div class="admin-actions">
          ${canAssign ? `<button class="button-admin" data-action="assign" data-id="${item.id}">Assign to Me</button>` : ""}
          ${canMoveInReview ? `<button class="button-admin" data-action="in_review" data-id="${item.id}">Mark In Review</button>` : ""}
          ${canResolve && this.canApprove(item) ? `<button class="button-admin button-approve" data-action="approve_content" data-id="${item.id}">Approve</button>` : ""}
          ${canResolve && this.canReject(item) ? `<button class="button-admin button-deny" data-action="reject_content" data-id="${item.id}">Reject</button>` : ""}
          ${canResolve ? `<button class="button-admin" data-action="resolve_kept_flagged" data-id="${item.id}">Keep Flagged</button>` : ""}
          ${canResolve ? `<button class="button-admin" data-action="resolve_restored_account" data-id="${item.id}">Restore Account</button>` : ""}
          ${canResolve ? `<button class="button-admin button-deny" data-action="resolve_frozen_account" data-id="${item.id}">Freeze</button>` : ""}
          ${canResolve ? `<button class="button-admin button-delete" data-action="resolve_banned_account" data-id="${item.id}">Ban</button>` : ""}
          ${canResolve ? `<button class="button-admin" data-action="resolve_dismissed" data-id="${item.id}">Dismiss</button>` : ""}
        </div>
      `;
    },

    renderQueueCard(item) {
      const assignedLabel = item.assigned_to ? "Assigned" : "Unassigned";

      return `
        <div class="admin-card">
          <div class="admin-card-top">
            <div>
              <h3>${this.escapeHtml(this.getQueueTitle(item))}</h3>
              <div class="admin-meta">
                ${this.priorityBadge(item.priority)}
                ${this.statusBadge(item.status)}
              </div>
              <div class="admin-meta"><strong>Created:</strong> ${this.escapeHtml(this.fmtDate(item.created_at))}</div>
              <div class="admin-meta"><strong>Queue Type:</strong> ${this.escapeHtml(item.queue_type || "")}</div>
              <div class="admin-meta"><strong>Assigned:</strong> ${this.escapeHtml(assignedLabel)}</div>
              <div class="admin-meta"><strong>Summary:</strong> ${this.escapeHtml(item.summary || "")}</div>
              <div class="admin-meta"><strong>User ID:</strong> ${this.escapeHtml(item.user_id || "")}</div>
              ${this.buildUserRiskHtml(item)}
              <div class="mt-16"><strong>Related Content</strong></div>
              ${this.buildRelatedContentHtml(item)}
              ${item.resolution ? `<div class="mt-16"><strong>Resolution:</strong> ${this.escapeHtml(item.resolution)}</div>` : ""}
              ${item.review_notes ? `<div><strong>Notes:</strong> ${this.escapeHtml(item.review_notes)}</div>` : ""}
            </div>
            <div>
              ${this.buildActionButtons(item)}
            </div>
          </div>
        </div>
      `;
    },

    renderQueueSection(container, items, emptyText) {
      if (!container) return;

      if (!items.length) {
        container.innerHTML = `<div class="admin-empty">${this.escapeHtml(emptyText)}</div>`;
        return;
      }

      container.innerHTML = items.map((item) => this.renderQueueCard(item)).join("");
    },

    bindActionButtons(root, onAction) {
      root.querySelectorAll("[data-action]").forEach((button) => {
        button.addEventListener("click", async () => {
          const action = button.dataset.action;
          const id = button.dataset.id;
          if (!action || !id) return;
          await onAction(action, id);
        });
      });
    },

    async updateQueueItem(id, patch) {
      const { error } = await window.db
        .from("admin_review_queue")
        .update(patch)
        .eq("id", id);

      if (error) throw error;
      return true;
    },

    async updateUserAccountStatus(userId, accountStatus) {
      const patch = {
        account_status: accountStatus,
        updated_at: new Date().toISOString()
      };

      if (accountStatus === "normal") {
        patch.flagged_at = null;
        patch.flag_reason = null;
        patch.flag_source_type = null;
        patch.flag_source_id = null;
      }

      const { error } = await window.db
        .from("user_risk_profiles")
        .update(patch)
        .eq("user_id", userId);

      if (error) throw error;
      return true;
    },

    async invoke(functionName, body) {
      const { data, error } = await window.db.functions.invoke(functionName, { body });

      if (error) throw error;
      if (!data?.success) {
        throw new Error(`${functionName} failed`);
      }

      return data;
    },

    async approveContent(item) {
      if (item.related_table === "messages") {
        return await this.invoke("approve-held-message", {
          messageId: item.related_id,
          notes: "Approved from admin dashboard"
        });
      }

      if (item.related_table === "caregiver_profile_versions") {
        return await this.invoke("approve-caregiver-profile-version", {
          versionId: item.related_id,
          notes: "Approved from admin dashboard"
        });
      }

      if (item.related_table === "family_profile_versions") {
        return await this.invoke("approve-family-profile-version", {
          versionId: item.related_id,
          notes: "Approved from admin dashboard"
        });
      }

      throw new Error("Approve is not wired yet for this content type.");
    },

    async rejectContent(item) {
      if (item.related_table === "messages") {
        return await this.invoke("reject-held-message", {
          messageId: item.related_id,
          notes: "Rejected from admin dashboard"
        });
      }

      if (item.related_table === "caregiver_profile_versions") {
        return await this.invoke("reject-caregiver-profile-version", {
          versionId: item.related_id,
          notes: "Rejected from admin dashboard"
        });
      }

      if (item.related_table === "family_profile_versions") {
        return await this.invoke("reject-family-profile-version", {
          versionId: item.related_id,
          notes: "Rejected from admin dashboard"
        });
      }

      throw new Error("Reject is not wired yet for this content type.");
    },

    async handleQueueAction(action, queueId) {
      const item = this.state.queueItems.find((x) => x.id === queueId);
      if (!item) return false;

      if (action === "assign") {
        await this.updateQueueItem(queueId, {
          assigned_to: this.state.adminUser.id
        });
        return true;
      }

      if (action === "in_review") {
        await this.updateQueueItem(queueId, {
          status: "in_review",
          assigned_to: item.assigned_to || this.state.adminUser.id
        });
        return true;
      }

      if (action === "approve_content") {
        await this.approveContent(item);
        return true;
      }

      if (action === "reject_content") {
        await this.rejectContent(item);
        return true;
      }

      const resolutionMap = {
        resolve_kept_flagged: "kept_flagged",
        resolve_restored_account: "restored_account",
        resolve_frozen_account: "frozen_account",
        resolve_banned_account: "banned_account",
        resolve_dismissed: "dismissed"
      };

      const resolution = resolutionMap[action];
      if (!resolution) return false;

      let accountStatus = null;
      if (resolution === "restored_account" || resolution === "dismissed") {
        accountStatus = "normal";
      } else if (resolution === "kept_flagged") {
        accountStatus = "flagged";
      } else if (resolution === "frozen_account") {
        accountStatus = "frozen";
      } else if (resolution === "banned_account") {
        accountStatus = "banned";
      }

      if (accountStatus) {
        await this.updateUserAccountStatus(item.user_id, accountStatus);
      }

      await this.updateQueueItem(queueId, {
        status: "resolved",
        assigned_to: item.assigned_to || this.state.adminUser.id,
        resolved_at: new Date().toISOString(),
        resolution
      });

      return true;
    }
  };

  window.GroveAdmin = GroveAdmin;
})();
