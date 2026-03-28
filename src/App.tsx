import { startTransition, useEffect, useState } from "react";
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
import { buildSearch, fetchAppPayload, parseRoute, type AppRoute } from "./lib/api";
import { formatCompactKbytes, tooltipRows } from "./lib/format";
import type {
  AppPayload,
  Bootstrap,
  DetailRow,
  GraphKey,
  NavOption,
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
    <div className="chart-tooltip">
      <h3>{row.label}</h3>
      <dl>
        {tooltipRows(row, labels).map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
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

function currentIfaceLabel(bootstrap: Bootstrap, iface: string) {
  const match = bootstrap.options.ifaces.find((option) => option.id === iface);
  return match?.label ?? iface;
}

function SummarySection({
  cards,
  bootstrap
}: {
  cards: SummaryCard[];
  bootstrap: Bootstrap;
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{bootstrap.labels.overview}</p>
          <h2>{bootstrap.labels.summaryTitle}</h2>
        </div>
        <p className="panel-description">{bootstrap.labels.summaryDescription}</p>
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <h3>{bootstrap.labels.noTrafficDataTitle}</h3>
          <p>{bootstrap.labels.noTrafficDataMessage}</p>
        </div>
      ) : (
        <div className="summary-grid">
          {cards.map((card) => (
            <article className="metric-card" key={card.id}>
              <p className="metric-label">{card.label}</p>
              <p className="metric-total">{card.formatted.total}</p>
              <div className="metric-breakdown">
                <div className="metric-pair metric-pair-in">
                  <span className="metric-caption">{bootstrap.labels.in}</span>
                  <strong>{card.formatted.rx}</strong>
                </div>
                <div className="metric-pair metric-pair-out">
                  <span className="metric-caption">{bootstrap.labels.out}</span>
                  <strong>{card.formatted.tx}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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
    payload.chart.size === "small" ? "chart-shell chart-shell-small" : "chart-shell chart-shell-large";

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{bootstrap.labels.visualization}</p>
          <h2>{payload.chart.title}</h2>
        </div>
        <p className="panel-description">{payload.chart.description}</p>
      </div>

      {payload.chart.points.length === 0 ? (
        <div className="empty-state chart-empty">
          <h3>{bootstrap.labels.noChartDataTitle}</h3>
          <p>{bootstrap.labels.noChartDataMessage}</p>
        </div>
      ) : (
        <div className="graph-frame">
          <div className={chartClass}>
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
    </section>
  );
}

function DetailSection({ payload }: { payload: AppPayload }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Details</p>
          <h2>{payload.detail.title}</h2>
        </div>
      </div>

      {payload.detail.rows.length === 0 ? (
        <div className="empty-state">
          <h3>{payload.detail.emptyTitle}</h3>
          <p>{payload.detail.emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="table-scroll">
            <table className="traffic-table">
              <caption className="sr-only">{payload.detail.title}</caption>
              <thead>
                <tr>
                  <th scope="col">{window.__VNSTAT_BOOTSTRAP__?.labels.period ?? "Period"}</th>
                  <th scope="col">{window.__VNSTAT_BOOTSTRAP__?.labels.in ?? "In"}</th>
                  <th scope="col">{window.__VNSTAT_BOOTSTRAP__?.labels.out ?? "Out"}</th>
                  <th scope="col">{window.__VNSTAT_BOOTSTRAP__?.labels.total ?? "Total"}</th>
                </tr>
              </thead>
              <tbody>
                {payload.detail.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.label}</th>
                    <td className="numeric">{row.formatted.rx}</td>
                    <td className="numeric">{row.formatted.tx}</td>
                    <td className="numeric total-cell">{row.formatted.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="traffic-list">
            {payload.detail.rows.map((row) => (
              <article className="traffic-item" key={`${row.id}-mobile`}>
                <h3>{row.label}</h3>
                <dl className="traffic-stats">
                  <div>
                    <dt>{window.__VNSTAT_BOOTSTRAP__?.labels.in ?? "In"}</dt>
                    <dd>{row.formatted.rx}</dd>
                  </div>
                  <div>
                    <dt>{window.__VNSTAT_BOOTSTRAP__?.labels.out ?? "Out"}</dt>
                    <dd>{row.formatted.tx}</dd>
                  </div>
                  <div>
                    <dt>{window.__VNSTAT_BOOTSTRAP__?.labels.total ?? "Total"}</dt>
                    <dd className="traffic-total">{row.formatted.total}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default function App({ bootstrap }: AppProps) {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.search, bootstrap)
  );
  const [payload, setPayload] = useState<AppPayload | null>(null);
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
    <div className="app-shell page-shell">
      <aside className="sidebar">
        <section className="nav-card">
          <p className="nav-card-title">{bootstrap.labels.interfaces}</p>
          <ul className="iface-list">
            {bootstrap.options.ifaces.map((option) => {
              const href = navHref({ ...route, iface: option.id });
              const active = route.iface === option.id;

              return (
                <li key={option.id}>
                  <a
                    className={`iface-link${active ? " active" : ""}`}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate({ iface: option.id });
                    }}
                  >
                    <span className="iface-link-title">{option.label}</span>
                    <span className="iface-link-meta">{option.meta ?? option.id}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="nav-card">
          <p className="nav-card-title">{bootstrap.labels.views}</p>
          <ul className="view-list">
            {bootstrap.options.pages.map((option) => {
              const href = navHref({ ...route, page: option.id as AppRoute["page"] });
              const active = route.page === option.id;

              return (
                <li key={option.id}>
                  <a
                    className={`view-link${active ? " active" : ""}`}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={(event) => {
                      event.preventDefault();
                      navigate({ page: option.id as AppRoute["page"] });
                    }}
                  >
                    {option.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="nav-card">
          <p className="nav-card-title">{bootstrap.labels.settings}</p>
          <div className="settings-stack">
            <section className="settings-group">
              <p className="settings-label">{bootstrap.labels.chartSize}</p>
              <div className="segmented-control">
                {bootstrap.options.graphs.map((option) => {
                  const href = navHref({
                    ...route,
                    graph: option.id as GraphKey
                  });
                  const active = route.graph === option.id;

                  return (
                    <a
                      key={option.id}
                      className={`segment${active ? " active" : ""}`}
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
            </section>

            <section className="settings-group">
              <p className="settings-label">{bootstrap.labels.themes}</p>
              <div className="theme-grid">
                {bootstrap.options.styles.map((option) => {
                  const href = navHref({ ...route, style: option.id });
                  const active = route.style === option.id;

                  return (
                    <a
                      key={option.id}
                      className={`theme-link${active ? " active" : ""}`}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        navigate({ style: option.id });
                      }}
                    >
                      <span>{option.label}</span>
                      <span className="theme-chip">{bootstrap.labels.themeWord}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </aside>

      <main className="content">
        {loading && !payload ? (
          <section className="panel status-panel">
            <div className="empty-state">
              <h3>{bootstrap.labels.loading}</h3>
              <p>{bootstrap.labels.loadingMessage}</p>
            </div>
          </section>
        ) : null}

        {!loading && error ? (
          <section className="panel status-panel">
            <div className="empty-state">
              <h3>{bootstrap.labels.requestFailed}</h3>
              <p>{error}</p>
            </div>
            <div className="status-actions">
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  setReloadToken((current) => current + 1);
                }}
              >
                {bootstrap.labels.retry}
              </button>
            </div>
          </section>
        ) : null}

        {payload ? (
          <>
            <SummarySection cards={payload.summaryCards} bootstrap={bootstrap} />
            <ChartSection payload={payload} bootstrap={bootstrap} />
            <DetailSection payload={payload} />
          </>
        ) : null}

        <footer className="footer">
          <p>{bootstrap.labels.footer}</p>
        </footer>
      </main>
    </div>
  );
}
