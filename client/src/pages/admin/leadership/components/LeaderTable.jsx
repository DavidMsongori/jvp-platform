import {
  Edit,
  Trash2,
  UserCheck,
  MapPin,
  BriefcaseBusiness,
  CalendarDays,
} from "lucide-react";

import "./LeaderTable.css";

const DEFAULT_AVATAR = "/avatar.png";

/* ==========================================================
   HELPERS
========================================================== */

const formatLabel = (value) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getMemberName = (member) => {
  if (!member) return "Honorary Leader";

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

const getMemberPhoto = (member) => {
  if (!member?.profilePhoto) {
    return DEFAULT_AVATAR;
  }

  if (
    typeof member.profilePhoto === "object" &&
    member.profilePhoto.url
  ) {
    return member.profilePhoto.url;
  }

  if (
    typeof member.profilePhoto === "string"
  ) {
    return member.profilePhoto;
  }

  return DEFAULT_AVATAR;
};

const getJurisdiction = (leader) => {
  const locations = [
    leader.ward,
    leader.constituency,
    leader.county,
  ].filter(Boolean);

  return locations.length
    ? locations.join(" • ")
    : "Regional / National";
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
        <div className="empty-state">
          Loading leadership assignments...
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
        <div className="empty-state">

          <UserCheck size={54} />

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

              <th>
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {leaders.map((leader) => {

              const member =
                leader.member;

              const leaderName =
                member
                  ? getMemberName(member)
                  : leader.patron?.fullName ||
                    "Honorary Leader";

              const photo =
                member
                  ? getMemberPhoto(member)
                  : leader.patron?.photo ||
                    DEFAULT_AVATAR;

              return (

                <tr
                  key={leader._id}
                >

                  {/* =====================================
                      LEADER
                  ===================================== */}

                  <td>

                    <div className="leader-info">

                      <img
                        src={photo}
                        alt={leaderName}
                        onError={(event) => {
                          event.currentTarget.src =
                            DEFAULT_AVATAR;
                        }}
                      />

                      <div className="leader-details">

                        <strong>
                          {leaderName}
                        </strong>

                        {member?.memberNumber && (

                          <small>
                            {member.memberNumber}
                          </small>

                        )}

                        {!member && leader.patron?.organization && (

                          <small>
                            {leader.patron.organization}
                          </small>

                        )}

                      </div>

                    </div>

                  </td>

                  {/* =====================================
                      POSITION
                  ===================================== */}

                  <td>

                    <div className="leader-position">

                      <BriefcaseBusiness
                        size={15}
                      />

                      <span>
                        {formatLabel(
                          leader.position
                        )}
                      </span>

                    </div>

                  </td>

                  {/* =====================================
                      CATEGORY
                  ===================================== */}

                  <td>

                    <span className="category-badge">

                      {formatLabel(
                        leader.category
                      )}

                    </span>

                  </td>

                  {/* =====================================
                      SCOPE
                  ===================================== */}

                  <td>

                    <span className="scope-badge">

                      {formatLabel(
                        leader.scope
                      )}

                    </span>

                  </td>

                  {/* =====================================
                      JURISDICTION
                  ===================================== */}

                  <td>

                    <div className="leader-jurisdiction">

                      <MapPin
                        size={15}
                      />

                      <span>
                        {getJurisdiction(
                          leader
                        )}
                      </span>

                    </div>

                  </td>

                  {/* =====================================
                      APPOINTMENT TYPE
                  ===================================== */}

                  <td>

                    <div className="appointment-info">

                      <CalendarDays
                        size={15}
                      />

                      <span>

                        {formatLabel(
                          leader.appointmentType
                        )}

                      </span>

                    </div>

                  </td>

                  {/* =====================================
                      STATUS
                  ===================================== */}

                  <td>

                    <span
                      className={
                        leader.isActive
                          ? "status active"
                          : "status inactive"
                      }
                    >

                      {leader.isActive
                        ? "Active"
                        : "Inactive"}

                    </span>

                  </td>

                  {/* =====================================
                      ACTIONS
                  ===================================== */}

                  <td>

                    <div className="table-actions">

                      <button
                        type="button"
                        className="icon-action edit"
                        onClick={() =>
                          onEdit?.(leader)
                        }
                        title="Edit leadership assignment"
                      >

                        <Edit
                          size={17}
                        />

                      </button>

                      <button
                        type="button"
                        className="icon-action delete"
                        onClick={() =>
                          onDelete?.(leader)
                        }
                        title="Remove leadership assignment"
                      >

                        <Trash2
                          size={17}
                        />

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