import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Check,
  CheckCircle2,
  CircleX,
  Clock3,
  Keyboard,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  RotateCcw,
  ScanLine,
  Search,
  ShieldCheck,
  Ticket,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import {
  useSummit,
} from "../../../context/SummitContext";

import "./SummitCheckIn.css";

/* ==========================================
   HELPERS
========================================== */

const cleanText = (value) => {
  return String(value || "").trim();
};

const formatDateTime = (value) => {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const formatStatus = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const getParticipantName = (
  registration
) => {
  if (!registration) {
    return "Unnamed participant";
  }

  const directName =
    registration?.fullName ||
    registration?.participantName ||
    registration?.name;

  if (typeof directName === "string") {
    return directName;
  }

  const participant =
    registration?.participant;

  if (
    participant &&
    typeof participant === "object"
  ) {
    return (
      participant?.fullName ||
      participant?.name ||
      [
        participant?.firstName,
        participant?.middleName,
        participant?.lastName,
      ]
        .filter(Boolean)
        .join(" ") ||
      "Unnamed participant"
    );
  }

  return (
    [
      registration?.firstName,
      registration?.middleName,
      registration?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Unnamed participant"
  );
};

const getInitials = (name) => {
  return String(name || "NA")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getEmail = (registration) => {
  const value =
    registration?.email ||
    registration?.participantEmail ||
    registration?.participant?.email ||
    "";

  return typeof value === "string"
    ? value
    : "";
};

const getPhone = (registration) => {
  const value =
    registration?.phone ||
    registration?.phoneNumber ||
    registration?.participantPhone ||
    registration?.participant?.phone ||
    registration?.participant?.phoneNumber ||
    "";

  return typeof value === "string"
    ? value
    : "";
};

const getCountyName = (
  registration
) => {
  const county =
    registration?.county;

  if (!county) {
    return "County not provided";
  }

  if (typeof county === "string") {
    return county;
  }

  return (
    county?.county ||
    county?.countyName ||
    county?.name ||
    "County not provided"
  );
};

const getTicketNumber = (
  registration
) => {
  return (
    registration?.ticketNumber ||
    registration?.ticket?.ticketNumber ||
    ""
  );
};

const getRegistrationStatus = (
  registration
) => {
  return (
    registration?.status ||
    registration?.registrationStatus ||
    "pending"
  );
};

const getTicketStatus = (
  registration
) => {
  return (
    registration?.ticketStatus ||
    registration?.ticket?.status ||
    (
      getTicketNumber(registration)
        ? "generated"
        : "pending"
    )
  );
};

const isCheckedIn = (
  registration
) => {
  return Boolean(
    registration?.checkedIn ||
    registration?.isCheckedIn ||
    registration?.checkIn?.checkedIn ||
    registration?.attendance?.checkedIn
  );
};

const getCheckedInAt = (
  registration
) => {
  return (
    registration?.checkedInAt ||
    registration?.checkIn?.checkedInAt ||
    registration?.attendance?.checkedInAt ||
    null
  );
};

const normalizeLookupResponse = (
  result
) => {
  return (
    result?.data?.registration ||
    result?.data?.participant ||
    result?.data ||
    null
  );
};

/* ==========================================
   RECENT CHECK-IN ITEM
========================================== */

const RecentCheckInItem = ({
  registration,
}) => {
  const participantName =
    getParticipantName(registration);

  return (
    <article className="summit-checkin-recent-item">
      <span className="summit-checkin-avatar small">
        {getInitials(participantName)}
      </span>

      <div className="summit-checkin-recent-copy">
        <strong>
          {participantName}
        </strong>

        <small>
          {getTicketNumber(registration) ||
            "Ticket unavailable"}
        </small>
      </div>

      <div className="summit-checkin-recent-meta">
        <span>
          <CheckCircle2 size={14} />
          Checked in
        </span>

        <time>
          {formatDateTime(
            getCheckedInAt(registration) ||
              new Date()
          )}
        </time>
      </div>
    </article>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitCheckIn = () => {
  const ticketInputRef =
    useRef(null);

  const {
    ticketRegistration,
    ticketLoading,
    ticketError,

    actionLoading,
    actionError,
    actionSuccess,

    lookupRegistrationByTicket,
    checkInByTicket,

    clearTicketState,
    clearActionState,
  } = useSummit();

  const [
    ticketNumber,
    setTicketNumber,
  ] = useState("");

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [
    searchMode,
    setSearchMode,
  ] = useState("ticket");

  const [
    recentCheckIns,
    setRecentCheckIns,
  ] = useState([]);

  const [
    localMessage,
    setLocalMessage,
  ] = useState("");

  const [
    lastCheckedInTicket,
    setLastCheckedInTicket,
  ] = useState("");

  /* ========================================
     FOCUS
  ======================================== */

  useEffect(() => {
    ticketInputRef.current?.focus();
  }, []);

  /* ========================================
     DERIVED VALUES
  ======================================== */

  const registration =
    ticketRegistration;

  const participantName =
    useMemo(
      () =>
        getParticipantName(
          registration
        ),
      [registration]
    );

  const currentTicketNumber =
    getTicketNumber(registration);

  const registrationStatus =
    getRegistrationStatus(
      registration
    );

  const ticketStatus =
    getTicketStatus(registration);

  const checkedIn =
    isCheckedIn(registration);

  const canCheckIn =
    Boolean(registration) &&
    Boolean(currentTicketNumber) &&
    !checkedIn &&
    ![
      "cancelled",
      "rejected",
      "inactive",
    ].includes(
      String(
        registrationStatus
      ).toLowerCase()
    ) &&
    ![
      "cancelled",
      "revoked",
      "expired",
    ].includes(
      String(
        ticketStatus
      ).toLowerCase()
    );

  /* ========================================
     RESET
  ======================================== */

  const resetCheckInForm =
    useCallback(() => {
      setTicketNumber("");
      setVerificationCode("");
      setLocalMessage("");
      setLastCheckedInTicket("");

      clearTicketState();
      clearActionState();

      window.setTimeout(() => {
        ticketInputRef.current?.focus();
      }, 0);
    }, [
      clearTicketState,
      clearActionState,
    ]);

  /* ========================================
     LOOKUP
  ======================================== */

  const handleLookup = async (
    event
  ) => {
    event?.preventDefault();

    const cleanedTicket =
      cleanText(ticketNumber);

    if (!cleanedTicket) {
      setLocalMessage(
        "Enter a valid ticket number."
      );

      ticketInputRef.current?.focus();
      return;
    }

    setLocalMessage("");
    clearTicketState();
    clearActionState();

    await lookupRegistrationByTicket(
      cleanedTicket
    );
  };

  /* ========================================
     CHECK-IN
  ======================================== */

  const handleCheckIn =
    async () => {
      if (!registration) {
        setLocalMessage(
          "Search for a participant before checking in."
        );
        return;
      }

      if (!canCheckIn) {
        return;
      }

      setLocalMessage("");
      clearActionState();

      const result =
        await checkInByTicket(
          currentTicketNumber,
          cleanText(verificationCode) ||
            undefined
        );

      if (!result?.success) {
        return;
      }

      const updatedRegistration =
        normalizeLookupResponse(
          result
        ) || {
          ...registration,
          checkedIn: true,
          checkedInAt: new Date(),
        };

      setRecentCheckIns(
        (current) => [
          updatedRegistration,
          ...current.filter(
            (item) =>
              getTicketNumber(item) !==
              currentTicketNumber
          ),
        ].slice(0, 8)
      );

      setLastCheckedInTicket(
        currentTicketNumber
      );

      await lookupRegistrationByTicket(
        currentTicketNumber
      );
    };

  /* ========================================
     KEYBOARD SHORTCUTS
  ======================================== */

  useEffect(() => {
    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === "Escape"
      ) {
        resetCheckInForm();
      }

      if (
        event.key === "Enter" &&
        event.ctrlKey &&
        canCheckIn &&
        !actionLoading
      ) {
        handleCheckIn();
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
    canCheckIn,
    actionLoading,
    resetCheckInForm,
  ]);

  return (
    <main className="summit-checkin-page">
      {/* ======================================
          HEADER
      ====================================== */}

      <header className="summit-checkin-header">
        <div>
          <Link
            to="/admin/summit"
            className="summit-checkin-back-link"
          >
            <ArrowLeft size={17} />
            Summit dashboard
          </Link>

          <div className="summit-checkin-title-row">
            <span className="summit-checkin-title-icon">
              <ScanLine size={25} />
            </span>

            <div>
              <p>
                Summit operations
              </p>

              <h1>
                Participant check-in
              </h1>
            </div>
          </div>

          <p className="summit-checkin-description">
            Search using a summit
            ticket number, verify the
            participant and complete
            event entry.
          </p>
        </div>

        <div className="summit-checkin-header-actions">
          <Link
            to="/admin/summit/registrations"
            className="summit-checkin-secondary-button"
          >
            <Users size={17} />
            Registrations
          </Link>

          <button
            type="button"
            className="summit-checkin-primary-button"
            onClick={
              resetCheckInForm
            }
          >
            <RotateCcw size={17} />
            New check-in
          </button>
        </div>
      </header>

      {/* ======================================
          FEEDBACK
      ====================================== */}

      {(localMessage ||
        ticketError ||
        actionError) && (
        <div
          className="summit-checkin-alert is-error"
          role="alert"
        >
          <AlertCircle size={19} />

          <span>
            {localMessage ||
              ticketError ||
              actionError}
          </span>

          <button
            type="button"
            onClick={() => {
              setLocalMessage("");
              clearTicketState();
              clearActionState();
            }}
            aria-label="Dismiss error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {actionSuccess && (
        <div
          className="summit-checkin-alert is-success"
          role="status"
        >
          <Check size={19} />

          <span>
            {actionSuccess}
          </span>

          <button
            type="button"
            onClick={
              clearActionState
            }
            aria-label="Dismiss success message"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ======================================
          TOP GRID
      ====================================== */}

      <section className="summit-checkin-main-grid">
        {/* SEARCH PANEL */}

        <div className="summit-checkin-search-panel">
          <header>
            <div>
              <p>Participant search</p>
              <h2>
                Find summit registration
              </h2>
            </div>

            <Search size={21} />
          </header>

          <div className="summit-checkin-mode-tabs">
            <button
              type="button"
              className={
                searchMode === "ticket"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setSearchMode("ticket")
              }
            >
              <Ticket size={16} />
              Ticket number
            </button>

            <button
              type="button"
              className={
                searchMode === "scanner"
                  ? "is-active"
                  : ""
              }
              onClick={() =>
                setSearchMode("scanner")
              }
            >
              <ScanLine size={16} />
              Scanner input
            </button>
          </div>

          <form
            className="summit-checkin-search-form"
            onSubmit={
              handleLookup
            }
          >
            <label>
              <span>
                {searchMode ===
                "scanner"
                  ? "Scan QR code or barcode"
                  : "Summit ticket number"}
              </span>

              <div className="summit-checkin-input">
                {searchMode ===
                "scanner" ? (
                  <ScanLine
                    size={19}
                  />
                ) : (
                  <Ticket
                    size={19}
                  />
                )}

                <input
                  ref={ticketInputRef}
                  type="text"
                  value={ticketNumber}
                  onChange={(event) =>
                    setTicketNumber(
                      event.target.value
                    )
                  }
                  placeholder={
                    searchMode ===
                    "scanner"
                      ? "Scan ticket code"
                      : "Enter ticket number"
                  }
                  autoComplete="off"
                  spellCheck="false"
                />

                {ticketNumber && (
                  <button
                    type="button"
                    onClick={() => {
                      setTicketNumber("");
                      clearTicketState();
                      ticketInputRef.current?.focus();
                    }}
                    aria-label="Clear ticket number"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </label>

            <label>
              <span>
                Verification code
                <small>
                  Optional
                </small>
              </span>

              <div className="summit-checkin-input">
                <ShieldCheck
                  size={19}
                />

                <input
                  type="text"
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value
                    )
                  }
                  placeholder="Enter verification code"
                  autoComplete="off"
                />
              </div>
            </label>

            <button
              type="submit"
              className="summit-checkin-search-button"
              disabled={
                ticketLoading ||
                !cleanText(ticketNumber)
              }
            >
              {ticketLoading ? (
                <LoaderCircle
                  size={18}
                  className="is-spinning"
                />
              ) : (
                <Search size={18} />
              )}

              {ticketLoading
                ? "Searching..."
                : "Find participant"}
            </button>
          </form>

          <div className="summit-checkin-shortcuts">
            <Keyboard size={16} />

            <span>
              Press
              <kbd>Esc</kbd>
              to clear and
              <kbd>Ctrl + Enter</kbd>
              to check in.
            </span>
          </div>
        </div>

        {/* SESSION PANEL */}

        <aside className="summit-checkin-session-panel">
          <header>
            <div>
              <p>Check-in session</p>
              <h2>
                Current activity
              </h2>
            </div>

            <Clock3 size={21} />
          </header>

          <div className="summit-checkin-session-stat">
            <span>
              <UserCheck size={22} />
            </span>

            <div>
              <small>
                Checked in this session
              </small>

              <strong>
                {recentCheckIns.length}
              </strong>
            </div>
          </div>

          <div className="summit-checkin-session-stat">
            <span>
              <Ticket size={22} />
            </span>

            <div>
              <small>
                Last processed ticket
              </small>

              <strong>
                {lastCheckedInTicket ||
                  "None"}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="summit-checkin-session-reset"
            onClick={() => {
              setRecentCheckIns([]);
              setLastCheckedInTicket("");
            }}
            disabled={
              recentCheckIns.length ===
                0 &&
              !lastCheckedInTicket
            }
          >
            <RefreshCw size={16} />
            Reset session counters
          </button>
        </aside>
      </section>

      {/* ======================================
          RESULT
      ====================================== */}

      <section className="summit-checkin-result-section">
        {!registration &&
          !ticketLoading && (
            <div className="summit-checkin-empty-result">
              <span>
                <ScanLine size={38} />
              </span>

              <h2>
                Ready for check-in
              </h2>

              <p>
                Enter or scan a valid
                summit ticket number to
                load the participant
                record.
              </p>
            </div>
          )}

        {ticketLoading && (
          <div className="summit-checkin-empty-result">
            <LoaderCircle
              size={38}
              className="is-spinning"
            />

            <h2>
              Searching registration
            </h2>

            <p>
              Please wait while the
              summit ticket is verified.
            </p>
          </div>
        )}

        {registration &&
          !ticketLoading && (
            <article
              className={`summit-checkin-participant-card ${
                checkedIn
                  ? "is-complete"
                  : ""
              }`}
            >
              <header>
                <div className="summit-checkin-participant-profile">
                  <span className="summit-checkin-avatar">
                    {getInitials(
                      participantName
                    )}
                  </span>

                  <div>
                    <p>
                      Summit participant
                    </p>

                    <h2>
                      {participantName}
                    </h2>

                    <span>
                      <Ticket
                        size={15}
                      />
                      {currentTicketNumber ||
                        "Ticket unavailable"}
                    </span>
                  </div>
                </div>

                <div
                  className={`summit-checkin-status ${
                    checkedIn
                      ? "is-success"
                      : "is-pending"
                  }`}
                >
                  {checkedIn ? (
                    <CheckCircle2
                      size={17}
                    />
                  ) : (
                    <Clock3
                      size={17}
                    />
                  )}

                  {checkedIn
                    ? "Already checked in"
                    : "Ready for check-in"}
                </div>
              </header>

              <div className="summit-checkin-details-grid">
                <div>
                  <span>
                    <Mail size={17} />
                  </span>

                  <div>
                    <small>
                      Email
                    </small>

                    <strong>
                      {getEmail(
                        registration
                      ) || "Not provided"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>
                    <User size={17} />
                  </span>

                  <div>
                    <small>
                      Phone
                    </small>

                    <strong>
                      {getPhone(
                        registration
                      ) || "Not provided"}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>
                    <MapPin size={17} />
                  </span>

                  <div>
                    <small>
                      County
                    </small>

                    <strong>
                      {getCountyName(
                        registration
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>
                    <BadgeCheck
                      size={17}
                    />
                  </span>

                  <div>
                    <small>
                      Registration
                    </small>

                    <strong>
                      {formatStatus(
                        registrationStatus
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>
                    <ShieldCheck
                      size={17}
                    />
                  </span>

                  <div>
                    <small>
                      Ticket status
                    </small>

                    <strong>
                      {formatStatus(
                        ticketStatus
                      )}
                    </strong>
                  </div>
                </div>

                <div>
                  <span>
                    <Clock3 size={17} />
                  </span>

                  <div>
                    <small>
                      Check-in time
                    </small>

                    <strong>
                      {checkedIn
                        ? formatDateTime(
                            getCheckedInAt(
                              registration
                            )
                          )
                        : "Pending"}
                    </strong>
                  </div>
                </div>
              </div>

              <footer>
                <Link
                  to={`/admin/summit/registrations/${
                    registration?._id ||
                    registration?.id
                  }`}
                  className="summit-checkin-view-button"
                >
                  <User size={17} />
                  View full registration
                </Link>

                {checkedIn ? (
                  <div className="summit-checkin-complete-message">
                    <CheckCircle2
                      size={18}
                    />

                    Participant entry is
                    already recorded.
                  </div>
                ) : (
                  <button
                    type="button"
                    className="summit-checkin-confirm-button"
                    onClick={
                      handleCheckIn
                    }
                    disabled={
                      !canCheckIn ||
                      actionLoading
                    }
                  >
                    {actionLoading ? (
                      <LoaderCircle
                        size={18}
                        className="is-spinning"
                      />
                    ) : (
                      <UserCheck
                        size={18}
                      />
                    )}

                    {actionLoading
                      ? "Checking in..."
                      : "Confirm check-in"}
                  </button>
                )}
              </footer>

              {!canCheckIn &&
                !checkedIn && (
                <div className="summit-checkin-blocked">
                  <CircleX
                    size={18}
                  />

                  This registration or
                  ticket is not eligible
                  for check-in.
                </div>
              )}
            </article>
          )}
      </section>

      {/* ======================================
          RECENT CHECK-INS
      ====================================== */}

      <section className="summit-checkin-recent-panel">
        <header>
          <div>
            <p>Session history</p>
            <h2>
              Recent check-ins
            </h2>
          </div>

          <span>
            {recentCheckIns.length}
          </span>
        </header>

        {recentCheckIns.length >
        0 ? (
          <div className="summit-checkin-recent-list">
            {recentCheckIns.map(
              (
                registrationItem,
                index
              ) => (
                <RecentCheckInItem
                  key={
                    getTicketNumber(
                      registrationItem
                    ) ||
                    registrationItem?._id ||
                    index
                  }
                  registration={
                    registrationItem
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="summit-checkin-recent-empty">
            <UserCheck size={29} />

            <h3>
              No check-ins this session
            </h3>

            <p>
              Successfully processed
              participants will appear
              here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
};

export default SummitCheckIn;