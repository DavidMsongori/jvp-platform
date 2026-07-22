import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Registration from "../models/Registration.js";
import ActivityLog from "../models/ActivityLog.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import Leader from "../models/leader.model.js";
import { calculateProfileCompletion } from "../utils/profileCompletion.js";

/* ==========================================================
   GET MY PROFILE
========================================================== */

export const getMyProfile = async (memberId) => {

  const member = await Member.findById(memberId)

    .populate(

      "user",

      "email role isActive createdAt"

    );

  if (!member) {

    throw new AppError(

      "Member profile not found.",

      404

    );

  }

  return member;

};

/* ==========================================================
   UPDATE MY PROFILE
========================================================== */

export const updateMyProfile = async (

  memberId,

  data

) => {

  const member = await Member.findById(memberId);

  if (!member) {

    throw new AppError(

      "Member profile not found.",

      404

    );

  }

  const {

  firstName,

  middleName,

  lastName,

  phone,

  county,
  constituency,
  ward,

  occupation,

  disability,

} = data;

  /* ==========================================
     CHECK PHONE NUMBER
  ========================================== */

  if (

    phone &&

    phone !== member.phone

  ) {

    const existingPhone = await Member.findOne({

      phone,

      _id: {

        $ne: member._id,

      },

    });

    if (existingPhone) {

      throw new AppError(

        "Phone number already exists.",

        409

      );

    }

    member.phone = phone;

  }

  /* ==========================================
     UPDATE FIELDS
  ========================================== */

  if (firstName !== undefined) {

    member.firstName = firstName;

  }

  if (middleName !== undefined) {

    member.middleName = middleName;

  }

  if (lastName !== undefined) {

    member.lastName = lastName;

  }

 if (county !== undefined) {

  member.county = county;

}

if (constituency !== undefined) {

  member.constituency = constituency;

}

if (ward !== undefined) {

  member.ward = ward;

}

if (occupation !== undefined) {

  member.occupation = occupation;

}

if (disability !== undefined) {

  member.disability = disability;

}

  /* ==========================================
   PROFILE COMPLETION
========================================== */

member.profileCompletion =
  calculateProfileCompletion(member);

await member.save();


  /* ==========================================
     ACTIVITY LOG
  ========================================== */

  await ActivityLog.create({

    user: member.user,

    action: "Updated profile information",

    module: "members",

    description: "Member updated profile information.",

    targetId: member._id,

  });

  return await Member.findById(

    member._id

  ).populate(

    "user",

    "email role isActive createdAt"

  );

};

/* ==========================================================
   MEMBER DASHBOARD
========================================================== */

export const getDashboard = async (memberId) => {

  /* ==========================================
     MEMBER
  ========================================== */

  const member = await Member.findById(memberId)
    .populate(
      "user",
      "email role isActive"
    );

  if (!member) {
    throw new AppError(
      "Member profile not found.",
      404
    );
  }

  /* ==========================================
     LEADERSHIP
  ========================================== */

  const leader = await Leader.findOne({
    member: member._id,
    isActive: true,
  });

  const leadership = {
    isLeader: !!leader,

    hasLeadershipCard: !!leader,

    category: leader?.category ?? null,

    position: leader?.position ?? null,

    county: leader?.county ?? null,

    constituency: leader?.constituency ?? null,

    ward: leader?.ward ?? null,

    termStart: leader?.termStart ?? null,

    termEnd: leader?.termEnd ?? null,
  };

  /* ==========================================
     PAYMENTS
  ========================================== */

  const totalPayments =
    await Payment.countDocuments({
      member: member._id,
      status: "successful",
    });

  const recentPayments =
    await Payment.find({
      member: member._id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(5);

  /* ==========================================
     EVENT REGISTRATIONS
  ========================================== */

  const totalRegistrations =
    await Registration.countDocuments({
      member: member._id,
    });

  const upcomingEvents =
    await Registration.find({
      member: member._id,
    })
      .populate({
        path: "event",
        select:
          "title venue startDate endDate status",
      })
      .sort({
        createdAt: -1,
      })
      .limit(5);

  /* ==========================================
     MEMBER
  ========================================== */

  const memberData = {

    id: member._id,

    memberNumber: member.memberNumber,

    firstName: member.firstName,

    middleName: member.middleName,

    lastName: member.lastName,

    county: member.county,

    constituency: member.constituency,

    ward: member.ward,

    membershipType: member.membershipType,

    membershipStatus: member.membershipStatus,

    profilePhoto: member.profilePhoto,

    joinedAt: member.joinedAt,

    email: member.user?.email,

    role: member.user?.role,

  };

  /* ==========================================
     SUMMARY
  ========================================== */

  const summary = {

    totalPayments,

    totalRegistrations,

    unreadNotifications: 0,

    activePrograms: 0,

  };

  /* ==========================================
     STATISTICS
  ========================================== */

  const statistics = {

    totalPayments,

    totalRegistrations,

   profileCompletion:
    member.profileCompletion ?? 0,

    loginCount:
      member.loginCount ?? 0,

    lastLogin:
      member.lastLogin ?? null,

    volunteerHours: 0,

    /* Future leadership stats */

    membersServed: 0,

    eventsCoordinated: 0,

    reportsSubmitted: 0,

    performanceScore: 0,

  };

  /* ==========================================
     PROFILE COMPLETION
  ========================================== */

  const completion = {

    profile:
    member.profileCompletion ?? 0,

    membership:
      member.membershipStatus === "active"
        ? 100
        : 50,

  };

  /* ==========================================
     PLACEHOLDERS
  ========================================== */

  const notifications = [];

  const news = [];

  const recentActivity = [];

  /* ==========================================
     RESPONSE
  ========================================== */

  return {

    member: memberData,

    leadership,

    summary,

    statistics,

    completion,

    events: upcomingEvents,

    notifications,

    news,

    recentActivity,

    recentPayments,

  };

};

/* ==========================================================
   UPLOAD PROFILE PHOTO
========================================================== */

export const uploadProfilePhoto = async (
  memberId,
  file
) => {

  /* ==========================================
     FIND MEMBER
  ========================================== */

  const member = await Member.findById(memberId);

  if (!member) {

    throw new AppError(
      "Member profile not found.",
      404
    );

  }

  /* ==========================================
     VALIDATE FILE
  ========================================== */

  if (!file) {

    throw new AppError(
      "Please select a profile photo.",
      400
    );

  }

  if (!file.buffer) {

    throw new AppError(
      "Uploaded file could not be processed.",
      400
    );

  }

  /* ==========================================
     DELETE PREVIOUS PHOTO
  ========================================== */

  if (member.profilePhotoPublicId) {

    try {

      await cloudinary.uploader.destroy(
        member.profilePhotoPublicId
      );

    } catch (error) {

      console.error(
        "Failed to delete previous profile photo:",
        error.message
      );

    }

  }

  /* ==========================================
     UPLOAD TO CLOUDINARY
  ========================================== */

  const result = await new Promise(

    (resolve, reject) => {

      const uploadStream =
        cloudinary.uploader.upload_stream(

          {

            folder:
              "jvp-connect/profile",

            public_id:

              member.memberNumber

                ? `member-${member.memberNumber
                    .replace(/\//g, "-")}`

                : `member-${member._id}`,

            overwrite: true,

            invalidate: true,

            transformation: [

              {

                width: 500,

                height: 500,

                crop: "fill",

                gravity: "face",

                quality: "auto",

                fetch_format: "auto",

              },

            ],

            resource_type: "image",

          },

          (error, result) => {

            if (error) {

              console.error(
                "Cloudinary upload failed:",
                error
              );

              return reject(error);

            }

            resolve(result);

          }

        );

      streamifier

        .createReadStream(file.buffer)

        .pipe(uploadStream);

    }

  );

  /* ==========================================
     UPDATE MEMBER PHOTO
  ========================================== */

  member.profilePhoto =
    result.secure_url;

  member.profilePhotoPublicId =
    result.public_id;

  /* ==========================================
     UPDATE PROFILE COMPLETION
  ========================================== */

  member.profileCompletion =
    calculateProfileCompletion(member);

  await member.save();

  /* ==========================================
     LOG ACTIVITY
  ========================================== */

  await ActivityLog.create({

    user: member.user,

    action:
      ACTIVITY.MEMBER.PROFILE_PHOTO_UPDATED,

    module:
      ACTIVITY_MODULES.MEMBERS,

    targetType:
      TARGET_TYPES.MEMBER,

    targetId:
      member._id,

    title:
      "Profile Photo Updated",

    description:
      "Member successfully uploaded a new profile photo.",

    status:
      "success",

  });

  /* ==========================================
     RETURN UPDATED MEMBER
  ========================================== */

  return await Member.findById(

    member._id

  ).populate(

    "user",

    "email role isActive createdAt"

  );

};

/* ==========================================================
   SEARCH MEMBERS
========================================================== */

export const searchMembers = async (query = "") => {

  const search = query.trim();

  /* ==========================================
     EMPTY SEARCH
  ========================================== */

  if (!search) {

    return [];

  }

  /* ==========================================
     ESCAPE SPECIAL REGEX CHARACTERS
  ========================================== */

  const escapedSearch = search.replace(

    /[.*+?^${}()|[\]\\]/g,

    "\\$&"

  );

  const regex = new RegExp(

    escapedSearch,

    "i"

  );

  /* ==========================================
     SEARCH ACTIVE MEMBERS
  ========================================== */

  const members = await Member.find({

    membershipStatus: "active",

    $or: [

      {

        memberNumber: regex,

      },

      {

        firstName: regex,

      },

      {

        middleName: regex,

      },

      {

        lastName: regex,

      },

      {

        phone: regex,

      },

    ],

  })

    .select({

      memberNumber: 1,

      firstName: 1,

      middleName: 1,

      lastName: 1,

      county: 1,

      profilePhoto: 1,

      membershipStatus: 1,

    })

    .sort({

      firstName: 1,

      lastName: 1,

    })

    .limit(15)

    .lean();

  return members;

};