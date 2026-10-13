
import * as programService from "../services/program.service.js";

/* ==========================================================
   CREATE PROGRAM
========================================================== */

export const createProgram = async (req, res, next) => {
  try {
    const program = await programService.createProgram(
      req.body,
      req.files,
      req.user.id
    );

    return res.status(201).json({
      success: true,
      message: "Program created successfully.",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   UPDATE PROGRAM
========================================================== */

export const updateProgram = async (req, res, next) => {
  try {
    const program = await programService.updateProgram(
      req.params.id,
      req.body,
      req.files,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Program updated successfully.",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET ALL PROGRAMS
   Supports pagination, search, filters, and sorting.
========================================================== */

export const getAllPrograms = async (req, res, next) => {
  try {
    const result = await programService.getAllPrograms(
      req.query
    );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET PROGRAM BY ID
========================================================== */

export const getProgramById = async (req, res, next) => {
  try {
    const program = await programService.getProgramById(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET PUBLISHED PROGRAM BY SLUG
========================================================== */

export const getProgramBySlug = async (req, res, next) => {
  try {
    const program = await programService.getProgramBySlug(
      req.params.slug
    );

    return res.status(200).json({
      success: true,
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET FEATURED PROGRAMS
========================================================== */

export const getFeaturedPrograms = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 6;

    const programs = await programService.getFeaturedPrograms(
      limit
    );

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET UPCOMING PROGRAMS
========================================================== */

export const getUpcomingPrograms = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;

    const programs = await programService.getUpcomingPrograms(
      limit
    );

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET ONGOING PROGRAMS
========================================================== */

export const getOngoingPrograms = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;

    const programs = await programService.getOngoingPrograms(
      limit
    );

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET PROGRAMS BY CATEGORY
========================================================== */

export const getProgramsByCategory = async (
  req,
  res,
  next
) => {
  try {
    const { category } = req.params;
    const limit = Number(req.query.limit) || 20;

    const programs =
      await programService.getProgramsByCategory(
        category,
        limit
      );

    return res.status(200).json({
      success: true,
      count: programs.length,
      data: programs,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET CHILD ACTIVITIES / RECORDS
========================================================== */

export const getProgramActivities = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await programService.getProgramActivities(
        req.params.parentProgramId,
        req.query
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   PUBLISH PROGRAM
========================================================== */

export const publishProgram = async (req, res, next) => {
  try {
    const program = await programService.publishProgram(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Program published successfully.",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   UNPUBLISH PROGRAM
========================================================== */

export const unpublishProgram = async (req, res, next) => {
  try {
    const program = await programService.unpublishProgram(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Program unpublished successfully.",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   UPDATE PROGRAM IMPACT
========================================================== */

export const updateProgramImpact = async (
  req,
  res,
  next
) => {
  try {
    const program = await programService.updateProgramImpact(
      req.params.id,
      req.body,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: "Program impact updated successfully.",
      data: program,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   DELETE PROGRAM
========================================================== */

export const deleteProgram = async (req, res, next) => {
  try {
    const result = await programService.deleteProgram(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        programId: result.programId,
      },
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   PROGRAM DASHBOARD STATISTICS
========================================================== */

export const getProgramDashboardStatistics = async (
  req,
  res,
  next
) => {
  try {
    const statistics =
      await programService.getProgramDashboardStatistics();

    return res.status(200).json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    next(error);
  }
};


/* ===========================================================
   GET PUBLIC PROGRAM ACTIVITIES
=========================================================== */

export const getPublicProgramActivities = async (req, res, next) => {
  try {
    const result = await programService.getPublicProgramActivities(
      req.params.parentProgramId
    );

    return res.status(200).json({
      success: true,
      message: "Program activities retrieved successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};