export default function MapPlaceholder() {
  return (
    <div className="map-placeholder" aria-label="Map overview placeholder">
      <div className="map-placeholder-grid">
        {Array.from({ length: 13 }, (_, i) => (
          <div key={i} className="map-placeholder-cell" title={`Division ${i + 1}`} />
        ))}
      </div>
      <p className="small">Geographic map integration can be added here (e.g. Leaflet or Mapbox).</p>
    </div>
  );
}
