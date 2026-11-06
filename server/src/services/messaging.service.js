import mongoose from "mongoose";

import User from "../models/User.js";
import Member from "../models/Member.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import AppError from "../utils/AppError.js";

/* ==========================================================
   HELPERS
========================================================== */

const ensureActiveMember = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    isActive: true,
  }).select("_id");

  if (!user) {
    throw new AppError(403, "Your account is not active.");
  }

  const member = await Member.findOne({
    user: userId,
    membershipStatus: "active",
    membershipFeePaid: true,
  });

  if (!member) {
    throw new AppError(
      403,
      "Active, paid-up membership is required to use messaging."
    );
  }

  return member;
};

const formatMember = (member) => ({
  userId: member.user.toString(),
  memberId: member._id,
  memberNumber: member.memberNumber,
  firstName: member.firstName,
  middleName: member.middleName,
  lastName: member.lastName,
  county: member.county,
  constituency: member.constituency,
  ward: member.ward,
  profilePhoto: member.profilePhoto,
});

const getMemberProfiles = async (userIds) => {
  if (!userIds.length) return new Map();

  const members = await Member.find({
    user: { $in: userIds },
    membershipStatus: "active",
    membershipFeePaid: true,
  }).select(
    "user memberNumber firstName middleName lastName county constituency ward profilePhoto"
  );

  return new Map(
    members.map((member) => [
      member.user.toString(),
      formatMember(member),
    ])
  );
};

const ensureConversationParticipant = async (
  conversationId,
  userId
) => {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw new AppError(400, "Invalid conversation ID.");
  }

  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError(404, "Conversation not found.");
  }

  return conversation;
};

/* ==========================================================
   SEARCH ACTIVE MEMBERS
========================================================== */

export const searchMembers = async (userId, query) => {
  await ensureActiveMember(userId);

  const q = String(query || "").trim();

  if (!q) return [];

  if (q.length > 80) {
    throw new AppError(400, "Search query is too long.");
  }

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const members = await Member.find({
    user: { $exists: true, $ne: null },
    membershipStatus: "active",
    membershipFeePaid: true,
    $or: [
      { firstName: regex },
      { middleName: regex },
      { lastName: regex },
      { memberNumber: regex },
      { county: regex },
    ],
  })
    .select(
      "user memberNumber firstName middleName lastName county constituency ward profilePhoto"
    )
    .limit(30)
    .lean();

  const userIds = members
    .map((member) => member.user)
    .filter((id) => id && id.toString() !== userId.toString());

  const activeUsers = await User.find({
    _id: { $in: userIds },
    isActive: true,
  }).select("_id").lean();

  const activeUserIds = new Set(
    activeUsers.map((user) => user._id.toString())
  );

  return members
    .filter(
      (member) =>
        member.user &&
        activeUserIds.has(member.user.toString()) &&
        member.user.toString() !== userId.toString()
    )
    .map(formatMember);
};

/* ==========================================================
   CREATE OR GET PRIVATE CONVERSATION
========================================================== */

export const getOrCreateConversation = async (
  userId,
  recipientId
) => {
  await ensureActiveMember(userId);

  if (!mongoose.Types.ObjectId.isValid(recipientId)) {
    throw new AppError(400, "Invalid recipient.");
  }

  if (userId.toString() === recipientId.toString()) {
    throw new AppError(400, "You cannot message yourself.");
  }

  await ensureActiveMember(recipientId);

  const participants = [
    userId.toString(),
    recipientId.toString(),
  ].sort();

  const participantKey = participants.join(":");

  let conversation;

  try {
    conversation = await Conversation.findOneAndUpdate(
      { participantKey },
      {
        $setOnInsert: {
          participants,
          participantKey,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;

    conversation = await Conversation.findOne({
      participantKey,
    });
  }

  return conversation;
};

/* ==========================================================
   GET MY CONVERSATIONS
========================================================== */

export const getMyConversations = async (userId) => {
  await ensureActiveMember(userId);

  const conversations = await Conversation.find({
    participants: userId,
  })
    .populate("lastMessage", "sender content createdAt readBy")
    .sort({ lastMessageAt: -1 })
    .lean();

  if (!conversations.length) return [];

  const otherUserIds = conversations
    .map((conversation) =>
      conversation.participants.find(
        (id) => id.toString() !== userId.toString()
      )
    )
    .filter(Boolean);

  const profiles = await getMemberProfiles(otherUserIds);

  const results = await Promise.all(
    conversations.map(async (conversation) => {
      const otherUserId = conversation.participants.find(
        (id) => id.toString() !== userId.toString()
      );

      const unreadCount = await Message.countDocuments({
        conversation: conversation._id,
        sender: { $ne: userId },
        readBy: { $ne: userId },
      });

      return {
        _id: conversation._id,
        member: profiles.get(otherUserId?.toString()) || null,
        lastMessage: conversation.lastMessage || null,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    })
  );

  return results.filter((item) => item.member);
};

/* ==========================================================
   GET CONVERSATION MESSAGES
========================================================== */

export const getConversationMessages = async (
  userId,
  conversationId,
  options = {}
) => {
  await ensureActiveMember(userId);

  const conversation = await ensureConversationParticipant(
    conversationId,
    userId
  );

  const limit = Math.min(
    Math.max(Number(options.limit) || 30, 1),
    50
  );

  const filter = {
    conversation: conversation._id,
  };

  if (options.before) {
    const beforeDate = new Date(options.before);

    if (Number.isNaN(beforeDate.getTime())) {
      throw new AppError(400, "Invalid message pagination date.");
    }

    filter.createdAt = { $lt: beforeDate };
  }

  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const senderIds = [
    ...new Set(messages.map((message) => message.sender.toString())),
  ];

  const profiles = await getMemberProfiles(senderIds);

  return messages.reverse().map((message) => ({
    ...message,
    senderProfile:
      profiles.get(message.sender.toString()) || null,
  }));
};

/* ==========================================================
   SEND MESSAGE
========================================================== */

export const sendMessage = async (
  userId,
  conversationId,
  content
) => {
  await ensureActiveMember(userId);

  const conversation = await ensureConversationParticipant(
    conversationId,
    userId
  );

  if (typeof content !== "string" || !content.trim()) {
    throw new AppError(400, "Message content cannot be empty.");
  }

  if (content.trim().length > 2000) {
    throw new AppError(400, "Message cannot exceed 2000 characters.");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: userId,
    content: content.trim(),
    readBy: [userId],
  });

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = message.createdAt;

  await conversation.save();

  const senderProfile = await Member.findOne({
    user: userId,
  }).select(
    "user memberNumber firstName middleName lastName county constituency ward profilePhoto"
  );

  return {
    ...message.toObject(),
    senderProfile: senderProfile
      ? formatMember(senderProfile)
      : null,
  };
};

/* ==========================================================
   MARK CONVERSATION AS READ
========================================================== */

export const markConversationRead = async (
  userId,
  conversationId
) => {
  await ensureActiveMember(userId);

  const conversation = await ensureConversationParticipant(
    conversationId,
    userId
  );

  const result = await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: {
        readBy: userId,
      },
    }
  );

  return {
    conversationId: conversation._id,
    markedAsRead: result.modifiedCount,
  };
};

