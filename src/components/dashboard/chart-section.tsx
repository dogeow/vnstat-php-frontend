import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatAxisKbytes } from "../../lib/format";
import { cn } from "../../lib/utils";
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
  const chartClass = "h-[220px] md:h-[250px]";

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
        {payload.chart.title}
      </h2>
      {!payload.chart.enabled ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
          <h3 className="text-lg font-semibold">{bootstrap.labels.chartHidden}</h3>
        </div>
      ) : payload.chart.points.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
          <h3 className="text-lg font-semibold">{bootstrap.labels.noChartDataTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {bootstrap.labels.noChartDataMessage}
          </p>
        </div>
      ) : (
        <div className={cn("w-full", chartClass)}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={payload.chart.points} barGap={6} margin={{ left: -10, right: 4 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                minTickGap={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted)", fontSize: 12 }}
                tickFormatter={(value: number) =>
                  formatAxisKbytes(
                    value,
                    bootstrap.language,
                    bootstrap.byteNotation
                  )
                }
                width={60}
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
                cursor={{ fill: "var(--accent-soft)" }}
              />
              <Legend />
              <Bar
                dataKey="rx"
                name={bootstrap.labels.in}
                fill="var(--rx)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="tx"
                name={bootstrap.labels.out}
                fill="var(--tx)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
