
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Landmark,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useLeaders } from "../../context/LeaderContext";

import "./Hero.css";

const DEFAULT_AVATAR = "/avatar.png";

/* ==========================================================
   LEADER HELPERS
   Kept consistent with the public Leadership page.
========================================================== */

function normalizeOffice(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPresident(leader) {
  const positions = [
    leader?.position,
    leader?.office,
    leader?.profile?.position,
    leader?.profile?.office,
  ];

  return positions.some((value) => {
    const office = normalizeOffice(value);

    return (
      /\bpresident\b/.test(office) &&
      !/\bdeputy\b/.test(office) &&
      !/\bvice president\b/.test(office)
    );
  });
}

function getPhoto(leader) {
  const profile = leader?.profile || {};

  const candidates = [
    profile.profilePhoto,
    profile.profilePhotoUrl,
    profile.photo,
    profile.image,
    profile.avatar,
    profile.profileImage,
    profile.photoUrl,
    profile.imageUrl,

    leader?.profilePhoto,
    leader?.profilePhotoUrl,
    leader?.photo,
    leader?.image,
    leader?.avatar,
    leader?.profileImage,
    leader?.photoUrl,
    leader?.imageUrl,
  ];

  for (const candidate of candidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate.trim();
    }

    if (
      candidate &&
      typeof candidate === "object"
    ) {
      const url =
        candidate.secureUrl ||
        candidate.secure_url ||
        candidate.url ||
        candidate.imageUrl;

      if (
        typeof url === "string" &&
        url.trim()
      ) {
        return url.trim();
      }
    }
  }

  return DEFAULT_AVATAR;
}

function getLeaderName(leader) {
  const profile = leader?.profile || {};

  return (
    profile.fullName ||
    profile.name ||
    leader?.fullName ||
    leader?.name ||
    "Regional President"
  );
}

function getLeaderPosition(leader) {
  return (
    leader?.position ||
    leader?.office ||
    leader?.profile?.position ||
    leader?.profile?.office ||
    "Regional President"
  );
}

function getLeaderCounty(leader) {
  const profile = leader?.profile || {};

  const county =
    profile.county ||
    leader?.county ||
    leader?.countyName ||
    leader?.geography?.county ||
    leader?.location?.county;

  return typeof county === "string"
    ? county.trim()
    : "";
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
   PRESIDENT HERO
========================================================== */

export default function PresidentHero() {
  const {
    leaders = [],
    executive = [],
    loading,
    error,
  } = useLeaders();

  // Use the same selection logic as the public President Page.
  const president =
    executive.find(isPresident) ||
    leaders.find(isPresident) ||
    null;

  const fullName = getLeaderName(president);
  const position = getLeaderPosition(president);
  const county = getLeaderCounty(president);
  const photo = getPhoto(president);

  return (
    <section className="president-hero">
      <div className="president-container">
        <Link
          to="/leadership"
          className="president-back-link"
        >
          <ArrowLeft size={16} />
          Back to Leadership
        </Link>

        <div className="president-hero__grid">
          <div className="president-hero__content">
            <span className="president-eyebrow">
              <Landmark size={15} />
              JVP Regional Executive
            </span>

            <h1>
              Office of the
              <span> President</span>
            </h1>

            <div className="president-title-rule" />

            <p className="president-hero__lead">
              Providing strategic direction, uniting
              regional leadership and championing an
              empowered coastal youth community.
            </p>

            <p className="president-hero__text">
              The Office of the President leads the
              Regional Executive of Jumuiya ya Vijana wa
              Pwani (JVP), providing overall direction
              and coordinating the delivery of the
              organisation's regional mandate across the
              six Coastal Counties.
            </p>

            <div className="president-hero__actions">
              <a
                href="#presidential-mandate"
                className="president-primary-link"
              >
                Explore the Office
                <ArrowRight size={16} />
              </a>

              <Link
                to="/leadership"
                className="president-secondary-link"
              >
                Meet Our Leadership
              </Link>
            </div>
          </div>

          <div className="president-portrait">
            <div className="president-portrait__frame">
              <img
                src={photo}
                alt={`Portrait of ${fullName}`}
                onError={handleImageError}
                loading="eager"
                decoding="async"
              />
            </div>

            <div className="president-portrait__caption">
              <span className="president-portrait__label">
                {loading && !president
                  ? "Loading leadership..."
                  : position}
              </span>

              <h2>
                {loading && !president
                  ? "Loading..."
                  : fullName}
              </h2>

              <p>
                {county
                  ? `${county} · Jumuiya ya Vijana wa Pwani`
                  : "Jumuiya ya Vijana wa Pwani"}
              </p>

              {!loading && !president && (
                <p role="status">
                  The President's profile is not
                  currently available.
                </p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p
            className="president-data-message"
            role="status"
          >
            Leadership information could not be fully
            loaded. Displaying available information.
          </p>
        )}

        <div className="president-hero__footer">
          <span>
            <Building2 size={15} />
            Regional Executive Office
          </span>

          <span>
            Leadership · Coordination · Service
          </span>
        </div>
      </div>
    </section>
  );
}
