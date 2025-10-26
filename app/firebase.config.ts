import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase Web App configuration
// Get this from Firebase Console → Project Settings → Your apps → Web app (</>)
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAG6yHPK2BQa4kmSpFOOFtjTAR23EtaCKI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "medicine-tracker-6a017.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "medicine-tracker-6a017",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "medicine-tracker-6a017.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "935829422407",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "YOUR_WEB_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
