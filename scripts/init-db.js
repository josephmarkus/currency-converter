/**
 * Initialize Cloudflare D1 Database Schema
 * Creates all necessary tables if they don't exist
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS)
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLOUDFLARE_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`;

async function initDatabase() {
  try {
    console.log('🔧 Initializing database schema...');

    // Read schema file
    const schemaPath = path.join(__dirname, '../cloudflare/schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');

    // Split into individual statements (simple split on semicolons)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await executeSql(statement);
        successCount++;
        
        // Extract table/index name for logging
        const match = statement.match(/CREATE (?:TABLE|INDEX).*?(?:IF NOT EXISTS)?\s+(\w+)/i);
        if (match) {
          console.log(`  ✅ ${match[1]}`);
        }
      } catch (error) {
        // Skip errors for statements that might already be executed
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          skipCount++;
        } else {
          console.error(`  ⚠️  Error executing statement: ${error.message}`);
          console.error(`     Statement: ${statement.substring(0, 100)}...`);
        }
      }
    }

    console.log(`\n✅ Database initialization complete!`);
    console.log(`   Executed: ${successCount} statements`);
    if (skipCount > 0) {
      console.log(`   Skipped: ${skipCount} (already exist)`);
    }

  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

async function executeSql(sql) {
  const headers = {
    'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json'
  };

  const response = await fetch(CLOUDFLARE_API, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
  }

  return response;
}

function validateEnvironment() {
  const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_DATABASE_ID'];
  const missing = required.filter(env => !process.env[env]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

// Run the script
validateEnvironment();
initDatabase();
