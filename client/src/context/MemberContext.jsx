import { createContext, useContext, useState } from "react";

const MemberContext = createContext();

export function MemberProvider({ children }) {
  const [member, setMember] = useState({
    /* ===========================
       ACCOUNT
    ============================ */

    legacyMember: false,
    migrationCompleted: false,
    profileCompleted: false,

    role: "member",
    membershipNumber: "",
    membershipStatus: "Pending",
    paymentStatus: "Pending",
    memberSince: "",

    /* ===========================
       PERSONAL
    ============================ */

    firstName: "",
    middleName: "",
    lastName: "",

    gender: "",
    dob: "",

    nationalId: "",

    phone: "",
    email: "",

    profilePhoto: "",

    /* ===========================
       LOCATION
    ============================ */

    county: "",
    constituency: "",
    ward: "",
    village: "",

    /* ===========================
       EDUCATION
    ============================ */

    institution: "",
    course: "",
    level: "",
    graduationYear: "",
    studentRegistrationNumber: "",

    /* ===========================
       EMPLOYMENT
    ============================ */

    occupation: "",
    employer: "",
    employmentStatus: "",
    businessName: "",
    yearsExperience: "",

    /* ===========================
       LEADERSHIP
    ============================ */

    leadershipExperience: "",
    leadershipPosition: "",
    leadershipOrganization: "",

    /* ===========================
       SKILLS
    ============================ */

    skills: [],
    interests: [],
    languages: [],

    bio: "",

    /* ===========================
       SOCIAL MEDIA
    ============================ */

    facebook: "",
    instagram: "",
    linkedin: "",
    x: "",
    tiktok: "",

    /* ===========================
       SYSTEM
    ============================ */

    createdAt: "",
    updatedAt: "",
  });

  return (
    <MemberContext.Provider
      value={{
        member,
        setMember,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  return useContext(MemberContext);
}

export default MemberContext;