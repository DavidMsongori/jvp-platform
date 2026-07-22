import crypto from "crypto";

import Leader from "../models/leader.model.js";
import AppError from "../utils/AppError.js";

class LeadershipCardService {

  /* =====================================================
     PRIVATE HELPERS
  ===================================================== */

  async findLeader(id) {

   const leader = await Leader.findById(id).populate({
  path: "member",
  select:
    "memberNumber firstName middleName lastName profilePhoto county constituency ward membershipStatus",
});
    if (!leader) {
      throw new AppError(404, "Leader not found.");
    }

    return leader;

  }

 generateVerificationCode(leader) {

  return crypto
    .createHash("sha256")
    .update(leader._id.toString())
    .digest("hex")
    .substring(0, 12)
    .toUpperCase();

}

  generateVerificationUrl(code) {

    return `/api/leadership-card/verify/${code}`;

  }

  getExpiryDate(termEnd) {

    if (!termEnd) return null;

    return new Date(termEnd);

  }

  isEligible(leader) {

    if (!leader) return false;

    if (!leader.isActive) return false;

    if (leader.status !== "active") return false;

    return true;

  }

    /* =====================================================
     BUILD CARD
  ===================================================== */

  buildCard(leader) {

    if (!this.isEligible(leader)) {
      throw new AppError(
        403,
        "This leader is not eligible for a leadership card."
      );
    }

    const verificationCode =
      this.generateVerificationCode(leader);

    return {

      leader: {

        id: leader._id,

        memberId: leader.member?._id ?? null,

        memberNumber:
          leader.member?.memberNumber ?? null,

        fullName:
          leader.profile.fullName,

        profilePhoto:
          leader.profile.profilePhoto,

        position:
          leader.position,

        category:
          leader.category,

        department:
          leader.department,

        scope:
          leader.scope,

        county:
          leader.county,

        constituency:
          leader.constituency,

        ward:
          leader.ward,

        termStart:
          leader.termStart,

        termEnd:
          leader.termEnd,

      },

      card: {

        verificationCode,

        verificationUrl:
          this.generateVerificationUrl(
            verificationCode
          ),

        issuedAt:
          leader.activatedAt ??
          leader.createdAt,

        expiresAt:
          this.getExpiryDate(
            leader.termEnd
          ),

        status:
          leader.status,

        verified:
          leader.verified,

      },

    };

  }

  /* =====================================================
     GET CARD BY LEADER ID
  ===================================================== */

 async getLeadershipCard(leaderId) {

  console.log("Step 1");

  const leader = await this.findLeader(leaderId);

  console.log("Step 2");

  const card = this.buildCard(leader);

  console.log("Step 3");

  return card;

}

  /* =====================================================
     GET MY CARD
  ===================================================== */

  async getMyLeadershipCard(memberId) {

    const leader = await Leader.findOne({
      member: memberId,
      isActive: true,
}).populate({
  path: "member",
  select:
    "memberNumber firstName middleName lastName profilePhoto county constituency ward membershipStatus",
});

    if (!leader) {
      throw new AppError(
        404,
        "Leadership record not found."
      );
    }

    return this.buildCard(leader);

  }

    /* =====================================================
     VERIFY LEADERSHIP CARD
  ===================================================== */

  async verifyLeadershipCard(code) {

    const leaders = await Leader.find({
      isActive: true,
    }).populate({
  path: "member",
  select:
    "memberNumber firstName middleName lastName profilePhoto county constituency ward membershipStatus",
});

    const leader = leaders.find(
      (item) =>
        this.generateVerificationCode(item) ===
        code.toUpperCase()
    );

    if (!leader) {
      throw new AppError(
        404,
        "Leadership card not found."
      );
    }

    if (!this.isEligible(leader)) {
      throw new AppError(
        403,
        "Leadership card is no longer valid."
      );
    }

    return {
      verified: true,
      message: "Leadership card verified successfully.",
      card: this.buildCard(leader),
    };

  }

  /* =====================================================
     PUBLIC CARD
  ===================================================== */

  async getPublicLeadershipCard(code) {

    const result =
      await this.verifyLeadershipCard(code);

    return {
      verified: result.verified,

      leader: {
        fullName:
          result.card.leader.fullName,

        position:
          result.card.leader.position,

        category:
          result.card.leader.category,

        department:
          result.card.leader.department,

        scope:
          result.card.leader.scope,

        county:
          result.card.leader.county,

        profilePhoto:
          result.card.leader.profilePhoto,
      },

      card: {
        verificationCode:
          result.card.card.verificationCode,

        issuedAt:
          result.card.card.issuedAt,

        expiresAt:
          result.card.card.expiresAt,
      },
    };

  }

  /* =====================================================
     REBUILD CARD
  ===================================================== */

  async regenerateLeadershipCard(leaderId) {

    const leader =
      await this.findLeader(leaderId);

    return this.buildCard(leader);

  }

  

}

export default new LeadershipCardService();