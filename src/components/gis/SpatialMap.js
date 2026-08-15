"use client";

import { useEffect, useRef, useState } from "react";

export default function SpatialMap({ layers, selectedLayerId, onFeatureClick }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const dataLayersRef = useRef([]);
  const [mapError, setMapError] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapRef.current) return;

      if (!apiKey) {
        setMapError("Google Maps API key not configured. Showing GeoJSON preview.");
        return;
      }

      try {
        const { Loader } = await import("@googlemaps/js-api-loader");
        const loader = new Loader({ apiKey, version: "weekly" });
        const google = await loader.load();
        if (cancelled) return;

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 34.5, lng: 73.2 },
          zoom: 8,
          mapTypeId: "hybrid",
        });
        googleMapRef.current = map;
        setMapError("");
      } catch (err) {
        setMapError(`Map unavailable: ${err.message}`);
      }
    }

    initMap();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  useEffect(() => {
    const map = googleMapRef.current;
    if (!map || !window.google) return;

    dataLayersRef.current.forEach((layer) => layer.setMap(null));
    dataLayersRef.current = [];

    const visibleLayers = layers.filter((l) => l.visible !== false);
    visibleLayers.forEach((layer) => {
      if (!layer.geoJson) return;
      const dataLayer = new window.google.maps.Data();
      dataLayer.addGeoJson(layer.geoJson);
      dataLayer.setStyle({
        fillColor: layer.id === selectedLayerId ? "#c4a35a" : "#1b6b4a",
        fillOpacity: 0.35,
        strokeColor: "#1b6b4a",
        strokeWeight: 2,
      });
      dataLayer.addListener("click", (event) => {
        onFeatureClick?.({ layer, feature: event.feature });
      });
      dataLayer.setMap(map);
      dataLayersRef.current.push(dataLayer);
    });

    if (visibleLayers.length > 0 && visibleLayers[0].bounds) {
      const [minLon, minLat, maxLon, maxLat] = visibleLayers[0].bounds;
      map.fitBounds({
        west: minLon,
        south: minLat,
        east: maxLon,
        north: maxLat,
      });
    }
  }, [layers, selectedLayerId, onFeatureClick]);

  if (mapError && !apiKey) {
    const visibleLayers = layers.filter((l) => l.visible !== false);
    return (
      <div className="spatial-map-fallback">
        <p className="small">{mapError}</p>
        {visibleLayers.length === 0 ? (
          <p className="sub">Upload a spatial layer to preview geometry here.</p>
        ) : (
          visibleLayers.map((layer) => (
            <div key={layer.id} className="card col-12" style={{ marginBottom: 12 }}>
              <strong>{layer.name}</strong>
              <p className="small">
                {layer.geometryType} · {layer.featureCount} feature(s)
                {layer.totalAreaHa ? ` · ${layer.totalAreaHa.toFixed(2)} ha` : ""}
                {layer.totalLengthKm ? ` · ${layer.totalLengthKm.toFixed(2)} km` : ""}
              </p>
              <pre className="geo-preview">{JSON.stringify(layer.bounds, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="spatial-map-container">
      {mapError ? <p className="small import-status import-status-warn">{mapError}</p> : null}
      <div ref={mapRef} className="spatial-map" aria-label="Spatial map" />
    </div>
  );
}
