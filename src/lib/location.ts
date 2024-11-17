const DEFAULT_POSITION = {
  lat: 35.6809591,
  lng: 139.7673068
};

export function getMapPosition(): google.maps.LatLngLiteral {
  const url = new URL(window.location.href);
  const lat = parseFloat(url.searchParams.get('lat') || '');
  const lng = parseFloat(url.searchParams.get('lng') || '');

  if (!isNaN(lat) && !isNaN(lng) && isValidLatLng(lat, lng)) {
    return { lat, lng };
  }

  return DEFAULT_POSITION;
}

export function getInitialUserPosition(): google.maps.LatLngLiteral {
  return getMapPosition();
}

function isValidLatLng(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}