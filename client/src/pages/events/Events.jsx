import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Events() {
  return (
    <PageLayout>
      <PageHero
        title="Events"
        subtitle="Stay updated with all JVP events across the Coast Region."
      />

      <PageSection
        title="Upcoming Events"
        subtitle="Our calendar is continuously updated."
      >
        <p>
          Upcoming leadership forums, trainings, summits,
          community service, beach clean-ups, mentorship and
          networking events will appear here.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Events;