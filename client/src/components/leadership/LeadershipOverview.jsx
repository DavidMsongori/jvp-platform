import {
  Shield,
  BadgeCheck,
  CreditCard,
  CalendarClock,
} from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipOverview.css";

function LeadershipOverview() {
  const {
    leadership,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const appointed =
    leadership.appointedAt ||
    leadership.createdAt;

  return (
    <section className="leadership-overview">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-overview-header">

        <h3>

          Leadership Overview

        </h3>

        <p>

          A quick summary of your
          current leadership status.

        </p>

      </div>

      {/* =====================================
          GRID
      ====================================== */}

      <div className="leadership-overview-grid">

        <div className="overview-card">

          <div className="overview-icon">

            <Shield size={24} />

          </div>

          <span>

            Leadership Role

          </span>

          <strong>

            {leadership.position}

          </strong>

        </div>

        <div className="overview-card">

          <div className="overview-icon">

            <BadgeCheck size={24} />

          </div>

          <span>

            Category

          </span>

          <strong>

            {leadership.category}

          </strong>

        </div>

        <div className="overview-card">

          <div className="overview-icon">

            <CreditCard size={24} />

          </div>

          <span>

            Leadership Card

          </span>

          <strong>

            {leadership.hasLeadershipCard
              ? "Available"
              : "Pending"}

          </strong>

        </div>

        <div className="overview-card">

          <div className="overview-icon">

            <CalendarClock size={24} />

          </div>

          <span>

            Appointment

          </span>

          <strong>

            {appointed
              ? new Date(
                  appointed
                ).toLocaleDateString(
                  "en-KE",
                  {
                    month: "short",
                    year: "numeric",
                  }
                )
              : "Not Set"}

          </strong>

        </div>

      </div>

      {/* =====================================
          FOOTER
      ====================================== */}

      <div className="leadership-overview-footer">

        <div>

          <span>

            Leadership Status

          </span>

          <strong>

            Active

          </strong>

        </div>

        <div>

          <span>

            Workspace Access

          </span>

          <strong>

            Enabled

          </strong>

        </div>

      </div>

    </section>
  );
}

export default LeadershipOverview;