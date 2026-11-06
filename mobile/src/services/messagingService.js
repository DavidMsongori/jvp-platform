import api from "./api";

// Search active members.
export const searchMembers = async (query) => {
  const response = await api.get("/messages/members", {
    params: { q: query },
  });
  return response.data;
};

// Get the logged-in member's conversations.
export const getMyConversations = async () => {
  const response = await api.get("/messages/conversations");
  return response.data;
};

// Start or retrieve a private conversation.
export const createConversation = async (recipientId) => {
  const response = await api.post("/messages/conversations", {
    recipientId,
  });
  return response.data;
};

// Get messages in a conversation.
export const getConversationMessages = async (
  conversationId,
  params = {}
) => {
  const response = await api.get(
    `/messages/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
};

// Send a message.
export const sendMessage = async (conversationId, content) => {
  const response = await api.post(
    `/messages/conversations/${conversationId}/messages`,
    { content }
  );
  return response.data;
};

// Mark a conversation as read.
export const markConversationRead = async (conversationId) => {
  const response = await api.patch(
    `/messages/conversations/${conversationId}/read`
  );
  return response.data;
};

export default {
  searchMembers,
  getMyConversations,
  createConversation,
  getConversationMessages,
  sendMessage,
  markConversationRead,
};