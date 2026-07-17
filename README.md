# Currency Converter

A modern, offline-first currency converter built with Solid.js, Tailwind CSS, and the Frankfurter API. Features real-time exchange rates with beautiful country flags and seamless offline functionality.

## ✨ Features

- **🌍 Real-time Exchange Rates**: Powered by the Frankfurter API
- **🏴 Country Flags**: Visual currency selection with flag emojis
- **📱 Offline-First**: Works without internet connection using cached data
- **🔄 Manual Refresh**: Update rates when online with new data available
- **📊 Status Indicator**: Shows online/offline status and last update time
- **🎨 Beautiful UI**: Modern design with Tailwind CSS
- **⚡ Fast Performance**: Built with Solid.js and Vite
- **📲 PWA Ready**: Service worker for offline functionality

## 📐 How It Works

PocketFX is built with offline-first design principles. The system ensures fast, reliable currency conversions even without an internet connection.

### Architecture Diagram

```mermaid
flowchart TB
    subgraph User["👤 User"]
        Browser["Browser"]
    end

    subgraph Frontend["Frontend (Solid.js SPA)"]
        App["App.tsx<br/>Main UI Component"]
        CurrencyService["currency-service.ts<br/>Data & Caching Layer"]
        ServiceWorker["sw.js<br/>Service Worker"]
        LocalStorage["LocalStorage<br/>Persistent Cache"]
    end

    subgraph ExternalAPI["External Data Source"]
        Frankfurter["Frankfurter API<br/>ECB Exchange Rates"]
    end

    %% User interactions
    Browser -->|Opens app| App
    App -->|Convert currency| CurrencyService

    %% Frontend data flow
    CurrencyService <-->|Read/write cache| LocalStorage
    CurrencyService -->|Request rates| ServiceWorker
    ServiceWorker -->|Fetch from API| Frankfurter

    %% Styling
    style Frontend fill:#3b82f6,stroke:#FFE11D,color:#fff
    style ExternalAPI fill:#8b5cf6,stroke:#fff,color:#fff
```

### Data Flow

1. **User Opens App**: The frontend loads and checks LocalStorage for cached rates
2. **Initial Fetch**: If no cached data exists, `CurrencyService` requests rates directly from the Frankfurter API
3. **Caching**: Rates are cached in memory and LocalStorage for offline access
4. **Real-time Conversion**: As users type, conversions happen instantly using cached rates
5. **Background Updates**: Every 30 seconds, the app checks if newer rates are available
6. **Manual Refresh**: Users can tap "Update rates" when new data is detected

### Frontend Architecture

| Component | Purpose |
|-----------|---------|
| **App.tsx** | Main UI with currency selectors, amount input, and conversion display |
| **currency-service.ts** | Manages rate fetching, caching, and conversion calculations |
| **Service Worker** | Caches API responses for offline functionality |
| **LocalStorage** | Persists exchange rates and user preferences |

### Offline-First Strategy

```mermaid
flowchart LR
    Request["Rate Request"] --> Network{"Online?"}
    Network -->|Yes| Frankfurter["Frankfurter API"]
    Frankfurter --> Cache["Update Cache"]
    Cache --> Response["Return Rates"]

    Network -->|No| LocalCache["LocalStorage Cache"]
    LocalCache --> Response
```

The app uses a **network-first** strategy with a fallback layer:
1. **Primary**: Frankfurter API (reliable public endpoint)
2. **Fallback**: LocalStorage cache (always available offline)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

1. Clone the repository or use this project
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port shown in terminal)

For offline development and testing:

1. **Open Dev Panel**: Click the "🛠️ Dev Tools" button in the bottom-left corner of the app
2. **Enable Mock Data**: Toggle "Use Mock Data" in the dev panel
3. **Test Scenarios**: Simulate offline mode, slow network, or other conditions

**Browser Console Commands:**

```javascript
// Enable mock data
CurrencyDevUtils.enableMockData();

// Simulate offline mode
CurrencyDevUtils.setNetworkCondition("offline");

// Test conversion scenarios
const service = getCurrencyService();
console.table(service.testConversionScenarios());
```

See [Mock Data Guide](src/mock/MOCK_DATA.md) for complete testing documentation.

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: [Solid.js](https://solidjs.com) - Reactive UI library
- **Build Tool**: [Vite](https://vitejs.dev) - Fast development and build tool
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- **API**: [Frankfurter](https://frankfurter.dev) - Free currency exchange rates
- **PWA**: Service Worker for offline functionality
- **TypeScript**: Type safety and better developer experience

### Project Structure

```
src/
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── index.css            # Global styles (Tailwind imports)
├── types.ts             # TypeScript type definitions
└── currency-service.ts  # Currency data service and caching

public/
├── sw.js               # Service worker for offline functionality
└── manifest.json       # PWA manifest

├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## 💱 Supported Currencies

The app supports 30+ major world currencies including:

- 🇺🇸 USD (US Dollar)
- 🇪🇺 EUR (Euro)
- 🇬🇧 GBP (British Pound)
- 🇯🇵 JPY (Japanese Yen)
- 🇰🇷 KRW (South Korean Won)
- 🇨🇳 CNY (Chinese Yuan)
- 🇮🇳 INR (Indian Rupee)
- And many more...

## 🔧 Key Features Explained

### Offline-First Design

- **Service Worker**: Caches API responses for offline use
- **Local Storage**: Stores exchange rates and user preferences
- **Smart Caching**: Automatically serves cached data when offline
- **Status Indicator**: Shows connection status and data freshness

### Real-time Updates

- **Auto-refresh**: Checks for new data every 30 seconds when online
- **Manual Update**: Button to manually fetch latest rates
- **Smart Fetching**: Only fetches when new data is available (>1 hour old)
- **Background Sync**: Updates cache without interrupting user experience

### User Experience

- **Visual Currency Selection**: Country flags make currency selection intuitive
- **Instant Conversion**: Real-time calculation as you type
- **Swap Functionality**: Quick button to swap from/to currencies
- **Responsive Design**: Works perfectly on desktop and mobile
- **Loading States**: Clear feedback during data fetching

## 🌐 API Integration

The app uses the [Frankfurter API](https://frankfurter.dev) which provides:

- **Free Access**: No API key required
- **Real-time Data**: Updated daily from the European Central Bank
- **Reliable Service**: High uptime and fast response times
- **CORS Enabled**: Works directly from the browser

### API Endpoints Used

- `GET https://api.frankfurter.dev/v1/latest?from={currency}` - Get latest exchange rates for a base currency

## 🔄 Service Worker

The service worker provides offline functionality by:

1. **Caching Static Assets**: HTML, CSS, JS files for offline access
2. **API Response Caching**: Stores exchange rate data for offline use
3. **Network-First Strategy**: Tries network first, falls back to cache
4. **Background Updates**: Keeps cache fresh when online

## 🚀 Deployment

The app is a static, fully client-side SPA — no backend to deploy or maintain.

### Deployment Options

- **Netlify**: Zero-config deployment with edge functions
- **Vercel**: Serverless deployment with global CDN
- **Cloudflare Pages**: Edge deployment for static sites
- **Static Hosting**: Works with any static file hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Frankfurter API](https://frankfurter.dev) for providing free exchange rate data
- [Solid.js](https://solidjs.com) for the reactive framework
- [Tailwind CSS](https://tailwindcss.com) for the styling system
- [Vite](https://vitejs.dev) for the build tool
- Country flag emojis for visual currency representation

---

Built with ❤️ using Solid.js and modern web technologies.
