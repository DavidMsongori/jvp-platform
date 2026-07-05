import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function ClaimMembership() {
  return (
    <PageLayout>
      <PageHero
        title="Activate Membership"
        subtitle="Existing members can activate their JVP Connect account."
      />

      <PageSection
        title="Membership Activation"
        subtitle="Verify your existing membership."
      >
        <p>
          Existing members will enter their email or phone number to begin
          activating their account.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default ClaimMembership;