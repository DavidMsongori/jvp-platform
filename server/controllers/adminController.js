const Member = require("../models/Member");

/* ==================================================
   GET ALL MEMBERS
================================================== */

const getMembers = async (req, res) => {
  try {
    const members = await Member.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ==================================================
   GET MEMBER
================================================== */

const getMember = async (req, res) => {
  try {

    const member = await Member.findById(req.params.id)
      .select("-password");

    if (!member) {

      return res.status(404).json({

        success: false,

        message: "Member not found.",

      });

    }

    res.json({

      success: true,

      member,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }
};

/* ==================================================
   UPDATE MEMBER
================================================== */

const updateMember = async (req, res) => {

  try {

    const member = await Member.findByIdAndUpdate(

      req.params.id,

      req.body,

      {

        new: true,

        runValidators: true,

      }

    ).select("-password");

    if (!member) {

      return res.status(404).json({

        success: false,

        message: "Member not found.",

      });

    }

    res.json({

      success: true,

      message: "Member updated successfully.",

      member,

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/* ==================================================
   DELETE MEMBER
================================================== */

const deleteMember = async (req, res) => {

  try {

    const member = await Member.findById(req.params.id);

    if (!member) {

      return res.status(404).json({

        success: false,

        message: "Member not found.",

      });

    }

    await member.deleteOne();

    res.json({

      success: true,

      message: "Member deleted.",

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

/* ==================================================
   DASHBOARD STATISTICS
================================================== */

const dashboardStats = async (req, res) => {

  try {

    const totalMembers = await Member.countDocuments();

    const activeMembers = await Member.countDocuments({

      membershipStatus: "Active",

    });

    const activatedMembers = await Member.countDocuments({

      activationStatus: "Activated",

    });

    const pendingMembers = await Member.countDocuments({

      activationStatus: "Not Activated",

    });

    res.json({

      success: true,

      statistics: {

        totalMembers,

        activeMembers,

        activatedMembers,

        pendingMembers,

      },

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }

};

module.exports = {

  getMembers,

  getMember,

  updateMember,

  deleteMember,

  dashboardStats,

};