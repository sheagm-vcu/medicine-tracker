# Fix Firestore Permission Denied Error

## Error Message
```
[firestore/permission-denied] The caller does not have permission to execute the specified operation.
```

## Solution: Update Firestore Security Rules

The Firestore database is created, but the security rules are blocking access. You need to update the rules to allow authenticated users to read/write their data.

### Step 1: Go to Firestore Rules

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medicine-tracker-6a017**
3. Click **Firestore Database** in the left sidebar
4. Click on the **Rules** tab (at the top)

### Step 2: Update Security Rules

Replace the existing rules with the following:

**For Development (Test Mode):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for development only)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production (Recommended):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Medications collection - users can only access their own medications
    match /medications/{medicationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Allow creating new medications with userId matching authenticated user
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
  }
}
```

### Step 3: Publish Rules

1. Paste the rules into the editor
2. Click **Publish** button (top right)
3. Wait for confirmation that rules were published

### Step 4: Test the App

1. **Reload the app** in the emulator:
   - Press `R` twice in Metro terminal, OR
   - Shake device and select "Reload"
2. Try signing in again
3. The permission errors should be resolved

## Which Rules to Use?

### Use Test Mode Rules If:
- ✅ You're in development
- ✅ You want to test quickly
- ✅ You don't need security restrictions yet
- ⚠️ **Warning:** This gives anyone with your Firebase config full access!

### Use Production Rules If:
- ✅ You want proper security from the start
- ✅ You're preparing for production
- ✅ You want to enforce data isolation between users
- ✅ You want to prevent unauthorized access

## Verification

After updating rules:

1. **Rules should show:** "Rules published successfully"
2. **In the app:** Sign in should work without permission errors
3. **In Firebase Console → Firestore → Data:**
   - You should see a `users` collection appear after signing in
   - User documents will be created with the user's UID as the document ID

## Troubleshooting

### Still getting permission errors?

1. **Wait 30 seconds** - Rule changes can take a moment to propagate
2. **Verify you're signed in** - Check that authentication succeeded before trying Firestore operations
3. **Check the Rules tab** - Ensure your rules were saved (should show the rules you pasted)
4. **Try test mode rules first** - If production rules don't work, use test mode temporarily to verify Firestore is working

### Rule Syntax Issues?

- Make sure `rules_version = '2';` is at the top
- Check for typos in `request.auth.uid` (not `request.auth.id`)
- Ensure `resource.data.userId` matches the field name in your documents

## Next Steps

Once rules are working:
1. ✅ Authentication will complete successfully
2. ✅ User data will be saved to Firestore
3. ✅ Medications can be stored and retrieved
4. ⚠️ For production, update to production rules and test thoroughly

