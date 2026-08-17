"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import NtfpManualEntryForm from "@/components/ntfp/NtfpManualEntryForm";
import AdminEntryActions from "@/components/AdminEntryActions";
import { deleteNtfpProgress } from "@/lib/ntfp/records";
import { formatDate, statusLabel } from "@/lib/ntfp/metrics";

export default function NtfpManualEntryPage() {
  const { data, setData } = useData();
  const { canWrite, isAdmin, user } = useAuth();
  const [editingRecord, setEditingRecord] = useState(null);
  const createdBy = user?.displayName || user?.username || "User";

  const rows = useMemo(() => {
    return [...(data.ntfpProgressRecords || [])]
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
      .slice(0, 80)
      .map((record) => {
        const chain = data.ntfpValueChains.find((c) => c.id === record.valueChainId);
        const item = data.ntfpActionItems.find((i) => i.id === record.actionItemId);
        return { record, chain, item };
      });
  }, [data]);

  return (
    <main className="container">
      <div className="breadcrumb">
        <Link href="/ntfp">NTFP Value Chains</Link> / Manual Data Entry
      </div>

      <div className="page-header-banner">
        <div>
          <h1>NTFP Manual Data Entry</h1>
          <p className="sub">
            Record physical progress and expenditure against Action Plan activities.
            {isAdmin ? " Administrators can edit or delete a submitted record from the list below." : ""}
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/ntfp" className="btn-secondary">
            Value Chains
          </Link>
        </div>
      </div>

      <section className="grid">
        {canWrite ? (
          <div className="card col-12">
            <h3>{editingRecord ? "Edit Progress Record" : "New Progress Record"}</h3>
            <NtfpManualEntryForm
              data={data}
              setData={setData}
              editingRecord={editingRecord}
              createdBy={createdBy}
              onSuccess={() => setEditingRecord(null)}
              onCancel={() => setEditingRecord(null)}
            />
          </div>
        ) : (
          <div className="card col-12">
            <p className="sub">This account can view submitted records but cannot add new ones.</p>
          </div>
        )}

        <div className="card col-12">
          <h3>Submitted NTFP Records</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Value Chain</th>
                  <th>Activity</th>
                  <th>Qty</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  {isAdmin ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ record, chain, item }) => (
                  <tr key={record.id}>
                    <td>{formatDate(record.date)}</td>
                    <td>{chain?.name || "—"}</td>
                    <td>
                      {item?.actionCode ? `${item.actionCode} ` : ""}
                      {item?.actionTitle || record.actionItemId}
                    </td>
                    <td>{record.completedQuantity ?? "—"}</td>
                    <td>
                      {record.resultingProgressPercent != null
                        ? `${Math.round(record.resultingProgressPercent)}%`
                        : "—"}
                    </td>
                    <td>{statusLabel(record.status || "in_progress")}</td>
                    <td>{record.remarks || "—"}</td>
                    {isAdmin ? (
                      <td>
                        <AdminEntryActions
                          isAdmin={isAdmin}
                          onEdit={() => {
                            setEditingRecord(record);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          onDelete={() => {
                            setData(deleteNtfpProgress(data, record.id));
                            if (editingRecord?.id === record.id) setEditingRecord(null);
                          }}
                          deleteLabel="this NTFP progress record"
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 ? <p className="small">No NTFP progress records yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
