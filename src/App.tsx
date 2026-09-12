import { lazy, Suspense, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { DetailSection } from "./components/dashboard/detail-section";
import { SummarySection } from "./components/dashboard/summary-section";
import { TopBar } from "./components/dashboard/top-bar";
import { ViewTabs } from "./components/dashboard/view-tabs";
import { useTraffic } from "./hooks/use-traffic";
import { buildSearch, parseRoute, type AppRoute } from "./lib/api";
import { resolveLocale } from "./lib/format";
import { syncTheme } from "./lib/theme";
import type { Bootstrap } from "./types";

const ChartSection = lazy(() =>
  import("./components/dashboard/chart-section").then((module) => ({
    default: module.ChartSection
  }))
);

export default function App({ bootstrap }: { bootstrap: Bootstrap }) {
  const [route, setRoute] = useState(() =>
    parseRoute(window.location.search, bootstrap)
  );
  const { payload, loading, error, receivedAt, refresh } = useTraffic(
    bootstrap,
    route
  );
  const labels = bootstrap.labels;

  useEffect(() => syncTheme(route.style), [route.style]);

  useEffect(() => {
    const handlePopState = () =>
      setRoute(parseRoute(window.location.search, bootstrap));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [bootstrap]);

  useEffect(() => {
    document.title = payload?.meta.documentTitle ?? bootstrap.documentTitle;
  }, [bootstrap.documentTitle, payload]);

  const navigate = (partial: Partial<AppRoute>) => {
    const nextRoute = { ...route, ...partial };
    if (buildSearch(nextRoute) === buildSearch(route)) return;
    // Keep the previous entry explicit so back navigation restores its theme, too.
    window.history.replaceState(
      {},
      "",
      buildSearch(route) + window.location.hash
    );
    window.history.pushState(
      {},
      "",
      buildSearch(nextRoute) + window.location.hash
    );
    setRoute(nextRoute);
  };

  const hasData =
    payload &&
    (payload.summaryCards.length > 0 || payload.detail.rows.length > 0);

  return (
    <div className="min-h-screen">
      <TopBar bootstrap={bootstrap} navigate={navigate} route={route} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:space-y-7 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {labels.dashboard}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {labels.dashboardDescription}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted-foreground" role="status">
              {loading ? (
                payload ? (
                  labels.refreshing
                ) : (
                  labels.loading
                )
              ) : receivedAt ? (
                <>
                  {labels.lastFetched}{" "}
                  <time
                    dateTime={receivedAt.toISOString()}
                    className="tabular-nums"
                  >
                    {receivedAt.toLocaleTimeString(
                      resolveLocale(bootstrap.language),
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                      }
                    )}
                  </time>
                </>
              ) : null}
            </p>
            <button
              type="button"
              className="control-button shrink-0"
              onClick={refresh}
              disabled={loading}
            >
              <RefreshCw
                aria-hidden="true"
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {labels.refresh}
            </button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-[var(--error-border)] bg-[var(--error-bg)] p-4"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 h-5 w-5 shrink-0 text-[var(--error-text)]"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{labels.requestFailed}</p>
              <p className="mt-1 break-words text-sm text-muted-foreground">
                {error}
              </p>
              {payload ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.retainedData}
                </p>
              ) : null}
              <button
                type="button"
                className="control-button mt-3"
                onClick={refresh}
              >
                {labels.retry}
              </button>
            </div>
          </div>
        ) : null}

        {payload && payload.summaryCards.length > 0 ? (
          <SummarySection cards={payload.summaryCards} bootstrap={bootstrap} />
        ) : null}

        <ViewTabs bootstrap={bootstrap} navigate={navigate} route={route} />

        <div aria-busy={loading} className="space-y-6">
          {loading && !payload ? (
            <div className="space-y-4" aria-hidden="true">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <div
                    key={i}
                    className="h-36 animate-pulse rounded-xl border border-border bg-card"
                  />
                ))}
              </div>
              <div className="h-80 animate-pulse rounded-xl border border-border bg-card" />
            </div>
          ) : null}
          {payload && !hasData ? (
            <section className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="font-semibold">{labels.noTrafficDataTitle}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {labels.noTrafficDataMessage}
              </p>
            </section>
          ) : payload ? (
            <>
              <Suspense
                fallback={
                  <div
                    role="status"
                    className="flex h-80 items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground"
                  >
                    {labels.loading}
                  </div>
                }
              >
                <ChartSection
                  key={`${route.iface}-${route.page}`}
                  payload={payload}
                  bootstrap={bootstrap}
                />
              </Suspense>
              <DetailSection
                key={`${route.iface}-${route.page}`}
                payload={payload}
                bootstrap={bootstrap}
              />
            </>
          ) : null}
        </div>
        <footer className="border-t border-border py-5 text-center text-xs text-muted-foreground">
          {labels.footer}
        </footer>
      </main>
    </div>
  );
}
