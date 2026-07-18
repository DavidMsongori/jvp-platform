import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  getMyProfile,
} from "../services/member.service";

/* ==========================================
   CONTEXT
========================================== */

const ProfileContext = createContext(null);

/* ==========================================
   PROVIDER
========================================== */

export function ProfileProvider({ children }) {
  /* ======================================
     STATE
  ====================================== */

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ======================================
     LOAD PROFILE
  ====================================== */

  const loadProfile = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      setError("");

      const response = await getMyProfile();

      setProfile(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
        "Unable to load profile."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  /* ======================================
     INITIAL LOAD
  ====================================== */

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ======================================
     COMPUTED VALUES
  ====================================== */

  const fullName = profile
    ? [
        profile.firstName,
        profile.middleName,
        profile.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  const initials = profile
    ? `${profile.firstName?.charAt(0) || ""}${profile.lastName?.charAt(0) || ""}`.toUpperCase()
    : "";

  const memberNumber =
    profile?.memberNumber ||
    profile?.membershipNumber ||
    "";

  const profilePhoto =
    profile?.profilePhoto || null;

  const membershipStatus =
    profile?.membershipStatus || "";

  const membershipType =
    profile?.membershipType || "";

  const membershipFeePaid =
    profile?.membershipFeePaid || false;

  const membershipExpiry =
    profile?.membershipExpiry || null;

  const joinedDate =
    profile?.joinedAt || null;

  const county =
    profile?.county || "";

  const phone =
    profile?.phone || "";

  const email =
    profile?.user?.email || "";

  const role =
    profile?.user?.role || "member";

  const isActive =
    profile?.user?.isActive || false;

  /* ======================================
     PROFILE COMPLETION
  ====================================== */

  const completionFields = [
    profilePhoto,
    profile?.occupation,
    phone,
    profile?.dateOfBirth,
    county,
  ];

  const completedFields =
    completionFields.filter(Boolean).length;

  const profileCompletion = Math.round(
    (completedFields /
      completionFields.length) *
      100
  );

  const isProfileComplete =
    profileCompletion === 100;

  /* ======================================
     CONTEXT VALUE
  ====================================== */

  const value = useMemo(
    () => ({
      /* Raw Profile */

      profile,
      setProfile,

      /* Status */

      loading,
      error,

      /* Actions */

      reloadProfile: loadProfile,

      /* Identity */

      fullName,
      initials,
      memberNumber,

      /* Contact */

      email,
      phone,

      /* Membership */

      membershipStatus,
      membershipType,
      membershipFeePaid,
      membershipExpiry,
      joinedDate,

      /* User */

      role,
      isActive,

      /* Profile */

      county,
      profilePhoto,

      /* Completion */

      profileCompletion,
      isProfileComplete,
    }),
    [
      profile,
      loading,
      error,
      loadProfile,
      fullName,
      initials,
      memberNumber,
      email,
      phone,
      membershipStatus,
      membershipType,
      membershipFeePaid,
      membershipExpiry,
      joinedDate,
      role,
      isActive,
      county,
      profilePhoto,
      profileCompletion,
      isProfileComplete,
    ]
  );

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
}

/* ==========================================
   HOOK
========================================== */

export function useProfile() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error(
      "useProfile must be used inside ProfileProvider."
    );
  }

  return context;
}

export default ProfileContext;