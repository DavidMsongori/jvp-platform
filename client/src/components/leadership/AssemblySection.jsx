import {
  ArrowRight,
  Landmark,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import LeaderCard from "./LeaderCard";

import "./AssemblySection.css";

const DEFAULT_VISIBLE_LEADERS = 6;

export default function AssemblySection({
  leaders = [],
  limit = DEFAULT_VISIBLE_LEADERS,
  showViewAll = true,
}) {
  if (!leaders.length) {
    return null;
  }

  const visibleLeaders = leaders.slice(0, limit);
  const hasMore = leaders.length > limit;

  return (
    <section
      className="assembly-section"
      aria-labelledby="assembly-section-title"
    >
      <div className="assembly-section__container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="assembly-section__header">
          <div className="assembly-section__heading">

            <span className="assembly-section__eyebrow">
              <Landmark size={11} />
              Representation
            </span>

            <h2
              id="assembly-section-title"
              className="assembly-section__title"
            >
              JVP Youth Assembly
            </h2>

            <div
              className="assembly-section__accent"
              aria-hidden="true"
            />

            <p className="assembly-section__description">
              The Youth Assembly brings together young
              leaders from across the Coast Region to
              champion youth participation, accountability,
              policy advocacy and inclusive development.
            </p>

          </div>

          <div
            className="assembly-section__count"
            aria-label={`${leaders.length} assembly leaders`}
          >
            <Users size={13} />

            <strong>
              {leaders.length}
            </strong>

            <span>
              {leaders.length === 1
                ? "Leader"
                : "Leaders"}
            </span>
          </div>
        </header>


        {/* ==================================================
            DIRECTORY
        ================================================== */}

        <div className="assembly-section__directory">

          <div className="assembly-section__directory-header">

            <div className="assembly-section__directory-label">
              <Landmark size={10} />
              Assembly Leadership
            </div>

            {hasMore && (
              <span className="assembly-section__preview">
                Showing {visibleLeaders.length} of{" "}
                {leaders.length}
              </span>
            )}

          </div>


          {/* ==================================================
              LEADERS
          ================================================== */}

          <div className="assembly-section__grid">
            {visibleLeaders.map((leader, index) => (
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


          {/* ==================================================
              VIEW ALL
          ================================================== */}

          {showViewAll && hasMore && (
            <div className="assembly-section__action">
              <Link
                to="/leadership/assembly"
                className="assembly-section__view-all"
              >
                <span>
                  View Full Youth Assembly
                </span>

                <ArrowRight size={13} />
              </Link>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}