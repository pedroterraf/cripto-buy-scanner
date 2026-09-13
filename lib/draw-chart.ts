import {
  CandlestickSeries,
  createChart,
  createSeriesMarkers,
  LineSeries,
  LineStyle,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type ISeriesMarkersPluginApi,
  type SeriesMarker,
  type Time,
} from "lightweight-charts";
import { PLAN_COLORS, SMA_FAST, SMA_SLOW } from "@/lib/constants";
import { smaLine } from "@/lib/sma";
import type { Candle, ChartTimeframe, CrossAnalysis, TokenPlan } from "@/lib/types";

export interface PlanChartHandle {
  chart: IChartApi;
  applyLiveBar: (candles: Candle[], cross: CrossAnalysis) => void;
}

function addPlanLines(series: ISeriesApi<"Candlestick">, token: TokenPlan): void {
  const seen = new Set<string>();
  for (const zone of token.zones) {
    const levels = zone.low === zone.high ? [zone.low] : [zone.low, zone.high];
    for (const price of levels) {
      const key = String(price);
      if (seen.has(key)) continue;
      seen.add(key);
      series.createPriceLine({
        price,
        color: PLAN_COLORS.buy,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        axisLabelVisible: true,
        title: zone.label,
      });
    }
  }

  if (token.invalidation != null) {
    series.createPriceLine({
      price: token.invalidation,
      color: PLAN_COLORS.inv,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: "INV",
    });
  }

  const tpColor = {
    TP1: PLAN_COLORS.tp1,
    TP2: PLAN_COLORS.tp2,
    TP3: PLAN_COLORS.tp3,
  };
  for (const tp of token.tps) {
    series.createPriceLine({
      price: tp.price,
      color: tpColor[tp.label],
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: tp.label,
    });
  }
}

function crossMarkers(
  cross: CrossAnalysis,
  timeframe: ChartTimeframe,
): SeriesMarker<Time>[] {
  const keep = timeframe === "daily" ? 6 : 4;
  return cross.events.slice(-keep).map((event) => ({
    time: event.time as Time,
    position: event.type === "golden" ? ("belowBar" as const) : ("aboveBar" as const),
    color: event.type === "golden" ? PLAN_COLORS.buy : PLAN_COLORS.inv,
    shape: event.type === "golden" ? ("arrowUp" as const) : ("arrowDown" as const),
    text: event.type === "golden" ? "Dorado" : "Muerte",
  }));
}

export function drawPlanChart(
  host: HTMLElement,
  token: TokenPlan,
  candles: Candle[],
  cross: CrossAnalysis,
  timeframe: ChartTimeframe,
): PlanChartHandle {
  const minMove = Math.pow(10, -token.digits);
  const chart = createChart(host, {
    autoSize: true,
    layout: {
      background: { color: "#0b0d14" },
      textColor: "#8d8678",
      fontFamily: "IBM Plex Mono, ui-monospace, monospace",
    },
    grid: {
      vertLines: { color: "#2c3140" },
      horzLines: { color: "#2c3140" },
    },
    rightPriceScale: {
      borderColor: "#2c3140",
      mode: PriceScaleMode.Logarithmic,
    },
    timeScale: {
      borderColor: "#2c3140",
      rightOffset: 6,
      timeVisible: timeframe === "daily",
    },
    crosshair: {
      vertLine: { color: "#5c584f" },
      horzLine: { color: "#5c584f" },
    },
  });

  const candleSeries = chart.addSeries(CandlestickSeries, {
    upColor: PLAN_COLORS.buy,
    downColor: PLAN_COLORS.inv,
    wickUpColor: PLAN_COLORS.buy,
    wickDownColor: PLAN_COLORS.inv,
    borderVisible: false,
    lastValueVisible: true,
    priceLineVisible: true,
    priceFormat: { type: "price", precision: token.digits, minMove },
  });
  candleSeries.setData(candles);
  addPlanLines(candleSeries, token);

  const sma50Data = smaLine(candles, SMA_FAST);
  const sma200Data = smaLine(candles, SMA_SLOW);
  let sma50Series: ISeriesApi<"Line"> | null = null;
  let sma200Series: ISeriesApi<"Line"> | null = null;
  if (sma50Data.length) {
    sma50Series = chart.addSeries(LineSeries, {
      color: PLAN_COLORS.sma50,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      title: "SMA 50",
    });
    sma50Series.setData(sma50Data);
  }
  if (sma200Data.length) {
    sma200Series = chart.addSeries(LineSeries, {
      color: PLAN_COLORS.sma200,
      lineWidth: 2,
      lastValueVisible: true,
      priceLineVisible: false,
      title: "SMA 200",
    });
    sma200Series.setData(sma200Data);
  }

  const markerApi: ISeriesMarkersPluginApi<Time> = createSeriesMarkers(
    candleSeries,
    crossMarkers(cross, timeframe),
  );

  chart.timeScale().fitContent();

  return {
    chart,
    applyLiveBar(nextCandles, nextCross) {
      const last = nextCandles[nextCandles.length - 1];
      if (!last) return;
      candleSeries.update(last);
      const fast = smaLine(nextCandles, SMA_FAST);
      const slow = smaLine(nextCandles, SMA_SLOW);
      const lastFast = fast[fast.length - 1];
      const lastSlow = slow[slow.length - 1];
      if (sma50Series && lastFast) sma50Series.update(lastFast);
      if (sma200Series && lastSlow) sma200Series.update(lastSlow);
      markerApi.setMarkers(crossMarkers(nextCross, timeframe));
    },
  };
}
