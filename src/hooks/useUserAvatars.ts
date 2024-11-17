import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Message } from '../types';

interface UserAvatar {
  userId: string;
  username: string;
  position: google.maps.LatLngLiteral;
  lastUpdate: number;
}

const INACTIVE_THRESHOLD = 5 * 60 * 1000; // 5分間更新がないユーザーは非アクティブとみなす

export function useUserAvatars() {
  const [avatars, setAvatars] = useState<Map<string, UserAvatar>>(new Map());

  useEffect(() => {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const cleanup = onSnapshot(q, (snapshot) => {
      setAvatars(current => {
        const now = Date.now();
        const newAvatars = new Map(current);
        
        // メッセージを配列に変換してタイムスタンプでソート
        const messages = snapshot.docChanges()
          .map(change => ({
            ...change.doc.data() as Message,
            timestamp: change.doc.data().timestamp.toDate()
          }))
          .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

        // ソートされたメッセージを処理
        for (const message of messages) {
          const messageTime = message.timestamp.getTime();
          
          // 非アクティブなユーザーのメッセージは無視
          if (now - messageTime > INACTIVE_THRESHOLD) {
            continue;
          }

          // 移動メッセージまたは初めてのメッセージの場合は位置を更新
          if (message.text === '(移動)' || !newAvatars.has(message.userId)) {
            newAvatars.set(message.userId, {
              userId: message.userId,
              username: message.username,
              position: message.position,
              lastUpdate: messageTime
            });
          } else {
            // 既存のアバターの最終更新時刻のみ更新
            const existingAvatar = newAvatars.get(message.userId)!;
            existingAvatar.lastUpdate = messageTime;
            existingAvatar.username = message.username;
          }
        }

        // 非アクティブなユーザーを削除
        for (const [userId, avatar] of newAvatars.entries()) {
          if (now - avatar.lastUpdate > INACTIVE_THRESHOLD) {
            newAvatars.delete(userId);
          }
        }

        return newAvatars;
      });
    });

    return () => {
      cleanup();
    };
  }, []);

  return Array.from(avatars.values());
}