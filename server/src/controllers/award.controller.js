import * as awardService from "../services/award.service.js";

/* =======================================================
   JVP COASTAL YOUTH EXCELLENCE AWARDS
======================================================= */

// Public: list active award categories
export const getAwardCategories = async (req, res, next) => {
  try {
    const categories = await awardService.getAwardCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Secretariat/admin: list all categories, including drafts
export const getAdminAwardCategories = async (req, res, next) => {
  try {
    const categories = await awardService.getAwardCategories({
      includeInactive: true,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// Secretariat/admin: create a draft category
export const createAwardCategory = async (req, res, next) => {
  try {
    const category = await awardService.createAwardCategory({
      ...req.body,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Award category created successfully as a draft.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// Secretariat/admin: activate or deactivate an award category
export const updateAwardCategoryStatus = async (req, res, next) => {
  try {
    const category = await awardService.updateAwardCategoryStatus({
      categoryId: req.params.categoryId,
      status: req.body.status,
      updatedBy: req.user._id,
    });

    res.json({
      success: true,
      message: `Award category ${category.status === "active" ? "activated" : "deactivated"} successfully.`,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};


export const updateAwardCategoryNominationSettingsController = async (
  req,
  res,
  next
) => {
  try {
    const category =
      await awardService.updateAwardCategoryNominationSettings({
        categoryId: req.params.categoryId,
        enabled: req.body.enabled,
        opensAt: req.body.opensAt,
        closesAt: req.body.closesAt,
        updatedBy: req.user._id,
      });

    return res.status(200).json({
      success: true,
      message: "Nomination settings updated successfully.",
      data: category,
    });
  } catch (error) {
    next(error);
  }
};


/* PUBLIC — SUBMIT AN AWARD NOMINATION */
export const submitPublicAwardNomination = async (req, res, next) => {
  try {
    const result = await awardService.submitPublicAwardNomination({
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") || "",
    });

    return res.status(201).json({
      success: true,
      message: "Your nomination has been submitted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


/* =======================================================
   ADMIN / SECRETARIAT — NOMINATION REVIEW
======================================================= */

// List nominations with optional status/category filters.
export const getAdminAwardNominations = async (req, res, next) => {
  try {
    const result = await awardService.getAdminAwardNominations({
      status: req.query.status,
      categoryId: req.query.categoryId,
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.status(200).json({
      success: true,
      data: result.nominations,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

// Mark a nomination under review, approve it, or reject it.
export const reviewAwardNomination = async (req, res, next) => {
  try {
    const nomination = await awardService.reviewAwardNomination({
      nominationId: req.params.nominationId,
      decision: req.body.decision,
      reviewNotes: req.body.reviewNotes,
      rejectionReason: req.body.rejectionReason,
      reviewedBy: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: `Nomination ${nomination.status.replace("_", " ")} successfully.`,
      data: nomination,
    });
  } catch (error) {
    next(error);
  }
};
