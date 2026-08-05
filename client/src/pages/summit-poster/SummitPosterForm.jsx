import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ImagePlus,
  LoaderCircle,
  ReceiptText,
  ShieldCheck,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  createPosterRequest,
  submitPosterPayment,
} from "../../services/summitPoster.service";

import "./SummitPosterForm.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const COUNTIES = [
  "Kilifi",
  "Mombasa",
  "Kwale",
  "Taita Taveta",
  "Tana River",
  "Lamu",
];

const INITIAL_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  county: "",
  socialHandle: "",
  consentAccepted: false,
};

const MAX_FILE_SIZE =
  2 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

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

const getPosterData = (
  response
) => {
  const payload =
    getResponsePayload(
      response
    );

  return (
    payload?.poster ||
    payload?.data?.poster ||
    null
  );
};

const getPaymentInstructions = (
  response
) => {
  const payload =
    getResponsePayload(
      response
    );

  return (
    payload
      ?.paymentInstructions ||
    payload?.data
      ?.paymentInstructions ||
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

/* ==========================================================
   COMPONENT
========================================================== */

export default function SummitPosterForm() {
  const fileInputRef =
    useRef(null);

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM
  );

  const [
    photo,
    setPhoto,
  ] = useState(null);

  const [
    photoPreview,
    setPhotoPreview,
  ] = useState("");

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    posterRequest,
    setPosterRequest,
  ] = useState(null);

  const [
    paymentInstructions,
    setPaymentInstructions,
  ] = useState(null);

  const [
    transactionCode,
    setTransactionCode,
  ] = useState("");

  const [
    paymentError,
    setPaymentError,
  ] = useState("");

  const [
    paymentSubmitting,
    setPaymentSubmitting,
  ] = useState(false);

  const [
    paymentSubmitted,
    setPaymentSubmitted,
  ] = useState(false);

  const [
    copiedField,
    setCopiedField,
  ] = useState("");

  /* ========================================================
     PHOTO PREVIEW
  ======================================================== */

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return undefined;
    }

    const previewUrl =
      URL.createObjectURL(
        photo
      );

    setPhotoPreview(
      previewUrl
    );

    return () => {
      URL.revokeObjectURL(
        previewUrl
      );
    };
  }, [photo]);

  /* ========================================================
     RESOLVED DETAILS
  ======================================================== */

  const posterReference =
    useMemo(() => {
      return (
        paymentInstructions
          ?.posterReference ||
        posterRequest
          ?.posterReference ||
        ""
      );
    }, [
      paymentInstructions,
      posterRequest,
    ]);

 const tillNumber =
  paymentInstructions?.tillNumber ||
  posterRequest?.tillNumber ||
  "1549087";

  const amount =
    paymentInstructions
      ?.amount ||
    posterRequest
      ?.amount ||
    50;

  /* ========================================================
     FIELD HANDLERS
  ======================================================== */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          "checkbox"
            ? checked
            : name ===
              "phoneNumber"
              ? normalizePhoneInput(
                  value
                )
              : value,
      })
    );

    setFormError("");
  };

  const handlePhotoChange = (
    event
  ) => {
    const selectedFile =
      event.target
        .files?.[0];

    if (!selectedFile) {
      return;
    }

    if (
      !ALLOWED_FILE_TYPES.includes(
        selectedFile.type
      )
    ) {
      setFormError(
        "Upload a JPG, JPEG, PNG or WebP image."
      );

      event.target.value =
        "";

      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setFormError(
        "The photo cannot exceed 2 MB."
      );

      event.target.value =
        "";

      return;
    }

    setPhoto(
      selectedFile
    );

    setFormError("");
  };

  const removePhoto = () => {
    setPhoto(null);

    if (
      fileInputRef.current
    ) {
      fileInputRef.current.value =
        "";
    }
  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm = () => {
    if (
      form.fullName
        .trim()
        .length < 3
    ) {
      return "Enter your full name.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Enter a valid email address.";
    }

    if (
      !/^(\+254|254|0)?(7\d{8}|1\d{8})$/.test(
        form.phoneNumber.trim()
      )
    ) {
      return "Enter a valid Kenyan mobile phone number.";
    }

    if (
      !COUNTIES.includes(
        form.county
      )
    ) {
      return "Select your county.";
    }

    if (!photo) {
      return "Upload your participant photo.";
    }

    if (
      !form.consentAccepted
    ) {
      return "You must consent to the use of your photo for poster generation.";
    }

    return "";
  };

  /* ========================================================
     CREATE REQUEST
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
        setFormError(
          validationError
        );

        return;
      }

      try {
        setSubmitting(true);
        setFormError("");

        const response =
          await createPosterRequest({
            fullName:
              form.fullName.trim(),

            email:
              form.email.trim(),

            phoneNumber:
              form.phoneNumber.trim(),

            county:
              form.county,

            socialHandle:
              form.socialHandle.trim(),

            consentAccepted:
              form.consentAccepted,

            photo,
          });

        const createdPoster =
          getPosterData(
            response
          );

        const instructions =
          getPaymentInstructions(
            response
          );

        setPosterRequest(
          createdPoster
        );

        setPaymentInstructions(
          instructions
        );
      } catch (error) {
        setFormError(
          error?.message ||
          "Unable to create your poster request."
        );
      } finally {
        setSubmitting(false);
      }
    };

  /* ========================================================
     PAYMENT SUBMISSION
  ======================================================== */

  const handlePaymentSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      const normalizedCode =
        transactionCode
          .trim()
          .toUpperCase();

      if (
        !/^[A-Z0-9]{10}$/.test(
          normalizedCode
        )
      ) {
        setPaymentError(
          "Enter the 10-character M-Pesa transaction code."
        );

        return;
      }

      try {
        setPaymentSubmitting(
          true
        );

        setPaymentError("");

        await submitPosterPayment({
          posterReference,
          transactionCode:
            normalizedCode,
        });

        setPaymentSubmitted(
          true
        );
      } catch (error) {
        setPaymentError(
          error?.message ||
          "Unable to submit the transaction code."
        );
      } finally {
        setPaymentSubmitting(
          false
        );
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
     RESET
  ======================================================== */

  const startAnotherRequest =
    () => {
      setForm(
        INITIAL_FORM
      );

      setPhoto(null);
      setPosterRequest(null);
      setPaymentInstructions(null);
      setTransactionCode("");
      setPaymentSubmitted(false);
      setFormError("");
      setPaymentError("");

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* ========================================================
     SUCCESS VIEW
  ======================================================== */

  if (
    paymentSubmitted
  ) {
    return (
      <main className="summit-poster-page">
        <section className="summit-poster-success">
          <div className="summit-poster-success-icon">
            <CheckCircle2
              size={42}
              aria-hidden="true"
            />
          </div>

          <span>
            Payment submitted
          </span>

          <h1>
            Your payment is awaiting
            confirmation
          </h1>

          <p>
            The JVP team will verify your
            M-Pesa payment. Your personalized
            summit poster will be generated
            after confirmation.
          </p>

          <div className="summit-poster-success-reference">
            <small>
              Poster reference
            </small>

            <strong>
              {posterReference}
            </strong>
          </div>

          <div className="summit-poster-success-actions">
            <a href="/summit/poster/status">
              Check poster status
            </a>

            <button
              type="button"
              onClick={
                startAnotherRequest
              }
            >
              Create another poster
            </button>
          </div>
        </section>
      </main>
    );
  }

  /* ========================================================
     PAYMENT VIEW
  ======================================================== */

  if (
    posterRequest ||
    paymentInstructions
  ) {
    return (
      <main className="summit-poster-page">
        <section className="summit-poster-payment-shell">
          <button
            type="button"
            className="summit-poster-back-button"
            onClick={
              startAnotherRequest
            }
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Start again
          </button>

          <div className="summit-poster-payment-heading">
            <span>
              Complete payment
            </span>

            <h1>
              Pay KES{" "}
              {formatAmount(
                amount
              )} to continue
            </h1>

            <p>
              Use M-Pesa Buy Goods and Services,
              then submit the transaction code
              below.
            </p>
          </div>

          <div className="summit-poster-payment-layout">
            <article className="summit-poster-payment-card">
              <div className="summit-poster-payment-card-icon">
                <ReceiptText
                  size={26}
                  aria-hidden="true"
                />
              </div>

              <small>
                Lipa na M-Pesa
              </small>

              <h2>
                Buy Goods and Services
              </h2>

              <div className="summit-poster-payment-detail">
                <span>
                  Till Number
                </span>

                <div>
                  <strong>
                    {tillNumber}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copyValue(
                        tillNumber,
                        "till"
                      )
                    }
                  >
                    <Copy
                      size={16}
                      aria-hidden="true"
                    />

                    {copiedField ===
                    "till"
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>
              </div>

              <div className="summit-poster-payment-detail">
                <span>
                  Amount
                </span>

                <div>
                  <strong>
                    KES{" "}
                    {formatAmount(
                      amount
                    )}
                  </strong>
                </div>
              </div>

              <div className="summit-poster-payment-detail">
                <span>
                  Poster reference
                </span>

                <div>
                  <strong>
                    {posterReference}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copyValue(
                        posterReference,
                        "reference"
                      )
                    }
                  >
                    <Copy
                      size={16}
                      aria-hidden="true"
                    />

                    {copiedField ===
                    "reference"
                      ? "Copied"
                      : "Copy"}
                  </button>
                </div>
              </div>

              <ol className="summit-poster-payment-steps">
                <li>
                  Open the M-Pesa menu.
                </li>

                <li>
                  Select Lipa na M-Pesa.
                </li>

                <li>
                  Select Buy Goods and Services.
                </li>

                <li>
                  Enter Till Number{" "}
                  <strong>
                    {tillNumber}
                  </strong>
                  .
                </li>

                <li>
                  Enter KES{" "}
                  <strong>
                    {formatAmount(
                      amount
                    )}
                  </strong>
                  .
                </li>
              </ol>
            </article>

            <form
              className="summit-poster-code-form"
              onSubmit={
                handlePaymentSubmit
              }
            >
              <div>
                <span>
                  Submit payment
                </span>

                <h2>
                  Enter your M-Pesa code
                </h2>

                <p>
                  Copy the transaction code from
                  your M-Pesa confirmation
                  message.
                </p>
              </div>

              <label>
                <span>
                  M-Pesa transaction code
                </span>

                <input
                  type="text"
                  value={
                    transactionCode
                  }
                  onChange={(
                    event
                  ) => {
                    setTransactionCode(
                      event.target
                        .value
                        .toUpperCase()
                        .replace(
                          /[^A-Z0-9]/g,
                          ""
                        )
                        .slice(
                          0,
                          10
                        )
                    );

                    setPaymentError(
                      ""
                    );
                  }}
                  placeholder="e.g. TH5K8LM9P2"
                  maxLength={10}
                  autoComplete="off"
                />
              </label>

              {paymentError && (
                <div className="summit-poster-form-error">
                  {paymentError}
                </div>
              )}

              <button
                type="submit"
                className="summit-poster-primary-button"
                disabled={
                  paymentSubmitting
                }
              >
                {paymentSubmitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="summit-poster-spin"
                      aria-hidden="true"
                    />

                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck
                      size={18}
                      aria-hidden="true"
                    />

                    Submit payment code
                  </>
                )}
              </button>

              <small className="summit-poster-payment-note">
                Your poster will only be released
                after the JVP team confirms the
                payment.
              </small>
            </form>
          </div>
        </section>
      </main>
    );
  }

  /* ========================================================
     FORM VIEW
  ======================================================== */

  return (
    <main className="summit-poster-page">
      <section className="summit-poster-hero">
        <div className="summit-poster-hero-content">
          <a
            href="/summit"
            className="summit-poster-return-link"
          >
            <ArrowLeft
              size={17}
              aria-hidden="true"
            />

            Back to summit
          </a>

          <span className="summit-poster-eyebrow">
            Coast Youth Summit 2026
          </span>

          <h1>
            Create your “I Will Be
            Attending” poster
          </h1>

          <p>
            Upload your photo, pay KES 50
            through the official Till Number
            and receive a personalized summit
            poster ready for sharing.
          </p>

          <div className="summit-poster-benefits">
            <span>
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              Personalized design
            </span>

            <span>
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              High-quality download
            </span>

            <span>
              <CheckCircle2
                size={17}
                aria-hidden="true"
              />

              Secure payment verification
            </span>
          </div>
        </div>
      </section>

      <section className="summit-poster-form-section">
        <div className="summit-poster-container">
          <div className="summit-poster-form-layout">
            <aside className="summit-poster-preview-card">
              <div className="summit-poster-preview-heading">
                <span>
                  Photo preview
                </span>

                <h2>
                  Choose a clear portrait
                </h2>

                <p>
                  Use a well-lit photo with your
                  face clearly visible.
                </p>
              </div>

              <button
                type="button"
                className={`summit-poster-photo-picker ${
                  photoPreview
                    ? "has-photo"
                    : ""
                }`}
                onClick={() =>
                  fileInputRef
                    .current
                    ?.click()
                }
              >
                {photoPreview ? (
                  <img
                    src={
                      photoPreview
                    }
                    alt="Selected participant"
                  />
                ) : (
                  <div>
                    <ImagePlus
                      size={42}
                      aria-hidden="true"
                    />

                    <strong>
                      Upload your photo
                    </strong>

                    <span>
                      JPG, PNG or WebP — maximum
                      2 MB
                    </span>
                  </div>
                )}
              </button>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handlePhotoChange
                }
                hidden
              />

              <div className="summit-poster-photo-actions">
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef
                      .current
                      ?.click()
                  }
                >
                  <Upload
                    size={16}
                    aria-hidden="true"
                  />

                  {photo
                    ? "Change photo"
                    : "Select photo"}
                </button>

                {photo && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={
                      removePhoto
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            </aside>

            <form
              className="summit-poster-form-card"
              onSubmit={
                handleSubmit
              }
            >
              <div className="summit-poster-form-heading">
                <span>
                  Participant information
                </span>

                <h2>
                  Tell us about yourself
                </h2>

                <p>
                  These details will appear on
                  your poster and help us verify
                  your payment.
                </p>
              </div>

              <div className="summit-poster-form-grid">
                <label className="full-width">
                  <span>
                    Full name
                  </span>

                  <input
                    type="text"
                    name="fullName"
                    value={
                      form.fullName
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="Enter your full name"
                    maxLength={150}
                    autoComplete="name"
                  />
                </label>

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

                <label>
                  <span>
                    County
                  </span>

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

                    {COUNTIES.map(
                      (county) => (
                        <option
                          key={
                            county
                          }
                          value={
                            county
                          }
                        >
                          {county}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  <span>
                    Social handle
                  </span>

                  <input
                    type="text"
                    name="socialHandle"
                    value={
                      form.socialHandle
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="@username (optional)"
                    maxLength={100}
                  />
                </label>
              </div>

              <label className="summit-poster-consent">
                <input
                  type="checkbox"
                  name="consentAccepted"
                  checked={
                    form.consentAccepted
                  }
                  onChange={
                    handleChange
                  }
                />

                <span>
                  I consent to JVP using my
                  uploaded photo and submitted
                  information to generate my
                  Coast Youth Summit attendance
                  poster.
                </span>
              </label>

              {formError && (
                <div className="summit-poster-form-error">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                className="summit-poster-primary-button"
                disabled={
                  submitting
                }
              >
                {submitting ? (
                  <>
                    <LoaderCircle
                      size={18}
                      className="summit-poster-spin"
                      aria-hidden="true"
                    />

                    Creating request...
                  </>
                ) : (
                  <>
                    <ImagePlus
                      size={18}
                      aria-hidden="true"
                    />

                    Continue to payment
                  </>
                )}
              </button>

              <div className="summit-poster-security-note">
                <ShieldCheck
                  size={18}
                  aria-hidden="true"
                />

                <p>
                  Your final poster will only
                  become available after payment
                  has been confirmed.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}