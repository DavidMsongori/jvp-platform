
import mongoose from "mongoose";

import OfficeAssignment from "../models/OfficeAssignment.js";
import Member from "../models/Member.js";
import Leader from "../models/leader.model.js";

import AppError from "../utils/AppError.js";

import {
  logActivity,
  ACTIVITY_MODULES,
  TARGET_TYPES,
} from "../utils/activity.js";

import {
  LEADERSHIP_OFFICES,
  LEADERSHIP_LEVELS,
  LEADERSHIP_STATUS,
  REGIONAL_CABINET_PORTFOLIOS,
  getRegionalCabinetPortfolio,
} from "../constants/leadership.constants.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const ASSIGNMENT_MODULE = ACTIVITY_MODULES.SYSTEM;
const ASSIGNMENT_TARGET = TARGET_TYPES.SYSTEM;

const ASSIGNMENT_ACTIONS = {
  CREATED: "office_assignment_created",
  UPDATED: "office_assignment_updated",
  ACTIVATED: "office_assignment_activated",
  DEACTIVATED: "office_assignment_deactivated",
  COMPLETED: "office_assignment_completed",
};

const ACTIVE_ASSIGNMENT_STATUSES = ["active"];

const ASSIGNMENT_POPULATION = [
  {
    path: "member",
    select:
      "memberNumber firstName middleName lastName gender phone county constituency ward profilePhoto membershipType membershipStatus",
  },
  {
    path: "officeHolder",
    select:
      "position level category portfolioKey portfolioTitle portfolioSlug status isActive member county constituency ward",
    populate: {
      path: "member",
      select:
        "memberNumber firstName middleName lastName profilePhoto",
    },
  },
  {
    path: "createdBy",
    select: "firstName lastName email",
  },
  {
    path: "updatedBy",
    select: "firstName lastName email",
  },
];

/* ==========================================================
   HELPERS
========================================================== */

const hasValue = (value) =>
  value !== undefined &&
  value !== null &&
  value !== "";

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const normalizeText = (value) =>
  typeof value === "string" ? value.trim() : value;

const getMemberName = (member) =>
  [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

const getLeaderName = (leader) => {
  const member = leader?.member;

  if (member && typeof member === "object") {
    return getMemberName(member) || leader.position;
  }

  return leader?.position || "Office holder";
};

const populateAssignment = (query) => {
  let populatedQuery = query;

  for (const population of ASSIGNMENT_POPULATION) {
    populatedQuery = populatedQuery.populate(population);
  }

  return populatedQuery;
};

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
};

const parseDate = (value, fieldName) => {
  if (!hasValue(value)) return undefined;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, `${fieldName} is not a valid date.`);
  }

  return date;
};

const getAssignmentId = (assignment) =>
  assignment?._id?.toString?.() ||
  assignment?.toString?.();

/* ==========================================================
   VALIDATE ASSIGNMENT IDENTIFIERS
========================================================== */

const validateAssignmentIdentifiers = ({
  memberId,
  officeHolderId,
}) => {
  if (!hasValue(memberId)) {
    throw new AppError(400, "A member must be selected.");
  }

  if (!isValidObjectId(memberId)) {
    throw new AppError(400, "The selected member ID is invalid.");
  }

  if (!hasValue(officeHolderId)) {
    throw new AppError(
      400,
      "A principal office-holder must be selected."
    );
  }

  if (!isValidObjectId(officeHolderId)) {
    throw new AppError(
      400,
      "The selected office-holder ID is invalid."
    );
  }
};

/* ==========================================================
   FIND AND VALIDATE MEMBER
========================================================== */

const findEligibleMember = async (memberId) => {
  const member = await Member.findById(memberId);

  if (!member) {
    throw new AppError(404, "The selected member was not found.");
  }

  if (member.membershipStatus !== "active") {
    throw new AppError(
      400,
      "Only members with active membership can receive an office assignment."
    );
  }

  return member;
};

/* ==========================================================
   FIND AND VALIDATE PRINCIPAL OFFICE-HOLDER
========================================================== */

const findEligibleOfficeHolder = async (officeHolderId) => {
  const leader = await Leader.findById(officeHolderId);

  if (!leader) {
    throw new AppError(
      404,
      "The selected principal office-holder was not found."
    );
  }

  if (
    leader.status !== LEADERSHIP_STATUS.ACTIVE ||
    leader.isActive !== true
  ) {
    throw new AppError(
      400,
      "Assignments can only be made under an active principal office-holder."
    );
  }

  if (!leader.member) {
    throw new AppError(
      400,
      "The selected office-holder is not linked to a member."
    );
  }

  return leader;
};

/* ==========================================================
   NORMALIZE ASSIGNMENT DATA
========================================================== */

const normalizeAssignmentData = (input = {}) => {
  const data = { ...input };

  if (hasValue(data.designation)) {
    data.designation = normalizeText(data.designation);
  }

  if (hasValue(data.responsibilities)) {
    data.responsibilities = normalizeText(
      data.responsibilities
    );
  }

  if (hasValue(data.shortBio)) {
    data.shortBio = normalizeText(data.shortBio);
  }

  if (hasValue(data.portfolioKey)) {
    data.portfolioKey = normalizeText(data.portfolioKey);
  }

  if (hasValue(data.startDate)) {
    data.startDate = parseDate(
      data.startDate,
      "Start date"
    );
  }

  if (hasValue(data.endDate)) {
    data.endDate = parseDate(
      data.endDate,
      "End date"
    );
  }

  if (data.endDate === "") {
    data.endDate = null;
  }

  if (hasValue(data.displayOrder)) {
    const displayOrder = Number(data.displayOrder);

    if (
      !Number.isInteger(displayOrder) ||
      displayOrder < 1
    ) {
      throw new AppError(
        400,
        "Display order must be a positive whole number."
      );
    }

    data.displayOrder = displayOrder;
  }

  if (data.visibility && typeof data.visibility === "string") {
    try {
      data.visibility = JSON.parse(data.visibility);
    } catch {
      throw new AppError(
        400,
        "Visibility settings must be valid JSON."
      );
    }
  }

  if (data.visibility && typeof data.visibility === "object") {
    data.visibility = {
      isPublic: parseBoolean(
        data.visibility.isPublic,
        false
      ),
      showOnOfficePage: parseBoolean(
        data.visibility.showOnOfficePage,
        true
      ),
      showInLeadershipDirectory: parseBoolean(
        data.visibility.showInLeadershipDirectory,
        false
      ),
    };
  }

  delete data._id;
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  delete data.createdBy;
  delete data.updatedBy;
  delete data.isActive;
  delete data.completedAt;
  delete data.deactivatedAt;

  return data;
};

/* ==========================================================
   VALIDATE OFFICE-HOLDER / ASSIGNMENT COMPATIBILITY
========================================================== */

const validateOfficeHolderCompatibility = (
  officeHolder,
  inputPortfolioKey
) => {
  const position = officeHolder.position;
  const level = officeHolder.level;

  const regionalCabinetPositions = [
    LEADERSHIP_OFFICES.PRESIDENT,
    LEADERSHIP_OFFICES.DEPUTY_PRESIDENT,
    LEADERSHIP_OFFICES.PRIME_CABINET_SECRETARY,
    LEADERSHIP_OFFICES.SECRETARY_TO_CABINET,
    LEADERSHIP_OFFICES.ATTORNEY_GENERAL,
    LEADERSHIP_OFFICES.CABINET_SECRETARY,
  ];

  const countyPositions = [
    LEADERSHIP_OFFICES.COUNTY_GOVERNOR,
    LEADERSHIP_OFFICES.DEPUTY_GOVERNOR,
    LEADERSHIP_OFFICES.COUNTY_CABINET_SECRETARY,
  ];

  const regionalAssemblyPositions = [
    LEADERSHIP_OFFICES.REGIONAL_SPEAKER,
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_SPEAKER,
    LEADERSHIP_OFFICES.REGIONAL_CLERK,
    LEADERSHIP_OFFICES.REGIONAL_DEPUTY_CLERK,
    LEADERSHIP_OFFICES.ELECTED_MP,
    LEADERSHIP_OFFICES.NOMINATED_MP,
  ];

  const countyAssemblyPositions = [
    LEADERSHIP_OFFICES.COUNTY_SPEAKER,
    LEADERSHIP_OFFICES.COUNTY_DEPUTY_SPEAKER,
    LEADERSHIP_OFFICES.COUNTY_CLERK,
    LEADERSHIP_OFFICES.COUNTY_DEPUTY_CLERK,
    LEADERSHIP_OFFICES.ELECTED_MCA,
    LEADERSHIP_OFFICES.NOMINATED_MCA,
  ];

  const isRegionalCabinet =
    level === LEADERSHIP_LEVELS.REGIONAL_CABINET &&
    regionalCabinetPositions.includes(position);

  const isRegionalAssembly =
    level === LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY &&
    regionalAssemblyPositions.includes(position);

  const isCountyCabinet =
    level === LEADERSHIP_LEVELS.COUNTY_CABINET &&
    countyPositions.includes(position);

  const isCountyAssembly =
    level === LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY &&
    countyAssemblyPositions.includes(position);

  const isCouncilGovernor =
    level === LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS &&
    position === LEADERSHIP_OFFICES.COUNCIL_GOVERNOR;

  if (
    !isRegionalCabinet &&
    !isRegionalAssembly &&
    !isCountyCabinet &&
    !isCountyAssembly &&
    !isCouncilGovernor
  ) {
    throw new AppError(
      400,
      "The selected leader's office and leadership level are not compatible with an office assignment."
    );
  }

  if (position !== LEADERSHIP_OFFICES.CABINET_SECRETARY) {
    return null;
  }

  const leaderPortfolio = getRegionalCabinetPortfolio(
    officeHolder.portfolioKey
  );

  if (!leaderPortfolio) {
    throw new AppError(
      400,
      "The selected Cabinet Secretary has no valid ministry portfolio assigned."
    );
  }

  if (inputPortfolioKey) {
    const requestedPortfolio = getRegionalCabinetPortfolio(
      inputPortfolioKey
    );

    if (!requestedPortfolio) {
      throw new AppError(
        400,
        "The selected ministry portfolio is invalid."
      );
    }

    if (requestedPortfolio.key !== leaderPortfolio.key) {
      throw new AppError(
        400,
        "The assignment portfolio must match the selected Cabinet Secretary's ministry."
      );
    }
  }

  return leaderPortfolio.key;
};

/* ==========================================================
   CHECK FOR DUPLICATE ACTIVE ASSIGNMENT
========================================================== */

const checkDuplicateAssignment = async ({
  memberId,
  officeHolderId,
  designation,
  excludeId = null,
}) => {
  const filter = {
    member: memberId,
    officeHolder: officeHolderId,
    designation: {
      $regex: `^${String(designation).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      )}$`,
      $options: "i",
    },
    status: "active",
    isActive: true,
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const existing = await OfficeAssignment.findOne(filter);

  if (existing) {
    throw new AppError(
      409,
      "This member already has an active assignment with the same designation under this office-holder."
    );
  }
};

/* ==========================================================
   ACTIVITY LOGGING
========================================================== */

const writeAssignmentActivity = async ({
  userId,
  action,
  assignment,
  description,
  changes = null,
}) => {
  await logActivity({
    user: userId,
    action,
    module: ASSIGNMENT_MODULE,
    targetType: ASSIGNMENT_TARGET,
    targetId: assignment?._id || null,
    title: "Office Assignment",
    description,
    metadata: {
      entity: "OfficeAssignment",
      assignmentId: assignment?._id?.toString?.() || null,
      memberId: assignment?.member?.toString?.() || null,
      officeHolderId:
        assignment?.officeHolder?.toString?.() || null,
    },
    changes,
    status: "success",
  });
};

/* ==========================================================
   CREATE OFFICE ASSIGNMENT
========================================================== */

export const createOfficeAssignment = async (
  assignmentData,
  userId
) => {
  console.log(
    "[OfficeAssignment] Incoming request:",
    JSON.stringify(assignmentData, null, 2)
  );

  const data = normalizeAssignmentData(assignmentData);

  console.log("[OfficeAssignment] Normalized data:", {
    member: data.member,
    officeHolder: data.officeHolder,
    designation: data.designation,
  });

  
validateAssignmentIdentifiers({
  memberId: data.member,
  officeHolderId: data.officeHolder,
});


  // Keep the rest of your existing function unchanged.

  if (!hasValue(data.designation)) {
    throw new AppError(
      400,
      "The supporting officer's designation is required."
    );
  }

  if (data.designation.length > 150) {
    throw new AppError(
      400,
      "Designation cannot exceed 150 characters."
    );
  }

  const [member, officeHolder] = await Promise.all([
    findEligibleMember(data.member),
    findEligibleOfficeHolder(data.officeHolder),
  ]);

  const portfolioKey = validateOfficeHolderCompatibility(
    officeHolder,
    data.portfolioKey
  );

  if (officeHolder.position === LEADERSHIP_OFFICES.CABINET_SECRETARY) {
    data.portfolioKey = portfolioKey;
  } else {
    data.portfolioKey = null;
  }

  const startDate = data.startDate || new Date();

  if (data.endDate && data.endDate < startDate) {
    throw new AppError(
      400,
      "The assignment end date cannot be earlier than its start date."
    );
  }

  await checkDuplicateAssignment({
    memberId: member._id,
    officeHolderId: officeHolder._id,
    designation: data.designation,
  });

  const assignment = await OfficeAssignment.create({
    ...data,
    member: member._id,
    officeHolder: officeHolder._id,
    startDate,
    status: data.status || "active",
    isActive: data.status
      ? data.status === "active"
      : true,
    createdBy: userId,
    updatedBy: userId,
  });

  await writeAssignmentActivity({
    userId,
    action: ASSIGNMENT_ACTIONS.CREATED,
    assignment,
    description: `Created the "${assignment.designation}" assignment for ${getMemberName(member)} under ${getLeaderName(officeHolder)}.`,
  });

  return populateAssignment(
    OfficeAssignment.findById(assignment._id)
  );
};

/* ==========================================================
   UPDATE OFFICE ASSIGNMENT
========================================================== */

export const updateOfficeAssignment = async (
  assignmentId,
  updateData,
  userId
) => {
  if (!isValidObjectId(assignmentId)) {
    throw new AppError(400, "The assignment ID is invalid.");
  }

  const assignment = await OfficeAssignment.findById(
    assignmentId
  );

  if (!assignment) {
    throw new AppError(404, "Office assignment not found.");
  }

  const data = normalizeAssignmentData(updateData);

  const memberId = data.member || assignment.member;
  const officeHolderId =
    data.officeHolder || assignment.officeHolder;

  validateAssignmentIdentifiers({
    memberId,
    officeHolderId,
  });

  const [member, officeHolder] = await Promise.all([
    findEligibleMember(memberId),
    findEligibleOfficeHolder(officeHolderId),
  ]);

  const designation =
    data.designation ?? assignment.designation;

  if (!hasValue(designation)) {
    throw new AppError(
      400,
      "The supporting officer's designation is required."
    );
  }

  if (designation.length > 150) {
    throw new AppError(
      400,
      "Designation cannot exceed 150 characters."
    );
  }

  const portfolioKey = validateOfficeHolderCompatibility(
    officeHolder,
    data.portfolioKey ?? assignment.portfolioKey
  );

  data.portfolioKey =
    officeHolder.position === LEADERSHIP_OFFICES.CABINET_SECRETARY
      ? portfolioKey
      : null;

  const startDate =
    data.startDate ?? assignment.startDate;

  const endDate =
    data.endDate === null
      ? null
      : data.endDate ?? assignment.endDate;

  if (endDate && endDate < startDate) {
    throw new AppError(
      400,
      "The assignment end date cannot be earlier than its start date."
    );
  }

  await checkDuplicateAssignment({
    memberId,
    officeHolderId,
    designation,
    excludeId: assignment._id,
  });

  const previous = {
    member: assignment.member.toString(),
    officeHolder: assignment.officeHolder.toString(),
    designation: assignment.designation,
    responsibilities: assignment.responsibilities,
    portfolioKey: assignment.portfolioKey,
    startDate: assignment.startDate,
    endDate: assignment.endDate,
  };

  assignment.member = member._id;
  assignment.officeHolder = officeHolder._id;

  Object.entries(data).forEach(([key, value]) => {
    if (
      value !== undefined &&
      ![
        "member",
        "officeHolder",
        "status",
      ].includes(key)
    ) {
      assignment[key] = value;
    }
  });

  assignment.startDate = startDate;
  assignment.endDate = endDate;
  assignment.updatedBy = userId;

  await assignment.save();

  await writeAssignmentActivity({
    userId,
    action: ASSIGNMENT_ACTIONS.UPDATED,
    assignment,
    description: `Updated the "${assignment.designation}" office assignment.`,
    changes: {
      before: previous,
      after: {
        member: assignment.member.toString(),
        officeHolder: assignment.officeHolder.toString(),
        designation: assignment.designation,
        responsibilities: assignment.responsibilities,
        portfolioKey: assignment.portfolioKey,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
      },
    },
  });

  return populateAssignment(
    OfficeAssignment.findById(assignment._id)
  );
};

/* ==========================================================
   GET OFFICE ASSIGNMENT BY ID
========================================================== */

export const getOfficeAssignmentById = async (
  assignmentId
) => {
  if (!isValidObjectId(assignmentId)) {
    throw new AppError(400, "The assignment ID is invalid.");
  }

  const assignment = await populateAssignment(
    OfficeAssignment.findById(assignmentId)
  );

  if (!assignment) {
    throw new AppError(404, "Office assignment not found.");
  }

  return assignment;
};

/* ==========================================================
   LIST OFFICE ASSIGNMENTS
========================================================== */

export const getAllOfficeAssignments = async (
  query = {}
) => {
  const {
    page = 1,
    limit = 20,
    search,
    member,
    officeHolder,
    officeType,
    portfolioKey,
    status,
    isPublic,
    showOnOfficePage,
    showInLeadershipDirectory,
    sort = "displayOrder",
  } = query;

  const filter = {};

  if (member) {
    if (!isValidObjectId(member)) {
      throw new AppError(400, "The member filter is invalid.");
    }

    filter.member = member;
  }

  if (officeHolder) {
    if (!isValidObjectId(officeHolder)) {
      throw new AppError(
        400,
        "The office-holder filter is invalid."
      );
    }

    filter.officeHolder = officeHolder;
  }

  if (officeType) {
    filter.officeType = officeType;
  }

  if (portfolioKey) {
    filter.portfolioKey = portfolioKey;
  }

  if (status) {
    filter.status = status;
  }

  if (isPublic !== undefined && isPublic !== "") {
    filter["visibility.isPublic"] = parseBoolean(isPublic);
  }

  if (
    showOnOfficePage !== undefined &&
    showOnOfficePage !== ""
  ) {
    filter["visibility.showOnOfficePage"] =
      parseBoolean(showOnOfficePage);
  }

  if (
    showInLeadershipDirectory !== undefined &&
    showInLeadershipDirectory !== ""
  ) {
    filter["visibility.showInLeadershipDirectory"] =
      parseBoolean(showInLeadershipDirectory);
  }

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (currentPage - 1) * pageSize;

  let assignmentsQuery = OfficeAssignment.find(filter);

  if (search) {
    const matchingMembers = await Member.find({
      $or: [
        { firstName: { $regex: search, $options: "i" } },
        { middleName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { memberNumber: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const matchingLeaders = await Leader.find({
      $or: [
        { position: { $regex: search, $options: "i" } },
        { portfolioTitle: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    const matchingIds = [
      ...matchingMembers.map((item) => item._id),
      ...matchingLeaders.map((item) => item._id),
    ];

    filter.$or = [
      { designation: { $regex: search, $options: "i" } },
      { responsibilities: { $regex: search, $options: "i" } },
      { member: { $in: matchingMembers.map((item) => item._id) } },
      { officeHolder: { $in: matchingLeaders.map((item) => item._id) } },
    ];

    // Rebuild the query after applying the search filter.
    assignmentsQuery = OfficeAssignment.find(filter);
  }

  const sortOptions = {};

  const sortFields = String(sort).split(",");

  for (const field of sortFields) {
    const trimmed = field.trim();

    if (!trimmed) continue;

    if (trimmed.startsWith("-")) {
      sortOptions[trimmed.slice(1)] = -1;
    } else {
      sortOptions[trimmed] = 1;
    }
  }

  const [assignments, total] = await Promise.all([
    populateAssignment(
      assignmentsQuery
        .sort(
          Object.keys(sortOptions).length
            ? sortOptions
            : { displayOrder: 1 }
        )
        .skip(skip)
        .limit(pageSize)
    ),
    OfficeAssignment.countDocuments(filter),
  ]);

  return {
    assignments,
    pagination: {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      hasNextPage: currentPage * pageSize < total,
      hasPrevPage: currentPage > 1,
    },
  };
};

/* ==========================================================
   GET ASSIGNMENTS FOR AN OFFICE-HOLDER
========================================================== */

export const getAssignmentsForOfficeHolder = async (
  officeHolderId,
  options = {}
) => {
  if (!isValidObjectId(officeHolderId)) {
    throw new AppError(400, "The office-holder ID is invalid.");
  }

  const {
    includeInactive = false,
    publicOnly = false,
    officePageOnly = false,
  } = options;

  const filter = {
    officeHolder: officeHolderId,
  };

  if (!includeInactive) {
    filter.status = "active";
    filter.isActive = true;
    filter.startDate = { $lte: new Date() };
    filter.$and = [
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: new Date() } },
        ],
      },
    ];
  }

  if (publicOnly) {
    filter["visibility.isPublic"] = true;
  }

  if (officePageOnly) {
    filter["visibility.showOnOfficePage"] = true;
  }

  return populateAssignment(
    OfficeAssignment.find(filter).sort({
      displayOrder: 1,
      createdAt: 1,
    })
  );
};

/* ==========================================================
   GET PUBLIC OFFICE TEAM
========================================================== */

export const getPublicOfficeTeam = async (
  officeHolderId
) => {
  const officeHolder = await findEligibleOfficeHolder(
    officeHolderId
  );

  const portfolioKey = validateOfficeHolderCompatibility(
    officeHolder,
    officeHolder.portfolioKey
  );

  const filter = {
    officeHolder: officeHolder._id,
    status: "active",
    isActive: true,
    startDate: { $lte: new Date() },
    "visibility.isPublic": true,
    "visibility.showOnOfficePage": true,
    $and: [
      {
        $or: [
          { endDate: null },
          { endDate: { $gte: new Date() } },
        ],
      },
    ],
  };

  if (portfolioKey) {
    filter.portfolioKey = portfolioKey;
  }

  return populateAssignment(
    OfficeAssignment.find(filter).sort({
      displayOrder: 1,
      createdAt: 1,
    })
  );
};

/* ==========================================================
   GET PUBLIC TEAMS FOR A LEADERSHIP OFFICE
========================================================== */

export const getPublicOfficeTeamsByPosition = async (
  position,
  options = {}
) => {
  if (!position) {
    throw new AppError(400, "A leadership position is required.");
  }

  const {
    level,
    portfolioKey,
  } = options;

  const leaderFilter = {
    position,
    status: LEADERSHIP_STATUS.ACTIVE,
    isActive: true,
  };

  if (level) {
    leaderFilter.level = level;
  }

  if (portfolioKey) {
    leaderFilter.portfolioKey = portfolioKey;
  }

  const leaders = await Leader.find(leaderFilter)
    .populate(
      "member",
      "memberNumber firstName middleName lastName profilePhoto"
    )
    .sort({
      displayOrder: 1,
      createdAt: 1,
    });

  if (!leaders.length) {
    return [];
  }

  const now = new Date();

  const assignments = await populateAssignment(
    OfficeAssignment.find({
      officeHolder: { $in: leaders.map((leader) => leader._id) },
      status: "active",
      isActive: true,
      startDate: { $lte: now },
      "visibility.isPublic": true,
      "visibility.showOnOfficePage": true,
      $and: [
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    }).sort({
      displayOrder: 1,
      createdAt: 1,
    })
  );

  return leaders.map((leader) => ({
    officeHolder: leader,
    team: assignments.filter(
      (assignment) =>
        assignment.officeHolder?._id?.toString() ===
        leader._id.toString()
    ),
  }));
};

/* ==========================================================
   UPDATE ASSIGNMENT STATUS
========================================================== */

const changeAssignmentStatus = async ({
  assignmentId,
  userId,
  status,
}) => {
  if (!isValidObjectId(assignmentId)) {
    throw new AppError(400, "The assignment ID is invalid.");
  }

  const allowedStatuses = ["active", "inactive", "completed"];

  if (!allowedStatuses.includes(status)) {
    throw new AppError(400, "Invalid assignment status.");
  }

  const assignment = await OfficeAssignment.findById(
    assignmentId
  );

  if (!assignment) {
    throw new AppError(404, "Office assignment not found.");
  }

  if (
    assignment.status === status &&
    assignment.isActive === (status === "active")
  ) {
    throw new AppError(
      400,
      `The assignment is already ${status}.`
    );
  }

  assignment.status = status;
  assignment.isActive = status === "active";
  assignment.updatedBy = userId;

  if (status === "completed") {
    assignment.completedAt = new Date();

    if (!assignment.endDate) {
      assignment.endDate = new Date();
    }
  } else if (status === "inactive") {
    assignment.deactivatedAt = new Date();
  } else {
    assignment.completedAt = null;
    assignment.deactivatedAt = null;
  }

  await assignment.save();

  const action =
    status === "active"
      ? ASSIGNMENT_ACTIONS.ACTIVATED
      : status === "completed"
      ? ASSIGNMENT_ACTIONS.COMPLETED
      : ASSIGNMENT_ACTIONS.DEACTIVATED;

  await writeAssignmentActivity({
    userId,
    action,
    assignment,
    description: `Changed office assignment "${assignment.designation}" to ${status}.`,
  });

  return populateAssignment(
    OfficeAssignment.findById(assignment._id)
  );
};

export const activateOfficeAssignment = (
  assignmentId,
  userId
) =>
  changeAssignmentStatus({
    assignmentId,
    userId,
    status: "active",
  });

export const deactivateOfficeAssignment = (
  assignmentId,
  userId
) =>
  changeAssignmentStatus({
    assignmentId,
    userId,
    status: "inactive",
  });

export const completeOfficeAssignment = (
  assignmentId,
  userId
) =>
  changeAssignmentStatus({
    assignmentId,
    userId,
    status: "completed",
  });

/* ==========================================================
   DELETE OFFICE ASSIGNMENT
========================================================== */

export const deleteOfficeAssignment = async (
  assignmentId,
  userId
) => {
  if (!isValidObjectId(assignmentId)) {
    throw new AppError(400, "The assignment ID is invalid.");
  }

  const assignment = await OfficeAssignment.findById(
    assignmentId
  );

  if (!assignment) {
    throw new AppError(404, "Office assignment not found.");
  }

  const assignmentSnapshot = {
    _id: assignment._id,
    designation: assignment.designation,
    member: assignment.member,
    officeHolder: assignment.officeHolder,
  };

  await OfficeAssignment.deleteOne({
    _id: assignment._id,
  });

  await writeAssignmentActivity({
    userId,
    action: "office_assignment_deleted",
    assignment: assignmentSnapshot,
    description: `Deleted office assignment "${assignmentSnapshot.designation}".`,
  });

  return {
    success: true,
    message: "Office assignment deleted successfully.",
  };
};

/* ==========================================================
   DASHBOARD STATISTICS
========================================================== */

export const getOfficeAssignmentStatistics = async () => {
  const now = new Date();

  const [
    totalAssignments,
    activeAssignments,
    inactiveAssignments,
    completedAssignments,
    publicAssignments,
    visibleOfficePageAssignments,
    assignedMembers,
  ] = await Promise.all([
    OfficeAssignment.countDocuments(),

    OfficeAssignment.countDocuments({
      status: "active",
      isActive: true,
    }),

    OfficeAssignment.countDocuments({
      status: "inactive",
    }),

    OfficeAssignment.countDocuments({
      status: "completed",
    }),

    OfficeAssignment.countDocuments({
      status: "active",
      isActive: true,
      "visibility.isPublic": true,
    }),

    OfficeAssignment.countDocuments({
      status: "active",
      isActive: true,
      "visibility.isPublic": true,
      "visibility.showOnOfficePage": true,
      startDate: { $lte: now },
      $or: [
        { endDate: null },
        { endDate: { $gte: now } },
      ],
    }),

    OfficeAssignment.distinct("member", {
      status: "active",
      isActive: true,
    }),
  ]);

  return {
    totalAssignments,
    activeAssignments,
    inactiveAssignments,
    completedAssignments,
    publicAssignments,
    visibleOfficePageAssignments,
    assignedMembers: assignedMembers.length,
  };
};
