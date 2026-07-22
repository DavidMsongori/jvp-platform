import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import errorHandler from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import memberRoutes from "./routes/member.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import healthRoutes from "./routes/health.routes.js";
import eventRoutes from "./routes/event.routes.js";
import leaderRoutes from "./routes/leader.routes.js";
import leadershipCardRoutes from "./routes/leadershipCard.routes.js";

const app = express();

/* ==========================================================
   PATHS
========================================================== */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ==========================================================
   SECURITY
========================================================== */

app.use(helmet());

/* ==========================================================
   CORS
========================================================== */

const allowedOrigins = [
  "http://localhost:5173",
  "https://jvp-platform.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      console.log("Incoming Origin:", origin);

      // Allow Postman and server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked Origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
  })
);

/* ==========================================================
   LOGGING
========================================================== */

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

/* ==========================================================
   BODY PARSERS
========================================================== */

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(cookieParser());

/* ==========================================================
   STATIC FILES
========================================================== */

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

/* ==========================================================
   ROOT
========================================================== */

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "JVP Connect API is running.",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
  });
});

/* ==========================================================
   API ROUTES
========================================================== */

app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/member", memberRoutes);

app.use("/api/payments", paymentRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/leaders", leaderRoutes);

app.use("/api/leadership-card", leadershipCardRoutes);

/* ==========================================================
   404
========================================================== */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

/* ==========================================================
   ERROR HANDLER
========================================================== */

app.use(errorHandler);

export default app;