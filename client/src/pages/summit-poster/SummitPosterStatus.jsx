import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Image,
  LoaderCircle,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  checkPosterStatus,
  getPosterDownloadUrl,
} from "../../services/summitPoster.service";

import "./SummitPosterStatus.css";

/* ==========================================================
   INITIAL STATE
========================================================== */

const INITIAL_FORM = {
  posterReference: "",
  email: "",
  phoneNumber: "",
};

/* ==========================================================
   STATUS CONFIGURATION
========================================================== */

const STATUS_CONFIG = {
  pending_payment: {
    label: "Pending payment",
    description:
      "Your poster request has been created, but payment details have not yet been submitted.",
    icon: Clock3,
    tone: "warning",
  },

  payment_submitted: {
    label: "Payment submitted",
    description:
      "Your M-Pesa transaction code has been received and is awaiting verification.",
    icon: ShieldCheck,
    tone: "info",
  },

  approved: {
    label: "Payment confirmed",
    description:
      "Your payment has been confirmed. Your personalized poster is ready to be generated.",
    icon: CheckCircle2,
    tone: "success",
  },

  generating: {
    label: "Poster generating",
    description:
      "Your personalized attendance poster is currently being generated.",
    icon: RefreshCw,
    tone: "info",
  },

  ready: {
    label: "Poster ready",
    description:
      "Your personalized Coast Youth Summit poster is ready to preview and download.",
    icon: CheckCircle2,
    tone: "success",
  },

  downloaded: {
    label: "Poster downloaded",
    description:
      "Your poster has already been generated and remains available for download.",
    icon: Download,
    tone: "success",
  },

  rejected: {
    label: "Payment rejected",
    description:
      "The submitted payment details could not be verified. Review the reason below and contact the summit team.",
    icon: XCircle,
    tone: "danger",
  },
};

/* ==========================================================
   HELPERS
========================================================== */

const getResponsePayload = (
  response
) => {
  return (
    response?.data ||
    response ||
    {}
  );
};

const getStatusData = (
  response
) => {
  const payload =
    getResponsePayload(
      response
    );

  return (
    payload?.data ||
    payload ||
    null
  );
};

const normalizePhoneInput = (
  value
) => {
  return String(value || "")
    .replace(/[^\d+]/g, "")
    .slice(0, 13);
};

const formatAmount = (
  value
) => {
  return new Intl.NumberFormat(
    "en-KE"
  ).format(
    Number(value) || 0
  );
};

const formatDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
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

const getImageUrl = (
  image
) => {
  return (
    image?.secureUrl ||
    image?.url ||
    ""
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

export default function SummitPosterStatus() {
  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    statusData,
    setStatusData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    copiedField,
    setCopiedField,
  ] = useState("");

  /* ========================================================
     RESOLVED STATUS
  ======================================================== */

  const statusConfig =
    useMemo(() => {
      return (
        STATUS_CONFIG[
          statusData?.status
        ] || {
          label:
            statusData?.status ||
            "Unknown status",

          description:
            "The current poster request status could not be determined.",

          icon:
            AlertCircle,

          tone:
            "neutral",
        }
      );
    }, [
      statusData,
    ]);

  const StatusIcon =
    statusConfig.icon;

  const previewUrl =
    getImageUrl(
      statusData
        ?.previewPoster
    );

  const finalPosterUrl =
    getImageUrl(
      statusData
        ?.finalPoster
    );

  const downloadUrl =
    statusData
      ?.downloadToken
      ? getPosterDownloadUrl(
          statusData.downloadToken
        )
      : "";

  const posterAvailable =
    Boolean(
      downloadUrl &&
      [
        "ready",
        "downloaded",
      ].includes(
        statusData?.status
      )
    );

  /* ========================================================
     FORM HANDLERS
  ======================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,

        [name]:
          name ===
          "phoneNumber"
            ? normalizePhoneInput(
                value
              )
            : value,
      })
    );

    setError("");
  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm = () => {
    if (
      !form.posterReference
        .trim()
    ) {
      return "Enter your poster reference.";
    }

    if (
      !form.email.trim() &&
      !form.phoneNumber.trim()
    ) {
      return "Enter either your email address or phone number.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Enter a valid email address.";
    }

    if (
      form.phoneNumber.trim() &&
      !/^(\+254|254|0)?(7\d{8}|1\d{8})$/.test(
        form.phoneNumber.trim()
      )
    ) {
      return "Enter a valid Kenyan mobile phone number.";
    }

    return "";
  };

  /* ========================================================
     STATUS LOOKUP
  ======================================================== */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await checkPosterStatus({
            posterReference:
              form.posterReference
                .trim()
                .toUpperCase(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            phoneNumber:
              form.phoneNumber
                .trim(),
          });

        setStatusData(
          getStatusData(
            response
          )
        );
      } catch (requestError) {
        setStatusData(null);

        setError(
          requestError?.message ||
          "Unable to retrieve your poster status."
        );
      } finally {
        setLoading(false);
      }
    };

  /* ========================================================
     COPY
  ======================================================== */

  const copyValue =
    async (
      value,
      field
    ) => {
      if (!value) {
        return;
      }

      try {
        await navigator
          .clipboard
          .writeText(
            String(value)
          );

        setCopiedField(
          field
        );

        window.setTimeout(
          () => {
            setCopiedField(
              ""
            );
          },
          1800
        );
      } catch {
        setCopiedField("");
      }
    };

  /* ========================================================
     SHARE
  ======================================================== */

  const sharePoster =
    async () => {
      if (
        !finalPosterUrl &&
        !downloadUrl
      ) {
        return;
      }

      const shareUrl =
        finalPosterUrl ||
        downloadUrl;

      const shareText =
        `I will be attending the Coast Youth Summit 2026. ${shareUrl}`;

      if (
        navigator.share
      ) {
        try {
          await navigator.share({
            title:
              "Coast Youth Summit 2026",

            text:
              "I will be attending the Coast Youth Summit 2026.",

            url:
              shareUrl,
          });

          return;
        } catch {
          return;
        }
      }

      const whatsappUrl =
        `https://wa.me/?text=${encodeURIComponent(
          shareText
        )}`;

      window.open(
        whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    };

  /* ========================================================
     RESET
  ======================================================== */

  const resetSearch = () => {
    setStatusData(null);
    setError("");
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <main className="summit-poster-status-page">
      <section className="summit-poster-status-hero">
        <div className="summit-poster-status-hero-content">
          <a
            href="/summit"
            className="summit-poster-status-back-link"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Back to summit
          </a>

          <span>
            Coast Youth Summit 2026
          </span>

          <h1>
            Check your poster status
          </h1>

          <p>
            Enter your poster reference together
            with the email address or phone number
            used during registration.
          </p>
        </div>
      </section>

      <section className="summit-poster-status-content">
        <div className="summit-poster-status-container">
          <div className="summit-poster-status-layout">
            <form
              className="summit-poster-status-search-card"
              onSubmit={
                handleSubmit
              }
            >
              <div className="summit-poster-status-search-heading">
                <span>
                  Poster lookup
                </span>

                <h2>
                  Find your request
                </h2>

                <p>
                  You can use either your email
                  address or phone number.
                </p>
              </div>

              <label>
                <span>
                  Poster reference
                </span>

                <input
                  type="text"
                  name="posterReference"
                  value={
                    form.posterReference
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="CYS-POSTER-2026-XXXXXX"
                  autoComplete="off"
                />
              </label>

              <div className="summit-poster-status-divider">
                <span>
                  and
                </span>
              </div>

              <label>
                <span>
                  Email address
                </span>

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              <div className="summit-poster-status-or">
                or
              </div>

              <label>
                <span>
                  Phone number
                </span>

                <input
                  type="tel"
                  name="phoneNumber"
                  value={
                    form.phoneNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="07XXXXXXXX"
                  autoComplete="tel"
                />
              </label>

              {error && (
                <div className="summit-poster-status-error">
                  <AlertCircle
                    size={18}
                    aria-hidden="true"
                  />

                  <span>
                    {error}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading
                }
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="summit-poster-status-spin"
                      aria-hidden="true"
                    />

                    Checking...
                  </>
                ) : (
                  <>
                    <Search
                      size={18}
                      aria-hidden="true"
                    />

                    Check status
                  </>
                )}
              </button>

              <small>
                Your poster details are protected
                and only shown when the supplied
                information matches the request.
              </small>
            </form>

            <section className="summit-poster-status-result-card">
              {!statusData ? (
                <div className="summit-poster-status-placeholder">
                  <div>
                    <Image
                      size={42}
                      aria-hidden="true"
                    />
                  </div>

                  <h2>
                    Your poster status will
                    appear here
                  </h2>

                  <p>
                    Enter your reference and
                    participant details to see
                    payment verification and poster
                    availability.
                  </p>
                </div>
              ) : (
                <>
                  <header className="summit-poster-status-result-header">
                    <div
                      className={`summit-poster-status-icon tone-${statusConfig.tone}`}
                    >
                      <StatusIcon
                        size={26}
                        className={
                          statusData.status ===
                          "generating"
                            ? "summit-poster-status-spin"
                            : ""
                        }
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <span>
                        Current status
                      </span>

                      <h2>
                        {statusConfig.label}
                      </h2>

                      <p>
                        {
                          statusConfig.description
                        }
                      </p>
                    </div>
                  </header>

                  <div className="summit-poster-status-details">
                    <div>
                      <small>
                        Participant
                      </small>

                      <strong>
                        {
                          statusData.fullName
                        }
                      </strong>
                    </div>

                    <div>
                      <small>
                        County
                      </small>

                      <strong>
                        {
                          statusData.county
                        }
                      </strong>
                    </div>

                    <div>
                      <small>
                        Poster reference
                      </small>

                      <div className="summit-poster-status-copy-row">
                        <strong>
                          {
                            statusData.posterReference
                          }
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            copyValue(
                              statusData.posterReference,
                              "reference"
                            )
                          }
                        >
                          <Copy
                            size={15}
                            aria-hidden="true"
                          />

                          {copiedField ===
                          "reference"
                            ? "Copied"
                            : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <small>
                        Amount
                      </small>

                      <strong>
                        KES{" "}
                        {formatAmount(
                          statusData.amount
                        )}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Till Number
                      </small>

                      <div className="summit-poster-status-copy-row">
                        <strong>
                          {
                            statusData.tillNumber
                          }
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            copyValue(
                              statusData.tillNumber,
                              "till"
                            )
                          }
                        >
                          <Copy
                            size={15}
                            aria-hidden="true"
                          />

                          {copiedField ===
                          "till"
                            ? "Copied"
                            : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <small>
                        Request created
                      </small>

                      <strong>
                        {formatDate(
                          statusData.createdAt
                        )}
                      </strong>
                    </div>
                  </div>

                  {statusData
                    .paymentRejectedReason && (
                    <div className="summit-poster-status-rejection">
                      <XCircle
                        size={19}
                        aria-hidden="true"
                      />

                      <div>
                        <strong>
                          Payment rejection reason
                        </strong>

                        <p>
                          {
                            statusData
                              .paymentRejectedReason
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {previewUrl && (
                    <div className="summit-poster-status-preview">
                      <div className="summit-poster-status-preview-heading">
                        <div>
                          <span>
                            Poster preview
                          </span>

                          <h3>
                            Your personalized
                            attendance poster
                          </h3>
                        </div>

                        <a
                          href={
                            previewUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink
                            size={16}
                            aria-hidden="true"
                          />

                          Open preview
                        </a>
                      </div>

                      <div className="summit-poster-status-preview-image">
                        <img
                          src={
                            previewUrl
                          }
                          alt={`Attendance poster preview for ${statusData.fullName}`}
                        />
                      </div>
                    </div>
                  )}

                  {posterAvailable && (
                    <div className="summit-poster-status-actions">
                      <a
                        href={
                          downloadUrl
                        }
                        className="primary"
                      >
                        <Download
                          size={18}
                          aria-hidden="true"
                        />

                        Download final poster
                      </a>

                      <button
                        type="button"
                        onClick={
                          sharePoster
                        }
                      >
                        <Share2
                          size={18}
                          aria-hidden="true"
                        />

                        Share poster
                      </button>

                      {finalPosterUrl && (
                        <a
                          href={
                            finalPosterUrl
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink
                            size={18}
                            aria-hidden="true"
                          />

                          Open full poster
                        </a>
                      )}
                    </div>
                  )}

                  <footer className="summit-poster-status-result-footer">
                    <button
                      type="button"
                      onClick={
                        resetSearch
                      }
                    >
                      Check another poster
                    </button>
                  </footer>
                </>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}