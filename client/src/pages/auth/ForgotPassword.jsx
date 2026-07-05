import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function ForgotPassword() {
  return (
    <PageLayout>
      <PageHero
        title="Forgot Password"
        subtitle="Reset your account password."
      />

      <PageSection
        title="Password Recovery"
        subtitle="We'll help you regain access to your account."
      >
        <p>Password recovery form will be added here.</p>
      </PageSection>
    </PageLayout>
  );
}

export default ForgotPassword;