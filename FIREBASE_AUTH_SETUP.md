# Firebase Authentication Setup Guide

## Current Status
The application now uses **Firebase Authentication** for admin login. You need to create an admin user in Firebase Console.

## Step-by-Step Setup

### Step 1: Enable Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bulksms-d466c**
3. Click on **Authentication** in the left sidebar
4. Click **Get Started** (if not already enabled)
5. Go to the **Sign-in method** tab

### Step 2: Enable Email/Password Authentication
1. In the Sign-in method tab, find **Email/Password**
2. Click on it
3. Toggle **Enable** to ON
4. Click **Save**

### Step 3: Create Admin User
1. Go to the **Users** tab in Authentication
2. Click **Add user** button
3. Enter:
   - **Email**: `rixaski@gmail.com`
   - **Password**: Your preferred password
4. Click **Add user**

### Step 4: Test Login
1. Refresh your application
2. Click the admin login icon (top right)
3. Enter:
   - **Email**: `rixaski@gmail.com`
   - **Password**: The password you set in Firebase Console
4. Click **Login**

## Important Notes

- **Admin Email**: The app checks if the logged-in user's email is `rixaski@gmail.com` (case-insensitive)
- **Fallback**: If Firebase Auth is not available, the app falls back to simple localStorage authentication
- **Security**: Only users with email `rixaski@gmail.com` can access the admin panel
- **Password**: You can change the password in Firebase Console → Authentication → Users

## Troubleshooting

### "User not found" error
- Make sure you created the user in Firebase Console
- Check that Email/Password authentication is enabled

### "Access denied" error
- The user exists but email doesn't match `rixaski@gmail.com`
- Create a user with exactly `rixaski@gmail.com` as the email

### Firebase Auth not working
- Check browser console for errors
- Verify Firebase Auth SDK is loaded
- The app will fallback to localStorage authentication if Firebase Auth fails

## Changing Admin Email

If you want to use a different admin email:
1. Update `ADMIN_EMAIL` constant in `app.js` (line 14)
2. Update the email check in `index.html` (line 290)
3. Create a user in Firebase Console with that email
4. Restart the application

