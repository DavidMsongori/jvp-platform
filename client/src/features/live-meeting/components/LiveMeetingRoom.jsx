import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useLiveMeeting,
  useLiveMeetingParticipants,
} from "../LiveMeetingContext";

import useLocalMedia from "../hooks/useLocalMedia";
import useWebRTC from "../hooks/useWebRTC";
import useScreenShare from "../hooks/useScreenShare";
import useMediaDevices from "../hooks/useMediaDevices";

import VideoGrid from "./VideoGrid";
import MeetingToolbar from "./MeetingToolbar";
import ParticipantsPanel from "./ParticipantsPanel";
import MeetingChatPanel from "./MeetingChatPanel";
import DeviceSettingsPanel from "./DeviceSettingsPanel";
import WaitingRoomPanel from "./WaitingRoomPanel";
import HostControlsPanel from "./HostControlsPanel";

import "./LiveMeetingRoom.css";

/* ==========================================================
   HELPERS
========================================================== */

const getUserDisplayName = (
  user
) => {
  if (!user) {
    return "You";
  }

  return (
    user.displayName ||
    user.fullName ||
    user.name ||
    [
      user.firstName,
      user.middleName,
      user.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    user.email ||
    "You"
  );
};

const getUserProfilePhoto = (
  user
) => {
  return (
    user?.profilePhoto ||
    user?.avatar ||
    user?.photo ||
    user?.member?.profilePhoto ||
    ""
  );
};

const getMeetingTitle = (
  meeting
) => {
  return (
    meeting?.title ||
    meeting?.name ||
    meeting?.meetingTitle ||
    "Live Meeting"
  );
};

const formatMeetingDuration = (
  seconds
) => {
  const safeSeconds =
    Math.max(
      0,
      Number(seconds) || 0
    );

  const hours =
    Math.floor(
      safeSeconds / 3600
    );

  const minutes =
    Math.floor(
      (
        safeSeconds % 3600
      ) / 60
    );

  const remainingSeconds =
    safeSeconds % 60;

  if (hours > 0) {
    return [
      hours,
      minutes,
      remainingSeconds,
    ]
      .map((value) =>
        String(value).padStart(
          2,
          "0"
        )
      )
      .join(":");
  }

  return [
    minutes,
    remainingSeconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0"
      )
    )
    .join(":");
};

const getStatusLabel = ({
  socketStatus,
  joined,
  waiting,
  admitted,
}) => {
  if (
    socketStatus ===
      "connecting" ||
    socketStatus ===
      "reconnecting"
  ) {
    return "Connecting";
  }

  if (
    socketStatus ===
      "disconnected"
  ) {
    return "Disconnected";
  }

  if (
  socketStatus === "connected" ||
  socketStatus === "authenticated"
) {
  if (waiting) {
    return "Waiting for admission";
  }

  if (joined && admitted) {
    return "Connected";
  }

  return "Joining meeting";
}

  if (waiting) {
    return "Waiting for admission";
  }

  if (
    joined &&
    admitted
  ) {
    return "Connected";
  }

  if (joined) {
    return "Joining";
  }

  return "Not joined";
};

/* ==========================================================
   ICONS
========================================================== */

const MicrophoneIcon = ({
  enabled,
}) => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    {enabled ? "🎙" : "🔇"}
  </span>
);

const CameraIcon = ({
  enabled,
}) => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    {enabled ? "▣" : "▢"}
  </span>
);

const ScreenShareIcon = () => (
  <span
    aria-hidden="true"
    className="live-meeting-room__button-icon"
  >
    ▤
  </span>
);

/* ==========================================================
   COMPONENT
========================================================== */

const LiveMeetingRoom = ({
  meeting: meetingProp = null,

  currentUser:
    currentUserProp = null,

  rtcConfiguration,

  autoStartMedia = true,

  defaultLayout = "auto",

  onLeave,

  onOpenChat,

  onOpenParticipants,

  onOpenSettings,

  className = "",
}) => {
  const liveMeeting =
    useLiveMeeting();

  const participantContext =
    useLiveMeetingParticipants?.() ||
    {};

  const meeting =
    meetingProp ||
    liveMeeting.meeting ||
    null;

  const currentUser =
    currentUserProp ||
    liveMeeting.currentUser ||
    liveMeeting.user ||
    null;

  const resolvedCurrentUserId =
    String(
      currentUser?._id ||
        currentUser?.id ||
        currentUser?.userId ||
        currentUser?.member?._id ||
        currentUser?.member?.id ||
        ""
    );

    const canManageParticipants = Boolean(
  liveMeeting?.isHost ||
    liveMeeting?.isCoHost ||
    liveMeeting?.isManager ||
    liveMeeting?.meetingRole === "host" ||
    liveMeeting?.meetingRole === "co_host" ||
    liveMeeting?.meetingRole === "manager" ||
    currentUser?.role === "super_admin" ||
    currentUser?.role === "admin"
);

  const allParticipants =
  participantContext.participants ||
  liveMeeting.participants ||
  [];

const currentUserIds =
  useMemo(() => {
    return new Set(
      [
        currentUser?._id,
        currentUser?.id,
        currentUser?.userId,

        currentUser?.user?._id,
        currentUser?.user?.id,

        currentUser?.member?._id,
        currentUser?.member?.id,

        liveMeeting
          ?.currentParticipant
          ?.userId,

        liveMeeting
          ?.currentParticipant
          ?.participantUserId,

        liveMeeting
          ?.currentParticipant
          ?.memberId,
      ]
        .filter(Boolean)
        .map((value) =>
          String(value)
        )
    );
  }, [
    currentUser,
    liveMeeting
      ?.currentParticipant,
  ]);

const currentUserEmail =
  String(
    currentUser?.email ||
      currentUser?.user?.email ||
      liveMeeting
        ?.currentParticipant
        ?.email ||
      ""
  )
    .trim()
    .toLowerCase();

const participants =
  useMemo(() => {
    return allParticipants.filter(
      (participant) => {
        const participantIds =
          [
            participant?.userId,
            participant
              ?.participantUserId,
            
             participant?.socketId, 

            participant?.user?._id,
            participant?.user?.id,

            participant?.user,

            participant?.memberId,
            participant?.member?._id,

            participant?._id,
            participant?.id,
          ]
            .filter(Boolean)
            .map((value) =>
              String(value)
            );

        const participantEmail =
          String(
            participant?.email ||
              participant?.user?.email ||
              participant?.raw?.email ||
              participant
                ?.raw?.user?.email ||
              ""
          )
            .trim()
            .toLowerCase();

        const sameUserId =
          participantIds.some(
            (participantId) =>
              currentUserIds.has(
                participantId
              )
          );

        const sameEmail =
          Boolean(
            currentUserEmail &&
              participantEmail &&
              currentUserEmail ===
                participantEmail
          );

        return (
          !sameUserId &&
          !sameEmail
        );
      }
    );
  }, [
    allParticipants,
    currentUserIds,
    currentUserEmail,
  ]);

 

  const {
  socketStatus = "disconnected",

  joined = false,
  waiting = false,
  admitted = false,

  joining = false,
  leaving = false,

  raisedHand = false,

  roomStatus,

  joinRoom,
  leaveMeeting,

  setRaisedHand,
  toggleRaisedHand,

  waitingParticipants:
    contextWaitingParticipants = [],

  admitParticipant,
  rejectParticipant,

  admitWaitingParticipant,
  rejectWaitingParticipant,

  meetingLocked = false,
waitingRoomEnabled = true,

participantUnmuteAllowed = true,
participantVideoAllowed = true,
participantScreenShareAllowed = true,
participantChatAllowed = true,

setMeetingLocked,
toggleMeetingLock,

setWaitingRoomEnabled,
toggleWaitingRoom,

setParticipantUnmuteAllowed,
setParticipantVideoAllowed,
setParticipantScreenShareAllowed,
setParticipantChatAllowed,

muteAllParticipants,
stopAllParticipantVideos,
endMeeting,

  localStreamRef,
  remoteStreamsRef,
} = liveMeeting;

 const waitingParticipants =
  participantContext.waitingParticipants ||
  contextWaitingParticipants ||
  liveMeeting.waitingRoomParticipants ||
  [];

 
  

  /* ========================================================
     MEDIA HOOKS
  ======================================================== */

  const localMedia =
    useLocalMedia({
      autoStart:
        autoStartMedia &&
        joined &&
        admitted,
    });

  const webRTC =
    useWebRTC({
      rtcConfiguration,
    });

  const screenShare =
    useScreenShare({
      webRTC,
    });

  const mediaDevices =
    useMediaDevices({
      localMedia,
      webRTC,
    });

  /* ========================================================
     LOCAL STATE
  ======================================================== */

  const [
    layout,
    setLayout,
  ] = useState(
    defaultLayout
  );

  const [
    controlsVisible,
    setControlsVisible,
  ] = useState(true);

  const [
    deviceMenuOpen,
    setDeviceMenuOpen,
  ] = useState(false);

  const [
  participantsPanelOpen,
  setParticipantsPanelOpen,
] = useState(false);

const [
  chatPanelOpen,
  setChatPanelOpen,
] = useState(false);

const [
  chatMessages,
  setChatMessages,
] = useState([]);

const [
  chatSending,
  setChatSending,
] = useState(false);

const [
  deviceSettingsPanelOpen,
  setDeviceSettingsPanelOpen,
] = useState(false);

const [
  waitingRoomPanelOpen,
  setWaitingRoomPanelOpen,
] = useState(false);

const [
  hostControlsPanelOpen,
  setHostControlsPanelOpen,
] = useState(false);



const [
  processingWaitingParticipantId,
  setProcessingWaitingParticipantId,
] = useState("");

const [
  waitingRoomBulkProcessing,
  setWaitingRoomBulkProcessing,
] = useState(false);

const [
  hostControlBusyAction,
  setHostControlBusyAction,
] = useState("");

const [
  hostControlError,
  setHostControlError,
] = useState(null);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    actionError,
    setActionError,
  ] = useState(null);

  const [
    actionBusy,
    setActionBusy,
  ] = useState("");


  /* ========================================================
   JOIN SOCKET MEETING ROOM
======================================================== */

useEffect(() => {
  const socketReady =
    socketStatus === "connected" ||
    socketStatus === "authenticated";

  if (
    !socketReady ||
    joined ||
    waiting ||
    joining ||
    typeof joinRoom !== "function"
  ) {
    return;
  }

  let cancelled = false;

  const enterSocketRoom =
    async () => {
      try {
        setActionError(null);

        await joinRoom();
      } catch (error) {
        if (!cancelled) {
          setActionError(
            error instanceof Error
              ? error
              : new Error(
                  "Unable to join the live meeting socket room."
                )
          );
        }
      }
    };

  enterSocketRoom();

  return () => {
    cancelled = true;
  };
}, [
  socketStatus,
  joined,
  waiting,
  joining,
  joinRoom,
]);

  /* ========================================================
     RESOLVED MEDIA VALUES
  ======================================================== */

  const localStream =
    localMedia.localStream ||
    localMedia.stream ||
    localStreamRef?.current ||
    null;

    const microphoneDevices =
  mediaDevices.microphones || [];

const cameraDevices =
  mediaDevices.cameras || [];

const speakerDevices =
  mediaDevices.speakers || [];

const selectedMicrophoneId =
  mediaDevices.selectedAudioInputId ||
  "";

const selectedCameraId =
  mediaDevices.selectedVideoInputId ||
  "";

const selectedSpeakerId =
  mediaDevices.selectedAudioOutputId ||
  "";

  const currentRemoteStreams =
    webRTC.remoteStreams ||
    webRTC.remoteStreamsRef
      ?.current ||
    remoteStreamsRef?.current ||
    null;

  const microphoneEnabled =
    localMedia.microphoneEnabled ??
    localMedia.microphone ??
    liveMeeting.localMedia
      ?.microphone ??
    false;

  const cameraEnabled =
    localMedia.cameraEnabled ??
    localMedia.camera ??
    liveMeeting.localMedia
      ?.camera ??
    false;

  const screenSharing =
    screenShare.screenSharing ??
    liveMeeting.localMedia
      ?.screenSharing ??
    false;

  const displayName =
    getUserDisplayName(
      currentUser
    );

  const profilePhoto =
    getUserProfilePhoto(
      currentUser
    );

  const participantCount =
    participants.length + 1;

  const meetingTitle =
    getMeetingTitle(meeting);

  const connectionLabel =
    getStatusLabel({
      socketStatus,
      joined,
      waiting,
      admitted,
    });

 const isConnected =
  (
    socketStatus ===
      "connected" ||
    socketStatus ===
      "authenticated"
  ) &&
  joined &&
  admitted;

  const roomEnded =
    roomStatus === "ended" ||
    meeting?.status === "ended";

  /* ========================================================
     MEETING TIMER
  ======================================================== */

  useEffect(() => {
    if (
      !joined ||
      !admitted ||
      roomEnded
    ) {
      return undefined;
    }

    const startedAt =
      meeting?.startedAt ||
      meeting?.actualStartTime ||
      new Date().toISOString();

    const updateTimer = () => {
      const startTime =
        new Date(
          startedAt
        ).getTime();

      if (
        Number.isNaN(startTime)
      ) {
        return;
      }

      setElapsedSeconds(
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              startTime
            ) / 1000
          )
        )
      );
    };

    updateTimer();

    const timer =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    joined,
    admitted,
    roomEnded,
    meeting?.startedAt,
    meeting?.actualStartTime,
  ]);

  /* ========================================================
     ERROR COLLECTION
  ======================================================== */

  const visibleError =
    actionError ||
    localMedia.mediaError ||
    localMedia.error ||
    screenShare.screenShareError ||
    mediaDevices.deviceError ||
    webRTC.error ||
    null;

  const visibleErrorMessage =
    visibleError?.message ||
    visibleError?.code ||
    String(
      visibleError || ""
    );

  const clearErrors =
    useCallback(() => {
      setActionError(null);

      localMedia.clearMediaError?.();
      localMedia.clearError?.();

      screenShare
        .clearScreenShareError?.();

      mediaDevices
        .clearDeviceError?.();

      webRTC.clearError?.();
    }, [
      localMedia,
      screenShare,
      mediaDevices,
      webRTC,
    ]);

  /* ========================================================
     MICROPHONE
  ======================================================== */

  const handleToggleMicrophone =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "microphone"
      );

      setActionError(null);

      try {
        if (
          typeof localMedia
            .toggleMicrophone ===
          "function"
        ) {
          await localMedia
            .toggleMicrophone();
        } else if (
          typeof localMedia
            .toggleAudio ===
          "function"
        ) {
          await localMedia
            .toggleAudio();
        } else {
          throw new Error(
            "Microphone controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      localMedia,
    ]);

  /* ========================================================
     CAMERA
  ======================================================== */

  const handleToggleCamera =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy("camera");
      setActionError(null);

      try {
        if (
          typeof localMedia
            .toggleCamera ===
          "function"
        ) {
          await localMedia
            .toggleCamera();
        } else if (
          typeof localMedia
            .toggleVideo ===
          "function"
        ) {
          await localMedia
            .toggleVideo();
        } else {
          throw new Error(
            "Camera controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      localMedia,
    ]);

  /* ========================================================
     SCREEN SHARE
  ======================================================== */

  const handleToggleScreenShare =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "screen-share"
      );

      setActionError(null);

      try {
        await screenShare
          .toggleScreenShare();
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      screenShare,
    ]);

  /* ========================================================
     RAISED HAND
  ======================================================== */

  const handleToggleRaisedHand =
    useCallback(async () => {
      if (
        actionBusy ||
        !isConnected
      ) {
        return;
      }

      setActionBusy(
        "raised-hand"
      );

      setActionError(null);

      try {
        if (
          typeof toggleRaisedHand ===
          "function"
        ) {
          await toggleRaisedHand();
        } else if (
          typeof setRaisedHand ===
          "function"
        ) {
          await setRaisedHand(
            !raisedHand
          );
        } else {
          throw new Error(
            "Raised-hand controls are unavailable."
          );
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      isConnected,
      toggleRaisedHand,
      setRaisedHand,
      raisedHand,
    ]);


const runHostControlAction =
  useCallback(
    async (
      actionName,
      action
    ) => {
      if (
        hostControlBusyAction ||
        !canManageParticipants
      ) {
        return;
      }

      setHostControlBusyAction(
        actionName
      );

      setHostControlError(null);
      setActionError(null);

     try {
  if (
    typeof action !==
    "function"
  ) {
    throw new Error(
      "This host control is not available yet."
    );
  }

  await action();
} catch (error) {
  setHostControlError(error);
  setActionError(error);

  return null;
} finally {
  setHostControlBusyAction("");
}
    },
    [
      hostControlBusyAction,
      canManageParticipants,
    ]
  );    


const handleToggleParticipantsPanel =
  useCallback(() => {
    setParticipantsPanelOpen(
      (current) => {
        const nextValue =
          !current;

        if (nextValue) {
          setChatPanelOpen(false);

          setDeviceSettingsPanelOpen(
            false
          );

          setWaitingRoomPanelOpen(
            false
          );

          setHostControlsPanelOpen(false);

          setDeviceMenuOpen(false);
        }

        return nextValue;
      }
    );
  }, []);
const handleToggleHostControlsPanel =
  useCallback(() => {
    if (!canManageParticipants) {
      return;
    }

    setHostControlsPanelOpen(
      (current) => {
        const nextValue =
          !current;

        if (nextValue) {
          setParticipantsPanelOpen(
            false
          );

          setChatPanelOpen(false);

          setDeviceSettingsPanelOpen(
            false
          );

          setWaitingRoomPanelOpen(
            false
          );

          setDeviceMenuOpen(false);
        }

        return nextValue;
      }
    );
  }, [canManageParticipants]);


  const handleToggleDeviceSettingsPanel =
  useCallback(() => {
    setDeviceSettingsPanelOpen(
      (current) => {
        const nextValue =
          !current;

        if (nextValue) {
          setParticipantsPanelOpen(
            false
          );

          setChatPanelOpen(false);

          setWaitingRoomPanelOpen(
            false
          );

          setHostControlsPanelOpen(false);

          setDeviceMenuOpen(false);
        }

        return nextValue;
      }
    );
  }, []);

  const handleToggleWaitingRoomPanel =
  useCallback(() => {
    setWaitingRoomPanelOpen(
      (current) => {
        const nextValue =
          !current;

        if (nextValue) {
          setParticipantsPanelOpen(
            false
          );

          setChatPanelOpen(false);

          setDeviceSettingsPanelOpen(
            false
          );

          setHostControlsPanelOpen(false);

          setDeviceMenuOpen(false);
        }

        return nextValue;
      }
    );
  }, []);

 const handleToggleChatPanel =
  useCallback(() => {
    setChatPanelOpen(
      (current) => {
        const nextValue =
          !current;

        if (nextValue) {
          setParticipantsPanelOpen(
            false
          );

          setDeviceSettingsPanelOpen(
            false
          );

          setWaitingRoomPanelOpen(
            false
          );
          setHostControlsPanelOpen(false);

          setDeviceMenuOpen(false);
        }

        return nextValue;
      }
    );
  }, []);


  const handleSendChatMessage =
  useCallback(
    async (messageText) => {
      const text =
        String(
          messageText || ""
        ).trim();

      if (!text) {
        return;
      }

      setChatSending(true);

      try {
        const temporaryMessage = {
          clientId:
            `local-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,

          senderId:
            resolvedCurrentUserId,

          senderName:
            currentUser?.fullName ||
            currentUser?.name ||
            [
              currentUser?.firstName,
              currentUser?.middleName,
              currentUser?.lastName,
            ]
              .filter(Boolean)
              .join(" ") ||
            currentUser?.email ||
            "You",

          senderPhoto:
            currentUser?.profilePhoto ||
            currentUser?.avatar ||
            "",

          text,

          createdAt:
            new Date().toISOString(),

          status: "sent",
        };

        setChatMessages(
          (currentMessages) => [
            ...currentMessages,
            temporaryMessage,
          ]
        );

        /*
         * Later, replace the local update above
         * with the socket/context chat method.
         *
         * Example:
         *
         * await liveMeeting.sendChatMessage({
         *   message: text,
         * });
         */
      } finally {
        setChatSending(false);
      }
    },
    [
      currentUser,
      resolvedCurrentUserId,
    ]
  );

  const handleDeleteChatMessage =
  useCallback((message) => {
    const messageId =
      String(
        message?.messageId ||
        message?._id ||
        message?.id ||
        message?.clientId ||
        ""
      );

    if (!messageId) {
      return;
    }

    setChatMessages(
      (currentMessages) =>
        currentMessages.filter(
          (currentMessage) => {
            const currentMessageId =
              String(
                currentMessage?.messageId ||
                currentMessage?._id ||
                currentMessage?.id ||
                currentMessage?.clientId ||
                ""
              );

            return (
              currentMessageId !==
              messageId
            );
          }
        )
    );
  }, []);

  const resolveWaitingParticipantId =
  useCallback((participant) => {
    return String(
      participant?.participantId ||
        participant?.socketId ||
        participant?.userId ||
        participant?.user?._id ||
        participant?.user?.id ||
        participant?._id ||
        participant?.id ||
        ""
    );
  }, []);

  const handleAdmitWaitingParticipant =
  useCallback(
    async (participant) => {
      const participantId =
        resolveWaitingParticipantId(
          participant
        );

      if (!participantId) {
        return;
      }

      setProcessingWaitingParticipantId(
        participantId
      );

      setActionError(null);

      try {
        const admitMethod =
          admitWaitingParticipant ||
          admitParticipant ||
          liveMeeting.admitUser;

        if (
          typeof admitMethod !==
          "function"
        ) {
          throw new Error(
            "Waiting-room admission is unavailable."
          );
        }

        await admitMethod({
          participantId,
          socketId:
            participant?.socketId,
          userId:
            participant?.userId ||
            participant?.user?._id,
          participant,
        });
      } catch (error) {
        setActionError(error);
      } finally {
        setProcessingWaitingParticipantId(
          ""
        );
      }
    },
    [
      admitWaitingParticipant,
      admitParticipant,
      liveMeeting,
      resolveWaitingParticipantId,
    ]
  );

  const handleRejectWaitingParticipant =
  useCallback(
    async (participant) => {
      const participantId =
        resolveWaitingParticipantId(
          participant
        );

      if (!participantId) {
        return;
      }

      setProcessingWaitingParticipantId(
        participantId
      );

      setActionError(null);

      try {
        const rejectMethod =
          rejectWaitingParticipant ||
          rejectParticipant ||
          liveMeeting.rejectUser;

        if (
          typeof rejectMethod !==
          "function"
        ) {
          throw new Error(
            "Waiting-room rejection is unavailable."
          );
        }

        await rejectMethod({
          participantId,
          socketId:
            participant?.socketId,
          userId:
            participant?.userId ||
            participant?.user?._id,
          participant,
        });
      } catch (error) {
        setActionError(error);
      } finally {
        setProcessingWaitingParticipantId(
          ""
        );
      }
    },
    [
      rejectWaitingParticipant,
      rejectParticipant,
      liveMeeting,
      resolveWaitingParticipantId,
    ]
  );

  const handleAdmitSelectedWaitingParticipants =
  useCallback(
    async (
      selectedParticipants
    ) => {
      if (
        !Array.isArray(
          selectedParticipants
        ) ||
        selectedParticipants.length ===
          0
      ) {
        return;
      }

      setWaitingRoomBulkProcessing(
        true
      );

      setActionError(null);

      try {
        for (
          const participant of
          selectedParticipants
        ) {
          await handleAdmitWaitingParticipant(
            participant
          );
        }
      } finally {
        setWaitingRoomBulkProcessing(
          false
        );
      }
    },
    [
      handleAdmitWaitingParticipant,
    ]
  );

const handleRejectSelectedWaitingParticipants =
  useCallback(
    async (
      selectedParticipants
    ) => {
      if (
        !Array.isArray(
          selectedParticipants
        ) ||
        selectedParticipants.length ===
          0
      ) {
        return;
      }

      setWaitingRoomBulkProcessing(
        true
      );

      setActionError(null);

      try {
        for (
          const participant of
          selectedParticipants
        ) {
          await handleRejectWaitingParticipant(
            participant
          );
        }
      } finally {
        setWaitingRoomBulkProcessing(
          false
        );
      }
    },
    [
      handleRejectWaitingParticipant,
    ]
  );

const handleAdmitAllWaitingParticipants =
  useCallback(
    async (
      allWaitingParticipants
    ) => {
      await handleAdmitSelectedWaitingParticipants(
        allWaitingParticipants
      );
    },
    [
      handleAdmitSelectedWaitingParticipants,
    ]
  );

  const handleToggleMeetingLock =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "meeting-lock",
        async () => {
          if (
            typeof setMeetingLocked ===
            "function"
          ) {
            await setMeetingLocked(
              nextValue
            );

            return;
          }

          if (
            typeof toggleMeetingLock ===
            "function"
          ) {
            await toggleMeetingLock(
              nextValue
            );

            return;
          }

          if (
            typeof liveMeeting
              .updateMeetingLock ===
            "function"
          ) {
            await liveMeeting
              .updateMeetingLock(
                nextValue
              );

            return;
          }

          throw new Error(
            "Meeting lock control is unavailable."
          );
        }
      );
    },
    [
      runHostControlAction,
      setMeetingLocked,
      toggleMeetingLock,
      liveMeeting,
    ]
  );

  const handleToggleWaitingRoom =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "waiting-room",
        async () => {
          if (
            typeof setWaitingRoomEnabled ===
            "function"
          ) {
            await setWaitingRoomEnabled(
              nextValue
            );

            return;
          }

          if (
            typeof toggleWaitingRoom ===
            "function"
          ) {
            await toggleWaitingRoom(
              nextValue
            );

            return;
          }

          if (
            typeof liveMeeting
              .updateWaitingRoom ===
            "function"
          ) {
            await liveMeeting
              .updateWaitingRoom(
                nextValue
              );

            return;
          }

          throw new Error(
            "Waiting-room control is unavailable."
          );
        }
      );
    },
    [
      runHostControlAction,
      setWaitingRoomEnabled,
      toggleWaitingRoom,
      liveMeeting,
    ]
  );

  const handleToggleParticipantUnmute =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "participant-unmute",
        async () => {
          const method =
            setParticipantUnmuteAllowed ||
            liveMeeting
              .updateParticipantUnmutePermission;

          if (
            typeof method !==
            "function"
          ) {
            throw new Error(
              "Participant microphone permission is unavailable."
            );
          }

          await method(nextValue);
        }
      );
    },
    [
      runHostControlAction,
      setParticipantUnmuteAllowed,
      liveMeeting,
    ]
  );

  const handleToggleParticipantVideo =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "participant-video",
        async () => {
          const method =
            setParticipantVideoAllowed ||
            liveMeeting
              .updateParticipantVideoPermission;

          if (
            typeof method !==
            "function"
          ) {
            throw new Error(
              "Participant video permission is unavailable."
            );
          }

          await method(nextValue);
        }
      );
    },
    [
      runHostControlAction,
      setParticipantVideoAllowed,
      liveMeeting,
    ]
  );

  const handleToggleParticipantScreenShare =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "participant-screen-share",
        async () => {
          const method =
            setParticipantScreenShareAllowed ||
            liveMeeting
              .updateParticipantScreenSharePermission;

          if (
            typeof method !==
            "function"
          ) {
            throw new Error(
              "Participant screen-sharing permission is unavailable."
            );
          }

          await method(nextValue);
        }
      );
    },
    [
      runHostControlAction,
      setParticipantScreenShareAllowed,
      liveMeeting,
    ]
  );

  const handleToggleParticipantChat =
  useCallback(
    async (nextValue) => {
      await runHostControlAction(
        "participant-chat",
        async () => {
          const method =
            setParticipantChatAllowed ||
            liveMeeting
              .updateParticipantChatPermission;

          if (
            typeof method !==
            "function"
          ) {
            throw new Error(
              "Participant chat permission is unavailable."
            );
          }

          await method(nextValue);
        }
      );
    },
    [
      runHostControlAction,
      setParticipantChatAllowed,
      liveMeeting,
    ]
  );

  const handleMuteAllParticipants =
  useCallback(async () => {
    await runHostControlAction(
      "mute-all",
      async () => {
        const method =
          muteAllParticipants ||
          liveMeeting.muteAll;

        if (
          typeof method !==
          "function"
        ) {
          throw new Error(
            "Mute-all control is unavailable."
          );
        }

        await method();
      }
    );
  }, [
    runHostControlAction,
    muteAllParticipants,
    liveMeeting,
  ]);

  const handleStopAllParticipantVideos =
  useCallback(async () => {
    await runHostControlAction(
      "stop-all-videos",
      async () => {
        const method =
          stopAllParticipantVideos ||
          liveMeeting.stopAllVideos;

        if (
          typeof method !==
          "function"
        ) {
          throw new Error(
            "Stop-all-videos control is unavailable."
          );
        }

        await method();
      }
    );
  }, [
    runHostControlAction,
    stopAllParticipantVideos,
    liveMeeting,
  ]);

  const handleOpenWaitingRoomFromHostControls =
  useCallback(() => {
    setHostControlsPanelOpen(false);
    setParticipantsPanelOpen(false);
    setChatPanelOpen(false);
    setDeviceSettingsPanelOpen(false);
    setDeviceMenuOpen(false);

    setWaitingRoomPanelOpen(true);
  }, []);

  const handleEndMeetingForEveryone =
  useCallback(async () => {
    await runHostControlAction(
      "end-meeting",
      async () => {
        const method =
          endMeeting ||
          liveMeeting.endMeetingForAll ||
          liveMeeting.closeMeeting;

        if (
          typeof method !==
          "function"
        ) {
          throw new Error(
            "End-meeting control is unavailable."
          );
        }

        await method({
          meetingId:
            meeting?._id ||
            meeting?.id,
        });

        setHostControlsPanelOpen(
          false
        );
      }
    );
  }, [
    runHostControlAction,
    endMeeting,
    liveMeeting,
    meeting,
  ]);


  /* ========================================================
     LEAVE MEETING
  ======================================================== */

  const handleLeaveMeeting =
    useCallback(async () => {
      if (
        actionBusy ||
        leaving
      ) {
        return;
      }

      setChatPanelOpen(false);
setParticipantsPanelOpen(false);
setDeviceSettingsPanelOpen(false);
setWaitingRoomPanelOpen(false);
setHostControlsPanelOpen(false);
setDeviceMenuOpen(false);

setActionBusy("leave");

      try {
        if (
          screenShare
            .screenSharing
        ) {
          await screenShare
            .stopScreenShare({
              notifyServer: true,
              restoreCamera:
                false,
              reason:
                "meeting-left",
            });
        }

        localMedia.stopLocalMedia?.();
        localMedia.stopLocalStream?.();

        if (
          typeof leaveMeeting ===
          "function"
        ) {
          await leaveMeeting();
        }

        if (
          typeof onLeave ===
          "function"
        ) {
          onLeave({
            meeting,
          });
        }
      } catch (error) {
        setActionError(error);
      } finally {
        setActionBusy("");
      }
    }, [
      actionBusy,
      leaving,
      screenShare,
      localMedia,
      leaveMeeting,
      onLeave,
      meeting,
    ]);

  /* ========================================================
     DEVICE SELECTION
  ======================================================== */

  const handleMicrophoneChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          await mediaDevices
            .selectAudioInput(
              deviceId
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

  const handleCameraChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          await mediaDevices
            .selectVideoInput(
              deviceId
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

  const handleSpeakerChange =
    useCallback(
      async (event) => {
        const deviceId =
          event.target.value;

        try {
          setActionError(null);

          const mediaElements =
            Array.from(
              document.querySelectorAll(
                ".participant-video__video"
              )
            );

          await mediaDevices
            .selectAudioOutput(
              deviceId,
              mediaElements
            );
        } catch (error) {
          setActionError(error);
        }
      },
      [mediaDevices]
    );

const handleSelectMicrophone =
  useCallback(
    async (deviceId) => {
      if (!deviceId) {
        return;
      }

      try {
        setActionError(null);

        await mediaDevices.selectAudioInput(
          deviceId
        );
      } catch (error) {
        setActionError(error);
        throw error;
      }
    },
    [mediaDevices]
  );

const handleSelectCamera =
  useCallback(
    async (deviceId) => {
      if (!deviceId) {
        return;
      }

      try {
        setActionError(null);

        await mediaDevices.selectVideoInput(
          deviceId
        );
      } catch (error) {
        setActionError(error);
        throw error;
      }
    },
    [mediaDevices]
  );

const handleSelectSpeaker =
  useCallback(
    async (deviceId) => {
      if (!deviceId) {
        return;
      }

      try {
        setActionError(null);

        const mediaElements =
          Array.from(
            document.querySelectorAll(
              ".participant-video__video"
            )
          );

        await mediaDevices.selectAudioOutput(
          deviceId,
          mediaElements
        );
      } catch (error) {
        setActionError(error);
        throw error;
      }
    },
    [mediaDevices]
  );

  const handleRefreshDevices =
  useCallback(async () => {
    try {
      setActionError(null);

      await mediaDevices.refreshDevices({
        askForPermission: true,
      });
    } catch (error) {
      setActionError(error);
      throw error;
    }
  }, [mediaDevices]);

  const handleApplyDeviceSettings =
  useCallback(
    async ({
      microphoneId,
      cameraId,
      speakerId,
    }) => {
      setActionBusy(
        "device-settings"
      );

      setActionError(null);

      try {
        if (
          microphoneId &&
          microphoneId !==
            selectedMicrophoneId
        ) {
          await handleSelectMicrophone(
            microphoneId
          );
        }

        if (
          cameraId &&
          cameraId !==
            selectedCameraId
        ) {
          await handleSelectCamera(
            cameraId
          );
        }

        if (
          speakerId &&
          speakerId !==
            selectedSpeakerId
        ) {
          await handleSelectSpeaker(
            speakerId
          );
        }

        setDeviceSettingsPanelOpen(
          false
        );
      } catch (error) {
        setActionError(error);
        throw error;
      } finally {
        setActionBusy("");
      }
    },
    [
      selectedMicrophoneId,
      selectedCameraId,
      selectedSpeakerId,
      handleSelectMicrophone,
      handleSelectCamera,
      handleSelectSpeaker,
    ]
  );




  /* ========================================================
     KEYBOARD CONTROLS
  ======================================================== */

  useEffect(() => {
    const handleKeyDown =
      (event) => {
        const target =
          event.target;

        const tagName =
          target?.tagName
            ?.toLowerCase();

        const isTyping =
          tagName === "input" ||
          tagName ===
            "textarea" ||
          tagName ===
            "select" ||
          target?.isContentEditable;

        if (isTyping) {
          return;
        }

        if (
          event.key.toLowerCase() ===
          "m"
        ) {
          event.preventDefault();

          handleToggleMicrophone();
        }

        if (
          event.key.toLowerCase() ===
          "v"
        ) {
          event.preventDefault();

          handleToggleCamera();
        }
      };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    handleToggleMicrophone,
    handleToggleCamera,
  ]);

  /* ========================================================
     PAGE TITLE
  ======================================================== */

  useEffect(() => {
    const previousTitle =
      document.title;

    document.title =
      `${meetingTitle} | JVP Connect`;

    return () => {
      document.title =
        previousTitle;
    };
  }, [meetingTitle]);

  /* ========================================================
     GRID PROPS
  ======================================================== */

  const videoGridProps =
    useMemo(
      () => ({
        participants,

        remoteStreams:
          currentRemoteStreams,

        localStream,

        localScreenStream:
          screenShare
            .screenStream,

        currentUser,

        localDisplayName:
          displayName,

        localProfilePhoto:
          profilePhoto,

        localMicrophoneEnabled:
          microphoneEnabled,

        localCameraEnabled:
          cameraEnabled,

        localScreenSharing:
          screenSharing,

        audioOutputDeviceId:
          mediaDevices
            .selectedAudioOutputId,

        layout,

        prioritizeScreenShare:
          true,

        allowPinning: true,

        showParticipantCount:
          false,
      }),
      [
        participants,
        currentRemoteStreams,
        localStream,
        screenShare
          .screenStream,
        currentUser,
        displayName,
        profilePhoto,
        microphoneEnabled,
        cameraEnabled,
        screenSharing,
        mediaDevices
          .selectedAudioOutputId,
        layout,
      ]
    );

  /* ========================================================
     ROOT CLASSES
  ======================================================== */

  const rootClassName = [
    "live-meeting-room",

    controlsVisible
      ? ""
      : "live-meeting-room--controls-hidden",

    screenSharing
      ? "live-meeting-room--sharing-screen"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* ========================================================
     WAITING ROOM
  ======================================================== */

  if (
    waiting ||
    (
      joined &&
      !admitted
    )
  ) {
    return (
      <section
        className={`${rootClassName} live-meeting-room--waiting`}
      >
        <div className="live-meeting-room__waiting-card">
          <div className="live-meeting-room__waiting-icon">
            ⏳
          </div>

          <span className="live-meeting-room__eyebrow">
            {meetingTitle}
          </span>

          <h2>
            Waiting for the host
          </h2>

          <p>
            You have joined the
            waiting room. The host
            will admit you when the
            meeting is ready.
          </p>

          <div className="live-meeting-room__waiting-user">
            {profilePhoto ? (
              <img
                src={
                  profilePhoto
                }
                alt={
                  displayName
                }
              />
            ) : (
              <span>
                {displayName
                  .charAt(0)
                  .toUpperCase()}
              </span>
            )}

            <div>
              <strong>
                {displayName}
              </strong>

              <small>
                Waiting for admission
              </small>
            </div>
          </div>

          <button
            type="button"
            className="live-meeting-room__waiting-leave"
            onClick={
              handleLeaveMeeting
            }
            disabled={
              leaving ||
              actionBusy ===
                "leave"
            }
          >
            Leave waiting room
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     ROOM ENDED
  ======================================================== */

  if (roomEnded) {
    return (
      <section
        className={`${rootClassName} live-meeting-room--ended`}
      >
        <div className="live-meeting-room__ended-card">
          <div className="live-meeting-room__ended-icon">
            ✓
          </div>

          <h2>
            Meeting ended
          </h2>

          <p>
            The host has ended{" "}
            <strong>
              {meetingTitle}
            </strong>
            .
          </p>

          <button
            type="button"
            onClick={
              handleLeaveMeeting
            }
          >
            Return to meeting details
          </button>
        </div>
      </section>
    );
  }

  /* ========================================================
     MAIN ROOM
  ======================================================== */

  return (
    <section
      className={
        rootClassName
      }
      onMouseMove={() =>
        setControlsVisible(
          true
        )
      }
      aria-label={`${meetingTitle} live room`}
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="live-meeting-room__header">
        <div className="live-meeting-room__meeting-info">
          <div className="live-meeting-room__meeting-logo">
            JVP
          </div>

          <div className="live-meeting-room__meeting-heading">
            <h1>
              {meetingTitle}
            </h1>

            <div className="live-meeting-room__meeting-meta">
              <span
                className={[
                  "live-meeting-room__connection",

                  isConnected
                    ? "live-meeting-room__connection--online"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span />

                {connectionLabel}
              </span>

              <span>
                {formatMeetingDuration(
                  elapsedSeconds
                )}
              </span>

              <span>
                {participantCount}{" "}
                {participantCount === 1
                  ? "participant"
                  : "participants"}
              </span>
            </div>
          </div>
        </div>

        <div className="live-meeting-room__header-actions">
          {canManageParticipants && (
  <button
    type="button"
    className="live-meeting-room__header-button"
    onClick={
      handleToggleWaitingRoomPanel
    }
  >
    Waiting room

    {waitingParticipants.length >
      0 && (
      <span>
        {
          waitingParticipants.length
        }
      </span>
    )}
  </button>
)}

{canManageParticipants && (
  <button
    type="button"
    className="live-meeting-room__header-button"
    onClick={
      handleToggleHostControlsPanel
    }
  >
    Host controls
  </button>
)}
          <div
            className="live-meeting-room__layout-switcher"
            aria-label="Video layout"
          >
            <button
              type="button"
              className={
                layout === "grid"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout("grid")
              }
              title="Grid layout"
            >
              ⠿
            </button>

            <button
              type="button"
              className={
                layout ===
                "spotlight"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout(
                  "spotlight"
                )
              }
              title="Spotlight layout"
            >
              ▣
            </button>

            <button
              type="button"
              className={
                layout === "auto"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setLayout("auto")
              }
              title="Automatic layout"
            >
              A
            </button>
          </div>

          <button
            type="button"
            className="live-meeting-room__header-button"
            onClick={() =>
              setControlsVisible(
                (
                  current
                ) => !current
              )
            }
          >
            {controlsVisible
              ? "Hide controls"
              : "Show controls"}
          </button>
        </div>
      </header>

      {/* ====================================================
          ERROR NOTICE
      ==================================================== */}

      {visibleErrorMessage && (
        <div
          className="live-meeting-room__error"
          role="alert"
        >
          <span>
            {visibleErrorMessage}
          </span>

          <button
            type="button"
            onClick={
              clearErrors
            }
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* ====================================================
          VIDEO AREA
      ==================================================== */}

      <main className="live-meeting-room__stage">
        <VideoGrid
          {...videoGridProps}
        />

        {!isConnected && (
          <div className="live-meeting-room__connection-overlay">
            <div className="live-meeting-room__connection-spinner" />

            <strong>
  {socketStatus ===
  "connecting"
    ? "Connecting"
    : joining
      ? "Joining meeting"
      : "Reconnecting"}
</strong>

            <span>
              Please wait while the
              connection is restored.
            </span>
          </div>
        )}
      </main>

{participantsPanelOpen && (
  <ParticipantsPanel
    participants={
      participants
    }
    currentUser={
      currentUser
    }
    canManage={
      canManageParticipants
    }
    isOpen={
      participantsPanelOpen
    }
    onClose={() =>
      setParticipantsPanelOpen(false)
    }
  />
)}

{chatPanelOpen && (
  <MeetingChatPanel
    messages={
      chatMessages
    }
    currentUser={
      currentUser
    }
    isOpen={
      chatPanelOpen
    }
   canSend={true}

    canDeleteMessages={
      canManageParticipants
    }
    sending={
      chatSending
    }
    onClose={() =>
      setChatPanelOpen(false)
    }
    onSendMessage={
      handleSendChatMessage
    }
    onDeleteMessage={
      handleDeleteChatMessage
    }
  />
)}

{deviceSettingsPanelOpen && (
  <DeviceSettingsPanel
    isOpen={
      deviceSettingsPanelOpen
    }
    microphoneDevices={
      microphoneDevices
    }
    cameraDevices={
      cameraDevices
    }
    speakerDevices={
      speakerDevices
    }
    selectedMicrophoneId={
      selectedMicrophoneId
    }
    selectedCameraId={
      selectedCameraId
    }
    selectedSpeakerId={
      selectedSpeakerId
    }
    microphoneEnabled={
      microphoneEnabled
    }
    cameraEnabled={
      cameraEnabled
    }
    microphoneLevel={
      localMedia.microphoneLevel ||
      localMedia.audioLevel ||
      0
    }
    localStream={
      localStream
    }
    loading={
      mediaDevices.loadingDevices ||
      false
    }
    refreshing={
      mediaDevices.loadingDevices ||
      false
    }
    applying={
      actionBusy ===
      "device-settings"
    }
    microphoneSupported={
      localMedia.microphoneSupported ??
      true
    }
    cameraSupported={
      localMedia.cameraSupported ??
      true
    }
    speakerSelectionSupported={
      mediaDevices
        .audioOutputSelectionSupported ??
      false
    }
    onClose={() =>
      setDeviceSettingsPanelOpen(
        false
      )
    }
    onRefreshDevices={
      handleRefreshDevices
    }
    onSelectMicrophone={
      handleSelectMicrophone
    }
    onSelectCamera={
      handleSelectCamera
    }
    onSelectSpeaker={
      handleSelectSpeaker
    }
    onApply={
      handleApplyDeviceSettings
    }
  />
)}

{waitingRoomPanelOpen &&
  canManageParticipants && (
    <WaitingRoomPanel
      isOpen={
        waitingRoomPanelOpen
      }
      participants={
        waitingParticipants
      }
      canManage={
        canManageParticipants
      }
      processingParticipantId={
        processingWaitingParticipantId
      }
      bulkProcessing={
        waitingRoomBulkProcessing
      }
      onClose={() =>
        setWaitingRoomPanelOpen(
          false
        )
      }
      onAdmitParticipant={
        handleAdmitWaitingParticipant
      }
      onRejectParticipant={
        handleRejectWaitingParticipant
      }
      onAdmitSelected={
        handleAdmitSelectedWaitingParticipants
      }
      onRejectSelected={
        handleRejectSelectedWaitingParticipants
      }
      onAdmitAll={
        handleAdmitAllWaitingParticipants
      }
    />
  )}

{hostControlsPanelOpen &&
  canManageParticipants && (
    <HostControlsPanel
      isOpen={
        hostControlsPanelOpen
      }
      participantCount={
        participantCount
      }
      waitingParticipantCount={
        waitingParticipants.length
      }
      meetingLocked={
        meetingLocked
      }
      waitingRoomEnabled={
        waitingRoomEnabled
      }
      participantUnmuteAllowed={
        participantUnmuteAllowed
      }
      participantVideoAllowed={
        participantVideoAllowed
      }
      participantScreenShareAllowed={
        participantScreenShareAllowed
      }
      participantChatAllowed={
        participantChatAllowed
      }
      canManage={
        canManageParticipants
      }
      busyAction={
        hostControlBusyAction
      }
      error={
        hostControlError
      }
      onClose={() => {
        setHostControlsPanelOpen(
          false
        );

        setHostControlError(null);
      }}
      onToggleMeetingLock={
        handleToggleMeetingLock
      }
      onToggleWaitingRoom={
        handleToggleWaitingRoom
      }
      onToggleParticipantUnmute={
        handleToggleParticipantUnmute
      }
      onToggleParticipantVideo={
        handleToggleParticipantVideo
      }
      onToggleParticipantScreenShare={
        handleToggleParticipantScreenShare
      }
      onToggleParticipantChat={
        handleToggleParticipantChat
      }
      onMuteAll={
        handleMuteAllParticipants
      }
      onStopAllVideos={
        handleStopAllParticipantVideos
      }
      onOpenWaitingRoom={
        handleOpenWaitingRoomFromHostControls
      }
      onEndMeeting={
        handleEndMeetingForEveryone
      }
    />
  )}


      {/* ====================================================
          DEVICE MENU
      ==================================================== */}

      {deviceMenuOpen && (
        <div className="live-meeting-room__device-menu">
          <div className="live-meeting-room__device-menu-header">
            <div>
              <strong>
                Audio and video
              </strong>

              <small>
                Select the devices
                used in this meeting.
              </small>
            </div>

            <button
              type="button"
              onClick={() =>
                setDeviceMenuOpen(
                  false
                )
              }
              aria-label="Close device settings"
            >
              ×
            </button>
          </div>

          <label className="live-meeting-room__device-field">
            <span>
              Microphone
            </span>

            <select
              value={
                mediaDevices
                  .selectedAudioInputId
              }
              onChange={
                handleMicrophoneChange
              }
              disabled={
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .microphones
                .length === 0 && (
                <option value="">
                  No microphone found
                </option>
              )}

              {mediaDevices
                .microphones
                .map(
                  (
                    microphone
                  ) => (
                    <option
                      key={
                        microphone.deviceId
                      }
                      value={
                        microphone.deviceId
                      }
                    >
                      {
                        microphone.label
                      }
                    </option>
                  )
                )}
            </select>
          </label>

          <label className="live-meeting-room__device-field">
            <span>
              Camera
            </span>

            <select
              value={
                mediaDevices
                  .selectedVideoInputId
              }
              onChange={
                handleCameraChange
              }
              disabled={
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .cameras.length ===
                0 && (
                <option value="">
                  No camera found
                </option>
              )}

              {mediaDevices
                .cameras.map(
                  (camera) => (
                    <option
                      key={
                        camera.deviceId
                      }
                      value={
                        camera.deviceId
                      }
                    >
                      {camera.label}
                    </option>
                  )
                )}
            </select>
          </label>

          <label className="live-meeting-room__device-field">
            <span>
              Speaker
            </span>

            <select
              value={
                mediaDevices
                  .selectedAudioOutputId
              }
              onChange={
                handleSpeakerChange
              }
              disabled={
                !mediaDevices
                  .audioOutputSelectionSupported ||
                mediaDevices.deviceBusy
              }
            >
              {mediaDevices
                .speakers.length ===
                0 && (
                <option value="">
                  Default speaker
                </option>
              )}

              {mediaDevices
                .speakers.map(
                  (speaker) => (
                    <option
                      key={
                        speaker.deviceId
                      }
                      value={
                        speaker.deviceId
                      }
                    >
                      {speaker.label}
                    </option>
                  )
                )}
            </select>
          </label>

          <button
            type="button"
            className="live-meeting-room__refresh-devices"
            onClick={() =>
              mediaDevices
                .refreshDevices({
                  askForPermission:
                    true,
                })
                .catch(
                  setActionError
                )
            }
            disabled={
              mediaDevices.deviceBusy
            }
          >
            {mediaDevices
              .loadingDevices
              ? "Refreshing..."
              : "Refresh devices"}
          </button>
        </div>
      )}

      {/* ====================================================
          TOOLBAR
      ==================================================== */}

      <MeetingToolbar
  microphoneEnabled={
    microphoneEnabled
  }
  cameraEnabled={
    cameraEnabled
  }
  screenSharing={
    screenSharing
  }
  raisedHand={
    raisedHand
  }
  participantCount={
    participantCount
  }
  unreadChatCount={0}
  connected={
    isConnected
  }
  microphoneBusy={
    actionBusy ===
    "microphone"
  }
  cameraBusy={
    actionBusy ===
    "camera"
  }
  screenShareBusy={
    screenShare
      .screenShareBusy ||
    actionBusy ===
      "screen-share"
  }
  raisedHandBusy={
    actionBusy ===
    "raised-hand"
  }
  leaving={
    leaving ||
    actionBusy ===
      "leave"
  }
  microphoneAllowed
  cameraAllowed
  screenShareAllowed
  chatAllowed
  deviceMenuOpen={
    deviceMenuOpen
  }
  controlsVisible={
    controlsVisible
  }
  onToggleMicrophone={
    handleToggleMicrophone
  }
  onToggleCamera={
    handleToggleCamera
  }
  onToggleScreenShare={
    handleToggleScreenShare
  }
  onToggleRaisedHand={
    handleToggleRaisedHand
  }
onToggleDeviceMenu={() => {
  setDeviceMenuOpen(
    (current) => !current
  );

  setParticipantsPanelOpen(false);
  setChatPanelOpen(false);
  setDeviceSettingsPanelOpen(false);
  setWaitingRoomPanelOpen(false);
  setHostControlsPanelOpen(false);
}}

 onOpenParticipants={
  handleToggleParticipantsPanel
}
  onOpenChat={
    handleToggleChatPanel
  }
 onOpenMore={
  handleToggleDeviceSettingsPanel
}
  onLeave={
    handleLeaveMeeting
  }
/>
    </section>
  );
};

export {
  getUserDisplayName,
  getUserProfilePhoto,
  getMeetingTitle,
  formatMeetingDuration,
  getStatusLabel,
};

export default LiveMeetingRoom;