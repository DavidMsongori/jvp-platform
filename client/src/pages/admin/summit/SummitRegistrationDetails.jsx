import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  CircleX,
  Clock3,
  Download,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
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

import "./SummitRegistrationDetails.css";

/* ==========================================
   HELPERS
========================================== */

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

const formatDate = (value) => {
  if (!value) {
    return "Not provided";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
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

const getStatusClassName = (
  status
) => {
  const normalized = String(
    status || ""
  ).toLowerCase();

  if (
    [
      "confirmed",
      "active",
      "generated",
      "sent",
      "checked_in",
      "checked in",
      "completed",
    ].includes(normalized)
  ) {
    return "is-success";
  }

  if (
    [
      "pending",
      "processing",
      "pending_payment",
    ].includes(normalized)
  ) {
    return "is-warning";
  }

  if (
    [
      "cancelled",
      "rejected",
      "revoked",
      "expired",
      "inactive",
    ].includes(normalized)
  ) {
    return "is-danger";
  }

  return "is-neutral";
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
    const nestedName =
      participant?.fullName ||
      participant?.name ||
      [
        participant?.firstName,
        participant?.middleName,
        participant?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    if (nestedName) {
      return nestedName;
    }
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
  return (
    registration?.email ||
    registration?.participantEmail ||
    registration?.participant?.email ||
    ""
  );
};

const getPhone = (registration) => {
  return (
    registration?.phone ||
    registration?.phoneNumber ||
    registration?.participantPhone ||
    registration?.participant?.phone ||
    registration?.participant
      ?.phoneNumber ||
    ""
  );
};

const getCountyDetails = (
  registration
) => {
  const county =
    registration?.county;

  if (!county) {
    return {
      name: "Not provided",
      code:
        registration?.countyCode ||
        "",
    };
  }

  if (typeof county === "string") {
    return {
      name: county,
      code:
        registration?.countyCode ||
        "",
    };
  }

  return {
    name:
      county?.county ||
      county?.countyName ||
      county?.name ||
      "Not provided",

    code:
      county?.countyCode ||
      county?.code ||
      registration?.countyCode ||
      "",
  };
};

const getSubCounty = (
  registration
) => {
  const value =
    registration?.subCounty ||
    registration?.subcounty;

  if (!value) {
    return "Not provided";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.name ||
    value?.subCounty ||
    value?.subcounty ||
    "Not provided"
  );
};

const getConstituency = (
  registration
) => {
  const value =
    registration?.constituency;

  if (!value) {
    return "Not provided";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.name ||
    value?.constituency ||
    "Not provided"
  );
};

const getWard = (registration) => {
  const value = registration?.ward;

  if (!value) {
    return "Not provided";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.name ||
    value?.ward ||
    "Not provided"
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
    (registration?.ticketNumber
      ? "generated"
      : "pending")
  );
};

const getTicketNumber = (
  registration
) => {
  return (
    registration?.ticketNumber ||
    registration?.ticket
      ?.ticketNumber ||
    ""
  );
};

const isCheckedIn = (
  registration
) => {
  return Boolean(
    registration?.checkedIn ||
      registration?.isCheckedIn ||
      registration?.checkIn
        ?.checkedIn ||
      registration?.attendance
        ?.checkedIn
  );
};

const getCheckInDate = (
  registration
) => {
  return (
    registration?.checkedInAt ||
    registration?.checkIn?.checkedInAt ||
    registration?.attendance
      ?.checkedInAt ||
    null
  );
};

const getParticipantType = (
  registration
) => {
  return (
    registration?.participantType ||
    registration?.category ||
    registration?.registrationType ||
    "Participant"
  );
};

const getOccupation = (
  registration
) => {
  return (
    registration?.occupation ||
    registration?.participant
      ?.occupation ||
    "Not provided"
  );
};

const getOrganization = (
  registration
) => {
  return (
    registration?.organization ||
    registration?.institution ||
    registration?.company ||
    registration?.participant
      ?.organization ||
    "Not provided"
  );
};

/* ==========================================
   INFO ITEM
========================================== */

const InfoItem = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
    <div className="summit-detail-info-item">
      <span className="summit-detail-info-icon">
        <Icon
          size={17}
          aria-hidden="true"
        />
      </span>

      <div>
        <small>{label}</small>
        <strong>{value || "Not provided"}</strong>
      </div>
    </div>
  );
};

/* ==========================================
   ACTION MODAL
========================================== */

const ActionModal = ({
  open,
  title,
  description,
  children,
  confirmLabel,
  confirmVariant = "primary",
  loading,
  onClose,
  onConfirm,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="summit-detail-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <section
        className="summit-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="summit-action-modal-title"
      >
        <header>
          <div>
            <h2 id="summit-action-modal-title">
              {title}
            </h2>

            {description && (
              <p>{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </header>

        <div className="summit-detail-modal-body">
          {children}
        </div>

        <footer>
          <button
            type="button"
            className="summit-detail-modal-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className={`summit-detail-modal-confirm ${confirmVariant}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle
                size={17}
                className="is-spinning"
              />
            ) : null}

            {confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitRegistrationDetails =
  () => {
    const {
      registrationId,
    } = useParams();

    const navigate = useNavigate();

    const {
      selectedRegistration,
      selectedRegistrationLoading,
      registrationsError,
      actionLoading,
      actionError,
      actionSuccess,

      fetchAdminRegistration,
      changeRegistrationStatus,
      changeTicketStatus,
      checkInByTicket,
      generateTicket,
      regenerateTicket,
      sendTicketEmail,
      resendTicketEmail,
      sendLogisticsEmail,
      downloadTicket,

      clearActionState,
      clearSelectedRegistration,
    } = useSummit();

    const [
      registrationStatusModal,
      setRegistrationStatusModal,
    ] = useState(false);

    const [
      ticketStatusModal,
      setTicketStatusModal,
    ] = useState(false);

    const [
      logisticsModal,
      setLogisticsModal,
    ] = useState(false);

    const [
      registrationStatusForm,
      setRegistrationStatusForm,
    ] = useState({
      status: "",
      reason: "",
    });

    const [
      ticketStatusForm,
      setTicketStatusForm,
    ] = useState({
      status: "",
      reason: "",
    });

    const [
      logisticsForm,
      setLogisticsForm,
    ] = useState({
      subject: "",
      message: "",
    });

    /* ========================================
       LOAD REGISTRATION
    ======================================== */

    const loadRegistration =
      useCallback(async () => {
        if (!registrationId) {
          return;
        }

        clearActionState();

        await fetchAdminRegistration(
          registrationId
        );
      }, [
        registrationId,
        fetchAdminRegistration,
        clearActionState,
      ]);

    useEffect(() => {
      loadRegistration();

      return () => {
        clearSelectedRegistration();
        clearActionState();
      };
    }, [
      loadRegistration,
      clearSelectedRegistration,
      clearActionState,
    ]);

    /* ========================================
       DERIVED VALUES
    ======================================== */

    const registration =
      selectedRegistration;

    const participantName =
      useMemo(
        () =>
          getParticipantName(
            registration
          ),
        [registration]
      );

    const county =
      useMemo(
        () =>
          getCountyDetails(
            registration
          ),
        [registration]
      );

    const registrationStatus =
      getRegistrationStatus(
        registration
      );

    const ticketStatus =
      getTicketStatus(
        registration
      );

    const ticketNumber =
      getTicketNumber(
        registration
      );

    const checkedIn =
      isCheckedIn(registration);

    const canGenerateTicket =
      Boolean(registration) &&
      !ticketNumber &&
      registrationStatus !==
        "cancelled" &&
      registrationStatus !==
        "rejected";

    const canCheckIn =
      Boolean(ticketNumber) &&
      !checkedIn &&
      registrationStatus !==
        "cancelled";

    /* ========================================
       REFRESH AFTER ACTION
    ======================================== */

    const refreshAfterAction =
      async (result) => {
        if (result?.success) {
          await fetchAdminRegistration(
            registrationId
          );
        }

        return result;
      };

    /* ========================================
       STATUS ACTIONS
    ======================================== */

    const openRegistrationStatusModal =
      () => {
        clearActionState();

        setRegistrationStatusForm({
          status:
            registrationStatus ||
            "pending",
          reason: "",
        });

        setRegistrationStatusModal(
          true
        );
      };

    const submitRegistrationStatus =
      async () => {
        const payload = {
          status:
            registrationStatusForm.status,
        };

        if (
          registrationStatusForm.reason.trim()
        ) {
          payload.reason =
            registrationStatusForm.reason.trim();
        }

        const result =
          await changeRegistrationStatus(
            registrationId,
            payload
          );

        if (result?.success) {
          setRegistrationStatusModal(
            false
          );

          await refreshAfterAction(
            result
          );
        }
      };

    const openTicketStatusModal =
      () => {
        clearActionState();

        setTicketStatusForm({
          status:
            ticketStatus ||
            "pending",
          reason: "",
        });

        setTicketStatusModal(true);
      };

    const submitTicketStatus =
      async () => {
        const payload = {
          status:
            ticketStatusForm.status,
        };

        if (
          ticketStatusForm.reason.trim()
        ) {
          payload.reason =
            ticketStatusForm.reason.trim();
        }

        const result =
          await changeTicketStatus(
            registrationId,
            payload
          );

        if (result?.success) {
          setTicketStatusModal(false);

          await refreshAfterAction(
            result
          );
        }
      };

    /* ========================================
       TICKET ACTIONS
    ======================================== */

    const handleGenerateTicket =
      async () => {
        clearActionState();

        const result =
          await generateTicket(
            registrationId
          );

        await refreshAfterAction(
          result
        );
      };

    const handleRegenerateTicket =
      async () => {
        const confirmed =
          window.confirm(
            "Regenerate this ticket? The previous ticket may no longer be valid."
          );

        if (!confirmed) {
          return;
        }

        clearActionState();

        const result =
          await regenerateTicket(
            registrationId
          );

        await refreshAfterAction(
          result
        );
      };

    const handleDownloadTicket =
      async () => {
        if (!ticketNumber) {
          return;
        }

        clearActionState();

        await downloadTicket(
          ticketNumber
        );
      };

    const handleSendTicketEmail =
      async () => {
        clearActionState();

        const result =
          await sendTicketEmail(
            registrationId
          );

        await refreshAfterAction(
          result
        );
      };

    const handleResendTicketEmail =
      async () => {
        clearActionState();

        const result =
          await resendTicketEmail(
            registrationId,
            {}
          );

        await refreshAfterAction(
          result
        );
      };

    /* ========================================
       CHECK-IN
    ======================================== */

    const handleCheckIn =
      async () => {
        if (!ticketNumber) {
          return;
        }

        const confirmed =
          window.confirm(
            `Check in ${participantName}?`
          );

        if (!confirmed) {
          return;
        }

        clearActionState();

        const result =
          await checkInByTicket(
            ticketNumber
          );

        await refreshAfterAction(
          result
        );
      };

    /* ========================================
       LOGISTICS EMAIL
    ======================================== */

    const openLogisticsModal =
      () => {
        clearActionState();

        setLogisticsForm({
          subject:
            "Coast Youth Summit Logistics Information",
          message: "",
        });

        setLogisticsModal(true);
      };

    const handleSendLogisticsEmail =
      async () => {
        if (
          !logisticsForm.subject.trim() ||
          !logisticsForm.message.trim()
        ) {
          return;
        }

        const result =
          await sendLogisticsEmail(
            registrationId,
            {
              subject:
                logisticsForm.subject.trim(),
              message:
                logisticsForm.message.trim(),
            }
          );

        if (result?.success) {
          setLogisticsModal(false);

          setLogisticsForm({
            subject: "",
            message: "",
          });
        }
      };

    /* ========================================
       STATES
    ======================================== */

    if (
      selectedRegistrationLoading &&
      !registration
    ) {
      return (
        <main className="summit-registration-detail-page">
          <section className="summit-detail-loading-state">
            <LoaderCircle
              size={34}
              className="is-spinning"
            />

            <h1>
              Loading registration
            </h1>

            <p>
              Please wait while the
              participant record is
              retrieved.
            </p>
          </section>
        </main>
      );
    }

    if (
      registrationsError &&
      !registration
    ) {
      return (
        <main className="summit-registration-detail-page">
          <section className="summit-detail-error-state">
            <AlertCircle size={36} />

            <h1>
              Unable to load
              registration
            </h1>

            <p>
              {registrationsError}
            </p>

            <div>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    "/admin/summit/registrations"
                  )
                }
              >
                <ArrowLeft size={17} />
                Back to registrations
              </button>

              <button
                type="button"
                onClick={loadRegistration}
              >
                <RefreshCw size={17} />
                Try again
              </button>
            </div>
          </section>
        </main>
      );
    }

    if (!registration) {
      return (
        <main className="summit-registration-detail-page">
          <section className="summit-detail-error-state">
            <FileText size={36} />

            <h1>
              Registration not found
            </h1>

            <p>
              The requested summit
              registration could not
              be found.
            </p>

            <Link to="/admin/summit/registrations">
              <ArrowLeft size={17} />
              Back to registrations
            </Link>
          </section>
        </main>
      );
    }

    return (
      <main className="summit-registration-detail-page">
        {/* ====================================
            HEADER
        ===================================== */}

        <header className="summit-detail-header">
          <div>
            <Link
              to="/admin/summit/registrations"
              className="summit-detail-back-link"
            >
              <ArrowLeft size={17} />
              All registrations
            </Link>

            <div className="summit-detail-title-row">
              <span className="summit-detail-avatar">
                {getInitials(
                  participantName
                )}
              </span>

              <div>
                <p>
                  Summit participant
                </p>

                <h1>
                  {participantName}
                </h1>

                <div className="summit-detail-title-meta">
                  <span>
                    <Users size={15} />
                    {formatStatus(
                      getParticipantType(
                        registration
                      )
                    )}
                  </span>

                  <span>
                    <CalendarDays
                      size={15}
                    />
                    Registered{" "}
                    {formatDateTime(
                      registration?.registeredAt ||
                        registration?.createdAt
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="summit-detail-header-actions">
            <button
              type="button"
              className="summit-detail-secondary-button"
              onClick={
                loadRegistration
              }
              disabled={
                selectedRegistrationLoading ||
                actionLoading
              }
            >
              <RefreshCw
                size={17}
                className={
                  selectedRegistrationLoading
                    ? "is-spinning"
                    : ""
                }
              />

              Refresh
            </button>

            {canCheckIn && (
              <button
                type="button"
                className="summit-detail-primary-button"
                onClick={
                  handleCheckIn
                }
                disabled={actionLoading}
              >
                <UserCheck size={17} />
                Check in
              </button>
            )}
          </div>
        </header>

        {/* ====================================
            FEEDBACK
        ===================================== */}

        {actionError && (
          <div
            className="summit-detail-alert is-error"
            role="alert"
          >
            <AlertCircle size={18} />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div
            className="summit-detail-alert is-success"
            role="status"
          >
            <Check size={18} />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* ====================================
            STATUS OVERVIEW
        ===================================== */}

        <section className="summit-detail-status-grid">
          <article>
            <span>
              <BadgeCheck size={21} />
            </span>

            <div>
              <small>
                Registration status
              </small>

              <strong
                className={`summit-detail-status-badge ${getStatusClassName(
                  registrationStatus
                )}`}
              >
                {formatStatus(
                  registrationStatus
                )}
              </strong>
            </div>

            <button
              type="button"
              onClick={
                openRegistrationStatusModal
              }
            >
              Update
            </button>
          </article>

          <article>
            <span>
              <Ticket size={21} />
            </span>

            <div>
              <small>
                Ticket status
              </small>

              <strong
                className={`summit-detail-status-badge ${getStatusClassName(
                  ticketStatus
                )}`}
              >
                {formatStatus(
                  ticketStatus
                )}
              </strong>
            </div>

            <button
              type="button"
              onClick={
                openTicketStatusModal
              }
            >
              Update
            </button>
          </article>

          <article>
            <span>
              <UserCheck size={21} />
            </span>

            <div>
              <small>
                Check-in status
              </small>

              <strong
                className={`summit-detail-status-badge ${
                  checkedIn
                    ? "is-success"
                    : "is-neutral"
                }`}
              >
                {checkedIn
                  ? "Checked In"
                  : "Not Checked In"}
              </strong>
            </div>

            {checkedIn ? (
              <time>
                {formatDateTime(
                  getCheckInDate(
                    registration
                  )
                )}
              </time>
            ) : (
              <span className="summit-detail-muted">
                Pending
              </span>
            )}
          </article>

          <article>
            <span>
              <ShieldCheck size={21} />
            </span>

            <div>
              <small>
                Ticket number
              </small>

              <strong className="summit-detail-ticket-number">
                {ticketNumber ||
                  "Not generated"}
              </strong>
            </div>
          </article>
        </section>

        {/* ====================================
            CONTENT GRID
        ===================================== */}

        <div className="summit-detail-content-grid">
          <div className="summit-detail-main-column">
            {/* PARTICIPANT DETAILS */}

            <section className="summit-detail-panel">
              <header>
                <div>
                  <p>Participant</p>
                  <h2>
                    Personal information
                  </h2>
                </div>

                <User
                  size={20}
                  aria-hidden="true"
                />
              </header>

              <div className="summit-detail-info-grid">
                <InfoItem
                  icon={User}
                  label="Full name"
                  value={
                    participantName
                  }
                />

                <InfoItem
                  icon={Mail}
                  label="Email address"
                  value={getEmail(
                    registration
                  )}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone number"
                  value={getPhone(
                    registration
                  )}
                />

                <InfoItem
                  icon={Users}
                  label="Participant type"
                  value={formatStatus(
                    getParticipantType(
                      registration
                    )
                  )}
                />

                <InfoItem
                  icon={FileText}
                  label="Gender"
                  value={formatStatus(
                    registration?.gender
                  )}
                />

                <InfoItem
                  icon={CalendarDays}
                  label="Date of birth"
                  value={formatDate(
                    registration?.dateOfBirth
                  )}
                />

                <InfoItem
                  icon={FileText}
                  label="National ID"
                  value={
                    registration?.nationalId ||
                    registration?.idNumber ||
                    "Not provided"
                  }
                />

                <InfoItem
                  icon={Users}
                  label="Occupation"
                  value={getOccupation(
                    registration
                  )}
                />

                <InfoItem
                  icon={Users}
                  label="Organization"
                  value={getOrganization(
                    registration
                  )}
                />
              </div>
            </section>

            {/* LOCATION */}

            <section className="summit-detail-panel">
              <header>
                <div>
                  <p>Location</p>
                  <h2>
                    Participant residence
                  </h2>
                </div>

                <MapPin
                  size={20}
                  aria-hidden="true"
                />
              </header>

              <div className="summit-detail-info-grid">
                <InfoItem
                  icon={MapPin}
                  label="County"
                  value={
                    county.code
                      ? `${county.name} (${county.code})`
                      : county.name
                  }
                />

                <InfoItem
                  icon={MapPin}
                  label="Sub-county"
                  value={getSubCounty(
                    registration
                  )}
                />

                <InfoItem
                  icon={MapPin}
                  label="Constituency"
                  value={getConstituency(
                    registration
                  )}
                />

                <InfoItem
                  icon={MapPin}
                  label="Ward"
                  value={getWard(
                    registration
                  )}
                />
              </div>
            </section>

            {/* ADDITIONAL DETAILS */}

            <section className="summit-detail-panel">
              <header>
                <div>
                  <p>Additional information</p>
                  <h2>
                    Registration responses
                  </h2>
                </div>

                <FileText
                  size={20}
                  aria-hidden="true"
                />
              </header>

              <div className="summit-detail-response-list">
                <div>
                  <small>
                    Special requirements
                  </small>

                  <p>
                    {registration?.specialRequirements ||
                      registration?.accessibilityNeeds ||
                      "None provided"}
                  </p>
                </div>

                <div>
                  <small>
                    Dietary requirements
                  </small>

                  <p>
                    {registration?.dietaryRequirements ||
                      registration?.dietaryNeeds ||
                      "None provided"}
                  </p>
                </div>

                <div>
                  <small>
                    Reason for attending
                  </small>

                  <p>
                    {registration?.reasonForAttending ||
                      registration?.motivation ||
                      "Not provided"}
                  </p>
                </div>

                <div>
                  <small>
                    Registration notes
                  </small>

                  <p>
                    {registration?.notes ||
                      registration?.adminNotes ||
                      "No notes available"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* ==================================
              ACTION SIDEBAR
          ================================== */}

          <aside className="summit-detail-side-column">
            <section className="summit-detail-action-panel">
              <header>
                <p>Ticket management</p>
                <h2>Ticket actions</h2>
              </header>

              <div className="summit-detail-action-list">
                {canGenerateTicket && (
                  <button
                    type="button"
                    onClick={
                      handleGenerateTicket
                    }
                    disabled={actionLoading}
                  >
                    <Ticket size={18} />

                    <span>
                      <strong>
                        Generate ticket
                      </strong>
                      <small>
                        Create a new summit
                        ticket
                      </small>
                    </span>
                  </button>
                )}

                {ticketNumber && (
                  <>
                    <button
                      type="button"
                      onClick={
                        handleDownloadTicket
                      }
                      disabled={actionLoading}
                    >
                      <Download size={18} />

                      <span>
                        <strong>
                          Download ticket
                        </strong>
                        <small>
                          Download the ticket
                          PDF
                        </small>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleRegenerateTicket
                      }
                      disabled={actionLoading}
                    >
                      <RotateCcw size={18} />

                      <span>
                        <strong>
                          Regenerate ticket
                        </strong>
                        <small>
                          Replace the current
                          ticket
                        </small>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleSendTicketEmail
                      }
                      disabled={actionLoading}
                    >
                      <Send size={18} />

                      <span>
                        <strong>
                          Send ticket email
                        </strong>
                        <small>
                          Email ticket to
                          participant
                        </small>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        handleResendTicketEmail
                      }
                      disabled={actionLoading}
                    >
                      <Mail size={18} />

                      <span>
                        <strong>
                          Resend ticket email
                        </strong>
                        <small>
                          Send another ticket
                          copy
                        </small>
                      </span>
                    </button>
                  </>
                )}
              </div>
            </section>

            <section className="summit-detail-action-panel">
              <header>
                <p>Communication</p>
                <h2>Participant email</h2>
              </header>

              <div className="summit-detail-action-list">
                <button
                  type="button"
                  onClick={
                    openLogisticsModal
                  }
                  disabled={actionLoading}
                >
                  <Mail size={18} />

                  <span>
                    <strong>
                      Send logistics email
                    </strong>
                    <small>
                      Share venue, programme
                      or travel details
                    </small>
                  </span>
                </button>
              </div>
            </section>

            <section className="summit-detail-record-panel">
              <header>
                <p>Record information</p>
                <h2>Audit details</h2>
              </header>

              <dl>
                <div>
                  <dt>
                    Registration ID
                  </dt>
                  <dd>
                    {registration?._id ||
                      registration?.id ||
                      "Not available"}
                  </dd>
                </div>

                <div>
                  <dt>Created</dt>
                  <dd>
                    {formatDateTime(
                      registration?.createdAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Last updated</dt>
                  <dd>
                    {formatDateTime(
                      registration?.updatedAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Confirmation date
                  </dt>
                  <dd>
                    {formatDateTime(
                      registration?.confirmedAt
                    )}
                  </dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>

        {/* ====================================
            REGISTRATION STATUS MODAL
        ===================================== */}

        <ActionModal
          open={registrationStatusModal}
          title="Update registration status"
          description="Change the participant's summit registration status."
          confirmLabel="Update status"
          confirmVariant={
            registrationStatusForm.status ===
              "cancelled" ||
            registrationStatusForm.status ===
              "rejected"
              ? "danger"
              : "primary"
          }
          loading={actionLoading}
          onClose={() =>
            setRegistrationStatusModal(
              false
            )
          }
          onConfirm={
            submitRegistrationStatus
          }
        >
          <label className="summit-detail-form-field">
            <span>
              Registration status
            </span>

            <select
              value={
                registrationStatusForm.status
              }
              onChange={(event) =>
                setRegistrationStatusForm(
                  (current) => ({
                    ...current,
                    status:
                      event.target.value,
                  })
                )
              }
            >
              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="rejected">
                Rejected
              </option>
            </select>
          </label>

          <label className="summit-detail-form-field">
            <span>
              Reason or internal note
            </span>

            <textarea
              value={
                registrationStatusForm.reason
              }
              onChange={(event) =>
                setRegistrationStatusForm(
                  (current) => ({
                    ...current,
                    reason:
                      event.target.value,
                  })
                )
              }
              rows="4"
              placeholder="Enter a reason where necessary"
            />
          </label>
        </ActionModal>

        {/* ====================================
            TICKET STATUS MODAL
        ===================================== */}

        <ActionModal
          open={ticketStatusModal}
          title="Update ticket status"
          description="Change the current state of the participant ticket."
          confirmLabel="Update ticket"
          confirmVariant={
            ticketStatusForm.status ===
              "cancelled" ||
            ticketStatusForm.status ===
              "revoked"
              ? "danger"
              : "primary"
          }
          loading={actionLoading}
          onClose={() =>
            setTicketStatusModal(
              false
            )
          }
          onConfirm={
            submitTicketStatus
          }
        >
          <label className="summit-detail-form-field">
            <span>Ticket status</span>

            <select
              value={
                ticketStatusForm.status
              }
              onChange={(event) =>
                setTicketStatusForm(
                  (current) => ({
                    ...current,
                    status:
                      event.target.value,
                  })
                )
              }
            >
              <option value="pending">
                Pending
              </option>

              <option value="generated">
                Generated
              </option>

              <option value="sent">
                Sent
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="revoked">
                Revoked
              </option>
            </select>
          </label>

          <label className="summit-detail-form-field">
            <span>
              Reason or internal note
            </span>

            <textarea
              value={
                ticketStatusForm.reason
              }
              onChange={(event) =>
                setTicketStatusForm(
                  (current) => ({
                    ...current,
                    reason:
                      event.target.value,
                  })
                )
              }
              rows="4"
              placeholder="Enter a reason where necessary"
            />
          </label>
        </ActionModal>

        {/* ====================================
            LOGISTICS EMAIL MODAL
        ===================================== */}

        <ActionModal
          open={logisticsModal}
          title="Send logistics email"
          description={`Send logistics information to ${participantName}.`}
          confirmLabel="Send email"
          loading={actionLoading}
          onClose={() =>
            setLogisticsModal(false)
          }
          onConfirm={
            handleSendLogisticsEmail
          }
        >
          <label className="summit-detail-form-field">
            <span>Email subject</span>

            <input
              type="text"
              value={
                logisticsForm.subject
              }
              onChange={(event) =>
                setLogisticsForm(
                  (current) => ({
                    ...current,
                    subject:
                      event.target.value,
                  })
                )
              }
              placeholder="Enter email subject"
            />
          </label>

          <label className="summit-detail-form-field">
            <span>
              Logistics message
            </span>

            <textarea
              value={
                logisticsForm.message
              }
              onChange={(event) =>
                setLogisticsForm(
                  (current) => ({
                    ...current,
                    message:
                      event.target.value,
                  })
                )
              }
              rows="8"
              placeholder="Enter venue, programme, accommodation or travel information"
            />
          </label>

          {!logisticsForm.subject.trim() ||
          !logisticsForm.message.trim() ? (
            <p className="summit-detail-form-note">
              Both the subject and
              message are required.
            </p>
          ) : null}
        </ActionModal>
      </main>
    );
  };

export default SummitRegistrationDetails;