/**
 * Service factory that returns either real or mock currency service
 * based on development configuration
 */

import { CurrencyService } from "../currency-service";
import { MockCurrencyService } from "./MockCurrencyService";
import { getDevConfig, debugLog } from "./devConfig";

export interface ICurrencyService {
  convert(amount: number, from: string, to: string): number | null;
  fetchRates(baseCurrency: string): Promise<void>;
  getMetadata(): any;
  getCachedRates?(baseCurrency: string): any;
  getRate?(from: string, to: string): number | null;
}

/**
 * Create currency service instance based on configuration
 */
export function createCurrencyService(): ICurrencyService {
  const config = getDevConfig();

  if (config.useMockData) {
    debugLog("Creating MockCurrencyService for development");
    const mockService = new MockCurrencyService();

    // Configure mock service based on dev settings
    mockService.setNetworkCondition(config.mockNetworkCondition);

    return mockService;
  } else {
    debugLog("Creating real CurrencyService");
    const realService = new CurrencyService();

    // Create a wrapper to match the interface
    return {
      convert: (amount: number, from: string, to: string) =>
        realService.convert(amount, from as any, to as any),
      fetchRates: async (baseCurrency: string) => {
        await realService.fetchRates(baseCurrency as any);
      },
      getMetadata: () => realService.getMetadata(),
      getCachedRates: (baseCurrency: string) =>
        realService.getCachedRates(baseCurrency as any),
      getRate: (from: string, to: string) =>
        realService.getRate(from as any, to as any),
    };
  }
}

/**
 * Get a singleton instance of the currency service
 * Recreates the instance if configuration changes
 */
let serviceInstance: ICurrencyService | null = null;
let lastConfig: string | null = null;

export function getCurrencyService(): ICurrencyService {
  const currentConfig = JSON.stringify(getDevConfig());

  // Recreate service if config changed
  if (!serviceInstance || lastConfig !== currentConfig) {
    serviceInstance = createCurrencyService();
    lastConfig = currentConfig;
    debugLog("Currency service instance created/updated");
  }

  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetCurrencyService(): void {
  serviceInstance = null;
  lastConfig = null;
  debugLog("Currency service instance reset");
}
