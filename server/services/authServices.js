const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Member = require("../models/Member");

const generateMembershipNumber = require("../utils/membershipNumber");

/**
 * Register a new member
 */
exports.register = async (data) => {
  // Check Email
  const existingEmail = await User.findOne({
    email: data.email,
  });

  if (existingEmail) {
    throw new Error("Email already exists.");
  }

  // Check National ID
  const existingNationalId = await Member.findOne({
    nationalId: data.nationalId,
  });

  if (existingNationalId) {
    throw new Error("National ID already exists.");
  }

  // Check Phone Number
  const existingPhone = await Member.findOne({
    phone: data.phone,
  });

  if (existingPhone) {
    throw new Error("Phone number already exists.");
  }

  // Hash Password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create User
  const user = await User.create({
    email: data.email,
    password: hashedPassword,
    role: "MEMBER",
  });

  try {
    const membershipNumber = await generateMembershipNumber(
      data.county
    );

    // Membership expires after one year
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    // Create Member Profile
    const member = await Member.create({
      user: user._id,

      membershipNumber,

      firstName: data.firstName,
      middleName: data.middleName || "",
      lastName: data.lastName,

      nationalId: data.nationalId,

      phone: data.phone,

      gender: data.gender,

      dateOfBirth: data.dateOfBirth,

      county: data.county,

      subCounty: data.subCounty,

      ward: data.ward,

      occupation: data.occupation || "",

      membershipCategory:
        data.membershipCategory || "ORDINARY",

      // Member is inactive until payment
      membershipStatus: "PENDING_PAYMENT",

      expiresAt: expiry,
    });

    return {
      user,
      member,
    };
  } catch (error) {
    // Rollback user creation if member creation fails
    await User.findByIdAndDelete(user._id);
    throw error;
  }
};

/**
 * Login Member
 */
exports.login = async ({ email, password }) => {
  // Include password for comparison
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  // Compare Password
  const passwordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatch) {
    throw new Error("Invalid email or password.");
  }

  // Get Member Profile
  const member = await Member.findOne({
    user: user._id,
  });

  // Update Last Login
  user.lastLogin = new Date();
  await user.save();

  // Generate JWT Token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  // Remove password before sending user object
  const userResponse = user.toObject();
  delete userResponse.password;

  return {
    token,
    user: userResponse,
    member,
  };
};