import User from "../models/User.js";
import Member from "../models/Member.js";
import Leader from "../models/leader.model.js";

/* ==========================================================
   DISPLAY FORMATTERS
========================================================== */

const formatDirectoryLabel = (value = "") => {
  return String(value)
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const getPrimaryLeadership = (leadership = []) => {
  if (!Array.isArray(leadership) || !leadership.length) {
    return null;
  }

  return leadership[0];
};


/* ==========================================================
   MEETING DIRECTORY
========================================================== */

/**
 * Return activated JVP Connect users who can be invited
 * to meetings.
 *
 * Both ordinary members and leaders are included.
 */
export const getMeetingDirectory = async ({
  page = 1,
  limit = 20,
  search = "",
  county = "",
  constituency = "",
  ward = "",
  leadershipOnly = false,
  excludeUserId = null,
} = {}) => {
  const currentPage = Math.max(Number(page) || 1, 1);

  const pageLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (currentPage - 1) * pageLimit;

  const normalizedSearch = String(search || "").trim();

  /* ----------------------------------------------------------
     FIND ACTIVE USERS
  ---------------------------------------------------------- */

  const userFilter = {
    isActive: true,
  };

  if (excludeUserId) {
    userFilter._id = {
      $ne: excludeUserId,
    };
  }

  const activeUsers = await User.find(userFilter)
    .select("_id email role isActive emailVerified")
    .lean();

  if (!activeUsers.length) {
    return {
      users: [],
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total: 0,
        pages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
  }

  const activeUserIds = activeUsers.map(
    (user) => user._id
  );

  const userMap = new Map(
    activeUsers.map((user) => [
      String(user._id),
      user,
    ])
  );

  /* ----------------------------------------------------------
     MATCH EMAIL SEARCHES
  ---------------------------------------------------------- */

  const emailMatchingUserIds = normalizedSearch
    ? activeUsers
        .filter((user) =>
          String(user.email || "")
            .toLowerCase()
            .includes(normalizedSearch.toLowerCase())
        )
        .map((user) => user._id)
    : [];

  /* ----------------------------------------------------------
     MEMBER FILTER
  ---------------------------------------------------------- */

  const memberFilter = {
    user: {
      $in: activeUserIds,
    },
    accountActivated: true,
    membershipStatus: "active",
  };

  if (county) {
    memberFilter.county = {
      $regex: `^${escapeRegex(county)}$`,
      $options: "i",
    };
  }

  if (constituency) {
    memberFilter.constituency = {
      $regex: `^${escapeRegex(constituency)}$`,
      $options: "i",
    };
  }

  if (ward) {
    memberFilter.ward = {
      $regex: `^${escapeRegex(ward)}$`,
      $options: "i",
    };
  }

  if (normalizedSearch) {
    const searchRegex = new RegExp(
      escapeRegex(normalizedSearch),
      "i"
    );

    memberFilter.$or = [
      {
        firstName: searchRegex,
      },
      {
        middleName: searchRegex,
      },
      {
        lastName: searchRegex,
      },
      {
        memberNumber: searchRegex,
      },
      {
        phone: searchRegex,
      },
      {
        county: searchRegex,
      },
      {
        constituency: searchRegex,
      },
      {
        ward: searchRegex,
      },
    ];

    if (emailMatchingUserIds.length) {
      memberFilter.$or.push({
        user: {
          $in: emailMatchingUserIds,
        },
      });
    }
  }

  /* ----------------------------------------------------------
     LEADERSHIP-ONLY FILTER
  ---------------------------------------------------------- */

  if (
    leadershipOnly === true ||
    leadershipOnly === "true"
  ) {
    const activeLeadershipRecords = await Leader.find({
      status: "active",
      isActive: true,
    })
      .select("member")
      .lean();

    const leaderMemberIds = activeLeadershipRecords.map(
      (leader) => leader.member
    );

    memberFilter._id = {
      $in: leaderMemberIds,
    };
  }

  /* ----------------------------------------------------------
     PAGINATION
  ---------------------------------------------------------- */

  const [members, total] = await Promise.all([
    Member.find(memberFilter)
      .select(
        [
          "user",
          "firstName",
          "middleName",
          "lastName",
          "profilePhoto",
          "memberNumber",
          "phone",
          "county",
          "constituency",
          "ward",
          "membershipType",
          "membershipStatus",
          "accountActivated",
        ].join(" ")
      )
      .sort({
        firstName: 1,
        lastName: 1,
      })
      .skip(skip)
      .limit(pageLimit)
      .lean(),

    Member.countDocuments(memberFilter),
  ]);

  if (!members.length) {
    return {
      users: [],
      pagination: {
        page: currentPage,
        limit: pageLimit,
        total,
        pages: Math.ceil(total / pageLimit),
        hasNextPage: false,
        hasPreviousPage: currentPage > 1,
      },
    };
  }

  /* ----------------------------------------------------------
     FETCH LEADERSHIP RECORDS
  ---------------------------------------------------------- */

  const memberIds = members.map(
    (member) => member._id
  );

  const leadershipRecords = await Leader.find({
    member: {
      $in: memberIds,
    },
    status: "active",
    isActive: true,
  })
    .select(
      [
        "member",
        "category",
        "position",
        "department",
        "scope",
        "county",
        "constituency",
        "ward",
        "appointmentType",
      ].join(" ")
    )
    .sort({
      displayOrder: 1,
    })
    .lean();

  const leadershipMap = new Map();

  leadershipRecords.forEach((leadership) => {
    const memberId = String(leadership.member);

    if (!leadershipMap.has(memberId)) {
      leadershipMap.set(memberId, []);
    }

    leadershipMap.get(memberId).push({
      leadershipId: leadership._id,
      category: leadership.category,
      position: leadership.position,
      department: leadership.department,
      scope: leadership.scope,
      county: leadership.county,
      constituency: leadership.constituency,
      ward: leadership.ward,
      appointmentType: leadership.appointmentType,
    });
  });

  /* ----------------------------------------------------------
     BUILD DIRECTORY RESPONSE
  ---------------------------------------------------------- */

  const directoryUsers = members
    .map((member) => {
      const user = userMap.get(
        String(member.user)
      );

      if (!user) {
        return null;
      }

      const leadership =
  leadershipMap.get(String(member._id)) || [];

const primaryLeadership =
  getPrimaryLeadership(leadership);

const isLeader = leadership.length > 0;

const displayPosition = primaryLeadership
  ? formatDirectoryLabel(
      primaryLeadership.position
    )
  : "";

const displayCategory = primaryLeadership
  ? formatDirectoryLabel(
      primaryLeadership.category
    )
  : "";

const displayLeadership = isLeader
  ? [displayPosition, displayCategory]
      .filter(Boolean)
      .join(" — ")
  : "Member";

const fullName = [
  member.firstName,
  member.middleName,
  member.lastName,
]
  .filter(Boolean)
  .join(" ")
  .replace(/\s+/g, " ")
  .trim();

      return {
        userId: user._id,
        memberId: member._id,

        fullName,
        firstName: member.firstName,
        middleName: member.middleName || "",
        lastName: member.lastName,

        email: user.email,
        phone: member.phone || "",

        profilePhoto: member.profilePhoto || "",
        memberNumber: member.memberNumber || "",

        county: member.county || "",
        constituency: member.constituency || "",
        ward: member.ward || "",

        membershipType: member.membershipType,
        membershipStatus: member.membershipStatus,

        userRole: user.role,
        emailVerified: Boolean(
          user.emailVerified
        ),

       isLeader,

displayPosition,
displayCategory,
displayLeadership,

leadership,
      };
    })
    .filter(Boolean);

  const pages = Math.ceil(total / pageLimit);

  return {
    users: directoryUsers,

    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      pages,
      hasNextPage: currentPage < pages,
      hasPreviousPage: currentPage > 1,
    },
  };
};

/* ==========================================================
   REGEX UTILITY
========================================================== */

const escapeRegex = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};