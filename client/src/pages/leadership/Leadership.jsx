import { useEffect, useMemo, useState } from "react";

import "./Leadership.css";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import LeadershipHero from "./components/LeadershipHero";
import PatronSection from "./components/PatronSection";
import ExecutiveSection from "./components/ExecutiveSection";
import AssemblySection from "./components/AssemblySection";
import CountyLeadershipSection from "./components/CountyLeadershipSection";
import CouncilGovernors from "./components/CouncilGovernors";

import leaderService from "../../services/leader.service";

export default function Leadership() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================================
     LOAD PUBLIC LEADERSHIP
  ========================================================== */

  useEffect(() => {
    let isMounted = true;

    const loadPublicLeadership = async () => {
      try {
        setLoading(true);
        setError("");

        /*
         * PUBLIC ENDPOINT ONLY
         *
         * GET /api/leaders/public
         *
         * NEVER use getLeaders() here.
         */

        const response =
          await leaderService.getPublicLeaders();

        if (!isMounted) return;

        setLeaders(
          Array.isArray(response?.data)
            ? response.data
            : []
        );
      } catch (err) {
        console.error(
          "Failed to load public leadership:",
          err
        );

        if (!isMounted) return;

        setError(
          err.response?.data?.message ||
            "Unable to load leadership."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPublicLeadership();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ==========================================================
     GROUP LEADERS
  ========================================================== */

  const patron = useMemo(
    () =>
      leaders.find(
        (leader) =>
          leader.category === "patron"
      ) || null,
    [leaders]
  );

  const executive = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.category ===
            "regional_executive"
        )
        .sort(
          (a, b) =>
            (a.displayOrder || 0) -
            (b.displayOrder || 0)
        ),
    [leaders]
  );

  const councilOfGovernors = useMemo(
  () =>
    leaders
      .filter(
        (leader) =>
          leader.category ===
          "council_of_governors"
      )
      .sort(
        (a, b) =>
          (a.displayOrder || 0) -
          (b.displayOrder || 0)
      ),
  [leaders]
);

  const assembly = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.category ===
            "youth_assembly"
        )
        .sort(
          (a, b) =>
            (a.displayOrder || 0) -
            (b.displayOrder || 0)
        ),
    [leaders]
  );

  const countyLeadership = useMemo(() => {
    const grouped = {};

    leaders
      .filter(
        (leader) =>
          leader.category ===
          "county_leadership"
      )
      .forEach((leader) => {
        const county =
          leader.county || "Other";

        if (!grouped[county]) {
          grouped[county] = [];
        }

        grouped[county].push(leader);
      });

    Object.keys(grouped).forEach((county) => {
      grouped[county].sort(
        (a, b) =>
          (a.displayOrder || 0) -
          (b.displayOrder || 0)
      );
    });

    return grouped;
  }, [leaders]);

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <>
      <Navbar />

      <main className="leadership-page">

        <LeadershipHero />

        {loading && (
          <div className="leadership-message">
            Loading leadership...
          </div>
        )}

        {error && (
          <div className="leadership-message error">
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