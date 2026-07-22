import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import { getDashboard } from "../services/member.service";

/* ==========================================================
   CONTEXT
========================================================== */

const DashboardContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

export function DashboardProvider({ children }) {
  /* ==========================================
     STATE
  ========================================== */

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ==========================================
     LOAD DASHBOARD
  ========================================== */

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDashboard();

      setDashboard(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* ==========================================
     INITIAL LOAD
  ========================================== */

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /* ==========================================
     DERIVED DATA
  ========================================== */

  const member = dashboard?.member ?? null;

  const leadership = dashboard?.leadership ?? null;

  const summary = dashboard?.summary ?? {};

  const statistics = dashboard?.statistics ?? {};

  const completion = dashboard?.completion ?? {};

  const events = dashboard?.events ?? [];

  const notifications = dashboard?.notifications ?? [];

  const news = dashboard?.news ?? [];

  const recentActivity = dashboard?.recentActivity ?? [];

  /* ==========================================
     LEADERSHIP HELPERS
  ========================================== */

  const isLeader = leadership?.isLeader ?? false;

  const leaderId = leadership?.leaderId ?? null;

  const position = leadership?.position ?? null;

  const category = leadership?.category ?? null;

  const leadershipStatus = leadership?.status ?? null;

  /* ==========================================
     CONTEXT VALUE
  ========================================== */

  const value = useMemo(
    () => ({
      dashboard,

      member,

      leadership,

      isLeader,

      leaderId,

      position,

      category,

      leadershipStatus,

      summary,

      statistics,

      completion,

      events,

      notifications,

      news,

      recentActivity,

      loading,

      error,

      reloadDashboard: loadDashboard,
    }),
    [
      dashboard,
      member,
      leadership,
      isLeader,
      leaderId,
      position,
      category,
      leadershipStatus,
      summary,
      statistics,
      completion,
      events,
      notifications,
      news,
      recentActivity,
      loading,
      error,
      loadDashboard,
    ]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

/* ==========================================================
   HOOK
========================================================== */

export function useDashboard() {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error(
      "useDashboard must be used inside DashboardProvider."
    );
  }

  return context;
}

export default DashboardContext;