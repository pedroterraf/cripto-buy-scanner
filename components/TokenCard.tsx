"use client";

import { formatPrice, formatZoneRange } from "@/lib/format";
import type { ScanRow } from "@/lib/types";

interface TokenCardProps {
  row: ScanRow;
  selected: boolean;
  onSelect: (row: ScanRow) => void;
}

export function TokenCard({ row, selected, onSelect }: TokenCardProps) {
  return (
    <button
      type="button"
      className={`card ${row.status}${selected ? " open" : ""}`}
      data-ticker={row.ticker}
      aria-label={`${row.ticker}, abrir gráfico semanal`}
      onClick={() => onSelect(row)}
    >
      <div className="card-top">
        <span className="ticker">{row.ticker}</span>
        <span className="spot">{formatPrice(row.spot, row.digits)}</span>
      </div>
      <div className="status-row">
        <span>{row.badge}</span>
        <span>{row.fill}</span>
      </div>
      <div className="prices">
        {row.token.zones.map((zone) => (
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
