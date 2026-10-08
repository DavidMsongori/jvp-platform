import { useEffect, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

import "./Filters.css";

const CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "conference", label: "Conference" },
  { value: "summit", label: "Summit" },
  { value: "training", label: "Training" },
  { value: "workshop", label: "Workshop" },
  { value: "forum", label: "Forum" },
  { value: "webinar", label: "Webinar" },
  { value: "networking", label: "Networking" },
  { value: "competition", label: "Competition" },
  { value: "sports", label: "Sports" },
  { value: "tree_planting", label: "Tree Planting" },
  { value: "community_service", label: "Community Service" },
  { value: "career_fair", label: "Career Fair" },
  { value: "meeting", label: "Meeting" },
  { value: "leadership", label: "Leadership" },
  { value: "other", label: "Other" },
];

const EVENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "physical", label: "Physical" },
  { value: "virtual", label: "Virtual" },
  { value: "hybrid", label: "Hybrid" },
];

const SORT_OPTIONS = [
  { value: "", label: "Sort By" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "upcoming", label: "Upcoming" },
  { value: "featured", label: "Featured" },
];

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  eventType: "",
  featured: "",
  sort: "",
};

function Filters({ filters = DEFAULT_FILTERS, onChange }) {
  const [values, setValues] = useState({
    ...DEFAULT_FILTERS,
    ...filters,
  });

  /*
   * Keep local controls synchronized when the parent resets
   * or changes the filters.
   */
  useEffect(() => {
    setValues({
      ...DEFAULT_FILTERS,
      ...filters,
    });
  }, [
    filters.search,
    filters.category,
    filters.eventType,
    filters.featured,
    filters.sort,
  ]);

  /*
   * Debounce SEARCH.
   *
   * This prevents an API request on every single keystroke.
   */
  useEffect(() => {
    const currentSearch = values.search ?? "";
    const parentSearch = filters.search ?? "";

    if (currentSearch === parentSearch) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onChange?.({
        ...values,
        search: currentSearch,
      });
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [values.search]);

  /* =========================================================
     FIELD CHANGE
     ========================================================= */

  const handleChange = (field, value) => {
    setValues((previous) => ({
      ...previous,
      [field]: value,
    }));

    /*
     * Search is handled by the debounce effect above.
     */
    if (field === "search") {
      return;
    }

    onChange?.({
      ...values,
      [field]: value,
    });
  };

  /* =========================================================
     RESET
     ========================================================= */

  const handleReset = () => {
    const reset = {
      ...DEFAULT_FILTERS,
    };

    setValues(reset);
    onChange?.(reset);
  };

  /* =========================================================
     ACTIVE FILTERS
     ========================================================= */

  const activeFilterCount = [
    values.category,
    values.eventType,
    values.featured,
    values.sort,
  ].filter(Boolean).length;

  const hasFilters =
    Boolean(values.search) ||
    activeFilterCount > 0;

  return (
    <section className="event-filters">

      <div className="event-filters__container">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="event-filters__header">

          <div className="event-filters__heading">

            <div className="event-filters__icon">
              <SlidersHorizontal size={15} />
            </div>

            <div>
              <span className="event-filters__eyebrow">
                EXPLORE
              </span>

              <h2>
                Find an Event
              </h2>
            </div>

          </div>

          <div className="event-filters__header-actions">

            {activeFilterCount > 0 && (
              <span className="event-filters__count">
                {activeFilterCount} active
              </span>
            )}

            {hasFilters && (
              <button
                type="button"
                className="event-filters__reset"
                onClick={handleReset}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

          </div>

        </div>

        {/* =====================================================
            FILTER CONTROLS
            ===================================================== */}

        <div className="event-filters__controls">

          {/* Search */}

          <div className="event-filter event-filter--search">

            <Search
              size={16}
              className="event-filter__search-icon"
            />

            <input
              type="search"
              placeholder="Search events..."
              value={values.search}
              aria-label="Search events"
              onChange={(event) =>
                handleChange(
                  "search",
                  event.target.value
                )
              }
            />

            {values.search && (
              <button
                type="button"
                className="event-filter__clear"
                onClick={() =>
                  handleChange("search", "")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}

          </div>

          {/* Category */}

          <div className="event-filter-select">

            <select
              value={values.category}
              onChange={(event) =>
                handleChange(
                  "category",
                  event.target.value
                )
              }
              aria-label="Filter by category"
            >
              {CATEGORIES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={14}
              className="event-filter-select__icon"
            />

          </div>

          {/* Event Type */}

          <div className="event-filter-select">

            <select
              value={values.eventType}
              onChange={(event) =>
                handleChange(
                  "eventType",
                  event.target.value
                )
              }
              aria-label="Filter by event type"
            >
              {EVENT_TYPES.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={14}
              className="event-filter-select__icon"
            />

          </div>

          {/* Featured */}

          <div className="event-filter-select">

            <select
              value={values.featured}
              onChange={(event) =>
                handleChange(
                  "featured",
                  event.target.value
                )
              }
              aria-label="Filter featured events"
            >
              <option value="">
                All Events
              </option>

              <option value="true">
                Featured Only
              </option>
            </select>

            <ChevronDown
              size={14}
              className="event-filter-select__icon"
            />

          </div>

          {/* Sort */}

          <div className="event-filter-select">

            <select
              value={values.sort}
              onChange={(event) =>
                handleChange(
                  "sort",
                  event.target.value
                )
              }
              aria-label="Sort events"
            >
              {SORT_OPTIONS.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            <ChevronDown
              size={14}
              className="event-filter-select__icon"
            />

          </div>

        </div>

      </div>

    </section>
  );
}

export default Filters;