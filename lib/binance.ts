import { BINANCE_WS_BASE, BINANCE_WS_RECONNECT_MS } from "@/lib/constants";
import { formatUtcDay } from "@/lib/format";
import { TOKENS } from "@/lib/tokens";
import type { Candle } from "@/lib/types";

export type KlineInterval = "1w" | "1d";

interface BinanceKline {
  t: number;
  o: string;
  h: string;
  l: string;
  c: string;
  i: string;
}

function candleFromKline(kline: BinanceKline): Candle {
  return {
    time: formatUtcDay(kline.t),
    open: Number(kline.o),
    high: Number(kline.h),
    low: Number(kline.l),
    close: Number(kline.c),
  };
}

function readKline(payload: unknown): BinanceKline | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as { data?: { k?: BinanceKline }; k?: BinanceKline };
  const kline = record.data?.k ?? record.k;
  if (!kline || typeof kline.t !== "number") return null;
  return kline;
}

export function mergeCandle(candles: Candle[], next: Candle): Candle[] {
  if (!candles.length) return [next];
  const last = candles[candles.length - 1];
  if (next.time === last.time) {
    if (
      next.open === last.open &&
      next.high === last.high &&
      next.low === last.low &&
      next.close === last.close
    ) {
      return candles;
    }
    return candles.slice(0, -1).concat(next);
  }
  if (next.time > last.time) return candles.concat(next);
  return candles;
}

export function subscribeKlines(
  symbol: string,
  onKline: (interval: KlineInterval, candle: Candle) => void,
): () => void {
  const lower = symbol.toLowerCase();
  const url = `${BINANCE_WS_BASE}?streams=${lower}@kline_1w/${lower}@kline_1d`;
  let socket: WebSocket | null = null;
  let closed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function connect(): void {
    if (closed) return;
    socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        const kline = readKline(JSON.parse(String(event.data)));
        if (!kline) return;
        if (kline.i !== "1w" && kline.i !== "1d") return;
        onKline(kline.i, candleFromKline(kline));
      } catch {
        return;
      }
    };
    socket.onclose = () => {
      if (closed) return;
      reconnectTimer = setTimeout(connect, BINANCE_WS_RECONNECT_MS);
    };
    socket.onerror = () => {
      socket?.close();
    };
  }

  connect();
  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (socket) {
      socket.onclose = null;
      socket.onerror = null;
      socket.onmessage = null;
      socket.close();
    }
  };
}

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
