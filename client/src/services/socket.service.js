import {
  io,
} from "socket.io-client";

/* ==========================================================
   SOCKET CONFIGURATION
========================================================== */

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace(
    /\/api\/?$/,
    ""
  ) ||
  "http://localhost:5000";

const SOCKET_OPTIONS = {
  autoConnect: false,

  transports: [
    "websocket",
    "polling",
  ],

  reconnection: true,

  reconnectionAttempts: 10,

  reconnectionDelay: 1000,

  reconnectionDelayMax: 5000,

  timeout: 15000,
};

/* ==========================================================
   SOCKET INSTANCE
========================================================== */

let socket = null;

/* ==========================================================
   TOKEN HELPERS
========================================================== */

const getStoredToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem(
      "accessToken"
    ) ||
    ""
  );
};

/* ==========================================================
   SOCKET CREATION
========================================================== */

export const getSocket = () => {
  if (!socket) {
    socket = io(
      SOCKET_URL,
      SOCKET_OPTIONS
    );
  }

  return socket;
};

/* ==========================================================
   SOCKET CONNECTION
========================================================== */

export const connectSocket = (
  token = getStoredToken()
) => {
  const activeSocket = getSocket();

  if (!token) {
    throw new Error(
      "Authentication token is required to connect to the live meeting room."
    );
  }

  activeSocket.auth = {
    token,
  };

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
};

/* ==========================================================
   SOCKET DISCONNECTION
========================================================== */

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

/* ==========================================================
   CONNECTION STATUS
========================================================== */

export const isSocketConnected = () => {
  return Boolean(
    socket?.connected
  );
};

export const getSocketId = () => {
  return socket?.id || "";
};

/* ==========================================================
   GENERIC EMIT WITH ACKNOWLEDGEMENT
========================================================== */

export const emitSocketEvent = (
  eventName,
  payload = {},
  {
    timeout = 15000,
  } = {}
) => {
  return new Promise(
    (
      resolve,
      reject
    ) => {
      const activeSocket =
        getSocket();

      if (!activeSocket.connected) {
        reject(
          new Error(
            "Socket is not connected."
          )
        );

        return;
      }

      const timer =
        window.setTimeout(
          () => {
            reject(
              new Error(
                `Socket event "${eventName}" timed out.`
              )
            );
          },
          timeout
        );

      activeSocket.emit(
        eventName,
        payload,
        (response) => {
          window.clearTimeout(
            timer
          );

          if (
            response?.success === false
          ) {
            const error =
              new Error(
                response.message ||
                  "Socket request failed."
              );

            error.code =
              response.code;

            error.statusCode =
              response.statusCode;

            error.response =
              response;

            reject(error);

            return;
          }

          resolve(response);
        }
      );
    }
  );
};

/* ==========================================================
   EVENT LISTENER HELPERS
========================================================== */

export const onSocketEvent = (
  eventName,
  handler
) => {
  const activeSocket =
    getSocket();

  activeSocket.on(
    eventName,
    handler
  );

  return () => {
    activeSocket.off(
      eventName,
      handler
    );
  };
};

export const onceSocketEvent = (
  eventName,
  handler
) => {
  const activeSocket =
    getSocket();

  activeSocket.once(
    eventName,
    handler
  );

  return () => {
    activeSocket.off(
      eventName,
      handler
    );
  };
};

export const offSocketEvent = (
  eventName,
  handler
) => {
  if (!socket) {
    return;
  }

  socket.off(
    eventName,
    handler
  );
};

/* ==========================================================
   MEETING ROOM
========================================================== */

export const joinSocketMeeting = async (
  meetingId
) => {
  return emitSocketEvent(
    "meeting:join",
    {
      meetingId,
    }
  );
};

export const leaveSocketMeeting = async (
  meetingId
) => {
  return emitSocketEvent(
    "meeting:leave",
    {
      meetingId,
    }
  );
};

export const getMeetingPresence = async (
  meetingId
) => {
  return emitSocketEvent(
    "meeting:get-presence",
    {
      meetingId,
    }
  );
};

/* ==========================================================
   MEETING CONTROL
========================================================== */

export const startSocketMeeting = async (
  meetingId
) => {
  return emitSocketEvent(
    "meeting:start",
    {
      meetingId,
    }
  );
};

export const endSocketMeeting = async (
  meetingId
) => {
  return emitSocketEvent(
    "meeting:end",
    {
      meetingId,
    }
  );
};

/* ==========================================================
   WAITING ROOM
========================================================== */

export const admitSocketParticipant =
  async (
    meetingId,
    participantUserId
  ) => {
    return emitSocketEvent(
      "meeting:admit-participant",
      {
        meetingId,
        participantUserId,
      }
    );
  };

export const removeSocketParticipant =
  async (
    meetingId,
    participantUserId,
    reason = ""
  ) => {
    return emitSocketEvent(
      "meeting:remove-participant",
      {
        meetingId,
        participantUserId,
        reason,
      }
    );
  };

/* ==========================================================
   PARTICIPANT MEDIA
========================================================== */

export const updateSocketMedia =
  async (
    meetingId,
    media
  ) => {
    return emitSocketEvent(
      "meeting:update-media",
      {
        meetingId,
        ...media,
      }
    );
  };

export const raiseSocketHand = async (
  meetingId,
  handRaised = true
) => {
  return emitSocketEvent(
    "meeting:raise-hand",
    {
      meetingId,
      handRaised,
    }
  );
};

/* ==========================================================
   LIVE ROOM SETTINGS
========================================================== */

export const updateSocketRoomSettings =
  async (
    meetingId,
    settings
  ) => {
    return emitSocketEvent(
      "meeting:update-room-settings",
      {
        meetingId,
        settings,
      }
    );
  };

/* ==========================================================
   CHAT
========================================================== */

export const sendSocketChatMessage =
  async (
    meetingId,
    message
  ) => {
    return emitSocketEvent(
      "meeting:chat-message",
      {
        meetingId,
        message,
      }
    );
  };

export const sendSocketTypingStatus =
  (
    meetingId,
    isTyping
  ) => {
    const activeSocket =
      getSocket();

    if (!activeSocket.connected) {
      return;
    }

    activeSocket.emit(
      "meeting:typing",
      {
        meetingId,
        isTyping,
      }
    );
  };

/* ==========================================================
   WEBRTC SIGNALLING
========================================================== */

export const sendWebRTCOffer = async (
  meetingId,
  targetSocketId,
  signal,
  metadata = null
) => {
  return emitSocketEvent(
    "webrtc:offer",
    {
      meetingId,
      targetSocketId,
      signal,
      metadata,
    }
  );
};

export const sendWebRTCAnswer = async (
  meetingId,
  targetSocketId,
  signal,
  metadata = null
) => {
  return emitSocketEvent(
    "webrtc:answer",
    {
      meetingId,
      targetSocketId,
      signal,
      metadata,
    }
  );
};

export const sendWebRTCIceCandidate =
  async (
    meetingId,
    targetSocketId,
    signal,
    metadata = null
  ) => {
    return emitSocketEvent(
      "webrtc:ice-candidate",
      {
        meetingId,
        targetSocketId,
        signal,
        metadata,
      }
    );
  };

export const sendWebRTCRenegotiation =
  async (
    meetingId,
    targetSocketId,
    signal,
    metadata = null
  ) => {
    return emitSocketEvent(
      "webrtc:renegotiate",
      {
        meetingId,
        targetSocketId,
        signal,
        metadata,
      }
    );
  };

/* ==========================================================
   SCREEN SHARING
========================================================== */

export const updateScreenShareStatus =
  async (
    meetingId,
    screenSharing
  ) => {
    return emitSocketEvent(
      "webrtc:screen-share-status",
      {
        meetingId,
        screenSharing,
      }
    );
  };

/* ==========================================================
   CONNECTION EVENTS
========================================================== */

export const onSocketConnected = (
  handler
) => {
  return onSocketEvent(
    "connect",
    handler
  );
};

export const onSocketDisconnected = (
  handler
) => {
  return onSocketEvent(
    "disconnect",
    handler
  );
};

export const onSocketConnectError = (
  handler
) => {
  return onSocketEvent(
    "connect_error",
    handler
  );
};

export const onSocketAuthenticated = (
  handler
) => {
  return onSocketEvent(
    "socket:authenticated",
    handler
  );
};

/* ==========================================================
   MEETING EVENTS
========================================================== */

export const onMeetingError = (
  handler
) => {
  return onSocketEvent(
    "meeting:error",
    handler
  );
};

export const onMeetingStarted = (
  handler
) => {
  return onSocketEvent(
    "meeting:started",
    handler
  );
};

export const onMeetingEnded = (
  handler
) => {
  return onSocketEvent(
    "meeting:ended",
    handler
  );
};

export const onMeetingAdmitted = (
  handler
) => {
  return onSocketEvent(
    "meeting:admitted",
    handler
  );
};

export const onMeetingRemoved = (
  handler
) => {
  return onSocketEvent(
    "meeting:removed",
    handler
  );
};

/* ==========================================================
   PARTICIPANT EVENTS
========================================================== */

export const onParticipantJoined = (
  handler
) => {
  return onSocketEvent(
    "meeting:participant-joined",
    handler
  );
};

export const onParticipantLeft = (
  handler
) => {
  return onSocketEvent(
    "meeting:participant-left",
    handler
  );
};

export const onParticipantDisconnected =
  (
    handler
  ) => {
    return onSocketEvent(
      "meeting:participant-disconnected",
      handler
    );
  };

export const onParticipantWaiting = (
  handler
) => {
  return onSocketEvent(
    "meeting:participant-waiting",
    handler
  );
};

export const onParticipantAdmitted = (
  handler
) => {
  return onSocketEvent(
    "meeting:participant-admitted",
    handler
  );
};

export const onParticipantRemoved = (
  handler
) => {
  return onSocketEvent(
    "meeting:participant-removed",
    handler
  );
};

export const onParticipantMediaUpdated =
  (
    handler
  ) => {
    return onSocketEvent(
      "meeting:participant-media-updated",
      handler
    );
  };

export const onMeetingPresence = (
  handler
) => {
  return onSocketEvent(
    "meeting:presence",
    handler
  );
};

export const onMeetingHandUpdated = (
  handler
) => {
  return onSocketEvent(
    "meeting:hand-updated",
    handler
  );
};

/* ==========================================================
   CHAT EVENTS
========================================================== */

export const onMeetingChatMessage = (
  handler
) => {
  return onSocketEvent(
    "meeting:chat-message",
    handler
  );
};

export const onMeetingTyping = (
  handler
) => {
  return onSocketEvent(
    "meeting:typing",
    handler
  );
};

/* ==========================================================
   LIVE ROOM SETTING EVENTS
========================================================== */

export const onRoomSettingsUpdated =
  (
    handler
  ) => {
    return onSocketEvent(
      "meeting:room-settings-updated",
      handler
    );
  };

/* ==========================================================
   WEBRTC EVENTS
========================================================== */

export const onWebRTCOffer = (
  handler
) => {
  return onSocketEvent(
    "webrtc:offer",
    handler
  );
};

export const onWebRTCAnswer = (
  handler
) => {
  return onSocketEvent(
    "webrtc:answer",
    handler
  );
};

export const onWebRTCIceCandidate =
  (
    handler
  ) => {
    return onSocketEvent(
      "webrtc:ice-candidate",
      handler
    );
  };

export const onWebRTCRenegotiation =
  (
    handler
  ) => {
    return onSocketEvent(
      "webrtc:renegotiate",
      handler
    );
  };

export const onScreenShareStatus = (
  handler
) => {
  return onSocketEvent(
    "webrtc:screen-share-status",
    handler
  );
};

/* ==========================================================
   SOCKET SERVICE EXPORT
========================================================== */

const socketService = {
  getSocket,
  connectSocket,
  disconnectSocket,
  isSocketConnected,
  getSocketId,

  emitSocketEvent,
  onSocketEvent,
  onceSocketEvent,
  offSocketEvent,

  joinSocketMeeting,
  leaveSocketMeeting,
  getMeetingPresence,

  startSocketMeeting,
  endSocketMeeting,

  admitSocketParticipant,
  removeSocketParticipant,

  updateSocketMedia,
  raiseSocketHand,
  updateSocketRoomSettings,

  sendSocketChatMessage,
  sendSocketTypingStatus,

  sendWebRTCOffer,
  sendWebRTCAnswer,
  sendWebRTCIceCandidate,
  sendWebRTCRenegotiation,
  updateScreenShareStatus,

  onSocketConnected,
  onSocketDisconnected,
  onSocketConnectError,
  onSocketAuthenticated,

  onMeetingError,
  onMeetingStarted,
  onMeetingEnded,
  onMeetingAdmitted,
  onMeetingRemoved,

  onParticipantJoined,
  onParticipantLeft,
  onParticipantDisconnected,
  onParticipantWaiting,
  onParticipantAdmitted,
  onParticipantRemoved,
  onParticipantMediaUpdated,
  onMeetingPresence,
  onMeetingHandUpdated,

  onMeetingChatMessage,
  onMeetingTyping,
  onRoomSettingsUpdated,

  onWebRTCOffer,
  onWebRTCAnswer,
  onWebRTCIceCandidate,
  onWebRTCRenegotiation,
  onScreenShareStatus,
};

export default socketService;