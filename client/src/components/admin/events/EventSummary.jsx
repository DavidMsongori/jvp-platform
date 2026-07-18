import {
  FaCalendarAlt,
  FaCalendarCheck,
  FaCalendarTimes,
} from "react-icons/fa";
import "./Events.css";

function EventSummary({ summary = {} }) {
  const cards = [
    {
      title: "Total Events",
      value: summary.totalEvents || 0,
      subtitle: "All created events",
      icon: <FaCalendarAlt />,
      color: "blue",
    },
    {
      title: "Upcoming",
      value: summary.upcomingEvents || 0,
      subtitle: "Future scheduled events",
      icon: <FaCalendarCheck />,
      color: "green",
    },
    {
      title: "Completed",
      value: summary.completedEvents || 0,
      subtitle: "Finished events",
      icon: <FaCalendarTimes />,
      color: "purple",
    },
  ];

  return (
    <div className="event-summary">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`summary-card ${card.color}`}
        >
          <div className="summary-icon">
            {card.icon}
          </div>

          <div className="summary-content">
            <h4>{card.title}</h4>

            <h2>{card.value}</h2>

            <small>{card.subtitle}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventSummary;