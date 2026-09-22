import mongoose from "mongoose";

import Member from "../models/Member.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import EventRegistration from "../models/eventRegistration.model.js";

import AppError from "../utils/AppError.js";

import {
  logActivity,
  searchActivity,
  ACTIVITY,
  ACTIVITY_MODULES,
  TARGET_TYPES,
} from "../utils/activity.js";


/* ==========================================================
   MEMBER QUERY HELPERS
========================================================== */

/**
 * Genuine JVP Connect members.
 *
 * A member is counted in the active/current membership
 * population when they are either:
 *
 * 1. An imported/old member who activated their account
 * 2. A new member who successfully paid and is active
 *
 * This definition is shared with the Admin Dashboard.
 */
const genuineMemberFilter = {
  $or: [
    {
      source: "imported",
      accountActivated: true,
    },
    {
      source: "new",
      membershipStatus: "active",
      membershipFeePaid: true,
    },
  ],
};


/* ==========================================================
   GET MEMBERS
========================================================== */

export const getMembers = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    county,
    membershipStatus,
    membershipType,
    role,
    isActive,
    emailVerified,
    sortBy = "createdAt",
    order = "desc",
  } = query;

  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.max(Number(limit), 1);

  /* ======================================================
     USER FILTERS
  ====================================================== */

  const userFilters = {};

  if (role) {
    userFilters.role = role;
  }

  if (isActive !== undefined) {
    userFilters.isActive =
      isActive === "true";
  }

  if (emailVerified !== undefined) {
    userFilters.emailVerified =
      emailVerified === "true";
  }

  /* ======================================================
     MEMBER FILTERS
  ====================================================== */

  /*
   * Only genuine/current JVP Connect members appear
   * in the main Members table.
   */
  const memberFilters = {
    ...genuineMemberFilter,
  };

  if (county) {
    memberFilters.county = county;
  }

  if (membershipStatus) {
    memberFilters.membershipStatus =
      membershipStatus;
  }

  if (membershipType) {
    memberFilters.membershipType =
      membershipType;
  }

  /* ======================================================
     SEARCH
  ====================================================== */

  if (search.trim()) {
    memberFilters.$and = [
      genuineMemberFilter,
      {
        $or: [
          {
            firstName: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            middleName: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            lastName: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            memberNumber: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            nationalId: {
              $regex: search.trim(),
              $options: "i",
            },
          },
          {
            phone: {
              $regex: search.trim(),
              $options: "i",
            },
          },
        ],
      },
    ];

    /*
     * Remove the top-level $or because the $and now
     * contains the complete membership definition.
     */
    delete memberFilters.$or;
  }

  /* ======================================================
     SORT
  ====================================================== */

  const sort = {
    [sortBy]:
      order === "asc"
        ? 1
        : -1,
  };

  /* ======================================================
     TOTAL
  ====================================================== */

  const total =
    await Member.countDocuments(
      memberFilters
    );

  /* ======================================================
     MEMBERS
  ====================================================== */

  const members =
    await Member.find(memberFilters)
      .populate({
        path: "user",
        select: `
          email
          role
          isActive
          emailVerified
          createdAt
        `,
        match: userFilters,
      })
      .sort(sort)
      .skip(
        (pageNumber - 1) *
          pageSize
      )
      .limit(pageSize)
      .lean();

  /*
   * When user filters are applied through populate(),
   * members whose user does not match are removed.
   */
  const filteredMembers =
    members.filter(
      (member) => member.user
    );

  /* ======================================================
     SUMMARY
  ====================================================== */

  const [
    activatedMembers,
    importedMembers,
    newMembers,
    expiredMembers,
  ] = await Promise.all([
    /*
     * Imported members who activated their accounts.
     */
    Member.countDocuments({
      source: "imported",
      accountActivated: true,
    }),

    /*
     * Imported members still awaiting activation.
     */
    Member.countDocuments({
      source: "imported",
      accountActivated: false,
    }),

    /*
     * New members who actually paid and became active.
     */
    Member.countDocuments({
      source: "new",
      membershipStatus: "active",
      membershipFeePaid: true,
    }),

    /*
     * Expired memberships.
     */
    Member.countDocuments({
      membershipStatus: "expired",
    }),
  ]);

  /*
   * Total members follows the same definition as
   * the Admin Dashboard.
   */
  const totalMembers =
    activatedMembers +
    newMembers;

  const summary = {
    totalMembers,

    activatedMembers,

    importedMembers,

    newMembers,

    expiredMembers,
  };

  /* ======================================================
     RESPONSE
  ====================================================== */

  return {
    summary,

    members: filteredMembers,

    pagination: {
      page: pageNumber,

      limit: pageSize,

      total,

      totalPages:
        Math.ceil(
          total / pageSize
        ),

      hasNextPage:
        pageNumber <
        Math.ceil(
          total / pageSize
        ),

      hasPreviousPage:
        pageNumber > 1,
    },
  };
};


/* ==========================================================
   GET MEMBER BY ID
========================================================== */

export const getMemberById = async (
  memberId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const member =
    await Member.findById(
      memberId
    )
      .populate(
        "user",
        `
        email
        role
        isActive
        emailVerified
        createdAt
        updatedAt
        `
      )
      .lean();

  if (!member) {
    throw new AppError(
      "Member not found.",
      404
    );
  }

  return member;
};


/* ==========================================================
   GET COMPLETE MEMBER PROFILE
========================================================== */

export const getMemberProfile = async (
  memberId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const member =
    await Member.findById(
      memberId
    )
      .populate(
        "user",
        `
        email
        role
        isActive
        emailVerified
        createdAt
        updatedAt
        `
      )
      .lean();

  if (!member) {
    throw new AppError(
      "Member not found.",
      404
    );
  }

  const [
    payments,
    registrations,
    activities,
  ] = await Promise.all([
    Payment.find({
      member: member._id,
    })
      .sort({
        createdAt: -1,
      })
      .lean(),

    EventRegistration.find({
      member: member._id,
      isDeleted: false,
    })
      .populate(
        "event",
        `
        title
        slug
        startDate
        endDate
        location
        venue
        banner
        `
      )
      .populate(
        "payment",
        `
        amount
        status
        paymentMethod
        reference
        paidAt
        `
      )
      .sort({
        registrationDate: -1,
      })
      .lean(),

    (async () => {
      const [
        memberActivities,
        userActivities,
      ] = await Promise.all([
        searchActivity(
          {
            targetType:
              TARGET_TYPES.MEMBER,
            targetId:
              member._id,
          },
          {
            limit: 100,
          }
        ),

        searchActivity(
          {
            targetType:
              TARGET_TYPES.USER,
            targetId:
              member.user?._id,
          },
          {
            limit: 100,
          }
        ),
      ]);

      return [
        ...memberActivities,
        ...userActivities,
      ].sort(
        (a, b) =>
          new Date(b.createdAt) -
          new Date(a.createdAt)
      );
    })(),
  ]);

  /* ======================================================
     PAYMENT SUMMARY
  ====================================================== */

  const paymentSummary =
    payments.reduce(
      (summary, payment) => {
        /*
         * Only successful payments are treated as
         * completed payments.
         */
        if (
          payment.status ===
          "successful"
        ) {
          summary.totalPayments++;

          summary.successfulPayments++;

          summary.totalAmountPaid +=
            Number(payment.amount || 0);
        }

        if (
          payment.status ===
          "pending"
        ) {
          summary.pendingPayments++;
        }

        if (
          payment.status ===
          "failed"
        ) {
          summary.failedPayments++;
        }

        return summary;
      },
      {
        totalPayments: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalAmountPaid: 0,
      }
    );

  /* ======================================================
     EVENT SUMMARY
  ====================================================== */

  const eventSummary =
    registrations.reduce(
      (summary, registration) => {
        summary.totalRegistrations++;

        if (
          registration.registrationStatus ===
          "confirmed"
        ) {
          summary.confirmedRegistrations++;
        }

        if (
          registration.attendanceStatus ===
          "attended"
        ) {
          summary.attendedEvents++;
        }

        if (
          registration.checkedIn
        ) {
          summary.checkedInEvents++;
        }

        if (
          registration.certificateIssued
        ) {
          summary.certificatesIssued++;
        }

        return summary;
      },
      {
        totalRegistrations: 0,
        confirmedRegistrations: 0,
        attendedEvents: 0,
        checkedInEvents: 0,
        certificatesIssued: 0,
      }
    );

  /* ======================================================
     ACCOUNT
  ====================================================== */

  const account =
    member.user
      ? {
          email:
            member.user.email,

          role:
            member.user.role,

          isActive:
            member.user.isActive,

          emailVerified:
            member.user.emailVerified,

          createdAt:
            member.user.createdAt,

          updatedAt:
            member.user.updatedAt,
        }
      : null;

  /* ======================================================
     MEMBER SUMMARY
  ====================================================== */

  const summary = {
    memberSince:
      member.createdAt,

    membershipStatus:
      member.membershipStatus,

    membershipType:
      member.membershipType,

    membershipFeePaid:
      member.membershipFeePaid,

    accountActivated:
      member.accountActivated,

    payments:
      paymentSummary,

    events:
      eventSummary,

    totalActivities:
      activities.length,
  };

  /* ======================================================
     RESPONSE
  ====================================================== */

  return {
    member,

    account,

    payments: {
      summary:
        paymentSummary,
      items:
        payments,
    },

    events: {
      summary:
        eventSummary,
      items:
        registrations,
    },

    activity: {
      total:
        activities.length,
      items:
        activities,
    },

    summary,
  };
};


/* ==========================================================
   UPDATE MEMBER
========================================================== */

export const updateMember = async (
  memberId,
  payload,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const member =
          await Member.findById(
            memberId
          ).session(session);

        if (!member) {
          throw new AppError(
            "Member not found.",
            404
          );
        }

        const editableFields = [
          "firstName",
          "middleName",
          "lastName",
          "gender",
          "phone",
          "dateOfBirth",
          "county",
          "subCounty",
          "ward",
          "address",
          "occupation",
          "institution",
          "membershipType",
          "membershipStatus",
          "membershipFeePaid",
          "bio",
          "skills",
          "interests",
          "profilePhoto",
        ];

        const changes = {};

        for (
          const field of editableFields
        ) {
          if (
            Object.prototype.hasOwnProperty.call(
              payload,
              field
            ) &&
            payload[field] !==
              member[field]
          ) {
            changes[field] = {
              old:
                member[field],
              new:
                payload[field],
            };

            member[field] =
              payload[field];
          }
        }

        if (
          Object.keys(changes)
            .length === 0
        ) {
          throw new AppError(
            "No changes were provided.",
            400
          );
        }

        await member.save({
          session,
        });

        await logActivity({
          user: adminId,
          action:
            ACTIVITY.MEMBER.UPDATED,
          module:
            ACTIVITY_MODULES.MEMBERS,
          targetType:
            TARGET_TYPES.MEMBER,
          targetId:
            member._id,
          description:
            `Updated member ${member.memberNumber}.`,
          changes,
          session,
        });
      }
    );

    return await getMemberProfile(
      memberId
    );

  } finally {
    session.endSession();
  }
};


/* ==========================================================
   ACTIVATE MEMBER
========================================================== */

export const activateMember = async (
  memberId,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const member =
          await Member.findById(
            memberId
          ).session(session);

        if (!member) {
          throw new AppError(
            "Member not found.",
            404
          );
        }

        const user =
          await User.findById(
            member.user
          ).session(session);

        if (!user) {
          throw new AppError(
            "User account not found.",
            404
          );
        }

        if (
          member.accountActivated &&
          member.membershipStatus ===
            "active"
        ) {
          throw new AppError(
            "Member is already active.",
            400
          );
        }

        member.accountActivated =
          true;

        member.membershipStatus =
          "active";

        user.isActive = true;

        await member.save({
          session,
        });

        await user.save({
          session,
        });

        await logActivity({
          user: adminId,
          action:
            ACTIVITY.MEMBER.ACTIVATED,
          module:
            ACTIVITY_MODULES.MEMBERS,
          targetType:
            TARGET_TYPES.MEMBER,
          targetId:
            member._id,
          description:
            `Activated member ${member.memberNumber}.`,
          session,
        });
      }
    );

    return await getMemberProfile(
      memberId
    );

  } finally {
    session.endSession();
  }
};


/* ==========================================================
   DEACTIVATE MEMBER
========================================================== */

export const deactivateMember = async (
  memberId,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const member =
          await Member.findById(
            memberId
          ).session(session);

        if (!member) {
          throw new AppError(
            "Member not found.",
            404
          );
        }

        const user =
          await User.findById(
            member.user
          ).session(session);

        if (!user) {
          throw new AppError(
            "User account not found.",
            404
          );
        }

        if (
          member.membershipStatus ===
          "inactive"
        ) {
          throw new AppError(
            "Member is already inactive.",
            400
          );
        }

        member.membershipStatus =
          "inactive";

        user.isActive = false;

        await member.save({
          session,
        });

        await user.save({
          session,
        });

        await logActivity({
          user: adminId,
          action:
            ACTIVITY.MEMBER.DEACTIVATED,
          module:
            ACTIVITY_MODULES.MEMBERS,
          targetType:
            TARGET_TYPES.MEMBER,
          targetId:
            member._id,
          description:
            `Deactivated member ${member.memberNumber}.`,
          session,
        });
      }
    );

    return await getMemberProfile(
      memberId
    );

  } finally {
    session.endSession();
  }
};


/* ==========================================================
   DELETE MEMBER
========================================================== */

export const deleteMember = async (
  memberId,
  adminId
) => {
  if (
    !mongoose.Types.ObjectId.isValid(
      memberId
    )
  ) {
    throw new AppError(
      "Invalid member ID.",
      400
    );
  }

  const session =
    await mongoose.startSession();

  try {
    await session.withTransaction(
      async () => {
        const member =
          await Member.findById(
            memberId
          ).session(session);

        if (!member) {
          throw new AppError(
            "Member not found.",
            404
          );
        }

        const user =
          await User.findById(
            member.user
          ).session(session);

        if (!user) {
          throw new AppError(
            "User account not found.",
            404
          );
        }

        if (
          user.role ===
          "super_admin"
        ) {
          throw new AppError(
            "Super Admin accounts cannot be deleted.",
            403
          );
        }

        if (member.isDeleted) {
          throw new AppError(
            "Member has already been deleted.",
            400
          );
        }

        member.isDeleted = true;

        member.deletedAt =
          new Date();

        user.isActive = false;

        await member.save({
          session,
        });

        await user.save({
          session,
        });

        await logActivity({
          user: adminId,
          action:
            ACTIVITY.MEMBER.DELETED,
          module:
            ACTIVITY_MODULES.MEMBERS,
          targetType:
            TARGET_TYPES.MEMBER,
          targetId:
            member._id,
          description:
            `Deleted member ${member.memberNumber}.`,
          session,
        });
      }
    );

    return {
      success: true,
      message:
        "Member deleted successfully.",
    };

  } finally {
    session.endSession();
  }
};