import { CurrencyCode, ExchangeRate, FetchMetadata } from "./types";

const FRANKFURTER_API = "https://api.frankfurter.app";
const CACHE_KEY = "currency-rates";
const METADATA_KEY = "fetch-metadata";

export class CurrencyService {
  private cache: Map<string, ExchangeRate[]> = new Map();

  constructor() {
    this.loadFromLocalStorage();
  }

  async fetchRates(base: CurrencyCode): Promise<ExchangeRate[]> {
    try {
      const response = await fetch(`${FRANKFURTER_API}/latest?from=${base}`);

      if (!response.ok) {
        throw new Error("Failed to fetch rates");
      }

      const data = await response.json();
      const rates: ExchangeRate[] = Object.entries(data.rates).map(
        ([target, rate]) => ({
          base,
          target: target as CurrencyCode,
          rate: rate as number,
          date: data.date,
        })
      );

      // Cache the rates
      this.cache.set(base, rates);
      this.saveToLocalStorage();
      this.updateMetadata();

      return rates;
    } catch (error) {
      console.error("Error fetching rates:", error);
      // Return cached data if available
      return this.getCachedRates(base) || [];
    }
  }

  getCachedRates(base: CurrencyCode): ExchangeRate[] | null {
    return this.cache.get(base) || null;
  }

  getRate(base: CurrencyCode, target: CurrencyCode): number | null {
    const rates = this.cache.get(base);
    if (!rates) return null;

    const rate = rates.find((r) => r.target === target);
    return rate?.rate || null;
  }

  convert(
    amount: number,
    base: CurrencyCode,
    target: CurrencyCode
  ): number | null {
    if (base === target) return amount;

    const rate = this.getRate(base, target);
    if (rate === null) return null;

    return amount * rate;
  }

  getMetadata(): FetchMetadata {
    const stored = localStorage.getItem(METADATA_KEY);
    if (stored) {
      const metadata = JSON.parse(stored);
      return {
        ...metadata,
        isOnline: navigator.onLine,
        hasNewData: this.hasNewDataAvailable(metadata.lastFetch),
      };
    }

    return {
      lastFetch: "Never",
      isOnline: navigator.onLine,
      hasNewData: true,
    };
  }

  private hasNewDataAvailable(lastFetch: string): boolean {
    if (lastFetch === "Never") return true;

    const lastFetchDate = new Date(lastFetch);
    const now = new Date();
    const hoursSinceLastFetch =
      (now.getTime() - lastFetchDate.getTime()) / (1000 * 60 * 60);

    // Consider data stale after 1 hour
    return hoursSinceLastFetch > 1;
  }

  private updateMetadata(): void {
    const metadata = {
      lastFetch: new Date().toISOString(),
    };
    localStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
  }

  private saveToLocalStorage(): void {
    const data = Object.fromEntries(this.cache.entries());
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  }

  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      this.cache = new Map(Object.entries(data));
    }
  }
}
