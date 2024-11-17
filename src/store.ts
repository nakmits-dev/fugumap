import { create } from 'zustand';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  writeBatch,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './lib/firebase';
import { getGeohashForLocation, getNeighborGeohashes } from './lib/geohash';
import { getMapPosition } from './lib/location';
import type { Message } from './types';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5分

let inactivityTimeout: NodeJS.Timeout | null = null;
let unsubscribeFunctions: (() => void)[] = [];

async function cleanupMessages() {
  const messagesRef = collection(db, 'messages');
  const fiveMinutesAgo = new Date(Date.now() - INACTIVITY_TIMEOUT);
  const q = query(
    messagesRef,
    where('timestamp', '<', Timestamp.fromDate(fiveMinutesAgo))
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

const initialState = {
  messages: [],
  userPosition: null,
  isDragging: false,
  username: localStorage.getItem('fugumap-username') || '',
  userId: null,
  isAuthenticated: false,
  loginTimestamp: null,
  readMessageIds: new Set<string>(),
  isInRange: true,
  lastActivityTimestamp: Date.now(),
};

interface MapStore {
  messages: Message[];
  userPosition: google.maps.LatLngLiteral | null;
  isDragging: boolean;
  username: string;
  userId: string | null;
  isAuthenticated: boolean;
  loginTimestamp: number | null;
  readMessageIds: Set<string>;
  isInRange: boolean;
  lastActivityTimestamp: number;
  reset: () => void;
  initializeAuth: () => Promise<void>;
  addMessage: (text: string) => Promise<void>;
  setUserPosition: (position: google.maps.LatLngLiteral) => void;
  setIsDragging: (isDragging: boolean) => void;
  setUsername: (username: string) => void;
  signIn: () => Promise<void>;
  markMessageAsRead: (messageId: string) => void;
  subscribeToNearbyMessages: () => () => void;
  checkUserInRange: () => void;
  updateActivity: () => void;
  unsubscribeAll: () => void;
}

export const useMapStore = create<MapStore>((set, get) => ({
  ...initialState,

  reset: () => {
    get().unsubscribeAll();
    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = null;
    }
    set(initialState);
  },

  initializeAuth: async () => {
    return new Promise<void>((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          // 既存の状態をリセット
          get().reset();

          if (!user) {
            const userCredential = await signInAnonymously(auth);
            user = userCredential.user;
          }

          await cleanupMessages();

          // URLクエリから位置を取得
          const position = getMapPosition();
          
          const { username } = get();
          set({ 
            userId: user.uid,
            isAuthenticated: true,
            loginTimestamp: Date.now(),
            userPosition: position
          });

          await addDoc(collection(db, 'messages'), {
            text: '(移動)',
            username,
            userId: user.uid,
            position: position,
            geohash: getGeohashForLocation(position.lat, position.lng),
            timestamp: Timestamp.fromDate(new Date()),
          });

          unsubscribe();
          resolve();
        } catch (error) {
          unsubscribe();
          reject(error);
        }
      });
    });
  },

  unsubscribeAll: () => {
    unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    unsubscribeFunctions = [];
  },

  updateActivity: () => {
    const { lastActivityTimestamp } = get();
    const now = Date.now();

    if (now - lastActivityTimestamp > INACTIVITY_TIMEOUT) {
      const { subscribeToNearbyMessages } = get();
      subscribeToNearbyMessages();
    }

    set({ lastActivityTimestamp: now });

    if (inactivityTimeout) {
      clearTimeout(inactivityTimeout);
    }

    inactivityTimeout = setTimeout(() => {
      get().unsubscribeAll();
    }, INACTIVITY_TIMEOUT);
  },

  addMessage: async (text: string) => {
    const { userPosition, username, userId, isInRange, updateActivity } = get();
    if (!userId || !isInRange || !userPosition) return;

    updateActivity();

    const geohash = getGeohashForLocation(userPosition.lat, userPosition.lng);
    const now = new Date();
    
    await addDoc(collection(db, 'messages'), {
      text,
      username,
      userId,
      position: userPosition,
      geohash,
      timestamp: Timestamp.fromDate(now),
    });
  },

  setUserPosition: (position) => {
    const { updateActivity } = get();
    updateActivity();
    set({ userPosition: position });
    const url = new URL(window.location.href);
    url.searchParams.set('lat', position.lat.toString());
    url.searchParams.set('lng', position.lng.toString());
    window.history.replaceState({}, '', url.toString());
  },

  checkUserInRange: () => {
    const { userPosition } = get();
    if (!userPosition) return;
    
    const centerHash = getGeohashForLocation(userPosition.lat, userPosition.lng);
    const neighborHashes = getNeighborGeohashes(centerHash);
    set({ isInRange: true });
  },

  setIsDragging: (isDragging) => {
    const { updateActivity } = get();
    updateActivity();
    set({ isDragging });
  },

  setUsername: (username) => {
    const { updateActivity } = get();
    updateActivity();
    localStorage.setItem('fugumap-username', username);
    set({ username });
  },

  signIn: async () => {
    const { updateActivity } = get();
    updateActivity();
    try {
      const userCredential = await signInAnonymously(auth);
      const now = Date.now();
      set({ 
        userId: userCredential.user.uid,
        isAuthenticated: true,
        loginTimestamp: now,
        readMessageIds: new Set<string>()
      });
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  },

  markMessageAsRead: (messageId: string) => {
    const { updateActivity } = get();
    updateActivity();
    set(state => ({
      readMessageIds: new Set([...state.readMessageIds, messageId])
    }));
  },

  subscribeToNearbyMessages: () => {
    const { userPosition, loginTimestamp, updateActivity } = get();
    if (!userPosition) return () => {};

    const centerHash = getGeohashForLocation(userPosition.lat, userPosition.lng);
    const neighborHashes = getNeighborGeohashes(centerHash);
    
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('geohash', 'in', neighborHashes),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      updateActivity();
      const messages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const messageTimestamp = data.timestamp?.toDate?.() || new Date();

        if (loginTimestamp && messageTimestamp.getTime() >= loginTimestamp) {
          messages.push({
            id: doc.id,
            ...data,
            timestamp: messageTimestamp
          } as Message);
        }
      });

      set({ messages: messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) });
    });

    unsubscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }
}));