import {
  BriefcaseBusiness,
  Users,
} from "lucide-react";

import LeaderCard from "./LeaderCard";

import "./ExecutiveDirectory.css";

export default function ExecutiveDirectory({
  leaders = [],
}) {
  if (!leaders.length) {
    return (
      <section className="executive-directory executive-directory--empty">
        <div className="executive-directory__container">
          <div className="executive-directory__empty">
            <BriefcaseBusiness size={22} />
            <h2>Executive Team</h2>
            <p>
              No executive leadership records are currently
              available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="executive-directory"
      aria-labelledby="executive-directory-title"
    >
      <div className="executive-directory__container">
        <header className="executive-directory__header">
          <div>
            <span className="executive-directory__eyebrow">
              <BriefcaseBusiness size={12} />
              Executive Directory
            </span>

            <h2
              id="executive-directory-title"
              className="executive-directory__title"
            >
              Meet the Regional Cabinet
            </h2>

            <p className="executive-directory__description">
              The JVP Regional Cabinet brings together
              leaders responsible for key areas of youth
              development, economic empowerment, governance
              and regional transformation.
            </p>
          </div>

          <div
            className="executive-directory__count"
            aria-label={`${leaders.length} cabinet members`}
          >
            <Users size={14} />
            <strong>{leaders.length}</strong>
            <span>
              {leaders.length === 1 ? "Member" : "Members"}
            </span>
          </div>
        </header>

        <div className="executive-directory__grid">
          {leaders.map((leader, index) => (
            <LeaderCard
              key={
                leader?._id ||
                leader?.id ||
                leader?.slug ||
                index
              }
              leader={leader}
            />
          ))}
        </div>
      </div>
    </section>
  );
}