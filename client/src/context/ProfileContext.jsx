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

export function ProfileProvider({
  children,
}) {

  /* ======================================
     STATE
  ====================================== */

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* ======================================
     LOAD PROFILE
  ====================================== */

  const loadProfile = useCallback(async () => {

    try {

      setLoading(true);

      setError("");

      const response =
        await getMyProfile();

      setProfile(response.data);

    } catch (err) {

      console.error(err);

      setError(

        err.response?.data?.message ||

        "Unable to load profile."

      );

    } finally {

      setLoading(false);

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

    ? `${

        profile.firstName?.charAt(0) || ""

      }${

        profile.lastName?.charAt(0) || ""

      }`.toUpperCase()

    : "";

  const memberNumber =

    profile?.memberNumber ||

    profile?.membershipNumber ||

    "";

  const joinedDate =

    profile?.joinedAt ||

    null;

  /* ======================================
     PROFILE COMPLETION
  ====================================== */

  const completionFields = [

    profile?.profilePhoto,

    profile?.occupation,

    profile?.phone,

    profile?.dateOfBirth,

    profile?.county,

  ];

  const completedFields =

    completionFields.filter(Boolean).length;

  const profileCompletion =

    Math.round(

      (completedFields /

        completionFields.length) *

      100

    );

  const isProfileComplete =

    profileCompletion === 100;

  /* ======================================
     CONTEXT VALUE
  ====================================== */

  const value = useMemo(() => ({

    /* Profile */

    profile,

    setProfile,

    /* Status */

    loading,

    error,

    /* Actions */

    reloadProfile:

      loadProfile,

    /* Computed */

    fullName,

    initials,

    profilePhoto:

      profile?.profilePhoto || null,

    membershipStatus:

      profile?.membershipStatus || "",

    memberNumber,

    joinedDate,

    profileCompletion,

    isProfileComplete,

  }), [

    profile,

    loading,

    error,

    loadProfile,

    fullName,

    initials,

    memberNumber,

    joinedDate,

    profileCompletion,

    isProfileComplete,

  ]);

  return (

    <ProfileContext.Provider
      value={value}
    >

      {children}

    </ProfileContext.Provider>

  );

}

/* ==========================================
   HOOK
========================================== */

export function useProfile() {

  const context =
    useContext(ProfileContext);

  if (!context) {

    throw new Error(

      "useProfile must be used inside ProfileProvider."

    );

  }

  return context;

}

export default ProfileContext;