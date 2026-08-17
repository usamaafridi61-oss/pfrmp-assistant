"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { DEFAULT_DATA, loadData, normalizeData, saveData } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { canWrite, status } = useAuth();
  const [data, setData] = useState(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const failSafe = setTimeout(() => {
      if (!cancelled) setHydrated(true);
    }, 10000);

    async function fetchData() {
      const loaded = await loadData();
      if (cancelled) return;
      skipNextSave.current = true;
      setData(normalizeData(loaded));
      setHydrated(true);
    }

    fetchData().finally(() => clearTimeout(failSafe));
    return () => {
      cancelled = true;
      clearTimeout(failSafe);
    };
  }, [status]);

  useEffect(() => {
    if (!hydrated || !canWrite) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveData(data);
  }, [data, hydrated, canWrite]);

  return (
    <DataContext.Provider value={{ data, setData, hydrated }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
