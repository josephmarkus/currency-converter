/**
 * Fetch exchange rates from Frankfurter API and upload to Cloudflare D1
 * This script runs daily via GitHub Actions
 */

import fetch from 'node-fetch';

// Configuration
const FRANKFURTER_API = 'https://api.frankfurter.app';
const CLOUDFLARE_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`;

// Major currencies supported by Frankfurter API
const CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'KRW', 'INR',
  'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN',
  'TRY', 'BRL', 'MXN', 'ZAR', 'THB', 'MYR', 'IDR', 'PHP', 'NZD', 'ILS'
];

// Rate limiting configuration
const RATE_LIMIT_DELAY = 200; // ms between requests
const BATCH_SIZE = 100; // Records per database batch
const MAX_RETRIES = 3;

async function main() {
  try {
    console.log('🚀 Starting exchange rate fetch process...');
    
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 Fetching rates for: ${today}`);

    // Check if we should skip (data already exists and not forced)
    if (!process.env.FORCE_UPDATE || process.env.FORCE_UPDATE === 'false') {
      const existingData = await checkExistingData(today);
      if (existingData) {
        console.log('✅ Data already exists for today. Skipping fetch.');
        return;
      }
    }

    // Fetch all exchange rates
    const allRates = await fetchAllExchangeRates(today);
    console.log(`💱 Fetched ${allRates.length} exchange rate records`);

    // Upload to Cloudflare D1
    await uploadToCloudflare(allRates, today);
    console.log('✅ Successfully uploaded all exchange rates to Cloudflare D1');

    // Log summary
    const summary = generateSummary(allRates, today);
    console.log('\n📊 Fetch Summary:');
    console.log(summary);

  } catch (error) {
    console.error('❌ Error in main process:', error);
    process.exit(1);
  }
}

async function checkExistingData(date) {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM exchange_rates 
      WHERE date = ? 
      LIMIT 1
    `;

    const response = await makeCloudflareRequest(query, [date]);
    const result = await response.json();
    
    return result.result?.[0]?.results?.[0]?.count > 0;
  } catch (error) {
    console.log('⚠️  Could not check existing data, proceeding with fetch');
    return false;
  }
}

async function fetchAllExchangeRates(date) {
  const allRates = [];
  let requestCount = 0;

  console.log(`🌍 Fetching rates for ${CURRENCIES.length} base currencies...`);

  for (const baseCurrency of CURRENCIES) {
    try {
      console.log(`  📈 Fetching ${baseCurrency}... (${++requestCount}/${CURRENCIES.length})`);
      
      const rates = await fetchCurrencyRates(baseCurrency, date);
      allRates.push(...rates);
      
      // Rate limiting - be respectful to the API
      await sleep(RATE_LIMIT_DELAY);
      
    } catch (error) {
      console.error(`❌ Failed to fetch rates for ${baseCurrency}:`, error.message);
      // Continue with other currencies
    }
  }

  return allRates;
}

async function fetchCurrencyRates(baseCurrency, date, retryCount = 0) {
  try {
    const url = `${FRANKFURTER_API}/latest?from=${baseCurrency}`;
    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.rates) {
      throw new Error('No rates data in response');
    }

    const rates = [];
    for (const [targetCurrency, rate] of Object.entries(data.rates)) {
      rates.push({
        base_currency: baseCurrency,
        target_currency: targetCurrency,
        rate: parseFloat(rate),
        date: date,
        source_date: data.date || date
      });
    }

    return rates;

  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log(`  🔄 Retrying ${baseCurrency} (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await sleep(1000 * (retryCount + 1)); // Exponential backoff
      return fetchCurrencyRates(baseCurrency, date, retryCount + 1);
    }
    throw error;
  }
}

async function uploadToCloudflare(ratesData, date) {
  console.log('☁️  Uploading to Cloudflare D1...');

  // Delete existing data for today (in case of re-run)
  await deleteExistingData(date);

  // Insert new data in batches
  const batches = [];
  for (let i = 0; i < ratesData.length; i += BATCH_SIZE) {
    batches.push(ratesData.slice(i, i + BATCH_SIZE));
  }

  console.log(`📦 Uploading ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  📤 Uploading batch ${i + 1}/${batches.length} (${batch.length} records)...`);
    
    await uploadBatch(batch);
    
    // Small delay between batches
    await sleep(100);
  }

  // Update metadata
  await updateMetadata(date, ratesData.length);
}

async function deleteExistingData(date) {
  const query = `DELETE FROM exchange_rates WHERE date = ?`;
  try {
    await makeCloudflareRequest(query, [date]);
    console.log(`🗑️  Cleared existing data for ${date}`);
  } catch (error) {
    console.log('⚠️  Could not clear existing data (might not exist)');
  }
}

async function uploadBatch(batch) {
  const values = batch.map(rate => 
    `('${rate.base_currency}', '${rate.target_currency}', ${rate.rate}, '${rate.date}', '${rate.source_date}')`
  ).join(', ');

  const query = `
    INSERT INTO exchange_rates (base_currency, target_currency, rate, date, source_date) 
    VALUES ${values}
  `;

  await makeCloudflareRequest(query);
}

async function updateMetadata(date, totalRecords) {
  const query = `
    INSERT INTO fetch_metadata (last_fetch_date, total_currencies, total_records, fetch_source) 
    VALUES (?, ?, ?, 'frankfurter-github-action')
  `;

  await makeCloudflareRequest(query, [date, CURRENCIES.length, totalRecords]);
  console.log('📝 Updated metadata');
}

async function makeCloudflareRequest(sql, params = []) {
  const headers = {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const body = { sql };
  if (params.length > 0) {
    body.params = params;
  }

  const response = await fetch(CLOUDFLARE_API, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
  }

  return response;
}

function generateSummary(rates, date) {
  const currencies = new Set();
  const baseCurrencies = new Set();
  
  rates.forEach(rate => {
    currencies.add(rate.base_currency);
    currencies.add(rate.target_currency);
    baseCurrencies.add(rate.base_currency);
  });

  return `
📊 Exchange Rate Fetch Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 Date: ${date}
🌍 Base currencies: ${baseCurrencies.size}
💱 Total currency pairs: ${rates.length}
🔗 Unique currencies: ${currencies.size}
⏰ Completed: ${new Date().toISOString()}
  `;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Validate environment variables
function validateEnvironment() {
  const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_DATABASE_ID'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('Please set these in your GitHub repository secrets.');
    process.exit(1);
  }
}

// Run the script
validateEnvironment();
main().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

export { main, fetchAllExchangeRates, uploadToCloudflare };