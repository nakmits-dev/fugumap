import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useMapStore } from '../store';
import { Message } from './Message';
import { MessageLogModal } from './MessageLogModal';
import { useUserAvatars } from '../hooks/useUserAvatars';
import { UserAvatar } from './UserAvatar';
import { getGeohashForLocation, getGeohashBounds, getNeighborGeohashes } from '../lib/geohash';
import { generateColorFromUserId } from '../lib/colors';
import { getMapPosition } from '../lib/location';

export default function Map() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const overlayRef = useRef<google.maps.OverlayView | null>(null);
  const rangePolygonsRef = useRef<google.maps.Polygon[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [showLogModal, setShowLogModal] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  const userAvatars = useUserAvatars();

  const { 
    userPosition, 
    setUserPosition, 
    setIsDragging, 
    messages, 
    userId,
    readMessageIds,
    subscribeToNearbyMessages,
    isAuthenticated,
  } = useMapStore();

  useEffect(() => {
    const nonMovementMessages = messages.filter(msg => msg.text !== '(移動)');
    setMessageCount(nonMovementMessages.length);
  }, [messages]);

  const visualizeGeohashRange = useCallback(() => {
    if (!mapInstanceRef.current || !userPosition) return;

    rangePolygonsRef.current.forEach(polygon => polygon.setMap(null));
    rangePolygonsRef.current = [];

    const centerHash = getGeohashForLocation(userPosition.lat, userPosition.lng);
    const neighborHashes = getNeighborGeohashes(centerHash);

    neighborHashes.forEach(hash => {
      const bounds = getGeohashBounds(hash);
      const polygon = new google.maps.Polygon({
        paths: [
          { lat: bounds.minLat, lng: bounds.minLng },
          { lat: bounds.minLat, lng: bounds.maxLng },
          { lat: bounds.maxLat, lng: bounds.maxLng },
          { lat: bounds.maxLat, lng: bounds.minLng }
        ],
        strokeColor: '#FF0000',
        strokeOpacity: 0.3,
        strokeWeight: 1,
        fillColor: '#FF0000',
        fillOpacity: 0.1,
        map: mapInstanceRef.current
      });
      rangePolygonsRef.current.push(polygon);
    });
  }, [userPosition]);

  const calculatePixelPosition = useCallback((latLng: google.maps.LatLngLiteral) => {
    const map = mapInstanceRef.current;
    if (!map || !overlayRef.current) return null;

    const projection = overlayRef.current.getProjection();
    if (!projection) return null;

    const point = projection.fromLatLngToContainerPixel(
      new google.maps.LatLng(latLng.lat, latLng.lng)
    );

    return point ? { x: point.x, y: point.y } : null;
  }, []);

  const handleMapChange = useCallback(() => {
    setForceUpdate(prev => prev + 1);
  }, []);

  const handleMapIdle = useCallback(() => {
    handleMapChange();
    visualizeGeohashRange();
  }, [handleMapChange, visualizeGeohashRange]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !isAuthenticated || !userId || !userPosition) return;

    const loader = new Loader({
      apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      version: 'weekly'
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: getMapPosition(),
        zoom: 15,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        },
        draggable: true,
        minZoom: 13,
        maxZoom: 19,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      });

      map.addListener('drag', handleMapChange);
      map.addListener('dragend', handleMapChange);
      map.addListener('zoom_changed', handleMapChange);
      map.addListener('idle', handleMapIdle);

      const overlay = new google.maps.OverlayView();
      overlay.draw = () => {};
      overlay.setMap(map);
      overlayRef.current = overlay;

      mapInstanceRef.current = map;
      visualizeGeohashRange();

      const unsubscribe = subscribeToNearbyMessages();
      return () => {
        unsubscribe();
        rangePolygonsRef.current.forEach(polygon => polygon.setMap(null));
      };
    });
  }, [userPosition, setUserPosition, setIsDragging, userId, subscribeToNearbyMessages, visualizeGeohashRange, handleMapChange, handleMapIdle, isAuthenticated]);

  if (!isAuthenticated || !userId || !userPosition) {
    return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
  }

  const displayableMessages = messages.filter(msg => 
    !readMessageIds.has(msg.id) && msg.text !== '(移動)'
  );

  return (
    <>
      <div ref={mapRef} className="w-full h-full" />
      {mapInstanceRef.current && userAvatars.map(avatar => (
        avatar.username && (
          <UserAvatar
            key={avatar.userId}
            userId={avatar.userId}
            username={avatar.username}
            position={avatar.position}
            isCurrentUser={avatar.userId === userId}
            map={mapInstanceRef.current!}
          />
        )
      ))}
      <button
        onClick={() => setShowLogModal(true)}
        className="fixed top-4 left-4 bg-black/75 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-sm z-50 hover:bg-black/85 transition-colors"
      >
        メッセージ数: {messageCount}
      </button>
      {showLogModal && <MessageLogModal onClose={() => setShowLogModal(false)} />}
      {displayableMessages.map(msg => {
        const pixelPosition = calculatePixelPosition(msg.position);
        if (!pixelPosition) return null;

        return (
          <Message
            key={`${msg.id}-${forceUpdate}`}
            id={msg.id}
            name={msg.username}
            text={msg.text}
            position={pixelPosition}
            color={generateColorFromUserId(msg.userId)}
            isUser={msg.userId === userId}
          />
        );
      })}
    </>
  );
}