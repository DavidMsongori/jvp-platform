import {
  BadgeCheck,
  CreditCard,
  CalendarDays,
  ShieldCheck,
  MapPin,
  UserCheck,
  Wallet,
  Clock3,
} from "lucide-react";

import { useProfile } from "../../context/ProfileContext";

import "./MembershipInformation.css";

function MembershipInformation() {

  const {

    profile,

    memberNumber,

    membershipStatus,

    joinedDate,

  } = useProfile();

  const status = (
    membershipStatus || "inactive"
  ).toLowerCase();

  const statusClass = {

    active: "active",

    pending_payment: "pending",

    inactive: "inactive",

    expired: "expired",

  }[status] || "inactive";

  return (

    <section className="membership-information">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="membership-header">

        <div>

          <h2>

            Membership Information

          </h2>

          <p>

            Your official JVP membership record.

          </p>

        </div>

        <div

          className={`membership-status ${statusClass}`}

        >

          <BadgeCheck size={18} />

          {membershipStatus
            ?.replace("_", " ")
            ?.replace(/\b\w/g, (letter) =>
              letter.toUpperCase()
            ) || "Inactive"}

        </div>

      </div>

      {/* ======================================
          GRID
      ====================================== */}

      <div className="membership-grid">

        <div className="membership-item">

          <CreditCard size={18} />

          <div>

            <span>

              Membership Number

            </span>

            <strong>

              {

                memberNumber ||

                "Pending Assignment"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <UserCheck size={18} />

          <div>

            <span>

              Membership Type

            </span>

            <strong>

              {

                profile?.membershipType ||

                "--"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <MapPin size={18} />

          <div>

            <span>

              County

            </span>

            <strong>

              {

                profile?.county ||

                "--"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <CalendarDays size={18} />

          <div>

            <span>

              Joined On

            </span>

            <strong>

              {

                joinedDate

                  ? new Date(joinedDate).toLocaleDateString(

                      "en-KE",

                      {

                        day: "numeric",

                        month: "long",

                        year: "numeric",

                      }

                    )

                  : "--"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <Wallet size={18} />

          <div>

            <span>

              Membership Fee

            </span>

            <strong>

              {

                profile?.membershipFeePaid

                  ? "Paid"

                  : "Pending Payment"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <Clock3 size={18} />

          <div>

            <span>

              Valid Until

            </span>

            <strong>

              {

                profile?.membershipExpiry

                  ? new Date(

                      profile.membershipExpiry

                    ).toLocaleDateString(

                      "en-KE",

                      {

                        day: "numeric",

                        month: "long",

                        year: "numeric",

                      }

                    )

                  : "Lifetime"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <ShieldCheck size={18} />

          <div>

            <span>

              Account Status

            </span>

            <strong>

              {

                profile?.accountActivated

                  ? "Verified"

                  : "Pending Activation"

              }

            </strong>

          </div>

        </div>

        <div className="membership-item">

          <BadgeCheck size={18} />

          <div>

            <span>

              Membership Standing

            </span>

            <strong>

              {

                membershipStatus === "active"

                  ? "In Good Standing"

                  : membershipStatus === "expired"

                  ? "Renewal Required"

                  : membershipStatus === "pending_payment"

                  ? "Awaiting Payment"

                  : "Inactive"

              }

            </strong>

          </div>

        </div>

      </div>

    </section>

  );

}

export default MembershipInformation;