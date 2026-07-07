"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal stale-while-revalidate cache: cached data renders instantly while a
 * background fetch refreshes it. The store is mirrored to localStorage, so
 * data survives page reloads — after a refresh the last known emails render
 * immediately and revalidate in the background.
 */
const STORAGE_KEY = "mail-cache:v1";
const MAX_PERSIST_BYTES = 2_000_000; // stay well under localStorage quotas

const store = new Map<string, unknown>();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    for (const [key, value] of Object.entries(JSON.parse(raw))) {
      if (!store.has(key)) store.set(key, value);
    }
  } catch {
    // corrupted/blocked storage: start fresh
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(Object.fromEntries(store));
    if (raw.length <= MAX_PERSIST_BYTES) localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    // quota exceeded or storage blocked: cache stays memory-only
  }
}

export function useCached<T>(key: string, fetcher: () => Promise<T>) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Initial render must match SSR (empty); hydration happens in the effect.
  const [data, setData] = useState<T | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!store.has(key)) setLoading(true);
    try {
      const value = await fetcherRef.current();
      store.set(key, value);
      persist();
      setData(value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    hydrate();
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
  persist();
}
