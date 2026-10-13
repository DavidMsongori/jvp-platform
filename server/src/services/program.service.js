
import mongoose from "mongoose";
import slugify from "slugify";

import Program from "../models/Program.js";
import AppError from "../utils/AppError.js";

import {
  logActivity,
  ACTIVITY,
  ACTIVITY_MODULES,
  TARGET_TYPES,
} from "../utils/activity.js";

import {
  uploadImage,
  deleteImage,
} from "../config/cloudinary.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const PROGRAM_MODULE = ACTIVITY_MODULES.PROGRAMS;
const PROGRAM_TARGET = TARGET_TYPES.PROGRAM;

const PROGRAM_ACTIONS = ACTIVITY.PROGRAM;

const POPULATE_FIELDS = [
  { path: "createdBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
  { path: "publishedBy", select: "name email role" },
  {
    path: "parentProgram",
    select: "title slug recordType status",
  },
];

/* ==========================================================
   HELPERS
========================================================== */

const isValidObjectId = (id) =>
  mongoose.Types.ObjectId.isValid(id);

const throwNotFound = (message = "Program not found") => {
  throw new AppError(404, message);
};

const generateUniqueSlug = async (title, excludeId = null) => {
  const baseSlug =
    slugify(title, {
      lower: true,
      strict: true,
      trim: true,
    }) || "program";

  let slug = baseSlug;
  let counter = 1;

  while (
    await Program.exists({
      slug,
      ...(excludeId
        ? { _id: { $ne: excludeId } }
        : {}),
    })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parseProgramData = (data = {}) => {
  const parsed = { ...data };

  const arrayFields = [
    "objectives",
    "achievements",
    "partners",
  ];

  for (const field of arrayFields) {
    if (parsed[field] !== undefined) {
      parsed[field] = parseJsonValue(
        parsed[field],
        []
      );
    }
  }

  if (parsed.parentProgram === "") {
    parsed.parentProgram = null;
  }

  const booleanFields = [
    "isFeatured",
    "isPublished",
  ];

  for (const field of booleanFields) {
    if (parsed[field] !== undefined) {
      if (parsed[field] === "true") {
        parsed[field] = true;
      } else if (parsed[field] === "false") {
        parsed[field] = false;
      }
    }
  }

  const numberFields = [
    "youthsAttended",
    "youthsBenefited",
  ];

  for (const field of numberFields) {
    if (
      parsed[field] !== undefined &&
      parsed[field] !== ""
    ) {
      parsed[field] = Number(parsed[field]);
    }
  }

  return parsed;
};

const getUploadedFiles = (files, field) => {
  if (!files) return [];

  const value = files[field];

  if (!value) return [];

  return Array.isArray(value) ? value : [value];
};

const uploadProgramCover = async (file, alt = "") => {
  if (!file) return null;

  const uploaded = await uploadImage(
    file.buffer,
    {
      folder: "jvp/programs/cover",
    }
  );

  return {
    ...uploaded,
    alt,
    isPrimary: true,
  };
};

const uploadProgramGallery = async (files = []) => {
  const images = [];

  for (const file of files) {
    const uploaded = await uploadImage(
      file.buffer,
      {
        folder: "jvp/programs/gallery",
      }
    );

    images.push({
      ...uploaded,
      isPrimary: false,
    });
  }

  return images;
};

const deleteCloudinaryImage = async (image) => {
  if (!image?.publicId) return;

  try {
    await deleteImage(image.publicId);
  } catch (error) {
    console.error(
      "[Program Image Deletion]",
      error.message
    );
  }
};

const deleteProgramImages = async (program) => {
  await deleteCloudinaryImage(program.coverImage);

  for (const image of program.gallery || []) {
    await deleteCloudinaryImage(image);
  }
};

const logProgramActivity = async ({
  userId,
  action,
  program,
  description,
  metadata = {},
}) => {
  return logActivity({
    user: userId,
    action,
    module: PROGRAM_MODULE,
    targetType: PROGRAM_TARGET,
    targetId: program?._id || null,
    title: program?.title
      ? `${action.replaceAll("_", " ")}: ${program.title}`
      : undefined,
    description,
    metadata,
  });
};

/* ==========================================================
   VALIDATE PROGRAM HIERARCHY

   A programme can contain activities or other programme
   records through parentProgram.
========================================================== */

const validateParentProgram = async (
  parentProgramId,
  currentProgramId = null
) => {
  if (!parentProgramId) return null;

  if (!isValidObjectId(parentProgramId)) {
    throw new AppError(
      400,
      "Invalid parent program ID."
    );
  }

  if (
    currentProgramId &&
    String(parentProgramId) === String(currentProgramId)
  ) {
    throw new AppError(
      400,
      "A program cannot be its own parent."
    );
  }

  const parent = await Program.findOne({
    _id: parentProgramId,
    isDeleted: { $ne: true },
  });

  if (!parent) {
    throw new AppError(
      404,
      "The selected parent program was not found."
    );
  }

  // Walk up the hierarchy to prevent circular references.
  const visited = new Set();
  let ancestor = parent;

  while (ancestor?.parentProgram) {
    const ancestorId = String(ancestor._id);

    if (visited.has(ancestorId)) {
      throw new AppError(
        400,
        "The existing program hierarchy contains a cycle."
      );
    }

    visited.add(ancestorId);

    if (
      currentProgramId &&
      String(ancestor.parentProgram) ===
        String(currentProgramId)
    ) {
      throw new AppError(
        400,
        "This parent would create a circular program hierarchy."
      );
    }

    ancestor = await Program.findOne({
      _id: ancestor.parentProgram,
      isDeleted: { $ne: true },
    }).select("_id parentProgram");
  }

  return parent._id;
};

/* ==========================================================
   CREATE PROGRAM
========================================================== */

export const createProgram = async (
  programData,
  files = {},
  userId
) => {
  const data = parseProgramData(programData);

  if (!data.title?.trim()) {
    throw new AppError(
      400,
      "Program title is required."
    );
  }

  if (data.parentProgram) {
    data.parentProgram = await validateParentProgram(
      data.parentProgram
    );
  }

  data.slug = await generateUniqueSlug(data.title);

  const coverFile = getUploadedFiles(
    files,
    "coverImage"
  )[0];

  const galleryFiles = getUploadedFiles(
    files,
    "gallery"
  );

  if (coverFile) {
    data.coverImage = await uploadProgramCover(
      coverFile,
      data.title
    );
  }

  if (galleryFiles.length) {
    data.gallery = await uploadProgramGallery(
      galleryFiles
    );
  }

  data.createdBy = userId;
  data.updatedBy = userId;

  const program = await Program.create(data);

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.CREATED,
    program,
    description: `Created ${program.recordType}: ${program.title}.`,
    metadata: {
      recordType: program.recordType,
      category: program.category,
      parentProgram: program.parentProgram || null,
    },
  });

  return Program.findById(program._id).populate(
    POPULATE_FIELDS
  );
};

/* ==========================================================
   UPDATE PROGRAM
========================================================== */

export const updateProgram = async (
  programId,
  updateData,
  files = {},
  userId
) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  });

  if (!program) {
    throwNotFound();
  }

  const data = parseProgramData(updateData);

  if (data.title !== undefined) {
    if (!data.title.trim()) {
      throw new AppError(
        400,
        "Program title cannot be empty."
      );
    }

    if (data.title !== program.title) {
      data.slug = await generateUniqueSlug(
        data.title,
        program._id
      );
    }
  }

  if (data.parentProgram !== undefined) {
    data.parentProgram = await validateParentProgram(
      data.parentProgram,
      program._id
    );
  }

  const coverFile = getUploadedFiles(
    files,
    "coverImage"
  )[0];

  const galleryFiles = getUploadedFiles(
    files,
    "gallery"
  );

  let previousCover = null;
  let previousGallery = [];

  // Upload replacements before deleting existing images.
  if (coverFile) {
    const newCover = await uploadProgramCover(
      coverFile,
      data.title || program.title
    );

    previousCover = program.coverImage;
    data.coverImage = newCover;
  }

  if (galleryFiles.length) {
    const newGallery = await uploadProgramGallery(
      galleryFiles
    );

    previousGallery = program.gallery || [];
    data.gallery = newGallery;
  }

  const protectedFields = [
    "_id",
    "__v",
    "createdBy",
    "createdAt",
    "updatedAt",
    "deletedAt",
    "isDeleted",
  ];

  for (const [key, value] of Object.entries(data)) {
    if (!protectedFields.includes(key)) {
      program.set(key, value);
    }
  }

  program.updatedBy = userId;

  await program.save();

  if (previousCover) {
    await deleteCloudinaryImage(previousCover);
  }

  for (const image of previousGallery) {
    await deleteCloudinaryImage(image);
  }

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.UPDATED,
    program,
    description: `Updated ${program.recordType}: ${program.title}.`,
    metadata: {
      updatedFields: Object.keys(data),
    },
  });

  return Program.findById(program._id).populate(
    POPULATE_FIELDS
  );
};

/* ==========================================================
   GET PROGRAM BY ID
   Intended for authenticated/admin detail views.
========================================================== */

export const getProgramById = async (programId) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  }).populate(POPULATE_FIELDS);

  if (!program) {
    throwNotFound();
  }

  return program;
};

/* ==========================================================
   GET PUBLISHED PROGRAM BY SLUG
========================================================== */

export const getProgramBySlug = async (slug) => {
  const program = await Program.findOne({
    slug,
    isPublished: true,
    isDeleted: { $ne: true },
  }).populate([
    {
      path: "parentProgram",
      select: "title slug recordType status",
    },
    {
      path: "publishedBy",
      select: "name",
    },
  ]);

  if (!program) {
    throwNotFound(
      "Published program not found."
    );
  }

  return program;
};

/* ==========================================================
   GET ALL PROGRAMS

   Supports pagination, search, filters, and sorting.
========================================================== */

export const getAllPrograms = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    recordType,
    status,
    county,
    featured,
    published,
    parentProgram,
    standalone,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = query;

  const currentPage = Math.max(
    1,
    Number(page) || 1
  );

  const pageLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 10)
  );

  const filter = {
    isDeleted: { $ne: true },
  };

  if (search?.trim()) {
    const searchRegex = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i"
    );

    filter.$or = [
      { title: searchRegex },
      { summary: searchRegex },
      { description: searchRegex },
      { impactSummary: searchRegex },
    ];
  }

  if (category) filter.category = category;
  if (recordType) filter.recordType = recordType;
  if (status) filter.status = status;
  if (county) filter.county = county;

  if (featured !== undefined) {
    filter.isFeatured = featured === "true" || featured === true;
  }

  if (published !== undefined) {
    filter.isPublished =
      published === "true" || published === true;
  }

  if (parentProgram) {
    if (!isValidObjectId(parentProgram)) {
      throw new AppError(
        400,
        "Invalid parent program ID."
      );
    }

    filter.parentProgram = parentProgram;
  } else if (standalone === "true" || standalone === true) {
    filter.$and = [
      ...(filter.$and || []),
      {
        $or: [
          { parentProgram: null },
          { parentProgram: { $exists: false } },
        ],
      },
    ];
  }

  const allowedSortFields = [
    "title",
    "startDate",
    "endDate",
    "createdAt",
    "updatedAt",
    "youthsAttended",
    "youthsBenefited",
  ];

  const safeSortField = allowedSortFields.includes(sortBy)
    ? sortBy
    : "createdAt";

  const sort = {
    [safeSortField]: sortOrder === "asc" ? 1 : -1,
  };

  const skip = (currentPage - 1) * pageLimit;

  const [programs, total] = await Promise.all([
    Program.find(filter)
      .populate([
        {
          path: "parentProgram",
          select: "title slug recordType",
        },
        {
          path: "createdBy",
          select: "name",
        },
        {
          path: "updatedBy",
          select: "name",
        },
      ])
      .sort(sort)
      .skip(skip)
      .limit(pageLimit),

    Program.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / pageLimit);

  return {
    programs,
    pagination: {
      total,
      page: currentPage,
      limit: pageLimit,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    },
  };
};

/* ==========================================================
   GET FEATURED PROGRAMS
========================================================== */

export const getFeaturedPrograms = async (limit = 6) => {
  const safeLimit = Math.min(
    50,
    Math.max(1, Number(limit) || 6)
  );

  return Program.find({
    isFeatured: true,
    isPublished: true,
    isDeleted: { $ne: true },
  })
    .sort({ startDate: 1, createdAt: -1 })
    .limit(safeLimit)
    .populate("parentProgram", "title slug recordType")
    .lean();
};

/* ==========================================================
   GET UPCOMING PROGRAMS
========================================================== */

export const getUpcomingPrograms = async (limit = 10) => {
  const safeLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 10)
  );

  return Program.find({
    isPublished: true,
    isDeleted: { $ne: true },
    startDate: { $gte: new Date() },
    status: "planned",
  })
    .sort({ startDate: 1 })
    .limit(safeLimit)
    .populate("parentProgram", "title slug recordType")
    .lean();
};

/* ==========================================================
   GET ONGOING PROGRAMS
========================================================== */

export const getOngoingPrograms = async (limit = 20) => {
  const safeLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 20)
  );

  return Program.find({
    isPublished: true,
    isDeleted: { $ne: true },
    status: "ongoing",
  })
    .sort({ startDate: 1, createdAt: -1 })
    .limit(safeLimit)
    .populate("parentProgram", "title slug recordType")
    .lean();
};

/* ==========================================================
   GET PROGRAMS BY CATEGORY
========================================================== */

export const getProgramsByCategory = async (
  category,
  limit = 20
) => {
  const safeLimit = Math.min(
    100,
    Math.max(1, Number(limit) || 20)
  );

  return Program.find({
    category,
    isPublished: true,
    isDeleted: { $ne: true },
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .populate("parentProgram", "title slug recordType")
    .lean();
};

/* ==========================================================
   GET CHILD ACTIVITIES / RECORDS
========================================================== */

export const getProgramActivities = async (
  parentProgramId,
  query = {}
) => {
  if (!isValidObjectId(parentProgramId)) {
    throw new AppError(
      400,
      "Invalid parent program ID."
    );
  }

  const parent = await Program.findOne({
    _id: parentProgramId,
    isDeleted: { $ne: true },
  }).select("_id");

  if (!parent) {
    throwNotFound("Parent program not found.");
  }

  return getAllPrograms({
    ...query,
    parentProgram: parentProgramId,
  });
};

/* ==========================================================
   PUBLISH PROGRAM
========================================================== */

export const publishProgram = async (
  programId,
  userId
) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  });

  if (!program) {
    throwNotFound();
  }

  if (program.isPublished) {
    throw new AppError(
      400,
      "This program is already published."
    );
  }

  program.isPublished = true;
  program.publishedAt = new Date();
  program.publishedBy = userId;
  program.updatedBy = userId;

  await program.save();

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.PUBLISHED,
    program,
    description: `Published ${program.recordType}: ${program.title}.`,
  });

  return Program.findById(program._id).populate(
    POPULATE_FIELDS
  );
};

/* ==========================================================
   UNPUBLISH PROGRAM
========================================================== */

export const unpublishProgram = async (
  programId,
  userId
) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  });

  if (!program) {
    throwNotFound();
  }

  if (!program.isPublished) {
    throw new AppError(
      400,
      "This program is already unpublished."
    );
  }

  program.isPublished = false;
  program.updatedBy = userId;

  await program.save();

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.UNPUBLISHED,
    program,
    description: `Unpublished ${program.recordType}: ${program.title}.`,
  });

  return Program.findById(program._id).populate(
    POPULATE_FIELDS
  );
};

/* ==========================================================
   UPDATE IMPACT METRICS

   Attendance and beneficiaries are separate measures.
========================================================== */

export const updateProgramImpact = async (
  programId,
  impactData,
  userId
) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  });

  if (!program) {
    throwNotFound();
  }

  const fields = [
    "youthsAttended",
    "youthsBenefited",
    "impactSummary",
    "achievements",
  ];

  const updatedFields = [];

  for (const field of fields) {
    if (impactData[field] === undefined) continue;

    let value = impactData[field];

    if (field === "achievements") {
      value = parseJsonValue(value, []);

      if (!Array.isArray(value)) {
        throw new AppError(
          400,
          "Achievements must be an array."
        );
      }
    }

    if (
      field === "youthsAttended" ||
      field === "youthsBenefited"
    ) {
      value = Number(value);

      if (
        !Number.isInteger(value) ||
        value < 0
      ) {
        throw new AppError(
          400,
          `${field} must be a non-negative whole number.`
        );
      }
    }

    program.set(field, value);
    updatedFields.push(field);
  }

  if (!updatedFields.length) {
    throw new AppError(
      400,
      "No impact fields were provided."
    );
  }

  program.updatedBy = userId;

  await program.save();

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.IMPACT_UPDATED,
    program,
    description: `Updated impact data for ${program.title}.`,
    metadata: {
      updatedFields,
      youthsAttended: program.youthsAttended,
      youthsBenefited: program.youthsBenefited,
    },
  });

  return Program.findById(program._id).populate(
    POPULATE_FIELDS
  );
};

/* ==========================================================
   DELETE PROGRAM

   Soft delete. A parent cannot be deleted while active
   child records still reference it.
========================================================== */

export const deleteProgram = async (
  programId,
  userId
) => {
  if (!isValidObjectId(programId)) {
    throw new AppError(400, "Invalid program ID.");
  }

  const program = await Program.findOne({
    _id: programId,
    isDeleted: { $ne: true },
  });

  if (!program) {
    throwNotFound();
  }

  const hasChildren = await Program.exists({
    parentProgram: program._id,
    isDeleted: { $ne: true },
  });

  if (hasChildren) {
    throw new AppError(
      409,
      "This program has linked activities or child programs. Reassign or delete those records first."
    );
  }

  program.isDeleted = true;
  program.deletedAt = new Date();
  program.updatedBy = userId;

  await program.save();

  await deleteProgramImages(program);

  await logProgramActivity({
    userId,
    action: PROGRAM_ACTIONS.DELETED,
    program,
    description: `Soft-deleted ${program.recordType}: ${program.title}.`,
  });

  return {
    success: true,
    message: "Program deleted successfully.",
    programId: program._id,
  };
};

/* ==========================================================
   DASHBOARD STATISTICS

   Youth attendance and beneficiaries are aggregated
   independently and are not added together.
========================================================== */

export const getProgramDashboardStatistics = async () => {
  const activeFilter = {
    isDeleted: { $ne: true },
  };

  const [
    totalPrograms,
    publishedPrograms,
    draftPrograms,
    featuredPrograms,
    plannedPrograms,
    ongoingPrograms,
    completedPrograms,
    recordTypeSummary,
    impactSummary,
  ] = await Promise.all([
    Program.countDocuments(activeFilter),

    Program.countDocuments({
      ...activeFilter,
      isPublished: true,
    }),

    Program.countDocuments({
      ...activeFilter,
      isPublished: false,
    }),

    Program.countDocuments({
      ...activeFilter,
      isFeatured: true,
    }),

    Program.countDocuments({
      ...activeFilter,
      status: "planned",
    }),

    Program.countDocuments({
      ...activeFilter,
      status: "ongoing",
    }),

    Program.countDocuments({
      ...activeFilter,
      status: "completed",
    }),

    Program.aggregate([
      {
        $match: activeFilter,
      },
      {
        $group: {
          _id: "$recordType",
          total: { $sum: 1 },
        },
      },
    ]),

    Program.aggregate([
      {
        $match: activeFilter,
      },
      {
        $group: {
          _id: null,
          youthsAttended: {
            $sum: {
              $ifNull: ["$youthsAttended", 0],
            },
          },
          youthsBenefited: {
            $sum: {
              $ifNull: ["$youthsBenefited", 0],
            },
          },
        },
      },
    ]),
  ]);

  const recordTypes = Object.fromEntries(
    recordTypeSummary.map((item) => [
      item._id,
      item.total,
    ])
  );

  const impact = impactSummary[0] || {
    youthsAttended: 0,
    youthsBenefited: 0,
  };

  return {
    totalPrograms,
    publishedPrograms,
    draftPrograms,
    featuredPrograms,

    plannedPrograms,
    ongoingPrograms,
    completedPrograms,

    recordTypes: {
      programme: recordTypes.programme || 0,
      event: recordTypes.event || 0,
      activity: recordTypes.activity || 0,
      initiative: recordTypes.initiative || 0,
    },

    impact: {
      youthsAttended: impact.youthsAttended,
      youthsBenefited: impact.youthsBenefited,
    },
  };
};


/* ===========================================================
   GET PUBLIC PROGRAM ACTIVITIES
   Returns published activities under a published parent.
=========================================================== */

export const getPublicProgramActivities = async (parentProgramId) => {
  if (!mongoose.Types.ObjectId.isValid(parentProgramId)) {
    throw new AppError(400, "Invalid parent program ID.");
  }

  const parentProgram = await Program.findOne({
    _id: parentProgramId,
    isPublished: true,
    isDeleted: false,
  }).select("_id title slug");

  if (!parentProgram) {
    throw new AppError(404, "Published program not found.");
  }

  const activities = await Program.find({
    parentProgram: parentProgram._id,
    isPublished: true,
    isDeleted: false,
  })
    .sort({ startDate: -1, createdAt: -1 })
    .select(
      "title slug recordType category summary description startDate endDate county subCounty ward location status youthsAttended youthsBenefited impactSummary achievements partners coverImage gallery isFeatured parentProgram"
    )
    .populate("parentProgram", "title slug")
    .lean();

  return {
    parentProgram,
    activities,
    total: activities.length,
  };
};

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
  createProgram,
  updateProgram,
  getProgramById,
  getProgramBySlug,
  getAllPrograms,
  getFeaturedPrograms,
  getUpcomingPrograms,
  getOngoingPrograms,
  getProgramsByCategory,
  getProgramActivities,
  publishProgram,
  unpublishProgram,
  updateProgramImpact,
  deleteProgram,
  getProgramDashboardStatistics,
};