import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { RefreshCw } from "lucide-react";
import App from "./App";
import { fetchJson, parseRoute } from "./lib/api";
import { resolveLocale } from "./lib/format";
import { readSavedTheme, syncTheme } from "./lib/theme";
import "./index.css";
import type { Bootstrap } from "./types";

const isChinese = navigator.language.toLowerCase().startsWith("zh");
const bootLabels = {
  loading: isChinese ? "正在加载流量面板…" : "Loading dashboard…",
  requestFailed: isChinese
    ? "无法加载流量面板，请检查连接后重试。"
    : "Unable to load the dashboard. Check your connection and retry.",
  requestTimeout: isChinese
    ? "请求超时，请重试。"
    : "The request timed out. Please retry.",
  retry: isChinese ? "重试" : "Retry"
};

function AppLoader() {
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    const params = new URLSearchParams(window.location.search);
    if (!params.has("style") && readSavedTheme())
      params.set("style", readSavedTheme()!);
    params.set("format", "bootstrap");
    fetchJson<Bootstrap>(
      `api/traffic.php?${params}`,
      bootLabels,
      controller.signal
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        if (
          !data.request ||
          !Array.isArray(data.options?.ifaces) ||
          !data.options.ifaces.length ||
          !Array.isArray(data.options?.pages) ||
          !Array.isArray(data.options?.styles) ||
          !data.labels ||
          !data.endpoints?.data
        ) {
          throw new Error(bootLabels.requestFailed);
        }
        document.documentElement.lang = resolveLocale(data.language);
        syncTheme(parseRoute(window.location.search, data).style);
        setBootstrap(data);
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error ? reason.message : bootLabels.requestFailed
          );
      });
    return () => controller.abort();
  }, [attempt]);

  if (bootstrap) return <App bootstrap={bootstrap} />;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 surface-shadow-sm">
        <p className="text-sm font-semibold" role={error ? "alert" : "status"}>
          {error ?? bootLabels.loading}
        </p>
        {error ? (
          <button
            type="button"
            className="control-button mt-4"
            onClick={() => setAttempt((value) => value + 1)}
          >
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {bootLabels.retry}
          </button>
        ) : (
          <div
            aria-hidden="true"
            className="mt-4 h-1 animate-pulse rounded-full bg-[var(--accent)]"
          />
        )}
      </section>
    </main>
  );
}

const rootElement = document.getElementById("app-root");
if (!rootElement) throw new Error("Missing React mount node.");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <AppLoader />
  </React.StrictMode>
);
