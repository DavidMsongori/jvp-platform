import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaBullhorn,
  FaChartLine,
  FaUsers,
} from "react-icons/fa";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipSnapshot.css";

function LeadershipSnapshot() {
  const {
    leadership,
    statistics,
    events = [],
    notifications = [],
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const upcomingMeetings = events.length;

  const unreadAnnouncements = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <section className="leadership-snapshot">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="snapshot-header">

        <div>

          <h2>Leadership Workspace</h2>

          <p>

            {leadership.position}

            {" • "}

            {leadership.category}

          </p>

        </div>

        <Link
          to="/workspace/leadership"
          className="snapshot-button"
        >
          Open Workspace

          <FaArrowRight />
        </Link>

      </div>

      {/* =====================================
          SUMMARY
      ===================================== */}

      <div className="snapshot-grid">

        <div className="snapshot-card">

          <FaUsers className="snapshot-icon" />

          <div>

            <span>Members Served</span>

            <strong>
              {statistics?.membersServed ?? 0}
            </strong>

          </div>

        </div>

        <div className="snapshot-card">

          <FaChartLine className="snapshot-icon" />

          <div>

            <span>Performance</span>

            <strong>

              {statistics?.performanceScore ?? 0}%

            </strong>

          </div>

        </div>

        <div className="snapshot-card">

          <FaCalendarAlt className="snapshot-icon" />

          <div>

            <span>Upcoming Meetings</span>

            <strong>

              {upcomingMeetings}

            </strong>

          </div>

        </div>

        <div className="snapshot-card">

          <FaBullhorn className="snapshot-icon" />

          <div>

            <span>Announcements</span>

            <strong>

              {unreadAnnouncements}

            </strong>

          </div>

        </div>

      </div>

    </section>
  );
}

export default LeadershipSnapshot;