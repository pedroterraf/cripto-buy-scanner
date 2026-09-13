"use client";

import { useEffect, useRef, useState } from "react";
import { DAILY_KLINE_LIMIT, SMA_FAST, SMA_SLOW, WEEKLY_KLINE_LIMIT } from "@/lib/constants";
import { fetchKlines, mergeCandle, subscribeKlines } from "@/lib/binance";
import { drawPlanChart, type PlanChartHandle } from "@/lib/draw-chart";
import { formatMonthYear, formatPrice, formatZoneRange } from "@/lib/format";
import { crossEvents, smaLine } from "@/lib/sma";
import type { Candle, ChartTimeframe, CrossAnalysis, ScanRow } from "@/lib/types";

interface ChartPanelProps {
  row: ScanRow | null;
  desktop: boolean;
  onClose: () => void;
}

function crossLabel(analysis: CrossAnalysis): string {
  if (analysis.regime === "none") return "Sin SMA 200";
  const name = analysis.regime === "golden" ? "Cruce dorado" : "Cruce de la muerte";
  if (!analysis.lastEvent) return name;
  return name + " " + formatMonthYear(analysis.lastEvent.time);
}

function analyze(candles: Candle[]): CrossAnalysis {
  return crossEvents(smaLine(candles, SMA_FAST), smaLine(candles, SMA_SLOW));
}

export function ChartPanel({ row, desktop, onClose }: ChartPanelProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PlanChartHandle | null>(null);
  const [timeframe, setTimeframe] = useState<ChartTimeframe>("weekly");
  const [weeklyCandles, setWeeklyCandles] = useState<Candle[] | null>(null);
  const [dailyCandles, setDailyCandles] = useState<Candle[] | null>(null);
  const [daily, setDaily] = useState<CrossAnalysis | null>(null);
  const [weekly, setWeekly] = useState<CrossAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ticker = row?.ticker ?? null;
  const symbol = row?.token.symbol ?? null;
  const token = row?.token ?? null;
  const dataReady = Boolean(weeklyCandles && dailyCandles && weekly && daily);
  const weeklyCandlesRef = useRef(weeklyCandles);
  const dailyCandlesRef = useRef(dailyCandles);
  const weeklyRef = useRef(weekly);
  const dailyRef = useRef(daily);
  weeklyCandlesRef.current = weeklyCandles;
  dailyCandlesRef.current = dailyCandles;
  weeklyRef.current = weekly;
  dailyRef.current = daily;

  useEffect(() => {
    setTimeframe("weekly");
  }, [ticker]);

  useEffect(() => {
    if (!symbol) {
      setWeeklyCandles(null);
      setDailyCandles(null);
      setDaily(null);
      setWeekly(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setWeeklyCandles(null);
    setDailyCandles(null);
    setDaily(null);
    setWeekly(null);
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const [week, day] = await Promise.all([
          fetchKlines(symbol, "1w", WEEKLY_KLINE_LIMIT),
          fetchKlines(symbol, "1d", DAILY_KLINE_LIMIT),
        ]);
        if (cancelled) return;
        setWeeklyCandles(week);
        setDailyCandles(day);
      } catch (caught) {
        if (cancelled) return;
        const message = caught instanceof Error ? caught.message : "red";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    if (!symbol) return;
    return subscribeKlines(symbol, (interval, candle) => {
      if (interval === "1w") {
        setWeeklyCandles((prev) => (prev ? mergeCandle(prev, candle) : prev));
      } else {
        setDailyCandles((prev) => (prev ? mergeCandle(prev, candle) : prev));
      }
    });
  }, [symbol]);

  useEffect(() => {
    setWeekly(weeklyCandles ? analyze(weeklyCandles) : null);
  }, [weeklyCandles]);

  useEffect(() => {
    setDaily(dailyCandles ? analyze(dailyCandles) : null);
  }, [dailyCandles]);

  useEffect(() => {
    if (!token || !dataReady) {
      handleRef.current?.chart.remove();
      handleRef.current = null;
      hostRef.current?.replaceChildren();
      return;
    }
    const candles =
      timeframe === "weekly" ? weeklyCandlesRef.current : dailyCandlesRef.current;
    const cross = timeframe === "weekly" ? weeklyRef.current : dailyRef.current;
    if (!candles || !cross) return;
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    const waitForSize = () =>
      new Promise<void>((resolve) => {
        if (host.clientWidth > 8 && host.clientHeight > 40) {
          resolve();
          return;
        }
        const observer = new ResizeObserver(() => {
          if (host.clientWidth > 8 && host.clientHeight > 40) {
            observer.disconnect();
            resolve();
          }
        });
        observer.observe(host);
        window.setTimeout(() => {
          observer.disconnect();
          resolve();
        }, 1200);
      });

    void waitForSize().then(() => {
      if (cancelled) return;
      handleRef.current?.chart.remove();
      host.replaceChildren();
      handleRef.current = drawPlanChart(host, token, candles, cross, timeframe);
    });

    return () => {
      cancelled = true;
      handleRef.current?.chart.remove();
      handleRef.current = null;
      host.replaceChildren();
    };
  }, [ticker, timeframe, dataReady, token]);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || !ticker) return;
    if (handle.ticker !== ticker || handle.timeframe !== timeframe) return;
    const candles = timeframe === "weekly" ? weeklyCandles : dailyCandles;
    const cross = timeframe === "weekly" ? weekly : daily;
    if (!candles || !cross) return;
    handle.applyLiveBar(candles, cross);
  }, [weeklyCandles, dailyCandles, weekly, daily, timeframe, ticker]);

  if (!row) {
    return (
      <div className="chart-pane empty" data-testid="chart-empty">
        Tocá un token. Weekly y Daily: mismas zonas y TPs, medias del timeframe.
      </div>
    );
  }

  const buys = row.token.zones
    .map((zone) => zone.label + " " + formatZoneRange(zone, row.digits) + " · " + zone.pct + "%")
    .join(" · ");
  const tfLabel = timeframe === "weekly" ? "1W" : "1D";
  const liveClose = (timeframe === "weekly" ? weeklyCandles : dailyCandles)?.at(-1)?.close;
  const spot = liveClose ?? row.spot;

  return (
    <div className="chart-pane" data-testid="chart-panel">
      <div className="sheet-chrome" {...(!desktop ? { "data-sheet-chrome": "" } : {})}>
        {!desktop ? <div className="grab" aria-hidden="true" /> : null}
        <div className="sheet-head">
        <div>
          <h2 id="sheetTitle">
            {row.ticker} USDT · {tfLabel}
          </h2>
          <p className="sheet-meta">
            Spot {formatPrice(spot, row.digits)} · {row.fill} · {buys}
          </p>
        </div>
        {!desktop ? (
          <button className="close" type="button" onClick={onClose}>
            Cerrar
          </button>
        ) : null}
        <div className="tf-switch" role="group" aria-label="Timeframe">
          <button
            type="button"
            aria-pressed={timeframe === "weekly"}
            onClick={() => setTimeframe("weekly")}
          >
            Weekly
          </button>
          <button
            type="button"
            aria-pressed={timeframe === "daily"}
            onClick={() => setTimeframe("daily")}
          >
            Daily
          </button>
        </div>
      </div>
      <div className="ta-bar">
        <div
          className={`ta-chip${daily?.regime === "death" ? " death" : ""}${daily?.regime === "golden" ? " golden" : ""}${timeframe === "daily" ? " active-tf" : ""}`}
        >
          <b>Diario · confirma</b>
          {daily ? crossLabel(daily) : "…"}
        </div>
        <div
          className={`ta-chip${weekly?.regime === "death" ? " death" : ""}${weekly?.regime === "golden" ? " golden" : ""}${timeframe === "weekly" ? " active-tf" : ""}`}
        >
          <b>Semanal · confirma</b>
          {weekly ? crossLabel(weekly) : "…"}
        </div>
      </div>
      </div>
      {error ? <p className="chart-error">{error}</p> : null}
      <div className="chart-stage">
        {loading ? <p className="chart-loading">Cargando velas y medias…</p> : null}
        <div
          className="chart-host"
          ref={hostRef}
          data-testid="chart-host"
          data-ticker={row.ticker}
          data-close={String(spot)}
        />
      </div>
    </div>
  );
}
