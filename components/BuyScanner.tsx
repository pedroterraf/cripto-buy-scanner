"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChartPanel } from "@/components/ChartPanel";
import { MobileSheet } from "@/components/MobileSheet";
import { ProjectView } from "@/components/ProjectView";
import { TokenCard } from "@/components/TokenCard";
import { fetchSpotPrices } from "@/lib/binance";
import { DESKTOP_MIN_PX, SCAN_INTERVAL_MS, WAIT_SORT_KEY } from "@/lib/constants";
import { assignRelativeStars, compareScanRows, evaluateToken } from "@/lib/evaluate";
import { TOKENS } from "@/lib/tokens";
import type { ScanRow, WaitSort } from "@/lib/types";

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

type AppView = "zonas" | "proyectos" | "guia";

export function BuyScanner() {
  const desktop = useDesktop();
  const [view, setView] = useState<AppView>("zonas");
  const [dossierTicker, setDossierTicker] = useState<string | null>(null);
  const [dossierFromZonas, setDossierFromZonas] = useState(false);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [selected, setSelected] = useState<ScanRow | null>(null);
  const [sheetRow, setSheetRow] = useState<ScanRow | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stamp, setStamp] = useState("Sin datos");
  const [waitSort, setWaitSort] = useState<WaitSort>("buy");
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
    const saved = window.localStorage.getItem(WAIT_SORT_KEY);
    if (saved === "buy" || saved === "sell") setWaitSort(saved);
  }, []);

  useEffect(() => {
    if (selected) setSheetRow(selected);
  }, [selected]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (view === "guia") {
        setView("proyectos");
        return;
      }
      if (view === "proyectos") {
        if (dossierTicker) {
          if (dossierFromZonas) {
            setView("zonas");
            setDossierTicker(null);
            setDossierFromZonas(false);
          } else {
            setDossierTicker(null);
          }
          return;
        }
        setView("zonas");
        return;
      }
      setSelected(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, dossierTicker, dossierFromZonas]);

  const listed = useMemo(
    () => [...rows].sort((a, b) => compareScanRows(a, b, waitSort)),
    [rows, waitSort],
  );

  const nSell = listed.filter((row) => row.status === "sell").length;
  const nBuy = listed.filter((row) => row.status === "buy").length;
  const nWait = listed.filter((row) => row.status === "wait").length;
  const nDead = listed.filter((row) => row.status === "dead").length;
  const sheetOpen = Boolean(selected) && !desktop && view === "zonas";

  function chooseWaitSort(next: WaitSort): void {
    setWaitSort(next);
    window.localStorage.setItem(WAIT_SORT_KEY, next);
  }

  function openProjects(): void {
    setDossierTicker(null);
    setDossierFromZonas(false);
    setView("proyectos");
    if (!desktop) setSelected(null);
  }

  function openDossier(ticker: string): void {
    setDossierTicker(ticker);
    setDossierFromZonas(true);
    setView("proyectos");
    if (!desktop) setSelected(null);
  }

  function closeProject(): void {
    setView("zonas");
    setDossierTicker(null);
    setDossierFromZonas(false);
  }

  function backFromProject(): void {
    if (view === "guia") {
      setView("proyectos");
      return;
    }
    if (dossierTicker) {
      if (dossierFromZonas) {
        closeProject();
        return;
      }
      setDossierTicker(null);
      return;
    }
    closeProject();
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
            <div className="wait-sort" role="group" aria-label="Ordenar espera">
              <span>Cerca de</span>
              <button
                type="button"
                aria-pressed={waitSort === "buy"}
                aria-label="Ordenar espera cerca de compra"
                onClick={() => chooseWaitSort("buy")}
              >
                Compra
              </button>
              <button
                type="button"
                aria-pressed={waitSort === "sell"}
                aria-label="Ordenar espera cerca de venta"
                onClick={() => chooseWaitSort("sell")}
              >
                Venta
              </button>
            </div>
            <div className="list">
              {listed.map((row) => (
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
        <ProjectView
          ticker={dossierTicker}
          showGuide={view === "guia"}
          fromZonas={dossierFromZonas}
          onBack={backFromProject}
          onOpenToken={(next) => {
            setDossierTicker(next);
            setDossierFromZonas(false);
          }}
          onOpenGuide={() => setView("guia")}
        />
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
          onClick={() => closeProject()}
        >
          Zonas
        </button>
        <button
          type="button"
          aria-selected={view !== "zonas"}
          onClick={() => openProjects()}
        >
          Proyectos
        </button>
      </nav>
    </div>
  );
}
