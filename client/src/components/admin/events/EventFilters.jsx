import {
  FaSearch,
  FaPlus,
} from "react-icons/fa";
import "./Events.css";

function EventFilters({
  filters,
  setFilters,
  onCreate,
}) {
  const updateFilter = (field, value) => {
    setFilters((previous) => ({
      ...previous,
      page: 1,
      [field]: value,
    }));
  };

  return (
    <div className="event-filters">
      <div className="event-search">
        <FaSearch />

        <input
          type="text"
          placeholder="Search events..."
          value={filters.search}
          onChange={(e) =>
            updateFilter(
              "search",
              e.target.value
            )
          }
        />
      </div>

      <select
        value={filters.status}
        onChange={(e) =>
          updateFilter(
            "status",
            e.target.value
          )
        }
      >
        <option value="">
          All Status
        </option>

        <option value="upcoming">
          Upcoming
        </option>

        <option value="ongoing">
          Ongoing
        </option>

        <option value="completed">
          Completed
        </option>

        <option value="cancelled">
          Cancelled
        </option>
      </select>

      <select
        value={filters.county}
        onChange={(e) =>
          updateFilter(
            "county",
            e.target.value
          )
        }
      >
        <option value="">
          All Counties
        </option>

        <option value="Mombasa">
          Mombasa
        </option>

        <option value="Kilifi">
          Kilifi
        </option>

        <option value="Kwale">
          Kwale
        </option>

        <option value="Taita Taveta">
          Taita Taveta
        </option>

        <option value="Tana River">
          Tana River
        </option>

        <option value="Lamu">
          Lamu
        </option>
      </select>

      <button
        className="create-event-btn"
        onClick={onCreate}
      >
        <FaPlus />
        Create Event
      </button>
    </div>
  );
}

export default EventFilters;