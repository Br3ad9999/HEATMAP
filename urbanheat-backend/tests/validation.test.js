const { ValidationError, validateAnalyzePayload } = require("../utils/validation");

describe("Analyze payload validation", () => {
  test("accepts valid coordinate payload", () => {
    const result = validateAnalyzePayload({ latitude: "9.9312", longitude: "76.2673" });

    expect(result).toEqual({
      latitude: 9.9312,
      longitude: 76.2673,
    });
  });

  test("rejects missing longitude", () => {
    expect(() => validateAnalyzePayload({ latitude: 10 })).toThrow(ValidationError);
    expect(() => validateAnalyzePayload({ latitude: 10 })).toThrow(
      "latitude and longitude are required"
    );
  });

  test("rejects invalid number values", () => {
    expect(() => validateAnalyzePayload({ latitude: "abc", longitude: 76 })).toThrow(
      "latitude and longitude must be valid numbers"
    );
  });

  test("rejects out-of-range coordinates", () => {
    expect(() => validateAnalyzePayload({ latitude: 91, longitude: 76 })).toThrow(
      "Coordinates out of range"
    );
  });
});
