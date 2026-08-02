"use client";

import { useRef, useState } from "react";
import { useData } from "@/context/DataContext";
import { IMPORT_CONFIG, runImport } from "@/lib/import";
import { normalizeData } from "@/lib/storage";

export default function ImportPage() {
  const { data, setData } = useData();
  const [importType, setImportType] = useState("btasp_workbook");
  const [importFile, setImportFile] = useState(null);
  const [importMessage, setImportMessage] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [importing, setImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState([]);
  const fileInputRef = useRef(null);

  async function handleImport(e) {
    e.preventDefault();
    const file = importFile ?? fileInputRef.current?.files?.[0] ?? null;
    if (!file) {
      setImportStatus("error");
      setImportMessage("Please select a file first.");
      return;
    }

    setImporting(true);
    setImportStatus("info");
    setImportMessage(`Reading ${file.name}…`);

    try {
      const result = await runImport(importType, file, importType === "btasp_workbook" ? data : null);
      if (!result.ok) {
        setImportStatus("error");
        setImportMessage(result.message);
        return;
      }

      if (result.mode === "btasp_workbook") {
        setData(normalizeData(result.data));
        setImportWarnings(result.meta?.validationWarnings || []);
      } else {
        setImportWarnings([]);
        setData((prev) => ({
          ...prev,
          [result.dataKey]:
            importType === "targets" || importType === "progress_updates"
              ? [...prev[result.dataKey], ...result.records]
              : result.records,
        }));
      }

      setImportStatus("success");
      setImportMessage(result.message);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      setImportStatus("error");
      setImportMessage(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <main className="container">
      <h1>Excel Import</h1>
      <p className="sub">
        Use <strong>BTASP Monitoring Workbook (full)</strong> for the internal monitoring workbook.
        Flat CSV import is for partial updates only.
      </p>

      <section className="grid">
        <div className="card col-8">
          <form onSubmit={handleImport}>
            <label>Dataset</label>
            <select
              value={importType}
              onChange={(e) => {
                setImportType(e.target.value);
                setImportMessage("");
                setImportStatus("");
              }}
            >
              {Object.entries(IMPORT_CONFIG).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
            <label>Excel / CSV file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImportFile(file);
                setImportMessage(file ? `Selected: ${file.name}` : "");
                setImportStatus(file ? "info" : "");
              }}
            />
            <button type="submit" disabled={importing}>
              {importing ? "Importing…" : "Upload and Import"}
            </button>
          </form>
          {importMessage ? (
            <p className={`import-status import-status-${importStatus || "info"}`} role="status">
              {importMessage}
            </p>
          ) : null}
          {importWarnings.length > 0 && (
            <div className="import-warnings">
              <strong>Validation warnings ({importWarnings.length})</strong>
              <ul>
                {importWarnings.slice(0, 20).map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
                {importWarnings.length > 20 && (
                  <li>…and {importWarnings.length - 20} more</li>
                )}
              </ul>
            </div>
          )}
          <p className="small">
            {IMPORT_CONFIG[importType].description ||
              `Required columns: ${IMPORT_CONFIG[importType].required.join(", ")}`}
          </p>
        </div>

        <div className="card col-4">
          <h3>Current Data</h3>
          <ul className="stat-list">
            <li>{data.divisions.length} divisions</li>
            <li>{data.planningUnits.length} planning units</li>
            <li>{data.interventionsMaster.length} interventions</li>
            <li>{data.targets.length} targets</li>
            <li>{data.progressUpdates.length} progress records</li>
            <li>{data.manualEntries.length} manual entries</li>
          </ul>
          <p className="small">
            Re-importing the BTASP workbook replaces workbook-sourced data but preserves manual entries and uploaded documents.
          </p>
        </div>
      </section>
    </main>
  );
}
