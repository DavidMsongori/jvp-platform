import React from "react";

import {
  Crown,
  MapPin,
  UserRound,
} from "lucide-react";

import "./CouncilGovernors.css";

/* ============================================================
   HELPERS
============================================================ */

const getMemberName = (leader) => {
  const member = leader?.member;

  if (!member) return "Council Member";

  return [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");
};

const getLeaderName = (leader) => {
  if (leader?.patron?.fullName) {
    return leader.patron.fullName;
  }

  return getMemberName(leader);
};

const getLeaderPhoto = (leader) => {
  return (
    leader?.member?.profilePhoto ||
    leader?.member?.photo ||
    leader?.photo ||
    null
  );
};

const getCounty = (leader) => {
  return (
    leader?.county ||
    leader?.member?.county ||
    "Coast Region"
  );
};

const getPositionLabel = (position) => {
  const labels = {
    governor: "Governor",
    deputy_governor: "Deputy Governor",
  };

  return (
    labels[position] ||
    position
      ?.replaceAll("_", " ")
      ?.replace(/\b\w/g, (char) =>
        char.toUpperCase()
      ) ||
    "Council Member"
  );
};

/* ============================================================
   COMPONENT
============================================================ */

export default function CouncilGovernors({
  leaders = [],
}) {
  if (!leaders.length) {
    return null;
  }

  return (
    <section
      className="council-governors-section"
      aria-labelledby="council-governors-title"
    >
      <div className="council-governors-container">

        {/* ==================================================
            SECTION HEADER
        ================================================== */}

        <div className="council-governors-header">

          <div className="council-governors-heading">

            <span className="council-governors-eyebrow">
              Regional Governance
            </span>

            <h2
              id="council-governors-title"
            >
              Council of Governors
            </h2>

            <p>
              The Council of Governors provides
              county-level leadership and
              coordination across the Coast Region.
            </p>

          </div>

          <div className="council-governors-icon">
            <Crown size={28} />
          </div>

        </div>

        {/* ==================================================
            GOVERNORS GRID
        ================================================== */}

        <div className="council-governors-grid">

          {leaders.map((leader) => {

            const name =
              getLeaderName(leader);

            const photo =
              getLeaderPhoto(leader);

            const county =
              getCounty(leader);

            const position =
              getPositionLabel(
                leader.position
              );

            return (

              <article
                key={leader._id}
                className="council-governor-card"
              >

                {/* PHOTO */}

                <div className="council-governor-photo">

                  {photo ? (

                    <img
                      src={photo}
                      alt={name}
                      loading="lazy"
                    />

                  ) : (

                    <div className="council-governor-placeholder">
                      <UserRound
                        size={48}
                      />
                    </div>

                  )}

                  <span className="council-governor-badge">
                    {position}
                  </span>

                </div>

                {/* CONTENT */}

                <div className="council-governor-content">

                  <h3>
                    {name}
                  </h3>

                  <div className="council-governor-county">

                    <MapPin
                      size={16}
                    />

                    <span>
                      {county}
                    </span>

                  </div>

                  {leader.remarks && (

                    <p className="council-governor-remarks">
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