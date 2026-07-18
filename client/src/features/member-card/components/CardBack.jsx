import QRCode from "react-qr-code";
import {
  ShieldCheck,
  Globe,
  ScanLine,
} from "lucide-react";

const CardBack = ({
  profile,
  fullName,
  memberNumber,
  membershipStatus,
}) => {
  const verificationUrl =
    memberNumber
      ? `https://jumuiyapwani.org/verify/${encodeURIComponent(
          memberNumber
        )}`
      : "https://jumuiyapwani.org";

  const status =
    membershipStatus
      ?.replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Active Member";

  return (
    <div className="card-back">

      {/* ==========================
          Background Decoration
      ========================== */}

      <div className="card-back-glow" />

      {/* ==========================
          Header
      ========================== */}

      <div className="card-back-header">

        <div>

          <h3>JVP CONNECT</h3>

          <span>
            Digital Membership Verification
          </span>

        </div>

        <ShieldCheck size={24} />

      </div>

      {/* ==========================
          QR Section
      ========================== */}

      <div className="qr-panel">

        <div className="qr-container">

          <QRCode
            value={verificationUrl}
            size={170}
            bgColor="white"
            fgColor="#003366"
          />

        </div>

        <div className="scan-text">

          <ScanLine size={18} />

          <span>
            Scan to verify this membership
          </span>

        </div>

      </div>

      {/* ==========================
          Member Information
      ========================== */}

      <div className="verification-details">

        <div className="detail-row">

          <span className="detail-label">
            MEMBER
          </span>

          <span className="detail-value">
            {fullName}
          </span>

        </div>

        <div className="detail-row">

          <span className="detail-label">
            MEMBERSHIP NO.
          </span>

          <span className="detail-value">
            {memberNumber}
          </span>

        </div>

        <div className="detail-row">

          <span className="detail-label">
            STATUS
          </span>

          <span className="detail-value">
            {status}
          </span>

        </div>

        <div className="detail-row">

          <span className="detail-label">
            COUNTY
          </span>

          <span className="detail-value">
            {profile?.county || "Coast Region"}
          </span>

        </div>

      </div>

      {/* ==========================
          Footer
      ========================== */}

      <div className="card-back-footer">

        <div className="website">

          <Globe size={16} />

          <span>
            www.jumuiyapwani.org
          </span>

        </div>

        <div className="verification-note">

          This QR Code verifies the authenticity
          of this membership card.

        </div>

      </div>

      {/* ==========================
          Watermark
      ========================== */}

      <div className="card-back-watermark">

        VERIFIED

      </div>

    </div>
  );
};

export default CardBack;