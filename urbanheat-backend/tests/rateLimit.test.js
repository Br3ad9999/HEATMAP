describe("Rate limiter", () => {
  const envBackup = {
    RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED,
    RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX,
    OPENWEATHER_KEY: process.env.OPENWEATHER_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  afterAll(() => {
    process.env.RATE_LIMIT_ENABLED = envBackup.RATE_LIMIT_ENABLED;
    process.env.RATE_LIMIT_WINDOW_MS = envBackup.RATE_LIMIT_WINDOW_MS;
    process.env.RATE_LIMIT_MAX = envBackup.RATE_LIMIT_MAX;
    process.env.OPENWEATHER_KEY = envBackup.OPENWEATHER_KEY;
    process.env.JWT_SECRET = envBackup.JWT_SECRET;
    jest.resetModules();
  });

  test("throttles burst analyze requests", async () => {
    process.env.RATE_LIMIT_ENABLED = "true";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    process.env.RATE_LIMIT_MAX = "2";
    process.env.OPENWEATHER_KEY = "test_openweather_key";
    process.env.JWT_SECRET = "supersecret";

    jest.resetModules();
    jest.doMock("axios", () => ({
      get: jest.fn().mockResolvedValue({
        data: {
          main: {
            temp: 30,
            humidity: 70,
          },
        },
      }),
    }));

    const request = require("supertest");
    const app = require("../server");

    const login = await request(app)
      .post("/login")
      .send({ username: "admin", password: "admin123" });
    const token = login.body.token;

    const first = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 10, longitude: 76 });
    const second = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 10, longitude: 76 });
    const third = await request(app)
      .post("/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ latitude: 10, longitude: 76 });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(third.status).toBe(429);
    expect(third.body.message).toBe("Too many requests. Please retry shortly.");
  });
});
