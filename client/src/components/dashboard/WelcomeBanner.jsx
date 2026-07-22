import { Link } from "react-router-dom";
import {
  FiCheckCircle,
  FiMapPin,
  FiCreditCard,
  FiArrowRight,
  FiShield,
} from "react-icons/fi";

import "./WelcomeBanner.css";

function WelcomeBanner({
  member,
  leadership,
}) {
  if (!member) return null;

  const firstName =
    member.firstName || "Member";

  const membershipNumber =
    member.memberNumber ||
    member.membershipNumber ||
    "Pending Membership Number";

  const profileCompletion =
    member.profileCompleted ??
    member.profileCompletion ??
    0;

  return (
    <section className="welcome-banner">

      {/* ======================================
          LEFT
      ======================================= */}

      <div className="welcome-banner-left">

        <span className="welcome-tag">
          👋 Welcome Back
        </span>

        <h1>
          Hello, {firstName}
        </h1>

        <p>
          Welcome back to JVP Connect.
          Manage your membership,
          discover opportunities,
          register for events and stay
          connected with the Coastal
          Youth Community.
        </p>

        <div className="welcome-meta">

          <div className="meta-item">

            <FiCreditCard />

            <span>
              {membershipNumber}
            </span>

          </div>

          <div className="meta-item">

            <FiMapPin />

            <span>
              {member.county || "Not Set"}
            </span>

          </div>

          <div className="meta-item status">

            <FiCheckCircle />

            <span>
              {member.membershipStatus ||
                "Inactive"}
            </span>

          </div>

          {leadership?.isLeader && (
            <div className="meta-item leadership">

              <FiShield />

              <span>
                {leadership.position}
              </span>

            </div>
          )}

        </div>

      </div>

      {/* ======================================
          RIGHT
      ======================================= */}

      <div className="welcome-banner-right">

        <div className="completion-card">

          <h3>
            Profile Completion
          </h3>

          <div className="progress-circle">

            <span>
              {profileCompletion}%
            </span>

          </div>

          <p>
            Complete your profile to
            unlock all JVP services.
          </p>

          <Link
            to="/dashboard/profile"
            className="complete-profile-btn"
          >
            Complete Profile

            <FiArrowRight />
          </Link>

        </div>

      </div>

    </section>
  );
}

export default WelcomeBanner;