
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ArrowRight,
  ListFilter,
} from "lucide-react";

import ProgramCard from "./ProgramCard";
import "./ProgramsListing.css";

function ProgramsListing({
  programs = [],
  categories = [],
  activeCategory = "All Programmes",
  onCategoryChange,
  searchTerm = "",
  onSearchChange,
  showActivities = false,
  onShowActivitiesChange,
  loading = false,
  error = "",
  onRetry,
  onClearFilters,
}) {
  const hasActiveFilters =
    activeCategory !== "All Programmes" ||
    searchTerm.trim() !== "" ||
    showActivities;

  return (
    <section
      className="programs-listing"
      id="programmes-list"
      aria-labelledby="programs-listing-title"
    >
      <div className="programs-listing__container">
        <header className="programs-listing__header">
          <div className="programs-listing__heading">
            <span className="programs-listing__eyebrow">
              EXPLORE OUR WORK
            </span>

            <h2 id="programs-listing-title">
              Explore JVP Programmes
            </h2>

            <p>
              Find initiatives and opportunities making a difference
              across the Coast.
            </p>
          </div>
        </header>

        <div className="programs-listing__toolbar">
          <div className="programs-listing__search">
            <Search size={17} aria-hidden="true" />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              placeholder="Search programmes or locations..."
              aria-label="Search programmes"
            />

            {searchTerm && (
              <button
                type="button"
                className="programs-listing__search-clear"
                onClick={() => onSearchChange?.("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <label className="programs-listing__activity-toggle">
            <input
              type="checkbox"
              checked={showActivities}
              onChange={(event) =>
                onShowActivitiesChange?.(event.target.checked)
              }
            />
            <span>Include activities</span>
          </label>
        </div>

        <div className="programs-listing__filter-heading">
          <span>
            <SlidersHorizontal size={15} />
            Focus area
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              className="programs-listing__reset"
              onClick={onClearFilters}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>

        <div
          className="programs-listing__categories"
          role="group"
          aria-label="Filter programmes by category"
        >
          {categories.map((category) => {
            const isActive = activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                className={`programs-listing__category ${
                  isActive ? "is-active" : ""
                }`}
                onClick={() => onCategoryChange?.(category)}
                aria-pressed={isActive}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div className="programs-listing__results-bar">
          <div className="programs-listing__results-label">
            <ListFilter size={15} />

            <span>
              {loading
                ? "Loading programmes..."
                : `${programs.length} ${
                    programs.length === 1 ? "programme" : "programmes"
                  }`}
            </span>
          </div>

          {activeCategory !== "All Programmes" && (
            <span className="programs-listing__results-note">
              {activeCategory}
            </span>
          )}
        </div>

        {error && !loading && (
          <div className="programs-listing__error" role="alert">
            <div>
              <strong>Unable to load programmes.</strong>
              <p>{error}</p>
            </div>

            {onRetry && (
              <button type="button" onClick={onRetry}>
                Retry <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div
            className="programs-listing__grid programs-listing__grid--loading"
            aria-label="Loading programmes"
            aria-busy="true"
          >
            {[1, 2, 3].map((item) => (
              <div
                className="programs-listing__skeleton"
                key={item}
                aria-hidden="true"
              >
                <div className="programs-listing__skeleton-image" />
                <div className="programs-listing__skeleton-content">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
        ) : programs.length > 0 ? (
          <div className="programs-listing__grid">
            {programs.map((program) => (
              <ProgramCard
                key={program._id || program.id || program.slug}
                program={program}
              />
            ))}
          </div>
        ) : (
          <div className="programs-listing__empty">
            <Search size={22} />

            <h3>No programmes found</h3>

            <p>
              Try a different search or focus area.
            </p>

            {hasActiveFilters && (
              <button
                type="button"
                className="programs-listing__empty-button"
                onClick={onClearFilters}
              >
                Clear filters
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProgramsListing;