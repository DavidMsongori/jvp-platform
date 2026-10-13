
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  CalendarDays,
  HeartHandshake,
  MapPin,
  Users,
} from "lucide-react";

import "./ProgramCard.css";

/* =========================================================
   HELPERS
========================================================= */

const getProgramId = (program) =>
  program?._id || program?.id || "";

const getProgramTitle = (program) =>
  program?.title ||
  program?.name ||
  program?.programName ||
  "Untitled Programme";

const getProgramDescription = (program) =>
  program?.shortDescription ||
  program?.summary ||
  program?.description ||
  "Discover how this JVP initiative is creating opportunities and making a difference in coastal communities.";

const getProgramCategory = (program) =>
  typeof program?.category === "string"
    ? program.category
    : program?.category?.name || "Youth Empowerment";

const getProgramLocation = (program) => {
  if (typeof program?.location === "string") {
    return program.location;
  }

  if (program?.location && typeof program.location === "object") {
    return (
      program.location.name ||
      program.location.venue ||
      program.location.address ||
      ""
    );
  }

  return program?.venue || program?.county || "";
};

const getProgramImage = (program) => {
  const image =
    program?.coverImage ||
    program?.image ||
    program?.coverImageUrl ||
    program?.imageUrl ||
    program?.featuredImage;

  if (typeof image === "string") return image;

  if (image && typeof image === "object") {
    return (
      image.url ||
      image.secure_url ||
      image.secureUrl ||
      image.path ||
      image.src ||
      image.imageUrl ||
      ""
    );
  }

  return "";
};

const getProgramHref = (program) => {
  const slug = program?.slug;
  const id = getProgramId(program);

  if (slug) return `/program/${slug}`;
  if (id) return `/program/${id}`;

  return "/programs";
};

const formatDate = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getProgramDateLabel = (program) => {
  const startDate =
    program?.startDate ||
    program?.eventDate ||
    program?.date;

  const endDate = program?.endDate;

  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (!start) return "";

  if (end && start !== end) {
    return `${start} – ${end}`;
  }

  return start;
};

const getProgramStatus = (program) => {
  const rawStatus = String(program?.status || "")
    .trim()
    .toLowerCase();

  if (
    rawStatus.includes("cancel") ||
    rawStatus === "cancelled"
  ) {
    return "Cancelled";
  }

  if (
    rawStatus.includes("complete") ||
    rawStatus === "completed"
  ) {
    return "Completed";
  }

  if (
    rawStatus === "ongoing" ||
    rawStatus === "in progress"
  ) {
    return "Ongoing";
  }

  const startDate =
    program?.startDate ||
    program?.eventDate ||
    program?.date;

  const endDate = program?.endDate;

  const now = new Date();
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : start;

  if (
    start &&
    !Number.isNaN(start.getTime()) &&
    start > now
  ) {
    return "Upcoming";
  }

  if (
    end &&
    !Number.isNaN(end.getTime()) &&
    end < now
  ) {
    return "Completed";
  }

  if (start || end) return "Ongoing";

  return rawStatus
    ? rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1)
    : "Planned";
};

const formatNumber = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) return "0";

  return new Intl.NumberFormat("en-KE").format(number);
};

/* =========================================================
   PROGRAM CARD
========================================================= */

function ProgramCard({ program, featured = false }) {
  const [imageFailed, setImageFailed] = useState(false);

  if (!program) return null;

  const title = getProgramTitle(program);
  const description = getProgramDescription(program);
  const category = getProgramCategory(program);
  const location = getProgramLocation(program);
  const image = getProgramImage(program);
  const href = getProgramHref(program);
  const status = getProgramStatus(program);
  const dateLabel = getProgramDateLabel(program);

  const isActivity =
    String(program?.recordType || "").toLowerCase() ===
      "activity" ||
    Boolean(program?.parentProgram);

  const youthsAttended = program?.youthsAttended ?? 0;
  const youthsBenefited = program?.youthsBenefited ?? 0;

  const statusClass = status
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return (
    <article
      className={`program-card ${
        featured ? "program-card--featured" : ""
      }`}
    >
      {/* IMAGE */}
      <Link
        to={href}
        className="program-card__image-link"
        aria-label={`View ${title}`}
        tabIndex={-1}
      >
        <div className="program-card__image-wrapper">
          {image && !imageFailed ? (
            <img
              className="program-card__image"
              src={image}
              alt={title}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              className="program-card__image-placeholder"
              aria-hidden="true"
            >
              <span className="program-card__placeholder-mark">
                JVP
              </span>
              <span className="program-card__placeholder-text">
                {isActivity ? "Youth in Action" : "Creating Impact"}
              </span>
            </div>
          )}

          <div className="program-card__image-overlay" />

          <div className="program-card__image-badges">
            <span className="program-card__category">
              {category}
            </span>

            {featured && (
              <span className="program-card__featured-badge">
                Featured
              </span>
            )}
          </div>

          <span
            className={`program-card__status program-card__status--${statusClass}`}
          >
            <span className="program-card__status-dot" />
            {status}
          </span>
        </div>
      </Link>

      {/* CONTENT */}
      <div className="program-card__body">
        <div className="program-card__type-row">
          <span className="program-card__type">
            {isActivity ? "ACTIVITY" : "JVP PROGRAMME"}
          </span>

          {program?.county && (
            <span className="program-card__county">
              {program.county}
            </span>
          )}
        </div>

        <h3 className="program-card__title">
          <Link to={href}>{title}</Link>
        </h3>

        <p className="program-card__description">
          {description}
        </p>

        {/* DETAILS */}
        {(location || dateLabel) && (
          <div className="program-card__details">
            {location && (
              <div className="program-card__detail">
                <MapPin
                  size={16}
                  aria-hidden="true"
                />
                <span title={location}>{location}</span>
              </div>
            )}

            {dateLabel && (
              <div className="program-card__detail">
                <CalendarDays
                  size={16}
                  aria-hidden="true"
                />
                <span>{dateLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* IMPACT */}
        <div className="program-card__impact">
          <div className="program-card__impact-item">
            <span className="program-card__impact-icon program-card__impact-icon--attended">
              <Users size={17} aria-hidden="true" />
            </span>

            <span className="program-card__impact-copy">
              <strong>
                {formatNumber(youthsAttended)}
              </strong>
              <span>Attended</span>
            </span>
          </div>

          <div className="program-card__impact-divider" />

          <div className="program-card__impact-item">
            <span className="program-card__impact-icon program-card__impact-icon--benefited">
              <HeartHandshake size={17} aria-hidden="true" />
            </span>

            <span className="program-card__impact-copy">
              <strong>
                {formatNumber(youthsBenefited)}
              </strong>
              <span>Benefited</span>
            </span>
          </div>
        </div>

        {/* ACTION */}
        <div className="program-card__footer">
          <Link
            to={href}
            className="program-card__link"
            aria-label={`Explore ${title}`}
          >
            Explore {isActivity ? "activity" : "programme"}
            <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ProgramCard;