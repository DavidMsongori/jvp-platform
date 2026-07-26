import mongoose from "mongoose";
import crypto from "crypto";

/* ==========================================================
   CONSTANTS
========================================================== */

const MEETING_TYPES = [
  "regional_executive",
  "county_leadership",
  "constituency_leadership",
  "ward_leadership",
  "youth_assembly",
  "committee",
  "departmental",
  "general_members",
  "emergency",
  "training",
  "consultation",
  "other",
];

const MEETING_FORMATS = [
  "jvp_connect",
  "physical",
  "hybrid",
];

const MEETING_STATUSES = [
  "draft",
  "scheduled",
  "live",
  "completed",
  "cancelled",
  "postponed",
];

const RSVP_STATUSES = [
  "pending",
  "accepted",
  "declined",
  "tentative",
];

const ATTENDANCE_STATUSES = [
  "not_recorded",
  "present",
  "late",
  "absent",
  "apology",
  "left_early",
];

const PARTICIPANT_ROLES = [
  "host",
  "co_host",
  "moderator",
  "presenter",
  "participant",
  "observer",
];

const MEETING_SCOPE_LEVELS = [
  "regional",
  "county",
  "constituency",
  "ward",
  "department",
  "committee",
  "custom",
];

/* ==========================================================
   HELPER
========================================================== */

const generateRoomCode = () => {
  return crypto
    .randomBytes(6)
    .toString("hex")
    .toUpperCase();
};

/* ==========================================================
   AGENDA ITEM SCHEMA
========================================================== */

const agendaItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Agenda title is required"],
      trim: true,
      maxlength: 250,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    presenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    durationMinutes: {
      type: Number,
      min: 1,
      max: 720,
      default: 10,
    },

    displayOrder: {
      type: Number,
      min: 0,
      default: 0,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "skipped",
      ],
      default: "pending",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
  },
  {
    _id: true,
  }
);

/* ==========================================================
   PARTICIPANT SCHEMA
========================================================== */

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    role: {
      type: String,
      enum: PARTICIPANT_ROLES,
      default: "participant",
    },

    invitationStatus: {
      type: String,
      enum: RSVP_STATUSES,
      default: "pending",
    },

    invitedAt: {
      type: Date,
      default: Date.now,
    },

    respondedAt: {
      type: Date,
      default: null,
    },

    attendanceStatus: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      default: "not_recorded",
    },

    joinedAt: {
      type: Date,
      default: null,
    },

    leftAt: {
      type: Date,
      default: null,
    },

    totalDurationSeconds: {
      type: Number,
      min: 0,
      default: 0,
    },

    microphoneEnabled: {
      type: Boolean,
      default: false,
    },

    cameraEnabled: {
      type: Boolean,
      default: false,
    },

    screenSharing: {
      type: Boolean,
      default: false,
    },

    handRaised: {
      type: Boolean,
      default: false,
    },

    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    admittedAt: {
      type: Date,
      default: null,
    },

    removedFromMeeting: {
      type: Boolean,
      default: false,
    },

    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    removalReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: true,
  }
);

/* ==========================================================
   DOCUMENT SCHEMA
========================================================== */

const meetingDocumentSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: [true, "Meeting title is required"],
        trim: true,
        maxlength: 250,
      },

      description: {
        type: String,
        trim: true,
        maxlength: 5000,
        default: "",
      },

      fileName: {
        type: String,
        trim: true,
        maxlength: 255,
        default: "",
      },

      fileUrl: {
        type: String,
        trim: true,
        required: true,
      },

      fileType: {
        type: String,
        trim: true,
        maxlength: 100,
        default: "",
      },

      fileSize: {
        type: Number,
        min: 0,
        default: 0,
      },

      category: {
        type: String,
        enum: [
          "agenda",
          "minutes",
          "report",
          "presentation",
          "attendance",
          "supporting_document",
          "other",
        ],
        default: "supporting_document",
      },

      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

/* ==========================================================
   ACTION ITEM SCHEMA
========================================================== */

const actionItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 3000,
      default: "",
    },

    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    dueDate: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "in_progress",
        "completed",
        "overdue",
        "cancelled",
      ],
      default: "pending",
    },

    completedAt: {
      type: Date,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

/* ==========================================================
   MAIN MEETING SCHEMA
========================================================== */

const meetingSchema = new mongoose.Schema(
  {
    /* ======================================================
       IDENTITY
    ====================================================== */

    meetingNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Meeting title is required"],
      trim: true,
      maxlength: 250,
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 10000,
      default: "",
    },

    meetingType: {
      type: String,
      enum: MEETING_TYPES,
      required: [true, "Meeting type is required"],
      index: true,
    },

    format: {
      type: String,
      enum: MEETING_FORMATS,
      default: "jvp_connect",
      index: true,
    },

    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: "draft",
      index: true,
    },

    /* ======================================================
       ORGANIZATION AND SCOPE
    ====================================================== */

    leadershipLevel: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    department: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      index: true,
    },

    scope: {
      level: {
        type: String,
        enum: MEETING_SCOPE_LEVELS,
        default: "custom",
      },

      county: {
        type: String,
        trim: true,
        default: "",
      },

      constituency: {
        type: String,
        trim: true,
        default: "",
      },

      ward: {
        type: String,
        trim: true,
        default: "",
      },

      committee: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ======================================================
       SCHEDULE
    ====================================================== */

    scheduledStart: {
      type: Date,
      required: [true, "Meeting start time is required"],
      index: true,
    },

    scheduledEnd: {
      type: Date,
      required: [true, "Meeting end time is required"],
    },

    timezone: {
      type: String,
      trim: true,
      default: "Africa/Nairobi",
    },

    actualStart: {
      type: Date,
      default: null,
    },

    actualEnd: {
      type: Date,
      default: null,
    },

    /* ======================================================
       PHYSICAL LOCATION
    ====================================================== */

    venue: {
      name: {
        type: String,
        trim: true,
        default: "",
      },

      address: {
        type: String,
        trim: true,
        default: "",
      },

      county: {
        type: String,
        trim: true,
        default: "",
      },

      mapUrl: {
        type: String,
        trim: true,
        default: "",
      },
    },

    /* ======================================================
       JVP CONNECT LIVE ROOM
    ====================================================== */

    liveRoom: {
      enabled: {
        type: Boolean,
        default: true,
      },

      roomCode: {
        type: String,
        trim: true,
        uppercase: true,
        unique: true,
        sparse: true,
        index: true,
      },

      roomLocked: {
        type: Boolean,
        default: false,
      },

      waitingRoomEnabled: {
        type: Boolean,
        default: true,
      },

      requireAuthentication: {
        type: Boolean,
        default: true,
      },

      allowGuests: {
        type: Boolean,
        default: false,
      },

      allowParticipantScreenShare: {
        type: Boolean,
        default: false,
      },

      allowParticipantChat: {
        type: Boolean,
        default: true,
      },

      allowParticipantMicrophone: {
        type: Boolean,
        default: true,
      },

      allowParticipantCamera: {
        type: Boolean,
        default: true,
      },

      muteParticipantsOnEntry: {
        type: Boolean,
        default: true,
      },

      disableCameraOnEntry: {
        type: Boolean,
        default: true,
      },

      maximumParticipants: {
        type: Number,
        min: 2,
        max: 1000,
        default: 50,
      },

      currentParticipantCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      peakParticipantCount: {
        type: Number,
        min: 0,
        default: 0,
      },

      signalingRoomId: {
        type: String,
        trim: true,
        default: "",
      },

      mediaMode: {
        type: String,
        enum: [
          "peer_to_peer",
          "sfu",
        ],
        default: "peer_to_peer",
      },

      startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      endedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },

    /* ======================================================
       LEADERSHIP AND PARTICIPANTS
    ====================================================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    coHosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    moderators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    participants: {
      type: [participantSchema],
      default: [],
    },

    /* ======================================================
       MEETING CONTENT
    ====================================================== */

    agenda: {
      type: [agendaItemSchema],
      default: [],
    },

    documents: {
      type: [meetingDocumentSchema],
      default: [],
    },

    minutes: {
      content: {
        type: String,
        trim: true,
        default: "",
      },

      status: {
        type: String,
        enum: [
          "not_started",
          "draft",
          "submitted",
          "approved",
        ],
        default: "not_started",
      },

      preparedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      preparedAt: {
        type: Date,
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },
    },

    resolutions: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: 500,
        },

        description: {
          type: String,
          trim: true,
          maxlength: 5000,
          default: "",
        },

        resolutionNumber: {
          type: String,
          trim: true,
          default: "",
        },

        approved: {
          type: Boolean,
          default: false,
        },

        approvedAt: {
          type: Date,
          default: null,
        },
      },
    ],

    actionItems: {
      type: [actionItemSchema],
      default: [],
    },

    /* ======================================================
       RECORDING
    ====================================================== */

    recording: {
      enabled: {
        type: Boolean,
        default: false,
      },

      consentRequired: {
        type: Boolean,
        default: true,
      },

      startedAt: {
        type: Date,
        default: null,
      },

      endedAt: {
        type: Date,
        default: null,
      },

      recordingUrl: {
        type: String,
        trim: true,
        default: "",
      },

      fileSize: {
        type: Number,
        min: 0,
        default: 0,
      },

      status: {
        type: String,
        enum: [
          "not_started",
          "recording",
          "processing",
          "ready",
          "failed",
        ],
        default: "not_started",
      },
    },

    /* ======================================================
       CANCELLATION
    ====================================================== */

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    /* ======================================================
       AUDIT
    ====================================================== */

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,

    toJSON: {
      virtuals: true,
    },

    toObject: {
      virtuals: true,
    },
  }
);

/* ==========================================================
   VALIDATION
========================================================== */

meetingSchema.pre("validate", function (next) {
  if (
    this.scheduledStart &&
    this.scheduledEnd &&
    this.scheduledEnd <= this.scheduledStart
  ) {
    return next(
      new Error(
        "Meeting end time must be after the start time."
      )
    );
  }

  if (
    this.format === "physical"
  ) {
    this.liveRoom.enabled = false;
  }

  if (
    this.format === "jvp_connect" ||
    this.format === "hybrid"
  ) {
    this.liveRoom.enabled = true;
  }

  if (
    this.liveRoom.enabled &&
    !this.liveRoom.roomCode
  ) {
    this.liveRoom.roomCode =
      generateRoomCode();
  }

  if (
    this.liveRoom.enabled &&
    !this.liveRoom.signalingRoomId
  ) {
    this.liveRoom.signalingRoomId =
      `jvp-room-${this.liveRoom.roomCode}`;
  }
});

/* ==========================================================
   INDEXES
========================================================== */

meetingSchema.index({
  status: 1,
  scheduledStart: 1,
});

meetingSchema.index({
  createdBy: 1,
  scheduledStart: -1,
});

meetingSchema.index({
  host: 1,
  scheduledStart: -1,
});

meetingSchema.index({
  "scope.county": 1,
  scheduledStart: -1,
});

meetingSchema.index({
  "scope.constituency": 1,
  scheduledStart: -1,
});

meetingSchema.index({
  "scope.ward": 1,
  scheduledStart: -1,
});

meetingSchema.index({
  "participants.user": 1,
  scheduledStart: -1,
});

meetingSchema.index({
  title: "text",
  description: "text",
});

/* ==========================================================
   VIRTUALS
========================================================== */

meetingSchema.virtual(
  "isOnline"
).get(function () {
  return [
    "jvp_connect",
    "hybrid",
  ].includes(this.format);
});

meetingSchema.virtual(
  "isUpcoming"
).get(function () {
  if (!this.scheduledStart) {
    return false;
  }

  const scheduledStart =
    this.scheduledStart instanceof Date
      ? this.scheduledStart
      : new Date(this.scheduledStart);

  if (
    Number.isNaN(
      scheduledStart.getTime()
    )
  ) {
    return false;
  }

  const upcomingStatuses = [
    "draft",
    "scheduled",
    "postponed",
  ];

  return (
    upcomingStatuses.includes(
      this.status
    ) &&
    scheduledStart.getTime() >
      Date.now()
  );
});

meetingSchema.virtual(
  "isLive"
).get(function () {
  return this.status === "live";
});

meetingSchema.virtual(
  "durationMinutes"
).get(function () {
  if (
    !this.scheduledStart ||
    !this.scheduledEnd
  ) {
    return 0;
  }

  const scheduledStart =
    this.scheduledStart instanceof Date
      ? this.scheduledStart
      : new Date(this.scheduledStart);

  const scheduledEnd =
    this.scheduledEnd instanceof Date
      ? this.scheduledEnd
      : new Date(this.scheduledEnd);

  if (
    Number.isNaN(
      scheduledStart.getTime()
    ) ||
    Number.isNaN(
      scheduledEnd.getTime()
    )
  ) {
    return 0;
  }

  const differenceMilliseconds =
    scheduledEnd.getTime() -
    scheduledStart.getTime();

  if (differenceMilliseconds <= 0) {
    return 0;
  }

  return Math.round(
    differenceMilliseconds /
      60000
  );
});

/* ==========================================================
   INSTANCE METHODS
========================================================== */

meetingSchema.methods.isHost = function (
  userId
) {
  if (!userId) return false;

  return (
    this.host?.toString() ===
    userId.toString()
  );
};

meetingSchema.methods.isCoHost = function (
  userId
) {
  if (!userId) return false;

  return this.coHosts.some(
    (coHostId) =>
      coHostId.toString() ===
      userId.toString()
  );
};

meetingSchema.methods.isModerator =
  function (userId) {
    if (!userId) return false;

    return this.moderators.some(
      (moderatorId) =>
        moderatorId.toString() ===
        userId.toString()
    );
  };

meetingSchema.methods.canManageMeeting =
  function (userId) {
    return (
      this.isHost(userId) ||
      this.isCoHost(userId) ||
      this.isModerator(userId)
    );
  };

meetingSchema.methods.isParticipant =
  function (userId) {
    if (!userId) return false;

    return this.participants.some(
      (participant) =>
        participant.user.toString() ===
        userId.toString()
    );
  };

/* ==========================================================
   EXPORT
========================================================== */

const Meeting =
  mongoose.models.Meeting ||
  mongoose.model(
    "Meeting",
    meetingSchema
  );

export {
  MEETING_TYPES,
  MEETING_FORMATS,
  MEETING_STATUSES,
  RSVP_STATUSES,
  ATTENDANCE_STATUSES,
  PARTICIPANT_ROLES,
  MEETING_SCOPE_LEVELS,
};

export default Meeting;