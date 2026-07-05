import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function VerifyOTP() {
  return (
    <PageLayout>
      <PageHero
        title="Verify OTP"
        subtitle="Confirm your identity."
      />

      <PageSection
        title="OTP Verification"
        subtitle="Enter the verification code sent to your phone or email."
      >
        <p>OTP verification form will be added here.</p>
      </PageSection>
    </PageLayout>
  );
}

export default VerifyOTP;