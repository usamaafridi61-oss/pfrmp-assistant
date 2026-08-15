"use client";

import { useData } from "@/context/DataContext";

export default function AppShell({ children }) {
  const { hydrated } = useData();

  if (!hydrated) {
    return (
      <main className="container">
        <div className="app-loading-state">
          <div className="app-loading-mark" aria-hidden="true" />
          <p className="sub">Loading PFRMP Assistant…</p>
        </div>
      </main>
    );
  }

  return children;
}
