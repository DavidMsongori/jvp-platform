import { useState } from "react";

import CardFront from "./CardFront";
import CardBack from "./CardBack";

import "../styles/membership-card.css";

const MembershipCard = ({
  member,
  profile,
  fullName,
  memberNumber,
  membershipStatus,
  joinedDate,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    console.log("Flip:", !isFlipped);

    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="membership-card-wrapper">

      <div
        className={`membership-card ${
          isFlipped ? "flipped" : ""
        }`}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label="Flip membership card"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
      >

        {/* ================= FRONT ================= */}

        <div className="membership-card-face membership-card-front">

          <CardFront
            member={member}
            profile={profile}
            fullName={fullName}
            memberNumber={memberNumber}
            membershipStatus={membershipStatus}
            joinedDate={joinedDate}
          />

        </div>

        {/* ================= BACK ================= */}

        <div className="membership-card-face membership-card-back">

          <CardBack
            member={member}
            profile={profile}
            fullName={fullName}
            memberNumber={memberNumber}
            membershipStatus={membershipStatus}
            joinedDate={joinedDate}
          />

        </div>

      </div>

    </div>
  );
};

export default MembershipCard;