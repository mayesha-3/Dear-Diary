import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let credential = null;

if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const rawPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const serviceAccountPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(path.join(__dirname, '..', rawPath));

  if (fs.existsSync(serviceAccountPath)) {
    try {
      credential = admin.cert(JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8')));
    } catch (err) {
      console.error(`✗ Error parsing Firebase Service Account JSON at: ${serviceAccountPath}`, err.message);
    }
  } else {
    console.error(`✗ Firebase Service Account file not found at: ${serviceAccountPath}`);
  }
} else if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY
) {
  credential = admin.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
}

let appInstance = null;

try {
  if (!credential) {
    console.warn('⚠️ No Firebase Admin credentials found in env variables.');
    console.warn('💡 Please set either FIREBASE_SERVICE_ACCOUNT_KEY (path to service account JSON) or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.');
    console.warn('Trying to initialize with application default credentials...');
    appInstance = admin.initializeApp({
      credential: admin.applicationDefault()
    });
    console.log('✓ Firebase Admin SDK initialized using default credentials.');
  } else {
    appInstance = admin.initializeApp({
      credential,
    });
    console.log('✓ Firebase Admin SDK initialized successfully!');
  }
} catch (err) {
  console.error('✗ Failed to initialize Firebase Admin SDK:', err.message);
}

// Get firestore and auth instances
let db = null;
let auth = null;

if (appInstance) {
  try {
    db = getFirestore(appInstance);
    // Set Firestore settings (e.g. ignoreUndefinedProperties) so query payloads with undefined fields don't throw errors
    db.settings({ ignoreUndefinedProperties: true });
    auth = getAuth(appInstance);
  } catch (err) {
    console.error('✗ Failed to get Firestore/Auth instance:', err.message);
  }
}

export const isFirebaseConnected = () => {
  return !!db;
};

export { admin, db, auth };
export default admin;

