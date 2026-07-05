import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Summit() {
  return (
    <PageLayout>
      <PageHero
        title="Coastal Youth Summit 2026"
        subtitle="Catalysing youth leadership, innovation and sustainable development."
      />

      <PageSection
        title="Summit Information"
        subtitle="Everything about the summit."
      >
        <p>
          Speaker profiles, programme schedule,
          sponsorship opportunities, exhibitors,
          registrations and summit updates
          will be available here.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Summit;