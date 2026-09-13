import { POINT_PAD, SELL_EXIT_PCT } from "@/lib/constants";
import { formatPrice, formatZoneRange } from "@/lib/format";
import type { PriceZone, ScanRow, SellLevel, TakeProfit, TokenPlan } from "@/lib/types";

function dropPercent(spot: number, target: number): number {
  return ((spot - target) / spot) * 100;
}

function inBand(spot: number, zone: PriceZone): boolean {
  const pad = zone.low === zone.high ? Math.max(zone.low * POINT_PAD, 1e-8) : 0;
  return spot >= zone.low - pad && spot <= zone.high + pad;
}

function averageBuyPrice(zones: PriceZone[]): number {
  const weight = zones.reduce((sum, zone) => sum + zone.pct, 0);
  if (weight <= 0) return 0;
  return (
    zones.reduce((sum, zone) => sum + ((zone.low + zone.high) / 2) * zone.pct, 0) / weight
  );
}

function takeProfitLevel(tps: TakeProfit[], spot: number): SellLevel | null {
  const ordered = [...tps].sort((a, b) => b.price - a.price);
  for (const tp of ordered) {
    if (spot >= tp.price) return tp.label;
  }
  return null;
}

function opportunityRatio(row: ScanRow): number {
  if (row.spot <= 0) return Number.POSITIVE_INFINITY;
  const average = averageBuyPrice(row.token.zones);
  if (average <= 0) return Number.POSITIVE_INFINITY;
  return row.spot / average;
}

function sellPriority(level: SellLevel | undefined): number {
  if (level === "TP3") return 0;
  if (level === "TP2") return 1;
  return 2;
}

function sortGroup(row: ScanRow): number {
  if (row.spot <= 0) return 4;
  if (row.status === "sell") return 0;
  if (row.status === "buy") return 1;
  if (row.status === "dead") return 3;
  return 2;
}

export function assignRelativeStars(rows: ScanRow[]): ScanRow[] {
  return rows.map((row) => {
    if (row.spot <= 0 || row.status === "dead") {
      return { ...row, stars: 1 };
    }
    return { ...row, stars: row.token.cycleFit };
  });
}

export function compareScanRows(a: ScanRow, b: ScanRow): number {
  const groupA = sortGroup(a);
  const groupB = sortGroup(b);
  if (groupA !== groupB) return groupA - groupB;
  if (a.status === "sell" && b.status === "sell") {
    const level = sellPriority(a.sellLevel) - sellPriority(b.sellLevel);
    if (level !== 0) return level;
    return b.spot - a.spot;
  }
  const ratio = opportunityRatio(a) - opportunityRatio(b);
  if (ratio !== 0) return ratio;
  return a.ticker.localeCompare(b.ticker);
}

export function evaluateToken(token: TokenPlan, spot: number): ScanRow {
  const sellLevel = takeProfitLevel(token.tps, spot);
  if (sellLevel) {
    const tp = token.tps.find((item) => item.label === sellLevel);
    const isFinal = sellLevel === "TP3";
    return {
      ticker: token.ticker,
      spot,
      digits: token.digits,
      token,
      status: "sell",
      sellLevel,
      badge: isFinal ? "Euforia" : "Vender",
      fill: "Salir " + SELL_EXIT_PCT[sellLevel] + "%",
      detail: isFinal
        ? "En TP3 " +
          formatPrice(tp?.price ?? spot, token.digits) +
          ". Trailing semanal. Máxima atención."
        : "En " +
          sellLevel +
          " " +
          formatPrice(tp?.price ?? spot, token.digits) +
          ". Ejecutar el tramo de venta.",
      stars: 1,
    };
  }

  if (token.invalidation != null && spot < token.invalidation) {
    return {
      ticker: token.ticker,
      spot,
      digits: token.digits,
      token,
      status: "dead",
      badge: "Invalidado",
      fill: "0%",
      detail: "Debajo de " + formatPrice(token.invalidation, token.digits) + ". No promediar.",
      stars: 1,
    };
  }

  for (const zone of token.zones) {
    if (inBand(spot, zone)) {
      return {
        ticker: token.ticker,
        spot,
        digits: token.digits,
        token,
        status: "buy",
        badge: "Compra",
        fill: "Llenar " + zone.pct + "%",
        detail: zone.label + " " + formatZoneRange(zone, token.digits) + ". Solo ese tramo.",
        active: zone,
        stars: 1,
      };
    }
  }

  const next = token.zones.find((zone) => spot > zone.high);
  if (next) {
    return {
      ticker: token.ticker,
      spot,
      digits: token.digits,
      token,
      status: "wait",
      badge: "Esperar",
      fill: "Falta −" + dropPercent(spot, next.high).toFixed(1) + "%",
      detail:
        "Próxima compra " + formatZoneRange(next, token.digits) + " (" + next.pct + "%).",
      stars: 1,
    };
  }

  const floor = token.zones[token.zones.length - 1];
  return {
    ticker: token.ticker,
    spot,
    digits: token.digits,
    token,
    status: "wait",
    badge: "Debajo",
    fill: "0% ahora",
    detail: "Perforó " + formatPrice(floor.low, token.digits) + ". No cazar.",
    stars: 1,
  };
}
