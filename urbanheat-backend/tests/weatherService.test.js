process.env.OPENWEATHER_KEY = "test_openweather_key";
process.env.OPENWEATHER_RETRY_COUNT = "2";
process.env.OPENWEATHER_RETRY_BASE_DELAY_MS = "0";
process.env.WEATHER_CACHE_TTL_MS = "60000";

const axios = require("axios");

jest.mock("axios");

const {
  fetchWeatherByCoordinates,
  __test__: weatherServiceTest,
} = require("../utils/weatherService");

describe("Weather service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    weatherServiceTest.clearCaches();
    process.env.OPENWEATHER_KEY = "test_openweather_key";
  });

  test("fetchWeatherByCoordinates caches results", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        main: {
          temp: 31.4,
          humidity: 70,
        },
      },
    });

    const first = await fetchWeatherByCoordinates(10, 76);
    const second = await fetchWeatherByCoordinates(10, 76);

    expect(first).toEqual(second);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("retries transient upstream failures", async () => {
    axios.get
      .mockRejectedValueOnce({ response: { status: 500 } })
      .mockResolvedValueOnce({
        data: {
          main: { temp: 30, humidity: 80 },
        },
      });

    const result = await fetchWeatherByCoordinates(11.11, 77.77);

    expect(result).toEqual({ temperature: 30, humidity: 80 });
    expect(axios.get).toHaveBeenCalledTimes(2);
  });

  test("does not retry non-retryable upstream failures", async () => {
    axios.get.mockRejectedValueOnce({ response: { status: 400 } });

    await expect(fetchWeatherByCoordinates(11.11, 77.77)).rejects.toMatchObject({
      code: "OPENWEATHER_UPSTREAM_ERROR",
    });

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  test("throws config error when OPENWEATHER_KEY is missing", async () => {
    process.env.OPENWEATHER_KEY = "";

    await expect(fetchWeatherByCoordinates(9.9, 76.2)).rejects.toMatchObject({
      code: "OPENWEATHER_CONFIG_MISSING",
    });
  });
});
