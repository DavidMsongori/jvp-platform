import { Link } from "react-router-dom";
import {
  User,
  BadgeCheck,
  Wallet,
  CalendarDays,
  Bell,
  Settings,
} from "lucide-react";

import "./QuickActions.css";

function QuickActions() {
  const actions = [
    {
      title: "Profile",
      icon: <User size={28} />,
      link: "/profile",
      color: "blue",
    },
    {
      title: "Card",
      icon: <BadgeCheck size={28} />,
      link: "/membership-card",
      color: "green",
    },
    {
      title: "Payments",
      icon: <Wallet size={28} />,
      link: "/payments",
      color: "yellow",
      badge: null,
    },
    {
      title: "Events",
      icon: <CalendarDays size={28} />,
      link: "/events",
      color: "purple",
      badge: null,
    },
    {
      title: "Alerts",
      icon: <Bell size={28} />,
      link: "/notifications",
      color: "teal",
      badge: null,
    },
    {
      title: "Membership",
      icon: <Settings size={28} />,
      link: "/membership",
      color: "red",
    },
  ];

  return (
    <section className="quick-actions">

      <div className="widget-header">

        <div>

          <h2>Quick Actions</h2>

          <p>Frequently used features</p>

        </div>

      </div>

      <div className="quick-actions-grid">

        {actions.map((action) => (

          <Link
            key={action.title}
            to={action.link}
            className={`quick-action ${action.color}`}
          >

            {action.badge && (

              <span className="action-badge">

                {action.badge}

              </span>

            )}

            <div className="action-icon">

              {action.icon}

            </div>

            <span>

              {action.title}

            </span>

          </Link>

        ))}

      </div>

    </section>
  );
}

export default QuickActions;