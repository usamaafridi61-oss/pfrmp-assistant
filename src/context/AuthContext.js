"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const AuthContext = createContext(null);

const WRITE_ROLES = new Set(["admin", "editor"]);
const PUBLIC_PATHS = ["/login", "/setup"];

async function loadAuthState() {
  try {
    const statusRes = await fetch("/api/auth/status", { cache: "no-store" });
    const statusJson = await statusRes.json();
    if (statusJson.setupRequired) {
      return { status: "setup", user: null };
    }

    const meRes = await fetch("/api/auth/me", { cache: "no-store" });
    if (!meRes.ok) {
      return { status: "anonymous", user: null };
    }

    const me = await meRes.json();
    return { status: "authenticated", user: me.user };
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
    (async () => {
      const next = await loadAuthState();
      if (!cancelled) applyAuth(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyAuth, pathname]);

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
