
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  Activity,
  CalendarDays,
  CheckCircle,
  Clock,
  Download,
  Eye,
  EyeOff,
  FolderKanban,
  Layers3,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  TrendingUp,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";

import { useProgram } from "../../../context/ProgramContext";

import "./Programs.css";

const Programs = () => {
  const {
    programs = [],
    loading = false,
    submitting = false,
    loadPrograms,
    loadFeaturedPrograms,
    deleteProgram,
    publishProgram,
    unpublishProgram,
    clearError,
  } = useProgram();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [actionId, setActionId] = useState(null);

  /* =====================================================
     LOAD PROGRAMMES
  ===================================================== */

  const loadData = useCallback(async () => {
    try {
      clearError?.();

      await Promise.allSettled([
        loadPrograms?.({ limit: 100 }),
        loadFeaturedPrograms?.(10),
      ]);
    } catch (error) {
      console.error("Failed to load programme records:", error);
    }
  }, [clearError, loadPrograms, loadFeaturedPrograms]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     HELPERS
  ===================================================== */

  const getId = useCallback((program) => {
    return program?._id ?? program?.id ?? "";
  }, []);

  const getTitle = useCallback((program) => {
    return program?.title || "Untitled programme";
  }, []);

  const getCategory = useCallback((program) => {
    if (typeof program?.category === "string") {
      return program.category || "Uncategorised";
    }

    return program?.category?.name || "Uncategorised";
  }, []);

  const getType = useCallback((program) => {
    return program?.recordType === "activity" || Boolean(program?.parentProgram)
      ? "activity"
      : "programme";
  }, []);

  const getParentTitle = useCallback((program) => {
    const parent = program?.parentProgram;

    if (!parent) {
      return "";
    }

    if (typeof parent === "object") {
      return parent.title || parent.name || "Linked programme";
    }

    return "Linked programme";
  }, []);

  const getLocation = useCallback((program) => {
    const location = program?.location;

    const locationText =
      typeof location === "string"
        ? location
        : location?.name || location?.address || "";

    return [
      program?.ward,
      program?.subCounty,
      program?.county,
      locationText,
    ]
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join(", ") || "Location TBA";
  }, []);

  const getCoverImage = useCallback((program) => {
    const image = program?.coverImage;

    if (typeof image === "string") {
      return image;
    }

    return (
      image?.url ||
      image?.secure_url ||
      program?.image?.url ||
      (typeof program?.image === "string" ? program.image : "")
    );
  }, []);

  const isValidDate = useCallback((value) => {
    return Boolean(value) && !Number.isNaN(new Date(value).getTime());
  }, []);

  const formatDate = useCallback(
    (value) => {
      if (!isValidDate(value)) {
        return "Date TBA";
      }

      return new Date(value).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [isValidDate]
  );

  const getStatus = useCallback(
    (program) => {
      if (program?.isArchived || program?.status === "archived") {
        return "archived";
      }

      const status = String(program?.status || "").toLowerCase();

      if (
        ["cancelled", "completed", "ongoing", "planned"].includes(status)
      ) {
        return status;
      }

      if (status === "upcoming") {
        return "planned";
      }

      if (
        isValidDate(program?.startDate) &&
        isValidDate(program?.endDate)
      ) {
        const now = new Date();
        const start = new Date(program.startDate);
        const end = new Date(program.endDate);

        if (now >= start && now <= end) {
          return "ongoing";
        }

        if (now > end) {
          return "completed";
        }

        if (now < start) {
          return "planned";
        }
      }

      return status || "planned";
    },
    [isValidDate]
  );

  const formatStatus = useCallback((status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, []);

  const getNumber = useCallback((value) => {
    const number = Number(value);

    return Number.isFinite(number) ? Math.max(0, number) : 0;
  }, []);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const statistics = useMemo(() => {
    const activeRecords = programs.filter(
      (program) => !program.isArchived && program.status !== "archived"
    );

    const published = activeRecords.filter(
      (program) => Boolean(program.isPublished)
    );

    const drafts = activeRecords.filter(
      (program) => !program.isPublished
    );

    const ongoing = activeRecords.filter(
      (program) => getStatus(program) === "ongoing"
    );

    const upcoming = activeRecords.filter((program) => {
      return (
        isValidDate(program.startDate) &&
        new Date(program.startDate) > new Date()
      );
    });

    const completed = activeRecords.filter(
      (program) => getStatus(program) === "completed"
    );

    const featured = activeRecords.filter(
      (program) => Boolean(program.isFeatured)
    );

    const attended = activeRecords.reduce((total, program) => {
      return total + getNumber(program.youthsAttended);
    }, 0);

    const benefited = activeRecords.reduce((total, program) => {
      return total + getNumber(program.youthsBenefited);
    }, 0);

    return {
      total: programs.length,
      published: published.length,
      drafts: drafts.length,
      featured: featured.length,
      ongoing: ongoing.length,
      upcoming: upcoming.length,
      completed: completed.length,
      attended,
      benefited,
    };
  }, [programs, getStatus, isValidDate, getNumber]);

  /* =====================================================
     CATEGORY OPTIONS
  ===================================================== */

  const categories = useMemo(() => {
    const values = programs
      .map((program) => getCategory(program))
      .filter((category) => category !== "Uncategorised");

    return [
      "all",
      ...Array.from(new Set(values)).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [programs, getCategory]);

  /* =====================================================
     SEARCH AND FILTER
  ===================================================== */

  const filteredPrograms = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return programs.filter((program) => {
      const type = getType(program);
      const status = getStatus(program);
      const category = getCategory(program);

      const searchableFields = [
        program.title,
        program.slug,
        program.summary,
        program.description,
        category,
        program.county,
        program.subCounty,
        program.ward,
        getLocation(program),
        program.impactSummary,
        getParentTitle(program),
      ];

      const matchesSearch =
        !keyword ||
        searchableFields.some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        );

      let matchesStatus = true;

      switch (statusFilter) {
        case "published":
          matchesStatus =
            Boolean(program.isPublished) &&
            !program.isArchived &&
            status !== "archived";
          break;

        case "draft":
          matchesStatus = !program.isPublished;
          break;

        case "featured":
          matchesStatus = Boolean(program.isFeatured);
          break;

        case "archived":
          matchesStatus =
            Boolean(program.isArchived) || status === "archived";
          break;

        case "planned":
        case "ongoing":
        case "completed":
        case "cancelled":
          matchesStatus = status === statusFilter;
          break;

        default:
          matchesStatus = true;
      }

      const matchesCategory =
        categoryFilter === "all" ||
        category.toLowerCase() === categoryFilter.toLowerCase();

      const matchesType =
        typeFilter === "all" || type === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesType
      );
    });
  }, [
    programs,
    search,
    statusFilter,
    categoryFilter,
    typeFilter,
    getType,
    getStatus,
    getCategory,
    getLocation,
    getParentTitle,
  ]);

  /* =====================================================
     REFRESH
  ===================================================== */

  const handleRefresh = useCallback(() => {
    loadData();
  }, [loadData]);

  /* =====================================================
     DELETE RECORD
  ===================================================== */

  const handleDelete = useCallback(
    async (program) => {
      const id = getId(program);

      if (!id) {
        window.alert("This record has no valid ID.");
        return;
      }

      const confirmed = window.confirm(
        `Permanently delete "${getTitle(program)}"? This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      setActionId(id);

      try {
        if (typeof deleteProgram !== "function") {
          throw new Error("Delete action is not available.");
        }

        await deleteProgram(id);
        await loadData();
      } catch (error) {
        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to delete the record."
        );
      } finally {
        setActionId(null);
      }
    },
    [getId, getTitle, deleteProgram, loadData]
  );

  /* =====================================================
     PUBLISH / UNPUBLISH
  ===================================================== */

  const handlePublication = useCallback(
    async (program) => {
      const id = getId(program);

      if (!id) {
        window.alert("This record has no valid ID.");
        return;
      }

      const currentlyPublished = Boolean(program.isPublished);
      const action = currentlyPublished ? unpublishProgram : publishProgram;

      if (typeof action !== "function") {
        window.alert("This publication action is not available.");
        return;
      }

      setActionId(id);

      try {
        await action(id);
        await loadData();
      } catch (error) {
        window.alert(
          error?.response?.data?.message ||
            error?.message ||
            `Failed to ${currentlyPublished ? "unpublish" : "publish"} the record.`
        );
      } finally {
        setActionId(null);
      }
    },
    [getId, publishProgram, unpublishProgram, loadData]
  );

  /* =====================================================
     CSV EXPORT
  ===================================================== */

  const handleExport = useCallback(() => {
    if (!filteredPrograms.length) {
      window.alert("There are no records to export.");
      return;
    }

    const escapeCsv = (value) => {
      const text = String(value ?? "");
      return `"${text.replace(/"/g, '""')}"`;
    };

    const headers = [
      "Title",
      "Record Type",
      "Parent Programme",
      "Category",
      "Status",
      "Start Date",
      "End Date",
      "County",
      "Sub-county",
      "Ward",
      "Location",
      "Youth Attended",
      "Youth Benefited",
      "Published",
      "Featured",
    ];

    const rows = filteredPrograms.map((program) => [
      getTitle(program),
      getType(program),
      getParentTitle(program),
      getCategory(program),
      getStatus(program),
      formatDate(program.startDate),
      formatDate(program.endDate),
      program.county || "",
      program.subCounty || "",
      program.ward || "",
      getLocation(program),
      getNumber(program.youthsAttended),
      getNumber(program.youthsBenefited),
      program.isPublished ? "Yes" : "No",
      program.isFeatured ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `jvp-programmes-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
  }, [
    filteredPrograms,
    getTitle,
    getType,
    getParentTitle,
    getCategory,
    getStatus,
    formatDate,
    getLocation,
    getNumber,
  ]);

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
  }, []);

  const hasActiveFilters =
    Boolean(search) ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    typeFilter !== "all";

  /* =====================================================
     PAGE
  ===================================================== */

  return (
    <div className="programs-admin-page">
      {/* HEADER */}

      <section className="programs-admin-header">
        <div className="programs-admin-header-main">
          <div className="programs-admin-breadcrumb">
            <span>Administration</span>
            <span>/</span>
            <strong>Programmes &amp; Impact</strong>
          </div>

          <div className="programs-admin-title-row">
            <div className="programs-admin-title-icon">
              <FolderKanban size={22} />
            </div>

            <div>
              <h1>Programmes &amp; Impact</h1>
              <p>
                Create initiatives, manage activities and track JVP's
                impact on young people.
              </p>
            </div>
          </div>
        </div>

        <div className="programs-admin-header-actions">
          <button
            type="button"
            className="programs-admin-btn programs-admin-btn-secondary"
            onClick={handleRefresh}
            disabled={loading || submitting}
          >
            <RefreshCw
              size={15}
              className={loading ? "programs-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            className="programs-admin-btn programs-admin-btn-secondary"
            onClick={handleExport}
            disabled={!filteredPrograms.length}
          >
            <Download size={15} />
            Export CSV
          </button>

          <Link
            to="/admin/programs/create"
            className="programs-admin-btn programs-admin-btn-primary"
          >
            <Plus size={17} />
            Create Record
          </Link>
        </div>
      </section>

      {/* STATISTICS */}

      <section className="programs-admin-stat-grid">
        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon green">
            <Layers3 size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Total Records</span>
            <strong>{statistics.total.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">
            Programmes &amp; activities
          </span>
        </article>

        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon blue">
            <CheckCircle size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Published</span>
            <strong>{statistics.published.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">Public</span>
        </article>

        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon amber">
            <Clock size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Drafts</span>
            <strong>{statistics.drafts.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">Unpublished</span>
        </article>

        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon purple">
            <Star size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Featured</span>
            <strong>{statistics.featured.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">Highlighted</span>
        </article>

        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon teal">
            <Activity size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Ongoing</span>
            <strong>{statistics.ongoing.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">In progress</span>
        </article>

        <article className="programs-admin-stat-card">
          <div className="programs-admin-stat-icon slate">
            <CalendarDays size={18} />
          </div>
          <div className="programs-admin-stat-content">
            <span>Upcoming</span>
            <strong>{statistics.upcoming.toLocaleString("en-KE")}</strong>
          </div>
          <span className="programs-admin-stat-note">Scheduled</span>
        </article>
      </section>

      {/* IMPACT SUMMARY */}

      <section className="programs-admin-impact-grid">
        <article className="programs-admin-impact-card">
          <div className="programs-admin-impact-icon">
            <Users size={19} />
          </div>
          <div>
            <span>Total youth attendance</span>
            <strong>{statistics.attended.toLocaleString("en-KE")}</strong>
            <small>Attendance recorded across loaded records</small>
          </div>
        </article>

        <article className="programs-admin-impact-card">
          <div className="programs-admin-impact-icon beneficiaries">
            <UserRoundCheck size={19} />
          </div>
          <div>
            <span>Total youth benefited</span>
            <strong>{statistics.benefited.toLocaleString("en-KE")}</strong>
            <small>Beneficiaries recorded across loaded records</small>
          </div>
        </article>

        <article className="programs-admin-impact-card">
          <div className="programs-admin-impact-icon performance">
            <TrendingUp size={19} />
          </div>
          <div>
            <span>Completed records</span>
            <strong>{statistics.completed.toLocaleString("en-KE")}</strong>
            <small>Records marked as completed</small>
          </div>
        </article>
      </section>

      {/* MANAGEMENT TABLE */}

      <section className="programs-admin-management-card">
        <div className="programs-admin-management-header">
          <div>
            <h2>Programme Management</h2>
            <p>
              Manage programme records, activities, publication and impact
              reporting.
            </p>
          </div>

          <div className="programs-admin-count">
            <strong>{filteredPrograms.length}</strong>
            <span>
              {filteredPrograms.length === 1 ? "record" : "records"}
            </span>
          </div>
        </div>

        {/* TOOLBAR */}

        <div className="programs-admin-toolbar">
          <div className="programs-admin-search">
            <Search size={16} />

            <input
              type="search"
              placeholder="Search title, category, county or parent programme..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search programmes and activities"
            />

            {search && (
              <button
                type="button"
                className="programs-admin-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="programs-admin-filters">
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              aria-label="Filter by record type"
            >
              <option value="all">All Record Types</option>
              <option value="programme">Programmes</option>
              <option value="activity">Activities</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
              <option value="featured">Featured</option>
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* RESULTS META */}

        <div className="programs-admin-results-meta">
          <span>
            Showing <strong>{filteredPrograms.length}</strong> of{" "}
            <strong>{programs.length}</strong> records
          </span>

          {hasActiveFilters && (
            <button
              type="button"
              className="programs-admin-clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {/* TABLE */}

        <div className="programs-admin-table-wrapper">
          <table className="programs-admin-table">
            <thead>
              <tr>
                <th>Programme / Activity</th>
                <th>Type &amp; Category</th>
                <th>Schedule</th>
                <th>Location</th>
                <th>Impact</th>
                <th>Status</th>
                <th className="programs-admin-actions-column">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && programs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="programs-admin-table-state">
                    <div className="programs-admin-loading">
                      <RefreshCw size={18} className="programs-spin" />
                      Loading programme records...
                    </div>
                  </td>
                </tr>
              ) : filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="programs-admin-table-state">
                    <div className="programs-admin-empty">
                      <div className="programs-admin-empty-icon">
                        <FolderKanban size={23} />
                      </div>

                      <h3>
                        {programs.length
                          ? "No matching records"
                          : "No programmes yet"}
                      </h3>

                      <p>
                        {programs.length
                          ? "Try changing your search or filters."
                          : "Create your first programme or activity to start tracking JVP initiatives."}
                      </p>

                      {programs.length ? (
                        <button
                          type="button"
                          className="programs-admin-btn programs-admin-btn-secondary"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <Link
                          to="/admin/programs/create"
                          className="programs-admin-btn programs-admin-btn-primary"
                        >
                          <Plus size={15} />
                          Create Record
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((program) => {
                  const id = getId(program);
                  const type = getType(program);
                  const status = getStatus(program);
                  const category = getCategory(program);
                  const image = getCoverImage(program);

                  const isBusy =
                    submitting || String(actionId) === String(id);

                  const attended = getNumber(program.youthsAttended);
                  const benefited = getNumber(program.youthsBenefited);

                  const isArchived =
                    Boolean(program.isArchived) || status === "archived";

                  return (
                    <tr key={id || getTitle(program)}>
                      <td>
                        <div className="programs-admin-record-cell">
                          <div className="programs-admin-cover">
                            {image ? (
                              <img
                                src={image}
                                alt=""
                                loading="lazy"
                              />
                            ) : (
                              <div className="programs-admin-cover-placeholder">
                                {type === "activity" ? (
                                  <Activity size={19} />
                                ) : (
                                  <FolderKanban size={19} />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="programs-admin-record-details">
                            <div className="programs-admin-record-title">
                              <h4 title={getTitle(program)}>
                                {getTitle(program)}
                              </h4>

                              {program.isFeatured && (
                                <span
                                  className="programs-admin-featured-mark"
                                  title="Featured record"
                                >
                                  <Star size={12} fill="currentColor" />
                                </span>
                              )}
                            </div>

                            <p>
                              {program.summary ||
                                program.description ||
                                "No summary added yet."}
                            </p>

                            {type === "activity" && (
                              <span className="programs-admin-parent-label">
                                <Layers3 size={11} />
                                {getParentTitle(program)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-type-cell">
                          <span
                            className={`programs-admin-type-badge ${type}`}
                          >
                            {type === "activity" ? "Activity" : "Programme"}
                          </span>

                          <span
                            className="programs-admin-category"
                            title={category}
                          >
                            {category}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-date-cell">
                          <strong>{formatDate(program.startDate)}</strong>
                          <span>
                            {program.endDate
                              ? `to ${formatDate(program.endDate)}`
                              : "End date TBA"}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-location-cell">
                          <MapPin size={14} />
                          <span title={getLocation(program)}>
                            {getLocation(program)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-impact-cell">
                          <div>
                            <Users size={13} />
                            <strong>{attended.toLocaleString("en-KE")}</strong>
                            <span>Attended</span>
                          </div>

                          <div>
                            <UserRoundCheck size={13} />
                            <strong>{benefited.toLocaleString("en-KE")}</strong>
                            <span>Benefited</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-status-stack">
                          <span
                            className={`programs-admin-status ${
                              isArchived
                                ? "archived"
                                : program.isPublished
                                  ? "published"
                                  : "draft"
                            }`}
                          >
                            <span />
                            {isArchived
                              ? "Archived"
                              : program.isPublished
                                ? "Published"
                                : "Draft"}
                          </span>

                          <span
                            className={`programs-admin-status programs-admin-status-sub ${status}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className="programs-admin-row-actions">
                          <Link
                            to={`/admin/programs/${id}`}
                            className="programs-admin-action-btn"
                            title="View record"
                            aria-label={`View ${getTitle(program)}`}
                          >
                            <Eye size={15} />
                          </Link>

                          <Link
                            to={`/admin/programs/edit/${id}`}
                            className="programs-admin-action-btn"
                            title="Edit record"
                            aria-label={`Edit ${getTitle(program)}`}
                          >
                            <Pencil size={14} />
                          </Link>

                          <Link
                            to={`/admin/programs/edit/${id}?tab=impact`}
                            className="programs-admin-action-btn impact"
                            title="Manage impact"
                            aria-label={`Manage impact for ${getTitle(program)}`}
                          >
                            <TrendingUp size={15} />
                          </Link>

                          {!isArchived && (
                            <button
                              type="button"
                              className={`programs-admin-action-btn ${
                                program.isPublished ? "warning" : "success"
                              }`}
                              title={
                                program.isPublished
                                  ? "Unpublish record"
                                  : "Publish record"
                              }
                              aria-label={`${
                                program.isPublished ? "Unpublish" : "Publish"
                              } ${getTitle(program)}`}
                              disabled={isBusy}
                              onClick={() => handlePublication(program)}
                            >
                              {program.isPublished ? (
                                <EyeOff size={15} />
                              ) : (
                                <CheckCircle size={15} />
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            className="programs-admin-action-btn danger"
                            title="Delete record"
                            aria-label={`Delete ${getTitle(program)}`}
                            disabled={isBusy}
                            onClick={() => handleDelete(program)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}

        <div className="programs-admin-table-footer">
          <span>
            {filteredPrograms.length
              ? `Displaying ${filteredPrograms.length} ${
                  filteredPrograms.length === 1 ? "record" : "records"
                }`
              : "No records to display"}
          </span>

          <button
            type="button"
            className="programs-admin-footer-refresh"
            onClick={handleRefresh}
            disabled={loading || submitting}
          >
            <RefreshCw
              size={13}
              className={loading ? "programs-spin" : ""}
            />
            Refresh list
          </button>
        </div>
      </section>

      {/* QUICK ACTIONS */}

      <section className="programs-admin-quick-actions">
        <div>
          <div className="programs-admin-quick-icon">
            <Activity size={19} />
          </div>

          <div>
            <h3>Record a programme activity</h3>
            <p>
              Add an individual activity and link it to an existing programme
              to keep reporting organised.
            </p>
          </div>
        </div>

        <Link
          to="/admin/programs/create?type=activity"
          className="programs-admin-btn programs-admin-btn-secondary"
        >
          <Plus size={15} />
          Add Activity
        </Link>
      </section>
    </div>
  );
};

export default Programs;
