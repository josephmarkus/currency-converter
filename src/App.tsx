import { Component, createSignal, createEffect, For } from "solid-js";
import { CURRENCIES, CurrencyCode } from "./types";
import { CurrencyService } from "./currency-service";
import DevPanel from "./DevPanel";

const App: Component = () => {
  console.log("App component initializing...");

  const [fromCurrency, setFromCurrency] = createSignal<CurrencyCode>("GBP");
  const [toCurrency, setToCurrency] = createSignal<CurrencyCode>("USD");
  const [amount, setAmount] = createSignal<number>(CURRENCIES.GBP.defaultAmount);
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

  const formatRateDate = (rateDate: string) => {
    if (rateDate === "Never" || !rateDate) return "Never";
    // Parse as UTC date to avoid timezone shifts
    const [year, month, day] = rateDate.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
        <div class="glass-card rounded-2xl p-6 sm:p-8 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.3),0_10px_20px_-2px_rgba(0,0,0,0.25)]">
          {/* Status Indicator */}
          <div class="flex flex-col gap-3 mb-8 pb-4 border-b border-[rgba(255,225,29,0.15)]">
            <div class="flex items-center justify-between">
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
              <span class="text-xs text-darkyellow-muted">
                {(() => {
                  if (isLoading() && metadata().rateDate === "Never") {
                    return "Loading...";
                  }
                  const rateDate = metadata().rateDate;
                  const dateStr = formatRateDate(rateDate);
                  return `Rates: ${dateStr}`;
                })()}
              </span>
            </div>
            {metadata().isOnline && metadata().hasNewData && (
              <button
                onClick={handleManualRefresh}
                disabled={isLoading()}
                class="self-start bg-darkyellow hover:bg-darkyellow-rich disabled:opacity-50 text-darkblue px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200"
              >
                {isLoading() ? "Updating..." : "Update rates"}
              </button>
            )}
          </div>

          {/* From Currency Section */}
          <div class="mb-6">
            <label class="block text-xs font-medium text-darkyellow-muted uppercase tracking-widest mb-3">
              From
            </label>
            <select
              value={fromCurrency()}
              onChange={(e) => {
                const newCurrency = e.target.value as CurrencyCode;
                setFromCurrency(newCurrency);
                setAmount(CURRENCIES[newCurrency].defaultAmount);
              }}
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
              class="group bg-darkblue-surface hover:bg-darkblue-light border border-[rgba(255,225,29,0.15)] hover:border-darkyellow p-3 rounded-full transition-all duration-300 hover:scale-105"
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
            <div class="mt-3 p-4 rounded-xl bg-darkblue-surface border border-[rgba(255,225,29,0.15)]">
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
          <p class="text-[10px] text-darkyellow-subtle">
            New rates available Mon–Fri around 16:00 CET, excluding European
            Central Bank holidays
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
