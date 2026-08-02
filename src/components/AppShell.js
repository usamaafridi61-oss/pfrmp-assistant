"use client";

import { useData } from "@/context/DataContext";

export default function AppShell({ children }) {
  const { hydrated } = useData();

  if (!hydrated) {
    return (
      <main className="container">
        <p className="sub">Loading PFRMP Assistant…</p>
      </main>
    );
  }

  return children;
}
