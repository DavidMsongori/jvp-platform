import { useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import * as authService from "../../services/auth.service";

import "./CreatePasswordForm.css";

function CreatePassword() {
  const navigate = useNavigate();
  const location = useLocation();

  const { updateUser, updateMember } = useAuth();

  /*
   * ==========================================================
   * DETERMINE PASSWORD CREATION FLOW
   * ==========================================================
   *
   * Normal registration:
   * location.state.email
   *
   * Imported member activation:
   * location.state.setupToken
   * OR sessionStorage setup token after page refresh
   */

  const stateEmail = location.state?.email || "";

  const stateSetupToken =
    location.state?.setupToken || "";

  const stateMember =
    location.state?.member || null;

  const [email, setEmail] =
    useState(stateEmail);

  const [setupToken, setSetupToken] =
    useState(stateSetupToken);

  const [member, setMember] =
    useState(stateMember);

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /*
   * ==========================================================
   * LOAD IMPORTED-MEMBER SETUP TOKEN
   * ==========================================================
   */

  useEffect(() => {
    const storedToken =
      sessionStorage.getItem(
        "jvp_password_setup_token"
      );

    const storedMember =
      sessionStorage.getItem(
        "jvp_password_setup_member"
      );

    if (!setupToken && storedToken) {
      setSetupToken(storedToken);
    }

    if (!member && storedMember) {
      try {
        setMember(
          JSON.parse(storedMember)
        );
      } catch (err) {
        console.error(
          "Unable to restore member setup data.",
          err
        );
      }
    }

    if (stateSetupToken) {
      sessionStorage.setItem(
        "jvp_password_setup_token",
        stateSetupToken
      );
    }

    if (stateMember) {
      sessionStorage.setItem(
        "jvp_password_setup_member",
        JSON.stringify(stateMember)
      );
    }
  }, [
    setupToken,
    member,
    stateSetupToken,
    stateMember,
  ]);

  /*
   * ==========================================================
   * DETERMINE WHETHER THIS IS IMPORTED MEMBER FLOW
   * ==========================================================
   */

  const isImportedMemberFlow =
    Boolean(
      setupToken ||
      sessionStorage.getItem(
        "jvp_password_setup_token"
      )
    );

  /*
   * ==========================================================
   * VALIDATE ACCESS TO PAGE
   * ==========================================================
   *
   * Normal flow requires an email.
   *
   * Imported flow requires the temporary setup token.
   */

  if (!email && !isImportedMemberFlow) {
    return (
      <Navigate
        to="/register"
        replace
      />
    );
  }

  /*
   * ==========================================================
   * CREATE PASSWORD
   * ==========================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const finalSetupToken =
      setupToken ||
      sessionStorage.getItem(
        "jvp_password_setup_token"
      );

    /*
     * Email is mandatory for both flows.
     */

    if (!email.trim()) {
      setError(
        "Please enter your email address."
      );

      return;
    }

    /*
     * Basic email validation
     */

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      setError(
        "Please enter a valid email address."
      );

      return;
    }

    if (!password) {
      setError(
        "Please enter a password."
      );

      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );

      return;
    }

    try {
      setLoading(true);

      /*
       * ======================================================
       * BUILD REQUEST
       * ======================================================
       *
       * Imported member:
       * email + password + confirmPassword + setupToken
       *
       * Normal registration:
       * email + password + confirmPassword
       */

      const payload = {
        email: email.trim(),
        password,
        confirmPassword,
      };

      if (finalSetupToken) {
        payload.setupToken =
          finalSetupToken;
      }

      const response =
        await authService.createPassword(
          payload
        );

      const data =
        response?.data || response;

      /*
       * ======================================================
       * VALIDATE RESPONSE
       * ======================================================
       */

      if (!data?.token) {
        throw new Error(
          "Account was created but no authentication token was returned."
        );
      }

      /*
       * ======================================================
       * STORE AUTHENTICATION
       * ======================================================
       */

      localStorage.setItem(
        "token",
        data.token
      );

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        updateUser(data.user);
      }

      if (data.member) {
        localStorage.setItem(
          "member",
          JSON.stringify(data.member)
        );

        updateMember(data.member);
      }

      /*
       * ======================================================
       * CLEAR TEMPORARY IMPORTED-MEMBER SETUP DATA
       * ======================================================
       */

      sessionStorage.removeItem(
        "jvp_password_setup_token"
      );

      sessionStorage.removeItem(
        "jvp_password_setup_member"
      );

      setSuccess(
        "Account created successfully. Redirecting to your dashboard..."
      );

      /*
       * ======================================================
       * REDIRECT
       * ======================================================
       */

      setTimeout(() => {
        const role =
          data.user?.role?.toLowerCase();

        const adminRoles = [
          "admin",
          "super_admin",
          "finance",
          "events",
        ];

        if (adminRoles.includes(role)) {
          navigate("/admin", {
            replace: true,
          });
        } else {
          navigate("/dashboard", {
            replace: true,
          });
        }
      }, 1000);

    } catch (err) {
      console.error(
        "Create password error:",
        err
      );

      /*
       * If the setup token has expired, clear it
       * so the member can restart activation.
       */

      const status =
        err.response?.status;

      const message =
        err.response?.data?.message ||
        err.message ||
        "Unable to create password.";

      if (
        status === 401 ||
        status === 403
      ) {
        sessionStorage.removeItem(
          "jvp_password_setup_token"
        );

        sessionStorage.removeItem(
          "jvp_password_setup_member"
        );

        setSetupToken("");
        setMember(null);
      }

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-password-container">

      {/* =====================================================
          IMPORTED MEMBER HEADER
      ===================================================== */}

      {isImportedMemberFlow && (
        <div className="setup-member-message">

          <div className="setup-member-icon">
            ✓
          </div>

          <div>
            <h3>
              Membership Verified
            </h3>

            <p>
              {member?.firstName
                ? `Welcome, ${member.firstName}.`
                : "Your existing JVP membership has been found."}
            </p>

            <p>
              Please provide your email
              address and create a new
              password to activate your
              JVP Connect account.
            </p>
          </div>

        </div>
      )}

      <form
        className="create-password-form"
        onSubmit={handleSubmit}
      >

        {/* ===================================================
            EMAIL
        =================================================== */}

        <div className="form-group">

          <label>
            Email Address
          </label>

          <input
            type="email"
            value={email}
            placeholder="member@example.com"
            onChange={(e) =>
              setEmail(e.target.value)
            }
            autoComplete="email"
            disabled={loading}
          />

          {isImportedMemberFlow && (
            <small>
              This email will be used to
              create your JVP Connect
              account.
            </small>
          )}

        </div>

        {/* ===================================================
            PASSWORD
        =================================================== */}

        <div className="form-group">

          <label>
            Create Password
          </label>

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            placeholder="Enter password"
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            autoComplete="new-password"
            disabled={loading}
          />

        </div>

        {/* ===================================================
            SHOW PASSWORD
        =================================================== */}

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

        {/* ===================================================
            CONFIRM PASSWORD
        =================================================== */}

        <div className="form-group">

          <label>
            Confirm Password
          </label>

          <input
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            value={confirmPassword}
            placeholder="Confirm password"
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            autoComplete="new-password"
            disabled={loading}
          />

        </div>

        {/* ===================================================
            SHOW CONFIRM PASSWORD
        =================================================== */}

        <div className="checkbox-row">

          <label>

            <input
              type="checkbox"
              checked={
                showConfirmPassword
              }
              onChange={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              disabled={loading}
            />

            Show Confirm Password

          </label>

        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* ===================================================
            SUCCESS
        =================================================== */}

        {success && (
          <div className="form-success">
            {success}
          </div>
        )}

        {/* ===================================================
            SUBMIT
        =================================================== */}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >

          {loading
            ? "Creating Account..."
            : "Create Account"}

        </button>

      </form>

    </div>
  );
}

export default CreatePassword;