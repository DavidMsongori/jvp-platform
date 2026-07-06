/* =====================================================
   GLOBAL ERROR HANDLER
===================================================== */

const errorHandler = (err, req, res, next) => {
  console.error("========================================");
  console.error("JVP CONNECT API ERROR");
  console.error("Time:", new Date().toISOString());
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Message:", err.message);

  if (process.env.NODE_ENV !== "production") {
    console.error("Stack:");
    console.error(err.stack);
  }

  console.error("========================================");

  const statusCode = err.statusCode || err.status || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: process.env.NODE_ENV === "production"
      ? []
      : [err.message],
    timestamp: new Date().toISOString(),
  });
};

/* =====================================================
   NOT FOUND HANDLER
===================================================== */

const notFound = (req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  errorHandler,
  notFound,
};