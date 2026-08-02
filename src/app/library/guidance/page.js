"use client";

import { useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { getGuidanceStatus } from "@/lib/guidance";

export default function GuidanceAdminPage() {
  const { data, setData } = useData();
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  function startEdit(guidance) {
    setEditing(guidance.id);
    setEditForm({
      summary: guidance.summary || "",
      objective: guidance.objective || "",
      stepByStepMethod: (guidance.stepByStepMethod || []).join("\n"),
      approved: guidance.approved !== false,
    });
  }

  function saveEdit(guidanceId) {
    setData((prev) => ({
      ...prev,
      interventionImplementationGuidance: prev.interventionImplementationGuidance.map((g) =>
        g.id === guidanceId
          ? {
              ...g,
              summary: editForm.summary,
              objective: editForm.objective,
              stepByStepMethod: editForm.stepByStepMethod.split("\n").map((s) => s.trim()).filter(Boolean),
              approved: editForm.approved,
              updatedAt: new Date().toISOString(),
            }
          : g
      ),
    }));
    setEditing(null);
  }

  function linkSectionToIntervention(interventionId, sectionText, docId) {
    const intervention = data.interventionsMaster.find((i) => i.id === interventionId);
    const doc = data.docs.find((d) => d.id === docId);
    if (!intervention || !doc) return;

    const now = new Date().toISOString();
    const guidance = {
      id: crypto.randomUUID(),
      interventionId,
      interventionName: intervention.name,
      summary: sectionText.slice(0, 400),
      objective: sectionText.slice(0, 200),
      stepByStepMethod: sectionText.split("\n").map((s) => s.trim()).filter((s) => s.length > 5).slice(0, 15),
      sourceDocumentId: doc.id,
      sourceDocumentTitle: doc.title,
      sourceSections: ["Manually linked"],
      extractedAt: now,
      approved: true,
    };

    setData((prev) => ({
      ...prev,
      interventionImplementationGuidance: [
        ...prev.interventionImplementationGuidance.filter((g) => g.interventionId !== interventionId),
        guidance,
      ],
    }));
  }

  return (
    <main className="container">
      <p className="breadcrumb">
        <Link href="/library">Guidelines Library</Link> / Intervention Advisory Review
      </p>
      <h1>Intervention Guidance Review</h1>
      <p className="sub">
        Review extracted guidance, approve for display, edit corrections, or manually link guideline sections to interventions.
      </p>

      <section className="grid">
        <div className="card col-12">
          <h3>Intervention Coverage</h3>
          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Intervention</th>
                  <th>Category</th>
                  <th>Guidance Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.interventionsMaster.map((intv) => {
                  const status = getGuidanceStatus(data, intv.id);
                  const guidance = data.interventionImplementationGuidance.find((g) => g.interventionId === intv.id);
                  return (
                    <tr key={intv.id}>
                      <td>
                        <Link href={`/interventions/${intv.id}`}>{intv.name}</Link>
                      </td>
                      <td>{intv.category || "—"}</td>
                      <td>
                        <span className={`status-badge status-${status}`}>{status}</span>
                      </td>
                      <td>
                        {guidance ? (
                          <button type="button" className="btn-sm" onClick={() => startEdit(guidance)}>
                            Edit / Approve
                          </button>
                        ) : (
                          <span className="small muted">No guidance linked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.interventionsMaster.length === 0 && (
                  <tr><td colSpan={4}>Import BTASP workbook first to load interventions.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="card col-12">
            <h3>Edit Guidance</h3>
            <label>Summary</label>
            <textarea
              rows={4}
              value={editForm.summary}
              onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
            />
            <label>Objective</label>
            <textarea
              rows={2}
              value={editForm.objective}
              onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
            />
            <label>Step-by-step method (one step per line)</label>
            <textarea
              rows={6}
              value={editForm.stepByStepMethod}
              onChange={(e) => setEditForm({ ...editForm, stepByStepMethod: e.target.value })}
            />
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={editForm.approved}
                onChange={(e) => setEditForm({ ...editForm, approved: e.target.checked })}
              />
              Approve for display in app
            </label>
            <div className="form-actions">
              <button type="button" onClick={() => saveEdit(editing)}>Save</button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card col-12">
          <h3>Manual Link — Guideline Section to Intervention</h3>
          <ManualLinkForm
            interventions={data.interventionsMaster}
            docs={data.docs}
            onLink={linkSectionToIntervention}
          />
        </div>
      </section>
    </main>
  );
}

function ManualLinkForm({ interventions, docs, onLink }) {
  const [interventionId, setInterventionId] = useState("");
  const [docId, setDocId] = useState("");
  const [sectionText, setSectionText] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!interventionId || !docId || !sectionText.trim()) return;
    onLink(interventionId, sectionText, docId);
    setSectionText("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        <div>
          <label>Intervention</label>
          <select value={interventionId} onChange={(e) => setInterventionId(e.target.value)} required>
            <option value="">Select intervention</option>
            {interventions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Source document</label>
          <select value={docId} onChange={(e) => setDocId(e.target.value)} required>
            <option value="">Select document</option>
            {docs.map((d) => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label>Paste guideline section text</label>
          <textarea
            rows={8}
            value={sectionText}
            onChange={(e) => setSectionText(e.target.value)}
            placeholder="Paste the relevant section from Implementation Guidelines…"
            required
          />
        </div>
      </div>
      <button type="submit">Link Section to Intervention</button>
    </form>
  );
}
