import {
  getMeetingDirectory,
} from "../services/user.service.js";

/* ==========================================================
   GET MEETING DIRECTORY
========================================================== */

export const getMeetingDirectoryController =
  async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        county = "",
        constituency = "",
        ward = "",
        leadershipOnly = false,
        excludeMe = false,
      } = req.query;

      const directory =
        await getMeetingDirectory({
          page,
          limit,
          search,
          county,
          constituency,
          ward,
          leadershipOnly,
          excludeUserId:
            excludeMe === "true"
              ? req.user?._id || req.user?.id
              : null,
        });

      return res.status(200).json({
        success: true,
        message:
          "Meeting directory retrieved successfully.",
        data: directory.users,
        pagination: directory.pagination,
      });
    } catch (error) {
      next(error);
    }
  };