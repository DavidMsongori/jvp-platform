import {
  Bell,
  Megaphone,
  Clock3,
  ArrowRight,
} from "lucide-react";

import { Link } from "react-router-dom";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipAnnouncements.css";

function LeadershipAnnouncements() {
  const {
    leadership,
    notifications,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const announcements =
    notifications?.length
      ? notifications.slice(0, 5)
      : [];

  return (
    <section className="leadership-announcements">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-announcements-header">

        <div>

          <h3>

            Leadership Announcements

          </h3>

          <p>

            Important updates and
            communication for leaders.

          </p>

        </div>

        <Link
          to="/dashboard/notifications"
          className="announcement-link"
        >

          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {/* =====================================
          CONTENT
      ====================================== */}

      {announcements.length > 0 ? (

        <div className="announcement-list">

          {announcements.map(
            (item, index) => (

              <article
                key={
                  item._id ||
                  item.id ||
                  index
                }
                className="announcement-item"
              >

                <div className="announcement-icon">

                  <Megaphone size={18} />

                </div>

                <div className="announcement-content">

                  <h4>

                    {item.title ||
                      "Leadership Update"}

                  </h4>

                  <p>

                    {item.message ||
                      item.description ||
                      "No description available."}

                  </p>

                  <div className="announcement-meta">

                    <Clock3 size={14} />

                    <span>

                      {item.createdAt
                        ? new Date(
                            item.createdAt
                          ).toLocaleDateString(
                            "en-KE",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Recently"}

                    </span>

                  </div>

                </div>

              </article>

            )
          )}

        </div>

      ) : (

        <div className="announcement-empty">

          <Bell size={42} />

          <h4>

            No Announcements

          </h4>

          <p>

            Leadership announcements
            will appear here when
            they are published.

          </p>

        </div>

      )}

    </section>
  );
}

export default LeadershipAnnouncements;