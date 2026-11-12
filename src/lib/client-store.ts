"use client";

import { useCallback, useEffect, useState } from "react";

const EVENT = "sccam:store";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStore<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { key } }));
}

export function useLocalStore<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setValue(read<T>(key, fallback));
    setReady(true);
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (!detail || detail.key === key) setValue(read<T>(key, fallback));
    };
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(read<T>(key, fallback)) : next;
      writeStore(key, resolved);
      setValue(resolved);
    },
    [key, fallback],
  );

  const reset = useCallback(() => {
    writeStore(key, fallback);
    setValue(fallback);
  }, [key, fallback]);

  return { value, set: update, reset, ready };
}

/* ---------------- domain stores ---------------- */

export type Bookmark = {
  fileId: string;
  page: number;
  title: string;
  section: string;
  createdAt: string;
};

export type Highlight = {
  id: string;
  fileId: string;
  page: number;
  text: string;
  note?: string;
  createdAt: string;
};

export type Note = {
  fileId: string;
  page: number;
  text: string;
  updatedAt: string;
};

export type LastRead = { page: number; total: number; at: number; title: string; section: string };

export const KEYS = {
  bookmarks: "sccam:bookmarks",
  highlights: "sccam:highlights",
  notes: "sccam:notes",
  lastRead: "sccam:lastread",
  recent: "sccam:recent",
  theme: "sccam:theme",
} as const;

export function recordLastRead(fileId: string, entry: LastRead) {
  const map = read<Record<string, LastRead>>(KEYS.lastRead, {});
  map[fileId] = entry;
  writeStore(KEYS.lastRead, map);
}

export function pushRecentSearch(q: string) {
  if (!q.trim()) return;
  const list = read<string[]>(KEYS.recent, []).filter((x) => x !== q);
  list.unshift(q);
  writeStore(KEYS.recent, list.slice(0, 8));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
