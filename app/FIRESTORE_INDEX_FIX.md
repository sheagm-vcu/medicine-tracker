# Fix Firestore Index Error

## Error Message
```
[firestore/failed-precondition] The query requires an index.
```

## Solution: Create Composite Index

Firestore needs a composite index for queries that combine multiple fields (like `where` + `orderBy` on different fields).

### Quick Fix (Easiest Method)

**The error message includes a direct link!** Click on the URL in the error message:

```
https://console.firebase.google.com/v1/r/project/medicine-tracker-6a017/firestore/indexes?create_composite=Clpwcm9qZWN0cy9tZWRpY2luZS10cmFja2VyLTZhMDE3L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9tZWRpY2lvb25zL2luZGV4ZXMvXxABGgoKBnVzZXJJZBAFGg0KCWNyZWF0ZWRBdBABGgwKCF9fbmFtZV9fEAI
```

1. **Copy the URL** from the error message
2. **Open it in your browser**
3. **Click "Create Index"** button
4. **Wait 1-2 minutes** for the index to build
5. **Reload the app** - the error should be gone

### Manual Method

If the link doesn't work, create the index manually:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medicine-tracker-6a017**
3. Click **Firestore Database** in the left sidebar
4. Click on the **Indexes** tab (at the top)
5. Click **Create Index** button
6. Configure the index:
   - **Collection ID:** `medications`
   - **Fields to index:**
     - Field: `userId` | Order: Ascending
     - Field: `createdAt` | Order: Descending
     - Field: `__name__` | Order: Ascending (if shown)
   - Click **Create**

### What Index is Needed?

The app queries medications by:
- Filtering by `userId` (where userId == current user)
- Ordering by `createdAt` (descending)

This requires a composite index on:
- `userId` (ascending)
- `createdAt` (descending)

### Wait for Index Creation

- Index creation usually takes **1-3 minutes**
- You'll see "Building" status in the Indexes tab
- Status changes to "Enabled" when ready
- The app will work once the index is enabled

### Verification

After creating the index:

1. **Check Indexes tab** - Should show the index with "Enabled" status
2. **Reload the app** - Press `R` twice in Metro, or shake device
3. **Try viewing medications** - The error should be gone

## Troubleshooting

### Index Still Building?

- Wait a few more minutes (can take up to 5 minutes for large databases)
- Check the Indexes tab to see the status
- Don't create duplicate indexes

### Multiple Index Errors?

If you see different index errors, you may need to create additional indexes for:
- Queries with `isActive` filter + `orderBy`
- Queries with `startDate` or `endDate` filters
- Each unique combination needs its own index

### Index Creation Failed?

- Check that you have proper permissions in Firebase Console
- Ensure you're using the correct Firebase project
- Try creating the index again

## Automatic Index Creation

Firestore will automatically suggest indexes when you run queries. The error messages include direct links - just click them and create the indexes as needed.

## Production Considerations

- **Indexes are required** for all composite queries
- **Indexes use storage** but are free within limits
- **Create indexes before deploying** to production to avoid user-facing errors
- **Monitor index usage** in Firebase Console → Usage tab

