import "./LeaderCard.css";

import {
  MapPin,
  Briefcase,
} from "lucide-react";

const DEFAULT_AVATAR = "/avatar.png";

export default function LeaderCard({ leader }) {
  if (!leader) return null;

  /* ==========================================================
     PROFILE
  ========================================================== */

  const profile = leader.profile || {};

  const photo =
    typeof profile.profilePhoto === "object"
      ? profile.profilePhoto?.url
      : profile.profilePhoto;

  const fullName =
    profile.fullName || "Unknown Leader";

  const county =
    profile.county ||
    leader.county ||
    "";

  const position =
    leader.position || "";

  const category =
    leader.category
      ?.replaceAll("_", " ")
      .replace(
        /\b\w/g,
        (char) => char.toUpperCase()
      );

  /* ==========================================================
     UI
  ========================================================== */

  return (
    <article className="leader-card">

      {/* ======================================
          PHOTO
      ======================================= */}

      <div className="leader-photo">

        <img
  src={photo || DEFAULT_AVATAR}
  alt={fullName || "Leader"}
  loading="lazy"
  onError={(event) => {
    event.currentTarget.onerror = null;

    event.currentTarget.src =
      "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='80' fill='%23eef2f7'/%3E%3Ccircle cx='80' cy='61' r='28' fill='%2394a3b8'/%3E%3Cpath d='M34 139c4-28 22-43 46-43s42 15 46 43' fill='%2394a3b8'/%3E%3C/svg%3E";
  }}
/>

      </div>

      {/* ======================================
          CONTENT
      ======================================= */}

      <div className="leader-content">

        <span className="leader-category">

          {category}

        </span>

        <h3>

          {fullName}

        </h3>

        <div className="leader-position">

          <Briefcase size={16} />

          <span>

            {position}

          </span>

        </div>

        {county && (

          <div className="leader-location">

            <MapPin size={16} />

            <span>

              {county}

            </span>

          </div>

        )}

      </div>

    </article>
  );
}