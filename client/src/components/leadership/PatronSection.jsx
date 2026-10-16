
import {
  Award,
  Building2,
} from "lucide-react";

import "./PatronSection.css";

const DEFAULT_AVATAR = "/avatar.png";

/* ==========================================================
   HELPERS
========================================================== */

function firstText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getPhotoUrl(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object") {
    return firstText(
      value.secureUrl,
      value.secure_url,
      value.url,
      value.imageUrl,
      value.image_url,
      value.src,
      value.path
    );
  }

  return "";
}

function getPhoto(leader, profile, patron) {
  const candidates = [
    // Patron details stored directly on the leader record.
    patron?.photo,
    patron?.profilePhoto,
    patron?.profilePhotoUrl,
    patron?.profileImage,
    patron?.image,
    patron?.avatar,

    // Patron details nested inside profile.
    profile?.patron?.photo,
    profile?.patron?.profilePhoto,
    profile?.patron?.image,
    profile?.patron?.avatar,

    // General profile image fields.
    profile?.profilePhoto,
    profile?.profilePhotoUrl,
    profile?.profileImage,
    profile?.profileImageUrl,
    profile?.photo,
    profile?.photoUrl,
    profile?.image,
    profile?.imageUrl,
    profile?.avatar,

    // Root-level image fields.
    leader?.profilePhoto,
    leader?.profilePhotoUrl,
    leader?.profileImage,
    leader?.profileImageUrl,
    leader?.photo,
    leader?.photoUrl,
    leader?.image,
    leader?.imageUrl,
    leader?.avatar,
  ];

  for (const candidate of candidates) {
    const url = getPhotoUrl(candidate);

    if (url) return url;
  }

  return DEFAULT_AVATAR;
}

function handleImageError(event) {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied === "true") {
    return;
  }

  image.dataset.fallbackApplied = "true";
  image.src = DEFAULT_AVATAR;
}

/* ==========================================================
   PATRON SECTION
========================================================== */

export default function PatronSection({ leader }) {
  if (!leader) return null;

  const profile = leader.profile || {};
  const patron = leader.patron || {};

  const fullName =
    firstText(
      patron.fullName,
      profile.fullName,
      leader.name,
      leader.fullName
    ) || "Patron";

  const title =
    firstText(
      patron.title,
      profile.title,
      leader.position,
      leader.office
    ) || "Patron";

  const organization =
    firstText(
      patron.organization,
      profile.organization,
      leader.organization
    );

  const bio =
    firstText(
      patron.bio,
      profile.bio,
      leader.bio
    ) ||
    "The Patron provides strategic leadership, mentorship and guidance to the organization while championing youth development, partnerships and regional transformation.";

  const photo = getPhoto(leader, profile, patron);

  return (
    <section
      className="patron-section"
      aria-labelledby="patron-section-title"
    >
      <div className="patron-section__container">
        <header className="patron-section__header">
          <div className="patron-section__heading">
            <span className="patron-section__eyebrow">
              <Award size={12} />
              Leadership
            </span>

            <h2
              id="patron-section-title"
              className="patron-section__title"
            >
              Our Patron
            </h2>

            <div
              className="patron-section__accent"
              aria-hidden="true"
            />

            <p className="patron-section__description">
              The Patron serves as the chief mentor of
              Jumuiya ya Vijana wa Pwani, providing
              strategic guidance, inspiration and
              institutional support.
            </p>
          </div>
        </header>

        <article className="patron-card">
          <div className="patron-card__media">
            <img
              src={photo}
              alt={fullName}
              className="patron-card__image"
              loading="lazy"
              onError={handleImageError}
            />

            <span className="patron-card__badge">
              <Award size={11} />
              Patron
            </span>
          </div>

          <div className="patron-card__content">
            <span className="patron-card__role">
              {title}
            </span>

            <h3 className="patron-card__name">
              {fullName}
            </h3>

            {organization && (
              <div className="patron-card__organization">
                <Building2
                  size={13}
                  strokeWidth={1.8}
                />

                <span>{organization}</span>
              </div>
            )}

            <p className="patron-card__bio">
              {bio}
            </p>
          </div>
        </article>
      </div>
    </section>
  );
}
