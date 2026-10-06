import { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  RefreshCw,
  Download,
} from "lucide-react";

import { getMembers } from "../../services/admin.service";

import MemberSummary from "../../components/admin/members/MemberSummary";
import MemberFilters from "../../components/admin/members/MemberFilters";
import MembersTable from "../../components/admin/members/MembersTable";

import "./Members.css";

function Members() {
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    county: "",
    membershipStatus: "",
    membershipType: "",
    page: 1,
    limit: 10,
  });

  /* ==========================================================
     LOAD MEMBERS
  ========================================================== */

  const loadMembers = async () => {
    try {
      setLoading(true);

      const response = await getMembers(filters);

      const data = response?.data || {};

      setMembers(
        Array.isArray(data.members)
          ? data.members
          : []
      );

      setSummary(
        data.summary || {}
      );

      setPagination(
        data.pagination || {}
      );
    } catch (error) {
      console.error(
        "Failed to load members:",
        error
      );

      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  /* ==========================================================
     LOAD ON FILTER CHANGE
  ========================================================== */

  useEffect(() => {
    loadMembers();
  }, [filters]);

  /* ==========================================================
     REFRESH
  ========================================================== */

  const handleRefresh = () => {
    loadMembers();
  };

  return (
    <div className="admin-members-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <header className="members-page-header">

        <div className="members-header-main">

          <div className="members-header-icon">
            <Users size={24} />
          </div>

          <div className="members-header-content">

            <div className="members-breadcrumb">
              Administration
              <span>/</span>
              Members
            </div>

            <h1>
              Members Management
            </h1>

            <p>
              Manage, monitor and maintain the
              JVP membership database.
            </p>

          </div>

        </div>

        <div className="members-header-actions">

          <button
            type="button"
            className="members-action-button secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "members-spin"
                  : ""
              }
            />

            <span>
              Refresh
            </span>
          </button>

          <button
            type="button"
            className="members-action-button secondary"
          >
            <Download size={17} />

            <span>
              Export
            </span>
          </button>

          <button
            type="button"
            className="members-action-button primary"
          >
            <UserPlus size={17} />

            <span>
              Add Member
            </span>
          </button>

        </div>

      </header>

      {/* ======================================================
          PAGE CONTENT
      ====================================================== */}

      <main className="members-page-content">

        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <section className="members-summary-section">

          <div className="section-heading">

            <div>
              <span className="section-eyebrow">
                Membership Overview
              </span>

              <h2>
                Member Statistics
              </h2>
            </div>

          </div>

          <MemberSummary
            summary={summary}
          />

        </section>

        {/* ====================================================
            MANAGEMENT WORKSPACE
        ==================================================== */}

        <section className="members-management-card">

          <div className="management-card-header">

            <div className="management-title">

              <div className="management-title-icon">
                <Users size={19} />
              </div>

              <div>
                <h2>
                  Member Directory
                </h2>

                <p>
                  Search, filter and manage
                  registered JVP members.
                </p>
              </div>

            </div>

            <div className="member-count-badge">

              <strong>
                {pagination?.total ??
                  members.length}
              </strong>

              <span>
                Members
              </span>

            </div>

          </div>

          {/* ==================================================
              FILTERS
          ================================================== */}

          <div className="members-filters-wrapper">

            <MemberFilters
              filters={filters}
              setFilters={setFilters}
            />

          </div>

          {/* ==================================================
              TABLE
          ================================================== */}

          <div className="members-table-wrapper">

            <MembersTable
              members={members}
              loading={loading}
              pagination={pagination}
              filters={filters}
              setFilters={setFilters}
              refresh={loadMembers}
            />

          </div>

        </section>

      </main>

    </div>
  );
}

export default Members;