import leadershipCardService from "../services/leadershipCard.service.js";

class LeadershipCardController {

  /* =====================================================
     GET MY LEADERSHIP CARD
  ===================================================== */

  async getMyLeadershipCard(req, res, next) {

    try {

      const card =
        await leadershipCardService.getMyLeadershipCard(
          req.member._id
        );

      return res.status(200).json({
        success: true,
        message: "Leadership card retrieved successfully.",
        data: card,
      });

    } catch (error) {
      next(error);
    }

  }

  /* =====================================================
     GET LEADERSHIP CARD
  ===================================================== */

  async getLeadershipCard(req, res, next) {

    try {

      const card =
        await leadershipCardService.getLeadershipCard(
          req.params.leaderId
        );

      return res.status(200).json({
        success: true,
        message: "Leadership card retrieved successfully.",
        data: card,
      });

    } catch (error) {
      next(error);
    }

  }

  /* =====================================================
     VERIFY LEADERSHIP CARD
  ===================================================== */

  async verifyLeadershipCard(req, res, next) {

    try {

      const result =
        await leadershipCardService.verifyLeadershipCard(
          req.params.code
        );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });

    } catch (error) {
      next(error);
    }

  }

  /* =====================================================
     GET PUBLIC LEADERSHIP CARD
  ===================================================== */

  async getPublicLeadershipCard(req, res, next) {

    try {

      const card =
        await leadershipCardService.getPublicLeadershipCard(
          req.params.code
        );

      return res.status(200).json({
        success: true,
        message: "Leadership card retrieved successfully.",
        data: card,
      });

    } catch (error) {
      next(error);
    }

  }

  /* =====================================================
     REGENERATE LEADERSHIP CARD
  ===================================================== */

  async regenerateLeadershipCard(req, res, next) {

    try {

      const card =
        await leadershipCardService.regenerateLeadershipCard(
          req.params.leaderId
        );

      return res.status(200).json({
        success: true,
        message: "Leadership card regenerated successfully.",
        data: card,
      });

    } catch (error) {
      next(error);
    }

  }

}

export default new LeadershipCardController();