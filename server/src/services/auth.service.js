const bcrypt = require("bcryptjs");

const Member = require("../models/Member");

const generateOTP = require("../utils/generateOTP");
const generateMembershipNumber = require("../utils/generateMembershipNumber");
const generateToken = require("../utils/generateToken");

class AuthService {

  /* =====================================================
     ACTIVATE MEMBER
  ===================================================== */

  async activate({ phone, email }) {

    if (phone) phone = phone.trim();

    if (email) email = email.trim().toLowerCase();

    if (!phone && !email) {
      throw new Error("Phone number or email is required.");
    }

    let member = null;

    if (phone) {
      member = await Member.findOne({ phone });
    }

    if (!member && email) {
      member = await Member.findOne({ email });
    }

    if (!member) {
      throw new Error("Member not found.");
    }

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await Member.updateOne(
      { _id: member._id },
      {
        $set: {
          otp,
          otpExpires,
          activationStatus: "Pending OTP",
        },
      }
    );

    const updatedMember =
      await Member.findById(member._id);

    return {
      success: true,
      message: "Member found successfully.",
      member: updatedMember,
      otp,
    };
  }

  /* =====================================================
     VERIFY OTP
  ===================================================== */

  async verifyOTP({ memberId, otp }) {

    if (!memberId || !otp) {
      throw new Error(
        "Member ID and OTP are required."
      );
    }

    const member =
      await Member.findById(memberId);

    if (!member) {
      throw new Error("Member not found.");
    }

    if (!member.otp) {
      throw new Error(
        "No OTP has been generated."
      );
    }

    if (String(member.otp) !== String(otp)) {
      throw new Error("Invalid OTP.");
    }

    if (
      member.otpExpires &&
      new Date() > member.otpExpires
    ) {
      throw new Error("OTP has expired.");
    }

    await Member.updateOne(
      { _id: member._id },
      {
        $set: {
          activationStatus: "OTP Verified",
        },
      }
    );

    const updatedMember =
      await Member.findById(member._id);

    return {
      success: true,
      message: "OTP verified successfully.",
      member: updatedMember,
    };
  }

  /* =====================================================
     CREATE PASSWORD
  ===================================================== */

  async createPassword({
    memberId,
    password,
  }) {

    if (!memberId) {
      throw new Error("Member ID is required.");
    }

    if (!password) {
      throw new Error("Password is required.");
    }

    if (password.length < 8) {
      throw new Error(
        "Password must be at least 8 characters."
      );
    }

    const member =
      await Member.findById(memberId);

    if (!member) {
      throw new Error("Member not found.");
    }

    if (
      member.activationStatus !==
      "OTP Verified"
    ) {
      throw new Error(
        "Please verify OTP first."
      );
    }

    const hashedPassword =
      await bcrypt.hash(password, 12);

    let membershipNumber =
      member.membershipNumber;

    if (!membershipNumber) {

      membershipNumber =
        await generateMembershipNumber(
          member.county
        );

    }

    await Member.updateOne(
      { _id: member._id },
      {
        $set: {

          password: hashedPassword,

          membershipNumber,

          activationStatus: "Activated",

          membershipStatus: "Active",

          memberSince: new Date(),

          activationDate: new Date(),

          passwordCreatedAt: new Date(),

          migrationCompleted: true,

          otp: null,

          otpExpires: null,

        },
      }
    );

    const updatedMember =
      await Member.findById(member._id);

    const token =
      generateToken(updatedMember);

    return {

      success: true,

      message:
        "Account activated successfully.",

      token,

      member: updatedMember,

    };

  }

  /* =====================================================
     LOGIN
  ===================================================== */

  async login({
    phone,
    email,
    password,
  }) {

    if ((!phone && !email) || !password) {
      throw new Error(
        "Phone/Email and password are required."
      );
    }

    let member = null;

    if (phone) {

      member =
        await Member.findOne({
          phone: phone.trim(),
        });

    }

    if (!member && email) {

      member =
        await Member.findOne({
          email: email
            .trim()
            .toLowerCase(),
        });

    }

    if (!member) {
      throw new Error("Member not found.");
    }

    if (!member.password) {
      throw new Error(
        "Please activate your account."
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        password,
        member.password
      );

    if (!passwordMatches) {
      throw new Error(
        "Incorrect password."
      );
    }

    await Member.updateOne(
      { _id: member._id },
      {
        $inc: {
          loginCount: 1,
        },
        $set: {
          lastLogin: new Date(),
        },
      }
    );

    const updatedMember =
      await Member.findById(member._id);

    const token =
      generateToken(updatedMember);

    return {

      success: true,

      message:
        "Login successful.",

      token,

      member: updatedMember,

    };

  }

  /* =====================================================
     CURRENT MEMBER
  ===================================================== */

  async me(memberId) {

    const member =
      await Member.findById(memberId)
        .select("-password -otp -otpExpires");

    if (!member) {
      throw new Error("Member not found.");
    }

    return {

      success: true,

      message:
        "Member retrieved successfully.",

      member,

    };

  }

}

module.exports = new AuthService();