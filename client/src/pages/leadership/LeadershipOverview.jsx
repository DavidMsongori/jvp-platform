import { useDashboard } from "../../context/DashboardContext";
import { useLeadershipDashboard } from "../../context/LeadershipDashboardContext";

import LeadershipPositionCard from "../../components/leadership/LeadershipPositionCard";
import LeadershipStatistics from "../../components/leadership/LeadershipStatistics";
import LeadershipQuickActions from "../../components/leadership/LeadershipQuickActions";
import LeadershipUpcomingMeetings from "../../components/leadership/LeadershipUpcomingMeetings";
import LeadershipAnnouncements from "../../components/leadership/LeadershipAnnouncements";

import "./LeadershipOverview.css";

function LeadershipOverview() {
  const {
    member,
    position,
    category,
    completion,
  } = useDashboard();

  const {
    summary,
    loading,
  } = useLeadershipDashboard();

  const formattedCategory = category
    ? category
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
    : "Leadership";

  return (
    <div className="leadership-overview">
      {/* =====================================
          HERO
      ===================================== */}

      <section className="leadership-hero">
        <div>
          <h1>
            Welcome back
            {member?.firstName
              ? `, ${member.firstName}`
              : ""}
          </h1>

          <p>
            You are serving as{" "}
            <strong>{position || "Leader"}</strong>{" "}
            under{" "}
            <strong>{formattedCategory}</strong>.
          </p>
        </div>

        <div className="leadership-completion">
          <span>Profile Completion</span>

          <h2>
            {completion?.percentage ??
              member?.profileCompletion ??
              100}
            %
          </h2>
        </div>
      </section>

      {/* =====================================
          SUMMARY STATISTICS
      ===================================== */}

      <LeadershipStatistics
        summary={summary}
        loading={loading}
      />

      {/* =====================================
          POSITION & QUICK ACTIONS
      ===================================== */}

      <section className="leadership-overview-grid">
        <LeadershipPositionCard />

        <LeadershipQuickActions />
      </section>

      {/* =====================================
          MEETINGS & ANNOUNCEMENTS
      ===================================== */}

      <section className="leadership-overview-grid">
        <LeadershipUpcomingMeetings />

        <LeadershipAnnouncements />
      </section>
    </div>
  );
}

export default LeadershipOverview;