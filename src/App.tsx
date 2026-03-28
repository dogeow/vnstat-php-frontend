import { startTransition, useDeferredValue, useEffect, useState } from "react";
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
import { Badge } from "./components/ui/badge";
import { buttonVariants } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./components/ui/card";
import { ScrollArea, ScrollBar } from "./components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./components/ui/table";
import { buildSearch, fetchAppPayload, parseRoute, type AppRoute } from "./lib/api";
import { formatCompactKbytes, tooltipRows } from "./lib/format";
import { cn } from "./lib/utils";
import type {
  AppPayload,
  Bootstrap,
  DetailRow,
  GraphKey,
  SummaryCard
} from "./types";

interface AppProps {
  bootstrap: Bootstrap;
}

interface TrafficTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: DetailRow }>;
  labels: { in: string; out: string; total: string };
}

function TrafficTooltip({ active, payload, labels }: TrafficTooltipProps) {
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

function navHref(route: AppRoute) {
  return buildSearch(route);
}

function syncTheme(style: string) {
  const link = document.getElementById("theme-stylesheet") as HTMLLinkElement | null;
  if (link) {
    link.href = `themes/${style}/style.css`;
  }
}

function sectionKicker(label: string) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
      {label}
    </p>
  );
}

function navButtonClass(active: boolean) {
  return cn(
    buttonVariants({ variant: active ? "default" : "outline", size: "lg" }),
    "h-auto w-full justify-between rounded-2xl px-4 py-3 text-left shadow-none",
    !active && "bg-card/80 hover:bg-secondary"
  );
}

function SummarySection({
  cards,
  bootstrap
}: {
  cards: SummaryCard[];
  bootstrap: Bootstrap;
}) {
  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {sectionKicker(bootstrap.labels.overview)}
          <CardTitle>{bootstrap.labels.summaryTitle}</CardTitle>
        </div>
        <CardDescription className="max-w-xl text-sm leading-6">
          {bootstrap.labels.summaryDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {cards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
            <h3 className="text-lg font-semibold">{bootstrap.labels.noTrafficDataTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bootstrap.labels.noTrafficDataMessage}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="rounded-[24px] border-border/80 bg-card/95 shadow-none"
              >
                <CardContent className="p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">
                    {card.formatted.total}
                  </p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {bootstrap.labels.in}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {card.formatted.rx}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {bootstrap.labels.out}
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold">
                        {card.formatted.tx}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartSection({
  payload,
  bootstrap
}: {
  payload: AppPayload;
  bootstrap: Bootstrap;
}) {
  if (!payload.chart.enabled) {
    return null;
  }

  const chartClass =
    payload.chart.size === "small" ? "h-[220px] md:h-[250px]" : "h-[280px] md:h-[360px]";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {sectionKicker(bootstrap.labels.visualization)}
          <CardTitle>{payload.chart.title}</CardTitle>
        </div>
        <CardDescription className="max-w-xl text-sm leading-6">
          {payload.chart.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {payload.chart.points.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
            <h3 className="text-lg font-semibold">{bootstrap.labels.noChartDataTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bootstrap.labels.noChartDataMessage}
            </p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-border bg-[color:var(--surface-elevated)]/90 p-3 md:p-4">
            <div className={cn("w-full", chartClass)}>
              <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payload.chart.points} barGap={6}>
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
                    formatCompactKbytes(
                      value,
                      bootstrap.language,
                      bootstrap.byteNotation
                    )
                  }
                  width={78}
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSection({ payload }: { payload: AppPayload }) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        {sectionKicker("Details")}
        <CardTitle>{payload.detail.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {payload.detail.rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
            <h3 className="text-lg font-semibold">{payload.detail.emptyTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {payload.detail.emptyMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="overflow-hidden rounded-[24px] border border-border bg-card/90">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{window.__VNSTAT_BOOTSTRAP__?.labels.period ?? "Period"}</TableHead>
                      <TableHead className="text-right">{window.__VNSTAT_BOOTSTRAP__?.labels.in ?? "In"}</TableHead>
                      <TableHead className="text-right">{window.__VNSTAT_BOOTSTRAP__?.labels.out ?? "Out"}</TableHead>
                      <TableHead className="text-right">{window.__VNSTAT_BOOTSTRAP__?.labels.total ?? "Total"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.detail.rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-semibold">{row.label}</TableCell>
                        <TableCell className="text-right font-mono">{row.formatted.rx}</TableCell>
                        <TableCell className="text-right font-mono">{row.formatted.tx}</TableCell>
                        <TableCell className="text-right font-mono text-[var(--accent-strong)]">
                          {row.formatted.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {payload.detail.rows.map((row) => (
                <Card key={`${row.id}-mobile`} className="rounded-[22px] border-border/80 bg-card/95 shadow-none">
                  <CardContent className="p-4">
                    <h3 className="text-base font-semibold">{row.label}</h3>
                    <dl className="mt-4 grid gap-2">
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {window.__VNSTAT_BOOTSTRAP__?.labels.in ?? "In"}
                        </dt>
                        <dd className="font-mono text-sm">{row.formatted.rx}</dd>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {window.__VNSTAT_BOOTSTRAP__?.labels.out ?? "Out"}
                        </dt>
                        <dd className="font-mono text-sm">{row.formatted.tx}</dd>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-secondary px-4 py-3">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {window.__VNSTAT_BOOTSTRAP__?.labels.total ?? "Total"}
                        </dt>
                        <dd className="font-mono text-sm font-semibold text-[var(--accent-strong)]">
                          {row.formatted.total}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function App({ bootstrap }: AppProps) {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.search, bootstrap)
  );
  const [payload, setPayload] = useState<AppPayload | null>(null);
  const deferredPayload = useDeferredValue(payload);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    syncTheme(route.style);
  }, [route.style]);

  useEffect(() => {
    const handlePopState = () => {
      startTransition(() => {
        setRoute(parseRoute(window.location.search, bootstrap));
      });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [bootstrap]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);
    setPayload(null);

    fetchAppPayload(bootstrap, route, controller.signal)
      .then((nextPayload) => {
        setPayload(nextPayload);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        setError(reason instanceof Error ? reason.message : bootstrap.labels.requestFailed);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [bootstrap, reloadToken, route.iface, route.page, route.graph]);

  useEffect(() => {
    const titleSource = payload?.meta.documentTitle ?? bootstrap.documentTitle;
    document.title = titleSource;
  }, [bootstrap.documentTitle, payload?.meta.documentTitle]);

  const setNextRoute = (nextRoute: AppRoute) => {
    startTransition(() => {
      setRoute(nextRoute);
    });

    window.history.pushState({}, "", navHref(nextRoute));
  };

  const navigate = (partial: Partial<AppRoute>) => {
    const nextRoute = { ...route, ...partial };
    setNextRoute(nextRoute);
  };

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-[color:var(--surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Badge variant="secondary" className="shrink-0 rounded-full px-3 py-1">
            {bootstrap.labels.settings}
          </Badge>
          <ScrollArea className="w-full">
            <div className="flex items-center gap-6 whitespace-nowrap pr-6">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {bootstrap.labels.chartSize}
                </span>
                <div className="flex items-center gap-2">
                  {bootstrap.options.graphs.map((option) => {
                    const href = navHref({
                      ...route,
                      graph: option.id as GraphKey
                    });
                    const active = route.graph === option.id;

                    return (
                      <a
                        key={option.id}
                        className={cn(
                          buttonVariants({
                            variant: active ? "default" : "outline",
                            size: "sm"
                          }),
                          "rounded-full"
                        )}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          navigate({ graph: option.id as GraphKey });
                        }}
                      >
                        {option.label}
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {bootstrap.labels.themes}
                </span>
                <div className="flex items-center gap-2">
                  {bootstrap.options.styles.map((option) => {
                    const href = navHref({ ...route, style: option.id });
                    const active = route.style === option.id;

                    return (
                      <a
                        key={option.id}
                        className={cn(
                          buttonVariants({
                            variant: active ? "secondary" : "ghost",
                            size: "sm"
                          }),
                          "rounded-full"
                        )}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        onClick={(event) => {
                          event.preventDefault();
                          navigate({ style: option.id });
                        }}
                      >
                        {option.label}
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              {sectionKicker(bootstrap.labels.interfaces)}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {bootstrap.options.ifaces.map((option) => {
                  const href = navHref({ ...route, iface: option.id });
                  const active = route.iface === option.id;

                  return (
                    <a
                      key={option.id}
                      className={navButtonClass(active)}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ iface: option.id });
                      }}
                    >
                      <span className="flex flex-col items-start gap-1">
                        <span>{option.label}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {option.meta ?? option.id}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              {sectionKicker(bootstrap.labels.views)}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {bootstrap.options.pages.map((option) => {
                  const href = navHref({ ...route, page: option.id as AppRoute["page"] });
                  const active = route.page === option.id;

                  return (
                    <a
                      key={option.id}
                      className={navButtonClass(active)}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ page: option.id as AppRoute["page"] });
                      }}
                    >
                      <span>{option.label}</span>
                    </a>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-4">
          {loading && !payload ? (
            <Card>
              <CardContent className="p-6">
                <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
                  <h3 className="text-lg font-semibold">{bootstrap.labels.loading}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {bootstrap.labels.loadingMessage}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {!loading && error ? (
            <Card>
              <CardContent className="space-y-4 p-6">
                <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
                  <h3 className="text-lg font-semibold">{bootstrap.labels.requestFailed}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{error}</p>
                </div>
                <button
                  className={buttonVariants({ size: "lg" })}
                  type="button"
                  onClick={() => {
                    setReloadToken((current) => current + 1);
                  }}
                >
                  {bootstrap.labels.retry}
                </button>
              </CardContent>
            </Card>
          ) : null}

          {deferredPayload ? (
            <>
              <SummarySection cards={deferredPayload.summaryCards} bootstrap={bootstrap} />
              <ChartSection payload={deferredPayload} bootstrap={bootstrap} />
              <DetailSection payload={deferredPayload} />
            </>
          ) : null}

          <div className="px-2 pb-6 text-center text-sm text-muted-foreground">
            {bootstrap.labels.footer}
          </div>
        </main>
      </div>
    </div>
  );
}
