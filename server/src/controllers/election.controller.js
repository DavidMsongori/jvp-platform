import * as electionService from "../services/election.service.js";

/* =======================================================
   ELECTIONS
======================================================= */

export const createElection = async (req, res, next) => {
  try {
    const election = await electionService.createElection(
      req.body,
      req.user._id
    );

    res.status(201).json({
      success: true,
      message: "Election created successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const getElections = async (req, res, next) => {
  try {
    const elections =
      await electionService.getElections(req.query);

    res.json({
      success: true,
      data: elections,
    });
  } catch (error) {
    next(error);
  }
};

export const getElection = async (req, res, next) => {
  try {
    const election =
      await electionService.getElectionById(
        req.params.electionId
      );

    res.json({
      success: true,
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const updateElection = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.updateElection(
        req.params.electionId,
        req.body
      );

    res.json({
      success: true,
      message: "Election updated successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminElections = async (req, res, next) => {
  try {
    const elections = await electionService.getAdminElections(
      req.query
    );

    res.json({
      success: true,
      data: elections,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   POSITIONS
======================================================= */

export const addPosition = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.addPosition(
        req.params.electionId,
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Position added successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePosition = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.updatePosition(
        req.params.electionId,
        req.params.positionId,
        req.body
      );

    res.json({
      success: true,
      message: "Position updated successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const removePosition = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.removePosition(
        req.params.electionId,
        req.params.positionId
      );

    res.json({
      success: true,
      message: "Position removed successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   ELECTION LIFECYCLE
======================================================= */

export const openElection = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.openElection(
        req.params.electionId
      );

    res.json({
      success: true,
      message: "Election opened successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const startVoting = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.startVoting(
        req.params.electionId
      );

    res.json({
      success: true,
      message: "Voting started successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const closeElection = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.closeElection(
        req.params.electionId
      );

    res.json({
      success: true,
      message: "Election closed successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelElection = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.cancelElection(
        req.params.electionId
      );

    res.json({
      success: true,
      message: "Election cancelled successfully.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   APPLICATIONS
======================================================= */

export const submitApplication = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await electionService.submitApplication(
        req.params.electionId,
        req.params.positionId,
        req.member,
        req.body
      );

    res.status(201).json({
      success: true,
      message:
        "Application submitted successfully.",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   ADMIN APPLICATIONS
======================================================= */

export const getApplications = async (
  req,
  res,
  next
) => {
  try {
    const applications =
      await electionService.getApplications(
        req.query
      );

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const getApplication = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await electionService.getApplicationById(
        req.params.applicationId
      );

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   APPLICATION REVIEW / VETTING / APPOINTMENT
======================================================= */

export const reviewApplication = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await electionService.reviewApplication(
        req.params.applicationId,
        req.body.status,
        req.body.remarks || "",
        req.user._id
      );

    /*
      The service determines the correct workflow.

      ELECTIVE:
      submitted → review → vetted → approved
      approved → Aspirant created

      NOMINATION:
      submitted → review → vetted → approved
      approved → appointed
    */

    let message =
      "Application reviewed successfully.";

    /*
      NOMINATION APPROVAL
    */
    if (application.status === "appointed") {
      message =
        "Nomination approved and appointment effected successfully.";
    }

    /*
      ELECTIVE APPROVAL
    */
    if (application.status === "approved") {
      message =
        "Application approved successfully. Aspirant record created.";
    }

    /*
      REJECTION
    */
    if (application.status === "rejected") {
      message =
        "Application rejected successfully.";
    }

    /*
      VETTING
    */
    if (application.status === "vetted") {
      message =
        "Application vetted successfully.";
    }

    /*
      REVIEW
    */
    if (application.status === "review") {
      message =
        "Application moved to review successfully.";
    }

    res.json({
      success: true,
      message,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   MEMBER APPLICATIONS
======================================================= */

export const getMyApplications = async (
  req,
  res,
  next
) => {
  try {
    const applications =
      await electionService.getMyApplications(
        req.member
      );

    res.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

export const withdrawApplication = async (
  req,
  res,
  next
) => {
  try {
    const application =
      await electionService.withdrawApplication(
        req.params.applicationId,
        req.member
      );

    res.json({
      success: true,
      message:
        "Application withdrawn successfully.",
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   ASPIRANTS
======================================================= */

/*
 * Get aspirants.
 *
 * Supports:
 * GET /elections/aspirants
 * GET /elections/:electionId/aspirants
 */
export const getAspirants = async (
  req,
  res,
  next
) => {
  try {
    const filters = {
      ...req.query,
    };

    if (req.params.electionId) {
      filters.election =
        req.params.electionId;
    }

    const aspirants =
      await electionService.getAspirants(
        filters
      );

    res.json({
      success: true,
      data: aspirants,
    });
  } catch (error) {
    next(error);
  }
};

export const getAspirant = async (
  req,
  res,
  next
) => {
  try {
    const aspirant =
      await electionService.getAspirantById(
        req.params.aspirantId
      );

    res.json({
      success: true,
      data: aspirant,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   LEGACY / EXISTING ASPIRANT SETUP
======================================================= */

/*
 * Search existing active JVP members.
 *
 * Used by administrators when adding aspirants
 * who applied through an older/manual process.
 *
 * Example:
 *
 * GET /elections/members/search?q=David
 */
export const searchMembersForElection = async (
  req,
  res,
  next
) => {
  try {
    const members =
      await electionService.searchMembersForElection(
        req.query.q
      );

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Add an existing/manual aspirant directly
 * to an elective election.
 *
 * Body:
 *
 * {
 *   "memberId": "...",
 *   "positionId": "...",
 *   "name": "...",
 *   "photo": "...",
 *   "manifesto": "..."
 * }
 */
export const addExistingAspirant = async (
  req,
  res,
  next
) => {
  try {
    const {
      memberId,
      positionId,
      name,
      photo,
      manifesto,
    } = req.body;

    const aspirant =
      await electionService.addExistingAspirant(
        req.params.electionId,
        positionId,
        memberId,
        {
          name,
          photo,
          manifesto,
        }
      );

    res.status(201).json({
      success: true,
      message:
        "Existing aspirant added successfully.",
      data: aspirant,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Remove/withdraw a legacy aspirant
 * before voting starts.
 */
export const removeExistingAspirant = async (
  req,
  res,
  next
) => {
  try {
    const aspirant =
      await electionService.removeExistingAspirant(
        req.params.electionId,
        req.params.aspirantId
      );

    res.json({
      success: true,
      message:
        "Existing aspirant removed from the active ballot successfully.",
      data: aspirant,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Get election setup/readiness.
 *
 * Returns:
 * - election
 * - positions
 * - aspirants
 * - aspirant counts
 * - positions without aspirants
 * - readiness status
 */
export const getElectionSetup = async (
  req,
  res,
  next
) => {
  try {
    const setup =
      await electionService.getElectionSetup(
        req.params.electionId
      );

    res.json({
      success: true,
      data: setup,
    });
  } catch (error) {
    next(error);
  }
};

/*
 * Prepare an existing election for voting.
 *
 * Supports:
 *
 * draft → open → voting
 *
 * or:
 *
 * open → voting
 */
export const prepareElectionForVoting = async (
  req,
  res,
  next
) => {
  try {
    const election =
      await electionService.prepareElectionForVoting(
        req.params.electionId
      );

    res.json({
      success: true,
      message:
        "Election is now ready for voting.",
      data: election,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   VOTING
======================================================= */

export const castVote = async (
  req,
  res,
  next
) => {
  try {
    const vote =
      await electionService.castVote(
        req.params.electionId,
        req.params.positionId,
        req.body.aspirantId,
        req.member
      );

    res.status(201).json({
      success: true,
      message: "Vote cast successfully.",
      data: vote,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyVotes = async (
  req,
  res,
  next
) => {
  try {
    const votes =
      await electionService.getMyVotes(
        req.params.electionId || null,
        req.member
      );

    res.json({
      success: true,
      data: votes,
    });
  } catch (error) {
    next(error);
  }
};

/* =======================================================
   RESULTS
======================================================= */

export const getResults = async (
  req,
  res,
  next
) => {
  try {
    const results =
      await electionService.getResults(
        req.params.electionId
      );

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

export const publishResults = async (
  req,
  res,
  next
) => {
  try {
    const results =
      await electionService.publishResults(
        req.params.electionId
      );

    res.json({
      success: true,
      message:
        "Election results published successfully.",
      data: results,
    });
  } catch (error) {
    next(error);
  }
};