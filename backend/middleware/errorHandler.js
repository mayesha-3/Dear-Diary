// backend/middleware/errorHandler.js

export const errorHandler = (err, req, res, next) => {
  console.error(`[${req.method}] ${req.path} →`, err.message);

  // Firebase auth errors
  if (err.code?.startsWith("auth/")) {
    return res.status(401).json({
      message: "Authentication error.",
      code: err.code,
    });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      message: "Validation failed.",
      errors: messages,
    });
  }

  // Mongoose bad ObjectId (e.g. /entries/not-a-real-id)
  if (err.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    return res.status(400).json({
      message: `File upload error: ${err.message}`,
    });
  }

  // Fallback
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
  });
};
