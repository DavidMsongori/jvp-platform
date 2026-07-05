import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Contact() {
  return (
    <PageLayout>
      <PageHero
        title="Contact Us"
        subtitle="We'd love to hear from you."
      />

      <PageSection
        title="Get In Touch"
        subtitle="Reach out to the JVP Secretariat."
      >
        <p>
          Contact forms, office locations,
          social media platforms and
          support information will be available here.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Contact;