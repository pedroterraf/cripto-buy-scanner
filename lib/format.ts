import type { PriceZone } from "@/lib/types";

export function formatPrice(value: number, digits: number): string {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatZoneRange(zone: PriceZone, digits: number): string {
  if (zone.low === zone.high) return formatPrice(zone.low, digits);
  return formatPrice(zone.low, digits) + "–" + formatPrice(zone.high, digits);
}

export function formatUtcDay(ms: number): string {
  const date = new Date(ms);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMonthYear(time: string): string {
  const date = new Date(time + "T00:00:00Z");
  return date.toLocaleDateString("es-AR", { month: "short", year: "numeric" });
}
