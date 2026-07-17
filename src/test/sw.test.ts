/**
 * Service worker logic tests.
 *
 * public/sw.js uses bare globals (self, caches, clients) and is not an ES
 * module, so it cannot be imported directly into Vitest.  Instead we test the
 * key logic branches by recreating the exact function bodies with stubbed
 * globals, validating every branch of handleApiRequest and the activate /
 * CACHE_UPDATE handlers.
 *
 * Network responses are controlled via MSW (already wired in setup.ts),
 * so no manual fetch mocking is needed.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./server";
import { frankfurterError } from "./handlers/frankfurterApi";

const FRANKFURTER_RATES_URL = "https://api.frankfurter.app/latest";

// ---------------------------------------------------------------------------
// Stub factory helpers
// ---------------------------------------------------------------------------

function makeMockCache() {
  return {
    put: vi.fn().mockResolvedValue(undefined),
    match: vi.fn().mockResolvedValue(undefined),
    addAll: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(true),
  };
}

function makeMockCaches(existingCacheNames: string[] = []) {
  const store = new Map<string, ReturnType<typeof makeMockCache>>();
  for (const name of existingCacheNames) store.set(name, makeMockCache());

  return {
    open: vi.fn().mockImplementation(async (name: string) => {
      if (!store.has(name)) store.set(name, makeMockCache());
      return store.get(name)!;
    }),
    keys: vi.fn().mockResolvedValue(existingCacheNames),
    delete: vi.fn().mockResolvedValue(true),
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// handleApiRequest — extracted logic (mirrors public/sw.js exactly)
// ---------------------------------------------------------------------------

/**
 * Replication of the handleApiRequest function from public/sw.js.
 * Uses the global fetch, which MSW intercepts in tests.
 */
async function handleApiRequest(
  request: Request,
  caches: ReturnType<typeof makeMockCaches>
): Promise<Response> {
  const CURRENCY_API_CACHE = "currency-api-test";
  const cache = await caches.open(CURRENCY_API_CACHE);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    throw new Error("Network request failed");
  } catch {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;

    return new Response(
      JSON.stringify({ error: "Offline - no cached data available", offline: true }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// ---------------------------------------------------------------------------
// handleApiRequest tests
// ---------------------------------------------------------------------------

describe("handleApiRequest", () => {
  let mockCaches: ReturnType<typeof makeMockCaches>;

  beforeEach(() => {
    mockCaches = makeMockCaches();
  });

  it("returns the network response on success and stores it in cache", async () => {
    // Default MSW handler returns 200 for the Frankfurter API
    const request = new Request(`${FRANKFURTER_RATES_URL}?from=GBP`);
    const result = await handleApiRequest(request, mockCaches);

    expect(result.status).toBe(200);
    const cache = await mockCaches.open("currency-api-test");
    expect(cache.put).toHaveBeenCalledWith(request, expect.any(Response));
  });

  it("returns cached response when network throws", async () => {
    server.use(frankfurterError);
    const cachedResponse = new Response(JSON.stringify({ data: [] }), { status: 200 });
    const cache = makeMockCache();
    cache.match.mockResolvedValue(cachedResponse);
    mockCaches.open.mockResolvedValue(cache);

    const request = new Request(`${FRANKFURTER_RATES_URL}?from=GBP`);
    const result = await handleApiRequest(request, mockCaches);

    expect(result.status).toBe(200);
    expect(cache.match).toHaveBeenCalledWith(request);
  });

  it("returns cached response when network responds with non-ok status", async () => {
    server.use(http.get(FRANKFURTER_RATES_URL, () => new HttpResponse(null, { status: 500 })));
    const cachedResponse = new Response(JSON.stringify({ data: [] }), { status: 200 });
    const cache = makeMockCache();
    cache.match.mockResolvedValue(cachedResponse);
    mockCaches.open.mockResolvedValue(cache);

    const request = new Request(`${FRANKFURTER_RATES_URL}?from=GBP`);
    const result = await handleApiRequest(request, mockCaches);

    expect(result.status).toBe(200);
  });

  it("returns 503 JSON when network fails and no cached response exists", async () => {
    server.use(frankfurterError);
    const cache = makeMockCache();
    cache.match.mockResolvedValue(undefined);
    mockCaches.open.mockResolvedValue(cache);

    const request = new Request(`${FRANKFURTER_RATES_URL}?from=GBP`);
    const result = await handleApiRequest(request, mockCaches);

    expect(result.status).toBe(503);
    const body = await result.json();
    expect(body.offline).toBe(true);
    expect(body.error).toMatch(/Offline/);
  });
});

// ---------------------------------------------------------------------------
// Activate handler — old cache cleanup logic
// ---------------------------------------------------------------------------

describe("activate handler — old cache cleanup", () => {
  /**
   * Replication of the activate handler logic from public/sw.js.
   */
  async function activateCleanup(
    currentCacheName: string,
    currentApiCacheName: string,
    caches: ReturnType<typeof makeMockCaches>
  ) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name: string) => name !== currentCacheName && name !== currentApiCacheName)
        .map((name: string) => caches.delete(name))
    );
  }

  it("deletes caches that do not match current build version", async () => {
    const mockCaches = makeMockCaches([
      "currency-converter-old-1",
      "currency-api-old-1",
      "currency-converter-abc123",
      "currency-api-abc123",
    ]);

    await activateCleanup(
      "currency-converter-abc123",
      "currency-api-abc123",
      mockCaches
    );

    expect(mockCaches.delete).toHaveBeenCalledWith("currency-converter-old-1");
    expect(mockCaches.delete).toHaveBeenCalledWith("currency-api-old-1");
    expect(mockCaches.delete).not.toHaveBeenCalledWith("currency-converter-abc123");
    expect(mockCaches.delete).not.toHaveBeenCalledWith("currency-api-abc123");
  });

  it("does not delete anything when all caches are current", async () => {
    const mockCaches = makeMockCaches([
      "currency-converter-abc123",
      "currency-api-abc123",
    ]);

    await activateCleanup(
      "currency-converter-abc123",
      "currency-api-abc123",
      mockCaches
    );

    expect(mockCaches.delete).not.toHaveBeenCalled();
  });

  it("handles an empty cache list gracefully", async () => {
    const mockCaches = makeMockCaches([]);
    await expect(
      activateCleanup("currency-converter-abc123", "currency-api-abc123", mockCaches)
    ).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// CACHE_UPDATE message handler — updateCache logic
// ---------------------------------------------------------------------------

describe("updateCache (CACHE_UPDATE message handler)", () => {
  /**
   * Replication of the updateCache function from public/sw.js.
   */
  async function updateCache(
    cacheName: string,
    staticAssets: string[],
    caches: ReturnType<typeof makeMockCaches>
  ) {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
  }

  it("opens the static cache and calls addAll with the static assets", async () => {
    const mockCaches = makeMockCaches();
    const STATIC_ASSETS = ["/", "/index.html"];

    await updateCache("currency-converter-abc123", STATIC_ASSETS, mockCaches);

    expect(mockCaches.open).toHaveBeenCalledWith("currency-converter-abc123");
    const cache = await mockCaches.open("currency-converter-abc123");
    expect(cache.addAll).toHaveBeenCalledWith(STATIC_ASSETS);
  });
});
