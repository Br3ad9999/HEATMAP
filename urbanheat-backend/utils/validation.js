class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.code = "VALIDATION_ERROR";
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseCoordinate(rawValue) {
  if (rawValue === undefined || rawValue === null) {
    return null;
  }

  const numeric = Number(rawValue);
  if (!Number.isFinite(numeric)) {
    return null;
  }

  return numeric;
}

function validateAnalyzePayload(payload) {
  if (!isPlainObject(payload)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  const hasLatitude = payload.latitude !== undefined;
  const hasLongitude = payload.longitude !== undefined;
  if (!hasLatitude || !hasLongitude) {
    throw new ValidationError("latitude and longitude are required");
  }

  const latitude = parseCoordinate(payload.latitude);
  const longitude = parseCoordinate(payload.longitude);

  if (latitude === null || longitude === null) {
    throw new ValidationError("latitude and longitude must be valid numbers");
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ValidationError("Coordinates out of range");
  }

  return {
    latitude,
    longitude,
  };
}

module.exports = {
  ValidationError,
  validateAnalyzePayload,
};
