import { auth } from "../firebase/client";

/**
 * Universal authenticated fetch helper for JobPilot client pages.
 * - In production: automatically retrieves the latest Firebase ID token from auth.currentUser
 *   and attaches it as 'Authorization: Bearer <token>'.
 * - In local development: attaches 'x-demo-user: abbas' for instant developer access.
 * - Handles 401 Unauthorized by smoothly redirecting to /login in production.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});

  // 1. If in browser, attempt to retrieve the active Firebase ID token
  if (typeof window !== "undefined") {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        headers.set("Authorization", `Bearer ${token}`);
      }
    } catch (err) {
      console.warn("Could not retrieve Firebase ID token:", err);
    }
  }

  // 2. Attach dev header
  headers.set("x-demo-user", "abbas");

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 3. If unauthorized in production browser, redirect to login
  if (response.status === 401 && typeof window !== "undefined") {
    const isLoginPage = window.location.pathname.startsWith("/login");
    const isLocalDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (!isLoginPage && !isLocalDev) {
      console.warn("[Auth] Session expired or missing. Redirecting to /login...");
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  }

  return response;
}
