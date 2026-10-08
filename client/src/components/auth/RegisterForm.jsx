import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
  MapPin,
  ShieldCheck,
  CreditCard,
} from "lucide-react";

import * as authService from "../../services/auth.service";

import {
  COAST_COUNTIES,
  getConstituencies,
  getWards,
} from "../../data/geography";

import "./RegisterForm.css";

const INITIAL_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  nationalId: "",
  phone: "",
  occupation: "",
  county: "",
  constituency: "",
  ward: "",
  membershipType: "ordinary",
  email: "",
  disability: {
    hasDisability: false,
    type: "",
  },
};

function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* ========================================================
     GEOGRAPHY
  ======================================================== */

  const constituencies = useMemo(() => {
    return getConstituencies(form.county);
  }, [form.county]);

  const wards = useMemo(() => {
    return getWards(
      form.county,
      form.constituency
    );
  }, [
    form.county,
    form.constituency,
  ]);

  /* ========================================================
     CHANGE HANDLER
  ======================================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setError("");
    setSuccess("");

    /* County changed */
    if (name === "county") {
      setForm((currentForm) => ({
        ...currentForm,
        county: value,
        constituency: "",
        ward: "",
      }));

      return;
    }

    /* Constituency changed */
    if (name === "constituency") {
      setForm((currentForm) => ({
        ...currentForm,
        constituency: value,
        ward: "",
      }));

      return;
    }

    /* Disability checkbox */
    if (name === "hasDisability") {
      setForm((currentForm) => ({
        ...currentForm,
        disability: {
          ...currentForm.disability,
          hasDisability: checked,
          type: checked
            ? currentForm.disability.type
            : "",
        },
      }));

      return;
    }

    /* Disability type */
    if (name === "disabilityType") {
      setForm((currentForm) => ({
        ...currentForm,
        disability: {
          ...currentForm.disability,
          type: value,
        },
      }));

      return;
    }

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  /* ========================================================
     PHONE NORMALIZATION
  ======================================================== */

  const normalizePhone = (phone) => {
    const cleanedPhone = phone
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    if (cleanedPhone.startsWith("+254")) {
      return cleanedPhone.substring(1);
    }

    if (cleanedPhone.startsWith("0")) {
      return `254${cleanedPhone.substring(1)}`;
    }

    return cleanedPhone;
  };

  /* ========================================================
     VALIDATION
  ======================================================== */

  const validateForm = () => {
    const nationalIdPattern =
      /^[0-9]{6,10}$/;

    const normalizedPhone = form.phone
      .trim()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .replace(/^\+/, "");

    const phonePattern =
      /^(?:0[17]\d{8}|254[17]\d{8})$/;

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!form.firstName.trim()) {
      return "First name is required.";
    }

    if (!form.lastName.trim()) {
      return "Last name is required.";
    }

    if (!form.gender) {
      return "Select your gender.";
    }

    if (!form.dateOfBirth) {
      return "Date of birth is required.";
    }

    const selectedDate =
      new Date(form.dateOfBirth);

    const today = new Date();

    if (
      Number.isNaN(
        selectedDate.getTime()
      )
    ) {
      return "Enter a valid date of birth.";
    }

    if (selectedDate >= today) {
      return "Date of birth must be in the past.";
    }

    if (
      !nationalIdPattern.test(
        form.nationalId.trim()
      )
    ) {
      return (
        "Enter a valid National ID containing " +
        "6 to 10 digits."
      );
    }

    if (
      !phonePattern.test(
        normalizedPhone
      )
    ) {
      return (
        "Enter a valid Kenyan phone number, " +
        "such as 0712345678, 0112345678, " +
        "254712345678, or +254112345678."
      );
    }

    if (!form.county) {
      return "Select your county.";
    }

    if (!form.constituency) {
      return "Select your constituency.";
    }

    if (!form.ward) {
      return "Select your ward.";
    }

    if (
      form.disability.hasDisability &&
      !form.disability.type.trim()
    ) {
      return "Enter the type of disability.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
    }

    if (
      !emailPattern.test(
        form.email.trim()
      )
    ) {
      return "Enter a valid email address.";
    }

    return "";
  };

  /* ========================================================
     ERROR HANDLING
  ======================================================== */

  const extractErrorMessage = (
    requestError
  ) => {
    const responseData =
      requestError?.response?.data;

    if (
      Array.isArray(
        responseData?.errors
      ) &&
      responseData.errors.length > 0
    ) {
      return responseData.errors
        .map(
          (validationError) =>
            validationError.message
        )
        .filter(Boolean)
        .join(" ");
    }

    return (
      responseData?.message ||
      requestError?.message ||
      "Registration failed. Please try again."
    );
  };

  /* ========================================================
     SUBMIT
  ======================================================== */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const payload = {
      firstName:
        form.firstName.trim(),

      middleName:
        form.middleName.trim(),

      lastName:
        form.lastName.trim(),

      gender:
        form.gender,

      dateOfBirth:
        form.dateOfBirth,

      nationalId:
        form.nationalId.trim(),

      phone:
        normalizePhone(form.phone),

      occupation:
        form.occupation.trim(),

      county:
        form.county,

      constituency:
        form.constituency,

      ward:
        form.ward,

      membershipType:
        form.membershipType,

      email:
        form.email
          .trim()
          .toLowerCase(),

      disability: {
        hasDisability:
          form.disability
            .hasDisability,

        type:
          form.disability
            .hasDisability
            ? form.disability.type.trim()
            : "",
      },
    };

    try {
      setLoading(true);

      const response =
        await authService.register(
          payload
        );

      const responseData =
        response?.data?.data ||
        response?.data;

      const registeredEmail =
        responseData?.email ||
        payload.email;

      setSuccess(
        "Registration completed. Check your email for the verification code."
      );

      navigate(
        "/verify-otp",
        {
          replace: true,
          state: {
            email:
              registeredEmail,

            purpose:
              "ACCOUNT_ACTIVATION",

            otpId:
              responseData?.otpId,

            expiresAt:
              responseData?.expiresAt,

            nextStep:
              responseData?.nextStep,
          },
        }
      );
    } catch (
      registrationError
    ) {
      console.error(
        "Registration failed:",
        registrationError
      );

      setError(
        extractErrorMessage(
          registrationError
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /* ========================================================
     RENDER
  ======================================================== */

  return (
    <form
      className="register-form"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* ====================================================
          FORM HEADING
      ==================================================== */}

      <div className="register-form-heading">
        <div className="register-form-icon">
          <UserPlus size={20} />
        </div>

        <div>
          <span className="register-eyebrow">
            STEP 1 OF YOUR JVP JOURNEY
          </span>

          <h2>
            Create your JVP account
          </h2>

          <p>
            Provide your details accurately
            to begin your JVP membership.
          </p>
        </div>
      </div>

      {/* ====================================================
          ALERTS
      ==================================================== */}

      {error && (
        <div
          className="register-alert register-alert-error"
          role="alert"
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="register-alert register-alert-success"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* ====================================================
          01 — PERSONAL INFORMATION
      ==================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>01</span>

          <div>
            <h3>
              Personal Information
            </h3>

            <p>
              Tell us about yourself.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="firstName">
              First Name
              <span>*</span>
            </label>

            <input
              id="firstName"
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              placeholder="First name"
              autoComplete="given-name"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="middleName">
              Middle Name
            </label>

            <input
              id="middleName"
              type="text"
              name="middleName"
              value={form.middleName}
              onChange={handleChange}
              placeholder="Middle name"
              autoComplete="additional-name"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">
              Last Name
              <span>*</span>
            </label>

            <input
              id="lastName"
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Last name"
              autoComplete="family-name"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="gender">
              Gender
              <span>*</span>
            </label>

            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="">
                Select gender
              </option>

              <option value="male">
                Male
              </option>

              <option value="female">
                Female
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth">
              Date of Birth
              <span>*</span>
            </label>

            <input
              id="dateOfBirth"
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="nationalId">
              National ID
              <span>*</span>
            </label>

            <input
              id="nationalId"
              type="text"
              name="nationalId"
              value={form.nationalId}
              onChange={handleChange}
              placeholder="National ID"
              inputMode="numeric"
              maxLength={10}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
              <span>*</span>
            </label>

            <input
              id="phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="0712345678"
              autoComplete="tel"
              inputMode="tel"
              disabled={loading}
              required
            />

            <small>
              Kenyan numbers beginning with
              01 or 07 are accepted.
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="occupation">
              Occupation
            </label>

            <input
              id="occupation"
              type="text"
              name="occupation"
              value={form.occupation}
              onChange={handleChange}
              placeholder="Occupation"
              autoComplete="organization-title"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* ====================================================
          02 — INCLUSION
      ==================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>02</span>

          <div>
            <h3>
              Inclusion & Accessibility
            </h3>

            <p>
              Help us build inclusive youth
              programmes and services.
            </p>
          </div>
        </div>

        <div className="disability-box">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="hasDisability"
              checked={
                form.disability
                  .hasDisability
              }
              onChange={handleChange}
              disabled={loading}
            />

            <span className="checkbox-control" />

            <span>
              I am a person with a disability
            </span>
          </label>

          {form.disability
            .hasDisability && (
            <div className="form-group disability-type">
              <label htmlFor="disabilityType">
                Type of Disability
                <span>*</span>
              </label>

              <input
                id="disabilityType"
                type="text"
                name="disabilityType"
                value={
                  form.disability.type
                }
                onChange={handleChange}
                placeholder="Describe the type of disability"
                disabled={loading}
                required
              />
            </div>
          )}
        </div>
      </section>

      {/* ====================================================
          03 — LOCATION
      ==================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>03</span>

          <div>
            <h3>Location</h3>

            <p>
              Select your location within
              the Coast Region.
            </p>
          </div>
        </div>

        <div className="form-grid">
          {/* COUNTY */}

          <div className="form-group">
            <label htmlFor="county">
              County
              <span>*</span>
            </label>

            <div className="input-with-icon">
              <MapPin size={15} />

              <select
                id="county"
                name="county"
                value={form.county}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">
                  Select county
                </option>

                {COAST_COUNTIES.map(
                  (county) => (
                    <option
                      key={county}
                      value={county}
                    >
                      {county}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          {/* CONSTITUENCY */}

          <div className="form-group">
            <label htmlFor="constituency">
              Constituency
              <span>*</span>
            </label>

            <select
              id="constituency"
              name="constituency"
              value={
                form.constituency
              }
              onChange={handleChange}
              disabled={
                loading ||
                !form.county
              }
              required
            >
              <option value="">
                {form.county
                  ? "Select constituency"
                  : "Select county first"}
              </option>

              {constituencies.map(
                (constituency) => (
                  <option
                    key={constituency}
                    value={constituency}
                  >
                    {constituency}
                  </option>
                )
              )}
            </select>
          </div>

          {/* WARD */}

          <div className="form-group">
            <label htmlFor="ward">
              Ward
              <span>*</span>
            </label>

            <select
              id="ward"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              disabled={
                loading ||
                !form.constituency
              }
              required
            >
              <option value="">
                {form.constituency
                  ? "Select ward"
                  : "Select constituency first"}
              </option>

              {wards.map((ward) => (
                <option
                  key={ward}
                  value={ward}
                >
                  {ward}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ====================================================
          04 — MEMBERSHIP
      ==================================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>04</span>

          <div>
            <h3>
              Membership & Account
            </h3>

            <p>
              Choose how you want to
              participate in JVP.
            </p>
          </div>
        </div>

        <div className="membership-options">
          <label
            className={`membership-option ${
              form.membershipType ===
              "ordinary"
                ? "selected"
                : ""
            }`}
          >
            <input
              type="radio"
              name="membershipType"
              value="ordinary"
              checked={
                form.membershipType ===
                "ordinary"
              }
              onChange={handleChange}
              disabled={loading}
            />

            <div className="membership-option__content">
              <div className="membership-option__top">
                <span>
                  Ordinary Membership
                </span>

                <strong>
                  KES 50
                </strong>
              </div>

              <p>
                Participate in JVP programmes,
                events, opportunities and
                community activities.
              </p>
            </div>

            <span className="membership-radio" />
          </label>

          <label
            className={`membership-option ${
              form.membershipType ===
              "leadership"
                ? "selected"
                : ""
            }`}
          >
            <input
              type="radio"
              name="membershipType"
              value="leadership"
              checked={
                form.membershipType ===
                "leadership"
              }
              onChange={handleChange}
              disabled={loading}
            />

            <div className="membership-option__content">
              <div className="membership-option__top">
                <span>
                  Leadership Membership
                </span>

                <strong>
                  KES 100
                </strong>
              </div>

              <p>
                For members seeking deeper
                involvement in leadership,
                governance and representation.
              </p>
            </div>

            <span className="membership-radio" />
          </label>
        </div>

        <div className="form-group form-group-email">
          <label htmlFor="email">
            Email Address
            <span>*</span>
          </label>

          <input
            id="email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={loading}
            required
          />

          <small>
            A verification code will be
            sent to this email.
          </small>
        </div>
      </section>

      {/* ====================================================
          SUBMIT
      ==================================================== */}

      <div className="register-submit-area">
        <div className="register-submit-info">
          <div>
            <ShieldCheck size={16} />
          </div>

          <p>
            Your information is used to
            create and manage your JVP
            membership. You will verify
            your email before continuing.
          </p>
        </div>

        <button
          type="submit"
          className="register-submit-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2
                size={18}
                className="register-spinner"
              />

              Creating Account...
            </>
          ) : (
            <>
              <UserPlus size={18} />

              Create JVP Account
            </>
          )}
        </button>
      </div>

      {/* ====================================================
          NEXT STEP
      ==================================================== */}

      <div className="register-next-step">
        <div className="register-next-step__icon">
          <CreditCard size={16} />
        </div>

        <div>
          <strong>
            What happens next?
          </strong>

          <span>
            Verify your email, activate
            your membership and enter
            JVP Connect.
          </span>
        </div>
      </div>
    </form>
  );
}

export default RegisterForm;