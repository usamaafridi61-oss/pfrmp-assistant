"use client";

import Link from "next/link";
import { useData } from "@/context/DataContext";
import ProgressBar from "@/components/ProgressBar";
import { getDivisionSummaries } from "@/lib/metrics";

export default function DivisionsPage() {
  const { data } = useData();

  return (
    <main className="container">
      <h1>Forest Divisions</h1>
      <p className="sub">{data.divisions.length} forest divisions across the BTASP program.</p>

      <section className="grid">
        {data.divisions.map((div) => {
          const { planningUnits, interventions } = getDivisionSummaries(data, div.id);
          const totalTarget = interventions.reduce((a, b) => a + b.target, 0);
          const totalAchieved = interventions.reduce((a, b) => a + b.achieved, 0);
          const progress = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

          return (
            <Link key={div.id} href={`/divisions/${div.id}`} className="card col-4 link-card">
              <h3>{div.name}</h3>
              <p className="small">{div.region} · {planningUnits.length} PUs</p>
              <ProgressBar percent={progress} />
              <p className="small">Target: {totalTarget.toLocaleString()} | Achieved: {totalAchieved.toLocaleString()}</p>
            </Link>
          );
        })}
        {data.divisions.length === 0 && (
          <div className="card col-12"><p className="small">Import the BTASP workbook to load divisions.</p></div>
        )}
      </section>
    </main>
  );
}
