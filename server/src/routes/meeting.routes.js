import express from "express";

import {
  createMeetingController,
  getMeetingByIdController,
  getMeetingByRoomCodeController,
  listMeetingsController,
  getMyMeetingsController,
  updateMeetingController,
  scheduleMeetingController,
  postponeMeetingController,
  cancelMeetingController,
  deleteMeetingController,
  restoreMeetingController,
  inviteParticipantsController,
  removeParticipantController,
  respondToMeetingInvitationController,
  changeMeetingHostController,
  addMeetingManagersController,
  removeMeetingManagerController,
  startMeetingController,
  joinMeetingController,
  admitParticipantController,
  leaveMeetingController,
  endMeetingController,
  updateLiveRoomSettingsController,
  updateParticipantMediaController,
  addAgendaItemController,
  updateAgendaItemController,
  removeAgendaItemController,
  addMeetingDocumentController,
  removeMeetingDocumentController,
  saveMeetingMinutesController,
  approveMeetingMinutesController,
  addMeetingResolutionController,
  approveMeetingResolutionController,
  addActionItemController,
  updateActionItemController,
  updateParticipantAttendanceController,
  getMeetingAttendanceController,
  startMeetingRecordingController,
  stopMeetingRecordingController,
  completeMeetingRecordingController,
  getMeetingStatisticsController,
} from "../controllers/meeting.controller.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/* ==========================================================
   AUTHENTICATION

   All meeting routes require an authenticated user.

   The protect middleware should:
   - verify the access token
   - load the authenticated user
   - attach the user to req.user
========================================================== */

router.use(auth);

/* ==========================================================
   MEETING COLLECTION ROUTES
========================================================== */

/**
 * @route   POST /api/meetings
 * @desc    Create a new meeting
 * @access  Private
 */
router.post(
  "/",
  createMeetingController
);

/**
 * @route   GET /api/meetings
 * @desc    List meetings
 * @access  Private
 *
 * Supported query parameters may include:
 * - page
 * - limit
 * - status
 * - meetingType
 * - format
 * - leadershipLevel
 * - department
 * - scopeLevel
 * - county
 * - constituency
 * - ward
 * - createdBy
 * - host
 * - startDate
 * - endDate
 * - search
 * - sortBy
 */
router.get(
  "/",
  listMeetingsController
);

/* ==========================================================
   CURRENT USER ROUTES

   These must appear before /:meetingId to prevent Express
   from treating words such as "my" or "statistics" as IDs.
========================================================== */

/**
 * @route   GET /api/meetings/my
 * @desc    Get meetings connected to the authenticated user
 * @access  Private
 */
router.get(
  "/my",
  getMyMeetingsController
);

/**
 * @route   GET /api/meetings/statistics
 * @desc    Get meeting dashboard statistics
 * @access  Private
 */
router.get(
  "/statistics",
  getMeetingStatisticsController
);

/* ==========================================================
   ROOM CODE ROUTES
========================================================== */

/**
 * @route   GET /api/meetings/room/:roomCode
 * @desc    Retrieve a meeting using its live room code
 * @access  Private
 */
router.get(
  "/room/:roomCode",
  getMeetingByRoomCodeController
);

/* ==========================================================
   RESTORE ROUTE
========================================================== */

/**
 * @route   PATCH /api/meetings/:meetingId/restore
 * @desc    Restore a soft-deleted meeting
 * @access  Private
 */
router.patch(
  "/:meetingId/restore",
  restoreMeetingController
);

/* ==========================================================
   MEETING LIFECYCLE ROUTES
========================================================== */

/**
 * @route   PATCH /api/meetings/:meetingId/schedule
 * @desc    Change a draft or postponed meeting to scheduled
 * @access  Private
 */
router.patch(
  "/:meetingId/schedule",
  scheduleMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/postpone
 * @desc    Postpone and reschedule a meeting
 * @access  Private
 *
 * Body:
 * {
 *   "scheduledStart": "2026-08-01T10:00:00.000Z",
 *   "scheduledEnd": "2026-08-01T12:00:00.000Z"
 * }
 */
router.patch(
  "/:meetingId/postpone",
  postponeMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/cancel
 * @desc    Cancel a meeting
 * @access  Private
 *
 * Body:
 * {
 *   "reason": "Reason for cancellation"
 * }
 */
router.patch(
  "/:meetingId/cancel",
  cancelMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/start
 * @desc    Start a scheduled meeting
 * @access  Private
 */
router.patch(
  "/:meetingId/start",
  startMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/end
 * @desc    End a live meeting
 * @access  Private
 */
router.patch(
  "/:meetingId/end",
  endMeetingController
);

/* ==========================================================
   MEETING PARTICIPATION ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/join
 * @desc    Join a live meeting
 * @access  Private
 */
router.post(
  "/:meetingId/join",
  joinMeetingController
);

/**
 * @route   POST /api/meetings/:meetingId/leave
 * @desc    Leave a live meeting
 * @access  Private
 */
router.post(
  "/:meetingId/leave",
  leaveMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/respond
 * @desc    Accept, decline or tentatively accept an invitation
 * @access  Private
 *
 * Body:
 * {
 *   "response": "accepted"
 * }
 *
 * Allowed values:
 * - accepted
 * - declined
 * - tentative
 */
router.patch(
  "/:meetingId/respond",
  respondToMeetingInvitationController
);

/* ==========================================================
   PARTICIPANT MANAGEMENT ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/participants
 * @desc    Invite one or more participants
 * @access  Private
 *
 * Body:
 * {
 *   "participants": [
 *     {
 *       "user": "USER_ID",
 *       "role": "participant"
 *     }
 *   ]
 * }
 */
router.post(
  "/:meetingId/participants",
  inviteParticipantsController
);

/**
 * @route   DELETE /api/meetings/:meetingId/participants/:participantUserId
 * @desc    Remove a participant from a meeting
 * @access  Private
 */
router.delete(
  "/:meetingId/participants/:participantUserId",
  removeParticipantController
);

/**
 * @route   PATCH /api/meetings/:meetingId/participants/:participantUserId/admit
 * @desc    Admit a participant from the waiting room
 * @access  Private
 */
router.patch(
  "/:meetingId/participants/:participantUserId/admit",
  admitParticipantController
);

/**
 * @route   PATCH /api/meetings/:meetingId/participants/:participantUserId/media
 * @desc    Update microphone, camera, screen sharing or hand status
 * @access  Private
 *
 * Body may contain:
 * {
 *   "microphoneEnabled": true,
 *   "cameraEnabled": false,
 *   "screenSharing": false,
 *   "handRaised": true
 * }
 */
router.patch(
  "/:meetingId/participants/:participantUserId/media",
  updateParticipantMediaController
);

/**
 * @route   PATCH /api/meetings/:meetingId/participants/:participantUserId/attendance
 * @desc    Update participant attendance
 * @access  Private
 *
 * Body:
 * {
 *   "attendanceStatus": "present"
 * }
 */
router.patch(
  "/:meetingId/participants/:participantUserId/attendance",
  updateParticipantAttendanceController
);

/**
 * @route   GET /api/meetings/:meetingId/attendance
 * @desc    Get meeting attendance records and summary
 * @access  Private
 */
router.get(
  "/:meetingId/attendance",
  getMeetingAttendanceController
);

/* ==========================================================
   MEETING HOST AND MANAGER ROUTES
========================================================== */

/**
 * @route   PATCH /api/meetings/:meetingId/host
 * @desc    Transfer meeting hosting to another user
 * @access  Private
 *
 * Body:
 * {
 *   "newHostUserId": "USER_ID"
 * }
 */
router.patch(
  "/:meetingId/host",
  changeMeetingHostController
);

/**
 * @route   PATCH /api/meetings/:meetingId/managers
 * @desc    Add co-hosts and moderators
 * @access  Private
 *
 * Body:
 * {
 *   "coHosts": ["USER_ID"],
 *   "moderators": ["USER_ID"]
 * }
 */
router.patch(
  "/:meetingId/managers",
  addMeetingManagersController
);

/**
 * @route   DELETE /api/meetings/:meetingId/managers/:managerUserId
 * @desc    Remove a co-host or moderator
 * @access  Private
 */
router.delete(
  "/:meetingId/managers/:managerUserId",
  removeMeetingManagerController
);

/* ==========================================================
   LIVE ROOM SETTINGS
========================================================== */

/**
 * @route   PATCH /api/meetings/:meetingId/live-room
 * @desc    Update meeting live-room settings
 * @access  Private
 *
 * Body may contain:
 * {
 *   "roomLocked": false,
 *   "waitingRoomEnabled": true,
 *   "requireAuthentication": true,
 *   "allowGuests": false,
 *   "allowParticipantScreenShare": true,
 *   "allowParticipantChat": true,
 *   "allowParticipantMicrophone": true,
 *   "allowParticipantCamera": true,
 *   "muteParticipantsOnEntry": true,
 *   "disableCameraOnEntry": false,
 *   "maximumParticipants": 100,
 *   "mediaMode": "mesh"
 * }
 */
router.patch(
  "/:meetingId/live-room",
  updateLiveRoomSettingsController
);

/* ==========================================================
   AGENDA ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/agenda
 * @desc    Add an agenda item
 * @access  Private
 */
router.post(
  "/:meetingId/agenda",
  addAgendaItemController
);

/**
 * @route   PATCH /api/meetings/:meetingId/agenda/:agendaItemId
 * @desc    Update an agenda item
 * @access  Private
 */
router.patch(
  "/:meetingId/agenda/:agendaItemId",
  updateAgendaItemController
);

/**
 * @route   DELETE /api/meetings/:meetingId/agenda/:agendaItemId
 * @desc    Remove an agenda item
 * @access  Private
 */
router.delete(
  "/:meetingId/agenda/:agendaItemId",
  removeAgendaItemController
);

/* ==========================================================
   DOCUMENT ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/documents
 * @desc    Add a meeting document record
 * @access  Private
 *
 * The document should already have been uploaded by the
 * upload middleware or file-storage service.
 */
router.post(
  "/:meetingId/documents",
  addMeetingDocumentController
);

/**
 * @route   DELETE /api/meetings/:meetingId/documents/:documentId
 * @desc    Remove a meeting document record
 * @access  Private
 */
router.delete(
  "/:meetingId/documents/:documentId",
  removeMeetingDocumentController
);

/* ==========================================================
   MINUTES ROUTES
========================================================== */

/**
 * @route   PUT /api/meetings/:meetingId/minutes
 * @desc    Save or submit meeting minutes
 * @access  Private
 *
 * Body:
 * {
 *   "content": "Meeting minutes content",
 *   "status": "draft"
 * }
 *
 * Allowed status values:
 * - draft
 * - submitted
 */
router.put(
  "/:meetingId/minutes",
  saveMeetingMinutesController
);

/**
 * @route   PATCH /api/meetings/:meetingId/minutes/approve
 * @desc    Approve submitted meeting minutes
 * @access  Private
 */
router.patch(
  "/:meetingId/minutes/approve",
  approveMeetingMinutesController
);

/* ==========================================================
   RESOLUTION ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/resolutions
 * @desc    Add a meeting resolution
 * @access  Private
 */
router.post(
  "/:meetingId/resolutions",
  addMeetingResolutionController
);

/**
 * @route   PATCH /api/meetings/:meetingId/resolutions/:resolutionId/approve
 * @desc    Approve or withdraw approval of a resolution
 * @access  Private
 *
 * Body:
 * {
 *   "approved": true
 * }
 */
router.patch(
  "/:meetingId/resolutions/:resolutionId/approve",
  approveMeetingResolutionController
);

/* ==========================================================
   ACTION ITEM ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/action-items
 * @desc    Add an action item
 * @access  Private
 */
router.post(
  "/:meetingId/action-items",
  addActionItemController
);

/**
 * @route   PATCH /api/meetings/:meetingId/action-items/:actionItemId
 * @desc    Update an action item
 * @access  Private
 */
router.patch(
  "/:meetingId/action-items/:actionItemId",
  updateActionItemController
);

/* ==========================================================
   RECORDING ROUTES
========================================================== */

/**
 * @route   POST /api/meetings/:meetingId/recording/start
 * @desc    Start meeting recording
 * @access  Private
 */
router.post(
  "/:meetingId/recording/start",
  startMeetingRecordingController
);

/**
 * @route   POST /api/meetings/:meetingId/recording/stop
 * @desc    Stop meeting recording
 * @access  Private
 */
router.post(
  "/:meetingId/recording/stop",
  stopMeetingRecordingController
);

/**
 * @route   PATCH /api/meetings/:meetingId/recording/complete
 * @desc    Save completed recording information
 * @access  Private
 *
 * Body:
 * {
 *   "recordingUrl": "https://example.com/recording.mp4",
 *   "fileSize": 10485760
 * }
 */
router.patch(
  "/:meetingId/recording/complete",
  completeMeetingRecordingController
);

/* ==========================================================
   SINGLE MEETING ROUTES

   These general parameter routes remain at the bottom so
   they do not intercept more specific routes.
========================================================== */

/**
 * @route   GET /api/meetings/:meetingId
 * @desc    Get a meeting by ID
 * @access  Private
 */
router.get(
  "/:meetingId",
  getMeetingByIdController
);

/**
 * @route   PUT /api/meetings/:meetingId
 * @desc    Update a meeting
 * @access  Private
 */
router.put(
  "/:meetingId",
  updateMeetingController
);

/**
 * @route   PATCH /api/meetings/:meetingId
 * @desc    Partially update a meeting
 * @access  Private
 */
router.patch(
  "/:meetingId",
  updateMeetingController
);

/**
 * @route   DELETE /api/meetings/:meetingId
 * @desc    Soft-delete a meeting
 * @access  Private
 */
router.delete(
  "/:meetingId",
  deleteMeetingController
);

export default router;