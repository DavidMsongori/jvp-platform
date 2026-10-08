import {
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";

import "./LeaderCard.css";

const DEFAULT_AVATAR = "/avatar.png";

const FALLBACK_AVATAR =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23eef3f0'/%3E%3Ccircle cx='200' cy='150' r='72' fill='%2394a89f'/%3E%3Cpath d='M88 350c10-72 54-110 112-110s102 38 112 110' fill='%2394a89f'/%3E%3C/svg%3E";

function formatCategory(category) {
  if (!category) {
    return "JVP Leadership";
  }

  return String(category)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
}

function getPhoto(profile) {
  if (!profile?.profilePhoto) {
    return DEFAULT_AVATAR;
  }

  if (
    typeof profile.profilePhoto === "object"
  ) {
    return (
      profile.profilePhoto?.secureUrl ||
      profile.profilePhoto?.url ||
      DEFAULT_AVATAR
    );
  }

  return profile.profilePhoto;
}

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied ===
    "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = FALLBACK_AVATAR;
}

export default function LeaderCard({ leader }) {
  if (!leader) {
    return null;
  }

  const profile = leader.profile || {};

  const fullName =
    profile.fullName ||
    leader.name ||
    "Unknown Leader";

  const position =
    leader.position ||
    leader.office ||
    "JVP Leader";

  const county =
    profile.county ||
    leader.county ||
    leader.countyName ||
    "";

  const category = formatCategory(
    leader.category
  );

  const photo = getPhoto(profile);

  return (
    <article className="leader-card">
      {/* ==================================================
          PHOTO
      ================================================== */}

      <div className="leader-card__media">
        <img
          src={photo}
          alt={fullName}
          className="leader-card__image"
          loading="lazy"
          onError={handleImageError}
        />

        <span className="leader-card__category">
          {category}
        </span>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="leader-card__content">
        <h3 className="leader-card__name">
          {fullName}
        </h3>

        <div className="leader-card__position">
          <span className="leader-card__icon">
            <BriefcaseBusiness
              size={13}
              strokeWidth={1.8}
            />
          </span>

          <span>{position}</span>
        </div>

        {county && (
          <div className="leader-card__location">
            <MapPin
              size={12}
              strokeWidth={1.8}
            />

            <span>{county}</span>
          </div>
        )}
      </div>
    </article>
  );
}