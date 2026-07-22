import leaderService from "../services/leader.service.js";

/* ===========================================================
   CREATE LEADER
=========================================================== */

export const createLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.createLeader(
      req.body,
      req.user?._id
    );

    return res.status(201).json({
      success: true,
      message: "Leader assigned successfully.",
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   GET ALL LEADERS
=========================================================== */

export const getLeaders = async (req, res, next) => {
  try {
    const leaders = await leaderService.getLeaders(req.query);

    return res.status(200).json({
      success: true,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   GET PUBLIC LEADERS
=========================================================== */

export const getPublicLeaders = async (req, res, next) => {
  try {
    const leaders = await leaderService.getPublicLeaders();

    return res.status(200).json({
      success: true,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   GET LEADER
=========================================================== */

export const getLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.getLeaderById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   GET LEADERSHIP MEMBERS DASHBOARD
=========================================================== */

export const getLeadershipMembers = async (
  req,
  res,
  next
) => {
  try {
    const dashboard =
      await leaderService.getLeadershipMembers(
        req.user._id,
        req.query
      );

    return res.status(200).json({
      success: true,
      message: "Leadership dashboard retrieved successfully.",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   UPDATE LEADER
=========================================================== */

export const updateLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.updateLeader(
      req.params.id,
      req.body,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Leader updated successfully.",
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   ACTIVATE LEADER
=========================================================== */

export const activateLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.activateLeader(
      req.params.id,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Leader activated successfully.",
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   DEACTIVATE LEADER
=========================================================== */

export const deactivateLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.deactivateLeader(
      req.params.id,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Leader deactivated successfully.",
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   DELETE LEADER
=========================================================== */

export const deleteLeader = async (req, res, next) => {
  try {
    await leaderService.deleteLeader(req.params.id);

    return res.status(200).json({
      success: true,
      message: "Leader removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/* ===========================================================
   LEADER STATISTICS
=========================================================== */

export const getLeaderStatistics = async (
  req,
  res,
  next
) => {
  try {
    const statistics =
      await leaderService.getStatistics();

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};