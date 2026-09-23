const errorHandler = (

  err,

  req,

  res,

  next

) => {

  /* ==========================================
     LOG ERROR
  ========================================== */

  console.error(err);

  let statusCode = err.statusCode || 500;

  let message = err.message || "Internal Server Error";

 /* ==========================================
   DUPLICATE KEY
========================================== */

if (err.code === 11000) {
  statusCode = 409;

  const field =
    Object.keys(err.keyPattern || {})[0] ||
    Object.keys(err.keyValue || {})[0];

  const duplicateMessages = {
    email: "Email address is already registered.",
    phone: "Phone number is already registered.",
    nationalId: "National ID is already registered.",
    memberNumber: "Membership number is already registered.",
  };

  message =
    duplicateMessages[field] ||
    "Some of the information provided is already registered.";
}

  /* ==========================================
     MONGOOSE VALIDATION
  ========================================== */

  if (err.name === "ValidationError") {

    statusCode = 400;

    message = Object.values(

      err.errors

    )

      .map((error) => error.message)

      .join(", ");

  }

  /* ==========================================
     INVALID OBJECT ID
  ========================================== */

  if (err.name === "CastError") {

    statusCode = 400;

    message = "Invalid resource ID.";

  }

  /* ==========================================
     JWT
  ========================================== */

  if (err.name === "JsonWebTokenError") {

    statusCode = 401;

    message = "Invalid authentication token.";

  }

  if (err.name === "TokenExpiredError") {

    statusCode = 401;

    message = "Authentication token has expired.";

  }

  /* ==========================================
     INVALID JSON
  ========================================== */

  if (

    err instanceof SyntaxError &&

    err.status === 400 &&

    "body" in err

  ) {

    statusCode = 400;

    message = "Invalid JSON request body.";

  }

  /* ==========================================
     MULTER
  ========================================== */

  if (err.name === "MulterError") {

    statusCode = 400;

    message = err.message;

  }

  /* ==========================================
     RESPONSE
  ========================================== */

  const response = {

    success: false,

    message,

  };

  /* ==========================================
     DEVELOPMENT ONLY
  ========================================== */

  if (

    process.env.NODE_ENV === "development"

  ) {

    response.stack = err.stack;

  }

  /* ==========================================
     PRODUCTION
  ========================================== */

  if (

    process.env.NODE_ENV === "production" &&

    statusCode === 500

  ) {

    response.message =

      "Something went wrong. Please try again later.";

  }

  return res

    .status(statusCode)

    .json(response);

};

export default errorHandler;