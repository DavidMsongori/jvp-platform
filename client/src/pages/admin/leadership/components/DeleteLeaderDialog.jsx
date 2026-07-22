import { AlertTriangle, MapPin, UserRound } from "lucide-react";

export default function DeleteLeaderDialog({
  open,
  leader,
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open || !leader) return null;

  /* ==========================================================
     HELPERS
  ========================================================== */

  const formatLabel = (value) => {
    if (!value) return "-";

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const isPatron = !leader.member;

  const leaderName = isPatron
    ? leader.patron?.fullName || "Unknown Patron"
    : [
        leader.member?.firstName,
        leader.member?.middleName,
        leader.member?.lastName,
      ]
        .filter(Boolean)
        .join(" ") || "Unknown Member";

  const profile = leader.profile || {};

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-leader-title"
    >
      <div className="delete-dialog">

        {/* ==========================================
            WARNING ICON
        ========================================== */}

        <div className="delete-icon">
          <AlertTriangle size={42} />
        </div>

        {/* ==========================================
            TITLE
        ========================================== */}

        <h2 id="delete-leader-title">
          Remove Leadership Assignment
        </h2>

        <p>
          Are you sure you want to remove the leadership
          assignment for{" "}
          <strong>{leaderName}</strong>?
        </p>

        {/* ==========================================
            LEADER SUMMARY
        ========================================== */}

        <div className="delete-summary">

          {/* Leader */}

          <div className="delete-summary-item">

            <span>
              <UserRound size={14} />
              Leader
            </span>

            <strong>
              {leaderName}
            </strong>

          </div>

          {/* Position */}

          <div className="delete-summary-item">

            <span>
              Position
            </span>

            <strong>
              {leader.position || "-"}
            </strong>

          </div>

          {/* Category */}

          <div className="delete-summary-item">

            <span>
              Category
            </span>

            <strong>
              {formatLabel(
                leader.category
              )}
            </strong>

          </div>

          {/* Department */}

          {leader.department && (

            <div className="delete-summary-item">

              <span>
                Department
              </span>

              <strong>
                {formatLabel(
                  leader.department
                )}
              </strong>

            </div>

          )}

          {/* Scope */}

          {leader.scope && (

            <div className="delete-summary-item">

              <span>
                Scope
              </span>

              <strong>
                {formatLabel(
                  leader.scope
                )}
              </strong>

            </div>

          )}

          {/* Geography */}

          {!isPatron && (

            <div className="delete-summary-item">

              <span>
                <MapPin size={14} />
                Location
              </span>

              <strong>

                {[
                  leader.ward,
                  leader.constituency,
                  leader.county,
                ]
                  .filter(Boolean)
                  .join(", ") || "-"}

              </strong>

            </div>

          )}

          {/* Patron Organization */}

          {isPatron &&
            leader.patron?.organization && (

              <div className="delete-summary-item">

                <span>
                  Organization
                </span>

                <strong>
                  {leader.patron.organization}
                </strong>

              </div>

            )}

        </div>

        {/* ==========================================
            WARNING
        ========================================== */}

        <div className="delete-warning">

          <strong>
            Important:
          </strong>{" "}

          This will permanently remove the leadership
          assignment. The{" "}

          {isPatron
            ? "patron record"
            : "member account"}

          {" "}will remain in the system.

        </div>

        {/* ==========================================
            ACTIONS
        ========================================== */}

        <div className="modal-actions">

          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn-danger"
            disabled={loading}
            onClick={() =>
              onConfirm(leader)
            }
          >
            {loading
              ? "Removing..."
              : "Remove Leader"}
          </button>

        </div>

      </div>
    </div>
  );
}