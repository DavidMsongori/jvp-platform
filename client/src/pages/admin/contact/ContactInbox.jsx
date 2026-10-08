import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Search,
  Send,
  UserRound,
} from "lucide-react";

import { useContact } from "../../../context/ContactContext";

import ContactReplyBox from "./components/ContactReplyBox";

import "./ContactInbox.css";

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "in_progress", label: "In Progress" },
  { value: "responded", label: "Responded" },
  { value: "archived", label: "Archived" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "membership", label: "Membership" },
  { value: "programmes", label: "Programmes" },
  { value: "partnerships", label: "Partnerships" },
  { value: "media", label: "Media" },
  { value: "events", label: "Events" },
  { value: "leadership", label: "Leadership" },
  { value: "opportunities", label: "Opportunities" },
  { value: "support", label: "Support" },
  { value: "complaints", label: "Complaints" },
  { value: "other", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "All Priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const STATUS_LABELS = {
  new: "New",
  read: "Read",
  in_progress: "In Progress",
  responded: "Responded",
  archived: "Archived",
};

const CATEGORY_LABELS = {
  general: "General",
  membership: "Membership",
  programmes: "Programmes",
  partnerships: "Partnerships",
  media: "Media",
  events: "Events",
  leadership: "Leadership",
  opportunities: "Opportunities",
  support: "Support",
  complaints: "Complaints",
  other: "Other",
};

const PRIORITY_LABELS = {
  urgent: "Urgent",
  high: "High",
  normal: "Normal",
  low: "Low",
};

const formatDate = (date) => {
  if (!date) return "—";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "—";

  return value.toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) return "";

  return value.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
};

function ContactInbox() {
  const {
    contacts,
    selectedContact,
    statistics,
    pagination,
    loading,
    detailsLoading,
    error,

    filters,

    fetchContacts,
    fetchContact,
    fetchStatistics,

    updateFilters,
    resetFilters,

    markAsRead,
    markInProgress,
    updateStatus,
    updatePriority,

    archiveContact,

    clearSelectedContact,
    clearError,
  } = useContact();

  const [searchInput, setSearchInput] = useState(
    filters.search || ""
  );

  const [showMobileFilters, setShowMobileFilters] =
    useState(false);

  const [actionLoading, setActionLoading] = useState(false);

  const loadInbox = useCallback(
    async (customFilters = {}) => {
      try {
        await Promise.all([
          fetchContacts(customFilters),
          fetchStatistics(),
        ]);
      } catch {
        // Context manages the error state.
      }
    },
    [fetchContacts, fetchStatistics]
  );

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== filters.search) {
        updateFilters({
          search: searchInput,
          page: 1,
        });
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [
    searchInput,
    filters.search,
    updateFilters,
  ]);

  useEffect(() => {
    if (filters.page !== pagination.page) return;

    loadInbox(filters);
  }, [
    filters.status,
    filters.category,
    filters.priority,
    filters.assignedTo,
    filters.sortBy,
    filters.sortOrder,
  ]);

  const stats = useMemo(
    () => ({
      total: statistics?.total || 0,
      new: statistics?.new || 0,
      inProgress: statistics?.inProgress || 0,
      responded: statistics?.responded || 0,
      urgent: statistics?.urgent || 0,
    }),
    [statistics]
  );

  const handleRefresh = async () => {
    await loadInbox(filters);
  };

  const handleOpenContact = async (contact) => {
    try {
      await fetchContact(contact._id);

      if (contact.status === "new") {
        await markAsRead(contact._id);
        await fetchContact(contact._id);
        await fetchStatistics();
      }
    } catch {
      // Context handles errors.
    }
  };

  const runAction = async (action) => {
    if (!selectedContact?._id) return;

    setActionLoading(true);

    try {
      await action(selectedContact._id);

      await fetchContact(selectedContact._id);
      await fetchContacts(filters);
      await fetchStatistics();
    } catch {
      // Context handles errors.
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (event) => {
    const status = event.target.value;

    await runAction((contactId) =>
      updateStatus(contactId, status)
    );
  };

  const handlePriorityChange = async (event) => {
    const priority = event.target.value;

    await runAction((contactId) =>
      updatePriority(contactId, priority)
    );
  };

  const handleArchive = async () => {
    await runAction((contactId) =>
      archiveContact(contactId)
    );
  };

  const handlePageChange = async (page) => {
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === pagination.page
    ) {
      return;
    }

    updateFilters({ page });

    await loadInbox({
      ...filters,
      page,
    });
  };

  const handleResetFilters = () => {
    setSearchInput("");
    resetFilters();
  };

  return (
    <div className="contact-inbox">
      {/* HEADER */}
      <div className="contact-inbox__header">
        <div>
          <div className="contact-inbox__eyebrow">
            Secretariat
          </div>

          <h1>Contact Inbox</h1>

          <p>
            Manage enquiries, messages and requests received
            through the JVP website.
          </p>
        </div>

        <button
          type="button"
          className="contact-inbox__refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "is-spinning" : ""}
          />
          Refresh
        </button>
      </div>

      {/* STATISTICS */}
      <section className="contact-stats">
        <StatCard
          label="Total Enquiries"
          value={stats.total}
          icon={<MessageSquare size={18} />}
          className="total"
        />

        <StatCard
          label="New"
          value={stats.new}
          icon={<Mail size={18} />}
          className="new"
        />

        <StatCard
          label="In Progress"
          value={stats.inProgress}
          icon={<Clock3 size={18} />}
          className="progress"
        />

        <StatCard
          label="Responded"
          value={stats.responded}
          icon={<Send size={18} />}
          className="responded"
        />

        <StatCard
          label="Urgent"
          value={stats.urgent}
          icon={<Archive size={18} />}
          className="urgent"
        />
      </section>

      {/* ERROR */}
      {error && (
        <div className="contact-inbox__error">
          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TOOLBAR */}
      <section className="contact-toolbar">
        <div className="contact-search">
          <Search size={17} />

          <input
            type="search"
            value={searchInput}
            onChange={(event) =>
              setSearchInput(event.target.value)
            }
            placeholder="Search enquiries..."
          />
        </div>

        <button
          type="button"
          className="contact-filter-toggle"
          onClick={() =>
            setShowMobileFilters((current) => !current)
          }
        >
          Filters
        </button>

        <div
          className={`contact-filters ${
            showMobileFilters
              ? "contact-filters--open"
              : ""
          }`}
        >
          <select
            value={filters.status}
            onChange={(event) =>
              updateFilters({
                status: event.target.value,
                page: 1,
              })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.category}
            onChange={(event) =>
              updateFilters({
                category: event.target.value,
                page: 1,
              })
            }
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) =>
              updateFilters({
                priority: event.target.value,
                page: 1,
              })
            }
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="contact-reset-button"
            onClick={handleResetFilters}
          >
            Reset
          </button>
        </div>
      </section>

      {/* INBOX */}
      <section className="contact-inbox-card">
        <div className="contact-inbox-card__header">
          <div>
            <h2>Enquiries</h2>

            <span>
              {pagination.total || 0}{" "}
              {pagination.total === 1
                ? "enquiry"
                : "enquiries"}
            </span>
          </div>

          <div className="contact-sort">
            <label htmlFor="contact-sort">
              Sort
            </label>

            <select
              id="contact-sort"
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] =
                  event.target.value.split(":");

                updateFilters({
                  sortBy,
                  sortOrder,
                  page: 1,
                });
              }}
            >
              <option value="createdAt:desc">
                Newest
              </option>

              <option value="createdAt:asc">
                Oldest
              </option>

              <option value="priority:desc">
                Priority
              </option>

              <option value="name:asc">
                Name A–Z
              </option>
            </select>
          </div>
        </div>

        {loading ? (
          <ContactListSkeleton />
        ) : contacts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="contact-list">
            {contacts.map((contact) => (
              <ContactRow
                key={contact._id}
                contact={contact}
                onClick={() =>
                  handleOpenContact(contact)
                }
              />
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="contact-pagination">
            <span>
              Page {pagination.page} of{" "}
              {pagination.totalPages}
            </span>

            <div>
              <button
                type="button"
                onClick={() =>
                  handlePageChange(
                    pagination.page - 1
                  )
                }
                disabled={
                  pagination.page <= 1 || loading
                }
              >
                <ChevronLeft size={16} />
              </button>

              <button
                type="button"
                onClick={() =>
                  handlePageChange(
                    pagination.page + 1
                  )
                }
                disabled={
                  pagination.page >=
                    pagination.totalPages ||
                  loading
                }
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* DETAIL DRAWER */}
      {selectedContact && (
        <ContactDrawer
          contact={selectedContact}
          loading={detailsLoading || actionLoading}
          onClose={clearSelectedContact}
          onStatusChange={handleStatusChange}
          onPriorityChange={handlePriorityChange}
          onMarkInProgress={() =>
            runAction((contactId) =>
              markInProgress(contactId)
            )
          }
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}

/* ==========================================================================
   STAT CARD
   ========================================================================== */

function StatCard({
  label,
  value,
  icon,
  className = "",
}) {
  return (
    <div className={`contact-stat ${className}`}>
      <div className="contact-stat__icon">
        {icon}
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* ==========================================================================
   CONTACT ROW
   ========================================================================== */

function ContactRow({ contact, onClick }) {
  const isUnread = contact.status === "new";

  return (
    <button
      type="button"
      className={`contact-row ${
        isUnread ? "contact-row--unread" : ""
      }`}
      onClick={onClick}
    >
      <div className="contact-row__avatar">
        {getInitials(contact.name)}
      </div>

      <div className="contact-row__main">
        <div className="contact-row__top">
          <strong>{contact.name}</strong>

          <span className="contact-row__date">
            {formatDate(contact.createdAt)}

            <small>
              {formatTime(contact.createdAt)}
            </small>
          </span>
        </div>

        <div className="contact-row__subject">
          {contact.subject}
        </div>

        <p>
          {contact.message?.length > 120
            ? `${contact.message.slice(0, 120)}...`
            : contact.message}
        </p>

        <div className="contact-row__meta">
          <span className="contact-category">
            {CATEGORY_LABELS[contact.category] ||
              contact.category}
          </span>

          <span
            className={`contact-status contact-status--${contact.status}`}
          >
            {STATUS_LABELS[contact.status] ||
              contact.status}
          </span>

          <span
            className={`contact-priority contact-priority--${contact.priority}`}
          >
            {PRIORITY_LABELS[contact.priority] ||
              contact.priority}
          </span>
        </div>
      </div>

      <MoreHorizontal
        size={18}
        className="contact-row__more"
      />
    </button>
  );
}

/* ==========================================================================
   DETAIL DRAWER
   ========================================================================== */

function ContactDrawer({
  contact,
  loading,
  onClose,
  onStatusChange,
  onPriorityChange,
  onMarkInProgress,
  onArchive,
}) {
  return (
    <div className="contact-drawer-overlay">
      <div className="contact-drawer">
        {/* DRAWER HEADER */}
        <div className="contact-drawer__header">
          <div>
            <span>Enquiry</span>
            <h2>{contact.subject}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close enquiry"
          >
            ×
          </button>
        </div>

        <div className="contact-drawer__body">
          {/* SENDER */}
          <div className="contact-sender">
            <div className="contact-sender__avatar">
              {getInitials(contact.name)}
            </div>

            <div>
              <strong>{contact.name}</strong>

              <a href={`mailto:${contact.email}`}>
                {contact.email}
              </a>

              {contact.phone && (
                <span>{contact.phone}</span>
              )}
            </div>
          </div>

          {/* META */}
          <div className="contact-detail-meta">
            <div>
              <span>Received</span>

              <strong>
                {formatDate(contact.createdAt)}
              </strong>
            </div>

            <div>
              <span>Category</span>

              <strong>
                {CATEGORY_LABELS[contact.category] ||
                  contact.category}
              </strong>
            </div>

            <div>
              <span>Source</span>

              <strong>
                {contact.source || "Website"}
              </strong>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="contact-detail-controls">
            <div>
              <label htmlFor="detail-status">
                Status
              </label>

              <select
                id="detail-status"
                value={contact.status}
                onChange={onStatusChange}
                disabled={loading}
              >
                {STATUS_OPTIONS.filter(
                  (option) => option.value
                ).map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="detail-priority">
                Priority
              </label>

              <select
                id="detail-priority"
                value={contact.priority}
                onChange={onPriorityChange}
                disabled={loading}
              >
                {PRIORITY_OPTIONS.filter(
                  (option) => option.value
                ).map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* MESSAGE */}
          <div className="contact-message">
            <div className="contact-message__heading">
              <MessageSquare size={16} />
              <span>Message</span>
            </div>

            <div className="contact-message__body">
              {contact.message}
            </div>
          </div>

          {/* PREVIOUS RESPONSE */}
          {contact.response && (
            <div className="contact-response">
              <div className="contact-message__heading">
                <Send size={16} />
                <span>Previous Response</span>
              </div>

              <div className="contact-message__body">
                {contact.response}
              </div>

              {contact.respondedAt && (
                <small>
                  Responded{" "}
                  {formatDate(contact.respondedAt)}
                  {contact.respondedBy?.name
                    ? ` by ${contact.respondedBy.name}`
                    : ""}
                </small>
              )}
            </div>
          )}

          {/* REPLY */}
          {!contact.archivedAt &&
            contact.status !== "archived" && (
              <ContactReplyBox
                contact={contact}
              />
            )}

          {/* ASSIGNMENT */}
          <div className="contact-assignment">
            <div className="contact-message__heading">
              <UserRound size={16} />
              <span>Assignment</span>
            </div>

            {contact.assignedTo ? (
              <div className="contact-assigned-user">
                <strong>
                  {contact.assignedTo.name ||
                    contact.assignedTo.email}
                </strong>

                {contact.assignedTo.email && (
                  <span>
                    {contact.assignedTo.email}
                  </span>
                )}
              </div>
            ) : (
              <p>Not assigned yet.</p>
            )}
          </div>

          {/* INTERNAL NOTES */}
          {contact.internalNotes && (
            <div className="contact-notes">
              <span>Internal Notes</span>

              <p>{contact.internalNotes}</p>
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="contact-drawer__footer">
          {contact.status !== "in_progress" &&
            contact.status !== "responded" &&
            contact.status !== "archived" && (
              <button
                type="button"
                className="contact-action contact-action--primary"
                onClick={onMarkInProgress}
                disabled={loading}
              >
                <Clock3 size={15} />
                Mark In Progress
              </button>
            )}

          {contact.status !== "archived" && (
            <button
              type="button"
              className="contact-action contact-action--danger"
              onClick={onArchive}
              disabled={loading}
            >
              <Archive size={15} />
              Archive
            </button>
          )}

          <a
            href={`mailto:${contact.email}`}
            className="contact-action contact-action--secondary"
          >
            <Mail size={15} />
            Email Sender
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   EMPTY STATE
   ========================================================================== */

function EmptyState() {
  return (
    <div className="contact-empty">
      <div className="contact-empty__icon">
        <MessageSquare size={23} />
      </div>

      <h3>No enquiries found</h3>

      <p>
        There are no contact enquiries matching the
        current filters.
      </p>
    </div>
  );
}

/* ==========================================================================
   SKELETON
   ========================================================================== */

function ContactListSkeleton() {
  return (
    <div className="contact-list contact-list--skeleton">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          className="contact-skeleton"
          key={index}
        >
          <div className="contact-skeleton__avatar" />

          <div className="contact-skeleton__content">
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ContactInbox;