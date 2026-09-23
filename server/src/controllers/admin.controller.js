import * as adminService from "../services/admin.service.js";
import * as adminMemberService from "../services/adminMember.service.js";
import * as authService from "../services/auth.service.js";

/* ==========================================================
   ADMIN DASHBOARD
========================================================== */

export const getDashboard = async (
  req,
  res,
  next
) => {
  try {
    const dashboard =
      await adminService.getDashboard();

    return res.status(200).json({
      success: true,
      message:
        "Dashboard retrieved successfully.",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   MEMBER MANAGEMENT
========================================================== */

/**
 * GET /admin/members
 */
export const getMembers = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.getMembers(
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Members retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/members/:id
 */
export const getMemberById = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.getMemberProfile(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Member profile retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/members/:id
 */
export const updateMember = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.updateMember(
        req.params.id,
        req.body,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Member updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/members/:id/activate
 */
export const activateMember = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.activateMember(
        req.params.id,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Member activated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/members/:id/deactivate
 */
export const deactivateMember = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.deactivateMember(
        req.params.id,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Member deactivated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/members/:id
 */
export const deleteMember = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminMemberService.deleteMember(
        req.params.id,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   REPAIR MISSING MEMBERSHIP NUMBERS
========================================================== */

/**
 * POST /admin/members/repair-missing-membership-numbers
 *
 * Finds activated members without a membership number
 * and assigns unique membership numbers using the existing
 * county counters.
 */
export const repairMissingMembershipNumbers =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await authService.repairMissingMembershipNumbers();

      return res.status(200).json({
        success: true,

        message:
          result.repairedCount > 0
            ? `${result.repairedCount} missing membership number(s) repaired successfully.`
            : "No missing membership numbers required repair.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

/* ==========================================================
   PAYMENT MANAGEMENT
========================================================== */

/**
 * GET /admin/payments
 */
export const getPayments = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.getPayments(
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Payments retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /admin/payments/:id/verify
 */
export const verifyPayment = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.verifyPayment(
        req.params.id,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Payment verified successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   EVENT MANAGEMENT
========================================================== */

/**
 * GET /admin/events
 */
export const getEvents = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.getEvents(
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Events retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/events/:id
 */
export const getEventById = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.getEventById(
        req.params.id
      );

    return res.status(200).json({
      success: true,
      message:
        "Event retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/events
 */
export const createEvent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.createEvent(
        req.body,
        req.user._id
      );

    return res.status(201).json({
      success: true,
      message:
        "Event created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/events/:id
 */
export const updateEvent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.updateEvent(
        req.params.id,
        req.body,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        "Event updated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/events/:id
 */
export const deleteEvent = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.deleteEvent(
        req.params.id,
        req.user._id
      );

    return res.status(200).json({
      success: true,
      message:
        result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   REPORTS
========================================================== */

/**
 * GET /admin/reports
 */
export const getReports = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.getReports();

    return res.status(200).json({
      success: true,
      message:
        "Reports generated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   ACTIVITY LOGS
========================================================== */

/**
 * GET /admin/activity
 */
export const getActivityLogs = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await adminService.getActivityLogs(
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Activity logs retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};