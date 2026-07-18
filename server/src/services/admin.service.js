import mongoose from "mongoose";

import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Event from "../models/Event.js";
import ActivityLog from "../models/ActivityLog.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { logActivity } from "../utils/activity.js";

/* ==========================================================
   ADMIN DASHBOARD
========================================================== */

export const getDashboard = async () => {

  /* ----------------------------------------
     MEMBER STATISTICS
  ---------------------------------------- */

  const [

  totalMembers,

  activatedMembers,

  importedMembers,

  newMembers,

  expiredMembers,

] = await Promise.all([

  // Everyone
  Member.countDocuments(),

  // Members who have actually activated their accounts
  Member.countDocuments({
    accountActivated: true,
  }),

  // Imported members still waiting to activate
  Member.countDocuments({
    source: "imported",
    accountActivated: false,
  }),

  // Members who registered through JVP Connect
  Member.countDocuments({
    source: "new",
    accountActivated: true,
  }),

  // Expired memberships
  Member.countDocuments({
    membershipStatus: "expired",
  }),

]);

  /* ----------------------------------------
     PAYMENT STATISTICS
  ---------------------------------------- */

  const [

    totalPayments,

    revenue,

  ] = await Promise.all([

    Payment.countDocuments(),

    Payment.aggregate([
      {
        $match: {
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]),

  ]);

  const totalRevenue =
    revenue.length > 0
      ? revenue[0].total
      : 0;

  /* ----------------------------------------
     EVENTS
  ---------------------------------------- */

  const totalEvents =
    await Event.countDocuments();

  /* ----------------------------------------
     RECENT MEMBERS
  ---------------------------------------- */

  const recentMembers =
    await Member.find()

      .populate(
        "user",
        "email role"
      )

      .sort({
        createdAt: -1,
      })

      .limit(5);

  /* ----------------------------------------
     RECENT PAYMENTS
  ---------------------------------------- */

  const recentPayments =
    await Payment.find()

      .populate(
        "member",
        "firstName lastName memberNumber"
      )

      .sort({
        createdAt: -1,
      })

      .limit(5);

  /* ----------------------------------------
     UPCOMING EVENTS
  ---------------------------------------- */

  const upcomingEvents =
    await Event.find({

      startDate: {

        $gte: new Date(),

      },

    })

      .sort({

        startDate: 1,

      })

      .limit(5);

  /* ----------------------------------------
     RECENT ACTIVITY
  ---------------------------------------- */

  const recentActivity =
    await ActivityLog.find()

      .populate(
        "user",
        "email role"
      )

      .sort({

        createdAt: -1,

      })

      .limit(10);

  /* ----------------------------------------
     RETURN
  ---------------------------------------- */

  return {

    statistics: {

  totalMembers,

  activatedMembers,

  importedMembers,

  newMembers,

  expiredMembers,

  totalPayments,

  totalRevenue,

  totalEvents,

},

    recentMembers,

    recentPayments,

    upcomingEvents,

    recentActivity,

  };

};


/* ==========================================================
   MEMBER MANAGEMENT
========================================================== */

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

  /* ----------------------------------------
     USER FILTERS
  ---------------------------------------- */

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

  /* ----------------------------------------
     MEMBER FILTERS
  ---------------------------------------- */

  const memberFilters = {};

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

  /* ----------------------------------------
     SEARCH
  ---------------------------------------- */

  if (search.trim()) {

    memberFilters.$or = [

      {
        firstName: {
          $regex: search,
          $options: "i",
        },
      },

      {
        middleName: {
          $regex: search,
          $options: "i",
        },
      },

      {
        lastName: {
          $regex: search,
          $options: "i",
        },
      },

      {
        memberNumber: {
          $regex: search,
          $options: "i",
        },
      },

      {
        nationalId: {
          $regex: search,
          $options: "i",
        },
      },

      {
        phone: {
          $regex: search,
          $options: "i",
        },
      },

    ];

  }

  /* ----------------------------------------
     SORT
  ---------------------------------------- */

  const sort = {

    [sortBy]:
      order === "asc"
        ? 1
        : -1,

  };

  /* ----------------------------------------
     QUERY
  ---------------------------------------- */

  const members = await Member.find(
    memberFilters
  )

    .populate({

      path: "user",

      select:
        "email role isActive emailVerified createdAt",

      match: userFilters,

    })

    .sort(sort)

    .skip((pageNumber - 1) * pageSize)

    .limit(pageSize);

  /* ----------------------------------------
     REMOVE MEMBERS THAT DIDN'T MATCH USER FILTERS
  ---------------------------------------- */

  const filteredMembers =
    members.filter(
      (member) => member.user
    );

  /* ----------------------------------------
     TOTAL
  ---------------------------------------- */

  const total =
    filteredMembers.length;

  /* ----------------------------------------
     SUMMARY
  ---------------------------------------- */

  const summary = {

  totalMembers: await Member.countDocuments(),

  activatedMembers: await Member.countDocuments({
    accountActivated: true,
  }),

  importedMembers: await Member.countDocuments({
    source: "imported",
    accountActivated: false,
  }),

  newMembers: await Member.countDocuments({
    source: "new",
    accountActivated: true,
  }),

  expiredMembers: await Member.countDocuments({
    membershipStatus: "expired",
  }),

};

  /* ----------------------------------------
     RETURN
  ---------------------------------------- */

  return {

    summary,

    members: filteredMembers,

    pagination: {

      page: pageNumber,

      limit: pageSize,

      total,

      totalPages: Math.ceil(
        total / pageSize
      ),

      hasNextPage:
        pageNumber <
        Math.ceil(total / pageSize),

      hasPreviousPage:
        pageNumber > 1,

    },

  };

};

/**
 * Get single member.
 */

export const getMemberById = async (id) => {

  const member = await Member.findById(id)

    .populate(
      "user"
    );

  if (!member) {

    throw new Error(
      "Member not found."
    );

  }

  return member;

};


export const updateMember = async (
  id,
  payload,
  adminId
) => {

  const session = await mongoose.startSession();

  session.startTransaction();

  try {

    const member = await Member.findById(id).session(session);

    if (!member) {

      throw new AppError(
        "Member not found.",
        404
      );

    }

    Object.assign(member, payload);

    await member.save({ session });

    await logActivity(
      adminId,
      `Updated member ${member.memberNumber}`,
      session
    );

    await session.commitTransaction();

    return await Member.findById(id)
      .populate("user");

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }

};

/**
 * Activate member.
 */

export const activateMember = async (
  id,
  adminId
) => {

  const session = await mongoose.startSession();

  session.startTransaction();

  try {

    const member = await Member.findById(id).session(session);

    if (!member) {

      throw new AppError(
        "Member not found.",
        404
      );

    }

    member.membershipStatus = "active";

    await member.save({ session });

    await logActivity(
      adminId,
      `Activated member ${member.memberNumber}`,
      session
    );

    await session.commitTransaction();

    return member;

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }

};


/**
 * Deactivate member.
 */

export const deactivateMember = async (
  id,
  adminId
) => {

  const session = await mongoose.startSession();

  session.startTransaction();

  try {

    const member = await Member.findById(id).session(session);

    if (!member) {

      throw new AppError(
        "Member not found.",
        404
      );

    }

    member.membershipStatus = "inactive";

    await member.save({ session });

    await logActivity(
      adminId,
      `Deactivated member ${member.memberNumber}`,
      session
    );

    await session.commitTransaction();

    return member;

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }

};


/**
 * Delete member.
 */

export const deleteMember = async (
  id,
  adminId
) => {

  const session = await mongoose.startSession();

  session.startTransaction();

  try {

    const member = await Member.findById(id).session(session);

    if (!member) {

      throw new AppError(
        "Member not found.",
        404
      );

    }

    const user = await User.findById(member.user).session(session);

    if (!user) {

      throw new AppError(
        "User account not found.",
        404
      );

    }

    /* ----------------------------------------
       PROTECT SUPER ADMIN
    ---------------------------------------- */

    if (user.role === "super_admin") {

      throw new AppError(
        "Super Admin accounts cannot be deleted.",
        403
      );

    }

    /* ----------------------------------------
       DELETE MEMBER
    ---------------------------------------- */

    await Member.deleteOne(
      { _id: id },
      { session }
    );

    await User.deleteOne(
      { _id: user._id },
      { session }
    );

    await logActivity(
      adminId,
      `Deleted member ${member.memberNumber}`,
      session
    );

    await session.commitTransaction();

    return {

      success: true,

      message:
        "Member deleted successfully.",

    };

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }

};


/* ==========================================================
   PAYMENT MANAGEMENT
========================================================== */

/**
 * Get all payments.
 */

export const getPayments = async (query = {}) => {

  const {

    page = 1,

    limit = 10,

    search = "",

    status,

    paymentMethod,

    startDate,

    endDate,

    sortBy = "createdAt",

    order = "desc",

  } = query;

  const pageNumber = Math.max(Number(page), 1);

  const pageSize = Math.max(Number(limit), 1);

  /* ----------------------------------------
     FILTERS
  ---------------------------------------- */

  const filters = {};

  if (status) {

    filters.status = status;

  }

  if (paymentMethod) {

    filters.paymentMethod = paymentMethod;

  }

  if (startDate || endDate) {

    filters.createdAt = {};

    if (startDate) {

      filters.createdAt.$gte =
        new Date(startDate);

    }

    if (endDate) {

      filters.createdAt.$lte =
        new Date(endDate);

    }

  }

  /* ----------------------------------------
     SORT
  ---------------------------------------- */

  const sort = {

    [sortBy]:
      order === "asc"
        ? 1
        : -1,

  };

  /* ----------------------------------------
     QUERY
  ---------------------------------------- */

  let payments = await Payment.find(filters)

    .populate({

      path: "member",

      select:
        "firstName lastName memberNumber phone",

    })

    .sort(sort)

    .skip((pageNumber - 1) * pageSize)

    .limit(pageSize);

  /* ----------------------------------------
     SEARCH
  ---------------------------------------- */

  if (search.trim()) {

    const keyword =
      search.toLowerCase();

    payments = payments.filter((payment) => {

      const member =
        payment.member || {};

      return (

        member.firstName
          ?.toLowerCase()
          .includes(keyword) ||

        member.lastName
          ?.toLowerCase()
          .includes(keyword) ||

        member.memberNumber
          ?.toLowerCase()
          .includes(keyword) ||

        payment.transactionReference
          ?.toLowerCase()
          .includes(keyword)

      );

    });

  }

  /* ----------------------------------------
     TOTALS
  ---------------------------------------- */

  const totalPayments =
    await Payment.countDocuments(filters);

  const revenue =
    await Payment.aggregate([

      {

        $match: {

          status: "completed",

        },

      },

      {

        $group: {

          _id: null,

          total: {

            $sum: "$amount",

          },

        },

      },

    ]);

  const totalRevenue =
    revenue.length
      ? revenue[0].total
      : 0;

  const pendingPayments =
    await Payment.countDocuments({

      status: "pending",

    });

  const failedPayments =
    await Payment.countDocuments({

      status: "failed",

    });

  /* ----------------------------------------
     RETURN
  ---------------------------------------- */

  return {

    summary: {

      totalPayments,

      totalRevenue,

      pendingPayments,

      failedPayments,

    },

    payments,

    pagination: {

      page: pageNumber,

      limit: pageSize,

      total: totalPayments,

      totalPages: Math.ceil(
        totalPayments / pageSize
      ),

      hasNextPage:
        pageNumber <
        Math.ceil(totalPayments / pageSize),

      hasPreviousPage:
        pageNumber > 1,

    },

  };

};

/**
 * Verify payment.
 */

export const verifyPayment = async (

  paymentId,

  adminId

) => {

  const session =
    await mongoose.startSession();

  session.startTransaction();

  try {

    const payment =
      await Payment.findById(paymentId)
        .session(session);

    if (!payment) {

      throw new AppError(
        "Payment not found.",
        404
      );

    }

    if (payment.status === "completed") {

      throw new AppError(
        "Payment has already been verified.",
        400
      );

    }

    payment.status = "completed";

    payment.verifiedBy = adminId;

    payment.verifiedAt = new Date();

    await payment.save({
      session,
    });

    /* ----------------------------------------
       UPDATE MEMBER
    ---------------------------------------- */

    const member =
      await Member.findById(
        payment.member
      ).session(session);

    if (member) {

      /* ----------------------------------------
   ACTIVATE / RENEW MEMBERSHIP
---------------------------------------- */

const today = new Date();

let baseDate = today;

/*
 * If the current membership is still valid,
 * extend from the existing expiry date.
 */

if (

  member.membershipExpiry &&

  member.membershipExpiry > today

) {

  baseDate = new Date(
    member.membershipExpiry
  );

}

/*
 * Add one year.
 */

const newExpiry = new Date(baseDate);

newExpiry.setFullYear(
  newExpiry.getFullYear() + 1
);

member.membershipFeePaid = true;

member.membershipStatus = "active";

member.membershipExpiry = newExpiry;

await member.save({
  session,
});

    }

    await session.commitTransaction();

    return payment;

  } catch (error) {

    await session.abortTransaction();

    throw error;

  } finally {

    session.endSession();

  }

};



/* ==========================================================
   EVENT MANAGEMENT
========================================================== */

/**
 * Get all events.
 */

export const getEvents = async (query = {}) => {

  const {

    page = 1,

    limit = 10,

    search = "",

    county,

    status,

    sortBy = "startDate",

    order = "asc",

  } = query;

  const pageNumber = Math.max(Number(page), 1);

  const pageSize = Math.max(Number(limit), 1);

  const filters = {};

  /* ----------------------------------------
     FILTERS
  ---------------------------------------- */

  if (county) {

    filters.county = county;

  }

  if (status) {

    filters.status = status;

  }

  if (search.trim()) {

    filters.$or = [

      {

        title: {

          $regex: search,

          $options: "i",

        },

      },

      {

        description: {

          $regex: search,

          $options: "i",

        },

      },

      {

        venue: {

          $regex: search,

          $options: "i",

        },

      },

    ];

  }

  const sort = {

    [sortBy]:

      order === "asc"

        ? 1

        : -1,

  };

  const events = await Event.find(filters)

    .sort(sort)

    .skip((pageNumber - 1) * pageSize)

    .limit(pageSize);

  const total =
    await Event.countDocuments(filters);

  const summary = {

    totalEvents:
      await Event.countDocuments(),

    upcomingEvents:
      await Event.countDocuments({

        startDate: {

          $gte: new Date(),

        },

      }),

    completedEvents:
      await Event.countDocuments({

        endDate: {

          $lt: new Date(),

        },

      }),

  };

  return {

    summary,

    events,

    pagination: {

      page: pageNumber,

      limit: pageSize,

      total,

      totalPages:
        Math.ceil(total / pageSize),

      hasNextPage:

        pageNumber <

        Math.ceil(total / pageSize),

      hasPreviousPage:

        pageNumber > 1,

    },

  };

};

/**
 * Get one event.
 */

export const getEventById = async (id) => {

  const event = await Event.findById(id);

  if (!event) {

    throw new AppError(

      "Event not found.",

      404

    );

  }

  return event;

};

/**
 * Create event.
 */

export const createEvent = async (

  payload

) => {

  const event =
    await Event.create(payload);

  return event;

};

/**
 * Update event.
 */

export const updateEvent = async (

  id,

  payload

) => {

  const event =
    await Event.findByIdAndUpdate(

      id,

      payload,

      {

        new: true,

        runValidators: true,

      }

    );

  if (!event) {

    throw new AppError(

      "Event not found.",

      404

    );

  }

  return event;

};

/**
 * Delete event.
 */

export const deleteEvent = async (

  id

) => {

  const event =
    await Event.findById(id);

  if (!event) {

    throw new AppError(

      "Event not found.",

      404

    );

  }

  await Event.deleteOne({

    _id: id,

  });

  return {

    success: true,

    message:

      "Event deleted successfully.",

  };

};


/* ==========================================================
   ACTIVITY LOGS
========================================================== */

/**
 * Get activity logs.
 */

export const getActivityLogs = async (query = {}) => {

  const {

    page = 1,

    limit = 20,

    search = "",

    action,

    user,

    startDate,

    endDate,

    sortBy = "createdAt",

    order = "desc",

  } = query;

  const pageNumber = Math.max(Number(page), 1);

  const pageSize = Math.max(Number(limit), 1);

  /* ----------------------------------------
     FILTERS
  ---------------------------------------- */

  const filters = {};

  if (action) {

    filters.action = action;

  }

  if (user) {

    filters.user = user;

  }

  if (startDate || endDate) {

    filters.createdAt = {};

    if (startDate) {

      filters.createdAt.$gte =
        new Date(startDate);

    }

    if (endDate) {

      filters.createdAt.$lte =
        new Date(endDate);

    }

  }

  /* ----------------------------------------
     SEARCH
  ---------------------------------------- */

  if (search.trim()) {

    filters.$or = [

      {

        action: {

          $regex: search,

          $options: "i",

        },

      },

      {

        description: {

          $regex: search,

          $options: "i",

        },

      },

    ];

  }

  /* ----------------------------------------
     SORT
  ---------------------------------------- */

  const sort = {

    [sortBy]:
      order === "asc"
        ? 1
        : -1,

  };

  /* ----------------------------------------
     QUERY
  ---------------------------------------- */

  const logs = await ActivityLog.find(filters)

    .populate(

      "user",

      "email role"

    )

    .sort(sort)

    .skip((pageNumber - 1) * pageSize)

    .limit(pageSize);

  const total =
    await ActivityLog.countDocuments(filters);

  /* ----------------------------------------
     SUMMARY
  ---------------------------------------- */

  const summary = {

    totalLogs:
      await ActivityLog.countDocuments(),

    todayLogs:
      await ActivityLog.countDocuments({

        createdAt: {

          $gte: new Date(
            new Date().setHours(
              0,
              0,
              0,
              0
            )
          ),

        },

      }),

  };

  /* ----------------------------------------
     RETURN
  ---------------------------------------- */

  return {

    summary,

    logs,

    pagination: {

      page: pageNumber,

      limit: pageSize,

      total,

      totalPages: Math.ceil(
        total / pageSize
      ),

      hasNextPage:
        pageNumber <
        Math.ceil(total / pageSize),

      hasPreviousPage:
        pageNumber > 1,

    },

  };

};

/* ==========================================================
   REPORTS
========================================================== */

export const getReports = async () => {

  /* ----------------------------------------
     MEMBERS
  ---------------------------------------- */

  const members = {

    total:
      await Member.countDocuments(),

    active:
      await Member.countDocuments({

        membershipStatus: "active",

      }),

    pending:
      await Member.countDocuments({

        membershipStatus:
          "pending_payment",

      }),

    expired:
      await Member.countDocuments({

        membershipStatus:
          "expired",

      }),

  };

  /* ----------------------------------------
     PAYMENTS
  ---------------------------------------- */

  const payments = {

    total:
      await Payment.countDocuments(),

    completed:
      await Payment.countDocuments({

        status: "completed",

      }),

    pending:
      await Payment.countDocuments({

        status: "pending",

      }),

    failed:
      await Payment.countDocuments({

        status: "failed",

      }),

  };

  const revenueResult =
    await Payment.aggregate([

      {

        $match: {

          status: "completed",

        },

      },

      {

        $group: {

          _id: null,

          total: {

            $sum: "$amount",

          },

        },

      },

    ]);

  const revenue =
    revenueResult.length

      ? revenueResult[0].total

      : 0;

  /* ----------------------------------------
     EVENTS
  ---------------------------------------- */

  const events = {

    total:
      await Event.countDocuments(),

    upcoming:
      await Event.countDocuments({

        startDate: {

          $gte: new Date(),

        },

      }),

    completed:
      await Event.countDocuments({

        endDate: {

          $lt: new Date(),

        },

      }),

  };

  /* ----------------------------------------
     COUNTY BREAKDOWN
  ---------------------------------------- */

  const countySummary =
    await Member.aggregate([

      {

        $group: {

          _id: "$county",

          members: {

            $sum: 1,

          },

        },

      },

      {

        $sort: {

          members: -1,

        },

      },

    ]);

  /* ----------------------------------------
     MEMBERSHIP TYPES
  ---------------------------------------- */

  const membershipTypes =
    await Member.aggregate([

      {

        $group: {

          _id: "$membershipType",

          total: {

            $sum: 1,

          },

        },

      },

    ]);

  /* ----------------------------------------
     RETURN
  ---------------------------------------- */

  return {

    members,

    payments,

    revenue,

    events,

    countySummary,

    membershipTypes,

    generatedAt: new Date(),

  };

};

