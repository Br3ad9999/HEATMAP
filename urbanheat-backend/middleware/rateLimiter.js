const rateLimit = require("express-rate-limit");

function readNumericEnv(name, fallback) {
  const value = Number(process.env[name]);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return fallback;
}

const limiterEnabled = process.env.RATE_LIMIT_ENABLED !== "false";
const windowMs = readNumericEnv("RATE_LIMIT_WINDOW_MS", 60_000);
const max = readNumericEnv("RATE_LIMIT_MAX", 120);

const passThroughLimiter = (req, res, next) => next();

const analyzeLimiter = limiterEnabled
  ? rateLimit({
      windowMs,
      max,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { message: "Too many requests. Please retry shortly." },
    })
  : passThroughLimiter;

module.exports = {
  analyzeLimiter,
};
