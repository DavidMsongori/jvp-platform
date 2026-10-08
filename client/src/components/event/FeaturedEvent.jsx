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

import "./FeaturedEvent.css";

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
    return `${currency} ${Number(amount).toLocaleString("en-KE")}`;
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

const FeaturedEvent = ({ event }) => {
  if (!event) {
    return null;
  }

  const image =
    event.coverImage?.secureUrl ||
    event.coverImage?.url ||
    event.image?.secureUrl ||
    event.image?.url ||
    "/images/event-placeholder.jpg";

  const title =
    event.title ||
    "Featured JVP Event";

  const description =
    event.summary ||
    event.shortDescription ||
    event.description ||
    "Discover this JVP event and take part in an opportunity to connect, learn and make an impact.";

  const category = formatLabel(event.category);

  const eventType = formatLabel(event.eventType);

  const venueName =
    event.venue?.name ||
    event.location?.name ||
    event.venue ||
    "Location TBA";

  const county =
    event.venue?.county ||
    event.location?.county ||
    "";

  const location =
    county && venueName !== "Location TBA"
      ? `${venueName} • ${county}`
      : venueName;

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

  const eventUrl =
    event.slug
      ? `/events/${event.slug}`
      : event._id
        ? `/events/${event._id}`
        : "/events";

  return (
    <section className="featured-event">

      {/* =====================================================
          IMAGE
          ===================================================== */}

      <div className="featured-event__media">

        <img
          src={image}
          alt={
            event.coverImage?.alt ||
            event.title ||
            "JVP event"
          }
          loading="lazy"
        />

        <div className="featured-event__media-overlay" />

        <div className="featured-event__badge">
          <Star size={13} />
          <span>Featured Event</span>
        </div>

        <div className="featured-event__date-card">
          <span>
            {event.startDate
              ? new Date(event.startDate).toLocaleDateString(
                  "en-KE",
                  { month: "short" }
                ).toUpperCase()
              : "TBA"}
          </span>

          <strong>
            {event.startDate
              ? new Date(event.startDate).getDate()
              : "—"}
          </strong>
        </div>

      </div>


      {/* =====================================================
          CONTENT
          ===================================================== */}

      <div className="featured-event__content">

        <div className="featured-event__top">

          {category && (
            <span className="featured-event__category">
              {category}
            </span>
          )}

          <h2>{title}</h2>

          <p>{description}</p>

        </div>


        {/* ===================================================
            EVENT META
            =================================================== */}

        <div className="featured-event__meta">

          <div className="featured-event__meta-item">

            <div className="featured-event__meta-icon">
              <CalendarDays size={14} />
            </div>

            <div>
              <span>Date</span>
              <strong>
                {formatDate(event.startDate)}
              </strong>
            </div>

          </div>


          <div className="featured-event__meta-item">

            <div className="featured-event__meta-icon">
              <Clock3 size={14} />
            </div>

            <div>
              <span>Time</span>
              <strong>
                {formatTime(event.startDate)}
              </strong>
            </div>

          </div>


          <div className="featured-event__meta-item">

            <div className="featured-event__meta-icon">
              <MapPin size={14} />
            </div>

            <div>
              <span>Location</span>
              <strong>{location}</strong>
            </div>

          </div>


          {eventType && (
            <div className="featured-event__meta-item">

              <div className="featured-event__meta-icon">
                <Monitor size={14} />
              </div>

              <div>
                <span>Format</span>
                <strong>{eventType}</strong>
              </div>

            </div>
          )}

        </div>


        {/* ===================================================
            REGISTRATION
            =================================================== */}

        <div className="featured-event__footer">

          <div className="featured-event__registration">

            <div className="featured-event__price">

              <span>Registration</span>

              <strong>
                {formatCurrency(
                  event.registration?.registrationFee,
                  event.registration?.currency
                )}
              </strong>

            </div>


            {availableSeats !== null && (
              <div className="featured-event__capacity">

                <Users size={14} />

                <span>
                  {availableSeats > 0
                    ? `${availableSeats} seats available`
                    : "Fully booked"}
                </span>

              </div>
            )}

          </div>


          <Link
            to={eventUrl}
            className="featured-event__button"
          >
            <span>View Event</span>
            <ArrowRight size={15} />
          </Link>

        </div>

      </div>

    </section>
  );
};

export default FeaturedEvent;