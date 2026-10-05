import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./LoginForm.css";

function LoginForm() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ==========================================
     ROLE-BASED REDIRECT
  ========================================== */

  const redirectUserByRole = (user) => {
    const role = String(user?.role || "").toLowerCase();

    switch (role) {
      case "super_admin":
        navigate("/admin", {
          replace: true,
        });
        break;

      case "admin":
        navigate("/admin", {
          replace: true,
        });
        break;

      case "finance":
        navigate("/finance", {
          replace: true,
        });
        break;

      case "events":
        navigate("/events", {
          replace: true,
        });
        break;

      case "member":
      default:
        navigate("/dashboard", {
          replace: true,
        });
        break;
    }
  };

  /* ==========================================
     LOGIN
  ========================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!identifier.trim()) {
      setError(
        "Please enter your email address or phone number."
      );
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login({
        identifier: identifier.trim(),
        password,
      });

      const user = result?.user;

      if (!user) {
        throw new Error(
          "Login was successful, but user information was not returned."
        );
      }

      redirectUserByRole(user);
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Invalid email/phone number or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form
        className="login-form"
        onSubmit={handleSubmit}
      >
        {/* Identifier */}

        <div className="form-group">
          <label>
            Email Address or Phone Number
          </label>

          <input
            type="text"
            value={identifier}
            placeholder="member@email.com or 0712345678"
            onChange={(e) =>
              setIdentifier(e.target.value)
            }
            autoComplete="username"
          />
        </div>

        {/* Password */}

        <div className="form-group">
          <label>Password</label>

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            value={password}
            placeholder="Enter your password"
            onChange={(e) =>
              setPassword(e.target.value)
            }
            autoComplete="current-password"
          />
        </div>

        {/* Show Password */}

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
            />

            Show Password
          </label>
        </div>

        {/* Error */}

        {error && (
          <div className="form-error">
            {error}
          </div>
        )}

        {/* Login Button */}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
        >
          {loading
            ? "Signing In..."
            : "Login"}
        </button>
      </form>

      {/* Links */}

      <div className="login-links">
        <Link to="/forgot-password">
          Forgot Password?
        </Link>

        <Link to="/activate-membership">
          Activate Membership
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;