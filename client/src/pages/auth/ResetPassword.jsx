import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function ResetPassword() {
  return (
    <PageLayout>
      <PageHero
        title="Reset Password"
        subtitle="Create a new password."
      />

      <PageSection
        title="Reset Your Password"
        subtitle="Choose a strong new password."
      >
        <p>Password reset form will be added here.</p>
      </PageSection>
    </PageLayout>
  );
}

export default ResetPassword;