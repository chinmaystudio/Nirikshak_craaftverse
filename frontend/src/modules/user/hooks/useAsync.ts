import { useCallback, useEffect, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  notFound: boolean;
}

export interface AsyncResult<T> extends AsyncState<T> {
  reload: () => void;
}

export function useAsync<T>(runner: () => Promise<T>, deps: ReadonlyArray<unknown> = []): AsyncResult<T> {
  const [state, setState] = useState<AsyncState<T>>({ data: null, loading: true, error: null, offline: false, notFound: false });
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    runner().then(
      (data) => {
        if (active) setState({ data, loading: false, error: null, offline: false, notFound: false });
      },
      (err: unknown) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        const offline = typeof err === "object" && err !== null && "offline" in err && (err as { offline?: boolean }).offline === true;
        const notFound = typeof err === "object" && err !== null && "notFound" in err && (err as { notFound?: boolean }).notFound === true;
        setState({ data: null, loading: false, error: message, offline, notFound });
      }
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload };
}
