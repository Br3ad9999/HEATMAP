function notFoundHandler(req, res) {
  return res.status(404).json({
    message: "Route not found",
    requestId: req.requestId,
  });
}

function errorHandler(err, req, res, next) {
  const statusCode = Number.isInteger(err?.statusCode)
    ? err.statusCode
    : Number.isInteger(err?.status)
      ? err.status
      : 500;

  if (process.env.NODE_ENV !== "test") {
    console.error(`[${req.requestId}]`, err);
  }

  return res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : err.message,
    requestId: req.requestId,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
