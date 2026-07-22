const Member = require("../models/Member");
const Leader = require("../models/Leader");

class DashboardService {
  /* =====================================================
     MEMBER DASHBOARD
  ===================================================== */

  async getDashboard(memberId) {
    const member = await Member.findById(memberId)
      .select("-password -otp -otpExpires");

    if (!member) {
      throw new Error("Member not found.");
    }

    /* =====================================================
       LEADERSHIP
    ===================================================== */

    const leader = await Leader.findOne({
      member: member._id,
      isActive: true,
    }).lean();

    const leadership = {
      isLeader: !!leader,

      hasLeadershipCard: !!leader,

      category: leader?.category || null,

      position: leader?.position || null,

      county: leader?.county || null,

      constituency: leader?.constituency || null,

      ward: leader?.ward || null,

      office: leader?.office || null,

      appointmentDate:
        leader?.appointmentDate || null,

      leadershipNumber:
        leader?.leadershipNumber || null,
    };

    const leader = await Leader.findOne({
  member: member._id,
  isActive: true,
}).lean();

console.log("MEMBER ID:", member._id);
console.log("LEADER RECORD:", leader);

    /* =====================================================
       PLACEHOLDER DATA
    ===================================================== */

    const events = [
      {
        id: 1,
        title: "Coastal Youth Summit 2026",
        date: "6 Aug 2026",
        time: "08:00 AM",
        location: "Malindi, Kilifi",
        status: "Open",
        statusClass: "open",
      },
      {
        id: 2,
        title: "Beach Cleanup Exercise",
        date: "16 Aug 2026",
        time: "09:00 AM",
        location: "Mombasa",
        status: "Register",
        statusClass: "register",
      },
      {
        id: 3,
        title: "Leadership Bootcamp",
        date: "5 Sep 2026",
        time: "10:00 AM",
        location: "Kwale",
        status: "Coming Soon",
        statusClass: "coming-soon",
      },
    ];

    const notifications = [
      {
        id: 1,
        title: "Membership Activated",
        message: "Your account has been activated successfully.",
        date: "Today",
        type: "success",
      },
      {
        id: 2,
        title: "Complete Your Profile",
        message:
          "Complete your profile to unlock more opportunities.",
        date: "Today",
        type: "info",
      },
      {
        id: 3,
        title: "Coastal Youth Summit",
        message: "Registration is now open.",
        date: "2 days ago",
        type: "announcement",
      },
    ];

    const news = [
      {
        id: 1,
        category: "Events",
        title:
          "Registration for Coastal Youth Summit 2026 Now Open",
        excerpt:
          "Members from all six counties are invited to register.",
        date: "Today",
      },
      {
        id: 2,
        category: "Partnership",
        title:
          "JVP Signs New Youth Empowerment Partnership",
        excerpt:
          "The partnership will strengthen youth empowerment programmes across the Coast Region.",
        date: "Yesterday",
      },
      {
        id: 3,
        category: "Leadership",
        title:
          "Applications for Volunteer Leaders Now Open",
        excerpt:
          "Volunteer leadership opportunities are available in all six counties.",
        date: "3 days ago",
      },
    ];

    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary = {
      registeredEvents: 2,
      activePrograms: 3,
      certificates: 0,
      unreadNotifications: notifications.length,
      profileCompletion:
        member.profileCompleted || 0,
    };

    /* =====================================================
       STATISTICS
    ===================================================== */

    const statistics = {
      profileCompletion:
        member.profileCompleted || 0,

      loginCount:
        member.loginCount || 0,

      lastLogin:
        member.lastLogin,

      events:
        summary.registeredEvents,

      programs:
        summary.activePrograms,

      certificates:
        summary.certificates,

      volunteerHours: 0,
    };

    /* =====================================================
       PROFILE COMPLETION
    ===================================================== */

    const completion = {
      profile:
        member.profileCompleted || 0,

      membership:
        member.activationStatus ===
        "Activated"
          ? 100
          : 50,
    };

    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    const recentActivity = [
      {
        id: 1,
        activity:
          "Logged into JVP Connect",
        when: "Today",
      },
      {
        id: 2,
        activity: "Updated profile",
        when: "Yesterday",
      },
    ];

    /* =====================================================
       RESPONSE
    ===================================================== */

    return {
      success: true,

      message:
        "Dashboard loaded successfully.",

      dashboard: {
        member,

        leadership,

        summary,

        statistics,

        completion,

        events,

        notifications,

        news,

        recentActivity,
      },
    };
  }
}

module.exports = new DashboardService();