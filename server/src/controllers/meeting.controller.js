import {
  createMeeting,
  getMeetingById,
  getMeetingByRoomCode,
  listMeetings,
  getMyMeetings,
  updateMeeting,
  scheduleMeeting,
  postponeMeeting,
  cancelMeeting,
  deleteMeeting,
  restoreMeeting,
  inviteParticipants,
  removeParticipant,
  respondToMeetingInvitation,
  changeMeetingHost,
  addMeetingManagers,
  removeMeetingManager,
  startMeeting,
  joinMeeting,
  admitParticipant,
  leaveMeeting,
  endMeeting,
  updateLiveRoomSettings,
  updateParticipantMedia,
  addAgendaItem,
  updateAgendaItem,
  removeAgendaItem,
  addMeetingDocument,
  removeMeetingDocument,
  saveMeetingMinutes,
  approveMeetingMinutes,
  addMeetingResolution,
  approveMeetingResolution,
  addActionItem,
  updateActionItem,
  updateParticipantAttendance,
  getMeetingAttendance,
  startMeetingRecording,
  stopMeetingRecording,
  completeMeetingRecording,
  getMeetingStatistics,
} from "../services/meeting.service.js";

/* ==========================================================
   RESPONSE HELPER
========================================================== */

const sendSuccess = ({
  res,
  statusCode = 200,
  message,
  data = null,
}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/* ==========================================================
   ASYNC HANDLER
========================================================== */

const asyncHandler = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/* ==========================================================
   CREATE MEETING
========================================================== */

export const createMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await createMeeting({
        meetingData: req.body,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Meeting created successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   GET MEETING BY ID
========================================================== */

export const getMeetingByIdController =
  asyncHandler(async (req, res) => {
    const meeting =
      await getMeetingById({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting retrieved successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   GET MEETING BY ROOM CODE
========================================================== */

export const getMeetingByRoomCodeController =
  asyncHandler(async (req, res) => {
    const meeting =
      await getMeetingByRoomCode({
        roomCode:
          req.params.roomCode,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting room retrieved successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   LIST MEETINGS
========================================================== */

export const listMeetingsController =
  asyncHandler(async (req, res) => {
    const result =
      await listMeetings({
        currentUser: req.user,
        filters: req.query,
      });

    return sendSuccess({
      res,
      message:
        "Meetings retrieved successfully.",
      data: result,
    });
  });

/* ==========================================================
   GET MY MEETINGS
========================================================== */

export const getMyMeetingsController =
  asyncHandler(async (req, res) => {
    const result =
      await getMyMeetings({
        currentUser: req.user,
        filters: req.query,
      });

    return sendSuccess({
      res,
      message:
        "Your meetings were retrieved successfully.",
      data: result,
    });
  });

/* ==========================================================
   UPDATE MEETING
========================================================== */

export const updateMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await updateMeeting({
        meetingId:
          req.params.meetingId,
        updates: {
          ...req.body,
        },
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting updated successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   SCHEDULE MEETING
========================================================== */

export const scheduleMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await scheduleMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting scheduled successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   POSTPONE MEETING
========================================================== */

export const postponeMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await postponeMeeting({
        meetingId:
          req.params.meetingId,

        scheduledStart:
          req.body.scheduledStart,

        scheduledEnd:
          req.body.scheduledEnd,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting postponed successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   CANCEL MEETING
========================================================== */

export const cancelMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await cancelMeeting({
        meetingId:
          req.params.meetingId,

        reason:
          req.body.reason,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting cancelled successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   DELETE MEETING
========================================================== */

export const deleteMeetingController =
  asyncHandler(async (req, res) => {
    const result =
      await deleteMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        result.message ||
        "Meeting deleted successfully.",
      data: result,
    });
  });

/* ==========================================================
   RESTORE MEETING
========================================================== */

export const restoreMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await restoreMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting restored successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   INVITE PARTICIPANTS
========================================================== */

export const inviteParticipantsController =
  asyncHandler(async (req, res) => {
    const meeting =
      await inviteParticipants({
        meetingId:
          req.params.meetingId,

        participants:
          req.body.participants,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Participants invited successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   REMOVE PARTICIPANT
========================================================== */

export const removeParticipantController =
  asyncHandler(async (req, res) => {
    const meeting =
      await removeParticipant({
        meetingId:
          req.params.meetingId,

        participantUserId:
          req.params.participantUserId,

        reason:
          req.body.reason,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Participant removed successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   RESPOND TO INVITATION
========================================================== */

export const respondToMeetingInvitationController =
  asyncHandler(async (req, res) => {
    const participant =
      await respondToMeetingInvitation({
        meetingId:
          req.params.meetingId,

        response:
          req.body.response,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting invitation response recorded successfully.",
      data: {
        participant,
      },
    });
  });

/* ==========================================================
   CHANGE HOST
========================================================== */

export const changeMeetingHostController =
  asyncHandler(async (req, res) => {
    const meeting =
      await changeMeetingHost({
        meetingId:
          req.params.meetingId,

        newHostUserId:
          req.body.newHostUserId,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting host changed successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   ADD MEETING MANAGERS
========================================================== */

export const addMeetingManagersController =
  asyncHandler(async (req, res) => {
    const meeting =
      await addMeetingManagers({
        meetingId:
          req.params.meetingId,

        coHosts:
          req.body.coHosts || [],

        moderators:
          req.body.moderators ||
          [],

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting managers updated successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   REMOVE MEETING MANAGER
========================================================== */

export const removeMeetingManagerController =
  asyncHandler(async (req, res) => {
    const meeting =
      await removeMeetingManager({
        meetingId:
          req.params.meetingId,

        managerUserId:
          req.params.managerUserId,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting manager removed successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   START MEETING
========================================================== */

export const startMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await startMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting started successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   JOIN MEETING
========================================================== */

export const joinMeetingController =
  asyncHandler(async (req, res) => {
    const result =
      await joinMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        result.waitingRoomRequired
          ? "You have joined the meeting waiting room."
          : "You joined the meeting successfully.",

      data: result,
    });
  });

/* ==========================================================
   ADMIT PARTICIPANT
========================================================== */

export const admitParticipantController =
  asyncHandler(async (req, res) => {
    const participant =
      await admitParticipant({
        meetingId:
          req.params.meetingId,

        participantUserId:
          req.params.participantUserId,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Participant admitted successfully.",
      data: {
        participant,
      },
    });
  });

/* ==========================================================
   LEAVE MEETING
========================================================== */

export const leaveMeetingController =
  asyncHandler(async (req, res) => {
    const participant =
      await leaveMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "You left the meeting successfully.",
      data: {
        participant,
      },
    });
  });

/* ==========================================================
   END MEETING
========================================================== */

export const endMeetingController =
  asyncHandler(async (req, res) => {
    const meeting =
      await endMeeting({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting ended successfully.",
      data: {
        meeting,
      },
    });
  });

/* ==========================================================
   UPDATE LIVE ROOM SETTINGS
========================================================== */

export const updateLiveRoomSettingsController =
  asyncHandler(async (req, res) => {
    const liveRoom =
      await updateLiveRoomSettings({
        meetingId:
          req.params.meetingId,

        settings: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Live room settings updated successfully.",
      data: {
        liveRoom,
      },
    });
  });

/* ==========================================================
   UPDATE PARTICIPANT MEDIA
========================================================== */

export const updateParticipantMediaController =
  asyncHandler(async (req, res) => {
    const participant =
      await updateParticipantMedia({
        meetingId:
          req.params.meetingId,

        participantUserId:
          req.params.participantUserId,

        media: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Participant media settings updated successfully.",
      data: {
        participant,
      },
    });
  });

/* ==========================================================
   ADD AGENDA ITEM
========================================================== */

export const addAgendaItemController =
  asyncHandler(async (req, res) => {
    const agendaItem =
      await addAgendaItem({
        meetingId:
          req.params.meetingId,

        agendaItem: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Agenda item added successfully.",
      data: {
        agendaItem,
      },
    });
  });

/* ==========================================================
   UPDATE AGENDA ITEM
========================================================== */

export const updateAgendaItemController =
  asyncHandler(async (req, res) => {
    const agendaItem =
      await updateAgendaItem({
        meetingId:
          req.params.meetingId,

        agendaItemId:
          req.params.agendaItemId,

        updates: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Agenda item updated successfully.",
      data: {
        agendaItem,
      },
    });
  });

/* ==========================================================
   REMOVE AGENDA ITEM
========================================================== */

export const removeAgendaItemController =
  asyncHandler(async (req, res) => {
    const agenda =
      await removeAgendaItem({
        meetingId:
          req.params.meetingId,

        agendaItemId:
          req.params.agendaItemId,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Agenda item removed successfully.",
      data: {
        agenda,
      },
    });
  });

/* ==========================================================
   ADD MEETING DOCUMENT
========================================================== */

export const addMeetingDocumentController =
  asyncHandler(async (req, res) => {
    const document =
      await addMeetingDocument({
        meetingId:
          req.params.meetingId,

        documentData: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Meeting document added successfully.",
      data: {
        document,
      },
    });
  });

/* ==========================================================
   REMOVE MEETING DOCUMENT
========================================================== */

export const removeMeetingDocumentController =
  asyncHandler(async (req, res) => {
    const documents =
      await removeMeetingDocument({
        meetingId:
          req.params.meetingId,

        documentId:
          req.params.documentId,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting document removed successfully.",
      data: {
        documents,
      },
    });
  });

/* ==========================================================
   SAVE MEETING MINUTES
========================================================== */

export const saveMeetingMinutesController =
  asyncHandler(async (req, res) => {
    const minutes =
      await saveMeetingMinutes({
        meetingId:
          req.params.meetingId,

        content:
          req.body.content,

        status:
          req.body.status ||
          "draft",

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        req.body.status ===
        "submitted"
          ? "Meeting minutes submitted successfully."
          : "Meeting minutes saved successfully.",

      data: {
        minutes,
      },
    });
  });

/* ==========================================================
   APPROVE MEETING MINUTES
========================================================== */

export const approveMeetingMinutesController =
  asyncHandler(async (req, res) => {
    const minutes =
      await approveMeetingMinutes({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting minutes approved successfully.",
      data: {
        minutes,
      },
    });
  });

/* ==========================================================
   ADD RESOLUTION
========================================================== */

export const addMeetingResolutionController =
  asyncHandler(async (req, res) => {
    const resolution =
      await addMeetingResolution({
        meetingId:
          req.params.meetingId,

        resolution: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Meeting resolution added successfully.",
      data: {
        resolution,
      },
    });
  });

/* ==========================================================
   APPROVE RESOLUTION
========================================================== */

export const approveMeetingResolutionController =
  asyncHandler(async (req, res) => {
    const resolution =
      await approveMeetingResolution({
        meetingId:
          req.params.meetingId,

        resolutionId:
          req.params.resolutionId,

        approved:
          req.body.approved !==
          undefined
            ? req.body.approved
            : true,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        resolution.approved
          ? "Meeting resolution approved successfully."
          : "Meeting resolution approval withdrawn successfully.",

      data: {
        resolution,
      },
    });
  });

/* ==========================================================
   ADD ACTION ITEM
========================================================== */

export const addActionItemController =
  asyncHandler(async (req, res) => {
    const actionItem =
      await addActionItem({
        meetingId:
          req.params.meetingId,

        actionItem: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      statusCode: 201,
      message:
        "Action item added successfully.",
      data: {
        actionItem,
      },
    });
  });

/* ==========================================================
   UPDATE ACTION ITEM
========================================================== */

export const updateActionItemController =
  asyncHandler(async (req, res) => {
    const actionItem =
      await updateActionItem({
        meetingId:
          req.params.meetingId,

        actionItemId:
          req.params.actionItemId,

        updates: req.body,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Action item updated successfully.",
      data: {
        actionItem,
      },
    });
  });

/* ==========================================================
   UPDATE PARTICIPANT ATTENDANCE
========================================================== */

export const updateParticipantAttendanceController =
  asyncHandler(async (req, res) => {
    const participant =
      await updateParticipantAttendance({
        meetingId:
          req.params.meetingId,

        participantUserId:
          req.params.participantUserId,

        attendanceStatus:
          req.body.attendanceStatus,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Participant attendance updated successfully.",
      data: {
        participant,
      },
    });
  });

/* ==========================================================
   GET MEETING ATTENDANCE
========================================================== */

export const getMeetingAttendanceController =
  asyncHandler(async (req, res) => {
    const attendance =
      await getMeetingAttendance({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting attendance retrieved successfully.",
      data: attendance,
    });
  });

/* ==========================================================
   START RECORDING
========================================================== */

export const startMeetingRecordingController =
  asyncHandler(async (req, res) => {
    const recording =
      await startMeetingRecording({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting recording started successfully.",
      data: {
        recording,
      },
    });
  });

/* ==========================================================
   STOP RECORDING
========================================================== */

export const stopMeetingRecordingController =
  asyncHandler(async (req, res) => {
    const recording =
      await stopMeetingRecording({
        meetingId:
          req.params.meetingId,
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting recording stopped successfully.",
      data: {
        recording,
      },
    });
  });

/* ==========================================================
   COMPLETE RECORDING
========================================================== */

export const completeMeetingRecordingController =
  asyncHandler(async (req, res) => {
    const recording =
      await completeMeetingRecording({
        meetingId:
          req.params.meetingId,

        recordingUrl:
          req.body.recordingUrl,

        fileSize:
          req.body.fileSize || 0,

        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting recording completed successfully.",
      data: {
        recording,
      },
    });
  });

/* ==========================================================
   MEETING STATISTICS
========================================================== */

export const getMeetingStatisticsController =
  asyncHandler(async (req, res) => {
    const statistics =
      await getMeetingStatistics({
        currentUser: req.user,
      });

    return sendSuccess({
      res,
      message:
        "Meeting statistics retrieved successfully.",
      data: {
        statistics,
      },
    });
  });

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default {
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
};