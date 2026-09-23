import express from "express";

import * as electionController from "../controllers/election.controller.js";

import auth from "../middleware/auth.js";

import authorize from "../middleware/authorize.js";

const router = express.Router();

/* ==========================================================
   MEMBER — APPLICATIONS

   Static routes MUST come before /:electionId
========================================================== */

router.get(
  "/my-applications",
  auth,
  electionController.getMyApplications
);

/* ==========================================================
   MEMBER — VOTES
========================================================== */

router.get(
  "/my-votes",
  auth,
  electionController.getMyVotes
);

/* ==========================================================
   ADMIN — MEMBER SEARCH

   Used when adding existing/legacy aspirants directly
   to an elective election.
========================================================== */

router.get(
  "/members/search",
  auth,
  authorize("admin", "super_admin"),
  electionController.searchMembersForElection
);

/* ==========================================================
   ADMIN — APPLICATION MANAGEMENT
========================================================== */

router.get(
  "/applications",
  auth,
  authorize("admin", "super_admin"),
  electionController.getApplications
);

router.get(
  "/applications/:applicationId",
  auth,
  authorize("admin", "super_admin"),
  electionController.getApplication
);

router.patch(
  "/applications/:applicationId/review",
  auth,
  authorize("admin", "super_admin"),
  electionController.reviewApplication
);

/* ==========================================================
   MEMBER — APPLICATION WITHDRAWAL
========================================================== */

router.patch(
  "/applications/:applicationId/withdraw",
  auth,
  electionController.withdrawApplication
);

/* ==========================================================
   ADMIN — ASPIRANT MANAGEMENT

   Aspirants only exist for ELECTIVE elections.
========================================================== */

router.get(
  "/aspirants",
  auth,
  authorize("admin", "super_admin"),
  electionController.getAspirants
);

router.get(
  "/aspirants/:aspirantId",
  auth,
  authorize("admin", "super_admin"),
  electionController.getAspirant
);

router.get(
  "/admin",
  auth,
  authorize("admin", "super_admin"),
  electionController.getAdminElections
);

/* ==========================================================
   PUBLIC — ELECTION LIST

   Visitors can view publicly available elections.

   Draft and cancelled elections remain hidden by the
   election service unless explicitly requested by admin.
========================================================== */

router.get(
  "/",
  electionController.getElections
);

/* ==========================================================
   ADMIN — EXISTING / LEGACY ASPIRANT SETUP

   These routes support elections where candidates already
   exist outside the normal application → vetting → approval
   workflow.

   Example:
   - Lamu Speaker election
   - Mombasa County Assembly Speaker election
========================================================== */

/*
   View complete election setup and readiness.
*/

router.get(
  "/:electionId/setup",
  auth,
  authorize("admin", "super_admin"),
  electionController.getElectionSetup
);

/*
   Add an existing JVP member directly as an aspirant.
*/

router.post(
  "/:electionId/existing-aspirants",
  auth,
  authorize("admin", "super_admin"),
  electionController.addExistingAspirant
);

/*
   Remove an existing/legacy aspirant from the active ballot.

   The service should normally mark the aspirant as
   withdrawn rather than permanently deleting the record.
*/

router.delete(
  "/:electionId/existing-aspirants/:aspirantId",
  auth,
  authorize("admin", "super_admin"),
  electionController.removeExistingAspirant
);

/*
   Prepare the election and move it into voting.

   This endpoint can handle:

   draft → open → voting

   or:

   open → voting

   The service performs all eligibility/readiness checks.
*/

router.post(
  "/:electionId/prepare-for-voting",
  auth,
  authorize("admin", "super_admin"),
  electionController.prepareElectionForVoting
);

/* ==========================================================
   ELECTION-SPECIFIC MEMBER / PUBLIC ROUTES
========================================================== */

/*
   Member — View votes for a specific election
*/

router.get(
  "/:electionId/my-votes",
  auth,
  electionController.getMyVotes
);

/*
   Member — View aspirants for an elective election
*/

router.get(
  "/:electionId/aspirants",
  auth,
  electionController.getAspirants
);

/*
   Public — View published election results
*/

router.get(
  "/:electionId/results",
  electionController.getResults
);

/*
   Member — Submit application

   Login is required.
*/

router.post(
  "/:electionId/positions/:positionId/apply",
  auth,
  electionController.submitApplication
);

/*
   Member — Cast vote

   Login is required.

   The service automatically rejects this for
   nomination exercises.
*/

router.post(
  "/:electionId/positions/:positionId/vote",
  auth,
  electionController.castVote
);

/* ==========================================================
   PUBLIC — SINGLE ELECTION
========================================================== */

/*
   Visitors can view election details without logging in.

   Apply and Vote remain protected above.
*/

router.get(
  "/:electionId",
  electionController.getElection
);

/* ==========================================================
   ADMIN — ELECTION MANAGEMENT
========================================================== */

/*
   Create election
*/

router.post(
  "/",
  auth,
  authorize("admin", "super_admin"),
  electionController.createElection
);

/*
   Update election
*/

router.patch(
  "/:electionId",
  auth,
  authorize("admin", "super_admin"),
  electionController.updateElection
);

/* ==========================================================
   ADMIN — POSITION MANAGEMENT
========================================================== */

/*
   Add position
*/

router.post(
  "/:electionId/positions",
  auth,
  authorize("admin", "super_admin"),
  electionController.addPosition
);

/*
   Update existing position
*/

router.patch(
  "/:electionId/positions/:positionId",
  auth,
  authorize("admin", "super_admin"),
  electionController.updatePosition
);

/*
   Delete position
*/

router.delete(
  "/:electionId/positions/:positionId",
  auth,
  authorize("admin", "super_admin"),
  electionController.removePosition
);

/* ==========================================================
   ADMIN — ELECTION LIFECYCLE
========================================================== */

/*
   Open applications
*/

router.post(
  "/:electionId/open",
  auth,
  authorize("admin", "super_admin"),
  electionController.openElection
);

/*
   Start voting

   Service automatically blocks this for
   nomination exercises.
*/

router.post(
  "/:electionId/start-voting",
  auth,
  authorize("admin", "super_admin"),
  electionController.startVoting
);

/*
   Close elective election
*/

router.post(
  "/:electionId/close",
  auth,
  authorize("admin", "super_admin"),
  electionController.closeElection
);

/*
   Cancel election / nomination exercise
*/

router.post(
  "/:electionId/cancel",
  auth,
  authorize("admin", "super_admin"),
  electionController.cancelElection
);

/*
   Publish elective election results

   Service automatically blocks this for
   nomination exercises.
*/

router.post(
  "/:electionId/publish-results",
  auth,
  authorize("admin", "super_admin"),
  electionController.publishResults
);

export default router;