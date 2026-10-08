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
   HELPERS
========================================================== */

function sortByDisplayOrder(a, b) {
  return (
    (a?.displayOrder || 0) -
    (b?.displayOrder || 0)
  );
}

/* ==========================================================
   LEADERSHIP PROVIDER
========================================================== */

export function LeadershipProvider({ children }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ========================================================
     LOAD PUBLIC LEADERSHIP
  ======================================================== */

  const fetchLeadership = useCallback(async () => {
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

      const publicLeaders = Array.isArray(
        response?.data
      )
        ? response.data
        : [];

      setLeaders(publicLeaders);

      return publicLeaders;
    } catch (err) {
      console.error(
        "Failed to load public leadership:",
        err
      );

      const message =
        err?.response?.data?.message ||
        "Unable to load leadership.";

      setError(message);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========================================================
     INITIAL LOAD
  ======================================================== */

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await leaderService.getPublicLeaders();

        if (!isMounted) return;

        const publicLeaders = Array.isArray(
          response?.data
        )
          ? response.data
          : [];

        setLeaders(publicLeaders);
      } catch (err) {
        console.error(
          "Failed to load public leadership:",
          err
        );

        if (!isMounted) return;

        setError(
          err?.response?.data?.message ||
            "Unable to load leadership."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  /* ========================================================
     PATRON

     Patron is identified by office/category.
  ======================================================== */

  const patron = useMemo(
    () =>
      leaders.find(
        (leader) =>
          leader.office === "patron" ||
          leader.category === "patronage"
      ) || null,
    [leaders]
  );

  /* ========================================================
     REGIONAL CABINET

     Structural level:
       regional_cabinet

     Functional category:
       executive
  ======================================================== */

  const executive = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level === "regional_cabinet" &&
            leader.category === "executive"
        )
        .sort(sortByDisplayOrder),
    [leaders]
  );

  /* ========================================================
     COUNCIL OF GOVERNORS
  ======================================================== */

  const councilOfGovernors = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level ===
            "council_of_governors"
        )
        .sort(sortByDisplayOrder),
    [leaders]
  );

  /* ========================================================
     REGIONAL YOUTH ASSEMBLY

     Structural level:
       regional_youth_assembly

     Functional category:
       legislative
  ======================================================== */

  const assembly = useMemo(
    () =>
      leaders
        .filter(
          (leader) =>
            leader.level ===
              "regional_youth_assembly" &&
            leader.category === "legislative"
        )
        .sort(sortByDisplayOrder),
    [leaders]
  );

   /* ========================================================
     COUNTY LEADERSHIP

     County Cabinet and County Youth Assembly are kept
     separate.

     IMPORTANT:
     County Governors are already stored under the
     Council of Governors. They are NOT duplicated in
     county_cabinet.

     The Governor is automatically injected into the
     beginning of the county Cabinet structure using
     the Council of Governors record.
  ======================================================== */

  const countyLeadership = useMemo(() => {
    const grouped = {};

    /*
     * First create county structures from actual
     * county leadership records.
     */
    leaders
      .filter(
        (leader) =>
          leader.level === "county_cabinet" ||
          leader.level ===
            "county_youth_assembly"
      )
      .forEach((leader) => {
        const county =
          leader.county ||
          leader.countyName ||
          "Other";

        if (!grouped[county]) {
          grouped[county] = {
            cabinet: [],
            assembly: [],
            governor: null,
          };
        }

        if (
          leader.level === "county_cabinet"
        ) {
          grouped[county].cabinet.push(leader);
        }

        if (
          leader.level ===
          "county_youth_assembly"
        ) {
          grouped[county].assembly.push(leader);
        }
      });

    /*
     * Add counties represented only in the Council
     * of Governors.
     *
     * This ensures a county still appears even when
     * it has no county cabinet/assembly records yet.
     */
    councilOfGovernors.forEach((governor) => {
      const county =
        governor.county ||
        governor.countyName ||
        governor?.member?.county;

      if (!county) return;

      if (!grouped[county]) {
        grouped[county] = {
          cabinet: [],
          assembly: [],
          governor: null,
        };
      }

      grouped[county].governor = governor;
    });

    /*
     * Sort the actual county structures first.
     */
    Object.values(grouped).forEach((county) => {
      county.cabinet.sort(sortByDisplayOrder);
      county.assembly.sort(sortByDisplayOrder);
    });

    /*
     * Automatically place the Governor FIRST in
     * the County Cabinet.
     *
     * We create a display structure without mutating
     * the original Council of Governors record.
     */
    Object.values(grouped).forEach((county) => {
      if (!county.governor) return;

      const governorId =
        county.governor?._id ||
        county.governor?.id ||
        county.governor?.slug;

      /*
       * Prevent accidental duplication if a Governor
       * was already entered in county_cabinet.
       */
      const filteredCabinet =
        county.cabinet.filter((leader) => {
          const leaderId =
            leader?._id ||
            leader?.id ||
            leader?.slug;

          return leaderId !== governorId;
        });

      county.cabinet = [
        {
          ...county.governor,

          /*
           * Mark this record so UI/components know
           * that the Governor came from the Council
           * of Governors.
           */
          isCountyGovernor: true,

          /*
           * Ensure the Governor remains first.
           */
          displayOrder: -1,

          /*
           * Present the Governor as part of the
           * County Cabinet structure.
           */
          level: "county_cabinet",
          category: "executive",
          position:
            county.governor.position ||
            "Youth Governor",
        },

        ...filteredCabinet,
      ];
    });

    return grouped;
  }, [leaders, councilOfGovernors]);

  /* ========================================================
     COUNTY SUMMARY

     Useful for the main Leadership page and future
     county navigation/cards.
  ======================================================== */

  const countySummary = useMemo(
    () =>
      Object.entries(countyLeadership).map(
        ([county, data]) => ({
          county,
          cabinetCount: data.cabinet.length,
          assemblyCount: data.assembly.length,
          total:
            data.cabinet.length +
            data.assembly.length,
        })
      ),
    [countyLeadership]
  );

  /* ========================================================
     CONTEXT VALUE
  ======================================================== */

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
   HOOK
========================================================== */

export function useLeadership() {
  const context = useContext(
    LeadershipContext
  );

  if (!context) {
    throw new Error(
      "useLeadership must be used within a LeadershipProvider"
    );
  }

  return context;
}

export default LeadershipContext;