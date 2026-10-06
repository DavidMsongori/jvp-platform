import { useEffect, useMemo, useState } from "react";

import "./Leadership.css";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

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
         */

        const response =
          await leaderService.getPublicLeaders();

        if (!isMounted) return;

        const publicLeaders = Array.isArray(response?.data)
          ? response.data
          : [];

        console.log(
          "Public leadership loaded:",
          publicLeaders
        );

        setLeaders(publicLeaders);
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
     PATRON
     
     Patron is identified by office/category.
  ========================================================== */

  const patron = useMemo(
    () =>
      leaders.find(
        (leader) =>
          leader.office === "patron" ||
          leader.category === "patronage"
      ) || null,
    [leaders]
  );

  /* ==========================================================
     REGIONAL CABINET
     
     Structural level:
       regional_cabinet
     
     Functional category:
       executive
     
     Do NOT use:
       regional_executive
  ========================================================== */

  const executive = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level === "regional_cabinet" &&
            leader.category === "executive"
        )
        .sort(
          (a, b) =>
            (a.displayOrder || 0) -
            (b.displayOrder || 0)
        ),
    [leaders]
  );

  /* ==========================================================
     COUNCIL OF GOVERNORS
     
     Council Governors are a separate leadership level.
  ========================================================== */

  const councilOfGovernors = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level === "council_of_governors"
        )
        .sort(
          (a, b) =>
            (a.displayOrder || 0) -
            (b.displayOrder || 0)
        ),
    [leaders]
  );

  /* ==========================================================
     REGIONAL YOUTH ASSEMBLY
     
     Structural level:
       regional_youth_assembly
     
     Functional category:
       legislative
  ========================================================== */

  const assembly = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level ===
              "regional_youth_assembly" &&
            leader.category === "legislative"
        )
        .sort(
          (a, b) =>
            (a.displayOrder || 0) -
            (b.displayOrder || 0)
        ),
    [leaders]
  );

  /* ==========================================================
     COUNTY LEADERSHIP
     
     County leadership is divided into:
     
     1. County Cabinet
     2. County Youth Assembly
     
     Both are grouped by county.
  ========================================================== */

  const countyLeadership = useMemo(() => {
    const grouped = {};

    leaders
      .filter(
        (leader) =>
          leader.level === "county_cabinet" ||
          leader.level === "county_youth_assembly"
      )
      .forEach((leader) => {
        const county =
          leader.county ||
          leader.countyName ||
          "Other";

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
     DEBUG
  ========================================================== */

  useEffect(() => {
    if (!leaders.length) return;

    console.log("Leadership grouping:", {
      total: leaders.length,
      patron,
      regionalCabinet: executive,
      councilOfGovernors,
      regionalAssembly: assembly,
      countyLeadership,
    });
  }, [
    leaders,
    patron,
    executive,
    councilOfGovernors,
    assembly,
    countyLeadership,
  ]);

  /* ==========================================================
     PAGE
  ========================================================== */

  return (
    <>
      <Navbar />

      <main className="leadership-page">

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
            {/* ==================================================
                PATRON
            ================================================== */}

            <PatronSection
              leader={patron}
            />

            {/* ==================================================
                REGIONAL CABINET
            ================================================== */}

            <ExecutiveSection
              leaders={executive}
            />

            {/* ==================================================
                COUNCIL OF GOVERNORS
            ================================================== */}

            <CouncilGovernors
              leaders={councilOfGovernors}
            />

            {/* ==================================================
                REGIONAL YOUTH ASSEMBLY
            ================================================== */}

            <AssemblySection
              leaders={assembly}
            />

            {/* ==================================================
                COUNTY LEADERSHIP
            ================================================== */}

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