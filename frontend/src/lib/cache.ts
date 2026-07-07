"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal stale-while-revalidate cache: cached data renders instantly on
 * revisit while a background fetch refreshes it. `loading` is only true on
 * the first-ever load of a key, so navigation never flashes "Loading".
 */
const store = new Map<string, unknown>();

export function useCached<T>(key: string, fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = useState<T | undefined>(() => store.get(key) as T | undefined);
  const [loading, setLoading] = useState(!store.has(key));

  const refresh = useCallback(async () => {
    if (!store.has(key)) setLoading(true);
    try {
      const value = await fetcherRef.current();
      store.set(key, value);
      setData(value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    setData(store.get(key) as T | undefined);
    setLoading(!store.has(key));
    refresh();
  }, [key, refresh]);

  return { data, loading, refresh };
}

/** Drop cached entries whose key starts with the prefix (e.g. after sending). */
export function invalidateCache(prefix = "") {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
