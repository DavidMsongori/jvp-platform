import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { io } from "socket.io-client";

import { useAuth } from "../../context/AuthContext";

import {
  getConversationMessages,
  sendMessage,
  markConversationRead,
} from "../../services/messagingService";

import { COLORS, SIZES, RADIUS } from "../../constants/theme";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

const SOCKET_URL = API_BASE_URL?.replace(/\/api\/?$/, "");

const getFullName = (member) =>
  [
    member?.firstName,
    member?.middleName,
    member?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "JVP Member";

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function ConversationScreen({ route }) {
  const { conversationId, member } = route.params;

  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);

  const listRef = useRef(null);
  const socketRef = useRef(null);

  const currentUserId = user?._id?.toString();

  const addMessage = useCallback((newMessage) => {
    if (!newMessage?._id) return;

    setMessages((previous) => {
      const exists = previous.some(
        (item) => item._id === newMessage._id
      );

      if (exists) return previous;

      return [...previous, newMessage];
    });
  }, []);

    const loadMessages = useCallback(async () => {
    try {
      setError("");

      const response = await getConversationMessages(
        conversationId,
        { limit: 50 }
      );

      const data = Array.isArray(response?.data)
        ? response.data
        : [];

      setMessages(data);

      await markConversationRead(conversationId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

    useEffect(() => {
    let socket;

    const connectSocket = async () => {
      try {
        const token = await SecureStore.getItemAsync("token");

        if (!token || !SOCKET_URL) return;

        socket = io(SOCKET_URL, {
          auth: { token },
          transports: ["websocket"],
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          setSocketConnected(true);
        });

        socket.on("disconnect", () => {
          setSocketConnected(false);
        });

        socket.on("message:new", async (payload) => {
          if (
            payload?.conversationId?.toString() !==
            conversationId.toString()
          ) {
            return;
          }

          const incomingMessage = payload.message;

          addMessage(incomingMessage);

          if (
            incomingMessage?.sender?.toString() !== currentUserId
          ) {
            try {
              await markConversationRead(conversationId);
            } catch (err) {
              console.log("Unable to update read status:", err.message);
            }
          }
        });
      } catch (err) {
        console.log("Messaging socket connection:", err.message);
      }
    };

    connectSocket();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, currentUserId, addMessage]);

    const handleSendMessage = async () => {
    const content = messageText.trim();

    if (!content || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await sendMessage(conversationId, content);

      if (!response?.success || !response?.data) {
        throw new Error(
          response?.message || "Unable to send message."
        );
      }

      addMessage(response.data);
      setMessageText("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };
    const formatMessageTime = (date) => {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessage = ({ item }) => {
    const isMine =
      item.sender?.toString() === currentUserId;

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.theirMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myMessageBubble : styles.theirMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageContent,
              isMine && styles.myMessageContent,
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMine && styles.myMessageTime,
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>

            {isMine && (
              <Ionicons
                name="checkmark-done"
                size={15}
                color="#DCEFE3"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

    return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Conversation header */}
        <View style={styles.chatHeader}>
          {typeof member?.profilePhoto === "string" &&
          member.profilePhoto.trim() ? (
            <Image
              source={{ uri: member.profilePhoto }}
              style={styles.headerAvatar}
            />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Text style={styles.headerAvatarInitial}>
                {member?.firstName?.charAt(0)?.toUpperCase() || "J"}
              </Text>
            </View>
          )}

          <View style={styles.headerDetails}>
            <Text style={styles.headerName}>
              {getFullName(member)}
            </Text>
            <Text style={styles.connectionStatus}>
              {socketConnected ? "Connected" : "Private conversation"}
            </Text>
          </View>

          <Ionicons
            name="lock-closed-outline"
            size={19}
            color={COLORS.primary}
          />
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={42}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.emptyTitle}>
                  Start a conversation
                </Text>
                <Text style={styles.emptyText}>
                  Send a message to {member?.firstName || "this member"}.
                </Text>
              </View>
            }
          />
        )}

        {/* Message composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Write a message..."
            placeholderTextColor={COLORS.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={2000}
            editable={!sending}
          />

          <Pressable
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={19}
                color={COLORS.white}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SIZES.md,
  },
  headerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.surface,
  },
  headerAvatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAvatarInitial: {
    color: COLORS.primary,
    fontSize: 19,
    fontWeight: "800",
  },
  headerDetails: {
    flex: 1,
  },
  headerName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  connectionStatus: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  messagesList: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    flexGrow: 1,
  },
  messageRow: {
    width: "100%",
    marginBottom: SIZES.sm,
    flexDirection: "row",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "82%",
    minWidth: 75,
    paddingHorizontal: 13,
    paddingTop: 10,
    paddingBottom: 7,
    borderRadius: RADIUS.lg,
  },
  myMessageBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageContent: {
    color: COLORS.white,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 5,
  },
  messageTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
  },
  myMessageTime: {
    color: "#DCEFE3",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: SIZES.sm,
  },
  messageInput: {
    flex: 1,
    maxHeight: 110,
    minHeight: 45,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 14,
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: SIZES.sm,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SIZES.xl,
  },
  emptyTitle: {
    marginTop: SIZES.md,
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  emptyText: {
    marginTop: SIZES.sm,
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  errorContainer: {
    padding: SIZES.sm,
    backgroundColor: "#FCEBEC",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12,
  },
});