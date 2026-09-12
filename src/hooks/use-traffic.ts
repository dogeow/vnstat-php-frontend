import { useEffect, useState } from "react";
import { fetchAppPayload, type AppRoute } from "../lib/api";
import type { AppPayload, Bootstrap } from "../types";

interface TrafficState {
  key: string;
  payload: AppPayload | null;
  receivedAt: Date | null;
  error: string | null;
  loading: boolean;
}

export function useTraffic(bootstrap: Bootstrap, route: AppRoute) {
  const key = JSON.stringify([route.iface, route.page]);
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<TrafficState>({
    key,
    payload: null,
    receivedAt: null,
    error: null,
    loading: true
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((previous) => ({
      key,
      payload: previous.key === key ? previous.payload : null,
      receivedAt: previous.key === key ? previous.receivedAt : null,
      error: null,
      loading: true
    }));

    fetchAppPayload(bootstrap, route, controller.signal)
      .then((payload) => {
        if (!controller.signal.aborted) {
          setState({
            key,
            payload,
            receivedAt: new Date(),
            error: null,
            loading: false
          });
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error:
              reason instanceof Error
                ? reason.message
                : bootstrap.labels.requestFailed
          }));
        }
      });

    return () => controller.abort();
    // Theme changes do not affect traffic counters or trigger another request.
  }, [bootstrap, key, reloadToken]);

  return {
    ...(state.key === key
      ? state
      : { key, payload: null, receivedAt: null, error: null, loading: true }),
    refresh: () => setReloadToken((token) => token + 1)
  };
}
