
import {
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";

import "./CountyLeaderCard.css";

const DEFAULT_AVATAR = "/avatar.png";

/**
 * Returns the first non-empty string.
 */
function firstValue(...values) {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

/**
 * Resolves a photo URL from either a string
 * or an image object.
 */
function resolvePhoto(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "object") {
    return firstValue(
      value.secureUrl,
      value.secure_url,
      value.url,
      value.src,
      value.path
    );
  }

  return "";
}

/**
 * Supports the different photo structures used
 * by the leadership API and frontend service.
 */
function getPhoto(leader) {
  const profile = leader?.profile || {};
  const member = leader?.member || {};
  const user = leader?.user || {};

  const candidates = [
    leader?.profilePicture,
    leader?.profileImage,
    leader?.profilePhoto,
    leader?.avatar,
    leader?.photo,
    leader?.image,
    leader?.picture,

    member?.profilePicture,
    member?.profileImage,
    member?.profilePhoto,
    member?.avatar,
    member?.photo,
    member?.image,

    user?.profilePicture,
    user?.profileImage,
    user?.profilePhoto,
    user?.avatar,
    user?.photo,
    user?.image,

    profile?.profilePicture,
    profile?.profileImage,
    profile?.profilePhoto,
    profile?.avatar,
    profile?.photo,
    profile?.image,
    profile?.picture,
  ];

  for (const candidate of candidates) {
    const photoUrl = resolvePhoto(candidate);

    if (photoUrl) {
      return photoUrl;
    }
  }

  return DEFAULT_AVATAR;
}

/**
 * Resolves a leader's name from available fields.
 */
function getFullName(leader) {
  const profile = leader?.profile || {};
  const member = leader?.member || {};
  const user = leader?.user || {};

  const directName = firstValue(
    leader?.name,
    leader?.fullName,
    leader?.displayName,
    leader?.memberName,
    leader?.leaderName,
    profile?.fullName,
    profile?.name,
    member?.fullName,
    member?.name,
    user?.fullName,
    user?.name
  );

  if (directName) {
    return directName;
  }

  const person = [
    member,
    profile,
    user,
    leader,
  ].find(
    (item) =>
      firstValue(
        item?.firstName,
        item?.middleName,
        item?.lastName
      )
  );

  if (person) {
    const composedName = [
      person.firstName,
      person.middleName,
      person.lastName,
    ]
      .filter(
        (part) =>
          typeof part === "string" &&
          part.trim()
      )
      .join(" ");

    if (composedName) {
      return composedName;
    }
  }

  return "JVP Leader";
}

/**
 * Resolves the county name.
 */
function getCounty(leader) {
  return firstValue(
    leader?.county,
    leader?.countyName,
    leader?.member?.county,
    leader?.profile?.county,
    leader?.user?.county
  );
}

/**
 * Falls back to the default avatar if an image
 * cannot be loaded.
 */
function handleImageError(event) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = DEFAULT_AVATAR;
}

export default function CountyLeaderCard({
  leader,
}) {
  if (!leader) {
    return null;
  }

  const fullName = getFullName(leader);

  const position = firstValue(
    leader.position,
    leader.office,
    leader.title,
    leader.designation,
    leader.role,
    leader.profile?.position,
    leader.member?.position
  ) || "JVP Leader";

  const county = getCounty(leader);
  const photo = getPhoto(leader);

  return (
    <article className="county-leader-card">
      <div className="county-leader-card__media">
        <img
          src={photo}
          alt={`${fullName} - ${position}`}
          loading="lazy"
          decoding="async"
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
            aria-hidden="true"
          />

          <span>{position}</span>
        </div>

        {county && (
          <div className="county-leader-card__location">
            <MapPin
              size={9}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>{county}</span>
          </div>
        )}
      </div>
    </article>
  );
}