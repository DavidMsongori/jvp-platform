const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const routes = require("./routes");

const {
  errorHandler,
  notFound,
} = require("./middleware/error.middleware");

const app = express();

/* =====================================================
   SECURITY
===================================================== */

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* =====================================================
   BODY PARSERS
===================================================== */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   LOGGER
===================================================== */

app.use(morgan("dev"));

/* =====================================================
   STATIC FILES
===================================================== */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "../uploads")
  )
);

/* =====================================================
   ROOT
===================================================== */

app.get("/", (req, res) => {
  res.json({
    success: true,
    application: "JVP Connect API",
    version: "1.0.0",
    status: "Running",
    documentation: "/api/health",
  });
});

/* =====================================================
   HEALTH
===================================================== */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "Healthy",
    database: "Connected",
    timestamp: new Date(),
  });
});

/* =====================================================
   ROUTES
===================================================== */

app.use("/api", routes);

/* =====================================================
   404
===================================================== */

app.use(notFound);

/* =====================================================
   ERROR HANDLER
===================================================== */

app.use(errorHandler);

module.exports = app;