# Mock Data & Testing Guide

This guide explains how to use the mock data system for offline development and testing of the currency converter.

## 🎯 Quick Start

### Enable Mock Data

1. **Using Dev Panel**: Click the "🛠️ Dev Tools" button in the bottom-left corner, then toggle "Use Mock Data"
2. **Using Browser Console**:
   ```javascript
   CurrencyDevUtils.enableMockData();
   ```
3. **Manual Configuration**: Set `useMockData: true` in localStorage

### Disable Mock Data

```javascript
CurrencyDevUtils.disableMockData();
```

## 🛠️ Development Panel

Click the "🛠️ Dev Tools" button in the bottom-left corner of the app to open the development panel with these features:

- **Mock Data Toggle**: Switch between real API and mock data
- **Network Conditions**: Simulate online/offline/slow network
- **Debug Logs**: Enable/disable detailed console logging
- **Quick Actions**: One-click presets for common scenarios

## 📊 Mock Data Features

### Complete Currency Coverage

- **37 currencies** with realistic exchange rates
- **Country flags** and currency symbols
- **Historical data** generation for trends
- **Cross-rate calculations** based on USD base rates

### Realistic Behavior

- **Network delays**: Simulated API response times (500-1500ms)
- **Rate variations**: Small random fluctuations (±0.5%)
- **Error conditions**: Timeout and offline scenarios
- **Cache behavior**: Mimics real service caching

## 🧪 Testing Scenarios

### Predefined Test Cases

The mock service includes conversion scenarios you can test:

```javascript
// Access via browser console
const service = getCurrencyService();
const results = service.testConversionScenarios();
console.table(results);
```

**Built-in scenarios:**

- 100 USD → 85.00 EUR
- 100 GBP → 137.00 USD
- 100 EUR → 85.88 GBP
- 1000 JPY → 9.05 USD
- 1 USD → 1180.00 KRW

### Network Condition Testing

```javascript
// Simulate offline mode
CurrencyDevUtils.setNetworkCondition("offline");

// Simulate slow network
CurrencyDevUtils.setNetworkCondition("slow");

// Back to normal
CurrencyDevUtils.setNetworkCondition("online");
```

### Cache Testing

```javascript
// Clear all cached data
service.clearCache();

// Export cache for inspection
const cache = service.exportCache();
console.log(cache);

// Import specific test data
service.importCache(testData);
```

## 📁 File Structure

```
src/mock/
├── mockData.ts           # Exchange rate data and generators
├── MockCurrencyService.ts # Mock service implementation
├── devConfig.ts          # Development configuration
├── serviceFactory.ts     # Service factory (real vs mock)
└── MOCK_DATA.md          # This file
```

## 🔧 Configuration Options

### DevConfig Interface

```typescript
interface DevConfig {
  useMockData: boolean; // Use mock instead of real API
  mockNetworkCondition: string; // 'online' | 'offline' | 'slow'
  enableDebugLogs: boolean; // Show debug console logs
  autoRefreshInterval: number; // Seconds between auto-refresh
  simulateSlowNetwork: boolean; // Add network delays
}
```

### Programmatic Configuration

```javascript
// Get current config
const config = getDevConfig();

// Update specific settings
saveDevConfig({
  useMockData: true,
  mockNetworkCondition: "offline",
});

// Reset to defaults
CurrencyDevUtils.resetConfig();
```

## 🎨 Mock Data Generation

### Base Exchange Rates

All rates are calculated relative to USD using realistic multipliers:

- **EUR**: 0.85 (1 USD = 0.85 EUR)
- **GBP**: 0.73 (1 USD = 0.73 GBP)
- **JPY**: 110.50 (1 USD = 110.50 JPY)
- **KRW**: 1180.00 (1 USD = 1180 KRW)

### Cross-Rate Calculation

For non-USD pairs, rates are calculated as:

```
Rate(A→B) = Rate(USD→B) / Rate(USD→A)
```

### Variation & Realism

- **Random variation**: ±0.5% to simulate market fluctuations
- **Time-based trends**: Sine wave patterns for historical data
- **Volatility simulation**: Different currencies have different volatility levels

## 🧪 Testing Workflows

### Offline Development

1. Enable mock data: `CurrencyDevUtils.enableMockData()`
2. Set offline mode: `CurrencyDevUtils.setNetworkCondition('offline')`
3. Test all app features without internet

### Error Handling Testing

1. Simulate network failures
2. Test cache fallback behavior
3. Verify error message display
4. Check retry mechanisms

### Performance Testing

1. Enable slow network simulation
2. Test loading states and indicators
3. Verify timeout handling
4. Check user experience during delays

### Feature Testing

1. Test currency selection with all 37 currencies
2. Verify conversion accuracy with known scenarios
3. Test swap functionality
4. Check offline/online status indicators

## 🔍 Debugging

### Console Commands

```javascript
// Available in development mode
CurrencyDevUtils.enableMockData();
CurrencyDevUtils.disableMockData();
CurrencyDevUtils.setNetworkCondition("offline");
CurrencyDevUtils.enableDebugLogs();
CurrencyDevUtils.resetConfig();
```

### Debug Logging

Enable debug logs to see detailed information:

```javascript
CurrencyDevUtils.enableDebugLogs();
```

This will show:

- Service creation/recreation
- Mock data generation
- Network condition changes
- Cache operations
- API call simulations

### Performance Monitoring

Monitor mock service performance:

```javascript
// Measure conversion performance
console.time("conversion");
const result = service.convert(100, "USD", "EUR");
console.timeEnd("conversion");

// Check cache size
const cache = service.exportCache();
console.log("Cache size:", Object.keys(cache).length);
```

## 🚀 Production Notes

- Mock data is automatically disabled in production builds
- Development utilities are only available in dev mode
- All mock configuration is stored in localStorage
- No mock code is included in production bundles

## 📝 Adding New Test Scenarios

### Custom Exchange Rates

```typescript
// Add to mockData.ts
export const CUSTOM_SCENARIOS = [
  { from: "USD", to: "BTC", amount: 1, expected: 0.000023 },
  // Add more scenarios...
];
```

### Custom Network Conditions

```typescript
// Extend MockCurrencyService
setCustomNetworkCondition(delay: number, failureRate: number) {
  // Custom implementation
}
```

This mock data system provides a complete offline development environment while ensuring your app works correctly with real API data in production! 🎉
