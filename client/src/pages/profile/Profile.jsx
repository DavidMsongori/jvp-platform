import { useProfile } from "../../context/ProfileContext";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileCompletion from "../../components/profile/ProfileCompletion";
import MembershipInformation from "../../components/profile/MembershipInformation";
import PersonalInformation from "../../components/profile/PersonalInformation";
import ContactInformation from "../../components/profile/ContactInformation";
import SecuritySettings from "../../components/profile/SecuritySettings";

import "./Profile.css";

function Profile() {

  const {

    loading,

    error,

  } = useProfile();

  /* ==========================================
     LOADING
  ========================================== */

  if (loading) {

    return (

      <div className="profile-page">

        <div className="profile-loading">

          Loading profile...

        </div>

      </div>

    );

  }

  /* ==========================================
     ERROR
  ========================================== */

  if (error) {

    return (

      <div className="profile-page">

        <div className="profile-error">

          {error}

        </div>

      </div>

    );

  }

  /* ==========================================
     PAGE
  ========================================== */

  return (

    <div className="profile-page">

      {/* ======================================
          PROFILE HEADER
      ====================================== */}

      <ProfileHeader />

      {/* ======================================
          OVERVIEW
      ====================================== */}

      <div className="profile-overview">

        <div>

          <ProfileCompletion />

        </div>

        <div>

          <MembershipInformation />

        </div>

      </div>

      {/* ======================================
          PERSONAL INFORMATION
      ====================================== */}

      <PersonalInformation />

      {/* ======================================
          CONTACT INFORMATION
      ====================================== */}

      <ContactInformation />

      {/* ======================================
          SECURITY
      ====================================== */}

      <SecuritySettings />

    </div>

  );

}

export default Profile;