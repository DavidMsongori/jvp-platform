
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

  // Sort leaders strictly by their configured display order.
  const executiveLeaders = [...executive]
    .filter(Boolean)
    .sort((a, b) => {
      const orderA = Number(a.displayOrder ?? 0);
      const orderB = Number(b.displayOrder ?? 0);

      return orderA - orderB;
    });

  return (
    <>
      <Navbar />

      <main>
        <ExecutiveHero count={executiveLeaders.length} />

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
            leaders={executiveLeaders}
          />
        )}
      </main>

      <Footer />
    </>
  );
}
