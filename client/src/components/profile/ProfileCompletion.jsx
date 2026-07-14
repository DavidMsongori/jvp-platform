import {
  CheckCircle2,
  Circle,
  User,
  Phone,
  Camera,
  Briefcase,
  MapPin,
} from "lucide-react";

import { useProfile } from "../../context/ProfileContext";

import "./ProfileCompletion.css";

function ProfileCompletion() {

  const {

    profile,

    profileCompletion,

    isProfileComplete,

  } = useProfile();

  const checklist = [

    {
      label: "Profile Photo",
      completed: !!profile?.profilePhoto,
      icon: Camera,
    },

    {
      label: "Phone Number",
      completed: !!profile?.phone,
      icon: Phone,
    },

    {
      label: "Occupation",
      completed: !!profile?.occupation,
      icon: Briefcase,
    },

    {
      label: "County",
      completed: !!profile?.county,
      icon: MapPin,
    },

    {
      label: "Personal Information",
      completed:
        !!profile?.firstName &&
        !!profile?.lastName &&
        !!profile?.dateOfBirth,
      icon: User,
    },

  ];

  return (

    <section className="profile-completion">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="completion-header">

        <div>

          <h2>

            Profile Completion

          </h2>

          <p>

            Complete your profile to unlock the full JVP Connect experience.

          </p>

        </div>

        <div className="completion-percentage">

          {profileCompletion}%

        </div>

      </div>

      {/* ======================================
          PROGRESS BAR
      ====================================== */}

      <div className="completion-progress">

        <div

          className="completion-progress-fill"

          style={{

            width: `${profileCompletion}%`,

          }}

        />

      </div>

      {/* ======================================
          STATUS
      ====================================== */}

      <div className="completion-status">

        {

          isProfileComplete

            ? "🎉 Your profile is complete."

            : "Complete the remaining items below."

        }

      </div>

      {/* ======================================
          CHECKLIST
      ====================================== */}

      <div className="completion-list">

        {

          checklist.map((item) => {

            const Icon = item.icon;

            return (

              <div

                key={item.label}

                className={`completion-item ${

                  item.completed

                    ? "completed"

                    : ""

                }`}

              >

                <div className="completion-icon">

                  {

                    item.completed

                      ? <CheckCircle2 size={20} />

                      : <Circle size={20} />

                  }

                </div>

                <div className="completion-info">

                  <strong>

                    {item.label}

                  </strong>

                </div>

                <Icon size={18} />

              </div>

            );

          })

        }

      </div>

    </section>

  );

}

export default ProfileCompletion;