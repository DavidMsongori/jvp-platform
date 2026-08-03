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
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Ticket,
  User,
  UserCheck,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import {
  useAuth,
} from "../../context/AuthContext";

import {
  useSummit,
} from "../../context/SummitContext";

import "./SummitRegistration.css";

/* ==========================================
   CONFIGURATION
========================================== */

const SUMMIT_SLUG =
  import.meta.env.VITE_SUMMIT_SLUG ||
  "coast-youth-summit-2026";

const COUNTY_OPTIONS = [
  {
    name: "Kilifi",
    code: "KLF",
  },
  {
    name: "Mombasa",
    code: "MSA",
  },
  {
    name: "Kwale",
    code: "KWL",
  },
  {
    name: "Taita Taveta",
    code: "TTV",
  },
  {
    name: "Tana River",
    code: "TNR",
  },
  {
    name: "Lamu",
    code: "LMU",
  },
];

const REGISTRATION_MODE =
  "public";

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phone: "",
  nationalId: "",
  county: "",
  constituency: "",
  ward: "",
  acceptedTerms: false,
  consentedToCommunication: false,
};

/* ==========================================
   GENERAL HELPERS
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
    return "Date to be announced";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be announced";
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

const formatStatus = (value) => {
  if (!value) {
    return "Confirmed";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

const getSummitPayload = (summit) => {
  if (!summit) {
    return {};
  }

  return (
    summit?.data?.summitEvent ||
    summit?.data?.event ||
    summit?.data?.summit ||
    summit?.data?.data?.summitEvent ||
    summit?.data?.data?.event ||
    summit?.data?.data?.summit ||
    summit?.summitEvent ||
    summit?.event ||
    summit?.summit ||
    summit?.data ||
    summit
  );
};

const getVenueDetails = (
  summitEvent
) => {
  const venue =
    summitEvent?.venue ||
    summitEvent?.location;

  if (!venue) {
    return {
      name: "Venue to be communicated",
      county: "",
      displayText:
        "Venue to be communicated",
    };
  }

  if (typeof venue === "string") {
    return {
      name: venue,
      county: "",
      displayText: venue,
    };
  }

  const name =
    venue?.name ||
    venue?.venueName ||
    venue?.address ||
    "Venue to be communicated";

  const countyValue =
    venue?.county;

  const county =
    typeof countyValue === "string"
      ? countyValue
      : countyValue?.county ||
        countyValue?.name ||
        "";

  const displayParts = [
    name,
    county,
  ].filter(
    (value, index, values) =>
      value &&
      values.indexOf(value) === index
  );

  return {
    name,
    county,

    displayText:
      displayParts.join(", ") ||
      "Venue to be communicated",
  };
};

const getRegistrationResult = (
  result
) => {
  return (
    result?.data?.registration ||
    result?.data?.data?.registration ||
    result?.registration ||
    result?.data?.data ||
    result?.data ||
    null
  );
};

const getCountyName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return (
    value?.county ||
    value?.countyName ||
    value?.name ||
    ""
  );
};

const getCountyCode = (
  countyName
) => {
  return (
    COUNTY_OPTIONS.find(
      (county) =>
        county.name === countyName
    )?.code || ""
  );
};

const getMemberFullName = (
  member
) => {
  if (!member) {
    return "";
  }

  return (
    member?.fullName ||
    [
      member?.firstName,
      member?.middleName,
      member?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
  );
};

const getMemberId = (member) =>
  member?._id ||
  member?.id ||
  null;

const getUserId = (user) =>
  user?._id ||
  user?.id ||
  null;

const isMemberProfileAvailable = (
  member
) => {
  return Boolean(
    member &&
      getMemberId(member)
  );
};

/* ==========================================
   VALIDATION
========================================== */

const validateForm = (form) => {
  const errors = {};

  const fullName = cleanText(
    form.fullName
  );

  if (!fullName) {
    errors.fullName =
      "Full name is required.";
  } else if (fullName.length < 3) {
    errors.fullName =
      "Full name must contain at least 3 characters.";
  } else if (fullName.length > 150) {
    errors.fullName =
      "Full name cannot exceed 150 characters.";
  }

  const email = normalizeEmail(
    form.email
  );

  if (!email) {
    errors.email =
      "Email address is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email
    )
  ) {
    errors.email =
      "Enter a valid email address.";
  }

  const phone = normalizePhone(
    form.phone
  );

  if (!phone) {
    errors.phone =
      "Phone number is required.";
  } else if (
    !/^\+254[17]\d{8}$/.test(phone)
  ) {
    errors.phone =
      "Enter a valid Kenyan phone number.";
  }

  const nationalId = cleanText(
    form.nationalId
  );

  if (!nationalId) {
    errors.nationalId =
      "National ID or passport number is required.";
  } else if (nationalId.length < 4) {
    errors.nationalId =
      "Enter a valid National ID or passport number.";
  }

  if (!form.county) {
    errors.county =
      "Select your county.";
  }

  const constituency = cleanText(
    form.constituency
  );

  if (!constituency) {
    errors.constituency =
      "Constituency is required.";
  } else if (
    constituency.length > 100
  ) {
    errors.constituency =
      "Constituency cannot exceed 100 characters.";
  }

  const ward = cleanText(
    form.ward
  );

  if (!ward) {
    errors.ward =
      "Ward is required.";
  } else if (ward.length > 100) {
    errors.ward =
      "Ward cannot exceed 100 characters.";
  }

  if (!form.acceptedTerms) {
    errors.acceptedTerms =
      "You must accept the summit registration terms.";
  }

  if (
    !form.consentedToCommunication
  ) {
    errors.consentedToCommunication =
      "You must consent to receiving summit communication.";
  }

  return errors;
};

/* ==========================================
   FORM FIELD
========================================== */

const FormField = ({
  label,
  required = false,
  error = "",
  hint = "",
  children,
  className = "",
}) => {
  return (
    <div
      className={`summit-registration-field ${className}`}
    >
      <label>
        <span className="summit-registration-field-label">
          {label}

          {required && (
            <strong aria-hidden="true">
              *
            </strong>
          )}
        </span>

        {children}
      </label>

      {hint && !error && (
        <small className="summit-registration-field-hint">
          {hint}
        </small>
      )}

      {error && (
        <small
          className="summit-registration-field-error"
          role="alert"
        >
          <AlertCircle size={13} />
          {error}
        </small>
      )}
    </div>
  );
};

/* ==========================================
   MAIN COMPONENT
========================================== */

const SummitRegistration = () => {
 const {
  loading: authLoading,
} = useAuth();

 const {
  summit,
  summitLoading,
  summitError,

  registrationLoading,
  registrationError,
  registrationSuccess,

  fetchPublicSummitBySlug,
  submitSummitRegistration,

  clearRegistrationState,
  clearSummitError,
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
    submittedRegistration,
    setSubmittedRegistration,
  ] = useState(null);

  const [
    profileMessage,
    setProfileMessage,
  ] = useState("");


  const summitEvent = useMemo(
    () =>
      getSummitPayload(summit),
    [summit]
  );

  const summitTitle =
    summitEvent?.title ||
    summitEvent?.name ||
    "Coast Youth Summit 2026";

  const summitDate =
    summitEvent?.startDate ||
    summitEvent?.eventDate ||
    summitEvent?.date;

  const venue = useMemo(
    () =>
      getVenueDetails(
        summitEvent
      ),
    [summitEvent]
  );

  const registrationStatus =
    String(
      summitEvent?.registrationStatus ||
        summitEvent?.registration
          ?.status ||
        ""
    ).toLowerCase();

  const registrationOpen =
    summitEvent?.registrationOpen ===
      true ||
    summitEvent?.isRegistrationOpen ===
      true ||
    summitEvent?.registration
      ?.isOpen === true ||
    registrationStatus === "open";


  /* ========================================
     LOAD SUMMIT
  ======================================== */

  const loadSummit =
    useCallback(async () => {
      clearSummitError();

      await fetchPublicSummitBySlug(
        SUMMIT_SLUG
      );
    }, [
      clearSummitError,
      fetchPublicSummitBySlug,
    ]);

  useEffect(() => {
    loadSummit();

    return () => {
      clearRegistrationState();
    };
  }, [
    loadSummit,
    clearRegistrationState,
  ]);

  /* ========================================
     FORM CHANGE
  ======================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      checked,
      type,
    } = event.target;

    setForm((current) => ({
      ...current,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (errors[name]) {
      setErrors((current) => ({
        ...current,
        [name]: "",
      }));
    }

    if (
      registrationError ||
      registrationSuccess
    ) {
      clearRegistrationState();
    }
  };

  const focusFirstError = (
    validationErrors
  ) => {
    const firstErrorField =
      Object.keys(
        validationErrors
      )[0];

    window.setTimeout(() => {
      document
        .querySelector(
          `[name="${firstErrorField}"]`
        )
        ?.focus();
    }, 0);
  };

  /* ========================================
     SUBMIT
  ======================================== */

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
      setErrors(validationErrors);

      focusFirstError(
        validationErrors
      );

      return;
    }

    setErrors({});
    setProfileMessage("");
    clearRegistrationState();

    const nationalId =
      cleanText(
        form.nationalId
      );

   const summitEventId =
  summit?._id ||
  summit?.id ||
  summit?.summitEventId ||
  null;

if (!summitEventId) {
  setProfileMessage(
    "The summit event could not be identified. Please refresh the page and try again."
  );

  return;
}

const payload = {
  summitEventId,

  summitSlug: SUMMIT_SLUG,

      participantType: "public",

registrationSource:
  "public_guest",

isRegisteredMember: false,

membershipInterest: false,

membershipRegistrationStarted:
  false,

userId: undefined,

memberId: undefined,

      fullName: cleanText(
        form.fullName
      ),

      email: normalizeEmail(
        form.email
      ),

      phone: normalizePhone(
        form.phone
      ),

      nationalId,

      nationalIdLastFour:
        nationalId.slice(-4),

      county: form.county,

      countyCode:
        getCountyCode(
          form.county
        ),

      constituency: cleanText(
        form.constituency
      ),

      ward: cleanText(
        form.ward
      ),

      acceptedTerms:
        Boolean(
          form.acceptedTerms
        ),

      consentedToCommunication:
        Boolean(
          form
            .consentedToCommunication
        ),
    };

        try {
      const result =
        await submitSummitRegistration(
          payload
        );

      if (result?.success !== true) {
        setProfileMessage(
          result?.message ||
            "Registration could not be completed. Please try again."
        );

        return;
      }

      const registration =
        getRegistrationResult(
          result
        ) ||
        getRegistrationResult(
          result?.data
        ) ||
        result?.data?.registration ||
        result?.data?.data
          ?.registration ||
        result?.data?.data ||
        result?.data ||
        null;

      if (!registration) {
        console.error(
          "Registration succeeded but no registration data was returned:",
          result
        );

        setProfileMessage(
          "Registration was received, but the ticket information was not returned. Please use the ticket lookup page."
        );

        return;
      }

      setSubmittedRegistration(
        registration
      );

      setProfileMessage("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (submitError) {
      console.error(
        "Summit registration failed:",
        submitError
      );

      setProfileMessage(
        submitError?.response?.data
          ?.message ||
          submitError?.message ||
          "Registration could not be completed. Please try again."
      );
    }
  };

 const handleNewRegistration =
  () => {
    setSubmittedRegistration(
      null
    );

    setErrors({});
    setProfileMessage("");

    clearRegistrationState();

    setForm(INITIAL_FORM);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* ========================================
     INITIAL LOADING
  ======================================== */

  if (
    authLoading ||
    (
      summitLoading &&
      !summit
    )
  ) {
    return (
      <>
        <Navbar />

        <main className="summit-registration-page">
          <section className="summit-registration-state">
            <LoaderCircle
              size={38}
              className="summit-registration-spinning"
            />

            <h1>
              Loading registration
            </h1>

            <p>
              Please wait while your
              account and summit
              information are checked.
            </p>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  /* ========================================
     SUMMIT ERROR
  ======================================== */

  if (
    summitError &&
    !summit
  ) {
    return (
      <>
        <Navbar />

        <main className="summit-registration-page">
          <section className="summit-registration-state error">
            <AlertCircle size={40} />

            <h1>
              Registration is
              unavailable
            </h1>

            <p>{summitError}</p>

            <button
              type="button"
              onClick={loadSummit}
              disabled={summitLoading}
            >
              <RefreshCw size={17} />
              Try again
            </button>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  /* ========================================
     REGISTRATION CLOSED
  ======================================== */

  if (!registrationOpen) {
    return (
      <>
        <Navbar />

        <main className="summit-registration-page">
          <section className="summit-registration-state closed">
            <ShieldCheck size={40} />

            <h1>
              Summit registration is
              currently closed
            </h1>

            <p>
              Registration for{" "}
              <strong>
                {summitTitle}
              </strong>{" "}
              is not accepting new
              participants at this
              time.
            </p>

            <div className="summit-registration-state-actions">
              <Link to="/summit">
                <ArrowLeft size={17} />
                Summit information
              </Link>

              <Link to="/summit/ticket">
                <Ticket size={17} />
                Find my ticket
              </Link>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  

  /* ========================================
     SUCCESS
  ======================================== */

  if (submittedRegistration) {
    const ticketNumber =
      submittedRegistration
        ?.ticketNumber ||
      submittedRegistration?.ticket
        ?.ticketNumber ||
      "";

    const status =
      submittedRegistration?.status ||
      "confirmed";

   const resultParticipantType =
  submittedRegistration
    ?.participantType ||
  REGISTRATION_MODE;

    return (
      <>
        <Navbar />

        <main className="summit-registration-page">
          <section className="summit-registration-success">
            <span className="summit-registration-success-icon">
              <CheckCircle2
                size={44}
              />
            </span>

            <span className="summit-registration-success-label">
              Registration successful
            </span>

            <h1>
              Your summit place has
              been reserved
            </h1>

            <p>
              Your registration for{" "}
              <strong>
                {summitTitle}
              </strong>{" "}
              has been received
              successfully.
            </p>

            <div className="summit-registration-success-details">
              <div>
                <User size={19} />

                <span>
                  <small>
                    Participant
                  </small>

                  <strong>
                    {
                      submittedRegistration
                        ?.fullName
                    }
                  </strong>
                </span>
              </div>

              <div>
                <UserCheck size={19} />

                <span>
                  <small>
                    Participant type
                  </small>

                  <strong>
                    {resultParticipantType ===
                    "member"
                      ? "JVP member"
                      : "Public participant"}
                  </strong>
                </span>
              </div>

              <div>
                <CalendarDays
                  size={19}
                />

                <span>
                  <small>
                    Summit date
                  </small>

                  <strong>
                    {formatDate(
                      summitDate
                    )}
                  </strong>
                </span>
              </div>

              <div>
                <MapPin size={19} />

                <span>
                  <small>Venue</small>

                  <strong>
                    {
                      venue.displayText
                    }
                  </strong>
                </span>
              </div>

              <div>
                <ShieldCheck
                  size={19}
                />

                <span>
                  <small>Status</small>

                  <strong>
                    {formatStatus(
                      status
                    )}
                  </strong>
                </span>
              </div>

              {ticketNumber && (
                <div>
                  <Ticket size={19} />

                  <span>
                    <small>
                      Ticket number
                    </small>

                    <strong>
                      {ticketNumber}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            <div className="summit-registration-success-note">
              <Mail size={19} />

              <p>
                Confirmation and ticket
                information will be sent
                to{" "}
                <strong>
                  {
                    submittedRegistration
                      ?.email
                  }
                </strong>
                . Check both your inbox
                and spam folder.
              </p>
            </div>

            <div className="summit-registration-success-actions">
              <Link
                to="/summit/ticket"
                className="primary"
              >
                <Ticket size={18} />
                Retrieve ticket
              </Link>

              <Link to="/summit">
                Summit information
                <ArrowRight size={18} />
              </Link>

              <button
                type="button"
                onClick={
                  handleNewRegistration
                }
              >
                Register another
                participant
              </button>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  }

  /* ========================================
     REGISTRATION FORM
  ======================================== */

  return (
    <>
      <Navbar />

      <main className="summit-registration-page">
        <section className="summit-registration-hero">
          <div className="summit-registration-container">
            <Link
              to="/summit"
              className="summit-registration-back"
            >
              <ArrowLeft size={17} />
              Summit information
            </Link>

            <div className="summit-registration-hero-grid">
              <div>
                <span className="summit-registration-kicker">
  Summit registration
</span>

                <h1>
                  Register for{" "}
                  {summitTitle}
                </h1>

                <p>
                  Complete the form
                  using your correct
                  identification,
                  contact and location
                  information.
                </p>
              </div>

              <aside className="summit-registration-event-card">
                <div>
                  <CalendarDays
                    size={21}
                  />

                  <span>
                    <small>
                      Summit date
                    </small>

                    <strong>
                      {formatDate(
                        summitDate
                      )}
                    </strong>
                  </span>
                </div>

                <div>
                  <MapPin size={21} />

                  <span>
                    <small>Venue</small>

                    <strong>
                      {
                        venue.displayText
                      }
                    </strong>
                  </span>
                </div>

                <div>
                  <Ticket size={21} />

                  <span>
                    <small>
                      Registration
                    </small>

                    <strong>Open</strong>
                  </span>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="summit-registration-content">
          <div className="summit-registration-container">

            {profileMessage && (
              <div className="summit-registration-profile-message">
                <CheckCircle2
                  size={17}
                />

                <span>
                  {profileMessage}
                </span>
              </div>
            )}

            <div className="summit-registration-layout">
              <form
                className="summit-registration-form"
                onSubmit={handleSubmit}
                noValidate
              >
                {registrationError && (
                  <div
                    className="summit-registration-alert"
                    role="alert"
                  >
                    <AlertCircle
                      size={19}
                    />

                    <span>
                      {
                        registrationError
                      }
                    </span>
                  </div>
                )}

                {registrationSuccess && (
                  <div
                    className="summit-registration-alert success"
                    role="status"
                  >
                    <CheckCircle2
                      size={19}
                    />

                    <span>
                      {
                        registrationSuccess
                      }
                    </span>
                  </div>
                )}

                {/* PARTICIPANT DETAILS */}

                <section className="summit-registration-form-section">
                  <header>
                    <span>
                      <User size={21} />
                    </span>

                    <div>
                      <small>
                        Section 01
                      </small>

                      <h2>
                        Participant
                        details
                      </h2>

                      <p>
                        Provide your
                        name, contact and
                        identification
                        information.
                      </p>
                    </div>
                  </header>

                  <div className="summit-registration-form-grid">
                    <FormField
                      label="Full name"
                      required
                      error={
                        errors.fullName
                      }
                      className="full-width"
                    >
                      <input
                        type="text"
                        name="fullName"
                        value={
                          form.fullName
                        }
                        onChange={
                          handleChange
                        }
                        minLength="3"
                        maxLength="150"
                        autoComplete="name"
                        placeholder="Enter your full name"
                      />
                    </FormField>

                    <FormField
                      label="Email address"
                      required
                      error={
                        errors.email
                      }
                    >
                      <input
                        type="email"
                        name="email"
                        value={
                          form.email
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="email"
                        placeholder="name@example.com"
                      />
                    </FormField>

                    <FormField
                      label="Phone number"
                      required
                      error={
                        errors.phone
                      }
                      hint="Example: 0712345678"
                    >
                      <input
                        type="tel"
                        name="phone"
                        value={
                          form.phone
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="tel"
                        placeholder="0712345678"
                      />
                    </FormField>

                    <FormField
                      label="National ID or passport number"
                      required
                      error={
                        errors.nationalId
                      }
                      hint="This is used to prevent duplicate summit registrations."
                      className="full-width"
                    >
                      <input
                        type="text"
                        name="nationalId"
                        value={
                          form.nationalId
                        }
                        onChange={
                          handleChange
                        }
                        autoComplete="off"
                        placeholder="Enter National ID or passport number"
                      />
                    </FormField>
                  </div>
                </section>

                {/* LOCATION */}

                <section className="summit-registration-form-section">
                  <header>
                    <span>
                      <MapPin size={21} />
                    </span>

                    <div>
                      <small>
                        Section 02
                      </small>

                      <h2>
                        Location details
                      </h2>

                      <p>
                        Select your
                        Coast county and
                        provide your
                        constituency and
                        ward.
                      </p>
                    </div>
                  </header>

                  <div className="summit-registration-form-grid">
                    <FormField
                      label="County"
                      required
                      error={
                        errors.county
                      }
                    >
                      <select
                        name="county"
                        value={
                          form.county
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select county
                        </option>

                        {COUNTY_OPTIONS.map(
                          (county) => (
                            <option
                              key={
                                county.code
                              }
                              value={
                                county.name
                              }
                            >
                              {
                                county.name
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

                    <FormField
                      label="County code"
                      hint="Automatically assigned"
                    >
                      <input
                        type="text"
                        value={
                          getCountyCode(
                            form.county
                          )
                        }
                        placeholder="County code"
                        disabled
                        readOnly
                      />
                    </FormField>

                    <FormField
                      label="Constituency"
                      required
                      error={
                        errors.constituency
                      }
                    >
                      <input
                        type="text"
                        name="constituency"
                        value={
                          form.constituency
                        }
                        onChange={
                          handleChange
                        }
                        maxLength="100"
                        placeholder="Enter constituency"
                      />
                    </FormField>

                    <FormField
                      label="Ward"
                      required
                      error={
                        errors.ward
                      }
                    >
                      <input
                        type="text"
                        name="ward"
                        value={
                          form.ward
                        }
                        onChange={
                          handleChange
                        }
                        maxLength="100"
                        placeholder="Enter ward"
                      />
                    </FormField>
                  </div>
                </section>

                {/* CONSENT */}

                <section className="summit-registration-form-section">
                  <header>
                    <span>
                      <ShieldCheck
                        size={21}
                      />
                    </span>

                    <div>
                      <small>
                        Section 03
                      </small>

                      <h2>
                        Registration
                        consent
                      </h2>

                      <p>
                        Confirm the two
                        declarations
                        required by the
                        summit
                        registration
                        model.
                      </p>
                    </div>
                  </header>

                  <div className="summit-registration-checkbox-list">
                    <div
                      className={`summit-registration-checkbox-card ${
                        errors.acceptedTerms
                          ? "has-error"
                          : ""
                      }`}
                    >
                      <label>
                        <input
                          type="checkbox"
                          name="acceptedTerms"
                          checked={
                            form.acceptedTerms
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <span>
                          <strong>
                            I accept the
                            summit
                            registration
                            terms
                            <b>*</b>
                          </strong>

                          <small>
                            I confirm
                            that the
                            information
                            submitted is
                            accurate and
                            may be used
                            for summit
                            administration,
                            security and
                            ticketing.
                          </small>
                        </span>
                      </label>

                      {errors.acceptedTerms && (
                        <small className="summit-registration-checkbox-error">
                          <AlertCircle
                            size={13}
                          />

                          {
                            errors.acceptedTerms
                          }
                        </small>
                      )}
                    </div>

                    <div
                      className={`summit-registration-checkbox-card ${
                        errors
                          .consentedToCommunication
                          ? "has-error"
                          : ""
                      }`}
                    >
                      <label>
                        <input
                          type="checkbox"
                          name="consentedToCommunication"
                          checked={
                            form
                              .consentedToCommunication
                          }
                          onChange={
                            handleChange
                          }
                        />

                        <span>
                          <strong>
                            I consent to
                            receiving
                            summit
                            communication
                            <b>*</b>
                          </strong>

                          <small>
                            JVP may send
                            registration,
                            ticket and
                            logistics
                            information
                            through email
                            or SMS.
                          </small>
                        </span>
                      </label>

                      {errors
                        .consentedToCommunication && (
                        <small className="summit-registration-checkbox-error">
                          <AlertCircle
                            size={13}
                          />

                          {
                            errors
                              .consentedToCommunication
                          }
                        </small>
                      )}
                    </div>
                  </div>
                </section>

                <div className="summit-registration-submit-area">
                  <div>
                    <ShieldCheck
                      size={18}
                    />

                    <p>
                      Ticket numbers,
                      county slot
                      numbers,
                      verification
                      codes and ticket
                      documents should
                      be generated by
                      the backend.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      registrationLoading
                    }
                  >
                    {registrationLoading ? (
                      <LoaderCircle
                        size={19}
                        className="summit-registration-spinning"
                      />
                    ) : (
                      <CheckCircle2
                        size={19}
                      />
                    )}

                    {registrationLoading
                      ? "Submitting..."
                      : "Complete registration"}
                  </button>
                </div>
              </form>

              <aside className="summit-registration-sidebar">

                <section>
                  <span>
                    <Ticket size={22} />
                  </span>

                  <h2>
                    What happens next?
                  </h2>

                  <ol>
                    <li>
                      Submit the
                      completed form.
                    </li>

                    <li>
                      The backend
                      verifies your
                      summit and county
                      slot.
                    </li>

                    <li>
                      A unique ticket
                      number and
                      verification code
                      are generated.
                    </li>

                    <li>
                      Confirmation and
                      ticket details are
                      sent to your
                      email.
                    </li>
                  </ol>
                </section>

                <section>
                  <span>
                    <Mail size={22} />
                  </span>

                  <h2>
                    Already registered?
                  </h2>

                  <p>
                    Use the ticket
                    lookup page to
                    retrieve your
                    summit ticket.
                  </p>

                  <Link to="/summit/ticket">
                    Find my ticket
                    <ArrowRight
                      size={17}
                    />
                  </Link>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SummitRegistration;