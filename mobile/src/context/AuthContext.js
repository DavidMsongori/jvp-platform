
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import * as SecureStore from "expo-secure-store";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const hasActiveMembership =
    member?.membershipFeePaid === true &&
    member?.membershipStatus === "active";

  const requiresMembershipPayment =
    Boolean(member) && !hasActiveMembership;

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentMember();

      if (!response?.success || !response?.data) {
        throw new Error("Unable to retrieve member information.");
      }

      const data = response.data;
      const memberData = data.member || data;

      setMember(memberData);
      setUser(data.user || memberData.user || null);

      return memberData;
    } catch (error) {
      setUser(null);
      setMember(null);
      await SecureStore.deleteItemAsync("token");
      throw error;
    }
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await authService.login(credentials);

    if (!response?.success || !response?.data?.token) {
      throw new Error(response?.message || "Login failed.");
    }

    const data = response.data;

    setUser(data.user || data.member?.user || null);
    setMember(data.member || null);

    return response;
  }, []);

  const completeAuthentication = useCallback((response) => {
    if (!response?.data?.token) {
      throw new Error("Authentication token was not received.");
    }

    const data = response.data;

    setUser(data.user || data.member?.user || null);
    setMember(data.member || null);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setMember(null);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (token) {
          await refreshUser();
        }
      } catch (error) {
        console.log("Session restoration:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [refreshUser]);

  const value = {
    user,
    member,
    isLoading,
    isAuthenticated: Boolean(member),
    hasActiveMembership,
    requiresMembershipPayment,
    signIn,
    signOut,
    refreshUser,
    completeAuthentication,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
