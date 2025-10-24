// Currency data with country flags
export const CURRENCIES = {
  USD: { name: "US Dollar", flag: "🇺🇸", symbol: "$" },
  EUR: { name: "Euro", flag: "🇪🇺", symbol: "€" },
  GBP: { name: "British Pound", flag: "🇬🇧", symbol: "£" },
  JPY: { name: "Japanese Yen", flag: "🇯🇵", symbol: "¥" },
  AUD: { name: "Australian Dollar", flag: "🇦🇺", symbol: "A$" },
  CAD: { name: "Canadian Dollar", flag: "🇨🇦", symbol: "C$" },
  CHF: { name: "Swiss Franc", flag: "🇨🇭", symbol: "CHF" },
  CNY: { name: "Chinese Yuan", flag: "🇨🇳", symbol: "¥" },
  KRW: { name: "South Korean Won", flag: "🇰🇷", symbol: "₩" },
  INR: { name: "Indian Rupee", flag: "🇮🇳", symbol: "₹" },
  SGD: { name: "Singapore Dollar", flag: "🇸🇬", symbol: "S$" },
  HKD: { name: "Hong Kong Dollar", flag: "🇭🇰", symbol: "HK$" },
  NOK: { name: "Norwegian Krone", flag: "🇳🇴", symbol: "kr" },
  SEK: { name: "Swedish Krona", flag: "🇸🇪", symbol: "kr" },
  DKK: { name: "Danish Krone", flag: "🇩🇰", symbol: "kr" },
  PLN: { name: "Polish Zloty", flag: "🇵🇱", symbol: "zł" },
  CZK: { name: "Czech Koruna", flag: "🇨🇿", symbol: "Kč" },
  HUF: { name: "Hungarian Forint", flag: "🇭🇺", symbol: "Ft" },
  RON: { name: "Romanian Leu", flag: "🇷🇴", symbol: "lei" },
  BGN: { name: "Bulgarian Lev", flag: "🇧🇬", symbol: "лв" },
  HRK: { name: "Croatian Kuna", flag: "🇭🇷", symbol: "kn" },
  RUB: { name: "Russian Ruble", flag: "🇷🇺", symbol: "₽" },
  TRY: { name: "Turkish Lira", flag: "🇹🇷", symbol: "₺" },
  BRL: { name: "Brazilian Real", flag: "🇧🇷", symbol: "R$" },
  MXN: { name: "Mexican Peso", flag: "🇲🇽", symbol: "$" },
  ZAR: { name: "South African Rand", flag: "🇿🇦", symbol: "R" },
  THB: { name: "Thai Baht", flag: "🇹🇭", symbol: "฿" },
  MYR: { name: "Malaysian Ringgit", flag: "🇲🇾", symbol: "RM" },
  IDR: { name: "Indonesian Rupiah", flag: "🇮🇩", symbol: "Rp" },
  PHP: { name: "Philippine Peso", flag: "🇵🇭", symbol: "₱" },
  VND: { name: "Vietnamese Dong", flag: "🇻🇳", symbol: "₫" },
  NZD: { name: "New Zealand Dollar", flag: "🇳🇿", symbol: "NZ$" },
  ILS: { name: "Israeli Shekel", flag: "🇮🇱", symbol: "₪" },
  CLP: { name: "Chilean Peso", flag: "🇨🇱", symbol: "$" },
  COP: { name: "Colombian Peso", flag: "🇨🇴", symbol: "$" },
  PEN: { name: "Peruvian Sol", flag: "🇵🇪", symbol: "S/" },
  ARS: { name: "Argentine Peso", flag: "🇦🇷", symbol: "$" },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export interface ExchangeRate {
  base: CurrencyCode;
  target: CurrencyCode;
  rate: number;
  date: string;
}

export interface FetchMetadata {
  lastFetch: string;
  isOnline: boolean;
  hasNewData: boolean;
}
