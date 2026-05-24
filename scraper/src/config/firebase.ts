/**
 * Firebase Admin SDK initialization with 3-method credential waterfall.
 *
 * Priority:
 *   1. serviceAccountKey.json file in project root
 *   2. FIREBASE_SERVICE_ACCOUNT env var (full JSON string)
 *   3. Individual env vars: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

let initialized = false;

function getCredential(): admin.credential.Credential {
  // Method 1: serviceAccountKey.json file
  const keyFilePath = path.resolve(__dirname, '../../serviceAccountKey.json');
  if (fs.existsSync(keyFilePath)) {
    console.log('[Firebase] Using serviceAccountKey.json file');
    const serviceAccount = JSON.parse(fs.readFileSync(keyFilePath, 'utf-8'));
    return admin.credential.cert(serviceAccount);
  }

  // Method 2: FIREBASE_SERVICE_ACCOUNT env var (full JSON string)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('[Firebase] Using FIREBASE_SERVICE_ACCOUNT env var');
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    return admin.credential.cert(serviceAccount);
  }

  // Method 3: Individual env vars
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    console.log('[Firebase] Using individual env vars (PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)');
    return admin.credential.cert({
      projectId,
      clientEmail,
      // Replace escaped newlines with actual newlines (common with env vars)
      privateKey: privateKey.replace(/\\n/g, '\n'),
    });
  }

  throw new Error(
    '[Firebase] No credentials found. Provide one of:\n' +
      '  1. serviceAccountKey.json in scraper/ root\n' +
      '  2. FIREBASE_SERVICE_ACCOUNT env var (JSON string)\n' +
      '  3. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY env vars'
  );
}

/**
 * Initialize Firebase Admin and return the Firestore instance.
 * Safe to call multiple times — only initializes once.
 */
export function initializeFirebase(): FirebaseFirestore.Firestore {
  if (!initialized) {
    admin.initializeApp({
      credential: getCredential(),
    });
    initialized = true;
    console.log('[Firebase] Admin SDK initialized successfully');
  }

  return admin.firestore();
}

/**
 * Singleton Firestore database instance.
 * Lazy-initialized on first access.
 */
let _db: FirebaseFirestore.Firestore | null = null;

export function getDb(): FirebaseFirestore.Firestore {
  if (!_db) {
    _db = initializeFirebase();
  }
  return _db;
}
