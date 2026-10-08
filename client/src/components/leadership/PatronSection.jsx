import {
  Award,
  Building2,
} from "lucide-react";

import "./PatronSection.css";

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

export default function PatronSection({ leader }) {
  if (!leader) {
    return null;
  }

  const profile = leader.profile || {};

  const fullName =
    profile.fullName ||
    leader.name ||
    "Patron";

  const title =
    profile.title ||
    leader.position ||
    leader.office ||
    "Patron";

  const organization =
    profile.organization ||
    leader.organization ||
    "";

  const bio =
    profile.bio ||
    leader.bio ||
    "The Patron provides strategic leadership, mentorship and guidance to the organization while championing youth development, partnerships and regional transformation.";

  const photo = getPhoto(profile);

  return (
    <section
      className="patron-section"
      aria-labelledby="patron-section-title"
    >
      <div className="patron-section__container">
        {/* Section Header */}
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

        {/* Patron Profile */}
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