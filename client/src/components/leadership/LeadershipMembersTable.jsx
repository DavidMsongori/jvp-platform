import "./LeadershipMembersTable.css";

function LeadershipMembersTable({
  members = [],
  loading = false,
}) {
  if (loading) {
    return (
      <div className="members-table-card">
        <div className="table-loading">
          Loading members...
        </div>
      </div>
    );
  }

  if (!members.length) {
    return (
      <div className="members-table-card">
        <div className="table-empty">
          No members found.
        </div>
      </div>
    );
  }

  return (
    <div className="members-table-card">

      <div className="table-responsive">

        <table className="members-table">

          <thead>

            <tr>

              <th>Member</th>

              <th>Phone</th>

              <th>Location</th>

              <th>Type</th>

              <th>Status</th>

              <th>Profile</th>

              <th></th>

            </tr>

          </thead>

          <tbody>

            {members.map((member) => (

              <tr key={member._id}>

                <td>

                  <div className="member-info">

                    <img
                      src={
                        member.profilePhoto ||
                        "/images/avatar.png"
                      }
                      alt={member.firstName}
                    />

                    <div>

                      <h4>

                        {member.firstName}{" "}
                        {member.middleName}{" "}
                        {member.lastName}

                      </h4>

                      <span>
                        {member.memberNumber ||
                          "Pending"}
                      </span>

                    </div>

                  </div>

                </td>

                <td>

                  <div className="table-phone">

                    {member.phone}

                  </div>

                </td>

                <td>

                  <div className="table-location">

                    <strong>
                      {member.county}
                    </strong>

                    <small>

                      {member.constituency}

                      {member.ward &&
                        ` • ${member.ward}`}

                    </small>

                  </div>

                </td>

                <td>

                  <span
                    className={`badge badge-${member.membershipType}`}
                  >

                    {member.membershipType}

                  </span>

                </td>

                <td>

                  <span
                    className={`badge badge-${member.membershipStatus}`}
                  >

                    {member.membershipStatus.replace(
                      /_/g,
                      " "
                    )}

                  </span>

                </td>

                <td>

                  <div className="profile-progress">

                    <div
                      className="progress-bar"
                    >

                      <div
                        className="progress-fill"
                        style={{
                          width: `${member.profileCompletion}%`,
                        }}
                      />

                    </div>

                    <span>

                      {member.profileCompletion}%

                    </span>

                  </div>

                </td>

                <td>

                  <button className="table-action">

                    View

                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}

export default LeadershipMembersTable;