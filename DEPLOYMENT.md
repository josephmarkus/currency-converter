# Deployment Guide

This guide shows you how to deploy your Cloudflare Worker and connect your app to use the D1 database.

## 🚀 Deploy Cloudflare Worker

### 1. Update wrangler.toml with your Database ID

Get your database ID:
```bash
npx wrangler d1 list
```

Edit `cloudflare/wrangler.toml` and replace `your-database-id-here` with your actual database ID.

### 2. Deploy the Worker

```bash
cd cloudflare
npx wrangler deploy
```

This will deploy your worker and give you a URL like:
```
https://currency-converter-worker.YOUR-SUBDOMAIN.workers.dev
```

**Save this URL!** You'll need it for your frontend.

### 3. Test the Worker

**Health Check:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-11-09T...",
  "version": "1.0.0"
}
```

**Get Metadata:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/metadata
```

Expected response:
```json
{
  "last_fetch": "2025-11-09",
  "total_currencies": 30,
  "total_records": 900,
  "fetch_source": "frankfurter-github-action",
  "last_cache_update": "2025-11-09T...",
  "server_time": "2025-11-09T...",
  "database_status": "online"
}
```

**Get Rates for USD:**
```bash
curl "https://currency-converter-worker.josephmarkus.workers.dev/api/rates?from=USD"
```

**Get Specific Rate (USD to EUR):**
```bash
curl "https://currency-converter-worker.josephmarkus.workers.dev/api/rates?from=USD&to=EUR"
```

**Check Status:**
```bash
curl https://currency-converter-worker.josephmarkus.workers.dev/api/status
```

## 🔗 Connect Your App to the Worker

### Create Environment File

Create a `.env` file in your project root:

```bash
VITE_API_URL=https://currency-converter-worker.josephmarkus.workers.dev
```

Add `.env` to your `.gitignore` if not already there.

### The App is Already Configured!

The app is now configured to:
1. **Primary:** Use your Cloudflare Worker API (from `VITE_API_URL` or default in `src/config.ts`)
2. **Fallback:** Use Frankfurter API if worker is unavailable
3. **Cache:** Use localStorage for offline support

No additional changes needed - just set the `VITE_API_URL` environment variable!

## 🧪 Test Locally

### 1. Test Worker Locally

```bash
cd cloudflare
npx wrangler dev
```

This starts a local server at `http://localhost:8787`

### 2. Update .env for local testing

```bash
VITE_API_URL=http://localhost:8787
```

### 3. Run your app

```bash
npm run dev
```

Your app should now fetch data from your local worker, which reads from your D1 database!

## 📊 Verify Everything Works

### Check the Flow

1. **GitHub Action** runs daily → Fetches rates → Stores in **D1 Database**
2. **Cloudflare Worker** reads from **D1 Database** → Serves via API
3. **Your App** calls **Worker API** → Gets rates → Displays to user

### Test Each Step

**Step 1: Verify data in D1**
```bash
npx wrangler d1 execute currency-converter-db --remote --command "SELECT COUNT(*) FROM exchange_rates"
```
Should return ~900 records.

**Step 2: Verify worker serves data**
```bash
curl "https://your-worker-url/api/rates?from=USD" | jq
```
Should return exchange rates.

**Step 3: Verify app uses worker**
1. Open your app in browser
2. Open DevTools → Network tab
3. Make a conversion
4. Check that requests go to your worker URL (not frankfurter.app)

## 🎯 Production Checklist

- [ ] Database has data (check with wrangler)
- [ ] Worker deployed successfully
- [ ] Worker health check returns healthy
- [ ] Worker API returns rates
- [ ] App environment variable set to worker URL
- [ ] App successfully fetches and displays rates
- [ ] App works offline with cached data
- [ ] GitHub Action scheduled to run daily

## 🔄 Update Workflow

When you need to update the worker:

```bash
cd cloudflare
npx wrangler deploy
```

The worker will automatically use the latest data from D1 (no restart needed for data updates).

## 🌐 Custom Domain (Optional)

To use a custom domain like `api.yourdomain.com`:

1. Go to Cloudflare Dashboard → Workers & Pages
2. Click your worker
3. Go to **Settings** → **Triggers** → **Custom Domains**
4. Add your domain
5. Update `VITE_API_URL` to use your custom domain

---

**Next:** See [SETUP.md](./SETUP.md) for GitHub Actions setup and [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for local testing.
