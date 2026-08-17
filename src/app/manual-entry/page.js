"use client";

import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import ManualEntryForm from "@/components/ManualEntryForm";
import AdminEntryActions from "@/components/AdminEntryActions";
import { deleteManualEntry } from "@/lib/storage";
import { useState } from "react";

export default function ManualEntryPage() {
  const { data, setData } = useData();
  const { canWrite, isAdmin, user } = useAuth();
  const [editingEntry, setEditingEntry] = useState(null);
  const createdBy = user?.displayName || user?.username || "User";

  return (
    <main className="container">
      <div className="page-header-banner">
        <div>
          <h1>Manual Data Entry</h1>
          <p className="sub">
            Enter target, progress, or correction data against division → planning unit →
            intervention.
            {isAdmin ? " Administrators can edit or delete a submitted entry from the list below." : ""}
          </p>
        </div>
      </div>

      <section className="grid">
        {canWrite ? (
          <div className="card col-12">
            <h3>{editingEntry ? "Edit Entry" : "New Entry"}</h3>
            <ManualEntryForm
              data={data}
              setData={setData}
              editingEntry={editingEntry}
              createdBy={createdBy}
              onSuccess={() => setEditingEntry(null)}
              onCancel={() => setEditingEntry(null)}
            />
          </div>
        ) : (
          <div className="card col-12">
            <p className="sub">This account can view submitted entries but cannot add new ones.</p>
          </div>
        )}

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
                  {isAdmin ? <th>Actions</th> : null}
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
                      {isAdmin ? (
                        <td>
                          <AdminEntryActions
                            isAdmin={isAdmin}
                            onEdit={() => {
                              setEditingEntry(m);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            onDelete={() => {
                              setData(deleteManualEntry(data, m.id));
                              if (editingEntry?.id === m.id) setEditingEntry(null);
                            }}
                            deleteLabel="this manual entry"
                          />
                        </td>
                      ) : null}
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
