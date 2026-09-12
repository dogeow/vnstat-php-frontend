import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAxisKbytes } from "../../lib/format";
import type { AppPayload, Bootstrap } from "../../types";
import { TrafficTooltip } from "./traffic-tooltip";

export function ChartSection({
  bootstrap,
  payload
}: {
  bootstrap: Bootstrap;
  payload: AppPayload;
}) {
  const [visible, setVisible] = useState({ rx: true, tx: true });
  const hasPoints = payload.chart.points.length > 0;
  const toggleSeries = (key: "rx" | "tx") => {
    setVisible((previous) => {
      const other = key === "rx" ? "tx" : "rx";
      return previous[key] && !previous[other]
        ? previous
        : { ...previous, [key]: !previous[key] };
    });
  };

  return (
    <section
      aria-labelledby="chart-title"
      className="rounded-xl border border-border bg-card p-4 surface-shadow-sm sm:p-5"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="chart-title" className="text-sm font-semibold">
            {payload.chart.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {payload.detail.title}
          </p>
        </div>
        {hasPoints ? (
          <div className="flex gap-1" aria-label={bootstrap.labels.chartHint}>
            {(["rx", "tx"] as const).map((key) => (
              <button
                type="button"
                key={key}
                aria-pressed={visible[key]}
                title={bootstrap.labels.chartHint}
                onClick={() => toggleSeries(key)}
                className={`flex min-h-10 items-center gap-2 rounded-lg px-3 text-xs transition-colors hover:bg-[var(--surface-soft)] ${visible[key] ? "text-foreground" : "text-muted-foreground line-through opacity-60"}`}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: `var(--${key}-bar)` }}
                />
                {key === "rx" ? bootstrap.labels.in : bootstrap.labels.out}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {hasPoints ? (
        <div className="h-[230px] min-w-0 sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              accessibilityLayer
              data={payload.chart.points}
              barGap={2}
              margin={{ left: -10, right: 0, top: 10, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--chart-grid)"
                vertical={false}
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                minTickGap={20}
                dy={6}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(value: number) =>
                  formatAxisKbytes(
                    value,
                    bootstrap.language,
                    bootstrap.byteNotation
                  )
                }
                width={64}
              />
              <Tooltip
                content={<TrafficTooltip labels={bootstrap.labels} />}
                cursor={{ fill: "var(--accent-soft)", radius: 4 }}
              />
              <Bar
                dataKey="rx"
                name={bootstrap.labels.in}
                fill="var(--rx-bar)"
                hide={!visible.rx}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
              <Bar
                dataKey="tx"
                name={bootstrap.labels.out}
                fill="var(--tx-bar)"
                hide={!visible.tx}
                radius={[3, 3, 0, 0]}
                maxBarSize={28}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="py-12 text-center">
          <h3 className="text-sm font-medium">
            {bootstrap.labels.noChartDataTitle}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {bootstrap.labels.noChartDataMessage}
          </p>
        </div>
      )}
    </section>
  );
}
