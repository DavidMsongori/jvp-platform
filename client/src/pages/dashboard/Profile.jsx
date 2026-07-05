import PageLayout from "../../components/common/PageLayout";
import PageSection from "../../components/common/PageSection";

function Profile() {
  return (
    <PageLayout>
      <PageSection
        title="My Profile"
        subtitle="Manage your personal information."
      >
        <p>
          Update your profile,
          education,
          employment,
          interests and membership details.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Profile;