"use client";

import { LAYER_TYPES } from "@/lib/gis/spatial";

export default function SpatialLayerControl({ layers, onToggle, onZoom, onDelete, onExport }) {
  return (
    <div className="layer-panel card">
      <h3>Layers</h3>
      {layers.length === 0 ? (
        <p className="small">No spatial layers uploaded yet.</p>
      ) : (
        <ul className="layer-list">
          {layers.map((layer) => (
            <li key={layer.id} className="layer-item">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={layer.visible !== false}
                  onChange={() => onToggle?.(layer.id)}
                />
                <span>
                  {LAYER_TYPES.find((t) => t.value === layer.layerType)?.label || layer.layerType}
                  {": "}
                  {layer.name}
                </span>
              </label>
              <div className="layer-actions">
                <button type="button" className="btn-sm" onClick={() => onZoom?.(layer.id)}>
                  Zoom
                </button>
                <button type="button" className="btn-sm" onClick={() => onExport?.(layer.id, "kml")}>
                  KML
                </button>
                <button type="button" className="btn-sm" onClick={() => onDelete?.(layer.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
