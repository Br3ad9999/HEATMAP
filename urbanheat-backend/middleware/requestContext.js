const { randomUUID } = require("crypto");

function attachRequestContext(req, res, next) {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

function requestLogger(req, res, next) {
  if (process.env.NODE_ENV === "test") {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs.toFixed(1)}ms [${req.requestId}]`
    );
  });

  next();
}

module.exports = {
  attachRequestContext,
  requestLogger,
};
