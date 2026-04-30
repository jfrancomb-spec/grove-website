function buildSupabaseStubScript({
  sessionUser = null,
  familyProfile = null,
  familyProfiles = [],
  caregiverProfile = null,
  familyProfileVersions = [],
  caregiverProfileVersions = [],
  jobPosts = [],
  jobApplications = [],
  jobPostVersions = [],
  familyReviews = [],
  caregiverReviews = [],
  adminUser = null,
  conversationParticipants = [],
  conversations = [],
  messages = []
} = {}) {
  const normalizedFamilyProfile = familyProfile
    ? {
        user_id: sessionUser?.id || null,
        is_active: true,
        ...familyProfile
      }
    : null;
  const normalizedCaregiverProfile = caregiverProfile
    ? {
        user_id: sessionUser?.id || null,
        is_active: true,
        ...caregiverProfile
      }
    : null;

  return `
    (function () {
      const fixtures = {
        familyProfile: ${JSON.stringify(normalizedFamilyProfile)},
        familyProfiles: ${JSON.stringify(familyProfiles)},
        caregiverProfile: ${JSON.stringify(normalizedCaregiverProfile)},
        familyProfileVersions: ${JSON.stringify(familyProfileVersions)},
        caregiverProfileVersions: ${JSON.stringify(caregiverProfileVersions)},
        jobPosts: ${JSON.stringify(jobPosts)},
        jobApplications: ${JSON.stringify(jobApplications)},
        jobPostVersions: ${JSON.stringify(jobPostVersions)},
        familyReviews: ${JSON.stringify(familyReviews)},
        caregiverReviews: ${JSON.stringify(caregiverReviews)},
        adminUser: ${JSON.stringify(adminUser)},
        conversationParticipants: ${JSON.stringify(conversationParticipants)},
        conversations: ${JSON.stringify(conversations)},
        messages: ${JSON.stringify(messages)}
      };

      function matchesFilters(row, filters) {
        return filters.every((filter) => {
          if (filter.type === "eq") {
            return row?.[filter.column] === filter.value;
          }
          if (filter.type === "neq") {
            return row?.[filter.column] !== filter.value;
          }
          if (filter.type === "in") {
            return Array.isArray(filter.value) && filter.value.includes(row?.[filter.column]);
          }
          if (filter.type === "not-null") {
            return row?.[filter.column] != null;
          }
          if (filter.type === "not-eq") {
            return row?.[filter.column] !== filter.value;
          }
          return true;
        });
      }

      function getRowsForTable(table) {
        switch (table) {
          case "family_profiles":
            return [
              ...(fixtures.familyProfile ? [fixtures.familyProfile] : []),
              ...((fixtures.familyProfiles || []).filter(Boolean))
            ];
          case "caregiver_profiles":
            return fixtures.caregiverProfile ? [fixtures.caregiverProfile] : [];
          case "family_profile_versions":
            return fixtures.familyProfileVersions || [];
          case "caregiver_profile_versions":
            return fixtures.caregiverProfileVersions || [];
          case "job_posts":
            return fixtures.jobPosts || [];
          case "job_applications":
            return fixtures.jobApplications || [];
          case "job_post_versions":
            return fixtures.jobPostVersions || [];
          case "family_reviews":
            return fixtures.familyReviews || [];
          case "caregiver_reviews":
            return fixtures.caregiverReviews || [];
          case "admin_users":
            return fixtures.adminUser ? [fixtures.adminUser] : [];
          case "conversation_participants":
            return fixtures.conversationParticipants || [];
          case "conversations":
            return fixtures.conversations || [];
          case "messages":
            return fixtures.messages || [];
          default:
            return [];
        }
      }

      function createQuery(table) {
        const state = {
          filters: []
        };

        const query = {
          select() { return query; },
          eq(column, value) {
            state.filters.push({ type: "eq", column, value });
            return query;
          },
          neq(column, value) {
            state.filters.push({ type: "neq", column, value });
            return query;
          },
          in(column, value) {
            state.filters.push({ type: "in", column, value });
            return query;
          },
          not(column, operator, value) {
            if (operator === "is" && value === null) {
              state.filters.push({ type: "not-null", column });
            } else if (operator === "is") {
              state.filters.push({ type: "not-eq", column, value });
            }
            return query;
          },
          or() { return query; },
          order() { return query; },
          insert() { return query; },
          update() { return query; },
          single: async function () {
            const rows = getRowsForTable(table).filter((row) => matchesFilters(row, state.filters));
            return { data: rows[0] || null, error: null };
          },
          maybeSingle: async function () {
            const rows = getRowsForTable(table).filter((row) => matchesFilters(row, state.filters));
            return { data: rows[0] || null, error: null };
          },
          then(resolve) {
            const rows = getRowsForTable(table).filter((row) => matchesFilters(row, state.filters));
            return Promise.resolve({ data: rows, error: null, count: rows.length }).then(resolve);
          }
        };

        return query;
      }

      window.supabase = {
        createClient: function () {
          return {
            auth: {
              getSession: async function () {
                return { data: { session: ${JSON.stringify(sessionUser ? { user: sessionUser } : null)} } };
              },
              signInWithPassword: async function () {
                return { error: null };
              },
              signOut: async function () {
                return { error: null };
              }
            },
            from: function (table) {
              return createQuery(table);
            },
            rpc: async function () {
              return { data: { ok: true, content_status: "published" }, error: null };
            }
          };
        }
      };
    })();
  `;
}

async function stubExternalDeps(page, options = {}) {
  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: buildSupabaseStubScript(options)
    });
  });
}

module.exports = {
  stubExternalDeps
};
