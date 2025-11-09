# GitHub Actions & Cloudflare Setup Guide

This guide explains how to set up the automated daily exchange rate fetching using GitHub Actions and Cloudflare D1.

## 🔧 Prerequisites

1. **GitHub Repository** - Your currency converter code
2. **Cloudflare Account** - Free tier is sufficient
3. **Cloudflare D1 Database** - Serverless SQL database
4. **Cloudflare Worker** (optional) - For API endpoints

## 📋 Step 1: Create Cloudflare D1 Database

1. Log into your Cloudflare Dashboard
2. Go to **D1 SQL Database** in the sidebar
3. Click **Create Database**
4. Name it: `currency-converter-db`
5. Click **Create**

### Initialize the Database Schema

1. In your D1 database dashboard, click **Console**
2. Copy and paste the SQL from `cloudflare/schema.sql`
3. Click **Execute** to create all tables

## 🔑 Step 2: Get Cloudflare Credentials

You'll need these values for GitHub Secrets:

### Cloudflare API Token

1. Go to **My Profile** → **API Tokens**
2. Click **Create Token**
3. Use the **Custom Token** template
4. Configure:
   - **Permissions**:
     - `Account` - `Cloudflare D1:Edit`
     - `Zone` - `Zone:Read` (if deploying worker)
   - **Account Resources**: Include your account
   - **Zone Resources**: Include your domain (if applicable)
5. Click **Continue to Summary** → **Create Token**
6. Copy the token (save it securely!)

### Account ID

1. Run `npx wrangler whoami --account` in your terminal, or
2. In Cloudflare Dashboard, look at the sidebar and copy your **Account ID** (right sidebar)

### Database ID

1. Go to your D1 database
2. Copy the **Database ID** from the database overview

## 🚀 Step 3: Configure GitHub Secrets

In your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name              | Value            | Description                  |
| ------------------------ | ---------------- | ---------------------------- |
| `CLOUDFLARE_API_TOKEN`   | Your API token   | For accessing Cloudflare API |
| `CLOUDFLARE_ACCOUNT_ID`  | Your account ID  | Your Cloudflare account      |
| `CLOUDFLARE_DATABASE_ID` | Your database ID | Your D1 database             |

## 📅 Step 4: Test the Workflow

### Manual Test

1. Go to **Actions** tab in your GitHub repo
2. Click **Fetch Daily Exchange Rates**
3. Click **Run workflow**
4. Check the logs to ensure it works

### Verify Database

1. Go to your D1 database console
2. Run: `SELECT COUNT(*) FROM exchange_rates;`
3. You should see exchange rate records

## 🌐 Step 5: Deploy Cloudflare Worker (Optional)

If you want to serve the data via API:

### Install Wrangler

```bash
npm install -g wrangler
```

### Configure Wrangler

```bash
cd cloudflare/
wrangler login
```

### Update wrangler.toml

1. Edit `cloudflare/wrangler.toml`
2. Replace `your-database-id-here` with your actual database ID

### Deploy

```bash
wrangler deploy
```

## 🔄 How It Works

### Daily Schedule

- **Time**: 9:00 AM UTC daily
- **Trigger**: GitHub Actions cron job
- **Duration**: ~2-3 minutes
- **Rate Limit**: 200ms between API calls (respectful to Frankfurter)

### Data Flow

1. **GitHub Action** triggers at 9 AM UTC
2. **fetch-rates.js** downloads rates from Frankfurter API
3. **Data uploaded** to Cloudflare D1 in batches
4. **Cache timestamp** updated for frontend
5. **Summary generated** for monitoring

### Error Handling

- **Retries**: Up to 3 attempts per currency
- **Graceful degradation**: Continues with other currencies if one fails
- **Notifications**: Slack webhook on complete failure
- **Logs**: Detailed logs in GitHub Actions

## 📊 Monitoring

### GitHub Actions

- Check **Actions** tab for workflow status
- Review logs for any failures
- Monitor run duration and success rate

### Database Health

Query your D1 database:

```sql
-- Check latest data
SELECT date, COUNT(*) as records
FROM exchange_rates
GROUP BY date
ORDER BY date DESC
LIMIT 5;

-- Check metadata
SELECT * FROM fetch_metadata
ORDER BY created_at DESC
LIMIT 1;
```

### Frontend Integration

Your app will automatically:

- Show last fetch time
- Display online/offline status
- Offer manual refresh when new data available
- Work offline with cached data

## 🛠️ Troubleshooting

### Common Issues

**1. "Cannot find module 'node-fetch'"**

```bash
npm install node-fetch
```

**2. "Cloudflare API error: 401"**

- Check your API token has correct permissions
- Verify token isn't expired

**3. "Database not found"**

- Verify `CLOUDFLARE_DATABASE_ID` is correct
- Check database exists in your account

**4. "No data in frontend"**

- Check service worker is registered
- Verify API endpoints in worker
- Check browser console for errors

### Debug Commands

**Test API locally:**

```bash
node scripts/fetch-rates.js
```

**Check database:**

```bash
wrangler d1 execute currency-converter-db --command "SELECT COUNT(*) FROM exchange_rates"
```

**Test worker:**

```bash
curl https://your-worker.your-subdomain.workers.dev/api/health
```

## 🔒 Security Notes

- **API tokens**: Never commit to code, use GitHub Secrets only
- **Rate limiting**: Respect API limits (200ms delays implemented)
- **Error handling**: Graceful failures prevent data corruption
- **CORS**: Worker properly configured for frontend access

## 📈 Scaling

This setup can handle:

- **37 currencies** → ~1,300 exchange rate pairs
- **Daily updates** → ~500K records per year
- **Global access** → Cloudflare edge network
- **High availability** → Automatic failover and caching

## 💰 Costs

**Cloudflare Free Tier:**

- D1: 100K reads/day, 1K writes/day (more than enough)
- Workers: 100K requests/day
- **Total cost**: $0/month for typical usage

**GitHub Actions:**

- Free tier: 2,000 minutes/month
- This workflow: ~3 minutes/day = 90 minutes/month
- **Total cost**: $0/month

---

🎉 **You're all set!** Your currency converter will now automatically fetch fresh exchange rates daily and work offline with cached data.
