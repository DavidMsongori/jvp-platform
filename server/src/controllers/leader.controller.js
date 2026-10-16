
import leaderService from "../services/leader.service.js";

/* ============================================================
   RESPONSE HELPERS
============================================================ */

/**
 * Normalizes service list responses.
 * Supports both:
 *   - An array of leaders
 *   - { leaders: [...], pagination: {...} }
 */
const normalizeListResult = (result) => {
  if (Array.isArray(result)) {
    return {
      leaders: result,
      pagination: null,
    };
  }

  return {
    leaders: Array.isArray(result?.leaders)
      ? result.leaders
      : [],
    pagination: result?.pagination ?? null,
  };
};

const sendListResponse = (
  res,
  result,
  extra = {},
  message = undefined
) => {
  const { leaders, pagination } = normalizeListResult(result);

  return res.status(200).json({
    success: true,
    ...(message ? { message } : {}),
    ...extra,
    count: leaders.length,
    data: leaders,
    ...(pagination ? { pagination } : {}),
  });
};

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
    const result = await leaderService.getLeaders(req.query);

    return sendListResponse(res, result);
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET PUBLIC LEADERS
============================================================ */

export const getPublicLeaders = async (req, res, next) => {
  try {
    const result = await leaderService.getPublicLeaders(
      req.query
    );

    return sendListResponse(
      res,
      result,
      {},
      "Public leadership records retrieved successfully."
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADER BY ID
============================================================ */

export const getLeader = async (req, res, next) => {
  try {
    const leader = await leaderService.getLeader(
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

export const getLeadershipMembers = async (req, res, next) => {
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
      message: "Leadership dashboard retrieved successfully.",
      data: dashboard,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   UPDATE LEADER
============================================================ */

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

/* ============================================================
   ACTIVATE LEADER
============================================================ */

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

/* ============================================================
   ACTIVATE MULTIPLE LEADERS
============================================================ */

export const activateMany = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Provide an array of leadership IDs to activate.",
      });
    }

    const result = await leaderService.activateMany(
      ids,
      req.user?._id
    );

    return res.status(200).json({
      success: true,
      message: "Leadership records activated successfully.",
      ...(result !== undefined ? { data: result } : {}),
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   DEACTIVATE LEADER
============================================================ */

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

/* ============================================================
   DELETE LEADER
============================================================ */

export const deleteLeader = async (req, res, next) => {
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

export const getLeaderStatistics = async (req, res, next) => {
  try {
    const statistics = await leaderService.getStatistics();

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

export const getRegionalCabinet = async (req, res, next) => {
  try {
    const result = await leaderService.getRegionalCabinet(
      req.query
    );

    return sendListResponse(
      res,
      result,
      { structure: "regional_cabinet" }
    );
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
    const result =
      await leaderService.getRegionalYouthAssembly(
        req.query
      );

    return sendListResponse(
      res,
      result,
      { structure: "regional_youth_assembly" }
    );
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
    const result =
      await leaderService.getCouncilOfGovernors(
        req.query
      );

    return sendListResponse(
      res,
      result,
      { structure: "council_of_governors" }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   COUNTY CABINET
============================================================ */

export const getCountyCabinet = async (req, res, next) => {
  try {
    const county =
      req.params.county ||
      req.query.county ||
      null;

    const filters = {
      ...req.query,
      ...(county ? { county } : {}),
    };

    const result = await leaderService.getCountyCabinet(
      filters
    );

    return sendListResponse(
      res,
      result,
      {
        structure: "county_cabinet",
        county,
      }
    );
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
      req.params.county ||
      req.query.county ||
      null;

    const filters = {
      ...req.query,
      ...(county ? { county } : {}),
    };

    const result =
      await leaderService.getCountyYouthAssembly(
        filters
      );

    return sendListResponse(
      res,
      result,
      {
        structure: "county_youth_assembly",
        county,
      }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   PATRON
============================================================ */

export const getPatron = async (req, res, next) => {
  try {
    const patron = await leaderService.getPatron();

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
    const hierarchy = await leaderService.getHierarchy(
      req.query
    );

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

export const getVacantPositions = async (req, res, next) => {
  try {
    const result = await leaderService.getVacantPositions(
      req.query
    );

    // The service returns { total, vacancies }.
    // Also support an array for backward compatibility.
    const vacancies = Array.isArray(result)
      ? result
      : Array.isArray(result?.vacancies)
        ? result.vacancies
        : [];

    return res.status(200).json({
      success: true,
      count:
        typeof result?.total === "number"
          ? result.total
          : vacancies.length,
      data: vacancies,
    });
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADERS BY STRUCTURAL SCOPE
============================================================ */

export const getLeadersByScope = async (req, res, next) => {
  try {
    const scope =
      req.params.scope ||
      req.query.scope;

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(scope ? { scope } : {}),
    });

    return sendListResponse(
      res,
      result,
      { scope: scope ?? null }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADERS BY REPORT VISIBILITY
============================================================ */

export const getLeadersByReportVisibility = async (
  req,
  res,
  next
) => {
  try {
    const reportVisibility =
      req.params.reportVisibility ||
      req.query.reportVisibility;

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(reportVisibility ? { reportVisibility } : {}),
    });

    return sendListResponse(
      res,
      result,
      { reportVisibility: reportVisibility ?? null }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADERS BY COUNTY
============================================================ */

export const getLeadersByCounty = async (req, res, next) => {
  try {
    const county =
      req.params.county ||
      req.query.county;

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(county ? { county } : {}),
    });

    return sendListResponse(
      res,
      result,
      { county: county ?? null }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADERS BY CONSTITUENCY
============================================================ */

export const getLeadersByConstituency = async (
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

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(county ? { county } : {}),
      ...(constituency ? { constituency } : {}),
    });

    return sendListResponse(
      res,
      result,
      {
        county: county ?? null,
        constituency: constituency ?? null,
      }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET LEADERS BY WARD
============================================================ */

export const getLeadersByWard = async (req, res, next) => {
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

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(county ? { county } : {}),
      ...(constituency ? { constituency } : {}),
      ...(ward ? { ward } : {}),
    });

    return sendListResponse(
      res,
      result,
      {
        county: county ?? null,
        constituency: constituency ?? null,
        ward: ward ?? null,
      }
    );
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

    const result = await leaderService.getLeaders({
      ...req.query,
      ...(position ? { position } : {}),
    });

    return sendListResponse(
      res,
      result,
      { position: position ?? null }
    );
  } catch (error) {
    next(error);
  }
};

/* ============================================================
   GET CABINET SECRETARY BY PORTFOLIO
============================================================ */

export const getCabinetSecretaryByPortfolio = async (
  req,
  res,
  next
) => {
  try {
    const { portfolioKey } = req.params;

    if (!portfolioKey) {
      return res.status(400).json({
        success: false,
        message:
          "A Cabinet Secretary portfolio key is required.",
      });
    }

    const leader =
      await leaderService.getCabinetSecretaryByPortfolio(
        portfolioKey
      );

    return res.status(200).json({
      success: true,
      data: leader,
    });
  } catch (error) {
    next(error);
  }
};