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
      setMetadata(currencyService.getMetadata());
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
    if (lastFetch === "Never") return "Never";

    const date = new Date(lastFetch);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div class="max-w-2xl mx-auto">
        {/* Header */}
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-gray-800 mb-2">
            Currency Converter
          </h1>
          <p class="text-gray-600">
            Real-time exchange rates with offline support
          </p>
        </div>

        {/* Status Bar */}
        <div class="bg-white rounded-lg shadow-md p-4 mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <div
                class={`w-3 h-3 rounded-full ${
                  metadata().isOnline ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span class="text-sm text-gray-600">
                {metadata().isOnline ? "Online" : "Offline"}
              </span>
              <span class="text-sm text-gray-400">•</span>
              <span class="text-sm text-gray-600">
                Last updated: {formatLastFetch(metadata().lastFetch)}
              </span>
            </div>

            {metadata().isOnline && metadata().hasNewData && (
              <button
                onClick={handleManualRefresh}
                disabled={isLoading()}
                class="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {isLoading() ? "Updating..." : "Update Rates"}
              </button>
            )}
          </div>
        </div>

        {/* Currency Converter */}
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Currency */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <div class="space-y-3">
                <select
                  value={fromCurrency()}
                  onChange={(e) =>
                    setFromCurrency(e.target.value as CurrencyCode)
                  }
                  class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <For each={Object.entries(CURRENCIES)}>
                    {([code, info]) => (
                      <option value={code}>
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
                  class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* To Currency */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <div class="space-y-3">
                <select
                  value={toCurrency()}
                  onChange={(e) =>
                    setToCurrency(e.target.value as CurrencyCode)
                  }
                  class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <For each={Object.entries(CURRENCIES)}>
                    {([code, info]) => (
                      <option value={code}>
                        {info.flag} {code} - {info.name}
                      </option>
                    )}
                  </For>
                </select>

                <div class="p-3 bg-gray-50 border border-gray-300 rounded-md">
                  <div class="text-2xl font-bold text-gray-800">
                    {convertedAmount() !== null ? (
                      <>
                        {CURRENCIES[toCurrency()].symbol}
                        {convertedAmount()?.toFixed(2)}
                      </>
                    ) : (
                      <span class="text-gray-400">Loading...</span>
                    )}
                  </div>
                  {convertedAmount() !== null && (
                    <div class="text-sm text-gray-600 mt-1">
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
              class="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-full transition-colors"
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
        <div class="text-center mt-8 text-sm text-gray-600">
          <p>Exchange rates provided by Frankfurter API</p>
          <p class="mt-1">Data is cached for offline use</p>
        </div>
      </div>

      {/* Development Panel */}
      <DevPanel />
    </div>
  );
};

export default App;
