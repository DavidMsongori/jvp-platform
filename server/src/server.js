import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

dotenv.config();

const PORT =
  process.env.PORT || 5000;

/* ==========================================
   ALLOWED CLIENT ORIGINS
========================================== */

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

/* ==========================================
   START SERVER
========================================== */

async function startServer() {
  try {
    /*
     * Import application modules only after
     * environment variables have been loaded.
     */
    const [
      { default: app },
      { default: connectDB },
      { default: registerMeetingSocket },
    ] = await Promise.all([
      import("./app.js"),
      import("./config/db.js"),
      import("./socket/meeting.socket.js"),
    ]);

    await connectDB();

    /* ======================================
       HTTP SERVER
    ====================================== */

    const httpServer =
      http.createServer(app);

   /* ======================================
   SOCKET.IO SERVER
====================================== */

const socketAllowedOrigins = [
  ...allowedOrigins,

  "http://localhost:5173",
  "http://127.0.0.1:5173",

  "https://jvp-platform.vercel.app",
  "https://jvp.co.ke",
  "https://www.jvp.co.ke",
];

const io = new Server(
  httpServer,
  {
    cors: {
      origin(origin, callback) {
        /*
         * Allow requests without an Origin header.
         * This supports tools, server-to-server requests,
         * and some mobile clients.
         */
        if (!origin) {
          return callback(
            null,
            true
          );
        }

        if (
          socketAllowedOrigins.includes(
            origin
          )
        ) {
          return callback(
            null,
            true
          );
        }

        /*
         * Allow Vercel preview deployments for this project.
         *
         * Examples:
         * https://jvp-platform-git-main-username.vercel.app
         * https://jvp-platform-abc123.vercel.app
         */
        const isAllowedVercelPreview =
          /^https:\/\/jvp-platform(?:-[a-z0-9-]+)?\.vercel\.app$/i.test(
            origin
          );

        if (isAllowedVercelPreview) {
          return callback(
            null,
            true
          );
        }

        console.warn(
          `Blocked Socket.IO origin: ${origin}`
        );

        return callback(
          new Error(
            `Socket origin ${origin} is not allowed.`
          )
        );
      },

      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
      ],

      allowedHeaders: [
        "Content-Type",
        "Authorization",
      ],

      credentials: true,
    },

    transports: [
      "websocket",
      "polling",
    ],

    pingTimeout: 60000,
    pingInterval: 25000,

    maxHttpBufferSize: 1e6,

    allowEIO3: false,

    /*
     * Keep the standard Socket.IO path unless the
     * client explicitly uses a different one.
     */
    path: "/socket.io",
  }
);

app.set("io", io);

registerMeetingSocket(io);

    /* ======================================
       START SERVER
    ====================================== */

    httpServer.listen(
      PORT,
      () => {
        console.log(
          "===================================="
        );
        console.log(
          "🚀 JVP Connect API Started"
        );
        console.log(
          `🌍 Environment : ${
            process.env.NODE_ENV ||
            "development"
          }`
        );
        console.log(
          `📡 Port        : ${PORT}`
        );
        console.log(
          "🔌 Socket.IO   : Enabled"
        );
        console.log(
          "===================================="
        );
      }
    );

    /* ======================================
       SERVER ERRORS
    ====================================== */

    httpServer.on(
      "error",
      (error) => {
        if (
          error.code ===
          "EADDRINUSE"
        ) {
          console.error(
            `Port ${PORT} is already in use.`
          );
        } else {
          console.error(
            "HTTP server error:",
            error
          );
        }

        process.exit(1);
      }
    );

    io.engine.on(
      "connection_error",
      (error) => {
        console.error(
          "Socket.IO connection error:",
          {
            code: error.code,
            message:
              error.message,
            context:
              error.context,
          }
        );
      }
    );

    /* ======================================
       GRACEFUL SHUTDOWN
    ====================================== */

    let isShuttingDown =
      false;

    const shutdown = (
      signal
    ) => {
      if (isShuttingDown) {
        return;
      }

      isShuttingDown = true;

      console.log(
        `\n${signal} received. Shutting down gracefully...`
      );

      io.close();

      httpServer.close(
        (error) => {
          if (error) {
            console.error(
              "Error closing HTTP server:",
              error
            );

            process.exit(1);
          }

          console.log(
            "HTTP server closed."
          );

          process.exit(0);
        }
      );

      setTimeout(() => {
        console.error(
          "Forced shutdown after timeout."
        );

        process.exit(1);
      }, 10000).unref();
    };

    process.on(
      "SIGTERM",
      () =>
        shutdown("SIGTERM")
    );

    process.on(
      "SIGINT",
      () =>
        shutdown("SIGINT")
    );

    process.on(
      "unhandledRejection",
      (error) => {
        console.error(
          "Unhandled promise rejection:",
          error
        );

        shutdown(
          "UNHANDLED_REJECTION"
        );
      }
    );

    process.on(
      "uncaughtException",
      (error) => {
        console.error(
          "Uncaught exception:",
          error
        );

        shutdown(
          "UNCAUGHT_EXCEPTION"
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server."
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();