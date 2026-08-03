import {
  AlertTriangle,
  MapPin,
  UserRound,
} from "lucide-react";

import "./DeleteLeaderDialog.css";

export default function DeleteLeaderDialog({
  open,
  leader,
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!open || !leader) {
    return null;
  }

  /* ==========================================================
     HELPERS
  ========================================================== */

  const formatLabel = (value) => {
    if (!value) {
      return "-";
    }

    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const isPatron =
    !leader.member;

  const leaderName =
    isPatron
      ? leader.patron?.fullName ||
        "Unknown Patron"
      : [
          leader.member?.firstName,
          leader.member?.middleName,
          leader.member?.lastName,
        ]
          .filter(Boolean)
          .join(" ") ||
        "Unknown Member";

  const location = [
    leader.ward,
    leader.constituency,
    leader.county,
  ]
    .filter(Boolean)
    .join(", ");

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      className="delete-leader-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div
        className="delete-leader-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-leader-title"
        aria-describedby="delete-leader-description"
      >
        {/* ==========================================
            WARNING ICON
        ========================================== */}

        <div className="delete-leader-icon">
          <AlertTriangle
            size={38}
            aria-hidden="true"
          />
        </div>

        {/* ==========================================
            TITLE
        ========================================== */}

        <h2 id="delete-leader-title">
          Remove Leadership Assignment
        </h2>

        <p id="delete-leader-description">
          Are you sure you want to remove
          the leadership assignment for{" "}
          <strong>
            {leaderName}
          </strong>
          ?
        </p>

        {/* ==========================================
            LEADER SUMMARY
        ========================================== */}

        <div className="delete-leader-summary">
          <div className="delete-leader-summary-item">
            <span>
              <UserRound
                size={14}
                aria-hidden="true"
              />

              Leader
            </span>

            <strong>
              {leaderName}
            </strong>
          </div>

          <div className="delete-leader-summary-item">
            <span>
              Position
            </span>

            <strong>
              {formatLabel(
                leader.position
              )}
            </strong>
          </div>

          <div className="delete-leader-summary-item">
            <span>
              Category
            </span>

            <strong>
              {formatLabel(
                leader.category
              )}
            </strong>
          </div>

          {leader.department && (
            <div className="delete-leader-summary-item">
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

          {leader.scope && (
            <div className="delete-leader-summary-item">
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

          {!isPatron && (
            <div className="delete-leader-summary-item">
              <span>
                <MapPin
                  size={14}
                  aria-hidden="true"
                />

                Location
              </span>

              <strong>
                {location || "-"}
              </strong>
            </div>
          )}

          {isPatron &&
            leader.patron
              ?.organization && (
              <div className="delete-leader-summary-item">
                <span>
                  Organization
                </span>

                <strong>
                  {
                    leader.patron
                      .organization
                  }
                </strong>
              </div>
            )}
        </div>

        {/* ==========================================
            WARNING
        ========================================== */}

        <div className="delete-leader-warning">
          <strong>
            Important:
          </strong>{" "}

          This action permanently removes
          the leadership assignment. The{" "}

          {isPatron
            ? "patron record"
            : "member account"}{" "}

          will remain in the system.
        </div>

        {/* ==========================================
            ACTIONS
        ========================================== */}

        <div className="delete-leader-actions">
          <button
            type="button"
            className="delete-leader-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="delete-leader-confirm"
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