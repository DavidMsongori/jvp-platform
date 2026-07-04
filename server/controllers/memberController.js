const Member = require("../models/Member");

const testDatabase = async (req, res) => {
  try {

    const totalMembers = await Member.countDocuments();

    res.status(200).json({
      success: true,
      message: "Database connection successful.",
      totalMembers,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

module.exports = {
  testDatabase,
};