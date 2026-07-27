import api from "./api";

/* ==========================================================
   MEETING LISTING AND DETAILS
========================================================== */

export const getMeetings = async (params = {}) => {
  const response = await api.get(
    "/meetings",
    {
      params,
    }
  );

  return response.data;
};

export const getMeetingById = async (
  meetingId
) => {
  const response = await api.get(
    `/meetings/${meetingId}`
  );

  return response.data;
};

export const getMeetingStatistics =
  async () => {
    const response = await api.get(
      "/meetings/statistics"
    );

    return response.data;
  };

/* ==========================================================
   MEETING CREATION AND EDITING
========================================================== */

export const createMeeting = async (
  meetingData
) => {
  const response = await api.post(
    "/meetings",
    meetingData
  );

  return response.data;
};

export const updateMeeting = async (
  meetingId,
  meetingData
) => {
  const response = await api.patch(
    `/meetings/${meetingId}`,
    meetingData
  );

  return response.data;
};

export const deleteMeeting = async (
  meetingId
) => {
  const response = await api.delete(
    `/meetings/${meetingId}`
  );

  return response.data;
};

export const restoreMeeting = async (
  meetingId
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/restore`
  );

  return response.data;
};

/* ==========================================================
   MEETING LIFECYCLE
========================================================== */

export const scheduleMeeting = async (
  meetingId
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/schedule`
  );

  return response.data;
};

export const postponeMeeting = async (
  meetingId,
  scheduleData
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/postpone`,
    scheduleData
  );

  return response.data;
};

export const cancelMeeting = async (
  meetingId,
  reason
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/cancel`,
    {
      reason,
    }
  );

  return response.data;
};

export const startMeeting = async (
  meetingId
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/start`
  );

  return response.data;
};

export const endMeeting = async (
  meetingId
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/end`
  );

  return response.data;
};

/* ==========================================================
   AGENDA
========================================================== */

export const addMeetingAgendaItem =
  async (
    meetingId,
    agendaData
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/agenda`,
      agendaData
    );

    return response.data;
  };

export const updateMeetingAgendaItem =
  async (
    meetingId,
    agendaItemId,
    agendaData
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/agenda/${agendaItemId}`,
      agendaData
    );

    return response.data;
  };

export const removeMeetingAgendaItem =
  async (
    meetingId,
    agendaItemId
  ) => {
    const response = await api.delete(
      `/meetings/${meetingId}/agenda/${agendaItemId}`
    );

    return response.data;
  };

/* ==========================================================
   PARTICIPANTS
========================================================== */

export const inviteMeetingParticipants = async (
  meetingId,
  participants
) => {
  const response = await api.post(
    `/meetings/${meetingId}/participants`,
    {
      participants,
    }
  );

  return response.data;
};

export const removeMeetingParticipant =
  async (
    meetingId,
    participantUserId
  ) => {
    const response = await api.delete(
      `/meetings/${meetingId}/participants/${participantUserId}`
    );

    return response.data;
  };

export const admitMeetingParticipant =
  async (
    meetingId,
    participantUserId
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/participants/${participantUserId}/admit`
    );

    return response.data;
  };

export const updateParticipantMedia =
  async (
    meetingId,
    participantUserId,
    mediaData
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/participants/${participantUserId}/media`,
      mediaData
    );

    return response.data;
  };

export const updateParticipantAttendance =
  async (
    meetingId,
    participantUserId,
    attendanceStatus
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/participants/${participantUserId}/attendance`,
      {
        attendanceStatus,
      }
    );

    return response.data;
  };

export const getMeetingAttendance =
  async (
    meetingId
  ) => {
    const response = await api.get(
      `/meetings/${meetingId}/attendance`
    );

    return response.data;
  };

/* ==========================================================
   HOSTS, CO-HOSTS AND MODERATORS
========================================================== */

export const changeMeetingHost = async (
  meetingId,
  newHostUserId
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/host`,
    {
      newHostUserId,
    }
  );

  return response.data;
};

export const addMeetingManagers = async (
  meetingId,
  {
    coHosts = [],
    moderators = [],
  }
) => {
  const response = await api.patch(
    `/meetings/${meetingId}/managers`,
    {
      coHosts,
      moderators,
    }
  );

  return response.data;
};

export const removeMeetingManager =
  async (
    meetingId,
    managerUserId
  ) => {
    const response = await api.delete(
      `/meetings/${meetingId}/managers/${managerUserId}`
    );

    return response.data;
  };

/* ==========================================================
   DOCUMENTS
========================================================== */

export const addMeetingDocument =
  async (
    meetingId,
    documentData
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/documents`,
      documentData
    );

    return response.data;
  };

export const removeMeetingDocument =
  async (
    meetingId,
    documentId
  ) => {
    const response = await api.delete(
      `/meetings/${meetingId}/documents/${documentId}`
    );

    return response.data;
  };

/* ==========================================================
   MINUTES
========================================================== */

export const saveMeetingMinutes =
  async (
    meetingId,
    minutesData
  ) => {
    const response = await api.put(
      `/meetings/${meetingId}/minutes`,
      minutesData
    );

    return response.data;
  };

export const approveMeetingMinutes =
  async (
    meetingId
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/minutes/approve`
    );

    return response.data;
  };

/* ==========================================================
   RESOLUTIONS
========================================================== */

export const addMeetingResolution =
  async (
    meetingId,
    resolutionData
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/resolutions`,
      resolutionData
    );

    return response.data;
  };

export const updateMeetingResolutionApproval =
  async (
    meetingId,
    resolutionId,
    approved
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/resolutions/${resolutionId}/approve`,
      {
        approved,
      }
    );

    return response.data;
  };

/* ==========================================================
   ACTION ITEMS
========================================================== */

export const addMeetingActionItem =
  async (
    meetingId,
    actionItemData
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/action-items`,
      actionItemData
    );

    return response.data;
  };

export const updateMeetingActionItem =
  async (
    meetingId,
    actionItemId,
    actionItemData
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/action-items/${actionItemId}`,
      actionItemData
    );

    return response.data;
  };

/* ==========================================================
   RECORDING
========================================================== */

export const startMeetingRecording =
  async (
    meetingId
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/recording/start`
    );

    return response.data;
  };

export const stopMeetingRecording =
  async (
    meetingId
  ) => {
    const response = await api.post(
      `/meetings/${meetingId}/recording/stop`
    );

    return response.data;
  };

export const completeMeetingRecording =
  async (
    meetingId,
    recordingData
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/recording/complete`,
      recordingData
    );

    return response.data;
  };


  /* ==========================================================
   CURRENT USER MEETINGS
========================================================== */

export const getMyMeetings = async (
  params = {}
) => {
  const response = await api.get(
    "/meetings/my",
    {
      params,
    }
  );

  return response.data;
};

/* ==========================================================
   ROOM ACCESS
========================================================== */

export const getMeetingByRoomCode =
  async (
    roomCode
  ) => {
    const response = await api.get(
      `/meetings/room/${roomCode}`
    );

    return response.data;
  };

/* ==========================================================
   INVITATION RESPONSE
========================================================== */

export const respondToMeetingInvitation =
  async (
    meetingId,
    responseStatus
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/respond`,
      {
        response: responseStatus,
      }
    );

    return response.data;
  };

/* ==========================================================
   JOIN AND LEAVE
========================================================== */

export const joinMeeting = async (
  meetingId
) => {
  const response = await api.post(
    `/meetings/${meetingId}/join`
  );

  return response.data;
};

export const leaveMeeting = async (
  meetingId
) => {
  const response = await api.post(
    `/meetings/${meetingId}/leave`
  );

  return response.data;
};

/* ==========================================================
   LIVE ROOM SETTINGS
========================================================== */

export const updateLiveRoomSettings =
  async (
    meetingId,
    settings
  ) => {
    const response = await api.patch(
      `/meetings/${meetingId}/live-room`,
      settings
    );

    return response.data;
  };

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

const meetingService = {
  getMeetings,
  getMyMeetings,
  getMeetingById,
  getMeetingByRoomCode,
  getMeetingStatistics,

  createMeeting,
  updateMeeting,
  deleteMeeting,
  restoreMeeting,

  scheduleMeeting,
  postponeMeeting,
  cancelMeeting,
  startMeeting,
  endMeeting,

  respondToMeetingInvitation,
  joinMeeting,
  leaveMeeting,
  updateLiveRoomSettings,

  addMeetingAgendaItem,
  updateMeetingAgendaItem,
  removeMeetingAgendaItem,

  inviteMeetingParticipants,
  removeMeetingParticipant,
  admitMeetingParticipant,
  updateParticipantMedia,
  updateParticipantAttendance,
  getMeetingAttendance,

  changeMeetingHost,
  addMeetingManagers,
  removeMeetingManager,

  addMeetingDocument,
  removeMeetingDocument,

  saveMeetingMinutes,
  approveMeetingMinutes,

  addMeetingResolution,
  updateMeetingResolutionApproval,

  addMeetingActionItem,
  updateMeetingActionItem,

  startMeetingRecording,
  stopMeetingRecording,
  completeMeetingRecording,
};

export default meetingService;