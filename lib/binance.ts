import { formatUtcDay } from "@/lib/format";
import { TOKENS } from "@/lib/tokens";
import type { Candle } from "@/lib/types";

export async function fetchSpotPrices(): Promise<Record<string, number>> {
  const symbols = TOKENS.map((token) => token.symbol);
  const url =
    "https://api.binance.com/api/v3/ticker/price?symbols=" +
    encodeURIComponent(JSON.stringify(symbols));
  const response = await fetch(url);
  if (!response.ok) throw new Error("Binance " + response.status);
  const data: Array<{ symbol: string; price: string }> = await response.json();
  const bySymbol: Record<string, number> = {};
  for (const item of data) bySymbol[item.symbol] = Number(item.price);
  return bySymbol;
}

export async function fetchKlines(
  symbol: string,
  interval: "1w" | "1d",
  limit: number,
): Promise<Candle[]> {
  const url =
    "https://api.binance.com/api/v3/klines?symbol=" +
    encodeURIComponent(symbol) +
    "&interval=" +
    interval +
    "&limit=" +
    String(limit);
  const response = await fetch(url);
  if (!response.ok) throw new Error("Klines " + response.status);
  const rows: unknown[][] = await response.json();
  return rows.map((row) => ({
    time: formatUtcDay(Number(row[0])),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
  }));
}
