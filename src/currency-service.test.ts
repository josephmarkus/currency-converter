import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { CurrencyService } from "./currency-service";
import { server } from "./test/server";
import {
  workerApiError500,
  workerApiNetworkError,
} from "./test/handlers/workerApi";
import { frankfurterError } from "./test/handlers/frankfurterApi";

describe("CurrencyService", () => {
  let service: CurrencyService;

  beforeEach(() => {
    localStorage.clear();
    service = new CurrencyService();
  });

  // ---------------------------------------------------------------------------
  // fetchRates — primary API success
  // ---------------------------------------------------------------------------

  describe("fetchRates — primary API", () => {
    it("populates the in-memory cache", async () => {
      await service.fetchRates("GBP");
      expect(service.getCachedRates("GBP")).not.toBeNull();
      expect(service.getCachedRates("GBP")!.length).toBeGreaterThan(0);
    });

    it("writes rates to localStorage under CACHE_KEY", async () => {
      await service.fetchRates("GBP");
      const stored = localStorage.getItem("currency-rates");
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveProperty("GBP");
      expect(Array.isArray(parsed.GBP)).toBe(true);
    });

    it("writes metadata to localStorage with lastFetch and rateDate", async () => {
      await service.fetchRates("GBP");
      const stored = localStorage.getItem("fetch-metadata");
      expect(stored).not.toBeNull();
      const meta = JSON.parse(stored!);
      expect(meta).toHaveProperty("lastFetch");
      expect(meta).toHaveProperty("rateDate");
      expect(meta.rateDate).toBe("2026-03-07");
    });

    it("maps response to ExchangeRate shape (base, target, rate, date)", async () => {
      const rates = await service.fetchRates("GBP");
      expect(rates[0]).toMatchObject({
        base: "GBP",
        rate: expect.any(Number),
        date: expect.any(String),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // fetchRates — fallback chain
  // ---------------------------------------------------------------------------

  describe("fetchRates — fallback to Frankfurter", () => {
    it("succeeds via Frankfurter when worker returns 500", async () => {
      server.use(workerApiError500);
      const rates = await service.fetchRates("GBP");
      expect(rates.length).toBeGreaterThan(0);
      expect(rates[0].base).toBe("GBP");
    });

    it("succeeds via Frankfurter when worker has a network error", async () => {
      server.use(workerApiNetworkError);
      const rates = await service.fetchRates("GBP");
      expect(rates.length).toBeGreaterThan(0);
    });

    it("returns pre-cached rates when both APIs fail", async () => {
      const cachedRates = [
        { base: "GBP", target: "USD", rate: 1.27, date: "2026-03-07" },
      ];
      localStorage.setItem("currency-rates", JSON.stringify({ GBP: cachedRates }));
      service = new CurrencyService();

      server.use(workerApiNetworkError, frankfurterError);
      const rates = await service.fetchRates("GBP");
      expect(rates).toHaveLength(1);
      expect(rates[0].target).toBe("USD");
    });

    it("returns empty array when both APIs fail and no cache exists", async () => {
      server.use(workerApiNetworkError, frankfurterError);
      const rates = await service.fetchRates("GBP");
      expect(rates).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // convert
  // ---------------------------------------------------------------------------

  describe("convert", () => {
    it("returns amount unchanged when base equals target", () => {
      expect(service.convert(100, "USD", "USD")).toBe(100);
    });

    it("returns null when no rates are cached for the base", () => {
      expect(service.convert(100, "GBP", "USD")).toBeNull();
    });

    it("returns the correct converted amount from cached rates", async () => {
      await service.fetchRates("GBP");
      const result = service.convert(100, "GBP", "USD");
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it("restores cache from localStorage on instantiation", () => {
      const cachedRates = [
        { base: "GBP", target: "USD", rate: 1.27, date: "2026-03-07" },
      ];
      localStorage.setItem("currency-rates", JSON.stringify({ GBP: cachedRates }));
      const freshService = new CurrencyService();
      expect(freshService.convert(100, "GBP", "USD")).toBeCloseTo(127, 0);
    });
  });

  // ---------------------------------------------------------------------------
  // getMetadata / hasNewDataAvailable
  // ---------------------------------------------------------------------------

  describe("getMetadata", () => {
    it("returns defaults when localStorage is empty", () => {
      const meta = service.getMetadata();
      expect(meta.lastFetch).toBe("Never");
      expect(meta.rateDate).toBe("Never");
      expect(meta.hasNewData).toBe(true);
    });

    it("reflects live navigator.onLine (true by default in jsdom)", () => {
      const meta = service.getMetadata();
      expect(meta.isOnline).toBe(true);
    });

    it("reflects navigator.onLine = false", () => {
      Object.defineProperty(navigator, "onLine", {
        value: false,
        configurable: true,
        writable: true,
      });
      const meta = service.getMetadata();
      expect(meta.isOnline).toBe(false);
      Object.defineProperty(navigator, "onLine", {
        value: true,
        configurable: true,
        writable: true,
      });
    });

    it("returns stored lastFetch and rateDate from localStorage", () => {
      const stored = {
        lastFetch: new Date().toISOString(),
        rateDate: "2026-03-07",
      };
      localStorage.setItem("fetch-metadata", JSON.stringify(stored));
      service = new CurrencyService();
      const meta = service.getMetadata();
      expect(meta.lastFetch).toBe(stored.lastFetch);
      expect(meta.rateDate).toBe(stored.rateDate);
    });
  });

  describe("hasNewDataAvailable (via getMetadata)", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns hasNewData: true when lastFetch is Never", () => {
      vi.setSystemTime(new Date("2026-03-10T12:00:00Z"));
      expect(service.getMetadata().hasNewData).toBe(true);
    });

    it("returns hasNewData: false when lastFetch was today (UTC)", () => {
      vi.setSystemTime(new Date("2026-03-10T14:00:00Z"));
      localStorage.setItem(
        "fetch-metadata",
        JSON.stringify({ lastFetch: "2026-03-10T08:00:00Z", rateDate: "2026-03-10" })
      );
      service = new CurrencyService();
      expect(service.getMetadata().hasNewData).toBe(false);
    });

    it("returns hasNewData: true when lastFetch was a previous UTC day", () => {
      vi.setSystemTime(new Date("2026-03-10T00:30:00Z"));
      localStorage.setItem(
        "fetch-metadata",
        JSON.stringify({ lastFetch: "2026-03-09T22:00:00Z", rateDate: "2026-03-09" })
      );
      service = new CurrencyService();
      expect(service.getMetadata().hasNewData).toBe(true);
    });

    it("handles UTC midnight boundary correctly", () => {
      vi.setSystemTime(new Date("2026-03-10T00:01:00Z"));
      localStorage.setItem(
        "fetch-metadata",
        JSON.stringify({ lastFetch: "2026-03-09T23:59:00Z", rateDate: "2026-03-09" })
      );
      service = new CurrencyService();
      expect(service.getMetadata().hasNewData).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // getLatestUpdateDate
  // ---------------------------------------------------------------------------

  describe("getLatestUpdateDate", () => {
    it("returns null when no rates are cached", () => {
      expect(service.getLatestUpdateDate("GBP")).toBeNull();
    });

    it("returns source_date of the most recent rate when cached", async () => {
      await service.fetchRates("GBP");
      const result = service.getLatestUpdateDate("GBP");
      expect(result).toBe("2026-03-07");
    });
  });
});
