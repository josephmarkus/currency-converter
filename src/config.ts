/**
 * Application Configuration
 */

// API Configuration
export const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://currency-converter-worker.josephmarkus.workers.dev";
export const API_KEY = import.meta.env.VITE_API_KEY || "";

// API Endpoints
export const API_ENDPOINTS = {
  rates: `${API_URL}/api/rates`,
  metadata: `${API_URL}/api/metadata`,
  status: `${API_URL}/api/status`,
  health: `${API_URL}/api/health`,
  userConversion: `${API_URL}/api/user-conversion`,
} as const;

// HTTP Headers
export const getHeaders = () => ({
  "Content-Type": "application/json",
  ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
});

// Cache Configuration
export const CACHE_KEY = "currency-rates";
export const METADATA_KEY = "fetch-metadata";

// Fallback API (if worker is unavailable)
export const FRANKFURTER_API = "https://api.frankfurter.app";
