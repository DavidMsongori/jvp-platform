import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  CalendarDays,
  MapPin,
  Loader2,
  AlertTriangle,
  Star,
  Eye,
  EyeOff,
  Users,
  Clock3,
  Ticket,
  Globe2,
  Building2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  UserRound,
  Handshake,
  Image as ImageIcon,
  Search,
  Database,
} from "lucide-react";

import eventService from "../../../services/event.service";
import "./ViewEvent.css";

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleString("en-KE", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

const formatDateOnly = (date) => {
  if (!date) return "N/A";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "N/A";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    dateStyle: "long",
  });
};

const formatTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCurrency = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    return "FREE";
  }

  return `KES ${value.toLocaleString("en-KE")}`;
};

const getRegistrationCount = (event) => {
  if (
    typeof event?.registeredParticipants === "number"
  ) {
    return event.registeredParticipants;
  }

  if (
    typeof event?.registration?.registeredCount === "number"
  ) {
    return event.registration.registeredCount;
  }

  return 0;
};

const getCapacity = (event) => {
  const capacity = Number(
    event?.registration?.capacity
  );

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return null;
  }

  return capacity;
};

const getAvailableSlots = (event) => {
  const registered = getRegistrationCount(event);
  const capacity = getCapacity(event);

  if (!capacity) {
    return null;
  }

  return Math.max(capacity - registered, 0);
};

const getRegistrationPercentage = (event) => {
  const registered = getRegistrationCount(event);
  const capacity = getCapacity(event);

  if (!capacity) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((registered / capacity) * 100)
  );
};

const getEventImage = (event) => {
  return (
    event?.coverImage?.secureUrl ||
    event?.coverImage?.url ||
    "/placeholder-event.jpg"
  );
};

const getEventTypeLabel = (event) => {
  if (event?.eventType === "virtual") {
    return "Virtual";
  }

  if (event?.eventType === "physical") {
    return "Physical";
  }

  return event?.eventType || "N/A";
};

const getLocationPrimary = (event) => {
  if (event?.eventType === "virtual") {
    return "Virtual Event";
  }

  return (
    event?.venue?.name ||
    "Venue not specified"
  );
};

const getLocationSecondary = (event) => {
  if (event?.eventType === "virtual") {
    return (
      event?.virtualPlatform ||
      "Online"
    );
  }

  return [
    event?.venue?.city,
    event?.venue?.county,
  ]
    .filter(Boolean)
    .join(", ");
};

/* =========================================================
   INFO ITEM
========================================================= */

const InfoItem = ({
  label,
  value,
  icon: Icon,
}) => {
  return (
    <div className="view-info-item">
      <div className="view-info-label">
        {Icon && <Icon size={14} />}
        <span>{label}</span>
      </div>

      <p>{value || "N/A"}</p>
    </div>
  );
};

/* =========================================================
   EMPTY STATE
========================================================= */

const EmptyState = ({
  icon: Icon = CalendarDays,
  title,
  message,
}) => {
  return (
    <div className="view-empty-state">
      <div className="view-empty-icon">
        <Icon size={22} />
      </div>

      <div>
        <strong>{title}</strong>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
};

/* =========================================================
   COMPONENT
========================================================= */

const ViewEvent = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD EVENT
  ======================================================= */

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await eventService.getEventById(id);

      setEvent(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load event."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="event-view-state">
        <div className="event-view-state-icon">
          <Loader2 className="spinner" size={28} />
        </div>

        <h2>Loading Event</h2>

        <p>
          Please wait while the event details are
          being loaded.
        </p>
      </div>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error || !event) {
    return (
      <div className="event-view-state error">
        <div className="event-view-state-icon">
          <AlertTriangle size={28} />
        </div>

        <h2>
          {error || "Event not found."}
        </h2>

        <p>
          The event could not be loaded or may no
          longer exist.
        </p>

        <button
          type="button"
          className="view-primary-btn"
          onClick={() =>
            navigate("/admin/events")
          }
        >
          <ArrowLeft size={16} />
          Back to Events
        </button>
      </div>
    );
  }

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const registered = getRegistrationCount(event);
  const capacity = getCapacity(event);
  const availableSlots = getAvailableSlots(event);
  const registrationPercentage =
    getRegistrationPercentage(event);

  const eventImage = getEventImage(event);

  const isPublished = Boolean(
    event?.isPublished
  );

  const isArchived = Boolean(
    event?.isArchived
  );

  const isFeatured = Boolean(
    event?.isFeatured
  );

  const locationPrimary =
    getLocationPrimary(event);

  const locationSecondary =
    getLocationSecondary(event);

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <div className="view-event-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <header className="view-event-header">

        <div className="view-event-header-left">

          <button
            type="button"
            className="view-back-btn"
            onClick={() =>
              navigate("/admin/events")
            }
          >
            <ArrowLeft size={17} />
            <span>Events</span>
          </button>

          <div className="header-divider" />

          <div>
            <span className="header-eyebrow">
              Event Management
            </span>

            <h1>Event Details</h1>
          </div>

        </div>

        <div className="view-event-header-actions">

          <button
            type="button"
            className="secondary-btn"
            onClick={fetchEvent}
            disabled={loading}
          >
            <Search size={16} />
            Refresh
          </button>

          <Link
            to={`/admin/events/${id}/edit`}
            className="view-primary-btn"
          >
            <Pencil size={16} />
            Edit Event
          </Link>

        </div>

      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="event-detail-hero">

        <div className="event-hero-image">

          <img
            src={eventImage}
            alt={event.title}
          />

          <div className="hero-image-overlay" />

        </div>

        <div className="event-hero-content">

          {/* BADGES */}

          <div className="event-detail-badges">

            <span className="detail-badge category">
              {event.category || "General"}
            </span>

            <span className="detail-badge type">
              {event.eventType === "virtual" ? (
                <Globe2 size={13} />
              ) : (
                <Building2 size={13} />
              )}

              {getEventTypeLabel(event)}
            </span>

            <span
              className={`detail-badge ${
                isArchived
                  ? "archived"
                  : isPublished
                  ? "published"
                  : "draft"
              }`}
            >
              <span className="badge-dot" />

              {isArchived
                ? "Archived"
                : isPublished
                ? "Published"
                : "Draft"}
            </span>

            {isFeatured && (
              <span className="detail-badge featured">
                <Star
                  size={13}
                  fill="currentColor"
                />
                Featured
              </span>
            )}

          </div>

          {/* TITLE */}

          <h2>{event.title}</h2>

          {event.summary && (
            <p className="event-detail-summary">
              {event.summary}
            </p>
          )}

          {/* HERO META */}

          <div className="event-detail-meta">

            <div className="hero-meta-item">

              <CalendarDays size={16} />

              <div>
                <span>Date</span>

                <strong>
                  {formatDateOnly(
                    event.startDate
                  )}
                </strong>
              </div>

            </div>

            <div className="hero-meta-item">

              <Clock3 size={16} />

              <div>
                <span>Time</span>

                <strong>
                  {formatTime(
                    event.startDate
                  ) || "TBA"}
                </strong>
              </div>

            </div>

            <div className="hero-meta-item">

              {event.eventType === "virtual" ? (
                <Globe2 size={16} />
              ) : (
                <MapPin size={16} />
              )}

              <div>
                <span>Location</span>

                <strong>
                  {locationPrimary}
                </strong>

                {locationSecondary && (
                  <small>
                    {locationSecondary}
                  </small>
                )}
              </div>

            </div>

            <div className="hero-meta-item">

              {isPublished ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}

              <div>
                <span>Visibility</span>

                <strong>
                  {isPublished
                    ? "Public"
                    : "Hidden"}
                </strong>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          QUICK STATISTICS
      ================================================= */}

      <section className="view-stats">

        <div className="view-stat-card">

          <div className="view-stat-icon registrations">
            <Users size={18} />
          </div>

          <div className="view-stat-content">
            <span>Registered</span>

            <strong>
              {registered.toLocaleString()}
            </strong>

            {capacity && (
              <small>
                of {capacity.toLocaleString()}
              </small>
            )}
          </div>

        </div>

        <div className="view-stat-card">

          <div className="view-stat-icon capacity">
            <Ticket size={18} />
          </div>

          <div className="view-stat-content">
            <span>Capacity</span>

            <strong>
              {capacity
                ? capacity.toLocaleString()
                : "∞"}
            </strong>

            <small>
              {capacity
                ? "Maximum"
                : "Unlimited"}
            </small>
          </div>

        </div>

        <div className="view-stat-card">

          <div className="view-stat-icon available">
            <CheckCircle2 size={18} />
          </div>

          <div className="view-stat-content">
            <span>Available</span>

            <strong>
              {availableSlots !== null
                ? availableSlots.toLocaleString()
                : "∞"}
            </strong>

            <small>
              {capacity
                ? `${registrationPercentage}% filled`
                : "No capacity limit"}
            </small>
          </div>

        </div>

        <div className="view-stat-card">

          <div className="view-stat-icon fee">
            <Ticket size={18} />
          </div>

          <div className="view-stat-content">
            <span>Registration Fee</span>

            <strong>
              {formatCurrency(
                event.registration?.fee
              )}
            </strong>

            <small>
              {event.registration?.required
                ? "Registration required"
                : "Registration optional"}
            </small>
          </div>

        </div>

      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="view-event-content">

        {/* =================================================
            LEFT COLUMN
        ================================================= */}

        <main className="view-event-main">

          {/* EVENT OVERVIEW */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Overview
                </span>

                <h2>Event Information</h2>
              </div>

            </div>

            <div className="view-info-grid">

              <InfoItem
                label="Event Title"
                value={event.title}
              />

              <InfoItem
                label="Category"
                value={event.category}
              />

              <InfoItem
                label="Event Type"
                value={getEventTypeLabel(event)}
                icon={
                  event.eventType ===
                  "virtual"
                    ? Globe2
                    : Building2
                }
              />

              <InfoItem
                label="Visibility"
                value={
                  isArchived
                    ? "Archived"
                    : isPublished
                    ? "Published"
                    : "Draft"
                }
                icon={
                  isPublished
                    ? Eye
                    : EyeOff
                }
              />

              <InfoItem
                label="Featured Event"
                value={
                  isFeatured
                    ? "Yes"
                    : "No"
                }
                icon={Star}
              />

              <InfoItem
                label="Slug"
                value={event.slug}
              />

            </div>

          </section>

          {/* DESCRIPTION */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Content
                </span>

                <h2>Description</h2>
              </div>

            </div>

            {event.description ? (
              <div className="view-description">
                <p>
                  {event.description}
                </p>
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No description"
                message="No detailed event description has been added."
              />
            )}

          </section>

          {/* SCHEDULE */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Timeline
                </span>

                <h2>Schedule</h2>
              </div>

            </div>

            <div className="schedule-grid">

              <div className="schedule-card">

                <div className="schedule-icon">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <span>Starts</span>

                  <strong>
                    {formatDateOnly(
                      event.startDate
                    )}
                  </strong>

                  <small>
                    {formatTime(
                      event.startDate
                    ) || "Time TBA"}
                  </small>
                </div>

              </div>

              <div className="schedule-card">

                <div className="schedule-icon">
                  <CalendarDays size={18} />
                </div>

                <div>
                  <span>Ends</span>

                  <strong>
                    {formatDateOnly(
                      event.endDate
                    )}
                  </strong>

                  <small>
                    {formatTime(
                      event.endDate
                    ) || "Time TBA"}
                  </small>
                </div>

              </div>

              <div className="schedule-card">

                <div className="schedule-icon">
                  <Clock3 size={18} />
                </div>

                <div>
                  <span>Registration Opens</span>

                  <strong>
                    {formatDateOnly(
                      event.registration
                        ?.registrationOpens
                    )}
                  </strong>

                  <small>
                    {formatTime(
                      event.registration
                        ?.registrationOpens
                    ) || ""}
                  </small>
                </div>

              </div>

              <div className="schedule-card">

                <div className="schedule-icon">
                  <Clock3 size={18} />
                </div>

                <div>
                  <span>Registration Closes</span>

                  <strong>
                    {formatDateOnly(
                      event.registration
                        ?.registrationDeadline
                    )}
                  </strong>

                  <small>
                    {formatTime(
                      event.registration
                        ?.registrationDeadline
                    ) || ""}
                  </small>
                </div>

              </div>

            </div>

          </section>

          {/* VENUE */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Location
                </span>

                <h2>
                  {event.eventType ===
                  "virtual"
                    ? "Virtual Event"
                    : "Venue Details"}
                </h2>
              </div>

            </div>

            {event.eventType === "virtual" ? (

              <div className="virtual-event-card">

                <div className="virtual-icon">
                  <Globe2 size={22} />
                </div>

                <div>
                  <span>Online Platform</span>

                  <strong>
                    {event.virtualPlatform ||
                      "Online"}
                  </strong>
                </div>

              </div>

            ) : (

              <div className="view-info-grid">

                <InfoItem
                  label="Venue Name"
                  value={
                    event.venue?.name
                  }
                  icon={MapPin}
                />

                <InfoItem
                  label="County"
                  value={
                    event.venue?.county
                  }
                />

                <InfoItem
                  label="City"
                  value={
                    event.venue?.city
                  }
                />

                <InfoItem
                  label="Address"
                  value={
                    event.venue?.address
                  }
                />

              </div>

            )}

            {event.venue?.googleMapsLink && (
              <a
                href={
                  event.venue.googleMapsLink
                }
                target="_blank"
                rel="noopener noreferrer"
                className="map-link"
              >
                <MapPin size={15} />
                Open in Google Maps
                <ExternalLink size={13} />
              </a>
            )}

          </section>

          {/* REGISTRATION SETTINGS */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Registration
                </span>

                <h2>Registration Settings</h2>
              </div>

            </div>

            <div className="view-info-grid">

              <InfoItem
                label="Registration Required"
                value={
                  event.registration?.required
                    ? "Yes"
                    : "No"
                }
              />

              <InfoItem
                label="Capacity"
                value={
                  capacity
                    ? capacity.toLocaleString()
                    : "Unlimited"
                }
              />

              <InfoItem
                label="Registration Fee"
                value={formatCurrency(
                  event.registration?.fee
                )}
              />

              <InfoItem
                label="Walk-ins"
                value={
                  event.registration
                    ?.allowWalkIns
                    ? "Allowed"
                    : "Not Allowed"
                }
              />

              <InfoItem
                label="Waiting List"
                value={
                  event.registration
                    ?.allowWaitlist
                    ? "Enabled"
                    : "Disabled"
                }
              />

              <InfoItem
                label="Approval Required"
                value={
                  event.registration
                    ?.requireApproval
                    ? "Yes"
                    : "No"
                }
              />

            </div>

            {/* REGISTRATION PROGRESS */}

            {capacity && (
              <div className="registration-progress-card">

                <div className="registration-progress-header">

                  <div>
                    <span>
                      Registration Capacity
                    </span>

                    <strong>
                      {registered} of{" "}
                      {capacity} registered
                    </strong>
                  </div>

                  <strong>
                    {registrationPercentage}%
                  </strong>

                </div>

                <div className="registration-progress-track">

                  <span
                    style={{
                      width: `${registrationPercentage}%`,
                    }}
                  />

                </div>

              </div>
            )}

          </section>

          {/* SPEAKERS */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  People
                </span>

                <h2>Speakers</h2>
              </div>

              {event.speakers?.length > 0 && (
                <span className="section-count">
                  {event.speakers.length}
                </span>
              )}

            </div>

            {!event.speakers?.length ? (

              <EmptyState
                icon={UserRound}
                title="No speakers assigned"
                message="Speakers will appear here once they are added to this event."
              />

            ) : (

              <div className="speaker-grid">

                {event.speakers.map(
                  (speaker, index) => {

                    const photo =
                      speaker.photo?.secureUrl ||
                      speaker.photo?.url;

                    return (
                      <div
                        key={
                          speaker._id ||
                          speaker.id ||
                          index
                        }
                        className="speaker-card"
                      >

                        <div className="speaker-photo">

                          {photo ? (
                            <img
                              src={photo}
                              alt={
                                speaker.name
                              }
                              loading="lazy"
                            />
                          ) : (
                            <UserRound
                              size={24}
                            />
                          )}

                        </div>

                        <div className="speaker-info">

                          <h3>
                            {speaker.name ||
                              "Unnamed Speaker"}
                          </h3>

                          {speaker.title && (
                            <p>
                              {speaker.title}
                            </p>
                          )}

                          {speaker.organization && (
                            <small>
                              {
                                speaker.organization
                              }
                            </small>
                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

          {/* PARTNERS */}

          <section className="view-section">

            <div className="view-section-header">

              <div>
                <span className="section-eyebrow">
                  Collaboration
                </span>

                <h2>Partners</h2>
              </div>

              {event.partners?.length > 0 && (
                <span className="section-count">
                  {event.partners.length}
                </span>
              )}

            </div>

            {!event.partners?.length ? (

              <EmptyState
                icon={Handshake}
                title="No partners assigned"
                message="Partner organizations will appear here once added."
              />

            ) : (

              <div className="partner-grid">

                {event.partners.map(
                  (partner, index) => {

                    const logo =
                      partner.logo?.secureUrl ||
                      partner.logo?.url;

                    return (
                      <div
                        key={
                          partner._id ||
                          partner.id ||
                          index
                        }
                        className="partner-card"
                      >

                        <div className="partner-logo">

                          {logo ? (
                            <img
                              src={logo}
                              alt={
                                partner.name
                              }
                              loading="lazy"
                            />
                          ) : (
                            <Handshake
                              size={23}
                            />
                          )}

                        </div>

                        <div>
                          <h3>
                            {partner.name ||
                              "Unnamed Partner"}
                          </h3>

                          {partner.category && (
                            <span>
                              {
                                partner.category
                              }
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </section>

          {/* GALLERY */}

          {!!event.gallery?.length && (
            <section className="view-section">

              <div className="view-section-header">

                <div>
                  <span className="section-eyebrow">
                    Media
                  </span>

                  <h2>Gallery</h2>
                </div>

                <span className="section-count">
                  {event.gallery.length}
                </span>

              </div>

              <div className="gallery-grid">

                {event.gallery.map(
                  (image, index) => {

                    const imageUrl =
                      image?.secureUrl ||
                      image?.url;

                    return (
                      <div
                        key={
                          image?.publicId ||
                          image?._id ||
                          index
                        }
                        className="gallery-item"
                      >
                        {imageUrl && (
                          <img
                            src={imageUrl}
                            alt={
                              image?.alt ||
                              `Event gallery ${
                                index + 1
                              }`
                            }
                            loading="lazy"
                          />
                        )}
                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}

        </main>

        {/* =================================================
            RIGHT SIDEBAR
        ================================================= */}

        <aside className="view-event-sidebar">

          {/* QUICK STATUS */}

          <section className="sidebar-card">

            <div className="sidebar-card-header">
              <h3>Event Status</h3>
            </div>

            <div className="status-summary">

              <div
                className={`large-status ${
                  isArchived
                    ? "archived"
                    : isPublished
                    ? "published"
                    : "draft"
                }`}
              >
                <span className="large-status-dot" />

                <div>
                  <strong>
                    {isArchived
                      ? "Archived"
                      : isPublished
                      ? "Published"
                      : "Draft"}
                  </strong>

                  <small>
                    {isArchived
                      ? "No longer active"
                      : isPublished
                      ? "Visible to the public"
                      : "Not publicly visible"}
                  </small>
                </div>
              </div>

              <div className="sidebar-status-row">

                <span>
                  Featured
                </span>

                <strong>
                  {isFeatured ? (
                    <span className="yes-status">
                      <CheckCircle2 size={14} />
                      Yes
                    </span>
                  ) : (
                    <span className="no-status">
                      <XCircle size={14} />
                      No
                    </span>
                  )}
                </strong>

              </div>

              <div className="sidebar-status-row">

                <span>
                  Registration
                </span>

                <strong>
                  {event.registration
                    ?.required ? (
                    <span className="yes-status">
                      <CheckCircle2 size={14} />
                      Open
                    </span>
                  ) : (
                    <span className="no-status">
                      Not Required
                    </span>
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* REGISTRATION SUMMARY */}

          <section className="sidebar-card">

            <div className="sidebar-card-header">

              <h3>
                Registration
              </h3>

              <Ticket size={17} />

            </div>

            <div className="sidebar-registration">

              <div className="sidebar-registration-number">
                <strong>
                  {registered}
                </strong>

                <span>
                  registered
                </span>
              </div>

              <div className="sidebar-registration-detail">

                <span>Capacity</span>

                <strong>
                  {capacity
                    ? capacity
                    : "Unlimited"}
                </strong>

              </div>

              <div className="sidebar-registration-detail">

                <span>Available</span>

                <strong>
                  {availableSlots !== null
                    ? availableSlots
                    : "Unlimited"}
                </strong>

              </div>

              <div className="sidebar-registration-detail">

                <span>Fee</span>

                <strong>
                  {formatCurrency(
                    event.registration
                      ?.fee
                  )}
                </strong>

              </div>

            </div>

          </section>

          {/* SEO */}

          {event.seo && (
            <section className="sidebar-card">

              <div className="sidebar-card-header">

                <h3>SEO</h3>

                <Search size={16} />

              </div>

              <div className="sidebar-detail-list">

                <div>
                  <span>
                    Meta Title
                  </span>

                  <strong>
                    {event.seo.metaTitle ||
                      "Not set"}
                  </strong>
                </div>

                <div>
                  <span>
                    Meta Description
                  </span>

                  <strong>
                    {event.seo.metaDescription ||
                      "Not set"}
                  </strong>
                </div>

                <div>
                  <span>
                    Index Page
                  </span>

                  <strong>
                    {event.seo.indexPage
                      ? "Yes"
                      : "No"}
                  </strong>
                </div>

              </div>

            </section>
          )}

          {/* SYSTEM INFORMATION */}

          <section className="sidebar-card">

            <div className="sidebar-card-header">

              <h3>
                System Information
              </h3>

              <Database size={16} />

            </div>

            <div className="sidebar-detail-list">

              <div>
                <span>Created</span>

                <strong>
                  {formatDate(
                    event.createdAt
                  )}
                </strong>
              </div>

              <div>
                <span>Updated</span>

                <strong>
                  {formatDate(
                    event.updatedAt
                  )}
                </strong>
              </div>

              <div>
                <span>Event ID</span>

                <strong className="system-id">
                  {event._id || "N/A"}
                </strong>
              </div>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
};

export default ViewEvent;