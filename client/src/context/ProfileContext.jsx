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
  uploadProfilePhoto,
} from "../services/member.service";

/* ==========================================================
   CONTEXT
========================================================== */

const ProfileContext = createContext(null);

/* ==========================================================
   PROVIDER
========================================================== */

export function ProfileProvider({ children }) {
  /* ==========================================
     STATE
  ========================================== */

  const [profile, setProfile] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  /* ==========================================
     LOAD PROFILE
  ========================================== */

  const loadProfile = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

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
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

    /* ==========================================
     UPDATE PROFILE PHOTO
  ========================================== */

  const updateProfilePhoto = useCallback(
    async (file) => {

      if (!file) {
        throw new Error(
          "Please select a profile photo."
        );
      }

      const response =
        await uploadProfilePhoto(file);

      /*
      Backend returns:
      {
        success: true,
        data: updatedMember
      }
      */

      const updatedProfile =
        response.data;

      setProfile((previousProfile) => ({

        ...previousProfile,

        ...updatedProfile,

      }));

      return updatedProfile;

    },
    []
  );

  /* ==========================================
     INITIAL LOAD
  ========================================== */

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  /* ==========================================
     DERIVED DATA
  ========================================== */

  const fullName = useMemo(() => {
    if (!profile) return "";

    return [
      profile.firstName,
      profile.middleName,
      profile.lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }, [profile]);

  const initials = useMemo(() => {
    if (!profile) return "";

    return `${profile.firstName?.charAt(0) || ""}${
      profile.lastName?.charAt(0) || ""
    }`.toUpperCase();
  }, [profile]);

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
    profile?.membershipFeePaid ?? false;

  const membershipExpiry =
    profile?.membershipExpiry || null;

  const joinedDate =
    profile?.joinedAt ||
    profile?.createdAt ||
    null;

  const county =
    profile?.county || "";

  const constituency =
    profile?.constituency || "";

  const ward =
    profile?.ward || "";

  const phone =
    profile?.phone || "";

  const email =
    profile?.user?.email || "";

  const role =
    profile?.user?.role || "member";

  const isActive =
    profile?.user?.isActive ?? false;

  /* ==========================================
     PROFILE COMPLETION
  ========================================== */

  const completionFields = [
    profilePhoto,
    profile?.occupation,
    phone,
    profile?.dateOfBirth,
    county,
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

  /* ==========================================
     CONTEXT VALUE
  ========================================== */

  const value = useMemo(
    () => ({
      /* Raw */

      profile,

      setProfile,

      /* Status */

      loading,

      error,

      /* Actions */

      reloadProfile:
        loadProfile,
        updateProfilePhoto,

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

      /* Location */

      county,

      constituency,

      ward,

      /* User */

      role,

      isActive,

      /* Profile */

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
      updateProfilePhoto,
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
      county,
      constituency,
      ward,
      role,
      isActive,
      profilePhoto,
      profileCompletion,
      isProfileComplete,
    ]
  );

  return (
    <ProfileContext.Provider
      value={value}
    >
      {children}
    </ProfileContext.Provider>
  );
}

/* ==========================================================
   HOOK
========================================================== */

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