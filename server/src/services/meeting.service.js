import mongoose from "mongoose";

import Meeting from "../models/meeting.model.js";
import User from "../models/User.js";

import {
  generateMeetingNumber,
} from "../utils/generateMeetingNumber.js";

/* ==========================================================
   CONSTANTS
========================================================== */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ACTIVE_MEETING_STATUSES = [
  "scheduled",
  "live",
];

const MANAGEABLE_MEETING_STATUSES = [
  "draft",
  "scheduled",
  "postponed",
];

const POPULATE_OPTIONS = [
  {
    path: "createdBy",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "host",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "coHosts",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "moderators",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "participants.user",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "agenda.presenter",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "documents.uploadedBy",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "minutes.preparedBy",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "minutes.approvedBy",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "actionItems.assignedTo",
    select:
      "email role isActive lastLogin",
  },
  {
    path: "actionItems.createdBy",
    select:
      "email role isActive lastLogin",
  },
];

/* ==========================================================
   ERROR HELPER
========================================================== */

const createServiceError = (
  message,
  statusCode = 400,
  code = "MEETING_SERVICE_ERROR"
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

/* ==========================================================
   GENERAL HELPERS
========================================================== */

const normalizeId = (value) => {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value._id
  ) {
    return value._id.toString();
  }

  return value.toString();
};

const isValidObjectId = (value) => {
  const normalizedValue =
    normalizeId(value);

  if (!normalizedValue) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(
    normalizedValue
  );
};

const assertValidObjectId = (
  value,
  fieldName
) => {
  if (!isValidObjectId(value)) {
    throw createServiceError(
      `Invalid ${fieldName}.`,
      400,
      "INVALID_OBJECT_ID"
    );
  }
};

const idsEqual = (
  firstId,
  secondId
) => {
  const first =
    normalizeId(firstId);

  const second =
    normalizeId(secondId);

  if (!first || !second) {
    return false;
  }

  return first === second;
};

const uniqueObjectIds = (
  values = []
) => {
  const uniqueIds =
    new Set();

  for (const value of values) {
    const normalizedValue =
      normalizeId(value);

    if (
      normalizedValue &&
      mongoose.Types.ObjectId.isValid(
        normalizedValue
      )
    ) {
      uniqueIds.add(
        normalizedValue
      );
    }
  }

  return [...uniqueIds];
};

/* ==========================================================
   AUTHENTICATED ACTOR HELPERS
========================================================== */

const getActorIds = (
  actor
) => {
  if (!actor) {
    return [];
  }

  return uniqueObjectIds([
    actor._id,
    actor.id,
    actor.userId,
    actor.memberId,
    actor.user,
    actor.member,
    actor.user?._id,
    actor.member?._id,
  ]);
};

const actorMatchesId = (
  actor,
  value
) => {
  const targetId =
    normalizeId(value);

  if (!targetId) {
    return false;
  }

  const actorIds =
    getActorIds(actor);

  return actorIds.includes(
    targetId
  );
};

const isMeetingCreator = (
  meeting,
  actor
) => {
  if (!meeting || !actor) {
    return false;
  }

  const creatorReferences = [
    meeting.createdBy,
    meeting.createdByUser,
    meeting.createdByMember,
    meeting.creator,
    meeting.organizer,
    meeting.organizedBy,
  ];

  return creatorReferences.some(
    (creatorReference) =>
      actorMatchesId(
        actor,
        creatorReference
      )
  );
};

const isMeetingHost = (
  meeting,
  actor
) => {
  if (!meeting || !actor) {
    return false;
  }

  const hostReferences = [
    meeting.host,
    meeting.hostUser,
    meeting.hostMember,
  ];

  if (
    hostReferences.some(
      (hostReference) =>
        actorMatchesId(
          actor,
          hostReference
        )
    )
  ) {
    return true;
  }

  if (
    Array.isArray(
      meeting.hosts
    )
  ) {
    return meeting.hosts.some(
      (host) =>
        actorMatchesId(
          actor,
          host?.user ||
            host?.member ||
            host
        )
    );
  }

  return false;
};

const isMeetingManager = (
  meeting,
  actor
) => {
  if (!meeting || !actor) {
    return false;
  }

  if (
    isMeetingCreator(
      meeting,
      actor
    ) ||
    isMeetingHost(
      meeting,
      actor
    )
  ) {
    return true;
  }

  const managerCollections = [
    meeting.managers,
    meeting.coHosts,
    meeting.moderators,
  ];

  return managerCollections.some(
    (collection) =>
      Array.isArray(collection) &&
      collection.some(
        (manager) =>
          actorMatchesId(
            actor,
            manager?.user ||
              manager?.member ||
              manager
          )
      )
  );
};

/* ==========================================================
   PAGINATION HELPERS
========================================================== */

const parsePagination = ({
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT,
} = {}) => {
  const parsedPage = Math.max(
    Number.parseInt(
      page,
      10
    ) || DEFAULT_PAGE,
    1
  );

  const parsedLimit = Math.min(
    Math.max(
      Number.parseInt(
        limit,
        10
      ) || DEFAULT_LIMIT,
      1
    ),
    MAX_LIMIT
  );

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip:
      (parsedPage - 1) *
      parsedLimit,
  };
};

/* ==========================================================
   STRING HELPERS
========================================================== */

const escapeRegularExpression = (
  value
) => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/* ==========================================================
   DATE HELPERS
========================================================== */

const ensureDate = (
  value,
  fieldName
) => {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    throw createServiceError(
      `${fieldName} must be a valid date.`,
      400,
      "INVALID_DATE"
    );
  }

  return date;
};

const ensureMeetingSchedule = ({
  scheduledStart,
  scheduledEnd,
}) => {
  const startDate =
    ensureDate(
      scheduledStart,
      "Meeting start time"
    );

  const endDate =
    ensureDate(
      scheduledEnd,
      "Meeting end time"
    );

  if (
    endDate <= startDate
  ) {
    throw createServiceError(
      "Meeting end time must be after the start time.",
      400,
      "INVALID_MEETING_SCHEDULE"
    );
  }

  return {
    startDate,
    endDate,
  };
};

/* ==========================================================
   OBJECT HELPERS
========================================================== */

const removeUndefinedValues = (
  object = {}
) => {
  return Object.fromEntries(
    Object.entries(
      object
    ).filter(
      ([, value]) =>
        value !== undefined
    )
  );
};

/* ==========================================================
   USER HELPERS
========================================================== */

const ensureUsersExist = async (
  userIds = [],
  {
    requireActive = true,
    errorMessage =
      "One or more selected users do not exist.",
  } = {}
) => {
  const uniqueIds =
    uniqueObjectIds(userIds);

  if (!uniqueIds.length) {
    return [];
  }

  const query = {
    _id: {
      $in: uniqueIds,
    },
  };

  if (requireActive) {
    /*
     * The current project has used both
     * isActive and active during development.
     * This query accepts either property.
     */
    query.$or = [
      {
        isActive: true,
      },
      {
        active: true,
      },
    ];
  }

  const users = await User.find(query)
    .select("_id email role")
    .lean();

  if (
    users.length !== uniqueIds.length
  ) {
    throw createServiceError(
      errorMessage,
      404,
      "USER_NOT_FOUND"
    );
  }

  return users;
};

/* ==========================================================
   MEETING RETRIEVAL HELPERS
========================================================== */

const findMeetingDocument = async (
  meetingId,
  {
    includeDeleted = false,
    populate = false,
  } = {}
) => {
  assertValidObjectId(
    meetingId,
    "meeting ID"
  );

  const filter = {
    _id: meetingId,
  };

  if (!includeDeleted) {
    filter.deletedAt = null;
  }

  let query = Meeting.findOne(filter);

  if (populate) {
    for (
      const populateOption of
      POPULATE_OPTIONS
    ) {
      query = query.populate(
        populateOption
      );
    }
  }

  const meeting = await query;

  if (!meeting) {
    throw createServiceError(
      "Meeting not found.",
      404,
      "MEETING_NOT_FOUND"
    );
  }

  return meeting;
};

const findMeetingByRoomCodeDocument =
  async (
    roomCode,
    {
      populate = false,
    } = {}
  ) => {
    if (!roomCode) {
      throw createServiceError(
        "Meeting room code is required.",
        400,
        "ROOM_CODE_REQUIRED"
      );
    }

    const normalizedRoomCode =
      roomCode
        .trim()
        .toUpperCase();

    let query = Meeting.findOne({
      "liveRoom.roomCode":
        normalizedRoomCode,

      deletedAt: null,
    });

    if (populate) {
      for (
        const populateOption of
        POPULATE_OPTIONS
      ) {
        query = query.populate(
          populateOption
        );
      }
    }

    const meeting = await query;

    if (!meeting) {
      throw createServiceError(
        "Meeting room not found.",
        404,
        "MEETING_ROOM_NOT_FOUND"
      );
    }

    return meeting;
  };

/* ==========================================================
   AUTHORIZATION HELPERS
========================================================== */

const getUserRole = (user) => {
  return (
    user?.role ||
    user?.user?.role ||
    ""
  );
};

const getUserIds = (user) => {
  if (!user) {
    return [];
  }

  return uniqueObjectIds([
    user._id,
    user.id,
    user.userId,
    user.memberId,
    user.user,
    user.member,
    user.user?._id,
    user.member?._id,
  ]);
};

const userMatchesReference = (
  user,
  reference
) => {
  const referenceId =
    normalizeId(reference);

  if (!referenceId) {
    return false;
  }

  return getUserIds(user).includes(
    referenceId
  );
};

const isSystemAdministrator = (
  user
) => {
  const role =
    getUserRole(user);

  return [
    "admin",
    "super_admin",
  ].includes(role);
};

const isMeetingModerator = (
  meeting,
  user
) => {
  if (
    !meeting ||
    !user ||
    !Array.isArray(
      meeting.moderators
    )
  ) {
    return false;
  }

  return meeting.moderators.some(
    (moderator) =>
      userMatchesReference(
        user,
        moderator?.user ||
          moderator
      )
  );
};

const isMeetingParticipant = (
  meeting,
  user
) => {
  if (
    !meeting ||
    !user ||
    !Array.isArray(
      meeting.participants
    )
  ) {
    return false;
  }

  return meeting.participants.some(
    (participant) =>
      userMatchesReference(
        user,
        participant?.user ||
          participant
      )
  );
};

const canManageMeeting = (
  meeting,
  user
) => {
  if (!meeting || !user) {
    return false;
  }

  if (
    isSystemAdministrator(user)
  ) {
    return true;
  }

  if (
    isMeetingCreator(
      meeting,
      user
    ) ||
    isMeetingHost(
      meeting,
      user
    ) ||
    isMeetingModerator(
      meeting,
      user
    )
  ) {
    return true;
  }

  if (
    typeof meeting.canManageMeeting ===
    "function"
  ) {
    return getUserIds(
      user
    ).some((userId) =>
      meeting.canManageMeeting(
        userId
      )
    );
  }

  return false;
};

const canEditMeeting = (
  meeting,
  user
) => {
  if (
    !canManageMeeting(
      meeting,
      user
    )
  ) {
    return false;
  }

  return MANAGEABLE_MEETING_STATUSES.includes(
    meeting.status
  );
};

const assertCanManageMeeting = (
  meeting,
  user
) => {
  if (
    !canManageMeeting(
      meeting,
      user
    )
  ) {
    throw createServiceError(
      "You are not authorized to manage this meeting.",
      403,
      "MEETING_ACCESS_DENIED"
    );
  }
};

const assertCanStartMeeting = (
  meeting,
  user
) => {
  const userId =
    user?._id ||
    user?.id;

  const isHost =
    meeting.isHost(
      userId
    );

  const isCoHost =
    meeting.isCoHost(
      userId
    );

  if (
    !isHost &&
    !isCoHost
  ) {
    throw createServiceError(
      "Only the meeting host or a co-host can start this meeting.",
      403,
      "MEETING_START_FORBIDDEN"
    );
  }
};

const assertCanEndMeeting = (
  meeting,
  user
) => {
  const userId =
    user?._id ||
    user?.id;

  if (
    !meeting.isHost(
      userId
    )
  ) {
    throw createServiceError(
      "Only the primary meeting host can end this meeting.",
      403,
      "MEETING_END_FORBIDDEN"
    );
  }
};


const assertCanEditMeeting = (
  meeting,
  user
) => {
  if (
    !canEditMeeting(
      meeting,
      user
    )
  ) {
    throw createServiceError(
      "This meeting cannot be edited in its current status.",
      403,
      "MEETING_NOT_EDITABLE"
    );
  }
};

const assertMeetingParticipant = (
  meeting,
  user
) => {
  if (
    getUserIds(user).length === 0
  ) {
    throw createServiceError(
      "Authentication is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (
    isSystemAdministrator(user) ||
    isMeetingCreator(
      meeting,
      user
    ) ||
    isMeetingHost(
      meeting,
      user
    ) ||
    isMeetingModerator(
      meeting,
      user
    ) ||
    isMeetingParticipant(
      meeting,
      user
    )
  ) {
    return;
  }

  throw createServiceError(
    "You are not invited to this meeting.",
    403,
    "MEETING_INVITATION_REQUIRED"
  );
};

/* ==========================================================
   PARTICIPANT HELPERS
========================================================== */

const findParticipant = (
  meeting,
  userId
) => {
  return meeting.participants.find(
    (participant) =>
      idsEqual(
        participant.user,
        userId
      )
  );
};

const ensureParticipantRecord = (
  meeting,
  userId,
  role = "participant"
) => {
  let participant =
    findParticipant(
      meeting,
      userId
    );

  if (!participant) {
    meeting.participants.push({
      user: userId,
      role,
      invitationStatus:
        "accepted",
      respondedAt: new Date(),
    });

    participant =
      meeting.participants[
        meeting.participants.length -
          1
      ];
  }

  return participant;
};

const synchronizeLeadershipParticipants =
  (meeting) => {
    const roleAssignments = [
      {
        userId: meeting.host,
        role: "host",
      },

      ...meeting.coHosts.map(
        (userId) => ({
          userId,
          role: "co_host",
        })
      ),

      ...meeting.moderators.map(
        (userId) => ({
          userId,
          role: "moderator",
        })
      ),
    ];

    for (const assignment of roleAssignments) {
      const participant =
        ensureParticipantRecord(
          meeting,
          assignment.userId,
          assignment.role
        );

      participant.role =
        assignment.role;

      participant.invitationStatus =
        "accepted";

      participant.respondedAt =
        participant.respondedAt ||
        new Date();
    }
  };

/* ==========================================================
   CREATE MEETING
========================================================== */

export const createMeeting = async ({
  meetingData,
  currentUser,
}) => {
  if (!currentUser?._id) {
    throw createServiceError(
      "Authentication is required.",
      401,
      "AUTHENTICATION_REQUIRED"
    );
  }

  if (!meetingData) {
    throw createServiceError(
      "Meeting information is required.",
      400,
      "MEETING_DATA_REQUIRED"
    );
  }

  const {
    startDate,
    endDate,
  } = ensureMeetingSchedule({
    scheduledStart:
      meetingData.scheduledStart,

    scheduledEnd:
      meetingData.scheduledEnd,
  });

  const hostId =
    meetingData.host ||
    currentUser._id;

  assertValidObjectId(
    hostId,
    "meeting host"
  );

  const coHostIds =
    uniqueObjectIds(
      meetingData.coHosts || []
    ).filter(
      (userId) =>
        !idsEqual(userId, hostId)
    );

  const moderatorIds =
    uniqueObjectIds(
      meetingData.moderators || []
    ).filter(
      (userId) =>
        !idsEqual(userId, hostId) &&
        !coHostIds.some((coHostId) =>
          idsEqual(
            coHostId,
            userId
          )
        )
    );

  const participantIds =
    uniqueObjectIds(
      (
        meetingData.participants ||
        []
      ).map((participant) =>
        typeof participant ===
        "object"
          ? participant.user
          : participant
      )
    );

  await ensureUsersExist([
    hostId,
    ...coHostIds,
    ...moderatorIds,
    ...participantIds,
  ]);

  const meetingNumber =
    await generateMeetingNumber({
      year:
        startDate.getFullYear(),
    });

  const participants = (
    meetingData.participants || []
  )
    .map((participant) => {
      if (
        typeof participant ===
        "string"
      ) {
        return {
          user: participant,
          role: "participant",
          invitationStatus:
            "pending",
        };
      }

      return {
        user: participant.user,
        role:
          participant.role ||
          "participant",

        invitationStatus:
          participant.invitationStatus ||
          "pending",
      };
    })
    .filter(
      (participant) =>
        isValidObjectId(
          participant.user
        )
    );

  const meeting = new Meeting({
    ...meetingData,

    meetingNumber,

    scheduledStart: startDate,

    scheduledEnd: endDate,

    createdBy: currentUser._id,

    updatedBy: currentUser._id,

    host: hostId,

    coHosts: coHostIds,

    moderators: moderatorIds,

    participants,

    status:
      meetingData.status ||
      "draft",
  });

  synchronizeLeadershipParticipants(
    meeting
  );

  await meeting.save();

  return getMeetingById({
    meetingId: meeting._id,
    currentUser,
  });
};

/* ==========================================================
   GET MEETING
========================================================== */

export const getMeetingById = async ({
  meetingId,
  currentUser,
}) => {
  const meeting =
    await findMeetingDocument(
      meetingId,
      {
        populate: true,
      }
    );

  const isCreator =
    isMeetingCreator(
      meeting,
      currentUser
    );

  const canManage =
    canManageMeeting(
      meeting,
      currentUser
    );

  if (
    meeting.status === "draft" &&
    !isCreator &&
    !canManage
  ) {
    throw createServiceError(
      "You are not authorized to view this draft meeting.",
      403,
      "MEETING_ACCESS_DENIED"
    );
  }

  return meeting;
};

export const getMeetingByRoomCode =
  async ({
    roomCode,
    currentUser,
  }) => {
    const meeting =
      await findMeetingByRoomCodeDocument(
        roomCode,
        {
          populate: true,
        }
      );

    if (
      meeting.liveRoom
        .requireAuthentication &&
      !currentUser?._id
    ) {
      throw createServiceError(
        "Authentication is required to access this meeting.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    if (
      !meeting.liveRoom.allowGuests
    ) {
      assertMeetingParticipant(
        meeting,
        currentUser
      );
    }

    return meeting;
  };

/* ==========================================================
   LIST MEETINGS
========================================================== */

export const listMeetings = async ({
  currentUser,
  filters = {},
}) => {
  const {
    page,
    limit,
    skip,
  } = parsePagination(filters);

  const query = {
    deletedAt: null,
  };

  if (filters.status) {
    query.status =
      filters.status;
  }

  if (filters.meetingType) {
    query.meetingType =
      filters.meetingType;
  }

  if (filters.format) {
    query.format =
      filters.format;
  }

  if (filters.leadershipLevel) {
    query.leadershipLevel =
      filters.leadershipLevel
        .trim()
        .toLowerCase();
  }

  if (filters.department) {
    query.department =
      filters.department
        .trim()
        .toLowerCase();
  }

  if (filters.scopeLevel) {
    query["scope.level"] =
      filters.scopeLevel;
  }

  if (filters.county) {
    query["scope.county"] =
      filters.county;
  }

  if (filters.constituency) {
    query[
      "scope.constituency"
    ] = filters.constituency;
  }

  if (filters.ward) {
    query["scope.ward"] =
      filters.ward;
  }

  if (filters.createdBy) {
    assertValidObjectId(
      filters.createdBy,
      "meeting creator"
    );

    query.createdBy =
      filters.createdBy;
  }

  if (filters.host) {
    assertValidObjectId(
      filters.host,
      "meeting host"
    );

    query.host =
      filters.host;
  }

  if (filters.startDate) {
    query.scheduledStart = {
      ...(query.scheduledStart ||
        {}),

      $gte: ensureDate(
        filters.startDate,
        "Start date"
      ),
    };
  }

  if (filters.endDate) {
    query.scheduledStart = {
      ...(query.scheduledStart ||
        {}),

      $lte: ensureDate(
        filters.endDate,
        "End date"
      ),
    };
  }

  if (filters.search) {
    const searchTerm =
      escapeRegularExpression(
        filters.search.trim()
      );

    query.$or = [
      {
        title: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        description: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        meetingNumber: {
          $regex: searchTerm,
          $options: "i",
        },
      },
      {
        "liveRoom.roomCode": {
          $regex: searchTerm,
          $options: "i",
        },
      },
    ];
  }

  /*
   * Non-administrators only see:
   * - public scheduled/live/completed meetings
   * - meetings they created
   * - meetings they host or manage
   * - meetings where they are participants
   */
  if (
    currentUser?._id &&
    !isSystemAdministrator(
      currentUser
    )
  ) {
    const userId =
      currentUser._id;

    const accessQuery = {
      $or: [
        {
          createdBy: userId,
        },
        {
          host: userId,
        },
        {
          coHosts: userId,
        },
        {
          moderators: userId,
        },
        {
          "participants.user":
            userId,
        },
      ],
    };

    if (query.$or) {
      query.$and = [
        {
          $or: query.$or,
        },
        accessQuery,
      ];

      delete query.$or;
    } else {
      Object.assign(
        query,
        accessQuery
      );
    }
  } else if (!currentUser?._id) {
    query.status = {
      $in: [
        "scheduled",
        "live",
        "completed",
      ],
    };
  }

  const sort = {};

  switch (filters.sortBy) {
    case "oldest":
      sort.scheduledStart = 1;
      break;

    case "recently_created":
      sort.createdAt = -1;
      break;

    case "recently_updated":
      sort.updatedAt = -1;
      break;

    default:
      sort.scheduledStart = -1;
      break;
  }

  const [
    meetings,
    total,
  ] = await Promise.all([
    Meeting.find(query)
      .populate(
        "host",
        "email role isActive"
      )
      .populate(
        "createdBy",
        "email role isActive"
      )
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean({
        virtuals: true,
      }),

    Meeting.countDocuments(query),
  ]);

  return {
    meetings,

    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(
        total / limit
      ),
      hasNextPage:
        page * limit < total,
      hasPreviousPage:
        page > 1,
    },
  };
};

/* ==========================================================
   USER MEETINGS
========================================================== */

export const getMyMeetings =
  async ({
    currentUser,
    filters = {},
  }) => {
    if (!currentUser?._id) {
      throw createServiceError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const {
      page,
      limit,
      skip,
    } = parsePagination(filters);

    const query = {
      deletedAt: null,

      $or: [
        {
          createdBy:
            currentUser._id,
        },
        {
          host:
            currentUser._id,
        },
        {
          coHosts:
            currentUser._id,
        },
        {
          moderators:
            currentUser._id,
        },
        {
          "participants.user":
            currentUser._id,
        },
      ],
    };

    if (filters.status) {
      query.status =
        filters.status;
    }

    if (filters.upcoming) {
      query.scheduledStart = {
        $gte: new Date(),
      };

      query.status = {
        $in: [
          "scheduled",
          "live",
        ],
      };
    }

    const [
      meetings,
      total,
    ] = await Promise.all([
      Meeting.find(query)
        .populate(
          "host",
          "email role isActive"
        )
        .sort({
          scheduledStart: 1,
        })
        .skip(skip)
        .limit(limit)
        .lean({
          virtuals: true,
        }),

      Meeting.countDocuments(
        query
      ),
    ]);

    return {
      meetings,

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(
          total / limit
        ),
      },
    };
  };

/* ==========================================================
   UPDATE MEETING
========================================================== */

export const updateMeeting =
  async ({
    meetingId,
    updates,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    if (!updates) {
      throw createServiceError(
        "Meeting updates are required.",
        400,
        "MEETING_UPDATES_REQUIRED"
      );
    }

    const protectedFields = [
      "_id",
      "meetingNumber",
      "createdBy",
      "participants",
      "actualStart",
      "actualEnd",
      "deletedAt",
      "createdAt",
      "updatedAt",
      "liveRoom.roomCode",
      "liveRoom.signalingRoomId",
    ];

    for (const field of protectedFields) {
      delete updates[field];
    }

    const scheduledStart =
      updates.scheduledStart ||
      meeting.scheduledStart;

    const scheduledEnd =
      updates.scheduledEnd ||
      meeting.scheduledEnd;

    const {
      startDate,
      endDate,
    } = ensureMeetingSchedule({
      scheduledStart,
      scheduledEnd,
    });

    updates.scheduledStart =
      startDate;

    updates.scheduledEnd =
      endDate;

    if (updates.host) {
      await ensureUsersExist([
        updates.host,
      ]);
    }

    Object.assign(
      meeting,
      removeUndefinedValues(
        updates
      )
    );

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return getMeetingById({
      meetingId: meeting._id,
      currentUser,
    });
  };

/* ==========================================================
   SCHEDULE AND POSTPONE
========================================================== */

export const scheduleMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (
      ![
        "draft",
        "postponed",
      ].includes(meeting.status)
    ) {
      throw createServiceError(
        "Only draft or postponed meetings can be scheduled.",
        409,
        "INVALID_MEETING_STATUS"
      );
    }

    if (
      meeting.scheduledEnd <=
      meeting.scheduledStart
    ) {
      throw createServiceError(
        "Meeting schedule is invalid.",
        400,
        "INVALID_MEETING_SCHEDULE"
      );
    }

    meeting.status = "scheduled";
    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

export const postponeMeeting =
  async ({
    meetingId,
    scheduledStart,
    scheduledEnd,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (
      !ACTIVE_MEETING_STATUSES.includes(
        meeting.status
      ) &&
      meeting.status !== "draft"
    ) {
      throw createServiceError(
        "This meeting cannot be postponed.",
        409,
        "INVALID_MEETING_STATUS"
      );
    }

    if (meeting.status === "live") {
      throw createServiceError(
        "A live meeting must be ended before it can be postponed.",
        409,
        "MEETING_ALREADY_LIVE"
      );
    }

    const {
      startDate,
      endDate,
    } = ensureMeetingSchedule({
      scheduledStart,
      scheduledEnd,
    });

    meeting.scheduledStart =
      startDate;

    meeting.scheduledEnd =
      endDate;

    meeting.status = "postponed";
    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   CANCEL MEETING
========================================================== */

export const cancelMeeting =
  async ({
    meetingId,
    reason,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (
      [
        "completed",
        "cancelled",
      ].includes(meeting.status)
    ) {
      throw createServiceError(
        "This meeting cannot be cancelled.",
        409,
        "INVALID_MEETING_STATUS"
      );
    }

    if (!reason?.trim()) {
      throw createServiceError(
        "A cancellation reason is required.",
        400,
        "CANCELLATION_REASON_REQUIRED"
      );
    }

    const wasLive =
  meeting.status === "live";

meeting.status = "cancelled";

meeting.cancellationReason =
  reason.trim();

meeting.cancelledBy =
  currentUser._id;

meeting.cancelledAt =
  new Date();

if (wasLive) {
  meeting.actualEnd =
    new Date();

  meeting.liveRoom.currentParticipantCount =
    0;

  meeting.liveRoom.endedBy =
    currentUser._id;
}

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   DELETE AND RESTORE
========================================================== */

export const deleteMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (meeting.status === "live") {
      throw createServiceError(
        "A live meeting cannot be deleted.",
        409,
        "MEETING_ALREADY_LIVE"
      );
    }

    meeting.deletedAt =
      new Date();

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return {
      success: true,
      message:
        "Meeting deleted successfully.",
    };
  };

export const restoreMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId,
        {
          includeDeleted: true,
        }
      );

    if (
      !isSystemAdministrator(
        currentUser
      ) &&
      !idsEqual(
        meeting.createdBy,
        currentUser?._id
      )
    ) {
      throw createServiceError(
        "You are not authorized to restore this meeting.",
        403,
        "MEETING_ACCESS_DENIED"
      );
    }

    meeting.deletedAt = null;

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   INVITE PARTICIPANTS
========================================================== */

export const inviteParticipants =
  async ({
    meetingId,
    participants,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    if (
      !Array.isArray(participants) ||
      !participants.length
    ) {
      throw createServiceError(
        "At least one participant is required.",
        400,
        "PARTICIPANTS_REQUIRED"
      );
    }

    const participantIds =
      participants.map(
        (participant) =>
          typeof participant ===
          "object"
            ? participant.user
            : participant
      );

    await ensureUsersExist(
      participantIds
    );

    for (const participantData of participants) {
      const userId =
        typeof participantData ===
        "object"
          ? participantData.user
          : participantData;

      const role =
        typeof participantData ===
        "object"
          ? participantData.role ||
            "participant"
          : "participant";

      const existingParticipant =
        findParticipant(
          meeting,
          userId
        );

      if (existingParticipant) {
        if (
          existingParticipant
            .removedFromMeeting
        ) {
          existingParticipant.removedFromMeeting =
            false;

          existingParticipant.removedBy =
            null;

          existingParticipant.removalReason =
            "";
        }

        existingParticipant.role =
          role;

        existingParticipant.invitationStatus =
          "pending";

        existingParticipant.invitedAt =
          new Date();

        existingParticipant.respondedAt =
          null;

        continue;
      }

      meeting.participants.push({
        user: userId,
        role,
        invitationStatus:
          "pending",
        invitedAt: new Date(),
      });
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   REMOVE PARTICIPANT
========================================================== */

export const removeParticipant =
  async ({
    meetingId,
    participantUserId,
    reason = "",
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    assertValidObjectId(
      participantUserId,
      "participant user ID"
    );

    if (
      idsEqual(
        meeting.host,
        participantUserId
      )
    ) {
      throw createServiceError(
        "The meeting host cannot be removed.",
        409,
        "HOST_CANNOT_BE_REMOVED"
      );
    }

    const participant =
      findParticipant(
        meeting,
        participantUserId
      );

    if (!participant) {
      throw createServiceError(
        "Participant is not part of this meeting.",
        404,
        "PARTICIPANT_NOT_FOUND"
      );
    }

    participant.removedFromMeeting =
      true;

    participant.removedBy =
      currentUser._id;

    participant.removalReason =
      reason?.trim() || "";

    participant.leftAt =
      participant.leftAt ||
      new Date();

    participant.microphoneEnabled =
      false;

    participant.cameraEnabled =
      false;

    participant.screenSharing =
      false;

    participant.handRaised =
      false;

    meeting.liveRoom.currentParticipantCount =
      meeting.participants.filter(
        (item) =>
          item.joinedAt &&
          !item.leftAt &&
          !item.removedFromMeeting
      ).length;

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   RSVP
========================================================== */

export const respondToMeetingInvitation =
  async ({
    meetingId,
    response,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (!currentUser?._id) {
      throw createServiceError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const allowedResponses = [
      "accepted",
      "declined",
      "tentative",
    ];

    if (
      !allowedResponses.includes(
        response
      )
    ) {
      throw createServiceError(
        "Invalid meeting invitation response.",
        400,
        "INVALID_RSVP_STATUS"
      );
    }

    const participant =
      findParticipant(
        meeting,
        currentUser._id
      );

    if (!participant) {
      throw createServiceError(
        "You have not been invited to this meeting.",
        403,
        "MEETING_INVITATION_REQUIRED"
      );
    }

    if (
      participant.removedFromMeeting
    ) {
      throw createServiceError(
        "You have been removed from this meeting.",
        403,
        "PARTICIPANT_REMOVED"
      );
    }

    participant.invitationStatus =
      response;

    participant.respondedAt =
      new Date();

    await meeting.save();

    return participant;
  };

/* ==========================================================
   HOST, CO-HOSTS AND MODERATORS
========================================================== */

export const changeMeetingHost =
  async ({
    meetingId,
    newHostUserId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (
      !isSystemAdministrator(
        currentUser
      ) &&
      !meeting.isHost(
        currentUser?._id
      )
    ) {
      throw createServiceError(
        "Only the current host or an administrator can transfer hosting.",
        403,
        "HOST_TRANSFER_DENIED"
      );
    }

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    await ensureUsersExist([
      newHostUserId,
    ]);

    const previousHostId =
      meeting.host;

    meeting.host =
      newHostUserId;

    meeting.coHosts =
      meeting.coHosts.filter(
        (userId) =>
          !idsEqual(
            userId,
            newHostUserId
          )
      );

    if (
      previousHostId &&
      !meeting.coHosts.some(
        (userId) =>
          idsEqual(
            userId,
            previousHostId
          )
      )
    ) {
      meeting.coHosts.push(
        previousHostId
      );
    }

    synchronizeLeadershipParticipants(
      meeting
    );

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

export const addMeetingManagers =
  async ({
    meetingId,
    coHosts = [],
    moderators = [],
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    const coHostIds =
      uniqueObjectIds(coHosts).filter(
        (userId) =>
          !idsEqual(
            userId,
            meeting.host
          )
      );

    const moderatorIds =
      uniqueObjectIds(
        moderators
      ).filter(
        (userId) =>
          !idsEqual(
            userId,
            meeting.host
          )
      );

    await ensureUsersExist([
      ...coHostIds,
      ...moderatorIds,
    ]);

    meeting.coHosts =
      uniqueObjectIds([
        ...meeting.coHosts,
        ...coHostIds,
      ]);

    meeting.moderators =
      uniqueObjectIds([
        ...meeting.moderators,
        ...moderatorIds,
      ]).filter(
        (userId) =>
          !meeting.coHosts.some(
            (coHostId) =>
              idsEqual(
                coHostId,
                userId
              )
          )
      );

    synchronizeLeadershipParticipants(
      meeting
    );

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

export const removeMeetingManager =
  async ({
    meetingId,
    managerUserId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (
      !isSystemAdministrator(
        currentUser
      ) &&
      !meeting.isHost(
        currentUser?._id
      )
    ) {
      throw createServiceError(
        "Only the host or an administrator can remove a meeting manager.",
        403,
        "MEETING_ACCESS_DENIED"
      );
    }

    meeting.coHosts =
      meeting.coHosts.filter(
        (userId) =>
          !idsEqual(
            userId,
            managerUserId
          )
      );

    meeting.moderators =
      meeting.moderators.filter(
        (userId) =>
          !idsEqual(
            userId,
            managerUserId
          )
      );

    const participant =
      findParticipant(
        meeting,
        managerUserId
      );

    if (participant) {
      participant.role =
        "participant";
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   START MEETING
========================================================== */

export const startMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

   assertCanStartMeeting(
  meeting,
  currentUser
);

    if (
      ![
        "scheduled",
        "postponed",
      ].includes(meeting.status)
    ) {
      throw createServiceError(
        "Only a scheduled meeting can be started.",
        409,
        "INVALID_MEETING_STATUS"
      );
    }

    if (
      !meeting.liveRoom.enabled &&
      meeting.format ===
        "jvp_connect"
    ) {
      throw createServiceError(
        "The meeting live room is disabled.",
        409,
        "LIVE_ROOM_DISABLED"
      );
    }

    meeting.status = "live";

    meeting.actualStart =
      meeting.actualStart ||
      new Date();

    meeting.actualEnd = null;

    meeting.liveRoom.startedBy =
      currentUser._id;

    meeting.updatedBy =
      currentUser._id;

    const participant =
      ensureParticipantRecord(
        meeting,
        currentUser._id,
        meeting.isHost(
          currentUser._id
        )
          ? "host"
          : "co_host"
      );

    participant.joinedAt =
      new Date();

    participant.leftAt = null;

    participant.attendanceStatus =
      "present";

    participant.admittedAt =
      participant.admittedAt ||
      new Date();

    participant.admittedBy =
      participant.admittedBy ||
      currentUser._id;

    meeting.liveRoom.currentParticipantCount =
      meeting.participants.filter(
        (item) =>
          item.joinedAt &&
          !item.leftAt &&
          !item.removedFromMeeting
      ).length;

    meeting.liveRoom.peakParticipantCount =
      Math.max(
        meeting.liveRoom
          .peakParticipantCount,
        meeting.liveRoom
          .currentParticipantCount
      );

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   JOIN MEETING
========================================================== */

export const joinMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (!currentUser?._id) {
      throw createServiceError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    if (meeting.status !== "live") {
      throw createServiceError(
        "This meeting is not currently live.",
        409,
        "MEETING_NOT_LIVE"
      );
    }

    if (
      meeting.liveRoom.roomLocked &&
      !canManageMeeting(
        meeting,
        currentUser
      )
    ) {
      throw createServiceError(
        "The meeting room is locked.",
        403,
        "MEETING_ROOM_LOCKED"
      );
    }

    let participant =
      findParticipant(
        meeting,
        currentUser._id
      );

    if (
      !participant &&
      !meeting.liveRoom.allowGuests
    ) {
      throw createServiceError(
        "You are not invited to this meeting.",
        403,
        "MEETING_INVITATION_REQUIRED"
      );
    }

    if (!participant) {
      meeting.participants.push({
        user: currentUser._id,
        role: "observer",
        invitationStatus:
          "accepted",
        respondedAt: new Date(),
      });

      participant =
        meeting.participants[
          meeting.participants.length -
            1
        ];
    }

    if (
      participant.removedFromMeeting
    ) {
      throw createServiceError(
        participant.removalReason ||
          "You have been removed from this meeting.",
        403,
        "PARTICIPANT_REMOVED"
      );
    }

    if (
      participant.invitationStatus ===
      "declined"
    ) {
      participant.invitationStatus =
        "accepted";

      participant.respondedAt =
        new Date();
    }

    if (
      meeting.liveRoom
        .currentParticipantCount >=
        meeting.liveRoom
          .maximumParticipants &&
      !participant.joinedAt
    ) {
      throw createServiceError(
        "The meeting has reached its maximum participant capacity.",
        409,
        "MEETING_CAPACITY_REACHED"
      );
    }

    participant.joinedAt =
      new Date();

    participant.leftAt = null;

    participant.attendanceStatus =
      participant.attendanceStatus ===
      "not_recorded"
        ? "present"
        : participant.attendanceStatus;

    participant.microphoneEnabled =
      !meeting.liveRoom
        .muteParticipantsOnEntry &&
      meeting.liveRoom
        .allowParticipantMicrophone;

    participant.cameraEnabled =
      !meeting.liveRoom
        .disableCameraOnEntry &&
      meeting.liveRoom
        .allowParticipantCamera;

    meeting.liveRoom.currentParticipantCount =
      meeting.participants.filter(
        (item) =>
          item.joinedAt &&
          !item.leftAt &&
          !item.removedFromMeeting
      ).length;

    meeting.liveRoom.peakParticipantCount =
      Math.max(
        meeting.liveRoom
          .peakParticipantCount,
        meeting.liveRoom
          .currentParticipantCount
      );

    await meeting.save();

    return {
      meeting,

      participant,

      waitingRoomRequired:
        meeting.liveRoom
          .waitingRoomEnabled &&
        !participant.admittedAt &&
        !canManageMeeting(
          meeting,
          currentUser
        ),
    };
  };

/* ==========================================================
   ADMIT PARTICIPANT
========================================================== */

export const admitParticipant =
  async ({
    meetingId,
    participantUserId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const participant =
      findParticipant(
        meeting,
        participantUserId
      );

    if (!participant) {
      throw createServiceError(
        "Participant not found in this meeting.",
        404,
        "PARTICIPANT_NOT_FOUND"
      );
    }

    if (
      participant.removedFromMeeting
    ) {
      throw createServiceError(
        "A removed participant cannot be admitted.",
        409,
        "PARTICIPANT_REMOVED"
      );
    }

    participant.admittedBy =
      currentUser._id;

    participant.admittedAt =
      new Date();

    await meeting.save();

    return participant;
  };

/* ==========================================================
   LEAVE MEETING
========================================================== */

export const leaveMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (!currentUser?._id) {
      throw createServiceError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const participant =
      findParticipant(
        meeting,
        currentUser._id
      );

    if (!participant) {
      throw createServiceError(
        "Participant record not found.",
        404,
        "PARTICIPANT_NOT_FOUND"
      );
    }

    const now = new Date();

    if (
      participant.joinedAt &&
      !participant.leftAt
    ) {
      const sessionDuration =
        Math.max(
          Math.floor(
            (now.getTime() -
              participant.joinedAt.getTime()) /
              1000
          ),
          0
        );

      participant.totalDurationSeconds +=
        sessionDuration;
    }

    participant.leftAt = now;

    participant.microphoneEnabled =
      false;

    participant.cameraEnabled =
      false;

    participant.screenSharing =
      false;

    participant.handRaised =
      false;

    meeting.liveRoom.currentParticipantCount =
      meeting.participants.filter(
        (item) =>
          item.joinedAt &&
          !item.leftAt &&
          !item.removedFromMeeting
      ).length;

    await meeting.save();

    return participant;
  };

/* ==========================================================
   END MEETING
========================================================== */

export const endMeeting =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEndMeeting(
  meeting,
  currentUser
);

    if (meeting.status !== "live") {
      throw createServiceError(
        "Only a live meeting can be ended.",
        409,
        "MEETING_NOT_LIVE"
      );
    }

    const now = new Date();

    for (const participant of meeting.participants) {
      if (
        participant.joinedAt &&
        !participant.leftAt
      ) {
        const sessionDuration =
          Math.max(
            Math.floor(
              (now.getTime() -
                participant.joinedAt.getTime()) /
                1000
            ),
            0
          );

        participant.totalDurationSeconds +=
          sessionDuration;

        participant.leftAt =
          now;
      }

      participant.microphoneEnabled =
        false;

      participant.cameraEnabled =
        false;

      participant.screenSharing =
        false;

      participant.handRaised =
        false;
    }

    meeting.status = "completed";

    meeting.actualEnd = now;

    meeting.liveRoom.endedBy =
      currentUser._id;

    meeting.liveRoom.currentParticipantCount =
      0;

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting;
  };

/* ==========================================================
   ROOM CONTROLS
========================================================== */

export const updateLiveRoomSettings =
  async ({
    meetingId,
    settings,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const allowedFields = [
      "roomLocked",
      "waitingRoomEnabled",
      "requireAuthentication",
      "allowGuests",
      "allowParticipantScreenShare",
      "allowParticipantChat",
      "allowParticipantMicrophone",
      "allowParticipantCamera",
      "muteParticipantsOnEntry",
      "disableCameraOnEntry",
      "maximumParticipants",
      "mediaMode",
    ];

    for (const field of allowedFields) {
      if (
        settings[field] !==
        undefined
      ) {
        meeting.liveRoom[field] =
          settings[field];
      }
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.liveRoom;
  };

export const updateParticipantMedia =
  async ({
    meetingId,
    participantUserId,
    media,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    const isOwnMedia =
      idsEqual(
        participantUserId,
        currentUser?._id
      );

    if (
      !isOwnMedia &&
      !canManageMeeting(
        meeting,
        currentUser
      )
    ) {
      throw createServiceError(
        "You cannot control this participant.",
        403,
        "PARTICIPANT_CONTROL_DENIED"
      );
    }

    const participant =
      findParticipant(
        meeting,
        participantUserId
      );

    if (!participant) {
      throw createServiceError(
        "Participant not found.",
        404,
        "PARTICIPANT_NOT_FOUND"
      );
    }

    if (
      media.microphoneEnabled !==
      undefined
    ) {
      if (
        media.microphoneEnabled &&
        !meeting.liveRoom
          .allowParticipantMicrophone &&
        !canManageMeeting(
          meeting,
          currentUser
        )
      ) {
        throw createServiceError(
          "Participant microphones are disabled.",
          403,
          "MICROPHONE_DISABLED"
        );
      }

      participant.microphoneEnabled =
        Boolean(
          media.microphoneEnabled
        );
    }

    if (
      media.cameraEnabled !==
      undefined
    ) {
      if (
        media.cameraEnabled &&
        !meeting.liveRoom
          .allowParticipantCamera &&
        !canManageMeeting(
          meeting,
          currentUser
        )
      ) {
        throw createServiceError(
          "Participant cameras are disabled.",
          403,
          "CAMERA_DISABLED"
        );
      }

      participant.cameraEnabled =
        Boolean(
          media.cameraEnabled
        );
    }

    if (
      media.screenSharing !==
      undefined
    ) {
      if (
        media.screenSharing &&
        !meeting.liveRoom
          .allowParticipantScreenShare &&
        !canManageMeeting(
          meeting,
          currentUser
        )
      ) {
        throw createServiceError(
          "Participant screen sharing is disabled.",
          403,
          "SCREEN_SHARING_DISABLED"
        );
      }

      if (media.screenSharing) {
        for (const item of meeting.participants) {
          if (
            !idsEqual(
              item.user,
              participantUserId
            )
          ) {
            item.screenSharing =
              false;
          }
        }
      }

      participant.screenSharing =
        Boolean(
          media.screenSharing
        );
    }

    if (
      media.handRaised !==
      undefined
    ) {
      participant.handRaised =
        Boolean(
          media.handRaised
        );
    }

    await meeting.save();

    return participant;
  };

/* ==========================================================
   AGENDA
========================================================== */

export const addAgendaItem =
  async ({
    meetingId,
    agendaItem,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    if (!agendaItem?.title?.trim()) {
      throw createServiceError(
        "Agenda item title is required.",
        400,
        "AGENDA_TITLE_REQUIRED"
      );
    }

    if (agendaItem.presenter) {
      await ensureUsersExist([
        agendaItem.presenter,
      ]);
    }

    const displayOrder =
      agendaItem.displayOrder ??
      meeting.agenda.length;

    meeting.agenda.push({
      ...agendaItem,
      title:
        agendaItem.title.trim(),
      displayOrder,
    });

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.agenda[
      meeting.agenda.length - 1
    ];
  };

export const updateAgendaItem =
  async ({
    meetingId,
    agendaItemId,
    updates,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const agendaItem =
      meeting.agenda.id(
        agendaItemId
      );

    if (!agendaItem) {
      throw createServiceError(
        "Agenda item not found.",
        404,
        "AGENDA_ITEM_NOT_FOUND"
      );
    }

    const allowedFields = [
      "title",
      "description",
      "presenter",
      "durationMinutes",
      "displayOrder",
      "status",
      "notes",
    ];

    for (const field of allowedFields) {
      if (
        updates[field] !==
        undefined
      ) {
        agendaItem[field] =
          updates[field];
      }
    }

    if (
      updates.status ===
        "in_progress" &&
      !agendaItem.startedAt
    ) {
      agendaItem.startedAt =
        new Date();
    }

    if (
      updates.status ===
      "completed"
    ) {
      agendaItem.startedAt =
        agendaItem.startedAt ||
        new Date();

      agendaItem.completedAt =
        new Date();
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return agendaItem;
  };

export const removeAgendaItem =
  async ({
    meetingId,
    agendaItemId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanEditMeeting(
      meeting,
      currentUser
    );

    const agendaItem =
      meeting.agenda.id(
        agendaItemId
      );

    if (!agendaItem) {
      throw createServiceError(
        "Agenda item not found.",
        404,
        "AGENDA_ITEM_NOT_FOUND"
      );
    }

    agendaItem.deleteOne();

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.agenda;
  };

/* ==========================================================
   DOCUMENTS
========================================================== */

export const addMeetingDocument =
  async ({
    meetingId,
    documentData,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (!documentData?.fileUrl) {
      throw createServiceError(
        "Document file URL is required.",
        400,
        "DOCUMENT_URL_REQUIRED"
      );
    }

    meeting.documents.push({
      ...documentData,
      uploadedBy:
        currentUser._id,
      uploadedAt: new Date(),
    });

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.documents[
      meeting.documents.length - 1
    ];
  };

export const removeMeetingDocument =
  async ({
    meetingId,
    documentId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const document =
      meeting.documents.id(
        documentId
      );

    if (!document) {
      throw createServiceError(
        "Meeting document not found.",
        404,
        "MEETING_DOCUMENT_NOT_FOUND"
      );
    }

    document.deleteOne();

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.documents;
  };

/* ==========================================================
   MINUTES
========================================================== */

export const saveMeetingMinutes =
  async ({
    meetingId,
    content,
    status = "draft",
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const allowedStatuses = [
      "draft",
      "submitted",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw createServiceError(
        "Invalid minutes status.",
        400,
        "INVALID_MINUTES_STATUS"
      );
    }

    meeting.minutes.content =
      content || "";

    meeting.minutes.status =
      status;

    meeting.minutes.preparedBy =
      currentUser._id;

    meeting.minutes.preparedAt =
      new Date();

    if (status !== "approved") {
      meeting.minutes.approvedBy =
        null;

      meeting.minutes.approvedAt =
        null;
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.minutes;
  };

export const approveMeetingMinutes =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    if (
      !isSystemAdministrator(
        currentUser
      ) &&
      !meeting.isHost(
        currentUser?._id
      )
    ) {
      throw createServiceError(
        "Only the meeting host or an administrator can approve minutes.",
        403,
        "MINUTES_APPROVAL_DENIED"
      );
    }

    if (
      meeting.minutes.status !==
      "submitted"
    ) {
      throw createServiceError(
        "Minutes must be submitted before approval.",
        409,
        "MINUTES_NOT_SUBMITTED"
      );
    }

    meeting.minutes.status =
      "approved";

    meeting.minutes.approvedBy =
      currentUser._id;

    meeting.minutes.approvedAt =
      new Date();

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.minutes;
  };

/* ==========================================================
   RESOLUTIONS
========================================================== */

export const addMeetingResolution =
  async ({
    meetingId,
    resolution,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (!resolution?.title?.trim()) {
      throw createServiceError(
        "Resolution title is required.",
        400,
        "RESOLUTION_TITLE_REQUIRED"
      );
    }

    const resolutionNumber =
      resolution.resolutionNumber ||
      `${meeting.meetingNumber}/RES/${String(
        meeting.resolutions.length +
          1
      ).padStart(3, "0")}`;

    meeting.resolutions.push({
      ...resolution,

      title:
        resolution.title.trim(),

      resolutionNumber,
    });

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.resolutions[
      meeting.resolutions.length -
        1
    ];
  };

export const approveMeetingResolution =
  async ({
    meetingId,
    resolutionId,
    approved = true,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const resolution =
      meeting.resolutions.id(
        resolutionId
      );

    if (!resolution) {
      throw createServiceError(
        "Meeting resolution not found.",
        404,
        "RESOLUTION_NOT_FOUND"
      );
    }

    resolution.approved =
      Boolean(approved);

    resolution.approvedAt =
      approved
        ? new Date()
        : null;

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return resolution;
  };

/* ==========================================================
   ACTION ITEMS
========================================================== */

export const addActionItem =
  async ({
    meetingId,
    actionItem,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (!actionItem?.title?.trim()) {
      throw createServiceError(
        "Action item title is required.",
        400,
        "ACTION_ITEM_TITLE_REQUIRED"
      );
    }

    const assignedTo =
      uniqueObjectIds(
        actionItem.assignedTo ||
          []
      );

    await ensureUsersExist(
      assignedTo
    );

    meeting.actionItems.push({
      ...actionItem,

      title:
        actionItem.title.trim(),

      assignedTo,

      createdBy:
        currentUser._id,
    });

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return meeting.actionItems[
      meeting.actionItems.length -
        1
    ];
  };

export const updateActionItem =
  async ({
    meetingId,
    actionItemId,
    updates,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const actionItem =
      meeting.actionItems.id(
        actionItemId
      );

    if (!actionItem) {
      throw createServiceError(
        "Action item not found.",
        404,
        "ACTION_ITEM_NOT_FOUND"
      );
    }

    const allowedFields = [
      "title",
      "description",
      "assignedTo",
      "dueDate",
      "status",
    ];

    for (const field of allowedFields) {
      if (
        updates[field] !==
        undefined
      ) {
        actionItem[field] =
          updates[field];
      }
    }

    if (
      updates.status ===
      "completed"
    ) {
      actionItem.completedAt =
        new Date();
    } else if (
      updates.status &&
      updates.status !== "completed"
    ) {
      actionItem.completedAt =
        null;
    }

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return actionItem;
  };

/* ==========================================================
   ATTENDANCE
========================================================== */

export const updateParticipantAttendance =
  async ({
    meetingId,
    participantUserId,
    attendanceStatus,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const allowedStatuses = [
      "not_recorded",
      "present",
      "late",
      "absent",
      "apology",
      "left_early",
    ];

    if (
      !allowedStatuses.includes(
        attendanceStatus
      )
    ) {
      throw createServiceError(
        "Invalid attendance status.",
        400,
        "INVALID_ATTENDANCE_STATUS"
      );
    }

    const participant =
      findParticipant(
        meeting,
        participantUserId
      );

    if (!participant) {
      throw createServiceError(
        "Participant not found.",
        404,
        "PARTICIPANT_NOT_FOUND"
      );
    }

    participant.attendanceStatus =
      attendanceStatus;

    meeting.updatedBy =
      currentUser._id;

    await meeting.save();

    return participant;
  };

export const getMeetingAttendance =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId,
        {
          populate: true,
        }
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    const attendance =
      meeting.participants.map(
        (participant) => ({
          user: participant.user,

          role: participant.role,

          invitationStatus:
            participant.invitationStatus,

          attendanceStatus:
            participant.attendanceStatus,

          joinedAt:
            participant.joinedAt,

          leftAt:
            participant.leftAt,

          totalDurationSeconds:
            participant.totalDurationSeconds,

          removedFromMeeting:
            participant.removedFromMeeting,
        })
      );

    const summary =
      attendance.reduce(
        (result, participant) => {
          const status =
            participant.attendanceStatus;

          result.total += 1;

          result[status] =
            (result[status] || 0) +
            1;

          return result;
        },
        {
          total: 0,
          not_recorded: 0,
          present: 0,
          late: 0,
          absent: 0,
          apology: 0,
          left_early: 0,
        }
      );

    return {
      meetingId: meeting._id,
      meetingNumber:
        meeting.meetingNumber,
      title: meeting.title,
      summary,
      attendance,
    };
  };

/* ==========================================================
   RECORDING
========================================================== */

export const startMeetingRecording =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (meeting.status !== "live") {
      throw createServiceError(
        "Recording can only start during a live meeting.",
        409,
        "MEETING_NOT_LIVE"
      );
    }

    if (
      !meeting.recording.enabled
    ) {
      throw createServiceError(
        "Recording is disabled for this meeting.",
        409,
        "RECORDING_DISABLED"
      );
    }

    meeting.recording.status =
      "recording";

    meeting.recording.startedAt =
      new Date();

    meeting.recording.endedAt =
      null;

    await meeting.save();

    return meeting.recording;
  };

export const stopMeetingRecording =
  async ({
    meetingId,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (
      meeting.recording.status !==
      "recording"
    ) {
      throw createServiceError(
        "Meeting recording is not active.",
        409,
        "RECORDING_NOT_ACTIVE"
      );
    }

    meeting.recording.status =
      "processing";

    meeting.recording.endedAt =
      new Date();

    await meeting.save();

    return meeting.recording;
  };

export const completeMeetingRecording =
  async ({
    meetingId,
    recordingUrl,
    fileSize = 0,
    currentUser,
  }) => {
    const meeting =
      await findMeetingDocument(
        meetingId
      );

    assertCanManageMeeting(
      meeting,
      currentUser
    );

    if (!recordingUrl) {
      throw createServiceError(
        "Recording URL is required.",
        400,
        "RECORDING_URL_REQUIRED"
      );
    }

    meeting.recording.recordingUrl =
      recordingUrl;

    meeting.recording.fileSize =
      Number(fileSize) || 0;

    meeting.recording.status =
      "ready";

    await meeting.save();

    return meeting.recording;
  };

/* ==========================================================
   DASHBOARD STATISTICS
========================================================== */

export const getMeetingStatistics =
  async ({
    currentUser,
  }) => {
    if (!currentUser?._id) {
      throw createServiceError(
        "Authentication is required.",
        401,
        "AUTHENTICATION_REQUIRED"
      );
    }

    const baseQuery = {
      deletedAt: null,
    };

    if (
      !isSystemAdministrator(
        currentUser
      )
    ) {
      baseQuery.$or = [
        {
          createdBy:
            currentUser._id,
        },
        {
          host:
            currentUser._id,
        },
        {
          coHosts:
            currentUser._id,
        },
        {
          moderators:
            currentUser._id,
        },
        {
          "participants.user":
            currentUser._id,
        },
      ];
    }

    const now = new Date();

    const [
      total,
      drafts,
      scheduled,
      live,
      completed,
      cancelled,
      upcoming,
    ] = await Promise.all([
      Meeting.countDocuments(
        baseQuery
      ),

      Meeting.countDocuments({
        ...baseQuery,
        status: "draft",
      }),

      Meeting.countDocuments({
        ...baseQuery,
        status: "scheduled",
      }),

      Meeting.countDocuments({
        ...baseQuery,
        status: "live",
      }),

      Meeting.countDocuments({
        ...baseQuery,
        status: "completed",
      }),

      Meeting.countDocuments({
        ...baseQuery,
        status: "cancelled",
      }),

      Meeting.countDocuments({
        ...baseQuery,

        status: "scheduled",

        scheduledStart: {
          $gte: now,
        },
      }),
    ]);

    return {
      total,
      drafts,
      scheduled,
      live,
      completed,
      cancelled,
      upcoming,
    };
  };

/* ==========================================================
   EXPORT
========================================================== */

export default {
  createMeeting,
  getMeetingById,
  getMeetingByRoomCode,
  listMeetings,
  getMyMeetings,
  updateMeeting,
  scheduleMeeting,
  postponeMeeting,
  cancelMeeting,
  deleteMeeting,
  restoreMeeting,
  inviteParticipants,
  removeParticipant,
  respondToMeetingInvitation,
  changeMeetingHost,
  addMeetingManagers,
  removeMeetingManager,
  startMeeting,
  joinMeeting,
  admitParticipant,
  leaveMeeting,
  endMeeting,
  updateLiveRoomSettings,
  updateParticipantMedia,
  addAgendaItem,
  updateAgendaItem,
  removeAgendaItem,
  addMeetingDocument,
  removeMeetingDocument,
  saveMeetingMinutes,
  approveMeetingMinutes,
  addMeetingResolution,
  approveMeetingResolution,
  addActionItem,
  updateActionItem,
  updateParticipantAttendance,
  getMeetingAttendance,
  startMeetingRecording,
  stopMeetingRecording,
  completeMeetingRecording,
  getMeetingStatistics,
};