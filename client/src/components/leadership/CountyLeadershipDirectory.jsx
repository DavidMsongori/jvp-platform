import {
  ArrowLeft,
  Building2,
  Landmark,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import LeaderCard from "./LeaderCard";

import "./CountyLeadershipDirectory.css";

function LeaderGrid({
  leaders = [],
  emptyMessage,
}) {
  if (!leaders.length) {
    return (
      <div className="county-directory__empty">
        <Users size={20} />
        <span>{emptyMessage}</span>
      </div>
    );
  }

  return (
    <div className="county-directory__grid">
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
  );
}

export default function CountyLeadershipDirectory({
  county,
  cabinet = [],
  assembly = [],
}) {
  return (
    <section
      className="county-directory"
      aria-labelledby="county-directory-title"
    >
      <div className="county-directory__container">
        {/* ==================================================
            INTRO
        ================================================== */}

        <header className="county-directory__header">
          <div className="county-directory__heading">
            <span className="county-directory__eyebrow">
              <Users size={12} />
              County Leadership Directory
            </span>

            <h2
              id="county-directory-title"
              className="county-directory__title"
            >
              {county} Leadership
            </h2>

            <div
              className="county-directory__accent"
              aria-hidden="true"
            />

            <p className="county-directory__description">
              Explore the complete leadership structure
              serving young people across {county},
              including the County Cabinet and County
              Youth Assembly.
            </p>
          </div>

          <Link
            to="/leadership"
            className="county-directory__back"
          >
            <ArrowLeft size={13} />
            <span>All Leadership</span>
          </Link>
        </header>

        {/* ==================================================
            COUNTY CABINET
        ================================================== */}

        <section
          className="county-directory__section"
          aria-labelledby="county-cabinet-title"
        >
          <header className="county-directory__section-header">
            <div className="county-directory__section-title">
              <span className="county-directory__section-icon">
                <Building2 size={15} />
              </span>

              <div>
                <span className="county-directory__section-eyebrow">
                  Executive Leadership
                </span>

                <h3 id="county-cabinet-title">
                  County Cabinet
                </h3>
              </div>
            </div>

            <div
              className="county-directory__section-count"
              aria-label={`${cabinet.length} County Cabinet leaders`}
            >
              <strong>{cabinet.length}</strong>
              <span>
                {cabinet.length === 1
                  ? "Leader"
                  : "Leaders"}
              </span>
            </div>
          </header>

          <LeaderGrid
            leaders={cabinet}
            emptyMessage="No County Cabinet leadership records are currently available."
          />
        </section>

        {/* ==================================================
            COUNTY YOUTH ASSEMBLY
        ================================================== */}

        <section
          className="county-directory__section"
          aria-labelledby="county-assembly-title"
        >
          <header className="county-directory__section-header">
            <div className="county-directory__section-title">
              <span className="county-directory__section-icon">
                <Landmark size={15} />
              </span>

              <div>
                <span className="county-directory__section-eyebrow">
                  Representative Leadership
                </span>

                <h3 id="county-assembly-title">
                  County Youth Assembly
                </h3>
              </div>
            </div>

            <div
              className="county-directory__section-count"
              aria-label={`${assembly.length} County Youth Assembly leaders`}
            >
              <strong>{assembly.length}</strong>
              <span>
                {assembly.length === 1
                  ? "Leader"
                  : "Leaders"}
              </span>
            </div>
          </header>

          <LeaderGrid
            leaders={assembly}
            emptyMessage="No County Youth Assembly leadership records are currently available."
          />
        </section>
      </div>
    </section>
  );
}