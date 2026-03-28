import {
  Fragment,
  startTransition,
  useDeferredValue,
  useEffect,
  useRef,
  useState
} from "react";
import { ChevronDown, Moon, Sun } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
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

function SummarySection({
  cards,
  bootstrap
}: {
  cards: SummaryCard[];
  bootstrap: Bootstrap;
}) {
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const activeCard = cards.find((card) => card.id === activeCardId);

  useEffect(() => {
    setActiveCardId(undefined);
  }, [cards]);

  return (
    <Card>
      <CardContent>
        {cards.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-secondary/60 p-6">
            <h3 className="text-lg font-semibold">{bootstrap.labels.noTrafficDataTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {bootstrap.labels.noTrafficDataMessage}
            </p>
          </div>
        ) : (
          <Tabs
            value={activeCardId}
            onValueChange={setActiveCardId}
            className="w-full"
          >
            <ScrollArea className="w-full whitespace-nowrap">
              <TabsList className="h-auto w-max gap-2 bg-transparent p-0">
                {cards.map((card) => (
                  <TabsTrigger
                    key={card.id}
                    value={card.id}
                    className="h-auto min-w-[168px] flex-col items-start gap-2 rounded-[1.35rem] border border-border bg-card/90 px-4 py-4 text-left data-[state=active]:border-[var(--accent-strong)] data-[state=active]:bg-card"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {card.label}
                    </span>
                    <span className="text-xl font-semibold tracking-tight text-card-foreground">
                      {card.formatted.total}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {activeCard ? (
              <TabsContent key={activeCard.id} value={activeCard.id}>
                <Card className="rounded-[24px] border-border/80 bg-card/95 shadow-none">
                  <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                    <div className="rounded-2xl bg-[var(--rx-soft)] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {bootstrap.labels.in}
                      </p>
                      <p className="mt-2 font-mono text-base font-semibold">
                        {activeCard.formatted.rx}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[var(--tx-soft)] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {bootstrap.labels.out}
                      </p>
                      <p className="mt-2 font-mono text-base font-semibold">
                        {activeCard.formatted.tx}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

function ChartSection({
  payload,
  bootstrap,
  route,
  navigate
}: {
  payload: AppPayload;
  bootstrap: Bootstrap;
  route: AppRoute;
  navigate: (partial: Partial<AppRoute>) => void;
}) {
  const chartClass =
    payload.chart.size === "small" ? "h-[220px] md:h-[250px]" : "h-[280px] md:h-[360px]";

  return (
    <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          {sectionKicker(bootstrap.labels.visualization)}
          <CardTitle>{payload.chart.title}</CardTitle>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <CardDescription className="max-w-xl text-sm leading-6 sm:text-right">
            {payload.chart.description}
          </CardDescription>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {bootstrap.labels.chartSize}
            </span>
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
      </CardHeader>
      <CardContent>
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

function DetailSection({
  payload,
  bootstrap
}: {
  payload: AppPayload;
  bootstrap: Bootstrap;
}) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedRowId(null);
  }, [payload.detail.kind, payload.detail.rows]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        {sectionKicker(bootstrap.labels.details)}
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
                      <TableHead>{bootstrap.labels.period}</TableHead>
                      <TableHead className="text-right">{bootstrap.labels.total}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payload.detail.rows.map((row) => (
                      <Fragment key={row.id}>
                        <TableRow
                          className="cursor-pointer"
                          onClick={() => {
                            setExpandedRowId((current) =>
                              current === row.id ? null : row.id
                            );
                          }}
                        >
                          <TableCell className="font-semibold">{row.label}</TableCell>
                          <TableCell className="text-right font-mono text-[var(--accent-strong)]">
                            {row.formatted.total}
                          </TableCell>
                        </TableRow>
                        {expandedRowId === row.id ? (
                          <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                            <TableCell colSpan={2}>
                              <div className="grid gap-3 py-2 md:grid-cols-2">
                                <div className="rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {bootstrap.labels.in}
                                  </p>
                                  <p className="mt-1 font-mono text-sm font-semibold">
                                    {row.formatted.rx}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    {bootstrap.labels.out}
                                  </p>
                                  <p className="mt-1 font-mono text-sm font-semibold">
                                    {row.formatted.tx}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {payload.detail.rows.map((row) => (
                <Card key={`${row.id}-mobile`} className="rounded-[22px] border-border/80 bg-card/95 shadow-none">
                  <CardContent className="p-4">
                    <button
                      className="flex w-full items-center justify-between gap-4 text-left"
                      type="button"
                      onClick={() => {
                        setExpandedRowId((current) =>
                          current === row.id ? null : row.id
                        );
                      }}
                    >
                      <span className="text-base font-semibold">{row.label}</span>
                      <span className="font-mono text-sm font-semibold text-[var(--accent-strong)]">
                        {row.formatted.total}
                      </span>
                    </button>
                    {expandedRowId === row.id ? (
                      <dl className="mt-4 grid gap-2">
                        <div className="flex items-center justify-between rounded-2xl bg-[var(--rx-soft)] px-4 py-3">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {bootstrap.labels.in}
                          </dt>
                          <dd className="font-mono text-sm">{row.formatted.rx}</dd>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-[var(--tx-soft)] px-4 py-3">
                          <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                            {bootstrap.labels.out}
                          </dt>
                          <dd className="font-mono text-sm">{row.formatted.tx}</dd>
                        </div>
                      </dl>
                    ) : null}
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
  const interfaceMenuRef = useRef<HTMLDetailsElement | null>(null);

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

  const currentInterface =
    bootstrap.options.ifaces.find((option) => option.id === route.iface) ??
    bootstrap.options.ifaces[0];
  const nextStyle = route.style === "dark" ? "light" : "dark";
  const nextStyleOption =
    bootstrap.options.styles.find((option) => option.id === nextStyle) ??
    bootstrap.options.styles[0];
  const nextStyleHref = navHref({ ...route, style: nextStyleOption?.id ?? nextStyle });

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-40 border-b border-border bg-[color:var(--surface)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <details ref={interfaceMenuRef} className="group relative shrink-0">
            <summary
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "flex h-auto min-w-[180px] list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left shadow-none [&::-webkit-details-marker]:hidden"
              )}
            >
              <span className="flex flex-col items-start gap-1">
                <span className="flex items-center gap-2">
                  <span>{currentInterface?.label ?? route.iface}</span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {currentInterface?.meta ?? route.iface}
                  </span>
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute left-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-[1.35rem] border border-border bg-card p-2 shadow-[var(--shadow)]">
              <div className="grid gap-1">
                {bootstrap.options.ifaces.map((option) => {
                  const href = navHref({ ...route, iface: option.id });
                  const active = route.iface === option.id;

                  return (
                    <a
                      key={option.id}
                      className={cn(
                        buttonVariants({
                          variant: active ? "secondary" : "ghost",
                          size: "sm"
                        }),
                        "h-auto justify-between rounded-xl px-3 py-3 text-left"
                      )}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        interfaceMenuRef.current?.removeAttribute("open");
                        navigate({ iface: option.id });
                      }}
                    >
                      <span className="flex flex-col items-start gap-1">
                        <span>{option.label}</span>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {option.meta ?? option.id}
                        </span>
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          </details>

          <a
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "shrink-0 rounded-full"
            )}
            href={nextStyleHref}
            aria-label={`${bootstrap.labels.themeWord}: ${nextStyleOption?.label ?? nextStyle}`}
            title={`${bootstrap.labels.themeWord}: ${nextStyleOption?.label ?? nextStyle}`}
            onClick={(event) => {
              event.preventDefault();
              navigate({ style: nextStyleOption?.id ?? nextStyle });
            }}
          >
            {route.style === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                {sectionKicker(bootstrap.labels.overview)}
                <h1 className="text-2xl font-semibold tracking-tight">
                  {bootstrap.labels.summaryTitle}
                </h1>
              </div>
            </div>
            <Tabs value={route.page} className="w-full">
              <ScrollArea className="w-full whitespace-nowrap">
                <TabsList className="h-auto w-max gap-2 bg-transparent p-0">
                  {bootstrap.options.pages.map((option) => {
                    const href = navHref({
                      ...route,
                      page: option.id as AppRoute["page"]
                    });

                    return (
                      <TabsTrigger
                        key={option.id}
                        value={option.id}
                        className="min-w-[108px] rounded-full border border-border bg-card/90 px-5 py-3 text-sm data-[state=active]:border-[var(--accent-strong)] data-[state=active]:bg-card"
                        asChild
                      >
                        <a
                          href={href}
                          aria-current={route.page === option.id ? "page" : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            navigate({ page: option.id as AppRoute["page"] });
                          }}
                        >
                          {option.label}
                        </a>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </Tabs>
          </section>

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
              <ChartSection
                payload={deferredPayload}
                bootstrap={bootstrap}
                route={route}
                navigate={navigate}
              />
              <DetailSection payload={deferredPayload} bootstrap={bootstrap} />
            </>
          ) : null}

          <div className="px-2 pb-6 text-center text-sm text-muted-foreground">
            {bootstrap.labels.footer}
          </div>
          </main>
        </div>
      </div>
    </div>
  );
}
