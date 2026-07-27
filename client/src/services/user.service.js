import api from "./api";

/* ==========================================================
   MEETING DIRECTORY
========================================================== */

export const getMeetingDirectory = async ({
  page = 1,
  limit = 20,
  search = "",
  county = "",
  constituency = "",
  ward = "",
  leadershipOnly = false,
  excludeMe = true,
} = {}) => {
  const response = await api.get(
    "/users/meeting-directory",
    {
      params: {
        page,
        limit,
        search: search || undefined,
        county: county || undefined,
        constituency:
          constituency || undefined,
        ward: ward || undefined,
        leadershipOnly,
        excludeMe,
      },
    }
  );

  return response.data;
};