"use client";

import { useCallback, useEffect, useState } from "react";
import { ChartPanel } from "@/components/ChartPanel";
import { ThesisView } from "@/components/ThesisView";
import { TokenCard } from "@/components/TokenCard";
import { fetchSpotPrices } from "@/lib/binance";
import { DESKTOP_MIN_PX } from "@/lib/constants";
import { evaluateToken } from "@/lib/evaluate";
import { TOKENS } from "@/lib/tokens";
import type { ScanRow } from "@/lib/types";

function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${DESKTOP_MIN_PX}px)`);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

export function BuyScanner() {
  const desktop = useDesktop();
  const [view, setView] = useState<"zonas" | "tesis">("zonas");
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [selected, setSelected] = useState<ScanRow | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stamp, setStamp] = useState("Sin datos");

  const scan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const prices = await fetchSpotPrices();
      const next: ScanRow[] = TOKENS.map((token) => {
        const spot = prices[token.symbol];
        if (!Number.isFinite(spot)) {
          return {
            ticker: token.ticker,
            spot: 0,
            digits: token.digits,
            token,
            status: "wait" as const,
            badge: "Sin precio",
            fill: "—",
            detail: "Binance no devolvió " + token.symbol,
          };
        }
        return evaluateToken(token, spot);
      });
      next.sort((a, b) => {
        const rank = { buy: 0, wait: 1, dead: 2 };
        return rank[a.status] - rank[b.status];
      });
      setRows(next);
      setSelected((current) => {
        if (!current) return current;
        return next.find((row) => row.ticker === current.ticker) ?? null;
      });
      setStamp(
        "Binance " +
          new Date().toLocaleString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
      );
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "red";
      setError("No pude leer Binance (" + message + ").");
    } finally {
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void scan();
  }, [scan]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const nBuy = rows.filter((row) => row.status === "buy").length;
  const nWait = rows.filter((row) => row.status === "wait").length;
  const nDead = rows.filter((row) => row.status === "dead").length;
  const sheetOpen = Boolean(selected) && !desktop && view === "zonas";

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Zonas de compra</h1>
          <div className="stamp">{stamp}</div>
        </div>
        <button className="scan" type="button" disabled={scanning} onClick={() => void scan()}>
          {scanning ? "…" : "Escanear"}
        </button>
      </header>

      {view === "zonas" ? (
        <div className="workspace">
          <div className="sidebar">
            <section className="tally" aria-live="polite">
              <div>
                <span>En compra</span>
                <strong className="buy-count">{rows.length ? nBuy : "—"}</strong>
              </div>
              <div>
                <span>Esperar</span>
                <strong>{rows.length ? nWait : "—"}</strong>
              </div>
              <div>
                <span>Invalidado</span>
                <strong>{rows.length ? nDead : "—"}</strong>
              </div>
            </section>
            <div className="list">
              {rows.map((row) => (
                <TokenCard
                  key={row.ticker}
                  row={row}
                  selected={selected?.ticker === row.ticker}
                  onSelect={setSelected}
                />
              ))}
            </div>
            {error ? <p className="err">{error}</p> : null}
          </div>

          {desktop ? (
            <ChartPanel row={selected} desktop onClose={() => setSelected(null)} />
          ) : null}
        </div>
      ) : (
        <ThesisView />
      )}

      {sheetOpen ? (
        <div className="sheet open" role="presentation">
          <button className="backdrop" type="button" aria-label="Cerrar gráfico" onClick={() => setSelected(null)} />
          <aside className="panel" role="dialog" aria-modal="true" aria-labelledby="sheetTitle">
            <div className="grab" aria-hidden="true" />
            <ChartPanel row={selected} desktop={false} onClose={() => setSelected(null)} />
          </aside>
        </div>
      ) : null}

      <nav className="tabbar">
        <button
          type="button"
          aria-selected={view === "zonas"}
          onClick={() => setView("zonas")}
        >
          Zonas
        </button>
        <button
          type="button"
          aria-selected={view === "tesis"}
          onClick={() => {
            setView("tesis");
            if (!desktop) setSelected(null);
          }}
        >
          Tesis
        </button>
      </nav>
    </div>
  );
}
