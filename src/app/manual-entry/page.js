"use client";

import { useData } from "@/context/DataContext";
import ManualEntryForm from "@/components/ManualEntryForm";

export default function ManualEntryPage() {
  const { data, setData } = useData();

  return (
    <main className="container">
      <h1>Manual Data Entry</h1>
      <p className="sub">Enter target, progress, or correction data against division → planning unit → intervention.</p>

      <section className="grid">
        <div className="card col-12">
          <ManualEntryForm data={data} setData={setData} />
        </div>

        <div className="card col-12">
          <h3>Recent Manual Entries</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Division</th>
                  <th>Planning Unit</th>
                  <th>Intervention</th>
                  <th>Target</th>
                  <th>Achieved</th>
                  <th>Remarks</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...data.manualEntries].reverse().slice(0, 50).map((m) => {
                  const pu = data.planningUnits.find((p) => p.id === m.planningUnitId);
                  const div = data.divisions.find((d) => d.id === m.divisionId);
                  const intv = data.interventionsMaster.find((i) => i.id === m.interventionId);
                  return (
                    <tr key={m.id}>
                      <td>{m.date}</td>
                      <td>{m.entryType}</td>
                      <td>{div?.name}</td>
                      <td>{pu?.name}</td>
                      <td>{intv?.name}</td>
                      <td>{m.targetValue ?? "—"}</td>
                      <td>{m.achievedValue ?? "—"}</td>
                      <td>{m.remarks || "—"}</td>
                      <td>{m.updatedAt?.slice(0, 16)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {data.manualEntries.length === 0 && <p className="small">No manual entries yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
