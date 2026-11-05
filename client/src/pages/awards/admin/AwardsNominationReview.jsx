
import { useCallback, useEffect, useState } from "react";

import {
  getAdminAwardCategories,
  getAdminAwardNominations,
  reviewAwardNomination,
} from "../../../services/awardService";

import "./AwardsAdmin.css";

const PAGE_SIZE = 10;

const initialFilters = {
  status: "",
  categoryId: "",
};

const statusLabels = {
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const formatDate = (value) => {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return date.toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

export default function AwardsNominationReview() {
  const [nominations, setNominations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [selectedNomination, setSelectedNomination] = useState(null);
  const [decision, setDecision] = useState("under_review");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [savingReview, setSavingReview] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [categoryResponse, nominationResponse] =
        await Promise.all([
          getAdminAwardCategories(),
          getAdminAwardNominations({
            status: filters.status || undefined,
            categoryId: filters.categoryId || undefined,
            page,
            limit: PAGE_SIZE,
          }),
        ]);

      const categoryData = categoryResponse?.data;
      const nominationData = nominationResponse?.data;

      setCategories(
        Array.isArray(categoryData) ? categoryData : []
      );

      setNominations(
        Array.isArray(nominationData) ? nominationData : []
      );

      setPagination(
        nominationResponse?.pagination || {
          page,
          totalPages: 1,
          total: Array.isArray(nominationData)
            ? nominationData.length
            : 0,
        }
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to load nominations. Check your administrator access and API configuration."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.categoryId, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));

    setPage(1);
    setMessage("");
    setError("");
  };

  const openReview = (nomination) => {
    setSelectedNomination(nomination);
    setDecision(
      nomination.status === "submitted"
        ? "under_review"
        : nomination.status
    );
    setReviewNotes(nomination.reviewNotes || "");
    setRejectionReason(nomination.rejectionReason || "");
    setMessage("");
    setError("");
  };

  const closeReview = () => {
    if (savingReview) return;

    setSelectedNomination(null);
    setReviewNotes("");
    setRejectionReason("");
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!selectedNomination?._id) {
      setError("The selected nomination has no valid ID.");
      return;
    }

    if (
      !["under_review", "approved", "rejected"].includes(decision)
    ) {
      setError("Select a valid review decision.");
      return;
    }

    if (
      decision === "rejected" &&
      !rejectionReason.trim()
    ) {
      setError("Please provide a reason for rejecting this nomination.");
      return;
    }

    setSavingReview(true);
    setError("");
    setMessage("");

    try {
      await reviewAwardNomination(selectedNomination._id, {
        decision,
        reviewNotes: reviewNotes.trim(),
        rejectionReason:
          decision === "rejected"
            ? rejectionReason.trim()
            : "",
      });

      setMessage(
        `Nomination ${statusLabels[decision]?.toLowerCase() || decision} successfully.`
      );

      setSelectedNomination(null);

      await loadData();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Unable to save the review. Please try again."
        )
      );
    } finally {
      setSavingReview(false);
    }
  };

  const countByStatus = (status) =>
    nominations.filter(
      (nomination) => nomination.status === status
    ).length;

  const getNomineeName = (nomination) =>
    nomination.nomineeName ||
    nomination.fullName ||
    nomination.nominee?.fullName ||
    nomination.nominee?.name ||
    "Unnamed nominee";

  const getCategoryName = (nomination) => {
    const category = nomination.category;

    if (category && typeof category === "object") {
      return category.name || "Uncategorised";
    }

    return (
      categories.find(
        (item) => item._id === category
      )?.name || "Uncategorised"
    );
  };

  return (
    <main className="awards-admin">
      <header className="awards-admin-header">
        <div>
          <p className="awards-admin-eyebrow">
            JVP COASTAL YOUTH EXCELLENCE AWARDS
          </p>

          <h1>Nomination Review</h1>

          <p>
            Review submissions, verify eligibility, and record
            official Secretariat decisions.
          </p>
        </div>

        <button
          className="awards-secondary-button"
          type="button"
          onClick={loadData}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh Nominations"}
        </button>
      </header>

      {error && (
        <div className="awards-admin-alert error" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="awards-admin-alert success" role="status">
          {message}
        </div>
      )}

      <section className="awards-admin-stats">
        <article className="awards-stat-card">
          <span>Matching Nominations</span>
          <strong>{pagination.total ?? nominations.length}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Submitted on Page</span>
          <strong>{countByStatus("submitted")}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Under Review on Page</span>
          <strong>{countByStatus("under_review")}</strong>
        </article>

        <article className="awards-stat-card">
          <span>Approved on Page</span>
          <strong>{countByStatus("approved")}</strong>
        </article>
      </section>

      <section className="awards-admin-panel">
        <div className="awards-panel-heading">
          <div>
            <h2>Submitted Nominations</h2>
            <p>
              Filter the queue, select a nomination, and record
              the Secretariat’s decision.
            </p>
          </div>
        </div>

        <div className="awards-form-grid awards-review-filters">
          <label>
            Filter by status
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </label>

          <label>
            Filter by category
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
            >
              <option value="">All categories</option>

              {categories.map((category) => (
                <option
                  key={category._id}
                  value={category._id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p>Loading nominations...</p>
        ) : nominations.length === 0 ? (
          <div className="awards-admin-empty">
            <span>📋</span>
            <h3>No nominations found</h3>
            <p>
              No nominations match the selected filters.
              Try another status or category.
            </p>
          </div>
        ) : (
          <div className="awards-review-list">
            {nominations.map((nomination) => (
              <article
                className="awards-review-card"
                key={nomination._id}
              >
                <div className="awards-review-card-main">
                  <div>
                    <p className="awards-admin-eyebrow">
                      {getCategoryName(nomination)}
                    </p>

                    <h3>{getNomineeName(nomination)}</h3>

                    <p>
                      Nominated by:{" "}
                      {nomination.nominatorName ||
                        nomination.nominator?.fullName ||
                        nomination.nominator?.name ||
                        nomination.nominatorEmail ||
                        "Not provided"}
                    </p>

                    <p>
                      Submitted: {formatDate(nomination.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`awards-status ${
                      nomination.status || "submitted"
                    }`}
                  >
                    {statusLabels[nomination.status] ||
                      nomination.status ||
                      "Submitted"}
                  </span>
                </div>

                <div className="awards-review-summary">
                  <p>
                    <strong>Achievement:</strong>{" "}
                    {nomination.achievementDescription ||
                      nomination.reasonForNomination ||
                      nomination.description ||
                      "No achievement description provided."}
                  </p>

                  {nomination.county && (
                    <p>
                      <strong>County:</strong> {nomination.county}
                    </p>
                  )}
                </div>

                <div className="awards-review-actions">
                  <button
                    className="awards-primary-button"
                    type="button"
                    onClick={() => openReview(nomination)}
                  >
                    Review Nomination
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && pagination.totalPages > 1 && (
          <div className="awards-review-pagination">
            <button
              className="awards-secondary-button"
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((previous) => Math.max(1, previous - 1))
              }
            >
              Previous
            </button>

            <span>
              Page {pagination.page || page} of{" "}
              {pagination.totalPages}
            </span>

            <button
              className="awards-secondary-button"
              type="button"
              disabled={page >= pagination.totalPages}
              onClick={() =>
                setPage((previous) =>
                  Math.min(
                    pagination.totalPages,
                    previous + 1
                  )
                )
              }
            >
              Next
            </button>
          </div>
        )}
      </section>

      {selectedNomination && (
        <div
          className="awards-review-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingReview
            ) {
              closeReview();
            }
          }}
        >
          <section
            className="awards-review-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="awards-review-title"
          >
            <div className="awards-panel-heading">
              <div>
                <p className="awards-admin-eyebrow">
                  {getCategoryName(selectedNomination)}
                </p>

                <h2 id="awards-review-title">
                  Review Nomination
                </h2>

                <p>{getNomineeName(selectedNomination)}</p>
              </div>

              <button
                className="awards-secondary-button"
                type="button"
                onClick={closeReview}
                disabled={savingReview}
              >
                Close
              </button>
            </div>

            <div className="awards-review-details">
              <p>
                <strong>Current status:</strong>{" "}
                {statusLabels[selectedNomination.status] ||
                  selectedNomination.status}
              </p>

              <p>
                <strong>Submitted:</strong>{" "}
                {formatDate(selectedNomination.createdAt)}
              </p>

              <p>
                <strong>County:</strong>{" "}
                {selectedNomination.county || "Not provided"}
              </p>

              <p>
                <strong>Nominee email:</strong>{" "}
                {selectedNomination.nomineeEmail ||
                  selectedNomination.email ||
                  selectedNomination.nominee?.email ||
                  "Not provided"}
              </p>

              <p>
                <strong>Nominee phone:</strong>{" "}
                {selectedNomination.nomineePhone ||
                  selectedNomination.phone ||
                  selectedNomination.nominee?.phone ||
                  "Not provided"}
              </p>

              <div>
                <strong>Achievement and justification</strong>
                <p>
                  {selectedNomination.achievementDescription ||
                    selectedNomination.reasonForNomination ||
                    selectedNomination.description ||
                    "No achievement description provided."}
                </p>
              </div>

              <div>
                <strong>Supporting evidence</strong>
                <p>
                  {selectedNomination.supportingEvidence ||
                    selectedNomination.evidence ||
                    "No supporting evidence provided."}
                </p>
              </div>
            </div>

            <form
              className="awards-category-form"
              onSubmit={handleReviewSubmit}
            >
              <label>
                Secretariat decision
                <select
                  value={decision}
                  onChange={(event) =>
                    setDecision(event.target.value)
                  }
                  disabled={savingReview}
                  required
                >
                  <option value="under_review">
                    Mark Under Review
                  </option>
                  <option value="approved">
                    Approve Nomination
                  </option>
                  <option value="rejected">
                    Reject Nomination
                  </option>
                </select>
              </label>

              <label>
                Review notes
                <textarea
                  value={reviewNotes}
                  onChange={(event) =>
                    setReviewNotes(event.target.value)
                  }
                  rows={4}
                  maxLength={3000}
                  placeholder="Record eligibility checks, evidence verification, and other observations."
                  disabled={savingReview}
                />
              </label>

              {decision === "rejected" && (
                <label>
                  Reason for rejection
                  <textarea
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    rows={3}
                    maxLength={2000}
                    placeholder="Explain why this nomination does not meet the requirements."
                    required
                    disabled={savingReview}
                  />
                </label>
              )}

              <div className="awards-review-modal-actions">
                <button
                  className="awards-secondary-button"
                  type="button"
                  onClick={closeReview}
                  disabled={savingReview}
                >
                  Cancel
                </button>

                <button
                  className="awards-primary-button"
                  type="submit"
                  disabled={savingReview}
                >
                  {savingReview
                    ? "Saving Decision..."
                    : "Save Review Decision"}
                </button>
              </div>
            </form>

            <p className="awards-admin-note">
              Approval makes a nomination eligible for the next
              stage, subject to the backend’s voting rules and
              the officially configured voting window.
            </p>
          </section>
        </div>
      )}
    </main>
  );
}
