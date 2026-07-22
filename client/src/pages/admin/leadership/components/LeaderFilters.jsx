import {
  Search,
  Filter,
  RotateCcw,
  MapPin,
  Layers,
  BriefcaseBusiness,
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

  onSearchChange,
  onCategoryChange,
  onDepartmentChange,
  onScopeChange,
  onCountyChange,
  onStatusChange,
  onReset,
}) {
  return (
    <div className="leader-filters">

      {/* =====================================================
          SEARCH
      ===================================================== */}

      <div className="filter-search">

        <Search size={18} />

        <input
          type="text"
          placeholder="Search leaders..."
          value={search}
          onChange={(event) =>
            onSearchChange(
              event.target.value
            )
          }
        />

      </div>

      {/* =====================================================
          CATEGORY
      ===================================================== */}

      <div className="filter-group">

        <Layers size={16} />

        <select
          value={category}
          onChange={(event) =>
            onCategoryChange(
              event.target.value
            )
          }
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

      {/* =====================================================
          DEPARTMENT
      ===================================================== */}

      <div className="filter-group">

        <BriefcaseBusiness size={16} />

        <select
          value={department}
          onChange={(event) =>
            onDepartmentChange(
              event.target.value
            )
          }
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

      {/* =====================================================
          SCOPE
      ===================================================== */}

      <div className="filter-group">

        <Filter size={16} />

        <select
          value={scope}
          onChange={(event) =>
            onScopeChange(
              event.target.value
            )
          }
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

      {/* =====================================================
          COUNTY
      ===================================================== */}

      <div className="filter-group">

        <MapPin size={16} />

        <select
          value={county}
          onChange={(event) =>
            onCountyChange(
              event.target.value
            )
          }
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

      {/* =====================================================
          STATUS
      ===================================================== */}

      <div className="filter-group">

        <select
          value={active}
          onChange={(event) =>
            onStatusChange(
              event.target.value
            )
          }
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

      {/* =====================================================
          RESET
      ===================================================== */}

      <button
        type="button"
        className="btn-secondary"
        onClick={onReset}
      >
        <RotateCcw size={16} />

        Reset

      </button>

    </div>
  );
}