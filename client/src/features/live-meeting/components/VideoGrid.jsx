import {
  useCallback,
  useMemo,
  useState,
} from "react";

import LocalVideoPreview from "./LocalVideoPreview";
import ParticipantVideo from "./ParticipantVideo";

import "./VideoGrid.css";

/* ==========================================================
   HELPERS
========================================================== */

const getParticipantId = (
  participant
) => {
  return String(
    participant?.socketId ||
      participant?.userId ||
      participant?._id ||
      participant?.id ||
      ""
  );
};

const getParticipantSocketId = (
  participant
) => {
  return String(
    participant?.socketId ||
      participant?.connectionId ||
      ""
  );
};

const resolveRemoteStream = ({
  participant,
  remoteStreams,
  getRemoteStream,
}) => {
  if (
    typeof getRemoteStream ===
    "function"
  ) {
    return (
      getRemoteStream(
        participant
      ) || null
    );
  }

  if (!remoteStreams) {
    return null;
  }

  const participantId =
    getParticipantId(
      participant
    );

  const socketId =
    getParticipantSocketId(
      participant
    );

  if (
    remoteStreams instanceof Map
  ) {
    return (
      remoteStreams.get(
        socketId
      ) ||
      remoteStreams.get(
        participantId
      ) ||
      null
    );
  }

  if (
    typeof remoteStreams ===
    "object"
  ) {
    return (
      remoteStreams[
        socketId
      ] ||
      remoteStreams[
        participantId
      ] ||
      null
    );
  }

  return null;
};

const participantIsScreenSharing = (
  participant
) => {
  return Boolean(
    participant?.screenSharing ??
      participant?.media
        ?.screenSharing
  );
};

const participantHasRaisedHand = (
  participant
) => {
  return Boolean(
    participant?.raisedHand ??
      participant?.handRaised
  );
};

const participantIsSpeaking = (
  participant
) => {
  return Boolean(
    participant?.isSpeaking ??
      participant?.speaking
  );
};

const participantIsConnected = (
  participant
) => {
  return (
    participant?.isConnected ??
    participant?.connected ??
    true
  );
};

/* ==========================================================
   GRID COLUMN CALCULATION
========================================================== */

const getGridSizeClass = (
  totalTiles
) => {
  if (totalTiles <= 1) {
    return "video-grid--size-1";
  }

  if (totalTiles === 2) {
    return "video-grid--size-2";
  }

  if (totalTiles <= 4) {
    return "video-grid--size-4";
  }

  if (totalTiles <= 6) {
    return "video-grid--size-6";
  }

  if (totalTiles <= 9) {
    return "video-grid--size-9";
  }

  if (totalTiles <= 12) {
    return "video-grid--size-12";
  }

  return "video-grid--size-many";
};

/* ==========================================================
   COMPONENT
========================================================== */

const VideoGrid = ({
  participants = [],

  remoteStreams = null,

  getRemoteStream = null,

  localStream = null,

  localScreenStream = null,

  currentUser = null,

  localDisplayName = "",

  localProfilePhoto = "",

  localMicrophoneEnabled = true,

  localCameraEnabled = true,

  localScreenSharing = false,

  includeLocalParticipant = true,

  audioOutputDeviceId = "",

  layout = "auto",

  pinnedParticipantId = "",

  activeSpeakerId = "",

  prioritizeScreenShare = true,

  allowPinning = true,

  showEmptyState = true,

  showParticipantCount = false,

  compact = false,

  className = "",

  onParticipantClick,

  onParticipantDoubleClick,

  onPinnedParticipantChange,

  onVideoReady,

  onVideoError,
}) => {
  const [
    internalPinnedId,
    setInternalPinnedId,
  ] = useState("");

  const resolvedPinnedId =
    String(
      pinnedParticipantId ||
        internalPinnedId ||
        ""
    );

  /* ========================================================
     NORMALIZED LOCAL USER
  ======================================================== */

  const resolvedLocalName =
    localDisplayName ||
    currentUser?.displayName ||
    currentUser?.fullName ||
    currentUser?.name ||
    [
      currentUser?.firstName,
      currentUser?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "You";

  const resolvedLocalPhoto =
    localProfilePhoto ||
    currentUser?.profilePhoto ||
    currentUser?.avatar ||
    currentUser?.photo ||
    "";

  /* ========================================================
     FILTER PARTICIPANTS

     Remove invalid entries and remove the current user if the
     backend participant list also contains the local user.
  ======================================================== */

  const remoteParticipants =
    useMemo(() => {
      const currentUserId =
        String(
          currentUser?._id ||
            currentUser?.id ||
            currentUser?.userId ||
            ""
        );

      const seenIds =
        new Set();

      return (
        Array.isArray(
          participants
        )
          ? participants
          : []
      ).filter(
        (participant) => {
          const participantId =
            getParticipantId(
              participant
            );

          if (!participantId) {
            return false;
          }

          const participantUserId =
            String(
              participant?.userId ||
                participant?.user?._id ||
                participant?.user?.id ||
                participant?._id ||
                ""
            );

          if (
            currentUserId &&
            participantUserId ===
              currentUserId
          ) {
            return false;
          }

          if (
            seenIds.has(
              participantId
            )
          ) {
            return false;
          }

          seenIds.add(
            participantId
          );

          return true;
        }
      );
    }, [
      participants,
      currentUser,
    ]);

  /* ========================================================
     FEATURED PARTICIPANT

     Priority:
     1. Manually pinned participant
     2. Screen-sharing participant
     3. Active speaker
  ======================================================== */

  const featuredParticipant =
    useMemo(() => {
      if (
        resolvedPinnedId
      ) {
        const pinned =
          remoteParticipants.find(
            (participant) =>
              getParticipantId(
                participant
              ) ===
              resolvedPinnedId
          );

        if (pinned) {
          return pinned;
        }
      }

      if (
        prioritizeScreenShare
      ) {
        const screenSharer =
          remoteParticipants.find(
            participantIsScreenSharing
          );

        if (screenSharer) {
          return screenSharer;
        }
      }

      if (
        activeSpeakerId
      ) {
        const activeSpeaker =
          remoteParticipants.find(
            (participant) =>
              getParticipantId(
                participant
              ) ===
              String(
                activeSpeakerId
              )
          );

        if (activeSpeaker) {
          return activeSpeaker;
        }
      }

      return null;
    }, [
      resolvedPinnedId,
      prioritizeScreenShare,
      activeSpeakerId,
      remoteParticipants,
    ]);

  /* ========================================================
     LAYOUT MODE
  ======================================================== */

  const shouldUseSpotlight =
    layout === "spotlight" ||
    (
      layout === "auto" &&
      Boolean(
        featuredParticipant
      )
    );

  const resolvedLayout =
    shouldUseSpotlight
      ? "spotlight"
      : "grid";

  const sidebarParticipants =
    useMemo(() => {
      if (
        !featuredParticipant
      ) {
        return remoteParticipants;
      }

      const featuredId =
        getParticipantId(
          featuredParticipant
        );

      return remoteParticipants.filter(
        (participant) =>
          getParticipantId(
            participant
          ) !== featuredId
      );
    }, [
      featuredParticipant,
      remoteParticipants,
    ]);

  const totalGridTiles =
    remoteParticipants.length +
    (
      includeLocalParticipant
        ? 1
        : 0
    );

  const gridSizeClass =
    getGridSizeClass(
      totalGridTiles
    );

  /* ========================================================
     PINNING
  ======================================================== */

  const handleParticipantPin =
    useCallback(
      (
        participant
      ) => {
        if (!allowPinning) {
          return;
        }

        const participantId =
          getParticipantId(
            participant
          );

        if (!participantId) {
          return;
        }

        const nextPinnedId =
          resolvedPinnedId ===
          participantId
            ? ""
            : participantId;

        setInternalPinnedId(
          nextPinnedId
        );

        if (
          typeof onPinnedParticipantChange ===
          "function"
        ) {
          onPinnedParticipantChange({
            participant,
            participantId:
              nextPinnedId,
            pinned:
              Boolean(
                nextPinnedId
              ),
          });
        }
      },
      [
        allowPinning,
        resolvedPinnedId,
        onPinnedParticipantChange,
      ]
    );

  const handleParticipantClick =
    useCallback(
      (
        participant,
        event
      ) => {
        if (
          typeof onParticipantClick ===
          "function"
        ) {
          onParticipantClick({
            participant,
            event,
          });
        }
      },
      [onParticipantClick]
    );

  const handleParticipantDoubleClick =
    useCallback(
      (
        participant,
        event
      ) => {
        if (
          typeof onParticipantDoubleClick ===
          "function"
        ) {
          onParticipantDoubleClick({
            participant,
            event,
          });
        }

        handleParticipantPin(
          participant
        );
      },
      [
        onParticipantDoubleClick,
        handleParticipantPin,
      ]
    );

  /* ========================================================
     PARTICIPANT TILE RENDERER
  ======================================================== */

  const renderParticipant =
    useCallback(
      (
        participant,
        {
          featured = false,
          compactTile = false,
        } = {}
      ) => {
        const participantId =
          getParticipantId(
            participant
          );

        const stream =
          resolveRemoteStream({
            participant,
            remoteStreams,
            getRemoteStream,
          });

        const isPinned =
          participantId ===
          resolvedPinnedId;

        const isSpeaking =
          participantIsSpeaking(
            participant
          ) ||
          participantId ===
            String(
              activeSpeakerId ||
                ""
            );

        return (
          <ParticipantVideo
            key={
              participantId
            }
            participant={
              participant
            }
            stream={stream}
            microphoneEnabled={
              participant
                ?.microphoneEnabled ??
              participant?.media
                ?.microphone ??
              true
            }
            cameraEnabled={
              participant
                ?.cameraEnabled ??
              participant?.media
                ?.camera ??
              true
            }
            screenSharing={
              participantIsScreenSharing(
                participant
              )
            }
            raisedHand={
              participantHasRaisedHand(
                participant
              )
            }
            isSpeaking={
              isSpeaking
            }
            isHost={
              participant?.role ===
                "host" ||
              participant?.meetingRole ===
                "host"
            }
            isCoHost={
              participant?.role ===
                "co_host" ||
              participant?.role ===
                "co-host" ||
              participant?.meetingRole ===
                "co_host"
            }
            isManager={
              participant?.isManager ||
              participant?.role ===
                "manager"
            }
            isConnected={
              participantIsConnected(
                participant
              )
            }
            audioOutputDeviceId={
              audioOutputDeviceId
            }
            compact={
              compact ||
              compactTile
            }
            featured={
              featured
            }
            pinned={
              isPinned
            }
            onClick={(
              event
            ) =>
              handleParticipantClick(
                participant,
                event
              )
            }
            onDoubleClick={(
              event
            ) =>
              handleParticipantDoubleClick(
                participant,
                event
              )
            }
            onVideoReady={
              onVideoReady
            }
            onVideoError={
              onVideoError
            }
          />
        );
      },
      [
        remoteStreams,
        getRemoteStream,
        resolvedPinnedId,
        activeSpeakerId,
        audioOutputDeviceId,
        compact,
        handleParticipantClick,
        handleParticipantDoubleClick,
        onVideoReady,
        onVideoError,
      ]
    );

  /* ========================================================
     ROOT CLASSES
  ======================================================== */

  const rootClassName = [
    "video-grid",

    `video-grid--${resolvedLayout}`,

    compact
      ? "video-grid--compact"
      : "",

    className,
  ]
    .filter(Boolean)
    .join(" ");

  /* ========================================================
     EMPTY STATE
  ======================================================== */

  const hasAnyTile =
    includeLocalParticipant ||
    remoteParticipants.length >
      0;

  if (
    !hasAnyTile &&
    showEmptyState
  ) {
    return (
      <section
        className={`${rootClassName} video-grid--empty`}
      >
        <div className="video-grid__empty-state">
          <span
            className="video-grid__empty-icon"
            aria-hidden="true"
          >
            ◉
          </span>

          <h3>
            No participants yet
          </h3>

          <p>
            Other participants
            will appear here when
            they join the meeting.
          </p>
        </div>
      </section>
    );
  }

  /* ========================================================
     SPOTLIGHT LAYOUT
  ======================================================== */

  if (
    resolvedLayout ===
      "spotlight" &&
    featuredParticipant
  ) {
    return (
      <section
        className={
          rootClassName
        }
        aria-label="Meeting video participants"
      >
        {showParticipantCount && (
          <div className="video-grid__count">
            {totalGridTiles}{" "}
            {totalGridTiles === 1
              ? "participant"
              : "participants"}
          </div>
        )}

        <div className="video-grid__spotlight">
          <div className="video-grid__featured">
            {renderParticipant(
              featuredParticipant,
              {
                featured: true,
              }
            )}
          </div>

          <aside
            className="video-grid__filmstrip"
            aria-label="Other participants"
          >
            {includeLocalParticipant && (
              <div className="video-grid__filmstrip-tile">
                <LocalVideoPreview
                  stream={
                    localStream
                  }
                  screenStream={
                    localScreenStream
                  }
                  displayName={
                    resolvedLocalName
                  }
                  profilePhoto={
                    resolvedLocalPhoto
                  }
                  cameraEnabled={
                    localCameraEnabled
                  }
                  microphoneEnabled={
                    localMicrophoneEnabled
                  }
                  screenSharing={
                    localScreenSharing
                  }
                  compact
                  onVideoReady={
                    onVideoReady
                  }
                  onVideoError={
                    onVideoError
                  }
                />
              </div>
            )}

            {sidebarParticipants.map(
              (participant) => (
                <div
                  key={
                    getParticipantId(
                      participant
                    )
                  }
                  className="video-grid__filmstrip-tile"
                >
                  {renderParticipant(
                    participant,
                    {
                      compactTile:
                        true,
                    }
                  )}
                </div>
              )
            )}
          </aside>
        </div>
      </section>
    );
  }

  /* ========================================================
     STANDARD GRID LAYOUT
  ======================================================== */

  return (
    <section
      className={`${rootClassName} ${gridSizeClass}`}
      aria-label="Meeting video participants"
    >
      {showParticipantCount && (
        <div className="video-grid__count">
          {totalGridTiles}{" "}
          {totalGridTiles === 1
            ? "participant"
            : "participants"}
        </div>
      )}

      <div className="video-grid__tiles">
        {includeLocalParticipant && (
          <div className="video-grid__tile video-grid__tile--local">
            <LocalVideoPreview
              stream={
                localStream
              }
              screenStream={
                localScreenStream
              }
              displayName={
                resolvedLocalName
              }
              profilePhoto={
                resolvedLocalPhoto
              }
              cameraEnabled={
                localCameraEnabled
              }
              microphoneEnabled={
                localMicrophoneEnabled
              }
              screenSharing={
                localScreenSharing
              }
              compact={
                compact
              }
              onVideoReady={
                onVideoReady
              }
              onVideoError={
                onVideoError
              }
            />
          </div>
        )}

        {remoteParticipants.map(
          (participant) => (
            <div
              key={
                getParticipantId(
                  participant
                )
              }
              className="video-grid__tile"
            >
              {renderParticipant(
                participant
              )}
            </div>
          )
        )}
      </div>
    </section>
  );
};

export {
  getParticipantId,
  getParticipantSocketId,
  resolveRemoteStream,
  participantIsScreenSharing,
  getGridSizeClass,
};

export default VideoGrid;