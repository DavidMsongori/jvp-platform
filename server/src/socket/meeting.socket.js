import User from "../models/User.js";
import Member from "../models/Member.js";

import {
  verifyToken,
} from "../utils/jwt.js";

import {
  getMeetingById,
  joinMeeting,
  leaveMeeting,
  admitParticipant,
  removeParticipant,
  startMeeting,
  endMeeting,
  updateParticipantMedia,
  updateLiveRoomSettings,
} from "../services/meeting.service.js";

/* ==========================================================
   MEETING SOCKET REGISTRY

   Structure:

   Map<
     meetingId,
     Map<
       userId,
       Set<socketId>
     >
   >

   This supports users joining from multiple browser tabs or
   devices without incorrectly marking them offline.
========================================================== */

const meetingConnections =
  new Map();

/* ==========================================================
   ROOM NAME HELPERS
========================================================== */

const getMeetingRoom = (
  meetingId
) => {
  return `meeting:${meetingId}`;
};

const getWaitingRoom = (
  meetingId
) => {
  return `meeting:${meetingId}:waiting`;
};

const getUserRoom = (
  userId
) => {
  return `user:${userId}`;
};

/* ==========================================================
   ERROR HELPERS
========================================================== */

const createSocketError = (
  message,
  statusCode = 400,
  code = "SOCKET_ERROR"
) => {
  const error = new Error(message);

  error.statusCode = statusCode;
  error.code = code;

  return error;
};

const formatSocketError = (
  error
) => {
  return {
    success: false,

    message:
      error?.message ||
      "An unexpected meeting socket error occurred.",

    code:
      error?.code ||
      "MEETING_SOCKET_ERROR",

    statusCode:
      error?.statusCode ||
      500,
  };
};

/* ==========================================================
   ACKNOWLEDGEMENT HELPERS
========================================================== */

const sendAcknowledgement = (
  callback,
  payload
) => {
  if (
    typeof callback ===
    "function"
  ) {
    callback(payload);
  }
};

const sendSuccess = (
  callback,
  message,
  data = null
) => {
  sendAcknowledgement(
    callback,
    {
      success: true,
      message,
      data,
    }
  );
};

const sendFailure = (
  socket,
  callback,
  error
) => {
  const payload =
    formatSocketError(error);

  sendAcknowledgement(
    callback,
    payload
  );

  socket.emit(
    "meeting:error",
    payload
  );
};

/* ==========================================================
   SOCKET TOKEN EXTRACTION
========================================================== */

const extractSocketToken = (
  socket
) => {
  const handshakeToken =
    socket.handshake?.auth?.token;

  if (
    typeof handshakeToken ===
      "string" &&
    handshakeToken.trim()
  ) {
    return handshakeToken
      .replace(/^Bearer\s+/i, "")
      .trim();
  }

  const authorizationHeader =
    socket.handshake?.headers
      ?.authorization;

  if (
    typeof authorizationHeader ===
      "string" &&
    authorizationHeader.startsWith(
      "Bearer "
    )
  ) {
    return authorizationHeader
      .split(" ")[1]
      ?.trim();
  }

  const queryToken =
    socket.handshake?.query?.token;

  if (
    typeof queryToken ===
      "string" &&
    queryToken.trim()
  ) {
    return queryToken
      .replace(/^Bearer\s+/i, "")
      .trim();
  }

  return null;
};

/* ==========================================================
   SOCKET AUTHENTICATION
========================================================== */

const authenticateSocket =
  async (
    socket,
    next
  ) => {
    try {
      const token =
        extractSocketToken(
          socket
        );

      if (!token) {
        return next(
          createSocketError(
            "Authentication token is required.",
            401,
            "AUTHENTICATION_REQUIRED"
          )
        );
      }

      const decoded =
        verifyToken(token);

      if (!decoded?.id) {
        return next(
          createSocketError(
            "Invalid authentication token.",
            401,
            "INVALID_TOKEN"
          )
        );
      }

      const user =
        await User.findById(
          decoded.id
        ).select("-password");

      if (!user) {
        return next(
          createSocketError(
            "User account not found.",
            401,
            "USER_NOT_FOUND"
          )
        );
      }

      if (!user.isActive) {
        return next(
          createSocketError(
            "Your account has been deactivated.",
            403,
            "ACCOUNT_DEACTIVATED"
          )
        );
      }

      const member =
        await Member.findOne({
          user: user._id,
        });

      socket.user = user;
      socket.member = member;
      socket.authToken =
        token;

      socket.data.userId =
        user._id.toString();

      socket.data.memberId =
        member?._id?.toString() ||
        null;

      next();
    } catch (error) {
      const authError =
        createSocketError(
          "Invalid or expired authentication token.",
          401,
          "INVALID_OR_EXPIRED_TOKEN"
        );

      next(authError);
    }
  };

/* ==========================================================
   CONNECTION REGISTRY HELPERS
========================================================== */

const registerConnection = ({
  meetingId,
  userId,
  socketId,
}) => {
  const normalizedMeetingId =
    meetingId.toString();

  const normalizedUserId =
    userId.toString();

  if (
    !meetingConnections.has(
      normalizedMeetingId
    )
  ) {
    meetingConnections.set(
      normalizedMeetingId,
      new Map()
    );
  }

  const meetingUsers =
    meetingConnections.get(
      normalizedMeetingId
    );

  if (
    !meetingUsers.has(
      normalizedUserId
    )
  ) {
    meetingUsers.set(
      normalizedUserId,
      new Set()
    );
  }

  meetingUsers
    .get(normalizedUserId)
    .add(socketId);
};

const unregisterConnection = ({
  meetingId,
  userId,
  socketId,
}) => {
  const normalizedMeetingId =
    meetingId.toString();

  const normalizedUserId =
    userId.toString();

  const meetingUsers =
    meetingConnections.get(
      normalizedMeetingId
    );

  if (!meetingUsers) {
    return {
      userStillConnected: false,
      meetingStillActive:
        false,
    };
  }

  const userSockets =
    meetingUsers.get(
      normalizedUserId
    );

  if (!userSockets) {
    return {
      userStillConnected: false,
      meetingStillActive:
        meetingUsers.size > 0,
    };
  }

  userSockets.delete(socketId);

  if (
    userSockets.size === 0
  ) {
    meetingUsers.delete(
      normalizedUserId
    );
  }

  if (
    meetingUsers.size === 0
  ) {
    meetingConnections.delete(
      normalizedMeetingId
    );
  }

  return {
    userStillConnected:
      userSockets.size > 0,

    meetingStillActive:
      meetingUsers.size > 0,
  };
};

const getConnectedParticipants = (
  meetingId
) => {
  const meetingUsers =
    meetingConnections.get(
      meetingId.toString()
    );

  if (!meetingUsers) {
    return [];
  }

  return Array.from(
    meetingUsers.entries()
  ).map(
    ([
      userId,
      socketIds,
    ]) => {
      const resolvedSocketIds =
        Array.from(socketIds);

      return {
        userId,

        socketId:
          resolvedSocketIds[0] ||
          "",

        socketIds:
          resolvedSocketIds,

        connectionCount:
          resolvedSocketIds.length,
      };
    }
  );
};

const getUserSocketIds = ({
  meetingId,
  userId,
}) => {
  const meetingUsers =
    meetingConnections.get(
      meetingId.toString()
    );

  if (!meetingUsers) {
    return [];
  }

  const socketIds =
    meetingUsers.get(
      userId.toString()
    );

  if (!socketIds) {
    return [];
  }

  return Array.from(
    socketIds
  );
};

/* ==========================================================
   ACTIVE MEETING TRACKING

   Each socket may be connected to several meeting rooms.
========================================================== */

const trackSocketMeeting = (
  socket,
  meetingId
) => {
  if (
    !socket.data.meetingIds
  ) {
    socket.data.meetingIds =
      new Set();
  }

  socket.data.meetingIds.add(
    meetingId.toString()
  );
};

const untrackSocketMeeting = (
  socket,
  meetingId
) => {
  socket.data.meetingIds?.delete(
    meetingId.toString()
  );
};

/* ==========================================================
   PAYLOAD VALIDATION
========================================================== */

const requireMeetingId = (
  payload
) => {
  const meetingId =
    payload?.meetingId;

  if (!meetingId) {
    throw createSocketError(
      "Meeting ID is required.",
      400,
      "MEETING_ID_REQUIRED"
    );
  }

  return meetingId.toString();
};

const requireTargetSocketId = (
  payload
) => {
  const targetSocketId =
    payload?.targetSocketId;

  if (!targetSocketId) {
    throw createSocketError(
      "Target socket ID is required.",
      400,
      "TARGET_SOCKET_REQUIRED"
    );
  }

  return targetSocketId;
};

/* ==========================================================
   MEETING ACCESS CHECK
========================================================== */

const getAuthorizedMeeting =
  async (
    socket,
    meetingId
  ) => {
    return getMeetingById({
      meetingId,

      currentUser:
        socket.user,
    });
  };

/* ==========================================================
   TARGET SOCKET VALIDATION
========================================================== */

const validateTargetSocket = ({
  io,
  meetingId,
  targetSocketId,
}) => {
  const targetSocket =
    io.sockets.sockets.get(
      targetSocketId
    );

  if (!targetSocket) {
    throw createSocketError(
      "The target participant is no longer connected.",
      404,
      "TARGET_PARTICIPANT_OFFLINE"
    );
  }

  const roomName =
    getMeetingRoom(
      meetingId
    );

  if (
    !targetSocket.rooms.has(
      roomName
    )
  ) {
    throw createSocketError(
      "The target participant is not in this meeting.",
      403,
      "TARGET_NOT_IN_MEETING"
    );
  }

  return targetSocket;
};

/* ==========================================================
   PARTICIPANT SUMMARY
========================================================== */

const buildParticipantSummary = (
  socket
) => {
  return {
    userId:
      socket.user._id.toString(),

    memberId:
      socket.member?._id?.toString() ||
      null,

    socketId:
      socket.id,

    name:
      [
        socket.member?.firstName,
        socket.member?.middleName,
        socket.member?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      socket.user.email,

    email:
      socket.user.email,

    role:
      socket.user.role,

    profilePhoto:
      socket.member
        ?.profilePhoto ||
      null,
  };
};

/* ==========================================================
   MOVE USER FROM WAITING ROOM
========================================================== */

const admitUserSockets = async ({
  io,
  meetingId,
  userId,
}) => {
  const socketIds =
    getUserSocketIds({
      meetingId,
      userId,
    });

  const waitingRoom =
    getWaitingRoom(
      meetingId
    );

  const meetingRoom =
    getMeetingRoom(
      meetingId
    );

  for (
    const socketId of
    socketIds
  ) {
    const participantSocket =
      io.sockets.sockets.get(
        socketId
      );

    if (
      !participantSocket
    ) {
      continue;
    }

    await participantSocket.leave(
      waitingRoom
    );

    await participantSocket.join(
      meetingRoom
    );

    participantSocket.emit(
      "meeting:admitted",
      {
        success: true,
        message:
          "You have been admitted to the meeting.",
        data: {
          meetingId,
        },
      }
    );
  }
};

/* ==========================================================
   REMOVE USER FROM SOCKET ROOMS
========================================================== */

const removeUserSocketsFromMeeting =
  async ({
    io,
    meetingId,
    userId,
    reason,
  }) => {
    const socketIds =
      getUserSocketIds({
        meetingId,
        userId,
      });

    const meetingRoom =
      getMeetingRoom(
        meetingId
      );

    const waitingRoom =
      getWaitingRoom(
        meetingId
      );

    for (
      const socketId of
      socketIds
    ) {
      const participantSocket =
        io.sockets.sockets.get(
          socketId
        );

      if (
        !participantSocket
      ) {
        continue;
      }

      participantSocket.emit(
        "meeting:removed",
        {
          success: true,

          message:
            reason ||
            "You have been removed from the meeting.",

          data: {
            meetingId,
          },
        }
      );

      await participantSocket.leave(
        meetingRoom
      );

      await participantSocket.leave(
        waitingRoom
      );

      unregisterConnection({
        meetingId,
        userId,
        socketId,
      });

      untrackSocketMeeting(
        participantSocket,
        meetingId
      );
    }
  };

/* ==========================================================
   WEBRTC SIGNAL RELAY
========================================================== */

const relayWebRTCSignal = ({
  io,
  socket,
  eventName,
  payload,
  callback,
}) => {
  try {
    const meetingId =
      requireMeetingId(
        payload
      );

    const targetSocketId =
      requireTargetSocketId(
        payload
      );

    validateTargetSocket({
      io,
      meetingId,
      targetSocketId,
    });

    const meetingRoom =
      getMeetingRoom(
        meetingId
      );

    if (
      !socket.rooms.has(
        meetingRoom
      )
    ) {
      throw createSocketError(
        "You must join the meeting before sending WebRTC signals.",
        403,
        "NOT_IN_MEETING"
      );
    }

    io.to(
      targetSocketId
    ).emit(eventName, {
      meetingId,

      senderSocketId:
        socket.id,

      sender:
        buildParticipantSummary(
          socket
        ),

      signal:
        payload.signal,

      metadata:
        payload.metadata ||
        null,
    });

    sendSuccess(
      callback,
      "WebRTC signal sent successfully."
    );
  } catch (error) {
    sendFailure(
      socket,
      callback,
      error
    );
  }
};

/* ==========================================================
   MAIN MEETING SOCKET REGISTRATION
========================================================== */

const registerMeetingSocket = (
  io
) => {
  /* ==========================================
     SOCKET AUTHENTICATION
  ========================================== */

  io.use(
    authenticateSocket
  );

  /* ==========================================
     CONNECTION
  ========================================== */

  io.on(
    "connection",
    async (socket) => {
      const userId =
        socket.user._id.toString();

      await socket.join(
        getUserRoom(userId)
      );

      socket.emit(
        "socket:authenticated",
        {
          success: true,

          message:
            "Socket authentication successful.",

          data: {
            socketId:
              socket.id,

            userId,

            memberId:
              socket.member?._id?.toString() ||
              null,
          },
        }
      );

      /* ====================================================
         JOIN MEETING
      ==================================================== */

      socket.on(
        "meeting:join",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const result =
              await joinMeeting({
                meetingId,

                currentUser:
                  socket.user,
              });

            registerConnection({
              meetingId,
              userId,
              socketId:
                socket.id,
            });

            trackSocketMeeting(
              socket,
              meetingId
            );

            const participant =
              buildParticipantSummary(
                socket
              );

            if (
              result
                ?.waitingRoomRequired
            ) {
              await socket.join(
                getWaitingRoom(
                  meetingId
                )
              );

              io.to(
                getMeetingRoom(
                  meetingId
                )
              ).emit(
                "meeting:participant-waiting",
                {
                  meetingId,
                  participant,
                }
              );

              return sendSuccess(
                callback,
                "You have joined the meeting waiting room.",
                {
                  ...result,
                  meetingId,
                  participant,
                  socketId:
                    socket.id,
                }
              );
            }

            await socket.join(
              getMeetingRoom(
                meetingId
              )
            );

            socket
              .to(
                getMeetingRoom(
                  meetingId
                )
              )
              .emit(
                "meeting:participant-joined",
                {
                  meetingId,
                  participant,
                }
              );

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:presence",
              {
                meetingId,

                participants:
                  getConnectedParticipants(
                    meetingId
                  ),
              }
            );

            return sendSuccess(
              callback,
              "You joined the meeting successfully.",
              {
                ...result,
                meetingId,
                participant,
                socketId:
                  socket.id,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         LEAVE MEETING
      ==================================================== */

      socket.on(
        "meeting:leave",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const participant =
              await leaveMeeting({
                meetingId,

                currentUser:
                  socket.user,
              });

            await socket.leave(
              getMeetingRoom(
                meetingId
              )
            );

            await socket.leave(
              getWaitingRoom(
                meetingId
              )
            );

            const connectionState =
              unregisterConnection({
                meetingId,
                userId,
                socketId:
                  socket.id,
              });

            untrackSocketMeeting(
              socket,
              meetingId
            );

            if (
              !connectionState
                .userStillConnected
            ) {
              socket
                .to(
                  getMeetingRoom(
                    meetingId
                  )
                )
                .emit(
                  "meeting:participant-left",
                  {
                    meetingId,
                    userId,
                    participant,
                  }
                );
            }

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:presence",
              {
                meetingId,

                participants:
                  getConnectedParticipants(
                    meetingId
                  ),
              }
            );

            sendSuccess(
              callback,
              "You left the meeting successfully.",
              {
                participant,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         GET CONNECTED PARTICIPANTS
      ==================================================== */

      socket.on(
        "meeting:get-presence",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            await getAuthorizedMeeting(
              socket,
              meetingId
            );

            sendSuccess(
              callback,
              "Meeting presence retrieved successfully.",
              {
                meetingId,

                participants:
                  getConnectedParticipants(
                    meetingId
                  ),
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         START MEETING
      ==================================================== */

      socket.on(
        "meeting:start",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const meeting =
              await startMeeting({
                meetingId,

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:started",
              {
                meetingId,
                meeting,
              }
            );

            io.to(
              getWaitingRoom(
                meetingId
              )
            ).emit(
              "meeting:started",
              {
                meetingId,
                meeting,
              }
            );

            sendSuccess(
              callback,
              "Meeting started successfully.",
              {
                meeting,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         END MEETING
      ==================================================== */

      socket.on(
        "meeting:end",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const meeting =
              await endMeeting({
                meetingId,

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:ended",
              {
                meetingId,
                meeting,
              }
            );

            io.to(
              getWaitingRoom(
                meetingId
              )
            ).emit(
              "meeting:ended",
              {
                meetingId,
                meeting,
              }
            );

            const meetingUsers =
              meetingConnections.get(
                meetingId
              );

            if (meetingUsers) {
              for (
                const [
                  connectedUserId,
                  socketIds,
                ] of meetingUsers
              ) {
                for (
                  const socketId of
                  socketIds
                ) {
                  const connectedSocket =
                    io.sockets.sockets.get(
                      socketId
                    );

                  if (
                    connectedSocket
                  ) {
                    await connectedSocket.leave(
                      getMeetingRoom(
                        meetingId
                      )
                    );

                    await connectedSocket.leave(
                      getWaitingRoom(
                        meetingId
                      )
                    );

                    untrackSocketMeeting(
                      connectedSocket,
                      meetingId
                    );
                  }
                }

                meetingUsers.delete(
                  connectedUserId
                );
              }

              meetingConnections.delete(
                meetingId
              );
            }

            sendSuccess(
              callback,
              "Meeting ended successfully.",
              {
                meeting,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         ADMIT PARTICIPANT
      ==================================================== */

      socket.on(
        "meeting:admit-participant",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const participantUserId =
              payload
                ?.participantUserId;

            if (
              !participantUserId
            ) {
              throw createSocketError(
                "Participant user ID is required.",
                400,
                "PARTICIPANT_ID_REQUIRED"
              );
            }

            const participant =
              await admitParticipant({
                meetingId,

                participantUserId,

                currentUser:
                  socket.user,
              });

            await admitUserSockets({
              io,
              meetingId,
              userId:
                participantUserId,
            });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:participant-admitted",
              {
                meetingId,
                participant,
                participantUserId,
              }
            );

            sendSuccess(
              callback,
              "Participant admitted successfully.",
              {
                participant,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         REMOVE PARTICIPANT
      ==================================================== */

      socket.on(
        "meeting:remove-participant",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const participantUserId =
              payload
                ?.participantUserId;

            if (
              !participantUserId
            ) {
              throw createSocketError(
                "Participant user ID is required.",
                400,
                "PARTICIPANT_ID_REQUIRED"
              );
            }

            const meeting =
              await removeParticipant({
                meetingId,

                participantUserId,

                reason:
                  payload.reason,

                currentUser:
                  socket.user,
              });

            await removeUserSocketsFromMeeting({
              io,
              meetingId,
              userId:
                participantUserId,

              reason:
                payload.reason,
            });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:participant-removed",
              {
                meetingId,

                participantUserId,

                reason:
                  payload.reason ||
                  null,
              }
            );

            sendSuccess(
              callback,
              "Participant removed successfully.",
              {
                meeting,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         UPDATE PARTICIPANT MEDIA
      ==================================================== */

      socket.on(
        "meeting:update-media",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const participantUserId =
              payload
                .participantUserId ||
              userId;

            const media = {
              microphoneEnabled:
                payload
                  .microphoneEnabled,

              cameraEnabled:
                payload
                  .cameraEnabled,

              screenSharing:
                payload
                  .screenSharing,

              handRaised:
                payload
                  .handRaised,
            };

            Object.keys(
              media
            ).forEach((key) => {
              if (
                media[key] ===
                undefined
              ) {
                delete media[key];
              }
            });

            const participant =
              await updateParticipantMedia({
                meetingId,

                participantUserId,

                media,

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:participant-media-updated",
              {
                meetingId,

                participantUserId,

                media,

                participant,
              }
            );

            sendSuccess(
              callback,
              "Participant media updated successfully.",
              {
                participant,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         RAISE OR LOWER HAND
      ==================================================== */

      socket.on(
        "meeting:raise-hand",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const handRaised =
              payload.handRaised !==
              false;

            const participant =
              await updateParticipantMedia({
                meetingId,

                participantUserId:
                  userId,

                media: {
                  handRaised,
                },

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:hand-updated",
              {
                meetingId,
                userId,
                handRaised,
                participant,
              }
            );

            sendSuccess(
              callback,

              handRaised
                ? "Your hand has been raised."
                : "Your hand has been lowered.",

              {
                participant,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         UPDATE LIVE ROOM SETTINGS
      ==================================================== */

      socket.on(
        "meeting:update-room-settings",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const settings =
              payload.settings ||
              {};

            const liveRoom =
              await updateLiveRoomSettings({
                meetingId,
                settings,

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "meeting:room-settings-updated",
              {
                meetingId,
                liveRoom,
              }
            );

            io.to(
              getWaitingRoom(
                meetingId
              )
            ).emit(
              "meeting:room-settings-updated",
              {
                meetingId,
                liveRoom,
              }
            );

            sendSuccess(
              callback,
              "Meeting room settings updated successfully.",
              {
                liveRoom,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         MEETING CHAT

         This version broadcasts messages in real time.
         It does not permanently store chat messages.
      ==================================================== */

      socket.on(
        "meeting:chat-message",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const message =
              payload.message?.trim();

            if (!message) {
              throw createSocketError(
                "Chat message is required.",
                400,
                "MESSAGE_REQUIRED"
              );
            }

            if (
              message.length >
              2000
            ) {
              throw createSocketError(
                "Chat messages cannot exceed 2,000 characters.",
                400,
                "MESSAGE_TOO_LONG"
              );
            }

            const roomName =
              getMeetingRoom(
                meetingId
              );

            if (
              !socket.rooms.has(
                roomName
              )
            ) {
              throw createSocketError(
                "You must join the meeting before sending messages.",
                403,
                "NOT_IN_MEETING"
              );
            }

            const chatMessage = {
              id:
                `${Date.now()}-${socket.id}`,

              meetingId,

              message,

              sender:
                buildParticipantSummary(
                  socket
                ),

              createdAt:
                new Date().toISOString(),
            };

            io.to(
              roomName
            ).emit(
              "meeting:chat-message",
              chatMessage
            );

            sendSuccess(
              callback,
              "Message sent successfully.",
              {
                message:
                  chatMessage,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         TYPING STATUS
      ==================================================== */

      socket.on(
        "meeting:typing",
        (
          payload = {}
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const roomName =
              getMeetingRoom(
                meetingId
              );

            if (
              !socket.rooms.has(
                roomName
              )
            ) {
              return;
            }

            socket
              .to(roomName)
              .emit(
                "meeting:typing",
                {
                  meetingId,

                  userId,

                  isTyping:
                    payload.isTyping ===
                    true,

                  participant:
                    buildParticipantSummary(
                      socket
                    ),
                }
              );
          } catch {
            // Typing events are intentionally ignored
            // when their payload is invalid.
          }
        }
      );

      /* ====================================================
         WEBRTC OFFER
      ==================================================== */

      socket.on(
        "webrtc:offer",
        (
          payload = {},
          callback
        ) => {
          relayWebRTCSignal({
            io,
            socket,

            eventName:
              "webrtc:offer",

            payload,
            callback,
          });
        }
      );

      /* ====================================================
         WEBRTC ANSWER
      ==================================================== */

      socket.on(
        "webrtc:answer",
        (
          payload = {},
          callback
        ) => {
          relayWebRTCSignal({
            io,
            socket,

            eventName:
              "webrtc:answer",

            payload,
            callback,
          });
        }
      );

      /* ====================================================
         ICE CANDIDATE
      ==================================================== */

      socket.on(
        "webrtc:ice-candidate",
        (
          payload = {},
          callback
        ) => {
          relayWebRTCSignal({
            io,
            socket,

            eventName:
              "webrtc:ice-candidate",

            payload,
            callback,
          });
        }
      );

      /* ====================================================
         RENEGOTIATION REQUEST
      ==================================================== */

      socket.on(
        "webrtc:renegotiate",
        (
          payload = {},
          callback
        ) => {
          relayWebRTCSignal({
            io,
            socket,

            eventName:
              "webrtc:renegotiate",

            payload,
            callback,
          });
        }
      );

      /* ====================================================
         SCREEN SHARE STATUS
      ==================================================== */

      socket.on(
        "webrtc:screen-share-status",
        async (
          payload = {},
          callback
        ) => {
          try {
            const meetingId =
              requireMeetingId(
                payload
              );

            const screenSharing =
              payload.screenSharing ===
              true;

            const participant =
              await updateParticipantMedia({
                meetingId,

                participantUserId:
                  userId,

                media: {
                  screenSharing,
                },

                currentUser:
                  socket.user,
              });

            io.to(
              getMeetingRoom(
                meetingId
              )
            ).emit(
              "webrtc:screen-share-status",
              {
                meetingId,
                userId,
                socketId:
                  socket.id,
                screenSharing,
                participant,
              }
            );

            sendSuccess(
              callback,

              screenSharing
                ? "Screen sharing started."
                : "Screen sharing stopped.",

              {
                participant,
              }
            );
          } catch (error) {
            sendFailure(
              socket,
              callback,
              error
            );
          }
        }
      );

      /* ====================================================
         DISCONNECTION
      ==================================================== */

      socket.on(
        "disconnect",
        async (reason) => {
          const activeMeetingIds =
            Array.from(
              socket.data
                .meetingIds ||
                []
            );

          for (
            const meetingId of
            activeMeetingIds
          ) {
            try {
              const connectionState =
                unregisterConnection({
                  meetingId,
                  userId,
                  socketId:
                    socket.id,
                });

              if (
                !connectionState
                  .userStillConnected
              ) {
                try {
                  await leaveMeeting({
                    meetingId,

                    currentUser:
                      socket.user,
                  });
                } catch {
                  // The meeting may already have ended,
                  // been deleted, or the participant record
                  // may already be marked as having left.
                }

                socket
                  .to(
                    getMeetingRoom(
                      meetingId
                    )
                  )
                  .emit(
                    "meeting:participant-disconnected",
                    {
                      meetingId,
                      userId,
                      socketId:
                        socket.id,
                      reason,
                    }
                  );
              }

              io.to(
                getMeetingRoom(
                  meetingId
                )
              ).emit(
                "meeting:presence",
                {
                  meetingId,

                  participants:
                    getConnectedParticipants(
                      meetingId
                    ),
                }
              );
            } catch (error) {
              console.error(
                "Meeting disconnect cleanup error:",
                {
                  meetingId,
                  userId,
                  socketId:
                    socket.id,
                  error:
                    error.message,
                }
              );
            }
          }
        }
      );
    }
  );

  return io;
};

export {
  authenticateSocket,
  meetingConnections,
  getMeetingRoom,
  getWaitingRoom,
  getUserRoom,
  getConnectedParticipants,
};

export default registerMeetingSocket;