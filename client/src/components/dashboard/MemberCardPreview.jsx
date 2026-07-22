import { Link } from "react-router-dom";
import {
  CreditCard,
  Download,
  QrCode,
  ArrowRight,
  Shield,
} from "lucide-react";

import "./MemberCardPreview.css";

function MemberCardPreview({
  member,
  leadership,
}) {
  if (!member) return null;

  const fullName = [
    member.firstName,
    member.middleName,
    member.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  const memberNumber =
    member.memberNumber ||
    member.membershipNumber ||
    "Pending Number";

  return (
    <section className="member-card-preview">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="widget-header">

        <div>

          <h2>
            Digital Membership Card
          </h2>

          <p>
            Your official JVP membership card.
          </p>

          {leadership?.hasLeadershipCard && (
            <div className="leader-badge">

              <Shield size={15} />

              <span>
                Leadership Card Available
              </span>

            </div>
          )}

        </div>

        <Link
          to="/dashboard/membership-card"
          className="widget-link"
        >
          View Card

          <ArrowRight size={18} />
        </Link>

      </div>

      {/* ==========================================
          CARD
      ========================================== */}

      <div className="preview-card">

        {/* TOP */}

        <div className="preview-card-top">

          <div>

            <span className="preview-card-brand">
              JVP CONNECT
            </span>

            <h3>
              Jumuiya ya Vijana wa Pwani
            </h3>

          </div>

          <CreditCard size={34} />

        </div>

        {/* MEMBER */}

        <div className="preview-card-member">

          <div className="preview-avatar">

            {member.profilePhoto ? (
              <img
                src={member.profilePhoto}
                alt={member.firstName}
              />
            ) : (
              <div className="preview-avatar-placeholder">
                {member.firstName?.charAt(0)}
              </div>
            )}

          </div>

          <div>

            <h2>{fullName}</h2>

            <p>{memberNumber}</p>

            {leadership?.isLeader && (
              <small className="leader-position">

                {leadership.position}

              </small>
            )}

          </div>

        </div>

        {/* FOOTER */}

        <div className="preview-card-footer">

          <div>

            <span>Status</span>

            <strong>

              {member.membershipStatus}

            </strong>

          </div>

          <div>

            <span>County</span>

            <strong>

              {member.county || "-"}

            </strong>

          </div>

          <div className="preview-qr-box">

            <QrCode size={40} />

          </div>

        </div>

      </div>

      {/* ==========================================
          ACTIONS
      ========================================== */}

      <div className="preview-card-actions">

        <button type="button">

          <Download size={18} />

          Download Card

        </button>

      </div>

    </section>
  );
}

export default MemberCardPreview;