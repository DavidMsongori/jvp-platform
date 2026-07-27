import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  sendWebRTCAnswer,
  sendWebRTCIceCandidate,
  sendWebRTCOffer,
  sendWebRTCRenegotiation,
} from "../../../services/socket.service";

import {
  useLiveMeeting,
} from "../LiveMeetingContext";

import rtcConfiguration from "../config/webrtc.config";

/* ==========================================================
   DEFAULT WEBRTC CONFIGURATION
========================================================== */

const DEFAULT_RTC_CONFIGURATION =
  rtcConfiguration;

/* ==========================================================
   HELPERS
========================================================== */

const normalizeSocketId = (
  value
) => {
  return String(value || "").trim();
};

const isPeerConnectionUsable = (
  peerConnection
) => {
  return Boolean(
    peerConnection &&
      peerConnection.signalingState !==
        "closed" &&
      peerConnection.connectionState !==
        "closed"
  );
};

const safelyClosePeerConnection = (
  peerConnection
) => {
  if (!peerConnection) {
    return;
  }

  try {
    peerConnection.onicecandidate =
      null;

    peerConnection.ontrack = null;

    peerConnection.onconnectionstatechange =
      null;

    peerConnection.oniceconnectionstatechange =
      null;

    peerConnection.onsignalingstatechange =
      null;

    peerConnection.onnegotiationneeded =
      null;

    peerConnection.close();
  } catch {
    // The peer may already be closed.
  }
};

const createRemoteMediaStream = () => {
  return new MediaStream();
};

const getStreamTracksByKind = (
  stream,
  kind
) => {
  if (!stream) {
    return [];
  }

  if (kind === "audio") {
    return stream.getAudioTracks();
  }

  if (kind === "video") {
    return stream.getVideoTracks();
  }

  return stream.getTracks();
};

const getSenderForKind = (
  peerConnection,
  kind
) => {
  return (
    peerConnection
      ?.getSenders?.()
      .find(
        (sender) =>
          sender.track?.kind ===
          kind
      ) || null
  );
};

const getTransceiverForKind = (
  peerConnection,
  kind
) => {
  return (
    peerConnection
      ?.getTransceivers?.()
      .find(
        (transceiver) =>
          transceiver.receiver?.track
            ?.kind === kind ||
          transceiver.sender?.track
            ?.kind === kind
      ) || null
  );
};

const normalizeWebRTCError = (
  error
) => {
  const name = error?.name || "";

  switch (name) {
    case "InvalidStateError":
      return {
        code: "WEBRTC_INVALID_STATE",
        message:
          "The WebRTC connection is not in a valid state for this action.",
      };

    case "OperationError":
      return {
        code: "WEBRTC_OPERATION_FAILED",
        message:
          "The browser could not complete the WebRTC operation.",
      };

    case "TypeError":
      return {
        code: "WEBRTC_INVALID_SIGNAL",
        message:
          "The received WebRTC signal is invalid.",
      };

    default:
      return {
        code: "WEBRTC_ERROR",
        message:
          error?.message ||
          "An unexpected WebRTC error occurred.",
      };
  }
};

/* ==========================================================
   HOOK
========================================================== */

const useWebRTC = ({
  rtcConfiguration =
    DEFAULT_RTC_CONFIGURATION,

  autoCreateOffers = true,

  politeStrategy = "socket-id",

  onRemoteStreamAdded,

  onRemoteStreamRemoved,

  onPeerStateChanged,

  onError,
} = {}) => {
  const {
    meetingId,

    socket,

    socketId,

    isJoined,
    isAdmitted,

    connectedParticipants,

    localStreamRef,
    screenStreamRef,

    peerConnectionsRef,
    remoteStreamsRef,
    pendingIceCandidatesRef,

    setPeerConnection,
    removePeerConnection,

    setRemoteStream,
    getRemoteStream,

    subscribeToWebRTC,
  } = useLiveMeeting();

  const [
    peerStates,
    setPeerStates,
  ] = useState({});

  const [
    webRTCError,
    setWebRTCError,
  ] = useState(null);

  const [
    remoteStreamVersion,
    setRemoteStreamVersion,
  ] = useState(0);

  const [
    peerVersion,
    setPeerVersion,
  ] = useState(0);

  const makingOfferRef =
    useRef(new Map());

  const ignoreOfferRef =
    useRef(new Map());

  const settingRemoteAnswerRef =
    useRef(new Map());

  const negotiationLocksRef =
    useRef(new Map());

  const peerMetadataRef =
    useRef(new Map());

  const mountedRef =
    useRef(true);

  /* ========================================================
     ERROR HANDLING
  ======================================================== */

  const handleWebRTCError =
    useCallback(
      (
        error,
        metadata = {}
      ) => {
        const normalized =
          normalizeWebRTCError(
            error
          );

        const payload = {
          ...normalized,
          originalError: error,
          metadata,
        };

        if (mountedRef.current) {
          setWebRTCError(payload);
        }

        if (
          typeof onError ===
          "function"
        ) {
          onError(payload);
        }

        return payload;
      },
      [onError]
    );

  const clearWebRTCError =
    useCallback(() => {
      setWebRTCError(null);
    }, []);

  /* ========================================================
     PEER STATE
  ======================================================== */

  const updatePeerState =
    useCallback(
      (
        targetSocketId,
        updates
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        if (
          !normalizedTargetSocketId
        ) {
          return;
        }

        setPeerStates(
          (currentStates) => {
            const nextState = {
              ...(currentStates[
                normalizedTargetSocketId
              ] || {}),
              ...updates,
              socketId:
                normalizedTargetSocketId,
              updatedAt:
                new Date().toISOString(),
            };

            if (
              typeof onPeerStateChanged ===
              "function"
            ) {
              onPeerStateChanged(
                normalizedTargetSocketId,
                nextState
              );
            }

            return {
              ...currentStates,
              [normalizedTargetSocketId]:
                nextState,
            };
          }
        );
      },
      [onPeerStateChanged]
    );

  const removePeerState =
    useCallback(
      (targetSocketId) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        setPeerStates(
          (currentStates) => {
            const nextStates = {
              ...currentStates,
            };

            delete nextStates[
              normalizedTargetSocketId
            ];

            return nextStates;
          }
        );
      },
      []
    );

  /* ========================================================
     POLITE PEER DETERMINATION

     Perfect negotiation prevents offer collisions. One peer is
     polite and accepts a competing offer while the impolite peer
     may ignore it.
  ======================================================== */

  const isPolitePeer =
    useCallback(
      (targetSocketId) => {
        if (
          politeStrategy ===
          "always"
        ) {
          return true;
        }

        if (
          politeStrategy ===
          "never"
        ) {
          return false;
        }

        const localSocketId =
          normalizeSocketId(
            socketId || socket?.id
          );

        const remoteSocketId =
          normalizeSocketId(
            targetSocketId
          );

        if (
          !localSocketId ||
          !remoteSocketId
        ) {
          return true;
        }

        return (
          localSocketId.localeCompare(
            remoteSocketId
          ) > 0
        );
      },
      [
        politeStrategy,
        socketId,
        socket,
      ]
    );

  /* ========================================================
     PENDING ICE CANDIDATES
  ======================================================== */

  const queueIceCandidate =
    useCallback(
      (
        targetSocketId,
        candidate
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const existingCandidates =
          pendingIceCandidatesRef.current.get(
            normalizedTargetSocketId
          ) || [];

        existingCandidates.push(
          candidate
        );

        pendingIceCandidatesRef.current.set(
          normalizedTargetSocketId,
          existingCandidates
        );
      },
      [pendingIceCandidatesRef]
    );

  const flushPendingIceCandidates =
    useCallback(
      async (
        targetSocketId,
        peerConnection
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const queuedCandidates =
          pendingIceCandidatesRef.current.get(
            normalizedTargetSocketId
          ) || [];

        if (
          !peerConnection
            ?.remoteDescription
        ) {
          return;
        }

        for (
          const candidate of
          queuedCandidates
        ) {
          try {
            await peerConnection.addIceCandidate(
              candidate
            );
          } catch (error) {
            handleWebRTCError(
              error,
              {
                action:
                  "flush-ice-candidate",

                targetSocketId:
                  normalizedTargetSocketId,
              }
            );
          }
        }

        pendingIceCandidatesRef.current.delete(
          normalizedTargetSocketId
        );
      },
      [
        pendingIceCandidatesRef,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     LOCAL TRACKS
  ======================================================== */

  const getCurrentOutgoingTracks =
    useCallback(() => {
      const localStream =
        localStreamRef.current;

      const screenStream =
        screenStreamRef.current;

      const audioTrack =
        localStream
          ?.getAudioTracks?.()[0] ||
        null;

      const screenVideoTrack =
        screenStream
          ?.getVideoTracks?.()[0] ||
        null;

      const cameraVideoTrack =
        localStream
          ?.getVideoTracks?.()[0] ||
        null;

      return {
        audioTrack,

        videoTrack:
          screenVideoTrack ||
          cameraVideoTrack,

        cameraVideoTrack,

        screenVideoTrack,

        audioStream:
          audioTrack
            ? localStream
            : null,

        videoStream:
          screenVideoTrack
            ? screenStream
            : cameraVideoTrack
              ? localStream
              : null,
      };
    }, [
      localStreamRef,
      screenStreamRef,
    ]);

  const addOrReplaceTrack =
    useCallback(
      async ({
        peerConnection,
        kind,
        track,
        stream,
      }) => {
        if (
          !peerConnection ||
          !isPeerConnectionUsable(
            peerConnection
          )
        ) {
          return;
        }

        const sender =
          getSenderForKind(
            peerConnection,
            kind
          );

        if (sender) {
          if (
            sender.track !== track
          ) {
            await sender.replaceTrack(
              track || null
            );
          }

          return;
        }

        if (track) {
          peerConnection.addTrack(
            track,
            stream ||
              new MediaStream([
                track,
              ])
          );

          return;
        }

        const transceiver =
          getTransceiverForKind(
            peerConnection,
            kind
          );

        if (!transceiver) {
          peerConnection.addTransceiver(
            kind,
            {
              direction:
                "recvonly",
            }
          );
        }
      },
      []
    );

  const synchronizePeerTracks =
    useCallback(
      async (
        peerConnection
      ) => {
        const {
          audioTrack,
          videoTrack,
          audioStream,
          videoStream,
        } =
          getCurrentOutgoingTracks();

        await addOrReplaceTrack({
          peerConnection,
          kind: "audio",
          track: audioTrack,
          stream: audioStream,
        });

        await addOrReplaceTrack({
          peerConnection,
          kind: "video",
          track: videoTrack,
          stream: videoStream,
        });
      },
      [
        addOrReplaceTrack,
        getCurrentOutgoingTracks,
      ]
    );

  const synchronizeAllPeerTracks =
    useCallback(async () => {
      const peerEntries =
        Array.from(
          peerConnectionsRef.current
            .entries()
        );

      await Promise.allSettled(
        peerEntries.map(
          async ([
            targetSocketId,
            peerConnection,
          ]) => {
            if (
              !isPeerConnectionUsable(
                peerConnection
              )
            ) {
              return;
            }

            try {
              await synchronizePeerTracks(
                peerConnection
              );

              updatePeerState(
                targetSocketId,
                {
                  tracksSynchronized:
                    true,
                }
              );
            } catch (error) {
              handleWebRTCError(
                error,
                {
                  action:
                    "synchronize-peer-tracks",

                  targetSocketId,
                }
              );
            }
          }
        )
      );
    }, [
      peerConnectionsRef,
      synchronizePeerTracks,
      updatePeerState,
      handleWebRTCError,
    ]);

  const replaceTrackForAllPeers =
    useCallback(
      async (
        kind,
        replacementTrack,
        stream = null
      ) => {
        const peerEntries =
          Array.from(
            peerConnectionsRef.current
              .entries()
          );

        await Promise.allSettled(
          peerEntries.map(
            async ([
              targetSocketId,
              peerConnection,
            ]) => {
              if (
                !isPeerConnectionUsable(
                  peerConnection
                )
              ) {
                return;
              }

              const sender =
                getSenderForKind(
                  peerConnection,
                  kind
                );

              try {
                if (sender) {
                  await sender.replaceTrack(
                    replacementTrack ||
                      null
                  );
                } else if (
                  replacementTrack
                ) {
                  peerConnection.addTrack(
                    replacementTrack,
                    stream ||
                      new MediaStream([
                        replacementTrack,
                      ])
                  );
                }

                updatePeerState(
                  targetSocketId,
                  {
                    [`${kind}TrackAvailable`]:
                      Boolean(
                        replacementTrack
                      ),
                  }
                );
              } catch (error) {
                handleWebRTCError(
                  error,
                  {
                    action:
                      "replace-track",

                    targetSocketId,
                    kind,
                  }
                );
              }
            }
          )
        );
      },
      [
        peerConnectionsRef,
        updatePeerState,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     REMOTE STREAM
  ======================================================== */

  const ensureRemoteStream =
    useCallback(
      (targetSocketId) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        let remoteStream =
          getRemoteStream(
            normalizedTargetSocketId
          );

        if (!remoteStream) {
          remoteStream =
            createRemoteMediaStream();

          setRemoteStream(
            normalizedTargetSocketId,
            remoteStream
          );

          setRemoteStreamVersion(
            (version) =>
              version + 1
          );

          if (
            typeof onRemoteStreamAdded ===
            "function"
          ) {
            onRemoteStreamAdded(
              normalizedTargetSocketId,
              remoteStream
            );
          }
        }

        return remoteStream;
      },
      [
        getRemoteStream,
        setRemoteStream,
        onRemoteStreamAdded,
      ]
    );

  const removeRemoteStream =
    useCallback(
      (targetSocketId) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const remoteStream =
          remoteStreamsRef.current.get(
            normalizedTargetSocketId
          );

        if (remoteStream) {
          remoteStream
            .getTracks()
            .forEach((track) => {
              try {
                remoteStream.removeTrack(
                  track
                );
              } catch {
                // Track may already be removed.
              }
            });
        }

        remoteStreamsRef.current.delete(
          normalizedTargetSocketId
        );

        setRemoteStreamVersion(
          (version) =>
            version + 1
        );

        if (
          typeof onRemoteStreamRemoved ===
          "function"
        ) {
          onRemoteStreamRemoved(
            normalizedTargetSocketId
          );
        }
      },
      [
        remoteStreamsRef,
        onRemoteStreamRemoved,
      ]
    );

  /* ========================================================
     SEND OFFER
  ======================================================== */

  const createAndSendOffer =
    useCallback(
      async (
        targetSocketId,
        {
          iceRestart = false,
          metadata = null,
        } = {}
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        if (
          !normalizedTargetSocketId
        ) {
          throw new Error(
            "Target socket ID is required."
          );
        }

        const peerConnection =
          peerConnectionsRef.current.get(
            normalizedTargetSocketId
          );

        if (
          !isPeerConnectionUsable(
            peerConnection
          )
        ) {
          throw new Error(
            "Peer connection is not available."
          );
        }

        if (
          negotiationLocksRef.current.get(
            normalizedTargetSocketId
          )
        ) {
          return null;
        }

        negotiationLocksRef.current.set(
          normalizedTargetSocketId,
          true
        );

        makingOfferRef.current.set(
          normalizedTargetSocketId,
          true
        );

        try {
          await synchronizePeerTracks(
            peerConnection
          );

          const offer =
            await peerConnection.createOffer(
              {
                iceRestart,
              }
            );

          if (
            peerConnection.signalingState ===
            "closed"
          ) {
            return null;
          }

          await peerConnection.setLocalDescription(
            offer
          );

          await sendWebRTCOffer(
            meetingId,
            normalizedTargetSocketId,
            peerConnection.localDescription,
            {
              iceRestart,
              ...metadata,
            }
          );

          updatePeerState(
            normalizedTargetSocketId,
            {
              offerSent: true,

              signalingState:
                peerConnection
                  .signalingState,
            }
          );

          return offer;
        } catch (error) {
          handleWebRTCError(
            error,
            {
              action:
                "create-offer",

              targetSocketId:
                normalizedTargetSocketId,
            }
          );

          throw error;
        } finally {
          makingOfferRef.current.set(
            normalizedTargetSocketId,
            false
          );

          negotiationLocksRef.current.delete(
            normalizedTargetSocketId
          );
        }
      },
      [
        peerConnectionsRef,
        meetingId,
        synchronizePeerTracks,
        updatePeerState,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     PEER CONNECTION CREATION
  ======================================================== */

  const createPeerConnection =
    useCallback(
      async (
        targetSocketId,
        metadata = {}
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        if (
          !normalizedTargetSocketId
        ) {
          throw new Error(
            "Target socket ID is required."
          );
        }

        const existingPeer =
          peerConnectionsRef.current.get(
            normalizedTargetSocketId
          );

        if (
          isPeerConnectionUsable(
            existingPeer
          )
        ) {
          return existingPeer;
        }

        if (existingPeer) {
          safelyClosePeerConnection(
            existingPeer
          );

          peerConnectionsRef.current.delete(
            normalizedTargetSocketId
          );
        }

        const peerConnection =
          new RTCPeerConnection(
            rtcConfiguration
          );

        peerMetadataRef.current.set(
          normalizedTargetSocketId,
          metadata
        );

        setPeerConnection(
          normalizedTargetSocketId,
          peerConnection
        );

        await synchronizePeerTracks(
          peerConnection
        );

        peerConnection.onicecandidate =
          (event) => {
            if (!event.candidate) {
              return;
            }

            sendWebRTCIceCandidate(
              meetingId,
              normalizedTargetSocketId,
              event.candidate
            ).catch((error) => {
              handleWebRTCError(
                error,
                {
                  action:
                    "send-ice-candidate",

                  targetSocketId:
                    normalizedTargetSocketId,
                }
              );
            });
          };

        peerConnection.ontrack =
          (event) => {
            const remoteStream =
              ensureRemoteStream(
                normalizedTargetSocketId
              );

            const incomingStreams =
              event.streams || [];

            if (
              incomingStreams.length >
              0
            ) {
              incomingStreams.forEach(
                (incomingStream) => {
                  incomingStream
                    .getTracks()
                    .forEach(
                      (
                        incomingTrack
                      ) => {
                        const existingTrack =
                          remoteStream
                            .getTracks()
                            .find(
                              (
                                track
                              ) =>
                                track.id ===
                                incomingTrack.id
                            );

                        if (
                          !existingTrack
                        ) {
                          remoteStream.addTrack(
                            incomingTrack
                          );
                        }
                      }
                    );
                }
              );
            } else if (
              event.track
            ) {
              const existingTrack =
                remoteStream
                  .getTracks()
                  .find(
                    (track) =>
                      track.id ===
                      event.track.id
                  );

              if (!existingTrack) {
                remoteStream.addTrack(
                  event.track
                );
              }
            }

            if (event.track) {
              event.track.onended =
                () => {
                  try {
                    remoteStream.removeTrack(
                      event.track
                    );
                  } catch {
                    // Track may already be removed.
                  }

                  setRemoteStreamVersion(
                    (version) =>
                      version + 1
                  );
                };
            }

            setRemoteStreamVersion(
              (version) =>
                version + 1
            );

            updatePeerState(
              normalizedTargetSocketId,
              {
                remoteTrackReceived:
                  true,

                remoteAudioTracks:
                  remoteStream
                    .getAudioTracks()
                    .length,

                remoteVideoTracks:
                  remoteStream
                    .getVideoTracks()
                    .length,
              }
            );
          };

        peerConnection.onconnectionstatechange =
          () => {
            const connectionState =
              peerConnection
                .connectionState;

            updatePeerState(
              normalizedTargetSocketId,
              {
                connectionState,
              }
            );

            if (
              [
                "failed",
                "closed",
              ].includes(
                connectionState
              )
            ) {
              removeRemoteStream(
                normalizedTargetSocketId
              );
            }

            if (
              connectionState ===
              "failed"
            ) {
              createAndSendOffer(
                normalizedTargetSocketId,
                {
                  iceRestart: true,

                  metadata: {
                    reason:
                      "connection-failed",
                  },
                }
              ).catch(() => {});
            }
          };

        peerConnection.oniceconnectionstatechange =
          () => {
            const iceConnectionState =
              peerConnection
                .iceConnectionState;

            updatePeerState(
              normalizedTargetSocketId,
              {
                iceConnectionState,
              }
            );

            if (
              iceConnectionState ===
              "failed"
            ) {
              peerConnection.restartIce?.();
            }
          };

        peerConnection.onsignalingstatechange =
          () => {
            updatePeerState(
              normalizedTargetSocketId,
              {
                signalingState:
                  peerConnection
                    .signalingState,
              }
            );
          };

        peerConnection.onnegotiationneeded =
          async () => {
            if (
              !autoCreateOffers
            ) {
              return;
            }

            try {
              await createAndSendOffer(
                normalizedTargetSocketId,
                {
                  metadata: {
                    reason:
                      "negotiation-needed",
                  },
                }
              );
            } catch {
              // Error already handled.
            }
          };

        updatePeerState(
          normalizedTargetSocketId,
          {
            created: true,

            connectionState:
              peerConnection
                .connectionState,

            iceConnectionState:
              peerConnection
                .iceConnectionState,

            signalingState:
              peerConnection
                .signalingState,

            metadata,
          }
        );

        setPeerVersion(
          (version) =>
            version + 1
        );

        return peerConnection;
      },
      [
        peerConnectionsRef,
        rtcConfiguration,
        setPeerConnection,
        synchronizePeerTracks,
        meetingId,
        ensureRemoteStream,
        removeRemoteStream,
        updatePeerState,
        createAndSendOffer,
        autoCreateOffers,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     HANDLE OFFER
  ======================================================== */

  const handleIncomingOffer =
    useCallback(
      async (payload) => {
        const senderSocketId =
          normalizeSocketId(
            payload?.senderSocketId
          );

        const offer =
          payload?.signal;

        if (
          !senderSocketId ||
          !offer
        ) {
          return;
        }

        try {
          const peerConnection =
            await createPeerConnection(
              senderSocketId,
              {
                participant:
                  payload?.sender ||
                  null,
              }
            );

          const polite =
            isPolitePeer(
              senderSocketId
            );

          const readyForOffer =
            !makingOfferRef.current.get(
              senderSocketId
            ) &&
            (
              peerConnection
                .signalingState ===
                "stable" ||
              settingRemoteAnswerRef.current.get(
                senderSocketId
              )
            );

          const offerCollision =
            !readyForOffer;

          ignoreOfferRef.current.set(
            senderSocketId,
            !polite &&
              offerCollision
          );

          if (
            ignoreOfferRef.current.get(
              senderSocketId
            )
          ) {
            updatePeerState(
              senderSocketId,
              {
                offerIgnored: true,
              }
            );

            return;
          }

          if (
            offerCollision &&
            polite
          ) {
            await Promise.all([
              peerConnection.setLocalDescription(
                {
                  type: "rollback",
                }
              ),

              peerConnection.setRemoteDescription(
                offer
              ),
            ]);
          } else {
            await peerConnection.setRemoteDescription(
              offer
            );
          }

          await flushPendingIceCandidates(
            senderSocketId,
            peerConnection
          );

          await synchronizePeerTracks(
            peerConnection
          );

          const answer =
            await peerConnection.createAnswer();

          await peerConnection.setLocalDescription(
            answer
          );

          await sendWebRTCAnswer(
            meetingId,
            senderSocketId,
            peerConnection.localDescription
          );

          updatePeerState(
            senderSocketId,
            {
              offerReceived: true,
              answerSent: true,
              offerIgnored: false,
            }
          );
        } catch (error) {
          handleWebRTCError(
            error,
            {
              action:
                "handle-offer",

              senderSocketId,
            }
          );
        }
      },
      [
        createPeerConnection,
        isPolitePeer,
        updatePeerState,
        flushPendingIceCandidates,
        synchronizePeerTracks,
        meetingId,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     HANDLE ANSWER
  ======================================================== */

  const handleIncomingAnswer =
    useCallback(
      async (payload) => {
        const senderSocketId =
          normalizeSocketId(
            payload?.senderSocketId
          );

        const answer =
          payload?.signal;

        if (
          !senderSocketId ||
          !answer
        ) {
          return;
        }

        const peerConnection =
          peerConnectionsRef.current.get(
            senderSocketId
          );

        if (
          !isPeerConnectionUsable(
            peerConnection
          )
        ) {
          return;
        }

        try {
          settingRemoteAnswerRef.current.set(
            senderSocketId,
            true
          );

          await peerConnection.setRemoteDescription(
            answer
          );

          await flushPendingIceCandidates(
            senderSocketId,
            peerConnection
          );

          updatePeerState(
            senderSocketId,
            {
              answerReceived:
                true,
            }
          );
        } catch (error) {
          handleWebRTCError(
            error,
            {
              action:
                "handle-answer",

              senderSocketId,
            }
          );
        } finally {
          settingRemoteAnswerRef.current.set(
            senderSocketId,
            false
          );
        }
      },
      [
        peerConnectionsRef,
        flushPendingIceCandidates,
        updatePeerState,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     HANDLE ICE CANDIDATE
  ======================================================== */

  const handleIncomingIceCandidate =
    useCallback(
      async (payload) => {
        const senderSocketId =
          normalizeSocketId(
            payload?.senderSocketId
          );

        const candidate =
          payload?.signal;

        if (
          !senderSocketId ||
          !candidate
        ) {
          return;
        }

        try {
          const peerConnection =
            await createPeerConnection(
              senderSocketId,
              {
                participant:
                  payload?.sender ||
                  null,
              }
            );

          if (
            ignoreOfferRef.current.get(
              senderSocketId
            )
          ) {
            return;
          }

          if (
            !peerConnection
              .remoteDescription
          ) {
            queueIceCandidate(
              senderSocketId,
              candidate
            );

            return;
          }

          await peerConnection.addIceCandidate(
            candidate
          );

          updatePeerState(
            senderSocketId,
            {
              iceCandidateReceived:
                true,
            }
          );
        } catch (error) {
          if (
            !ignoreOfferRef.current.get(
              senderSocketId
            )
          ) {
            handleWebRTCError(
              error,
              {
                action:
                  "handle-ice-candidate",

                senderSocketId,
              }
            );
          }
        }
      },
      [
        createPeerConnection,
        queueIceCandidate,
        updatePeerState,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     HANDLE RENEGOTIATION
  ======================================================== */

  const handleIncomingRenegotiation =
    useCallback(
      async (payload) => {
        const senderSocketId =
          normalizeSocketId(
            payload?.senderSocketId
          );

        if (!senderSocketId) {
          return;
        }

        try {
          const peerConnection =
            await createPeerConnection(
              senderSocketId,
              {
                participant:
                  payload?.sender ||
                  null,
              }
            );

          await synchronizePeerTracks(
            peerConnection
          );

          const signal =
            payload?.signal;

          if (
            signal?.type ===
            "offer"
          ) {
            await handleIncomingOffer(
              payload
            );

            return;
          }

          if (
            autoCreateOffers
          ) {
            await createAndSendOffer(
              senderSocketId,
              {
                metadata: {
                  reason:
                    "remote-renegotiation-request",
                },
              }
            );
          }
        } catch (error) {
          handleWebRTCError(
            error,
            {
              action:
                "handle-renegotiation",

              senderSocketId,
            }
          );
        }
      },
      [
        createPeerConnection,
        synchronizePeerTracks,
        handleIncomingOffer,
        autoCreateOffers,
        createAndSendOffer,
        handleWebRTCError,
      ]
    );

  /* ========================================================
     REQUEST RENEGOTIATION
  ======================================================== */

  const requestRenegotiation =
    useCallback(
      async (
        targetSocketId,
        metadata = null
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        if (
          !normalizedTargetSocketId
        ) {
          throw new Error(
            "Target socket ID is required."
          );
        }

        return sendWebRTCRenegotiation(
          meetingId,
          normalizedTargetSocketId,
          null,
          metadata
        );
      },
      [meetingId]
    );

  const requestRenegotiationForAllPeers =
    useCallback(
      async (
        metadata = null
      ) => {
        const targetSocketIds =
          Array.from(
            peerConnectionsRef.current
              .keys()
          );

        return Promise.allSettled(
          targetSocketIds.map(
            (targetSocketId) =>
              requestRenegotiation(
                targetSocketId,
                metadata
              )
          )
        );
      },
      [
        peerConnectionsRef,
        requestRenegotiation,
      ]
    );

  /* ========================================================
     CONNECT TO PEER
  ======================================================== */

  const connectToPeer =
    useCallback(
      async (
        targetSocketId,
        metadata = {}
      ) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const localSocketId =
          normalizeSocketId(
            socketId ||
              socket?.id
          );

        if (
          !normalizedTargetSocketId ||
          normalizedTargetSocketId ===
            localSocketId
        ) {
          return null;
        }

        const peerConnection =
          await createPeerConnection(
            normalizedTargetSocketId,
            metadata
          );

        if (
          autoCreateOffers &&
          peerConnection
            .signalingState ===
            "stable"
        ) {
          await createAndSendOffer(
            normalizedTargetSocketId,
            {
              metadata: {
                reason:
                  "peer-connected",
              },
            }
          );
        }

        return peerConnection;
      },
      [
        socketId,
        socket,
        createPeerConnection,
        autoCreateOffers,
        createAndSendOffer,
      ]
    );

  /* ========================================================
     REMOVE PEER
  ======================================================== */

  const disconnectPeer =
    useCallback(
      (targetSocketId) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const peerConnection =
          peerConnectionsRef.current.get(
            normalizedTargetSocketId
          );

        safelyClosePeerConnection(
          peerConnection
        );

        peerConnectionsRef.current.delete(
          normalizedTargetSocketId
        );

        removeRemoteStream(
          normalizedTargetSocketId
        );

        pendingIceCandidatesRef.current.delete(
          normalizedTargetSocketId
        );

        makingOfferRef.current.delete(
          normalizedTargetSocketId
        );

        ignoreOfferRef.current.delete(
          normalizedTargetSocketId
        );

        settingRemoteAnswerRef.current.delete(
          normalizedTargetSocketId
        );

        negotiationLocksRef.current.delete(
          normalizedTargetSocketId
        );

        peerMetadataRef.current.delete(
          normalizedTargetSocketId
        );

        removePeerState(
          normalizedTargetSocketId
        );

        removePeerConnection(
          normalizedTargetSocketId
        );

        setPeerVersion(
          (version) =>
            version + 1
        );
      },
      [
        peerConnectionsRef,
        pendingIceCandidatesRef,
        removeRemoteStream,
        removePeerState,
        removePeerConnection,
      ]
    );

  const disconnectAllPeers =
    useCallback(() => {
      const socketIds =
        Array.from(
          peerConnectionsRef.current
            .keys()
        );

      socketIds.forEach(
        disconnectPeer
      );

      setPeerStates({});
    }, [
      peerConnectionsRef,
      disconnectPeer,
    ]);

  /* ========================================================
     PEER LOOKUP
  ======================================================== */

  const getPeerConnection =
    useCallback(
      (targetSocketId) => {
        return (
          peerConnectionsRef.current.get(
            normalizeSocketId(
              targetSocketId
            )
          ) || null
        );
      },
      [peerConnectionsRef]
    );

  const getPeerRemoteStream =
    useCallback(
      (targetSocketId) => {
        return (
          remoteStreamsRef.current.get(
            normalizeSocketId(
              targetSocketId
            )
          ) || null
        );
      },
      [remoteStreamsRef]
    );

  /* ========================================================
     ICE RESTART
  ======================================================== */

  const restartPeerIce =
    useCallback(
      async (targetSocketId) => {
        const normalizedTargetSocketId =
          normalizeSocketId(
            targetSocketId
          );

        const peerConnection =
          peerConnectionsRef.current.get(
            normalizedTargetSocketId
          );

        if (
          !isPeerConnectionUsable(
            peerConnection
          )
        ) {
          throw new Error(
            "Peer connection is not available."
          );
        }

        peerConnection.restartIce?.();

        return createAndSendOffer(
          normalizedTargetSocketId,
          {
            iceRestart: true,

            metadata: {
              reason:
                "manual-ice-restart",
            },
          }
        );
      },
      [
        peerConnectionsRef,
        createAndSendOffer,
      ]
    );

  /* ========================================================
     PEER STATISTICS
  ======================================================== */

  const getPeerStats =
    useCallback(
      async (targetSocketId) => {
        const peerConnection =
          getPeerConnection(
            targetSocketId
          );

        if (
          !isPeerConnectionUsable(
            peerConnection
          )
        ) {
          return null;
        }

        const report =
          await peerConnection.getStats();

        const stats = {
          inboundAudio: [],
          inboundVideo: [],
          outboundAudio: [],
          outboundVideo: [],
          candidatePairs: [],
          codecs: [],
        };

        report.forEach(
          (entry) => {
            if (
              entry.type ===
              "inbound-rtp"
            ) {
              if (
                entry.kind ===
                  "audio" ||
                entry.mediaType ===
                  "audio"
              ) {
                stats.inboundAudio.push(
                  entry
                );
              }

              if (
                entry.kind ===
                  "video" ||
                entry.mediaType ===
                  "video"
              ) {
                stats.inboundVideo.push(
                  entry
                );
              }
            }

            if (
              entry.type ===
              "outbound-rtp"
            ) {
              if (
                entry.kind ===
                  "audio" ||
                entry.mediaType ===
                  "audio"
              ) {
                stats.outboundAudio.push(
                  entry
                );
              }

              if (
                entry.kind ===
                  "video" ||
                entry.mediaType ===
                  "video"
              ) {
                stats.outboundVideo.push(
                  entry
                );
              }
            }

            if (
              entry.type ===
              "candidate-pair"
            ) {
              stats.candidatePairs.push(
                entry
              );
            }

            if (
              entry.type ===
              "codec"
            ) {
              stats.codecs.push(
                entry
              );
            }
          }
        );

        return stats;
      },
      [getPeerConnection]
    );

  /* ========================================================
     SOCKET EVENT SUBSCRIPTIONS
  ======================================================== */

  useEffect(() => {
    const unsubscribe =
      subscribeToWebRTC({
        onOffer:
          handleIncomingOffer,

        onAnswer:
          handleIncomingAnswer,

        onIceCandidate:
          handleIncomingIceCandidate,

        onRenegotiation:
          handleIncomingRenegotiation,
      });

    return unsubscribe;
  }, [
    subscribeToWebRTC,
    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
    handleIncomingRenegotiation,
  ]);

  /* ========================================================
     AUTOMATIC PEER CREATION

     The backend participant presence only exposes user IDs and
     connection counts. WebRTC signalling uses socket IDs, so this
     hook primarily creates peers when participant join events or
     incoming WebRTC signals provide a socket ID.
  ======================================================== */

  useEffect(() => {
    if (
      !isJoined ||
      !isAdmitted
    ) {
      return;
    }

    const localSocketId =
      normalizeSocketId(
        socketId || socket?.id
      );

    connectedParticipants.forEach(
      (participant) => {
        const socketIds =
          Array.from(
            new Set([
              ...(participant.socketIds ||
                []),
              participant.socketId,
            ].filter(Boolean))
          );

        socketIds.forEach(
          (targetSocketId) => {
            if (
              targetSocketId ===
              localSocketId
            ) {
              return;
            }

            if (
              peerConnectionsRef.current.has(
                targetSocketId
              )
            ) {
              return;
            }

            connectToPeer(
              targetSocketId,
              {
                participant,
              }
            ).catch(() => {
              // Error already handled.
            });
          }
        );
      }
    );
  }, [
    isJoined,
    isAdmitted,
    connectedParticipants,
    socketId,
    socket,
    peerConnectionsRef,
    connectToPeer,
  ]);

  /* ========================================================
     LOCAL TRACK SYNCHRONIZATION
  ======================================================== */

  useEffect(() => {
    if (
      !isJoined ||
      !isAdmitted
    ) {
      return;
    }

    synchronizeAllPeerTracks().catch(
      (error) => {
        handleWebRTCError(
          error,
          {
            action:
              "automatic-track-sync",
          }
        );
      }
    );
  }, [
    isJoined,
    isAdmitted,
    localStreamRef.current,
    screenStreamRef.current,
    synchronizeAllPeerTracks,
    handleWebRTCError,
  ]);

  /* ========================================================
     CLEAN CLOSED PEERS
  ======================================================== */

  useEffect(() => {
    const intervalId =
      window.setInterval(() => {
        const peerEntries =
          Array.from(
            peerConnectionsRef.current
              .entries()
          );

        peerEntries.forEach(
          ([
            targetSocketId,
            peerConnection,
          ]) => {
            if (
              [
                "closed",
                "failed",
              ].includes(
                peerConnection
                  .connectionState
              )
            ) {
              disconnectPeer(
                targetSocketId
              );
            }
          }
        );
      }, 15000);

    return () => {
      window.clearInterval(
        intervalId
      );
    };
  }, [
    peerConnectionsRef,
    disconnectPeer,
  ]);

  /* ========================================================
     UNMOUNT CLEANUP
  ======================================================== */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current =
        false;

      disconnectAllPeers();
    };
  }, [disconnectAllPeers]);

  /* ========================================================
     DERIVED DATA
  ======================================================== */

  const peers =
    useMemo(() => {
      return Array.from(
        peerConnectionsRef.current
          .entries()
      ).map(
        ([
          targetSocketId,
          peerConnection,
        ]) => ({
          socketId:
            targetSocketId,

          peerConnection,

          remoteStream:
            remoteStreamsRef.current.get(
              targetSocketId
            ) || null,

          state:
            peerStates[
              targetSocketId
            ] || null,

          metadata:
            peerMetadataRef.current.get(
              targetSocketId
            ) || null,
        })
      );
    }, [
      peerConnectionsRef,
      remoteStreamsRef,
      peerStates,
      peerVersion,
      remoteStreamVersion,
    ]);

  const connectedPeers =
    useMemo(() => {
      return peers.filter(
        ({ peerConnection }) =>
          peerConnection
            .connectionState ===
            "connected"
      );
    }, [peers]);

  const connectingPeers =
    useMemo(() => {
      return peers.filter(
        ({ peerConnection }) =>
          [
            "new",
            "connecting",
          ].includes(
            peerConnection
              .connectionState
          )
      );
    }, [peers]);

  const failedPeers =
    useMemo(() => {
      return peers.filter(
        ({ peerConnection }) =>
          [
            "failed",
            "disconnected",
          ].includes(
            peerConnection
              .connectionState
          )
      );
    }, [peers]);

  /* ========================================================
     RETURN
  ======================================================== */

  return {
    rtcConfiguration,

    webRTCError,
    clearWebRTCError,

    peers,
    peerStates,

    connectedPeers,
    connectingPeers,
    failedPeers,

    peerCount:
      peers.length,

    connectedPeerCount:
      connectedPeers.length,

    remoteStreamVersion,

    createPeerConnection,
    connectToPeer,
    disconnectPeer,
    disconnectAllPeers,

    createAndSendOffer,

    requestRenegotiation,
    requestRenegotiationForAllPeers,

    synchronizePeerTracks,
    synchronizeAllPeerTracks,

    replaceTrackForAllPeers,

    getPeerConnection,
    getPeerRemoteStream,

    restartPeerIce,
    getPeerStats,

    handleIncomingOffer,
    handleIncomingAnswer,
    handleIncomingIceCandidate,
    handleIncomingRenegotiation,
  };
};

export {
  DEFAULT_RTC_CONFIGURATION,
  normalizeWebRTCError,
  isPeerConnectionUsable,
  safelyClosePeerConnection,
  getSenderForKind,
  getTransceiverForKind,
  getStreamTracksByKind,
};

export default useWebRTC;