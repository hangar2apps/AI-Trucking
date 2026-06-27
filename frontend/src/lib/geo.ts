const EARTH_RADIUS_M = 6371000;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

export function projectToPercent(
  lat: number,
  lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }
) {
  const x =
    bounds.maxLng === bounds.minLng
      ? 50
      : ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
  const y =
    bounds.maxLat === bounds.minLat
      ? 50
      : ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
  return { x: Math.min(98, Math.max(2, x)), y: Math.min(98, Math.max(2, y)) };
}

export function boundsFromPoints(points: { lat: number; lng: number }[]) {
  if (points.length === 0) {
    return { minLat: 29, maxLat: 33, minLng: -98, maxLng: -95 };
  }
  return {
    minLat: Math.min(...points.map((p) => p.lat)) - 0.3,
    maxLat: Math.max(...points.map((p) => p.lat)) + 0.3,
    minLng: Math.min(...points.map((p) => p.lng)) - 0.3,
    maxLng: Math.max(...points.map((p) => p.lng)) + 0.3,
  };
}
