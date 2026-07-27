import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";

import {
  admitSocketParticipant,
  connectSocket,
  disconnectSocket,
  endSocketMeeting,
  getMeetingPresence,
  getSocket,
  joinSocketMeeting,
  leaveSocketMeeting,
  onMeetingAdmitted,
  onMeetingChatMessage,
  onMeetingEnded,
  onMeetingError,
  onMeetingHandUpdated,
  onMeetingPresence,
  onMeetingRemoved,
  onMeetingStarted,
  onMeetingTyping,
  onParticipantAdmitted,
  onParticipantDisconnected,
  onParticipantJoined,
  onParticipantLeft,
  onParticipantMediaUpdated,
  onParticipantRemoved,
  onParticipantWaiting,
  onRoomSettingsUpdated,
  onScreenShareStatus,
  onSocketAuthenticated,
  onSocketConnectError,
  onSocketConnected,
  onSocketDisconnected,
  onWebRTCAnswer,
  onWebRTCIceCandidate,
  onWebRTCOffer,
  onWebRTCRenegotiation,
  raiseSocketHand,
  removeSocketParticipant,
  sendSocketChatMessage,
  sendSocketTypingStatus,
  startSocketMeeting,
  updateScreenShareStatus,
  updateSocketMedia,
  updateSocketRoomSettings,
} from "../../services/socket.service";

/* ==========================================================
   CONTEXT
========================================================== */

const LiveMeetingContext =
  createContext(null);

/* ==========================================================
   INITIAL STATE
========================================================== */

const createInitialState = ({
  meetingId = "",
  meeting = null,
} = {}) => ({
  meetingId,
  meeting,

  socketStatus: "disconnected",
  socketId: "",
  socketError: "",

  roomStatus:
    meeting?.status ||
    meeting?.meetingStatus ||
    "scheduled",

  joinStatus: "idle",

  isJoined: false,
  isWaiting: false,
  isAdmitted: false,
  isRemoved: false,

  removalReason: "",

  participants: {},
  connectedUserIds: [],
  waitingParticipants: {},

  chatMessages: [],
  typingUsers: {},

  localMedia: {
    microphoneEnabled: false,
    cameraEnabled: false,
    screenSharing: false,
    handRaised: false,
  },

  roomSettings:
    meeting?.liveRoom?.settings ||
    meeting?.liveRoomSettings ||
    meeting?.roomSettings ||
    meeting?.liveRoom ||
    {},

  activeScreenSharer: null,

  latestError: "",
  latestNotice: "",

  joining: false,
  leaving: false,
  ending: false,
  starting: false,

  initialized: false,
});

/* ==========================================================
   USER HELPERS
========================================================== */

const getUserId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(
    value?._id ||
      value?.id ||
      value?.userId ||
      value?.user?._id ||
      value?.user?.id ||
      value?.user ||
      ""
  );
};

const getMember = (value) => {
  return (
    value?.member ||
    value?.user?.member ||
    null
  );
};

const getUserName = (value) => {
  if (!value) {
    return "Unknown participant";
  }

  if (typeof value === "string") {
    return value;
  }

  const member = getMember(value);

  const memberName = [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  const directName = [
    value?.firstName,
    value?.middleName,
    value?.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    memberName ||
    directName ||
    value?.fullName ||
    value?.name ||
    value?.user?.fullName ||
    value?.user?.name ||
    value?.email ||
    value?.user?.email ||
    "Unknown participant"
  );
};

const getProfilePhoto = (value) => {
  const member = getMember(value);

  return (
    member?.profilePhoto ||
    value?.profilePhoto ||
    value?.user?.profilePhoto ||
    null
  );
};

const getParticipantRole = (
  participant,
  meeting
) => {
  const participantUserId =
    getUserId(participant);

  const hostId = getUserId(
    meeting?.host
  );

  const coHostIds = (
    meeting?.coHosts || []
  ).map(getUserId);

  const moderatorIds = (
    meeting?.moderators || []
  ).map(getUserId);

  if (
    participantUserId &&
    participantUserId === hostId
  ) {
    return "host";
  }

  if (
    coHostIds.includes(
      participantUserId
    )
  ) {
    return "co_host";
  }

  if (
    moderatorIds.includes(
      participantUserId
    )
  ) {
    return "moderator";
  }

  return (
    participant?.meetingRole ||
    participant?.role ||
    "participant"
  );
};

/* ==========================================================
   PARTICIPANT NORMALIZATION
========================================================== */

const normalizeParticipant = (
  participant,
  meeting,
  existingParticipant = null
) => {
  if (!participant) {
    return null;
  }

  const source =
    participant?.participant ||
    participant;

  const user =
    source?.user &&
    typeof source.user === "object"
      ? source.user
      : source;

  const userId =
    getUserId(source) ||
    getUserId(user);

  if (!userId) {
    return null;
  }

  const existing =
    existingParticipant || {};

  return {
    ...existing,

    raw: source,

    userId,

    memberId:
      source?.memberId ||
      source?.member?._id ||
      user?.member?._id ||
      existing.memberId ||
      null,

    socketId:
      source?.socketId ||
      existing.socketId ||
      "",

    socketIds: Array.from(
      new Set([
        ...(existing.socketIds || []),
        ...(source?.socketIds || []),
        source?.socketId,
      ].filter(Boolean))
    ),

    name:
      source?.name ||
      getUserName(source),

    email:
      source?.email ||
      user?.email ||
      existing.email ||
      "",

    profilePhoto:
      source?.profilePhoto ||
      getProfilePhoto(source) ||
      existing.profilePhoto ||
      null,

    role: getParticipantRole(
      source,
      meeting
    ),

    userRole:
      source?.userRole ||
      user?.role ||
      source?.role ||
      existing.userRole ||
      "member",

    connected:
      source?.connected ??
      existing.connected ??
      false,

    connectionCount:
      source?.connectionCount ??
      existing.connectionCount ??
      0,

    invitationStatus:
      source?.invitationStatus ||
      source?.response ||
      existing.invitationStatus ||
      "pending",

    attendanceStatus:
      source?.attendanceStatus ||
      existing.attendanceStatus ||
      "not_recorded",

    admitted:
      source?.admitted ??
      source?.isAdmitted ??
      existing.admitted ??
      false,

    inWaitingRoom:
      source?.inWaitingRoom ??
      existing.inWaitingRoom ??
      false,

    microphoneEnabled:
      source?.microphoneEnabled ??
      source?.media
        ?.microphoneEnabled ??
      existing.microphoneEnabled ??
      false,

    cameraEnabled:
      source?.cameraEnabled ??
      source?.media?.cameraEnabled ??
      existing.cameraEnabled ??
      false,

    screenSharing:
      source?.screenSharing ??
      source?.media?.screenSharing ??
      existing.screenSharing ??
      false,

    handRaised:
      source?.handRaised ??
      source?.media?.handRaised ??
      existing.handRaised ??
      false,

    joinedAt:
      source?.joinedAt ||
      existing.joinedAt ||
      null,

    leftAt:
      source?.leftAt ||
      existing.leftAt ||
      null,
  };
};

const buildInitialParticipants = (
  meeting
) => {
  const participants = Array.isArray(
    meeting?.participants
  )
    ? meeting.participants
    : [];

  return participants.reduce(
    (result, participant) => {
      const normalized =
        normalizeParticipant(
          participant,
          meeting
        );

      if (normalized?.userId) {
        result[normalized.userId] =
          normalized;
      }

      return result;
    },
    {}
  );
};

/* ==========================================================
   REDUCER
========================================================== */

const liveMeetingReducer = (
  state,
  action
) => {
  switch (action.type) {
    case "INITIALIZE": {
      const meeting =
        action.payload.meeting ||
        state.meeting;

      return {
        ...state,

        meetingId:
          action.payload.meetingId ||
          state.meetingId,

        meeting,

        roomStatus:
          meeting?.status ||
          meeting?.meetingStatus ||
          state.roomStatus,

        roomSettings:
          meeting?.liveRoom?.settings ||
          meeting?.liveRoomSettings ||
          meeting?.roomSettings ||
          meeting?.liveRoom ||
          state.roomSettings,

        participants: {
          ...buildInitialParticipants(
            meeting
          ),
          ...state.participants,
        },

        initialized: true,
      };
    }

    case "SOCKET_CONNECTING":
      return {
        ...state,
        socketStatus: "connecting",
        socketError: "",
      };

    case "SOCKET_CONNECTED":
      return {
        ...state,
        socketStatus: "connected",
        socketId:
          action.payload?.socketId ||
          state.socketId,
        socketError: "",
      };

    case "SOCKET_AUTHENTICATED":
      return {
        ...state,
        socketStatus: "authenticated",
        socketId:
          action.payload?.socketId ||
          state.socketId,
        socketError: "",
      };

    case "SOCKET_DISCONNECTED":
      return {
        ...state,
        socketStatus: "disconnected",
        socketId: "",
      };

    case "SOCKET_ERROR":
      return {
        ...state,
        socketStatus: "error",
        socketError:
          action.payload?.message ||
          "Socket connection failed.",
        latestError:
          action.payload?.message ||
          "Socket connection failed.",
      };

    case "JOIN_START":
      return {
        ...state,
        joining: true,
        joinStatus: "joining",
        latestError: "",
      };

    case "JOIN_SUCCESS":
      return {
        ...state,
        joining: false,
        isJoined:
          !action.payload
            ?.waitingRoomRequired,
        isWaiting: Boolean(
          action.payload
            ?.waitingRoomRequired
        ),
        isAdmitted:
          !action.payload
            ?.waitingRoomRequired,
        isRemoved: false,
        removalReason: "",
        joinStatus:
          action.payload
            ?.waitingRoomRequired
            ? "waiting"
            : "joined",
        latestNotice:
          action.payload
            ?.waitingRoomRequired
            ? "You are waiting for admission."
            : "You joined the meeting.",
      };

    case "JOIN_FAILURE":
      return {
        ...state,
        joining: false,
        joinStatus: "failed",
        latestError:
          action.payload?.message ||
          "Unable to join meeting.",
      };

    case "ADMITTED":
      return {
        ...state,
        isWaiting: false,
        isJoined: true,
        isAdmitted: true,
        joinStatus: "joined",
        latestNotice:
          action.payload?.message ||
          "You have been admitted.",
      };

    case "LEAVE_START":
      return {
        ...state,
        leaving: true,
        latestError: "",
      };

    case "LEAVE_SUCCESS":
      return {
        ...state,
        leaving: false,
        isJoined: false,
        isWaiting: false,
        isAdmitted: false,
        joinStatus: "left",
        connectedUserIds: [],
        latestNotice:
          "You left the meeting.",
      };

    case "LEAVE_FAILURE":
      return {
        ...state,
        leaving: false,
        latestError:
          action.payload?.message ||
          "Unable to leave meeting.",
      };

    case "REMOVED":
      return {
        ...state,
        isRemoved: true,
        isJoined: false,
        isWaiting: false,
        isAdmitted: false,
        joinStatus: "removed",
        removalReason:
          action.payload?.message ||
          action.payload?.reason ||
          "You were removed from the meeting.",
        latestError:
          action.payload?.message ||
          action.payload?.reason ||
          "You were removed from the meeting.",
      };

    case "MEETING_STARTED":
      return {
        ...state,
        meeting: {
          ...state.meeting,
          ...(action.payload?.meeting ||
            {}),
          status: "live",
        },
        roomStatus: "live",
        starting: false,
        latestNotice:
          "The meeting has started.",
      };

    case "MEETING_ENDED":
      return {
        ...state,
        meeting: {
          ...state.meeting,
          ...(action.payload?.meeting ||
            {}),
          status: "completed",
        },
        roomStatus: "ended",
        ending: false,
        isJoined: false,
        isWaiting: false,
        isAdmitted: false,
        joinStatus: "ended",
        connectedUserIds: [],
        latestNotice:
          "The meeting has ended.",
      };

    case "START_MEETING_PENDING":
      return {
        ...state,
        starting: true,
        latestError: "",
      };

    case "START_MEETING_FAILURE":
      return {
        ...state,
        starting: false,
        latestError:
          action.payload?.message ||
          "Unable to start meeting.",
      };

    case "END_MEETING_PENDING":
      return {
        ...state,
        ending: true,
        latestError: "",
      };

    case "END_MEETING_FAILURE":
      return {
        ...state,
        ending: false,
        latestError:
          action.payload?.message ||
          "Unable to end meeting.",
      };

    case "UPSERT_PARTICIPANT": {
      const participant =
        normalizeParticipant(
          action.payload.participant,
          state.meeting,
          state.participants[
            getUserId(
              action.payload.participant
            )
          ]
        );

      if (!participant?.userId) {
        return state;
      }

      return {
        ...state,
        participants: {
          ...state.participants,
          [participant.userId]:
            participant,
        },
      };
    }

    case "PARTICIPANT_JOINED": {
      const incoming =
        action.payload.participant;

      const userId =
        getUserId(incoming);

      if (!userId) {
        return state;
      }

      const existing =
        state.participants[userId];

      const participant =
        normalizeParticipant(
          {
            ...incoming,
            connected: true,
            joinedAt:
              incoming?.joinedAt ||
              new Date().toISOString(),
          },
          state.meeting,
          existing
        );

      return {
        ...state,

        participants: {
          ...state.participants,
          [userId]: participant,
        },

        connectedUserIds:
          Array.from(
            new Set([
              ...state.connectedUserIds,
              userId,
            ])
          ),
      };
    }

    case "PARTICIPANT_LEFT": {
      const userId = String(
        action.payload?.userId || ""
      );

      if (!userId) {
        return state;
      }

      const existing =
        state.participants[userId];

      return {
        ...state,

        participants: {
          ...state.participants,

          ...(existing
            ? {
                [userId]: {
                  ...existing,
                  connected: false,
                  connectionCount: 0,
                  leftAt:
                    new Date().toISOString(),
                  socketId: "",
                  socketIds: [],
                },
              }
            : {}),
        },

        connectedUserIds:
          state.connectedUserIds.filter(
            (id) => id !== userId
          ),
      };
    }

    case "PRESENCE_UPDATED": {
      const presence =
        Array.isArray(
          action.payload?.participants
        )
          ? action.payload.participants
          : [];

      const connectedIds =
        presence
          .map((item) =>
            String(item.userId || "")
          )
          .filter(Boolean);

      const participants = {
        ...state.participants,
      };

      Object.keys(participants).forEach(
        (userId) => {
          const presenceEntry =
            presence.find(
              (item) =>
                String(item.userId) ===
                userId
            );

          participants[userId] = {
            ...participants[userId],
            connected: Boolean(
              presenceEntry
            ),
            connectionCount:
              presenceEntry
                ?.connectionCount || 0,
          };
        }
      );

      return {
        ...state,
        participants,
        connectedUserIds:
          connectedIds,
      };
    }

    case "PARTICIPANT_WAITING": {
      const participant =
        normalizeParticipant(
          {
            ...action.payload
              .participant,
            inWaitingRoom: true,
          },
          state.meeting
        );

      if (!participant?.userId) {
        return state;
      }

      return {
        ...state,

        waitingParticipants: {
          ...state.waitingParticipants,
          [participant.userId]:
            participant,
        },
      };
    }

    case "PARTICIPANT_ADMITTED": {
      const userId = String(
        action.payload
          ?.participantUserId ||
          getUserId(
            action.payload
              ?.participant
          ) ||
          ""
      );

      if (!userId) {
        return state;
      }

      const waitingParticipants = {
        ...state.waitingParticipants,
      };

      delete waitingParticipants[
        userId
      ];

      const existing =
        state.participants[userId];

      const participant =
        normalizeParticipant(
          {
            ...(action.payload
              ?.participant ||
              existing ||
              {}),
            userId,
            admitted: true,
            inWaitingRoom: false,
            connected: true,
          },
          state.meeting,
          existing
        );

      return {
        ...state,

        waitingParticipants,

        participants: {
          ...state.participants,
          [userId]: participant,
        },

        connectedUserIds:
          Array.from(
            new Set([
              ...state.connectedUserIds,
              userId,
            ])
          ),
      };
    }

    case "PARTICIPANT_REMOVED": {
      const userId = String(
        action.payload
          ?.participantUserId || ""
      );

      if (!userId) {
        return state;
      }

      const participants = {
        ...state.participants,
      };

      const waitingParticipants = {
        ...state.waitingParticipants,
      };

      delete participants[userId];
      delete waitingParticipants[
        userId
      ];

      return {
        ...state,
        participants,
        waitingParticipants,

        connectedUserIds:
          state.connectedUserIds.filter(
            (id) => id !== userId
          ),
      };
    }

    case "MEDIA_UPDATED": {
      const userId = String(
        action.payload
          ?.participantUserId ||
          action.payload?.userId ||
          ""
      );

      if (!userId) {
        return state;
      }

      const existing =
        state.participants[userId] ||
        normalizeParticipant(
          {
            userId,
          },
          state.meeting
        );

      return {
        ...state,

        participants: {
          ...state.participants,

          [userId]: {
            ...existing,
            ...(action.payload?.media ||
              {}),
          },
        },
      };
    }

    case "HAND_UPDATED": {
      const userId = String(
        action.payload?.userId || ""
      );

      if (!userId) {
        return state;
      }

      const existing =
        state.participants[userId] ||
        normalizeParticipant(
          {
            userId,
          },
          state.meeting
        );

      return {
        ...state,

        participants: {
          ...state.participants,

          [userId]: {
            ...existing,
            handRaised: Boolean(
              action.payload
                ?.handRaised
            ),
          },
        },
      };
    }

    case "LOCAL_MEDIA_UPDATED":
      return {
        ...state,

        localMedia: {
          ...state.localMedia,
          ...action.payload,
        },
      };

    case "SCREEN_SHARE_UPDATED":
      return {
        ...state,

        activeScreenSharer:
          action.payload
            ?.screenSharing
            ? {
                userId:
                  action.payload
                    ?.userId,
                socketId:
                  action.payload
                    ?.socketId,
              }
            : state
                  .activeScreenSharer
                  ?.userId ===
                action.payload?.userId
              ? null
              : state.activeScreenSharer,
      };

    case "CHAT_MESSAGE_RECEIVED": {
      const message =
        action.payload;

      if (!message?.id) {
        return state;
      }

      const alreadyExists =
        state.chatMessages.some(
          (item) =>
            item.id === message.id
        );

      if (alreadyExists) {
        return state;
      }

      return {
        ...state,

        chatMessages: [
          ...state.chatMessages,
          message,
        ],
      };
    }

    case "TYPING_UPDATED": {
      const userId = String(
        action.payload?.userId || ""
      );

      if (!userId) {
        return state;
      }

      const typingUsers = {
        ...state.typingUsers,
      };

      if (
        action.payload?.isTyping
      ) {
        typingUsers[userId] = {
          ...action.payload,
          updatedAt: Date.now(),
        };
      } else {
        delete typingUsers[userId];
      }

      return {
        ...state,
        typingUsers,
      };
    }

    case "ROOM_SETTINGS_UPDATED":
      return {
        ...state,

        roomSettings:
          action.payload?.liveRoom
            ?.settings ||
          action.payload?.liveRoom ||
          action.payload?.settings ||
          state.roomSettings,

        meeting: {
          ...state.meeting,
          liveRoom:
            action.payload
              ?.liveRoom ||
            state.meeting
              ?.liveRoom,
        },
      };

    case "NOTICE":
      return {
        ...state,
        latestNotice:
          action.payload || "",
      };

    case "ERROR":
      return {
        ...state,
        latestError:
          action.payload?.message ||
          action.payload ||
          "An error occurred.",
      };

    case "CLEAR_ERROR":
      return {
        ...state,
        latestError: "",
        socketError: "",
      };

    case "CLEAR_NOTICE":
      return {
        ...state,
        latestNotice: "",
      };

    case "RESET_ROOM":
      return createInitialState({
        meetingId:
          state.meetingId,
        meeting: state.meeting,
      });

    default:
      return state;
  }
};

/* ==========================================================
   PROVIDER
========================================================== */

const LiveMeetingProvider = ({
  meetingId,
  meeting = null,
  currentUser = null,
  authToken = "",
  children,
}) => {
  const [state, dispatch] =
    useReducer(
      liveMeetingReducer,
      {
        meetingId,
        meeting,
      },
      createInitialState
    );

  /*
   * MediaStream and RTCPeerConnection objects should
   * not be placed in reducer state because they are
   * mutable browser objects.
   */

  const localStreamRef =
    useRef(null);

  const screenStreamRef =
    useRef(null);

  const peerConnectionsRef =
    useRef(new Map());

  const remoteStreamsRef =
    useRef(new Map());

  const pendingIceCandidatesRef =
    useRef(new Map());

  const typingTimeoutRef =
    useRef(null);

  const joinedMeetingRef =
    useRef(false);

  const mountedRef =
    useRef(true);

  const currentUserId =
    useMemo(
      () => getUserId(currentUser),
      [currentUser]
    );

  /* ========================================================
     INITIALIZE MEETING STATE
  ======================================================== */

  useEffect(() => {
    dispatch({
      type: "INITIALIZE",

      payload: {
        meetingId,
        meeting,
      },
    });
  }, [
    meetingId,
    meeting,
  ]);

  /* ========================================================
     PEER CONNECTION HELPERS
  ======================================================== */

  const getPeerConnection =
    useCallback(
      (socketId) => {
        return (
          peerConnectionsRef.current.get(
            socketId
          ) || null
        );
      },
      []
    );

  const setPeerConnection =
    useCallback(
      (
        socketId,
        peerConnection
      ) => {
        peerConnectionsRef.current.set(
          socketId,
          peerConnection
        );
      },
      []
    );

  const removePeerConnection =
  useCallback(
    (socketId) => {
      const peerConnection =
        peerConnectionsRef.current.get(socketId);

      if (peerConnection) {
        try {
          peerConnection.onicecandidate = null;
          peerConnection.ontrack = null;
          peerConnection.onconnectionstatechange = null;
          peerConnection.oniceconnectionstatechange = null;
          peerConnection.onsignalingstatechange = null;
          peerConnection.onnegotiationneeded = null;

          peerConnection.close();
        } catch {
          // Peer may already be closed.
        }
      }

      peerConnectionsRef.current.delete(socketId);
      remoteStreamsRef.current.delete(socketId);
      pendingIceCandidatesRef.current.delete(socketId);
    },
    []
  );

  const closeAllPeerConnections =
    useCallback(() => {
      Array.from(
        peerConnectionsRef.current.keys()
      ).forEach(
        removePeerConnection
      );

      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      pendingIceCandidatesRef.current.clear();
    }, [removePeerConnection]);

  /* ========================================================
     LOCAL STREAM HELPERS
  ======================================================== */

  const setLocalStream =
    useCallback((stream) => {
      localStreamRef.current =
        stream;
    }, []);

  const stopLocalStream =
    useCallback(() => {
      localStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      localStreamRef.current =
        null;

      dispatch({
        type: "LOCAL_MEDIA_UPDATED",

        payload: {
          microphoneEnabled:
            false,
          cameraEnabled: false,
        },
      });
    }, []);

  const setScreenStream =
    useCallback((stream) => {
      screenStreamRef.current =
        stream;
    }, []);

  const stopScreenStream =
    useCallback(() => {
      screenStreamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      screenStreamRef.current =
        null;

      dispatch({
        type: "LOCAL_MEDIA_UPDATED",

        payload: {
          screenSharing: false,
        },
      });
    }, []);

  const setRemoteStream =
    useCallback(
      (socketId, stream) => {
        remoteStreamsRef.current.set(
          socketId,
          stream
        );
      },
      []
    );

  const getRemoteStream =
    useCallback((socketId) => {
      return (
        remoteStreamsRef.current.get(
          socketId
        ) || null
      );
    }, []);

  /* ========================================================
   SOCKET CONNECTION
======================================================== */

useEffect(() => {
  mountedRef.current = true;

  if (!meetingId) {
    dispatch({
      type: "ERROR",
      payload:
        "Meeting ID is required.",
    });

    return undefined;
  }

  dispatch({
    type: "SOCKET_CONNECTING",
  });

  /*
   * Register listeners before connecting.
   * This prevents fast localhost connections from
   * emitting events before React starts listening.
   */

  const cleanupFunctions = [];

  cleanupFunctions.push(
    onSocketConnected(() => {
      if (!mountedRef.current) {
        return;
      }

      const activeSocket =
        getSocket();

      dispatch({
        type: "SOCKET_CONNECTED",

        payload: {
          socketId:
            activeSocket?.id ||
            "",
        },
      });
    })
  );

  cleanupFunctions.push(
    onSocketAuthenticated(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "SOCKET_AUTHENTICATED",

          payload:
            payload?.data ||
            payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onSocketDisconnected(
      (reason) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "SOCKET_DISCONNECTED",

          payload: {
            reason,
          },
        });
      }
    )
  );

  cleanupFunctions.push(
    onSocketConnectError(
      (error) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "SOCKET_ERROR",

          payload: {
            message:
              error?.message ||
              "Socket connection failed.",
          },
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingError(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "ERROR",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingStarted(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "MEETING_STARTED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingEnded(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        joinedMeetingRef.current =
          false;

        closeAllPeerConnections();
        stopScreenStream();
        stopLocalStream();

        dispatch({
          type: "MEETING_ENDED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingAdmitted(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "ADMITTED",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingRemoved(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        joinedMeetingRef.current =
          false;

        closeAllPeerConnections();
        stopScreenStream();
        stopLocalStream();

        dispatch({
          type: "REMOVED",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantJoined(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "PARTICIPANT_JOINED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantLeft(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        const socketId =
          payload?.participant
            ?.socketId;

        if (socketId) {
          removePeerConnection(
            socketId
          );
        }

        dispatch({
          type:
            "PARTICIPANT_LEFT",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantDisconnected(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        if (payload?.socketId) {
          removePeerConnection(
            payload.socketId
          );
        }

        dispatch({
          type:
            "PARTICIPANT_LEFT",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantWaiting(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "PARTICIPANT_WAITING",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantAdmitted(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "PARTICIPANT_ADMITTED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantRemoved(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "PARTICIPANT_REMOVED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onParticipantMediaUpdated(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "MEDIA_UPDATED",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingHandUpdated(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "HAND_UPDATED",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingPresence(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "PRESENCE_UPDATED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingChatMessage(
      (message) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "CHAT_MESSAGE_RECEIVED",

          payload: message,
        });
      }
    )
  );

  cleanupFunctions.push(
    onMeetingTyping(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type: "TYPING_UPDATED",
          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onRoomSettingsUpdated(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "ROOM_SETTINGS_UPDATED",

          payload,
        });
      }
    )
  );

  cleanupFunctions.push(
    onScreenShareStatus(
      (payload) => {
        if (!mountedRef.current) {
          return;
        }

        dispatch({
          type:
            "SCREEN_SHARE_UPDATED",

          payload,
        });
      }
    )
  );

  /*
   * Connect only after all listeners are registered.
   */

  let activeSocket;

  try {
    activeSocket =
      connectSocket(
        authToken || undefined
      );

    /*
     * If the global socket was already connected before this
     * provider mounted, the "connect" event will not fire again.
     */

    if (activeSocket.connected) {
      dispatch({
        type: "SOCKET_CONNECTED",

        payload: {
          socketId:
            activeSocket.id ||
            "",
        },
      });
    }
  } catch (error) {
    dispatch({
      type: "SOCKET_ERROR",

      payload: {
        message:
          error?.message ||
          "Unable to connect to the meeting socket.",
      },
    });

    cleanupFunctions.forEach(
      (cleanup) => {
        if (
          typeof cleanup ===
          "function"
        ) {
          cleanup();
        }
      }
    );

    return undefined;
  }

  /*
   * WebRTC events are received here and exposed through
   * separate subscription helpers.
   */

  return () => {
    mountedRef.current = false;

    cleanupFunctions.forEach(
      (cleanup) => {
        if (
          typeof cleanup ===
          "function"
        ) {
          cleanup();
        }
      }
    );

    if (
      typingTimeoutRef.current
    ) {
      window.clearTimeout(
        typingTimeoutRef.current
      );
    }

    closeAllPeerConnections();
    stopScreenStream();
    stopLocalStream();

    /*
     * Do not automatically disconnect the global socket because
     * another part of the application may still be using it.
     */
  };
}, [
  authToken,
  meetingId,
  closeAllPeerConnections,
  removePeerConnection,
  stopLocalStream,
  stopScreenStream,
]);

  /* ========================================================
     JOIN AND LEAVE
  ======================================================== */

  const joinRoom =
    useCallback(async () => {
      if (!meetingId) {
        return {
          success: false,
          message:
            "Meeting ID is required.",
        };
      }

      if (
        joinedMeetingRef.current
      ) {
        return {
          success: true,
          message:
            "Already joined.",
        };
      }

      dispatch({
        type: "JOIN_START",
      });

      try {
        const response =
          await joinSocketMeeting(
            meetingId
          );

        const data =
          response?.data || {};

        joinedMeetingRef.current =
          true;

        dispatch({
          type: "JOIN_SUCCESS",
          payload: data,
        });

        if (data?.participant) {
          dispatch({
            type:
              "UPSERT_PARTICIPANT",

            payload: {
              participant:
                data.participant,
            },
          });
        }

        return response;
      } catch (error) {
        dispatch({
          type: "JOIN_FAILURE",

          payload: {
            message:
              error.message ||
              "Unable to join meeting.",
          },
        });

        throw error;
      }
    }, [meetingId]);

  const leaveRoom =
    useCallback(async () => {
      if (!meetingId) {
        return;
      }

      dispatch({
        type: "LEAVE_START",
      });

      try {
        const response =
          await leaveSocketMeeting(
            meetingId
          );

        joinedMeetingRef.current =
          false;

        closeAllPeerConnections();
        stopScreenStream();
        stopLocalStream();

        dispatch({
          type: "LEAVE_SUCCESS",
        });

        return response;
      } catch (error) {
        dispatch({
          type: "LEAVE_FAILURE",

          payload: {
            message:
              error.message ||
              "Unable to leave meeting.",
          },
        });

        throw error;
      }
    }, [
      meetingId,
      closeAllPeerConnections,
      stopLocalStream,
      stopScreenStream,
    ]);

  /* ========================================================
     PRESENCE
  ======================================================== */

  const refreshPresence =
    useCallback(async () => {
      if (!meetingId) {
        return null;
      }

      try {
        const response =
          await getMeetingPresence(
            meetingId
          );

        dispatch({
          type: "PRESENCE_UPDATED",

          payload:
            response?.data ||
            response,
        });

        return response;
      } catch (error) {
        dispatch({
          type: "ERROR",

          payload: {
            message:
              error.message ||
              "Unable to retrieve meeting presence.",
          },
        });

        throw error;
      }
    }, [meetingId]);

  /* ========================================================
     MEETING CONTROL
  ======================================================== */

  const startRoomMeeting =
    useCallback(async () => {
      dispatch({
        type:
          "START_MEETING_PENDING",
      });

      try {
        return await startSocketMeeting(
          meetingId
        );
      } catch (error) {
        dispatch({
          type:
            "START_MEETING_FAILURE",

          payload: {
            message:
              error.message ||
              "Unable to start meeting.",
          },
        });

        throw error;
      }
    }, [meetingId]);

  const endRoomMeeting =
    useCallback(async () => {
      dispatch({
        type: "END_MEETING_PENDING",
      });

      try {
        return await endSocketMeeting(
          meetingId
        );
      } catch (error) {
        dispatch({
          type:
            "END_MEETING_FAILURE",

          payload: {
            message:
              error.message ||
              "Unable to end meeting.",
          },
        });

        throw error;
      }
    }, [meetingId]);

  /* ========================================================
     WAITING ROOM
  ======================================================== */

  const admitParticipant =
    useCallback(
      async (
        participantUserId
      ) => {
        const response =
          await admitSocketParticipant(
            meetingId,
            participantUserId
          );

        dispatch({
          type:
            "PARTICIPANT_ADMITTED",

          payload: {
            participantUserId,

            participant:
              response?.data
                ?.participant,
          },
        });

        return response;
      },
      [meetingId]
    );

  const removeParticipant =
    useCallback(
      async (
        participantUserId,
        reason = ""
      ) => {
        const response =
          await removeSocketParticipant(
            meetingId,
            participantUserId,
            reason
          );

        dispatch({
          type:
            "PARTICIPANT_REMOVED",

          payload: {
            participantUserId,
            reason,
          },
        });

        return response;
      },
      [meetingId]
    );

    const resolveParticipantUserId =
  useCallback(
    (participantOrUserId) => {
      if (
        typeof participantOrUserId ===
        "string"
      ) {
        return participantOrUserId;
      }

      return String(
        participantOrUserId
          ?.userId ||
          participantOrUserId
            ?.participantUserId ||
          participantOrUserId
            ?.participantId ||
          participantOrUserId
            ?.user?._id ||
          participantOrUserId
            ?.user?.id ||
          participantOrUserId
            ?._id ||
          participantOrUserId
            ?.id ||
          ""
      );
    },
    []
  );

const admitWaitingParticipant =
  useCallback(
    async (
      participantOrUserId
    ) => {
      const participantUserId =
        resolveParticipantUserId(
          participantOrUserId
        );

      if (!participantUserId) {
        throw new Error(
          "Participant user ID is required."
        );
      }

      return admitParticipant(
        participantUserId
      );
    },
    [
      admitParticipant,
      resolveParticipantUserId,
    ]
  );

const rejectWaitingParticipant =
  useCallback(
    async (
      participantOrUserId,
      reason =
        "Waiting-room request rejected."
    ) => {
      const participantUserId =
        resolveParticipantUserId(
          participantOrUserId
        );

      if (!participantUserId) {
        throw new Error(
          "Participant user ID is required."
        );
      }

      return removeParticipant(
        participantUserId,
        reason
      );
    },
    [
      removeParticipant,
      resolveParticipantUserId,
    ]
  );

  /* ========================================================
     MEDIA STATE
  ======================================================== */

  const updateLocalMedia =
    useCallback(
      async (media) => {
        dispatch({
          type:
            "LOCAL_MEDIA_UPDATED",

          payload: media,
        });

        try {
          return await updateSocketMedia(
            meetingId,
            media
          );
        } catch (error) {
          dispatch({
            type: "ERROR",

            payload: {
              message:
                error.message ||
                "Unable to update media state.",
            },
          });

          throw error;
        }
      },
      [meetingId]
    );

  const setMicrophoneEnabled =
    useCallback(
      async (enabled) => {
        localStreamRef.current
          ?.getAudioTracks()
          .forEach((track) => {
            track.enabled =
              enabled;
          });

        return updateLocalMedia({
          microphoneEnabled:
            enabled,
        });
      },
      [updateLocalMedia]
    );

  const setCameraEnabled =
    useCallback(
      async (enabled) => {
        localStreamRef.current
          ?.getVideoTracks()
          .forEach((track) => {
            track.enabled =
              enabled;
          });

        return updateLocalMedia({
          cameraEnabled:
            enabled,
        });
      },
      [updateLocalMedia]
    );

  const setHandRaised =
    useCallback(
      async (handRaised) => {
        dispatch({
          type:
            "LOCAL_MEDIA_UPDATED",

          payload: {
            handRaised,
          },
        });

        try {
          return await raiseSocketHand(
            meetingId,
            handRaised
          );
        } catch (error) {
          dispatch({
            type:
              "LOCAL_MEDIA_UPDATED",

            payload: {
              handRaised:
                !handRaised,
            },
          });

          throw error;
        }
      },
      [meetingId]
    );

    const toggleRaisedHand =
  useCallback(async () => {
    return setHandRaised(
      !state.localMedia
        ?.handRaised
    );
  }, [
    setHandRaised,
    state.localMedia?.handRaised,
  ]);

  const setScreenSharing =
    useCallback(
      async (screenSharing) => {
        dispatch({
          type:
            "LOCAL_MEDIA_UPDATED",

          payload: {
            screenSharing,
          },
        });

        try {
          return await updateScreenShareStatus(
            meetingId,
            screenSharing
          );
        } catch (error) {
          dispatch({
            type:
              "LOCAL_MEDIA_UPDATED",

            payload: {
              screenSharing:
                !screenSharing,
            },
          });

          throw error;
        }
      },
      [meetingId]
    );

  /* ========================================================
     CHAT
  ======================================================== */

  const sendChatMessage =
    useCallback(
      async (message) => {
        const trimmedMessage =
          String(message || "").trim();

        if (!trimmedMessage) {
          throw new Error(
            "Chat message is required."
          );
        }

        return sendSocketChatMessage(
          meetingId,
          trimmedMessage
        );
      },
      [meetingId]
    );

  const sendTypingStatus =
    useCallback(
      (isTyping) => {
        sendSocketTypingStatus(
          meetingId,
          isTyping
        );

        if (
          typingTimeoutRef.current
        ) {
          window.clearTimeout(
            typingTimeoutRef.current
          );
        }

        if (isTyping) {
          typingTimeoutRef.current =
            window.setTimeout(() => {
              sendSocketTypingStatus(
                meetingId,
                false
              );
            }, 2500);
        }
      },
      [meetingId]
    );

  /* ========================================================
     ROOM SETTINGS
  ======================================================== */

  const updateRoomSettings =
    useCallback(
      async (settings) => {
        const response =
          await updateSocketRoomSettings(
            meetingId,
            settings
          );

        dispatch({
          type:
            "ROOM_SETTINGS_UPDATED",

          payload: {
            settings,
            liveRoom:
              response?.data
                ?.liveRoom,
          },
        });

        return response;
      },
      [meetingId]
    );

    /* ========================================================
   RESOLVED ROOM SETTINGS
======================================================== */

const meetingLocked =
  Boolean(
    state.roomSettings
      ?.meetingLocked ??
      state.roomSettings
        ?.locked ??
      false
  );

const waitingRoomEnabled =
  Boolean(
    state.roomSettings
      ?.waitingRoomEnabled ??
      state.roomSettings
        ?.waitingRoom ??
      true
  );

const participantUnmuteAllowed =
  Boolean(
    state.roomSettings
      ?.participantUnmuteAllowed ??
      true
  );

const participantVideoAllowed =
  Boolean(
    state.roomSettings
      ?.participantVideoAllowed ??
      true
  );

const participantScreenShareAllowed =
  Boolean(
    state.roomSettings
      ?.participantScreenShareAllowed ??
      true
  );

const participantChatAllowed =
  Boolean(
    state.roomSettings
      ?.participantChatAllowed ??
      true
  );

/* ========================================================
   ROOM SETTING ACTIONS
======================================================== */

const setMeetingLocked =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        meetingLocked:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

const toggleMeetingLock =
  useCallback(
    async (nextValue) => {
      const enabled =
        typeof nextValue ===
        "boolean"
          ? nextValue
          : !meetingLocked;

      return setMeetingLocked(
        enabled
      );
    },
    [
      setMeetingLocked,
      meetingLocked,
    ]
  );

const setWaitingRoomEnabled =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        waitingRoomEnabled:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

const toggleWaitingRoom =
  useCallback(
    async (nextValue) => {
      const enabled =
        typeof nextValue ===
        "boolean"
          ? nextValue
          : !waitingRoomEnabled;

      return setWaitingRoomEnabled(
        enabled
      );
    },
    [
      setWaitingRoomEnabled,
      waitingRoomEnabled,
    ]
  );

const setParticipantUnmuteAllowed =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        participantUnmuteAllowed:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

const setParticipantVideoAllowed =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        participantVideoAllowed:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

const setParticipantScreenShareAllowed =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        participantScreenShareAllowed:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

const setParticipantChatAllowed =
  useCallback(
    async (enabled) => {
      return updateRoomSettings({
        ...state.roomSettings,

        participantChatAllowed:
          Boolean(enabled),
      });
    },
    [
      updateRoomSettings,
      state.roomSettings,
    ]
  );

  /* ========================================================
     WEBRTC EVENT SUBSCRIPTIONS
  ======================================================== */

  const subscribeToWebRTC =
    useCallback(
      ({
        onOffer,
        onAnswer,
        onIceCandidate,
        onRenegotiation,
      } = {}) => {
        const cleanupFunctions = [];

        if (onOffer) {
          cleanupFunctions.push(
            onWebRTCOffer(
              onOffer
            )
          );
        }

        if (onAnswer) {
          cleanupFunctions.push(
            onWebRTCAnswer(
              onAnswer
            )
          );
        }

        if (onIceCandidate) {
          cleanupFunctions.push(
            onWebRTCIceCandidate(
              onIceCandidate
            )
          );
        }

        if (onRenegotiation) {
          cleanupFunctions.push(
            onWebRTCRenegotiation(
              onRenegotiation
            )
          );
        }

        return () => {
          cleanupFunctions.forEach(
            (cleanup) => {
              if (
                typeof cleanup ===
                "function"
              ) {
                cleanup();
              }
            }
          );
        };
      },
      []
    );

  /* ========================================================
     ERROR AND NOTICE HELPERS
  ======================================================== */

  const clearError =
    useCallback(() => {
      dispatch({
        type: "CLEAR_ERROR",
      });
    }, []);

  const clearNotice =
    useCallback(() => {
      dispatch({
        type: "CLEAR_NOTICE",
      });
    }, []);

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const participants =
    useMemo(() => {
      return Object.values(
        state.participants
      );
    }, [state.participants]);

  const connectedParticipants =
    useMemo(() => {
      return participants.filter(
        (participant) =>
          state.connectedUserIds.includes(
            participant.userId
          ) ||
          participant.connected
      );
    }, [
      participants,
      state.connectedUserIds,
    ]);

  const waitingParticipants =
    useMemo(() => {
      return Object.values(
        state.waitingParticipants
      );
    }, [
      state.waitingParticipants,
    ]);

  const raisedHands =
    useMemo(() => {
      return participants
        .filter(
          (participant) =>
            participant.handRaised
        )
        .sort((first, second) => {
          return first.name.localeCompare(
            second.name
          );
        });
    }, [participants]);

  const typingUsers =
    useMemo(() => {
      return Object.values(
        state.typingUsers
      ).filter(
        (entry) =>
          entry.userId !==
          currentUserId
      );
    }, [
      state.typingUsers,
      currentUserId,
    ]);

  const currentParticipant =
    useMemo(() => {
      return (
        state.participants[
          currentUserId
        ] || null
      );
    }, [
      state.participants,
      currentUserId,
    ]);

  const currentMeetingRole =
    currentParticipant?.role ||
    getParticipantRole(
      currentUser,
      meeting
    );

  const isHost =
    currentMeetingRole === "host";

  const isCoHost =
    currentMeetingRole ===
    "co_host";

  const isModerator =
    currentMeetingRole ===
    "moderator";

  const canManageRoom =
    isHost ||
    isCoHost ||
    isModerator;

  const canAdmitParticipants =
    isHost || isCoHost;

  const canEndMeeting =
    isHost;

 /* ========================================================
   CONTEXT VALUE
======================================================== */

const contextValue =
  useMemo(
    () => ({
      ...state,

      /* ==================================================
         COMPATIBILITY ALIASES
      ================================================== */

      joined:
        state.isJoined,

      waiting:
        state.isWaiting,

      admitted:
        state.isAdmitted,

      raisedHand:
        state.localMedia
          ?.handRaised ||
        false,

      meetingRole:
        currentMeetingRole,

      isManager:
        canManageRoom,

      /* ==================================================
         CURRENT USER
      ================================================== */

      currentUser,
      currentUserId,
      currentParticipant,
      currentMeetingRole,

      /* ==================================================
         PARTICIPANTS
      ================================================== */

      participants,
      connectedParticipants,
      waitingParticipants,
      raisedHands,
      typingUsers,

      /* ==================================================
         PERMISSIONS
      ================================================== */

      isHost,
      isCoHost,
      isModerator,

      canManageRoom,
      canAdmitParticipants,
      canEndMeeting,

      /* ==================================================
         SOCKET
      ================================================== */

      socket:
        getSocket(),

      /* ==================================================
         REFERENCES
      ================================================== */

      localStreamRef,
      screenStreamRef,
      peerConnectionsRef,
      remoteStreamsRef,
      pendingIceCandidatesRef,

      /* ==================================================
         JOIN AND LEAVE
      ================================================== */

      joinRoom,
      leaveRoom,

      leaveMeeting:
        leaveRoom,

      refreshPresence,

      /* ==================================================
         MEETING CONTROL
      ================================================== */

      startRoomMeeting,
      endRoomMeeting,

      endMeeting:
        endRoomMeeting,

      endMeetingForAll:
        endRoomMeeting,

      /* ==================================================
         WAITING ROOM
      ================================================== */

      admitParticipant,
      removeParticipant,

      admitWaitingParticipant,

      rejectParticipant:
        rejectWaitingParticipant,

      rejectWaitingParticipant,

      /* ==================================================
         LOCAL MEDIA
      ================================================== */

      updateLocalMedia,
      setMicrophoneEnabled,
      setCameraEnabled,
      setHandRaised,

      setRaisedHand:
        setHandRaised,

      toggleRaisedHand,
      setScreenSharing,

      /* ==================================================
         CHAT
      ================================================== */

      sendChatMessage,
      sendTypingStatus,

      /* ==================================================
         HOST ROOM SETTINGS
      ================================================== */

      updateRoomSettings,

      meetingLocked,
      waitingRoomEnabled,

      participantUnmuteAllowed,
      participantVideoAllowed,
      participantScreenShareAllowed,
      participantChatAllowed,

      setMeetingLocked,
      toggleMeetingLock,

      setWaitingRoomEnabled,
      toggleWaitingRoom,

      setParticipantUnmuteAllowed,
      setParticipantVideoAllowed,
      setParticipantScreenShareAllowed,
      setParticipantChatAllowed,

      /* ==================================================
         MEDIA STREAM HELPERS
      ================================================== */

      setLocalStream,
      stopLocalStream,

      setScreenStream,
      stopScreenStream,

      setRemoteStream,
      getRemoteStream,

      /* ==================================================
         PEER CONNECTION HELPERS
      ================================================== */

      getPeerConnection,
      setPeerConnection,
      removePeerConnection,
      closeAllPeerConnections,

      subscribeToWebRTC,

      /* ==================================================
         ERROR HELPERS
      ================================================== */

      clearError,
      clearNotice,

      disconnectSocket,
    }),
    [
      state,

      currentUser,
      currentUserId,
      currentParticipant,
      currentMeetingRole,

      participants,
      connectedParticipants,
      waitingParticipants,
      raisedHands,
      typingUsers,

      isHost,
      isCoHost,
      isModerator,

      canManageRoom,
      canAdmitParticipants,
      canEndMeeting,

      joinRoom,
      leaveRoom,
      refreshPresence,

      startRoomMeeting,
      endRoomMeeting,

      admitParticipant,
      removeParticipant,
      admitWaitingParticipant,
      rejectWaitingParticipant,

      updateLocalMedia,
      setMicrophoneEnabled,
      setCameraEnabled,
      setHandRaised,
      toggleRaisedHand,
      setScreenSharing,

      sendChatMessage,
      sendTypingStatus,

      updateRoomSettings,

      meetingLocked,
      waitingRoomEnabled,

      participantUnmuteAllowed,
      participantVideoAllowed,
      participantScreenShareAllowed,
      participantChatAllowed,

      setMeetingLocked,
      toggleMeetingLock,

      setWaitingRoomEnabled,
      toggleWaitingRoom,

      setParticipantUnmuteAllowed,
      setParticipantVideoAllowed,
      setParticipantScreenShareAllowed,
      setParticipantChatAllowed,

      setLocalStream,
      stopLocalStream,

      setScreenStream,
      stopScreenStream,

      setRemoteStream,
      getRemoteStream,

      getPeerConnection,
      setPeerConnection,
      removePeerConnection,
      closeAllPeerConnections,

      subscribeToWebRTC,

      clearError,
      clearNotice,
    ]
  );

  return (
    <LiveMeetingContext.Provider
      value={contextValue}
    >
      {children}
    </LiveMeetingContext.Provider>
  );
};

/* ==========================================================
   CONTEXT HOOK
========================================================== */

const useLiveMeeting = () => {
  const context = useContext(
    LiveMeetingContext
  );

  if (!context) {
    throw new Error(
      "useLiveMeeting must be used inside LiveMeetingProvider."
    );
  }

  return context;
};

/* ==========================================================
   OPTIONAL SELECTOR HOOKS
========================================================== */

const useLiveMeetingParticipants =
  () => {
    const {
      participants,
      connectedParticipants,
      waitingParticipants,
      raisedHands,
    } = useLiveMeeting();

    return {
      participants,
      connectedParticipants,
      waitingParticipants,
      raisedHands,
    };
  };

const useLiveMeetingMedia = () => {
  const {
    localMedia,
    localStreamRef,
    screenStreamRef,
    remoteStreamsRef,
    setMicrophoneEnabled,
    setCameraEnabled,
    setHandRaised,
    setScreenSharing,
    setLocalStream,
    stopLocalStream,
    setScreenStream,
    stopScreenStream,
    setRemoteStream,
    getRemoteStream,
  } = useLiveMeeting();

  return {
    localMedia,
    localStreamRef,
    screenStreamRef,
    remoteStreamsRef,

    setMicrophoneEnabled,
    setCameraEnabled,
    setHandRaised,
    setScreenSharing,

    setLocalStream,
    stopLocalStream,

    setScreenStream,
    stopScreenStream,

    setRemoteStream,
    getRemoteStream,
  };
};

const useLiveMeetingChat = () => {
  const {
    chatMessages,
    typingUsers,
    sendChatMessage,
    sendTypingStatus,
  } = useLiveMeeting();

  return {
    chatMessages,
    typingUsers,
    sendChatMessage,
    sendTypingStatus,
  };
};

const useLiveMeetingPermissions =
  () => {
    const {
      currentMeetingRole,
      isHost,
      isCoHost,
      isModerator,
      canManageRoom,
      canAdmitParticipants,
      canEndMeeting,
    } = useLiveMeeting();

    return {
      currentMeetingRole,
      isHost,
      isCoHost,
      isModerator,
      canManageRoom,
      canAdmitParticipants,
      canEndMeeting,
    };
  };

/* ==========================================================
   EXPORTS
========================================================== */

export {
  LiveMeetingContext,
  LiveMeetingProvider,
  liveMeetingReducer,
  createInitialState,
  normalizeParticipant,
  useLiveMeeting,
  useLiveMeetingParticipants,
  useLiveMeetingMedia,
  useLiveMeetingChat,
  useLiveMeetingPermissions,
};

export default LiveMeetingContext;