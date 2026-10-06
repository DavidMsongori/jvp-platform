import { useState } from "react";
import {
  Plus,
  Crown,
  Building2,
  Landmark,
  Users,
  Map,
} from "lucide-react";

import "./LeadershipPage.css";

import LeaderTable from "./components/LeaderTable";
import LeaderFilters from "./components/LeaderFilters";
import LeaderFormModal from "./components/LeaderFormModal";
import DeleteLeaderDialog from "./components/DeleteLeaderDialog";

import { useLeaders } from "../../../context/LeaderContext";

import {
  LEADERSHIP_CATEGORIES,
  LEADERSHIP_LEVELS,
  LEADERSHIP_SCOPE,
} from "../../../constants/leadership.constants";

export default function LeadershipPage() {
  const {
    leaders,
    loading,
    error,
    filters,

    createLeader,
    updateLeader,
    deleteLeader,

    updateFilters,
    resetFilters,
  } = useLeaders();

  /* ==========================================================
     LOCAL STATE
  ========================================================== */

  const [showForm, setShowForm] = useState(false);

  const [editingLeader, setEditingLeader] =
    useState(null);

  const [showDeleteDialog, setShowDeleteDialog] =
    useState(false);

  const [selectedLeader, setSelectedLeader] =
    useState(null);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  /* ==========================================================
     CREATE / UPDATE
  ========================================================== */

  const handleSave = async (formData) => {
    try {
      setSaving(true);

      if (editingLeader) {
        await updateLeader(
          editingLeader._id,
          formData
        );
      } else {
        await createLeader(formData);
      }

      setShowForm(false);
      setEditingLeader(null);
    } catch (err) {
      console.error(
        "Failed to save leadership record:",
        err
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async () => {
    if (!selectedLeader?._id) return;

    try {
      setDeleting(true);

      await deleteLeader(selectedLeader._id);

      setShowDeleteDialog(false);
      setSelectedLeader(null);
    } catch (err) {
      console.error(
        "Failed to delete leadership record:",
        err
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ==========================================================
     EDIT
  ========================================================== */

  const handleEdit = (leader) => {
    setEditingLeader(leader);
    setShowForm(true);
  };

  /* ==========================================================
     CREATE
  ========================================================== */

  const handleCreate = () => {
    setEditingLeader(null);
    setShowForm(true);
  };

  /* ==========================================================
     FILTER HANDLERS
  ========================================================== */

  const handleCategoryChange = (value) => {
    updateFilters({
      category:
        value === "all" ? "" : value,
    });
  };

  const handleLevelChange = (value) => {
    updateFilters({
      level:
        value === "all" ? "" : value,
    });
  };

  const handleScopeChange = (value) => {
    updateFilters({
      scope:
        value === "all" ? "" : value,
    });
  };

  const handleCountyChange = (value) => {
    updateFilters({
      county:
        value === "all" ? "" : value,
    });
  };

  const handleStatusChange = (value) => {
    updateFilters({
      active:
        value === "all" ? "" : value,
    });
  };

  /* ==========================================================
     CLEAR STRUCTURAL FILTERS
  ========================================================== */

  const clearStructureFilters = () => {
    updateFilters({
      category: "",
      level: "",
      scope: "",
    });
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="leadership-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="leadership-header">

        <div className="leadership-header-content">

          <div className="leadership-header-icon">
            <Crown size={24} />
          </div>

          <div>
            <h1>
              Leadership Management
            </h1>

            <p>
              Manage the JVP leadership structure,
              elected officials, appointments,
              assemblies, county cabinets, the
              Council of Governors, and patronage.
            </p>
          </div>

        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={handleCreate}
        >
          <Plus size={18} />

          Assign Leader
        </button>

      </div>

      {/* ======================================================
          GOVERNANCE STRUCTURE
      ====================================================== */}

      <div className="leadership-structure">

        {/* ----------------------------------------------------
            PATRON
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category:
                LEADERSHIP_CATEGORIES.PATRONAGE,
              level: "",
              scope: "",
            })
          }
        >
          <div className="structure-card-icon">
            <Crown size={20} />
          </div>

          <div>
            <strong>Patron</strong>
            <span>Patronage</span>
          </div>
        </button>

        {/* ----------------------------------------------------
            REGIONAL CABINET
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category: "",
              level:
                LEADERSHIP_LEVELS.REGIONAL_CABINET,
              scope:
                LEADERSHIP_SCOPE.REGIONAL_CABINET,
            })
          }
        >
          <div className="structure-card-icon">
            <Building2 size={20} />
          </div>

          <div>
            <strong>Regional Cabinet</strong>
            <span>Executive</span>
          </div>
        </button>

        {/* ----------------------------------------------------
            REGIONAL YOUTH ASSEMBLY
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category: "",
              level:
                LEADERSHIP_LEVELS.REGIONAL_YOUTH_ASSEMBLY,
              scope:
                LEADERSHIP_SCOPE.REGIONAL_YOUTH_ASSEMBLY,
            })
          }
        >
          <div className="structure-card-icon">
            <Landmark size={20} />
          </div>

          <div>
            <strong>
              Regional Youth Assembly
            </strong>
            <span>Legislative</span>
          </div>
        </button>

        {/* ----------------------------------------------------
            COUNCIL OF GOVERNORS
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category: "",
              level:
                LEADERSHIP_LEVELS.COUNCIL_OF_GOVERNORS,
              scope: "",
            })
          }
        >
          <div className="structure-card-icon">
            <Users size={20} />
          </div>

          <div>
            <strong>
              Council of Governors
            </strong>
            <span>Secretariat</span>
          </div>
        </button>

        {/* ----------------------------------------------------
            COUNTY CABINETS
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category: "",
              level:
                LEADERSHIP_LEVELS.COUNTY_CABINET,
              scope:
                LEADERSHIP_SCOPE.COUNTY_CABINET,
            })
          }
        >
          <div className="structure-card-icon">
            <Building2 size={20} />
          </div>

          <div>
            <strong>County Cabinets</strong>
            <span>County Executive</span>
          </div>
        </button>

        {/* ----------------------------------------------------
            COUNTY YOUTH ASSEMBLIES
        ---------------------------------------------------- */}

        <button
          type="button"
          className="leadership-structure-card"
          onClick={() =>
            updateFilters({
              category: "",
              level:
                LEADERSHIP_LEVELS.COUNTY_YOUTH_ASSEMBLY,
              scope:
                LEADERSHIP_SCOPE.COUNTY_YOUTH_ASSEMBLY,
            })
          }
        >
          <div className="structure-card-icon">
            <Map size={20} />
          </div>

          <div>
            <strong>
              County Youth Assemblies
            </strong>
            <span>County Legislative</span>
          </div>
        </button>

      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <LeaderFilters
        search={filters.search || ""}

        category={
          filters.category || "all"
        }

        level={
          filters.level || "all"
        }

        scope={
          filters.scope || "all"
        }

        county={
          filters.county || "all"
        }

        active={
          filters.active || "all"
        }

        onSearchChange={(value) =>
          updateFilters({
            search: value,
          })
        }

        onCategoryChange={
          handleCategoryChange
        }

        onLevelChange={
          handleLevelChange
        }

        onScopeChange={
          handleScopeChange
        }

        onCountyChange={
          handleCountyChange
        }

        onStatusChange={
          handleStatusChange
        }

        onReset={resetFilters}
      />

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div
          className="error-banner"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* ======================================================
          RESULTS SUMMARY
      ====================================================== */}

      {!loading && (
        <div className="leadership-results-summary">

          <div>
            <strong>
              {leaders?.length || 0}
            </strong>

            <span>
              leadership record
              {(leaders?.length || 0) === 1
                ? ""
                : "s"}
            </span>
          </div>

          <div className="leadership-results-context">

            {filters.category && (
              <span>
                Category:{" "}
                {filters.category}
              </span>
            )}

            {filters.level && (
              <span>
                Level:{" "}
                {filters.level}
              </span>
            )}

            {filters.scope && (
              <span>
                Structure:{" "}
                {filters.scope}
              </span>
            )}

            {filters.county && (
              <span>
                County:{" "}
                {filters.county}
              </span>
            )}

            {(filters.category ||
              filters.level ||
              filters.scope) && (
              <button
                type="button"
                className="clear-structure-filter"
                onClick={
                  clearStructureFilters
                }
              >
                Clear structure
              </button>
            )}

          </div>

        </div>
      )}

      {/* ======================================================
          LEADERS TABLE
      ====================================================== */}

      <LeaderTable
        leaders={leaders}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(leader) => {
          setSelectedLeader(leader);
          setShowDeleteDialog(true);
        }}
      />

      {/* ======================================================
          CREATE / EDIT MODAL
      ====================================================== */}

      <LeaderFormModal
        open={showForm}
        leader={editingLeader}
        loading={saving}
        onClose={() => {
          setShowForm(false);
          setEditingLeader(null);
        }}
        onSave={handleSave}
      />

      {/* ======================================================
          DELETE DIALOG
      ====================================================== */}

      <DeleteLeaderDialog
        open={showDeleteDialog}
        leader={selectedLeader}
        loading={deleting}
        onCancel={() => {
          setShowDeleteDialog(false);
          setSelectedLeader(null);
        }}
        onConfirm={handleDelete}
      />

    </div>
  );
}