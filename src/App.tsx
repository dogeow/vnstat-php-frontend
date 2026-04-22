import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState
} from "react";
import { ChartSection } from "./components/dashboard/chart-section";
import { DetailSection } from "./components/dashboard/detail-section";
import { SummarySection } from "./components/dashboard/summary-section";
import { TopBar } from "./components/dashboard/top-bar";
import { ViewTabs } from "./components/dashboard/view-tabs";
import { buildSearch, fetchAppPayload, parseRoute, type AppRoute } from "./lib/api";
import type { AppPayload, Bootstrap } from "./types";

interface AppProps {
  bootstrap: Bootstrap;
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

export default function App({ bootstrap }: AppProps) {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseRoute(window.location.search, bootstrap)
  );
  const [payload, setPayload] = useState<AppPayload | null>(null);
  const displayPayload = useDeferredValue(payload);
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
  }, [bootstrap, reloadToken, route.iface, route.page]);

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

  const payloadMatchesRoute =
    displayPayload?.meta.iface === route.iface &&
    displayPayload?.meta.page === route.page;
  const shouldRenderPayload = Boolean(displayPayload) && (payloadMatchesRoute || loading);
  const showInitialLoading = loading && !displayPayload;
  const showRefreshing = loading && Boolean(displayPayload) && !payloadMatchesRoute;

  return (
    <div className="relative z-10 min-h-screen">
      <TopBar bootstrap={bootstrap} navigate={navigate} route={route} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="space-y-6">
          {shouldRenderPayload && displayPayload ? (
            <SummarySection cards={displayPayload.summaryCards} bootstrap={bootstrap} />
          ) : null}

          <ViewTabs bootstrap={bootstrap} navigate={navigate} route={route} />

          {showRefreshing ? (
            <div className="flex justify-end" aria-live="polite">
              <div className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground surface-shadow-sm">
                {bootstrap.labels.loading}
              </div>
            </div>
          ) : null}

          {showInitialLoading ? (
            <div className="rounded-xl border border-border bg-card p-6 surface-shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                <div>
                  <p className="text-sm font-medium">{bootstrap.labels.loading}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {bootstrap.labels.loadingMessage}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="rounded-xl border border-border bg-card p-6 surface-shadow-sm">
              <p className="text-sm font-medium">{bootstrap.labels.requestFailed}</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
              <button
                className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--surface-strong)] transition-opacity hover:opacity-90"
                type="button"
                onClick={() => {
                  setReloadToken((current) => current + 1);
                }}
              >
                {bootstrap.labels.retry}
              </button>
            </div>
          ) : null}

          {shouldRenderPayload && displayPayload ? (
            <>
              <ChartSection payload={displayPayload} bootstrap={bootstrap} />
              <DetailSection payload={displayPayload} bootstrap={bootstrap} />
            </>
          ) : null}

          <p className="pb-4 text-center text-xs text-muted-foreground">
            {bootstrap.labels.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
