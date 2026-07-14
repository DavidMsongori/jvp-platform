import {
  CreditCard,
  ShieldCheck,
  Users,
  MapPin,
  Wallet,
  CalendarDays,
} from "lucide-react";

import "./DashboardStats.css";

function DashboardStats({ dashboard }) {
  if (!dashboard) return null;

  const { profile, statistics } = dashboard;

  const cards = [
    {
      title: "Member Number",
      value:
        profile.memberNumber || "Not Assigned",
      icon: <CreditCard size={28} />,
      color: "blue",
    },
    {
      title: "Membership Status",
      value:
        profile.membershipStatus || "Pending",
      icon: <ShieldCheck size={28} />,
      color:
        profile.membershipStatus === "active"
          ? "green"
          : "orange",
    },
    {
      title: "Membership Type",
      value:
        profile.membershipType || "-",
      icon: <Users size={28} />,
      color: "purple",
    },
    {
      title: "County",
      value:
        profile.county || "-",
      icon: <MapPin size={28} />,
      color: "teal",
    },
    {
      title: "Payments",
      value:
        statistics.totalPayments ?? 0,
      icon: <Wallet size={28} />,
      color: "yellow",
    },
    {
      title: "Event Registrations",
      value:
        statistics.totalRegistrations ?? 0,
      icon: <CalendarDays size={28} />,
      color: "red",
    },
  ];

  return (
    <section className="dashboard-stats">

      {cards.map((card) => (

        <div
          key={card.title}
          className={`stat-card ${card.color}`}
        >

          <div className="stat-icon">
            {card.icon}
          </div>

          <div className="stat-content">

            <span className="stat-title">
              {card.title}
            </span>

            <h3 className="stat-value">
              {card.value}
            </h3>

          </div>

        </div>

      ))}

    </section>
  );
}

export default DashboardStats;