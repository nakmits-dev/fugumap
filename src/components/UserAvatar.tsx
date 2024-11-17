import { useEffect, useRef } from 'react';
import { generateColorFromUserId } from '../lib/colors';
import { useMapStore } from '../store';

interface UserAvatarProps {
  userId: string;
  username: string;
  position: google.maps.LatLngLiteral;
  isCurrentUser: boolean;
  map: google.maps.Map;
}

export function UserAvatar({ userId, username, position, isCurrentUser, map }: UserAvatarProps) {
  const markerRef = useRef<google.maps.Marker | null>(null);
  const { setUserPosition, addMessage } = useMapStore();
  const color = generateColorFromUserId(userId);

  useEffect(() => {
    // マーカーが存在しない場合のみ新規作成
    if (!markerRef.current) {
      const marker = new google.maps.Marker({
        map,
        draggable: isCurrentUser,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isCurrentUser ? 14 : 12,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
          labelOrigin: new google.maps.Point(0, 0),
        },
        label: {
          text: username[0].toUpperCase(),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '500',
        },
        title: username,
        zIndex: isCurrentUser ? 1000 : 1,
      });

      if (isCurrentUser) {
        let isDragging = false;

        marker.addListener('dragstart', () => {
          isDragging = true;
          map.setOptions({ draggable: false });
        });

        marker.addListener('dragend', async () => {
          const markerPosition = marker.getPosition();
          if (markerPosition) {
            const newPosition = { lat: markerPosition.lat(), lng: markerPosition.lng() };
            map.panTo(newPosition);
            map.setOptions({ draggable: true });
            setUserPosition(newPosition);
            await addMessage('(移動)');
          }
          isDragging = false;
        });

        marker.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!isDragging) {
            e.stop();
            map.panTo(marker.getPosition()!);
          }
        });
      }

      markerRef.current = marker;
    }

    // 既存のマーカーの位置を更新
    markerRef.current?.setPosition(position);

    // コンポーネントのアンマウント時にマーカーを削除
    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [map, userId, username, isCurrentUser, color, position, setUserPosition, addMessage]);

  return null;
}