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
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-card-foreground surface-shadow">
      <p className="text-xs font-semibold">{row.label}</p>
      <div className="mt-2 grid gap-1.5">
        {tooltipRows(row, labels).map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-muted-foreground">
              {item.label}
            </span>
            <span className="text-xs font-medium tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
