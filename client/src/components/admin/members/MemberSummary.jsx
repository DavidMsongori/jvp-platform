import {
  FaUsers,
  FaUserCheck,
  FaFileImport,
  FaUserPlus,
} from "react-icons/fa";

import "./Members.css";

function MemberSummary({ summary = {} }) {
  const cards = [
    {
      title: "Total Members",
      subtitle: "All registered members",
      value: summary.totalMembers || 0,
      icon: <FaUsers />,
      color: "blue",
    },
    {
      title: "Activated Accounts",
      subtitle: "Can access JVP Connect",
      value: summary.activatedMembers || 0,
      icon: <FaUserCheck />,
      color: "green",
    },
    {
      title: "Imported Members",
      subtitle: "Awaiting account activation",
      value: summary.importedMembers || 0,
      icon: <FaFileImport />,
      color: "orange",
    },
    {
      title: "New Registrations",
      subtitle: "Registered through the platform",
      value: summary.newMembers || 0,
      icon: <FaUserPlus />,
      color: "purple",
    },
  ];

  return (
    <div className="member-summary">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`summary-card ${card.color}`}
        >
          <div className="summary-icon">
            {card.icon}
          </div>

          <div className="summary-content">
            <h3>{card.value.toLocaleString()}</h3>

            <p>{card.title}</p>

            <small>{card.subtitle}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MemberSummary;