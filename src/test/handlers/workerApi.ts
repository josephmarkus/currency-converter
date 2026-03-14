import { http, HttpResponse } from "msw";
import { USD_BASE_RATES } from "../../mock/mockData";
import { CurrencyCode } from "../../types";

const WORKER_BASE =
  "https://currency-converter-worker.josephmarkus.workers.dev";

function buildWorkerRates(base: string) {
  const baseRate = USD_BASE_RATES[base as CurrencyCode] ?? 1;
  return Object.entries(USD_BASE_RATES)
    .filter(([target]) => target !== base)
    .map(([target, targetRate]) => ({
      base_currency: base,
      target_currency: target,
      rate: targetRate / baseRate,
      date: "2026-03-07",
      source_date: "2026-03-07",
    }));
}

export const workerApiHandlers = [
  http.get(`${WORKER_BASE}/api/rates`, ({ request }) => {
    const url = new URL(request.url);
    const base = url.searchParams.get("from") ?? "GBP";
    return HttpResponse.json({ data: buildWorkerRates(base) });
  }),
];

export const workerApiError500 = http.get(`${WORKER_BASE}/api/rates`, () =>
  new HttpResponse(null, { status: 500 })
);

export const workerApiNetworkError = http.get(
  `${WORKER_BASE}/api/rates`,
  () => HttpResponse.error()
);

export const workerApi404 = http.get(`${WORKER_BASE}/api/rates`, () =>
  new HttpResponse(null, { status: 404 })
);
