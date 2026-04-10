import { ArrowDown, ArrowUp } from "lucide-react";
import type { AppPayload, Bootstrap } from "../../types";

interface DetailSectionProps {
  bootstrap: Bootstrap;
  payload: AppPayload;
}

export function DetailSection({
  bootstrap,
  payload
}: DetailSectionProps) {
  if (payload.detail.rows.length === 0) {
    return (
      <section>
        <div className="rounded-xl border border-dashed border-border p-6">
          <h3 className="text-sm font-semibold">{payload.detail.emptyTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {payload.detail.emptyMessage}
          </p>
        </div>
      </section>
    );
  }

  const maxTotal = Math.max(...payload.detail.rows.map((row) => row.total));

  return (
    <section className="rounded-xl border border-border bg-card surface-shadow-sm">
      <div className="border-b border-border px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">{payload.detail.title}</h2>
      </div>

      <div className="hidden sm:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium sm:px-5">{bootstrap.labels.period}</th>
              <th className="w-28 px-4 py-2.5 text-right font-medium sm:px-5">
                <span className="inline-flex items-center gap-1">
                  <ArrowDown className="h-3 w-3 text-[var(--rx)]" />
                  {bootstrap.labels.in}
                </span>
              </th>
              <th className="w-28 px-4 py-2.5 text-right font-medium sm:px-5">
                <span className="inline-flex items-center gap-1">
                  <ArrowUp className="h-3 w-3 text-[var(--tx)]" />
                  {bootstrap.labels.out}
                </span>
              </th>
              <th className="w-28 px-4 py-2.5 text-right font-medium sm:px-5">{bootstrap.labels.total}</th>
            </tr>
          </thead>
          <tbody>
            {payload.detail.rows.map((row) => {
              const barWidth = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
              const rxPercent = row.total > 0 ? (row.rx / row.total) * 100 : 50;

              return (
                <tr
                  key={row.id}
                  className="group border-b border-border/50 last:border-0 transition-colors hover:bg-[var(--accent-soft)]"
                >
                  <td className="px-4 py-3 sm:px-5">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{row.label}</span>
                      <div className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)] lg:block">
                        <div
                          className="flex h-full rounded-full"
                          style={{ width: `${barWidth}%` }}
                        >
                          <div
                            className="h-full rounded-l-full bg-[var(--rx-bar)]"
                            style={{ width: `${rxPercent}%` }}
                          />
                          <div
                            className="h-full rounded-r-full bg-[var(--tx-bar)]"
                            style={{ width: `${100 - rxPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--rx)] sm:px-5">
                    {row.formatted.rx}
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-[var(--tx)] sm:px-5">
                    {row.formatted.tx}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums sm:px-5">
                    {row.formatted.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-px bg-border/50 sm:hidden">
        {payload.detail.rows.map((row) => {
          const barWidth = maxTotal > 0 ? (row.total / maxTotal) * 100 : 0;
          const rxPercent = row.total > 0 ? (row.rx / row.total) * 100 : 50;

          return (
            <div key={`${row.id}-mobile`} className="bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="text-sm font-semibold tabular-nums">
                  {row.formatted.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                <div
                  className="flex h-full rounded-full"
                  style={{ width: `${barWidth}%` }}
                >
                  <div
                    className="h-full rounded-l-full bg-[var(--rx-bar)]"
                    style={{ width: `${rxPercent}%` }}
                  />
                  <div
                    className="h-full rounded-r-full bg-[var(--tx-bar)]"
                    style={{ width: `${100 - rxPercent}%` }}
                  />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs">
                <span className="text-[var(--rx)]">
                  <ArrowDown className="mr-0.5 inline h-3 w-3" />
                  <span className="tabular-nums">{row.formatted.rx}</span>
                </span>
                <span className="text-[var(--tx)]">
                  <ArrowUp className="mr-0.5 inline h-3 w-3" />
                  <span className="tabular-nums">{row.formatted.tx}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
