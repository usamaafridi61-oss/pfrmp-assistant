"use client";

import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import Nav from "@/components/Nav";
import AppShell from "@/components/AppShell";

const PUBLIC_PATHS = ["/login", "/setup"];

function LoadingScreen({ message = "Loading PFRMP Assistant…" }) {
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
  const { status, isPublicPath } = useAuth();
  const publicPage = isPublicPath || PUBLIC_PATHS.includes(pathname);

  if (publicPage) return children;

  if (status === "loading" || status === "setup" || status === "anonymous") {
    return <LoadingScreen />;
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
