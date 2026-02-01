import { CurrencyCode, ExchangeRate, FetchMetadata } from "../types";
import {
  generateMockRates,
  generateMockMetadata,
  generateHistoricalMockData,
  MOCK_CONVERSION_SCENARIOS,
} from "./mockData";

/**
 * Mock Currency Service for offline development and testing
 * Mimics the real CurrencyService but uses mock data
 */
export class MockCurrencyService {
  private cache: Map<string, ExchangeRate[]> = new Map();
  private metadata: FetchMetadata;
  private isOfflineMode: boolean = false;

  constructor() {
    this.metadata = generateMockMetadata();
    this.preloadMockData();
    this.setupMockOnlineListener();
  }

  /**
   * Convert amount from one currency to another
   */
  convert(amount: number, from: CurrencyCode, to: CurrencyCode): number | null {
    if (from === to) return amount;

    const rate = this.getExchangeRate(from, to);
    return rate ? parseFloat((amount * rate).toFixed(2)) : null;
  }

  /**
   * Get exchange rate between two currencies
   */
  getExchangeRate(from: CurrencyCode, to: CurrencyCode): number | null {
    const cacheKey = `${from}_${this.getCurrentDate()}`;
    const rates = this.cache.get(cacheKey);

    if (!rates) {
      // Generate mock data on demand
      this.generateAndCacheRates(from);
      return this.getExchangeRate(from, to);
    }

    const rate = rates.find((r) => r.target === to);
    return rate ? rate.rate : null;
  }

  /**
   * Mock fetch rates (simulates API call with delay)
   */
  async fetchRates(baseCurrency: CurrencyCode): Promise<void> {
    console.log(`[MOCK] Fetching rates for ${baseCurrency}...`);

    // Simulate network delay
    await this.simulateNetworkDelay();

    if (this.isOfflineMode) {
      throw new Error("Simulated offline mode - no internet connection");
    }

    // Generate fresh mock data
    const rates = generateMockRates(baseCurrency);

    // Cache the rates
    const cacheKey = `${baseCurrency}_${this.getCurrentDate()}`;
    this.cache.set(cacheKey, rates);

    // Update metadata with actual rate date
    const rateDate = rates[0]?.date || new Date().toISOString().split("T")[0];
    this.metadata = {
      ...this.metadata,
      lastFetch: new Date().toISOString(),
      rateDate: rateDate,
      isOnline: true,
      hasNewData: false,
    };

    console.log(
      `[MOCK] Successfully fetched ${rates.length} rates for ${baseCurrency}`
    );
  }

  /**
   * Get current metadata
   */
  getMetadata(): FetchMetadata {
    return { ...this.metadata };
  }

  /**
   * Check if we have cached data for today
   */
  hasCachedDataForToday(baseCurrency: CurrencyCode): boolean {
    const cacheKey = `${baseCurrency}_${this.getCurrentDate()}`;
    return this.cache.has(cacheKey);
  }

  /**
   * Get all available base currencies from cache
   */
  getAvailableBaseCurrencies(): CurrencyCode[] {
    const currencies = new Set<CurrencyCode>();

    for (const [key] of this.cache.entries()) {
      const [currency] = key.split("_");
      currencies.add(currency as CurrencyCode);
    }

    return Array.from(currencies);
  }

  /**
   * Test specific conversion scenarios
   */
  testConversionScenarios(): Array<{
    scenario: string;
    input: { from: CurrencyCode; to: CurrencyCode; amount: number };
    expected: number;
    actual: number | null;
    passed: boolean;
  }> {
    return MOCK_CONVERSION_SCENARIOS.map((scenario) => {
      const actual = this.convert(scenario.amount, scenario.from, scenario.to);
      const tolerance = 0.1; // Allow 10 cent tolerance
      const passed =
        actual !== null && Math.abs(actual - scenario.expected) <= tolerance;

      return {
        scenario: `${scenario.amount} ${scenario.from} to ${scenario.to}`,
        input: scenario,
        expected: scenario.expected,
        actual,
        passed,
      };
    });
  }

  /**
   * Simulate network conditions for testing
   */
  setNetworkCondition(condition: "online" | "offline" | "slow"): void {
    switch (condition) {
      case "offline":
        this.isOfflineMode = true;
        this.metadata.isOnline = false;
        break;
      case "online":
        this.isOfflineMode = false;
        this.metadata.isOnline = true;
        break;
      case "slow":
        this.isOfflineMode = false;
        this.metadata.isOnline = true;
        // Slow network will be simulated in fetchRates
        break;
    }

    console.log(`[MOCK] Network condition set to: ${condition}`);
  }

  /**
   * Simulate having new data available
   */
  simulateNewDataAvailable(): void {
    this.metadata.hasNewData = true;
    console.log("[MOCK] Simulated new data available");
  }

  /**
   * Get historical data for testing charts/analytics
   */
  getHistoricalData(
    baseCurrency: CurrencyCode,
    days: number = 7
  ): ExchangeRate[] {
    return generateHistoricalMockData(baseCurrency, days);
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
    console.log("[MOCK] Cache cleared");
  }

  /**
   * Export cache for debugging
   */
  exportCache(): Record<string, ExchangeRate[]> {
    return Object.fromEntries(this.cache.entries());
  }

  /**
   * Import cache data (useful for testing specific scenarios)
   */
  importCache(data: Record<string, ExchangeRate[]>): void {
    this.cache = new Map(Object.entries(data));
    console.log("[MOCK] Cache imported");
  }

  // Private methods

  private preloadMockData(): void {
    console.log("[MOCK] Preloading mock data for common currencies...");

    const commonCurrencies: CurrencyCode[] = [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "AUD",
      "CAD",
    ];

    commonCurrencies.forEach((currency) => {
      this.generateAndCacheRates(currency);
    });

    console.log(
      `[MOCK] Preloaded data for ${commonCurrencies.length} currencies`
    );
  }

  private generateAndCacheRates(baseCurrency: CurrencyCode): void {
    const rates = generateMockRates(baseCurrency);
    const cacheKey = `${baseCurrency}_${this.getCurrentDate()}`;
    this.cache.set(cacheKey, rates);
  }

  private async simulateNetworkDelay(): Promise<void> {
    // Simulate realistic API response time
    const delay = this.isOfflineMode ? 0 : Math.random() * 1000 + 500; // 500-1500ms
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private setupMockOnlineListener(): void {
    // Simulate periodic network status changes for testing
    setInterval(() => {
      if (Math.random() < 0.05) {
        // 5% chance to simulate network change
        this.metadata.isOnline = !this.metadata.isOnline;
        console.log(
          `[MOCK] Network status changed to: ${
            this.metadata.isOnline ? "online" : "offline"
          }`
        );
      }
    }, 10000); // Check every 10 seconds
  }

  private getCurrentDate(): string {
    return new Date().toISOString().split("T")[0];
  }
}
