"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import Filters from "@/components/Filters";
import ProgressBar from "@/components/ProgressBar";
import { applyFilterNavigation } from "@/lib/filterNavigation";
import { getInterventionSummaries } from "@/lib/metrics";

export default function InterventionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useData();
  const [filters, setFilters] = useState({
    region: "all",
    divisionId: "all",
    planningUnitId: "all",
    interventionId: "all",
    search: "",
  });

  const summaries = useMemo(() => {
    let rows = getInterventionSummaries(data, filters);
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q));
    }
    return rows;
  }, [data, filters]);

  function handleFilterChange(next) {
    if (applyFilterNavigation(router, pathname, filters, next)) return;
    setFilters(next);
  }

  return (
    <main className="container">
      <h1>Interventions</h1>
      <p className="sub">All {data.interventionsMaster.length} PFRMP interventions with program totals.</p>

      <section className="grid">
        <div className="card col-12">
          <Filters data={data} filters={filters} onChange={handleFilterChange} />
        </div>
        <div className="card col-12">
          <div className="list">
            {summaries.map((row) => (
              <Link key={row.id} href={`/interventions/${row.id}`} className="item link-item">
                <div className="item-header">
                  <strong>{row.name}</strong>
                  <span>{Math.round(row.progressPct)}%</span>
                </div>
                <ProgressBar percent={row.progressPct} />
                <p className="small">
                  Target: {row.target.toLocaleString()} | Achieved: {row.achieved.toLocaleString()} | PUs: {row.puCovered}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
