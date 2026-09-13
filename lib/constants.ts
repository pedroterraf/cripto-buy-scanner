export const DESKTOP_MIN_PX = 1024;
export const SMA_FAST = 50;
export const SMA_SLOW = 200;
export const POINT_PAD = 0.004;
export const WEEKLY_KLINE_LIMIT = 1000;
export const DAILY_KLINE_LIMIT = 1000;
export const BINANCE_WS_BASE = "wss://stream.binance.com:9443/stream";
export const BINANCE_WS_RECONNECT_MS = 2500;
export const SCAN_INTERVAL_MS = 60 * 60 * 1000;
export const SHEET_DRAG_THRESHOLD_PX = 10;
export const SHEET_CLOSE_RATIO = 0.28;
export const SHEET_FLICK_PX_PER_MS = 0.55;
export const SHEET_ANIMATION_MS = 420;
export const SHEET_RUBBERBAND = 0.55;
export const SHEET_DECELERATION = 0.998;
export const SELL_EXIT_PCT = {
  TP1: 20,
  TP2: 30,
  TP3: 50,
} as const;

export const PLAN_COLORS = {
  buy: "#d4b46a",
  inv: "#c45c4a",
  tp1: "#ffa726",
  tp2: "#ec407a",
  tp3: "#ab47bc",
  sma50: "#7ec8e3",
  sma200: "#9aa3b5",
} as const;
