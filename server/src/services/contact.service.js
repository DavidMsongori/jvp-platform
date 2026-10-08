import Contact, {
  CONTACT_STATUS,
  CONTACT_PRIORITY,
  CONTACT_CATEGORIES,
} from "../models/contact.model.js";

/* =========================================================
   HELPERS
========================================================= */

/**
 * Normalize incoming contact data.
 */
const normalizeContactData = (data = {}) => {
  return {
    name: data.name?.trim(),
    email: data.email?.trim().toLowerCase(),
    phone: data.phone?.trim() || "",
    subject: data.subject?.trim(),
    category:
      data.category?.trim() ||
      CONTACT_CATEGORIES.GENERAL,
    message: data.message?.trim(),
    source:
      data.source?.trim() ||
      "website",
  };
};

/**
 * Validate contact submission.
 */
const validateContactData = (data) => {
  const errors = {};

  if (!data.name) {
    errors.name = "Name is required.";
  }

  if (data.name && data.name.length < 2) {
    errors.name =
      "Name must be at least 2 characters.";
  }

  if (data.name && data.name.length > 100) {
    errors.name =
      "Name cannot exceed 100 characters.";
  }

  if (!data.email) {
    errors.email =
      "Email address is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      data.email
    )
  ) {
    errors.email =
      "Please provide a valid email address.";
  }

  if (!data.subject) {
    errors.subject =
      "Subject is required.";
  }

  if (data.subject && data.subject.length < 3) {
    errors.subject =
      "Subject must be at least 3 characters.";
  }

  if (data.subject && data.subject.length > 200) {
    errors.subject =
      "Subject cannot exceed 200 characters.";
  }

  if (!data.message) {
    errors.message =
      "Message is required.";
  }

  if (data.message && data.message.length < 10) {
    errors.message =
      "Message must be at least 10 characters.";
  }

  if (data.message && data.message.length > 5000) {
    errors.message =
      "Message cannot exceed 5000 characters.";
  }

  if (
    data.category &&
    !Object.values(CONTACT_CATEGORIES).includes(
      data.category
    )
  ) {
    errors.category =
      "Invalid contact category.";
  }

  return errors;
};

/**
 * Get pagination values.
 */
const getPagination = (
  page = 1,
  limit = 20
) => {
  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const pageLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  return {
    page: currentPage,
    limit: pageLimit,
    skip: (currentPage - 1) * pageLimit,
  };
};

/**
 * Build pagination response.
 */
const buildPagination = (
  page,
  limit,
  total
) => ({
  page,
  limit,
  total,
  pages: Math.ceil(total / limit),
  hasNextPage:
    page < Math.ceil(total / limit),
  hasPreviousPage: page > 1,
});

/**
 * Validate ObjectId.
 */
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(String(id));
};

/* =========================================================
   PUBLIC CONTACT SERVICES
========================================================= */

/**
 * Create a new contact enquiry.
 */
export const createContact = async (
  data,
  metadata = {}
) => {
  const normalizedData =
    normalizeContactData(data);

  const errors =
    validateContactData(
      normalizedData
    );

  if (Object.keys(errors).length > 0) {
    const error = new Error(
      "Please correct the highlighted fields."
    );

    error.name = "ValidationError";
    error.errors = errors;

    throw error;
  }

  const contact = await Contact.create({
    ...normalizedData,

    status: CONTACT_STATUS.NEW,

    priority:
      CONTACT_PRIORITY.NORMAL,

    ipAddress:
      metadata.ipAddress || null,

    userAgent:
      metadata.userAgent || null,
  });

  return contact;
};

/* =========================================================
   ADMIN SERVICES
========================================================= */

/**
 * Get contact enquiries for admin.
 */
export const getAdminContacts = async ({
  page = 1,
  limit = 20,
  search = "",
  status = "",
  category = "",
  priority = "",
  assignedTo = "",
  sortBy = "createdAt",
  sortOrder = "desc",
} = {}) => {
  const pagination =
    getPagination(page, limit);

  const query = {};

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  if (search?.trim()) {
    const searchRegex =
      new RegExp(
        search.trim(),
        "i"
      );

    query.$or = [
      {
        name: searchRegex,
      },
      {
        email: searchRegex,
      },
      {
        subject: searchRegex,
      },
      {
        message: searchRegex,
      },
    ];
  }

  /* -------------------------------------------------------
     FILTERS
  ------------------------------------------------------- */

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (priority) {
    query.priority = priority;
  }

  if (assignedTo) {
    if (!isValidObjectId(assignedTo)) {
      throw new Error(
        "Invalid assigned user ID."
      );
    }

    query.assignedTo = assignedTo;
  }

  /* -------------------------------------------------------
     SORT
  ------------------------------------------------------- */

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "name",
    "priority",
    "status",
    "subject",
  ];

  const safeSortField =
    allowedSortFields.includes(sortBy)
      ? sortBy
      : "createdAt";

  const safeSortOrder =
    sortOrder === "asc"
      ? 1
      : -1;

  const sort = {
    [safeSortField]: safeSortOrder,
  };

  /* -------------------------------------------------------
     QUERY
  ------------------------------------------------------- */

  const [contacts, total] =
    await Promise.all([
      Contact.find(query)
        .populate(
          "assignedTo",
          "name email"
        )
        .populate(
          "respondedBy",
          "name email"
        )
        .populate(
          "readBy",
          "name email"
        )
        .populate(
          "archivedBy",
          "name email"
        )
        .sort(sort)
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),

      Contact.countDocuments(query),
    ]);

  return {
    contacts,

    pagination:
      buildPagination(
        pagination.page,
        pagination.limit,
        total
      ),
  };
};

/**
 * Get a single contact enquiry.
 */
export const getContactById = async (
  contactId
) => {
  if (!isValidObjectId(contactId)) {
    throw new Error(
      "Invalid contact enquiry ID."
    );
  }

  const contact =
    await Contact.findById(
      contactId
    )
      .populate(
        "assignedTo",
        "name email"
      )
      .populate(
        "respondedBy",
        "name email"
      )
      .populate(
        "readBy",
        "name email"
      )
      .populate(
        "archivedBy",
        "name email"
      );

  if (!contact) {
    const error = new Error(
      "Contact enquiry not found."
    );

    error.statusCode = 404;

    throw error;
  }

  return contact;
};

/* =========================================================
   STATUS SERVICES
========================================================= */

/**
 * Mark enquiry as read.
 */
export const markContactAsRead = async (
  contactId,
  userId
) => {
  const contact =
    await getContactById(
      contactId
    );

  await contact.markAsRead(
    userId
  );

  return contact;
};

/**
 * Mark enquiry as in progress.
 */
export const markContactInProgress =
  async (contactId) => {
    const contact =
      await getContactById(
        contactId
      );

    await contact.markInProgress();

    return contact;
  };

/**
 * Update contact status.
 */
export const updateContactStatus =
  async (
    contactId,
    status
  ) => {
    if (
      !Object.values(
        CONTACT_STATUS
      ).includes(status)
    ) {
      throw new Error(
        "Invalid contact status."
      );
    }

    const contact =
      await getContactById(
        contactId
      );

    contact.status = status;

    if (
      status === CONTACT_STATUS.READ &&
      !contact.readAt
    ) {
      contact.readAt =
        new Date();
    }

    if (
      status ===
      CONTACT_STATUS.ARCHIVED
    ) {
      contact.archivedAt =
        new Date();
    }

    await contact.save();

    return contact;
  };

/* =========================================================
   PRIORITY
========================================================= */

/**
 * Update enquiry priority.
 */
export const updateContactPriority =
  async (
    contactId,
    priority
  ) => {
    if (
      !Object.values(
        CONTACT_PRIORITY
      ).includes(priority)
    ) {
      throw new Error(
        "Invalid contact priority."
      );
    }

    const contact =
      await getContactById(
        contactId
      );

    contact.priority =
      priority;

    await contact.save();

    return contact;
  };

/* =========================================================
   ASSIGNMENT
========================================================= */

/**
 * Assign enquiry to an administrator.
 */
export const assignContact = async (
  contactId,
  userId
) => {
  if (
    !isValidObjectId(userId)
  ) {
    throw new Error(
      "Invalid user ID."
    );
  }

  const contact =
    await getContactById(
      contactId
    );

  await contact.assignToUser(
    userId
  );

  return contact;
};

/**
 * Unassign enquiry.
 */
export const unassignContact =
  async (contactId) => {
    const contact =
      await getContactById(
        contactId
      );

    contact.assignedTo = null;
    contact.assignedAt = null;

    await contact.save();

    return contact;
  };

/* =========================================================
   RESPONSE SERVICES
========================================================= */

/**
 * Save a response to an enquiry.
 *
 * Email delivery can be connected from the controller/service
 * later using the project's existing email provider.
 */
export const respondToContact =
  async (
    contactId,
    response,
    userId
  ) => {
    if (!response?.trim()) {
      throw new Error(
        "Response message is required."
      );
    }

    if (
      response.trim().length >
      10000
    ) {
      throw new Error(
        "Response cannot exceed 10000 characters."
      );
    }

    const contact =
      await getContactById(
        contactId
      );

    await contact.markResponded(
      response.trim(),
      userId
    );

    return contact;
  };

/* =========================================================
   INTERNAL NOTES
========================================================= */

/**
 * Update internal administrative notes.
 */
export const updateContactNotes =
  async (
    contactId,
    internalNotes
  ) => {
    const contact =
      await getContactById(
        contactId
      );

    contact.internalNotes =
      internalNotes?.trim() || "";

    await contact.save();

    return contact;
  };

/* =========================================================
   ARCHIVE / RESTORE
========================================================= */

/**
 * Archive an enquiry.
 */
export const archiveContact = async (
  contactId,
  userId
) => {
  const contact =
    await getContactById(
      contactId
    );

  await contact.archive(
    userId
  );

  return contact;
};

/**
 * Restore an archived enquiry.
 */
export const restoreContact =
  async (contactId) => {
    const contact =
      await getContactById(
        contactId
      );

    await contact.restore();

    return contact;
  };

/* =========================================================
   DELETE
========================================================= */

/**
 * Permanently delete an enquiry.
 */
export const deleteContact = async (
  contactId
) => {
  const contact =
    await getContactById(
      contactId
    );

  await Contact.findByIdAndDelete(
    contact._id
  );

  return contact;
};

/* =========================================================
   STATISTICS
========================================================= */

/**
 * Get contact dashboard statistics.
 */
export const getContactStatistics =
  async () => {
    const [
      total,
      newCount,
      readCount,
      inProgressCount,
      respondedCount,
      archivedCount,
      urgentCount,
      highPriorityCount,
    ] = await Promise.all([
      Contact.countDocuments(),

      Contact.countDocuments({
        status:
          CONTACT_STATUS.NEW,
      }),

      Contact.countDocuments({
        status:
          CONTACT_STATUS.READ,
      }),

      Contact.countDocuments({
        status:
          CONTACT_STATUS.IN_PROGRESS,
      }),

      Contact.countDocuments({
        status:
          CONTACT_STATUS.RESPONDED,
      }),

      Contact.countDocuments({
        status:
          CONTACT_STATUS.ARCHIVED,
      }),

      Contact.countDocuments({
        priority:
          CONTACT_PRIORITY.URGENT,
        status: {
          $ne:
            CONTACT_STATUS.ARCHIVED,
        },
      }),

      Contact.countDocuments({
        priority:
          CONTACT_PRIORITY.HIGH,
        status: {
          $ne:
            CONTACT_STATUS.ARCHIVED,
        },
      }),
    ]);

    const categoryStats =
      await Contact.aggregate([
        {
          $group: {
            _id: "$category",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]);

    return {
      total,

      new: newCount,

      read: readCount,

      inProgress:
        inProgressCount,

      responded:
        respondedCount,

      archived:
        archivedCount,

      urgent:
        urgentCount,

      highPriority:
        highPriorityCount,

      categories:
        categoryStats,
    };
  };

/* =========================================================
   RECENT CONTACTS
========================================================= */

/**
 * Get recent enquiries.
 */
export const getRecentContacts =
  async (limit = 5) => {
    const safeLimit = Math.min(
      Math.max(
        Number(limit) || 5,
        1
      ),
      20
    );

    return Contact.find({
      status: {
        $ne:
          CONTACT_STATUS.ARCHIVED,
      },
    })
      .sort({
        createdAt: -1,
      })
      .limit(safeLimit)
      .populate(
        "assignedTo",
        "name email"
      )
      .lean();
  };

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  createContact,

  getAdminContacts,
  getContactById,

  markContactAsRead,
  markContactInProgress,
  updateContactStatus,

  updateContactPriority,

  assignContact,
  unassignContact,

  respondToContact,

  updateContactNotes,

  archiveContact,
  restoreContact,

  deleteContact,

  getContactStatistics,
  getRecentContacts,
};