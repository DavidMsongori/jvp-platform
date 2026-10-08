import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  FaNewspaper,
  FaPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaArchive,
  FaStar,
  FaRegStar,
  FaCheckCircle,
  FaClock,
  FaLayerGroup,
  FaSyncAlt,
  FaFilter,
  FaTimes,
} from "react-icons/fa";

import { useNews } from "../../../context/NewsContext";

import {
  NEWS_CATEGORIES,
  NEWS_CATEGORY_LABELS,
  NEWS_STATUS,
  NEWS_STATUS_LABELS,
} from "../../../constants/news.constants";

import "./NewsAdmin.css";


/* ==========================================================
   HELPERS
========================================================== */

const formatDate = (date) => {

  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

};


const getCategoryLabel = (category) => {

  return (
    NEWS_CATEGORY_LABELS?.[category] ||
    category ||
    "Uncategorized"
  );

};


const getStatusLabel = (status) => {

  return (
    NEWS_STATUS_LABELS?.[status] ||
    status ||
    "Unknown"
  );

};


/* ==========================================================
   COMPONENT
========================================================== */

const NewsAdmin = () => {

  const navigate = useNavigate();

  const {
    adminArticles = [],
    statistics,
    loading,
    error,

    fetchAdminNews,
    fetchNewsStatistics,

    publishNews,
    unpublishNews,

    featureNews,
    unfeatureNews,

    archiveNews,
    deleteNews,

    clearError,
  } = useNews();


  /* ========================================================
     LOCAL STATE
  ======================================================== */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [categoryFilter, setCategoryFilter] = useState("all");

  const [actionLoading, setActionLoading] = useState(null);


  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {

    fetchAdminNews();
    fetchNewsStatistics();

  }, [fetchAdminNews, fetchNewsStatistics]);


  /* ========================================================
     REFRESH
  ======================================================== */

  const handleRefresh = async () => {

    await Promise.all([
      fetchAdminNews(),
      fetchNewsStatistics(),
    ]);

  };


  /* ========================================================
     FILTER ARTICLES
  ======================================================== */

  const filteredArticles = useMemo(() => {

    let results = [...adminArticles];

    const searchTerm = search
      .trim()
      .toLowerCase();

    if (searchTerm) {

      results = results.filter((article) => {

        const title =
          article.title?.toLowerCase() || "";

        const excerpt =
          article.excerpt?.toLowerCase() || "";

        const author =
          article.authorName?.toLowerCase() || "";

        const tags = Array.isArray(article.tags)
          ? article.tags.join(" ").toLowerCase()
          : "";

        return (
          title.includes(searchTerm) ||
          excerpt.includes(searchTerm) ||
          author.includes(searchTerm) ||
          tags.includes(searchTerm)
        );

      });

    }


    if (statusFilter !== "all") {

      results = results.filter(
        (article) =>
          article.status === statusFilter
      );

    }


    if (categoryFilter !== "all") {

      results = results.filter(
        (article) =>
          article.category === categoryFilter
      );

    }


    return results;

  }, [
    adminArticles,
    search,
    statusFilter,
    categoryFilter,
  ]);


  /* ========================================================
     ACTION HANDLER
  ======================================================== */

  const runAction = async (
    id,
    action,
    callback
  ) => {

    try {

      setActionLoading(`${action}-${id}`);

      await callback(id);

      await Promise.all([
        fetchAdminNews(),
        fetchNewsStatistics(),
      ]);

    } catch (err) {

      console.error(
        `News ${action} failed:`,
        err
      );

    } finally {

      setActionLoading(null);

    }

  };


  /* ========================================================
     DELETE
  ======================================================== */

  const handleDelete = async (article) => {

    const confirmed = window.confirm(
      `Delete "${article.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    await runAction(
      article._id,
      "delete",
      deleteNews
    );

  };


  /* ========================================================
     ARCHIVE
  ======================================================== */

  const handleArchive = async (article) => {

    const confirmed = window.confirm(
      `Archive "${article.title}"?`
    );

    if (!confirmed) return;

    await runAction(
      article._id,
      "archive",
      archiveNews
    );

  };


  /* ========================================================
     STATUS ACTION
  ======================================================== */

  const handlePublishToggle = async (article) => {

    if (article.status === NEWS_STATUS.PUBLISHED) {

      await runAction(
        article._id,
        "unpublish",
        unpublishNews
      );

      return;

    }

    await runAction(
      article._id,
      "publish",
      publishNews
    );

  };


  /* ========================================================
     FEATURE ACTION
  ======================================================== */

  const handleFeatureToggle = async (article) => {

    if (article.featured) {

      await runAction(
        article._id,
        "unfeature",
        unfeatureNews
      );

      return;

    }

    await runAction(
      article._id,
      "feature",
      featureNews
    );

  };


  /* ========================================================
     STATISTICS
  ======================================================== */

  const totalArticles =
    statistics?.total ??
    statistics?.totalArticles ??
    adminArticles.length;

  const publishedArticles =
    statistics?.published ??
    statistics?.publishedArticles ??
    adminArticles.filter(
      (article) =>
        article.status === NEWS_STATUS.PUBLISHED
    ).length;

  const draftArticles =
    statistics?.drafts ??
    statistics?.draft ??
    statistics?.draftArticles ??
    adminArticles.filter(
      (article) =>
        article.status === NEWS_STATUS.DRAFT
    ).length;

  const featuredArticles =
    statistics?.featured ??
    statistics?.featuredArticles ??
    adminArticles.filter(
      (article) =>
        article.featured
    ).length;


  /* ========================================================
     CATEGORY OPTIONS
  ======================================================== */

  const categoryOptions = Object.values(
    NEWS_CATEGORIES || {}
  );


  /* ========================================================
     ERROR
  ======================================================== */

  const hasError = Boolean(error);


  /* ========================================================
     RENDER
  ======================================================== */

  return (

    <div className="news-admin">

      {/* ====================================================
          HEADER
      ==================================================== */}

      <div className="news-admin__header">

        <div className="news-admin__heading">

          <div className="news-admin__icon">

            <FaNewspaper />

          </div>

          <div>

            <span className="news-admin__eyebrow">
              JVP NEWSROOM
            </span>

            <h1>
              News Management
            </h1>

            <p>
              Manage news, announcements, stories
              and public communications.
            </p>

          </div>

        </div>


        <div className="news-admin__header-actions">

          <button
            type="button"
            className="news-admin__refresh"
            onClick={handleRefresh}
            disabled={loading}
          >

            <FaSyncAlt
              className={
                loading
                  ? "news-admin__spin"
                  : ""
              }
            />

            Refresh

          </button>


          <button
            type="button"
            className="news-admin__create"
            onClick={() =>
              navigate("/admin/news/create")
            }
          >

            <FaPlus />

            Create Article

          </button>

        </div>

      </div>


      {/* ====================================================
          ERROR
      ==================================================== */}

      {hasError && (

        <div className="news-admin__alert">

          <div>

            <strong>
              Unable to load News
            </strong>

            <span>
              {typeof error === "string"
                ? error
                : "Something went wrong while loading news."}
            </span>

          </div>

          <button
            type="button"
            onClick={clearError}
            aria-label="Dismiss error"
          >

            <FaTimes />

          </button>

        </div>

      )}


      {/* ====================================================
          STATISTICS
      ==================================================== */}

      <div className="news-admin__stats">

        <div className="news-stat-card">

          <div className="news-stat-card__icon">
            <FaLayerGroup />
          </div>

          <div>

            <span>
              Total Articles
            </span>

            <strong>
              {totalArticles}
            </strong>

          </div>

        </div>


        <div className="news-stat-card">

          <div className="news-stat-card__icon">
            <FaCheckCircle />
          </div>

          <div>

            <span>
              Published
            </span>

            <strong>
              {publishedArticles}
            </strong>

          </div>

        </div>


        <div className="news-stat-card">

          <div className="news-stat-card__icon">
            <FaClock />
          </div>

          <div>

            <span>
              Drafts
            </span>

            <strong>
              {draftArticles}
            </strong>

          </div>

        </div>


        <div className="news-stat-card">

          <div className="news-stat-card__icon">
            <FaStar />
          </div>

          <div>

            <span>
              Featured
            </span>

            <strong>
              {featuredArticles}
            </strong>

          </div>

        </div>

      </div>


      {/* ====================================================
          CONTENT PANEL
      ==================================================== */}

      <div className="news-admin__panel">

        {/* ==================================================
            PANEL HEADER
        ================================================== */}

        <div className="news-admin__panel-header">

          <div>

            <h2>
              Articles
            </h2>

            <span>
              {filteredArticles.length} article
              {filteredArticles.length === 1
                ? ""
                : "s"} found
            </span>

          </div>

        </div>


        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="news-admin__filters">

          <div className="news-admin__search">

            <FaSearch />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search articles..."
            />

            {search && (

              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >

                <FaTimes />

              </button>

            )}

          </div>


          <div className="news-admin__filter">

            <FaFilter />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >

              <option value="all">
                All Status
              </option>

              <option value={NEWS_STATUS.PUBLISHED}>
                {getStatusLabel(
                  NEWS_STATUS.PUBLISHED
                )}
              </option>

              <option value={NEWS_STATUS.DRAFT}>
                {getStatusLabel(
                  NEWS_STATUS.DRAFT
                )}
              </option>

              <option value={NEWS_STATUS.ARCHIVED}>
                {getStatusLabel(
                  NEWS_STATUS.ARCHIVED
                )}
              </option>

            </select>

          </div>


          <div className="news-admin__filter">

            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >

              <option value="all">
                All Categories
              </option>

              {categoryOptions.map(
                (category) => (

                  <option
                    key={category}
                    value={category}
                  >
                    {getCategoryLabel(category)}
                  </option>

                )
              )}

            </select>

          </div>

        </div>


        {/* ==================================================
            TABLE
        ================================================== */}

        <div className="news-admin__table-wrapper">

          <table className="news-admin__table">

            <thead>

              <tr>

                <th>
                  Article
                </th>

                <th>
                  Category
                </th>

                <th>
                  Status
                </th>

                <th>
                  Published
                </th>

                <th>
                  Views
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {loading && !adminArticles.length ? (

                <tr>

                  <td
                    colSpan="6"
                    className="news-admin__loading"
                  >

                    <FaSyncAlt className="news-admin__spin" />

                    Loading articles...

                  </td>

                </tr>

              ) : filteredArticles.length === 0 ? (

                <tr>

                  <td
                    colSpan="6"
                    className="news-admin__empty"
                  >

                    <FaNewspaper />

                    <strong>
                      No articles found
                    </strong>

                    <span>
                      Try changing your filters
                      or create a new article.
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/admin/news/create"
                        )
                      }
                    >

                      <FaPlus />

                      Create Article

                    </button>

                  </td>

                </tr>

              ) : (

                filteredArticles.map(
                  (article) => {

                    const isActionLoading =
                      (action) =>
                        actionLoading ===
                        `${action}-${article._id}`;


                    return (

                      <tr
                        key={article._id}
                      >

                        {/* ARTICLE */}

                        <td>

                          <div className="news-table-article">

                            <div className="news-table-article__image">

                              {article.featuredImage ? (

                                <img
                                  src={
                                    article.featuredImage
                                  }
                                  alt=""
                                />

                              ) : (

                                <FaNewspaper />

                              )}

                            </div>


                            <div className="news-table-article__content">

                              <strong
                                title={
                                  article.title
                                }
                              >
                                {article.title ||
                                  "Untitled Article"}
                              </strong>

                              <span>

                                {article.excerpt
                                  ? article.excerpt
                                  : "No excerpt available."}

                              </span>

                              {article.featured && (

                                <small>

                                  <FaStar />

                                  Featured

                                </small>

                              )}

                            </div>

                          </div>

                        </td>


                        {/* CATEGORY */}

                        <td>

                          <span className="news-category">

                            {getCategoryLabel(
                              article.category
                            )}

                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`news-status news-status--${article.status}`}
                          >

                            {article.status ===
                              NEWS_STATUS.PUBLISHED && (
                                <FaCheckCircle />
                              )}

                            {article.status ===
                              NEWS_STATUS.DRAFT && (
                                <FaClock />
                              )}

                            {article.status ===
                              NEWS_STATUS.ARCHIVED && (
                                <FaArchive />
                              )}

                            {getStatusLabel(
                              article.status
                            )}

                          </span>

                        </td>


                        {/* DATE */}

                        <td>

                          <span className="news-date">

                            {formatDate(
                              article.publishedAt ||
                              article.createdAt
                            )}

                          </span>

                        </td>


                        {/* VIEWS */}

                        <td>

                          <span className="news-views">

                            <FaEye />

                            {Number(
                              article.views || 0
                            ).toLocaleString()}

                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="news-actions">

                            {/* EDIT */}

                            <button
                              type="button"
                              className="news-action news-action--edit"
                              title="Edit article"
                              onClick={() =>
                                navigate(
                                  `/admin/news/${article._id}/edit`
                                )
                              }
                            >

                              <FaEdit />

                            </button>


                            {/* PUBLISH / UNPUBLISH */}

                            {article.status !==
                              NEWS_STATUS.ARCHIVED && (

                              <button
                                type="button"
                                className="news-action news-action--publish"
                                title={
                                  article.status ===
                                  NEWS_STATUS.PUBLISHED
                                    ? "Unpublish"
                                    : "Publish"
                                }
                                disabled={
                                  isActionLoading(
                                    "publish"
                                  ) ||
                                  isActionLoading(
                                    "unpublish"
                                  )
                                }
                                onClick={() =>
                                  handlePublishToggle(
                                    article
                                  )
                                }
                              >

                                {article.status ===
                                NEWS_STATUS.PUBLISHED
                                  ? <FaClock />
                                  : <FaCheckCircle />}

                              </button>

                            )}


                            {/* FEATURE */}

                            {article.status ===
                              NEWS_STATUS.PUBLISHED && (

                              <button
                                type="button"
                                className="news-action news-action--feature"
                                title={
                                  article.featured
                                    ? "Remove featured"
                                    : "Mark featured"
                                }
                                disabled={
                                  isActionLoading(
                                    "feature"
                                  ) ||
                                  isActionLoading(
                                    "unfeature"
                                  )
                                }
                                onClick={() =>
                                  handleFeatureToggle(
                                    article
                                  )
                                }
                              >

                                {article.featured
                                  ? <FaStar />
                                  : <FaRegStar />}

                              </button>

                            )}


                            {/* ARCHIVE */}

                            {article.status !==
                              NEWS_STATUS.ARCHIVED && (

                              <button
                                type="button"
                                className="news-action news-action--archive"
                                title="Archive article"
                                disabled={
                                  isActionLoading(
                                    "archive"
                                  )
                                }
                                onClick={() =>
                                  handleArchive(
                                    article
                                  )
                                }
                              >

                                <FaArchive />

                              </button>

                            )}


                            {/* DELETE */}

                            <button
                              type="button"
                              className="news-action news-action--delete"
                              title="Delete article"
                              disabled={
                                isActionLoading(
                                  "delete"
                                )
                              }
                              onClick={() =>
                                handleDelete(
                                  article
                                )
                              }
                            >

                              <FaTrash />

                            </button>

                          </div>

                        </td>

                      </tr>

                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>

  );

};


export default NewsAdmin;