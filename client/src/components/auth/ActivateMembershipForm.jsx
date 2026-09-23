import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as authService from "../../services/auth.service";

import "./ActivateMembershipForm.css";

function ActivateMembershipForm() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    /*
     * Validate phone
     */

    if (!phone.trim()) {
      setError(
        "Please enter your phone number."
      );

      return;
    }

    /*
     * Validate default password
     */

    if (!password) {
      setError(
        "Please enter your default password."
      );

      return;
    }

    try {
      setLoading(true);

      const response =
        await authService.activateMembership({
          phone: phone.trim(),
          password,
        });

      const data =
        response?.data || response;

      /*
       * ======================================================
       * ENSURE SETUP TOKEN WAS RETURNED
       * ======================================================
       */

      if (!data?.setupToken) {
        throw new Error(
          "Membership was verified, but the account setup session could not be created. Please try again."
        );
      }

      /*
       * ======================================================
       * STORE TEMPORARY SETUP TOKEN
       * ======================================================
       *
       * This is NOT the user's normal login token.
       *
       * It is a short-lived token that only permits
       * completion of the imported-member password setup.
       */

      sessionStorage.setItem(
        "jvp_password_setup_token",
        data.setupToken
      );

      /*
       * ======================================================
       * STORE MEMBER INFORMATION
       * ======================================================
       *
       * This is only used to personalize the next screen.
       * It contains no password or sensitive authentication
       * information.
       */

      if (data.member) {
        sessionStorage.setItem(
          "jvp_password_setup_member",
          JSON.stringify(data.member)
        );
      }

      /*
       * ======================================================
       * GO TO CREATE PASSWORD
       * ======================================================
       */

      navigate("/create-password", {
        replace: true,
        state: {
          setupToken: data.setupToken,
          member: data.member || null,
        },
      });

    } catch (err) {
      console.error(
        "Membership activation error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to verify your JVP membership."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      className="activate-membership-form"
      onSubmit={handleSubmit}
    >

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="form-error">
          {error}
        </div>
      )}

      {/* =====================================================
          PHONE NUMBER
      ===================================================== */}

      <div className="form-group">

        <label htmlFor="activation-phone">
          Phone Number
        </label>

        <input
          id="activation-phone"
          type="tel"
          name="phone"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          placeholder="07XXXXXXXX"
          autoComplete="tel"
          inputMode="tel"
          disabled={loading}
          required
        />

        <small>
          Enter the phone number registered
          with your JVP membership.
        </small>

      </div>

      {/* =====================================================
          DEFAULT PASSWORD
      ===================================================== */}

      <div className="form-group">

        <label htmlFor="activation-password">
          Default Password
        </label>

        <input
          id="activation-password"
          type={
            showPassword
              ? "text"
              : "password"
          }
          name="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Enter your default password"
          autoComplete="current-password"
          disabled={loading}
          required
        />

      </div>

      {/* =====================================================
          SHOW PASSWORD
      ===================================================== */}

      <div className="checkbox-row">

        <label>

          <input
            type="checkbox"
            checked={showPassword}
            onChange={() =>
              setShowPassword(
                !showPassword
              )
            }
            disabled={loading}
          />

          Show Password

        </label>

      </div>

      {/* =====================================================
          SUBMIT
      ===================================================== */}

      <button
        type="submit"
        className="btn-primary"
        disabled={loading}
      >

        {loading
          ? "Verifying Membership..."
          : "Verify Membership"}

      </button>

      {/* =====================================================
          BACK TO LOGIN
      ===================================================== */}

      <div className="activation-login-link">

        <span>
          Already have a JVP Connect account?
        </span>

        <Link to="/login">
          Login
        </Link>

      </div>

    </form>
  );
}

export default ActivateMembershipForm;