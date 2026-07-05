import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Programs() {
  return (
    <PageLayout>
      <PageHero
        title="Our Programmes"
        subtitle="Empowering youth through leadership, innovation, entrepreneurship, climate action and community service."
      />

      <PageSection
        title="Programs Coming Soon"
        subtitle="We are preparing detailed information about all JVP programmes."
      >
        <p>
          This page will showcase Leadership Development, Blue Economy,
          Climate Action, Entrepreneurship, Community Service,
          Innovation, Mentorship and Youth Empowerment programmes.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Programs;