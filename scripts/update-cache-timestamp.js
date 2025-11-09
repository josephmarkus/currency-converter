/**
 * Update cache timestamp for frontend applications
 * This helps the frontend know when to show the "new data available" indicator
 */

import fetch from 'node-fetch';

const CLOUDFLARE_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`;

async function updateCacheTimestamp() {
  try {
    console.log('🕒 Updating cache timestamp...');
    
    const timestamp = new Date().toISOString();
    
    // Update a special table that the frontend can check
    const query = `
      INSERT OR REPLACE INTO cache_status (key, value, updated_at) 
      VALUES ('last_data_update', ?, ?)
    `;
    
    const headers = {
      'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    };

    const response = await fetch(CLOUDFLARE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sql: query,
        params: [timestamp, timestamp]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    console.log(`✅ Cache timestamp updated: ${timestamp}`);
    
    // Also create/update a simple endpoint file for quick checks
    const quickCheckQuery = `
      INSERT OR REPLACE INTO quick_status (endpoint, last_updated, status) 
      VALUES ('exchange_rates', ?, 'updated')
    `;
    
    await fetch(CLOUDFLARE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sql: quickCheckQuery,
        params: [timestamp]
      })
    });

    console.log('✅ Quick status updated');

  } catch (error) {
    console.error('❌ Failed to update cache timestamp:', error);
    // Don't fail the entire workflow for this
    process.exit(0);
  }
}

// Create the cache status table if it doesn't exist
async function ensureCacheStatusTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS cache_status (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  const createQuickStatusQuery = `
    CREATE TABLE IF NOT EXISTS quick_status (
      endpoint TEXT PRIMARY KEY,
      last_updated DATETIME NOT NULL,
      status TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const headers = {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  try {
    await fetch(CLOUDFLARE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: createTableQuery })
    });

    await fetch(CLOUDFLARE_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sql: createQuickStatusQuery })
    });

    console.log('📋 Cache status tables ensured');
  } catch (error) {
    console.error('⚠️  Could not create cache status tables:', error);
  }
}

async function main() {
  await ensureCacheStatusTable();
  await updateCacheTimestamp();
}

main();