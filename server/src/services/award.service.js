
import AwardCategory from "../models/AwardCategory.js";
import AwardAuditLog from "../models/AwardAuditLog.js";
import AwardNomination from "../models/AwardNomination.js";

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const createSlug = (name) =>
  name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getAwardCategories = async ({
  includeInactive = false,
} = {}) => {
  const filter = includeInactive
    ? {}
    : { status: "active" };

  return AwardCategory.find(filter)
    .sort({ displayOrder: 1, createdAt: 1 })
    .lean();
};

export const createAwardCategory = async ({
  name,
  description = "",
  icon,
  categoryType = "open",
  eligibility,
  nominationSettings,
  votingSettings,
  displayOrder = 0,
  createdBy,
}) => {
  if (!name?.trim()) {
    throw createHttpError(
      "Award category name is required.",
      400
    );
  }

  if (!createdBy) {
    throw createHttpError(
      "The authenticated creator is required.",
      401
    );
  }

  const categoryName = name.trim();
  const slug = createSlug(categoryName);

  if (!slug) {
    throw createHttpError(
      "A valid category name is required.",
      400
    );
  }

  const existingCategory = await AwardCategory.findOne({
    $or: [
      {
        name: {
          $regex: `^${categoryName.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          )}$`,
          $options: "i",
        },
      },
      { slug },
    ],
  });

  if (existingCategory) {
    throw createHttpError(
      "An award category with this name already exists.",
      409
    );
  }

  const category = await AwardCategory.create({
    name: categoryName,
    slug,
    description,
    ...(icon ? { icon } : {}),
    categoryType,
    ...(eligibility ? { eligibility } : {}),
    ...(nominationSettings ? { nominationSettings } : {}),
    ...(votingSettings ? { votingSettings } : {}),
    displayOrder,
    status: "draft",
    createdBy,
  });

  await AwardAuditLog.create({
    user: createdBy,
    action: "category_created",
    targetType: "category",
    targetId: category._id,
    category: category._id,
    outcome: "success",
    metadata: {
      categoryName: category.name,
      categoryType: category.categoryType,
      status: category.status,
    },
  });

  return category;
};


export const updateAwardCategoryStatus = async ({
  categoryId,
  status,
  updatedBy,
}) => {
  const allowedStatuses = ["active", "inactive"];

  if (!categoryId) {
    throw createHttpError(
      "Award category ID is required.",
      400
    );
  }

  if (!allowedStatuses.includes(status)) {
    throw createHttpError(
      "Status must be active or inactive.",
      400
    );
  }

  if (!updatedBy) {
    throw createHttpError(
      "The authenticated administrator is required.",
      401
    );
  }

  const category = await AwardCategory.findById(categoryId);

  if (!category) {
    throw createHttpError(
      "Award category not found.",
      404
    );
  }

  const previousStatus = category.status;

  category.status = status;
  await category.save();

  await AwardAuditLog.create({
    user: updatedBy,
    action:
      status === "active"
        ? "category_activated"
        : "category_deactivated",
    targetType: "category",
    targetId: category._id,
    category: category._id,
    outcome: "success",
    metadata: {
      categoryName: category.name,
      previousStatus,
      newStatus: status,
    },
  });

  return category;
};


export const updateAwardCategoryNominationSettings = async ({
  categoryId,
  enabled,
  opensAt,
  closesAt,
  updatedBy,
}) => {
  if (!categoryId) {
    throw createHttpError("Award category ID is required.", 400);
  }

  if (!updatedBy) {
    throw createHttpError(
      "The authenticated administrator is required.",
      401
    );
  }

  if (typeof enabled !== "boolean") {
    throw createHttpError(
      "Nomination enabled status must be true or false.",
      400
    );
  }

  const category = await AwardCategory.findById(categoryId);

  if (!category) {
    throw createHttpError("Award category not found.", 404);
  }

  let openingDate = null;
  let closingDate = null;

  if (enabled) {
    openingDate = new Date(opensAt);
    closingDate = new Date(closesAt);

    if (
      !opensAt ||
      !closesAt ||
      Number.isNaN(openingDate.getTime()) ||
      Number.isNaN(closingDate.getTime())
    ) {
      throw createHttpError(
        "Valid nomination opening and closing dates are required.",
        400
      );
    }

    if (closingDate <= openingDate) {
      throw createHttpError(
        "The nomination closing date must be after the opening date.",
        400
      );
    }
  }

  const previousSettings = {
    ...category.nominationSettings?.toObject?.(),
    enabled: category.nominationSettings?.enabled ?? false,
    opensAt: category.nominationSettings?.opensAt ?? null,
    closesAt: category.nominationSettings?.closesAt ?? null,
  };

  category.nominationSettings = {
    enabled,
    opensAt: enabled ? openingDate : null,
    closesAt: enabled ? closingDate : null,
  };

  category.updatedBy = updatedBy;
  await category.save();

  await AwardAuditLog.create({
    user: updatedBy,
    action: "category_updated",
    targetType: "category",
    targetId: category._id,
    category: category._id,
    outcome: "success",
    metadata: {
      categoryName: category.name,
      change: "nomination_settings_updated",
      previousSettings,
      newSettings: {
        enabled,
        opensAt: category.nominationSettings.opensAt,
        closesAt: category.nominationSettings.closesAt,
      },
    },
  });

  return category;
};


const COASTAL_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

const getAgeOnDate = (dateOfBirth, referenceDate = new Date()) => {
  const birthDate = new Date(dateOfBirth);

  let age = referenceDate.getFullYear() - birthDate.getFullYear();

  const beforeBirthday =
    referenceDate.getMonth() < birthDate.getMonth() ||
    (referenceDate.getMonth() === birthDate.getMonth() &&
      referenceDate.getDate() < birthDate.getDate());

  if (beforeBirthday) age--;

  return age;
};

export const submitPublicAwardNomination = async ({
  categoryId,
  fullName,
  email,
  phone,
  county,
  constituency,
  ward,
  dateOfBirth,
  currentRole,
  nominationStatement,
  achievements,
  evidenceLinks = [],
  nomineeConsent,
  ipAddress,
  userAgent,
}) => {
  const cleanName =
    typeof fullName === "string" ? fullName.trim() : "";

  const cleanStatement =
    typeof nominationStatement === "string"
      ? nominationStatement.trim()
      : "";

  const cleanAchievements =
    typeof achievements === "string" ? achievements.trim() : "";

  if (!categoryId || !/^[a-f\d]{24}$/i.test(categoryId)) {
    throw createHttpError("Please select a valid award category.", 400);
  }

  if (!cleanName || cleanName.length > 150) {
    throw createHttpError(
      "Full name is required and must not exceed 150 characters.",
      400
    );
  }

  if (
    !COASTAL_COUNTIES.includes(county)
  ) {
    throw createHttpError(
      "Please select one of the six coastal counties.",
      400
    );
  }

  if (cleanStatement.length < 30 || cleanStatement.length > 3000) {
    throw createHttpError(
      "The nomination statement must contain 30–3000 characters.",
      400
    );
  }

  if (cleanAchievements.length < 30 || cleanAchievements.length > 5000) {
    throw createHttpError(
      "The achievements section must contain 30–5000 characters.",
      400
    );
  }

  if (nomineeConsent !== true) {
    throw createHttpError(
      "The nominee's consent is required before submission.",
      400
    );
  }

  if (!Array.isArray(evidenceLinks) || evidenceLinks.length > 10) {
    throw createHttpError(
      "You may provide up to 10 evidence links.",
      400
    );
  }

  const cleanEvidenceLinks = evidenceLinks.map((link) => {
    if (typeof link !== "string" || link.length > 1000) {
      throw createHttpError(
        "Each evidence link must be a valid text URL of at most 1000 characters.",
        400
      );
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(link.trim());
    } catch {
      throw createHttpError(
        "One or more evidence links are invalid.",
        400
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw createHttpError(
        "Evidence links must use HTTP or HTTPS.",
        400
      );
    }

    return parsedUrl.toString();
  });

  const cleanEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";

  if (
    cleanEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
  ) {
    throw createHttpError("Please provide a valid email address.", 400);
  }

  const cleanPhone =
    typeof phone === "string" ? phone.trim() : "";

  if (cleanPhone && !/^[+()\d\s-]{7,25}$/.test(cleanPhone)) {
    throw createHttpError("Please provide a valid phone number.", 400);
  }

  const category = await AwardCategory.findById(categoryId);

  if (!category || category.status !== "active") {
    throw createHttpError(
      "This award category is unavailable for nominations.",
      404
    );
  }

  const settings = category.nominationSettings;

  if (!settings?.enabled || !settings.opensAt || !settings.closesAt) {
    throw createHttpError(
      "Nominations are not currently enabled for this category.",
      403
    );
  }

  const now = new Date();

  if (now < new Date(settings.opensAt)) {
    throw createHttpError(
      "The nomination period has not opened yet.",
      403
    );
  }

  if (now > new Date(settings.closesAt)) {
    throw createHttpError(
      "The nomination period for this category has closed.",
      403
    );
  }

  const eligibility = category.eligibility || {};

  if (
    Array.isArray(eligibility.eligibleCounties) &&
    eligibility.eligibleCounties.length > 0 &&
    !eligibility.eligibleCounties.includes(county)
  ) {
    throw createHttpError(
      "This county is not eligible for the selected award category.",
      400
    );
  }

  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);

    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate > now ||
      birthDate.getFullYear() < 1900
    ) {
      throw createHttpError("Please provide a valid date of birth.", 400);
    }

    const age = getAgeOnDate(birthDate);

    if (
      age < (eligibility.minimumAge ?? 18) ||
      age > (eligibility.maximumAge ?? 35)
    ) {
      throw createHttpError(
        `The nominee must be aged ${eligibility.minimumAge ?? 18}–${eligibility.maximumAge ?? 35}.`,
        400
      );
    }
  } else if (eligibility.minimumAge || eligibility.maximumAge) {
    throw createHttpError(
      "Date of birth is required to check age eligibility.",
      400
    );
  }

  const nomination = await AwardNomination.create({
    category: category._id,
    fullName: cleanName,
    ...(cleanEmail ? { email: cleanEmail } : {}),
    ...(cleanPhone ? { phone: cleanPhone } : {}),
    county,
    ...(typeof constituency === "string" && constituency.trim()
      ? { constituency: constituency.trim() }
      : {}),
    ...(typeof ward === "string" && ward.trim()
      ? { ward: ward.trim() }
      : {}),
    ...(dateOfBirth ? { dateOfBirth: new Date(dateOfBirth) } : {}),
    ...(typeof currentRole === "string" && currentRole.trim()
      ? { currentRole: currentRole.trim().slice(0, 150) }
      : {}),
    nominationStatement: cleanStatement,
    achievements: cleanAchievements,
    evidenceLinks: cleanEvidenceLinks,
    nomineeConsent: true,
    nominatedByMember: null,
    createdByUser: null,
    status: "submitted",
  });

  try {
    await AwardAuditLog.create({
      action: "nomination_submitted",
      targetType: "nomination",
      targetId: nomination._id,
      category: category._id,
      nomination: nomination._id,
      outcome: "success",
      ipAddress,
      userAgent,
      metadata: {
        submissionType: "public",
        categoryName: category.name,
        county,
      },
    });
  } catch (error) {
    // Do not return a false success if audit logging fails.
    // Remove the nomination so an unaudited submission is not left behind.
    await AwardNomination.findByIdAndDelete(nomination._id);
    throw error;
  }

  return {
    id: nomination._id,
    fullName: nomination.fullName,
    category: category.name,
    county: nomination.county,
    status: nomination.status,
    createdAt: nomination.createdAt,
  };
};


/* =========================================================
   ADMIN / SECRETARIAT — NOMINATION REVIEW
========================================================= */

export const getAdminAwardNominations = async ({
  status,
  categoryId,
  page = 1,
  limit = 20,
} = {}) => {
  const allowedStatuses = [
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "withdrawn",
  ];

  const filter = {};

  if (status) {
    if (!allowedStatuses.includes(status)) {
      throw createHttpError(
        "Invalid nomination status.",
        400
      );
    }

    filter.status = status;
  }

  if (categoryId) {
    if (!/^[a-f\d]{24}$/i.test(categoryId)) {
      throw createHttpError(
        "Invalid award category ID.",
        400
      );
    }

    filter.category = categoryId;
  }

  const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
  const safeLimit = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || 20)
  );

  const [nominations, total] = await Promise.all([
    AwardNomination.find(filter)
      .populate("category", "name slug categoryType")
      .populate("reviewedBy", "fullName name email")
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),

    AwardNomination.countDocuments(filter),
  ]);

  return {
    nominations,
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

export const reviewAwardNomination = async ({
  nominationId,
  decision,
  reviewNotes,
  rejectionReason,
  reviewedBy,
}) => {
  if (
    !nominationId ||
    !/^[a-f\d]{24}$/i.test(nominationId)
  ) {
    throw createHttpError(
      "A valid nomination ID is required.",
      400
    );
  }

  if (!reviewedBy) {
    throw createHttpError(
      "The authenticated administrator is required.",
      401
    );
  }

  const allowedDecisions = [
    "under_review",
    "approved",
    "rejected",
  ];

  if (!allowedDecisions.includes(decision)) {
    throw createHttpError(
      "Decision must be under_review, approved, or rejected.",
      400
    );
  }

  const cleanNotes =
    typeof reviewNotes === "string"
      ? reviewNotes.trim()
      : "";

  const cleanRejectionReason =
    typeof rejectionReason === "string"
      ? rejectionReason.trim()
      : "";

  if (cleanNotes.length > 3000) {
    throw createHttpError(
      "Review notes must not exceed 3000 characters.",
      400
    );
  }

  if (cleanRejectionReason.length > 2000) {
    throw createHttpError(
      "Rejection reason must not exceed 2000 characters.",
      400
    );
  }

  if (
    decision === "rejected" &&
    !cleanRejectionReason
  ) {
    throw createHttpError(
      "A reason is required when rejecting a nomination.",
      400
    );
  }

  const nomination =
    await AwardNomination.findById(nominationId);

  if (!nomination) {
    throw createHttpError(
      "Award nomination not found.",
      404
    );
  }

  if (
    nomination.status === "approved" ||
    nomination.status === "rejected" ||
    nomination.status === "withdrawn"
  ) {
    throw createHttpError(
      "This nomination has already reached a final status and cannot be reviewed again.",
      409
    );
  }

  const previousStatus = nomination.status;

  nomination.status = decision;
  nomination.reviewedBy = reviewedBy;
  nomination.reviewedAt = new Date();
  nomination.reviewNotes = cleanNotes || null;
  nomination.rejectionReason =
    decision === "rejected"
      ? cleanRejectionReason
      : null;

  await nomination.save();

  const auditAction = {
    under_review: "nomination_under_review",
    approved: "nomination_approved",
    rejected: "nomination_rejected",
  }[decision];

  try {
    await AwardAuditLog.create({
      user: reviewedBy,
      action: auditAction,
      targetType: "nomination",
      targetId: nomination._id,
      category: nomination.category,
      nomination: nomination._id,
      outcome: "success",
      metadata: {
        previousStatus,
        newStatus: decision,
        reviewNotes: cleanNotes || null,
        rejectionReason:
          decision === "rejected"
            ? cleanRejectionReason
            : null,
      },
    });
  } catch (error) {
    // Restore the prior state if the audit entry fails.
    nomination.status = previousStatus;
    nomination.reviewedBy = null;
    nomination.reviewedAt = null;
    nomination.reviewNotes = null;
    nomination.rejectionReason = null;

    await nomination.save();
    throw error;
  }

  return AwardNomination.findById(nomination._id)
    .populate("category", "name slug categoryType")
    .populate("reviewedBy", "fullName name email")
    .lean();
};
