import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import AssemblyHero from "../../components/leadership/AssemblyHero";
import AssemblyDirectory from "../../components/leadership/AssemblyDirectory";

import { useLeadership } from "../../context/LeadershipContext";

export default function YouthAssembly() {
  const {
    assembly = [],
    loading,
    error,
  } = useLeadership();

  return (
    <>
      <Navbar />

      <main>
        <AssemblyHero count={assembly.length} />

        {loading && (
          <div
            className="assembly-page-message"
            role="status"
            aria-live="polite"
          >
            Loading Youth Assembly...
          </div>
        )}

        {error && !loading && (
          <div
            className="assembly-page-message assembly-page-message--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && (
          <AssemblyDirectory leaders={assembly} />
        )}
      </main>

      <Footer />
    </>
  );
}