import Member from "../models/Member.js";
import Payment from "../models/Payment.js";
import Registration from "../models/Registration.js";
import ActivityLog from "../models/ActivityLog.js";
import AppError from "../utils/AppError.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

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

    occupation,

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

  if (occupation !== undefined) {

    member.occupation = occupation;

  }

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

export const getDashboard = async (

  memberId

) => {

  const member = await Member.findById(

    memberId

  ).populate(

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

  return {

    profile: {

  id: member._id,

  memberNumber: member.memberNumber,

  firstName: member.firstName,

  middleName: member.middleName,

  lastName: member.lastName,

  county: member.county,

  membershipType: member.membershipType,

  membershipStatus: member.membershipStatus,

  profilePhoto: member.profilePhoto,

  joinedAt: member.joinedAt,

  email: member.user.email,

  role: member.user.role,

},

    statistics: {

      totalPayments,

      totalRegistrations,

    },

    recentPayments,

    upcomingEvents,

  };

};

/* ==========================================================
   UPLOAD PROFILE PHOTO
========================================================== */

export const uploadProfilePhoto = async (
  memberId,
  file
) => {

  const member = await Member.findById(memberId);

  if (!member) {
    throw new AppError(
      "Member profile not found.",
      404
    );
  }

  if (!file || !file.buffer) {
    throw new AppError(
      "Please upload a profile photo.",
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
     UPLOAD NEW PHOTO
  ========================================== */

  const result = await new Promise((resolve, reject) => {

    const uploadStream = cloudinary.uploader.upload_stream(

      {
        folder: "jvp-connect/profile",

        public_id:
  member.memberNumber
    ? `member-${member.memberNumber.replace(/\//g, "-")}`
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

    console.log("========== CLOUDINARY ERROR ==========");
    console.dir(error, { depth: null });
    console.log("======================================");

    return reject(error);

  }

  resolve(result);

}

    );

    streamifier
      .createReadStream(file.buffer)
      .pipe(uploadStream);

  });

  /* ==========================================
     SAVE MEMBER
  ========================================== */

  member.profilePhoto = result.secure_url;
  member.profilePhotoPublicId = result.public_id;

  await member.save();

  /* ==========================================
     ACTIVITY LOG
  ========================================== */

  await ActivityLog.create({

    user: member.user,

    action: "Updated profile photo",

    module: "members",

    description: "Profile photo uploaded.",

    targetId: member._id,

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