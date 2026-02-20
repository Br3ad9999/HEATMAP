const { calculateHeatIndex, getRiskLevel } = require("../utils/heatIndex");

describe("Heat index utilities", () => {
  test("calculateHeatIndex returns rounded Celsius value", () => {
    const value = calculateHeatIndex(32, 75);
    expect(value).toBe(42.31);
  });

  test("calculateHeatIndex returns air temperature in cool conditions", () => {
    expect(calculateHeatIndex(10, 80)).toBe(10);
    expect(calculateHeatIndex(-5, 60)).toBe(-5);
  });

  test("calculateHeatIndex validates humidity range", () => {
    expect(() => calculateHeatIndex(30, -1)).toThrow("Humidity must be between 0 and 100");
    expect(() => calculateHeatIndex(30, 120)).toThrow("Humidity must be between 0 and 100");
  });

  test("getRiskLevel boundaries", () => {
    expect(getRiskLevel(26.99)).toBe("Green");
    expect(getRiskLevel(27)).toBe("Yellow");
    expect(getRiskLevel(31.99)).toBe("Yellow");
    expect(getRiskLevel(32)).toBe("Orange");
    expect(getRiskLevel(40.99)).toBe("Orange");
    expect(getRiskLevel(41)).toBe("Red");
    expect(getRiskLevel(54)).toBe("Red");
    expect(getRiskLevel(54.01)).toBe("Dark Red");
  });
});
