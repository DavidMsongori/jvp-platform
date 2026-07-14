import { useState } from "react";

import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { useProfile } from "../../context/ProfileContext";

import "./SecuritySettings.css";

function SecuritySettings() {

  const { profile } = useProfile();

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [form, setForm] =
    useState({

      currentPassword: "",

      newPassword: "",

      confirmPassword: "",

    });

  const handleChange = (event) => {

    setForm({

      ...form,

      [event.target.name]:
        event.target.value,

    });

  };

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();

    alert(

      "Password change endpoint will be connected in the next phase."

    );

  };

  return (

    <section className="security-settings">

      <div className="security-header">

        <h2>

          <ShieldCheck size={24} />

          Security Settings

        </h2>

        <p>

          Manage your account security and password.

        </p>

      </div>

      {/* ACCOUNT STATUS */}

      <div className="security-status">

        <div className="security-card">

          {

            profile?.user?.emailVerified

              ? <CheckCircle2 />

              : <XCircle />

          }

          <div>

            <strong>

              Email Verification

            </strong>

            <p>

              {

                profile?.user?.emailVerified

                  ? "Verified"

                  : "Not Verified"

              }

            </p>

          </div>

        </div>

        <div className="security-card">

          {

            profile?.user?.isActive

              ? <CheckCircle2 />

              : <XCircle />

          }

          <div>

            <strong>

              Account Status

            </strong>

            <p>

              {

                profile?.user?.isActive

                  ? "Active"

                  : "Inactive"

              }

            </p>

          </div>

        </div>

      </div>

      {/* CHANGE PASSWORD */}

      <div className="password-card">

        <h3>

          <KeyRound size={20} />

          Change Password

        </h3>

        <form
          onSubmit={handleSubmit}
        >

          <div className="password-group">

            <label>

              Current Password

            </label>

            <div className="password-input">

              <input

                type={

                  showCurrent

                    ? "text"

                    : "password"

                }

                name="currentPassword"

                value={form.currentPassword}

                onChange={handleChange}

              />

              <button

                type="button"

                onClick={() =>

                  setShowCurrent(

                    !showCurrent

                  )

                }

              >

                {

                  showCurrent

                    ? <EyeOff size={18} />

                    : <Eye size={18} />

                }

              </button>

            </div>

          </div>

          <div className="password-group">

            <label>

              New Password

            </label>

            <div className="password-input">

              <input

                type={

                  showNew

                    ? "text"

                    : "password"

                }

                name="newPassword"

                value={form.newPassword}

                onChange={handleChange}

              />

              <button

                type="button"

                onClick={() =>

                  setShowNew(

                    !showNew

                  )

                }

              >

                {

                  showNew

                    ? <EyeOff size={18} />

                    : <Eye size={18} />

                }

              </button>

            </div>

          </div>

          <div className="password-group">

            <label>

              Confirm Password

            </label>

            <div className="password-input">

              <input

                type={

                  showConfirm

                    ? "text"

                    : "password"

                }

                name="confirmPassword"

                value={form.confirmPassword}

                onChange={handleChange}

              />

              <button

                type="button"

                onClick={() =>

                  setShowConfirm(

                    !showConfirm

                  )

                }

              >

                {

                  showConfirm

                    ? <EyeOff size={18} />

                    : <Eye size={18} />

                }

              </button>

            </div>

          </div>

          <button

            className="change-password-btn"

          >

            Update Password

          </button>

        </form>

      </div>

      {/* FUTURE */}

      <div className="future-security">

        <div className="future-card">

          <Smartphone size={22} />

          <div>

            <strong>

              Two-Factor Authentication

            </strong>

            <p>

              Coming Soon

            </p>

          </div>

        </div>

        <div className="future-card">

          <Monitor size={22} />

          <div>

            <strong>

              Active Sessions

            </strong>

            <p>

              Coming Soon

            </p>

          </div>

        </div>

      </div>

    </section>

  );

}

export default SecuritySettings;