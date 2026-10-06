import {
  Edit,
  Trash2,
  UserCheck,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
  Layers,
  Globe2,
} from "lucide-react";

import "./LeaderTable.css";

const DEFAULT_AVATAR = "/avatar.png";

/* ==========================================================
   HELPERS
========================================================== */

const formatLabel = (value) => {
  if (!value) return "-";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getMemberName = (member) => {
  if (!member) return "Honorary Leader";

  const name = [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Unnamed Leader";
};

const getMemberPhoto = (member) => {
  if (!member?.profilePhoto) {
    return DEFAULT_AVATAR;
  }

  if (
    typeof member.profilePhoto === "object" &&
    member.profilePhoto?.url
  ) {
    return member.profilePhoto.url;
  }

  if (typeof member.profilePhoto === "string") {
    return member.profilePhoto;
  }

  return DEFAULT_AVATAR;
};

const getJurisdiction = (leader) => {
  const locations = [
    leader?.ward,
    leader?.constituency,
    leader?.county,
  ].filter(Boolean);

  return locations.length
    ? locations.join(" • ")
    : "Regional / National";
};

const getStatusClass = (isActive) => {
  return isActive ? "active" : "inactive";
};

const getCategoryClass = (category) => {
  if (!category) return "default";

  return String(category)
    .toLowerCase()
    .replaceAll("_", "-");
};

const getScopeClass = (scope) => {
  if (!scope) return "default";

  return String(scope)
    .toLowerCase()
    .replaceAll("_", "-");
};

/* ==========================================================
   COMPONENT
========================================================== */

export default function LeaderTable({
  leaders = [],
  loading = false,
  onEdit,
  onDelete,
}) {
  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <div className="leadership-card">
        <div className="leader-table-loading">
          <div className="loading-spinner" />

          <div>
            <strong>
              Loading leadership assignments
            </strong>

            <span>
              Please wait while the leadership directory
              is being loaded.
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================================
     EMPTY
  ======================================================== */

  if (!leaders.length) {
    return (
      <div className="leadership-card">
        <div className="leader-empty-state">

          <div className="empty-icon">
            <UserCheck size={42} />
          </div>

          <h3>
            No Leaders Found
          </h3>

          <p>
            No leadership assignments match
            the selected filters.
          </p>

        </div>
      </div>
    );
  }

  /* ========================================================
     TABLE
  ======================================================== */

  return (
    <div className="leadership-card">

      {/* ====================================================
          TABLE HEADER
      ==================================================== */}

      <div className="leader-table-header">

        <div className="leader-table-title">

          <div className="leader-table-title-icon">
            <UserCheck size={18} />
          </div>

          <div>
            <h3>
              Leadership Assignments
            </h3>

            <p>
              {leaders.length}{" "}
              {leaders.length === 1
                ? "leadership assignment"
                : "leadership assignments"}
            </p>
          </div>

        </div>

        <div className="leader-table-count">
          {leaders.length}
        </div>

      </div>

      {/* ====================================================
          TABLE
      ==================================================== */}

      <div className="leader-table-wrapper">

        <table className="leader-table">

          <thead>
            <tr>

              <th>
                Leader
              </th>

              <th>
                Position
              </th>

              <th>
                Category
              </th>

              <th>
                Scope
              </th>

              <th>
                Jurisdiction
              </th>

              <th>
                Appointment
              </th>

              <th>
                Status
              </th>

              <th className="actions-column">
                Actions
              </th>

            </tr>
          </thead>

          <tbody>

            {leaders.map((leader, index) => {

              const member = leader?.member;

              const leaderName = member
                ? getMemberName(member)
                : leader?.patron?.fullName ||
                  "Honorary Leader";

              const photo = member
                ? getMemberPhoto(member)
                : leader?.patron?.photo ||
                  DEFAULT_AVATAR;

              const categoryClass =
                getCategoryClass(
                  leader?.category
                );

              const scopeClass =
                getScopeClass(
                  leader?.scope
                );

              const statusClass =
                getStatusClass(
                  leader?.isActive
                );

              return (
                <tr
                  key={
                    leader?._id ||
                    leader?.id ||
                    `leader-${index}`
                  }
                >

                  {/* ======================================
                      LEADER
                  ====================================== */}

                  <td>

                    <div className="leader-info">

                      <div className="leader-avatar">

                        <img
                          src={photo}
                          alt={leaderName}
                          loading="lazy"
                          onError={(event) => {
                            if (
                              event.currentTarget.src.endsWith(
                                DEFAULT_AVATAR
                              )
                            ) {
                              return;
                            }

                            event.currentTarget.src =
                              DEFAULT_AVATAR;
                          }}
                        />

                        <span
                          className={`avatar-status ${statusClass}`}
                        />
                      </div>

                      <div className="leader-details">

                        <strong>
                          {leaderName}
                        </strong>

                        {member?.memberNumber && (
                          <small>
                            Member No.{" "}
                            {member.memberNumber}
                          </small>
                        )}

                        {!member &&
                          leader?.patron
                            ?.organization && (
                            <small>
                              {
                                leader.patron
                                  .organization
                              }
                            </small>
                          )}

                      </div>

                    </div>

                  </td>

                  {/* ======================================
                      POSITION
                  ====================================== */}

                  <td>

                    <div className="leader-position">

                      <div className="table-icon position-icon">
                        <BriefcaseBusiness
                          size={15}
                        />
                      </div>

                      <span>
                        {formatLabel(
                          leader?.position
                        )}
                      </span>

                    </div>

                  </td>

                  {/* ======================================
                      CATEGORY
                  ====================================== */}

                  <td>

                    <span
                      className={`category-badge ${categoryClass}`}
                    >
                      <Layers size={13} />

                      {formatLabel(
                        leader?.category
                      )}
                    </span>

                  </td>

                  {/* ======================================
                      SCOPE
                  ====================================== */}

                  <td>

                    <span
                      className={`scope-badge ${scopeClass}`}
                    >
                      <Globe2 size={13} />

                      {formatLabel(
                        leader?.scope
                      )}
                    </span>

                  </td>

                  {/* ======================================
                      JURISDICTION
                  ====================================== */}

                  <td>

                    <div className="leader-jurisdiction">

                      <div className="table-icon">
                        <MapPin size={15} />
                      </div>

                      <span>
                        {getJurisdiction(
                          leader
                        )}
                      </span>

                    </div>

                  </td>

                  {/* ======================================
                      APPOINTMENT
                  ====================================== */}

                  <td>

                    <div className="appointment-info">

                      <div className="table-icon">
                        <CalendarDays
                          size={15}
                        />
                      </div>

                      <span>
                        {formatLabel(
                          leader?.appointmentType
                        )}
                      </span>

                    </div>

                  </td>

                  {/* ======================================
                      STATUS
                  ====================================== */}

                  <td>

                    <span
                      className={`status ${statusClass}`}
                    >
                      <span className="status-dot" />

                      {leader?.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>

                  </td>

                  {/* ======================================
                      ACTIONS
                  ====================================== */}

                  <td className="actions-column">

                    <div className="table-actions">

                      <button
                        type="button"
                        className="icon-action edit"
                        onClick={() =>
                          onEdit?.(leader)
                        }
                        title="Edit leadership assignment"
                        aria-label={`Edit ${leaderName}`}
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        className="icon-action delete"
                        onClick={() =>
                          onDelete?.(leader)
                        }
                        title="Remove leadership assignment"
                        aria-label={`Delete ${leaderName}`}
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}