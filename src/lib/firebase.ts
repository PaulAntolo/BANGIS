import { initializeApp } from 'firebase/app';
// @ts-ignore
import { initializeAuth, getReactNativePersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = (firebaseConfig as any).firestoreDatabaseId 
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId) 
  : getFirestore(app);

export const storage = getStorage(app);

import { Platform } from 'react-native';

// Initialize Firebase Auth with proper persistence based on platform
export const auth = initializeAuth(app, {
  persistence: Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage)
});
