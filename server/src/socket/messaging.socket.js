import User from "../models/User.js";
import Member from "../models/Member.js";
import { verifyToken } from "../utils/jwt.js";

const authenticateMessagingSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake?.auth?.token ||
      socket.handshake?.headers?.authorization?.replace(/^Bearer\s+/i, "");

    if (!token) {
      return next(new Error("Authentication token is required."));
    }

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return next(new Error("Invalid authentication token."));
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return next(new Error("Active user account required."));
    }

    const member = await Member.findOne({ user: user._id });

    if (
      !member ||
      member.membershipStatus !== "active" ||
      member.membershipFeePaid !== true
    ) {
      return next(new Error("Active paid membership is required for messaging."));
    }

    socket.user = user;
    socket.member = member;
    socket.data.userId = user._id.toString();

    next();
  } catch (error) {
    next(new Error("Messaging authentication failed."));
  }
};

const registerMessagingSocket = (io) => {
  io.use(authenticateMessagingSocket);

  io.on("connection", async (socket) => {
    const userId = socket.data.userId;

    await socket.join(`user:${userId}`);

    socket.emit("messaging:authenticated", {
      success: true,
      userId,
    });

    console.log(`Messaging socket connected: ${userId}`);

    socket.on("disconnect", () => {
      console.log(`Messaging socket disconnected: ${userId}`);
    });
  });

  return io;
};

export { authenticateMessagingSocket };
export default registerMessagingSocket;
