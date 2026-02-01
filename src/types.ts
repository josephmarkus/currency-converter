// Currency data with country flags and common default amounts
export const CURRENCIES = {
  USD: { name: "US Dollar", flag: "🇺🇸", symbol: "$", defaultAmount: 100 },
  EUR: { name: "Euro", flag: "🇪🇺", symbol: "€", defaultAmount: 100 },
  GBP: { name: "British Pound", flag: "🇬🇧", symbol: "£", defaultAmount: 100 },
  JPY: { name: "Japanese Yen", flag: "🇯🇵", symbol: "¥", defaultAmount: 10000 },
  AUD: { name: "Australian Dollar", flag: "🇦🇺", symbol: "A$", defaultAmount: 100 },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$", defaultAmount: 100 },
  CHF: { name: "Swiss Franc", flag: "🇨🇭", symbol: "CHF", defaultAmount: 100 },
  CNY: { name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥", defaultAmount: 500 },
  KRW: { name: "South Korean Won", flag: "🇰🇷", symbol: "₩", defaultAmount: 100000 },
  INR: { name: "Indian Rupee", flag: "🇮🇳", symbol: "₹", defaultAmount: 5000 },
  SGD: { name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$", defaultAmount: 100 },
  HKD: { name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$", defaultAmount: 500 },
  NOK: { name: "Norwegian Krone", flag: "🇳🇴", symbol: "kr", defaultAmount: 1000 },
  SEK: { name: "Swedish Krona", flag: "🇸🇪", symbol: "kr", defaultAmount: 1000 },
  DKK: { name: "Danish Krone", flag: "🇩🇰", symbol: "kr", defaultAmount: 500 },
  PLN: { name: "Polish Zloty", flag: "🇵🇱", symbol: "zł", defaultAmount: 500 },
  CZK: { name: "Czech Koruna", flag: "🇨🇿", symbol: "Kč", defaultAmount: 2000 },
  HUF: { name: "Hungarian Forint", flag: "🇭🇺", symbol: "Ft", defaultAmount: 50000 },
  RON: { name: "Romanian Leu", flag: "🇷🇴", symbol: "lei", defaultAmount: 500 },
  BGN: { name: "Bulgarian Lev", flag: "🇧🇬", symbol: "лв", defaultAmount: 100 },
  HRK: { name: "Croatian Kuna", flag: "🇭🇷", symbol: "kn", defaultAmount: 500 },
  RUB: { name: "Russian Ruble", flag: "🇷🇺", symbol: "₽", defaultAmount: 5000 },
  TRY: { name: "Turkish Lira", flag: "🇹🇷", symbol: "₺", defaultAmount: 1000 },
  BRL: { name: "Brazilian Real", flag: "🇧🇷", symbol: "R$", defaultAmount: 500 },
  MXN: { name: "Mexican Peso", flag: "🇲🇽", symbol: "$", defaultAmount: 1000 },
  ZAR: { name: "South African Rand", flag: "🇿🇦", symbol: "R", defaultAmount: 1000 },
  THB: { name: "Thai Baht", flag: "🇹🇭", symbol: "฿", defaultAmount: 2000 },
  MYR: { name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM", defaultAmount: 500 },
  IDR: { name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp", defaultAmount: 1000000 },
  PHP: { name: "Philippine Peso", flag: "🇵🇭", symbol: "₱", defaultAmount: 5000 },
  VND: { name: "Vietnamese Dong", flag: "🇻🇳", symbol: "₫", defaultAmount: 2000000 },
  NZD: { name: "New Zealand Dollar", flag: "🇳🇿", symbol: "NZ$", defaultAmount: 100 },
  ILS: { name: "Israeli Shekel", flag: "🇮🇱", symbol: "₪", defaultAmount: 500 },
  CLP: { name: "Chilean Peso", flag: "🇨🇱", symbol: "$", defaultAmount: 50000 },
  COP: { name: "Colombian Peso", flag: "🇨🇴", symbol: "$", defaultAmount: 500000 },
  PEN: { name: "Peruvian Sol", flag: "🇵🇪", symbol: "S/", defaultAmount: 500 },
  ARS: { name: "Argentine Peso", flag: "🇦🇷", symbol: "$", defaultAmount: 50000 },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export interface ExchangeRate {
  base: CurrencyCode;
  target: CurrencyCode;
  rate: number;
  date: string;
  source_date?: string; // Actual date of the exchange rates from the source
}

export interface FetchMetadata {
  lastFetch: string;
  rateDate: string; // The actual date of the exchange rates (not when fetched)
  isOnline: boolean;
  hasNewData: boolean;
}
