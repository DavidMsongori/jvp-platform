import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Ticket,
  User,
  XCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import {
  useSummit,
} from "../../context/SummitContext";

import "./SummitVerifyTicket.css";

/* ==========================================
   INITIAL STATE
========================================== */

const INITIAL_FORM = {
  ticketNumber: "",
  verificationCode: "",
};

/* ==========================================
   HELPERS
========================================== */

const cleanText = (value) =>
  String(value || "").trim();

const normalizeTicketNumber = (value) =>
  cleanText(value).toUpperCase();

const formatStatus = (value) => {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const formatDate = (value) => {
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
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
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
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const getVerificationPayload = (result) => {
  return (
    result?.data?.verification ||
    result?.data?.data?.verification ||
    result?.verification ||
    result?.data?.data ||
    result?.data ||
    result ||
    null
  );
};

const getRegistration = (verification) => {
  return (
    verification?.registration ||
    verification?.participant ||
    verification?.ticket?.registration ||
    verification?.data?.registration ||
    null
  );
};

const getSummitEvent = (
  verification,
  registration
) => {
  return (
    verification?.summitEvent ||
    verification?.event ||
    registration?.summitEvent ||
    registration?.event ||
    {}
  );
};

const getTicketNumber = (
  verification,
  registration
) => {
  return (
    verification?.ticketNumber ||
    verification?.ticket?.ticketNumber ||
    registration?.ticketNumber ||
    registration?.ticket?.ticketNumber ||
    ""
  );
};

const getTicketStatus = (
  verification,
  registration
) => {
  return (
    verification?.ticketStatus ||
    verification?.ticket?.status ||
    registration?.ticketStatus ||
    registration?.ticket?.status ||
    "unknown"
  );
};

const getRegistrationStatus = (
  verification,
  registration
) => {
  return (
    verification?.registrationStatus ||
    registration?.status ||
    registration?.registrationStatus ||
    "unknown"
  );
};

const getParticipantName = (
  verification,
  registration
) => {
  return (
    verification?.fullName ||
    verification?.participantName ||
    registration?.fullName ||
    registration?.participantName ||
    registration?.name ||
    "Summit participant"
  );
};

const getCounty = (
  verification,
  registration
) => {
  const county =
    verification?.county ||
    registration?.county;

  if (!county) {
    return "Not available";
  }

  if (typeof county === "string") {
    return county;
  }

  return (
    county?.name ||
    county?.county ||
    county?.countyName ||
    "Not available"
  );
};

const getSummitTitle = (
  verification,
  registration
) => {
  const event =
    getSummitEvent(
      verification,
      registration
    );

  return (
    event?.title ||
    event?.name ||
    "Coast Youth Summit"
  );
};

const getSummitDate = (
  verification,
  registration
) => {
  const event =
    getSummitEvent(
      verification,
      registration
    );

  return (
    event?.startDate ||
    event?.eventDate ||
    event?.date ||
    null
  );
};

const getSummitVenue = (
  verification,
  registration
) => {
  const event =
    getSummitEvent(
      verification,
      registration
    );

  const venue =
    event?.venue ||
    event?.location;

  if (!venue) {
    return "Venue to be communicated";
  }

  if (typeof venue === "string") {
    return venue;
  }

  return [
    venue?.name ||
      venue?.venueName,
    venue?.address,
    typeof venue?.county === "string"
      ? venue.county
      : venue?.county?.name ||
        venue?.county?.county,
  ]
    .filter(
      (value, index, values) =>
        value &&
        values.indexOf(value) === index
    )
    .join(", ");
};

const getCheckedIn = (
  verification,
  registration
) => {
  return Boolean(
    verification?.checkedIn ||
    registration?.checkedIn ||
    getTicketStatus(
      verification,
      registration
    ) === "checked_in"
  );
};

const getCheckedInAt = (
  verification,
  registration
) => {
  return (
    verification?.checkedInAt ||
    registration?.checkedInAt ||
    null
  );
};

const isTicketValid = (
  verification,
  registration
) => {
  if (
    typeof verification?.valid ===
    "boolean"
  ) {
    return verification.valid;
  }

  if (
    typeof verification?.isValid ===
    "boolean"
  ) {
    return verification.isValid;
  }

  if (
    typeof verification?.verified ===
    "boolean"
  ) {
    return verification.verified;
  }

  const ticketStatus =
    getTicketStatus(
      verification,
      registration
    );

  const registrationStatus =
    getRegistrationStatus(
      verification,
      registration
    );

  return (
    [
      "active",
      "generated",
      "sent",
      "checked_in",
    ].includes(ticketStatus) &&
    ![
      "cancelled",
      "expired",
      "revoked",
    ].includes(registrationStatus)
  );
};

const validateForm = (form) => {
  const errors = {};

  if (
    !cleanText(form.ticketNumber)
  ) {
    errors.ticketNumber =
      "Enter the summit ticket number.";
  }

  return errors;
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitVerifyTicket = () => {
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const {
    ticketVerification,
    ticketLoading,
    ticketError,

    verifyTicket,

    clearTicketState,
    clearActionState,
  } = useSummit();

  const [
    form,
    setForm,
  ] = useState(() => ({
    ticketNumber:
      searchParams.get(
        "ticketNumber"
      ) || "",
    verificationCode:
      searchParams.get("code") || "",
  }));

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    localVerification,
    setLocalVerification,
  ] = useState(null);

  const [
    localMessage,
    setLocalMessage,
  ] = useState("");

  const verification =
    localVerification ||
    ticketVerification;

  const registration =
    useMemo(
      () =>
        getRegistration(
          verification
        ),
      [verification]
    );

  const ticketNumber =
    getTicketNumber(
      verification,
      registration
    );

  const ticketStatus =
    getTicketStatus(
      verification,
      registration
    );

  const registrationStatus =
    getRegistrationStatus(
      verification,
      registration
    );

  const participantName =
    getParticipantName(
      verification,
      registration
    );

  const checkedIn =
    getCheckedIn(
      verification,
      registration
    );

  const validTicket =
    verification
      ? isTicketValid(
          verification,
          registration
        )
      : false;

  useEffect(() => {
    return () => {
      clearTicketState?.();
      clearActionState?.();
    };
  }, [
    clearTicketState,
    clearActionState,
  ]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }

    setLocalMessage("");

    if (ticketError) {
      clearTicketState?.();
    }
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationErrors =
      validateForm(form);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setErrors(
        validationErrors
      );

      const firstField =
        Object.keys(
          validationErrors
        )[0];

      document
        .querySelector(
          `[name="${firstField}"]`
        )
        ?.focus();

      return;
    }

    if (
      typeof verifyTicket !==
      "function"
    ) {
      setLocalMessage(
        "Ticket verification is not available."
      );

      return;
    }

    setErrors({});
    setLocalMessage("");
    setLocalVerification(null);

    clearTicketState?.();
    clearActionState?.();

    const normalizedTicket =
      normalizeTicketNumber(
        form.ticketNumber
      );

    const code =
      cleanText(
        form.verificationCode
      );

    const result =
      await verifyTicket({
        ticketNumber:
          normalizedTicket,
        code: code || undefined,
      });

    if (!result?.success) {
      return;
    }

    const foundVerification =
      getVerificationPayload(
        result
      );

    if (!foundVerification) {
      setLocalMessage(
        "The ticket verification result could not be loaded."
      );

      return;
    }

    setLocalVerification(
      foundVerification
    );

    const params = {
      ticketNumber:
        normalizedTicket,
    };

    if (code) {
      params.code = code;
    }

    setSearchParams(params);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setLocalMessage("");
    setLocalVerification(null);
    setSearchParams({});

    clearTicketState?.();
    clearActionState?.();
  };

  return (
    <>
      <Navbar />

      <main className="summit-ticket-verify-page">
        {/* ====================================
            HERO
        ===================================== */}

        <section className="summit-ticket-verify-hero">
          <div className="summit-ticket-verify-container">
            <Link
              to="/summit"
              className="summit-ticket-verify-back"
            >
              <ArrowLeft size={17} />
              Summit information
            </Link>

            <div className="summit-ticket-verify-hero-content">
              <span className="summit-ticket-verify-kicker">
                Official ticket verification
              </span>

              <h1>
                Verify a summit ticket
              </h1>

              <p>
                Confirm whether a Coast Youth
                Summit ticket is valid and view
                its current registration and
                attendance status.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================
            CONTENT
        ===================================== */}

        <section className="summit-ticket-verify-content">
          <div className="summit-ticket-verify-container summit-ticket-verify-layout">
            <div>
              {/* VERIFICATION FORM */}

              <section className="summit-ticket-verify-card">
                <header>
                  <span>
                    <ShieldCheck size={23} />
                  </span>

                  <div>
                    <small>
                      Ticket verification
                    </small>

                    <h2>
                      Enter ticket details
                    </h2>

                    <p>
                      The ticket number is
                      required. The verification
                      code is optional unless it
                      appears on the ticket.
                    </p>
                  </div>
                </header>

                <form
                  className="summit-ticket-verify-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  <div className="summit-ticket-verify-field">
                    <label htmlFor="ticketNumber">
                      Ticket number
                      <strong>*</strong>
                    </label>

                    <div className="summit-ticket-verify-input">
                      <Ticket size={19} />

                      <input
                        id="ticketNumber"
                        type="text"
                        name="ticketNumber"
                        value={
                          form.ticketNumber
                        }
                        onChange={handleChange}
                        placeholder="Example: CYS/KLF/0001"
                        autoComplete="off"
                      />
                    </div>

                    {errors.ticketNumber && (
                      <small className="summit-ticket-verify-error-text">
                        <AlertCircle
                          size={13}
                        />
                        {
                          errors.ticketNumber
                        }
                      </small>
                    )}
                  </div>

                  <div className="summit-ticket-verify-field">
                    <label htmlFor="verificationCode">
                      Verification code
                      <span>Optional</span>
                    </label>

                    <div className="summit-ticket-verify-input">
                      <ShieldCheck size={19} />

                      <input
                        id="verificationCode"
                        type="text"
                        name="verificationCode"
                        value={
                          form.verificationCode
                        }
                        onChange={handleChange}
                        placeholder="Enter verification code"
                        autoComplete="off"
                      />
                    </div>

                    <p className="summit-ticket-verify-help">
                      Enter the code exactly as
                      it appears on the summit
                      ticket.
                    </p>
                  </div>

                  {(localMessage ||
                    ticketError) && (
                    <div
                      className="summit-ticket-verify-alert error"
                      role="alert"
                    >
                      <AlertCircle
                        size={18}
                      />

                      <span>
                        {localMessage ||
                          ticketError}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="summit-ticket-verify-submit"
                    disabled={
                      ticketLoading
                    }
                  >
                    {ticketLoading ? (
                      <LoaderCircle
                        size={19}
                        className="summit-ticket-verify-spinning"
                      />
                    ) : (
                      <Search size={19} />
                    )}

                    {ticketLoading
                      ? "Verifying..."
                      : "Verify ticket"}
                  </button>
                </form>
              </section>

              {/* VERIFICATION RESULT */}

              {verification && (
                <section
                  className={`summit-ticket-verification-result ${
                    validTicket
                      ? "valid"
                      : "invalid"
                  }`}
                >
                  <div className="summit-ticket-verification-heading">
                    <span className="summit-ticket-verification-icon">
                      {validTicket ? (
                        <CheckCircle2
                          size={31}
                        />
                      ) : (
                        <XCircle
                          size={31}
                        />
                      )}
                    </span>

                    <div>
                      <small>
                        Verification result
                      </small>

                      <h2>
                        {validTicket
                          ? "Valid summit ticket"
                          : "Ticket not valid"}
                      </h2>

                      <p>
                        {validTicket
                          ? "This ticket matches a registered summit participant."
                          : "This ticket cannot currently be accepted for summit entry."}
                      </p>
                    </div>

                    <span className="summit-ticket-verification-badge">
                      {validTicket
                        ? "Verified"
                        : "Not verified"}
                    </span>
                  </div>

                  <div className="summit-ticket-verification-number">
                    <span>
                      <Ticket size={22} />
                    </span>

                    <div>
                      <small>
                        Ticket number
                      </small>

                      <strong>
                        {ticketNumber ||
                          normalizeTicketNumber(
                            form.ticketNumber
                          )}
                      </strong>
                    </div>
                  </div>

                  <div className="summit-ticket-verification-grid">
                    <div>
                      <User size={18} />

                      <span>
                        <small>
                          Participant
                        </small>

                        <strong>
                          {participantName}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <MapPin size={18} />

                      <span>
                        <small>
                          County
                        </small>

                        <strong>
                          {getCounty(
                            verification,
                            registration
                          )}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <ShieldCheck
                        size={18}
                      />

                      <span>
                        <small>
                          Ticket status
                        </small>

                        <strong>
                          {formatStatus(
                            ticketStatus
                          )}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <CheckCircle2
                        size={18}
                      />

                      <span>
                        <small>
                          Registration status
                        </small>

                        <strong>
                          {formatStatus(
                            registrationStatus
                          )}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <Clock3 size={18} />

                      <span>
                        <small>
                          Attendance
                        </small>

                        <strong>
                          {checkedIn
                            ? "Checked in"
                            : "Not checked in"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <CalendarDays
                        size={18}
                      />

                      <span>
                        <small>
                          Checked in at
                        </small>

                        <strong>
                          {checkedIn
                            ? formatDateTime(
                                getCheckedInAt(
                                  verification,
                                  registration
                                )
                              )
                            : "Not available"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="summit-ticket-verification-event">
                    <h3>
                      Summit information
                    </h3>

                    <div>
                      <span>
                        <CalendarDays
                          size={18}
                        />

                        <small>
                          Summit
                        </small>

                        <strong>
                          {getSummitTitle(
                            verification,
                            registration
                          )}
                        </strong>
                      </span>

                      <span>
                        <CalendarDays
                          size={18}
                        />

                        <small>
                          Date
                        </small>

                        <strong>
                          {formatDate(
                            getSummitDate(
                              verification,
                              registration
                            )
                          )}
                        </strong>
                      </span>

                      <span>
                        <MapPin size={18} />

                        <small>
                          Venue
                        </small>

                        <strong>
                          {getSummitVenue(
                            verification,
                            registration
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="summit-ticket-verification-footer">
                    <p>
                      {validTicket
                        ? checkedIn
                          ? "This participant has already checked in."
                          : "This ticket may be presented for summit entry."
                        : "Contact the summit support team if you believe this result is incorrect."}
                    </p>

                    <button
                      type="button"
                      onClick={handleReset}
                    >
                      <RefreshCw
                        size={17}
                      />
                      Verify another ticket
                    </button>
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}

            <aside className="summit-ticket-verify-sidebar">
              <section>
                <span>
                  <ShieldCheck size={23} />
                </span>

                <h2>
                  Official verification
                </h2>

                <p>
                  This page checks the ticket
                  directly against the official
                  summit registration system.
                </p>
              </section>

              <section>
                <span>
                  <Ticket size={23} />
                </span>

                <h2>
                  Where to find the details
                </h2>

                <p>
                  The ticket number and
                  verification code appear on
                  the participant's summit
                  ticket PDF.
                </p>
              </section>

              <section>
                <span>
                  <CheckCircle2
                    size={23}
                  />
                </span>

                <h2>
                  Ticket statuses
                </h2>

                <ul>
                  <li>
                    <CheckCircle2
                      size={15}
                    />
                    Active tickets may be used
                    for entry.
                  </li>

                  <li>
                    <Clock3 size={15} />
                    Checked-in tickets have
                    already been used.
                  </li>

                  <li>
                    <XCircle size={15} />
                    Cancelled, expired or
                    revoked tickets are invalid.
                  </li>
                </ul>
              </section>

              <section>
                <span>
                  <Search size={23} />
                </span>

                <h2>
                  Looking for your ticket?
                </h2>

                <p>
                  Registered participants can
                  retrieve their ticket using
                  the ticket lookup page.
                </p>

                <Link to="/summit/ticket">
                  Find my ticket
                </Link>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SummitVerifyTicket;