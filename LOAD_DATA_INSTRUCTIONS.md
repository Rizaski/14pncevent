# Instructions to Load Excel Data to Firebase

## Option 1: Using Node.js Script (Recommended)

### Step 1: Install Node.js
If you don't have Node.js installed, download it from: https://nodejs.org/

### Step 2: Install Dependencies
Open terminal/command prompt in the project folder and run:
```bash
npm install
```

### Step 3: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bulksms-d466c**
3. Click the gear icon ⚙️ → **Project settings**
4. Go to **Service accounts** tab
5. Click **Generate new private key**
6. Save the JSON file as `firebase-service-account.json` in the project root folder

### Step 4: Run the Script
```bash
npm run load-data
```

This will read `C:\Users\USER\Documents\Participants.xlsx` and upload all data to Firebase.

---

## Option 2: Using the Web App (Easier - No Setup Required)

### Step 1: Open the Application
Open `index.html` in your browser

### Step 2: Login as Admin
1. Click the admin login icon (top right)
2. Email: `admin@example.com`
3. Password: `Admin123`

### Step 3: Upload Excel File
1. In the Admin Panel, click **Choose File** or drag and drop
2. Select `C:\Users\USER\Documents\Participants.xlsx`
3. The data will be automatically imported and saved to Firebase (if rules are configured) or localStorage

---

## Option 3: Direct Browser Upload (If Firebase Rules Allow)

If you've configured Firestore rules, you can:
1. Open the app in browser
2. Login as admin
3. Upload the Excel file through the admin panel
4. Data will sync to Firebase automatically

---

## Notes

- **Excel File Location**: The script looks for the file at `C:\Users\USER\Documents\Participants.xlsx`
- **Data Format**: The Excel file should have columns like: Name, ID Number, Number, Address, Atoll / Island, Positions, Dhaaira
- **Firebase Rules**: Make sure Firestore security rules are configured (see FIRESTORE_SETUP.md)
- **Backup**: Data is also saved to localStorage as a backup

