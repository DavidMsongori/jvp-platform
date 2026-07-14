import { Link } from "react-router-dom";
import {
  Bell,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

import "./Notifications.css";

function Notifications({ notifications = [] }) {

  const formatDate = (date) =>
    new Date(date).toLocaleString("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getIcon = (type) => {

    switch (type) {

      case "success":
        return <CheckCircle size={20} />;

      case "warning":
        return <AlertCircle size={20} />;

      default:
        return <Info size={20} />;

    }

  };

  return (

    <section className="dashboard-notifications">

      <div className="widget-header">

        <div>

          <h2>Notifications</h2>

          <p>

            Important updates from JVP Connect.

          </p>

        </div>

        <Link
          to="/notifications"
          className="widget-link"
        >

          View All

          <ArrowRight size={18} />

        </Link>

      </div>

      {

        notifications.length === 0 ? (

          <div className="notifications-empty">

            <Bell size={56} />

            <h3>

              No Notifications

            </h3>

            <p>

              You're all caught up.

            </p>

          </div>

        ) : (

          <div className="notifications-list">

            {

              notifications.map((notification) => (

                <div
                  key={notification._id}
                  className={`notification-card ${notification.type || "info"}`}
                >

                  <div className="notification-icon">

                    {getIcon(notification.type)}

                  </div>

                  <div className="notification-content">

                    <h3>

                      {notification.title}

                    </h3>

                    <p>

                      {notification.message}

                    </p>

                  </div>

                  <div className="notification-date">

                    {formatDate(notification.createdAt)}

                  </div>

                </div>

              ))

            }

          </div>

        )

      }

    </section>

  );

}

export default Notifications;