import { useState } from "react";
import { Plus } from "lucide-react";

import "./LeadershipPage.css";

import LeaderTable from "./components/LeaderTable";
import LeaderFilters from "./components/LeaderFilters";
import LeaderFormModal from "./components/LeaderFormModal";
import DeleteLeaderDialog from "./components/DeleteLeaderDialog";

import { useLeaders } from "../../../context/LeaderContext";

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

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     DELETE
  ========================================================== */

  const handleDelete = async () => {
    if (!selectedLeader) return;

    try {
      setDeleting(true);

      await deleteLeader(
        selectedLeader._id
      );

      setShowDeleteDialog(false);
      setSelectedLeader(null);
    } catch (err) {
      console.error(err);
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
     NEW
  ========================================================== */

  const handleCreate = () => {
    setEditingLeader(null);
    setShowForm(true);
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="leadership-page">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="leadership-header">

        <div>

          <h1>
            Leadership Management
          </h1>

          <p>
            Manage patrons, regional executives,
            Youth Assembly leaders, and county
            leadership assignments.
          </p>

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

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <LeaderFilters
        search={
          filters.search || ""
        }

        category={
          filters.category || "all"
        }

        department={
          filters.department || ""
        }

        scope={
          filters.scope || ""
        }

        county={
          filters.county || ""
        }

        active={
          filters.active || "all"
        }

        onSearchChange={(value) =>
          updateFilters({
            search: value,
          })
        }

        onCategoryChange={(value) =>
          updateFilters({
            category:
              value === "all"
                ? ""
                : value,
          })
        }

        onDepartmentChange={(value) =>
          updateFilters({
            department: value,
          })
        }

        onScopeChange={(value) =>
          updateFilters({
            scope: value,
          })
        }

        onCountyChange={(value) =>
          updateFilters({
            county: value,
          })
        }

        onStatusChange={(value) =>
          updateFilters({
            active:
              value === "all"
                ? ""
                : value,
          })
        }

        onReset={resetFilters}
      />

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (

        <div className="error-banner">
          {error}
        </div>

      )}

      {/* =====================================================
          TABLE
      ===================================================== */}

      <LeaderTable
        leaders={leaders}
        loading={loading}
        onEdit={handleEdit}
        onDelete={(leader) => {
          setSelectedLeader(leader);
          setShowDeleteDialog(true);
        }}
      />

      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

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

      {/* =====================================================
          DELETE DIALOG
      ===================================================== */}

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