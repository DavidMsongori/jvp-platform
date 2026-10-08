import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import ExecutiveHero from "../../components/leadership/ExecutiveHero";
import ExecutiveDirectory from "../../components/leadership/ExecutiveDirectory";

import { useLeadership } from "../../context/LeadershipContext";

export default function ExecutiveTeam() {
  const {
    executive = [],
    loading,
    error,
  } = useLeadership();

  return (
    <>
      <Navbar />

      <main>
        <ExecutiveHero
          count={executive.length}
        />

        {loading && (
          <div
            className="executive-page-message"
            role="status"
            aria-live="polite"
          >
            Loading Executive Team...
          </div>
        )}

        {error && !loading && (
          <div
            className="executive-page-message executive-page-message--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <ExecutiveDirectory
            leaders={executive}
          />
        )}
      </main>

      <Footer />
    </>
  );
}