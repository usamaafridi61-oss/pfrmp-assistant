"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_DATA, loadData, normalizeData, saveData } from "@/lib/storage";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(DEFAULT_DATA);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const loaded = await loadData();
      setData(normalizeData(loaded));
      setHydrated(true);
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveData(data);
  }, [data, hydrated]);

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
