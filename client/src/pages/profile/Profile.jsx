import { useProfile } from "../../context/ProfileContext";

import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileCompletion from "../../components/profile/ProfileCompletion";
import MembershipInformation from "../../components/profile/MembershipInformation";
import PersonalInformation from "../../components/profile/PersonalInformation";
import ContactInformation from "../../components/profile/ContactInformation";
import SecuritySettings from "../../components/profile/SecuritySettings";

import "./Profile.css";

function Profile() {
  const { loading, error } = useProfile();

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-state">
          <div className="profile-spinner" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-state profile-state-error">
          <strong>Unable to load your profile</strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="profile-page">

      <div className="profile-hero">
        <ProfileHeader />
      </div>

      <div className="profile-overview">
        <div className="profile-overview-card">
          <ProfileCompletion />
        </div>

        <div className="profile-overview-card">
          <MembershipInformation />
        </div>
      </div>

      <div className="profile-information-grid">
        <div className="profile-section-card">
          <PersonalInformation />
        </div>

        <div className="profile-section-card">
          <ContactInformation />
        </div>
      </div>

      <div className="profile-security">
        <SecuritySettings />
      </div>

    </main>
  );
}

export default Profile;