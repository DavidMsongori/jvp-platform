import {
  Crown,
  MapPin,
  UserRound,
} from "lucide-react";

import "./CouncilGovernors.css";

/* ==========================================================
   HELPERS
========================================================== */

function getMemberName(leader) {
  const member = leader?.member;

  if (!member) {
    return "Council Member";
  }

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function getLeaderName(leader) {
  return (
    leader?.patron?.fullName ||
    leader?.fullName ||
    getMemberName(leader)
  );
}

function getLeaderPhoto(leader) {
  const photo =
    leader?.member?.profilePhoto ||
    leader?.member?.photo ||
    leader?.photo ||
    leader?.profilePhoto;

  if (typeof photo === "object") {
    return (
      photo?.secureUrl ||
      photo?.url ||
      null
    );
  }

  return photo || null;
}

function getCounty(leader) {
  return (
    leader?.county ||
    leader?.countyName ||
    leader?.member?.county ||
    "Coast Region"
  );
}

function formatPosition(position) {
  if (!position) {
    return "Council Member";
  }

  const labels = {
    governor: "Governor",
    deputy_governor: "Deputy Governor",
  };

  if (labels[position]) {
    return labels[position];
  }

  return String(position)
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (char) => char.toUpperCase()
    );
}

function handleImageError(event) {
  if (
    event.currentTarget.dataset.fallbackApplied ===
    "true"
  ) {
    return;
  }

  event.currentTarget.dataset.fallbackApplied = "true";
  event.currentTarget.style.display = "none";
  event.currentTarget.parentElement
    ?.querySelector(
      ".council-governors-card__placeholder"
    )
    ?.classList.add(
      "council-governors-card__placeholder--visible"
    );
}

/* ==========================================================
   COMPONENT
========================================================== */

export default function CouncilGovernors({
  leaders = [],
}) {
  if (!leaders.length) {
    return null;
  }

  return (
    <section
      className="council-governors"
      aria-labelledby="council-governors-title"
    >
      <div className="council-governors__container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <header className="council-governors__header">
          <div className="council-governors__heading">

            <span className="council-governors__eyebrow">
              <Crown size={12} />
              Regional Governance
            </span>

            <h2
              id="council-governors-title"
              className="council-governors__title"
            >
              Council of Governors
            </h2>

            <p className="council-governors__description">
              The Council of Governors provides
              county-level leadership and coordination
              across the Coast Region, strengthening
              collaboration, representation and shared
              youth development priorities.
            </p>

          </div>

          <div
            className="council-governors__count"
            aria-label={`${leaders.length} council members`}
          >
            <Crown size={14} />

            <strong>
              {leaders.length}
            </strong>

            <span>
              {leaders.length === 1
                ? "Member"
                : "Members"}
            </span>
          </div>
        </header>

        {/* ==================================================
            GOVERNORS GRID
        ================================================== */}

        <div className="council-governors__grid">
          {leaders.map((leader, index) => {
            const name =
              getLeaderName(leader);

            const photo =
              getLeaderPhoto(leader);

            const county =
              getCounty(leader);

            const position =
              formatPosition(
                leader?.position
              );

            return (
              <article
                key={
                  leader?._id ||
                  leader?.id ||
                  index
                }
                className="council-governors-card"
              >
                {/* ==========================================
                    PHOTO
                ========================================== */}

                <div className="council-governors-card__media">

                  {photo && (
                    <img
                      src={photo}
                      alt={name}
                      loading="lazy"
                      onError={
                        handleImageError
                      }
                    />
                  )}

                  <div
                    className={`council-governors-card__placeholder ${
                      photo
                        ? ""
                        : "council-governors-card__placeholder--visible"
                    }`}
                  >
                    <UserRound
                      size={38}
                      strokeWidth={1.5}
                    />
                  </div>

                  <span className="council-governors-card__badge">
                    {position}
                  </span>

                </div>

                {/* ==========================================
                    CONTENT
                ========================================== */}

                <div className="council-governors-card__content">

                  <h3 className="council-governors-card__name">
                    {name}
                  </h3>

                  <div className="council-governors-card__county">
                    <MapPin
                      size={12}
                      strokeWidth={1.8}
                    />

                    <span>
                      {county}
                    </span>
                  </div>

                  {leader?.remarks && (
                    <p className="council-governors-card__remarks">
                      {leader.remarks}
                    </p>
                  )}

                </div>
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
}