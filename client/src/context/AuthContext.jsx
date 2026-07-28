import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import * as authService from "../services/auth.service";

import {
  hasPermission as checkPermission,
} from "../utils/permissions";

const AuthContext = createContext(null);

/* ==========================================================
   LOCAL STORAGE KEYS
========================================================== */

const TOKEN_KEY = "token";
const USER_KEY = "user";
const MEMBER_KEY = "member";

/* ==========================================================
   STORAGE HELPERS
========================================================== */

const readStoredJSON = (key) => {
  const storedValue = localStorage.getItem(key);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    localStorage.removeItem(key);
    return null;
  }
};

const saveStoredJSON = (key, value) => {
  if (!value) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
};

/* ==========================================================
   AUTH PROVIDER
========================================================== */

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);

  const [user, setUser] = useState(null);

  const [member, setMember] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshingMember, setRefreshingMember] =
    useState(false);

  /* ==========================================
     CLEAR AUTH STATE
  ========================================== */

  const clearAuthState = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(MEMBER_KEY);

    setToken(null);
    setUser(null);
    setMember(null);
  }, []);

  /* ==========================================
     SAVE AUTH STATE
  ========================================== */

  const saveAuthState = useCallback(
    ({
      token: newToken,
      user: newUser,
      member: newMember,
    }) => {
      if (newToken !== undefined) {
        if (newToken) {
          localStorage.setItem(
            TOKEN_KEY,
            newToken
          );
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }

        setToken(newToken || null);
      }

      if (newUser !== undefined) {
        saveStoredJSON(
          USER_KEY,
          newUser
        );

        setUser(newUser || null);
      }

      if (newMember !== undefined) {
        saveStoredJSON(
          MEMBER_KEY,
          newMember
        );

        setMember(newMember || null);
      }
    },
    []
  );

  /* ==========================================
     INITIALIZE AUTH
  ========================================== */

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken =
          localStorage.getItem(TOKEN_KEY);

        const storedUser =
          readStoredJSON(USER_KEY);

        const storedMember =
          readStoredJSON(MEMBER_KEY);

        setToken(storedToken || null);
        setUser(storedUser);
        setMember(storedMember);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /* ==========================================
     LOGIN
  ========================================== */

  const login = useCallback(
    async (credentials) => {
      const response =
        await authService.login(credentials);

      const data = response?.data;

      if (!data?.token) {
        throw new Error(
          "Login response did not include an authentication token."
        );
      }

      saveAuthState({
        token: data.token,
        user: data.user || null,
        member: data.member || null,
      });

      return data;
    },
    [saveAuthState]
  );

  /* ==========================================
     LOGOUT
  ========================================== */

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Clear the local session even when
      // the backend logout request fails.
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  /* ==========================================
     REFRESH MEMBER PROFILE
  ========================================== */

  const refreshMember = useCallback(async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return null;
    }

    try {
      setRefreshingMember(true);

      const response =
        await authService.getCurrentMember();

      const data = response?.data;

      if (!data) {
        throw new Error(
          "Member profile response was empty."
        );
      }

      /*
       * Supports either:
       *
       * response.data = {
       *   user,
       *   member
       * }
       *
       * or:
       *
       * response.data = {
       *   data: {
       *     user,
       *     member
       *   }
       * }
       */

      const profileData =
        data.data || data;

      const refreshedUser =
        profileData.user || null;

      const refreshedMember =
        profileData.member ||
        profileData.profile ||
        null;

      if (refreshedUser) {
        saveStoredJSON(
          USER_KEY,
          refreshedUser
        );

        setUser(refreshedUser);
      }

      if (refreshedMember) {
        saveStoredJSON(
          MEMBER_KEY,
          refreshedMember
        );

        setMember(refreshedMember);
      }

      return {
        user:
          refreshedUser || user,
        member:
          refreshedMember || member,
      };
    } catch (error) {
      console.error(
        "Unable to refresh member profile:",
        error
      );

      if (error?.response?.status === 401) {
        clearAuthState();
      }

      throw error;
    } finally {
      setRefreshingMember(false);
    }
  }, [
    clearAuthState,
    member,
    user,
  ]);

  /*
   * Payment.jsx currently calls refreshProfile().
   * This alias allows that page to work without
   * changing its imports or function call.
   */
  const refreshProfile = refreshMember;

  /* ==========================================
     UPDATE USER
  ========================================== */

  const updateUser = useCallback(
    (userData) => {
      setUser((currentUser) => {
        const updatedUser = {
          ...(currentUser || {}),
          ...userData,
        };

        saveStoredJSON(
          USER_KEY,
          updatedUser
        );

        return updatedUser;
      });
    },
    []
  );

  /* ==========================================
     UPDATE MEMBER
  ========================================== */

  const updateMember = useCallback(
    (memberData) => {
      setMember((currentMember) => {
        const updatedMember = {
          ...(currentMember || {}),
          ...memberData,
        };

        saveStoredJSON(
          MEMBER_KEY,
          updatedMember
        );

        return updatedMember;
      });
    },
    []
  );

  /* ==========================================
     PERMISSIONS
  ========================================== */

  const hasPermission = useCallback(
    (permission) => {
      if (!user?.role) {
        return false;
      }

      return checkPermission(
        user.role,
        permission
      );
    },
    [user?.role]
  );

  /* ==========================================
     AUTH STATE
  ========================================== */

  const role =
    user?.role ?? "member";

  const isAuthenticated =
    Boolean(token) &&
    Boolean(user);

  const isAdmin =
    role !== "member";

  /* ==========================================
     MEMBERSHIP STATE
  ========================================== */

  const membershipStatus =
    member?.membershipStatus ||
    "inactive";

  const membershipType =
    member?.membershipType ||
    "ordinary";

  const membershipNumber =
    member?.memberNumber || "";

  const membershipActive =
    membershipStatus === "active";

  const needsPayment =
    membershipStatus ===
    "pending_payment";

  const membershipExpired =
    membershipStatus === "expired";

  const membershipInactive =
    membershipStatus === "inactive";

  const membershipFeePaid =
    member?.membershipFeePaid ??
    false;

  const canAccessDashboard =
    membershipActive &&
    membershipFeePaid;

  /* ==========================================
     PROVIDER VALUE
  ========================================== */

  const contextValue = useMemo(
    () => ({
      /* Authentication */

      token,
      user,
      member,

      loading,
      refreshingMember,

      role,

      isAuthenticated,
      isAdmin,

      /* Membership */

      membershipStatus,
      membershipType,
      membershipNumber,

      membershipFeePaid,

      membershipActive,
      membershipInactive,
      membershipExpired,
      needsPayment,

      canAccessDashboard,

      /* Permissions */

      hasPermission,

      /* Actions */

      login,
      logout,

      refreshMember,
      refreshProfile,

      updateUser,
      updateMember,
    }),
    [
      token,
      user,
      member,
      loading,
      refreshingMember,
      role,
      isAuthenticated,
      isAdmin,
      membershipStatus,
      membershipType,
      membershipNumber,
      membershipFeePaid,
      membershipActive,
      membershipInactive,
      membershipExpired,
      needsPayment,
      canAccessDashboard,
      hasPermission,
      login,
      logout,
      refreshMember,
      refreshProfile,
      updateUser,
      updateMember,
    ]
  );

  return (
    <AuthContext.Provider
      value={contextValue}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ==========================================================
   USE AUTH
========================================================== */

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}

export default AuthContext;