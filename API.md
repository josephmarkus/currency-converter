# API Documentation

Your Cloudflare Worker provides the following API endpoints for accessing exchange rate data.

**Base URL:** `https://currency-converter-worker.josephmarkus.workers.dev`

## Endpoints

### Health Check

Check if the API and database are operational.

**Endpoint:** `GET /api/health`

**Example:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-09T19:30:00.000Z",
  "version": "1.0.0"
}
```

---

### Get Metadata

Get information about the last data fetch and database status.

**Endpoint:** `GET /api/metadata`

**Example:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/metadata
```

**Response:**
```json
{
  "last_fetch": "2025-11-09",
  "total_currencies": 30,
  "total_records": 900,
  "fetch_source": "frankfurter-github-action",
  "last_cache_update": "2025-11-09T09:15:00.000Z",
  "server_time": "2025-11-09T19:30:00.000Z",
  "database_status": "online"
}
```

---

### Get Status

Get quick status information for the frontend.

**Endpoint:** `GET /api/status`

**Example:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/status
```

**Response:**
```json
{
  "online": true,
  "last_update": "2025-11-09T09:15:00.000Z",
  "hours_since_update": 10.2,
  "has_new_data": false,
  "status": "updated",
  "next_update": "2025-11-10T09:00:00.000Z"
}
```

---

### Get Exchange Rates

Get exchange rates with various query options.

**Endpoint:** `GET /api/rates`

**Query Parameters:**
- `from` (optional): Base currency code (e.g., USD)
- `to` (optional): Target currency code (e.g., EUR)
- `date` (optional): Date in YYYY-MM-DD format (defaults to latest)

#### Get All Rates for a Base Currency

**Example:**
```bash
curl "https://currency-converter-worker.josephmarkus.workers.dev/api/rates?from=USD"
```

**Response:**
```json
{
  "data": [
    {
      "base_currency": "USD",
      "target_currency": "EUR",
      "rate": 0.85,
      "date": "2025-11-09",
      "source_date": "2025-11-09"
    },
    {
      "base_currency": "USD",
      "target_currency": "GBP",
      "rate": 0.73,
      "date": "2025-11-09",
      "source_date": "2025-11-09"
    }
    // ... more rates
  ],
  "metadata": {
    "date": "2025-11-09",
    "timestamp": "2025-11-09T19:30:00.000Z",
    "query_type": "base_currency",
    "cached": true
  }
}
```

#### Get Specific Currency Pair

**Example:**
```bash
curl "https://currency-converter-worker.josephmarkus.workers.dev/api/rates?from=USD&to=EUR"
```

**Response:**
```json
{
  "data": {
    "base_currency": "USD",
    "target_currency": "EUR",
    "rate": 0.85,
    "date": "2025-11-09",
    "source_date": "2025-11-09",
    "created_at": "2025-11-09T09:15:00.000Z"
  },
  "metadata": {
    "date": "2025-11-09",
    "timestamp": "2025-11-09T19:30:00.000Z",
    "query_type": "single_pair",
    "cached": true
  }
}
```

#### Get Summary of All Rates

**Example:**
```bash
curl "https://currency-converter-worker.josephmarkus.workers.dev/api/rates"
```

**Response:**
```json
{
  "data": [
    {
      "base_currency": "USD",
      "rate_count": 29,
      "date": "2025-11-09"
    },
    {
      "base_currency": "EUR",
      "rate_count": 29,
      "date": "2025-11-09"
    }
    // ... more summaries
  ],
  "metadata": {
    "date": "2025-11-09",
    "timestamp": "2025-11-09T19:30:00.000Z",
    "query_type": "summary",
    "cached": true
  }
}
```

---

### Track User Conversion

Track which currency pairs users are converting (optional analytics).

**Endpoint:** `POST /api/user-conversion`

**Request Body:**
```json
{
  "from": "USD",
  "to": "EUR",
  "session": "optional-session-id"
}
```

**Example:**
```bash
curl -X POST https://currency-converter-worker.josephmarkus.workers.dev/api/user-conversion \
  -H "Content-Type: application/json" \
  -d '{"from":"USD","to":"EUR","session":"user-123"}'
```

**Response:**
```json
{
  "success": true,
  "message": "Conversion tracked"
}
```

---

## CORS Support

All endpoints support CORS with the following headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

## Caching

- `/api/rates` responses are cached for **1 hour**
- `/api/metadata` responses are cached for **5 minutes**
- `/api/status` responses are cached for **1 minute**
- `/api/health` responses are not cached

## Rate Limiting

Currently no rate limiting is enforced. The Cloudflare free tier supports:
- 100,000 requests per day
- Suitable for typical usage

## Error Responses

All errors return JSON with the following structure:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "timestamp": "2025-11-09T19:30:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (missing/invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (database disconnected)

## Testing

Use the health check to verify the API is working:

```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/health | jq
```

Expected output:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-09T19:30:00.000Z",
  "version": "1.0.0"
}
```

---

## Integration

### JavaScript/TypeScript

```typescript
const API_URL = 'https://currency-converter-worker.josephmarkus.workers.dev';

// Get rates for USD
const response = await fetch(`${API_URL}/api/rates?from=USD`);
const { data } = await response.json();
console.log(data);

// Get specific rate
const rateResponse = await fetch(`${API_URL}/api/rates?from=USD&to=EUR`);
const { data: rate } = await rateResponse.json();
console.log(rate.rate); // 0.85
```

### Using in the App

The app is already configured to use this API via `src/config.ts`:

```typescript
import { API_ENDPOINTS } from './config';

// Automatically uses VITE_API_URL from .env or the default URL
const response = await fetch(`${API_ENDPOINTS.rates}?from=USD`);
```

---

**See also:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [SETUP.md](./SETUP.md) - GitHub Actions and Cloudflare setup
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local testing guide
