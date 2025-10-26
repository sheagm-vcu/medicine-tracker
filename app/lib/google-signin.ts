import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
// You'll need to get the Web client ID from Firebase Console
// Go to: Firebase Console → Project Settings → Your apps → Android app → 
// "View in Google Cloud Console" → Credentials → OAuth 2.0 Client IDs → Web client
GoogleSignin.configure({
  webClientId: '935829422407-gfq7dfrupg4v43u073p0qsmgntg5n91d.apps.googleusercontent.com',
  offlineAccess: true,
});

export { GoogleSignin };
