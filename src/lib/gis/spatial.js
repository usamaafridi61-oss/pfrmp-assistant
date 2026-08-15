const EARTH_RADIUS_KM = 6371;

function ringArea(ring) {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [lon1, lat1] = ring[i];
    const [lon2, lat2] = ring[i + 1];
    area += ((lon2 - lon1) * Math.PI) / 180 * (2 + Math.sin((lat1 * Math.PI) / 180) + Math.sin((lat2 * Math.PI) / 180));
  }
  return Math.abs((area * EARTH_RADIUS_KM * EARTH_RADIUS_KM) / 2);
}

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function lineLengthKm(coords) {
  let length = 0;
  for (let i = 1; i < coords.length; i += 1) {
    length += haversineKm(coords[i - 1], coords[i]);
  }
  return length;
}

function getBounds(features) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;

  function visitCoord([lon, lat]) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }

  function visitGeometry(geometry) {
    if (!geometry) return;
    const { type, coordinates } = geometry;
    if (type === "Point") visitCoord(coordinates);
    else if (type === "MultiPoint" || type === "LineString") coordinates.forEach(visitCoord);
    else if (type === "MultiLineString" || type === "Polygon") {
      coordinates.forEach((ring) => ring.forEach(visitCoord));
    } else if (type === "MultiPolygon") {
      coordinates.forEach((poly) => poly.forEach((ring) => ring.forEach(visitCoord)));
    }
  }

  features.forEach((f) => visitGeometry(f.geometry));
  if (!Number.isFinite(minLon)) return [-180, -90, 180, 90];
  return [minLon, minLat, maxLon, maxLat];
}

export function analyzeGeoJson(geoJson) {
  const features = geoJson.type === "FeatureCollection" ? geoJson.features : [geoJson];
  const firstGeom = features[0]?.geometry;
  const geometryType = firstGeom?.type || "Unknown";

  let totalAreaHa = 0;
  let totalLengthKm = 0;

  features.forEach((feature) => {
    const { geometry } = feature;
    if (!geometry) return;
    if (geometry.type === "Polygon") {
      totalAreaHa += ringArea(geometry.coordinates[0]) / 100;
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((poly) => {
        totalAreaHa += ringArea(poly[0]) / 100;
      });
    } else if (geometry.type === "LineString") {
      totalLengthKm += lineLengthKm(geometry.coordinates);
    } else if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((line) => {
        totalLengthKm += lineLengthKm(line);
      });
    }
  });

  return {
    featureCount: features.length,
    geometryType,
    totalAreaHa: totalAreaHa || undefined,
    totalLengthKm: totalLengthKm || undefined,
    bounds: getBounds(features),
    geoJson: { type: "FeatureCollection", features },
  };
}

export function kmlToGeoJson(kmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(kmlText, "text/xml");
  const placemarks = [...doc.getElementsByTagName("Placemark")];
  const features = placemarks
    .map((pm) => {
      const name = pm.getElementsByTagName("name")[0]?.textContent || "Feature";
      const coordsText =
        pm.getElementsByTagName("coordinates")[0]?.textContent?.trim() || "";
      const coords = coordsText
        .split(/\s+/)
        .filter(Boolean)
        .map((pair) => {
          const [lon, lat] = pair.split(",").map(Number);
          return [lon, lat];
        });

      if (coords.length === 0) return null;
      const isPolygon = pm.getElementsByTagName("Polygon").length > 0;
      const isLine = pm.getElementsByTagName("LineString").length > 0;

      let geometry;
      if (isPolygon) {
        geometry = { type: "Polygon", coordinates: [[...coords, coords[0]]] };
      } else if (isLine) {
        geometry = { type: "LineString", coordinates: coords };
      } else {
        geometry = { type: "Point", coordinates: coords[0] };
      }

      return {
        type: "Feature",
        properties: { name },
        geometry,
      };
    })
    .filter(Boolean);

  return { type: "FeatureCollection", features };
}

export async function parseSpatialFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".geojson") || name.endsWith(".json")) {
    const text = await file.text();
    const geoJson = JSON.parse(text);
    return analyzeGeoJson(geoJson);
  }

  if (name.endsWith(".kml")) {
    const text = await file.text();
    return analyzeGeoJson(kmlToGeoJson(text));
  }

  if (name.endsWith(".zip") || name.endsWith(".shp")) {
    const shp = (await import("shpjs")).default;
    const buffer = await file.arrayBuffer();
    const geoJson = await shp(buffer);
    return analyzeGeoJson(Array.isArray(geoJson) ? geoJson[0] : geoJson);
  }

  throw new Error("Unsupported spatial file format.");
}

export function createSpatialLayer(form, parsed, fileName) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: form.name,
    layerType: form.layerType,
    regionId: form.regionId || undefined,
    divisionId: form.divisionId || undefined,
    planningUnitId: form.planningUnitId || undefined,
    valueChainId: form.valueChainId || undefined,
    relatedRecordId: form.relatedRecordId || undefined,
    sourceFormat: fileName.split(".").pop(),
    displayCrs: "EPSG:4326",
    geometryType: parsed.geometryType,
    featureCount: parsed.featureCount,
    totalAreaHa: parsed.totalAreaHa,
    totalLengthKm: parsed.totalLengthKm,
    bounds: parsed.bounds,
    geoJson: parsed.geoJson,
    visible: true,
    createdAt: now,
    updatedAt: now,
  };
}

export function exportLayerToKml(layer) {
  const features = layer.geoJson?.features || [];
  const placemarks = features
    .map((f) => {
      const name = f.properties?.name || layer.name;
      const coords = JSON.stringify(f.geometry?.coordinates || []);
      return `<Placemark><name>${name}</name><ExtendedData><Data name="layerType"><value>${layer.layerType}</value></Data></ExtendedData><Point><coordinates><!-- geometry stored --></coordinates></Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${layer.name}</name>
    ${placemarks}
  </Document>
</kml>`;
}

export const LAYER_TYPES = [
  { value: "pu_boundary", label: "Planning Unit Boundary" },
  { value: "plantation_site", label: "Plantation Site" },
  { value: "existing_plantation", label: "Existing Plantation" },
  { value: "enclosure", label: "Enclosure" },
  { value: "spring_shed", label: "Spring-shed Area" },
  { value: "spring_point", label: "Spring Point" },
  { value: "fire_line", label: "Fire Line" },
  { value: "nursery", label: "Nursery" },
  { value: "ntfp_site", label: "NTFP Site" },
  { value: "value_chain_cluster", label: "Value Chain Cluster" },
  { value: "other", label: "Other" },
];
