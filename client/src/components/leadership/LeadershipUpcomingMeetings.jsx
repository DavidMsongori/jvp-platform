import { Link } from "react-router-dom";

import {
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  ArrowRight,
} from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipUpcomingMeetings.css";

function LeadershipUpcomingMeetings() {
  const {
    leadership,
    events,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const meetings = events?.length
    ? events.slice(0, 4)
    : [];

  return (
    <section className="leadership-meetings">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-meetings-header">

        <div>

          <h3>

            Upcoming Meetings

          </h3>

          <p>

            Scheduled leadership meetings,
            forums and planning sessions.

          </p>

        </div>

        <Link
          to="/dashboard/events"
          className="meetings-link"
        >

          View Calendar

          <ArrowRight size={18} />

        </Link>

      </div>

      {/* =====================================
          MEETINGS
      ====================================== */}

      {meetings.length > 0 ? (

        <div className="meetings-list">

          {meetings.map(
            (meeting, index) => (

              <article
                key={
                  meeting._id ||
                  meeting.id ||
                  index
                }
                className="meeting-card"
              >

                <div className="meeting-date">

                  <CalendarDays size={22} />

                </div>

                <div className="meeting-content">

                  <h4>

                    {meeting.title ||
                      "Leadership Meeting"}

                  </h4>

                  <div className="meeting-meta">

                    <span>

                      <Clock3 size={15} />

                      {meeting.date
                        ? new Date(
                            meeting.date
                          ).toLocaleDateString(
                            "en-KE",
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Date TBA"}

                    </span>

                    <span>

                      <MapPin size={15} />

                      {meeting.venue ||
                        meeting.location ||
                        "Venue TBA"}

                    </span>

                    <span>

                      <Users size={15} />

                      {meeting.audience ||
                        "Leadership"}

                    </span>

                  </div>

                </div>

              </article>

            )
          )}

        </div>

      ) : (

        <div className="meeting-empty">

          <CalendarDays size={42} />

          <h4>

            No Upcoming Meetings

          </h4>

          <p>

            Leadership meetings and
            planning sessions will
            appear here once they are
            scheduled.

          </p>

        </div>

      )}

    </section>
  );
}

export default LeadershipUpcomingMeetings;