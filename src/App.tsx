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
    null
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
        toCurrency()
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
    <div class="min-h-screen bg-darkblue text-darkyellow p-4">
      <div class="max-w-2xl mx-auto">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-darkyellow mb-2">
            PocketFX
          </h1>
          <p class="text-darkyellow">Exchange rates with offline support</p>
        </div>

        {/* Status Bar */}
        <div class="bg-darkblue rounded-lg p-4 mb-6 border-2 border-darkyellow">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div class="flex flex-row flex-wrap items-center space-x-2">
              <div
                class={`w-3 h-3 rounded-full ${
                  metadata().isOnline ? "bg-[#39FF14]" : "bg-[#FF073A]"
                }`}
              ></div>
              <span class="text-sm text-darkyellow">
                {metadata().isOnline ? "Online" : "Offline"}
              </span>
              <span class="text-sm text-darkyellow">•</span>
              <span class="text-sm text-darkyellow">
                Rates last updated:{" "}
                {(() => {
                  if (isLoading() && metadata().lastFetch === "Never") {
                    return "Loading...";
                  }
                  const latest = currencyService.getLatestUpdateDate(
                    fromCurrency()
                  );
                  return formatLastFetch(latest ?? "Never");
                })()}
              </span>
            </div>

            {metadata().isOnline && metadata().hasNewData && (
              <div class="mt-2 sm:mt-0 w-full sm:w-auto">
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading()}
                  class="bg-darkyellow hover:bg-yellow-300 disabled:bg-yellow-200 text-darkblue px-4 py-2 rounded-md text-sm font-medium transition-colors border border-darkyellow w-full sm:w-auto"
                >
                  {isLoading() ? "Updating..." : "Update Rates"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Currency Converter */}
        <div class="bg-darkblue rounded-lg p-6 border-2 border-darkyellow">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Currency */}
            <div>
              <label class="block text-sm font-bold text-darkyellow mb-2">
                From
              </label>
              <div class="space-y-3">
                <select
                  value={fromCurrency()}
                  onChange={(e) =>
                    setFromCurrency(e.target.value as CurrencyCode)
                  }
                  class="w-full p-3 pr-8 border-2 border-darkyellow rounded-md bg-darkblue text-darkyellow focus:outline-none focus:border-darkyellow focus:ring-2 focus:ring-blue-400 hover:border-darkyellow transition-colors"
                >
                  <For each={Object.entries(CURRENCIES)}>
                    {([code, info]) => (
                      <option value={code} class="bg-darkblue text-darkyellow">
                        {info.flag} {code} - {info.name}
                      </option>
                    )}
                  </For>
                </select>

                <input
                  type="number"
                  value={amount()}
                  onInput={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount"
                  class="w-full p-3 border-2 border-darkyellow rounded-md bg-darkblue text-darkyellow placeholder-darkyellow focus:outline-none focus:border-darkyellow focus:ring-2 focus:ring-blue-400 hover:border-darkyellow transition-colors"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* To Currency */}
            <div>
              <label class="block text-sm font-bold text-darkyellow mb-2">
                To
              </label>
              <div class="space-y-3">
                <select
                  value={toCurrency()}
                  onChange={(e) =>
                    setToCurrency(e.target.value as CurrencyCode)
                  }
                  class="w-full p-3 pr-8 border-2 border-darkyellow rounded-md bg-darkblue text-darkyellow focus:outline-none focus:border-darkyellow focus:ring-2 focus:ring-blue-400 hover:border-darkyellow transition-colors"
                >
                  <For each={Object.entries(CURRENCIES)}>
                    {([code, info]) => (
                      <option value={code} class="bg-darkblue text-darkyellow">
                        {info.flag} {code} - {info.name}
                      </option>
                    )}
                  </For>
                </select>

                <div class="p-3 bg-darkblue border-2 border-darkyellow rounded-md">
                  <div class="text-2xl font-bold text-darkyellow">
                    {convertedAmount() !== null ? (
                      <>
                        {CURRENCIES[toCurrency()].symbol}
                        {convertedAmount()?.toFixed(2)}
                      </>
                    ) : (
                      <span class="text-darkyellow">Loading...</span>
                    )}
                  </div>
                  {convertedAmount() !== null && (
                    <div class="text-sm text-darkyellow mt-1">
                      1 {CURRENCIES[fromCurrency()].symbol} ={" "}
                      {(convertedAmount()! / amount()).toFixed(4)}{" "}
                      {CURRENCIES[toCurrency()].symbol}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <div class="flex justify-center mt-6">
            <button
              onClick={() => {
                const temp = fromCurrency();
                setFromCurrency(toCurrency());
                setToCurrency(temp);
              }}
              class="bg-darkyellow hover:bg-yellow-300 text-darkblue p-3 rounded-full transition-colors border-2 border-darkyellow focus:outline-none focus:border-darkyellow focus:ring-2 focus:ring-blue-400"
              title="Swap currencies"
            >
              <svg
                class="w-5 h-5"
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
        </div>

        {/* Info Footer */}
        <div class="text-center mt-8 text-sm text-darkyellow">
          <p>Exchange rates provided by Frankfurter API</p>
          <p class="mt-1">Data is cached for offline use</p>
        </div>

        {/* Copyright Footer */}
        <footer class="text-center mt-8 text-xs text-darkyellow">
          &copy; 2025{" "}
          <a
            href="https://josephmarkus.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-darkyellow"
          >
            Joseph Markus
          </a>
        </footer>
      </div>

      {/* Development Panel */}
      <DevPanel />
    </div>
  );
};

export default App;
