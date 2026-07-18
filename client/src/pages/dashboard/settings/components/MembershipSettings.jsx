import {
  CreditCard,
  BadgeCheck,
  CalendarDays,
  MapPin,
  Users,
  Receipt,
  Info,
} from "lucide-react";

import { useProfile } from "../../../../context/ProfileContext";

import "./MembershipSettings.css";

function MembershipSettings() {
  const { profile } = useProfile();

  if (!profile) return null;

  return (
    <div className="membership-settings">

      {/* ===========================
          HEADER
      =========================== */}

      <div className="membership-header">

        <CreditCard size={30} />

        <div>

          <h2>Membership Information</h2>

          <p>

            View your JVP membership details and status.

          </p>

        </div>

      </div>

      {/* ===========================
          DETAILS
      =========================== */}

      <div className="membership-card">

        <div className="membership-grid">

          <div className="membership-item">

            <CreditCard size={20} />

            <div>

              <span>Membership Number</span>

              <strong>

                {profile.memberNumber || "Pending Assignment"}

              </strong>

            </div>

          </div>

          <div className="membership-item">

            <BadgeCheck size={20} />

            <div>

              <span>Membership Status</span>

              <strong className={profile.membershipStatus?.toLowerCase()}>

                {profile.membershipStatus}

              </strong>

            </div>

          </div>

          <div className="membership-item">

            <Users size={20} />

            <div>

              <span>Membership Type</span>

              <strong>

                {profile.membershipType}

              </strong>

            </div>

          </div>

          <div className="membership-item">

            <Receipt size={20} />

            <div>

              <span>Membership Fee</span>

              <strong>

                {profile.membershipFeePaid
                  ? "Paid"
                  : "Pending"}

              </strong>

            </div>

          </div>

          <div className="membership-item">

            <CalendarDays size={20} />

            <div>

              <span>Membership Expiry</span>

              <strong>

                {profile.membershipExpiry || "Not Available"}

              </strong>

            </div>

          </div>

          <div className="membership-item">

            <MapPin size={20} />

            <div>

              <span>County</span>

              <strong>

                {profile.county}

              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* ===========================
          INFORMATION
      =========================== */}

      <div className="membership-note">

        <Info size={20} />

        <div>

          <h4>Need to update your membership?</h4>

          <p>

            Membership type, status and membership number are managed by the JVP administration.
            If you believe any information is incorrect, please contact the Secretariat.

          </p>

        </div>

      </div>

    </div>
  );
}

export default MembershipSettings;