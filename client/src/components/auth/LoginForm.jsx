import { Link } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";

import "./LoginForm.css";

function LoginForm() {
  return (
    <>

      <div className="login-header">

        <h2>Welcome Back</h2>

        <p>
          Sign in to access your JVP Connect account.
        </p>

      </div>

      <form className="login-form">

        <div className="form-group">

          <label>Email Address or Phone Number</label>

          <div className="input-group">

            <FaEnvelope />

            <input
              type="text"
              placeholder="Enter your email or phone number"
            />

          </div>

        </div>

        <div className="form-group">

          <label>Password</label>

          <div className="input-group">

            <FaLock />

            <input
              type="password"
              placeholder="Enter your password"
            />

          </div>

        </div>

        <div className="login-options">

          <label className="remember">

            <input type="checkbox" />

            Remember Me

          </label>

          <Link to="/forgot-password">

            Forgot Password?

          </Link>

        </div>

        <button
          type="submit"
          className="login-btn"
        >
          Login
        </button>

      </form>

      <div className="auth-divider">

        <span>OR</span>

      </div>

      <div className="auth-links">

        <Link
          to="/activate-membership"
          className="outline-btn"
        >
          Activate Existing Membership
        </Link>

        <p>

          New to JVP?

          <Link to="/register">

            Create an Account

          </Link>

        </p>

      </div>

    </>
  );
}

export default LoginForm;