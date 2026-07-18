import {
  ShieldCheck,
  CalendarDays,
  MapPin,
  CreditCard,
} from "lucide-react";

const CardFront = ({
  profile,
  fullName,
  memberNumber,
  membershipStatus,
  joinedDate,
}) => {
  const photo = profile?.profilePhoto;
  const county = profile?.county || "Coast Region";

  const status =
    membershipStatus
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Active Member";

  const initials = fullName
    ? fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "JV";

  return (
    <div className="card-front">
      {/* ===========================
          BACKGROUND DECORATION
      =========================== */}

      <div className="card-glow" />
      <div className="card-wave card-wave-one" />
      <div className="card-wave card-wave-two" />

      {/* ===========================
          HEADER
      =========================== */}

      <div className="card-header">

        <div className="brand">

          <div className="brand-logo">
            JVP
          </div>

          <div>
            <h4>JVP CONNECT</h4>
            <span>Digital Membership</span>
          </div>

        </div>

        <div className="verification-badge">

          <ShieldCheck size={18} />

          VERIFIED

        </div>

      </div>

      {/* ===========================
          BODY
      =========================== */}

      <div className="card-body">

        <div className="member-photo">

          {photo ? (

            <img
              src={photo}
              alt={fullName}
            />

          ) : (

            <div className="member-initials">

              {initials}

            </div>

          )}

        </div>

        <div className="member-details">

          <h2>{fullName}</h2>

          <div className="member-status">

            {status}

          </div>

          <div className="member-number">

            <CreditCard size={15} />

            <span>{memberNumber}</span>

          </div>

        </div>

      </div>

      {/* ===========================
          FOOTER
      =========================== */}

      <div className="card-footer">

        <div className="card-info">

          <span className="label">

            COUNTY

          </span>

          <div className="value">

            <MapPin size={15} />

            {county}

          </div>

        </div>

        <div className="card-info">

          <span className="label">

            MEMBER SINCE

          </span>

          <div className="value">

            <CalendarDays size={15} />

            {joinedDate}

          </div>

        </div>

        <div className="card-chip">

          <div className="chip-line" />
          <div className="chip-line" />
          <div className="chip-line" />
          <div className="chip-line" />

        </div>

      </div>

      {/* ===========================
          WATERMARK
      =========================== */}

      <div className="card-watermark">

        JVP

      </div>

    </div>
  );
};

export default CardFront;