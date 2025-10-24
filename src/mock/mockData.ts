/**
 * Mock exchange rate data for local development and testing
 * Based on realistic exchange rates as of October 2024
 */

import { CurrencyCode } from "../types";

export interface MockExchangeRate {
  base: CurrencyCode;
  target: CurrencyCode;
  rate: number;
  date: string;
}

// Base rates relative to USD (1 USD = X target currency)
export const USD_BASE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110.5,
  AUD: 1.35,
  CAD: 1.25,
  CHF: 0.92,
  CNY: 6.8,
  KRW: 1180.0,
  INR: 75.5,
  SGD: 1.32,
  HKD: 7.8,
  NOK: 8.5,
  SEK: 9.2,
  DKK: 6.35,
  PLN: 3.85,
  CZK: 21.5,
  HUF: 320.0,
  RON: 4.2,
  BGN: 1.66,
  HRK: 6.4,
  RUB: 85.0,
  TRY: 12.5,
  BRL: 5.2,
  MXN: 18.5,
  ZAR: 16.8,
  THB: 33.5,
  MYR: 4.25,
  IDR: 14500.0,
  PHP: 52.0,
  VND: 23500.0,
  NZD: 1.45,
  ILS: 3.65,
  CLP: 800.0,
  COP: 4200.0,
  PEN: 3.75,
  ARS: 180.0,
};

/**
 * Generate exchange rates for a base currency
 */
export function generateMockRates(
  baseCurrency: CurrencyCode,
  date?: string
): MockExchangeRate[] {
  const targetDate = date || new Date().toISOString().split("T")[0];
  const baseRate = USD_BASE_RATES[baseCurrency];

  if (!baseRate) {
    throw new Error(`Unsupported base currency: ${baseCurrency}`);
  }

  const rates: MockExchangeRate[] = [];

  // Generate rates for all other currencies
  Object.entries(USD_BASE_RATES).forEach(([targetCurrency, targetRate]) => {
    if (targetCurrency !== baseCurrency) {
      // Calculate cross rate: base -> USD -> target
      const crossRate = targetRate / baseRate;

      // Add small random variation (±0.5%) for realism
      const variation = 1 + (Math.random() - 0.5) * 0.01;
      const finalRate = crossRate * variation;

      rates.push({
        base: baseCurrency,
        target: targetCurrency as CurrencyCode,
        rate: parseFloat(finalRate.toFixed(6)),
        date: targetDate,
      });
    }
  });

  return rates;
}

/**
 * Generate historical mock data for multiple days
 */
export function generateHistoricalMockData(
  baseCurrency: CurrencyCode,
  days: number = 7
): MockExchangeRate[] {
  const allRates: MockExchangeRate[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];

    const dailyRates = generateMockRates(baseCurrency, dateString);
    allRates.push(...dailyRates);
  }

  return allRates;
}

/**
 * Generate mock metadata
 */
export function generateMockMetadata() {
  const lastFetch = new Date();
  lastFetch.setMinutes(lastFetch.getMinutes() - Math.floor(Math.random() * 60)); // 0-60 minutes ago

  return {
    lastFetch: lastFetch.toISOString(),
    isOnline: true, // Can be toggled for testing
    hasNewData: Math.random() > 0.7, // 30% chance of having new data
    totalCurrencies: Object.keys(USD_BASE_RATES).length,
    totalRecords:
      Object.keys(USD_BASE_RATES).length *
      (Object.keys(USD_BASE_RATES).length - 1),
    fetchSource: "mock-data",
    serverTime: new Date().toISOString(),
  };
}

/**
 * Sample conversion scenarios for testing
 */
export const MOCK_CONVERSION_SCENARIOS = [
  { from: "USD", to: "EUR", amount: 100, expected: 85.0 },
  { from: "GBP", to: "USD", amount: 100, expected: 137.0 },
  { from: "EUR", to: "GBP", amount: 100, expected: 85.88 },
  { from: "JPY", to: "USD", amount: 1000, expected: 9.05 },
  { from: "USD", to: "KRW", amount: 1, expected: 1180.0 },
  { from: "CHF", to: "JPY", amount: 1, expected: 120.11 },
  { from: "AUD", to: "CAD", amount: 50, expected: 46.3 },
  { from: "CNY", to: "INR", amount: 100, expected: 1110.29 },
] as const;

/**
 * Mock popular currency pairs for testing
 */
export const POPULAR_PAIRS = [
  "USD_EUR",
  "EUR_USD",
  "GBP_USD",
  "USD_GBP",
  "USD_JPY",
  "EUR_GBP",
  "AUD_USD",
  "USD_CAD",
  "USD_CHF",
  "NZD_USD",
  "EUR_JPY",
  "GBP_JPY",
] as const;

/**
 * Generate mock rate trends (for charts/analytics)
 */
export function generateMockTrends(
  baseCurrency: CurrencyCode,
  targetCurrency: CurrencyCode,
  days: number = 30
) {
  interface TrendPoint {
    date: string;
    rate: number;
    change: number;
  }

  const trends: TrendPoint[] = [];
  const baseRate =
    USD_BASE_RATES[targetCurrency] / USD_BASE_RATES[baseCurrency];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Generate realistic trend with some volatility
    const trend = Math.sin(i * 0.1) * 0.02; // 2% max trend
    const volatility = (Math.random() - 0.5) * 0.01; // 1% random volatility
    const rate = baseRate * (1 + trend + volatility);

    const previousRate = trends[trends.length - 1]?.rate || rate;

    trends.push({
      date: date.toISOString().split("T")[0],
      rate: parseFloat(rate.toFixed(6)),
      change: i === days ? 0 : parseFloat((rate - previousRate).toFixed(6)),
    });
  }

  return trends;
}
