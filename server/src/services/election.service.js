import Election from "../models/Election.js";
import ElectionApplication from "../models/ElectionApplication.js";
import Aspirant from "../models/Aspirant.js";
import Vote from "../models/Vote.js";
import Member from "../models/Member.js";
import Leader from "../models/leader.model.js";
import AppError from "../utils/AppError.js";

import {
  LEADERSHIP_LEVELS,
  LEADERSHIP_OFFICES,
  LEADERSHIP_DEPARTMENTS,
  LEADERSHIP_SCOPE,
  APPOINTMENT_TYPES,
  LEADERSHIP_STATUS,
} from "../constants/leadership.constants.js";

/* =======================================================
   HELPERS
======================================================= */

const getElection = async (electionId) => {
  if (!electionId) {
    throw new AppError(400, "Election ID is required.");
  }

  const election = await Election.findById(electionId);

  if (!election) {
    throw new AppError(404, "Election not found.");
  }

  return election;
};

const getPosition = (election, positionId) => {
  if (!election || !positionId) {
    throw new AppError(
      404,
      "Position not found in this election."
    );
  }

  const position = election.positions.id(positionId);

  if (!position) {
    throw new AppError(
      404,
      "Position not found in this election."
    );
  }

  return position;
};

const resolveApplicationPosition = (
  election,
  positionId
) => {
  if (!election || !positionId) {
    return null;
  }

  return (
    election.positions?.find(
      (position) =>
        String(position._id) === String(positionId)
    ) || null
  );
};

const normalizeApplication = (application) => {
  if (!application) {
    return application;
  }

  const election = application.election;

  const position = resolveApplicationPosition(
    election,
    application.positionId
  );

  return {
    ...application,

    electionId:
      election?._id ||
      application.election,

    election: election
      ? {
          ...election,
          _id: election._id,
        }
      : null,

    position,

    positionName:
      position?.name ||
      "Position Not Specified",

    positionLevel:
      position?.level ||
      "",

    positionDescription:
      position?.description ||
      "",

    positionCounty:
      position?.county ||
      "",

    positionConstituency:
      position?.constituency ||
      "",

    positionWard:
      position?.ward ||
      "",

    electionName:
      election?.name ||
      "Election",

    electionType:
      election?.type ||
      "elective",

    status:
      application.status ||
      "submitted",

    submittedAt:
      application.submittedAt ||
      application.createdAt,
  };
};

/* =======================================================
   ACTIVE MEMBER
======================================================= */

const getActiveMember = async (memberId) => {
  if (!memberId) {
    throw new AppError(
      401,
      "Authenticated member profile is required."
    );
  }

  const member = await Member.findById(memberId);

  if (!member) {
    throw new AppError(404, "Member not found.");
  }

 const active =
  member.membershipStatus === "active" ||
  (
    member.source === "imported" &&
    member.accountActivated === true
  );

  if (!active) {
    throw new AppError(
      403,
      "Only active JVP members are eligible to participate."
    );
  }

  return member;
};

/* =======================================================
   VOTER ELIGIBILITY
======================================================= */

/**
 * Supported voter eligibility types:
 *
 * 1. all_active_members
 *
 *    Any active JVP member may vote.
 *
 * 2. leaders
 *
 *    The member must have an active Leader record
 *    matching the election's configured leadership
 *    criteria.
 *
 * Example for Mombasa County Youth Assembly Speaker:
 *
 * voterEligibility: {
 *   type: "leaders",
 *   category: "county_leadership",
 *   position: "youth_mca",
 *   department: "legislative",
 *   scope: "ward",
 *   appointmentType: "elected",
 *   county: "Mombasa"
 * }
 *
 * IMPORTANT:
 *
 * Leader is the source of truth for leadership identity.
 *
 * We DO NOT use:
 *
 * member.youthAssemblyRole
 * member.youthAssemblyCounty
 *
 * to determine voter eligibility.
 */

/* =======================================================
   NORMALIZE VOTER ELIGIBILITY
======================================================= */

const normalizeVoterEligibility = (
  voterEligibility = {}
) => {
  const type =
    String(
      voterEligibility?.type ||
        "all_active_members"
    ).trim();

  if (
    ![
      "all_active_members",
      "leaders",
    ].includes(type)
  ) {
    throw new AppError(
      400,
      "Invalid voter eligibility type."
    );
  }

  if (
    type ===
    "all_active_members"
  ) {
    return {
      type: "all_active_members",
    };
  }

  const normalized = {
    type: "leaders",

    category:
      String(
        voterEligibility?.category ||
          ""
      ).trim(),

    position:
      String(
        voterEligibility?.position ||
          ""
      ).trim(),

    department:
      String(
        voterEligibility?.department ||
          ""
      ).trim(),

    scope:
      String(
        voterEligibility?.scope ||
          ""
      ).trim(),

    appointmentType:
      String(
        voterEligibility?.appointmentType ||
          ""
      ).trim(),

    county:
      String(
        voterEligibility?.county ||
          ""
      ).trim(),

    constituency:
      String(
        voterEligibility?.constituency ||
          ""
      ).trim(),

    ward:
      String(
        voterEligibility?.ward ||
          ""
      ).trim(),

    requireActiveLeadership:
      voterEligibility?.requireActiveLeadership !==
      false,
  };

  const hasLeadershipFilter =
    Boolean(
      normalized.category ||
      normalized.position ||
      normalized.department ||
      normalized.scope ||
      normalized.appointmentType
    );

  const hasGeographicFilter =
    Boolean(
      normalized.county ||
      normalized.constituency ||
      normalized.ward
    );

  if (
    !hasLeadershipFilter &&
    !hasGeographicFilter
  ) {
    throw new AppError(
      400,
      "At least one leadership or geographic eligibility filter is required when voter type is leaders."
    );
  }

  /*
   * Geographic consistency.
   */

  if (
    normalized.scope ===
      LEADERSHIP_SCOPE.COUNTY &&
    !normalized.county
  ) {
    throw new AppError(
      400,
      "County is required for county-level leader voter eligibility."
    );
  }

  if (
    normalized.scope ===
      LEADERSHIP_SCOPE.CONSTITUENCY &&
    (
      !normalized.county ||
      !normalized.constituency
    )
  ) {
    throw new AppError(
      400,
      "County and constituency are required for constituency-level leader voter eligibility."
    );
  }

  if (
    normalized.scope ===
      LEADERSHIP_SCOPE.WARD &&
    (
      !normalized.county ||
      !normalized.constituency ||
      !normalized.ward
    )
  ) {
    throw new AppError(
      400,
      "County, constituency and ward are required for ward-level leader voter eligibility."
    );
  }

  return normalized;
};

/* =======================================================
   VALIDATE ELECTION VOTER ELIGIBILITY CONFIGURATION
======================================================= */

const validateElectionVoterEligibility = (
  election
) => {
  const eligibility =
    election?.voterEligibility;

  /*
   * Legacy elections without voterEligibility
   * continue to allow active members to vote.
   */
  if (!eligibility) {
    return;
  }

  normalizeVoterEligibility(
    eligibility
  );
};

/* =======================================================
   FIND ELIGIBLE LEADER
======================================================= */

/**
 * Find an active Leader record belonging to a member
 * that satisfies the election's voter eligibility rules.
 *
 * The Leader module is the source of truth for:
 *
 * - category
 * - position
 * - department
 * - scope
 * - appointmentType
 * - county
 * - constituency
 * - ward
 * - active leadership status
 */

const findEligibleLeader = async (
  election,
  memberId
) => {
  const eligibility =
    election?.voterEligibility;

  /*
   * Legacy elections and elections open to all
   * active members do not require a Leader record.
   */
  if (
    !eligibility ||
    eligibility.type ===
      "all_active_members"
  ) {
    return null;
  }

  const normalized =
    normalizeVoterEligibility(
      eligibility
    );

  if (
    normalized.type !==
    "leaders"
  ) {
    throw new AppError(
      500,
      "This election has an unsupported voter eligibility configuration."
    );
  }

  const query = {
    member: memberId,
  };

  /*
   * By default, only current active leadership
   * records qualify.
   *
   * This matches the Leader model's definition of
   * current leadership:
   *
   * isActive === true
   * status === active
   */
  if (
    normalized.requireActiveLeadership !==
    false
  ) {
    query.isActive = true;
    query.status =
      LEADERSHIP_STATUS.ACTIVE;
  }

  /*
   * Leadership category.
   */
  if (
    normalized.category
  ) {
    query.category =
      normalized.category;
  }

  /*
   * Leadership office / position.
   */
  if (
    normalized.position
  ) {
    query.position =
      normalized.position;
  }

  /*
   * Leadership department.
   */
  if (
    normalized.department
  ) {
    query.department =
      normalized.department;
  }

  /*
   * Organizational scope.
   */
  if (
    normalized.scope
  ) {
    query.scope =
      normalized.scope;
  }

  /*
   * Appointment type.
   */
  if (
    normalized.appointmentType
  ) {
    query.appointmentType =
      normalized.appointmentType;
  }

  /*
   * County.
   */
  if (
    normalized.county
  ) {
    query.county =
      normalized.county;
  }

  /*
   * Constituency.
   */
  if (
    normalized.constituency
  ) {
    query.constituency =
      normalized.constituency;
  }

  /*
   * Ward.
   */
  if (
    normalized.ward
  ) {
    query.ward =
      normalized.ward;
  }

  return Leader.findOne(
    query
  )
    .sort({
      isActive: -1,
      termStart: -1,
      createdAt: -1,
    })
    .lean();
};

/* =======================================================
   ENFORCE VOTER ELIGIBILITY
======================================================= */

const enforceVoterEligibility = async (
  election,
  member
) => {
  validateElectionVoterEligibility(
    election
  );

  const eligibility =
    election?.voterEligibility;

  /*
   * Legacy elections or elections open to
   * all active members.
   */
  if (
    !eligibility ||
    eligibility.type ===
      "all_active_members"
  ) {
    return null;
  }

  if (
    eligibility.type !==
    "leaders"
  ) {
    throw new AppError(
      500,
      "This election has an unsupported voter eligibility configuration."
    );
  }

  const leader =
    await findEligibleLeader(
      election,
      member._id
    );

  if (!leader) {
    const normalized =
      normalizeVoterEligibility(
        eligibility
      );

    const filters = [];

    if (
      normalized.position
    ) {
      filters.push(
        `position: ${normalized.position}`
      );
    }

    if (
      normalized.category
    ) {
      filters.push(
        `category: ${normalized.category}`
      );
    }

    if (
      normalized.department
    ) {
      filters.push(
        `department: ${normalized.department}`
      );
    }

    if (
      normalized.scope
    ) {
      filters.push(
        `scope: ${normalized.scope}`
      );
    }

    if (
      normalized.appointmentType
    ) {
      filters.push(
        `appointment type: ${normalized.appointmentType}`
      );
    }

    if (
      normalized.county
    ) {
      filters.push(
        `county: ${normalized.county}`
      );
    }

    if (
      normalized.constituency
    ) {
      filters.push(
        `constituency: ${normalized.constituency}`
      );
    }

    if (
      normalized.ward
    ) {
      filters.push(
        `ward: ${normalized.ward}`
      );
    }

    const description =
      filters.length
        ? filters.join(", ")
        : "the required leadership designation";

    throw new AppError(
      403,
      `You are not eligible to vote in this election. Eligible voters must hold an active leadership designation matching ${description}.`
    );
  }

  return leader;
};

/* =======================================================
   ELECTION TYPE
======================================================= */

const validateElectionType = (
  type
) => {
  if (
    ![
      "elective",
      "nomination",
    ].includes(type)
  ) {
    throw new AppError(
      400,
      "Election type must be either elective or nomination."
    );
  }
};

const getMemberDisplayName = (
  member
) => {
  return [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

/* =======================================================
   ELECTIONS
======================================================= */

export const createElection = async (
  data,
  userId
) => {
  if (!data?.name) {
    throw new AppError(
      400,
      "Election name is required."
    );
  }

  if (!data?.scope) {
    throw new AppError(
      400,
      "Election scope is required."
    );
  }

  const type =
    data.type || "elective";

  validateElectionType(type);

  if (
    type === "nomination" &&
    !String(
      data.vettingCommittee || ""
    ).trim()
  ) {
    throw new AppError(
      400,
      "A vetting committee is required for nomination exercises."
    );
  }

  const electionData = {
    ...data,
    type,
    createdBy: userId,
  };

  /*
   * Normalize voter eligibility.
   *
   * If no voter eligibility is supplied,
   * all active members may vote.
   */
  electionData.voterEligibility =
    normalizeVoterEligibility(
      electionData.voterEligibility
    );

  /*
   * Nomination exercises do not proceed to voting.
   */
  if (
    type === "nomination"
  ) {
    electionData.votingStart =
      null;

    electionData.votingEnd =
      null;

    electionData.resultsPublished =
      false;
  }

  return Election.create(
    electionData
  );
};

/* =======================================================
   PUBLIC ELECTION LIST
======================================================= */

export const getElections = async (
  filters = {}
) => {
  const publicStatuses = [
    "open",
    "voting",
    "closed",
    "results",
  ];

  const query = {
    ...filters,
  };

  if (!query.status) {
    query.status = {
      $in: publicStatuses,
    };
  }

  return Election.find(query)
    .sort({
      createdAt: -1,
    })
    .lean();
};

export const getAdminElections = async (
  filters = {}
) => {
  return Election.find(filters)
    .sort({
      createdAt: -1,
    })
    .lean();
};

export const getElectionById = async (
  electionId
) => {
  return getElection(
    electionId
  );
};

export const updateElection = async (
  electionId,
  data
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    [
      "closed",
      "results",
      "cancelled",
    ].includes(
      election.status
    )
  ) {
    throw new AppError(
      400,
      "This election can no longer be modified."
    );
  }

  if (
    data.type !== undefined
  ) {
    validateElectionType(
      data.type
    );
  }

  const newType =
    data.type ||
    election.type ||
    "elective";

  if (
    newType === "nomination" &&
    !String(
      data.vettingCommittee ??
        election.vettingCommittee ??
        ""
    ).trim()
  ) {
    throw new AppError(
      400,
      "A vetting committee is required for nomination exercises."
    );
  }

  /*
   * Validate and normalize voter eligibility
   * when supplied.
   */
  if (
    data.voterEligibility !==
    undefined
  ) {
    const existingEligibility =
      election.voterEligibility
        ? election.voterEligibility.toObject
          ? election.voterEligibility.toObject()
          : election.voterEligibility
        : {};

    const incomingEligibility =
      data.voterEligibility ||
      {};

    const eligibility = {
      ...existingEligibility,
      ...incomingEligibility,
    };

    data.voterEligibility =
      normalizeVoterEligibility(
        eligibility
      );
  }

  Object.assign(
    election,
    data
  );

  election.type =
    newType;

  /*
   * Make sure existing elections also have
   * a valid voter eligibility configuration.
   */
  if (
    election.voterEligibility
  ) {
    election.voterEligibility =
      normalizeVoterEligibility(
        election.voterEligibility
      );
  }

  if (
    newType === "nomination"
  ) {
    election.votingStart =
      null;

    election.votingEnd =
      null;

    election.resultsPublished =
      false;
  }

  await election.save();

  return election;
};

/* =======================================================
   POSITIONS
======================================================= */

export const addPosition = async (
  electionId,
  position
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.status !==
    "draft"
  ) {
    throw new AppError(
      400,
      "Positions can only be added while the election is in draft."
    );
  }

  if (
    !position?.name ||
    !position?.level
  ) {
    throw new AppError(
      400,
      "Position name and level are required."
    );
  }

  election.positions.push({
    ...position,

    description:
      position.description ||
      "",
  });

  await election.save();

  return election;
};

export const updatePosition = async (
  electionId,
  positionId,
  data
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.status !==
    "draft"
  ) {
    throw new AppError(
      400,
      "Positions can only be modified while the election is in draft."
    );
  }

  const position =
    getPosition(
      election,
      positionId
    );

  if (
    data.name !==
    undefined
  ) {
    if (
      !String(
        data.name
      ).trim()
    ) {
      throw new AppError(
        400,
        "Position name cannot be empty."
      );
    }

    position.name =
      data.name.trim();
  }

  if (
    data.description !==
    undefined
  ) {
    position.description =
      String(
        data.description || ""
      ).trim();
  }

  if (
    data.level !==
    undefined
  ) {
    if (
      ![
        "regional",
        "county",
        "constituency",
        "ward",
      ].includes(
        data.level
      )
    ) {
      throw new AppError(
        400,
        "Invalid position level."
      );
    }

    position.level =
      data.level;
  }

  if (
    data.county !==
    undefined
  ) {
    position.county =
      String(
        data.county || ""
      ).trim();
  }

  if (
    data.constituency !==
    undefined
  ) {
    position.constituency =
      String(
        data.constituency || ""
      ).trim();
  }

  if (
    data.ward !==
    undefined
  ) {
    position.ward =
      String(
        data.ward || ""
      ).trim();
  }

  if (
    data.maxWinners !==
    undefined
  ) {
    const maxWinners =
      Number(
        data.maxWinners
      );

    if (
      !Number.isInteger(
        maxWinners
      ) ||
      maxWinners < 1
    ) {
      throw new AppError(
        400,
        "Maximum winners must be a positive whole number."
      );
    }

    position.maxWinners =
      maxWinners;
  }

  await election.save();

  return election;
};

export const removePosition =
  async (
    electionId,
    positionId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.status !==
      "draft"
    ) {
      throw new AppError(
        400,
        "Positions can only be removed while the election is in draft."
      );
    }

    const position =
      getPosition(
        election,
        positionId
      );

    position.deleteOne();

    await election.save();

    return election;
  };

/* =======================================================
   ELECTION LIFECYCLE
======================================================= */

export const openElection = async (
  electionId
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.status !==
    "draft"
  ) {
    throw new AppError(
      400,
      "Only draft elections can be opened."
    );
  }

  if (
    !election.positions.length
  ) {
    throw new AppError(
      400,
      "Add at least one position before opening the election."
    );
  }

  validateElectionType(
    election.type ||
      "elective"
  );

  /*
   * Validate and normalize voter eligibility
   * before opening.
   */
  if (
    election.voterEligibility
  ) {
    election.voterEligibility =
      normalizeVoterEligibility(
        election.voterEligibility
      );
  } else {
    election.voterEligibility = {
      type:
        "all_active_members",
    };
  }

  if (
    election.type ===
      "nomination" &&
    !String(
      election.vettingCommittee ||
        ""
    ).trim()
  ) {
    throw new AppError(
      400,
      "A vetting committee is required before opening a nomination exercise."
    );
  }

  if (
    election.type ===
    "nomination"
  ) {
    election.votingStart =
      null;

    election.votingEnd =
      null;

    election.resultsPublished =
      false;
  }

  election.status =
    "open";

  await election.save();

  return election;
};

export const startVoting = async (
  electionId
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.type ===
    "nomination"
  ) {
    throw new AppError(
      400,
      "Nomination exercises do not proceed to voting."
    );
  }

  if (
    election.status !==
    "open"
  ) {
    throw new AppError(
      400,
      "Only open elections can proceed to voting."
    );
  }

  /*
   * Validate voter eligibility before
   * voting begins.
   */
  if (
    election.voterEligibility
  ) {
    election.voterEligibility =
      normalizeVoterEligibility(
        election.voterEligibility
      );
  } else {
    election.voterEligibility = {
      type:
        "all_active_members",
    };
  }

  const aspirants =
    await Aspirant.countDocuments({
      election: electionId,
      status: "active",
    });

  if (!aspirants) {
    throw new AppError(
      400,
      "There are no approved aspirants for this election."
    );
  }

  election.status =
    "voting";

  election.votingStart =
    election.votingStart ||
    new Date();

  await election.save();

  return election;
};

export const closeElection = async (
  electionId
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.type ===
    "nomination"
  ) {
    throw new AppError(
      400,
      "Nomination exercises do not have a voting or results stage."
    );
  }

  if (
    ![
      "open",
      "voting",
    ].includes(
      election.status
    )
  ) {
    throw new AppError(
      400,
      "Only open or voting elections can be closed."
    );
  }

  election.status =
    "closed";

  election.votingEnd =
    election.votingEnd ||
    new Date();

  await election.save();

  return election;
};

export const cancelElection =
  async (
    electionId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      [
        "closed",
        "results",
        "cancelled",
      ].includes(
        election.status
      )
    ) {
      throw new AppError(
        400,
        "This election cannot be cancelled."
      );
    }

    election.status =
      "cancelled";

    await election.save();

    return election;
  };

/* =======================================================
   APPLICATION SUBMISSION
======================================================= */

export const submitApplication =
  async (
    electionId,
    positionId,
    memberId,
    data
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.status !==
      "open"
    ) {
      throw new AppError(
        400,
        "Applications are not currently open."
      );
    }

    const now =
      new Date();

    if (
      election.applicationStart &&
      now <
        election.applicationStart
    ) {
      throw new AppError(
        400,
        "The application period has not started."
      );
    }

    if (
      election.applicationEnd &&
      now >
        election.applicationEnd
    ) {
      throw new AppError(
        400,
        "The application period has ended."
      );
    }

    getPosition(
      election,
      positionId
    );

    const member =
      await getActiveMember(
        memberId
      );

    if (!data?.statement) {
      throw new AppError(
        400,
        "Statement of interest is required."
      );
    }

    if (
      data.declaration !==
      true
    ) {
      throw new AppError(
        400,
        "You must accept the declaration before submitting."
      );
    }

    const existing =
      await ElectionApplication.findOne(
        {
          election:
            electionId,

          positionId,

          member:
            member._id,
        }
      );

    if (existing) {
      throw new AppError(
        409,
        "You have already applied for this position."
      );
    }

    return ElectionApplication.create(
      {
        election:
          electionId,

        positionId,

        member:
          member._id,

        statement:
          data.statement,

        experience:
          data.experience ||
          "",

        manifesto:
          data.manifesto ||
          "",

        photo:
          data.photo ||
          "",

        documents:
          data.documents ||
          [],

        declaration:
          true,
      }
    );
  };

/* =======================================================
   ADMIN APPLICATIONS
======================================================= */

export const getApplications =
  async (
    filters = {}
  ) => {
    const applications =
      await ElectionApplication.find(
        filters
      )
        .populate(
          "member"
        )
        .populate(
          "election",
          "name description type scope county constituency ward status positions applicationStart applicationEnd votingStart votingEnd resultsPublished vettingCommittee voterEligibility"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return applications.map(
      (application) =>
        normalizeApplication(
          application
        )
    );
  };

export const getApplicationById =
  async (
    applicationId
  ) => {
    const application =
      await ElectionApplication.findById(
        applicationId
      )
        .populate(
          "member"
        )
        .populate(
          "election",
          "name description type scope county constituency ward status positions applicationStart applicationEnd votingStart votingEnd resultsPublished vettingCommittee voterEligibility"
        )
        .lean();

    if (!application) {
      throw new AppError(
        404,
        "Application not found."
      );
    }

    return normalizeApplication(
      application
    );
  };

/* =======================================================
   MEMBER APPLICATIONS
======================================================= */

export const getMyApplications =
  async (
    memberId
  ) => {
    if (!memberId) {
      throw new AppError(
        401,
        "Authenticated member profile is required."
      );
    }

    const applications =
      await ElectionApplication.find(
        {
          member:
            memberId,
        }
      )
        .populate(
          "election",
          "name description type scope county constituency ward status positions applicationStart applicationEnd votingStart votingEnd resultsPublished vettingCommittee voterEligibility"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return applications.map(
      (application) =>
        normalizeApplication(
          application
        )
    );
  };

/* =======================================================
   APPLICATION REVIEW
======================================================= */

export const reviewApplication =
  async (
    applicationId,
    status,
    remarks = "",
    reviewerId
  ) => {
    const application =
      await ElectionApplication.findById(
        applicationId
      );

    if (!application) {
      throw new AppError(
        404,
        "Application not found."
      );
    }

    const election =
      await getElection(
        application.election
      );

    const position =
      getPosition(
        election,
        application.positionId
      );

    const allowedStatuses = [
      "review",
      "vetted",
      "approved",
      "rejected",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw new AppError(
        400,
        "Invalid application status."
      );
    }

    /* =====================================================
       NOMINATION WORKFLOW
    ===================================================== */

    if (
      election.type ===
      "nomination"
    ) {
      if (
        [
          "appointed",
          "rejected",
        ].includes(
          application.status
        )
      ) {
        throw new AppError(
          400,
          "This nomination application can no longer be processed."
        );
      }

      /*
       * submitted → review
       */
      if (
        status === "review"
      ) {
        if (
          application.status !==
          "submitted"
        ) {
          throw new AppError(
            400,
            "Only submitted applications can be moved to review."
          );
        }

        application.status =
          "review";

        application.remarks =
          remarks;

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return application;
      }

      /*
       * review → vetted
       */
      if (
        status === "vetted"
      ) {
        if (
          application.status !==
          "review"
        ) {
          throw new AppError(
            400,
            "Only applications under review can be vetted."
          );
        }

        application.status =
          "vetted";

        application.remarks =
          remarks;

        application.vettingVerdict =
          "";

        application.vettingRemarks =
          remarks || "";

        application.vettedBy =
          reviewerId;

        application.vettedAt =
          new Date();

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return application;
      }

      /*
       * review/vetted/submitted → rejected
       */
      if (
        status === "rejected"
      ) {
        if (
          ![
            "review",
            "vetted",
            "submitted",
          ].includes(
            application.status
          )
        ) {
          throw new AppError(
            400,
            "This application cannot be rejected from its current status."
          );
        }

        application.status =
          "rejected";

        application.remarks =
          remarks;

        application.vettingVerdict =
          "rejected";

        application.vettingRemarks =
          remarks || "";

        application.vettedBy =
          application.vettedBy ||
          reviewerId;

        application.vettedAt =
          application.vettedAt ||
          new Date();

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return application;
      }

      /*
       * vetted → approved → appointed
       */
      if (
        status === "approved"
      ) {
        if (
          application.status !==
          "vetted"
        ) {
          throw new AppError(
            400,
            "The nomination must be vetted before approval."
          );
        }

        const appointmentDate =
          new Date();

        application.status =
          "appointed";

        application.remarks =
          remarks;

        application.vettingVerdict =
          "approved";

        application.vettingRemarks =
          remarks || "";

        application.vettedBy =
          application.vettedBy ||
          reviewerId;

        application.vettedAt =
          application.vettedAt ||
          appointmentDate;

        application.appointedAt =
          appointmentDate;

        application.appointedBy =
          reviewerId;

        application.appointmentRemarks =
          remarks || "";

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          appointmentDate;

        await application.save();

        return application;
      }
    }

    /* =====================================================
       ELECTIVE WORKFLOW
    ===================================================== */

    if (
      election.type ===
      "elective"
    ) {
      if (
        [
          "rejected",
          "withdrawn",
        ].includes(
          application.status
        )
      ) {
        throw new AppError(
          400,
          "This application can no longer be processed."
        );
      }

      /*
       * submitted → review
       */
      if (
        status === "review"
      ) {
        if (
          application.status !==
          "submitted"
        ) {
          throw new AppError(
            400,
            "Only submitted applications can be moved to review."
          );
        }

        application.status =
          "review";

        application.remarks =
          remarks;

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return getApplicationById(
          application._id
        );
      }

      /*
       * review → vetted
       */
      if (
        status === "vetted"
      ) {
        if (
          application.status !==
          "review"
        ) {
          throw new AppError(
            400,
            "Only applications under review can be vetted."
          );
        }

        application.status =
          "vetted";

        application.remarks =
          remarks;

        application.vettingVerdict =
          "";

        application.vettingRemarks =
          remarks || "";

        application.vettedBy =
          reviewerId;

        application.vettedAt =
          new Date();

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return getApplicationById(
          application._id
        );
      }

      /*
       * submitted/review/vetted → rejected
       */
      if (
        status === "rejected"
      ) {
        if (
          ![
            "submitted",
            "review",
            "vetted",
          ].includes(
            application.status
          )
        ) {
          throw new AppError(
            400,
            "This application cannot be rejected from its current status."
          );
        }

        application.status =
          "rejected";

        application.remarks =
          remarks;

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        return getApplicationById(
          application._id
        );
      }

      /*
       * vetted → approved
       */
      if (
        status === "approved"
      ) {
        if (
          application.status !==
          "vetted"
        ) {
          throw new AppError(
            400,
            "The application must be vetted before approval."
          );
        }

        application.status =
          "approved";

        application.remarks =
          remarks;

        application.reviewedBy =
          reviewerId;

        application.reviewedAt =
          new Date();

        await application.save();

        /*
         * Automatically create the aspirant.
         */
        await createAspirantFromApplication(
          application,
          election,
          position
        );

        return getApplicationById(
          application._id
        );
      }

      /*
       * Already approved applications cannot
       * be reviewed again.
       */
      if (
        application.status ===
        "approved"
      ) {
        throw new AppError(
          400,
          "This application has already been approved."
        );
      }
    }

    throw new AppError(
      400,
      "Unsupported election type."
    );
  };

/* =======================================================
   CREATE ASPIRANT FROM APPROVED APPLICATION
======================================================= */

const createAspirantFromApplication =
  async (
    application,
    election = null,
    position = null
  ) => {
    const existingByApplication =
      await Aspirant.findOne({
        application:
          application._id,
      });

    if (
      existingByApplication
    ) {
      return existingByApplication;
    }

    const resolvedElection =
      election ||
      (await getElection(
        application.election
      ));

    if (
      resolvedElection.type ===
      "nomination"
    ) {
      throw new AppError(
        400,
        "Nomination applications cannot create aspirants."
      );
    }

    const resolvedPosition =
      position ||
      getPosition(
        resolvedElection,
        application.positionId
      );

    if (!resolvedPosition) {
      throw new AppError(
        404,
        "The application position could not be resolved."
      );
    }

    const member =
      await Member.findById(
        application.member
      );

    if (!member) {
      throw new AppError(
        404,
        "Member associated with application was not found."
      );
    }

   const active =
  member.membershipStatus === "active" ||
  (
    member.source === "imported" &&
    member.accountActivated === true
  );

    if (!active) {
      throw new AppError(
        403,
        "The applicant is no longer an active JVP member."
      );
    }

    const existingByCandidate =
      await Aspirant.findOne({
        election:
          resolvedElection._id,

        positionId:
          application.positionId,

        member:
          application.member,
      });

    if (
      existingByCandidate
    ) {
      return existingByCandidate;
    }

    const name =
      getMemberDisplayName(
        member
      );

    try {
      const aspirant =
        await Aspirant.create({
          election:
            resolvedElection._id,

          positionId:
            application.positionId,

          member:
            application.member,

          application:
            application._id,

          source:
            "application",

          name:
            name ||
            "JVP Member",

          photo:
            application.photo ||
            "",

          manifesto:
            application.manifesto ||
            "",

          status:
            "active",
        });

      return aspirant;
    } catch (error) {
      if (
        error?.code ===
        11000
      ) {
        const existing =
          await Aspirant.findOne({
            election:
              resolvedElection._id,

            positionId:
              application.positionId,

            member:
              application.member,
          });

        if (existing) {
          return existing;
        }

        throw new AppError(
          409,
          "This member is already an aspirant for this position."
        );
      }

      throw error;
    }
  };

/* =======================================================
   LEGACY / EXISTING ASPIRANTS
======================================================= */

export const searchMembersForElection =
  async (
    search = ""
  ) => {
    const keyword =
      String(
        search || ""
      ).trim();

    if (
      keyword.length < 2
    ) {
      throw new AppError(
        400,
        "Enter at least 2 characters to search for a member."
      );
    }

    const regex =
      new RegExp(
        keyword.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        ),
        "i"
      );

    const members =
      await Member.find({
        $and: [
          {
            $or: [
              {
                firstName:
                  regex,
              },
              {
                middleName:
                  regex,
              },
              {
                lastName:
                  regex,
              },
              {
                email:
                  regex,
              },
              {
                phone:
                  regex,
              },
              {
                memberNumber:
                  regex,
              },
            ],
          },
          {
            $or: [
              {
                isActive:
                  true,
              },
              {
                membershipStatus:
                  "active",
              },
              {
                source:
                  "imported",
                accountActivated:
                  true,
              },
            ],
          },
        ],
      })
        .select(
          "firstName middleName lastName email phone memberNumber photo profilePhoto isActive membershipStatus source accountActivated"
        )
        .sort({
          firstName: 1,
          lastName: 1,
        })
        .limit(25)
        .lean();

    return members.map(
      (member) => ({
        ...member,

        name:
          getMemberDisplayName(
            member
          ),
      })
    );
  };

/* =======================================================
   ADD EXISTING / MANUAL ASPIRANT
======================================================= */

export const addExistingAspirant =
  async (
    electionId,
    positionId,
    memberId,
    data = {}
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.type !==
      "elective"
    ) {
      throw new AppError(
        400,
        "Existing aspirants can only be added to elective elections."
      );
    }

    if (
      [
        "closed",
        "results",
        "cancelled",
      ].includes(
        election.status
      )
    ) {
      throw new AppError(
        400,
        "Aspirants cannot be added to an election that has already closed."
      );
    }

    if (
      election.status ===
      "voting"
    ) {
      throw new AppError(
        400,
        "Aspirants cannot be added after voting has started."
      );
    }

    const position =
      getPosition(
        election,
        positionId
      );

    const member =
      await getActiveMember(
        memberId
      );

    const existing =
      await Aspirant.findOne({
        election:
          election._id,

        positionId:
          position._id,

        member:
          member._id,
      });

    if (existing) {
      throw new AppError(
        409,
        "This member is already an aspirant for this position."
      );
    }

    const name =
      String(
        data.name ||
          getMemberDisplayName(
            member
          ) ||
          "JVP Member"
      ).trim();

    if (!name) {
      throw new AppError(
        400,
        "Aspirant name is required."
      );
    }

    const photo =
      String(
        data.photo ||
          member.photo ||
          member.profilePhoto ||
          ""
      ).trim();

    const manifesto =
      String(
        data.manifesto ||
          ""
      ).trim();

    try {
      const aspirant =
        await Aspirant.create({
          election:
            election._id,

          positionId:
            position._id,

          member:
            member._id,

          application:
            null,

          source:
            "legacy",

          name,

          photo,

          manifesto,

          status:
            "active",
        });

      return Aspirant.findById(
        aspirant._id
      )
        .populate(
          "member"
        )
        .populate(
          "election",
          "name description type scope status positions votingStart votingEnd resultsPublished voterEligibility"
        )
        .lean();
    } catch (error) {
      if (
        error?.code ===
        11000
      ) {
        const existingAspirant =
          await Aspirant.findOne({
            election:
              election._id,

            positionId:
              position._id,

            member:
              member._id,
          })
            .populate(
              "member"
            )
            .populate(
              "election",
              "name description type scope status positions votingStart votingEnd resultsPublished voterEligibility"
            )
            .lean();

        if (
          existingAspirant
        ) {
          throw new AppError(
            409,
            "This member is already an aspirant for this position."
          );
        }
      }

      throw error;
    }
  };

/* =======================================================
   REMOVE EXISTING / LEGACY ASPIRANT
======================================================= */

export const removeExistingAspirant =
  async (
    electionId,
    aspirantId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.type !==
      "elective"
    ) {
      throw new AppError(
        400,
        "Aspirants only exist for elective elections."
      );
    }

    if (
      [
        "voting",
        "closed",
        "results",
        "cancelled",
      ].includes(
        election.status
      )
    ) {
      throw new AppError(
        400,
        "Aspirants can no longer be removed at this stage of the election."
      );
    }

    const aspirant =
      await Aspirant.findOne({
        _id:
          aspirantId,

        election:
          election._id,
      });

    if (!aspirant) {
      throw new AppError(
        404,
        "Aspirant not found in this election."
      );
    }

    if (
      aspirant.status !==
      "active"
    ) {
      throw new AppError(
        400,
        "This aspirant is no longer active."
      );
    }

    if (
      aspirant.source ===
        "application" &&
      aspirant.application
    ) {
      throw new AppError(
        400,
        "This aspirant originated from an election application. Manage the candidate through the application workflow."
      );
    }

    aspirant.status =
      "withdrawn";

    await aspirant.save();

    return aspirant;
  };

/* =======================================================
   ELECTION SETUP
======================================================= */

export const getElectionSetup =
  async (
    electionId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.type !==
      "elective"
    ) {
      return {
        election,

        positions: [],

        aspirants: [],

        totalAspirants: 0,

        positionsWithoutAspirants:
          [],

        readyForVoting:
          false,

        reason:
          "Nomination exercises do not proceed to voting.",
      };
    }

    const aspirants =
      await Aspirant.find({
        election:
          election._id,

        status:
          "active",
      })
        .populate(
          "member",
          "firstName middleName lastName email phone memberNumber photo profilePhoto"
        )
        .sort({
          createdAt: 1,
        })
        .lean();

    const positionSetup =
      election.positions.map(
        (position) => {
          const positionAspirants =
            aspirants.filter(
              (aspirant) =>
                String(
                  aspirant.positionId
                ) ===
                String(
                  position._id
                )
            );

          return {
            position,

            aspirants:
              positionAspirants,

            aspirantCount:
              positionAspirants.length,

            ready:
              positionAspirants.length >
              0,
          };
        }
      );

    const positionsWithoutAspirants =
      positionSetup.filter(
        (item) =>
          item.aspirantCount ===
          0
      );

    const readyForVoting =
      election.positions.length >
        0 &&
      aspirants.length > 0 &&
      positionsWithoutAspirants.length ===
        0 &&
      [
        "open",
        "voting",
      ].includes(
        election.status
      );

    let reason = "";

    if (
      !election.positions.length
    ) {
      reason =
        "Add at least one election position.";
    } else if (
      positionsWithoutAspirants.length
    ) {
      reason =
        "Every election position must have at least one active aspirant.";
    } else if (
      ![
        "open",
        "voting",
      ].includes(
        election.status
      )
    ) {
      reason =
        "The election must be open before voting can start.";
    }

    return {
      election,

      positions:
        positionSetup,

      aspirants,

      totalAspirants:
        aspirants.length,

      positionsWithoutAspirants,

      readyForVoting,

      reason,
    };
  };

/* =======================================================
   PREPARE ELECTION FOR VOTING
======================================================= */

export const prepareElectionForVoting =
  async (
    electionId
  ) => {
    let election =
      await getElection(
        electionId
      );

    if (
      election.type !==
      "elective"
    ) {
      throw new AppError(
        400,
        "Only elective elections can proceed to voting."
      );
    }

    if (
      [
        "closed",
        "results",
        "cancelled",
      ].includes(
        election.status
      )
    ) {
      throw new AppError(
        400,
        "This election can no longer be prepared for voting."
      );
    }

    /*
     * Validate voter eligibility before
     * preparing the election.
     */
    validateElectionVoterEligibility(
      election
    );

    /*
     * If still in draft, open it first.
     */
    if (
      election.status ===
      "draft"
    ) {
      if (
        !election.positions?.length
      ) {
        throw new AppError(
          400,
          "Add at least one position before preparing the election for voting."
        );
      }

      election =
        await openElection(
          election._id
        );
    }

    /*
     * Verify election setup.
     */
    const setup =
      await getElectionSetup(
        election._id
      );

    if (
      !setup.readyForVoting &&
      election.status !==
        "voting"
    ) {
      throw new AppError(
        400,
        setup.reason ||
          "The election is not ready for voting."
      );
    }

    /*
     * Already voting.
     */
    if (
      election.status ===
      "voting"
    ) {
      return election;
    }

    /*
     * Open → voting.
     */
    return startVoting(
      election._id
    );
  };

/* =======================================================
   WITHDRAW APPLICATION
======================================================= */

export const withdrawApplication =
  async (
    applicationId,
    memberId
  ) => {
    const application =
      await ElectionApplication.findOne(
        {
          _id:
            applicationId,

          member:
            memberId,
        }
      );

    if (!application) {
      throw new AppError(
        404,
        "Application not found."
      );
    }

    if (
      [
        "approved",
        "appointed",
        "rejected",
      ].includes(
        application.status
      )
    ) {
      throw new AppError(
        400,
        "This application can no longer be withdrawn."
      );
    }

    application.status =
      "withdrawn";

    await application.save();

    await Aspirant.findOneAndUpdate(
      {
        application:
          application._id,
      },
      {
        status:
          "withdrawn",
      }
    );

    return application;
  };

/* =======================================================
   ASPIRANTS
======================================================= */

export const getAspirants =
  async (
    filters = {}
  ) => {
    if (
      filters.election
    ) {
      const election =
        await Election.findById(
          filters.election
        )
          .select("type")
          .lean();

      if (
        election &&
        election.type ===
          "nomination"
      ) {
        return [];
      }
    }

    return Aspirant.find(
      filters
    )
      .populate(
        "member"
      )
      .populate(
        "election",
        "name description type scope status voterEligibility"
      )
      .sort({
        createdAt: 1,
      })
      .lean();
  };

export const getAspirantById =
  async (
    aspirantId
  ) => {
    const aspirant =
      await Aspirant.findById(
        aspirantId
      )
        .populate(
          "member"
        )
        .populate(
          "election"
        );

    if (!aspirant) {
      throw new AppError(
        404,
        "Aspirant not found."
      );
    }

    if (
      aspirant.election?.type ===
      "nomination"
    ) {
      throw new AppError(
        400,
        "Nomination exercises do not have aspirants."
      );
    }

    return aspirant;
  };

/* =======================================================
   VOTING
======================================================= */

export const castVote = async (
  electionId,
  positionId,
  aspirantId,
  memberId
) => {
  const election =
    await getElection(
      electionId
    );

  if (
    election.type ===
    "nomination"
  ) {
    throw new AppError(
      400,
      "Nomination exercises do not proceed to voting."
    );
  }

  if (
    election.status !==
    "voting"
  ) {
    throw new AppError(
      400,
      "Voting is not currently open."
    );
  }

  const now =
    new Date();

  if (
    election.votingStart &&
    now <
      election.votingStart
  ) {
    throw new AppError(
      400,
      "Voting has not started yet."
    );
  }

  if (
    election.votingEnd &&
    now >
      election.votingEnd
  ) {
    throw new AppError(
      400,
      "Voting has ended."
    );
  }

  /*
   * Get and validate the active member.
   */
  const member =
    await getActiveMember(
      memberId
    );

  /*
   * IMPORTANT:
   *
   * Voter eligibility is determined from
   * the Leader module.
   *
   * For the Mombasa County Youth Assembly
   * Speaker election, for example, the Leader
   * query can require:
   *
   * county          = Mombasa
   * position        = youth_mca
   * category        = county_leadership
   * department      = legislative
   * scope           = ward
   * appointmentType = elected
   * isActive        = true
   * status          = active
   */
  await enforceVoterEligibility(
    election,
    member
  );

  /*
   * Validate that the position belongs
   * to this election.
   */
  getPosition(
    election,
    positionId
  );

  /*
   * Validate the selected aspirant.
   */
  const aspirant =
    await Aspirant.findOne({
      _id:
        aspirantId,

      election:
        electionId,

      positionId,

      status:
        "active",
    });

  if (!aspirant) {
    throw new AppError(
      400,
      "Selected aspirant is not valid for this position."
    );
  }

  /*
   * Prevent duplicate voting.
   */
  const existingVote =
    await Vote.findOne({
      election:
        electionId,

      positionId,

      voter:
        memberId,
    });

  if (existingVote) {
    throw new AppError(
      409,
      "You have already voted for this position."
    );
  }

  try {
    return await Vote.create({
      election:
        electionId,

      positionId,

      aspirant:
        aspirantId,

      voter:
        memberId,
    });
  } catch (error) {
    if (
      error?.code ===
      11000
    ) {
      throw new AppError(
        409,
        "You have already voted for this position."
      );
    }

    throw error;
  }
};

/* =======================================================
   MY VOTES
======================================================= */

export const getMyVotes =
  async (
    electionId,
    memberId
  ) => {
    if (!memberId) {
      throw new AppError(
        401,
        "Authenticated member profile is required."
      );
    }

    if (electionId) {
      const election =
        await getElection(
          electionId
        );

      if (
        election.type ===
        "nomination"
      ) {
        return [];
      }
    }

    const filter = {
      voter:
        memberId,
    };

    if (electionId) {
      filter.election =
        electionId;
    }

    const votes =
      await Vote.find(
        filter
      )
        .populate(
          "aspirant",
          "name photo manifesto positionId status source"
        )
        .populate(
          "election",
          "name description type scope status positions votingStart votingEnd resultsPublished voterEligibility"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    return votes.map(
      (vote) => {
        const election =
          vote.election;

        const position =
          election?.positions?.find(
            (item) =>
              String(
                item._id
              ) ===
              String(
                vote.positionId
              )
          ) || null;

        return {
          ...vote,

          electionId:
            election?._id ||
            vote.election,

          election,

          position,

          positionName:
            position?.name ||
            "Position",

          electionName:
            election?.name ||
            "Election",

          aspirantName:
            vote.aspirant?.name ||
            "Aspirant",

          votedAt:
            vote.castAt ||
            vote.createdAt,
        };
      }
    );
  };

/* =======================================================
   RESULTS
======================================================= */

export const getResults =
  async (
    electionId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.type ===
      "nomination"
    ) {
      throw new AppError(
        400,
        "Nomination exercises do not have election results."
      );
    }

    if (
      election.status !==
        "results" &&
      !election.resultsPublished
    ) {
      throw new AppError(
        403,
        "Election results have not been published."
      );
    }

    const results =
      await Vote.aggregate([
        {
          $match: {
            election:
              election._id,
          },
        },

        {
          $group: {
            _id: {
              positionId:
                "$positionId",

              aspirant:
                "$aspirant",
            },

            votes: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            "_id.positionId":
              1,

            votes:
              -1,
          },
        },
      ]);

    const aspirantIds =
      results.map(
        (result) =>
          result._id
            .aspirant
      );

    const aspirants =
      await Aspirant.find({
        _id: {
          $in:
            aspirantIds,
        },
      })
        .select(
          "name photo manifesto positionId status source"
        )
        .lean();

    const aspirantMap =
      new Map(
        aspirants.map(
          (aspirant) => [
            aspirant._id.toString(),
            aspirant,
          ]
        )
      );

    return {
      election,

      results:
        results.map(
          (result) => ({
            positionId:
              result._id
                .positionId,

            aspirant:
              aspirantMap.get(
                result._id
                  .aspirant
                  .toString()
              ) || null,

            votes:
              result.votes,
          })
        ),
    };
  };

export const publishResults =
  async (
    electionId
  ) => {
    const election =
      await getElection(
        electionId
      );

    if (
      election.type ===
      "nomination"
    ) {
      throw new AppError(
        400,
        "Nomination exercises do not have results to publish."
      );
    }

    if (
      election.status !==
      "closed"
    ) {
      throw new AppError(
        400,
        "Close the election before publishing results."
      );
    }

    election.status =
      "results";

    election.resultsPublished =
      true;

    await election.save();

    return getResults(
      electionId
    );
  };