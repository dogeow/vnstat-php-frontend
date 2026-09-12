import type { AppPayload, Bootstrap, PageKey } from "../types";
import { readSavedTheme } from "./theme";

export interface AppRoute {
  iface: string;
  page: PageKey;
  style: string;
}

function validOption(
  candidate: string | null,
  options: Array<{ id: string }>,
  fallback: string
): string {
  if (!candidate) {
    return fallback;
  }

  return options.some((option) => option.id === candidate)
    ? candidate
    : fallback;
}

export function parseRoute(search: string, bootstrap: Bootstrap): AppRoute {
  const params = new URLSearchParams(search);

  return {
    iface: validOption(
      params.get("if"),
      bootstrap.options.ifaces,
      bootstrap.request.iface
    ),
    page: validOption(
      params.get("page"),
      bootstrap.options.pages,
      bootstrap.request.page
    ) as PageKey,
    style: validOption(
      params.get("style") ?? readSavedTheme(),
      bootstrap.options.styles,
      bootstrap.request.style
    )
  };
}

export async function fetchJson<T>(
  url: string,
  messages: { requestFailed: string; requestTimeout: string },
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 15000);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body || typeof body !== "object") {
      throw new Error(
        typeof body?.error === "string"
          ? body.error
          : response.ok
            ? messages.requestFailed
            : `${messages.requestFailed} (HTTP ${response.status})`
      );
    }
    return body as T;
  } catch (reason) {
    if (timedOut) throw new Error(messages.requestTimeout);
    if (controller.signal.aborted) throw reason;
    throw new Error(
      reason instanceof TypeError
        ? messages.requestFailed
        : reason instanceof Error
          ? reason.message
          : messages.requestFailed
    );
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export function buildSearch(route: AppRoute): string {
  const params = new URLSearchParams({
    if: route.iface,
    page: route.page,
    style: route.style
  });

  return `?${params.toString()}`;
}

export async function fetchAppPayload(
  bootstrap: Bootstrap,
  route: AppRoute,
  signal?: AbortSignal
): Promise<AppPayload> {
  const params = new URLSearchParams({
    if: route.iface,
    page: route.page,
    style: route.style,
    format: "app"
  });

  const payload = await fetchJson<AppPayload>(
    `${bootstrap.endpoints.data}?${params.toString()}`,
    bootstrap.labels,
    signal
  );
  if (
    payload.meta?.iface !== route.iface ||
    payload.meta?.page !== route.page ||
    !Array.isArray(payload.summaryCards) ||
    !Array.isArray(payload.chart?.points) ||
    !Array.isArray(payload.detail?.rows)
  ) {
    throw new Error(bootstrap.labels.requestFailed);
  }
  return payload;
}
