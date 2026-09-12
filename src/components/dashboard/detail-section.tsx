import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { AppPayload, Bootstrap } from "../../types";
import { buildTrafficCsv } from "../../lib/export";

type SortOrder = "newest" | "oldest" | "largest";

function TrafficValue({ value }: { value: string }) {
  const separator = value.lastIndexOf(" ");
  if (separator < 0) return <span className="whitespace-nowrap">{value}</span>;
  return (
    <span className="inline-flex flex-wrap justify-end gap-x-1">
      <span className="whitespace-nowrap">{value.slice(0, separator)}</span>
      <span>{value.slice(separator + 1)}</span>
    </span>
  );
}

export function DetailSection({
  bootstrap,
  payload
}: {
  bootstrap: Bootstrap;
  payload: AppPayload;
}) {
  const [sortOrder, setSortOrder] = useState<SortOrder>(
    payload.detail.kind === "top" ? "largest" : "newest"
  );
  const rows = useMemo(
    () =>
      [...payload.detail.rows].sort((left, right) => {
        if (sortOrder === "largest")
          return right.total - left.total || right.time - left.time;
        return sortOrder === "oldest"
          ? left.time - right.time
          : right.time - left.time;
      }),
    [payload.detail.rows, sortOrder]
  );
  const maxTotal = Math.max(0, ...rows.map((row) => row.total));
  const labels = bootstrap.labels;

  const exportCsv = () => {
    const blob = new Blob([buildTrafficCsv(rows, labels)], {
      type: "text/csv;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vnstat-${payload.meta.iface.replace(/[^a-zA-Z0-9_-]/g, "_")}-${payload.meta.page}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <section
      aria-labelledby="detail-title"
      className="overflow-hidden rounded-xl border border-border bg-card surface-shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-5">
        <div className="flex items-center gap-2">
          <h2 id="detail-title" className="text-sm font-semibold">
            {payload.detail.title}
          </h2>
          <span
            className="rounded-md bg-[var(--surface-soft)] px-2 py-1 text-xs tabular-nums text-muted-foreground"
            aria-label={`${rows.length} ${labels.records}`}
          >
            {rows.length}
          </span>
        </div>
        {rows.length > 0 ? (
          <div className="flex items-center gap-2">
            <select
              aria-label={labels.sortBy}
              className="h-10 rounded-lg border border-border bg-card px-2 text-xs"
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(event.target.value as SortOrder)
              }
            >
              <option value="newest">{labels.newestFirst}</option>
              <option value="oldest">{labels.oldestFirst}</option>
              <option value="largest">{labels.largestFirst}</option>
            </select>
            <button
              type="button"
              className="control-button h-10 w-10 px-0"
              aria-label={labels.exportCsv}
              title={labels.exportCsv}
              onClick={exportCsv}
            >
              <Download aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <div className="p-8 text-center">
          <h3 className="text-sm font-medium">{payload.detail.emptyTitle}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {payload.detail.emptyMessage}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-xs sm:text-sm">
            <caption className="sr-only">{payload.detail.title}</caption>
            <thead>
              <tr className="border-b border-border bg-[var(--surface-soft)] text-[11px] text-muted-foreground sm:text-xs">
                <th
                  scope="col"
                  className="w-[28%] px-3 py-3 text-left font-medium sm:w-auto sm:px-5"
                >
                  {labels.period}
                </th>
                <th
                  scope="col"
                  className="px-1 py-3 text-right font-medium text-[var(--rx)] sm:w-36 sm:px-5"
                >
                  {labels.in}
                </th>
                <th
                  scope="col"
                  className="px-1 py-3 text-right font-medium text-[var(--tx)] sm:w-36 sm:px-5"
                >
                  {labels.out}
                </th>
                <th
                  scope="col"
                  className="px-2 py-3 text-right font-medium sm:w-36 sm:px-5"
                >
                  {labels.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border last:border-0 hover:bg-[var(--accent-soft)]"
                >
                  <th
                    scope="row"
                    className="px-3 py-3 text-left font-medium sm:px-5"
                  >
                    <div className="flex items-center gap-4">
                      <span className="break-words">{row.label}</span>
                      <div
                        className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--surface-soft)] lg:block"
                        aria-hidden="true"
                      >
                        <div
                          className="flex h-full overflow-hidden rounded-full"
                          style={{
                            width: `${maxTotal > 0 ? (row.total / maxTotal) * 100 : 0}%`
                          }}
                        >
                          <div
                            className="bg-[var(--rx-bar)]"
                            style={{
                              width: `${row.total > 0 ? (row.rx / row.total) * 100 : 0}%`
                            }}
                          />
                          <div className="flex-1 bg-[var(--tx-bar)]" />
                        </div>
                      </div>
                    </div>
                  </th>
                  <td className="break-words px-1 py-3 text-right tabular-nums text-[var(--rx)] sm:px-5">
                    <TrafficValue value={row.formatted.rx} />
                  </td>
                  <td className="break-words px-1 py-3 text-right tabular-nums text-[var(--tx)] sm:px-5">
                    <TrafficValue value={row.formatted.tx} />
                  </td>
                  <td className="px-2 py-3 text-right font-semibold tabular-nums sm:px-5">
                    <TrafficValue value={row.formatted.total} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
