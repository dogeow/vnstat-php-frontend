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

interface ChartSectionProps {
  bootstrap: Bootstrap;
  payload: AppPayload;
}

export function ChartSection({
  bootstrap,
  payload
}: ChartSectionProps) {
  if (payload.chart.points.length === 0) {
    return (
      <section>
        <div className="rounded-xl border border-dashed border-border p-6">
          <h3 className="text-sm font-semibold">{bootstrap.labels.noChartDataTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {bootstrap.labels.noChartDataMessage}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 surface-shadow-sm sm:p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">
        {payload.chart.title}
      </h2>
      <div className="h-[200px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={payload.chart.points} barGap={2} margin={{ left: -10, right: 4, top: 4, bottom: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              minTickGap={16}
              dy={4}
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
              width={56}
            />
            <Tooltip
              content={
                <TrafficTooltip
                  labels={{
                    in: bootstrap.labels.in,
                    out: bootstrap.labels.out,
                    total: bootstrap.labels.total
                  }}
                />
              }
              cursor={{ fill: "var(--accent-soft)", radius: 4 }}
            />
            <Bar
              dataKey="rx"
              name={bootstrap.labels.in}
              fill="var(--rx-bar)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="tx"
              name={bootstrap.labels.out}
              fill="var(--tx-bar)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--rx-bar)]" />
          {bootstrap.labels.in}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[var(--tx-bar)]" />
          {bootstrap.labels.out}
        </span>
      </div>
    </section>
  );
}
