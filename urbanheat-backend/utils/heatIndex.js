function calculateHeatIndex(tempC, humidity) {
  const temperatureC = Number(tempC);
  const rh = Number(humidity);

  if (!Number.isFinite(temperatureC) || !Number.isFinite(rh)) {
    throw new TypeError("Temperature and humidity must be numeric values");
  }
  if (rh < 0 || rh > 100) {
    throw new RangeError("Humidity must be between 0 and 100");
  }

  const tempF = (temperatureC * 9) / 5 + 32;

  // NOAA heat index is intended for hot/humid conditions.
  // For cooler temperatures, return actual air temperature.
  if (tempF < 80 || rh < 40) {
    return Number(temperatureC.toFixed(2));
  }

  let heatIndexF =
    -42.379 +
    2.04901523 * tempF +
    10.14333127 * rh -
    0.22475541 * tempF * rh -
    0.00683783 * tempF * tempF -
    0.05481717 * rh * rh +
    0.00122874 * tempF * tempF * rh +
    0.00085282 * tempF * rh * rh -
    0.00000199 * tempF * tempF * rh * rh;

  if (rh < 13 && tempF >= 80 && tempF <= 112) {
    heatIndexF -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(tempF - 95)) / 17);
  } else if (rh > 85 && tempF >= 80 && tempF <= 87) {
    heatIndexF += ((rh - 85) / 10) * ((87 - tempF) / 5);
  }

  // Heat index should not be below actual air temperature.
  heatIndexF = Math.max(heatIndexF, tempF);

  const heatIndexC = ((heatIndexF - 32) * 5) / 9;
  return Number(heatIndexC.toFixed(2));
}

function getRiskLevel(heatIndexC) {
  const value = Number(heatIndexC);

  if (!Number.isFinite(value)) {
    throw new TypeError("Heat index must be numeric");
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

module.exports = {
  calculateHeatIndex,
  getRiskLevel,
};
