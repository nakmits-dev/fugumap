export interface Message {
  id: string;
  text: string;
  username: string;
  userId: string;
  position: google.maps.LatLngLiteral;
  geohash: string;
  timestamp: Date;
}