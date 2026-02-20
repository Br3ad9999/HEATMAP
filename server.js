require("dotenv").config();
const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const verifyToken = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";

function calculateHeatIndex(tempC, humidity) {
  const temperatureC = Number(tempC);
  const relativeHumidity = Number(humidity);

  if (!Number.isFinite(temperatureC) || !Number.isFinite(relativeHumidity)) {
    throw new TypeError("tempC and humidity must be numeric values");
  }

  if (relativeHumidity < 0 || relativeHumidity > 100) {
    throw new RangeError("humidity must be between 0 and 100");
  }

  const tempF = (temperatureC * 9) / 5 + 32;

  const simpleHeatIndexF =
    0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + relativeHumidity * 0.094);
  let heatIndexF = (simpleHeatIndexF + tempF) / 2;

  if (heatIndexF >= 80) {
    heatIndexF =
      -42.379 +
      2.04901523 * tempF +
      10.14333127 * relativeHumidity -
      0.22475541 * tempF * relativeHumidity -
      0.00683783 * tempF * tempF -
      0.05481717 * relativeHumidity * relativeHumidity +
      0.00122874 * tempF * tempF * relativeHumidity +
      0.00085282 * tempF * relativeHumidity * relativeHumidity -
      0.00000199 * tempF * tempF * relativeHumidity * relativeHumidity;

    if (relativeHumidity < 13 && tempF >= 80 && tempF <= 112) {
      heatIndexF -=
        ((13 - relativeHumidity) / 4) *
        Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
    } else if (relativeHumidity > 85 && tempF >= 80 && tempF <= 87) {
      heatIndexF += ((relativeHumidity - 85) / 10) * ((87 - tempF) / 5);
    }
  }

  return ((heatIndexF - 32) * 5) / 9;
}

function getRiskLevel(heatIndexC) {
  const value = Number(heatIndexC);

  if (!Number.isFinite(value)) {
    throw new TypeError("heatIndexC must be a numeric value");
  }

  if (value < 27) {
    return "Green";
  }
  if (value < 32) {
    return "Yellow";
  }
  if (value < 41) {
    return "Orange";
  }
  if (value <= 54) {
    return "Red";
  }
  return "Dark Red";
}

app.use(express.json());

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== "admin" || password !== "admin123") {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
  return res.json({ token });
});

app.get("/protected", verifyToken, (req, res) => {
  return res.json({
    message: "Access granted",
    user: req.user,
  });
});

app.post("/geocode", async (req, res) => {
  const { locationName } = req.body;
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;

  if (typeof locationName !== "string" || locationName.trim().length === 0) {
    return res
      .status(400)
      .json({ message: "locationName is required and must be a non-empty string" });
  }

  if (!apiKey) {
    return res.status(500).json({ message: "GOOGLE_GEOCODING_API_KEY is not configured" });
  }

  try {
    const geocodeResponse = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: locationName.trim(),
          key: apiKey,
        },
      }
    );

    const { status, results, error_message: errorMessage } = geocodeResponse.data;

    if (status === "ZERO_RESULTS" || !Array.isArray(results) || results.length === 0) {
      return res.status(404).json({ message: "No coordinates found for the provided location" });
    }

    if (status !== "OK") {
      return res.status(502).json({
        message: "Google Geocoding API request failed",
        googleStatus: status,
        googleError: errorMessage || null,
      });
    }

    const { lat, lng } = results[0].geometry.location;
    return res.json({ latitude: lat, longitude: lng });
  } catch (error) {
    return res.status(502).json({
      message: "Failed to call Google Geocoding API",
      error: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
