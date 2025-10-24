/**
 * Development configuration for the currency converter
 * Controls whether to use mock data or real API calls
 */

export interface DevConfig {
  useMockData: boolean;
  mockNetworkCondition: "online" | "offline" | "slow";
  enableDebugLogs: boolean;
  autoRefreshInterval: number; // seconds
  simulateSlowNetwork: boolean;
}

// Default development configuration
export const DEFAULT_DEV_CONFIG: DevConfig = {
  useMockData: false, // Set to true for offline development
  mockNetworkCondition: "online",
  enableDebugLogs: true,
  autoRefreshInterval: 30,
  simulateSlowNetwork: false,
};

// Get dev config from localStorage or use defaults
export function getDevConfig(): DevConfig {
  try {
    const stored = localStorage.getItem("currency-converter-dev-config");
    if (stored) {
      return { ...DEFAULT_DEV_CONFIG, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.warn("Failed to load dev config from localStorage:", error);
  }

  return DEFAULT_DEV_CONFIG;
}

// Save dev config to localStorage
export function saveDevConfig(config: Partial<DevConfig>): void {
  try {
    const currentConfig = getDevConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem(
      "currency-converter-dev-config",
      JSON.stringify(newConfig)
    );
    console.log("Dev config saved:", newConfig);
  } catch (error) {
    console.error("Failed to save dev config:", error);
  }
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  // Multiple ways to detect development mode
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.includes("localhost"));

  const isDevPort =
    typeof window !== "undefined" &&
    (window.location.port === "3000" ||
      window.location.port === "3001" ||
      window.location.port === "5173"); // Vite default

  const isDev = isLocalhost || isDevPort;

  console.log("Development check:", {
    hostname:
      typeof window !== "undefined" ? window.location.hostname : "undefined",
    port: typeof window !== "undefined" ? window.location.port : "undefined",
    isLocalhost,
    isDevPort,
    isDev,
  });

  return isDev;
}

// Debug logging helper
export function debugLog(message: string, ...args: any[]): void {
  const config = getDevConfig();
  if (config.enableDebugLogs && isDevelopment()) {
    console.log(`[DEV] ${message}`, ...args);
  }
}

// Development utilities
export const DevUtils = {
  enableMockData: () => saveDevConfig({ useMockData: true }),
  disableMockData: () => saveDevConfig({ useMockData: false }),
  setNetworkCondition: (condition: "online" | "offline" | "slow") =>
    saveDevConfig({ mockNetworkCondition: condition }),
  enableDebugLogs: () => saveDevConfig({ enableDebugLogs: true }),
  disableDebugLogs: () => saveDevConfig({ enableDebugLogs: false }),
  resetConfig: () => {
    localStorage.removeItem("currency-converter-dev-config");
    console.log("Dev config reset to defaults");
  },
};

// Make DevUtils available globally in development
if (isDevelopment()) {
  (window as any).CurrencyDevUtils = DevUtils;
  console.log("💡 Development utilities available as window.CurrencyDevUtils");
  console.log("Available commands:");
  console.log(
    "  CurrencyDevUtils.enableMockData() - Use mock data instead of API"
  );
  console.log("  CurrencyDevUtils.disableMockData() - Use real API");
  console.log(
    '  CurrencyDevUtils.setNetworkCondition("offline") - Simulate offline'
  );
  console.log("  CurrencyDevUtils.enableDebugLogs() - Enable debug logging");
  console.log("  CurrencyDevUtils.resetConfig() - Reset to defaults");
}
