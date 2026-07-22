import { ShieldCheck } from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import LeadershipPositionCard from "./LeadershipPositionCard";
import LeadershipOverview from "./LeadershipOverview";
import LeadershipQuickActions from "./LeadershipQuickActions";
import LeadershipStatistics from "./LeadershipStatistics";
import LeadershipUpcomingMeetings from "./LeadershipUpcomingMeetings";
import LeadershipAnnouncements from "./LeadershipAnnouncements";

import "./LeadershipWorkspace.css";

function LeadershipWorkspace() {
  const {
    member,
    leadership,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  return (
    <section className="leadership-workspace">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-header">

        <div>

          <span className="leadership-tag">

            <ShieldCheck size={18} />

            Leadership Workspace

          </span>

          <h2>

            Welcome,
            {" "}
            {leadership.position}

          </h2>

          <p>

            Manage your leadership
            responsibilities, access
            organizational resources and
            stay informed about activities
            within your jurisdiction.

          </p>

        </div>

        <div className="leadership-region">

          <span>

            {member?.county}

          </span>

        </div>

      </div>

      {/* =====================================
          FIRST ROW
      ====================================== */}

      <div className="leadership-grid leadership-grid-two">

        <LeadershipPositionCard />

        <LeadershipOverview />

      </div>

      {/* =====================================
          SECOND ROW
      ====================================== */}

      <div className="leadership-grid leadership-grid-two">

        <LeadershipQuickActions />

        <LeadershipStatistics />

      </div>

      {/* =====================================
          THIRD ROW
      ====================================== */}

      <div className="leadership-grid leadership-grid-two">

        <LeadershipUpcomingMeetings />

        <LeadershipAnnouncements />

      </div>

    </section>
  );
}

export default LeadershipWorkspace;