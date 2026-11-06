import express from "express";

import auth from "../middleware/auth.js";
import * as messagingController from "../controllers/messaging.controller.js";

const router = express.Router();

// All messaging routes require authentication.
router.use(auth);

// Search active members.
router.get("/members", messagingController.searchMembers);

// Inbox.
router.get(
  "/conversations",
  messagingController.getMyConversations
);

// Create or retrieve a private conversation.
router.post(
  "/conversations",
  messagingController.getOrCreateConversation
);

// Conversation messages.
router.get(
  "/conversations/:conversationId/messages",
  messagingController.getConversationMessages
);

// Send a message.
router.post(
  "/conversations/:conversationId/messages",
  messagingController.sendMessage
);

// Mark conversation messages as read.
router.patch(
  "/conversations/:conversationId/read",
  messagingController.markConversationRead
);

export default router;
