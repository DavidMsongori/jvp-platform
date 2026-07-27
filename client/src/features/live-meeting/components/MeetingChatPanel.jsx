import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  FiAlertCircle,
  FiCheck,
  FiClock,
  FiMessageSquare,
  FiPaperclip,
  FiSend,
  FiSmile,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import "./MeetingChatPanel.css";

/* ==========================================================
   HELPERS
========================================================== */

const getMessageId = (message) => {
  return String(
    message?.messageId ||
      message?._id ||
      message?.id ||
      message?.clientId ||
      ""
  );
};

const getMessageSenderId = (message) => {
  return String(
    message?.senderId ||
      message?.userId ||
      message?.sender?._id ||
      message?.sender?.id ||
      message?.user?._id ||
      message?.user?.id ||
      ""
  );
};

const getMessageSenderName = (message) => {
  const sender =
    message?.sender ||
    message?.user ||
    {};

  return (
    message?.senderName ||
    message?.displayName ||
    sender?.displayName ||
    sender?.fullName ||
    sender?.name ||
    [
      sender?.firstName,
      sender?.middleName,
      sender?.lastName,
    ]
      .filter(Boolean)
      .join(" ") ||
    sender?.email ||
    "Participant"
  );
};

const getMessageSenderPhoto = (message) => {
  return (
    message?.senderPhoto ||
    message?.profilePhoto ||
    message?.sender?.profilePhoto ||
    message?.sender?.avatar ||
    message?.user?.profilePhoto ||
    message?.user?.avatar ||
    ""
  );
};

const getInitials = (name = "") => {
  return String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase()
    )
    .join("");
};

const getMessageText = (message) => {
  return (
    message?.message ||
    message?.text ||
    message?.content ||
    message?.body ||
    ""
  );
};

const getMessageTimestamp = (message) => {
  return (
    message?.createdAt ||
    message?.sentAt ||
    message?.timestamp ||
    message?.time ||
    null
  );
};

const formatMessageTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-KE",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const messageIsPending = (message) => {
  return Boolean(
    message?.pending ||
      message?.status ===
        "sending"
  );
};

const messageHasFailed = (message) => {
  return Boolean(
    message?.failed ||
      message?.status ===
        "failed"
  );
};

const isSystemMessage = (message) => {
  return Boolean(
    message?.type === "system" ||
      message?.system === true
  );
};

/* ==========================================================
   MESSAGE ITEM
========================================================== */

const ChatMessage = ({
  message,
  currentUserId = "",
  canDelete = false,
  onDelete,
  onRetry,
}) => {
  const senderId =
    getMessageSenderId(message);

  const senderName =
    getMessageSenderName(message);

  const senderPhoto =
    getMessageSenderPhoto(message);

  const text =
    getMessageText(message);

  const timestamp =
    formatMessageTime(
      getMessageTimestamp(message)
    );

  const isOwnMessage =
    Boolean(
      currentUserId &&
      senderId ===
        String(currentUserId)
    );

  const pending =
    messageIsPending(message);

  const failed =
    messageHasFailed(message);

  if (
    isSystemMessage(message)
  ) {
    return (
      <div className="meeting-chat-panel__system-message">
        <span>
          {text}
        </span>
      </div>
    );
  }

  return (
    <article
      className={[
        "meeting-chat-panel__message",

        isOwnMessage
          ? "meeting-chat-panel__message--own"
          : "",

        failed
          ? "meeting-chat-panel__message--failed"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isOwnMessage && (
        <div className="meeting-chat-panel__avatar-wrap">
          {senderPhoto ? (
            <img
              src={senderPhoto}
              alt={senderName}
              className="meeting-chat-panel__avatar"
            />
          ) : (
            <span className="meeting-chat-panel__initials">
              {getInitials(
                senderName
              ) || "JV"}
            </span>
          )}
        </div>
      )}

      <div className="meeting-chat-panel__message-content">
        {!isOwnMessage && (
          <div className="meeting-chat-panel__sender-name">
            {senderName}
          </div>
        )}

        <div className="meeting-chat-panel__bubble">
          <p>{text}</p>

          <div className="meeting-chat-panel__message-meta">
            <span>
              {timestamp}
            </span>

            {isOwnMessage &&
              pending && (
                <FiClock
                  title="Sending"
                />
              )}

            {isOwnMessage &&
              !pending &&
              !failed && (
                <FiCheck
                  title="Sent"
                />
              )}

            {failed && (
              <FiAlertCircle
                title="Failed to send"
              />
            )}
          </div>
        </div>

        {failed && (
          <button
            type="button"
            className="meeting-chat-panel__retry-button"
            onClick={() =>
              onRetry?.(message)
            }
          >
            Retry
          </button>
        )}
      </div>

      {(canDelete ||
        isOwnMessage) && (
        <button
          type="button"
          className="meeting-chat-panel__delete-button"
          onClick={() =>
            onDelete?.(message)
          }
          aria-label="Delete message"
          title="Delete message"
        >
          <FiTrash2 />
        </button>
      )}
    </article>
  );
};

/* ==========================================================
   COMPONENT
========================================================== */

const MeetingChatPanel = ({
  messages = [],

  currentUser = null,

  isOpen = true,

  canSend = true,
  canDeleteMessages = false,

  sending = false,

  maxLength = 2000,

  placeholder = "Type a message...",

  className = "",

  onClose,
  onSendMessage,
  onDeleteMessage,
  onRetryMessage,
  onAttachFile,
  onOpenEmojiPicker,
}) => {
  const [
    messageText,
    setMessageText,
  ] = useState("");

  const [
    inputError,
    setInputError,
  ] = useState("");

  const messagesEndRef =
    useRef(null);

  const textareaRef =
    useRef(null);

  const currentUserId =
    String(
      currentUser?._id ||
        currentUser?.id ||
        currentUser?.userId ||
        ""
    );

  const normalizedMessages =
    useMemo(() => {
      return (
        Array.isArray(messages)
          ? messages
          : []
      )
        .filter(Boolean)
        .slice()
        .sort((first, second) => {
          const firstTime =
            new Date(
              getMessageTimestamp(
                first
              ) || 0
            ).getTime();

          const secondTime =
            new Date(
              getMessageTimestamp(
                second
              ) || 0
            ).getTime();

          return (
            firstTime -
            secondTime
          );
        });
    }, [messages]);

  const characterCount =
    messageText.length;

  const canSubmit =
    canSend &&
    !sending &&
    messageText.trim().length >
      0 &&
    characterCount <= maxLength;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [
    normalizedMessages.length,
    isOpen,
  ]);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit =
    async (event) => {
      event?.preventDefault?.();

      const trimmedMessage =
        messageText.trim();

      if (!trimmedMessage) {
        return;
      }

      if (
        trimmedMessage.length >
        maxLength
      ) {
        setInputError(
          `Message cannot exceed ${maxLength} characters.`
        );

        return;
      }

      if (
        typeof onSendMessage !==
        "function"
      ) {
        setInputError(
          "Chat sending is unavailable."
        );

        return;
      }

      try {
        setInputError("");

        await onSendMessage(
          trimmedMessage
        );

        setMessageText("");

        textareaRef.current?.focus();
      } catch (error) {
        setInputError(
          error?.message ||
            "Unable to send message."
        );
      }
    };

  const handleKeyDown =
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        if (canSubmit) {
          handleSubmit(event);
        }
      }
    };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={[
        "meeting-chat-panel",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Meeting chat"
    >
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="meeting-chat-panel__header">
        <div>
          <div className="meeting-chat-panel__title-row">
            <FiMessageSquare />

            <h2>
              Meeting chat
            </h2>

            <span className="meeting-chat-panel__count">
              {
                normalizedMessages.length
              }
            </span>
          </div>

          <p>
            Send messages to everyone
            in the meeting.
          </p>
        </div>

        <button
          type="button"
          className="meeting-chat-panel__close-button"
          onClick={onClose}
          aria-label="Close meeting chat"
        >
          <FiX />
        </button>
      </header>

      {/* ====================================================
          MESSAGES
      ==================================================== */}

      <div className="meeting-chat-panel__messages">
        {normalizedMessages.length >
        0 ? (
          normalizedMessages.map(
            (message, index) => {
              const messageId =
                getMessageId(
                  message
                );

              return (
                <ChatMessage
                  key={
                    messageId ||
                    `message-${index}`
                  }
                  message={
                    message
                  }
                  currentUserId={
                    currentUserId
                  }
                  canDelete={
                    canDeleteMessages
                  }
                  onDelete={
                    onDeleteMessage
                  }
                  onRetry={
                    onRetryMessage
                  }
                />
              );
            }
          )
        ) : (
          <div className="meeting-chat-panel__empty">
            <div className="meeting-chat-panel__empty-icon">
              <FiMessageSquare />
            </div>

            <strong>
              No messages yet
            </strong>

            <span>
              Start the conversation
              by sending a message to
              the meeting.
            </span>
          </div>
        )}

        <div
          ref={messagesEndRef}
          aria-hidden="true"
        />
      </div>

      {/* ====================================================
          INPUT
      ==================================================== */}

      <form
        className="meeting-chat-panel__composer"
        onSubmit={handleSubmit}
      >
        {inputError && (
          <div
            className="meeting-chat-panel__input-error"
            role="alert"
          >
            <FiAlertCircle />

            <span>
              {inputError}
            </span>

            <button
              type="button"
              onClick={() =>
                setInputError("")
              }
              aria-label="Dismiss error"
            >
              <FiX />
            </button>
          </div>
        )}

        <div className="meeting-chat-panel__composer-box">
          <textarea
            ref={textareaRef}
            value={messageText}
            onChange={(event) => {
              const nextValue =
                event.target.value;

              setMessageText(
                nextValue
              );

              if (
                nextValue.length <=
                maxLength
              ) {
                setInputError("");
              }
            }}
            onKeyDown={
              handleKeyDown
            }
            placeholder={
              canSend
                ? placeholder
                : "Chat is disabled"
            }
            maxLength={
              maxLength + 100
            }
            disabled={
              !canSend ||
              sending
            }
            rows={1}
            aria-label="Meeting chat message"
          />

          <div className="meeting-chat-panel__composer-actions">
            <div className="meeting-chat-panel__composer-tools">
              {onAttachFile && (
                <button
                  type="button"
                  onClick={
                    onAttachFile
                  }
                  disabled={
                    !canSend ||
                    sending
                  }
                  aria-label="Attach file"
                  title="Attach file"
                >
                  <FiPaperclip />
                </button>
              )}

              {onOpenEmojiPicker && (
                <button
                  type="button"
                  onClick={
                    onOpenEmojiPicker
                  }
                  disabled={
                    !canSend ||
                    sending
                  }
                  aria-label="Add emoji"
                  title="Add emoji"
                >
                  <FiSmile />
                </button>
              )}
            </div>

            <div className="meeting-chat-panel__send-area">
              <span
                className={[
                  "meeting-chat-panel__character-count",

                  characterCount >
                  maxLength
                    ? "meeting-chat-panel__character-count--error"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {characterCount}/
                {maxLength}
              </span>

              <button
                type="submit"
                className="meeting-chat-panel__send-button"
                disabled={
                  !canSubmit
                }
                aria-label="Send message"
              >
                <FiSend />

                <span>
                  {sending
                    ? "Sending..."
                    : "Send"}
                </span>
              </button>
            </div>
          </div>
        </div>

        <small className="meeting-chat-panel__hint">
          Press Enter to send and
          Shift + Enter for a new
          line.
        </small>
      </form>
    </aside>
  );
};

export {
  ChatMessage,
  getMessageId,
  getMessageSenderId,
  getMessageSenderName,
  getMessageText,
  formatMessageTime,
};

export default MeetingChatPanel;