# UrbanHeat+ Backend

Free-tier-ready Node.js backend for heat-risk analysis.

## Architecture
- Express API with JWT authentication
- OpenWeather (free plan) for weather lookup
- Input: `latitude`, `longitude`
- Output: temperature, humidity, heat index, and risk level
- No Google APIs
- No AWS required

## Endpoints
### `GET /health`
```json
{ "status": "ok" }
```

### `POST /login`
Request body:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
Response:
```json
{
  "token": "<jwt>"
}
```

### `POST /analyze` (JWT protected)
Headers:
```text
Authorization: Bearer <jwt>
```

Body:
```json
{
  "latitude": 9.9312,
  "longitude": 76.2673
}
```

Response:
```json
{
  "latitude": 9.9312,
  "longitude": 76.2673,
  "temperature": 32,
  "humidity": 75,
  "heatIndex": 42.31,
  "riskLevel": "Red"
}
```

## Risk Levels
- `Green` `< 27`
- `Yellow` `27 - < 32`
- `Orange` `32 - < 41`
- `Red` `41 - 54`
- `Dark Red` `> 54`

## Local Setup
```bash
npm install
npm test
npm start
```

## Environment Variables
Copy `.env.example` to `.env`:

```env
PORT=3000
JWT_SECRET=supersecret
OPENWEATHER_KEY=your_key
CORS_ORIGINS=http://localhost:4200,http://127.0.0.1:5500
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=120
OPENWEATHER_TIMEOUT_MS=10000
OPENWEATHER_RETRY_COUNT=2
OPENWEATHER_RETRY_BASE_DELAY_MS=250
WEATHER_CACHE_TTL_MS=300000
JSON_BODY_LIMIT=16kb
```

## Free Deployment (Render)
1. Push repo to GitHub.
2. Create Render Web Service (Free instance).
3. Root Directory: `urbanheat-backend`
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Set environment variables:
   - `PORT=10000`
   - `JWT_SECRET=supersecret`
   - `OPENWEATHER_KEY=your_real_key`

## Frontend Integration (free hosting compatible)
```js
const API_URL = "https://<render-service>.onrender.com";
```

Use browser GPS:
```js
navigator.geolocation.getCurrentPosition((position) => {
  const payload = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude
  };
});
```
