import {
  Search,
  Filter,
  RotateCcw,
  MapPin,
  Layers,
  BriefcaseBusiness,
  Activity,
} from "lucide-react";

import "./LeaderFilters.css";

/* ==========================================================
   OPTIONS
========================================================== */

const CATEGORIES = [
  {
    label: "All Leadership Levels",
    value: "all",
  },
  {
    label: "Patron",
    value: "patron",
  },
  {
    label: "Regional Executive",
    value: "regional_executive",
  },
  {
    label: "Youth Assembly",
    value: "youth_assembly",
  },
  {
    label: "County Leadership",
    value: "county_leadership",
  },
];

const DEPARTMENTS = [
  {
    label: "All Departments",
    value: "",
  },
  {
    label: "Executive",
    value: "executive",
  },
  {
    label: "Legislative",
    value: "legislative",
  },
  {
    label: "Administration",
    value: "administration",
  },
  {
    label: "Finance",
    value: "finance",
  },
  {
    label: "Programs",
    value: "programs",
  },
  {
    label: "Communications",
    value: "communications",
  },
  {
    label: "Youth Affairs",
    value: "youth_affairs",
  },
  {
    label: "Other",
    value: "other",
  },
];

const SCOPES = [
  {
    label: "All Scopes",
    value: "",
  },
  {
    label: "Regional",
    value: "regional",
  },
  {
    label: "County",
    value: "county",
  },
  {
    label: "Constituency",
    value: "constituency",
  },
  {
    label: "Ward",
    value: "ward",
  },
  {
    label: "National",
    value: "national",
  },
];

const COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

/* ==========================================================
   COMPONENT
========================================================== */

export default function LeaderFilters({
  search = "",
  category = "all",
  department = "",
  scope = "",
  county = "",
  active = "all",

  onSearchChange = () => {},
  onCategoryChange = () => {},
  onDepartmentChange = () => {},
  onScopeChange = () => {},
  onCountyChange = () => {},
  onStatusChange = () => {},
  onReset = () => {},
}) {
  return (
    <section
      className="leader-filters"
      aria-label="Leadership filters"
    >
      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="leader-filter-search">
        <Search
          size={18}
          strokeWidth={2}
          aria-hidden="true"
        />

        <input
          type="search"
          placeholder="Search leaders by name, title or county..."
          value={search}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          aria-label="Search leaders"
        />

        {search && (
          <button
            type="button"
            className="leader-filter-clear"
            onClick={() => onSearchChange("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* =====================================================
          FILTER CONTROLS
      ===================================================== */}

      <div className="leader-filter-controls">

        {/* CATEGORY */}

        <div className="leader-filter-group">
          <Layers
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <select
            value={category}
            onChange={(event) =>
              onCategoryChange(event.target.value)
            }
            aria-label="Filter by leadership level"
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
        </div>

        {/* DEPARTMENT */}

        <div className="leader-filter-group">
          <BriefcaseBusiness
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <select
            value={department}
            onChange={(event) =>
              onDepartmentChange(event.target.value)
            }
            aria-label="Filter by department"
          >
            {DEPARTMENTS.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* SCOPE */}

        <div className="leader-filter-group">
          <Filter
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <select
            value={scope}
            onChange={(event) =>
              onScopeChange(event.target.value)
            }
            aria-label="Filter by scope"
          >
            {SCOPES.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* COUNTY */}

        <div className="leader-filter-group">
          <MapPin
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <select
            value={county}
            onChange={(event) =>
              onCountyChange(event.target.value)
            }
            aria-label="Filter by county"
          >
            <option value="">
              All Counties
            </option>

            {COUNTIES.map((countyName) => (
              <option
                key={countyName}
                value={countyName}
              >
                {countyName}
              </option>
            ))}
          </select>
        </div>

        {/* STATUS */}

        <div className="leader-filter-group">
          <Activity
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <select
            value={active}
            onChange={(event) =>
              onStatusChange(event.target.value)
            }
            aria-label="Filter by leadership status"
          >
            <option value="all">
              All Status
            </option>

            <option value="true">
              Active
            </option>

            <option value="false">
              Inactive
            </option>
          </select>
        </div>

        {/* RESET */}

        <button
          type="button"
          className="leader-filter-reset"
          onClick={onReset}
          title="Reset all leadership filters"
        >
          <RotateCcw
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />

          <span>Reset</span>
        </button>
      </div>
    </section>
  );
}