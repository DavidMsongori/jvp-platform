import { useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

import CountyLeadershipHero from "../../components/leadership/CountyLeadershipHero";
import CountyLeadershipDirectory from "../../components/leadership/CountyLeadershipDirectory";

import { useLeadership } from "../../context/LeadershipContext";

const COUNTY_ORDER = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita Taveta",
];

function getCountySlug(county) {
  return county
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-");
}

function getCountyFromSlug(slug) {
  return COUNTY_ORDER.find(
    (county) => getCountySlug(county) === slug
  );
}

export default function CountyLeadership() {
  const { countySlug } = useParams();

  const {
    countyLeadership = {},
    loading,
    error,
  } = useLeadership();

  const county = useMemo(
    () => getCountyFromSlug(countySlug || ""),
    [countySlug]
  );

  const countyData = county
    ? countyLeadership[county]
    : null;

  /*
   * Allow the leadership data to determine the county
   * when additional counties are added later.
   */
  const resolvedCounty = useMemo(() => {
    if (county) {
      return county;
    }

    return Object.keys(countyLeadership).find(
      (name) =>
        getCountySlug(name) === countySlug
    );
  }, [county, countyLeadership, countySlug]);

  const resolvedData =
    countyLeadership[resolvedCounty] || null;

  /*
   * Unknown county.
   *
   * Only redirect after loading has completed so that
   * the context has an opportunity to populate.
   */
  if (!loading && !resolvedCounty) {
    return <Navigate to="/leadership" replace />;
  }

  const cabinet = resolvedData?.cabinet || [];
  const assembly = resolvedData?.assembly || [];

  const totalLeaders =
    cabinet.length + assembly.length;

  return (
    <>
      <Navbar />

      <main>
        <CountyLeadershipHero
          county={resolvedCounty || "County"}
          cabinetCount={cabinet.length}
          assemblyCount={assembly.length}
          totalCount={totalLeaders}
        />

        {loading && (
          <div
            className="county-page-message"
            role="status"
            aria-live="polite"
          >
            Loading {resolvedCounty || "county"} leadership...
          </div>
        )}

        {error && !loading && (
          <div
            className="county-page-message county-page-message--error"
            role="alert"
          >
            {error}
          </div>
        )}

        {!loading && !error && resolvedCounty && (
          <CountyLeadershipDirectory
            county={resolvedCounty}
            cabinet={cabinet}
            assembly={assembly}
          />
        )}
      </main>

      <Footer />
    </>
  );
}