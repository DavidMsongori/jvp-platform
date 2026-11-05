
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaUserTie,
  FaImages,
  FaArrowRight,
} from "react-icons/fa";

import "./JVPAtOneDashboard.css";

const managementSections = [
  {
    title: "Registered Youths",
    description:
      "View, search and manage youth registrations from Lamu County.",
    icon: <FaUsers />,
    path: "/admin/jvp-at-one/registrations",
    label: "Manage youth registrations",
  },
  {
    title: "Registered Leaders",
    description:
      "View and manage leaders registered for the JVP @ 1 anniversary.",
    icon: <FaUserTie />,
    path: "/admin/jvp-at-one/leaders",
    label: "Manage leader registrations",
  },
  {
    title: "Photo Management",
    description:
      "Upload anniversary photos, view the gallery and manage uploaded images.",
    icon: <FaImages />,
    path: "/admin/jvp-at-one/photos",
    label: "Manage anniversary photos",
  },
];

export default function JVPAtOneDashboard() {
  return (
    <div className="jvp-one-dashboard">
      <header className="jvp-one-dashboard-header">
        <div>
          <span className="jvp-one-dashboard-eyebrow">
            JUMUIYA YA VIJANA WA PWANI
          </span>

          <h1>JVP @ 1 Management</h1>

          <p>
            Welcome to the anniversary management portal.
            Select a section below to continue.
          </p>
        </div>
      </header>

      <section className="jvp-one-dashboard-grid">
        {managementSections.map((section) => (
          <Link
            to={section.path}
            className="jvp-one-management-card"
            key={section.title}
          >
            <div className="jvp-one-management-icon">
              {section.icon}
            </div>

            <div className="jvp-one-management-content">
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>

            <div className="jvp-one-management-link">
              <span>{section.label}</span>
              <FaArrowRight />
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
