"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useData } from "@/context/DataContext";
import Filters from "@/components/Filters";
import { applyFilterNavigation } from "@/lib/filterNavigation";

export default function PlanningUnitsPage() {
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

  const units = useMemo(() => {
    let rows = data.planningUnits;
    if (filters.region && filters.region !== "all") rows = rows.filter((p) => p.region === filters.region);
    if (filters.divisionId && filters.divisionId !== "all") rows = rows.filter((p) => p.divisionId === filters.divisionId);
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.divisionName?.toLowerCase().includes(q) ||
          p.region?.toLowerCase().includes(q)
      );
    }
    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [data.planningUnits, filters]);

  function handleFilterChange(next) {
    if (applyFilterNavigation(router, pathname, filters, next)) return;
    setFilters(next);
  }

  return (
    <main className="container">
      <h1>Planning Units</h1>
      <p className="sub">{data.planningUnits.length} planning units across {data.divisions.length} divisions.</p>

      <section className="grid">
        <div className="card col-12">
          <Filters data={data} filters={filters} onChange={handleFilterChange} />
        </div>
        <div className="card col-12">
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Planning Unit</th>
                  <th>Division</th>
                  <th>Region</th>
                  <th>Area (Ha)</th>
                  <th>Population</th>
                  <th>Households</th>
                </tr>
              </thead>
              <tbody>
                {units.map((pu) => (
                  <tr
                    key={pu.id}
                    className="clickable-row"
                    onClick={() => router.push(`/planning-units/${pu.id}`)}
                  >
                    <td>
                      <Link href={`/planning-units/${pu.id}`} onClick={(e) => e.stopPropagation()}>
                        {pu.name}
                      </Link>
                    </td>
                    <td>
                      <Link href={`/divisions/${pu.divisionId}`} onClick={(e) => e.stopPropagation()}>
                        {pu.divisionName}
                      </Link>
                    </td>
                    <td>{pu.region}</td>
                    <td>{pu.areaHa?.toLocaleString() ?? "—"}</td>
                    <td>{pu.population?.toLocaleString() ?? "—"}</td>
                    <td>{pu.totalHouseholds?.toLocaleString() ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
