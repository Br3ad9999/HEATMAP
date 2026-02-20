process.env.JWT_SECRET = "supersecret";
process.env.OPENWEATHER_KEY = "test_openweather_key";
process.env.RATE_LIMIT_ENABLED = "false";

const request = require("supertest");
const axios = require("axios");

jest.mock("axios");

const app = require("../server");
const { calculateHeatIndex, getRiskLevel } = require("../utils/heatIndex");
const { __test__: weatherServiceTest } = require("../utils/weatherService");

describe("UrbanHeat+ API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    weatherServiceTest.clearCaches();
  });

  async function getToken() {
    const response = await request(app).post("/login").send({
      username: "admin",
      password: "admin123",
    });

    return response.body.token;
  }

  test("GET /health returns 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
    expect(response.headers["x-request-id"]).toBeDefined();
  });

  test("POST /login success", async () => {
    const response = await request(app).post("/login").send({
      username: "admin",
      password: "admin123",
    });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe("string");
    expect(response.body.token.length).toBeGreaterThan(20);
  });

  test("POST /login failure", async () => {
    const response = await request(app).post("/login").send({
      username: "admin",
      password: "wrong",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid credentials");
  });

  test("POST /analyze without token returns 401", async () => {
    const response = await request(app).post("/analyze").send({
      latitude: 9.9312,
      longitude: 76.2673,
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authorization token required");
  });

  test("POST /analyze with invalid token returns 401", async () => {
    const response = await request(app)
      .post("/analyze")
      .set("Authorization", "Bearer invalid.token.value")
      .send({
        latitude: 9.9312,
        longitude: 76.2673,
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid token");
  });

  test("POST /analyze with missing fields returns 400", async () => {
    const token = await getToken();
    const response = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 9.9312 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("latitude and longitude are required");
  });

  test("POST /analyze with invalid coordinates returns 400", async () => {
    const token = await getToken();
    const response = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({
        latitude: 120,
        longitude: 76.2673,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Coordinates out of range");
  });

  test("POST /analyze with weather API failure returns 502", async () => {
    axios.get.mockRejectedValue(new Error("upstream failed"));

    const token = await getToken();
    const response = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({
        latitude: 9.9312,
        longitude: 76.2673,
      });

    expect(response.status).toBe(502);
    expect(response.body.message).toBe("Weather API failure");
  });

  test("POST /analyze success", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        main: {
          temp: 32,
          humidity: 75,
        },
      },
    });

    const token = await getToken();
    const response = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({
        latitude: 9.9312,
        longitude: 76.2673,
      });

    const expectedHeatIndex = calculateHeatIndex(32, 75);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      latitude: 9.9312,
      longitude: 76.2673,
      temperature: 32,
      humidity: 75,
      heatIndex: expectedHeatIndex,
      riskLevel: getRiskLevel(expectedHeatIndex),
    });
  });
});
