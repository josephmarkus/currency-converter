import { Component, createSignal, createEffect, For } from "solid-js";
import { CURRENCIES, CurrencyCode } from "./types";
import { CurrencyService } from "./currency-service";
import DevPanel from "./DevPanel";

const App: Component = () => {
  console.log("App component initializing...");

  const [fromCurrency, setFromCurrency] = createSignal<CurrencyCode>("GBP");
  const [toCurrency, setToCurrency] = createSignal<CurrencyCode>("USD");
  const [amount, setAmount] = createSignal(1);
  const [convertedAmount, setConvertedAmount] = createSignal<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = createSignal(false);
  const currencyService = new CurrencyService();
  const [metadata, setMetadata] = createSignal(currencyService.getMetadata());

  // Fetch rates on first load if never fetched before
  createEffect(() => {
    const meta = metadata();
    if (meta.lastFetch === "Never") {
      fetchRates();
    }
  });

  // Update metadata periodically
  createEffect(() => {
    const interval = setInterval(() => {
      setMetadata(currencyService.getMetadata());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  });

  // Convert currency when inputs change
  createEffect(() => {
    const from = fromCurrency();
    const to = toCurrency();
    const amt = amount();

    if (from === to) {
      setConvertedAmount(amt);
      return;
    }

    // Try to convert with cached data first
    const cached = currencyService.convert(amt, from, to);
    if (cached !== null) {
      setConvertedAmount(cached);
    } else {
      // Fetch new data if not cached
      fetchRates();
    }
  });

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      await currencyService.fetchRates(fromCurrency());
      const converted = currencyService.convert(
        amount(),
        fromCurrency(),
        toCurrency(),
      );
      setConvertedAmount(converted);
      // Force update of metadata and re-render
      setMetadata({ ...currencyService.getMetadata() });
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualRefresh = () => {
    if (metadata().isOnline) {
      fetchRates();
    }
  };

  const formatLastFetch = (lastFetch: string) => {
    if (lastFetch === "Never" || !lastFetch) return "Never";
    // Only show time if the string includes a time (contains 'T')
    if (/^\d{4}-\d{2}-\d{2}$/.test(lastFetch) || !lastFetch.includes("T")) {
      const date = new Date(lastFetch);
      const day = date.getUTCDate();
      const month = date.toLocaleString("en-US", {
        month: "long",
        timeZone: "UTC",
      });
      const year = date.getUTCFullYear();
      return `${day} ${month} ${year}`;
    }
    // Otherwise, show date and time
    const date = new Date(lastFetch);
    const year = date.getUTCFullYear();
    const month = date.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    });
    const day = date.getUTCDate();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${year} ${month} ${day} ${hours}:${minutes} GMT`;
  };

  return (
    <div class="min-h-screen bg-darkblue text-darkyellow p-4 sm:p-6 lg:p-8">
      <div class="max-w-xl mx-auto">
        {/* Header */}
        <header class="text-center mb-10 pt-4">
          <h1 class="text-5xl sm:text-6xl font-bold gradient-text mb-3 tracking-tight">
            PocketFX
          </h1>
          <p class="text-darkyellow-muted text-sm tracking-wide">
            Exchange rates with offline support
          </p>
        </header>

        {/* Main Converter Card */}
        <div class="glass-card rounded-2xl p-6 sm:p-8 shadow-glow">
          {/* Status Indicator */}
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 pb-4 border-b border-darkyellow-subtle">
            <div class="flex items-center justify-between sm:justify-start gap-3">
              <div class="flex items-center gap-2">
                <div
                  class={`status-dot w-2.5 h-2.5 rounded-full ${
                    metadata().isOnline ? "bg-[#4fd1c5]" : "bg-[#f687b3]"
                  }`}
                ></div>
                <span class="text-xs text-darkyellow-muted uppercase tracking-widest">
                  {metadata().isOnline ? "Online" : "Offline"}
                </span>
              </div>
              {metadata().isOnline && metadata().hasNewData && (
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading()}
                  class="btn-glow sm:hidden bg-darkyellow hover:bg-darkyellow-rich disabled:opacity-50 text-darkblue px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                >
                  {isLoading() ? "..." : "Update"}
                </button>
              )}
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-darkyellow-muted">
                {(() => {
                  if (isLoading() && metadata().lastFetch === "Never") {
                    return "Loading...";
                  }
                  const latest =
                    currencyService.getLatestUpdateDate(fromCurrency());
                  const dateStr = formatLastFetch(latest ?? "Never");
                  return `Rates last updated: ${dateStr}`;
                })()}
              </span>
              {metadata().isOnline && metadata().hasNewData && (
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading()}
                  class="btn-glow hidden sm:block bg-darkyellow hover:bg-darkyellow-rich disabled:opacity-50 text-darkblue px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                >
                  {isLoading() ? "..." : "Update"}
                </button>
              )}
            </div>
          </div>

          {/* From Currency Section */}
          <div class="mb-6">
            <label class="block text-xs font-medium text-darkyellow-muted uppercase tracking-widest mb-3">
              From
            </label>
            <select
              value={fromCurrency()}
              onChange={(e) => setFromCurrency(e.target.value as CurrencyCode)}
              class="w-full p-4 rounded-xl bg-darkblue-surface text-darkyellow text-lg cursor-pointer"
            >
              <For each={Object.entries(CURRENCIES)}>
                {([code, info]) => (
                  <option value={code} class="bg-darkblue text-darkyellow">
                    {info.flag} {code} - {info.name}
                  </option>
                )}
              </For>
            </select>
            <div class="mt-3 relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-darkyellow-muted">
                {CURRENCIES[fromCurrency()].symbol}
              </span>
              <input
                type="text"
                inputmode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={amount()}
                onInput={(e) => {
                  const value = e.target.value;
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setAmount(parseFloat(value) || 0);
                  } else {
                    e.target.value = amount().toString();
                  }
                }}
                placeholder="0.00"
                class="w-full p-4 pl-12 rounded-xl bg-darkblue-surface text-darkyellow text-3xl font-bold placeholder-darkyellow-subtle"
              />
            </div>
          </div>

          {/* Swap Button */}
          <div class="flex justify-center my-4">
            <button
              onClick={() => {
                const temp = fromCurrency();
                setFromCurrency(toCurrency());
                setToCurrency(temp);
              }}
              class="group bg-darkblue-surface hover:bg-darkblue-light border border-darkyellow-subtle hover:border-darkyellow p-3 rounded-full transition-all duration-300 hover:shadow-glow"
              title="Swap currencies"
            >
              <svg
                class="w-5 h-5 text-darkyellow transition-transform duration-300 group-hover:rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </button>
          </div>

          {/* To Currency Section */}
          <div>
            <label class="block text-xs font-medium text-darkyellow-muted uppercase tracking-widest mb-3">
              To
            </label>
            <select
              value={toCurrency()}
              onChange={(e) => setToCurrency(e.target.value as CurrencyCode)}
              class="w-full p-4 rounded-xl bg-darkblue-surface text-darkyellow text-lg cursor-pointer"
            >
              <For each={Object.entries(CURRENCIES)}>
                {([code, info]) => (
                  <option value={code} class="bg-darkblue text-darkyellow">
                    {info.flag} {code} - {info.name}
                  </option>
                )}
              </For>
            </select>
            <div class="mt-3 p-4 rounded-xl bg-darkblue-surface border border-darkyellow-subtle">
              <div class="text-4xl font-bold text-darkyellow">
                {convertedAmount() !== null ? (
                  <>
                    <span class="text-darkyellow-muted">
                      {CURRENCIES[toCurrency()].symbol}
                    </span>
                    {convertedAmount()?.toFixed(2)}
                  </>
                ) : (
                  <span class="text-darkyellow-muted animate-pulse">...</span>
                )}
              </div>
              {convertedAmount() !== null && amount() > 0 && (
                <div class="text-sm text-darkyellow-muted mt-2">
                  1 {fromCurrency()} ={" "}
                  {(convertedAmount()! / amount()).toFixed(4)} {toCurrency()}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer class="text-center mt-10 space-y-2">
          <p class="text-xs text-darkyellow-muted">
            Rates from Frankfurter API · Cached for offline
          </p>
          <p class="text-xs text-darkyellow-muted">
            &copy; 2026{" "}
            <a
              href="https://josephmarkus.co.uk/"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-darkyellow transition-colors underline underline-offset-2"
            >
              Joseph Markus
            </a>
          </p>
        </footer>
      </div>

      {/* Development Panel */}
      <DevPanel />
    </div>
  );
};

export default App;
