import type { Candle, CrossAnalysis, SmaPoint } from "@/lib/types";

export function smaLine(candles: Candle[], period: number): SmaPoint[] {
  if (candles.length < period) return [];
  const out: SmaPoint[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i += 1) {
    sum += candles[i].close;
    if (i >= period) sum -= candles[i - period].close;
    if (i >= period - 1) {
      out.push({ time: candles[i].time, value: sum / period });
    }
  }
  return out;
}

function alignedPairs(fast: SmaPoint[], slow: SmaPoint[]) {
  const slowByTime = new Map(slow.map((point) => [point.time, point.value]));
  const pairs: Array<{ time: string; fast: number; slow: number }> = [];
  for (const point of fast) {
    const slowValue = slowByTime.get(point.time);
    if (slowValue == null) continue;
    pairs.push({ time: point.time, fast: point.value, slow: slowValue });
  }
  return pairs;
}

export function crossEvents(fast: SmaPoint[], slow: SmaPoint[]): CrossAnalysis {
  const pairs = alignedPairs(fast, slow);
  const events: Array<{ type: "golden" | "death"; time: string }> = [];
  for (let i = 1; i < pairs.length; i += 1) {
    const prev = pairs[i - 1].fast - pairs[i - 1].slow;
    const cur = pairs[i].fast - pairs[i].slow;
    if (prev <= 0 && cur > 0) events.push({ type: "golden", time: pairs[i].time });
    else if (prev >= 0 && cur < 0) events.push({ type: "death", time: pairs[i].time });
  }
  const last = pairs[pairs.length - 1];
  if (!last) return { regime: "none", events, lastEvent: null };
  return {
    regime: last.fast > last.slow ? "golden" : "death",
    events,
    lastEvent: events[events.length - 1] ?? null,
  };
}
