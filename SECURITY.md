# Security Setup Guide

This guide explains how to secure your Cloudflare Worker API with authentication.

## 🔐 API Key Authentication

The worker is configured to require an API key for all endpoints except `/api/health`.

### Step 1: Generate API Key

```bash
# Generate a secure random API key
openssl rand -hex 32
```

This will output something like: `a1b2c3d4e5f6...` (64 characters)

**Save this key securely!** You'll need it in multiple places.

### Step 2: Add API Key to Worker

```bash
cd cloudflare
npx wrangler secret put API_KEY
```

When prompted, paste the API key you generated.

### Step 3: Add to GitHub Secrets

For your GitHub Action to access the worker:

1. Go to your GitHub repo
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `WORKER_API_KEY`
5. Value: Paste your API key
6. Click **Add secret**

### Step 4: Add to Local Environment

Create/update your `.env` file:

```bash
VITE_API_URL=https://currency-converter-worker.josephmarkus.workers.dev
VITE_API_KEY=your_api_key_here
```

**Important:** Add `.env` to `.gitignore` (it should already be there)

### Step 5: Redeploy Worker

```bash
cd cloudflare
npx wrangler deploy
```

### Step 6: Test Authentication

**Without API Key (should fail):**

```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/metadata
```

Expected response:

```json
{
  "error": "Unauthorized",
  "message": "Valid API key required"
}
```

**With API Key (should succeed):**

```bash
curl -H "X-API-Key: your_api_key_here" \
  https://currency-converter-worker.josephmarkus.workers.dev/api/metadata
```

Expected response:

```json
{
  "last_fetch": "2025-11-09",
  "total_currencies": 30,
  ...
}
```

**Health check (no auth required):**

```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/health
```

Should still work without auth.

## 🌐 CORS Configuration

The worker allows requests from any origin (`*`). To restrict to specific domains:

### Update worker.js

```javascript
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://yourdomain.com", // Your deployed site
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
};
```

For multiple domains:

```javascript
function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = [
    "https://yourdomain.com",
    "https://staging.yourdomain.com",
    "http://localhost:5173", // Vite dev server
  ];

  return {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}
```

## 🔒 Additional Security Options

### Option 1: Rate Limiting

Add rate limiting using Cloudflare's built-in tools:

1. Go to Cloudflare Dashboard → **Security** → **WAF**
2. Create a rate limiting rule
3. Set limits (e.g., 100 requests per minute per IP)

### Option 2: Cloudflare Access

For enterprise-level security:

1. Go to **Zero Trust** → **Access** → **Applications**
2. Add your worker domain
3. Configure authentication (email, OAuth, etc.)
4. Set access policies

### Option 3: IP Allowlist

Restrict to specific IPs (e.g., GitHub Actions IPs):

```javascript
const ALLOWED_IPS = [
  "140.82.112.0/20", // GitHub Actions IP range
  "your.home.ip.address", // Your IP
];

function isAllowedIP(request) {
  const ip = request.headers.get("CF-Connecting-IP");
  return ALLOWED_IPS.some((range) => ipInRange(ip, range));
}
```

## 🧪 Testing Authenticated Requests

### From Your App

The app automatically includes the API key from `.env`:

```typescript
// In src/config.ts
export const getHeaders = () => ({
  "Content-Type": "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

// Used in currency-service.ts
const response = await fetch(url, {
  headers: getHeaders(),
});
```

### From GitHub Action

Update your scripts to include the API key (future enhancement):

```javascript
// In scripts/fetch-rates.js
const headers = {
  Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
  "Content-Type": "application/json",
  "X-API-Key": process.env.WORKER_API_KEY, // Add this
};
```

## 📊 Monitoring Access

Check worker logs for unauthorized access attempts:

```bash
npx wrangler tail
```

Or view logs in Cloudflare Dashboard → **Workers & Pages** → Your worker → **Logs**

## 🚨 Security Checklist

- [ ] API key generated (secure random string)
- [ ] API key added to worker secrets
- [ ] API key added to GitHub Secrets as `WORKER_API_KEY`
- [ ] API key added to local `.env` as `VITE_API_KEY`
- [ ] `.env` is in `.gitignore`
- [ ] Worker redeployed with authentication
- [ ] Tested unauthenticated requests (should fail)
- [ ] Tested authenticated requests (should succeed)
- [ ] CORS configured appropriately
- [ ] Rate limiting considered (optional)
- [ ] Worker logs monitored

## 🔄 Rotating API Keys

To rotate your API key:

1. Generate a new key: `openssl rand -hex 32`
2. Update worker secret: `npx wrangler secret put API_KEY`
3. Update GitHub secret: `WORKER_API_KEY`
4. Update local `.env`: `VITE_API_KEY`
5. Redeploy worker: `npx wrangler deploy`
6. Update deployed frontend environment variables

## 📚 Additional Resources

- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [Secrets and Environment Variables](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/)

---

**Next:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.
