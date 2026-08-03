import {
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

import {
  Link,
  useSearchParams,
} from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import {
  registerSummitExhibitor,
} from "../../services/summitExhibitor.service";

import "./ExhibitorRegistration.css";

/* ==========================================================
   CONFIGURATION
========================================================== */

const SUMMIT_SLUG =
  import.meta.env.VITE_SUMMIT_SLUG ||
  "coast-youth-summit-2026";

const EXHIBITOR_PACKAGES = {
  youth: {
    id: "youth",
    name: "Youth",
    amount: 10000,
    description:
      "For youth-led enterprises, startups and community initiatives.",
  },

  bronze: {
    id: "bronze",
    name: "Bronze",
    amount: 50000,
    description:
      "An entry-level exhibition package for growing organizations and brands.",
  },

  silver: {
    id: "silver",
    name: "Silver",
    amount: 75000,
    description:
      "Enhanced exhibition visibility and engagement with summit participants.",
  },

  gold: {
    id: "gold",
    name: "Gold",
    amount: 100000,
    description:
      "A high-visibility package for institutions, companies and partners.",
  },

  premium: {
    id: "premium",
    name: "Premium",
    amount: 150000,
    description:
      "Premium exhibition positioning and maximum summit visibility.",
  },
};

const COUNTY_OPTIONS = [
  "Kilifi",
  "Mombasa",
  "Kwale",
  "Taita Taveta",
  "Tana River",
  "Lamu",
  "Other",
];

const ORGANIZATION_TYPES = [
  {
    value: "youth_enterprise",
    label: "Youth Enterprise",
  },
  {
    value: "startup",
    label: "Startup",
  },
  {
    value: "company",
    label: "Company",
  },
  {
    value: "ngo",
    label: "NGO / Development Organization",
  },
  {
    value: "government",
    label: "Government Institution",
  },
  {
    value: "educational",
    label: "Educational Institution",
  },
  {
    value: "other",
    label: "Other",
  },
];

const INITIAL_FORM = {
  organizationName: "",
  organizationType: "",
  county: "",
  contactPerson: "",
  email: "",
  phone: "",
  productsOrServices: "",
  exhibitionRequirements: "",
  acceptedTerms: false,
};

/* ==========================================================
   HELPERS
========================================================== */

const formatAmount = (amount) =>
  new Intl.NumberFormat(
    "en-KE"
  ).format(amount);

const normalizePhone = (value) => {
  const phone = String(value || "")
    .trim()
    .replace(/[\s()-]/g, "");

  if (
    /^\+254[17]\d{8}$/.test(
      phone
    )
  ) {
    return phone;
  }

  if (
    /^254[17]\d{8}$/.test(
      phone
    )
  ) {
    return `+${phone}`;
  }

  if (
    /^0[17]\d{8}$/.test(
      phone
    )
  ) {
    return `+254${phone.slice(1)}`;
  }

  return phone;
};

const getErrorMessage = (
  error
) => {
  return (
    error?.response?.data
      ?.message ||
    error?.message ||
    "The exhibitor registration could not be completed."
  );
};

/* ==========================================================
   FORM FIELD
========================================================== */

const FormField = ({
  label,
  required = false,
  error = "",
  className = "",
  children,
}) => {
  return (
    <div
      className={`exhibitor-registration-field ${className}`}
    >
      <label>
        <span className="exhibitor-registration-field-label">
          {label}

          {required && (
            <strong>*</strong>
          )}
        </span>

        {children}
      </label>

      {error && (
        <small
          className="exhibitor-registration-field-error"
          role="alert"
        >
          <AlertCircle
            size={13}
          />

          {error}
        </small>
      )}
    </div>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const ExhibitorRegistration =
  () => {
    const [searchParams] =
      useSearchParams();

    const requestedPackage =
      String(
        searchParams.get(
          "package"
        ) || "youth"
      )
        .trim()
        .toLowerCase();

    const selectedPackage =
      useMemo(
        () =>
          EXHIBITOR_PACKAGES[
            requestedPackage
          ] ||
          EXHIBITOR_PACKAGES
            .youth,
        [requestedPackage]
      );

    const [
      form,
      setForm,
    ] = useState(
      INITIAL_FORM
    );

    const [
      errors,
      setErrors,
    ] = useState({});

    const [
      loading,
      setLoading,
    ] = useState(false);

    const [
      submittedExhibitor,
      setSubmittedExhibitor,
    ] = useState(null);

    const [
      submitError,
      setSubmitError,
    ] = useState("");

    /* ========================================
       FORM CHANGE
    ======================================== */

    const handleChange = (
      event
    ) => {
      const {
        name,
        value,
        checked,
        type,
      } = event.target;

      setForm(
        (current) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

      if (errors[name]) {
        setErrors(
          (current) => ({
            ...current,
            [name]: "",
          })
        );
      }

      setSubmitError("");
    };

    /* ========================================
       VALIDATION
    ======================================== */

    const validateForm =
      () => {
        const nextErrors = {};

        if (
          !form.organizationName
            .trim()
        ) {
          nextErrors.organizationName =
            "Organization or business name is required.";
        }

        if (
          !form.organizationType
        ) {
          nextErrors.organizationType =
            "Select the organization type.";
        }

        if (!form.county) {
          nextErrors.county =
            "Select the county.";
        }

        if (
          !form.contactPerson
            .trim()
        ) {
          nextErrors.contactPerson =
            "Contact person is required.";
        }

        const email =
          form.email
            .trim()
            .toLowerCase();

        if (!email) {
          nextErrors.email =
            "Email address is required.";
        } else if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            email
          )
        ) {
          nextErrors.email =
            "Enter a valid email address.";
        }

        const phone =
          normalizePhone(
            form.phone
          );

        if (!phone) {
          nextErrors.phone =
            "Phone number is required.";
        } else if (
          !/^\+254[17]\d{8}$/.test(
            phone
          )
        ) {
          nextErrors.phone =
            "Enter a valid Kenyan mobile phone number.";
        }

        if (
          !form.productsOrServices
            .trim()
        ) {
          nextErrors.productsOrServices =
            "Describe the products or services to be exhibited.";
        }

        if (
          !form.acceptedTerms
        ) {
          nextErrors.acceptedTerms =
            "You must accept the exhibitor declaration.";
        }

        return nextErrors;
      };

    /* ========================================
       SUBMIT
    ======================================== */

    const handleSubmit =
      async (event) => {
        event.preventDefault();

        const validationErrors =
          validateForm();

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

          window.setTimeout(
            () => {
              document
                .querySelector(
                  `[name="${firstField}"]`
                )
                ?.focus();
            },
            0
          );

          return;
        }

        setErrors({});
        setSubmitError("");
        setLoading(true);

        const payload = {
          summitSlug:
            SUMMIT_SLUG,

          packageId:
            selectedPackage.id,

          organizationName:
            form.organizationName
              .trim(),

          organizationType:
            form.organizationType,

          county:
            form.county,

          contactPerson:
            form.contactPerson
              .trim(),

          email:
            form.email
              .trim()
              .toLowerCase(),

          phone:
            normalizePhone(
              form.phone
            ),

          productsOrServices:
            form.productsOrServices
              .trim(),

          exhibitionRequirements:
            form.exhibitionRequirements
              .trim(),

          acceptedTerms:
            Boolean(
              form.acceptedTerms
            ),
        };

        try {
          const response =
            await registerSummitExhibitor(
              payload
            );

          const exhibitor =
            response?.data
              ?.exhibitor ||
            response?.exhibitor ||
            response?.data ||
            null;

          if (!exhibitor) {
            throw new Error(
              "The registration was received, but the exhibitor record was not returned."
            );
          }

          setSubmittedExhibitor(
            exhibitor
          );

          window.scrollTo({
            top: 0,
            behavior:
              "smooth",
          });
        } catch (error) {
          console.error(
            "Exhibitor registration failed:",
            error
          );

          setSubmitError(
            getErrorMessage(
              error
            )
          );
        } finally {
          setLoading(false);
        }
      };

    /* ========================================
       SUCCESS
    ======================================== */

    if (
      submittedExhibitor
    ) {
      return (
        <>
          <Navbar />

          <main className="exhibitor-registration-page">
            <section className="exhibitor-registration-success">
              <div className="exhibitor-registration-success-icon">
                <CheckCircle2
                  size={45}
                />
              </div>

              <span className="exhibitor-registration-success-label">
                Registration received
              </span>

              <h1>
                Your exhibitor
                application has been
                submitted
              </h1>

              <p>
                Your request for the{" "}
                <strong>
                  {
                    selectedPackage.name
                  }
                </strong>{" "}
                package has been
                received. The summit
                team will contact you
                with approval, payment
                and exhibition details.
              </p>

              <div className="exhibitor-registration-success-grid">
                <div>
                  <small>
                    Organization
                  </small>

                  <strong>
                    {
                      submittedExhibitor
                        .organizationName
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Package
                  </small>

                  <strong>
                    {
                      submittedExhibitor
                        .packageName
                    }
                  </strong>
                </div>

                <div>
                  <small>
                    Package value
                  </small>

                  <strong>
                    KES{" "}
                    {formatAmount(
                      submittedExhibitor
                        .packageAmount
                    )}
                  </strong>
                </div>

                <div>
                  <small>
                    Status
                  </small>

                  <strong>
                    Pending review
                  </strong>
                </div>
              </div>

              <div className="exhibitor-registration-success-actions">
                <Link
                  to="/summit"
                  className="primary"
                >
                  Return to summit
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setSubmittedExhibitor(
                      null
                    );

                    setForm(
                      INITIAL_FORM
                    );
                  }}
                >
                  Submit another
                  application
                </button>
              </div>
            </section>
          </main>

          <Footer />
        </>
      );
    }

    /* ========================================
       FORM
    ======================================== */

    return (
      <>
        <Navbar />

        <main className="exhibitor-registration-page">
          <section className="exhibitor-registration-hero">
            <div className="exhibitor-registration-container">
              <Link
                to="/summit"
                className="exhibitor-registration-back"
              >
                <ArrowLeft
                  size={17}
                />

                Summit information
              </Link>

              <div className="exhibitor-registration-hero-grid">
                <div>
                  <span className="exhibitor-registration-kicker">
                    Exhibitor booking
                  </span>

                  <h1>
                    Register as a
                    summit exhibitor
                  </h1>

                  <p>
                    Complete this short
                    form and the summit
                    team will contact
                    you with approval,
                    payment and setup
                    information.
                  </p>
                </div>

                <aside className="exhibitor-registration-package">
                  <small>
                    Selected package
                  </small>

                  <h2>
                    {
                      selectedPackage.name
                    }
                  </h2>

                  <strong>
                    KES{" "}
                    {formatAmount(
                      selectedPackage.amount
                    )}
                  </strong>

                  <p>
                    {
                      selectedPackage.description
                    }
                  </p>
                </aside>
              </div>
            </div>
          </section>

          <section className="exhibitor-registration-content">
            <div className="exhibitor-registration-container exhibitor-registration-layout">
              <form
                className="exhibitor-registration-form"
                onSubmit={
                  handleSubmit
                }
                noValidate
              >
                {submitError && (
                  <div
                    className="exhibitor-registration-alert"
                    role="alert"
                  >
                    <AlertCircle
                      size={19}
                    />

                    <span>
                      {submitError}
                    </span>
                  </div>
                )}

                {/* ORGANIZATION */}

                <section className="exhibitor-registration-form-section">
                  <header>
                    <span>
                      <Building2
                        size={21}
                      />
                    </span>

                    <div>
                      <small>
                        Section 01
                      </small>

                      <h2>
                        Organization
                        details
                      </h2>
                    </div>
                  </header>

                  <div className="exhibitor-registration-form-grid">
                    <FormField
                      label="Organization or business name"
                      required
                      error={
                        errors.organizationName
                      }
                      className="full-width"
                    >
                      <input
                        type="text"
                        name="organizationName"
                        value={
                          form.organizationName
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter organization or business name"
                      />
                    </FormField>

                    <FormField
                      label="Organization type"
                      required
                      error={
                        errors.organizationType
                      }
                    >
                      <select
                        name="organizationType"
                        value={
                          form.organizationType
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="">
                          Select type
                        </option>

                        {ORGANIZATION_TYPES.map(
                          (
                            option
                          ) => (
                            <option
                              key={
                                option.value
                              }
                              value={
                                option.value
                              }
                            >
                              {
                                option.label
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>

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
                          (
                            county
                          ) => (
                            <option
                              key={
                                county
                              }
                              value={
                                county
                              }
                            >
                              {
                                county
                              }
                            </option>
                          )
                        )}
                      </select>
                    </FormField>
                  </div>
                </section>

                {/* CONTACT */}

                <section className="exhibitor-registration-form-section">
                  <header>
                    <span>
                      <UserRound
                        size={21}
                      />
                    </span>

                    <div>
                      <small>
                        Section 02
                      </small>

                      <h2>
                        Contact details
                      </h2>
                    </div>
                  </header>

                  <div className="exhibitor-registration-form-grid">
                    <FormField
                      label="Contact person"
                      required
                      error={
                        errors.contactPerson
                      }
                    >
                      <input
                        type="text"
                        name="contactPerson"
                        value={
                          form.contactPerson
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Enter full name"
                      />
                    </FormField>

                    <FormField
                      label="Email address"
                      required
                      error={
                        errors.email
                      }
                    >
                      <div className="exhibitor-registration-input-icon">
                        <Mail
                          size={17}
                        />

                        <input
                          type="email"
                          name="email"
                          value={
                            form.email
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="name@example.com"
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Phone number"
                      required
                      error={
                        errors.phone
                      }
                      className="full-width"
                    >
                      <div className="exhibitor-registration-input-icon">
                        <Phone
                          size={17}
                        />

                        <input
                          type="tel"
                          name="phone"
                          value={
                            form.phone
                          }
                          onChange={
                            handleChange
                          }
                          placeholder="0712345678 or 0112345678"
                        />
                      </div>
                    </FormField>
                  </div>
                </section>

                {/* EXHIBITION */}

                <section className="exhibitor-registration-form-section">
                  <header>
                    <span>
                      <Store
                        size={21}
                      />
                    </span>

                    <div>
                      <small>
                        Section 03
                      </small>

                      <h2>
                        Exhibition
                        information
                      </h2>
                    </div>
                  </header>

                  <div className="exhibitor-registration-form-grid">
                    <FormField
                      label="Products or services to be exhibited"
                      required
                      error={
                        errors.productsOrServices
                      }
                      className="full-width"
                    >
                      <textarea
                        name="productsOrServices"
                        rows="5"
                        value={
                          form.productsOrServices
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Briefly describe what you intend to exhibit."
                      />
                    </FormField>

                    <FormField
                      label="Special exhibition requirements"
                      className="full-width"
                    >
                      <textarea
                        name="exhibitionRequirements"
                        rows="4"
                        value={
                          form.exhibitionRequirements
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Optional: electricity, additional furniture, internet or space requirements."
                      />
                    </FormField>
                  </div>
                </section>

                {/* CONSENT */}

                <div
                  className={`exhibitor-registration-consent ${
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
                        Exhibitor
                        declaration
                      </strong>

                      <small>
                        I confirm that
                        the information
                        provided is
                        accurate and
                        understand that
                        the booking is
                        subject to
                        approval,
                        availability and
                        payment.
                      </small>
                    </span>
                  </label>

                  {errors.acceptedTerms && (
                    <small className="exhibitor-registration-consent-error">
                      <AlertCircle
                        size={13}
                      />

                      {
                        errors.acceptedTerms
                      }
                    </small>
                  )}
                </div>

                <div className="exhibitor-registration-submit-area">
                  <div>
                    <ShieldCheck
                      size={18}
                    />

                    <p>
                      Package payment
                      will only be
                      requested after
                      the summit team
                      reviews the
                      application.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircle
                        size={19}
                        className="exhibitor-registration-spinning"
                      />
                    ) : (
                      <CheckCircle2
                        size={19}
                      />
                    )}

                    {loading
                      ? "Submitting..."
                      : "Submit registration"}
                  </button>
                </div>
              </form>

              <aside className="exhibitor-registration-sidebar">
                <section>
                  <ShieldCheck
                    size={22}
                  />

                  <h2>
                    What happens next?
                  </h2>

                  <ol>
                    <li>
                      The summit team
                      reviews your
                      application.
                    </li>

                    <li>
                      The selected
                      package and space
                      are confirmed.
                    </li>

                    <li>
                      Payment
                      instructions are
                      shared.
                    </li>

                    <li>
                      Your exhibition
                      booking is
                      confirmed after
                      payment.
                    </li>
                  </ol>
                </section>

                <section>
                  <MapPin
                    size={22}
                  />

                  <h2>
                    Exhibition setup
                  </h2>

                  <p>
                    Booth allocation,
                    setup time and
                    final venue
                    instructions will
                    be communicated to
                    approved
                    exhibitors.
                  </p>
                </section>
              </aside>
            </div>
          </section>
        </main>

        <Footer />
      </>
    );
  };

export default ExhibitorRegistration;