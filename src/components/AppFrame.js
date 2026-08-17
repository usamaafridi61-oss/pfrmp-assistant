"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import Nav from "@/components/Nav";
import AppShell from "@/components/AppShell";

const PUBLIC_PATHS = ["/login", "/setup"];

function LoadingScreen({ message = "Loading…" }) {
  return (
    <main className="container">
      <div className="app-loading-state">
        <div className="app-loading-mark" aria-hidden="true" />
        <p className="sub">{message}</p>
      </div>
    </main>
  );
}

function AuthedFrame({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, isPublicPath } = useAuth();
  const publicPage = isPublicPath || PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (status === "authenticated" && publicPage) {
      router.replace("/");
      return;
    }
    if (publicPage) return;
    if (status === "setup") {
      router.replace("/setup");
      return;
    }
    if (status === "anonymous") {
      const loginUrl =
        pathname && pathname !== "/" ? `/login?next=${encodeURIComponent(pathname)}` : "/login";
      router.replace(loginUrl);
    }
  }, [status, publicPage, pathname, router]);

  if (publicPage) return children;

  if (status === "loading") {
    return <LoadingScreen message="Loading…" />;
  }

  if (status === "setup" || status === "anonymous") {
    return <LoadingScreen message={status === "anonymous" ? "Opening sign in…" : "Opening setup…"} />;
  }

  return (
    <DataProvider>
      <Nav />
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}

export default function AppFrame({ children }) {
  return (
    <AuthProvider>
      <AuthedFrame>{children}</AuthedFrame>
    </AuthProvider>
  );
}
