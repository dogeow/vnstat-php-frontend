import {
  startTransition,
  useDeferredValue,
  useEffect,
  useState
} from "react";
import { buttonVariants } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
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

  return (
    <div className="relative z-10 min-h-screen">
      <TopBar bootstrap={bootstrap} navigate={navigate} route={route} />

      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-start sm:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                {bootstrap.labels.summaryTitle}
              </h1>
            </div>
            {deferredPayload ? (
              <SummarySection cards={deferredPayload.summaryCards} bootstrap={bootstrap} />
            ) : null}
          </section>

          <hr className="border-border/70" />

          <ViewTabs bootstrap={bootstrap} navigate={navigate} route={route} />

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
              <ChartSection payload={deferredPayload} bootstrap={bootstrap} />
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
