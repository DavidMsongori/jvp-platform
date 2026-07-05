import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function News() {
  return (
    <PageLayout>
      <PageHero
        title="Latest News"
        subtitle="News, announcements and success stories from JVP."
      />

      <PageSection
        title="News Updates"
        subtitle="Stay informed."
      >
        <p>
          Latest announcements, opportunities,
          scholarships and organizational news
          will be published here.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default News;