import { http, HttpResponse } from "msw";
import { USD_BASE_RATES } from "../../mock/mockData";
import { CurrencyCode } from "../../types";

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

function buildFrankfurterRates(base: string) {
  const baseRate = USD_BASE_RATES[base as CurrencyCode] ?? 1;
  return Object.fromEntries(
    Object.entries(USD_BASE_RATES)
      .filter(([target]) => target !== base)
      .map(([target, targetRate]) => [target, targetRate / baseRate])
  );
}

export const frankfurterHandlers = [
  http.get(`${FRANKFURTER_BASE}/latest`, ({ request }) => {
    const url = new URL(request.url);
    const base = url.searchParams.get("from") ?? "GBP";
    return HttpResponse.json({
      date: "2026-03-07",
      rates: buildFrankfurterRates(base),
    });
  }),
];

export const frankfurterError = http.get(
  `${FRANKFURTER_BASE}/latest`,
  () => HttpResponse.error()
);
