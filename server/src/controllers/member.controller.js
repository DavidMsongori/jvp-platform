import * as memberService from "../services/member.service.js";

/* ==========================================================
   GET MY PROFILE
========================================================== */

export const getMyProfile = async (

  req,

  res,

  next

) => {

  try {

    if (!req.member) {

      return res.status(404).json({

        success: false,

        message: "Member profile not found.",

      });

    }

    const member = await memberService.getMyProfile(

      req.member._id

    );

    return res.status(200).json({

      success: true,

      message: "Member profile retrieved successfully.",

      data: member,

    });

  } catch (error) {

    next(error);

  }

};

/* ==========================================================
   UPDATE MY PROFILE
========================================================== */

export const updateMyProfile = async (

  req,

  res,

  next

) => {

  try {

    if (!req.member) {

      return res.status(404).json({

        success: false,

        message: "Member profile not found.",

      });

    }

    const member = await memberService.updateMyProfile(

      req.member._id,

      req.body

    );

    return res.status(200).json({

      success: true,

      message: "Profile updated successfully.",

      data: member,

    });

  } catch (error) {

    next(error);

  }

};

/* ==========================================================
   UPLOAD PROFILE PHOTO
========================================================== */

export const uploadProfilePhoto = async (

  req,

  res,

  next

) => {

  try {

    if (!req.member) {

      return res.status(404).json({

        success: false,

        message: "Member profile not found.",

      });

    }

    if (!req.file) {

      return res.status(400).json({

        success: false,

        message: "Please upload a profile photo.",

      });

    }

    console.log("REQ.FILE:", req.file);
    
    const member = await memberService.uploadProfilePhoto(

      req.member._id,

      req.file

    );

    return res.status(200).json({

      success: true,

      message: "Profile photo uploaded successfully.",

      data: member,

    });

  } catch (error) {

    next(error);

  }

};

/* ==========================================================
   MEMBER DASHBOARD
========================================================== */

export const getDashboard = async (

  req,

  res,

  next

) => {

  try {

    if (!req.member) {

      return res.status(404).json({

        success: false,

        message: "Member profile not found.",

      });

    }

    const dashboard = await memberService.getDashboard(

      req.member._id

    );

    return res.status(200).json({

      success: true,

      message: "Dashboard retrieved successfully.",

      data: dashboard,

    });

  } catch (error) {

    next(error);

  }

};