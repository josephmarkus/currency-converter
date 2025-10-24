-- Cloudflare D1 Database Schema for Currency Converter
-- Run these commands to set up your database tables

-- Main exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  base_currency TEXT NOT NULL,
  target_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  date TEXT NOT NULL, -- ISO 8601 format (YYYY-MM-DD)
  source_date TEXT, -- Date from the API source
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(base_currency, target_currency, date)
);

-- Metadata table for tracking updates
CREATE TABLE IF NOT EXISTS fetch_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  last_fetch_date TEXT NOT NULL, -- ISO 8601 format
  total_currencies INTEGER NOT NULL,
  total_records INTEGER DEFAULT 0,
  fetch_source TEXT DEFAULT 'frankfurter',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User preferences for offline storage (frontend use)
CREATE TABLE IF NOT EXISTS user_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  access_count INTEGER DEFAULT 1,
  user_session TEXT, -- For anonymous session tracking
  UNIQUE(from_currency, to_currency, user_session)
);

-- Cache status table for frontend synchronization
CREATE TABLE IF NOT EXISTS cache_status (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Quick status table for health checks
CREATE TABLE IF NOT EXISTS quick_status (
  endpoint TEXT PRIMARY KEY,
  last_updated DATETIME NOT NULL,
  status TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup 
ON exchange_rates(base_currency, target_currency, date DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_date 
ON exchange_rates(date DESC);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_base 
ON exchange_rates(base_currency);

CREATE INDEX IF NOT EXISTS idx_user_conversions_lookup 
ON user_conversions(from_currency, to_currency);

CREATE INDEX IF NOT EXISTS idx_fetch_metadata_date 
ON fetch_metadata(last_fetch_date DESC);

CREATE INDEX IF NOT EXISTS idx_cache_status_key 
ON cache_status(key);

-- Insert initial cache status
INSERT OR IGNORE INTO cache_status (key, value) 
VALUES ('last_data_update', '1970-01-01T00:00:00.000Z');

INSERT OR IGNORE INTO quick_status (endpoint, last_updated, status) 
VALUES ('exchange_rates', '1970-01-01T00:00:00.000Z', 'initializing');