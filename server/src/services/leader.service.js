import mongoose from "mongoose";

import Leader from "../models/leader.model.js";
import Member from "../models/Member.js";
import AppError from "../utils/AppError.js";

import {
  LEADERSHIP_LEVELS,
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_STATUS,
  LEADERSHIP_OFFICES,
  LEADERSHIP_OFFICE_VALUES,
  REPORT_VISIBILITY,
  REGIONAL_CABINET_PORTFOLIOS,
  getOfficeConfiguration,
  getRegionalCabinetPortfolio,
  normalizePosition,
  isValidOffice,
} from "../constants/leadership.constants.js";

/*
|--------------------------------------------------------------------------
| CONFIGURATION
|--------------------------------------------------------------------------
| Adjust the constants import path above if your project stores the file
| somewhere other than ../constants/leadership.constants.js.
|--------------------------------------------------------------------------
*/

const MEMBER_POPULATE = {
  path: "member",
  select: [
    "memberNumber",
    "firstName",
    "middleName",
    "lastName",
    "profilePhoto",
    "county",
    "constituency",
    "ward",
    "gender",
    "membershipStatus",
    "membershipType",
    "user",
  ].join(" "),
};

const ACTIVE_STATUS = LEADERSHIP_STATUS.ACTIVE || "active";
const INACTIVE_STATUS = LEADERSHIP_STATUS.INACTIVE || "inactive";
const COMPLETED_STATUS = LEADERSHIP_STATUS.COMPLETED || "completed";
const SUSPENDED_STATUS = LEADERSHIP_STATUS.SUSPENDED || "suspended";

const ALL_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

/*
|--------------------------------------------------------------------------
| GENERAL HELPERS
|--------------------------------------------------------------------------
*/

const hasValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const cleanString = (value) =>
  hasValue(value) ? String(value).trim() : undefined;

const normalizeLocation = (value) =>
  cleanString(value)
    ?.replace(/\s+/g, " ")
    .replace(/[-_]+/g, " ");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const toObjectId = (value) => {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return null;
  }

  return new mongoose.Types.ObjectId(value);
};

const assertObjectId = (value, label = "ID") => {
  if (!toObjectId(value)) {
    throw new AppError(`A valid ${label} is required.`, 400);
  }
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "1" || value === 1) return true;
  if (value === "false" || value === "0" || value === 0) return false;

  return undefined;
};

const normalizePagination = (query = {}) => {
  const page = Math.max(
    1,
    Number.parseInt(query.page, 10) || DEFAULT_PAGE
  );

  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_LIMIT)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const normalizeStatus = (value) => {
  if (!hasValue(value)) return undefined;

  const normalized = String(value).trim().toLowerCase();

  const allowed = [
    ACTIVE_STATUS,
    INACTIVE_STATUS,
    COMPLETED_STATUS,
    SUSPENDED_STATUS,
  ];

  if (!allowed.includes(normalized)) {
    throw new AppError(
      `Invalid leadership status "${value}". Allowed values: ${allowed.join(", ")}.`,
      400
    );
  }

  return normalized;
};

const getCurrentUserId = (userOrId) => {
  if (!userOrId) return undefined;

  if (typeof userOrId === "string") return userOrId;

  return (
    userOrId._id ||
    userOrId.id ||
    userOrId.userId ||
    userOrId.createdBy ||
    undefined
  );
};

const getOfficeConfig = (position) => {
  const normalizedPosition = normalizePosition(position);

  if (!normalizedPosition || !isValidOffice(normalizedPosition)) {
    throw new AppError(
      `Invalid leadership office "${position}".`,
      400
    );
  }

  const config = getOfficeConfiguration(normalizedPosition);

  if (!config) {
    throw new AppError(
      `No configuration exists for leadership office "${normalizedPosition}".`,
      400
    );
  }

  return {
    position: normalizedPosition,
    config,
  };
};

const getMemberName = (member) => {
  if (!member) return "";

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const getLeaderName = (leader) => {
  if (!leader) return "";

  if (leader.patron?.fullName) {
    return leader.patron.fullName;
  }

  return getMemberName(leader.member);
};

const isPatronPosition = (position) => {
  const normalized = normalizePosition(position);

  return normalized === LEADERSHIP_OFFICES.PATRON ||
    normalized === "patron";
};

const isPatronLeader = (leader) =>
  leader?.category === LEADERSHIP_CATEGORIES.PATRONAGE ||
  isPatronPosition(leader?.position);

const isActiveLeader = (leader) =>
  leader?.status === ACTIVE_STATUS && leader?.isActive !== false;

const isRegionalOffice = (position) => {
  const { config } = getOfficeConfig(position);

  return config.scope === "regional_cabinet" ||
    config.scope === "regional_youth_assembly" ||
    config.level === "regional_cabinet" ||
    config.level === "regional_youth_assembly";
};

const getLeaderPortfolioKey = (leader) =>
  leader?.portfolioKey ||
  leader?.portfolio?.key ||
  leader?.portfolio ||
  undefined;

const serializeLeader = (leader) => {
  if (!leader) return null;

  const result =
    typeof leader.toObject === "function"
      ? leader.toObject({ virtuals: true })
      : { ...leader };

  result.fullName = getLeaderName(leader);

  if (leader.member) {
    result.member = {
      ...(
        typeof leader.member.toObject === "function"
          ? leader.member.toObject()
          : leader.member
      ),
      fullName: getMemberName(leader.member),
    };
  }

  return result;
};

const serializeLeaders = (leaders = []) =>
  leaders.map(serializeLeader);

/*
|--------------------------------------------------------------------------
| MEMBER AND OFFICE VALIDATION
|--------------------------------------------------------------------------
*/

const validateMember = async (memberId) => {
  assertObjectId(memberId, "member ID");

  const member = await Member.findById(memberId);

  if (!member) {
    throw new AppError("The selected member does not exist.", 404);
  }

  return member;
};

const validateMemberEligibility = (member) => {
  if (!member) {
    throw new AppError("A valid JVP member is required.", 400);
  }

  if (member.isActive === false) {
    throw new AppError(
      "This member is not active and cannot be assigned to leadership.",
      400
    );
  }

  if (
    member.membershipStatus &&
    !["active", "approved", "verified"].includes(
      String(member.membershipStatus).toLowerCase()
    )
  ) {
    throw new AppError(
      "Only eligible members can be assigned to leadership.",
      400
    );
  }
};

const validatePortfolio = (position, portfolioValue) => {
  const { config } = getOfficeConfig(position);

  if (config.requiresPortfolio && !hasValue(portfolioValue)) {
    throw new AppError(
      "A portfolio must be selected for this leadership office.",
      400
    );
  }

  if (!config.requiresPortfolio) {
    return null;
  }

  const portfolio = getRegionalCabinetPortfolio(portfolioValue);

  if (!portfolio) {
    throw new AppError(
      `Invalid Cabinet Secretary portfolio "${portfolioValue}".`,
      400
    );
  }

  return portfolio;
};

const validateLocation = (position, data = {}) => {
  const { config } = getOfficeConfig(position);

  const county = normalizeLocation(data.county);
  const constituency = normalizeLocation(data.constituency);
  const ward = normalizeLocation(data.ward);

  if (config.requiresCounty && !county) {
    throw new AppError(
      `${config.title || position} requires a county.`,
      400
    );
  }

  if (config.requiresConstituency && !constituency) {
    throw new AppError(
      `${config.title || position} requires a constituency.`,
      400
    );
  }

  if (config.requiresWard && !ward) {
    throw new AppError(
      `${config.title || position} requires a ward.`,
      400
    );
  }

  if (
    county &&
    !ALL_COUNTIES.some(
      (item) => item.toLowerCase() === county.toLowerCase()
    )
  ) {
    throw new AppError(
      `The county "${county}" is not a recognized Coast region county.`,
      400
    );
  }

  if (config.scope === "regional_cabinet" ||
      config.scope === "regional_youth_assembly") {
    return {
      county: undefined,
      constituency: undefined,
      ward: undefined,
    };
  }

  return {
    county,
    constituency,
    ward,
  };
};

const buildOfficeFields = (position, data = {}) => {
  const { config } = getOfficeConfig(position);
  const location = validateLocation(position, data);

  return {
    position,
    level: config.level ?? null,
    category: config.category,
    department: config.department ?? null,
    scope: config.scope ?? null,
    reportVisibility: config.reportVisibility,
    appointmentType: data.appointmentType || config.appointmentType,
    county: location.county,
    constituency: location.constituency,
    ward: location.ward,
  };
};

/*
|--------------------------------------------------------------------------
| ACTIVE ASSIGNMENT VALIDATION
|--------------------------------------------------------------------------
*/

const officeAllowsMultiple = (position) => {
  const { config } = getOfficeConfig(position);

  return config.allowMultiple === true;
};

const buildOfficeJurisdictionQuery = (leader) => {
  const query = {
    position: leader.position,
    status: ACTIVE_STATUS,
    isActive: true,
  };

  if (leader.position === LEADERSHIP_OFFICES.CABINET_SECRETARY) {
    query.portfolioKey = leader.portfolioKey;
  }

  if (leader.county) query.county = leader.county;
  if (leader.constituency) query.constituency = leader.constituency;
  if (leader.ward) query.ward = leader.ward;

  return query;
};

const validateUniqueMemberAssignment = async (
  memberId,
  ignoreLeaderId = null
) => {
  if (!memberId) return;

  const query = {
    member: memberId,
    status: ACTIVE_STATUS,
    isActive: true,
  };

  if (ignoreLeaderId) {
    query._id = { $ne: ignoreLeaderId };
  }

  const existing = await Leader.findOne(query)
    .select("_id position status");

  if (existing) {
    throw new AppError(
      "This member already holds an active leadership appointment. Deactivate or complete the existing appointment before assigning another.",
      409
    );
  }
};

const validateOfficeAssignment = async (
  leaderData,
  ignoreLeaderId = null
) => {
  if (isPatronLeader(leaderData)) return;

  if (officeAllowsMultiple(leaderData.position)) {
    // Multiple holders are permitted by the office configuration.
    // Cabinet Secretary uniqueness is checked per portfolio below.
  }

  const query = buildOfficeJurisdictionQuery(leaderData);

  if (ignoreLeaderId) {
    query._id = { $ne: ignoreLeaderId };
  }

  const existing = await Leader.findOne(query)
    .select("_id position portfolioKey county constituency ward");

  if (existing) {
    const portfolio = leaderData.portfolioKey
      ? ` for the "${leaderData.portfolioTitle || leaderData.portfolioKey}" portfolio`
      : "";

    throw new AppError(
      `An active holder already exists for ${leaderData.position}${portfolio} in the specified jurisdiction.`,
      409
    );
  }
};

const validateAppointment = async ({
  position,
  memberId,
  portfolioKey,
  county,
  constituency,
  ward,
  status = ACTIVE_STATUS,
  isActive = true,
  ignoreLeaderId = null,
  patron,
}) => {
  const normalizedPosition = normalizePosition(position);

  if (isPatronPosition(normalizedPosition)) {
    if (!patron?.fullName?.trim()) {
      throw new AppError(
        "The patron's full name is required.",
        400
      );
    }

    return {
      position: normalizedPosition,
      category: LEADERSHIP_CATEGORIES.PATRONAGE,
      level: null,
      department: null,
      scope: null,
      reportVisibility: REPORT_VISIBILITY.REGIONAL || "regional",
      appointmentType: "appointed",
      member: null,
      county: undefined,
      constituency: undefined,
      ward: undefined,
      portfolioKey: undefined,
      portfolioTitle: undefined,
      portfolioSlug: undefined,
    };
  }

  const { config } = getOfficeConfig(normalizedPosition);
  const portfolio = validatePortfolio(normalizedPosition, portfolioKey);

  const officeFields = buildOfficeFields(normalizedPosition, {
    county,
    constituency,
    ward,
    appointmentType: undefined,
  });

  const appointment = {
    position: normalizedPosition,
    ...officeFields,
    portfolioKey: portfolio?.key,
    portfolioTitle: portfolio?.title,
    portfolioSlug: portfolio?.slug,
    status,
    isActive,
  };

  if (config.requiresMember !== false) {
    const member = await validateMember(memberId);
    validateMemberEligibility(member);
    appointment.member = member._id;
  } else {
    appointment.member = null;
  }

  if (isActive && status === ACTIVE_STATUS) {
    if (appointment.member) {
      await validateUniqueMemberAssignment(
        appointment.member,
        ignoreLeaderId
      );
    }

    await validateOfficeAssignment(
      appointment,
      ignoreLeaderId
    );
  }

  return appointment;
};

/*
|--------------------------------------------------------------------------
| QUERY HELPERS
|--------------------------------------------------------------------------
*/

const buildLeaderFilter = (filters = {}) => {
  const query = {};

  const directFields = [
    "category",
    "level",
    "department",
    "scope",
    "reportVisibility",
    "position",
    "portfolioKey",
    "county",
    "constituency",
    "ward",
    "member",
  ];

  for (const field of directFields) {
    if (!hasValue(filters[field])) continue;

    if (field === "position") {
      query.position = normalizePosition(filters.position);
    } else if (
      ["county", "constituency", "ward"].includes(field)
    ) {
      query[field] = normalizeLocation(filters[field]);
    } else {
      query[field] = filters[field];
    }
  }

  if (hasValue(filters.status)) {
    query.status = normalizeStatus(filters.status);
  }

  const active = normalizeBoolean(filters.active);
  const isActive = normalizeBoolean(filters.isActive);

  if (active !== undefined) query.isActive = active;
  if (isActive !== undefined) query.isActive = isActive;

  if (filters.verified !== undefined) {
    const verified = normalizeBoolean(filters.verified);

    if (verified !== undefined) {
      query.verified = verified;
    }
  }

  if (filters.featured !== undefined) {
    const featured = normalizeBoolean(filters.featured);

    if (featured !== undefined) {
      query.featured = featured;
    }
  }

  if (hasValue(filters.search)) {
    const expression = new RegExp(
      escapeRegex(filters.search.trim()),
      "i"
    );

    query.$or = [
      { position: expression },
      { portfolioTitle: expression },
      { portfolioKey: expression },
      { portfolioSlug: expression },
      { county: expression },
      { constituency: expression },
      { ward: expression },
      { "patron.fullName": expression },
      { "patron.title": expression },
      { "patron.organization": expression },
    ];
  }

  return query;
};

const buildSort = (sortBy, sortOrder) => {
  const field = [
    "displayOrder",
    "createdAt",
    "updatedAt",
    "position",
    "county",
    "termStart",
    "termEnd",
  ].includes(sortBy)
    ? sortBy
    : "displayOrder";

  const direction =
    String(sortOrder).toLowerCase() === "desc" ? -1 : 1;

  return {
    [field]: direction,
    createdAt: -1,
  };
};

const paginateQuery = async ({
  query,
  filters = {},
  populate = true,
  sort = null,
}) => {
  const filter = buildLeaderFilter(filters);

  let databaseQuery = query
    .find(filter)
    .sort(sort || buildSort(filters.sortBy, filters.sortOrder));

  if (populate) {
    databaseQuery = databaseQuery.populate(MEMBER_POPULATE);
  }

  const items = await databaseQuery.lean({ virtuals: true });

  return {
    items: serializeLeaders(items),
  };
};

const getActiveQuery = () => ({
  status: ACTIVE_STATUS,
  isActive: true,
});

const countBy = async (field, baseQuery = {}) =>
  Leader.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: `$${field}`,
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1, _id: 1 } },
  ]);

const asCountMap = (rows = []) =>
  rows.reduce((result, row) => {
    result[row._id ?? "unspecified"] = row.count;
    return result;
  }, {});

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

class LeaderService {
  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  async createLeader(data = {}, userOrId = null) {
    if (!data.position) {
      throw new AppError("Leadership position is required.", 400);
    }

    const position = normalizePosition(data.position);
    const patron = isPatronPosition(position);

    const appointment = await validateAppointment({
      ...data,
      position,
      patron: data.patron,
      memberId: data.member,
      portfolioKey:
        data.portfolioKey ||
        data.portfolio ||
        data.docketKey ||
        data.docket ||
        data.ministry,
      status: data.status || ACTIVE_STATUS,
      isActive: data.isActive !== false,
    });

    const userId = getCurrentUserId(userOrId);

    const payload = {
      ...data,
      ...appointment,
      position,
      createdBy: userId,
      updatedBy: userId,
    };

    if (patron) {
      payload.member = null;
      payload.patron = {
        fullName: data.patron?.fullName?.trim(),
        title: cleanString(data.patron?.title),
        organization: cleanString(data.patron?.organization),
        photo: cleanString(data.patron?.photo),
        bio: cleanString(data.patron?.bio),
      };
    } else {
      delete payload.patron;
    }

    const leader = await Leader.create(payload);

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  /*
  |--------------------------------------------------------------------------
  | READ / LIST
  |--------------------------------------------------------------------------
  */

 async getLeaders(filters = {}) {
  const result = await paginateQuery({
    query: Leader,
    filters,
  });

  return {
    leaders: result.items,
  };
}

async getPublicLeaders(filters = {}) {
  const publicFilters = {
    ...filters,
    status: ACTIVE_STATUS,
    active: true,
  };

  const result = await paginateQuery({
    query: Leader,
    filters: publicFilters,
  });

  return {
    leaders: result.items,
  };
}

  async getLeader(id) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id)
      .populate(MEMBER_POPULATE);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    return leader;
  }

  /*
  |--------------------------------------------------------------------------
  | LEADERSHIP MEMBERS DASHBOARD
  |--------------------------------------------------------------------------
  */

  async getLeadershipMembers(userOrId, filters = {}) {
    const userId = getCurrentUserId(userOrId);

    if (!userId || !toObjectId(userId)) {
      throw new AppError(
        "A valid authenticated user is required.",
        401
      );
    }

    const member = await Member.findOne({ user: userId });

    if (!member) {
      throw new AppError(
        "No JVP membership record is linked to this user.",
        404
      );
    }

    const leader = await Leader.findOne({
      member: member._id,
      status: ACTIVE_STATUS,
      isActive: true,
    }).populate(MEMBER_POPULATE);

    if (!leader) {
      throw new AppError(
        "You do not currently hold an active JVP leadership position.",
        403
      );
    }

    const jurisdiction = {};

    if (leader.scope === "county_cabinet" ||
        leader.scope === "county_youth_assembly" ||
        leader.position === LEADERSHIP_OFFICES.COUNCIL_GOVERNOR) {
      jurisdiction.county = leader.county;
    }

    if (leader.reportVisibility === "constituency") {
      jurisdiction.county = leader.county;
      jurisdiction.constituency = leader.constituency;
    }

    if (leader.reportVisibility === "ward") {
      jurisdiction.county = leader.county;
      jurisdiction.constituency = leader.constituency;
      jurisdiction.ward = leader.ward;
    }

    const memberFilter = {};

    for (const field of ["county", "constituency", "ward"]) {
      if (jurisdiction[field]) {
        memberFilter[field] = jurisdiction[field];
      }
    }

    if (hasValue(filters.county) &&
        jurisdiction.county &&
        normalizeLocation(filters.county).toLowerCase() !==
          String(jurisdiction.county).toLowerCase()) {
      throw new AppError(
        "You cannot view membership data outside your county jurisdiction.",
        403
      );
    }

    if (hasValue(filters.constituency) &&
        jurisdiction.constituency &&
        normalizeLocation(filters.constituency).toLowerCase() !==
          String(jurisdiction.constituency).toLowerCase()) {
      throw new AppError(
        "You cannot view membership data outside your constituency jurisdiction.",
        403
      );
    }

    if (hasValue(filters.ward) &&
        jurisdiction.ward &&
        normalizeLocation(filters.ward).toLowerCase() !==
          String(jurisdiction.ward).toLowerCase()) {
      throw new AppError(
        "You cannot view membership data outside your ward jurisdiction.",
        403
      );
    }

    if (hasValue(filters.county) && !jurisdiction.county) {
      memberFilter.county = normalizeLocation(filters.county);
    }

    if (hasValue(filters.constituency) && !jurisdiction.constituency) {
      memberFilter.constituency =
        normalizeLocation(filters.constituency);
    }

    if (hasValue(filters.ward) && !jurisdiction.ward) {
      memberFilter.ward = normalizeLocation(filters.ward);
    }

    if (hasValue(filters.membershipStatus)) {
      memberFilter.membershipStatus = filters.membershipStatus;
    }

    if (hasValue(filters.membershipType)) {
      memberFilter.membershipType = filters.membershipType;
    }

    if (hasValue(filters.search)) {
      const expression = new RegExp(
        escapeRegex(filters.search.trim()),
        "i"
      );

      memberFilter.$or = [
        { firstName: expression },
        { middleName: expression },
        { lastName: expression },
        { memberNumber: expression },
        { county: expression },
        { constituency: expression },
        { ward: expression },
      ];
    }


    const [members, total, countyDistribution, membershipDistribution] =
      await Promise.all([
        Member.find(memberFilter)
  .select(
    "memberNumber firstName middleName lastName profilePhoto county constituency ward gender membershipStatus membershipType createdAt"
  )
  .sort({ createdAt: -1 })
  .lean(),

        Member.countDocuments(memberFilter),

        Member.aggregate([
          { $match: memberFilter },
          {
            $group: {
              _id: "$county",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
        ]),

        Member.aggregate([
          { $match: memberFilter },
          {
            $group: {
              _id: "$membershipType",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1, _id: 1 } },
        ]),
      ]);

    return {
      leadership: serializeLeader(leader),
      jurisdiction,
     summary: {
  totalMembers: total,
  activeMembers: await Member.countDocuments({
    ...memberFilter,
    membershipStatus: "active",
  }),
},
      distribution: {
        byCounty: countyDistribution,
        byMembershipType: membershipDistribution,
      },
      members: members.map((item) => ({
        ...item,
        fullName: getMemberName(item),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  async updateLeader(id, data = {}, userOrId = null) {
    assertObjectId(id, "leader ID");

    const existing = await Leader.findById(id);

    if (!existing) {
      throw new AppError("Leadership record not found.", 404);
    }

    const position = normalizePosition(
      data.position || existing.position
    );

    const patron = isPatronPosition(position);

    const merged = {
      ...existing.toObject(),
      ...data,
      position,
      member: data.member ?? existing.member,
      patron: data.patron ?? existing.patron,
      portfolioKey:
        data.portfolioKey ??
        data.portfolio ??
        data.docketKey ??
        data.docket ??
        data.ministry ??
        existing.portfolioKey,
      county: data.county ?? existing.county,
      constituency: data.constituency ?? existing.constituency,
      ward: data.ward ?? existing.ward,
      status: data.status ?? existing.status,
      isActive: data.isActive ?? existing.isActive,
    };

    const appointment = await validateAppointment({
      ...merged,
      position,
      memberId: merged.member?._id || merged.member,
      patron: merged.patron,
      ignoreLeaderId: existing._id,
    });

    const userId = getCurrentUserId(userOrId);

    const protectedFields = [
      "_id",
      "id",
      "createdAt",
      "updatedAt",
      "createdBy",
      "__v",
    ];

    const updates = {};

    for (const [key, value] of Object.entries(data)) {
      if (!protectedFields.includes(key)) {
        updates[key] = value;
      }
    }

    Object.assign(updates, appointment, {
      updatedBy: userId,
    });

    if (patron) {
      updates.member = null;
      updates.patron = {
        fullName: merged.patron?.fullName?.trim(),
        title: cleanString(merged.patron?.title),
        organization: cleanString(merged.patron?.organization),
        photo: cleanString(merged.patron?.photo),
        bio: cleanString(merged.patron?.bio),
      };
    } else {
      updates.patron = undefined;
    }

    Object.assign(existing, updates);

    await existing.save();

    return Leader.findById(existing._id)
      .populate(MEMBER_POPULATE);
  }

  /*
  |--------------------------------------------------------------------------
  | ACTIVATION / DEACTIVATION
  |--------------------------------------------------------------------------
  */

  async activateLeader(id, userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    if (leader.status === COMPLETED_STATUS) {
      throw new AppError(
        "A completed leadership term cannot be reactivated. Create a new appointment instead.",
        409
      );
    }

    if (!isPatronLeader(leader)) {
      const appointment = await validateAppointment({
        position: leader.position,
        memberId: leader.member?._id || leader.member,
        portfolioKey: leader.portfolioKey,
        county: leader.county,
        constituency: leader.constituency,
        ward: leader.ward,
        status: ACTIVE_STATUS,
        isActive: true,
        ignoreLeaderId: leader._id,
      });

      Object.assign(leader, appointment);
    }

    leader.status = ACTIVE_STATUS;
    leader.isActive = true;
    leader.deactivatedAt = undefined;
    leader.updatedBy = getCurrentUserId(userOrId);

    await leader.save();

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  async activateMany(ids = [], userOrId = null) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        "Provide at least one leadership record ID.",
        400
      );
    }

    const uniqueIds = [...new Set(ids.map(String))];

    uniqueIds.forEach((id) => assertObjectId(id, "leader ID"));

    const leaders = await Leader.find({
      _id: { $in: uniqueIds },
    });

    if (leaders.length !== uniqueIds.length) {
      throw new AppError(
        "One or more leadership records could not be found.",
        404
      );
    }

    const activated = [];
    const failed = [];

    for (const leader of leaders) {
      try {
        await this.activateLeader(
          leader._id,
          userOrId
        );

        activated.push(String(leader._id));
      } catch (error) {
        failed.push({
          id: String(leader._id),
          position: leader.position,
          message: error.message,
        });
      }
    }

    return {
      requested: uniqueIds.length,
      activated: activated.length,
      failed: failed.length,
      activatedIds: activated,
      failures: failed,
    };
  }

  async deactivateLeader(id, userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    leader.status = INACTIVE_STATUS;
    leader.isActive = false;
    leader.deactivatedAt = new Date();
    leader.updatedBy = getCurrentUserId(userOrId);

    await leader.save();

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  async deleteLeader(id, userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    await Leader.deleteOne({ _id: leader._id });

    return {
      success: true,
      message: "Leadership record deleted successfully.",
      id: String(leader._id),
      deletedBy: getCurrentUserId(userOrId),
    };
  }

  /*
  |--------------------------------------------------------------------------
  | TERM AND STATUS MANAGEMENT
  |--------------------------------------------------------------------------
  */

  async completeTerm(id, userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    leader.status = COMPLETED_STATUS;
    leader.isActive = false;
    leader.completedAt = new Date();
    leader.deactivatedAt = new Date();
    leader.updatedBy = getCurrentUserId(userOrId);

    await leader.save();

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  async suspendLeader(id, reason = "", userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    leader.status = SUSPENDED_STATUS;
    leader.isActive = false;
    leader.deactivatedAt = new Date();

    if (hasValue(reason)) {
      leader.remarks = reason.trim();
    }

    leader.updatedBy = getCurrentUserId(userOrId);

    await leader.save();

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  async reinstateLeader(id, userOrId = null) {
    return this.activateLeader(id, userOrId);
  }

  /*
  |--------------------------------------------------------------------------
  | BULK DEACTIVATION
  |--------------------------------------------------------------------------
  */

  async deactivateMany(ids = [], userOrId = null) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError(
        "Provide at least one leadership record ID.",
        400
      );
    }

    const uniqueIds = [...new Set(ids.map(String))];

    uniqueIds.forEach((id) => assertObjectId(id, "leader ID"));

    const result = await Leader.updateMany(
      { _id: { $in: uniqueIds } },
      {
        $set: {
          status: INACTIVE_STATUS,
          isActive: false,
          deactivatedAt: new Date(),
          updatedBy: getCurrentUserId(userOrId),
        },
      }
    );

    return {
      requested: uniqueIds.length,
      modified: result.modifiedCount ?? result.nModified ?? 0,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | STATISTICS
  |--------------------------------------------------------------------------
  */

  async getStatistics(filters = {}) {
    const baseFilter = buildLeaderFilter(filters);

    const [
      total,
      active,
      inactive,
      completed,
      suspended,
      byPosition,
      byCategory,
      byLevel,
      byCounty,
      byDepartment,
      byPortfolio,
    ] = await Promise.all([
      Leader.countDocuments(baseFilter),

      Leader.countDocuments({
        ...baseFilter,
        status: ACTIVE_STATUS,
        isActive: true,
      }),

      Leader.countDocuments({
        ...baseFilter,
        status: INACTIVE_STATUS,
      }),

      Leader.countDocuments({
        ...baseFilter,
        status: COMPLETED_STATUS,
      }),

      Leader.countDocuments({
        ...baseFilter,
        status: SUSPENDED_STATUS,
      }),

      countBy("position", baseFilter),
      countBy("category", baseFilter),
      countBy("level", baseFilter),
      countBy("county", baseFilter),
      countBy("department", baseFilter),
      countBy("portfolioKey", baseFilter),
    ]);

    const regionalCabinet = await Leader.countDocuments({
      ...getActiveQuery(),
      level: LEADERSHIP_LEVELS.REGIONAL_CABINET ||
        "regional_cabinet",
    });

    const regionalYouthAssembly = await Leader.countDocuments({
      ...getActiveQuery(),
      level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY ||
        "regional_youth_assembly",
    });

    const councilOfGovernors = await Leader.countDocuments({
      ...getActiveQuery(),
      position: LEADERSHIP_OFFICES.COUNCIL_GOVERNOR ||
        "council_governor",
    });

    const countyCabinet = await Leader.countDocuments({
      ...getActiveQuery(),
      level: LEADERSHIP_LEVELS.COUNTY_CABINET ||
        "county_cabinet",
    });

    const countyYouthAssembly = await Leader.countDocuments({
      ...getActiveQuery(),
      level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY ||
        "county_youth_assembly",
    });

    return {
      total,
      active,
      inactive,
      completed,
      suspended,
      inactiveOrUnavailable: total - active,
      activePercentage: total
        ? Number(((active / total) * 100).toFixed(2))
        : 0,
      structure: {
        regionalCabinet,
        regionalYouthAssembly,
        councilOfGovernors,
        countyCabinet,
        countyYouthAssembly,
      },
      distribution: {
        byPosition,
        byCategory,
        byLevel,
        byCounty,
        byDepartment,
        byPortfolio,
      },
      charts: {
        positions: byPosition.map((item) => ({
          label: item._id || "Unspecified",
          value: item.count,
        })),
        categories: byCategory.map((item) => ({
          label: item._id || "Unspecified",
          value: item.count,
        })),
        counties: byCounty.map((item) => ({
          label: item._id || "Unspecified",
          value: item.count,
        })),
      },
    };
  }

  /*
  |--------------------------------------------------------------------------
  | STRUCTURAL QUERIES
  |--------------------------------------------------------------------------
  */

  async getRegionalCabinet(filters = {}) {
    return this.getLeaders({
      ...filters,
      level: LEADERSHIP_LEVELS.REGIONAL_CABINET ||
        "regional_cabinet",
    });
  }

  async getRegionalYouthAssembly(filters = {}) {
    return this.getLeaders({
      ...filters,
      level: LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY ||
        "regional_youth_assembly",
    });
  }

  async getCouncilOfGovernors(filters = {}) {
    return this.getLeaders({
      ...filters,
      position: LEADERSHIP_OFFICES.COUNCIL_GOVERNOR ||
        "council_governor",
    });
  }

  async getCountyCabinet(filters = {}) {
    return this.getLeaders({
      ...filters,
      level: LEADERSHIP_LEVELS.COUNTY_CABINET ||
        "county_cabinet",
    });
  }

  async getCountyYouthAssembly(filters = {}) {
    return this.getLeaders({
      ...filters,
      level: LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY ||
        "county_youth_assembly",
    });
  }

  async getPatron() {
    return Leader.findOne({
      $or: [
        { position: LEADERSHIP_OFFICES.PATRON || "patron" },
        { category: LEADERSHIP_CATEGORIES.PATRONAGE || "patronage" },
      ],
      status: ACTIVE_STATUS,
      isActive: true,
    }).populate(MEMBER_POPULATE);
  }

  async getLeadersByScope(scope, filters = {}) {
    if (!hasValue(scope)) {
      throw new AppError("Leadership scope is required.", 400);
    }

    return this.getLeaders({
      ...filters,
      scope,
    });
  }

  async getLeadersByReportVisibility(visibility, filters = {}) {
    if (!hasValue(visibility)) {
      throw new AppError(
        "Report visibility is required.",
        400
      );
    }

    return this.getLeaders({
      ...filters,
      reportVisibility: visibility,
    });
  }

  async getLeadersByCounty(county, filters = {}) {
    if (!hasValue(county)) {
      throw new AppError("County is required.", 400);
    }

    return this.getLeaders({
      ...filters,
      county: normalizeLocation(county),
    });
  }

  async getLeadersByConstituency(
    county,
    constituency,
    filters = {}
  ) {
    if (!hasValue(constituency)) {
      throw new AppError("Constituency is required.", 400);
    }

    return this.getLeaders({
      ...filters,
      ...(hasValue(county)
        ? { county: normalizeLocation(county) }
        : {}),
      constituency: normalizeLocation(constituency),
    });
  }

  async getLeadersByWard(
    county,
    constituency,
    ward,
    filters = {}
  ) {
    if (!hasValue(ward)) {
      throw new AppError("Ward is required.", 400);
    }

    return this.getLeaders({
      ...filters,
      ...(hasValue(county)
        ? { county: normalizeLocation(county) }
        : {}),
      ...(hasValue(constituency)
        ? { constituency: normalizeLocation(constituency) }
        : {}),
      ward: normalizeLocation(ward),
    });
  }

  async getLeadersByPosition(position, filters = {}) {
    if (!hasValue(position)) {
      throw new AppError(
        "Leadership position is required.",
        400
      );
    }

    const normalized = normalizePosition(position);

    if (!isValidOffice(normalized)) {
      throw new AppError(
        `Invalid leadership position "${position}".`,
        400
      );
    }

    return this.getLeaders({
      ...filters,
      position: normalized,
    });
  }

  async getCabinetSecretaryByPortfolio(portfolioValue) {
    if (!hasValue(portfolioValue)) {
      throw new AppError(
        "Cabinet Secretary portfolio is required.",
        400
      );
    }

    const portfolio = getRegionalCabinetPortfolio(portfolioValue);

    if (!portfolio) {
      throw new AppError(
        `No Cabinet Secretary portfolio matches "${portfolioValue}".`,
        404
      );
    }

    return Leader.findOne({
      position: LEADERSHIP_OFFICES.CABINET_SECRETARY ||
        "cabinet_secretary",
      portfolioKey: portfolio.key,
      status: ACTIVE_STATUS,
      isActive: true,
    }).populate(MEMBER_POPULATE);
  }

  /*
  |--------------------------------------------------------------------------
  | VACANCIES
  |--------------------------------------------------------------------------
  */

  async getVacantPositions(filters = {}) {
    const vacancies = [];

    const activeLeaders = await Leader.find(getActiveQuery())
      .select(
        "position portfolioKey portfolioTitle county constituency ward scope level"
      )
      .lean();

    const allOffices = Array.isArray(LEADERSHIP_OFFICE_VALUES)
      ? LEADERSHIP_OFFICE_VALUES
      : Object.values(LEADERSHIP_OFFICES);

    const seen = new Set();

    for (const rawPosition of allOffices) {
      const position = normalizePosition(rawPosition);

      if (!position || seen.has(position)) continue;

      seen.add(position);

      const config = getOfficeConfiguration(position);

      if (!config) continue;

      if (isPatronPosition(position)) {
        const patronExists = activeLeaders.some(
          (leader) => isPatronPosition(leader.position)
        );

        if (!patronExists) {
          vacancies.push({
            position,
            title: config.title || "Patron",
            scope: null,
            level: null,
            vacancyType: "office",
          });
        }

        continue;
      }

      if (config.requiresPortfolio) {
        for (const portfolio of REGIONAL_CABINET_PORTFOLIOS) {
          const exists = activeLeaders.some(
            (leader) =>
              normalizePosition(leader.position) === position &&
              leader.portfolioKey === portfolio.key
          );

          if (!exists) {
            vacancies.push({
              position,
              title: config.title || "Cabinet Secretary",
              portfolioKey: portfolio.key,
              portfolioTitle: portfolio.title,
              portfolioSlug: portfolio.slug,
              scope: config.scope,
              level: config.level,
              vacancyType: "portfolio",
            });
          }
        }

        continue;
      }

      if (config.allowMultiple === true) {
        continue;
      }

      const existing = activeLeaders.some(
        (leader) =>
          normalizePosition(leader.position) === position
      );

      if (!existing) {
        vacancies.push({
          position,
          title: config.title || position.replace(/_/g, " "),
          scope: config.scope ?? null,
          level: config.level ?? null,
          vacancyType: "office",
        });
      }
    }

    let filtered = vacancies;

    if (hasValue(filters.level)) {
      filtered = filtered.filter(
        (item) => item.level === filters.level
      );
    }

    if (hasValue(filters.scope)) {
      filtered = filtered.filter(
        (item) => item.scope === filters.scope
      );
    }

    if (hasValue(filters.position)) {
      const position = normalizePosition(filters.position);

      filtered = filtered.filter(
        (item) => item.position === position
      );
    }

    return {
      total: filtered.length,
      vacancies: filtered,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | VERIFICATION
  |--------------------------------------------------------------------------
  */

  async verifyLeader(id, verified = true, userOrId = null) {
    assertObjectId(id, "leader ID");

    const leader = await Leader.findById(id);

    if (!leader) {
      throw new AppError("Leadership record not found.", 404);
    }

    leader.verified = normalizeBoolean(verified) ?? true;
    leader.updatedBy = getCurrentUserId(userOrId);

    await leader.save();

    return Leader.findById(leader._id)
      .populate(MEMBER_POPULATE);
  }

  /*
  |--------------------------------------------------------------------------
  | LEADERSHIP HIERARCHY
  |--------------------------------------------------------------------------
  */

  async getLeadershipHierarchy(filters = {}) {
    const base = {
      ...getActiveQuery(),
    };

    if (hasValue(filters.county)) {
      base.county = normalizeLocation(filters.county);
    }

    const leaders = await Leader.find(base)
      .populate(MEMBER_POPULATE)
      .sort({ displayOrder: 1, createdAt: 1 });

    const patronage = leaders.filter(isPatronLeader);

    const regionalCabinet = leaders.filter(
      (leader) =>
        leader.level ===
        (LEADERSHIP_LEVELS.REGIONAL_CABINET || "regional_cabinet")
    );

    const regionalYouthAssembly = leaders.filter(
      (leader) =>
        leader.level ===
        (LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY ||
          "regional_youth_assembly")
    );

    const councilOfGovernors = leaders.filter(
      (leader) =>
        normalizePosition(leader.position) ===
        (LEADERSHIP_OFFICES.COUNCIL_GOVERNOR ||
          "council_governor")
    );

    const countyCabinet = leaders.filter(
      (leader) =>
        leader.level ===
        (LEADERSHIP_LEVELS.COUNTY_CABINET || "county_cabinet")
    );

    const countyYouthAssembly = leaders.filter(
      (leader) =>
        leader.level ===
        (LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY ||
          "county_youth_assembly")
    );

    const countyGroups = ALL_COUNTIES.reduce((result, county) => {
      result[county] = {
        county,
        cabinet: countyCabinet.filter(
          (leader) =>
            String(leader.county || "").toLowerCase() ===
            county.toLowerCase()
        ),
        youthAssembly: countyYouthAssembly.filter(
          (leader) =>
            String(leader.county || "").toLowerCase() ===
            county.toLowerCase()
        ),
        councilOfGovernors: councilOfGovernors.filter(
          (leader) =>
            String(leader.county || "").toLowerCase() ===
            county.toLowerCase()
        ),
      };

      return result;
    }, {});

    return {
      patronage: serializeLeaders(patronage),
      regionalCabinet: serializeLeaders(regionalCabinet),
      regionalYouthAssembly: serializeLeaders(regionalYouthAssembly),
      councilOfGovernors: serializeLeaders(councilOfGovernors),
      countyCabinet: serializeLeaders(countyCabinet),
      countyYouthAssembly: serializeLeaders(countyYouthAssembly),
      counties: countyGroups,
      summary: {
        totalActiveLeaders: leaders.length,
        patronage: patronage.length,
        regionalCabinet: regionalCabinet.length,
        regionalYouthAssembly: regionalYouthAssembly.length,
        councilOfGovernors: councilOfGovernors.length,
        countyCabinet: countyCabinet.length,
        countyYouthAssembly: countyYouthAssembly.length,
      },
    };
  }

  // Compatibility alias for the controller's existing method call.
  async getHierarchy(filters = {}) {
    return this.getLeadershipHierarchy(filters);
  }
}

export default new LeaderService();