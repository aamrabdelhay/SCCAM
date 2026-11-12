"use client";

/** Reads the double-submit CSRF token cookie and calls an admin API. */
export function csrfToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)sccam_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function adminFetch(url: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-csrf-token", csrfToken());
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers, credentials: "same-origin" });
}

export function adminJson(url: string, method: string, data: unknown) {
  return adminFetch(url, { method, body: JSON.stringify(data) });
}
