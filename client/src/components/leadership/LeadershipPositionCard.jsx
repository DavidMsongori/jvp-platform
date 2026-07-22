import {
  ShieldCheck,
  Briefcase,
  MapPinned,
  Building2,
  Map,
  CalendarDays,
  BadgeCheck,
} from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipPositionCard.css";

function LeadershipPositionCard() {
  const {
    leadership,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const appointmentDate =
    leadership.appointedAt ||
    leadership.createdAt;

  return (
    <section className="leadership-position-card">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-position-header">

        <div className="leadership-position-icon">

          <ShieldCheck size={28} />

        </div>

        <div>

          <h3>

            Leadership Profile

          </h3>

          <p>

            Your current leadership
            appointment within
            JVP Connect.

          </p>

        </div>

      </div>

      {/* =====================================
          DETAILS
      ====================================== */}

      <div className="leadership-position-body">

        <div className="leadership-item">

          <Briefcase size={18} />

          <div>

            <span>

              Position

            </span>

            <strong>

              {leadership.position}

            </strong>

          </div>

        </div>

        <div className="leadership-item">

          <BadgeCheck size={18} />

          <div>

            <span>

              Leadership Category

            </span>

            <strong>

              {leadership.category}

            </strong>

          </div>

        </div>

        <div className="leadership-item">

          <Building2 size={18} />

          <div>

            <span>

              County

            </span>

            <strong>

              {leadership.county || "-"}

            </strong>

          </div>

        </div>

        <div className="leadership-item">

          <MapPinned size={18} />

          <div>

            <span>

              Constituency

            </span>

            <strong>

              {leadership.constituency || "-"}

            </strong>

          </div>

        </div>

        <div className="leadership-item">

          <Map size={18} />

          <div>

            <span>

              Ward

            </span>

            <strong>

              {leadership.ward || "-"}

            </strong>

          </div>

        </div>

        <div className="leadership-item">

          <CalendarDays size={18} />

          <div>

            <span>

              Appointment Date

            </span>

            <strong>

              {appointmentDate
                ? new Date(
                    appointmentDate
                  ).toLocaleDateString(
                    "en-KE",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "Not Available"}

            </strong>

          </div>

        </div>

      </div>

      {/* =====================================
          FOOTER
      ====================================== */}

      <div className="leadership-position-footer">

        <div className="leadership-status">

          <span className="status-dot" />

          Leadership Status

        </div>

        <strong>

          Active

        </strong>

      </div>

    </section>
  );
}

export default LeadershipPositionCard;