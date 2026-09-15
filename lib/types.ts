export interface PriceZone {
  label: string;
  low: number;
  high: number;
  pct: number;
}

export interface TakeProfit {
  label: "TP1" | "TP2" | "TP3";
  price: number;
}

export type StarCount = 1 | 2 | 3 | 4 | 5;

export interface TokenPlan {
  ticker: string;
  symbol: string;
  digits: number;
  invalidation: number | null;
  zones: PriceZone[];
  tps: TakeProfit[];
  note: string;
  cycleFit: StarCount;
}

export type ScanStatus = "sell" | "buy" | "wait" | "dead";
export type SellLevel = "TP1" | "TP2" | "TP3";
export type WaitSort = "buy" | "sell";

export interface ScanRow {
  ticker: string;
  spot: number;
  digits: number;
  token: TokenPlan;
  status: ScanStatus;
  badge: string;
  fill: string;
  detail: string;
  stars: StarCount;
  active?: PriceZone;
  sellLevel?: SellLevel;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface SmaPoint {
  time: string;
  value: number;
}

export type CrossRegime = "golden" | "death" | "none";

export type CrossEvent = { type: "golden" | "death"; time: string };

export interface CrossAnalysis {
  regime: CrossRegime;
  lastEvent: CrossEvent | null;
  events: CrossEvent[];
}

export type ChartTimeframe = "weekly" | "daily";
