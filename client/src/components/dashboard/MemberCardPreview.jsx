import { Link } from "react-router-dom";
import {
  CreditCard,
  Download,
  QrCode,
  ArrowRight,
} from "lucide-react";

import "./MemberCardPreview.css";

function MemberCardPreview({ profile }) {

  if (!profile) return null;

  return (

    <section className="member-card-preview">

      <div className="widget-header">

        <div>

          <h2>Digital Membership Card</h2>

          <p>

            Your official JVP membership card.

          </p>

        </div>

        <Link
          to="/membership-card"
          className="widget-link"
        >

          View Card

          <ArrowRight size={18} />

        </Link>

      </div>

      <div className="membership-card">

        <div className="card-top">

          <div>

            <span className="card-brand">

              JVP CONNECT

            </span>

            <h3>

              Jumuiya ya Vijana wa Pwani

            </h3>

          </div>

          <CreditCard size={34} />

        </div>

        <div className="card-member">

          <div className="member-avatar">

            {

              profile.profilePhoto ?

              (

                <img
                  src={profile.profilePhoto}
                  alt={profile.firstName}
                />

              )

              :

              (

                <div className="avatar-placeholder">

                  {profile.firstName?.charAt(0)}

                </div>

              )

            }

          </div>

          <div>

            <h2>

              {profile.firstName}{" "}

              {profile.lastName}

            </h2>

            <p>

              {profile.memberNumber ||

                "Pending Number"}

            </p>

          </div>

        </div>

        <div className="card-footer">

          <div>

            <span>Status</span>

            <strong>

              {profile.membershipStatus}

            </strong>

          </div>

          <div>

            <span>County</span>

            <strong>

              {profile.county}

            </strong>

          </div>

          <div className="qr-box">

            <QrCode size={40} />

          </div>

        </div>

      </div>

      <div className="card-actions">

        <button>

          <Download size={18} />

          Download Card

        </button>

      </div>

    </section>

  );

}

export default MemberCardPreview;