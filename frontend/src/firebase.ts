import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase client SDK configuration
// Import the functions 

const firebaseConfig = {
  apiKey: "AIzaSyCa8ZDj8bWWDBzfgwntZgl_FaX9IAxBtHU",
  authDomain: "dear-diary-dd.firebaseapp.com",
  projectId: "dear-diary-dd",
  storageBucket: "dear-diary-dd.firebasestorage.app",
  messagingSenderId: "517968173757",
  appId: "1:517968173757:web:1a1eba462c9bc97c5875d4",
  measurementId: "G-H099LJHX9N"
};


// Verify if the config is present
const isConfigured = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isConfigured) {
  console.warn(
    '⚠️ Firebase configuration is missing.\n' +
    'Please set VITE_FIREBASE_API_KEY, VITE_FIREBASE_PROJECT_ID, and other variables in frontend/.env.'
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export default app;
