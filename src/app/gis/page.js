"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useData } from "@/context/DataContext";
import SpatialMap from "@/components/gis/SpatialMap";
import SpatialLayerControl from "@/components/gis/SpatialLayerControl";
import {
  LAYER_TYPES,
  createSpatialLayer,
  exportLayerToKml,
  parseSpatialFile,
} from "@/lib/gis/spatial";

export default function GisPage() {
  const { data, setData } = useData();
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [popup, setPopup] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    name: "",
    layerType: "plantation_site",
    divisionId: "",
    planningUnitId: "",
  });
  const [preview, setPreview] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef(null);

  const layers = useMemo(() => data.spatialLayers || [], [data.spatialLayers]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError("");
    try {
      const parsed = await parseSpatialFile(file);
      setPreview({ parsed, fileName: file.name });
    } catch (err) {
      setUploadError(err.message);
      setPreview(null);
    }
  }

  function confirmUpload() {
    if (!preview) return;
    const layer = createSpatialLayer(uploadForm, preview.parsed, preview.fileName);
    setData((prev) => ({ ...prev, spatialLayers: [...prev.spatialLayers, layer] }));
    setPreview(null);
    setUploadForm({ name: "", layerType: "plantation_site", divisionId: "", planningUnitId: "" });
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleLayer(id) {
    setData((prev) => ({
      ...prev,
      spatialLayers: prev.spatialLayers.map((l) =>
        l.id === id ? { ...l, visible: l.visible === false } : l
      ),
    }));
  }

  function deleteLayer(id) {
    setData((prev) => ({
      ...prev,
      spatialLayers: prev.spatialLayers.filter((l) => l.id !== id),
    }));
  }

  function exportLayer(id) {
    const layer = layers.find((l) => l.id === id);
    if (!layer) return;
    const kml = exportLayerToKml(layer);
    const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${layer.name}.kml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="container container-wide">
      <div className="breadcrumb">
        <Link href="/">Dashboard</Link> / GIS / Spatial Map
      </div>
      <h1>GIS / Spatial Map</h1>
      <p className="sub">
        Display planning unit boundaries, plantation sites, NTFP locations, and other spatial layers.
      </p>

      <section className="grid gis-layout">
        <div className="col-3">
          <SpatialLayerControl
            layers={layers}
            onToggle={toggleLayer}
            onZoom={setSelectedLayerId}
            onDelete={deleteLayer}
            onExport={exportLayer}
          />

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Upload Spatial Layer</h3>
            <label>Layer Name</label>
            <input value={uploadForm.name} onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })} />
            <label>Layer Type</label>
            <select value={uploadForm.layerType} onChange={(e) => setUploadForm({ ...uploadForm, layerType: e.target.value })}>
              {LAYER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label>Forest Division</label>
            <select value={uploadForm.divisionId} onChange={(e) => setUploadForm({ ...uploadForm, divisionId: e.target.value })}>
              <option value="">—</option>
              {data.divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <label>Planning Unit</label>
            <select value={uploadForm.planningUnitId} onChange={(e) => setUploadForm({ ...uploadForm, planningUnitId: e.target.value })}>
              <option value="">—</option>
              {data.planningUnits.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label>File (ZIP Shapefile, GeoJSON, KML, KMZ)</label>
            <input ref={fileRef} type="file" accept=".zip,.shp,.geojson,.json,.kml,.kmz" onChange={handleFileChange} />
            {uploadError ? <p className="import-status import-status-error">{uploadError}</p> : null}
            {preview ? (
              <div className="import-preview">
                <p className="small">
                  Preview: {preview.parsed.featureCount} feature(s)
                  {preview.parsed.totalAreaHa ? ` · ${preview.parsed.totalAreaHa.toFixed(2)} ha` : ""}
                  {preview.parsed.totalLengthKm ? ` · ${preview.parsed.totalLengthKm.toFixed(2)} km` : ""}
                </p>
                <button type="button" onClick={confirmUpload} disabled={!uploadForm.name}>Confirm Upload</button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="col-9">
          <SpatialMap
            layers={layers}
            selectedLayerId={selectedLayerId}
            onFeatureClick={({ layer, feature }) =>
              setPopup({ layer, name: feature?.getProperty?.("name") || layer.name })
            }
          />
          {popup ? (
            <div className="card map-popup">
              <strong>{popup.name}</strong>
              <p className="small">Layer: {popup.layer.name}</p>
              {popup.layer.totalAreaHa ? <p className="small">Area: {popup.layer.totalAreaHa.toFixed(2)} ha</p> : null}
              <button type="button" className="btn-sm" onClick={() => setPopup(null)}>Close</button>
            </div>
          ) : null}
          <p className="small module-note">
            Satellite-based vegetation indices are supporting monitoring evidence. Field verification remains necessary.
          </p>
        </div>
      </section>
    </main>
  );
}
