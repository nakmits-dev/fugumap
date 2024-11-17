import geohash from 'ngeohash';

const GEOHASH_PRECISION = 6;

export function getGeohashForLocation(lat: number, lng: number): string {
  return geohash.encode(lat, lng, GEOHASH_PRECISION);
}

export function getNeighborGeohashes(centerHash: string): string[] {
  const neighbors = geohash.neighbors(centerHash);
  return [centerHash, ...neighbors];
}

export function getGeohashBounds(hash: string): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  const bounds = geohash.decode_bbox(hash);
  return {
    minLat: bounds[0],
    maxLat: bounds[2],
    minLng: bounds[1],
    maxLng: bounds[3],
  };
}

export function isPositionInGeohashRange(
  position: google.maps.LatLngLiteral,
  geohashes: string[]
): boolean {
  return geohashes.some(hash => {
    const bounds = getGeohashBounds(hash);
    return (
      position.lat >= bounds.minLat &&
      position.lat <= bounds.maxLat &&
      position.lng >= bounds.minLng &&
      position.lng <= bounds.maxLng
    );
  });
}