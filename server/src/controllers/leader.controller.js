import leaderService from "../services/leader.service.js";

/* ============================================================
   CREATE LEADER
============================================================ */

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


/* ============================================================
   GET ALL LEADERS
============================================================ */

export const getLeaders = async (req, res, next) => {
  try {
    const leaders = await leaderService.getLeaders(
      req.query
    );

    return res.status(200).json({
      success: true,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET PUBLIC LEADERS
============================================================ */

export const getPublicLeaders = async (
  req,
  res,
  next
) => {
  try {
    const leaders =
      await leaderService.getPublicLeaders();

    return res.status(200).json({
      success: true,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET LEADER BY ID
============================================================ */

export const getLeader = async (
  req,
  res,
  next
) => {
  try {
    const leader =
      await leaderService.getLeaderById(
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


/* ============================================================
   GET LEADERSHIP MEMBERS DASHBOARD
============================================================ */

export const getLeadershipMembers = async (
  req,
  res,
  next
) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const dashboard =
      await leaderService.getLeadershipMembers(
        req.user._id,
        req.query
      );

    return res.status(200).json({
      success: true,
      message:
        "Leadership dashboard retrieved successfully.",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   UPDATE LEADER
============================================================ */

export const updateLeader = async (
  req,
  res,
  next
) => {
  try {
    const leader =
      await leaderService.updateLeader(
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


/* ============================================================
   ACTIVATE LEADER
============================================================ */

export const activateLeader = async (
  req,
  res,
  next
) => {
  try {
    const leader =
      await leaderService.activateLeader(
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


/* ============================================================
   DEACTIVATE LEADER
============================================================ */

export const deactivateLeader = async (
  req,
  res,
  next
) => {
  try {
    const leader =
      await leaderService.deactivateLeader(
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


/* ============================================================
   DELETE LEADER
============================================================ */

export const deleteLeader = async (
  req,
  res,
  next
) => {
  try {
    await leaderService.deleteLeader(
      req.params.id,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Leader removed successfully.",
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   LEADER STATISTICS
============================================================ */

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


/* ============================================================
   REGIONAL CABINET
============================================================ */

export const getRegionalCabinet = async (
  req,
  res,
  next
) => {
  try {
    const leaders =
      await leaderService.getRegionalCabinet();

    return res.status(200).json({
      success: true,
      structure: "regional_cabinet",
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   REGIONAL YOUTH ASSEMBLY
============================================================ */

export const getRegionalYouthAssembly = async (
  req,
  res,
  next
) => {
  try {
    const leaders =
      await leaderService.getRegionalYouthAssembly();

    return res.status(200).json({
      success: true,
      structure: "regional_youth_assembly",
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   COUNCIL OF GOVERNORS
============================================================ */

export const getCouncilOfGovernors = async (
  req,
  res,
  next
) => {
  try {
    const leaders =
      await leaderService.getCouncilOfGovernors();

    return res.status(200).json({
      success: true,
      structure: "council_of_governors",
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   COUNTY CABINET
============================================================ */

export const getCountyCabinet = async (
  req,
  res,
  next
) => {
  try {
    const county =
      req.query.county ||
      req.params.county ||
      null;

    const leaders =
      await leaderService.getCountyCabinet(
        county
      );

    return res.status(200).json({
      success: true,
      structure: "county_cabinet",
      county,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   COUNTY YOUTH ASSEMBLY
============================================================ */

export const getCountyYouthAssembly = async (
  req,
  res,
  next
) => {
  try {
    const county =
      req.query.county ||
      req.params.county ||
      null;

    const leaders =
      await leaderService.getCountyYouthAssembly(
        county
      );

    return res.status(200).json({
      success: true,
      structure: "county_youth_assembly",
      county,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   PATRON
============================================================ */

export const getPatron = async (
  req,
  res,
  next
) => {
  try {
    const patron =
      await leaderService.getPatron();

    return res.status(200).json({
      success: true,
      data: patron,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   COMPLETE LEADERSHIP HIERARCHY
============================================================ */

export const getLeadershipHierarchy = async (
  req,
  res,
  next
) => {
  try {
    const hierarchy =
      await leaderService.getHierarchy();

    return res.status(200).json({
      success: true,
      data: hierarchy,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET VACANT POSITIONS
============================================================ */

export const getVacantPositions = async (
  req,
  res,
  next
) => {
  try {
    const vacancies =
      await leaderService.getVacantPositions(
        req.query
      );

    return res.status(200).json({
      success: true,
      count: vacancies.length,
      data: vacancies,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET LEADERS BY STRUCTURAL SCOPE
============================================================ */

export const getLeadersByScope = async (
  req,
  res,
  next
) => {
  try {
    const scope =
      req.params.scope ||
      req.query.scope;

    const leaders =
      await leaderService.getLeaders({
        ...req.query,
        scope,
      });

    return res.status(200).json({
      success: true,
      scope,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET LEADERS BY REPORT VISIBILITY
============================================================ */

export const getLeadersByReportVisibility =
  async (
    req,
    res,
    next
  ) => {
    try {
      const reportVisibility =
        req.params.reportVisibility ||
        req.query.reportVisibility;

      const leaders =
        await leaderService.getLeaders({
          ...req.query,
          reportVisibility,
        });

      return res.status(200).json({
        success: true,
        reportVisibility,
        count: leaders.length,
        data: leaders,
      });
    } catch (error) {
      next(error);
    }
  };


/* ============================================================
   GET LEADERS BY COUNTY
============================================================ */

export const getLeadersByCounty = async (
  req,
  res,
  next
) => {
  try {
    const county =
      req.params.county ||
      req.query.county;

    const leaders =
      await leaderService.getLeaders({
        ...req.query,
        county,
      });

    return res.status(200).json({
      success: true,
      county,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET LEADERS BY CONSTITUENCY
============================================================ */

export const getLeadersByConstituency =
  async (
    req,
    res,
    next
  ) => {
    try {
      const county =
        req.params.county ||
        req.query.county;

      const constituency =
        req.params.constituency ||
        req.query.constituency;

      const leaders =
        await leaderService.getLeaders({
          ...req.query,
          county,
          constituency,
        });

      return res.status(200).json({
        success: true,
        county,
        constituency,
        count: leaders.length,
        data: leaders,
      });
    } catch (error) {
      next(error);
    }
  };


/* ============================================================
   GET LEADERS BY WARD
============================================================ */

export const getLeadersByWard = async (
  req,
  res,
  next
) => {
  try {
    const county =
      req.params.county ||
      req.query.county;

    const constituency =
      req.params.constituency ||
      req.query.constituency;

    const ward =
      req.params.ward ||
      req.query.ward;

    const leaders =
      await leaderService.getLeaders({
        ...req.query,
        county,
        constituency,
        ward,
      });

    return res.status(200).json({
      success: true,
      county,
      constituency,
      ward,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};


/* ============================================================
   GET LEADERS BY POSITION
============================================================ */

export const getLeadersByPosition = async (
  req,
  res,
  next
) => {
  try {
    const position =
      req.params.position ||
      req.query.position;

    const leaders =
      await leaderService.getLeaders({
        ...req.query,
        position,
      });

    return res.status(200).json({
      success: true,
      position,
      count: leaders.length,
      data: leaders,
    });
  } catch (error) {
    next(error);
  }
};