import {
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";

import "./CountyLeaderCard.css";

const DEFAULT_AVATAR = "/avatar.png";

function getPhoto(profile) {
  const photo = profile?.profilePhoto;

  if (!photo) {
    return DEFAULT_AVATAR;
  }

  if (typeof photo === "object") {
    return (
      photo?.secureUrl ||
      photo?.url ||
      DEFAULT_AVATAR
    );
  }

  return photo;
}

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied ===
    "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.src = DEFAULT_AVATAR;
}

export default function CountyLeaderCard({
  leader,
}) {
  if (!leader) {
    return null;
  }

  const profile = leader.profile || {};

  const fullName =
    profile.fullName ||
    leader.name ||
    "JVP Leader";

  const position =
    leader.position ||
    leader.office ||
    "JVP Leader";

  const county =
    profile.county ||
    leader.county ||
    leader.countyName ||
    "";

  const photo = getPhoto(profile);

  return (
    <article className="county-leader-card">
      <div className="county-leader-card__media">
        <img
          src={photo}
          alt={fullName}
          loading="lazy"
          onError={handleImageError}
        />
      </div>

      <div className="county-leader-card__content">
        <h5 className="county-leader-card__name">
          {fullName}
        </h5>

        <div className="county-leader-card__position">
          <BriefcaseBusiness
            size={10}
            strokeWidth={1.8}
          />

          <span>{position}</span>
        </div>

        {county && (
          <div className="county-leader-card__location">
            <MapPin
              size={9}
              strokeWidth={1.8}
            />

            <span>{county}</span>
          </div>
        )}
      </div>
    </article>
  );
}