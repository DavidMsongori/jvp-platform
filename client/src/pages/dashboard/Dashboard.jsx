import PageLayout from "../../components/common/PageLayout";
import PageSection from "../../components/common/PageSection";

function Dashboard() {
  return (
    <PageLayout>
      <PageSection
        title="Member Dashboard"
        subtitle="Welcome to your JVP Connect dashboard."
      >
        <p>
          This dashboard will display your membership
          status, events, opportunities, notifications
          and achievements.
        </p>
      </PageSection>
    </PageLayout>
  );
}

export default Dashboard;