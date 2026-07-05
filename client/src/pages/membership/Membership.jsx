import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Membership() {
  return (
    <PageLayout>
      <PageHero
        title="Membership"
        subtitle="Become part of the largest youth movement in Kenya's Coast Region."
      />

      <PageSection
        title="Join JVP"
        subtitle="Membership registration is simple."
      >
        <p>
          Register, activate your membership,
          access opportunities, participate in
          programmes and connect with thousands
          of young people.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Membership;