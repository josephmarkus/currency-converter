const BUILD_VERSION = "__BUILD_VERSION__";
const CACHE_NAME = `currency-converter-${BUILD_VERSION}`;
const CURRENCY_API_CACHE = `currency-api-${BUILD_VERSION}`;

// Files to cache for offline use (only cache in production builds)
const STATIC_ASSETS = ["/", "/index.html"];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName !== CACHE_NAME && cacheName !== CURRENCY_API_CACHE
            )
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache or network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API requests (both Frankfurter and Cloudflare Worker)
  if (
    url.hostname === "api.frankfurter.app" ||
    url.hostname.includes("workers.dev")
  ) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // For HTML documents, use network-first strategy to ensure users get latest asset references
  if (request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the latest HTML for offline use
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // If network fails, fall back to cached HTML
          return caches.match(request).then((cached) => cached || caches.match("/index.html"));
        })
    );
    return;
  }

  // For other static assets (JS, CSS with hashes), use cache-first
  event.respondWith(
    caches
      .match(request)
      .then((response) => {
        return response || fetch(request);
      })
      .catch(() => {
        return undefined;
      })
  );
});

// Handle API requests with cache-first strategy
async function handleApiRequest(request) {
  const cache = await caches.open(CURRENCY_API_CACHE);

  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      // Cache successful responses
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }

    // If network request fails, fall back to cache
    throw new Error("Network request failed");
  } catch (error) {
    console.log("Network failed, trying cache:", error);

    // Return cached response if available
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If no cached response, return error response
    return new Response(
      JSON.stringify({
        error: "Offline - no cached data available",
        offline: true,
      }),
      {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Message handler for manual cache updates
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CACHE_UPDATE") {
    event.waitUntil(updateCache());
  }
});

async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC_ASSETS);
}
