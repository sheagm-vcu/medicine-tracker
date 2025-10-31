# Fix Google Sign-In DEVELOPER_ERROR

## Issue
The `DEVELOPER_ERROR` occurs when:
1. SHA fingerprints are missing or incorrect in Firebase Console
2. The Web Client ID is incorrect
3. Google Sign-in is not enabled in Firebase Authentication

## Solution Steps

### 1. Add SHA Fingerprints to Firebase Console

**Your current debug keystore fingerprints:**
- **SHA-1:** `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`
- **SHA-256:** `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C`

**Steps:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medicine-tracker-6a017**
3. Click the gear icon ⚙️ next to **Project Overview**
4. Select **Project settings**
5. Scroll down to **Your apps** section
6. Click on your **Android app** (`medicine.tracker`)
7. Click **Add fingerprint**
8. Add both SHA-1 and SHA-256 fingerprints (one at a time):
   - Paste: `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25` (SHA-1)
   - Click **Add**
   - Paste: `FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C` (SHA-256)
   - Click **Add**
9. Click **Save**

### 2. Verify Web Client ID

Your current Web Client ID in `lib/google-signin.ts`:
```
935829422407-gfq7dfrupg4v43u073p0qsmgntg5n91d.apps.googleusercontent.com
```

**To verify this is correct:**
1. In Firebase Console, go to **Project Settings** → **Your apps** → **Android app**
2. Click **"View in Google Cloud Console"** (or go directly to [Google Cloud Console](https://console.cloud.google.com/))
3. Navigate to **APIs & Services** → **Credentials**
4. Look for **OAuth 2.0 Client IDs**
5. Find the **Web client** (should have client_type: 3)
6. Verify the Client ID matches: `935829422407-gfq7dfrupg4v43u073p0qsmgntg5n91d.apps.googleusercontent.com`

### 3. Enable Google Sign-In in Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medicine-tracker-6a017**
3. Go to **Authentication** → **Sign-in method**
4. Find **Google** in the list
5. Click on it
6. Toggle **Enable** to ON
7. Enter a support email
8. Click **Save**

### 4. Rebuild and Test

After adding the SHA fingerprints and enabling Google Sign-in:

1. **Stop Metro bundler** (Ctrl+C)
2. **Clean Android build:**
   ```powershell
   cd android
   .\gradlew clean
   cd ..
   ```
3. **Restart Metro:**
   ```powershell
   npx react-native start --reset-cache
   ```
4. **Rebuild and run:**
   ```powershell
   npx react-native run-android
   ```
5. **Test Google Sign-in** in the app

## Important Notes

- The SHA fingerprints must match your **debug keystore** for development
- For release builds, you'll need to add the SHA fingerprints from your **release keystore**
- Changes to SHA fingerprints in Firebase may take a few minutes to propagate
- Make sure you're using the **Web client ID**, not the Android client ID

## Troubleshooting

If you still see DEVELOPER_ERROR after following these steps:

1. **Wait 5-10 minutes** - Firebase changes can take time to propagate
2. **Double-check** that SHA fingerprints are added correctly (no spaces, correct format)
3. **Verify** the Web Client ID matches exactly
4. **Check** that Google Sign-in is enabled in Firebase Authentication
5. **Ensure** the package name matches: `medicine.tracker`


