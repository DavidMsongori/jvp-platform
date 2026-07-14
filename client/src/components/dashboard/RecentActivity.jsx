import { Link } from "react-router-dom";
import {
  History,
  ArrowRight,
  Clock,
} from "lucide-react";

import "./RecentActivity.css";

function RecentActivity({ activities = [] }) {

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (

    <section className="recent-activity">

      <div className="widget-header">

        <div>

          <h2>Recent Activity</h2>

          <p>
            Your latest activity on JVP Connect.
          </p>

        </div>

        <Link
          to="/activity"
          className="widget-link"
        >

          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {activities.length === 0 ? (

        <div className="activity-empty">

          <History size={56} />

          <h3>No Recent Activity</h3>

          <p>

            Your account activity will
            appear here as you continue
            using JVP Connect.

          </p>

        </div>

      ) : (

        <div className="activity-list">

          {activities.map((activity) => (

            <div
              key={activity._id}
              className="activity-card"
            >

              <div className="activity-icon">

                <Clock size={22} />

              </div>

              <div className="activity-content">

                <h3>

                  {activity.action}

                </h3>

                <p>

                  {activity.description}

                </p>

              </div>

              <div className="activity-time">

                {formatDate(activity.createdAt)}

              </div>

            </div>

          ))}

        </div>

      )}

    </section>

  );

}

export default RecentActivity;