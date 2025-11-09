/**
 * Initialize Cloudflare D1 Database Schema
 * Creates all necessary tables if they don't exist
 * Safe to run multiple times (uses CREATE TABLE IF NOT EXISTS)
 */

import fetch from "node-fetch";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLOUDFLARE_API = `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${process.env.CLOUDFLARE_DATABASE_ID}/query`;

async function initDatabase() {
  try {
    console.log("🔧 Initializing database schema...");

    // Read schema file
    const schemaPath = path.join(__dirname, "../cloudflare/schema.sql");
    console.log(`📄 Reading schema from: ${schemaPath}`);
    
    const schema = await fs.readFile(schemaPath, "utf-8");
    console.log(`📏 Schema file size: ${schema.length} bytes`);

    // Remove single-line comments
    let cleanedSchema = schema
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");

    // Remove multi-line comments
    cleanedSchema = cleanedSchema.replace(/\/\*[\s\S]*?\*\//g, "");

    // Split on semicolons and clean up
    const statements = cleanedSchema
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    console.log(`📋 Executing ${statements.length} SQL statements...`);
    
    // Count statement types
    const tables = statements.filter(s => s.includes('CREATE TABLE')).length;
    const indexes = statements.filter(s => s.includes('CREATE INDEX')).length;
    const inserts = statements.filter(s => s.includes('INSERT')).length;
    console.log(`   Tables: ${tables}, Indexes: ${indexes}, Inserts: ${inserts}`);

    let successCount = 0;
    let errorCount = 0;
    let tableErrors = 0;

    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        await executeSql(statement);
        successCount++;

        // Extract table/index name for logging
        const tableMatch = statement.match(
          /CREATE TABLE.*?(?:IF NOT EXISTS)?\s+(\w+)/i
        );
        const indexMatch = statement.match(
          /CREATE INDEX.*?(?:IF NOT EXISTS)?\s+(\w+)/i
        );
        const insertMatch = statement.match(/INSERT.*?INTO\s+(\w+)/i);

        if (tableMatch) {
          console.log(`  ✅ Table: ${tableMatch[1]}`);
        } else if (indexMatch) {
          console.log(`  ✅ Index: ${indexMatch[1]}`);
        } else if (insertMatch) {
          console.log(`  ✅ Insert: ${insertMatch[1]}`);
        } else {
          console.log(`  ✅ Statement ${i + 1}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ❌ Statement ${i + 1} failed:`, error.message);

        // Only log the first 200 chars of failed statement for debugging
        const preview =
          statement.length > 200
            ? statement.substring(0, 200) + "..."
            : statement;
        console.error(`     SQL: ${preview}`);

        // Track table creation errors
        if (statement.includes("CREATE TABLE")) {
          tableErrors++;
        }
      }
    }

    console.log(`\n✅ Database initialization complete!`);
    console.log(`   Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`   Errors: ${errorCount} statements`);
    }
    
    // Fail if any table creation failed
    if (tableErrors > 0) {
      console.error(`\n❌ CRITICAL: ${tableErrors} table(s) failed to create!`);
      console.error('Database is not properly initialized. Exiting.');
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Failed to initialize database:", error);
    process.exit(1);
  }
}

async function executeSql(sql) {
  const headers = {
    Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
    "Content-Type": "application/json",
  };

  const response = await fetch(CLOUDFLARE_API, {
    method: "POST",
    headers,
    body: JSON.stringify({ sql }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API error: ${response.status} ${errorText}`);
  }

  return response;
}

function validateEnvironment() {
  const required = [
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_ACCOUNT_ID",
    "CLOUDFLARE_DATABASE_ID",
  ];
  const missing = required.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.error(
      "❌ Missing required environment variables:",
      missing.join(", ")
    );
    process.exit(1);
  }
}

// Run the script
validateEnvironment();
initDatabase();
