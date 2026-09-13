"use client";

import { formatPrice, formatZoneRange } from "@/lib/format";
import type { ScanRow } from "@/lib/types";

const STAR_SLOTS = [1, 2, 3, 4, 5] as const;

interface TokenCardProps {
  row: ScanRow;
  selected: boolean;
  onSelect: (row: ScanRow) => void;
}

export function TokenCard({ row, selected, onSelect }: TokenCardProps) {
  const sellFinal = row.sellLevel === "TP3";
  return (
    <button
      type="button"
      className={`card ${row.status}${sellFinal ? " sell-final" : ""}${selected ? " open" : ""}`}
      data-ticker={row.ticker}
      aria-label={`${row.ticker}, ${row.stars} de 5, abrir gráfico semanal`}
      onClick={() => onSelect(row)}
    >
      <div className="card-top">
        <span className="ticker">
          {row.ticker}
          <span className="stars" aria-hidden="true">
            {STAR_SLOTS.map((slot) => (
              <span key={slot} className={slot <= row.stars ? "on" : "off"}>
                ★
              </span>
            ))}
          </span>
        </span>
        <span className="spot">{formatPrice(row.spot, row.digits)}</span>
      </div>
      <div className="status-row">
        <span>{row.badge}</span>
        <span>{row.fill}</span>
      </div>
      <div className="prices">
        {row.status === "sell"
          ? row.token.tps.map((tp) => (
              <span
                key={tp.label}
                className={`chip${row.sellLevel === tp.label ? " active" : ""}`}
              >
                <b>{tp.label}</b>
                {formatPrice(tp.price, row.digits)}
              </span>
            ))
          : row.token.zones.map((zone) => (
              <span
                key={zone.label + zone.low}
                className={`chip${row.active === zone ? " active" : ""}`}
              >
                <b>
                  {zone.label} · {zone.pct}%
                </b>
                {formatZoneRange(zone, row.digits)}
              </span>
            ))}
      </div>
      <div className="hint">{row.detail} Tocá para el semanal.</div>
    </button>
  );
}
