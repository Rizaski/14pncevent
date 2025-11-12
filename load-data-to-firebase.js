// Script to load Excel data into Firebase Firestore
// Run with: node load-data-to-firebase.js

const XLSX = require('xlsx');
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-service-account.json'); // You'll need to download this from Firebase Console

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Firebase Config (same as in your app)
const firebaseConfig = {
    apiKey: "AIzaSyButRTQ-AyuW-NZryjZk92tSdb0kqZPdfo",
    authDomain: "bulksms-d466c.firebaseapp.com",
    projectId: "bulksms-d466c",
    storageBucket: "bulksms-d466c.firebasestorage.app",
    messagingSenderId: "108525821481",
    appId: "1:108525821481:web:75b1c18884eb288268c638"
};

async function loadExcelToFirebase() {
    try {
        // Read Excel file
        const filePath = 'C:\\Users\\USER\\Documents\\Participants.xlsx';
        console.log('Reading Excel file from:', filePath);

        const workbook = XLSX.readFile(filePath);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        console.log(`Found ${jsonData.length} rows in Excel file`);

        if (jsonData.length === 0) {
            console.log('Excel file is empty');
            return;
        }

        // Process and upload to Firestore
        const participants = [];
        let maxId = 0;

        jsonData.forEach((row, index) => {
            // Try to find name in various possible column names
            const name = row['# Name'] || row['# name'] || row['# NAME'] ||
                row['Name'] || row['name'] || row['NAME'] ||
                row['Full Name'] || row['full name'] || row['FULL NAME'] ||
                row['Participant'] || row['participant'] || row['PARTICIPANT'] ||
                Object.values(row)[0] || `Participant ${index + 1}`;

            // Clean up name if it starts with a number (e.g., "1. John Doe" -> "John Doe")
            let cleanName = name.toString().trim();
            const nameMatch = cleanName.match(/^\d+\.\s*(.+)$/);
            if (nameMatch) {
                cleanName = nameMatch[1].trim();
            }

            // Try to find ID Number
            const idNumber = row['ID Number'] || row['id number'] || row['ID NUMBER'] ||
                row['ID'] || row['id'] || row['Id'] ||
                row['ID No'] || row['id no'] || row['ID NO'] ||
                '';

            // Try to find Number/Phone
            const number = row['Number'] || row['number'] || row['NUMBER'] ||
                row['Phone'] || row['phone'] || row['PHONE'] ||
                row['Mobile'] || row['mobile'] || row['MOBILE'] ||
                row['Contact'] || row['contact'] || row['CONTACT'] ||
                row['Phone Number'] || row['phone number'] || row['PHONE NUMBER'] ||
                '';

            // Try to find Address
            const address = row['Address'] || row['address'] || row['ADDRESS'] ||
                row['Street'] || row['street'] || row['STREET'] ||
                '';

            // Try to find Atoll/Island/Location
            const atoll = row['Atoll / Island'] || row['atoll / island'] || row['ATOLL / ISLAND'] ||
                row['Atoll'] || row['atoll'] || row['ATOLL'] ||
                row['Island'] || row['island'] || row['ISLAND'] ||
                row['Location'] || row['location'] || row['LOCATION'] ||
                row['City'] || row['city'] || row['CITY'] ||
                '';

            // Try to find Positions
            const positions = row['Positions'] || row['positions'] || row['POSITIONS'] ||
                row['Position'] || row['position'] || row['POSITION'] ||
                '';

            // Try to find Dhaaira
            const dhaaira = row['Dhaaira'] || row['dhaaira'] || row['DHAaira'] ||
                row['Dhaairaa'] || row['dhaairaa'] || row['DHAairaa'] ||
                '';

            // Normalize location for filtering
            let normalizedLocation = '';
            if (atoll) {
                const locLower = atoll.toString().toLowerCase();
                if (locLower.includes('dhuvaafaru') || locLower.includes('dhuvafaru')) {
                    normalizedLocation = 'Dhuvaafaru';
                } else if (locLower.includes("male") || locLower.includes("malé")) {
                    normalizedLocation = "Male'";
                } else {
                    normalizedLocation = atoll.toString();
                }
            }

            if (cleanName && cleanName !== '') {
                maxId++;
                participants.push({
                    id: String(maxId),
                    name: cleanName,
                    idNumber: idNumber ? idNumber.toString().trim() : '',
                    number: number ? number.toString().trim() : '',
                    phone: number ? number.toString().trim() : '',
                    address: address ? address.toString().trim() : '',
                    atoll: atoll ? atoll.toString().trim() : '',
                    island: atoll ? atoll.toString().trim() : '',
                    location: normalizedLocation,
                    positions: positions ? positions.toString().trim() : '',
                    dhaaira: dhaaira ? dhaaira.toString().trim() : '',
                    email: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
        });

        console.log(`Processed ${participants.length} participants`);

        // Upload to Firestore
        const batch = db.batch();
        const collectionRef = db.collection('participants');

        participants.forEach((participant) => {
            const docRef = collectionRef.doc(participant.id);
            batch.set(docRef, {
                name: participant.name,
                idNumber: participant.idNumber,
                number: participant.number,
                phone: participant.phone,
                address: participant.address,
                atoll: participant.atoll,
                island: participant.island,
                location: participant.location,
                positions: participant.positions,
                dhaaira: participant.dhaaira,
                email: participant.email,
                createdAt: participant.createdAt,
                updatedAt: participant.updatedAt
            }, {
                merge: true
            });
        });

        await batch.commit();
        console.log(`✅ Successfully uploaded ${participants.length} participants to Firestore!`);

        process.exit(0);
    } catch (error) {
        console.error('Error loading data to Firebase:', error);
        process.exit(1);
    }
}

loadExcelToFirebase();