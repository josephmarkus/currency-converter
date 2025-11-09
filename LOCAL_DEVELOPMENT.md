# Local Development Guide

This guide explains how to develop and test the currency converter locally before deploying to production.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Wrangler

```bash
# Install globally (optional)
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### 3. Initialize Local Database

```bash
# Create local D1 database with schema
npm run db:local:init
```

This creates a local SQLite database at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/` that mirrors your production database.

### 4. Verify Setup

```bash
# Check that tables were created
npm run db:local:query "SELECT name FROM sqlite_master WHERE type='table'"
```

You should see: `exchange_rates`, `fetch_metadata`, `user_conversions`, `cache_status`, `quick_status`

## 💾 Working with Local Database

### Query Local Database

```bash
# Count records
npm run db:local:query "SELECT COUNT(*) FROM exchange_rates"

# View recent rates
npm run db:local:query "SELECT * FROM exchange_rates LIMIT 10"

# Check metadata
npm run db:local:query "SELECT * FROM fetch_metadata ORDER BY created_at DESC LIMIT 1"
```

### Reset Local Database

```bash
# Re-initialize (drops and recreates all tables)
npm run db:local:init
```

### View Database Schema

```bash
npm run db:local:query "SELECT sql FROM sqlite_master WHERE type='table'"
```

## 🧪 Testing Scripts Locally

### Note on Current Limitation

The current scripts (`fetch-rates.js`, `init-db.js`, etc.) use the Cloudflare D1 HTTP API directly, which requires:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_DATABASE_ID`

These scripts will **always target the remote database**, even when run locally.

### Test Against Remote Database

Create a `.env.local` file (never commit this!):

```bash
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
FORCE_UPDATE=false
```

Run scripts:

```bash
# Initialize remote database
npm run init-db

# Fetch rates (remote)
npm run fetch-rates

# Force update
npm run test-fetch
```

### Test Local Database Commands

For truly local testing, use wrangler commands:

```bash
# Manual insert test
npx wrangler d1 execute currency-converter-db --local --command \
  "INSERT INTO exchange_rates (base_currency, target_currency, rate, date, source_date) \
   VALUES ('USD', 'EUR', 0.85, '2025-11-09', '2025-11-09')"

# Verify insert
npm run db:local:query "SELECT * FROM exchange_rates"

# Clear test data
npm run db:local:query "DELETE FROM exchange_rates"
```

## 📊 Available NPM Scripts

### Database Commands

| Command                        | Description                           |
| ------------------------------ | ------------------------------------- |
| `npm run db:local:init`        | Initialize local database with schema |
| `npm run db:local:query "SQL"` | Run SQL query on local database       |
| `npm run db:remote:init`       | Initialize remote production database |

### Application Scripts

| Command               | Description                           |
| --------------------- | ------------------------------------- |
| `npm run dev`         | Start Vite dev server                 |
| `npm run build`       | Build for production                  |
| `npm run preview`     | Preview production build              |
| `npm run init-db`     | Initialize remote database via API    |
| `npm run fetch-rates` | Fetch rates to remote database        |
| `npm run test-fetch`  | Force fetch rates (bypass date check) |

## 🔄 Local Development Workflow

### Typical Development Flow

1. **Start with local database:**

   ```bash
   npm run db:local:init
   ```

2. **Develop and test queries locally:**

   ```bash
   npm run db:local:query "SELECT COUNT(*) FROM exchange_rates"
   ```

3. **Test application frontend:**

   ```bash
   npm run dev
   ```

4. **When ready, test against remote:**

   ```bash
   # Create .env.local with credentials first
   npm run init-db
   npm run test-fetch
   ```

5. **Verify remote database:**
   ```bash
   npx wrangler d1 execute currency-converter-db --remote --command "SELECT COUNT(*) FROM exchange_rates"
   ```

## 🎯 Testing Before Deployment

### Pre-deployment Checklist

- [ ] Local database schema is correct
- [ ] Test queries work locally
- [ ] Remote database initialized successfully
- [ ] Test fetch runs without errors
- [ ] GitHub Actions secrets are configured
- [ ] Workflow file is up to date

### Test GitHub Action Locally

You can't run GitHub Actions locally, but you can test the scripts:

```bash
# 1. Test init-db script
CLOUDFLARE_API_TOKEN=xxx \
CLOUDFLARE_ACCOUNT_ID=xxx \
CLOUDFLARE_DATABASE_ID=xxx \
node scripts/init-db.js

# 2. Test fetch script
CLOUDFLARE_API_TOKEN=xxx \
CLOUDFLARE_ACCOUNT_ID=xxx \
CLOUDFLARE_DATABASE_ID=xxx \
FORCE_UPDATE=true \
node scripts/fetch-rates.js

# 3. Test cache update
CLOUDFLARE_API_TOKEN=xxx \
CLOUDFLARE_ACCOUNT_ID=xxx \
CLOUDFLARE_DATABASE_ID=xxx \
node scripts/update-cache-timestamp.js

# 4. Test summary generation
node scripts/generate-summary.js
```

## 🐛 Debugging Tips

### Database Not Found

```bash
# List all local databases
ls -la .wrangler/state/v3/d1/

# Re-initialize
npm run db:local:init
```

### Query Syntax Errors

```bash
# Test query in SQLite-compatible format
npm run db:local:query "SELECT sqlite_version()"
```

### Check Wrangler Configuration

```bash
# View account info
npx wrangler whoami --account

# List remote databases
npx wrangler d1 list
```

## 🔐 Environment Variables

### For Local Testing

Create `.env.local` (add to `.gitignore`):

```bash
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_DATABASE_ID=your_database_id
FORCE_UPDATE=false
```

Load in scripts:

```bash
# Using dotenv (if installed)
node -r dotenv/config scripts/fetch-rates.js dotenv_config_path=.env.local

# Or export manually
export $(cat .env.local | xargs) && node scripts/fetch-rates.js
```

## 📚 Additional Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [Local D1 Development](https://developers.cloudflare.com/d1/build-with-d1/local-development/)

---

**Next Steps:** See [SETUP.md](./SETUP.md) for production deployment instructions.
