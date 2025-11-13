// Application State
const AppState = {
    participants: [],
    currentTab: 'master',
    isAdmin: false,
    searchQuery: '',
    filteredParticipants: [],
    currentPage: 1,
    recordsPerPage: 10,
    currentParticipantIndex: -1, // Track current participant in detail view
    isEditMode: false, // Track if we're in edit mode
    isAddMode: false, // Track if we're adding a new participant
    currentParticipant: null // Store current participant being viewed/edited
};

// Firebase references (will be initialized after Firebase loads)
let db = null;
let auth = null;
const PARTICIPANTS_COLLECTION = 'participants';
const ADMIN_EMAIL = 'rixaski@gmail.com'; // Admin email for Firebase Auth

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    showLoading();

    // Wait for Firebase to initialize
    await waitForFirebase();

    // Try to load from Firestore, but don't block if it fails
    try {
        await loadParticipantsFromFirestore();
    } catch (error) {
        console.error('Error loading from Firestore:', error);
        // If Firestore fails, use localStorage
        loadParticipantsFromLocalStorage();
    }

    initializeEventListeners();
    // Filter and render participants (this populates filteredParticipants)
    // Loading will be replaced by renderParticipants() content
    filterAndRenderParticipants();
    checkAdminStatus();
    initializeMap();

    // Set header height for sticky tabs positioning
    updateStickyHeaderHeight();
    window.addEventListener('resize', updateStickyHeaderHeight);
});

// Update sticky header height for tabs positioning
function updateStickyHeaderHeight() {
    const header = document.querySelector('.header');
    if (header) {
        // Get the actual rendered height of the header
        const headerRect = header.getBoundingClientRect();
        const headerHeight = headerRect.height;
        // Set the CSS variable for tabs positioning (add 1px buffer to prevent overlap)
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    }
}

// Wait for Firebase to be available
function waitForFirebase() {
    return new Promise((resolve) => {
        // If Firebase is already available
        if (window.firebaseDb && window.firebaseAuth) {
            db = window.firebaseDb;
            auth = window.firebaseAuth;
            resolve();
            return;
        }

        // Otherwise wait for it
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max (50 * 100ms)

        const checkFirebase = setInterval(() => {
            attempts++;
            if (window.firebaseDb && window.firebaseAuth) {
                db = window.firebaseDb;
                auth = window.firebaseAuth;
                clearInterval(checkFirebase);
                console.log('Firebase connected successfully');
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkFirebase);
                console.warn('Firebase initialization timeout. Using localStorage fallback.');
                resolve();
            }
        }, 100);
    });
}

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

    // Initialize TV Player
    initializeTvPlayer();
}

// Initialize TV Player
function initializeTvPlayer() {
    const openTvBtn = document.getElementById('openTvBtn');
    const tvPreview = document.getElementById('tvPlayerPreview');

    if (!openTvBtn || !tvPreview) return;

    // TV URL
    const tvUrl = 'https://mmtv.mv/tv/live';

    // Open TV in popup window
    openTvBtn.addEventListener('click', () => {
        openTvInPopup(tvUrl);
    });

    // Also make the preview area clickable
    tvPreview.addEventListener('click', (e) => {
        // Don't trigger if clicking the button (button handles its own click)
        if (!e.target.closest('.tv-open-btn')) {
            openTvInPopup(tvUrl);
        }
    });
}

// Open TV in popup window with optimal dimensions
function openTvInPopup(url) {
    // Calculate optimal popup size (80% of screen, centered)
    const width = Math.min(1200, window.screen.width * 0.9);
    const height = Math.min(800, window.screen.height * 0.9);
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const popup = window.open(
        url,
        'MMTVLive',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no`
    );

    // Focus the popup
    if (popup) {
        popup.focus();

        // Show a toast notification
        showToast('MMTV Live opened in new window', 'info');
    } else {
        // Popup blocked - show alternative
        showToast('Popup blocked. Please allow popups or click the link below.', 'error');

        // Fallback: open in same tab
        setTimeout(() => {
            if (confirm('Popup was blocked. Would you like to open MMTV Live in this tab instead?')) {
                window.open(url, '_blank');
            }
        }, 1000);
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

// Load participants from Firestore
async function loadParticipantsFromFirestore() {
    if (!db) {
        console.warn('Firebase Firestore not available, using localStorage fallback');
        // Fallback to localStorage if Firebase is not available
        loadParticipantsFromLocalStorage();
        return;
    }

    try {
        console.log('Loading participants from Firestore...');
        const snapshot = await db.collection(PARTICIPANTS_COLLECTION).get();

        if (snapshot.empty) {
            console.log('Firestore collection is empty');
            // Firestore is empty - respect this and don't load from cache
            // Clear localStorage to prevent stale cache from being used
            localStorage.removeItem('dhuvaafaru_participants');
            AppState.participants = [];
            console.log('? Firestore is empty - cleared cache and set participants to empty array');
        } else {
            AppState.participants = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: String(doc.id), // Ensure id is always a string
                    ...data
                };
            });
            // Sync to localStorage as backup (only when we have data from Firestore)
            if (AppState.participants.length > 0) {
                localStorage.setItem('dhuvaafaru_participants', JSON.stringify(AppState.participants));
            } else {
                // If Firestore has no participants, clear cache
                localStorage.removeItem('dhuvaafaru_participants');
            }
            console.log(`? Loaded ${AppState.participants.length} participants from Firestore`);
        }
    } catch (error) {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message.includes('permissions') || error.message.includes('Missing or insufficient permissions')) {
            console.warn('Firestore permission denied, using localStorage fallback');
            // Fallback to localStorage on first load
            loadParticipantsFromLocalStorage();
            return; // Exit early
        }

        // Only log non-permission errors
        console.error('Error loading participants from Firestore:', error);
        // Fallback to localStorage
        loadParticipantsFromLocalStorage();
    }
}

// Save participants to Firestore
async function saveParticipantsToFirestore() {
    if (!db) {
        // Fallback to localStorage if Firebase is not available
        saveParticipantsToLocalStorage();
        return;
    }

    try {
        // Get current Firestore data
        const snapshot = await db.collection(PARTICIPANTS_COLLECTION).get();
        const existingIds = new Set(snapshot.docs.map(d => d.id));

        // Update or create each participant
        const promises = AppState.participants.map(async (participant) => {
            // Ensure participant ID is a string (Firestore requires string IDs)
            let participantId = participant.id;
            if (!participantId) {
                participantId = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
            } else {
                // Convert to string if it's a number
                participantId = String(participantId);
            }
            const participantRef = db.collection(PARTICIPANTS_COLLECTION).doc(participantId);
            await participantRef.set({
                name: participant.name || '',
                location: participant.location || '',
                phone: participant.phone || '',
                email: participant.email || '',
                idNumber: participant.idNumber || '',
                number: participant.number || participant.phone || '',
                address: participant.address || '',
                atoll: participant.atoll || participant.island || participant.location || '',
                island: participant.island || participant.location || '',
                positions: participant.positions || '',
                dhaaira: participant.dhaaira || '',
                createdAt: participant.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }, {
                merge: true
            });
            return participantId;
        });

        await Promise.all(promises);

        // Delete participants that are no longer in the array (only if explicitly clearing)
        // For normal saves, we keep all existing documents and just update/add new ones
        // Uncomment below if you want to delete removed participants:
        // const currentIds = new Set(AppState.participants.map(p => p.id).filter(Boolean));
        // const toDelete = Array.from(existingIds).filter(id => !currentIds.has(id));
        // await Promise.all(toDelete.map(id => db.collection(PARTICIPANTS_COLLECTION).doc(id).delete()));

        // Also save to localStorage as backup (only if we have participants)
        if (AppState.participants.length > 0) {
            saveParticipantsToLocalStorage();
        } else {
            // If no participants, clear cache
            localStorage.removeItem('dhuvaafaru_participants');
        }

        console.log(`? Successfully saved ${AppState.participants.length} participants to Firestore`);
    } catch (error) {
        // Check if it's a permissions error
        if (error.code === 'permission-denied' || error.message.includes('permissions') || error.message.includes('Missing or insufficient permissions')) {
            // Silently fallback to localStorage - don't spam console with errors
            saveParticipantsToLocalStorage();
            return; // Exit early, don't show error toast on every save
        }

        // Only log non-permission errors
        console.error('Error saving participants to Firestore:', error);
        showToast('Error saving to cloud. Data saved locally.', 'info');

        // Fallback to localStorage
        saveParticipantsToLocalStorage();
    }
}

// Fallback: Load participants from local storage
function loadParticipantsFromLocalStorage() {
    const stored = localStorage.getItem('dhuvaafaru_participants');
    if (stored) {
        try {
            AppState.participants = JSON.parse(stored);
            console.log(`? Loaded ${AppState.participants.length} participants from localStorage`);
        } catch (e) {
            console.error('Error loading participants:', e);
            AppState.participants = [];
        }
    } else {
        // No data - start with empty array
        console.log('No data found in localStorage');
        AppState.participants = [];
    }
}

// Fallback: Save participants to local storage
function saveParticipantsToLocalStorage() {
    localStorage.setItem('dhuvaafaru_participants', JSON.stringify(AppState.participants));
}

// Note: Dummy data initialization removed - app now only loads from Firestore

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
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Admin login button clicked');
            showLoginModal();
        });
    }

    // Admin logout button
    document.getElementById('adminLogoutBtn').addEventListener('click', () => {
        logout();
    });

    // Login form
    const loginForm = document.getElementById('loginForm');
    const loginSubmitBtn = document.getElementById('loginSubmitBtn');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login form submitted');
            handleLogin();
            return false;
        });
    }

    // Also add click handler to submit button as backup
    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Login button clicked');
            handleLogin();
        });
    }

    // Allow Enter key to submit
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (emailInput) {
        emailInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                passwordInput.focus();
            }
        });
    }

    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleLogin();
            }
        });
    }

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

    // Close button removed - users can close by clicking outside the modal or pressing Escape

    document.getElementById('participantDetailsModal').addEventListener('click', (e) => {
        if (e.target.id === 'participantDetailsModal') {
            hideParticipantDetails();
        }
    });

    // Navigation buttons in detail view
    document.getElementById('prevParticipantBtn').addEventListener('click', () => {
        navigateParticipant(-1);
    });
    document.getElementById('nextParticipantBtn').addEventListener('click', () => {
        navigateParticipant(1);
    });

    // Keyboard navigation (arrow keys) in detail view
    document.addEventListener('keydown', (e) => {
        const modal = document.getElementById('participantDetailsModal');
        if (modal && modal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                navigateParticipant(-1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                navigateParticipant(1);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                if (AppState.isEditMode || AppState.isAddMode) {
                    cancelEdit();
                } else {
                    hideParticipantDetails();
                }
            }
        }
    });

    // Admin action buttons (header icons)
    document.getElementById('addParticipantBtnHeader').addEventListener('click', () => {
        addNewParticipant();
    });
    document.getElementById('editParticipantBtnHeader').addEventListener('click', () => {
        enableEditMode();
    });
    document.getElementById('deleteParticipantBtnHeader').addEventListener('click', () => {
        deleteCurrentParticipant();
    });
    document.getElementById('saveParticipantBtnHeader').addEventListener('click', () => {
        saveParticipant();
    });
    document.getElementById('cancelEditBtnHeader').addEventListener('click', () => {
        cancelEdit();
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

    // Show/hide sections based on tab
    const participantsSection = document.querySelector('.participants-section');
    const mapSection = document.querySelector('.map-section');
    const adminPanel = document.getElementById('adminPanel');

    if (tab === 'admin') {
        // Show admin panel, hide participants and map
        if (participantsSection) participantsSection.style.display = 'none';
        if (mapSection) mapSection.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
    } else {
        // Show participants and map, hide admin panel
        if (participantsSection) participantsSection.style.display = 'block';
        if (mapSection) mapSection.style.display = 'block';
        if (adminPanel) adminPanel.style.display = 'none';

        // Update section title
        const titles = {
            master: 'All Participants',
            dhuvaafaru: 'Dhuvaafaru',
            male: "Male'"
        };
        const sectionTitle = document.getElementById('sectionTitle');
        if (sectionTitle) {
            sectionTitle.textContent = titles[tab] || 'All Participants';
        }

        filterAndRenderParticipants();
    }
}

// Mask ID Number - hide last 3 digits
function maskIdNumber(idNumber) {
    if (!idNumber || idNumber === '-') return '-';
    const str = idNumber.toString().trim();
    if (str.length <= 3) return '***';
    return str.slice(0, -3) + '***';
}

// Mask Phone Number - hide last 3 digits
function maskPhoneNumber(phone) {
    if (!phone || phone === '-') return '-';
    const str = phone.toString().trim();
    if (str.length <= 3) return '***';
    // Try to preserve format (e.g., "+960 123-****")
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 2 && parts[1].length >= 3) {
            return parts[0] + '-' + parts[1].slice(0, -3) + '***';
        }
    }
    return str.slice(0, -3) + '***';
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
    AppState.currentPage = 1; // Reset to first page when filtering
    renderParticipants();
}

// Render participants list with pagination
function renderParticipants() {
    const listContainer = document.getElementById('participantsList');
    const countElement = document.getElementById('participantCount');

    const totalRecords = AppState.filteredParticipants.length;
    countElement.textContent = totalRecords;

    if (totalRecords === 0) {
        let emptyStateHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>No participants found</p>
        `;

        // Add "Add Participant" button for admin (only on master tab)
        if (AppState.isAdmin && AppState.currentTab === 'master') {
            emptyStateHTML += `
                <button class="btn btn-primary" id="addFirstParticipantBtn" style="margin-top: 1rem;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add First Participant
                </button>
            `;
        }

        emptyStateHTML += `</div>`;
        listContainer.innerHTML = emptyStateHTML;

        // Add event listener for "Add First Participant" button
        const addFirstBtn = document.getElementById('addFirstParticipantBtn');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => {
                addNewParticipant();
            });
        }

        return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(totalRecords / AppState.recordsPerPage);
    const currentPage = Math.min(AppState.currentPage, totalPages) || 1;
    const startIndex = (currentPage - 1) * AppState.recordsPerPage;
    const endIndex = Math.min(startIndex + AppState.recordsPerPage, totalRecords);
    const pageParticipants = AppState.filteredParticipants.slice(startIndex, endIndex);

    listContainer.innerHTML = `
        <div class="participants-list-wrapper">
        <table class="participants-table">
            <thead>
                <tr>
                    <th>
                        <div class="th-content">
                            <span>#</span>
                        </div>
                    </th>
                    <th>
                        <div class="th-content">
                            <span>Name</span>
                            <button class="sort-btn" data-sort="name">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
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
                ${pageParticipants.map((participant, pageIndex) => {
                    const globalIndex = startIndex + pageIndex;
                    const serialNumber = globalIndex + 1;
                    return `
                        <tr class="participant-row" data-participant-id="${participant.id || globalIndex}" data-participant-index="${globalIndex}">
                            <td class="participant-serial-cell">${serialNumber}</td>
                            <td class="participant-name-cell">${escapeHtml(participant.name || '-')}</td>
                            <td>${escapeHtml(participant.address || '-')}</td>
                            <td>${escapeHtml(maskIdNumber(participant.idNumber || participant.id || '-'))}</td>
                            <td>${escapeHtml(maskPhoneNumber(participant.number || participant.phone || '-'))}</td>
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
        ${renderPagination(totalPages, currentPage)}
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

    // Add click handlers to table rows (only for admin)
    document.querySelectorAll('.participant-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Don't trigger if clicking sort button or other interactive elements
            if (e.target.closest('.sort-btn') || e.target.closest('button') || e.target.closest('.pagination')) {
                return;
            }
            // Only show details if admin is logged in
            if (!AppState.isAdmin) {
                return;
            }
            const participantIndex = parseInt(row.dataset.participantIndex);
            const participant = AppState.filteredParticipants[participantIndex];
            if (participant) {
                showParticipantDetails(participant, participantIndex);
            }
        });
    });

    // Update row cursor style based on admin status
    updateTableRowStyles();

    // Add pagination event listeners
    setupPaginationListeners();
}

// Render pagination controls
function renderPagination(totalPages, currentPage) {
    if (totalPages <= 1) return '';

    let paginationHTML = '<div class="pagination">';

    // Previous button
    paginationHTML += `
        <button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
        </button>
    `;

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    paginationHTML += `
        <button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
    `;

    paginationHTML += '</div>';
    return paginationHTML;
}

// Setup pagination event listeners
function setupPaginationListeners() {
    document.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (btn.disabled) return;
            const page = parseInt(btn.dataset.page);
            if (page && page !== AppState.currentPage) {
                AppState.currentPage = page;
                renderParticipants();
                // Scroll to top of table
                const listContainer = document.getElementById('participantsList');
                if (listContainer) {
                    listContainer.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
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

    AppState.currentPage = 1; // Reset to first page after sorting
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
    if (auth) {
        const user = auth.currentUser;
        if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            AppState.isAdmin = true;
            updateAdminUI();
            return;
        }
    }

    // Fallback to localStorage check
    const isAdmin = localStorage.getItem('dhuvaafaru_admin') === 'true';
    AppState.isAdmin = isAdmin;
    updateAdminUI();
}

function updateAdminUI() {
    const loginBtn = document.getElementById('adminLoginBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');
    const adminTab = document.querySelector('.admin-tab');

    if (AppState.isAdmin) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        // Show admin tab
        if (adminTab) {
            adminTab.style.display = 'flex';
        }
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        // Hide admin tab
        if (adminTab) {
            adminTab.style.display = 'none';
        }
        // If currently on admin tab, switch to master tab
        if (AppState.currentTab === 'admin') {
            switchTab('master');
        }
        // Close detail view if open
        hideParticipantDetails();
    }

    // Update table row styles based on admin status
    updateTableRowStyles();
    // Update admin buttons in detail view
    updateAdminButtonsVisibility();
}

// Update table row cursor and styling based on admin status
function updateTableRowStyles() {
    const rows = document.querySelectorAll('.participant-row');
    rows.forEach(row => {
        if (AppState.isAdmin) {
            row.style.cursor = 'pointer';
            row.classList.add('clickable-row');
        } else {
            row.style.cursor = 'default';
            row.classList.remove('clickable-row');
        }
    });
}

function showLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const emailInput = document.getElementById('email');

    if (loginModal) {
        loginModal.classList.add('active');
    }

    // Focus email input after a short delay to ensure modal is visible
    setTimeout(() => {
        if (emailInput) {
            emailInput.focus();
            emailInput.select();
        }
    }, 100);
}

function hideLoginModal() {
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    if (loginModal) {
        loginModal.classList.remove('active');
    }
    if (loginForm) {
        loginForm.reset();
    }
}

async function handleLogin() {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    // Trim whitespace and get values
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    console.log('Login attempt:', {
        email
    }); // Don't log password

    if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return false;
    }

    // Try Firebase Authentication first
    if (auth) {
        try {
            showToast('Signing in...', 'info');
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Check if user is admin
            if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
                AppState.isAdmin = true;
                updateAdminUI();
                hideLoginModal();
                showToast('Login successful!', 'success');
                // Also save to localStorage as backup
                localStorage.setItem('dhuvaafaru_admin', 'true');
                return true;
            } else {
                // User logged in but not admin
                await auth.signOut();
                showToast('Access denied. Admin email required.', 'error');
                passwordInput.value = '';
                passwordInput.focus();
                return false;
            }
        } catch (error) {
            console.error('Firebase Auth error:', error);
            let errorMessage = 'Invalid email or password';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'User not found. Please check your email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Invalid email format.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed attempts. Please try again later.';
            }

            showToast(errorMessage, 'error');
            passwordInput.value = '';
            passwordInput.focus();
            return false;
        }
    } else {
        // Fallback to simple authentication if Firebase Auth is not available
        console.warn('Firebase Auth not available, using fallback authentication');
        // Note: Fallback authentication disabled - Firebase Auth required
        showToast('Firebase Authentication is required. Please ensure Firebase Auth is properly configured.', 'error');
        passwordInput.value = '';
        passwordInput.focus();
        return false;
    }
}

async function logout() {
    showConfirmDialog(
        'Logout',
        'Are you sure you want to logout?',
        async () => {
            try {
                // Sign out from Firebase Auth
                if (auth) {
                    await auth.signOut();
                }

                // Clear localStorage
                localStorage.removeItem('dhuvaafaru_admin');
                AppState.isAdmin = false;
                updateAdminUI();
                showToast('Logged out successfully', 'info');
            } catch (error) {
                console.error('Logout error:', error);
                // Still clear local state even if Firebase logout fails
                localStorage.removeItem('dhuvaafaru_admin');
                AppState.isAdmin = false;
                updateAdminUI();
                showToast('Logged out successfully', 'info');
            }
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
    reader.onload = async (e) => {
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

            await parseExcelData(jsonData);
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

async function parseExcelData(jsonData) {
    const newParticipants = [];
    // Get max ID, converting to number for comparison, then back to string
    let maxId = Math.max(...AppState.participants.map(p => {
        const id = p.id;
        if (!id) return 0;
        const numId = parseInt(id, 10);
        return isNaN(numId) ? 0 : numId;
    }), 0);

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

        // Normalize location for filtering (used by tabs)
        let normalizedLocation = '';
        if (atoll) {
            const locLower = atoll.toString().toLowerCase();
            if (locLower.includes('dhuvaafaru') || locLower.includes('dhuvafaru')) {
                normalizedLocation = 'Dhuvaafaru';
            } else if (locLower.includes("male") || locLower.includes("mal�")) {
                normalizedLocation = "Male'";
            } else {
                normalizedLocation = atoll.toString();
            }
        }

        newParticipants.push({
            id: String(++maxId),
            name: cleanName,
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
        await saveParticipantsToFirestore();
        filterAndRenderParticipants();
        showToast(`Successfully imported ${newParticipants.length} participant(s)`, 'success');
    } else {
        showToast('No valid data found in Excel file', 'error');
    }
}

// Clear all data
async function clearAllData() {
    AppState.participants = [];
    await saveParticipantsToFirestore();
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
// Show loading spinner
function showLoading() {
    const listContainer = document.getElementById('participantsList');
    if (listContainer) {
        // Clear any existing content and show loading spinner
        listContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading participants...</p>
            </div>
        `;
    }
}

// Hide loading spinner
function hideLoading() {
    // Loading will be replaced by renderParticipants() content
    // This function is kept for consistency but renderParticipants handles the display
}

// Show loading in detail view
function showDetailViewLoading() {
    const contentElement = document.getElementById('participantDetailsContent');
    if (contentElement) {
        contentElement.innerHTML = `
            <div class="loading-spinner" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
                <div class="spinner"></div>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Saving changes...</p>
            </div>
        `;
    }
}

// Hide loading in detail view
function hideDetailViewLoading() {
    // Loading will be replaced by renderParticipantDetails() content
    // This function is kept for consistency but renderParticipantDetails handles the display
}

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
function showParticipantDetails(participant, index = -1) {
    // Only allow detail view for admin
    if (!AppState.isAdmin) {
        return;
    }

    const modal = document.getElementById('participantDetailsModal');
    const nameElement = document.getElementById('detailParticipantName');
    const contentElement = document.getElementById('participantDetailsContent');

    // Store the current participant and index
    AppState.currentParticipant = participant;
    if (index >= 0) {
        AppState.currentParticipantIndex = index;
    } else {
        // Find index if not provided
        AppState.currentParticipantIndex = AppState.filteredParticipants.findIndex(p =>
            (p.id && participant.id && p.id === participant.id) ||
            (p.name === participant.name && p.idNumber === participant.idNumber)
        );
    }

    // Reset edit/add modes
    AppState.isEditMode = false;
    AppState.isAddMode = false;

    nameElement.textContent = participant.name || 'Participant Details';
    updateDetailNavigation();
    updateAdminButtonsVisibility();
    renderParticipantDetails(participant);

    modal.classList.add('active');
}

// Render participant details (read-only or editable) - Show only specified fields
function renderParticipantDetails(participant) {
    const contentElement = document.getElementById('participantDetailsContent');
    if (!contentElement) return;

    const locationClass = participant.location === 'Dhuvaafaru' ? 'dhuvaafaru' : 'male';
    const isEditable = AppState.isEditMode || AppState.isAddMode;

    // Define the exact fields to show in order
    const fieldsToShow = [{
            key: 'id',
            label: '#',
            value: participant.id || ''
        },
        {
            key: 'name',
            label: 'Name',
            value: participant.name || ''
        },
        {
            key: 'address',
            label: 'Address',
            value: participant.address || ''
        },
        {
            key: 'idNumber',
            label: 'ID Number',
            value: participant.idNumber || participant.id || ''
        },
        {
            key: 'number',
            label: 'Number',
            value: participant.number || participant.phone || participant.mobile || participant.contact || ''
        },
        {
            key: 'atoll',
            label: 'Atoll / Island',
            value: participant.atoll || participant.island || 'Raa. Dhuvaafaru'
        },
        {
            key: 'dhaaira',
            label: 'Dhuvaafaru Dhaairaa',
            value: participant.dhaaira || participant['Dhuvaafaru Dhaairaa'] || participant['dhaairaa'] || ''
        },
        {
            key: 'location',
            label: 'Location',
            value: participant.location || ''
        },
        {
            key: 'speedBoat',
            label: 'Speed Boat',
            value: participant.speedBoat || participant['Speed Boat'] || participant['speed boat'] || participant['SpeedBoat'] || 'XSpeed'
        }
    ];

    // Helper function to get field value (handling aliases)
    const getFieldValue = (field) => {
        return field.value || '';
    };

    // Helper function to render field value (input if editable, text if not)
    const renderField = (value, fieldKey, fieldLabel) => {
        if (isEditable) {
            if (fieldKey === 'atoll') {
                // Atoll / Island - text input with default value
                return `<input type="text" class="detail-input" name="atoll" id="detail-atoll" value="${escapeHtml(value || 'Raa. Dhuvaafaru')}" placeholder="Enter Atoll / Island">`;
            } else if (fieldKey === 'location') {
                // Dropdown for Location
                return `
                    <select class="detail-input" name="location" id="detail-location">
                        <option value="">Select Location</option>
                        <option value="Dhuvaafaru" ${value === 'Dhuvaafaru' ? 'selected' : ''}>Dhuvaafaru</option>
                        <option value="Male'" ${value === "Male'" ? 'selected' : ''}>Male'</option>
                    </select>
                `;
            } else if (fieldKey === 'speedBoat') {
                // Dropdown for Speed Boat
                return `
                    <select class="detail-input" name="otherBoat" id="detail-otherBoat">
                        <option value="">Select Other Boat</option>
                        <option value="Boat 1" ${value === 'Boat 1' ? 'selected' : ''}>Boat 1</option>
                        <option value="Boat 2" ${value === 'Boat 2' ? 'selected' : ''}>Boat 2</option>
                        <option value="Boat 3" ${value === 'Boat 3' ? 'selected' : ''}>Boat 3</option>
                        <option value="None" ${value === 'None' ? 'selected' : ''}>None</option>
                    </select>
                `;
            } else if (fieldKey === 'number') {
                return `<input type="tel" class="detail-input" name="number" id="detail-number" value="${escapeHtml(value || '')}" placeholder="Enter phone number">`;
            } else if (fieldKey === 'id') {
                return `<input type="text" class="detail-input" name="id" id="detail-id" value="${escapeHtml(value || '')}" placeholder="Enter ID" readonly style="background: var(--bg-tertiary); cursor: not-allowed;">`;
            } else {
                return `<input type="text" class="detail-input" name="${fieldKey}" id="detail-${fieldKey}" value="${escapeHtml(value || '')}" placeholder="Enter ${fieldLabel}">`;
            }
        } else {
            if (fieldKey === 'location') {
                return `<span class="location-badge ${locationClass}">${escapeHtml(value || '-')}</span>`;
            }
            return escapeHtml(value || '-');
        }
    };

    // Helper function to get icon SVG for field
    const getFieldIcon = (fieldKey) => {
        const icons = {
            id: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line>',
            name: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
            address: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
            idNumber: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
            number: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>',
            atoll: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
            dhaaira: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
            location: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
            speedBoat: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line>'
        };
        return icons[fieldKey] || '<circle cx="12" cy="12" r="3"></circle>';
    };

    // Generate HTML for specified fields only (excluding dhaaira)
    const fieldsHTML = fieldsToShow
        .filter(field => field.key !== 'dhaaira') // Hide Dhuvaafaru Dhaairaa field
        .map(field => {
            const fieldValue = getFieldValue(field);
            const iconSvg = getFieldIcon(field.key);

            return `
                <div class="detail-item">
                    <div class="detail-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${iconSvg}
                        </svg>
                        ${field.label}
                    </div>
                    <div class="detail-value">${renderField(fieldValue, field.key, field.label)}</div>
                </div>
            `;
        }).join('');

    contentElement.innerHTML = fieldsHTML || '<div class="detail-item"><div class="detail-label">No data</div><div class="detail-value">-</div></div>';
}

function hideParticipantDetails() {
    const modal = document.getElementById('participantDetailsModal');
    modal.classList.remove('active');
    AppState.currentParticipantIndex = -1;
    AppState.currentParticipant = null;
    AppState.isEditMode = false;
    AppState.isAddMode = false;
}

// Navigate to previous/next participant in detail view
function navigateParticipant(direction) {
    // Don't allow navigation during edit/add mode
    if (AppState.isEditMode || AppState.isAddMode) {
        return;
    }

    const total = AppState.filteredParticipants.length;
    if (total === 0) return;

    let newIndex = AppState.currentParticipantIndex + direction;

    // Wrap around
    if (newIndex < 0) {
        newIndex = total - 1;
    } else if (newIndex >= total) {
        newIndex = 0;
    }

    const participant = AppState.filteredParticipants[newIndex];
    if (participant) {
        showParticipantDetails(participant, newIndex);
        // Scroll to top of detail content
        const contentElement = document.getElementById('participantDetailsContent');
        if (contentElement) {
            contentElement.scrollTop = 0;
        }
    }
}

// Update navigation info and button states
function updateDetailNavigation() {
    const total = AppState.filteredParticipants.length;
    const current = AppState.currentParticipantIndex + 1;
    const infoElement = document.getElementById('detailNavigationInfo');
    const prevBtn = document.getElementById('prevParticipantBtn');
    const nextBtn = document.getElementById('nextParticipantBtn');

    if (AppState.isAddMode) {
        if (infoElement) {
            infoElement.textContent = 'New Participant';
        }
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
    } else {
        if (infoElement) {
            infoElement.textContent = total > 0 ? `${current} of ${total}` : '0 of 0';
        }
        if (prevBtn && nextBtn) {
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        }
    }
}

// Update admin buttons visibility
function updateAdminButtonsVisibility() {
    const adminActionsHeader = document.getElementById('adminActionsHeader');
    const editBtn = document.getElementById('editParticipantBtnHeader');
    const deleteBtn = document.getElementById('deleteParticipantBtnHeader');
    const addBtn = document.getElementById('addParticipantBtnHeader');
    const saveBtn = document.getElementById('saveParticipantBtnHeader');
    const cancelBtn = document.getElementById('cancelEditBtnHeader');
    const prevBtn = document.getElementById('prevParticipantBtn');
    const nextBtn = document.getElementById('nextParticipantBtn');
    const navInfo = document.getElementById('detailNavigationInfo');

    if (!adminActionsHeader) return;

    if (AppState.isAdmin) {
        adminActionsHeader.style.display = 'flex';

        if (AppState.isEditMode || AppState.isAddMode) {
            // Show save/cancel, hide edit/delete/add
            if (editBtn) editBtn.style.display = 'none';
            if (deleteBtn) deleteBtn.style.display = 'none';
            if (addBtn) addBtn.style.display = 'none';
            if (saveBtn) saveBtn.style.display = 'flex';
            if (cancelBtn) cancelBtn.style.display = 'flex';
            if (prevBtn) prevBtn.disabled = true;
            if (nextBtn) nextBtn.disabled = true;
        } else {
            // Show edit/delete/add, hide save/cancel
            if (editBtn) editBtn.style.display = 'flex';
            if (deleteBtn) deleteBtn.style.display = 'flex';
            if (addBtn) addBtn.style.display = 'flex';
            if (saveBtn) saveBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
            if (prevBtn) prevBtn.disabled = false;
            if (nextBtn) nextBtn.disabled = false;
        }
    } else {
        adminActionsHeader.style.display = 'none';
    }
}

// Add new participant
function addNewParticipant() {
    AppState.isAddMode = true;
    AppState.isEditMode = false;
    AppState.currentParticipant = {
        name: '',
        address: '',
        idNumber: '',
        number: '',
        atoll: '',
        location: '',
        positions: '',
        dhaaira: '',
        id: ''
    };
    AppState.currentParticipantIndex = -1;

    const modal = document.getElementById('participantDetailsModal');
    const nameElement = document.getElementById('detailParticipantName');
    if (nameElement) {
        nameElement.textContent = 'Add New Participant';
    }

    updateDetailNavigation();
    updateAdminButtonsVisibility();
    renderParticipantDetails(AppState.currentParticipant);

    if (modal) {
        modal.classList.add('active');
    }
}

// Enable edit mode
function enableEditMode() {
    if (!AppState.currentParticipant) return;

    AppState.isEditMode = true;
    AppState.isAddMode = false;
    updateAdminButtonsVisibility();
    renderParticipantDetails(AppState.currentParticipant);
}

// Cancel edit/add
function cancelEdit() {
    if (AppState.isAddMode) {
        // If adding new, close the modal
        hideParticipantDetails();
    } else if (AppState.isEditMode && AppState.currentParticipant) {
        // If editing, revert to view mode
        AppState.isEditMode = false;
        updateAdminButtonsVisibility();
        renderParticipantDetails(AppState.currentParticipant);
    }
}

// Save participant (add or update)
async function saveParticipant() {
    // Get all input fields dynamically from the detail view
    const allInputs = document.querySelectorAll('#participantDetailsContent .detail-input, #participantDetailsContent input, #participantDetailsContent select');

    const participantData = {};

    // Collect all field values dynamically
    allInputs.forEach(input => {
        const fieldName = input.name || input.id.replace('detail-', '');
        if (fieldName) {
            if (input.type === 'checkbox') {
                participantData[fieldName] = input.checked;
            } else {
                participantData[fieldName] = input.value.trim();
            }
        }
    });

    // Get name (required field)
    const name = participantData.name || '';
    if (!name) {
        showToast('Name is required', 'error');
        const nameInput = document.getElementById('detail-name');
        nameInput.focus();
        return;
    }

    // Handle aliases and special fields
    const atoll = participantData.atoll || 'Raa. Dhuvaafaru';
    const number = participantData.number || participantData.phone || participantData.mobile || participantData.contact || '';
    const location = participantData.location || '';

    // Normalize location for filtering (used by tabs)
    let normalizedLocation = location;
    if (!normalizedLocation && atoll) {
        const locLower = atoll.toLowerCase();
        if (locLower.includes('dhuvaafaru') || locLower.includes('dhuvafaru')) {
            normalizedLocation = 'Dhuvaafaru';
        } else if (locLower.includes("male") || locLower.includes("mal�")) {
            normalizedLocation = "Male'";
        } else {
            normalizedLocation = atoll;
        }
    }

    // Build complete participant data object with aliases
    const finalParticipantData = {
        ...participantData,
        // Ensure aliases are set
        phone: number,
        island: atoll,
        atoll: atoll, // Ensure atoll is set with default
        location: normalizedLocation,
        // Map otherBoat field to speedBoat (field name changed but data structure uses speedBoat)
        speedBoat: participantData.otherBoat || participantData.speedBoat || 'XSpeed',
        // Preserve timestamps
        createdAt: AppState.currentParticipant.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    if (AppState.isAddMode) {
        // Add new participant
        const maxId = Math.max(...AppState.participants.map(p => {
            const id = p.id;
            if (!id) return 0;
            const numId = parseInt(id, 10);
            return isNaN(numId) ? 0 : numId;
        }), 0);

        finalParticipantData.id = String(maxId + 1);
        finalParticipantData.createdAt = new Date().toISOString();

        AppState.participants.push(finalParticipantData);
        showToast('Participant added successfully', 'success');
    } else if (AppState.isEditMode && AppState.currentParticipant) {
        // Update existing participant - preserve all existing fields and merge new ones
        const participantIndex = AppState.participants.findIndex(p =>
            String(p.id) === String(AppState.currentParticipant.id)
        );

        if (participantIndex >= 0) {
            // Merge: keep all existing fields, update with new values
            AppState.participants[participantIndex] = {
                ...AppState.participants[participantIndex],
                ...finalParticipantData,
                id: AppState.participants[participantIndex].id, // Preserve original ID
                createdAt: AppState.participants[participantIndex].createdAt || finalParticipantData.createdAt
            };
            showToast('Participant updated successfully', 'success');
        }
    }

    // Show loading in detail view
    showDetailViewLoading();

    // Save to Firestore
    await saveParticipantsToFirestore();

    // Update edit/add modes before refreshing
    AppState.isEditMode = false;
    AppState.isAddMode = false;

    // Refresh the view
    filterAndRenderParticipants();

    // Find the participant in filtered list and show detail view
    const updatedParticipant = AppState.filteredParticipants.find(p =>
        String(p.id) === String(finalParticipantData.id) ||
        (p.name === finalParticipantData.name && (p.idNumber === finalParticipantData.idNumber || p.id === finalParticipantData.idNumber))
    );

    if (updatedParticipant) {
        const newIndex = AppState.filteredParticipants.indexOf(updatedParticipant);
        // Ensure modal is open and show updated participant details
        setTimeout(() => {
            showParticipantDetails(updatedParticipant, newIndex);
        }, 100);
    } else {
        // If participant not found in filtered list, try to find in all participants
        const allParticipant = AppState.participants.find(p =>
            String(p.id) === String(finalParticipantData.id)
        );
        if (allParticipant) {
            // Refresh filter to include this participant
            filterAndRenderParticipants();
            setTimeout(() => {
                const foundIndex = AppState.filteredParticipants.findIndex(p =>
                    String(p.id) === String(finalParticipantData.id)
                );
                if (foundIndex >= 0) {
                    showParticipantDetails(AppState.filteredParticipants[foundIndex], foundIndex);
                } else {
                    hideDetailViewLoading();
                }
            }, 100);
        } else {
            hideDetailViewLoading();
        }
    }
}

// Delete current participant
async function deleteCurrentParticipant() {
    if (!AppState.currentParticipant || !AppState.currentParticipant.id) {
        showToast('No participant selected', 'error');
        return;
    }

    showConfirmDialog(
        'Delete Participant',
        `Are you sure you want to delete "${AppState.currentParticipant.name}"? This action cannot be undone.`,
        async () => {
            const participantId = String(AppState.currentParticipant.id);
            const index = AppState.participants.findIndex(p => String(p.id) === participantId);

            if (index >= 0) {
                // Remove from local state
                AppState.participants.splice(index, 1);

                // Delete from Firestore
                if (db) {
                    try {
                        await db.collection(PARTICIPANTS_COLLECTION).doc(participantId).delete();
                        console.log(`? Deleted participant ${participantId} from Firestore`);
                    } catch (error) {
                        console.error('Error deleting from Firestore:', error);
                        // Continue anyway - we've already removed from local state
                    }
                }

                // Update localStorage
                if (AppState.participants.length > 0) {
                    saveParticipantsToLocalStorage();
                } else {
                    localStorage.removeItem('dhuvaafaru_participants');
                }

                filterAndRenderParticipants();
                showToast('Participant deleted successfully', 'success');
                hideParticipantDetails();
            }
        }
    );
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