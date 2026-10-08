import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import LeaderCard from "./LeaderCard";

import "./ExecutiveSection.css";

const DEFAULT_VISIBLE_LEADERS = 4;

export default function ExecutiveSection({
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
      className="executive-section"
      aria-labelledby="regional-cabinet-title"
    >
      <div className="executive-section__container">
        {/* Header */}
        <header className="executive-section__header">
          <div className="executive-section__heading">
            <span className="executive-section__eyebrow">
              <Building2 size={12} />
              Regional Leadership
            </span>

            <h2
              id="regional-cabinet-title"
              className="executive-section__title"
            >
              Regional Cabinet
            </h2>

            <div
              className="executive-section__accent"
              aria-hidden="true"
            />

            <p className="executive-section__intro">
              The Regional Cabinet provides strategic
              direction and coordinates the implementation
              of JVP's vision, programmes and priorities
              across the six Coastal Counties.
            </p>
          </div>

          <div
            className="executive-section__count"
            aria-label={`${leaders.length} cabinet members`}
          >
            <Users size={14} />

            <strong>{leaders.length}</strong>

            <span>
              {leaders.length === 1 ? "Member" : "Members"}
            </span>
          </div>
        </header>

        {/* Directory */}
        <div className="executive-section__directory">
          <div className="executive-section__directory-header">
            <div className="executive-section__directory-label">
              <BriefcaseBusiness size={11} />
              Executive Directory
            </div>

            {hasMore && (
              <span className="executive-section__preview">
                Showing {visibleLeaders.length} of{" "}
                {leaders.length}
              </span>
            )}
          </div>

          <div className="executive-section__grid">
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

          {showViewAll && hasMore && (
            <div className="executive-section__action">
              <Link
                to="/leadership/executive"
                className="executive-section__view-all"
              >
                <span>View Full Executive Team</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}