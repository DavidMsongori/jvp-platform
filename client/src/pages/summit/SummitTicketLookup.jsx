import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
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

import "./SummitTicketLookup.css";

/* ==========================================
   INITIAL STATE
========================================== */

const INITIAL_FORM = {
  searchType: "ticket",
  ticketNumber: "",
  email: "",
  phone: "",
  nationalIdLastFour: "",
};

/* ==========================================
   HELPERS
========================================== */

const cleanText = (value) =>
  String(value || "").trim();

const normalizeEmail = (value) =>
  cleanText(value).toLowerCase();

const normalizePhone = (value) => {
  const cleaned = String(value || "")
    .replace(/\s+/g, "")
    .replace(/[()-]/g, "");

  if (cleaned.startsWith("+254")) {
    return cleaned;
  }

  if (cleaned.startsWith("254")) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith("0")) {
    return `+254${cleaned.slice(1)}`;
  }

  return cleaned;
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

const getLookupResult = (result) => {
  return (
    result?.data?.registration ||
    result?.data?.data?.registration ||
    result?.registration ||
    result?.data?.data ||
    result?.data ||
    null
  );
};

const getParticipantName = (
  registration
) => {
  return (
    registration?.fullName ||
    registration?.participantName ||
    registration?.name ||
    "Summit participant"
  );
};

const getParticipantEmail = (
  registration
) => {
  return (
    registration?.email ||
    registration?.participant?.email ||
    ""
  );
};

const getParticipantPhone = (
  registration
) => {
  return (
    registration?.phone ||
    registration?.phoneNumber ||
    registration?.participant?.phone ||
    ""
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

const getTicketStatus = (
  registration
) => {
  return (
    registration?.ticketStatus ||
    registration?.ticket?.status ||
    "active"
  );
};

const getRegistrationStatus = (
  registration
) => {
  return (
    registration?.status ||
    registration?.registrationStatus ||
    "confirmed"
  );
};

const getCounty = (
  registration
) => {
  const county =
    registration?.county;

  if (!county) {
    return "Not provided";
  }

  if (typeof county === "string") {
    return county;
  }

  return (
    county?.county ||
    county?.countyName ||
    county?.name ||
    "Not provided"
  );
};

const getSummitEvent = (
  registration
) => {
  return (
    registration?.summitEvent ||
    registration?.event ||
    {}
  );
};

const getSummitTitle = (
  registration
) => {
  const event =
    getSummitEvent(registration);

  return (
    event?.title ||
    event?.name ||
    "Coast Youth Summit"
  );
};

const getSummitDate = (
  registration
) => {
  const event =
    getSummitEvent(registration);

  return (
    event?.startDate ||
    event?.eventDate ||
    event?.date ||
    null
  );
};

const getSummitVenue = (
  registration
) => {
  const event =
    getSummitEvent(registration);

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
      : venue?.county?.county ||
        venue?.county?.name,
  ]
    .filter(
      (value, index, values) =>
        value &&
        values.indexOf(value) === index
    )
    .join(", ");
};

const getTicketPdfUrl = (
  registration
) => {
  return (
    registration?.ticketPdfUrl ||
    registration?.ticket?.pdfUrl ||
    registration?.ticket?.ticketPdfUrl ||
    ""
  );
};

const isCheckedIn = (
  registration
) => {
  return Boolean(
    registration?.checkedIn ||
    registration?.ticketStatus ===
      "checked_in" ||
    registration?.ticket?.status ===
      "checked_in"
  );
};

const validateLookup = (form) => {
  const errors = {};

  if (form.searchType === "ticket") {
    if (!cleanText(form.ticketNumber)) {
      errors.ticketNumber =
        "Enter your summit ticket number.";
    }
  }

  if (form.searchType === "email") {
    const email =
      normalizeEmail(form.email);

    if (!email) {
      errors.email =
        "Enter the email used during registration.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      errors.email =
        "Enter a valid email address.";
    }
  }

  if (form.searchType === "phone") {
    const phone =
      normalizePhone(form.phone);

    if (!phone) {
      errors.phone =
        "Enter the phone number used during registration.";
    } else if (
      !/^\+254[17]\d{8}$/.test(phone)
    ) {
      errors.phone =
        "Enter a valid Kenyan phone number.";
    }
  }

  if (
    form.searchType === "email" ||
    form.searchType === "phone"
  ) {
    const nationalIdLastFour =
      cleanText(
        form.nationalIdLastFour
      );

    if (!nationalIdLastFour) {
      errors.nationalIdLastFour =
        "Enter the last four characters of your National ID.";
    } else if (
      nationalIdLastFour.length !== 4
    ) {
      errors.nationalIdLastFour =
        "Enter exactly four National ID characters.";
    }
  }

  return errors;
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitTicketLookup = () => {
  const {
    ticketRegistration,
    ticketLoading,
    ticketError,

    lookupRegistrationByTicket,
    lookupRegistrationByEmail,
    lookupRegistrationByPhone,

    downloadTicket,

    actionLoading,
    actionError,

    clearTicketState,
    clearActionState,
  } = useSummit();

  const [
    form,
    setForm,
  ] = useState(INITIAL_FORM);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    localRegistration,
    setLocalRegistration,
  ] = useState(null);

  const [
    localMessage,
    setLocalMessage,
  ] = useState("");

  const registration =
    localRegistration ||
    ticketRegistration;

  const participantName =
    useMemo(
      () =>
        getParticipantName(
          registration
        ),
      [registration]
    );

  const ticketNumber =
    getTicketNumber(
      registration
    );

  const ticketStatus =
    getTicketStatus(
      registration
    );

  const registrationStatus =
    getRegistrationStatus(
      registration
    );

  const ticketPdfUrl =
    getTicketPdfUrl(
      registration
    );

  const checkedIn =
    isCheckedIn(
      registration
    );

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

  const handleSearchTypeChange = (
    searchType
  ) => {
    setForm({
      ...INITIAL_FORM,
      searchType,
    });

    setErrors({});
    setLocalMessage("");
    setLocalRegistration(null);

    clearTicketState?.();
    clearActionState?.();
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    const validationErrors =
      validateLookup(form);

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setErrors(validationErrors);

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

    setErrors({});
    setLocalMessage("");
    setLocalRegistration(null);

    clearTicketState?.();
    clearActionState?.();

    let result;

    if (
      form.searchType === "ticket"
    ) {
      result =
        await lookupRegistrationByTicket(
          cleanText(
            form.ticketNumber
          ).toUpperCase()
        );
    }

    if (
      form.searchType === "email"
    ) {
      if (
        typeof lookupRegistrationByEmail !==
        "function"
      ) {
        setLocalMessage(
          "Email ticket lookup is not available yet."
        );
        return;
      }

      result =
  await lookupRegistrationByEmail(
    normalizeEmail(
      form.email
    ),
    cleanText(
      form.nationalIdLastFour
    ).toUpperCase()
  );
    }

    if (
      form.searchType === "phone"
    ) {
      if (
        typeof lookupRegistrationByPhone !==
        "function"
      ) {
        setLocalMessage(
          "Phone ticket lookup is not available yet."
        );
        return;
      }

console.log("Email lookup values:", {
  email: normalizeEmail(form.email),
  nationalIdLastFour: cleanText(
    form.nationalIdLastFour
  ),
});


      result =
  await lookupRegistrationByPhone(
    normalizePhone(
      form.phone
    ),
    cleanText(
      form.nationalIdLastFour
    ).toUpperCase()
  );
    }

    if (!result?.success) {
      return;
    }

    const foundRegistration =
      getLookupResult(result);

    if (!foundRegistration) {
      setLocalMessage(
        "No summit registration was found using those details."
      );
      return;
    }

    setLocalRegistration(
      foundRegistration
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setLocalMessage("");
    setLocalRegistration(null);

    clearTicketState?.();
    clearActionState?.();
  };

  const handleDownload = async () => {
  if (!ticketNumber) {
    setLocalMessage(
      "This registration does not have a ticket number."
    );

    return;
  }

  await downloadTicket(
    ticketNumber
  );
};



  return (
    <>
      <Navbar />

      <main className="summit-ticket-lookup-page">
        {/* ====================================
            HERO
        ===================================== */}

        <section className="summit-ticket-lookup-hero">
          <div className="summit-ticket-lookup-container">
            <Link
              to="/summit"
              className="summit-ticket-lookup-back"
            >
              <ArrowLeft size={17} />
              Summit information
            </Link>

            <div className="summit-ticket-lookup-hero-content">
              <span className="summit-ticket-lookup-kicker">
                Summit ticket services
              </span>

              <h1>
                Find your summit ticket
              </h1>

              <p>
                Retrieve your summit
                registration using your
                ticket number, email
                address or phone number.
              </p>
            </div>
          </div>
        </section>

        {/* ====================================
            CONTENT
        ===================================== */}

        <section className="summit-ticket-lookup-content">
          <div className="summit-ticket-lookup-container summit-ticket-lookup-layout">
            <div>
              {/* SEARCH CARD */}

              <section className="summit-ticket-lookup-card">
                <header>
                  <span>
                    <Search size={22} />
                  </span>

                  <div>
                    <small>
                      Ticket lookup
                    </small>

                    <h2>
                      Search your
                      registration
                    </h2>

                    <p>
                      Search using your ticket number,
  or use your email or phone together
  with the last four characters of
  your National ID.
                    </p>
                  </div>
                </header>

                <div className="summit-ticket-lookup-tabs">
                  <button
                    type="button"
                    className={
                      form.searchType ===
                      "ticket"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      handleSearchTypeChange(
                        "ticket"
                      )
                    }
                  >
                    <Ticket size={17} />
                    Ticket number
                  </button>

                  <button
                    type="button"
                    className={
                      form.searchType ===
                      "email"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      handleSearchTypeChange(
                        "email"
                      )
                    }
                  >
                    <Mail size={17} />
                    Email
                  </button>

                  <button
                    type="button"
                    className={
                      form.searchType ===
                      "phone"
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      handleSearchTypeChange(
                        "phone"
                      )
                    }
                  >
                    <Phone size={17} />
                    Phone
                  </button>
                </div>

                <form
                  className="summit-ticket-lookup-form"
                  onSubmit={handleSubmit}
                  noValidate
                >
                  {form.searchType ===
                    "ticket" && (
                    <div className="summit-ticket-lookup-field">
                      <label htmlFor="ticketNumber">
                        Ticket number
                        <strong>*</strong>
                      </label>

                      <div className="summit-ticket-lookup-input">
                        <Ticket
                          size={19}
                        />

                        <input
                          id="ticketNumber"
                          type="text"
                          name="ticketNumber"
                          value={
                            form.ticketNumber
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="Enter summit ticket number"
                          autoComplete="off"
                        />
                      </div>

                      {errors.ticketNumber && (
                        <small>
                          <AlertCircle
                            size={13}
                          />
                          {
                            errors.ticketNumber
                          }
                        </small>
                      )}
                    </div>
                  )}

                  {form.searchType ===
                    "email" && (
                    <div className="summit-ticket-lookup-field">
                      <label htmlFor="email">
                        Registration email
                        <strong>*</strong>
                      </label>

                      <div className="summit-ticket-lookup-input">
                        <Mail size={19} />

                        <input
                          id="email"
                          type="email"
                          name="email"
                          value={
                            form.email
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="name@example.com"
                          autoComplete="email"
                        />
                      </div>

                      {errors.email && (
                        <small>
                          <AlertCircle
                            size={13}
                          />
                          {errors.email}
                        </small>
                      )}
                    </div>
                  )}

                  {form.searchType ===
                    "phone" && (
                    <div className="summit-ticket-lookup-field">
                      <label htmlFor="phone">
                        Registration phone
                        <strong>*</strong>
                      </label>

                      <div className="summit-ticket-lookup-input">
                        <Phone size={19} />

                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          value={
                            form.phone
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0712345678"
                          autoComplete="tel"
                        />
                      </div>

                      {errors.phone && (
                        <small>
                          <AlertCircle
                            size={13}
                          />
                          {errors.phone}
                        </small>
                      )}
                    </div>
                  )}

{(form.searchType === "email" ||
  form.searchType === "phone") && (
  <div className="summit-ticket-lookup-field">
    <label htmlFor="nationalIdLastFour">
      Last four National ID characters
      <strong>*</strong>
    </label>

    <div className="summit-ticket-lookup-input">
      <ShieldCheck size={19} />

      <input
        id="nationalIdLastFour"
        type="text"
        name="nationalIdLastFour"
        value={
          form.nationalIdLastFour
        }
        onChange={handleChange}
        placeholder="Example: 1234"
        autoComplete="off"
        maxLength={4}
        inputMode="text"
      />
    </div>

    <p className="summit-ticket-lookup-field-help">
      Enter the final four characters of
      the National ID used during
      registration.
    </p>

    {errors.nationalIdLastFour && (
      <small>
        <AlertCircle size={13} />
        {
          errors.nationalIdLastFour
        }
      </small>
    )}
  </div>
)}

                  {(localMessage ||
                    ticketError ||
                    actionError) && (
                    <div
                      className="summit-ticket-lookup-alert error"
                      role="alert"
                    >
                      <AlertCircle
                        size={18}
                      />

                      <span>
                        {localMessage ||
                          ticketError ||
                          actionError}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="summit-ticket-lookup-submit"
                    disabled={
                      ticketLoading
                    }
                  >
                    {ticketLoading ? (
                      <LoaderCircle
                        size={19}
                        className="summit-ticket-lookup-spinning"
                      />
                    ) : (
                      <Search size={19} />
                    )}

                    {ticketLoading
                      ? "Searching..."
                      : "Find my ticket"}
                  </button>
                </form>
              </section>

              {/* RESULT */}

              {registration && (
                <section className="summit-ticket-result-card">
                  <div className="summit-ticket-result-top">
                    <span className="summit-ticket-result-icon">
                      <CheckCircle2
                        size={28}
                      />
                    </span>

                    <div>
                      <small>
                        Registration found
                      </small>

                      <h2>
                        {participantName}
                      </h2>

                      <p>
                        Your summit
                        registration and
                        ticket information
                        are shown below.
                      </p>
                    </div>

                    <span
                      className={`summit-ticket-result-status ${
                        ticketStatus ===
                          "active" ||
                        ticketStatus ===
                          "checked_in"
                          ? "success"
                          : "warning"
                      }`}
                    >
                      {formatStatus(
                        ticketStatus
                      )}
                    </span>
                  </div>

                  <div className="summit-ticket-number-box">
                    <span>
                      <Ticket size={22} />
                    </span>

                    <div>
                      <small>
                        Ticket number
                      </small>

                      <strong>
                        {ticketNumber ||
                          "Not available"}
                      </strong>
                    </div>
                  </div>

                  <div className="summit-ticket-result-grid">
                    <div>
                      <User size={18} />

                      <span>
                        <small>
                          Participant
                        </small>

                        <strong>
                          {
                            participantName
                          }
                        </strong>
                      </span>
                    </div>

                    <div>
                      <Mail size={18} />

                      <span>
                        <small>Email</small>

                        <strong>
                          {getParticipantEmail(
                            registration
                          ) ||
                            "Not available"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <Phone size={18} />

                      <span>
                        <small>Phone</small>

                        <strong>
                          {getParticipantPhone(
                            registration
                          ) ||
                            "Not available"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <MapPin size={18} />

                      <span>
                        <small>County</small>

                        <strong>
                          {getCounty(
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
                          Registration
                          status
                        </small>

                        <strong>
                          {formatStatus(
                            registrationStatus
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
                          Attendance
                        </small>

                        <strong>
                          {checkedIn
                            ? "Checked in"
                            : "Not checked in"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="summit-ticket-event-section">
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
                            registration
                          )}
                        </strong>
                      </span>

                      <span>
                        <CalendarDays
                          size={18}
                        />

                        <small>Date</small>

                        <strong>
                          {formatDate(
                            getSummitDate(
                              registration
                            )
                          )}
                        </strong>
                      </span>

                      <span>
                        <MapPin size={18} />

                        <small>Venue</small>

                        <strong>
                          {getSummitVenue(
                            registration
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="summit-ticket-result-footer">
                    <div>
                      <small>
                        Registered on
                      </small>

                      <strong>
                        {formatDateTime(
                          registration?.registeredAt ||
                            registration?.createdAt
                        )}
                      </strong>
                    </div>

                    <div className="summit-ticket-result-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={
                          handleReset
                        }
                      >
                        <RefreshCw
                          size={17}
                        />
                        New search
                      </button>

                      <button
                        type="button"
                        className="primary"
                        onClick={
                          handleDownload
                        }
                        disabled={
                          actionLoading ||
                          (
                            !ticketPdfUrl &&
                            typeof downloadTicket !==
                              "function"
                          )
                        }
                      >
                        {actionLoading ? (
                          <LoaderCircle
                            size={17}
                            className="summit-ticket-lookup-spinning"
                          />
                        ) : (
                          <Download
                            size={17}
                          />
                        )}

                        {actionLoading
                          ? "Preparing..."
                          : "Download ticket"}
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* SIDEBAR */}

            <aside className="summit-ticket-lookup-sidebar">
              <section>
                <span>
                  <ShieldCheck size={22} />
                </span>

                <h2>
                  Keep your ticket safe
                </h2>

                <p>
                  Your summit ticket
                  contains a unique
                  ticket number and
                  verification code.
                  Present it during
                  event check-in.
                </p>
              </section>

              <section>
                <span>
                  <AlertCircle size={22} />
                </span>

                <h2>
                  Cannot find your
                  registration?
                </h2>

               <p>
  Confirm that you are using the same
  ticket number, email address or phone
  number used during registration.
  Email and phone searches also require
  the last four characters of your
  National ID.
</p>
              </section>

              <section>
                <span>
                  <Mail size={22} />
                </span>

                <h2>
                  Not registered yet?
                </h2>

                <p>
                  Complete summit
                  registration before
                  trying to retrieve a
                  ticket.
                </p>

                <Link to="/summit/register">
                  Register for summit
                  <ArrowRight
                    size={17}
                  />
                </Link>
              </section>

              <section>
                <span>
                  <Ticket size={22} />
                </span>

                <h2>
                  Ticket status
                </h2>

                <ul>
                  <li>
                    <CheckCircle2
                      size={15}
                    />
                    Active tickets may
                    be used for entry.
                  </li>

                  <li>
                    <CheckCircle2
                      size={15}
                    />
                    Checked-in tickets
                    have already been
                    used.
                  </li>

                  <li>
                    <XCircle size={15} />
                    Cancelled or expired
                    tickets cannot be
                    used.
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SummitTicketLookup;