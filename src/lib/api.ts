import type { AppPayload, Bootstrap, GraphKey, PageKey } from "../types";

export interface AppRoute {
  iface: string;
  page: PageKey;
  graph: GraphKey;
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

  return options.some((option) => option.id === candidate) ? candidate : fallback;
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
    graph: validOption(
      params.get("graph"),
      bootstrap.options.graphs,
      bootstrap.request.graph
    ) as GraphKey,
    style: validOption(
      params.get("style"),
      bootstrap.options.styles,
      bootstrap.request.style
    )
  };
}

export function buildSearch(route: AppRoute): string {
  const params = new URLSearchParams({
    if: route.iface,
    page: route.page,
    graph: route.graph,
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
    graph: route.graph,
    style: route.style,
    format: "app"
  });

  const response = await fetch(`${bootstrap.endpoints.data}?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Unexpected response ${response.status}`);
  }

  return (await response.json()) as AppPayload;
}
