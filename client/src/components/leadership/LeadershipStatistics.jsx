import {
  Users,
  CalendarDays,
  FileText,
  TrendingUp,
} from "lucide-react";

import { useDashboard } from "../../context/DashboardContext";

import "./LeadershipStatistics.css";

function LeadershipStatistics() {
  const {
    leadership,
    statistics,
  } = useDashboard();

  if (!leadership?.isLeader) {
    return null;
  }

  const cards = [
    {
      title: "Members Served",
      value:
        statistics?.membersServed ?? 0,
      icon: <Users size={24} />,
      color: "green",
    },
    {
      title: "Events Coordinated",
      value:
        statistics?.eventsCoordinated ?? 0,
      icon: (
        <CalendarDays size={24} />
      ),
      color: "blue",
    },
    {
      title: "Reports Submitted",
      value:
        statistics?.reportsSubmitted ??
        0,
      icon: <FileText size={24} />,
      color: "orange",
    },
    {
      title: "Performance Score",
      value: `${
        statistics?.performanceScore ??
        0
      }%`,
      icon: (
        <TrendingUp size={24} />
      ),
      color: "purple",
    },
  ];

  return (
    <section className="leadership-statistics">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="leadership-statistics-header">

        <h3>

          Leadership Statistics

        </h3>

        <p>

          Your leadership activity
          and performance summary.

        </p>

      </div>

      {/* =====================================
          GRID
      ====================================== */}

      <div className="leadership-statistics-grid">

        {cards.map((card) => (

          <div
            key={card.title}
            className={`leadership-stat-card ${card.color}`}
          >

            <div className="stat-icon">

              {card.icon}

            </div>

            <div className="stat-content">

              <span>

                {card.title}

              </span>

              <strong>

                {card.value}

              </strong>

            </div>

          </div>

        ))}

      </div>

      {/* =====================================
          FOOTER
      ====================================== */}

      <div className="leadership-statistics-footer">

        <small>

          Leadership analytics will
          automatically update as you
          participate in JVP Connect
          activities.

        </small>

      </div>

    </section>
  );
}

export default LeadershipStatistics;