import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import leaderService from "../services/leader.service";

const LeadershipDashboardContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

export function LeadershipDashboardProvider({
  children,
}) {
  const [summary, setSummary] = useState(null);

  const [distribution, setDistribution] =
    useState(null);

  const [members, setMembers] = useState([]);

  const [pagination, setPagination] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: "",
    membershipStatus: "",
    membershipType: "",
    sort: "-createdAt",
  });

  /* ==========================================================
     LOAD DASHBOARD
  ========================================================== */

  const loadDashboard = useCallback(
    async (currentFilters) => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await leaderService.getLeadershipDashboard(
            currentFilters
          );

        const data = response.data;

        setSummary(data.summary);

        setDistribution(data.distribution);

        setMembers(data.members);

        setPagination(data.pagination);
      } catch (err) {
        console.error(err);

        setError(
          err.response?.data?.message ||
            "Failed to load leadership dashboard."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /* ==========================================================
     LOAD / FILTER CHANGES
  ========================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, loadDashboard]);

  /* ==========================================================
     FILTERS
  ========================================================== */

  const updateFilters = useCallback((updates) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 20,
      search: "",
      membershipStatus: "",
      membershipType: "",
      sort: "-createdAt",
    });
  }, []);

  /* ==========================================================
     RELOAD
  ========================================================== */

  const reloadDashboard = useCallback(() => {
    loadDashboard(filters);
  }, [filters, loadDashboard]);

  /* ==========================================================
     CONTEXT VALUE
  ========================================================== */

  const value = useMemo(
    () => ({
      summary,
      distribution,
      members,
      pagination,

      loading,
      error,

      filters,

      updateFilters,
      resetFilters,

      reloadDashboard,
    }),
    [
      summary,
      distribution,
      members,
      pagination,

      loading,
      error,

      filters,

      updateFilters,
      resetFilters,

      reloadDashboard,
    ]
  );

  return (
    <LeadershipDashboardContext.Provider
      value={value}
    >
      {children}
    </LeadershipDashboardContext.Provider>
  );
}

/* ==========================================================
   CUSTOM HOOK
========================================================== */

export function useLeadershipDashboard() {
  const context = useContext(
    LeadershipDashboardContext
  );

  if (!context) {
    throw new Error(
      "useLeadershipDashboard must be used inside LeadershipDashboardProvider."
    );
  }

  return context;
}

export default LeadershipDashboardContext;