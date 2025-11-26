/**
 * Cloudflare Worker for Currency API
 * Serves exchange rates from D1 database with caching and offline support
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for frontend access
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
      "Access-Control-Max-Age": "86400",
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Authentication check (except for health endpoint and requests from pocketfx.app)
    if (path !== "/api/health") {
      const origin = request.headers.get("Origin");
      const apiKey = request.headers.get("X-API-Key");
      const isPocketFx = origin === "https://www.pocketfx.app";
      const isAuthenticated = apiKey && env.API_KEY && apiKey === env.API_KEY;

      if (!isAuthenticated && !isPocketFx) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
            message: "Valid API key required",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    try {
      // Route handling
      switch (path) {
        case "/api/rates":
          return await handleGetRates(url.searchParams, env, corsHeaders);

        case "/api/metadata":
          return await handleGetMetadata(env, corsHeaders);

        case "/api/status":
          return await handleGetStatus(env, corsHeaders);

        case "/api/health":
          return await handleHealthCheck(env, corsHeaders);

        default:
          if (
            path.startsWith("/api/user-conversion") &&
            request.method === "POST"
          ) {
            return await handleUserConversion(request, env, corsHeaders);
          }

          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error("API Error:", error);

      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};

/**
 * Handle exchange rate requests
 */
async function handleGetRates(searchParams, env, corsHeaders) {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date") || getCurrentDate();

  let query;
  let params = [];
  let result;

  if (from && to) {
    // Single currency pair
    query = `
      SELECT base_currency, target_currency, rate, date, source_date, created_at
      FROM exchange_rates 
      WHERE base_currency = ? AND target_currency = ? AND date = ?
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    params = [from.toUpperCase(), to.toUpperCase(), date];
    result = await env.DB.prepare(query)
      .bind(...params)
      .first();
  } else if (from) {
    // All rates for a base currency
    query = `
      SELECT base_currency, target_currency, rate, date, source_date
      FROM exchange_rates 
      WHERE base_currency = ? AND date = ?
      ORDER BY target_currency
    `;
    params = [from.toUpperCase(), date];
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();
    result = results;
  } else {
    // Latest rates summary
    query = `
      SELECT base_currency, COUNT(*) as rate_count, date
      FROM exchange_rates 
      WHERE date = ?
      GROUP BY base_currency, date
      ORDER BY base_currency
    `;
    params = [date];
    const { results } = await env.DB.prepare(query)
      .bind(...params)
      .all();
    result = results;
  }

  // Add metadata to response
  const response = {
    data: result,
    metadata: {
      date: date,
      timestamp: new Date().toISOString(),
      query_type:
        from && to ? "single_pair" : from ? "base_currency" : "summary",
      cached: true, // D1 data is cached by nature
    },
  };

  return new Response(JSON.stringify(response), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600", // Cache for 1 hour
    },
  });
}

/**
 * Handle metadata requests
 */
async function handleGetMetadata(env, corsHeaders) {
  const query = `
    SELECT last_fetch_date, total_currencies, total_records, fetch_source, created_at
    FROM fetch_metadata 
    ORDER BY created_at DESC 
    LIMIT 1
  `;

  const result = await env.DB.prepare(query).first();

  // Get cache status
  const cacheQuery = `
    SELECT value as last_update 
    FROM cache_status 
    WHERE key = 'last_data_update'
  `;

  const cacheResult = await env.DB.prepare(cacheQuery).first();

  const metadata = {
    last_fetch: result?.last_fetch_date || "Never",
    total_currencies: result?.total_currencies || 0,
    total_records: result?.total_records || 0,
    fetch_source: result?.fetch_source || "unknown",
    last_cache_update: cacheResult?.last_update || "Never",
    server_time: new Date().toISOString(),
    database_status: "online",
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes
    },
  });
}

/**
 * Handle status requests for frontend
 */
async function handleGetStatus(env, corsHeaders) {
  const statusQuery = `
    SELECT endpoint, last_updated, status 
    FROM quick_status 
    WHERE endpoint = 'exchange_rates'
  `;

  const statusResult = await env.DB.prepare(statusQuery).first();

  const now = new Date();
  const lastUpdate = statusResult?.last_updated
    ? new Date(statusResult.last_updated)
    : null;
  const hoursSinceUpdate = lastUpdate
    ? (now - lastUpdate) / (1000 * 60 * 60)
    : 999;

  const status = {
    online: true,
    last_update: statusResult?.last_updated || "Never",
    hours_since_update: Math.round(hoursSinceUpdate * 10) / 10,
    has_new_data: hoursSinceUpdate > 1, // Show update button if data is >1 hour old
    status: statusResult?.status || "unknown",
    next_update: getNextUpdateTime(),
  };

  return new Response(JSON.stringify(status), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60", // Cache for 1 minute
    },
  });
}

/**
 * Handle health check requests
 */
async function handleHealthCheck(env, corsHeaders) {
  try {
    // Simple database connectivity test
    const testQuery = `SELECT 1 as test`;
    await env.DB.prepare(testQuery).first();

    const health = {
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    };

    return new Response(JSON.stringify(health), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        database: "disconnected",
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

/**
 * Handle user conversion tracking
 */
async function handleUserConversion(request, env, corsHeaders) {
  try {
    const { from, to, session } = await request.json();

    if (!from || !to) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: from, to",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const query = `
      INSERT OR REPLACE INTO user_conversions 
      (from_currency, to_currency, last_accessed, access_count, user_session)
      VALUES (?, ?, CURRENT_TIMESTAMP, 
        COALESCE(
          (SELECT access_count FROM user_conversions 
           WHERE from_currency = ? AND to_currency = ? AND user_session = ?), 
          0
        ) + 1,
        ?
      )
    `;

    await env.DB.prepare(query)
      .bind(
        from.toUpperCase(),
        to.toUpperCase(),
        from.toUpperCase(),
        to.toUpperCase(),
        session || "anonymous",
        session || "anonymous"
      )
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Conversion tracked",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to track conversion",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * Utility functions
 */
function getCurrentDate() {
  return new Date().toISOString().split("T")[0];
}

function getNextUpdateTime() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0); // 9 AM UTC
  return tomorrow.toISOString();
}
