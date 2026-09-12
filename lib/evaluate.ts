import { POINT_PAD } from "@/lib/constants";
import { formatPrice, formatZoneRange } from "@/lib/format";
import type { PriceZone, ScanRow, TokenPlan } from "@/lib/types";

function dropPercent(spot: number, target: number): number {
  return ((spot - target) / spot) * 100;
}

function inBand(spot: number, zone: PriceZone): boolean {
  const pad = zone.low === zone.high ? Math.max(zone.low * POINT_PAD, 1e-8) : 0;
  return spot >= zone.low - pad && spot <= zone.high + pad;
}

export function evaluateToken(token: TokenPlan, spot: number): ScanRow {
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
  };
}
