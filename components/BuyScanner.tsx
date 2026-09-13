"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChartPanel } from "@/components/ChartPanel";
import { MobileSheet } from "@/components/MobileSheet";
import { ProjectView } from "@/components/ProjectView";
import { TokenCard } from "@/components/TokenCard";
import { fetchSpotPrices } from "@/lib/binance";
import { DESKTOP_MIN_PX, SCAN_INTERVAL_MS } from "@/lib/constants";
import { assignRelativeStars, compareScanRows, evaluateToken } from "@/lib/evaluate";
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
  const [dossierTicker, setDossierTicker] = useState<string | null>(null);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [selected, setSelected] = useState<ScanRow | null>(null);
  const [sheetRow, setSheetRow] = useState<ScanRow | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stamp, setStamp] = useState("Sin datos");
  const scanningRef = useRef(false);

  const scan = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
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
            stars: 1,
          };
        }
        return evaluateToken(token, spot);
      });
      const scored = assignRelativeStars(next);
      scored.sort(compareScanRows);
      setRows(scored);
      setSelected((current) => {
        if (!current) return current;
        return scored.find((row) => row.ticker === current.ticker) ?? null;
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
      scanningRef.current = false;
      setScanning(false);
    }
  }, []);

  useEffect(() => {
    void scan();
    const timer = window.setInterval(() => {
      void scan();
    }, SCAN_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [scan]);

  useEffect(() => {
    if (selected) setSheetRow(selected);
  }, [selected]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (view === "tesis") {
        setView("zonas");
        setDossierTicker(null);
        return;
      }
      setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view]);

  const nSell = rows.filter((row) => row.status === "sell").length;
  const nBuy = rows.filter((row) => row.status === "buy").length;
  const nWait = rows.filter((row) => row.status === "wait").length;
  const nDead = rows.filter((row) => row.status === "dead").length;
  const sheetOpen = Boolean(selected) && !desktop && view === "zonas";

  function openDossier(ticker?: string): void {
    setDossierTicker(ticker ?? null);
    setView("tesis");
    if (!desktop) setSelected(null);
  }

  function closeDossier(): void {
    setView("zonas");
    setDossierTicker(null);
  }

  return (
    <div className="app">
      {view === "zonas" ? (
        <header className="topbar">
          <div>
            <h1>Zonas de compra</h1>
            <div className="stamp">{stamp}</div>
          </div>
          <button
            className={`scan${scanning ? " scanning" : ""}`}
            type="button"
            disabled={scanning}
            aria-busy={scanning}
            onClick={() => void scan()}
          >
            <span className="scan-label">Escanear</span>
            <span className="scan-loader" aria-hidden="true" />
          </button>
        </header>
      ) : null}

      {view === "zonas" ? (
        <div className="workspace">
          <div className="sidebar">
            <section className="tally" aria-live="polite">
              <div>
                <span>En venta</span>
                <strong className="sell-count">{rows.length ? nSell : "—"}</strong>
              </div>
              <div>
                <span>En compra</span>
                <strong className="buy-count">{rows.length ? nBuy : "—"}</strong>
              </div>
              <div>
                <span>Esperar</span>
                <strong>{rows.length ? nWait : "—"}</strong>
              </div>
              <div>
                <span>Inv.</span>
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
                  onOpenDossier={openDossier}
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
        <ProjectView focusTicker={dossierTicker} onBack={closeDossier} />
      )}

      {desktop ? null : (
        <MobileSheet open={sheetOpen} onClose={() => setSelected(null)}>
          <ChartPanel
            row={selected ?? sheetRow}
            desktop={false}
            onClose={() => setSelected(null)}
          />
        </MobileSheet>
      )}

      <nav className="tabbar">
        <button
          type="button"
          aria-selected={view === "zonas"}
          onClick={() => closeDossier()}
        >
          Zonas
        </button>
        <button
          type="button"
          aria-selected={view === "tesis"}
          onClick={() => openDossier()}
        >
          Proyecto
        </button>
      </nav>
    </div>
  );
}
