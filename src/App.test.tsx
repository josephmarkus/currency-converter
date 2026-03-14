import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// vi.hoisted() ensures these are available when vi.mock() factory runs (hoisted to top)
const { mockFetchRates, mockConvert, mockGetMetadata } = vi.hoisted(() => ({
  mockFetchRates: vi.fn(),
  mockConvert: vi.fn(),
  mockGetMetadata: vi.fn(),
}));

vi.mock("./currency-service", () => ({
  CurrencyService: vi.fn().mockImplementation(function () {
    return {
      fetchRates: mockFetchRates,
      convert: mockConvert,
      getMetadata: mockGetMetadata,
    };
  }),
}));

// Default metadata — override per-test as needed
const defaultMeta = {
  lastFetch: "Never",
  rateDate: "Never",
  isOnline: true,
  hasNewData: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchRates.mockResolvedValue([]);
  mockConvert.mockReturnValue(null);
  mockGetMetadata.mockReturnValue(defaultMeta);
});

// Lazy import after mock is wired up
const { default: App } = await import("./App");

// ---------------------------------------------------------------------------
// Initial render
// ---------------------------------------------------------------------------

describe("App — initial render", () => {
  it("renders the PocketFX heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /PocketFX/i })).toBeInTheDocument();
  });

  it("renders two currency selector comboboxes", () => {
    render(<App />);
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("renders the amount input with GBP default amount of 100", () => {
    render(<App />);
    expect(screen.getByRole("textbox")).toHaveValue("100");
  });

  it("renders GBP quick amount buttons", () => {
    render(<App />);
    // GBP quickAmounts: [10, 50, 100] — use exact string to avoid £10 matching £100
    expect(screen.getByRole("button", { name: "£10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "£50" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "£100" })).toBeInTheDocument();
  });

  it("shows 'Online' status indicator by default", () => {
    render(<App />);
    expect(screen.getByText("Online")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Auto-fetch on mount
// ---------------------------------------------------------------------------

describe("App — auto-fetch on mount", () => {
  it("calls fetchRates when rateDate is Never", async () => {
    render(<App />);
    await waitFor(() => expect(mockFetchRates).toHaveBeenCalledWith("GBP"));
  });

  it("does NOT auto-fetch when data is already loaded and convert cache hits", async () => {
    mockGetMetadata.mockReturnValue({
      lastFetch: new Date().toISOString(),
      rateDate: "2026-03-07",
      isOnline: true,
      hasNewData: false,
    });
    mockConvert.mockReturnValue(127); // cache hit
    render(<App />);
    // Allow effects to settle
    await new Promise((r) => setTimeout(r, 50));
    expect(mockFetchRates).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe("App — loading state", () => {
  it("shows 'Loading rates...' when loading and rateDate is Never", async () => {
    // fetchRates never resolves, keeping isLoading true
    mockFetchRates.mockReturnValue(new Promise(() => {}));
    render(<App />);
    expect(await screen.findByText("Loading rates...")).toBeInTheDocument();
  });

  it("shows 'Fetching rates...' when not loading and rateDate is Never", async () => {
    // fetchRates resolves quickly, isLoading returns to false
    mockFetchRates.mockResolvedValue([]);
    render(<App />);
    await waitFor(() => expect(screen.getByText("Fetching rates...")).toBeInTheDocument());
  });
});

// ---------------------------------------------------------------------------
// Currency selector interactions
// ---------------------------------------------------------------------------

describe("App — currency selector", () => {
  it("updates the From selector and resets amount to the new currency's default", async () => {
    const user = userEvent.setup();
    render(<App />);
    const [fromSelect] = screen.getAllByRole("combobox");
    // JPY has defaultAmount 10000
    await user.selectOptions(fromSelect, "JPY");
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue("10000")
    );
  });

  it("swaps From and To currencies when the swap button is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    const [fromSelect, toSelect] = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(fromSelect.value).toBe("GBP");
    expect(toSelect.value).toBe("USD");

    await user.click(screen.getByTitle("Swap currencies"));

    await waitFor(() => {
      expect((screen.getAllByRole("combobox")[0] as HTMLSelectElement).value).toBe("USD");
      expect((screen.getAllByRole("combobox")[1] as HTMLSelectElement).value).toBe("GBP");
    });
  });
});

// ---------------------------------------------------------------------------
// Amount input and quick amounts
// ---------------------------------------------------------------------------

describe("App — amount input", () => {
  it("sets amount when a quick amount button is clicked", async () => {
    const user = userEvent.setup();
    mockConvert.mockReturnValue(50);
    render(<App />);
    await user.click(screen.getByRole("button", { name: /£50/ }));
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue("50")
    );
  });

  it("triggers fetchRates when convert returns null (cache miss)", async () => {
    const user = userEvent.setup();
    mockConvert.mockReturnValue(null); // always miss
    render(<App />);
    // Change the To currency to force a re-conversion
    const [, toSelect] = screen.getAllByRole("combobox");
    await user.selectOptions(toSelect, "EUR");
    await waitFor(() => expect(mockFetchRates).toHaveBeenCalled());
  });

  it("sets convertedAmount directly (no fetch) when fromCurrency equals toCurrency", async () => {
    const user = userEvent.setup();
    // Prevent the initial cache-miss from triggering fetchRates on mount
    mockConvert.mockReturnValue(127);
    render(<App />);
    vi.clearAllMocks(); // Reset call count after initial render effects settle
    mockConvert.mockReturnValue(null); // Ensure same-currency path is taken via state check

    const [fromSelect, toSelect] = screen.getAllByRole("combobox");
    const fromValue = (fromSelect as HTMLSelectElement).value;
    // Set To = From — component short-circuits to setConvertedAmount(amount) directly
    await user.selectOptions(toSelect, fromValue);
    await waitFor(() => {
      expect(screen.getByText("100.00")).toBeInTheDocument();
    });
    expect(mockFetchRates).not.toHaveBeenCalled();
  });

  it("shows converted amount when convert returns a value", async () => {
    mockConvert.mockReturnValue(127.5);
    mockGetMetadata.mockReturnValue({
      lastFetch: new Date().toISOString(),
      rateDate: "2026-03-07",
      isOnline: true,
      hasNewData: false,
    });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText("127.50")).toBeInTheDocument()
    );
  });
});

// ---------------------------------------------------------------------------
// Manual refresh / Update rates button
// ---------------------------------------------------------------------------

describe("App — Update rates button", () => {
  it("shows Update rates button when online and hasNewData is true", async () => {
    mockGetMetadata.mockReturnValue({
      lastFetch: "2026-03-09T10:00:00Z",
      rateDate: "2026-03-09",
      isOnline: true,
      hasNewData: true,
    });
    // Cache hit prevents fetchRates, so button stays in "Update rates" state
    mockConvert.mockReturnValue(127);
    render(<App />);
    expect(await screen.findByRole("button", { name: /Update rates/i })).toBeInTheDocument();
  });

  it("hides Update rates button when offline", () => {
    mockGetMetadata.mockReturnValue({
      lastFetch: "2026-03-09T10:00:00Z",
      rateDate: "2026-03-09",
      isOnline: false,
      hasNewData: true,
    });
    render(<App />);
    expect(screen.queryByRole("button", { name: /Update rates/i })).not.toBeInTheDocument();
  });

  it("calls fetchRates when Update rates button is clicked", async () => {
    const user = userEvent.setup();
    mockGetMetadata.mockReturnValue({
      lastFetch: "2026-03-09T10:00:00Z",
      rateDate: "2026-03-09",
      isOnline: true,
      hasNewData: true,
    });
    mockConvert.mockReturnValue(127); // cache hit on mount, no auto-fetch
    render(<App />);
    const updateBtn = await screen.findByRole("button", { name: /Update rates/i });
    vi.clearAllMocks();
    await user.click(updateBtn);
    await waitFor(() => expect(mockFetchRates).toHaveBeenCalled());
  });

  it("shows Updating... and disables the button while loading", async () => {
    const user = userEvent.setup();
    mockGetMetadata.mockReturnValue({
      lastFetch: "2026-03-09T10:00:00Z",
      rateDate: "2026-03-09",
      isOnline: true,
      hasNewData: true,
    });
    mockConvert.mockReturnValue(127); // cache hit on mount, no auto-fetch
    render(<App />);
    const updateBtn = await screen.findByRole("button", { name: /Update rates/i });
    // Now make fetchRates hang so isLoading stays true after the click
    mockFetchRates.mockReturnValue(new Promise(() => {}));
    await user.click(updateBtn);
    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /Getting latest rates\.\.\./i });
      expect(btn).toBeDisabled();
    });
  });
});

// ---------------------------------------------------------------------------
// Metadata display
// ---------------------------------------------------------------------------

describe("App — metadata display", () => {
  it("shows 'Offline' when isOnline is false", () => {
    mockGetMetadata.mockReturnValue({
      lastFetch: "2026-03-09T10:00:00Z",
      rateDate: "2026-03-09",
      isOnline: false,
      hasNewData: false,
    });
    render(<App />);
    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("shows formatted rate date in the status area", async () => {
    mockConvert.mockReturnValue(127);
    mockGetMetadata.mockReturnValue({
      lastFetch: new Date().toISOString(),
      rateDate: "2026-03-07",
      isOnline: true,
      hasNewData: false,
    });
    render(<App />);
    await waitFor(() =>
      expect(screen.getByText(/Rates:.*2026/i)).toBeInTheDocument()
    );
  });
});
