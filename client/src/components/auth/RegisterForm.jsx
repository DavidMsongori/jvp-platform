import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  UserPlus,
} from "lucide-react";

import * as authService from "../../services/auth.service";

import "./RegisterForm.css";

/* ==========================================================
   COAST REGION LOCATIONS
========================================================== */

const COAST_LOCATIONS = {
  Mombasa: [
    "Changamwe",
    "Jomvu",
    "Kisauni",
    "Likoni",
    "Mvita",
    "Nyali",
  ],

  Kwale: [
    "Kinango",
    "Lunga Lunga",
    "Matuga",
    "Msambweni",
  ],

  Kilifi: [
    "Ganze",
    "Kaloleni",
    "Kilifi North",
    "Kilifi South",
    "Magarini",
    "Malindi",
    "Rabai",
  ],

  "Tana River": [
    "Bura",
    "Galole",
    "Garsen",
  ],

  Lamu: [
    "Lamu East",
    "Lamu West",
  ],

  "Taita Taveta": [
    "Mwatate",
    "Taveta",
    "Voi",
    "Wundanyi",
  ],
};

/*
 * Ward selection can later be replaced with
 * a complete county → constituency → ward map.
 *
 * For now, the user enters the ward manually
 * because the Member model requires it.
 */

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

/* ==========================================================
   REGISTER FORM
========================================================== */

function RegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const availableConstituencies =
    useMemo(() => {
      if (!form.county) {
        return [];
      }

      return (
        COAST_LOCATIONS[form.county] || []
      );
    }, [form.county]);

  /* ==========================================
     HANDLE INPUT CHANGE
  ========================================== */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setError("");
    setSuccess("");

    if (name === "county") {
      setForm((currentForm) => ({
        ...currentForm,
        county: value,
        constituency: "",
        ward: "",
      }));

      return;
    }

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

  /* ==========================================
     NORMALIZE PHONE
  ========================================== */

  const normalizePhone = (phone) => {
    const cleanedPhone =
      phone.replace(/\s+/g, "");

    if (
      cleanedPhone.startsWith("+254")
    ) {
      return cleanedPhone.substring(1);
    }

    if (
      cleanedPhone.startsWith("0")
    ) {
      return `254${cleanedPhone.substring(
        1
      )}`;
    }

    return cleanedPhone;
  };

  /* ==========================================
   CLIENT VALIDATION
========================================== */

const validateForm = () => {
  const nationalIdPattern =
    /^[0-9]{6,10}$/;

  const normalizedPhone = form.phone
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/^\+/, "");

  const phonePattern =
    /^(?:2547\d{8}|07\d{8})$/;

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
    return "Enter a valid National ID containing 6 to 10 digits.";
  }

  if (
    !phonePattern.test(
      normalizedPhone
    )
  ) {
    return "Enter a valid Kenyan phone number, such as 0740504969, 254740504969, or +254740504969.";
  }

  if (!form.county) {
    return "Select your county.";
  }

  if (!form.constituency) {
    return "Select your constituency.";
  }

  if (!form.ward.trim()) {
    return "Ward is required.";
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

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (
    !emailPattern.test(
      form.email.trim()
    )
  ) {
    return "Enter a valid email address.";
  }

  return "";
};

  /* ==========================================
     EXTRACT API ERROR
  ========================================== */

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

  /* ==========================================
     REGISTER
  ========================================== */

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

      gender: form.gender,

      dateOfBirth:
        form.dateOfBirth,

      nationalId:
        form.nationalId.trim(),

      phone: normalizePhone(
        form.phone
      ),

      occupation:
        form.occupation.trim(),

      county: form.county,

      constituency:
        form.constituency,

      ward:
        form.ward.trim(),

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

      navigate("/verify-otp", {
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
      });
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

  return (
    <form
      className="register-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="register-form-heading">
        <div className="register-form-icon">
          <UserPlus size={26} />
        </div>

        <div>
          <h2>
            Create Your Membership Account
          </h2>

          <p>
            Complete the form using your
            correct personal and location
            details.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="register-alert register-alert-error"
          role="alert"
        >
          <AlertCircle size={20} />

          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          className="register-alert register-alert-success"
          role="status"
        >
          <CheckCircle2 size={20} />

          <span>{success}</span>
        </div>
      )}

      {/* ======================================
          PERSONAL INFORMATION
      ====================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>1</span>

          <div>
            <h3>
              Personal Information
            </h3>

            <p>
              Enter your official personal
              details.
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
              placeholder="Enter first name"
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
              placeholder="Enter middle name"
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
              placeholder="Enter last name"
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
              placeholder="Enter National ID"
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
              Use a Kenyan phone number.
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
              placeholder="Enter occupation"
              autoComplete="organization-title"
              disabled={loading}
            />
          </div>
        </div>
      </section>

      {/* ======================================
          DISABILITY INFORMATION
      ====================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>2</span>

          <div>
            <h3>
              Disability Information
            </h3>

            <p>
              This information supports
              inclusion and accessibility
              planning.
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
              I am a person with a
              disability
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

      {/* ======================================
          LOCATION INFORMATION
      ====================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>3</span>

          <div>
            <h3>
              Location Information
            </h3>

            <p>
              Membership is available to
              residents of the six Coast
              Region counties.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="county">
              County
              <span>*</span>
            </label>

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

              {Object.keys(
                COAST_LOCATIONS
              ).map((county) => (
                <option
                  key={county}
                  value={county}
                >
                  {county}
                </option>
              ))}
            </select>
          </div>

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

              {availableConstituencies.map(
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

          <div className="form-group">
            <label htmlFor="ward">
              Ward
              <span>*</span>
            </label>

            <input
              id="ward"
              type="text"
              name="ward"
              value={form.ward}
              onChange={handleChange}
              placeholder="Enter your ward"
              disabled={
                loading ||
                !form.constituency
              }
              required
            />
          </div>
        </div>
      </section>

      {/* ======================================
          MEMBERSHIP AND ACCOUNT
      ====================================== */}

      <section className="form-section">
        <div className="form-section-header">
          <span>4</span>

          <div>
            <h3>
              Membership and Account
            </h3>

            <p>
              Select your membership type
              and enter your email address.
            </p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="membershipType">
              Membership Type
              <span>*</span>
            </label>

            <select
              id="membershipType"
              name="membershipType"
              value={
                form.membershipType
              }
              onChange={handleChange}
              disabled={loading}
              required
            >
              <option value="ordinary">
                Ordinary Membership
              </option>

              <option value="leadership">
                Leadership Membership
              </option>
            </select>

            <small>
              The membership fee is
              confirmed during payment.
            </small>
          </div>

          <div className="form-group">
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
              placeholder="example@email.com"
              autoComplete="email"
              disabled={loading}
              required
            />

            <small>
              A verification code will be
              sent to this email.
            </small>
          </div>
        </div>
      </section>

      <div className="register-submit-area">
        <p>
          By creating an account, you
          confirm that the details provided
          are accurate.
        </p>

        <button
          type="submit"
          className="register-submit-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2
                size={20}
                className="register-spinner"
              />

              Creating Account...
            </>
          ) : (
            <>
              <UserPlus size={20} />

              Create Account
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default RegisterForm;