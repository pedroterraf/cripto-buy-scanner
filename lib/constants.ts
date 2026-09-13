export const DESKTOP_MIN_PX = 1024;
export const SMA_FAST = 50;
export const SMA_SLOW = 200;
export const POINT_PAD = 0.004;
export const WEEKLY_KLINE_LIMIT = 1000;
export const DAILY_KLINE_LIMIT = 1000;
export const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";
export const BINANCE_WS_RECONNECT_MS = 2500;

export const PLAN_COLORS = {
  buy: "#d4b46a",
  inv: "#c45c4a",
  tp1: "#ffa726",
  tp2: "#ec407a",
  tp3: "#ab47bc",
  sma50: "#7ec8e3",
  sma200: "#9aa3b5",
} as const;
