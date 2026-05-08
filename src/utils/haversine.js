/**
 * Haversine formula: calculates the great-circle distance between two points
 * on a sphere given their longitudes and latitudes.
 * Returns distance in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate speed in km/h given two positions and their timestamps
 */
export function calculateSpeed(pos1, pos2) {
  const dist = haversineDistance(
    pos1.latitude, pos1.longitude,
    pos2.latitude, pos2.longitude
  );
  const timeDiff = (pos2.timestamp - pos1.timestamp) / 3600; // hours
  if (timeDiff <= 0) return 0;
  return dist / timeDiff;
}
