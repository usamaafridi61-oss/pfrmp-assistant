"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import { applyCapacityImport, parseCapacityBuildingPlan } from "@/lib/capacityBuilding/import";
import { applyNtfpImport, parseNtfpActionPlanFile } from "@/lib/ntfp/import";
import { createSpatialLayer, parseSpatialFile, LAYER_TYPES } from "@/lib/gis/spatial";
import ImportReviewPanel from "@/components/ntfp/ImportReviewPanel";

export default function ModuleImportPage() {
  const { data, setData } = useData();
  const [mode, setMode] = useState("ntfp");
  const [valueChainId, setValueChainId] = useState("");
  const [documentTotal, setDocumentTotal] = useState("");
  const [review, setReview] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [spatialForm, setSpatialForm] = useState({ name: "", layerType: "plantation_site" });
  const fileRef = useRef(null);

  async function handleParse(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage("Please select a file to import first.");
      setIsSuccess(false);
      return;
    }

    setParsing(true);
    setMessage("");

    try {
      if (mode === "ntfp") {
        const parsed = await parseNtfpActionPlanFile(file);
        if (parsed.validationStatus === "failed") {
          setReview({ type: "ntfp", parsed, fileName: file.name });
          setWarnings(parsed.warnings || []);
          setMessage(parsed.mappingError || "Action Plan import failed. No activities were saved.");
          setIsSuccess(false);
          return;
        }
        setReview({ type: "ntfp", parsed, fileName: file.name });
        setWarnings(parsed.warnings || []);
        setMessage(`Successfully parsed ${parsed.activityCount} activities across ${parsed.groupCount} groups.`);
        setIsSuccess(true);
      } else if (mode === "capacity") {
        const parsed = await parseCapacityBuildingPlan(file);
        setReview({ type: "capacity", parsed, fileName: file.name });
        setWarnings(parsed.warnings || []);
        setMessage(`Successfully parsed ${parsed.items.length} capacity plan rows.`);
        setIsSuccess(true);
      } else {
        const parsed = await parseSpatialFile(file);
        setReview({ type: "spatial", parsed, fileName: file.name });
        setWarnings([]);
        setMessage(`Spatial layer parsed (${parsed.featureCount} features). Review and confirm.`);
        setIsSuccess(true);
      }
    } catch (err) {
      setMessage(`Import Error: ${err.message}`);
      setIsSuccess(false);
      setReview(null);
    } finally {
      setParsing(false);
    }
  }

  function confirmSave() {
    if (!review) return;

    if (review.type === "ntfp") {
      if (review.parsed?.validationStatus === "failed") {
        setMessage(review.parsed.mappingError || "Action Plan import failed. No activities were saved.");
        setIsSuccess(false);
        return;
      }
      if (!valueChainId) {
        setMessage("Please select which NTFP Value Chain this action plan belongs to.");
        setIsSuccess(false);
        return;
      }
      const result = applyNtfpImport(data, valueChainId, review.parsed, {
        documentTotal: documentTotal ? Number(documentTotal) : undefined,
      });
      setData(result.data);
      setWarnings(result.warnings || []);
      const chainName = data.ntfpValueChains.find((c) => c.id === valueChainId)?.name || "Value Chain";
      setMessage(`✓ ${chainName} Action Plan updated successfully with ${review.parsed.activityCount} activities!`);
      setIsSuccess(true);
    } else if (review.type === "capacity") {
      setData(applyCapacityImport(data, review.parsed));
      setMessage("✓ Capacity Building Master Plan saved successfully!");
      setIsSuccess(true);
    } else if (review.type === "spatial") {
      const layer = createSpatialLayer(spatialForm, review.parsed, review.fileName);
      setData((prev) => ({ ...prev, spatialLayers: [...prev.spatialLayers, layer] }));
      setMessage(`✓ Spatial layer "${spatialForm.name || review.fileName}" saved successfully!`);
      setIsSuccess(true);
    }

    setReview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <main className="container">
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link> / <span>Module Data Import</span>
      </div>

      {/* Header Banner */}
      <div className="page-header-banner">
        <div>
          <h1>Module Data Import &amp; Sync</h1>
          <p className="sub">
            Import and update structured action plans for NTFP value chains (Walnut, Honey, etc.), Capacity Building training matrices, or GIS shapefiles.
          </p>
        </div>
        <div className="page-header-actions">
          <Link href="/import" className="btn-secondary">
            📊 BTASP Master Workbook Import
          </Link>
          <Link href="/ntfp" className="btn-secondary">
            NTFP Dashboard
          </Link>
          <Link href="/capacity-building" className="btn-secondary">
            Capacity Building
          </Link>
        </div>
      </div>

      <section className="grid">
        {/* Module Selector Sidebar */}
        <div className="card col-4">
          <div className="card-header-row">
            <h3>Select Module Type</h3>
          </div>
          <div className="module-import-nav">
            <button
              type="button"
              className={mode === "ntfp" ? "module-import-active" : "btn-secondary"}
              onClick={() => {
                setMode("ntfp");
                setReview(null);
                setMessage("");
              }}
            >
              🍯 NTFP Action Plans
            </button>
            <button
              type="button"
              className={mode === "capacity" ? "module-import-active" : "btn-secondary"}
              onClick={() => {
                setMode("capacity");
                setReview(null);
                setMessage("");
              }}
            >
              Capacity Building Matrix
            </button>
            <button
              type="button"
              className={mode === "spatial" ? "module-import-active" : "btn-secondary"}
              onClick={() => {
                setMode("spatial");
                setReview(null);
                setMessage("");
              }}
            >
              GIS / Spatial Layer
            </button>
          </div>

          <div className="module-note" style={{ marginTop: "20px" }}>
            <p className="small muted">
              <strong>NTFP tip:</strong> Use the standard Action Plan Excel columns — S. No, Action,
              Unit, Unit Cost, Qty, Estimated Budget. After upload you will see detected features
              (hierarchy, units, budgets, validation) before confirming import.
            </p>
          </div>
        </div>

        {/* Upload Form Area */}
        <div className="card col-8">
          <div className="card-header-row">
            <h3>
              {mode === "ntfp" && "Upload NTFP Action Plan"}
              {mode === "capacity" && "Upload Capacity Building Matrix"}
              {mode === "spatial" && "Upload Spatial GeoJSON / Shapefile"}
            </h3>
          </div>

          <form onSubmit={handleParse} className="clean-form">
            {mode === "ntfp" && (
              <>
                <div className="form-item">
                  <label>Target Value Chain *</label>
                  <select
                    value={valueChainId}
                    onChange={(e) => setValueChainId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Value Chain to Update --</option>
                    {data.ntfpValueChains.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.actionPlanPeriod || "Period Pending"})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-item">
                  <label>Expected Total Budget (Optional PKR validation)</label>
                  <input
                    type="number"
                    placeholder="e.g. 52400000"
                    value={documentTotal}
                    onChange={(e) => setDocumentTotal(e.target.value)}
                  />
                </div>
              </>
            )}

            {mode === "spatial" && (
              <>
                <div className="form-item">
                  <label>Layer Display Name</label>
                  <input
                    placeholder="e.g. Swat Walnut Enclosures 2026"
                    value={spatialForm.name}
                    onChange={(e) => setSpatialForm({ ...spatialForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-item">
                  <label>Layer Category</label>
                  <select
                    value={spatialForm.layerType}
                    onChange={(e) => setSpatialForm({ ...spatialForm, layerType: e.target.value })}
                  >
                    {LAYER_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="form-item">
              <label>Select Spreadsheet or Data File (.xlsx, .xls, .csv, .txt, .json)</label>
              <input
                ref={fileRef}
                type="file"
                accept={
                  mode === "spatial"
                    ? ".zip,.shp,.geojson,.json,.kml,.kmz"
                    : ".xlsx,.xls,.csv,.txt,.json"
                }
                required
              />
            </div>

            <div className="form-actions-row">
              <button type="submit" className="btn-primary" disabled={parsing}>
                {parsing ? "Parsing File..." : "🔍 Inspect & Parse File"}
              </button>
            </div>
          </form>

          {message && (
            <div
              className={`import-status ${
                isSuccess ? "import-status-success" : "import-status-error"
              }`}
            >
              {message}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="import-warnings" style={{ marginTop: "14px" }}>
              <strong>Validation Warnings:</strong>
              <ul>
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {review && (
            <div className="import-review-card" style={{ marginTop: "20px" }}>
              <div className="card-header-row">
                <h4>Preview of Parsed File: {review.fileName}</h4>
              </div>

              {review.type === "ntfp" && (
                <ImportReviewPanel parsed={review.parsed} fileName={review.fileName} />
              )}

              {review.type === "capacity" && (
                <div className="review-stat-grid">
                  <div className="review-stat">
                    <span className="muted">Training Courses:</span>
                    <strong>{review.parsed.items.length}</strong>
                  </div>
                  <div className="review-stat">
                    <span className="muted">Planned Events:</span>
                    <strong>{review.parsed.totals.plannedEvents}</strong>
                  </div>
                </div>
              )}

              {review.type === "spatial" && (
                <div className="review-stat-grid">
                  <div className="review-stat">
                    <span className="muted">Features Detected:</span>
                    <strong>{review.parsed.featureCount}</strong>
                  </div>
                  <div className="review-stat">
                    <span className="muted">Geometry Type:</span>
                    <strong>{review.parsed.geometryType}</strong>
                  </div>
                </div>
              )}

              <div className="form-actions-row" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={confirmSave}
                  disabled={review.type === "ntfp" && review.parsed?.validationStatus === "failed"}
                >
                  ✓ Confirm &amp; Save to Master Database
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReview(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
