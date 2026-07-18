import { useNavigate } from "react-router-dom";
import MemberActions from "./MemberActions";
import "./Members.css";

function MembersTable({
  members = [],
  loading,
  pagination = {},
  filters,
  setFilters,
}) {
  const navigate = useNavigate();

  /* ==========================================
     PAGINATION
  ========================================== */

  const goToPage = (page) => {
    if (
      page < 1 ||
      page > (pagination.totalPages || 1)
    ) {
      return;
    }

    setFilters((previous) => ({
      ...previous,
      page,
    }));
  };

  /* ==========================================
     MEMBER STATUS
  ========================================== */

  const getMemberStatus = (member) => {
    if (member.membershipStatus === "expired") {
      return {
        label: "Expired",
        className: "expired",
      };
    }

    if (member.accountActivated) {
      return {
        label: "Activated",
        className: "activated",
      };
    }

    if (member.source === "imported") {
      return {
        label: "Imported",
        className: "imported",
      };
    }

    return {
      label: "New",
      className: "new",
    };
  };

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {
    return (
      <div className="table-loading">
        Loading members...
      </div>
    );
  }

  /* ==========================================
     EMPTY STATE
  ========================================== */

  if (!members.length) {
    return (
      <div className="table-empty">
        <h3>No Members Found</h3>
        <p>Try changing your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="members-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Member No.</th>
            <th>County</th>
            <th>Phone</th>
            <th>Membership</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {members.map((member) => {
            const status = getMemberStatus(member);

            return (
              <tr
                key={member._id}
                className="clickable-row"
                onClick={() =>
                  navigate(`/admin/members/${member._id}`)
                }
              >
                {/* ======================================
                    MEMBER
                ====================================== */}

                <td>
                  <div className="member-cell">
                    {member.profilePhoto ? (
                      <img
                        src={member.profilePhoto}
                        alt={`${member.firstName} ${member.lastName}`}
                        className="member-avatar"
                      />
                    ) : (
                      <div className="member-avatar initials">
                        {(member.firstName?.charAt(0) || "")}
                        {(member.lastName?.charAt(0) || "")}
                      </div>
                    )}

                    <div>
                      <strong>
                        {member.firstName}{" "}
                        {member.middleName
                          ? `${member.middleName} `
                          : ""}
                        {member.lastName}
                      </strong>

                      <small>
                        {member.user?.email || "No email"}
                      </small>
                    </div>
                  </div>
                </td>

                {/* ======================================
                    MEMBER NUMBER
                ====================================== */}

                <td>
                  {member.memberNumber ||
                  member.membershipNumber ? (
                    member.memberNumber ||
                    member.membershipNumber
                  ) : (
                    <span className="badge not-assigned">
                      Not Assigned
                    </span>
                  )}
                </td>

                {/* ======================================
                    COUNTY
                ====================================== */}

                <td>{member.county || "-"}</td>

                {/* ======================================
                    PHONE
                ====================================== */}

                <td>{member.phone || "-"}</td>

                {/* ======================================
                    MEMBERSHIP
                ====================================== */}

                <td>
                  <span
                    className={`badge membership ${(
                      member.membershipType || ""
                    )
                      .toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {member.membershipType || "-"}
                  </span>
                </td>

                {/* ======================================
                    STATUS
                ====================================== */}

                <td>
                  <span
                    className={`badge status ${status.className}`}
                  >
                    {status.label}
                  </span>
                </td>

                {/* ======================================
                    JOINED
                ====================================== */}

                <td>
                  {member.joinedAt
                    ? new Date(
                        member.joinedAt
                      ).toLocaleDateString()
                    : "-"}
                </td>

                {/* ======================================
                    ACTIONS
                ====================================== */}

                <td
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                >
                  <MemberActions
                    member={member}
                    onView={(member) =>
                      navigate(
                        `/admin/members/${member._id}`
                      )
                    }
                    onEdit={(member) =>
                      navigate(
                        `/admin/members/${member._id}/edit`
                      )
                    }
                    onActivate={(member) =>
                      console.log(
                        "Activate",
                        member
                      )
                    }
                    onDeactivate={(member) =>
                      console.log(
                        "Deactivate",
                        member
                      )
                    }
                    onDelete={(member) =>
                      console.log(
                        "Delete",
                        member
                      )
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ==========================================
          PAGINATION
      ========================================== */}

      <div className="table-pagination">
        <button
          disabled={!pagination.hasPreviousPage}
          onClick={() =>
            goToPage(pagination.page - 1)
          }
        >
          Previous
        </button>

        <span>
          Showing{" "}
          {((pagination.page || 1) - 1) *
            (pagination.limit || 10) +
            1}
          {" - "}
          {Math.min(
            (pagination.page || 1) *
              (pagination.limit || 10),
            pagination.total || members.length
          )}
          {" "}of{" "}
          {pagination.total || members.length}
        </span>

        <button
          disabled={!pagination.hasNextPage}
          onClick={() =>
            goToPage(pagination.page + 1)
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default MembersTable;