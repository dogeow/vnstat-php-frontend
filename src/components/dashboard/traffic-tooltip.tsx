import { tooltipRows } from "../../lib/format";
import type { DetailRow } from "../../types";

interface TrafficTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DetailRow }>;
  labels: { in: string; out: string; total: string };
}

export function TrafficTooltip({
  active,
  payload,
  labels
}: TrafficTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-[var(--shadow)]">
      <h3 className="text-sm font-semibold">{row.label}</h3>
      <dl className="mt-3 grid gap-2">
        {tooltipRows(row, labels).map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="font-mono text-xs">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
