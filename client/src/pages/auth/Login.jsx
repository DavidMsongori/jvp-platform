import PageLayout from "../../components/common/PageLayout";
import PageHero from "../../components/common/PageHero";
import PageSection from "../../components/common/PageSection";

function Login() {
  return (
    <PageLayout>
      <PageHero
        title="Member Login"
        subtitle="Access your JVP Connect account."
      />

      <PageSection
        title="Login"
        subtitle="Sign in to your account."
      >
        <p>Member login form will be added here.</p>
      </PageSection>
    </PageLayout>
  );
}

export default Login;