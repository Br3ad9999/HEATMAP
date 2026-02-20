const express = require("express");

const { fetchWeatherByCoordinates } = require("../utils/weatherService");
const { calculateHeatIndex, getRiskLevel } = require("../utils/heatIndex");
const { ValidationError, validateAnalyzePayload } = require("../utils/validation");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/analyze", verifyToken, async (req, res) => {
  let payload;

  try {
    payload = validateAnalyzePayload(req.body);
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(400).json({ message: "Invalid request payload" });
  }

  const lat = payload.latitude;
  const lon = payload.longitude;

  try {
    const { temperature, humidity } = await fetchWeatherByCoordinates(lat, lon);
    const heatIndex = calculateHeatIndex(temperature, humidity);
    const riskLevel = getRiskLevel(heatIndex);

    return res.status(200).json({
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      temperature: Number(temperature.toFixed(1)),
      humidity,
      heatIndex,
      riskLevel,
    });
  } catch (error) {
    if (error.code === "OPENWEATHER_CONFIG_MISSING") {
      return res.status(500).json({ message: "Weather API key is not configured" });
    }
    if (error.code === "OPENWEATHER_UPSTREAM_ERROR" || error.code === "OPENWEATHER_PAYLOAD_INVALID") {
      return res.status(502).json({ message: "Weather API failure" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
