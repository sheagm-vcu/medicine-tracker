# Fix Firestore Unavailable Error

## Error Message
```
[firestore/unavailable] The service is currently unavailable. 
This is a most likely a transient condition and may be corrected by retrying with a backoff.
```

## Solution: Create Firestore Database

Firestore needs to be created and enabled in your Firebase Console.

### Step 1: Create Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medicine-tracker-6a017**
3. In the left sidebar, click **Firestore Database**
4. Click **Create database**

### Step 2: Choose Database Mode

You'll be asked to choose a mode:

**For Development (Recommended):**
- Select **Start in test mode**
- Click **Next**
- ⚠️ **Important:** This allows read/write access for 30 days. After that, you'll need to set up security rules.

**For Production:**
- Select **Start in production mode**
- Click **Next**
- You'll need to configure security rules immediately (see Security Rules below)

### Step 3: Choose Location

1. Select a **location** for your database
   - Choose a region closest to your users
   - Example: `us-central1`, `europe-west1`, `asia-southeast1`
2. Click **Enable**

### Step 4: Wait for Database Creation

- Firebase will create your database (usually takes 1-2 minutes)
- You'll see a "Getting started with Cloud Firestore" screen when it's ready

### Step 5: Configure Security Rules (If using test mode)

For test mode, you have temporary access. Later, set up proper security rules:

1. Go to **Firestore Database** → **Rules** tab
2. Update rules to allow authenticated users only:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /medications/{medicationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

3. Click **Publish**

### Step 6: Test the App

After creating Firestore:

1. **Reload the app** in the emulator (press `R` twice in Metro, or shake device)
2. Try signing in again
3. The Firestore errors should be resolved

## Verification

To verify Firestore is working:

1. Go to **Firestore Database** → **Data** tab in Firebase Console
2. You should see empty collections (no data yet)
3. After signing in through your app, you should see:
   - A `users` collection with user documents
   - A `medications` collection when you add medications

## Troubleshooting

### If errors persist after setup:

1. **Wait 2-3 minutes** - Database creation can take a moment to propagate
2. **Check Firebase project** - Make sure you're using the correct project: `medicine-tracker-6a017`
3. **Verify google-services.json** - Ensure it matches your Firebase project
4. **Check network** - Make sure the emulator/device has internet connection
5. **Restart the app** - Fully close and reopen the app

### Common Issues:

- **"Permission denied"** - Check security rules in Firestore Database → Rules
- **"Database not found"** - Ensure you selected the correct Firebase project
- **Still unavailable** - Try waiting a few more minutes, then restart the app

## Next Steps

Once Firestore is set up:
1. ✅ Authentication will work
2. ✅ User data will be saved to Firestore
3. ✅ Medications can be stored and retrieved
4. ⚠️ Set up proper security rules before production use


