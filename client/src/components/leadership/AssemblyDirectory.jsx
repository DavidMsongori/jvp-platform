import {
  Landmark,
  Users,
} from "lucide-react";

import LeaderCard from "./LeaderCard";

import "./AssemblyDirectory.css";

export default function AssemblyDirectory({
  leaders = [],
}) {
  if (!leaders.length) {
    return (
      <section className="assembly-directory assembly-directory--empty">
        <div className="assembly-directory__container">
          <div className="assembly-directory__empty">
            <Landmark size={22} />

            <h2>Youth Assembly</h2>

            <p>
              No Youth Assembly leadership records are
              currently available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="assembly-directory"
      aria-labelledby="assembly-directory-title"
    >
      <div className="assembly-directory__container">
        {/* =================================================
            HEADER
        ================================================= */}

        <header className="assembly-directory__header">
          <div className="assembly-directory__heading">
            <span className="assembly-directory__eyebrow">
              <Landmark size={12} />
              Representative Leadership
            </span>

            <h2
              id="assembly-directory-title"
              className="assembly-directory__title"
            >
              Meet the Youth Assembly
            </h2>

            <div
              className="assembly-directory__accent"
              aria-hidden="true"
            />

            <p className="assembly-directory__description">
              The JVP Youth Assembly is the representative
              body of young people within Jumuiya ya Vijana
              wa Pwani. Its members provide representation,
              oversight and a strong youth voice in regional
              affairs.
            </p>
          </div>

          <div
            className="assembly-directory__count"
            aria-label={`${leaders.length} Youth Assembly leaders`}
          >
            <Users size={14} />

            <strong>{leaders.length}</strong>

            <span>
              {leaders.length === 1
                ? "Leader"
                : "Leaders"}
            </span>
          </div>
        </header>

        {/* =================================================
            DIRECTORY
        ================================================= */}

        <div className="assembly-directory__bar">
          <div className="assembly-directory__label">
            <Landmark size={11} />
            Assembly Directory
          </div>

          <span className="assembly-directory__note">
            Regional Youth Representation
          </span>
        </div>

        <div className="assembly-directory__grid">
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