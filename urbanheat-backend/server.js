require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");

const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const analyzeRoutes = require("./routes/analyze");
const { attachRequestContext, requestLogger } = require("./middleware/requestContext");
const { analyzeLimiter } = require("./middleware/rateLimiter");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

function parseAllowedOrigins(value) {
  if (!value) {
    return [];
  }
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGINS);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      if (allowedOrigins.length === 0 || !origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  })
);
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "16kb", strict: true }));
app.use(attachRequestContext);
app.use(requestLogger);

app.use(healthRoutes);
app.use(authRoutes);
app.use("/analyze", analyzeLimiter);
app.use(analyzeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`UrbanHeat+ backend running on port ${PORT}`);
  });
}

module.exports = app;
