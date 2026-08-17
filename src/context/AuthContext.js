"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchJson } from "@/lib/http";

const AuthContext = createContext(null);

const WRITE_ROLES = new Set(["admin", "editor"]);
const PUBLIC_PATHS = ["/login", "/setup"];

async function loadAuthState() {
  try {
    const statusRes = await fetchJson("/api/auth/status");
    if (statusRes.data?.setupRequired) {
      return { status: "setup", user: null };
    }

    const meRes = await fetchJson("/api/auth/me");
    if (!meRes.ok) {
      return { status: "anonymous", user: null };
    }
    return { status: "authenticated", user: meRes.data?.user || null };
  } catch {
    return { status: "anonymous", user: null };
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const pathname = usePathname();
  const router = useRouter();

  const applyAuth = useCallback((next) => {
    setUser(next.user);
    setStatus(next.status);
    return next;
  }, []);

  const refresh = useCallback(async () => {
    return applyAuth(await loadAuthState());
  }, [applyAuth]);

  useEffect(() => {
    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) applyAuth({ status: "anonymous", user: null });
    }, 12000);

    (async () => {
      const next = await loadAuthState();
      if (!cancelled) applyAuth(next);
    })().finally(() => clearTimeout(failSafe));

    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [applyAuth]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setStatus("anonymous");
    router.replace("/login");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      status,
      refresh,
      signOut,
      canWrite: Boolean(user && WRITE_ROLES.has(user.role)),
      isAdmin: user?.role === "admin",
      isPublicPath: PUBLIC_PATHS.includes(pathname),
    }),
    [user, status, refresh, signOut, pathname]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
