import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import LeadershipHero from "../../components/leadership/LeadershipHero";
import PatronSection from "../../components/leadership/PatronSection";
import ExecutiveSection from "../../components/leadership/ExecutiveSection";
import CouncilGovernors from "../../components/leadership/CouncilGovernors";
import AssemblySection from "../../components/leadership/AssemblySection";
import CountyLeadershipSection from "../../components/leadership/CountyLeadershipSection";

import { useLeadership } from "../../context/LeadershipContext";

export default function Leadership() {
  const {
    patron,
    executive,
    councilOfGovernors,
    assembly,
    countyLeadership,
    loading,
    error,
  } = useLeadership();

  return (
    <>
      <Navbar />

      <main>
        <LeadershipHero />

        {loading && (
          <div
            className="leadership-message"
            role="status"
            aria-live="polite"
          >
            Loading leadership...
          </div>
        )}

        {error && !loading && (
          <div
            className="leadership-message leadership-message--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <PatronSection
              leader={patron}
            />

            <ExecutiveSection
              leaders={executive}
            />

            <CouncilGovernors
              leaders={councilOfGovernors}
            />

            <AssemblySection
              leaders={assembly}
            />

            <CountyLeadershipSection
              counties={countyLeadership}
            />
          </>
        )}
      </main>

      <Footer />
    </>
  );
}