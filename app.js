// Application State
const AppState = {
    participants: [],
    currentTab: 'master',
    isAdmin: false,
    searchQuery: '',
    filteredParticipants: []
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadParticipantsFromStorage();
    initializeEventListeners();
    renderParticipants();
    checkAdminStatus();
    initializeMap();
});

// Initialize Map with popup workaround
function initializeMap() {
    const openMapBtn = document.getElementById('openMapBtn');
    const mapPreview = document.getElementById('mapPreview');

    if (!openMapBtn || !mapPreview) return;

    // Map URL
    const mapUrl = 'https://m.followme.mv/public/?id=18325';

    // Open map in popup window
    openMapBtn.addEventListener('click', () => {
        openMapInPopup(mapUrl);
    });

    // Also make the preview area clickable
    mapPreview.addEventListener('click', (e) => {
        // Don't trigger if clicking the button (button handles its own click)
        if (!e.target.closest('.map-open-btn')) {
            openMapInPopup(mapUrl);
        }
    });

    // Try to detect if iframe can load (hidden check)
    const mapIframe = document.getElementById('mapIframe');
    if (mapIframe) {
        // Try alternative: use object tag as fallback (rarely works but worth trying)
        setTimeout(() => {
            try {
                // Check if iframe loaded (will fail due to X-Frame-Options, but we try)
                const test = mapIframe.contentWindow;
            } catch (e) {
                // Expected - X-Frame-Options blocks it
                // Our popup solution is the workaround
            }
        }, 500);
    }
}

// Open map in popup window with optimal dimensions
function openMapInPopup(url) {
    // Calculate optimal popup size (80% of screen, centered)
    const width = Math.min(1200, window.screen.width * 0.9);
    const height = Math.min(800, window.screen.height * 0.9);
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        url,
        'FollowMeMap',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no`
    );

    // Focus the popup
    if (popup) {
        popup.focus();

        // Show a toast notification
        showToast('Map opened in new window', 'info');
    } else {
        // Popup blocked - show alternative
        showToast('Popup blocked. Please allow popups or click the link below.', 'error');

        // Fallback: open in same tab
        setTimeout(() => {
            if (confirm('Popup was blocked. Would you like to open the map in this tab instead?')) {
                window.open(url, '_blank');
            }
        }, 1000);
    }
}

// Load participants from local storage
function loadParticipantsFromStorage() {
    const stored = localStorage.getItem('dhuvaafaru_participants');
    if (stored) {
        try {
            AppState.participants = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading participants:', e);
            AppState.participants = [];
        }
    } else {
        // Add some dummy data for demonstration
        AppState.participants = [{
                id: 1,
                name: 'Ahmed Ali',
                location: 'Dhuvaafaru',
                phone: '+960 123-4567',
                email: 'ahmed@example.com'
            },
            {
                id: 2,
                name: 'Aisha Mohamed',
                location: "Male'",
                phone: '+960 234-5678',
                email: 'aisha@example.com'
            },
            {
                id: 3,
                name: 'Ibrahim Hassan',
                location: 'Dhuvaafaru',
                phone: '+960 345-6789',
                email: 'ibrahim@example.com'
            },
            {
                id: 4,
                name: 'Fatima Ahmed',
                location: "Male'",
                phone: '+960 456-7890',
                email: 'fatima@example.com'
            },
            {
                id: 5,
                name: 'Mohamed Shafeeq',
                location: 'Dhuvaafaru',
                phone: '+960 567-8901',
                email: 'shafeeq@example.com'
            }
        ];
        saveParticipantsToStorage();
    }
}

// Save participants to local storage
function saveParticipantsToStorage() {
    localStorage.setItem('dhuvaafaru_participants', JSON.stringify(AppState.participants));
}

// Initialize event listeners
function initializeEventListeners() {
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });

    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value.toLowerCase();
        filterAndRenderParticipants();
    });

    // Admin login button
    document.getElementById('adminLoginBtn').addEventListener('click', () => {
        showLoginModal();
    });

    // Admin logout button
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        logout();
    });

    // Login form
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        handleLogin();
    });

    // Close login modal
    document.getElementById('closeLoginModal').addEventListener('click', () => {
        hideLoginModal();
    });

    // Click outside modal to close
    document.getElementById('loginModal').addEventListener('click', (e) => {
        if (e.target.id === 'loginModal') {
            hideLoginModal();
        }
    });

    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.background = 'var(--bg-tertiary)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--bg-primary)';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = 'var(--border-color)';
        uploadArea.style.background = 'var(--bg-primary)';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Clear data button
    document.getElementById('clearDataBtn').addEventListener('click', () => {
        showConfirmDialog(
            'Clear All Data',
            'Are you sure you want to clear all participant data? This action cannot be undone.',
            () => {
                clearAllData();
            }
        );
    });

    // Export data button
    document.getElementById('exportDataBtn').addEventListener('click', () => {
        exportToExcel();
    });

    // Confirmation dialog
    document.getElementById('confirmCancel').addEventListener('click', () => {
        hideConfirmDialog();
    });

    document.getElementById('confirmOk').addEventListener('click', () => {
        if (window.confirmCallback) {
            window.confirmCallback();
            window.confirmCallback = null;
        }
        hideConfirmDialog();
    });

    // Participant Details Modal
    document.getElementById('closeDetailsModal').addEventListener('click', () => {
        hideParticipantDetails();
    });

    document.getElementById('closeDetailsBtn').addEventListener('click', () => {
        hideParticipantDetails();
    });

    document.getElementById('participantDetailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'participantDetailsModal') {
            hideParticipantDetails();
        }
    });
}

// Switch tabs
function switchTab(tab) {
    AppState.currentTab = tab;

    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    // Update section title
    const titles = {
        master: 'All Participants',
        dhuvaafaru: 'Dhuvaafaru',
        male: "Male'"
    };
    document.getElementById('sectionTitle').textContent = titles[tab];

    filterAndRenderParticipants();
}

// Filter and render participants
function filterAndRenderParticipants() {
    let filtered = [...AppState.participants];

    // Filter by tab (location)
    if (AppState.currentTab === 'dhuvaafaru') {
        filtered = filtered.filter(p => p.location === 'Dhuvaafaru');
    } else if (AppState.currentTab === 'male') {
        filtered = filtered.filter(p => p.location === "Male'");
    }

    // Filter by search query
    if (AppState.searchQuery) {
        filtered = filtered.filter(p => {
            const name = (p.name || '').toLowerCase();
            const idNumber = (p.idNumber || p.id || '').toString().toLowerCase();
            const number = (p.number || p.phone || '').toLowerCase();
            const address = (p.address || '').toLowerCase();
            const atoll = (p.atoll || p.island || p.location || '').toLowerCase();
            const positions = (p.positions || '').toLowerCase();
            const dhaaira = (p.dhaaira || '').toLowerCase();
            const query = AppState.searchQuery;
            return name.includes(query) || idNumber.includes(query) ||
                number.includes(query) || address.includes(query) ||
                atoll.includes(query) || positions.includes(query) ||
                dhaaira.includes(query);
        });
    }

    AppState.filteredParticipants = filtered;
    renderParticipants();
}

// Render participants list
function renderParticipants() {
    const listContainer = document.getElementById('participantsList');
    const countElement = document.getElementById('participantCount');

    countElement.textContent = AppState.filteredParticipants.length;

    if (AppState.filteredParticipants.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No participants found</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = `
        <div class="participants-list-wrapper">
        <table class="participants-table">
            <thead>
                <tr>
                    <th>
                        <div class="th-content">
                            <span># Name</span>
                            <button class="sort-btn" data-sort="name">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                    </th>
                    <th>
                        <div class="th-content">
                            <button class="sort-btn" data-sort="idNumber">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>ID Number</span>
                        </div>
                    </th>
                    <th>
                        <div class="th-content">
                            <button class="sort-btn" data-sort="number">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>Number</span>
                        </div>
                    </th>
                    <th>
                        <div class="th-content">
                            <button class="sort-btn" data-sort="address">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>Address</span>
                        </div>
                    </th>
                    <th class="hidden-column">
                        <div class="th-content">
                            <button class="sort-btn" data-sort="atoll">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>Atoll / Island</span>
                        </div>
                    </th>
                    <th class="hidden-column">
                        <div class="th-content">
                            <button class="sort-btn" data-sort="positions">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>Positions</span>
                        </div>
                    </th>
                    <th class="hidden-column">
                        <div class="th-content">
                            <button class="sort-btn" data-sort="dhaaira">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <span>Dhaaira</span>
                        </div>
                    </th>
                    <th class="hidden-column">
                        <button class="sort-btn">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                    </th>
                </tr>
            </thead>
            <tbody>
                ${AppState.filteredParticipants.map((participant, index) => {
                    return `
                        <tr class="participant-row" data-participant-id="${participant.id || index}" data-participant-index="${index}">
                            <td class="participant-name-cell">${index + 1}. ${escapeHtml(participant.name || '-')}</td>
                            <td>${escapeHtml(participant.idNumber || participant.id || '-')}</td>
                            <td>${escapeHtml(participant.number || participant.phone || '-')}</td>
                            <td>${escapeHtml(participant.address || '-')}</td>
                            <td class="hidden-column">${escapeHtml(participant.atoll || participant.island || participant.location || '-')}</td>
                            <td class="hidden-column">${escapeHtml(participant.positions || '-')}</td>
                            <td class="hidden-column">${escapeHtml(participant.dhaaira || '-')}</td>
                            <td class="hidden-column"></td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        </div>
    `;

    // Add sort functionality
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent row click when clicking sort button
            const sortField = e.currentTarget.dataset.sort;
            if (sortField) {
                sortParticipants(sortField);
            }
        });
    });

    // Add click handlers to table rows
    document.querySelectorAll('.participant-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking sort button or other interactive elements
            if (e.target.closest('.sort-btn') || e.target.closest('button')) {
                return;
            }
            const participantIndex = parseInt(row.dataset.participantIndex);
            const participant = AppState.filteredParticipants[participantIndex];
            if (participant) {
                showParticipantDetails(participant);
            }
        });
    });
}

// Sort participants
function sortParticipants(field) {
    AppState.filteredParticipants.sort((a, b) => {
        const aVal = a[field] || '';
        const bVal = b[field] || '';

        // Try to convert to number if possible
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
        }

        // String comparison
        return String(aVal).localeCompare(String(bVal));
    });

    renderParticipants();
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Admin Authentication
function checkAdminStatus() {
    const isAdmin = localStorage.getItem('dhuvaafaru_admin') === 'true';
    AppState.isAdmin = isAdmin;
    updateAdminUI();
}

function updateAdminUI() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const adminPanel = document.getElementById('adminPanel');

    if (AppState.isAdmin) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        adminPanel.style.display = 'block';
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        adminPanel.style.display = 'none';
    }
}

function showLoginModal() {
    document.getElementById('loginModal').classList.add('active');
    document.getElementById('email').focus();
}

function hideLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('loginForm').reset();
}

function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Admin credentials
    if (email === 'admin@example.com' && password === 'Admin123') {
        localStorage.setItem('dhuvaafaru_admin', 'true');
        AppState.isAdmin = true;
        updateAdminUI();
        hideLoginModal();
        showToast('Login successful!', 'success');
    } else {
        showToast('Invalid email or password', 'error');
    }
}

function logout() {
    showConfirmDialog(
        'Logout',
        'Are you sure you want to logout?',
        () => {
            localStorage.removeItem('dhuvaafaru_admin');
            AppState.isAdmin = false;
            updateAdminUI();
            showToast('Logged out successfully', 'info');
        }
    );
}

// Excel File Upload and Parsing
function handleFileUpload(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showToast('Please upload a valid Excel file (.xlsx or .xls)', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {
                type: 'array'
            });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (jsonData.length === 0) {
                showToast('Excel file is empty', 'error');
                return;
            }

            parseExcelData(jsonData);
        } catch (error) {
            console.error('Error parsing Excel:', error);
            showToast('Error parsing Excel file. Please check the format.', 'error');
        }
    };

    reader.onerror = () => {
        showToast('Error reading file', 'error');
    };

    reader.readAsArrayBuffer(file);
}

function parseExcelData(jsonData) {
    const newParticipants = [];
    let maxId = Math.max(...AppState.participants.map(p => p.id || 0), 0);

    jsonData.forEach((row, index) => {
        // Try to find name in various possible column names
        const name = row['Name'] || row['name'] || row['NAME'] ||
            row['Full Name'] || row['full name'] || row['FULL NAME'] ||
            row['Participant'] || row['participant'] || row['PARTICIPANT'] ||
            Object.values(row)[0] || `Participant ${index + 1}`;

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

        // Normalize location for filtering (used by tabs)
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

        newParticipants.push({
            id: ++maxId,
            name: name.toString().trim(),
            idNumber: idNumber ? idNumber.toString().trim() : '',
            number: number ? number.toString().trim() : '',
            phone: number ? number.toString().trim() : '', // Keep for backward compatibility
            address: address ? address.toString().trim() : '',
            atoll: atoll ? atoll.toString().trim() : '',
            island: atoll ? atoll.toString().trim() : '', // Alias
            location: normalizedLocation, // For filtering by tabs
            positions: positions ? positions.toString().trim() : '',
            dhaaira: dhaaira ? dhaaira.toString().trim() : '',
            email: '' // Keep for backward compatibility
        });
    });

    if (newParticipants.length > 0) {
        AppState.participants = [...AppState.participants, ...newParticipants];
        saveParticipantsToStorage();
        filterAndRenderParticipants();
        showToast(`Successfully imported ${newParticipants.length} participant(s)`, 'success');
    } else {
        showToast('No valid data found in Excel file', 'error');
    }
}

// Clear all data
function clearAllData() {
    AppState.participants = [];
    saveParticipantsToStorage();
    filterAndRenderParticipants();
    showToast('All data cleared', 'info');
}

// Export to Excel
function exportToExcel() {
    if (AppState.participants.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    const data = AppState.participants.map(p => ({
        'Name': p.name || '',
        'ID Number': p.idNumber || p.id || '',
        'Number': p.number || p.phone || '',
        'Address': p.address || '',
        'Atoll / Island': p.atoll || p.island || p.location || '',
        'Positions': p.positions || '',
        'Dhaaira': p.dhaaira || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Participants');

    const fileName = `Dhuvaafaru_Team_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    showToast('Data exported successfully', 'success');
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Show Participant Details
function showParticipantDetails(participant) {
    const modal = document.getElementById('participantDetailsModal');
    const nameElement = document.getElementById('detailParticipantName');
    const contentElement = document.getElementById('participantDetailsContent');

    nameElement.textContent = participant.name || 'Participant Details';

    const locationClass = participant.location === 'Dhuvaafaru' ? 'dhuvaafaru' : 'male';

    contentElement.innerHTML = `
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Name
            </div>
            <div class="detail-value">${escapeHtml(participant.name || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                ID Number
            </div>
            <div class="detail-value">${escapeHtml(participant.idNumber || participant.id || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                Number
            </div>
            <div class="detail-value">${escapeHtml(participant.number || participant.phone || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Address
            </div>
            <div class="detail-value">${escapeHtml(participant.address || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                Atoll / Island
            </div>
            <div class="detail-value">
                <span class="location-badge ${locationClass}">${escapeHtml(participant.atoll || participant.island || participant.location || '-')}</span>
            </div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Positions
            </div>
            <div class="detail-value">${escapeHtml(participant.positions || '-')}</div>
        </div>
        <div class="detail-item">
            <div class="detail-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                Dhaaira
            </div>
            <div class="detail-value">${escapeHtml(participant.dhaaira || '-')}</div>
        </div>
    `;

    modal.classList.add('active');
}

function hideParticipantDetails() {
    const modal = document.getElementById('participantDetailsModal');
    modal.classList.remove('active');
}

// Confirmation Dialog
function showConfirmDialog(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    window.confirmCallback = callback;
    document.getElementById('confirmDialog').classList.add('active');
}

function hideConfirmDialog() {
    document.getElementById('confirmDialog').classList.remove('active');
    window.confirmCallback = null;
}