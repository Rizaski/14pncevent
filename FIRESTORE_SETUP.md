# Firestore Security Rules Setup

## Current Status
The application is currently using **localStorage** as a fallback because Firestore security rules are not configured. The app works perfectly with localStorage, but to enable cloud sync, you need to configure Firestore rules.

## How to Configure Firestore Security Rules

### Step 1: Open Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bulksms-d466c**

### Step 2: Navigate to Firestore Rules
1. Click on **Firestore Database** in the left sidebar
2. Click on the **Rules** tab

### Step 3: Update Security Rules

**For Development (Allows all access):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{document=**} {
      allow read, write: if true;
    }
  }
}
```

**For Production (Recommended - Read for all, Write for authenticated users):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /participants/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Step 4: Publish Rules
1. Click the **Publish** button
2. Wait for the rules to deploy (usually takes a few seconds)

### Step 5: Test
1. Refresh your application
2. The app should now connect to Firestore
3. Data will sync to the cloud automatically

## Notes
- The app will continue to work with localStorage if Firestore is unavailable
- All data operations will automatically sync to Firestore once rules are configured
- Existing localStorage data will be migrated to Firestore on first successful connection

