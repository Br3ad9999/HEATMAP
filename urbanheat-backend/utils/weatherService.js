const axios = require("axios");

const OPENWEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_BASE_DELAY_MS = 250;
const DEFAULT_WEATHER_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_SIZE = 500;

const weatherCache = new Map();

function readPositiveNumberEnv(name, fallback) {
  const value = Number(process.env[name]);
  if (Number.isFinite(value) && value >= 0) {
    return value;
  }
  return fallback;
}

function buildServiceError(code, message, cause) {
  const error = new Error(message);
  error.code = code;
  error.cause = cause;
  return error;
}

function isRetryableError(error) {
  if (!error.response) {
    return true;
  }

  const statusCode = error.response.status;
  return statusCode === 408 || statusCode === 429 || statusCode >= 500;
}

function sleep(ms) {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCachedValue(cache, key) {
  const cached = cache.get(key);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }

  return cached.value;
}

function limitCacheSize(cache) {
  if (cache.size <= MAX_CACHE_SIZE) {
    return;
  }

  const overflow = cache.size - MAX_CACHE_SIZE;
  let removed = 0;

  for (const key of cache.keys()) {
    cache.delete(key);
    removed += 1;
    if (removed >= overflow) {
      break;
    }
  }
}

function setCachedValue(cache, key, value, ttlMs) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
  limitCacheSize(cache);
}

function getApiKey() {
  const apiKey = process.env.OPENWEATHER_KEY;
  if (!apiKey) {
    throw buildServiceError("OPENWEATHER_CONFIG_MISSING", "OPENWEATHER_KEY is not configured");
  }
  return apiKey;
}

async function requestOpenWeather(url, params) {
  const timeoutMs = readPositiveNumberEnv("OPENWEATHER_TIMEOUT_MS", DEFAULT_TIMEOUT_MS);
  const retryCount = readPositiveNumberEnv("OPENWEATHER_RETRY_COUNT", DEFAULT_RETRY_COUNT);
  const retryBaseDelayMs = readPositiveNumberEnv(
    "OPENWEATHER_RETRY_BASE_DELAY_MS",
    DEFAULT_RETRY_BASE_DELAY_MS
  );

  let lastError;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      return await axios.get(url, {
        params,
        timeout: timeoutMs,
      });
    } catch (error) {
      lastError = error;
      const shouldRetry = isRetryableError(error) && attempt < retryCount;
      if (!shouldRetry) {
        break;
      }
      await sleep(retryBaseDelayMs * 2 ** attempt);
    }
  }

  throw buildServiceError("OPENWEATHER_UPSTREAM_ERROR", "OpenWeather request failed", lastError);
}

async function fetchWeatherByCoordinates(latitude, longitude) {
  const apiKey = getApiKey();
  const weatherTtlMs = readPositiveNumberEnv("WEATHER_CACHE_TTL_MS", DEFAULT_WEATHER_CACHE_TTL_MS);
  const cacheKey = `${Number(latitude).toFixed(4)}:${Number(longitude).toFixed(4)}`;

  const cached = getCachedValue(weatherCache, cacheKey);
  if (cached) {
    return cached;
  }

  const response = await requestOpenWeather(OPENWEATHER_URL, {
    lat: latitude,
    lon: longitude,
    appid: apiKey,
    units: "metric",
  });

  const main = response?.data?.main;
  if (!main || typeof main.temp !== "number" || typeof main.humidity !== "number") {
    throw buildServiceError("OPENWEATHER_PAYLOAD_INVALID", "Invalid weather payload");
  }

  const mapped = {
    temperature: main.temp,
    humidity: main.humidity,
  };

  setCachedValue(weatherCache, cacheKey, mapped, weatherTtlMs);
  return mapped;
}

module.exports = {
  fetchWeatherByCoordinates,
  __test__: {
    clearCaches() {
      weatherCache.clear();
    },
  },
};
