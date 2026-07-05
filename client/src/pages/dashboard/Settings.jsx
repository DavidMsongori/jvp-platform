import PageLayout from "../../components/common/PageLayout";
import PageSection from "../../components/common/PageSection";

function Settings() {
  return (
    <PageLayout>
      <PageSection
        title="Account Settings"
        subtitle="Manage your account preferences."
      >
        <p>
          Update your password,
          notifications,
          privacy settings
          and account security.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Settings;