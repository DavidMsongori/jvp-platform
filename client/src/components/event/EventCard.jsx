import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Monitor,
  Star,
  Users,
} from "lucide-react";

import "./EventCard.css";

const formatDate = (date) => {
  if (!date) return "Date TBA";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date TBA";
  }

  return parsedDate.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (date) => {
  if (!date) return "Time TBA";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Time TBA";
  }

  return parsedDate.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (
  amount = 0,
  currency = "KES"
) => {
  if (!amount || Number(amount) <= 0) {
    return "Free";
  }

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Number(amount).toLocaleString(
      "en-KE"
    )}`;
  }
};

const formatLabel = (value) => {
  if (!value) return "";

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const EventCard = ({ event }) => {
  if (!event) return null;

  const image =
    event.coverImage?.secureUrl ||
    event.coverImage?.url ||
    event.image?.secureUrl ||
    event.image?.url ||
    "/images/event-placeholder.jpg";

  const title =
    event.title || "JVP Event";

  const summary =
    event.summary ||
    event.shortDescription ||
    event.description ||
    "Discover this JVP event and take part in an opportunity to connect, learn and make an impact.";

  const category =
    formatLabel(event.category) ||
    "Event";

  const eventType =
    formatLabel(event.eventType) ||
    "Format TBA";

  const venueName =
    event.venue?.name ||
    event.location?.name ||
    event.venue ||
    event.location ||
    "Location TBA";

  const availableSeats =
    event.availableSlots ??
    (
      event.registration?.capacity > 0
        ? Math.max(
            0,
            event.registration.capacity -
              (event.registeredParticipants || 0)
          )
        : null
    );

  const registrationOpen =
    event.isRegistrationOpen ??
    event.registration?.enabled ??
    false;

  const eventUrl = event.slug
    ? `/events/${event.slug}`
    : event._id
      ? `/events/${event._id}`
      : "/events";

  return (
    <article className="event-card">
      {/* IMAGE */}
      <div className="event-card__image">
        <img
          src={image}
          alt={
            event.coverImage?.alt ||
            title
          }
          loading="lazy"
        />

        <div className="event-card__image-overlay" />

        <div className="event-card__badges">
          {event.featured && (
            <span className="event-card__featured">
              <Star size={11} />
              Featured
            </span>
          )}

          <span className="event-card__category">
            {category}
          </span>
        </div>

        {event.startDate && (
          <div className="event-card__date">
            <span>
              {new Date(event.startDate)
                .toLocaleDateString("en-KE", {
                  month: "short",
                })
                .toUpperCase()}
            </span>

            <strong>
              {new Date(event.startDate).getDate()}
            </strong>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="event-card__body">
        <div className="event-card__heading">
          <h3 className="event-card__title">
            {title}
          </h3>

          <p className="event-card__summary">
            {summary}
          </p>
        </div>

        {/* META */}
        <div className="event-card__meta">
          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">
              <CalendarDays size={13} />
            </span>

            <div>
              <span className="event-card__meta-label">
                Date
              </span>

              <strong>
                {formatDate(event.startDate)}
              </strong>
            </div>
          </div>

          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">
              <Clock3 size={13} />
            </span>

            <div>
              <span className="event-card__meta-label">
                Time
              </span>

              <strong>
                {formatTime(event.startDate)}
              </strong>
            </div>
          </div>

          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">
              <MapPin size={13} />
            </span>

            <div>
              <span className="event-card__meta-label">
                Location
              </span>

              <strong title={venueName}>
                {venueName}
              </strong>
            </div>
          </div>

          <div className="event-card__meta-item">
            <span className="event-card__meta-icon">
              <Monitor size={13} />
            </span>

            <div>
              <span className="event-card__meta-label">
                Format
              </span>

              <strong>
                {eventType}
              </strong>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="event-card__footer">
          <div className="event-card__registration">
            <span className="event-card__price-label">
              Registration
            </span>

            <strong className="event-card__price">
              {formatCurrency(
                event.registration
                  ?.registrationFee,
                event.registration
                  ?.currency
              )}
            </strong>

            {availableSeats !== null && (
              <span className="event-card__capacity">
                <Users size={12} />

                {availableSeats > 0
                  ? `${availableSeats} seats left`
                  : "Fully booked"}
              </span>
            )}
          </div>

          <span
            className={`event-card__status ${
              registrationOpen
                ? "is-open"
                : "is-closed"
            }`}
          >
            <span className="event-card__status-dot" />

            {registrationOpen
              ? "Open"
              : "Closed"}
          </span>
        </div>

        {/* ACTION */}
        <Link
          to={eventUrl}
          className="event-card__button"
        >
          <span>View Details</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </article>
  );
};

export default EventCard;