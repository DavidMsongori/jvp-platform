
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import ProgramCard from "./ProgramCard";
import "./FeaturedPrograms.css";

function FeaturedPrograms({
  programs = [],
  loading = false,
  error = "",
  onRetry,
}) {
  const featuredPrograms = programs
    .filter((program) => {
      if (!program) return false;

      const isActivity =
        String(program.recordType || "").toLowerCase() === "activity" ||
        Boolean(program.parentProgram);

      return !isActivity;
    })
    .slice(0, 3);

  return (
    <section
      className="featured-programs"
      aria-labelledby="featured-programs-heading"
    >
      <div className="featured-programs__container">
        <div className="featured-programs__header">
          <div className="featured-programs__intro">
            <span className="featured-programs__eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              Featured Programmes
            </span>

            <h2 id="featured-programs-heading">
              Programmes that make a difference
            </h2>

            <p>
              Discover JVP initiatives creating opportunities and
              empowering young people across the Coast.
            </p>
          </div>

          <Link
            to="/programs"
            className="featured-programs__view-all"
          >
            View all programmes
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <p
            className="featured-programs__message"
            aria-live="polite"
          >
            Loading programmes...
          </p>
        ) : error ? (
          <div
            className="featured-programs__message"
            role="alert"
          >
            <p>Unable to load featured programmes.</p>

            {onRetry && (
              <button
                type="button"
                className="featured-programs__retry"
                onClick={onRetry}
              >
                Try again
              </button>
            )}
          </div>
        ) : featuredPrograms.length > 0 ? (
          <div className="featured-programs__grid">
            {featuredPrograms.map((program) => (
              <ProgramCard
                key={program._id || program.id}
                program={program}
                featured
              />
            ))}
          </div>
        ) : (
          <div className="featured-programs__message">
            <p>
              No featured programmes available at the moment.
            </p>

            <Link
              to="/programs"
              className="featured-programs__view-all"
            >
              Explore programmes
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedPrograms;