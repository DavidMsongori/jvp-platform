import slugify from "slugify";

import Event from "../models/Event.js";
import EventRegistration from "../models/eventRegistration.model.js";
import Member from "../models/Member.js";

import AppError from "../utils/AppError.js";

import {
  logActivity,
  ACTIVITY,
  ACTIVITY_MODULES,
  TARGET_TYPES,
} from "../utils/activity.js";

import {
  uploadImage,
  deleteImage,
} from "../config/cloudinary.js";

/* ===========================================================
   GENERATE UNIQUE EVENT SLUG
=========================================================== */

const generateUniqueSlug = async (
  title,
  excludeId = null
) => {
  const baseSlug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };

    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Event.exists(query);

    if (!exists) break;

    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

/* ===========================================================
   CHECK DUPLICATE EVENT
=========================================================== */

const checkDuplicateEvent = async ({
  title,
  startDate,
  venue,
  excludeId = null,
}) => {
  if (!title || !startDate) return;

  const query = {
    title: title.trim(),
    startDate: new Date(startDate),
  };

  if (venue?.name) {
    query["venue.name"] = venue.name.trim();
  }

  if (excludeId) {
    query._id = {
      $ne: excludeId,
    };
  }

  const existing =
    await Event.findOne(query);

  if (existing) {
    throw new AppError(
      409,
      "An event with the same title, venue and start date already exists."
    );
  }
};

/* ===========================================================
   PARSE JSON FIELDS
=========================================================== */

const parseEventData = (data = {}) => {
  const parsed = { ...data };

  const jsonFields = [
    "venue",
    "registration",
  ];

  for (const field of jsonFields) {
    if (typeof parsed[field] === "string") {
      try {
        parsed[field] = JSON.parse(
          parsed[field]
        );
      } catch {
        parsed[field] = {};
      }
    }
  }

  return parsed;
};

/* ===========================================================
   UPLOAD COVER IMAGE
=========================================================== */

const uploadCoverImage = async (
  file,
  existingImage = null
) => {
  if (!file) return existingImage;

  if (existingImage?.publicId) {
    await deleteImage(existingImage.publicId);
  }

  const uploaded = await uploadImage(file.buffer, {
    folder: "jvp/events/cover",
  });

  return {
    ...uploaded,
    alt: existingImage?.alt || "",
    caption: existingImage?.caption || "",
    isPrimary: true,
  };
};

/* ===========================================================
   UPLOAD GALLERY IMAGES
=========================================================== */

const uploadGalleryImages = async (
  files = [],
  existingGallery = []
) => {
  if (!files.length) {
    return existingGallery;
  }

  const gallery = [];

  for (const file of files) {
    const uploaded = await uploadImage(file.buffer, {
      folder: "jvp/events/gallery",
    });

    gallery.push({
      ...uploaded,
      alt: "",
      caption: "",
    });
  }

  return gallery;
};

/* ===========================================================
   REMOVE GALLERY IMAGES
=========================================================== */

const removeGalleryImages = async (
  gallery = []
) => {
  for (const image of gallery) {
    if (image?.publicId) {
      await deleteImage(
        image.publicId
      );
    }
  }
};

/* ===========================================================
   CREATE EVENT
=========================================================== */

export const createEvent = async (
  eventData,
  files,
  userId
) => {
  /* ==========================================
     PARSE FORM DATA
  ========================================== */

  const data = parseEventData(eventData);

  /* ==========================================
     DUPLICATE CHECK
  ========================================== */

  await checkDuplicateEvent({
    title: data.title,
    startDate: data.startDate,
    venue: data.venue,
  });

  /* ==========================================
     GENERATE SLUG
  ========================================== */

  const slug = await generateUniqueSlug(
    data.title
  );

  /* ==========================================
     UPLOAD COVER IMAGE
  ========================================== */

  let coverImage = null;

  if (
    files?.coverImage &&
    files.coverImage.length
  ) {
    coverImage =
      await uploadCoverImage(
        files.coverImage[0]
      );
  }

  /* ==========================================
     UPLOAD GALLERY
  ========================================== */

  let gallery = [];

  if (
    files?.gallery &&
    files.gallery.length
  ) {
    gallery =
      await uploadGalleryImages(
        files.gallery
      );
  }

  /* ==========================================
     CREATE EVENT
  ========================================== */

  const event = await Event.create({
    ...data,

    slug,

    coverImage,

    gallery,

    createdBy: userId,

    updatedBy: userId,
  });

  /* ==========================================
     ACTIVITY LOG
  ========================================== */

  await logActivity({
    user: userId,

    action: ACTIVITY.EVENT.CREATED,

    module: ACTIVITY_MODULES.EVENTS,

    targetType: TARGET_TYPES.EVENT,

    targetId: event._id,

    title: "Event Created",

    description: `Created event "${event.title}".`,

    status: "success",
  });

  /* ==========================================
     RETURN EVENT
  ========================================== */

  return await Event.findById(event._id)
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .populate(
      "updatedBy",
      "firstName lastName email"
    );
};

/* ===========================================================
   UPDATE EVENT
=========================================================== */

export const updateEvent = async (
  eventId,
  updateData,
  files,
  userId
) => {
  /* ==========================================
     FIND EVENT
  ========================================== */

  const event = await Event.findOne({
    _id: eventId,
  });

  if (!event) {
    throw new AppError(404, "Event not found.");
  }

  /* ==========================================
     PARSE FORM DATA
  ========================================== */

  const data = parseEventData(updateData);

  /* ==========================================
     CHECK DUPLICATE TITLE
  ========================================== */

  if (
    data.title &&
    data.title !== event.title
  ) {
    await checkDuplicateEvent({
      title: data.title,
      startDate:
        data.startDate || event.startDate,
      venue:
        data.venue || event.venue,
      excludeId: eventId,
    });

    data.slug =
      await generateUniqueSlug(
        data.title,
        eventId
      );
  }

  /* ==========================================
     COVER IMAGE
  ========================================== */

  if (
    files?.coverImage &&
    files.coverImage.length
  ) {
    data.coverImage =
      await uploadCoverImage(
        files.coverImage[0],
        event.coverImage
      );
  }

  /* ==========================================
     GALLERY
  ========================================== */

  if (
    files?.gallery &&
    files.gallery.length
  ) {
    if (
      Array.isArray(event.gallery) &&
      event.gallery.length
    ) {
      await removeGalleryImages(
        event.gallery
      );
    }

    data.gallery =
      await uploadGalleryImages(
        files.gallery
      );
  }

  /* ==========================================
     APPLY CHANGES
  ========================================== */

  Object.entries(data).forEach(
    ([key, value]) => {
      if (value !== undefined) {
        event[key] = value;
      }
    }
  );

  event.updatedBy = userId;

  await event.save();

  /* ==========================================
     LOG ACTIVITY
  ========================================== */

  await logActivity({
    user: userId,

    action: ACTIVITY.EVENT.UPDATED,

    module: ACTIVITY_MODULES.EVENTS,

    targetType: TARGET_TYPES.EVENT,

    targetId: event._id,

    title: "Event Updated",

    description: `Updated event "${event.title}".`,

    status: "success",
  });

  /* ==========================================
     RETURN UPDATED EVENT
  ========================================== */

  return await Event.findById(event._id)
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .populate(
      "updatedBy",
      "firstName lastName email"
    );
};

/* ===========================================================
   GET EVENT BY ID
=========================================================== */

export const getEventById = async (eventId) => {
  const event = await Event.findOne({
    _id: eventId,
  })
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .populate(
      "updatedBy",
      "firstName lastName email"
    )
    .populate(
      "publishedBy",
      "firstName lastName email"
    );

  if (!event) {
    throw new AppError(404, "Event not found.");
  }

  return event;
};

/* ===========================================================
   GET EVENT BY SLUG
=========================================================== */

export const getEventBySlug = async (slug) => {
  const event = await Event.findOne({
    slug,
    isPublished: true,
  });

  if (!event) {
    throw new AppError(404, "Event not found.");
  }

  return event;
};

/* ===========================================================
   GET ALL EVENTS
=========================================================== */

export const getAllEvents = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    eventType,
    featured,
    published,
    county,
    sort = "-startDate",
  } = query;

  /* ===========================================================
     BASE FILTER
     Soft-deleted events are never returned.
  =========================================================== */

  const filter = {
    isDeleted: {
      $ne: true,
    },
  };

  /* ===========================================================
     SEARCH
  =========================================================== */

  if (search) {
    filter.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        summary: {
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

  /* ===========================================================
     FILTERS
  =========================================================== */

  if (category) {
    filter.category = category;
  }

  if (eventType) {
    filter.eventType = eventType;
  }

  if (
    featured !== undefined &&
    featured !== null &&
    featured !== ""
  ) {
    filter.isFeatured =
      featured === "true";
  }

  if (
    published !== undefined &&
    published !== null &&
    published !== ""
  ) {
    filter.isPublished =
      published === "true";
  }

  if (county) {
    filter["venue.county"] = county;
  }

  /* ===========================================================
     PAGINATION
  =========================================================== */

  const currentPage = Math.max(
    Number(page) || 1,
    1
  );

  const pageSize = Math.max(
    Number(limit) || 10,
    1
  );

  const skip =
    (currentPage - 1) * pageSize;

  /* ===========================================================
     DEBUGGING
  =========================================================== */

  console.log(
    "EVENT FILTER:",
    filter
  );

  /* ===========================================================
     FETCH EVENTS + TOTAL
  =========================================================== */

  const [events, total] =
    await Promise.all([
      Event.find(filter)
        .populate(
          "createdBy",
          "firstName lastName"
        )
        .sort(sort)
        .skip(skip)
        .limit(pageSize),

      Event.countDocuments(filter),
    ]);

  /* ===========================================================
     RESPONSE
  =========================================================== */

  return {
    events,

    pagination: {
      total,

      page: currentPage,

      limit: pageSize,

      totalPages: Math.ceil(
        total / pageSize
      ),

      hasNextPage:
        currentPage * pageSize <
        total,

      hasPrevPage:
        currentPage > 1,
    },
  };
};

/* ===========================================================
   GET FEATURED EVENTS
=========================================================== */

export const getFeaturedEvents = async (
  limit = 6
) => {
  return Event.find({
    featured: true,
    isPublished: true,
  })
    .sort({
      startDate: 1,
    })
    .limit(limit)
    .lean();
};

/* ===========================================================
   GET UPCOMING EVENTS
=========================================================== */

export const getUpcomingEvents = async (
  limit = 10
) => {
  return Event.find({
    startDate: {
      $gte: new Date(),
    },
    isPublished: true,
  })
    .sort({
      startDate: 1,
    })
    .limit(limit)
    .lean();
};

/* ===========================================================
   GET ONGOING EVENTS
=========================================================== */

export const getOngoingEvents = async () => {
  const now = new Date();

  return Event.find({
    startDate: {
      $lte: now,
    },
    endDate: {
      $gte: now,
    },
    isPublished: true,
  })
    .sort({
      startDate: 1,
    })
    .lean();
};

/* ===========================================================
   GET EVENTS BY CATEGORY
=========================================================== */

export const getEventsByCategory = async (
  category,
  limit = 20
) => {
  return Event.find({
    category,
    isPublished: true,

  })
    .sort({
      startDate: 1,
    })
    .limit(limit)
    .lean();
};

/* ===========================================================
   PUBLISH EVENT
=========================================================== */

export const publishEvent = async (
  eventId,
  userId
) => {
  const event = await Event.findOne({
    _id: eventId,
  });

  if (!event) {
    throw new AppError(
      404,
      "Event not found."
    );
  }

  if (event.isPublished) {
    throw new AppError(
      400,
      "Event is already published."
    );
  }

  event.isPublished = true;
  event.publishedAt = new Date();
  event.publishedBy = userId;
  event.updatedBy = userId;

  await event.save();

  await logActivity({
    user: userId,
    action: ACTIVITY.EVENT.PUBLISHED,
    module: ACTIVITY_MODULES.EVENTS,
    targetType: TARGET_TYPES.EVENT,
    targetId: event._id,
    title: "Event Published",
    description: `Published event "${event.title}".`,
    status: "success",
  });

  return await Event.findById(event._id)
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .populate(
      "updatedBy",
      "firstName lastName email"
    )
    .populate(
      "publishedBy",
      "firstName lastName email"
    );
};

/* ===========================================================
   ARCHIVE EVENT
=========================================================== */

export const archiveEvent = async (
  eventId,
  userId
) => {
  const event = await Event.findOne({
    _id: eventId,
  });

  if (!event) {
    throw new AppError(
      404,
      "Event not found."
    );
  }

  event.isPublished = false;
  event.updatedBy = userId;

  await event.save();

  await logActivity({
    user: userId,
    action: ACTIVITY.EVENT.UPDATED,
    module: ACTIVITY_MODULES.EVENTS,
    targetType: TARGET_TYPES.EVENT,
    targetId: event._id,
    title: "Event Archived",
    description: `Archived event "${event.title}".`,
    status: "success",
  });

  return await Event.findById(event._id)
    .populate(
      "createdBy",
      "firstName lastName email"
    )
    .populate(
      "updatedBy",
      "firstName lastName email"
    )
    .populate(
      "publishedBy",
      "firstName lastName email"
    );
};

/* ===========================================================
   DELETE EVENT (SOFT DELETE)
=========================================================== */

export const deleteEvent = async (
  eventId,
  userId
) => {
  const event = await Event.findOne({
    _id: eventId,
  });

  if (!event) {
    throw new AppError(
      404,
      "Event not found."
    );
  }

  /* ------------------------------------------
     DELETE CLOUDINARY IMAGES
  ------------------------------------------ */

  if (event.coverImage?.publicId) {
    await deleteImage(
      event.coverImage.publicId
    );
  }

  if (
    Array.isArray(event.gallery) &&
    event.gallery.length
  ) {
    await removeGalleryImages(
      event.gallery
    );
  }

  /* ------------------------------------------
     SOFT DELETE
  ------------------------------------------ */

  event.isDeleted = true;
  event.deletedAt = new Date();
  event.updatedBy = userId;

  await event.save();

  await logActivity({
    user: userId,
    action: ACTIVITY.EVENT.DELETED,
    module: ACTIVITY_MODULES.EVENTS,
    targetType: TARGET_TYPES.EVENT,
    targetId: event._id,
    title: "Event Deleted",
    description: `Deleted event "${event.title}".`,
    status: "success",
  });

  return {
    success: true,
    message:
      "Event deleted successfully.",
  };
};

/* ===========================================================
   DASHBOARD STATISTICS
=========================================================== */

export const getDashboardStatistics =
  async () => {
    const now = new Date();

    const [
      totalEvents,
      publishedEvents,
      draftEvents,
      featuredEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
    ] = await Promise.all([
      Event.countDocuments({
      }),

      Event.countDocuments({
        isPublished: true,
      }),

      Event.countDocuments({
        isPublished: false,
      }),

      Event.countDocuments({
        featured: true,
      }),

      Event.countDocuments({
        startDate: {
          $gt: now,
        },
      }),

      Event.countDocuments({
        startDate: {
          $lte: now,
        },
        endDate: {
          $gte: now,
        },
      }),

      Event.countDocuments({
        endDate: {
          $lt: now,
        },
      }),
    ]);

    return {
      totalEvents,
      publishedEvents,
      draftEvents,
      featuredEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
    };
  };

/* ===========================================================
   UPDATE REGISTRATION COUNTERS
=========================================================== */

export const updateRegistrationCounters =
  async (
    eventId,
    counters
  ) => {
    const event =
      await Event.findOne({
        _id: eventId,
      });

    if (!event) {
      throw new AppError(
        404,
        "Event not found."
      );
    }

    Object.assign(
      event,
      counters
    );

    await event.save();

    return event;
  };

  /* ===========================================================
   MEMBER EVENT REGISTRATION
=========================================================== */
/* ===========================================================
   REGISTER FOR EVENT
=========================================================== */

export const registerForEvent = async (
  eventId,
  userId
) => {
  /* ==========================================
     FIND MEMBER
  ========================================== */

  const member = await Member.findOne({
    user: userId,
  });

  if (!member) {
    throw new AppError(
      404,
      "Member profile not found."
    );
  }

  /* ==========================================
     FIND EVENT
  ========================================== */

  const event = await Event.findOne({
    _id: eventId,
    isPublished: true,
  });

  if (!event) {
    throw new AppError(
      404,
      "Event not found."
    );
  }

  /* ==========================================
     REGISTRATION ENABLED
  ========================================== */

  if (!event.registration?.enabled) {
    throw new AppError(
      400,
      "Registration is currently closed for this event."
    );
  }

  /* ==========================================
     REGISTRATION WINDOW
  ========================================== */

  const now = new Date();

  if (
    event.registration.opensAt &&
    now < event.registration.opensAt
  ) {
    throw new AppError(
      400,
      "Registration has not opened yet."
    );
  }

  if (
    event.registration.closesAt &&
    now > event.registration.closesAt
  ) {
    throw new AppError(
      400,
      "Registration has already closed."
    );
  }

  /* ==========================================
     EVENT ALREADY FINISHED
  ========================================== */

  if (event.endDate && now > event.endDate) {
    throw new AppError(
      400,
      "This event has already ended."
    );
  }

  /* ==========================================
     DUPLICATE REGISTRATION
  ========================================== */

  const existingRegistration =
    await EventRegistration.findOne({
      event: event._id,
      member: member._id,
    });

  if (existingRegistration) {
    throw new AppError(
      409,
      "You are already registered for this event."
    );
  }

  /* ==========================================
     CAPACITY CHECK
  ========================================== */

  const capacity =
    event.registration?.capacity || 0;

  const confirmedRegistrations =
    await EventRegistration.countDocuments({
      event: event._id,
      registrationStatus: {
        $in: ["confirmed", "pending"],
      },
    });

  const isFull =
    capacity > 0 &&
    confirmedRegistrations >= capacity;

  /* ==========================================
     PAYMENT
  ========================================== */

  const amount =
    event.registration?.fee || 0;

  const paymentRequired = amount > 0;

  /* ==========================================
     STATUS
  ========================================== */

  const registrationStatus = isFull
    ? "waitlisted"
    : paymentRequired
    ? "pending"
    : "confirmed";

  const paymentStatus = paymentRequired
    ? "pending"
    : "not_required";

  /* ==========================================
     CREATE REGISTRATION
  ========================================== */

  const registration =
    await EventRegistration.create({
      event: event._id,

      member: member._id,

      registrationStatus,

      paymentRequired,

      amount,

      paymentStatus,

      createdBy: userId,

      updatedBy: userId,
    });

 /* ==========================================
   UPDATE EVENT COUNTERS
========================================== */

const registeredParticipants =
  await EventRegistration.countDocuments({
    event: event._id,
    registrationStatus: {
      $in: [
        "pending",
        "confirmed",
        "waitlisted",
      ],
    },
  });

await updateRegistrationCounters(
  event._id,
  {
    registeredParticipants,
  }
);

  /* ==========================================
     LOG ACTIVITY
  ========================================== */

  await logActivity({
    user: userId,

    action: ACTIVITY.EVENT.REGISTERED,

    module: ACTIVITY_MODULES.EVENTS,

    targetType: TARGET_TYPES.EVENT,

    targetId: event._id,

    title: "Event Registration",

    description: `Registered for "${event.title}".`,

    status: "success",
  });

  /* ==========================================
     RETURN REGISTRATION
  ========================================== */

  return await EventRegistration.findById(
    registration._id
  )
    .populate(
      "event",
      "title slug startDate endDate coverImage venue registration"
    )
    .populate(
      "member",
      "memberNumber firstName lastName email phone"
    )
    .populate(
      "payment"
    );
};

/* ===========================================================
   GET MY REGISTRATIONS
=========================================================== */

export const getMyRegistrations = async (
  userId,
  query = {}
) => {
  /* ==========================================
     FIND MEMBER
  ========================================== */

  console.log("User ID:", userId);

const member = await Member.findOne({
  user: userId,
});

console.log("Member Found:", member);

  if (!member) {
    throw new AppError(
      404,
      "Member profile not found."
    );
  }

  /* ==========================================
     QUERY OPTIONS
  ========================================== */

  const {
    page = 1,
    limit = 10,
    status,
    attendanceStatus,
    upcoming,
    sort = "-createdAt",
  } = query;

  const filter = {
    member: member._id,
  };

  if (status) {
    filter.registrationStatus = status;
  }

  if (attendanceStatus) {
    filter.attendanceStatus =
      attendanceStatus;
  }

  /* ==========================================
     PAGINATION
  ========================================== */

  const currentPage = Math.max(
    Number(page),
    1
  );

  const pageSize = Math.max(
    Number(limit),
    1
  );

  const skip =
    (currentPage - 1) * pageSize;

  /* ==========================================
     FETCH REGISTRATIONS
  ========================================== */

  let registrations =
    await EventRegistration.find(filter)
      .populate({
        path: "event",
        match:
          upcoming === "true"
            ? {
                endDate: {
                  $gte: new Date(),
                },
              }
            : {
              
              },
      })
      .populate(
        "payment"
      )
      .sort(sort)
      .skip(skip)
      .limit(pageSize);

  /* ==========================================
     REMOVE NULL EVENTS
  ========================================== */

  registrations =
    registrations.filter(
      (registration) =>
        registration.event !== null
    );

  /* ==========================================
     TOTAL COUNT
  ========================================== */

  const total =
    await EventRegistration.countDocuments(
      filter
    );

  /* ==========================================
     RETURN
  ========================================== */

  return {
    registrations,

    pagination: {
      total,

      page: currentPage,

      limit: pageSize,

      totalPages: Math.ceil(
        total / pageSize
      ),

      hasNextPage:
        currentPage * pageSize < total,

      hasPrevPage:
        currentPage > 1,
    },
  };
};

/* ===========================================================
   GET MY REGISTRATION
=========================================================== */

export const getMyRegistration = async (
  eventId,
  userId
) => {
  /* ==========================================
     FIND MEMBER
  ========================================== */

  const member = await Member.findOne({
    user: userId,
  });

  if (!member) {
    throw new AppError(
      404,
      "Member profile not found."
    );
  }

  /* ==========================================
     FIND REGISTRATION
  ========================================== */

  const registration =
    await EventRegistration.findOne({
      event: eventId,
      member: member._id,
    })
      .populate({
        path: "event",
        match: {
        },
      })
      .populate(
        "payment"
      )
      .populate(
        "checkedInBy",
        "firstName lastName email"
      )
      .populate(
        "createdBy",
        "firstName lastName email"
      )
      .populate(
        "updatedBy",
        "firstName lastName email"
      );

  if (!registration || !registration.event) {
    throw new AppError(
      404,
      "Registration not found."
    );
  }

  /* ==========================================
     RETURN
  ========================================== */

  return registration;
};

/* ===========================================================
   CANCEL REGISTRATION
=========================================================== */

export const cancelRegistration = async (
  eventId,
  userId,
  reason = ""
) => {
  /* ==========================================
     FIND MEMBER
  ========================================== */

  const member = await Member.findOne({
    user: userId,
  });

  if (!member) {
    throw new AppError(
      404,
      "Member profile not found."
    );
  }

  /* ==========================================
     FIND REGISTRATION
  ========================================== */

  const registration =
    await EventRegistration.findOne({
      event: eventId,
      member: member._id,
    }).populate("event");

  if (!registration) {
    throw new AppError(
      404,
      "Registration not found."
    );
  }

  /* ==========================================
     VALIDATE EVENT
  ========================================== */

  if (!registration.event) {
    throw new AppError(
      404,
      "Associated event not found."
    );
  }

  /* ==========================================
     ALREADY CANCELLED
  ========================================== */

  if (
    registration.registrationStatus ===
    "cancelled"
  ) {
    throw new AppError(
      400,
      "Registration has already been cancelled."
    );
  }

  /* ==========================================
     EVENT ALREADY STARTED
  ========================================== */

  if (
    registration.event.startDate <= new Date()
  ) {
    throw new AppError(
      400,
      "Registration cannot be cancelled after the event has started."
    );
  }

  /* ==========================================
     ALREADY CHECKED IN
  ========================================== */

  if (registration.checkedIn) {
    throw new AppError(
      400,
      "Checked-in registrations cannot be cancelled."
    );
  }

  /* ==========================================
     CANCEL REGISTRATION
  ========================================== */

  await registration.cancel(reason);

  registration.updatedBy = userId;

  await registration.save();

  /* ==========================================
     UPDATE EVENT COUNTERS
  ========================================== */

  const activeRegistrations =
    await EventRegistration.countDocuments({
      event: registration.event._id,
      registrationStatus: {
        $in: [
          "pending",
          "confirmed",
          "waitlisted",
        ],
      },
    });

  await updateRegistrationCounters(
  registration.event._id,
  {
    registeredParticipants:
      activeRegistrations,
  }
);

  /* ==========================================
     LOG ACTIVITY
  ========================================== */

  await logActivity({
    user: userId,

    action: ACTIVITY.EVENT.UPDATED,

    module: ACTIVITY_MODULES.EVENTS,

    targetType: TARGET_TYPES.EVENT,

    targetId: registration.event._id,

    title: "Registration Cancelled",

    description: `Cancelled registration for "${registration.event.title}".`,

    status: "success",
  });

  /* ==========================================
     RETURN
  ========================================== */

  return await EventRegistration.findById(
    registration._id
  )
    .populate(
      "event",
      "title slug startDate endDate coverImage venue"
    )
    .populate(
      "member",
      "memberNumber firstName lastName"
    )
    .populate("payment");
};
