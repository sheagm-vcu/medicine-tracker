// Firebase configuration for Web SDK
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Note: You may need to add a Web app in Firebase Console and get the config
// For now, using values from google-services.json
const firebaseConfig = {
  apiKey: "AIzaSyAG6yHPK2BQa4kmSpFOOFtjTAR23EtaCKI",
  authDomain: "medicine-tracker-6a017.firebaseapp.com",
  projectId: "medicine-tracker-6a017",
  storageBucket: "medicine-tracker-6a017.firebasestorage.app",
  messagingSenderId: "935829422407",
  // appId will be needed when you add a Web app in Firebase Console
  // For now, this should work with the above values
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
