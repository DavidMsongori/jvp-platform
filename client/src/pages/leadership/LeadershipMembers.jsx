import { useLeadershipDashboard } from "../../context/LeadershipDashboardContext";

import LeadershipDistributionChart from "../../components/leadership/LeadershipDistributionChart";
import LeadershipMembersTable from "../../components/leadership/LeadershipMembersTable";

import "./LeadershipMembers.css";

function LeadershipMembers() {
  const {
    summary,
    distribution,
    members,
    pagination,
    filters,
    loading,
    updateFilters,
  } = useLeadershipDashboard();

  return (
    <div className="leadership-members-page">

      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="page-header">

        <div>
          <h1>Leadership Members</h1>

          <p>
            Manage members within your leadership
            jurisdiction.
          </p>
        </div>

        <div className="member-count">

          <span>Total Members</span>

          <h2>{summary?.totalMembers ?? 0}</h2>

        </div>

      </div>

      {/* =====================================
          FILTERS
      ===================================== */}

      <div className="members-toolbar">

        <input
          type="text"
          placeholder="Search member..."
          value={filters.search}
          onChange={(e) =>
            updateFilters({
              page: 1,
              search: e.target.value,
            })
          }
        />

        <select
          value={filters.membershipStatus}
          onChange={(e) =>
            updateFilters({
              page: 1,
              membershipStatus: e.target.value,
            })
          }
        >
          <option value="">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>

          <option value="pending_payment">
            Pending Payment
          </option>

          <option value="expired">
            Expired
          </option>

        </select>

        <select
          value={filters.membershipType}
          onChange={(e) =>
            updateFilters({
              page: 1,
              membershipType: e.target.value,
            })
          }
        >
          <option value="">
            All Types
          </option>

          <option value="member">
            Member
          </option>

          <option value="leadership">
            Leadership
          </option>

        </select>

      </div>

      {/* =====================================
          CHART
      ===================================== */}

      {distribution && (
        <LeadershipDistributionChart
          distribution={distribution}
        />
      )}

      {/* =====================================
          TABLE
      ===================================== */}

      <LeadershipMembersTable
        members={members}
        loading={loading}
      />

      {/* =====================================
          PAGINATION
      ===================================== */}

      {pagination && (
        <div className="pagination">

          <button
            disabled={!pagination.hasPreviousPage}
            onClick={() =>
              updateFilters({
                page: pagination.page - 1,
              })
            }
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of{" "}
            {pagination.totalPages}
          </span>

          <button
            disabled={!pagination.hasNextPage}
            onClick={() =>
              updateFilters({
                page: pagination.page + 1,
              })
            }
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}

export default LeadershipMembers;