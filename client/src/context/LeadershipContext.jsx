
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import leaderService from "../services/leader.service";

const LeadershipContext = createContext(null);

/* ==========================================================
   NORMALIZATION HELPERS
========================================================== */

function normalizeValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function sortByDisplayOrder(a, b) {
  return (
    Number(a?.displayOrder ?? 0) -
    Number(b?.displayOrder ?? 0)
  );
}

/**
 * Extracts a list from the response returned by leader.service.js.
 *
 * The service normally returns:
 *   { success: true, count: 10, data: [...] }
 *
 * This helper also supports common legacy response formats.
 */
function extractPublicLeaders(response) {
  if (Array.isArray(response)) {
    return response.filter(Boolean);
  }

  if (!response || typeof response !== "object") {
    return [];
  }

  if (Array.isArray(response.data)) {
    return response.data.filter(Boolean);
  }

  if (Array.isArray(response.leaders)) {
    return response.leaders.filter(Boolean);
  }

  if (Array.isArray(response.results)) {
    return response.results.filter(Boolean);
  }

  if (Array.isArray(response.items)) {
    return response.items.filter(Boolean);
  }

  // Support nested envelopes such as { data: { leaders: [...] } }.
  if (
    response.data &&
    typeof response.data === "object"
  ) {
    return extractPublicLeaders(response.data);
  }

  return [];
}

/* ==========================================================
   REGIONAL EXECUTIVE POSITION RECOGNITION
========================================================== */

/**
 * Some regional executive offices may use a category other
 * than "executive".
 *
 * For example, the Secretary to the Cabinet has:
 *   category: "secretariat"
 *   level: "regional_cabinet"
 *   position: "secretary_to_cabinet"
 *
 * Recognize these offices by position so they are not
 * accidentally excluded from the public Executive Team.
 */
const REGIONAL_EXECUTIVE_POSITIONS = new Set([
  "president",
  "deputy_president",
  "prime_cabinet_secretary",
  "secretary_to_cabinet",
  "secretary_to_the_cabinet",
  "attorney_general",
]);

function isRegionalExecutiveLeader(leader) {
  if (!leader) return false;

  const level = normalizeValue(leader.level);
  const category = normalizeValue(leader.category);
  const position = normalizeValue(leader.position);
  const office = normalizeValue(leader.office);

  const isRegionalCabinet =
    level === "regional_cabinet";

  const isExecutiveCategory =
    category === "executive";

  const isRecognizedExecutivePosition =
    REGIONAL_EXECUTIVE_POSITIONS.has(position) ||
    REGIONAL_EXECUTIVE_POSITIONS.has(office);

  // Preserve the existing regional cabinet requirement for
  // ordinary executive-category records, while allowing
  // recognized executive offices with another category.
  return (
    (isRegionalCabinet && isExecutiveCategory) ||
    isRecognizedExecutivePosition
  );
}

/* ==========================================================
   COUNTY HELPERS
========================================================== */

function getCountyName(leader) {
  const county =
    leader?.county ??
    leader?.countyName ??
    leader?.geography?.county ??
    leader?.location?.county;

  if (typeof county !== "string") {
    return "";
  }

  return county.trim();
}

function getLeaderId(leader) {
  const id =
    leader?._id ??
    leader?.id ??
    leader?.leaderId;

  return id == null ? "" : String(id);
}

/* ==========================================================
   PROVIDER
========================================================== */

export function LeadershipProvider({ children }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* --------------------------------------------------------
     FETCH PUBLIC LEADERSHIP
  -------------------------------------------------------- */

  const fetchLeadership = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await leaderService.getPublicLeaders();

      const publicLeaders =
        extractPublicLeaders(response);

      setLeaders(publicLeaders);

      return publicLeaders;
    } catch (err) {
      console.error(
        "Failed to load public leadership:",
        err
      );

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load leadership."
      );

      setLeaders([]);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* --------------------------------------------------------
     INITIAL LOAD
  -------------------------------------------------------- */

  useEffect(() => {
    let isMounted = true;

    const loadLeadership = async () => {
      setLoading(true);
      setError("");

      try {
        const response =
          await leaderService.getPublicLeaders();

        if (!isMounted) return;

        const publicLeaders =
          extractPublicLeaders(response);

        setLeaders(publicLeaders);
      } catch (err) {
        console.error(
          "Failed to load public leadership:",
          err
        );

        if (!isMounted) return;

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load leadership."
        );

        setLeaders([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeadership();

    return () => {
      isMounted = false;
    };
  }, []);

  /* --------------------------------------------------------
     PATRON
  -------------------------------------------------------- */

  const patron = useMemo(() => {
    return (
      leaders.find((leader) => {
        const office = normalizeValue(leader?.office);
        const category = normalizeValue(
          leader?.category
        );

        return (
          office === "patron" ||
          category === "patronage"
        );
      }) ?? null
    );
  }, [leaders]);

  
/* --------------------------------------------------------
   REGIONAL EXECUTIVE TEAM
-------------------------------------------------------- */

const executive = useMemo(() => {
  return leaders
    .filter(isRegionalExecutiveLeader)
    .sort(sortByDisplayOrder);
}, [leaders]);


  /* --------------------------------------------------------
     COUNCIL OF GOVERNORS
  -------------------------------------------------------- */

  const councilOfGovernors = useMemo(() => {
    return leaders
      .filter(
        (leader) =>
          normalizeValue(leader?.level) ===
          "council_of_governors"
      )
      .sort(sortByDisplayOrder);
  }, [leaders]);

  /* --------------------------------------------------------
     REGIONAL YOUTH ASSEMBLY
  -------------------------------------------------------- */

  const assembly = useMemo(() => {
    return leaders
      .filter((leader) => {
        return (
          normalizeValue(leader?.level) ===
            "regional_youth_assembly" &&
          normalizeValue(leader?.category) ===
            "legislative"
        );
      })
      .sort(sortByDisplayOrder);
  }, [leaders]);

  /* --------------------------------------------------------
     COUNTY LEADERSHIP
     
     Each county entry contains:
       - cabinet
       - assembly
       - governor

     Governors already listed under the Council of Governors
     are reused here rather than duplicated in the source list.
  -------------------------------------------------------- */

  const countyLeadership = useMemo(() => {
    const grouped = {};

    const ensureCounty = (county) => {
      if (!county) return null;

      if (!grouped[county]) {
        grouped[county] = {
          cabinet: [],
          assembly: [],
          governor: null,
        };
      }

      return grouped[county];
    };

    // County cabinet and county assembly members.
    leaders.forEach((leader) => {
      const level = normalizeValue(leader?.level);
      const county = getCountyName(leader);

      if (!county) return;

      if (level === "county_cabinet") {
        ensureCounty(county).cabinet.push(leader);
      } else if (level === "county_youth_assembly") {
        ensureCounty(county).assembly.push(leader);
      }
    });

    // Add governors from the Council of Governors.
    // Avoid duplicating a governor already present in the
    // county cabinet list.
    councilOfGovernors.forEach((governor) => {
      const county = getCountyName(governor);

      if (!county) return;

      const countyData = ensureCounty(county);

      const governorId = getLeaderId(governor);

      const alreadyInCabinet = countyData.cabinet.some(
        (leader) => {
          const leaderId = getLeaderId(leader);

          if (governorId && leaderId) {
            return governorId === leaderId;
          }

          return (
            normalizeValue(leader?.position) ===
              normalizeValue(governor?.position) &&
            normalizeValue(leader?.name) ===
              normalizeValue(governor?.name)
          );
        }
      );

      if (!alreadyInCabinet) {
        countyData.cabinet.unshift({
          ...governor,
          isCountyGovernor: true,
          level: "county_cabinet",
          category: "executive",
          position:
            governor?.position || "county_governor",
        });
      }

      countyData.governor = governor;
    });

    // Sort county leadership consistently, while preserving
    // the governor as the first cabinet entry.
    Object.values(grouped).forEach((countyData) => {
      countyData.cabinet.sort((a, b) => {
        if (a?.isCountyGovernor) return -1;
        if (b?.isCountyGovernor) return 1;

        return sortByDisplayOrder(a, b);
      });

      countyData.assembly.sort(sortByDisplayOrder);
    });

    return grouped;
  }, [leaders, councilOfGovernors]);

  /* --------------------------------------------------------
     COUNTY SUMMARY
  -------------------------------------------------------- */

  const countySummary = useMemo(() => {
    return Object.entries(countyLeadership)
      .map(([county, data]) => ({
        county,
        cabinetCount: data.cabinet.length,
        assemblyCount: data.assembly.length,
        total:
          data.cabinet.length +
          data.assembly.length,
      }))
      .sort((a, b) =>
        a.county.localeCompare(b.county)
      );
  }, [countyLeadership]);

  /* --------------------------------------------------------
     CONTEXT VALUE
  -------------------------------------------------------- */

  const value = useMemo(
    () => ({
      leaders,
      patron,
      executive,
      councilOfGovernors,
      assembly,
      countyLeadership,
      countySummary,
      loading,
      error,
      fetchLeadership,
    }),
    [
      leaders,
      patron,
      executive,
      councilOfGovernors,
      assembly,
      countyLeadership,
      countySummary,
      loading,
      error,
      fetchLeadership,
    ]
  );

  return (
    <LeadershipContext.Provider value={value}>
      {children}
    </LeadershipContext.Provider>
  );
}

/* ==========================================================
   CONTEXT HOOK
========================================================== */

export function useLeadership() {
  const context = useContext(LeadershipContext);

  if (!context) {
    throw new Error(
      "useLeadership must be used within a LeadershipProvider."
    );
  }

  return context;
}
