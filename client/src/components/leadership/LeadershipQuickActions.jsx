import { Link } from "react-router-dom";

import {
  CalendarPlus,
  FileText,
  Users,
  ClipboardList,
  ArrowRight,
  Lock,
} from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipQuickActions.css";

function LeadershipQuickActions() {
  const { leadership } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const actions = [
    {
      title: "Leadership Profile",
      description:
        "View your leadership profile and appointment details.",
      icon: <Users size={22} />,
      to: "/dashboard/profile",
      available: true,
    },
    {
      title: "Leadership Card",
      description:
        "Access your official leadership identification card.",
      icon: <ClipboardList size={22} />,
      to: "/dashboard/membership-card",
      available: true,
    },
    {
      title: "Manage Events",
      description:
        "Create and manage leadership activities.",
      icon: <CalendarPlus size={22} />,
      available: false,
    },
    {
      title: "Submit Reports",
      description:
        "Prepare and submit leadership reports.",
      icon: <FileText size={22} />,
      available: false,
    },
  ];

  return (
    <section className="leadership-actions">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-actions-header">

        <h3>

          Quick Actions

        </h3>

        <p>

          Frequently used leadership
          tools and shortcuts.

        </p>

      </div>

      {/* =====================================
          ACTIONS
      ====================================== */}

      <div className="leadership-actions-list">

        {actions.map((action) => (

          action.available ? (

            <Link
              key={action.title}
              to={action.to}
              className="leadership-action-card"
            >

              <div className="action-icon">

                {action.icon}

              </div>

              <div className="action-content">

                <h4>

                  {action.title}

                </h4>

                <p>

                  {action.description}

                </p>

              </div>

              <ArrowRight size={20} />

            </Link>

          ) : (

            <div
              key={action.title}
              className="leadership-action-card disabled"
            >

              <div className="action-icon">

                {action.icon}

              </div>

              <div className="action-content">

                <h4>

                  {action.title}

                </h4>

                <p>

                  {action.description}

                </p>

              </div>

              <div className="coming-soon">

                <Lock size={14} />

                <span>

                  Coming Soon

                </span>

              </div>

            </div>

          )

        ))}

      </div>

    </section>
  );
}

export default LeadershipQuickActions;