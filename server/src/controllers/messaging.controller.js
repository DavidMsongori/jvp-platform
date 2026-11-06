import * as messagingService from "../services/messaging.service.js";
import Conversation from "../models/Conversation.js";

/* ==========================================================
   SEARCH MEMBERS
========================================================== */

export const searchMembers = async (req, res, next) => {
  try {
    const members = await messagingService.searchMembers(
      req.user._id,
      req.query.q
    );

    return res.status(200).json({
      success: true,
      message: "Members retrieved successfully.",
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET MY CONVERSATIONS
========================================================== */

export const getMyConversations = async (req, res, next) => {
  try {
    const conversations =
      await messagingService.getMyConversations(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully.",
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   CREATE OR GET CONVERSATION
========================================================== */

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const conversation =
      await messagingService.getOrCreateConversation(
        req.user._id,
        req.body.recipientId
      );

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully.",
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   GET CONVERSATION MESSAGES
========================================================== */

export const getConversationMessages = async (req, res, next) => {
  try {
    const messages =
      await messagingService.getConversationMessages(
        req.user._id,
        req.params.conversationId,
        {
          before: req.query.before,
          limit: req.query.limit,
        }
      );

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully.",
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   SEND MESSAGE
========================================================== */

export const sendMessage = async (req, res, next) => {
  try {
    const message = await messagingService.sendMessage(
      req.user._id,
      req.params.conversationId,
      req.body.content
    );

    const io = req.app.get("io");

    if (io) {
      const conversation = await Conversation.findById(
        req.params.conversationId
      ).select("participants");

      if (conversation) {
        conversation.participants.forEach((participantId) => {
          io.to(`user:${participantId.toString()}`).emit(
            "message:new",
            {
              conversationId: message.conversation,
              message,
            }
          );
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

/* ==========================================================
   MARK CONVERSATION AS READ
========================================================== */

export const markConversationRead = async (req, res, next) => {
  try {
    const result = await messagingService.markConversationRead(
      req.user._id,
      req.params.conversationId
    );

    return res.status(200).json({
      success: true,
      message: "Conversation marked as read.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

