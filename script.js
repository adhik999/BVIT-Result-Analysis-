// ===================================
// FIREBASE-ONLY STUDENT MANAGEMENT SYSTEM
// ===================================
// All Google Sheets integration removed
// Using Firebase + localStorage only
// ===================================

// Global Variables
window.currentUser = null;
window.currentUserType = null;
window.currentTeacherRole = null;

// Mobile Menu Toggle Function
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
        
        // Change icon based on state
        const icon = mobileToggle.querySelector('i');
        if (sidebar.classList.contains('mobile-open')) {
            icon.className = 'fas fa-times';
        } else {
            icon.className = 'fas fa-bars';
        }
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (sidebar && mobileToggle) {
        if (!sidebar.contains(event.target) && !mobileToggle.contains(event.target)) {
            sidebar.classList.remove('mobile-open');
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = 'fas fa-bars';
            }
        }
    }
});

// Show/Hide mobile toggle based on screen size
function handleMobileToggleVisibility() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        if (window.innerWidth <= 768) {
            mobileToggle.style.display = 'block';
        } else {
            mobileToggle.style.display = 'none';
            // Also close sidebar if open
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('mobile-open');
            }
        }
    }
}

// Listen for window resize with debouncing for performance
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        handleMobileToggleVisibility();
    }, 150);
});

// Add touch support for mobile interactions
function addTouchSupport() {
    // Add touch class to body for CSS targeting
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
    
    // Improve touch scrolling performance
    const scrollElements = document.querySelectorAll('.content-area, .table-container, .mobile-student-cards');
    scrollElements.forEach(element => {
        element.style.webkitOverflowScrolling = 'touch';
    });
}

// Enhanced mobile search functionality
function filterStudentTableMobile(searchTerm) {
    const mobileCards = document.querySelectorAll('.student-card');
    const tableRows = document.querySelectorAll('#studentsTable tbody tr');
    
    if (!searchTerm) {
        // Show all cards and rows
        mobileCards.forEach(card => card.style.display = 'block');
        tableRows.forEach(row => row.style.display = 'table-row');
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filter mobile cards
    mobileCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        card.style.display = cardText.includes(searchLower) ? 'block' : 'none';
    });
    
    // Filter table rows
    tableRows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        row.style.display = rowText.includes(searchLower) ? 'table-row' : 'none';
    });
}

// Mobile-optimized notification system
function showMobileNotification(message, type = 'info', duration = 3000) {
    // Create mobile-friendly notification
    const notification = document.createElement('div');
    notification.className = `mobile-notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add mobile notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-size: 14px;
        max-width: 90vw;
        animation: slideInDown 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOutUp 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Optimize mobile performance
function optimizeMobilePerformance() {
    // Lazy load images if any
    const images = document.querySelectorAll('img[data-src]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
    
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
        document.body.classList.add('reduced-motion');
    }
}

// Setup real-time Firebase listener for students
function setupStudentRealtimeListener() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected && window.database) {
            console.log('🔥 Setting up real-time Firebase listener for students...');
            
            // Remove existing listener if any
            if (window.studentListener) {
                try {
                    const studentsRef = window.database.ref('students');
                    studentsRef.off('value', window.studentListener);
                    window.studentListener = null;
                } catch (e) {
                    window.studentListener = null;
                }
            }
            
            // Setup new listener
            const studentsRef = window.database.ref('students');
            window.studentListener = studentsRef.on('value', (snapshot) => {
                console.log('🔥 Firebase students data changed, updating UI...');
                
                // Only refresh if we're currently viewing student management
                if (window.currentAdminSection === 'student-management') {
                    // Small delay to prevent rapid updates
                    setTimeout(async () => {
                        try {
                            await loadAdminContent('student-management');
                            console.log('✅ Student management UI updated from Firebase');
                        } catch (error) {
                            console.error('❌ Error updating student management UI:', error);
                        }
                    }, 500);
                }
            });
            
            console.log('✅ Real-time Firebase listener setup complete');
        } else {
            console.warn('⚠️ Firebase not available for real-time listener');
        }
    } catch (error) {
        console.error('❌ Error setting up Firebase listener:', error);
    }
}

// Setup real-time Firebase listener for teachers
function setupTeacherRealtimeListener() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected && window.database) {
            console.log('🔥 Setting up real-time Firebase listener for teachers...');
            
            // Remove existing listener if any
            if (window.teacherListener) {
                try {
                    const teachersRef = window.database.ref('teachers');
                    teachersRef.off('value', window.teacherListener);
                    window.teacherListener = null;
                } catch (e) {
                    window.teacherListener = null;
                }
            }
            
            // Setup new listener
            const teachersRef = window.database.ref('teachers');
            window.teacherListener = teachersRef.on('value', (snapshot) => {
                console.log('🔥 Firebase teachers data changed, updating UI...');
                
                // Only refresh if we're currently viewing teacher management
                if (window.currentAdminSection === 'teacher-management') {
                    setTimeout(async () => {
                        try {
                            await loadAdminContent('teacher-management');
                            console.log('✅ Teacher management UI updated from Firebase');
                        } catch (error) {
                            console.error('❌ Error updating teacher management UI:', error);
                        }
                    }, 500);
                }
            });
            
            console.log('✅ Real-time Firebase teacher listener setup complete');
        } else {
            console.warn('⚠️ Firebase not available for teacher real-time listener');
        }
    } catch (error) {
        console.error('❌ Error setting up Firebase teacher listener:', error);
    }
}

// Setup real-time Firebase listener for marks
function setupMarksRealtimeListener() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected && window.database) {
            console.log('🔥 Setting up real-time Firebase listener for marks...');
            
            // Remove existing listener if any
            if (window.marksListener) {
                try {
                    const marksRef = window.database.ref('student_marks');
                    marksRef.off('value', window.marksListener);
                    window.marksListener = null;
                } catch (e) {
                    window.marksListener = null;
                }
            }
            
            // Setup new listener
            const marksRef = window.database.ref('student_marks');
            window.marksListener = marksRef.on('value', (snapshot) => {
                console.log('🔥 Firebase marks data changed, updating UI...');
                
                // Only refresh if we're currently viewing marks-related sections
                if (window.currentAdminSection === 'marks-progress' || 
                    window.currentAdminSection === 'results-analysis') {
                    setTimeout(async () => {
                        try {
                            await loadAdminContent(window.currentAdminSection);
                            console.log('✅ Marks-related UI updated from Firebase');
                        } catch (error) {
                            console.error('❌ Error updating marks UI:', error);
                        }
                    }, 500);
                }
            });
            
            console.log('✅ Real-time Firebase marks listener setup complete');
        } else {
            console.warn('⚠️ Firebase not available for marks real-time listener');
        }
    } catch (error) {
        console.error('❌ Error setting up Firebase marks listener:', error);
    }
}

// Clean up Firebase listeners
function cleanupFirebaseListeners() {
    try {
        // Check if Firebase database is available
        const database = window.firebaseDB?.db || window.database;
        
        if (window.studentListener) {
            try {
                if (database) {
                    const studentsRef = database.ref('students');
                    studentsRef.off('value', window.studentListener);
                }
                window.studentListener = null;
                console.log('🧹 Student Firebase listener cleaned up');
            } catch (e) {
                window.studentListener = null;
                console.log('🧹 Student listener force cleaned');
            }
        }
        
        if (window.teacherListener) {
            try {
                if (database) {
                    const teachersRef = database.ref('teachers');
                    teachersRef.off('value', window.teacherListener);
                }
                window.teacherListener = null;
                console.log('🧹 Teacher Firebase listener cleaned up');
            } catch (e) {
                window.teacherListener = null;
                console.log('🧹 Teacher listener force cleaned');
            }
        }
        
        if (window.marksListener) {
            try {
                if (database) {
                    const marksRef = database.ref('student_marks');
                    marksRef.off('value', window.marksListener);
                }
                window.marksListener = null;
                console.log('🧹 Marks Firebase listener cleaned up');
            } catch (e) {
                window.marksListener = null;
                console.log('🧹 Marks listener force cleaned');
            }
        }
    } catch (error) {
        console.error('❌ Error cleaning up Firebase listeners:', error);
        // Force cleanup even if Firebase is not available
        window.studentListener = null;
        window.teacherListener = null;
        window.marksListener = null;
        console.log('🧹 All listeners force cleaned due to error');
    }
}

// Initialize mobile responsiveness
function initializeMobileResponsiveness() {
    console.log('📱 Initializing mobile responsiveness...');
    
    // Add touch support
    addTouchSupport();
    
    // Initialize mobile toggle visibility
    handleMobileToggleVisibility();
    
    // Optimize mobile performance
    optimizeMobilePerformance();
    
    // Add viewport meta tag if missing
    if (!document.querySelector('meta[name="viewport"]')) {
        const viewport = document.createElement('meta');
        viewport.name = 'viewport';
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(viewport);
        console.log('📱 Added viewport meta tag');
    }
    
    // Prevent iOS zoom on input focus
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                e.target.style.fontSize = '16px';
            }
        });
    }
    
    // Add mobile-specific event listeners
    document.addEventListener('touchstart', () => {}, { passive: true });
    document.addEventListener('touchmove', () => {}, { passive: true });
    
    console.log('✅ Mobile responsiveness initialized successfully');
}

// ===================================
// GITHUB PAGES COMPATIBILITY FUNCTIONS
// ===================================

// Check if running on GitHub Pages
function isGitHubPages() {
    return window.location.hostname.includes('github.io') || 
           window.location.hostname.includes('githubusercontent.com');
}

// Safe localStorage getter with fallback
function getStorageData(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.log(`⚠️ localStorage blocked, using fallback for ${key}`);
        return window[`fallback_${key}`] || null;
    }
}

// Safe localStorage setter with fallback
function setStorageData(key, value) {
    try {
        localStorage.setItem(key, value);
        return true;
    } catch (error) {
        console.log(`⚠️ localStorage blocked, storing ${key} in memory`);
        window[`fallback_${key}`] = value;
        return false;
    }
}

// Initialize fallback data for GitHub Pages
function initializeFallbackData() {
    // No fallback data needed - Firebase only
    console.log('🔥 Firebase-only mode - no fallback data');
}

// Clean Digital Electronics from Firebase
async function cleanDigitalElectronics() {
    try {
        if (!window.firebaseDB || !window.firebaseDB.isConnected) {
            alert('❌ Firebase not connected!');
            return;
        }
        
        console.log('🧹 Cleaning Digital Electronics from Firebase...');
        
        // Clean from department data
        const departmentRef = window.database.ref('departmentData');
        const departmentSnapshot = await departmentRef.once('value');
        const departmentData = departmentSnapshot.val() || {};
        
        // Remove Digital Electronics from all departments
        Object.keys(departmentData).forEach(dept => {
            if (departmentData[dept].subjects) {
                departmentData[dept].subjects = departmentData[dept].subjects.filter(
                    subject => subject !== 'Digital Electronics'
                );
            }
        });
        
        await departmentRef.set(departmentData);
        console.log('✅ Cleaned Digital Electronics from department data');
        
        // Clean from class subjects
        const classSubjectsRef = window.database.ref('classSubjects');
        const classSnapshot = await classSubjectsRef.once('value');
        const classSubjects = classSnapshot.val() || {};
        
        // Remove Digital Electronics from all classes
        Object.keys(classSubjects).forEach(className => {
            if (Array.isArray(classSubjects[className])) {
                classSubjects[className] = classSubjects[className].filter(
                    subject => subject !== 'Digital Electronics'
                );
            }
        });
        
        await classSubjectsRef.set(classSubjects);
        console.log('✅ Cleaned Digital Electronics from class subjects');
        
        alert('✅ Digital Electronics removed from Firebase!\nPlease refresh the page.');
        
        // Auto refresh
        setTimeout(() => {
            window.location.reload();
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error cleaning Digital Electronics:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Make function globally available
window.cleanDigitalElectronics = cleanDigitalElectronics;

// Debug function to check where Digital Electronics is stored
async function checkDigitalElectronics() {
    try {
        if (!window.firebaseDB || !window.firebaseDB.isConnected) {
            alert('❌ Firebase not connected!');
            return;
        }
        
        console.log('🔍 Checking Digital Electronics location in Firebase...');
        
        // Check department data
        const departmentRef = window.database.ref('departmentData');
        const departmentSnapshot = await departmentRef.once('value');
        const departmentData = departmentSnapshot.val() || {};
        
        console.log('📊 Department Data:', departmentData);
        
        // Check each department for Digital Electronics
        Object.keys(departmentData).forEach(dept => {
            if (departmentData[dept].subjects && departmentData[dept].subjects.includes('Digital Electronics')) {
                console.log(`🔍 Found Digital Electronics in department: ${dept}`);
                console.log(`📚 Department subjects:`, departmentData[dept].subjects);
            }
        });
        
        // Check class subjects
        const classSubjectsRef = window.database.ref('classSubjects');
        const classSnapshot = await classSubjectsRef.once('value');
        const classSubjects = classSnapshot.val() || {};
        
        console.log('📊 Class Subjects Data:', classSubjects);
        
        // Check each class for Digital Electronics
        Object.keys(classSubjects).forEach(className => {
            if (Array.isArray(classSubjects[className]) && classSubjects[className].includes('Digital Electronics')) {
                console.log(`🔍 Found Digital Electronics in class: ${className}`);
                console.log(`📚 Class subjects:`, classSubjects[className]);
            }
        });
        
        // Check ME department specifically
        if (departmentData['Mechanical Engineering']) {
            console.log('🔧 Mechanical Engineering Department Data:');
            console.log(departmentData['Mechanical Engineering']);
        }
        
        // Check ME5K class specifically
        if (classSubjects['ME5K']) {
            console.log('🔧 ME5K Class Subjects:');
            console.log(classSubjects['ME5K']);
        }
        
        alert('Check console for Digital Electronics location details!');
        
    } catch (error) {
        console.error('❌ Error checking Digital Electronics location:', error);
        alert('❌ Error: ' + error.message);
    }
}

// Make function globally available
window.checkDigitalElectronics = checkDigitalElectronics;

// ===================================
// MOBILE RESPONSIVE FUNCTIONS
// ===================================

// Toggle mobile menu
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
        
        // Create overlay if it doesn't exist
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'mobile-overlay';
            newOverlay.onclick = closeMobileMenu;
            document.body.appendChild(newOverlay);
        }
        
        // Toggle overlay visibility
        const currentOverlay = document.querySelector('.mobile-overlay');
        if (currentOverlay) {
            currentOverlay.style.display = sidebar.classList.contains('mobile-open') ? 'block' : 'none';
        }
        
        // Prevent body scroll when menu is open
        document.body.style.overflow = sidebar.classList.contains('mobile-open') ? 'hidden' : 'auto';
    }
}

// Close mobile menu
function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    
    if (overlay) {
        overlay.style.display = 'none';
    }
    
    document.body.style.overflow = 'auto';
}

// Handle window resize
function handleWindowResize() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
        // Show desktop header, hide mobile header
        const mobileHeaders = document.querySelectorAll('.mobile-header');
        const contentHeaders = document.querySelectorAll('.content-header');
        
        mobileHeaders.forEach(header => header.style.display = 'none');
        contentHeaders.forEach(header => header.style.display = 'flex');
    } else {
        // Show mobile header, hide desktop header
        const mobileHeaders = document.querySelectorAll('.mobile-header');
        const contentHeaders = document.querySelectorAll('.content-header');
        
        mobileHeaders.forEach(header => header.style.display = 'block');
        contentHeaders.forEach(header => header.style.display = 'none');
    }
}

// Initialize mobile responsiveness
function initializeMobileResponsiveness() {
    // Handle window resize
    window.addEventListener('resize', handleWindowResize);
    
    // Initial check
    handleWindowResize();
    
    // Close mobile menu when clicking nav links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                setTimeout(closeMobileMenu, 300); // Small delay for smooth transition
            }
        });
    });
    
    // Add mobile overlay styles
    const style = document.createElement('style');
    style.textContent = `
        .mobile-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
        }
        
        @media (max-width: 768px) {
            .mobile-overlay.show {
                display: block;
            }
            
            /* Ensure sidebar is visible on mobile */
            .sidebar {
                display: flex !important;
                flex-direction: column;
            }
            
            .sidebar.mobile-open {
                left: 0 !important;
                transform: translateX(0);
            }
            
            /* Better mobile navigation visibility */
            .nav-menu {
                flex: 1;
                overflow-y: auto;
            }
            
            .nav-link {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            /* Mobile header improvements */
            .mobile-header {
                display: block !important;
                position: sticky;
                top: 0;
                z-index: 998;
            }
            
            .content-header {
                display: none !important;
            }
        }
        
        @media (min-width: 769px) {
            .mobile-header {
                display: none !important;
            }
            
            .content-header {
                display: flex !important;
            }
            
            .sidebar {
                position: relative !important;
                left: 0 !important;
                width: 280px !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Firebase configuration
console.log('🔥 Firebase-only Student Management System initialized');

// ===================================
// FIREBASE AUTHENTICATION FUNCTIONS
// ===================================

// Initialize Firebase Authentication
async function initializeFirebaseAuth() {
    try {
        console.log('🔥 Initializing Firebase Authentication...');
        
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            console.log('✅ Firebase already connected');
            return true;
        }
        
        // Check if Firebase functions are available
        if (typeof initializeFirebase === 'undefined') {
            console.warn('⚠️ Firebase initialization function not available, continuing without Firebase');
            return false;
        }
        
        // Initialize Firebase
        const success = await initializeFirebase();
        if (success) {
            console.log('✅ Firebase Authentication initialized successfully');
            return true;
        } else {
            console.warn('⚠️ Firebase initialization failed, continuing with localStorage only');
            return false;
        }
    } catch (error) {
        console.error('❌ Error initializing Firebase Auth:', error);
        console.log('📱 Continuing with localStorage-only mode');
        return false;
    }
}

// ===================================
// LOGIN FUNCTIONS
// ===================================

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault(); // Prevent form submission
    await login();
}

// Main login function
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    
    console.log('🔥 Login attempt:', { username, userType, hasPassword: !!password });
    
    if (!username || !password) {
        showNotification('Please enter both username and password!', 'error');
        return;
    }
    
    console.log('🔥 Starting login process...');
    
    // Initialize Firebase if not connected (optional)
    const firebaseReady = await initializeFirebaseAuth();
    if (!firebaseReady) {
        console.log('📱 Continuing with localStorage-only mode');
    }
    
    if (userType === 'admin') {
        await adminLogin(username, password);
    } else if (userType === 'teacher') {
        await teacherLogin(username, password);
    } else {
        showNotification('Invalid user type selected!', 'error');
    }
}

// Admin login with Firebase ONLY
async function adminLogin(username, password) {
    try {
        console.log('🔥 Firebase-only admin login attempt...');
        console.log('📝 Admin login - Username:', username, 'Password length:', password.length);
        
        // Check Firebase for admin credentials ONLY
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            console.log('🔥 Checking Firebase for admin credentials...');
            console.log('🎯 Looking for: email="admin@bvit.edu" password="admin123"');
            
            // Try multiple possible locations for admin data
            let adminUser = null;
            
            // Method 1: Check 'admins' collection
            console.log('🔍 Checking admins collection...');
            const adminsRef = window.firebaseDB.db.ref('admins');
            const adminsSnapshot = await adminsRef.once('value');
            const adminsData = adminsSnapshot.val();
            
            if (adminsData) {
                console.log('📊 Admins data found:', Object.keys(adminsData).length, 'entries');
                
                // Check for specific admin@bvit.edu user
                if (username === 'admin@bvit.edu' && password === 'admin123') {
                    console.log('🎯 Checking for specific admin@bvit.edu user...');
                    
                    // Look for admin_user key or any admin with matching email
                    adminUser = adminsData.admin_user || 
                               Object.values(adminsData).find(admin => 
                                   admin.email === 'admin@bvit.edu' && admin.password === 'admin123'
                               );
                    
                    if (adminUser) {
                        console.log('✅ Found admin@bvit.edu user in Firebase!');
                    } else {
                        console.log('❌ admin@bvit.edu user not found, checking all entries...');
                        console.log('🔍 Available admins:', Object.values(adminsData).map(admin => ({
                            email: admin.email || 'NO EMAIL',
                            hasPassword: !!admin.password
                        })));
                    }
                } else {
                    // General search for other credentials
                    adminUser = Object.values(adminsData).find(admin => 
                        (admin.username === username || admin.email === username || admin.name === username) && admin.password === password
                    );
                }
                
                console.log('📊 Found in admins collection:', !!adminUser);
            } else {
                console.log('📊 No data in admins collection');
            }
            
            // Method 2: Check 'teachers' collection for admin role
            if (!adminUser) {
                console.log('🔍 Checking teachers collection for admin role...');
                const teachers = await getTeachersFromFirebase();
                adminUser = teachers.find(teacher => 
                    (teacher.role === 'admin' || teacher.role === 'Admin') &&
                    (teacher.username === username || teacher.email === username || teacher.name === username) && 
                    teacher.password === password
                );
                console.log('📊 Found admin in teachers collection:', !!adminUser);
            }
            
            // Method 3: Check 'users' collection for admin data
            if (!adminUser) {
                console.log('🔍 Checking users collection for admin data...');
                const usersRef = window.firebaseDB.db.ref('users');
                const usersSnapshot = await usersRef.once('value');
                const usersData = usersSnapshot.val();
                
                if (usersData) {
                    console.log('📊 Users data found:', Object.keys(usersData).length, 'entries');
                    
                    // Check for specific admin@bvit.edu user
                    if (username === 'admin@bvit.edu' && password === 'admin123') {
                        console.log('🎯 Checking users for specific admin@bvit.edu...');
                        
                        // Look for admin_user key or any user with matching email and admin role
                        adminUser = usersData.admin_user || 
                                   Object.values(usersData).find(user => 
                                       user.email === 'admin@bvit.edu' && 
                                       user.password === 'admin123' &&
                                       (user.role === 'admin' || user.role === 'Admin')
                                   );
                        
                        if (adminUser) {
                            console.log('✅ Found admin@bvit.edu in users collection!');
                        }
                    } else {
                        // General search
                        adminUser = Object.values(usersData).find(user => 
                            (user.role === 'admin' || user.role === 'Admin') &&
                            (user.username === username || user.email === username || user.name === username) &&
                            user.password === password
                        );
                    }
                    
                    console.log('📊 Found admin in users collection:', !!adminUser);
                } else {
                    console.log('📊 No data in users collection');
                }
            }
            
            // Method 4: Check root level for admin data
            if (!adminUser) {
                console.log('🔍 Checking root level for admin data...');
                const rootRef = window.firebaseDB.db.ref('/');
                const rootSnapshot = await rootRef.once('value');
                const rootData = rootSnapshot.val();
                
                // Look for admin data in root
                if (rootData) {
                    Object.keys(rootData).forEach(key => {
                        const item = rootData[key];
                        if (item && typeof item === 'object' && 
                            (item.role === 'admin' || item.role === 'Admin') &&
                            (item.username === username || item.email === username || item.name === username) &&
                            item.password === password) {
                            adminUser = item;
                            console.log('📊 Found admin in root level:', key);
                        }
                    });
                }
            }
            
            if (adminUser) {
                console.log('✅ Firebase admin credentials matched');
                    
                    // Save session to localStorage
                    const sessionData = {
                        userType: 'admin',
                        user: adminUser,
                        loginTime: new Date().toISOString()
                    };
                    localStorage.setItem('activeSession', JSON.stringify(sessionData));
                    
                    window.currentUser = adminUser;
                    window.currentUserType = 'admin';
                    
                    await showDashboard('admin');
                    showNotification(`Welcome ${adminUser.name}! Admin login successful.`, 'success');
                    return;
            } else {
                console.log('❌ No matching admin found in Firebase');
                console.log('🔍 Debug: Looking for username/email:', username);
                console.log('🔍 Debug: Looking for password:', password);
                showNotification('Invalid admin credentials! Check username/email and password.', 'error');
                return;
            }
        } else {
            console.log('❌ Firebase not connected');
            showNotification('Firebase not connected! Cannot authenticate.', 'error');
            return;
        }
    } catch (error) {
        console.error('❌ Error during admin login:', error);
        showNotification('Admin login failed. Please try again.', 'error');
    }
}

// Teacher login with Firebase ONLY
async function teacherLogin(username, password) {
    try {
        console.log('🔥 Firebase-only teacher login attempt...');
        console.log('📝 Login attempt - Username:', username, 'Password length:', password.length);
        
        // Check Firebase connection
        if (!window.firebaseDB || !window.firebaseDB.isConnected) {
            console.log('❌ Firebase not connected');
            showNotification('Firebase not connected! Cannot authenticate.', 'error');
            return;
        }
        
        // Get teachers from Firebase database ONLY
        const teachers = await getTeachersFromFirebase();
        console.log(`📊 Loaded ${teachers.length} teachers from Firebase`);
        
        if (teachers.length === 0) {
            console.log('❌ No teachers found in Firebase');
            showNotification('No teachers found in Firebase. Please contact admin.', 'error');
            return;
        }
        
        console.log('🔍 Checking Firebase teachers for authentication...');
        
        // Find teacher by ID, email, or username and check Firebase password
        const teacher = teachers.find(t => {
            const matchesCredentials = (
                (t.id && t.id.toLowerCase() === username.toLowerCase()) ||
                (t.email && t.email.toLowerCase() === username.toLowerCase()) ||
                (t.username && t.username.toLowerCase() === username.toLowerCase())
            );
            
            const matchesPassword = t.password === password;
            
            return matchesCredentials && matchesPassword;
        });
        
        console.log('🔍 Teacher search result:', teacher ? 'Found' : 'Not found');
        
        if (teacher) {
            console.log('✅ Teacher authentication successful');
            console.log('👨‍🏫 Teacher details:', {
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department,
                role: teacher.role,
                subjects: teacher.subjects
            });
        } else {
            console.log('❌ Invalid credentials - Teacher not found in Firebase');
            console.log('🔍 Available teacher IDs:', teachers.map(t => t.id || t.username));
            showNotification('Invalid teacher credentials! Please check Firebase teacher data.', 'error');
            return;
        }
        
        if (teacher) {
            const teacherUser = {
                id: teacher.id,
                username: teacher.username || teacher.email,
                name: teacher.name,
                email: teacher.email,
                department: teacher.department || 'Not Assigned',
                role: teacher.role || 'Teacher',
                class: teacher.class || 'Not Assigned',
                subjects: teacher.subjects || [],
                assignedSubjects: teacher.assignedSubjects || [],
                isLoggedIn: true,
                firebaseAuth: false
            };
            
            // Save session to Firebase and localStorage
            await saveSessionToFirebase('teacher', teacherUser);
            
            // Save session to localStorage
            const sessionData = {
                userType: 'teacher',
                user: teacherUser,
                loginTime: new Date().toISOString()
            };
            localStorage.setItem('activeSession', JSON.stringify(sessionData));
            
            window.currentUser = teacherUser;
            window.currentUserType = 'teacher';
            window.currentTeacherRole = teacherUser.role;
            
            await showDashboard('teacher');
            showNotification(`Welcome ${teacherUser.name}! (ID: ${teacherUser.id}) Teacher login successful.`, 'success');
        } else {
            showNotification('Invalid teacher credentials! Please check your login details.', 'error');
        }
    } catch (error) {
        console.error('❌ Error during teacher login:', error);
        showNotification('Teacher login failed. Please try again.', 'error');
    }
}

// ===================================
// FIREBASE DATA FUNCTIONS
// ===================================

// Get teachers from Firebase with localStorage fallback
async function getTeachersFromFirebase() {
    try {
        console.log('🔥 Loading teachers from Firebase...');
        
        // Try Firebase first
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            try {
                const teachers = await window.firebaseDB.getTeachers();
                if (teachers && teachers.length > 0) {
                    console.log(`✅ Loaded ${teachers.length} teachers from Firebase`);
                    // Save to localStorage as backup
                    localStorage.setItem('teachers', JSON.stringify(teachers));
                    return teachers;
                }
            } catch (error) {
                console.log('⚠️ Firebase permission error (GitHub Pages deployment), using localStorage fallback:', error.message);
                // Mark Firebase as unavailable for this session
                if (error.message.includes('permission_denied')) {
                    window.firebasePermissionDenied = true;
                    console.log('🔒 Firebase permissions denied - running in offline mode');
                }
            }
        }
        
        // Fallback to safe storage
        const localTeachers = getStorageData('teachers');
        if (localTeachers) {
            const teachers = JSON.parse(localTeachers);
            console.log(`✅ Loaded ${teachers.length} teachers from storage`);
            return teachers;
        }
        
        console.warn('⚠️ No teachers found in Firebase or localStorage');
        return [];
        
    } catch (error) {
        console.error('❌ Error loading teachers:', error);
        return [];
    }
}

// Save teachers to Firebase with fallback to localStorage
async function saveTeachersToFirebase(teachers) {
    try {
        // First, always save to localStorage as backup
        localStorage.setItem('teachers', JSON.stringify(teachers));
        console.log('✅ Teachers saved to localStorage as backup');

        // Try to save to Firebase
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const result = await window.firebaseDB.saveTeachers(teachers);
            if (result) {
                console.log('✅ Teachers saved to Firebase successfully');
                return true;
            } else {
                console.log('⚠️ Firebase save failed, using localStorage backup');
                return true; // Still return true since localStorage worked
            }
        } else if (window.database) {
            // Fallback: try direct Firebase database access
            const teachersRef = window.database.ref('teachers');
            await teachersRef.set(teachers);
            console.log('✅ Teachers saved to Firebase successfully (direct)');
            return true;
        } else {
            console.log('⚠️ Firebase not available, using localStorage only');
            return true; // localStorage already saved above
        }
    } catch (error) {
        console.error('⚠️ Firebase error, but localStorage backup successful:', error.message);
        // Don't throw error since localStorage backup worked
        return true;
    }
}

// Firebase Cleanup Functions - Call these from browser console
async function deleteFirebaseStudents() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const result = await window.firebaseDB.deleteStudentsData();
            if (result) {
                console.log('✅ Students deleted from Firebase successfully');
                alert('✅ Students data deleted from Firebase successfully!');
            } else {
                console.log('❌ Failed to delete students from Firebase');
                alert('❌ Failed to delete students from Firebase');
            }
        } else {
            console.log('⚠️ Firebase not connected');
            alert('⚠️ Firebase not connected');
        }
    } catch (error) {
        console.error('❌ Error deleting students:', error);
        alert('❌ Error deleting students: ' + error.message);
    }
}

async function deleteFirebaseDepartmentData() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const result = await window.firebaseDB.deleteDepartmentData();
            if (result) {
                console.log('✅ Department data deleted from Firebase successfully');
                alert('✅ Department data deleted from Firebase successfully!');
            } else {
                console.log('❌ Failed to delete department data from Firebase');
                alert('❌ Failed to delete department data from Firebase');
            }
        } else {
            console.log('⚠️ Firebase not connected');
            alert('⚠️ Firebase not connected');
        }
    } catch (error) {
        console.error('❌ Error deleting department data:', error);
        alert('❌ Error deleting department data: ' + error.message);
    }
}

async function deleteFirebaseProformaA() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const result = await window.firebaseDB.deleteProformaAData();
            if (result) {
                console.log('✅ Proforma-A deleted from Firebase successfully');
                alert('✅ Proforma-A data deleted from Firebase successfully!');
            } else {
                console.log('❌ Failed to delete Proforma-A from Firebase');
                alert('❌ Failed to delete Proforma-A from Firebase');
            }
        } else {
            console.log('⚠️ Firebase not connected');
            alert('⚠️ Firebase not connected');
        }
    } catch (error) {
        console.error('❌ Error deleting Proforma-A:', error);
        alert('❌ Error deleting Proforma-A: ' + error.message);
    }
}

async function cleanupAllFirebaseData() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            console.log('🧹 Starting complete Firebase cleanup...');
            const result = await window.firebaseDB.cleanupFirebaseData();
            
            const message = `🧹 Firebase cleanup completed!\n✅ Successful: ${result.successful}\n❌ Failed: ${result.failed}\n📊 Total: ${result.total}`;
            console.log(message);
            alert(message);
        } else {
            console.log('⚠️ Firebase not connected');
            alert('⚠️ Firebase not connected');
        }
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        alert('❌ Error during cleanup: ' + error.message);
    }
}

// Delete specific unwanted Firebase data types
async function deleteUnwantedFirebaseData() {
    try {
        if (!window.firebaseDB || !window.firebaseDB.isConnected) {
            console.log('⚠️ Firebase not connected');
            alert('⚠️ Firebase not connected');
            return;
        }

        console.log('🧹 Deleting unwanted Firebase data...');
        
        // Delete the specific data types you mentioned
        const dataTypes = [
            { name: 'classSubjects', ref: 'classSubjects' },
            { name: 'departmentData', ref: 'departmentData' },
            { name: 'proformaA', ref: 'proformaA' },
            { name: 'students', ref: 'students' },
            { name: 'users', ref: 'users' }
        ];

        let successful = 0;
        let failed = 0;

        for (const dataType of dataTypes) {
            try {
                console.log(`🗑️ Deleting ${dataType.name}...`);
                const ref = window.database.ref(dataType.ref);
                await ref.remove();
                console.log(`✅ ${dataType.name} deleted successfully`);
                successful++;
            } catch (error) {
                console.error(`❌ Failed to delete ${dataType.name}:`, error);
                failed++;
            }
        }

        const message = `🧹 Cleanup completed!\n✅ Deleted: ${successful}\n❌ Failed: ${failed}\n📊 Total: ${dataTypes.length}`;
        console.log(message);
        alert(message);

    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        alert('❌ Error during cleanup: ' + error.message);
    }
}

// Test Add Teacher functionality
function testAddTeacherForm() {
    console.log('🧪 Testing Add Teacher form...');
    try {
        showAddTeacherForm();
        console.log('✅ Add Teacher form opened successfully');
    } catch (error) {
        console.error('❌ Error opening Add Teacher form:', error);
    }
}

// Test Add Student functionality
function testAddStudentForm() {
    console.log('🧪 Testing Add Student form...');
    try {
        showAddStudentForm();
        console.log('✅ Add Student form opened successfully');
    } catch (error) {
        console.error('❌ Error opening Add Student form:', error);
    }
}

// Expose cleanup functions globally for easy console access
window.deleteFirebaseStudents = deleteFirebaseStudents;
window.deleteFirebaseDepartmentData = deleteFirebaseDepartmentData;
window.deleteFirebaseProformaA = deleteFirebaseProformaA;
window.cleanupAllFirebaseData = cleanupAllFirebaseData;
window.deleteUnwantedFirebaseData = deleteUnwantedFirebaseData;
window.testAddTeacherForm = testAddTeacherForm;
window.testAddStudentForm = testAddStudentForm;
window.createSampleDataForGitHubPages = createSampleDataForGitHubPages;

// Get students from Firebase with localStorage fallback
async function getStudentsFromFirebase() {
    try {
        console.log('🔥 Loading students from Firebase...');
        
        // Try Firebase first (unless we know permissions are denied)
        if (window.firebaseDB && window.firebaseDB.isConnected && !window.firebasePermissionDenied) {
            try {
                const students = await window.firebaseDB.getStudents();
                if (students && students.length > 0) {
                    console.log(`✅ Loaded ${students.length} students from Firebase`);
                    // Save to localStorage as backup
                    localStorage.setItem('students', JSON.stringify(students));
                    return students;
                }
            } catch (error) {
                console.log('⚠️ Firebase permission error (GitHub Pages deployment), using localStorage fallback:', error.message);
                if (error.message.includes('permission_denied')) {
                    window.firebasePermissionDenied = true;
                    console.log('🔒 Firebase permissions denied - running in offline mode');
                }
            }
        }
        
        // Fallback to localStorage
        const localStudents = getStorageData('students');
        if (localStudents) {
            const students = JSON.parse(localStudents);
            console.log(`✅ Loaded ${students.length} students from storage`);
            return students;
        }
        
        console.warn('⚠️ No students found in Firebase or localStorage');
        return [];
    } catch (error) {
        console.error('❌ Error loading students:', error);
        return [];
    }
}

// Get Proforma-A data from Firebase
async function getProformaAFromFirebase() {
    try {
        console.log('🔥 Loading Proforma-A from Firebase...');
        
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const proformaA = await window.firebaseDB.getProformaA();
            console.log(`✅ Loaded Proforma-A data from Firebase`);
            return proformaA;
        } else {
            console.warn('⚠️ Firebase not connected, returning empty object');
            return {};
        }
    } catch (error) {
        console.error('❌ Error loading Proforma-A from Firebase:', error);
        return {};
    }
}

// Get Proforma-B data from Firebase
async function getProformaBFromFirebase() {
    try {
        console.log('🔥 Loading Proforma-B from Firebase...');
        
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const proformaB = await window.firebaseDB.getProformaB();
            console.log(`✅ Loaded Proforma-B data from Firebase`);
            return proformaB;
        } else {
            console.warn('⚠️ Firebase not connected, returning empty object');
            return {};
        }
    } catch (error) {
        console.error('❌ Error loading Proforma-B from Firebase:', error);
        return {};
    }
}

// Get marks data from Firebase
async function getMarksFromFirebase() {
    try {
        console.log('🔥 Loading marks from Firebase...');
        
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const marksRef = window.firebaseDB.db.ref('student_marks');
            const snapshot = await marksRef.once('value');
            const marksData = snapshot.val();
            
            if (marksData) {
                // Convert Firebase object to array format
                const marksArray = Object.keys(marksData).map(key => ({
                    id: key,
                    ...marksData[key]
                }));
                console.log(`✅ Loaded ${marksArray.length} marks entries from Firebase`);
                return marksArray;
            } else {
                console.log('📝 No marks data found in Firebase');
                return [];
            }
        } else {
            console.warn('⚠️ Firebase not connected, returning empty array');
            return [];
        }
    } catch (error) {
        console.error('❌ Error loading marks from Firebase:', error);
        return [];
    }
}

// Save session to Firebase
async function saveSessionToFirebase(userType, userData) {
    try {
        console.log('🔥 Saving session to Firebase...');
        
        // Check if Firebase is available and connected
        if (window.firebaseDB && window.firebaseDB.isConnected && typeof window.firebaseDB.saveSession === 'function') {
            // Clean userData to remove undefined values
            const cleanUserData = {
                id: userData.id || '',
                username: userData.username || '',
                name: userData.name || '',
                email: userData.email || '',
                department: userData.department || 'Not Assigned',
                role: userData.role || 'Teacher',
                class: userData.class || 'Not Assigned',
                subjects: userData.subjects || [],
                assignedSubjects: userData.assignedSubjects || [],
                isLoggedIn: userData.isLoggedIn || false,
                firebaseAuth: userData.firebaseAuth || false
            };
            
            const sessionData = {
                userType: userType,
                user: cleanUserData,
                loginTime: new Date().toISOString(),
                sessionId: generateSessionId()
            };
            
            await window.firebaseDB.saveSession(sessionData);
            console.log('✅ Session saved to Firebase successfully');
            return true;
        } else {
            console.warn('⚠️ Firebase not connected or saveSession method not available, skipping Firebase session save');
            return false;
        }
    } catch (error) {
        console.error('❌ Error saving session to Firebase:', error);
        console.log('📱 Session will be saved to localStorage only');
        return false;
    }
}

// ===================================
// SESSION MANAGEMENT
// ===================================

// Check login status from localStorage and Firebase
async function checkLoginStatus() {
    try {
        console.log('🔥 Checking login status with Firebase and localStorage...');
        
        // Check localStorage first for immediate response
        const localSession = localStorage.getItem('activeSession');
        if (localSession) {
            const sessionData = JSON.parse(localSession);
            
            // Validate session (check if not expired)
            const loginTime = new Date(sessionData.loginTime);
            const now = new Date();
            const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) { // Session valid for 24 hours
                window.currentUser = sessionData.user;
                window.currentUserType = sessionData.userType;
                
                if (sessionData.userType === 'teacher') {
                    window.currentTeacherRole = sessionData.user.role;
                }
                
                console.log(`✅ Valid session found for ${sessionData.userType}: ${sessionData.user.name}`);
                await showDashboard(sessionData.userType);
                return true;
            } else {
                console.log('⚠️ Session expired, clearing localStorage');
                localStorage.removeItem('activeSession');
            }
        }
        
        console.log('📱 No valid session found, showing login page');
        showLoginPage();
        return false;
    } catch (error) {
        console.error('❌ Error checking login status:', error);
        showLoginPage();
        return false;
    }
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===================================
// LOGOUT FUNCTIONS
// ===================================

// Logout function
async function logout() {
    try {
        console.log('🔥 Logging out from Firebase and localStorage...');
        
        // Clear localStorage
        localStorage.removeItem('activeSession');
        
        // Clear Firebase session if connected
        if (window.firebaseDB && window.firebaseDB.isConnected && typeof window.firebaseDB.clearSession === 'function') {
            await window.firebaseDB.clearSession();
        }
        
        // Clear global variables
        window.currentUser = null;
        window.currentUserType = null;
        window.currentTeacherRole = null;
        
        showNotification('Logged out successfully!', 'success');
        showLoginPage();
    } catch (error) {
        console.error('❌ Error during logout:', error);
        // Force logout even if Firebase fails
        localStorage.removeItem('activeSession');
        window.currentUser = null;
        window.currentUserType = null;
        window.currentTeacherRole = null;
        showNotification('Logged out (with errors)', 'warning');
        showLoginPage();
    }
}

// Force logout (emergency logout)
async function forceLogout() {
    console.log('🔥 Force logout - clearing all sessions...');
    
    // Clear localStorage
    localStorage.removeItem('activeSession');
    localStorage.removeItem('firebaseAuth');
    localStorage.removeItem('firebaseAuthExpiry');
    
    // Clear global variables
    window.currentUser = null;
    window.currentUserType = null;
    window.currentTeacherRole = null;
    
    showNotification('Force logout completed', 'info');
    showLoginPage();
}

// ===================================
// DOM MONITORING AND PROTECTION
// ===================================

// Set up simplified DOM monitoring
function setupDOMMonitoring() {
    console.log('🔍 Setting up simplified DOM monitoring...');
    
    // Only monitor critical DOM changes, not all mutations
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Only check if the entire body is being removed
            if (mutation.type === 'childList' && mutation.target === document.documentElement) {
                mutation.removedNodes.forEach((node) => {
                    if (node === document.body) {
                        console.warn('⚠️ CRITICAL: document.body was removed!');
                        console.log('🔄 Attempting to restore DOM...');
                        restoreDOM();
                    }
                });
            }
        });
    });
    
    // Start observing only document.documentElement, not subtree
    observer.observe(document.documentElement, {
        childList: true,
        subtree: false // Reduced scope to prevent excessive monitoring
    });
    
    // Less frequent DOM health check
    setInterval(() => {
        if (!document.body) {
            console.warn('⚠️ DOM health check failed: document.body is null');
            restoreDOM();
        }
    }, 10000); // Increased interval to 10 seconds
    
    console.log('✅ Simplified DOM monitoring active');
}

// Restore DOM from backup
function restoreDOM() {
    try {
        if (window.originalHTML) {
            console.log('🔄 Restoring DOM from backup...');
            document.documentElement.innerHTML = window.originalHTML;
            console.log('✅ DOM restored successfully');
        } else {
            console.error('❌ No DOM backup available');
        }
    } catch (error) {
        console.error('❌ Error restoring DOM:', error);
    }
}

// ===================================
// DASHBOARD FUNCTIONS
// ===================================

// Create admin page dynamically if missing
async function createAdminPageDynamically() {
    try {
        console.log('🔧 Creating admin page HTML structure...');
        
        // Wait for document.body to be available
        let attempts = 0;
        while (!document.body && attempts < 50) {
            console.log(`⏳ Waiting for document.body... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        // Check if body exists after waiting
        if (!document.body) {
            console.error('❌ document.body still not available after waiting');
            return null;
        }
        
        console.log('✅ document.body is now available');
        
        // Create admin page element
        const adminPage = document.createElement('div');
        adminPage.id = 'adminPage';
        adminPage.className = 'page';
        
        // Create the complete admin page structure
        adminPage.innerHTML = `
            <div class="dashboard">
                <nav class="sidebar">
                    <div class="sidebar-header">
                        <div class="logo">
                            <i class="fas fa-graduation-cap"></i>
                        </div>
                        <h3>Admin Panel</h3>
                    </div>
                    
                    <ul class="nav-menu">
                        <li><a href="#" class="nav-link active" data-section="overview">
                            <i class="fas fa-tachometer-alt"></i>
                            <span>Overview</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="teacher-management">
                            <i class="fas fa-users"></i>
                            <span>Teacher Management</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="student-management">
                            <i class="fas fa-user-graduate"></i>
                            <span>Student Management</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="departments">
                            <i class="fas fa-building"></i>
                            <span>Department Management</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="results">
                            <i class="fas fa-chart-bar"></i>
                            <span>Results Analysis</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="marks-progress">
                            <i class="fas fa-tasks"></i>
                            <span>Marks Entry Progress</span>
                        </a></li>
                        <li><a href="#" class="nav-link" data-section="settings">
                            <i class="fas fa-cog"></i>
                            <span>Settings</span>
                        </a></li>
                    </ul>
                    
                    <div class="sidebar-footer">
                        <button class="logout-btn" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
                
                <main class="main-content">
                    <header class="content-header">
                        <div class="header-left">
                            <h1 id="pageTitle">Dashboard Overview</h1>
                            <p id="pageSubtitle">Welcome to the Admin Dashboard</p>
                        </div>
                        <div class="header-right">
                            <div class="user-info">
                                <div class="user-avatar">
                                    <i class="fas fa-user-shield"></i>
                                </div>
                                <div class="user-details">
                                    <span class="user-name">Admin User</span>
                                    <span class="user-role">System Administrator</span>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div id="adminContent" class="content-area">
                        <!-- Content will be loaded here -->
                    </div>
                </main>
            </div>
        `;
        
        // Append to body
        document.body.appendChild(adminPage);
        console.log('✅ Admin page HTML structure created and appended');
        
        return adminPage;
        
    } catch (error) {
        console.error('❌ Error creating admin page dynamically:', error);
        return null;
    }
}

// Show dashboard based on user type
async function showDashboard(userType) {
    console.log(`🔄 Showing dashboard for: ${userType}`);
    console.log('🔍 Initial DOM state:', {
        readyState: document.readyState,
        bodyExists: !!document.body,
        htmlExists: !!document.documentElement
    });
    
    // Wait for DOM to be ready
    if (document.readyState !== 'complete') {
        console.log('⏳ Waiting for DOM to be ready in showDashboard...');
        await new Promise(resolve => {
            if (document.readyState === 'complete') {
                resolve();
            } else {
                const handler = () => {
                    console.log('✅ DOM load event fired');
                    resolve();
                };
                window.addEventListener('load', handler, { once: true });
                // Fallback timeout
                setTimeout(() => {
                    console.log('⚠️ DOM load timeout, proceeding anyway');
                    window.removeEventListener('load', handler);
                    resolve();
                }, 5000);
            }
        });
    }
    
    // Additional wait for safety
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🔍 Final DOM state before element search:', {
        readyState: document.readyState,
        bodyExists: !!document.body,
        totalElements: document.querySelectorAll('*').length
    });
    
    const loginPage = document.getElementById('loginPage');
    let adminPage = document.getElementById('adminPage');
    let teacherPage = document.getElementById('teacherPage');
    
    // Debug page elements
    console.log('🔍 Page elements found:', {
        loginPage: !!loginPage,
        adminPage: !!adminPage,
        teacherPage: !!teacherPage
    });
    
    if (loginPage) loginPage.classList.remove('active');
    
    if (userType === 'admin') {
        console.log('🔧 Setting up admin page...');
        
        // Try alternative selectors if not found
        if (!adminPage) {
            adminPage = document.querySelector('.page#adminPage') || 
                       document.querySelector('[id="adminPage"]');
            console.log('🔍 Admin page found with alternative selector:', !!adminPage);
        }
        
        if (adminPage) {
            adminPage.classList.add('active');
            console.log('✅ Admin page activated');
        } else {
            console.error('❌ Could not find admin page');
            console.log('🔍 Debugging DOM state:');
            console.log('  - document.readyState:', document.readyState);
            console.log('  - document.body exists:', !!document.body);
            console.log('  - All elements with id:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            console.log('  - All .page elements:', Array.from(document.querySelectorAll('.page')).map(el => el.id || el.className));
            console.log('  - innerHTML contains adminPage:', document.documentElement.innerHTML.includes('adminPage'));
            
            // Try one more time with a longer wait
            console.log('🔄 Trying one more time after longer wait...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            adminPage = document.getElementById('adminPage') || 
                       document.querySelector('.page#adminPage') || 
                       document.querySelector('[id="adminPage"]');
            
            if (adminPage) {
                console.log('✅ Found admin page after extended wait');
                adminPage.classList.add('active');
            } else {
                console.error('❌ Admin page still not found after extended wait');
                
                // Try to create admin page if it doesn't exist
                console.log('🔧 Attempting to create admin page...');
                try {
                    // Check if we can find the HTML content in the document
                    const htmlContent = document.documentElement.innerHTML;
                    if (htmlContent.includes('adminPage')) {
                        console.log('✅ adminPage found in HTML content, but element not accessible');
                        // Force a page reload as last resort
                        console.log('🔄 Forcing page reload...');
                        window.location.reload();
                        return;
                    } else {
                        console.log('❌ adminPage not found in HTML content at all');
                        console.log('🔧 Creating admin page dynamically...');
                        
                        try {
                            // Try to restore original HTML first
                            if (window.originalHTML && window.bodyContent) {
                                console.log('🔄 Attempting to restore original HTML...');
                                try {
                                    document.documentElement.innerHTML = window.originalHTML;
                                    console.log('✅ Original HTML restored');
                                    
                                    // Wait a bit for DOM to settle
                                    await new Promise(resolve => setTimeout(resolve, 200));
                                    
                                    // Try to find admin page again
                                    adminPage = document.getElementById('adminPage');
                                    if (adminPage) {
                                        console.log('✅ Admin page found after HTML restoration');
                                        adminPage.classList.add('active');
                                        return; // Success, exit the function
                                    }
                                } catch (restoreError) {
                                    console.error('❌ Error restoring HTML:', restoreError);
                                }
                            }
                            
                            // If restoration failed, create admin page dynamically
                            console.log('🔧 HTML restoration failed, creating admin page dynamically...');
                            adminPage = await createAdminPageDynamically();
                            if (adminPage) {
                                console.log('✅ Admin page created dynamically');
                                adminPage.classList.add('active');
                            } else {
                                console.error('❌ Failed to create admin page dynamically');
                                alert('Critical Error: Cannot create admin page. Please refresh the page.');
                                return;
                            }
                        } catch (createError) {
                            console.error('❌ Error creating admin page:', createError);
                            alert('Critical Error: Admin page creation failed. Please refresh the page.');
                            return;
                        }
                    }
                } catch (error) {
                    console.error('❌ Error during admin page creation attempt:', error);
                    alert('Critical Error: Cannot access admin page. Please refresh the page.');
                    return;
                }
            }
        }
        
        if (teacherPage) teacherPage.classList.remove('active');
        
        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify elements exist
        const adminContent = document.getElementById('adminContent');
        console.log('🔍 Admin content element exists:', !!adminContent);
        
        await showAdminDashboard();
    } else if (userType === 'teacher') {
        console.log('🔧 Setting up teacher page...');
        
        // Try alternative selectors if not found
        if (!teacherPage) {
            teacherPage = document.querySelector('.page#teacherPage') || 
                         document.querySelector('[id="teacherPage"]');
            console.log('🔍 Teacher page found with alternative selector:', !!teacherPage);
        }
        
        if (teacherPage) {
            teacherPage.classList.add('active');
            console.log('✅ Teacher page activated');
        } else {
            console.error('❌ Could not find teacher page');
            return;
        }
        
        if (adminPage) adminPage.classList.remove('active');
        
        // Wait for DOM to update
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await showTeacherDashboard();
    }
    
    // Initialize mobile toggle visibility
    setTimeout(() => {
        handleMobileToggleVisibility();
    }, 100);
}

// Show login page
function showLoginPage() {
    console.log('🔄 Showing login page');
    
    const loginPage = document.getElementById('loginPage');
    const adminPage = document.getElementById('adminPage');
    const teacherPage = document.getElementById('teacherPage');
    
    if (loginPage) loginPage.classList.add('active');
    if (adminPage) adminPage.classList.remove('active');
    if (teacherPage) teacherPage.classList.remove('active');
}

// Show admin dashboard
async function showAdminDashboard() {
    try {
        console.log('🔥 Loading admin dashboard...');
        
        // Wait a bit for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verify admin page is active
        const adminPage = document.getElementById('adminPage');
        if (!adminPage || !adminPage.classList.contains('active')) {
            console.log('⚠️ Admin page not active, waiting...');
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Initialize navigation event listeners
        initializeAdminNavigation();
        
        // Load default overview content
        await loadAdminContent('overview');
        
        console.log('✅ Admin dashboard loaded successfully');
    } catch (error) {
        console.error('❌ Error loading admin dashboard:', error);
        showNotification('Error loading admin dashboard', 'error');
    }
}

// Initialize admin navigation
function initializeAdminNavigation() {
    const navLinks = document.querySelectorAll('#adminPage .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Get section name
            const section = link.getAttribute('data-section');
            
            // Load content for the section
            await loadAdminContent(section);
        });
    });
}

// Load admin content based on section
async function loadAdminContent(section) {
    try {
        console.log(`🔄 Loading admin content: ${section}`);
        
        // Clean up any existing Firebase listeners before switching sections
        cleanupFirebaseListeners();
        
        // Wait for DOM to be fully ready
        if (document.readyState !== 'complete') {
            console.log('⏳ Waiting for DOM to be ready...');
            await new Promise(resolve => {
                if (document.readyState === 'complete') {
                    resolve();
                } else {
                    window.addEventListener('load', resolve, { once: true });
                }
            });
        }
        
        // Additional wait for safety
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Ensure admin page is active first
        let adminPage = document.getElementById('adminPage');
        if (!adminPage) {
            console.log('🔍 Admin page not found, searching all elements...');
            console.log('Available page elements:', {
                loginPage: !!document.getElementById('loginPage'),
                adminPage: !!document.getElementById('adminPage'),
                teacherPage: !!document.getElementById('teacherPage'),
                allDivs: document.querySelectorAll('div[id*="Page"]').length
            });
            
            // Try to find admin page by class or other attributes
            adminPage = document.querySelector('.page#adminPage') || 
                       document.querySelector('[id="adminPage"]') ||
                       document.querySelector('.admin-page');
            
            if (!adminPage) {
                console.error('❌ Admin page not found after extensive search');
                console.log('🔍 All page elements:', Array.from(document.querySelectorAll('.page')).map(el => el.id));
                return;
            } else {
                console.log('✅ Found admin page using alternative selector');
            }
        }
        
        if (!adminPage.classList.contains('active')) {
            console.log('⚠️ Admin page not active, activating...');
            adminPage.classList.add('active');
            
            // Remove other pages
            const loginPage = document.getElementById('loginPage');
            const teacherPage = document.getElementById('teacherPage');
            if (loginPage) loginPage.classList.remove('active');
            if (teacherPage) teacherPage.classList.remove('active');
        }
        
        // Wait for DOM to be ready after activation
        await new Promise(resolve => setTimeout(resolve, 200));
        
        let contentArea = document.getElementById('adminContent');
        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');
        
        // If still not found, try multiple approaches
        if (!contentArea) {
            console.log('🔍 Admin content not found, trying alternatives...');
            
            // Try finding within admin page
            contentArea = adminPage.querySelector('#adminContent');
            if (!contentArea) {
                contentArea = adminPage.querySelector('.content-area');
            }
            
            // If still not found, create it
            if (!contentArea) {
                console.log('🔧 Creating admin content area...');
                const mainContent = adminPage.querySelector('.main-content');
                if (mainContent) {
                    contentArea = document.createElement('div');
                    contentArea.id = 'adminContent';
                    contentArea.className = 'content-area';
                    mainContent.appendChild(contentArea);
                    console.log('✅ Created admin content area');
                } else {
                    console.error('❌ Could not find or create admin content area');
                    return;
                }
            }
        }
        
        console.log('✅ Admin content area found/created successfully');
        
        // Update page title and subtitle
        const sectionTitles = {
            'overview': { title: 'Dashboard Overview', subtitle: 'Welcome to the Admin Dashboard' },
            'teacher-management': { title: 'Teacher Management', subtitle: 'Manage teachers and their assignments' },
            'student-management': { title: 'Student Management', subtitle: 'Manage student records and information' },
            'departments': { title: 'Department Management', subtitle: 'Manage departments, classes, and subjects' },
            'results': { title: 'Results Analysis', subtitle: 'View and analyze student results' },
            'marks-progress': { title: 'Marks Entry Progress', subtitle: 'Track marks entry progress by teachers' },
            'settings': { title: 'System Settings', subtitle: 'Configure system settings and preferences' }
        };
        
        const sectionInfo = sectionTitles[section] || { title: 'Dashboard', subtitle: 'Admin Panel' };
        if (pageTitle) pageTitle.textContent = sectionInfo.title;
        if (pageSubtitle) pageSubtitle.textContent = sectionInfo.subtitle;
        
        // Load content based on section
        switch (section) {
            case 'overview':
                contentArea.innerHTML = await generateAdminOverviewContent();
                break;
            case 'teacher-management':
                contentArea.innerHTML = await generateTeacherManagementContent();
                initializeTeacherManagement();
                break;
            case 'student-management':
                contentArea.innerHTML = await generateStudentManagementContent();
                break;
            case 'departments':
                contentArea.innerHTML = await generateDepartmentManagementContent();
                break;
            case 'results':
                contentArea.innerHTML = await generateResultsAnalysisContent();
                break;
            case 'marks-progress':
                contentArea.innerHTML = await generateMarksProgressContent();
                break;
            case 'settings':
                contentArea.innerHTML = await generateSettingsContent();
                // Update real-time counts
                await updateSettingsCounts();
                break;
            default:
                contentArea.innerHTML = '<div class="error-message">Section not found</div>';
        }
        
        console.log(`✅ Loaded admin content: ${section}`);
    } catch (error) {
        console.error(`❌ Error loading admin content (${section}):`, error);
        const contentArea = document.getElementById('adminContent');
        if (contentArea) {
            contentArea.innerHTML = `<div class="error-message">Error loading ${section} content</div>`;
        }
    }
}

// Show teacher dashboard
async function showTeacherDashboard() {
    try {
        console.log('🔥 Loading teacher dashboard with Firebase data...');
        
        const dashboardContent = document.getElementById('teacherContent');
        if (!dashboardContent) {
            console.error('❌ Teacher content container not found');
            return;
        }
        
        const currentUser = window.currentUser;
        console.log('👨‍🏫 Current user data:', currentUser);
        
        // Update header with user info (email completely blocked)
        const teacherUserName = document.getElementById('teacherUserName');
        const teacherUserRole = document.getElementById('teacherUserRole');
        
        // Force clear any existing content first
        if (teacherUserName) {
            teacherUserName.textContent = '';
            teacherUserName.innerHTML = '';
        }
        if (teacherUserRole) {
            teacherUserRole.textContent = '';
            teacherUserRole.innerHTML = '';
        }
        
        // Set only safe content (no email)
        if (teacherUserName && currentUser) {
            const safeName = currentUser.name && !currentUser.name.includes('@') ? currentUser.name : 'Teacher';
            teacherUserName.textContent = safeName;
        }
        if (teacherUserRole && currentUser) {
            const safeRole = currentUser.role && !currentUser.role.includes('@') ? currentUser.role : 'Faculty';
            teacherUserRole.textContent = safeRole;
        }
        
        // Aggressive email cleanup - check all header elements
        const headerElements = document.querySelectorAll('.content-header *, .user-info *, .user-details *');
        headerElements.forEach(element => {
            if (element.textContent && element.textContent.includes('suraj@bvit.edu')) {
                element.textContent = element.textContent.replace('suraj@bvit.edu', '');
                console.log('🗑️ Removed suraj email from header element:', element.className);
            }
        });
        
        // Also check for any elements containing @bvit.edu
        const allHeaderElements = document.querySelectorAll('.content-header *');
        allHeaderElements.forEach(element => {
            if (element.textContent && element.textContent.includes('@bvit.edu')) {
                element.textContent = element.textContent.replace(/@[\w.-]+@bvit\.edu/g, '');
                console.log('🗑️ Cleaned email from header element');
            }
        });
        
        // Load teacher overview content directly
        const overviewContent = generateTeacherOverviewContent();
        dashboardContent.innerHTML = overviewContent;
        
        // Set overview as active in navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === 'overview') {
                link.classList.add('active');
            }
        });
        
        // Initialize teacher navigation
        initializeTeacherNavigation();
        
        console.log('✅ Teacher dashboard loaded successfully');
    } catch (error) {
        console.error('❌ Error loading teacher dashboard:', error);
        showNotification('Error loading teacher dashboard', 'error');
    }
}

// Initialize teacher navigation
function initializeTeacherNavigation() {
    console.log('🧭 Initializing teacher navigation...');
    
    const navLinks = document.querySelectorAll('#teacherPage .nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Get section name
            const section = this.getAttribute('data-section');
            console.log(`🔄 Loading teacher section: ${section}`);
            
            // Load content based on section
            loadTeacherContent(section);
        });
    });
}

// Load teacher content based on section
async function loadTeacherContent(section) {
    const contentArea = document.getElementById('teacherContent');
    if (!contentArea) {
        console.error('❌ Teacher content area not found');
        return;
    }
    
    try {
        let content = '';
        
        switch(section) {
            case 'overview':
                content = generateTeacherOverviewContent();
                contentArea.innerHTML = content;
                break;
            case 'marks-entry':
                // Show loading message first
                contentArea.innerHTML = `
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading marks entry...</p>
                    </div>
                `;
                // Load marks entry content asynchronously
                content = await generateMarksEntryContent();
                contentArea.innerHTML = content;
                break;
            case 'marks-reports':
                // Show loading message first
                contentArea.innerHTML = `
                    <div class="loading-message">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading marks reports...</p>
                    </div>
                `;
                // Load marks reports content asynchronously
                content = await generateMarksReportsContent();
                contentArea.innerHTML = content;
                break;
            case 'profile':
                content = generateTeacherProfileContent();
                contentArea.innerHTML = content;
                break;
            case 'settings':
                content = generateTeacherSettingsContent();
                contentArea.innerHTML = content;
                break;
            default:
                content = generateTeacherOverviewContent();
                contentArea.innerHTML = content;
        }
        console.log(`✅ Loaded teacher ${section} content`);
        
    } catch (error) {
        console.error(`❌ Error loading teacher ${section}:`, error);
        contentArea.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Content</h3>
                <p>Unable to load ${section} content. Please try again.</p>
            </div>
        `;
    }
}

// Generate teacher overview content
function generateTeacherOverviewContent() {
    const currentUser = window.currentUser;
    
    return `
        <div class="teacher-overview">
            <div class="overview-header">
                <h2>📊 Teacher Overview</h2>
                <p>Welcome back, ${currentUser.name}!</p>
            </div>
            
            <div class="overview-cards">
                <div class="overview-card">
                    <div class="card-icon">
                        <i class="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div class="card-content">
                        <h3>My Class</h3>
                        <p>${currentUser.class || 'Not Assigned'}</p>
                    </div>
                </div>
                
                <div class="overview-card">
                    <div class="card-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="card-content">
                        <h3>Subjects</h3>
                        <p>${currentUser.subjects ? currentUser.subjects.length : 0} Assigned</p>
                    </div>
                </div>
                
                <div class="overview-card">
                    <div class="card-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="card-content">
                        <h3>Department</h3>
                        <p>${currentUser.department}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate marks entry content
async function generateMarksEntryContent() {
    const currentUser = window.currentUser;
    
    // Get teacher's assigned subjects from Firebase
    let assignedSubjects = [];
    if (currentUser.assignedSubjects && currentUser.assignedSubjects.length > 0) {
        assignedSubjects = currentUser.assignedSubjects;
    } else if (currentUser.subjects) {
        // Fallback to subjects field if assignedSubjects not available
        assignedSubjects = Array.isArray(currentUser.subjects) ? 
            currentUser.subjects : 
            currentUser.subjects.split(',').map(s => s.trim());
    }
    
    console.log('📚 Teacher assigned subjects:', assignedSubjects);
    
    // Generate student list
    const studentsList = await generateStudentMarksList();
    
    return `
        <div class="marks-entry-simple">
            <div class="marks-header">
                <h2>📝 Marks Entry</h2>
                <p>Class: ${currentUser.class || 'Not Assigned'} | Department: ${currentUser.department || 'N/A'}</p>
            </div>
            
            <div class="form-group">
                <label>Select Subject:</label>
                <select class="form-select" id="subjectSelect">
                    <option value="">Choose Subject</option>
                    ${assignedSubjects.length > 0 ? 
                        assignedSubjects.map(subject => 
                            `<option value="${subject}">${subject}</option>`
                        ).join('') : 
                        '<option value="">No subjects assigned</option>'
                    }
                </select>
            </div>
            
            <div class="form-group">
                <label>Select Exam Type:</label>
                <select class="form-select" id="examTypeSelect">
                    <option value="">Choose Exam</option>
                    <option value="winter">Winter</option>
                    <option value="summer">Summer</option>
                </select>
            </div>
            
            <div class="students-list">
                <div class="student-marks-grid">
                    <div class="student-row header-row">
                        <span>Enrollment No</span>
                        <span>Student Name</span>
                        <span>Marks</span>
                    </div>
                    ${studentsList}
                </div>
            </div>
            
            <div class="form-actions">
                <button class="save-btn" onclick="saveMarks()">
                    <i class="fas fa-save"></i> Save Marks
                </button>
                <button class="clear-btn" onclick="clearMarks()">
                    <i class="fas fa-eraser"></i> Clear All
                </button>
            </div>
        </div>
    `;
}

// Generate student marks list from Firebase
async function generateStudentMarksList() {
    const currentUser = window.currentUser;
    
    if (!currentUser || !currentUser.class) {
        return `
            <div class="no-students-message">
                <i class="fas fa-info-circle"></i>
                <p>No class assigned to teacher</p>
            </div>
        `;
    }
    
    try {
        // Get students from Firebase for teacher's class
        const students = await getStudentsFromFirebase();
        console.log('🎓 All students from Firebase:', students);
        
        // Filter students by teacher's class
        const classStudents = students.filter(student => 
            student.class === currentUser.class || 
            student.className === currentUser.class ||
            student.department === currentUser.department
        );
        
        console.log(`👥 Students in ${currentUser.class}:`, classStudents);
        
        if (classStudents.length === 0) {
            return `
                <div class="no-students-message">
                    <i class="fas fa-users-slash"></i>
                    <p>No students found for class ${currentUser.class}</p>
                    <small>Check Firebase Students sheet</small>
                </div>
            `;
        }
        
        return classStudents.map(student => `
            <div class="student-row">
                <span class="enrollment-no">${student.enrollmentNo || student.enrollment_no || student.rollNo || student.roll_no || 'N/A'}</span>
                <span class="student-name">${student.name || student.studentName || 'Unknown'}</span>
                <input type="number" class="marks-input" placeholder="0" min="0" max="100" 
                       data-student="${student.enrollmentNo || student.enrollment_no || student.rollNo || student.roll_no}" 
                       data-student-id="${student.id || student.studentId}">
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        return `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading students from Firebase</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Enhanced Save marks function with Firebase integration
async function saveMarks() {
    const subject = document.querySelector('.form-select').value;
    const examType = document.querySelectorAll('.form-select')[1].value;
    
    if (!subject || !examType) {
        showNotification('Please select subject and exam type first!', 'error');
        return;
    }
    
    // Debug: Check current teacher data
    console.log('🔍 Debug - Current teacher data sources:');
    console.log('   window.currentUser:', window.currentUser);
    console.log('   localStorage currentUser:', localStorage.getItem('currentUser'));
    console.log('   localStorage currentTeacher:', localStorage.getItem('currentTeacher'));
    console.log('   localStorage activeSession:', localStorage.getItem('activeSession'));
    
    const marksInputs = document.querySelectorAll('.marks-input');
    const marksData = [];
    
    marksInputs.forEach(input => {
        const enrollmentNo = input.getAttribute('data-student');
        const marks = input.value;
        if (marks && marks.trim() !== '') {
            // Get current teacher data from localStorage or window.currentUser
            const teacherData = window.currentUser || JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            console.log('🎯 Current teacher data for marks:', teacherData);
            
            marksData.push({
                enrollmentNo: enrollmentNo,
                marks: parseInt(marks),
                subject: subject,
                examType: examType,
                teacherId: teacherData?.id || teacherData?.username || 'unknown',
                teacherName: teacherData?.name || teacherData?.fullName || 'Unknown Teacher',
                class: teacherData?.class || teacherData?.assignedClass || 'Unknown Class',
                department: teacherData?.department || teacherData?.dept || 'Unknown Department',
                teacherRole: teacherData?.role || 'Unknown Role',
                teacherEmail: teacherData?.email || 'unknown@email.com',
                date: new Date().toISOString(),
                timestamp: Date.now(),
                entryDate: new Date().toLocaleDateString('en-IN'),
                entryTime: new Date().toLocaleTimeString('en-IN')
            });
        }
    });
    
    if (marksData.length === 0) {
        showNotification('Please enter at least one mark!', 'error');
        return;
    }
    
    try {
        console.log('🔥 Saving marks to Firebase...', marksData);
        
        // Save to Firebase if available
        let firebaseSaved = false;
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            try {
                // Save marks to Firebase Realtime Database (update existing)
                const marksRef = window.firebaseDB.db.ref('student_marks');
                
                // First, clean up any old timestamp-based entries
                const allMarksSnapshot = await marksRef.once('value');
                const allMarks = allMarksSnapshot.val() || {};
                
                for (const markEntry of marksData) {
                    // Use consistent document ID with enrollmentNo (NO timestamp)
                    const docId = `${markEntry.enrollmentNo}_${markEntry.subject}_${markEntry.examType}`;
                    
                    // Clean up old entries (both rollNo and enrollmentNo based)
                    const oldPatterns = [
                        `${markEntry.enrollmentNo}_${markEntry.subject}_${markEntry.examType}_`, // Old timestamp entries
                        `rollNo_${markEntry.enrollmentNo}_${markEntry.subject}_${markEntry.examType}` // Old rollNo entries
                    ];
                    
                    for (const pattern of oldPatterns) {
                        const oldEntries = Object.keys(allMarks).filter(key => key.includes(pattern) || key.startsWith(pattern));
                        for (const oldKey of oldEntries) {
                            await marksRef.child(oldKey).remove();
                            console.log(`🗑️ Firebase: Removed old entry ${oldKey}`);
                        }
                    }
                    
                    // Check if consistent ID entry exists
                    const existingSnapshot = await marksRef.child(docId).once('value');
                    
                    if (existingSnapshot.exists()) {
                        // Update existing mark
                        const existingData = existingSnapshot.val();
                        const updatedMark = {
                            ...existingData,
                            enrollmentNo: markEntry.enrollmentNo,
                            marks: markEntry.marks,
                            date: markEntry.date,
                            timestamp: markEntry.timestamp,
                            entryDate: markEntry.entryDate,
                            entryTime: markEntry.entryTime,
                            lastModified: new Date().toISOString(),
                            modifiedBy: markEntry.teacherName,
                            editCount: (existingData.editCount || 0) + 1
                        };
                        await marksRef.child(docId).set(updatedMark);
                        console.log(`🔄 Firebase: Updated consistent entry ${docId}`);
                    } else {
                        // Create new mark with consistent ID and enrollmentNo
                        await marksRef.child(docId).set(markEntry);
                        console.log(`➕ Firebase: Created new consistent entry ${docId}`);
                    }
                }
                firebaseSaved = true;
                console.log('✅ Marks successfully saved to Firebase (no duplicates)');
            } catch (firebaseError) {
                console.error('❌ Firebase save failed:', firebaseError);
                firebaseSaved = false;
            }
        }
        
        // Always save to localStorage as backup (update existing marks)
        const existingMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        
        // Update or add marks (replace existing, don't duplicate)
        marksData.forEach(newMark => {
            // Find existing mark for same student, subject, and exam type (using enrollmentNo)
            const existingIndex = existingMarks.findIndex(existing => 
                (existing.enrollmentNo === newMark.enrollmentNo || existing.rollNo === newMark.enrollmentNo) && 
                existing.subject === newMark.subject && 
                existing.examType === newMark.examType
            );
            
            if (existingIndex !== -1) {
                // Update existing mark
                existingMarks[existingIndex] = {
                    ...existingMarks[existingIndex],
                    enrollmentNo: newMark.enrollmentNo, // Ensure enrollmentNo is set
                    marks: newMark.marks,
                    date: newMark.date,
                    timestamp: newMark.timestamp,
                    entryDate: newMark.entryDate,
                    entryTime: newMark.entryTime,
                    lastModified: new Date().toISOString(),
                    modifiedBy: newMark.teacherName
                };
                // Remove old rollNo field if it exists
                if (existingMarks[existingIndex].rollNo) {
                    delete existingMarks[existingIndex].rollNo;
                }
                console.log(`🔄 Updated existing mark for ${newMark.enrollmentNo} - ${newMark.subject} - ${newMark.examType}`);
            } else {
                // Add new mark
                existingMarks.push(newMark);
                console.log(`➕ Added new mark for ${newMark.enrollmentNo} - ${newMark.subject} - ${newMark.examType}`);
            }
        });
        
        localStorage.setItem('studentMarks', JSON.stringify(existingMarks));
        console.log('✅ Marks saved to localStorage (updated existing, no duplicates)');
        
        // Show success notification
        const storageInfo = firebaseSaved ? 'Firebase & localStorage' : 'localStorage only';
        showNotification(
            `✅ Successfully saved ${marksData.length} marks for ${subject} - ${examType} (${storageInfo})`,
            'success'
        );
        
        // Clear the form
        clearMarks();
        
        // Log the save operation
        console.log(`📊 Marks saved:`, {
            count: marksData.length,
            subject: subject,
            examType: examType,
            teacher: currentUser?.name,
            class: currentUser?.class,
            firebaseSaved: firebaseSaved
        });
        
    } catch (error) {
        console.error('❌ Error saving marks:', error);
        showNotification('❌ Error saving marks. Please try again.', 'error');
    }
}

// Clear marks function
function clearMarks() {
    const marksInputs = document.querySelectorAll('.marks-input');
    marksInputs.forEach(input => {
        input.value = '';
    });
}

// Generate marks reports content
async function generateMarksReportsContent() {
    const currentUser = window.currentUser;
    
    // Get saved marks from localStorage and Firebase
    let savedMarks = [];
    
    try {
        // Get from localStorage first
        const localMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        
        // Filter marks for current teacher and migrate rollNo to enrollmentNo
        const teacherMarks = localMarks.filter(mark => 
            mark.teacherId === currentUser?.id || 
            mark.teacherName === currentUser?.name
        ).map(mark => {
            // Migrate rollNo to enrollmentNo if needed
            if (mark.rollNo && !mark.enrollmentNo) {
                mark.enrollmentNo = mark.rollNo;
                delete mark.rollNo;
            }
            return mark;
        });
        
        savedMarks = teacherMarks;
        console.log('📊 Teacher marks found:', savedMarks.length);
        
    } catch (error) {
        console.error('❌ Error loading marks:', error);
    }
    
    // Group marks by subject and exam type
    const groupedMarks = {};
    savedMarks.forEach(mark => {
        const key = `${mark.subject}_${mark.examType}`;
        if (!groupedMarks[key]) {
            groupedMarks[key] = {
                subject: mark.subject,
                examType: mark.examType,
                marks: [],
                date: mark.date,
                count: 0
            };
        }
        groupedMarks[key].marks.push(mark);
        groupedMarks[key].count++;
    });
    
    const reportGroups = Object.values(groupedMarks);
    
    return `
        <div class="marks-reports-container">
            <div class="reports-header">
                <h2>📊 Marks Reports</h2>
            </div>
            
            <div class="reports-content">
                ${reportGroups.length > 0 ? `
                    <div class="reports-grid">
                        ${reportGroups.map(group => `
                            <div class="report-card">
                                <div class="report-header">
                                    <h3>${group.subject} - ${group.examType}</h3>
                                    <div class="report-stats">
                                        <span class="stat-badge">
                                            <i class="fas fa-users"></i>
                                            ${group.count} Students
                                        </span>
                                        <span class="stat-badge">
                                            <i class="fas fa-calendar"></i>
                                            ${new Date(group.date).toLocaleDateString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="marks-table-container">
                                    <table class="marks-report-table">
                                        <thead>
                                            <tr>
                                                <th>Enrollment No</th>
                                                <th>Student Name</th>
                                                <th>Marks</th>
                                                <th>Entry Time</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${group.marks.map(mark => {
                                                // Get student name from localStorage
                                                const students = JSON.parse(localStorage.getItem('students') || '[]');
                                                const enrollmentNo = mark.enrollmentNo || mark.rollNo; // Support both
                                                const student = students.find(s => s.enrollmentNo === enrollmentNo);
                                                const studentName = student ? student.name : 'Unknown Student';
                                                
                                                return `
                                                <tr>
                                                    <td>${enrollmentNo}</td>
                                                    <td class="student-name-cell">${studentName}</td>
                                                    <td>
                                                        <span class="marks-display" id="marks-${enrollmentNo}-${group.subject}-${group.examType}">${mark.marks}</span>
                                                        <input type="number" class="marks-edit-input" id="edit-${enrollmentNo}-${group.subject}-${group.examType}" value="${mark.marks}" style="display: none;" min="0" max="100">
                                                    </td>
                                                    <td>${mark.entryTime || new Date(mark.date).toLocaleTimeString('en-IN')}</td>
                                                    <td>
                                                        <button class="edit-btn" onclick="editMark('${enrollmentNo}', '${group.subject}', '${group.examType}')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="save-btn" onclick="saveMark('${enrollmentNo}', '${group.subject}', '${group.examType}')" style="display: none;">
                                                            <i class="fas fa-save"></i>
                                                        </button>
                                                        <button class="cancel-btn" onclick="cancelEdit('${enrollmentNo}', '${group.subject}', '${group.examType}')" style="display: none;">
                                                            <i class="fas fa-times"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                                `;
                                            }).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="no-reports">
                        <div class="no-data-message">
                            <i class="fas fa-chart-line"></i>
                            <h3>No Marks Reports Found</h3>
                            <p>You haven't entered any marks yet. Go to Marks Entry to start adding student marks.</p>
                            <button class="primary-btn" onclick="loadTeacherContent('marks-entry')">
                                <i class="fas fa-edit"></i>
                                Go to Marks Entry
                            </button>
                        </div>
                    </div>
                `}
            </div>
        </div>
    `;
}

// Edit mark functionality
function editMark(rollNo, subject, examType) {
    const displaySpan = document.getElementById(`marks-${rollNo}-${subject}-${examType}`);
    const editInput = document.getElementById(`edit-${rollNo}-${subject}-${examType}`);
    const editBtn = event.target.closest('.edit-btn');
    const saveBtn = editBtn.parentNode.querySelector('.save-btn');
    const cancelBtn = editBtn.parentNode.querySelector('.cancel-btn');
    
    // Hide display, show input
    displaySpan.style.display = 'none';
    editInput.style.display = 'inline-block';
    editInput.focus();
    
    // Hide edit button, show save/cancel buttons
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
}

// Save edited mark
async function saveMark(enrollmentNo, subject, examType) {
    const displaySpan = document.getElementById(`marks-${enrollmentNo}-${subject}-${examType}`);
    const editInput = document.getElementById(`edit-${enrollmentNo}-${subject}-${examType}`);
    const newMarks = parseInt(editInput.value);
    
    if (isNaN(newMarks) || newMarks < 0 || newMarks > 100) {
        showNotification('Please enter valid marks (0-100)', 'error');
        return;
    }
    
    try {
        // Update in localStorage
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        const markIndex = savedMarks.findIndex(mark => 
            (mark.enrollmentNo === enrollmentNo || mark.rollNo === enrollmentNo) && 
            mark.subject === subject && 
            mark.examType === examType
        );
        
        if (markIndex !== -1) {
            savedMarks[markIndex].enrollmentNo = enrollmentNo; // Ensure enrollmentNo is set
            savedMarks[markIndex].marks = newMarks;
            savedMarks[markIndex].lastModified = new Date().toISOString();
            savedMarks[markIndex].modifiedBy = window.currentUser?.name || 'Teacher';
            
            // Remove old rollNo field if it exists
            if (savedMarks[markIndex].rollNo) {
                delete savedMarks[markIndex].rollNo;
            }
            
            localStorage.setItem('studentMarks', JSON.stringify(savedMarks));
            
            // Update Firebase if available (using consistent document ID)
            if (window.firebaseDB && window.firebaseDB.isConnected) {
                try {
                    const marksRef = window.firebaseDB.db.ref('student_marks');
                    // Use same consistent document ID with enrollmentNo (no timestamp)
                    const docId = `${enrollmentNo}_${subject}_${examType}`;
                    
                    // Update the existing document
                    await marksRef.child(docId).update({
                        enrollmentNo: enrollmentNo,
                        marks: newMarks,
                        lastModified: new Date().toISOString(),
                        modifiedBy: window.currentUser?.name || 'Teacher',
                        editCount: (savedMarks[markIndex].editCount || 0) + 1
                    });
                    console.log(`🔄 Firebase: Updated mark for ${enrollmentNo} using consistent docId: ${docId}`);
                } catch (firebaseError) {
                    console.error('❌ Firebase update failed:', firebaseError);
                    console.log(`⚠️ Attempted to update docId: ${enrollmentNo}_${subject}_${examType}`);
                }
            }
            
            // Update display
            displaySpan.textContent = newMarks;
            showNotification(`✅ Mark updated successfully for ${enrollmentNo}`, 'success');
        }
        
    } catch (error) {
        console.error('❌ Error updating mark:', error);
        showNotification('❌ Error updating mark', 'error');
    }
    
    // Reset UI
    cancelEdit(enrollmentNo, subject, examType);
}

// Cancel edit
function cancelEdit(enrollmentNo, subject, examType) {
    const displaySpan = document.getElementById(`marks-${enrollmentNo}-${subject}-${examType}`);
    const editInput = document.getElementById(`edit-${enrollmentNo}-${subject}-${examType}`);
    const editBtn = document.querySelector(`button[onclick="editMark('${enrollmentNo}', '${subject}', '${examType}')"]`);
    const saveBtn = document.querySelector(`button[onclick="saveMark('${enrollmentNo}', '${subject}', '${examType}')"]`);
    const cancelBtn = document.querySelector(`button[onclick="cancelEdit('${enrollmentNo}', '${subject}', '${examType}')"]`);
    
    // Show display, hide input
    displaySpan.style.display = 'inline';
    editInput.style.display = 'none';
    
    // Reset input value to original
    editInput.value = displaySpan.textContent;
    
    // Show edit button, hide save/cancel buttons
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';
}

// Generate teacher profile content
function generateTeacherProfileContent() {
    const currentUser = window.currentUser;
    
    return `
        <div class="teacher-profile">
            <div class="section-header">
                <h2>👤 Teacher Profile</h2>
                <p>View and manage your profile information</p>
            </div>
            
            <div class="profile-content">
                <div class="profile-card">
                    <div class="profile-avatar">
                        <i class="fas fa-user-tie"></i>
                    </div>
                    <div class="profile-info">
                        <h3>${currentUser.name}</h3>
                        <p class="role">${currentUser.role}</p>
                        <p class="department">${currentUser.department}</p>
                        
                        <div class="profile-details">
                            <div class="detail-item">
                                <strong>Teacher ID:</strong> ${currentUser.id}
                            </div>
                            <div class="detail-item">
                                <strong>Email:</strong> ${currentUser.email || 'Not provided'}
                            </div>
                            <div class="detail-item">
                                <strong>Assigned Class:</strong> ${currentUser.class || 'Not Assigned'}
                            </div>
                            <div class="detail-item">
                                <strong>Subjects:</strong> ${currentUser.subjects ? currentUser.subjects.join(', ') : 'None assigned'}
                            </div>
                        </div>
                        
                        <button class="primary-btn" onclick="alert('Edit Profile - Coming Soon!')">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Generate teacher settings content
function generateTeacherSettingsContent() {
    return `
        <div class="teacher-settings">
            <div class="section-header">
                <h2>⚙️ Settings</h2>
                <p>Manage your account settings and preferences</p>
            </div>
            
            <div class="settings-content">
                <div class="settings-section">
                    <h3>Account Settings</h3>
                    <div class="setting-item">
                        <label>Change Password</label>
                        <button class="secondary-btn" onclick="alert('Change Password - Coming Soon!')">
                            <i class="fas fa-key"></i> Change Password
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>Preferences</h3>
                    <div class="setting-item">
                        <label>Notifications</label>
                        <button class="secondary-btn" onclick="alert('Notification Settings - Coming Soon!')">
                            <i class="fas fa-bell"></i> Manage Notifications
                        </button>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>System</h3>
                    <div class="setting-item">
                        <label>Logout</label>
                        <button class="danger-btn" onclick="logout()">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===================================
// UI FUNCTIONS
// ===================================

// Switch between admin and teacher login tabs
function switchTab(tabType) {
    console.log(`🔄 Switching to ${tabType} login tab`);
    
    // Update hidden userType field
    const userTypeField = document.getElementById('userType');
    if (userTypeField) {
        userTypeField.value = tabType;
    }
    
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeTab = document.querySelector(`[onclick="switchTab('${tabType}')"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update placeholder text based on tab
    const usernameField = document.getElementById('username');
    if (usernameField) {
        if (tabType === 'admin') {
            usernameField.placeholder = 'Admin Username (admin)';
        } else {
            usernameField.placeholder = 'Teacher Email or Username';
        }
    }
}

// Toggle password visibility
function togglePassword() {
    const passwordField = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password i');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// ===================================
// UTILITY FUNCTIONS
// ===================================

// Show notification
function showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    // Check if document.body exists
    if (!document.body) {
        console.warn('⚠️ document.body not available, notification skipped');
        return;
    }
    
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        try {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            `;
            document.body.appendChild(notification);
        } catch (error) {
            console.error('❌ Error creating notification:', error);
            return;
        }
    }
    
    // Set notification style based on type
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    notification.style.backgroundColor = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification) {
            notification.style.display = 'none';
        }
    }, 5000);
}

// ===================================
// ADMIN CONTENT GENERATION FUNCTIONS
// ===================================

// Generate admin overview content
async function generateAdminOverviewContent() {
    try {
        // Load data from Firebase
        const teachers = await getTeachersFromFirebase();
        const students = await getStudentsFromFirebase();
        const proformaA = await getProformaAFromFirebase();
        const proformaB = await getProformaBFromFirebase();
        
        // Calculate actual report counts
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        const departments = ['Mechanical Engineering', 'Computer Engineering', 'Electrical Engineering', 'Civil Engineering', 'Electronics Engineering'];
        const classes = ['ME5K', 'CE5K', 'EE5K', 'CV5K', 'EC5K', 'ME6K', 'CE6K', 'EE6K'];
        
        // Count available Proforma-A reports (class-wise)
        const availableClasses = classes.filter(cls => {
            const classStudents = students.filter(s => s.class === cls);
            return classStudents.length > 0;
        });
        
        // Count available Proforma-B reports (subject-wise)
        const uniqueSubjects = [...new Set(savedMarks.map(mark => mark.subject))].filter(Boolean);
        
        return `
            <div class="admin-overview">
                <div class="simple-welcome">
                    <h2>Welcome to BVIT Result Analysis System</h2>
                    <p>Admin Dashboard</p>
                </div>

                <div class="simple-stats">
                    <div class="simple-card">
                        <h3>Teachers</h3>
                        <p class="number">${teachers.length}</p>
                        <span>Faculty Members</span>
                    </div>
                    <div class="simple-card">
                        <h3>Students</h3>
                        <p class="number">${students.length}</p>
                        <span>Enrolled Students</span>
                    </div>
                    <div class="simple-card">
                        <h3>Proforma-A</h3>
                        <p class="number">${availableClasses.length}</p>
                        <span>Class Reports Available</span>
                    </div>
                    <div class="simple-card">
                        <h3>Proforma-B</h3>
                        <p class="number">${uniqueSubjects.length}</p>
                        <span>Subject Reports Available</span>
                    </div>
                </div>
                
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating admin overview:', error);
        return '<div class="error-message">Error loading overview data</div>';
    }
}

// Generate teacher management content
async function generateTeacherManagementContent() {
    try {
        // Setup real-time Firebase listener for teachers
        setupTeacherRealtimeListener();
        
        const teachers = await getTeachersFromFirebase();
        
        // Calculate statistics
        const totalTeachers = teachers.length;
        const departments = [...new Set(teachers.map(t => t.department).filter(d => d))];
        const adminCount = teachers.filter(t => t.role === 'Admin').length;
        const teacherCount = teachers.filter(t => t.role !== 'Admin').length;
        
        let teacherTable = '';
        if (teachers.length === 0) {
            teacherTable = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <h3>No Teachers Found</h3>
                    <p>Start by adding your first teacher to the system</p>
                    <button class="btn btn-primary" onclick="showAddTeacherForm()">
                        <i class="fas fa-plus"></i>
                        Add First Teacher
                    </button>
                </div>
            `;
        } else {
            const teacherRows = teachers.map(teacher => {
                // Format assigned subjects
                let assignedSubjects = 'No subjects assigned';
                if (teacher.subjects && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
                    if (teacher.subjects.length <= 3) {
                        assignedSubjects = teacher.subjects.join(', ');
                    } else {
                        assignedSubjects = teacher.subjects.slice(0, 2).join(', ') + ` +${teacher.subjects.length - 2} more`;
                    }
                } else if (teacher.role === 'Class Teacher') {
                    assignedSubjects = 'All class subjects';
                }
                
                return `
                <tr>
                    <td>
                        <div class="teacher-info-cell">
                            <div class="teacher-avatar-small">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="teacher-details">
                                <strong>${teacher.name || 'N/A'}</strong>
                                <small>ID: ${teacher.id || 'N/A'}</small>
                            </div>
                        </div>
                    </td>
                    <td>${teacher.email || 'N/A'}</td>
                    <td>${teacher.department || 'N/A'}</td>
                    <td>
                        <span class="role-badge ${teacher.role === 'Admin' ? 'admin' : teacher.role === 'HOD' ? 'hod' : 'teacher'}">
                            ${teacher.role || 'Teacher'}
                        </span>
                    </td>
                    <td>${teacher.class || 'Not Assigned'}</td>
                    <td>
                        <div class="subjects-cell" title="${teacher.subjects && teacher.subjects.length > 0 ? teacher.subjects.join(', ') : 'No subjects assigned'}">
                            ${assignedSubjects}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${teacher.isActive !== false ? 'active' : 'inactive'}">
                            ${teacher.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-secondary" onclick="viewTeacher('${teacher.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="editTeacher('${teacher.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-success" onclick="assignTeacher('${teacher.id}')" title="Assign">
                                <i class="fas fa-user-tag"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteTeacher('${teacher.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                `;
            }).join('');
            
            teacherTable = `
                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-users"></i> Teachers List</h3>
                        <div class="table-actions">
                            <input type="text" placeholder="Search teachers..." class="search-input" id="teacherSearch" onkeyup="filterTeacherTable(this.value)">
                        </div>
                    </div>
                    <table class="data-table" id="teachersTable">
                        <thead>
                            <tr>
                                <th>Teacher</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Role</th>
                                <th>Assigned Class</th>
                                <th>Assigned Subjects</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${teacherRows}
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        return `
            <div class="teacher-management">
                <div class="management-header">
                    <div class="header-info">
                        <h2><i class="fas fa-users"></i> Teacher Management</h2>
                        <p>Manage faculty members, their roles, and assignments</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddTeacherForm()">
                            <i class="fas fa-user-plus"></i>
                            Add Teacher
                        </button>
                        <button class="btn btn-success" onclick="importTeachers()">
                            <i class="fas fa-file-import"></i>
                            Import Data
                        </button>
                        <button class="btn btn-info" onclick="exportTeachers()">
                            <i class="fas fa-file-export"></i>
                            Export Data
                        </button>
                    </div>
                </div>

                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-icon blue">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${totalTeachers}</span>
                            <span class="stat-label">Total Teachers</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon green">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${departments.length}</span>
                            <span class="stat-label">Departments</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon purple">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${adminCount}</span>
                            <span class="stat-label">Administrators</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon orange">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${teacherCount}</span>
                            <span class="stat-label">Faculty Members</span>
                        </div>
                    </div>
                </div>

                ${teacherTable}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating teacher management content:', error);
        return '<div class="error-message">Error loading teacher data</div>';
    }
}

// Initialize teacher filters after content loads
function initializeTeacherManagement() {
    setTimeout(() => {
        initializeTeacherFilters();
    }, 100);
}

// Generate student management content
async function generateStudentManagementContent() {
    try {
        // Setup real-time Firebase listener for students
        setupStudentRealtimeListener();
        
        const students = await getStudentsFromFirebase();
        
        // Calculate statistics
        const totalStudents = students.length;
        const departments = [...new Set(students.map(s => s.department).filter(d => d))];
        const classes = [...new Set(students.map(s => s.class).filter(c => c))];
        const semesters = [...new Set(students.map(s => s.semester).filter(s => s))];
        
        let studentTable = '';
        if (students.length === 0) {
            studentTable = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <h3>No Students Found</h3>
                    <p>Start by adding students to the system</p>
                    <button class="btn btn-primary" onclick="showAddStudentForm()">
                        <i class="fas fa-plus"></i>
                        Add First Student
                    </button>
                </div>
            `;
        } else {
            const studentRows = students.map(student => `
                <tr>
                    <td><strong>${student.name || 'N/A'}</strong></td>
                    <td><strong>${student.enrollmentNo || 'N/A'}</strong></td>
                    <td>${student.department || 'N/A'}</td>
                    <td>${student.class || 'N/A'}</td>
                    <td>Sem ${student.semester || 'N/A'}</td>
                    <td>${student.scheme || 'N/A'}</td>
                    <td>${student.division || '-'}</td>
                    <td>${student.academicYear || 'N/A'}</td>
                    <td>
                        <span class="status-badge ${student.status === 'Active' ? 'active' : 'inactive'}">
                            ${student.status || 'Active'}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-sm btn-primary" onclick="editStudent('${student.enrollmentNo}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.enrollmentNo}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            // Mobile card layout
            const mobileCards = students.map(student => `
                <div class="student-card">
                    <div class="student-card-header">
                        <div class="student-card-avatar">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="student-card-info">
                            <h4>${student.name || 'N/A'}</h4>
                            <div class="enrollment">${student.enrollmentNo || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="student-card-details">
                        <div class="detail-item">
                            <div class="detail-label">Department</div>
                            <div class="detail-value">${student.department || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Class</div>
                            <div class="detail-value">${student.class || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Semester</div>
                            <div class="detail-value">Sem ${student.semester || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Scheme</div>
                            <div class="detail-value">${student.scheme || 'N/A'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Division</div>
                            <div class="detail-value">${student.division || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="detail-label">Academic Year</div>
                            <div class="detail-value">${student.academicYear || 'N/A'}</div>
                        </div>
                    </div>
                    <div class="student-card-status">
                        <span class="status-badge ${student.status === 'Active' ? 'active' : 'inactive'}">
                            ${student.status || 'Active'}
                        </span>
                    </div>
                    <div class="student-card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editStudent('${student.enrollmentNo}')" title="Edit">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.enrollmentNo}')" title="Delete">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');

            studentTable = `
                <div class="table-container">
                    <div class="table-header">
                        <h3><i class="fas fa-user-graduate"></i> Students List</h3>
                        <div class="table-actions">
                            <input type="text" placeholder="Search students..." class="search-input" id="studentSearch" onkeyup="filterStudentTableMobile(this.value)">
                        </div>
                    </div>
                    <!-- Desktop Table View -->
                    <table class="data-table" id="studentsTable">
                        <thead>
                            <tr>
                                <th>Student Name</th>
                                <th>Enrollment No</th>
                                <th>Department</th>
                                <th>Class</th>
                                <th>Semester</th>
                                <th>Scheme</th>
                                <th>Division</th>
                                <th>Academic Year</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${studentRows}
                        </tbody>
                    </table>
                    <!-- Mobile Card View -->
                    <div class="mobile-student-cards">
                        ${mobileCards}
                    </div>
                </div>
            `;
        }
        
        return `
            <div class="student-management">
                <div class="management-header">
                    <div class="header-info">
                        <h2><i class="fas fa-user-graduate"></i> Student Management</h2>
                        <p>Manage student records, enrollment, and academic information</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddStudentForm()">
                            <i class="fas fa-user-plus"></i>
                            Add Student
                        </button>
                        <button class="btn btn-success" onclick="importStudents()">
                            <i class="fas fa-file-import"></i>
                            Bulk Import
                        </button>
                        <button class="btn btn-info" onclick="exportStudents()">
                            <i class="fas fa-file-export"></i>
                            Export Data
                        </button>
                        <button class="btn btn-warning" onclick="generateReports()">
                            <i class="fas fa-chart-line"></i>
                            Generate Reports
                        </button>
                    </div>
                </div>

                <div class="student-stats">
                    <div class="stat-item">
                        <div class="stat-icon blue">
                            <i class="fas fa-user-graduate"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${totalStudents}</span>
                            <span class="stat-label">Total Students</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon green">
                            <i class="fas fa-building"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${departments.length}</span>
                            <span class="stat-label">Departments</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon purple">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${classes.length}</span>
                            <span class="stat-label">Classes</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon orange">
                            <i class="fas fa-calendar-alt"></i>
                        </div>
                        <div class="stat-details">
                            <span class="stat-number">${semesters.length}</span>
                            <span class="stat-label">Semesters</span>
                        </div>
                    </div>
                </div>

                ${studentTable}
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating student management content:', error);
        return '<div class="error-message">Error loading student data</div>';
    }
}

// Generate department management content
async function generateDepartmentManagementContent() {
    try {
        const teachers = await getTeachersFromFirebase();
        const students = await getStudentsFromFirebase();
        
        // Get departments from Firebase first, then fallback to calculated ones
        const firebaseDepartments = await getDepartmentsFromFirebase();
        console.log('🏢 Firebase departments:', firebaseDepartments);
        
        // If we have departments in Firebase, use those, otherwise calculate from teachers
        let departments = [];
        let departmentStats = {};
        
        if (firebaseDepartments && firebaseDepartments.length > 0) {
            // Use Firebase departments - extract name or use id
            departments = firebaseDepartments.map(dept => dept.name || dept.id || 'Unknown Department');
            
            // Calculate stats for each Firebase department
            firebaseDepartments.forEach(dept => {
                console.log('🔍 Processing department:', dept);
                
                // Extract department name - use id if name is not available
                const deptName = dept.name || dept.id || 'Unknown Department';
                
                // Extract code from department structure or derive from name
                let deptCode = dept.code;
                if (!deptCode) {
                    // Try to derive code from department name or id
                    if (deptName.includes('Computer')) deptCode = 'CM';
                    else if (deptName.includes('Mechanical')) deptCode = 'ME';
                    else if (deptName.includes('Electronics')) deptCode = 'EE';
                    else if (deptName.includes('Civil')) deptCode = 'CE';
                    else if (deptName.includes('Information')) deptCode = 'IF';
                    else deptCode = deptName.substring(0, 2).toUpperCase();
                }
                
                const deptTeachers = teachers.filter(t => t.department === deptName);
                const deptStudents = students.filter(s => s.department === deptName);
                const classes = [...new Set(deptStudents.map(s => s.class).filter(c => c))];
                
                departmentStats[deptName] = {
                    code: deptCode,
                    division: dept.division || null,
                    teachers: deptTeachers.length,
                    students: deptStudents.length,
                    classes: classes.length,
                    hod: deptTeachers.find(t => t.role === 'HOD')?.name || 'Not Assigned',
                    createdAt: dept.createdAt,
                    status: dept.status || 'active'
                };
                
                console.log('📊 Department stats created for', deptName, ':', departmentStats[deptName]);
            });
        } else {
            // Fallback to calculated departments from teachers
            departments = [...new Set(teachers.map(t => t.department).filter(d => d))];
            
            departments.forEach(dept => {
                const deptTeachers = teachers.filter(t => t.department === dept);
                const deptStudents = students.filter(s => s.department === dept);
                const classes = [...new Set(deptStudents.map(s => s.class).filter(c => c))];
                
                departmentStats[dept] = {
                    code: 'N/A',
                    division: null,
                    teachers: deptTeachers.length,
                    students: deptStudents.length,
                    classes: classes.length,
                    hod: deptTeachers.find(t => t.role === 'HOD')?.name || 'Not Assigned',
                    status: 'active'
                };
            });
        }
        
        return `
            <div class="department-management">
                <div class="management-header">
                    <div class="header-info">
                        <h2><i class="fas fa-building"></i> Department Management</h2>
                        <p>Manage departments, classes, subjects, and organizational structure</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="showAddDepartmentForm()">
                            <i class="fas fa-plus"></i>
                            Add Department
                        </button>
                        <button class="btn btn-success" onclick="manageDepartmentStructure()">
                            <i class="fas fa-sitemap"></i>
                            Manage Structure
                        </button>
                        <button class="btn btn-info" onclick="assignHODs()">
                            <i class="fas fa-user-tie"></i>
                            Assign HODs
                        </button>
                    </div>
                </div>

                <div class="department-overview">
                    <div class="overview-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${departments.length}</h3>
                                <p>Total Departments</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${Object.values(departmentStats).reduce((sum, dept) => sum + dept.classes, 0)}</h3>
                                <p>Total Classes</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${teachers.length}</h3>
                                <p>Total Faculty</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${students.length}</h3>
                                <p>Total Students</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="departments-grid">
                    ${departments.map(dept => `
                        <div class="department-card">
                            <div class="dept-header">
                                <div class="dept-icon">
                                    <i class="fas fa-${dept === 'Computer Technology' ? 'laptop-code' : 
                                                      dept === 'Mechanical Engineering' ? 'cogs' :
                                                      dept === 'Electronics & Telecom' ? 'microchip' :
                                                      dept === 'Civil Engineering' ? 'hammer' : 'server'}"></i>
                                </div>
                                <div class="dept-status">
                                    <span class="status-badge active">Active</span>
                                </div>
                            </div>
                            <div class="dept-content">
                                <h3 class="dept-name">${dept}</h3>
                                <div class="dept-info">
                                    <p class="dept-code">
                                        <i class="fas fa-tag"></i>
                                        Code: ${departmentStats[dept]?.code || 'N/A'}
                                        ${departmentStats[dept]?.division ? ` - Division ${departmentStats[dept].division}` : ''}
                                    </p>
                                    <p class="dept-hod">
                                        <i class="fas fa-user-tie"></i>
                                        HOD: ${departmentStats[dept]?.hod || 'Not Assigned'}
                                    </p>
                                </div>
                                <div class="dept-stats">
                                    <div class="stat-item">
                                        <span class="stat-number">${departmentStats[dept]?.teachers || 0}</span>
                                        <span class="stat-label">Teachers</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">${departmentStats[dept]?.students || 0}</span>
                                        <span class="stat-label">Students</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-number">${departmentStats[dept]?.classes || 0}</span>
                                        <span class="stat-label">Classes</span>
                                    </div>
                                </div>
                            </div>
                            <div class="dept-actions">
                                <button class="action-btn primary" onclick="manageDepartment('${dept}')" title="Manage Department">
                                    <i class="fas fa-cog"></i>
                                </button>
                                <button class="action-btn success" onclick="manageClasses('${dept}')" title="Manage Classes">
                                    <i class="fas fa-users"></i>
                                </button>
                                <button class="action-btn info" onclick="manageSubjects('${dept}')" title="Manage Subjects">
                                    <i class="fas fa-book"></i>
                                </button>
                                <button class="action-btn warning" onclick="viewDepartmentReports('${dept}')" title="View Reports">
                                    <i class="fas fa-chart-bar"></i>
                                </button>
                                <button class="action-btn danger" onclick="deleteDepartment('${dept}', '${departmentStats[dept]?.code || 'N/A'}', '${departmentStats[dept]?.division || ''}')" title="Delete Department">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating department management content:', error);
        return '<div class="error-message">Error loading department data</div>';
    }
}

// Generate Proforma-A using Firebase marks data
async function generateProformaAFromMarks(selectedDepartment = '', selectedClass = '') {
    try {
        console.log('🔄 Generating Proforma-A from Firebase marks data...');
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        console.log(`📊 Found ${students.length} students and ${savedMarks.length} marks entries`);
        
        // Filter students by department and class if specified
        let filteredStudents = students;
        if (selectedDepartment) {
            filteredStudents = filteredStudents.filter(s => s.department === selectedDepartment);
            console.log(`🏢 Filtered by department "${selectedDepartment}": ${filteredStudents.length} students`);
        }
        if (selectedClass) {
            filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
            console.log(`🎓 Filtered by class "${selectedClass}": ${filteredStudents.length} students`);
        }
        
        if (filteredStudents.length === 0) {
            return `
                <div class="alert alert-warning">
                    <h4>No Students Found</h4>
                    <p>No students found for the selected criteria:</p>
                    <ul>
                        <li>Department: ${selectedDepartment || 'All Departments'}</li>
                        <li>Class: ${selectedClass || 'All Classes'}</li>
                        <li>Total students in system: ${students.length}</li>
                        <li>Total marks entries: ${savedMarks.length}</li>
                    </ul>
                </div>
            `;
        }
        
        // Calculate statistics for each student
        const studentStats = filteredStudents.map(student => {
            const studentMarks = savedMarks.filter(mark => mark.enrollmentNo === student.enrollmentNo);
            
            // Calculate total marks and percentage
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            studentMarks.forEach(mark => {
                totalMarks += parseFloat(mark.marks) || 0;
                totalMaxMarks += parseFloat(mark.maxMarks) || 100;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks * 100) : 0;
            
            // Debug logging for first few students
            if (filteredStudents.indexOf(student) < 3) {
                console.log(`📝 Student ${student.name} (${student.enrollmentNo}): ${studentMarks.length} marks, ${totalMarks}/${totalMaxMarks} = ${percentage.toFixed(2)}%`);
            }
            
            // Determine classification
            let classification = '';
            if (percentage >= 75) classification = 'Distinction';
            else if (percentage >= 60) classification = '1st Class';
            else if (percentage >= 50) classification = '2nd Class';
            else if (percentage >= 40) classification = 'Pass';
            else if (percentage < 35) classification = 'ATKT';
            else classification = 'Fail';
            
            return {
                ...student,
                totalMarks,
                totalMaxMarks,
                percentage: percentage.toFixed(2),
                classification,
                hasATKT: percentage < 35
            };
        });
        
        // Calculate overall statistics
        const totalStudents = studentStats.length;
        const studentsAppeared = studentStats.filter(s => s.totalMarks > 0).length;
        
        const distinctions = studentStats.filter(s => s.classification === 'Distinction').length;
        const firstClass = studentStats.filter(s => s.classification === '1st Class').length;
        const secondClass = studentStats.filter(s => s.classification === '2nd Class').length;
        const passClass = studentStats.filter(s => s.classification === 'Pass').length;
        const atktStudents = studentStats.filter(s => s.hasATKT).length;
        const failStudents = studentStats.filter(s => s.classification === 'Fail').length;
        
        const passedStudents = distinctions + firstClass + secondClass + passClass;
        const passPercentageWithoutATKT = totalStudents > 0 ? ((passedStudents / totalStudents) * 100).toFixed(1) : 0;
        const passPercentageWithATKT = totalStudents > 0 ? (((passedStudents + atktStudents) / totalStudents) * 100).toFixed(1) : 0;
        
        // Debug overall statistics
        console.log('📊 Proforma-A Statistics:');
        console.log(`   Total Students: ${totalStudents}`);
        console.log(`   Students Appeared: ${studentsAppeared}`);
        console.log(`   Distinctions: ${distinctions}`);
        console.log(`   First Class: ${firstClass}`);
        console.log(`   Second Class: ${secondClass}`);
        console.log(`   Pass Class: ${passClass}`);
        console.log(`   ATKT: ${atktStudents}`);
        console.log(`   Failed: ${failStudents}`);
        console.log(`   Pass % (without ATKT): ${passPercentageWithoutATKT}%`);
        console.log(`   Pass % (with ATKT): ${passPercentageWithATKT}%`);
        
        // Get class/year info
        const classYear = selectedClass || 'All Classes';
        const department = selectedDepartment || 'All Departments';
        
        return `
            <div class="proforma-a-container">
                <div class="proforma-header">
                    <h3>📊 Proforma-A: Class-wise Result Analysis</h3>
                    <div class="proforma-info">
                        <span><strong>Department:</strong> ${department}</span>
                        <span><strong>Class:</strong> ${classYear}</span>
                        <span><strong>Generated:</strong> ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="proforma-table-container">
                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th rowspan="2">Class/Year<br>(1)</th>
                                <th rowspan="2">No. of Students registered for Exam<br>(2)</th>
                                <th rowspan="2">No. of students actually appeared<br>(3)</th>
                                <th colspan="4">No. of students passed</th>
                                <th colspan="2">Pass</th>
                                <th rowspan="2">Total student passed<br>(10)<br>=8+9</th>
                                <th rowspan="2">Total No. of student Failed</th>
                                <th rowspan="2">Total passing % without ATKT</th>
                                <th rowspan="2">Total passing % with & without ATKT</th>
                            </tr>
                            <tr>
                                <th>1st class with Distinction<br>(4)</th>
                                <th>1st class<br>(5)</th>
                                <th>2nd class<br>(6)</th>
                                <th>Pass class<br>(7)</th>
                                <th>Without ATKT<br>(8) = (4+5+6+7)</th>
                                <th>With ATKT<br>(9)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>${classYear}</strong></td>
                                <td>${totalStudents}</td>
                                <td>${studentsAppeared}</td>
                                <td>${distinctions}</td>
                                <td>${firstClass}</td>
                                <td>${secondClass}</td>
                                <td>${passClass}</td>
                                <td>${passedStudents}</td>
                                <td>${atktStudents}</td>
                                <td>${passedStudents + atktStudents}</td>
                                <td>${failStudents}</td>
                                <td>${passPercentageWithoutATKT}%</td>
                                <td>${passPercentageWithATKT}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="proforma-actions">
                    <button class="btn btn-primary" onclick="printProformaA()">
                        <i class="fas fa-print"></i> Print Report
                    </button>
                    <button class="btn btn-info" onclick="saveProformaA()">
                        <i class="fas fa-save"></i> Save Report
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Error generating Proforma-A:', error);
        return '<div class="alert alert-danger">Error generating Proforma-A report</div>';
    }
}

// Generate Proforma-B using Firebase marks data (Subject-wise)
async function generateProformaBFromMarks(selectedDepartment = '', selectedClass = '') {
    try {
        console.log('🔄 Generating Proforma-B from Firebase marks data...');
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        console.log(`📊 Found ${students.length} students and ${savedMarks.length} marks entries`);
        
        // Filter students by department and class if specified
        let filteredStudents = students;
        if (selectedDepartment) {
            filteredStudents = filteredStudents.filter(s => s.department === selectedDepartment);
            console.log(`🏢 Filtered by department "${selectedDepartment}": ${filteredStudents.length} students`);
        }
        if (selectedClass) {
            filteredStudents = filteredStudents.filter(s => s.class === selectedClass);
            console.log(`🎓 Filtered by class "${selectedClass}": ${filteredStudents.length} students`);
        }
        
        if (filteredStudents.length === 0) {
            return `
                <div class="alert alert-warning">
                    <h4>No Students Found</h4>
                    <p>No students found for the selected criteria:</p>
                    <ul>
                        <li>Department: ${selectedDepartment || 'All Departments'}</li>
                        <li>Class: ${selectedClass || 'All Classes'}</li>
                        <li>Total students in system: ${students.length}</li>
                        <li>Total marks entries: ${savedMarks.length}</li>
                    </ul>
                </div>
            `;
        }
        
        // Get all unique subjects from marks data
        const allSubjects = [...new Set(savedMarks.map(mark => mark.subject).filter(s => s))];
        console.log(`📚 Found subjects: ${allSubjects.join(', ')}`);
        
        // Debug: Check if PER subject exists and show sample marks
        const perMarks = savedMarks.filter(mark => mark.subject === 'PER');
        console.log(`🔍 PER Subject Check: Found ${perMarks.length} PER marks entries`);
        if (perMarks.length > 0) {
            console.log(`   Sample PER marks:`, perMarks.slice(0, 3).map(m => ({
                enrollmentNo: m.enrollmentNo,
                marks: m.marks,
                maxMarks: m.maxMarks,
                teacherName: m.teacherName
            })));
        }
        
        // Check for subject name variations
        const subjectVariations = savedMarks.map(mark => mark.subject).filter(s => s && s.toLowerCase().includes('per'));
        if (subjectVariations.length > 0) {
            console.log(`🔍 PER-related subjects found:`, [...new Set(subjectVariations)]);
        }
        
        // Calculate statistics for each subject
        const subjectStats = allSubjects.map(subject => {
            // Get all marks for this subject from filtered students
            // Also check for rollNo as fallback for backward compatibility
            const subjectMarks = savedMarks.filter(mark => {
                if (mark.subject !== subject) return false;
                
                return filteredStudents.some(student => 
                    student.enrollmentNo === mark.enrollmentNo || 
                    student.enrollmentNo === mark.rollNo ||
                    student.rollNo === mark.enrollmentNo ||
                    student.rollNo === mark.rollNo
                );
            });
            
            // Remove duplicate entries for same student-subject combination
            // But keep the entry with the most complete teacher information
            const uniqueSubjectMarks = [];
            const seenStudents = new Set();
            
            subjectMarks.forEach(mark => {
                const studentId = mark.enrollmentNo || mark.rollNo;
                if (!seenStudents.has(studentId)) {
                    seenStudents.add(studentId);
                    uniqueSubjectMarks.push(mark);
                } else {
                    // If we already have this student, check if current mark has better teacher info
                    const existingIndex = uniqueSubjectMarks.findIndex(existing => 
                        (existing.enrollmentNo || existing.rollNo) === studentId
                    );
                    if (existingIndex !== -1) {
                        const existing = uniqueSubjectMarks[existingIndex];
                        // Replace if current mark has teacher name and existing doesn't
                        if (mark.teacherName && !existing.teacherName) {
                            uniqueSubjectMarks[existingIndex] = mark;
                        }
                    }
                }
            });
            
            const totalRegistered = filteredStudents.length;
            const actualAppeared = uniqueSubjectMarks.length;
            
            // Debug logging for PER subject specifically
            if (subject === 'PER') {
                console.log('🔍 PER Subject Debug (FIXED):');
                console.log(`   Total Students: ${filteredStudents.length}`);
                console.log(`   PER Marks Found (Raw): ${subjectMarks.length}`);
                console.log(`   PER Marks Found (Unique): ${uniqueSubjectMarks.length}`);
                console.log(`   Duplicate entries removed: ${subjectMarks.length - uniqueSubjectMarks.length}`);
                console.log(`   Sample Student EnrollmentNos:`, filteredStudents.slice(0, 3).map(s => s.enrollmentNo));
            }
            
            // Calculate classifications for this subject using unique marks
            let distinctions = 0;
            let firstClass = 0;
            let secondClass = 0;
            let passClass = 0;
            let failed = 0;
            
            uniqueSubjectMarks.forEach(mark => {
                const marks = parseFloat(mark.marks) || 0;
                const maxMarks = parseFloat(mark.maxMarks) || 100;
                const percentage = maxMarks > 0 ? (marks / maxMarks * 100) : 0;
                
                // Debug for PER subject
                if (subject === 'PER' && uniqueSubjectMarks.indexOf(mark) < 3) {
                    console.log(`   PER Student ${mark.enrollmentNo}: ${marks}/${maxMarks} = ${percentage.toFixed(2)}%`);
                }
                
                if (percentage >= 75) distinctions++;
                else if (percentage >= 60) firstClass++;
                else if (percentage >= 50) secondClass++;
                else if (percentage >= 40) passClass++;
                else failed++;
            });
            
            const totalPassed = distinctions + firstClass + secondClass + passClass;
            const passPercentage = actualAppeared > 0 ? ((totalPassed / actualAppeared) * 100).toFixed(1) : 0;
            
            // Get teacher name for this subject - try multiple sources and fields
            let teacherName = 'Unknown';
            
            if (uniqueSubjectMarks.length > 0) {
                // Try multiple teacher name fields
                const teacherFields = ['teacherName', 'teacher', 'createdBy', 'enteredBy', 'userEmail'];
                
                for (const field of teacherFields) {
                    const markWithTeacher = uniqueSubjectMarks.find(mark => 
                        mark[field] && 
                        mark[field].trim() !== '' && 
                        mark[field] !== 'Unknown' &&
                        mark[field] !== 'Unknown Teacher' &&
                        !mark[field].includes('@') // Skip email addresses for now
                    );
                    
                    if (markWithTeacher) {
                        teacherName = markWithTeacher[field];
                        break;
                    }
                }
                
                // If still not found, try all marks for this subject
                if (teacherName === 'Unknown') {
                    const allSubjectMarks = savedMarks.filter(mark => mark.subject === subject);
                    
                    for (const field of teacherFields) {
                        const teacherMark = allSubjectMarks.find(mark => 
                            mark[field] && 
                            mark[field].trim() !== '' && 
                            mark[field] !== 'Unknown' &&
                            mark[field] !== 'Unknown Teacher' &&
                            !mark[field].includes('@') // Skip email addresses for now
                        );
                        
                        if (teacherMark) {
                            teacherName = teacherMark[field];
                            break;
                        }
                    }
                }
                
                // Last resort: use email if available
                if (teacherName === 'Unknown') {
                    const emailMark = uniqueSubjectMarks.find(mark => 
                        mark.userEmail && mark.userEmail.includes('@')
                    );
                    if (emailMark) {
                        // Extract name from email (before @)
                        teacherName = emailMark.userEmail.split('@')[0];
                    }
                }
            }
            
            // Debug teacher name for PER
            if (subject === 'PER') {
                console.log(`   PER Teacher Name: "${teacherName}"`);
                const teacherSources = uniqueSubjectMarks.map(mark => ({
                    student: mark.enrollmentNo,
                    teacher: mark.teacherName || 'None',
                    allFields: Object.keys(mark)
                })).slice(0, 5);
                console.log(`   PER Teacher Sources:`, teacherSources);
                
                // Check all possible teacher name fields
                const allPossibleTeachers = uniqueSubjectMarks.map(mark => ({
                    teacherName: mark.teacherName,
                    teacher: mark.teacher,
                    createdBy: mark.createdBy,
                    enteredBy: mark.enteredBy,
                    userEmail: mark.userEmail
                })).slice(0, 3);
                console.log(`   PER All Teacher Fields:`, allPossibleTeachers);
            }
            
            // Debug final stats for PER
            if (subject === 'PER') {
                console.log(`   PER Final Stats (CORRECTED): Registered=${totalRegistered}, Appeared=${actualAppeared}, Passed=${totalPassed}, Pass%=${passPercentage}%`);
                console.log(`   PER Classifications: Dist=${distinctions}, 1st=${firstClass}, 2nd=${secondClass}, Pass=${passClass}, Fail=${failed}`);
            }
            
            return {
                subject,
                totalRegistered,
                actualAppeared,
                totalPassed,
                distinctions,
                firstClass,
                secondClass,
                passClass,
                failed,
                passPercentage,
                teacherName
            };
        });
        
        // Debug subject statistics
        console.log('📊 Proforma-B Subject Statistics:');
        subjectStats.forEach((stat, index) => {
            if (index < 3) {
                console.log(`   ${stat.subject}: ${stat.actualAppeared}/${stat.totalRegistered} appeared, ${stat.totalPassed} passed (${stat.passPercentage}%)`);
            }
        });
        
        // Get class/year info
        const classYear = selectedClass || 'All Classes';
        const department = selectedDepartment || 'All Departments';
        
        return `
            <div class="proforma-b-container">
                <div class="proforma-header">
                    <h3>📈 Proforma-B: Subject-wise Result Analysis</h3>
                    <div class="proforma-info">
                        <span><strong>Department:</strong> ${department}</span>
                        <span><strong>Class:</strong> ${classYear}</span>
                        <span><strong>Generated:</strong> ${new Date().toLocaleDateString()}</span>
                    </div>
                </div>
                
                <div class="proforma-table-container">
                    <table class="proforma-table">
                        <thead>
                            <tr>
                                <th rowspan="2">Sr. No.</th>
                                <th rowspan="2">Subject Name</th>
                                <th rowspan="2">Total no. of students registered</th>
                                <th rowspan="2">Actual no. of students appeared</th>
                                <th rowspan="2">Total no. of students passed</th>
                                <th colspan="4">Classification</th>
                                <th rowspan="2">% of Passing</th>
                                <th rowspan="2">Name of Teacher</th>
                            </tr>
                            <tr>
                                <th>1st class with Distinction</th>
                                <th>1st class</th>
                                <th>2nd class</th>
                                <th>Pass class</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectStats.map((stat, index) => `
                                <tr>
                                    <td>${index + 1}</td>
                                    <td><strong>${stat.subject}</strong></td>
                                    <td>${stat.totalRegistered}</td>
                                    <td>${stat.actualAppeared}</td>
                                    <td>${stat.totalPassed}</td>
                                    <td>${stat.distinctions}</td>
                                    <td>${stat.firstClass}</td>
                                    <td>${stat.secondClass}</td>
                                    <td>${stat.passClass}</td>
                                    <td><strong>${stat.passPercentage}%</strong></td>
                                    <td>${stat.teacherName}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="proforma-actions">
                    <button class="btn btn-primary" onclick="printProformaB()">
                        <i class="fas fa-print"></i> Print Report
                    </button>
                    <button class="btn btn-info" onclick="saveProformaB()">
                        <i class="fas fa-save"></i> Save Report
                    </button>
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Error generating Proforma-B:', error);
        return '<div class="alert alert-danger">Error generating Proforma-B report</div>';
    }
}

// Generate results analysis content
async function generateResultsAnalysisContent() {
    try {
        const proformaA = await getProformaAFromFirebase();
        const proformaB = await getProformaBFromFirebase();
        
        return `
            <div class="results-analysis">
                <div class="management-header">
                    <div class="header-info">
                        <h2><i class="fas fa-chart-bar"></i> Results Analysis</h2>
                        <p>Comprehensive analysis of student performance and academic results</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="generateNewReport()">
                            <i class="fas fa-plus"></i>
                            Generate Report
                        </button>
                        <button class="btn btn-success" onclick="exportAllReports()">
                            <i class="fas fa-file-export"></i>
                            Export All
                        </button>
                    </div>
                </div>

                <!-- Proforma-A Generator Section -->
                <div class="proforma-generator">
                    <div class="generator-header">
                        <h3>📊 Generate Proforma-A Report</h3>
                        <p>Create class-wise result analysis from Firebase marks data</p>
                    </div>
                    
                    <div class="generator-filters">
                        <div class="filter-group">
                            <label for="proformaDeptSelect">Select Department:</label>
                            <select id="proformaDeptSelect" class="form-control">
                                <option value="">All Departments</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Computer Engineering">Computer Engineering</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Electronics Engineering">Electronics Engineering</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="proformaClassSelect">Select Class:</label>
                            <select id="proformaClassSelect" class="form-control">
                                <option value="">All Classes</option>
                                <option value="ME5K">ME5K</option>
                                <option value="CE5K">CE5K</option>
                                <option value="EE5K">EE5K</option>
                                <option value="CV5K">CV5K</option>
                                <option value="EC5K">EC5K</option>
                                <option value="ME6K">ME6K</option>
                                <option value="CE6K">CE6K</option>
                                <option value="EE6K">EE6K</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="proformaDateSelect">
                                <i class="fas fa-calendar-alt"></i>
                                Result Declaration Date: 
                                <span style="color: #e74c3c; font-weight: bold;">*</span>
                            </label>
                            <input type="date" id="proformaDateSelect" class="form-control" required 
                                   style="padding: 10px; border: 2px solid #3498db; border-radius: 8px; font-size: 14px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); transition: all 0.3s ease;"
                                   onchange="this.style.borderColor='#27ae60'; this.style.background='linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'"
                                   onfocus="this.style.borderColor='#3498db'; this.style.boxShadow='0 0 10px rgba(52, 152, 219, 0.3)'"
                                   onblur="this.style.boxShadow='none'">
                        </div>
                        
                        <div class="filter-actions">
                            <button class="btn btn-primary" onclick="generateProformaAReport()">
                                <i class="fas fa-chart-bar"></i>
                                Generate Proforma-A
                            </button>
                            <button class="btn btn-secondary" onclick="clearProformaFilters()">
                                <i class="fas fa-times"></i>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                    
                    <div id="proformaAResult" class="proforma-result">
                        <div class="empty-state">
                            <i class="fas fa-chart-bar"></i>
                            <h4>Ready to Generate Proforma-A</h4>
                            <p>Select department and class, then click "Generate Proforma-A" to create the report</p>
                        </div>
                    </div>
                </div>

                <!-- Proforma-B Generator Section -->
                <div class="proforma-generator proforma-b-generator">
                    <div class="generator-header">
                        <h3>📈 Generate Proforma-B Report</h3>
                        <p>Create subject-wise result analysis from Firebase marks data</p>
                    </div>
                    
                    <div class="generator-filters">
                        <div class="filter-group">
                            <label for="proformaBDeptSelect">Select Department:</label>
                            <select id="proformaBDeptSelect" class="form-control">
                                <option value="">All Departments</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Computer Engineering">Computer Engineering</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Electronics Engineering">Electronics Engineering</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="proformaBClassSelect">Select Class:</label>
                            <select id="proformaBClassSelect" class="form-control">
                                <option value="">All Classes</option>
                                <option value="ME5K">ME5K</option>
                                <option value="CE5K">CE5K</option>
                                <option value="EE5K">EE5K</option>
                                <option value="CV5K">CV5K</option>
                                <option value="EC5K">EC5K</option>
                                <option value="ME6K">ME6K</option>
                                <option value="CE6K">CE6K</option>
                                <option value="EE6K">EE6K</option>
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="proformaBDateSelect">
                                <i class="fas fa-calendar-alt"></i>
                                Result Declaration Date: 
                                <span style="color: #e74c3c; font-weight: bold;">*</span>
                            </label>
                            <input type="date" id="proformaBDateSelect" class="form-control" required 
                                   style="padding: 10px; border: 2px solid #27ae60; border-radius: 8px; font-size: 14px; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); transition: all 0.3s ease;"
                                   onchange="this.style.borderColor='#27ae60'; this.style.background='linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)'"
                                   onfocus="this.style.borderColor='#27ae60'; this.style.boxShadow='0 0 10px rgba(39, 174, 96, 0.3)'"
                                   onblur="this.style.boxShadow='none'">
                        </div>
                        
                        <div class="filter-actions">
                            <button class="btn btn-success" onclick="generateProformaBReport()">
                                <i class="fas fa-chart-line"></i>
                                Generate Proforma-B
                            </button>
                            <button class="btn btn-secondary" onclick="clearProformaBFilters()">
                                <i class="fas fa-times"></i>
                                Clear Filters
                            </button>
                        </div>
                    </div>
                    
                    <div id="proformaBResult" class="proforma-result">
                        <div class="empty-state">
                            <i class="fas fa-chart-line"></i>
                            <h4>Ready to Generate Proforma-B</h4>
                            <p>Select department and class, then click "Generate Proforma-B" to create the subject-wise report</p>
                        </div>
                    </div>
                </div>

            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating results analysis content:', error);
        return '<div class="error-message">Error loading results analysis data</div>';
    }
}

// Generate Proforma-A Report function
async function generateProformaAReport() {
    try {
        const deptSelect = document.getElementById('proformaDeptSelect');
        const classSelect = document.getElementById('proformaClassSelect');
        const dateSelect = document.getElementById('proformaDateSelect');
        const resultDiv = document.getElementById('proformaAResult');
        
        if (!deptSelect || !classSelect || !dateSelect || !resultDiv) {
            console.error('Required elements not found');
            return;
        }
        
        const selectedDepartment = deptSelect.value;
        const selectedClass = classSelect.value;
        const selectedDate = dateSelect.value;
        
        // Validate mandatory date selection
        if (!selectedDate) {
            showNotification('❌ Please select Result Declaration Date', 'error');
            dateSelect.focus();
            return;
        }
        
        console.log(`🔄 Generating Proforma-A for Department: ${selectedDepartment || 'All'}, Class: ${selectedClass || 'All'}`);
        
        // Show loading
        resultDiv.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h4>Generating Proforma-A Report...</h4>
                <p>Processing marks data from Firebase...</p>
            </div>
        `;
        
        // Generate the report
        const reportHTML = await generateProformaAFromMarks(selectedDepartment, selectedClass);
        
        // Display the result
        resultDiv.innerHTML = reportHTML;
        
        // Show success notification
        showNotification('✅ Proforma-A report generated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error generating Proforma-A report:', error);
        const resultDiv = document.getElementById('proformaAResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error Generating Report</h4>
                    <p>Please try again or check the console for details.</p>
                </div>
            `;
        }
        showNotification('❌ Error generating Proforma-A report', 'error');
    }
}

// Clear Proforma filters
function clearProformaFilters() {
    const deptSelect = document.getElementById('proformaDeptSelect');
    const classSelect = document.getElementById('proformaClassSelect');
    const dateSelect = document.getElementById('proformaDateSelect');
    const resultDiv = document.getElementById('proformaAResult');
    
    if (deptSelect) deptSelect.value = '';
    if (classSelect) classSelect.value = '';
    if (dateSelect) dateSelect.value = '';
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <h4>Ready to Generate Proforma-A</h4>
                <p>Select department and class, then click "Generate Proforma-A" to create the report</p>
            </div>
        `;
    }
    
    showNotification('🔄 Filters cleared', 'info');
}

// Print Proforma-A function with professional BVIT format
function printProformaA() {
    const proformaContent = document.querySelector('.proforma-a-container');
    if (proformaContent) {
        // Get current data for professional format
        const deptSelect = document.getElementById('proformaDeptSelect');
        const classSelect = document.getElementById('proformaClassSelect');
        const dateSelect = document.getElementById('proformaDateSelect');
        const selectedDepartment = deptSelect ? deptSelect.value : 'Mechanical Engineering';
        const selectedClass = classSelect ? classSelect.value : 'ME5K';
        const selectedDate = dateSelect ? dateSelect.value : new Date().toISOString().split('T')[0];
        
        // Determine semester based on class
        let semester = '3rd';
        if (selectedClass) {
            const classNumber = selectedClass.match(/\d+/);
            if (classNumber) {
                const num = parseInt(classNumber[0]);
                if (num === 1) semester = '1st';
                else if (num === 2) semester = '2nd';
                else if (num === 3) semester = '3rd';
                else if (num === 4) semester = '4th';
                else if (num === 5) semester = '5th';
                else if (num === 6) semester = '6th';
                else if (num === 7) semester = '7th';
                else if (num === 8) semester = '8th';
            }
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Proforma-A Report - ${selectedClass}</title>
                    <style>
                        @page { 
                            size: A4; 
                            margin: 0.5in; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 20px;
                            font-size: 12px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .logo {
                            width: 220px;
                            height: 220px;
                            margin: 0 auto -10px;
                            background: url('./bharati-logo.png') center/contain no-repeat;
                            display: block;
                        }
                        .logo img {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                        .institute-name {
                            font-weight: bold;
                            font-size: 20px;
                            margin: -10px 0 0 0;
                            letter-spacing: 1px;
                        }
                        .location {
                            font-size: 16px;
                            font-weight: bold;
                            margin: 2px 0 25px 0;
                        }
                        .title {
                            font-weight: bold;
                            font-size: 18px;
                            text-decoration: underline;
                            margin: 25px 0 10px 0;
                        }
                        .proforma-type {
                            font-weight: bold;
                            font-size: 16px;
                            margin: 10px 0 25px 0;
                            color: #003366;
                        }
                        .info-section {
                            display: flex;
                            justify-content: space-between;
                            margin: 20px 0;
                            font-size: 14px;
                            font-weight: bold;
                        }
                        .info-left, .info-right {
                            flex: 1;
                        }
                        .info-left div, .info-right div {
                            margin: 8px 0;
                            line-height: 1.4;
                        }
                        .info-right {
                            text-align: right;
                        }
                        .proforma-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 20px 0;
                            font-size: 10px;
                        }
                        .proforma-table th, .proforma-table td { 
                            border: 1px solid #000; 
                            padding: 6px 4px; 
                            text-align: center;
                            vertical-align: middle;
                        }
                        .proforma-table th { 
                            background-color: #f0f0f0; 
                            font-weight: bold;
                            font-size: 9px;
                        }
                        .signatures {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 50px;
                            font-size: 11px;
                        }
                        .signature-section {
                            text-align: center;
                            width: 200px;
                        }
                        .signature-line {
                            border-top: 1px solid #000;
                            margin-top: 40px;
                            padding-top: 5px;
                        }
                        .proforma-actions { display: none; }
                        .proforma-header { display: none; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">
                            <img src="./bharati-logo.png" alt="Bharati Vidyapeeth Logo" onerror="this.style.display='none'">
                        </div>
                        <div class="institute-name">BHARATI VIDYAPEETH INSTITUTE OF TECHNOLOGY</div>
                        <div class="location">NAVI MUMBAI</div>
                        <div class="title">RESULT ANALYSIS (CLASS-WISE)</div>
                        <div class="proforma-type">PROFORMA - A</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-left">
                            <div>INSTITUTE CODE: 0027</div>
                            <div>PERIOD OF EXAM: Winter 2025</div>
                            <div>DATE OF DECLARATION OF RESULT: ${new Date(selectedDate).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div class="info-right">
                            <div>SEMESTER: ${semester}</div>
                            <div>DEPARTMENT: ${selectedDepartment}</div>
                        </div>
                    </div>
                    
                    ${proformaContent.innerHTML}
                    
                    <div class="signatures">
                        <div class="signature-section">
                            <div class="signature-line">Signature of HOD</div>
                        </div>
                        <div class="signature-section">
                            <div class="signature-line">Signature of Principal</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        showNotification('🖨️ Proforma-A report sent to printer', 'success');
    } else {
        showNotification('❌ No Proforma-A report found to print', 'error');
    }
}

// Export Proforma-A function - Creates downloadable HTML file
function exportProformaA() {
    const proformaContent = document.querySelector('.proforma-a-container');
    if (proformaContent) {
        // Get current data for professional format
        const deptSelect = document.getElementById('proformaDeptSelect');
        const classSelect = document.getElementById('proformaClassSelect');
        const dateSelect = document.getElementById('proformaDateSelect');
        const selectedDepartment = deptSelect ? deptSelect.value : 'Mechanical Engineering';
        const selectedClass = classSelect ? classSelect.value : 'ME5K';
        const selectedDate = dateSelect ? dateSelect.value : new Date().toISOString().split('T')[0];
        
        // Determine semester based on class
        let semester = '3rd';
        if (selectedClass) {
            const classNumber = selectedClass.match(/\d+/);
            if (classNumber) {
                const num = parseInt(classNumber[0]);
                if (num === 1) semester = '1st';
                else if (num === 2) semester = '2nd';
                else if (num === 3) semester = '3rd';
                else if (num === 4) semester = '4th';
                else if (num === 5) semester = '5th';
                else if (num === 6) semester = '6th';
                else if (num === 7) semester = '7th';
                else if (num === 8) semester = '8th';
            }
        }
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Proforma-A Report - ${selectedClass}</title>
    <meta charset="UTF-8">
    <style>
        @page { 
            size: A4; 
            margin: 0.5in; 
        }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 220px;
            height: 220px;
            margin: 0 auto -10px;
            background: url('./bharati-logo.png') center/contain no-repeat;
            display: block;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .institute-name {
            font-weight: bold;
            font-size: 20px;
            margin: -10px 0 0 0;
            letter-spacing: 1px;
        }
        .location {
            font-size: 16px;
            font-weight: bold;
            margin: 2px 0 25px 0;
        }
        .title {
            font-weight: bold;
            font-size: 18px;
            text-decoration: underline;
            margin: 25px 0 10px 0;
        }
        .proforma-type {
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0 25px 0;
            color: #003366;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 14px;
            font-weight: bold;
        }
        .info-left, .info-right {
            flex: 1;
        }
        .info-left div, .info-right div {
            margin: 8px 0;
            line-height: 1.4;
        }
        .info-right {
            text-align: right;
        }
        .proforma-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 10px;
        }
        .proforma-table th, .proforma-table td { 
            border: 1px solid #000; 
            padding: 6px 4px; 
            text-align: center;
            vertical-align: middle;
        }
        .proforma-table th { 
            background-color: #f0f0f0; 
            font-weight: bold;
            font-size: 9px;
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            font-size: 11px;
        }
        .signature-section {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
        }
        .proforma-actions { display: none; }
        .proforma-header { display: none; }
        @media print {
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="./bharati-logo.png" alt="Bharati Vidyapeeth Logo" onerror="this.style.display='none'">
        </div>
        <div class="institute-name">BHARATI VIDYAPEETH INSTITUTE OF TECHNOLOGY</div>
        <div class="location">NAVI MUMBAI</div>
        <div class="title">RESULT ANALYSIS (CLASS-WISE)</div>
        <div class="proforma-type">PROFORMA - A</div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div>INSTITUTE CODE: 0027</div>
            <div>PERIOD OF EXAM: Winter 2025</div>
            <div>DATE OF DECLARATION OF RESULT: ${new Date(selectedDate).toLocaleDateString('en-GB')}</div>
        </div>
        <div class="info-right">
            <div>SEMESTER: ${semester}</div>
            <div>DEPARTMENT: ${selectedDepartment}</div>
        </div>
    </div>
    
    ${proformaContent.innerHTML}
    
    <div class="signatures">
        <div class="signature-section">
            <div class="signature-line">Signature of HOD</div>
        </div>
        <div class="signature-section">
            <div class="signature-line">Signature of Principal</div>
        </div>
    </div>
    
    <div class="no-print" style="margin-top: 30px; text-align: center; color: #666;">
        <p>This is an exported Proforma-A report. Use Ctrl+P to print or save as PDF.</p>
    </div>
</body>
</html>`;
        
        // Create and download the file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Proforma-A_${selectedClass}_${selectedDepartment.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📄 Proforma-A report exported successfully!', 'success');
    } else {
        showNotification('❌ No Proforma-A report found to export', 'error');
    }
}

// Save Proforma-A function
function saveProformaA() {
    showNotification('💾 Save functionality will be implemented soon', 'info');
}

// Generate Proforma-B Report function
async function generateProformaBReport() {
    try {
        const deptSelect = document.getElementById('proformaBDeptSelect');
        const classSelect = document.getElementById('proformaBClassSelect');
        const dateSelect = document.getElementById('proformaBDateSelect');
        const resultDiv = document.getElementById('proformaBResult');
        
        if (!deptSelect || !classSelect || !dateSelect || !resultDiv) {
            console.error('Required elements not found');
            return;
        }
        
        const selectedDepartment = deptSelect.value;
        const selectedClass = classSelect.value;
        const selectedDate = dateSelect.value;
        
        // Validate mandatory date selection
        if (!selectedDate) {
            showNotification('❌ Please select Result Declaration Date', 'error');
            dateSelect.focus();
            return;
        }
        
        console.log(`🔄 Generating Proforma-B for Department: ${selectedDepartment || 'All'}, Class: ${selectedClass || 'All'}`);
        
        // Show loading
        resultDiv.innerHTML = `
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <h4>Generating Proforma-B Report...</h4>
                <p>Processing subject-wise marks data from Firebase...</p>
            </div>
        `;
        
        // Generate the report
        const reportHTML = await generateProformaBFromMarks(selectedDepartment, selectedClass);
        
        // Display the result
        resultDiv.innerHTML = reportHTML;
        
        // Show success notification
        showNotification('✅ Proforma-B report generated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Error generating Proforma-B report:', error);
        const resultDiv = document.getElementById('proformaBResult');
        if (resultDiv) {
            resultDiv.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Error Generating Report</h4>
                    <p>Please try again or check the console for details.</p>
                </div>
            `;
        }
        showNotification('❌ Error generating Proforma-B report', 'error');
    }
}

// Clear Proforma-B filters
function clearProformaBFilters() {
    const deptSelect = document.getElementById('proformaBDeptSelect');
    const classSelect = document.getElementById('proformaBClassSelect');
    const dateSelect = document.getElementById('proformaBDateSelect');
    const resultDiv = document.getElementById('proformaBResult');
    
    if (deptSelect) deptSelect.value = '';
    if (classSelect) classSelect.value = '';
    if (dateSelect) dateSelect.value = '';
    
    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-line"></i>
                <h4>Ready to Generate Proforma-B</h4>
                <p>Select department and class, then click "Generate Proforma-B" to create the subject-wise report</p>
            </div>
        `;
    }
    
    showNotification('🔄 Filters cleared', 'info');
}

// Print Proforma-B function with professional BVIT format
function printProformaB() {
    const proformaContent = document.querySelector('.proforma-b-container');
    if (proformaContent) {
        // Get current data for professional format
        const deptSelect = document.getElementById('proformaBDeptSelect');
        const classSelect = document.getElementById('proformaBClassSelect');
        const dateSelect = document.getElementById('proformaBDateSelect');
        const selectedDepartment = deptSelect ? deptSelect.value : 'Mechanical Engineering';
        const selectedClass = classSelect ? classSelect.value : 'ME5K';
        const selectedDate = dateSelect ? dateSelect.value : new Date().toISOString().split('T')[0];
        
        // Determine semester based on class
        let semester = '3rd';
        if (selectedClass) {
            const classNumber = selectedClass.match(/\d+/);
            if (classNumber) {
                const num = parseInt(classNumber[0]);
                if (num === 1) semester = '1st';
                else if (num === 2) semester = '2nd';
                else if (num === 3) semester = '3rd';
                else if (num === 4) semester = '4th';
                else if (num === 5) semester = '5th';
                else if (num === 6) semester = '6th';
                else if (num === 7) semester = '7th';
                else if (num === 8) semester = '8th';
            }
        }
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Proforma-B Report - ${selectedClass}</title>
                    <style>
                        @page { 
                            size: A4; 
                            margin: 0.5in; 
                        }
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0;
                            padding: 20px;
                            font-size: 12px;
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .logo {
                            width: 220px;
                            height: 220px;
                            margin: 0 auto -10px;
                            background: url('./bharati-logo.png') center/contain no-repeat;
                            display: block;
                        }
                        .logo img {
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                        }
                        .institute-name {
                            font-weight: bold;
                            font-size: 20px;
                            margin: -10px 0 0 0;
                            letter-spacing: 1px;
                        }
                        .location {
                            font-size: 16px;
                            font-weight: bold;
                            margin: 2px 0 25px 0;
                        }
                        .title {
                            font-weight: bold;
                            font-size: 18px;
                            text-decoration: underline;
                            margin: 25px 0 10px 0;
                        }
                        .proforma-type {
                            font-weight: bold;
                            font-size: 16px;
                            margin: 10px 0 25px 0;
                            color: #003366;
                        }
                        .info-section {
                            display: flex;
                            justify-content: space-between;
                            margin: 20px 0;
                            font-size: 14px;
                            font-weight: bold;
                        }
                        .info-left, .info-right {
                            flex: 1;
                        }
                        .info-right {
                            text-align: right;
                        }
                        .info-left div, .info-right div {
                            margin: 3px 0;
                            font-weight: bold;
                        }
                        .proforma-table { 
                            width: 100%; 
                            border-collapse: collapse; 
                            margin: 20px 0; 
                            font-size: 11px;
                        }
                        .proforma-table th, .proforma-table td { 
                            border: 1px solid #000; 
                            padding: 6px; 
                            text-align: center; 
                        }
                        .proforma-table th { 
                            background-color: #f0f0f0; 
                            font-weight: bold; 
                        }
                        .signatures {
                            display: flex;
                            justify-content: space-between;
                            margin-top: 50px;
                            font-size: 11px;
                        }
                        .signature-section {
                            text-align: center;
                            width: 200px;
                        }
                        .signature-line {
                            border-top: 1px solid #000;
                            margin-top: 40px;
                            padding-top: 5px;
                        }
                        .proforma-actions { display: none; }
                        .proforma-header { display: none; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">
                            <img src="./bharati-logo.png" alt="Bharati Vidyapeeth Logo" onerror="this.style.display='none'">
                        </div>
                        <div class="institute-name">BHARATI VIDYAPEETH INSTITUTE OF TECHNOLOGY</div>
                        <div class="location">NAVI MUMBAI</div>
                        <div class="title">RESULT ANALYSIS (SUBJECT-WISE)</div>
                        <div class="proforma-type">PROFORMA - B</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-left">
                            <div>INSTITUTE CODE: 0027</div>
                            <div>PERIOD OF EXAM: Winter 2025</div>
                            <div>DATE OF DECLARATION OF RESULT: ${new Date(selectedDate).toLocaleDateString('en-GB')}</div>
                        </div>
                        <div class="info-right">
                            <div>SEMESTER: ${semester}</div>
                            <div>DEPARTMENT: ${selectedDepartment}</div>
                        </div>
                    </div>
                    
                    ${proformaContent.innerHTML}
                    
                    <div class="signatures">
                        <div class="signature-section">
                            <div class="signature-line">Signature of HOD</div>
                        </div>
                        <div class="signature-section">
                            <div class="signature-line">Signature of Principal</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
        showNotification('🖨️ Proforma-B report sent to printer', 'success');
    } else {
        showNotification('❌ No Proforma-B report found to print', 'error');
    }
}

// Export Proforma-B function - Creates downloadable HTML file
function exportProformaB() {
    const proformaContent = document.querySelector('.proforma-b-container');
    if (proformaContent) {
        // Get current data for professional format
        const deptSelect = document.getElementById('proformaBDeptSelect');
        const classSelect = document.getElementById('proformaBClassSelect');
        const dateSelect = document.getElementById('proformaBDateSelect');
        const selectedDepartment = deptSelect ? deptSelect.value : 'Mechanical Engineering';
        const selectedClass = classSelect ? classSelect.value : 'ME5K';
        const selectedDate = dateSelect ? dateSelect.value : new Date().toISOString().split('T')[0];
        
        // Determine semester based on class
        let semester = '3rd';
        if (selectedClass) {
            const classNumber = selectedClass.match(/\d+/);
            if (classNumber) {
                const num = parseInt(classNumber[0]);
                if (num === 1) semester = '1st';
                else if (num === 2) semester = '2nd';
                else if (num === 3) semester = '3rd';
                else if (num === 4) semester = '4th';
                else if (num === 5) semester = '5th';
                else if (num === 6) semester = '6th';
                else if (num === 7) semester = '7th';
                else if (num === 8) semester = '8th';
            }
        }
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Proforma-B Report - ${selectedClass}</title>
    <meta charset="UTF-8">
    <style>
        @page { 
            size: A4; 
            margin: 0.5in; 
        }
        body { 
            font-family: Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            width: 220px;
            height: 220px;
            margin: 0 auto -10px;
            background: url('./bharati-logo.png') center/contain no-repeat;
            display: block;
        }
        .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        .institute-name {
            font-weight: bold;
            font-size: 20px;
            margin: -10px 0 0 0;
            letter-spacing: 1px;
        }
        .location {
            font-size: 16px;
            font-weight: bold;
            margin: 2px 0 25px 0;
        }
        .title {
            font-weight: bold;
            font-size: 18px;
            text-decoration: underline;
            margin: 25px 0 10px 0;
        }
        .proforma-type {
            font-weight: bold;
            font-size: 16px;
            margin: 10px 0 25px 0;
            color: #003366;
        }
        .info-section {
            display: flex;
            justify-content: space-between;
            margin: 20px 0;
            font-size: 14px;
            font-weight: bold;
        }
        .info-left, .info-right {
            flex: 1;
        }
        .info-right {
            text-align: right;
        }
        .info-left div, .info-right div {
            margin: 3px 0;
            font-weight: bold;
        }
        .proforma-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0; 
            font-size: 11px;
        }
        .proforma-table th, .proforma-table td { 
            border: 1px solid #000; 
            padding: 6px; 
            text-align: center; 
        }
        .proforma-table th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
        }
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 50px;
            font-size: 11px;
        }
        .signature-section {
            text-align: center;
            width: 200px;
        }
        .signature-line {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
        }
        .proforma-actions { display: none; }
        .proforma-header { display: none; }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="./bharati-logo.png" alt="Bharati Vidyapeeth Logo" onerror="this.style.display='none'">
        </div>
        <div class="institute-name">BHARATI VIDYAPEETH INSTITUTE OF TECHNOLOGY</div>
        <div class="location">NAVI MUMBAI</div>
        <div class="title">RESULT ANALYSIS (SUBJECT-WISE)</div>
        <div class="proforma-type">PROFORMA - B</div>
    </div>
    
    <div class="info-section">
        <div class="info-left">
            <div>INSTITUTE CODE: 0027</div>
            <div>PERIOD OF EXAM: Winter 2025</div>
            <div>DATE OF DECLARATION OF RESULT: ${new Date(selectedDate).toLocaleDateString('en-GB')}</div>
        </div>
        <div class="info-right">
            <div>SEMESTER: ${semester}</div>
            <div>DEPARTMENT: ${selectedDepartment}</div>
        </div>
    </div>
    
    ${proformaContent.innerHTML}
    
    <div class="signatures">
        <div class="signature-section">
            <div class="signature-line">Signature of HOD</div>
        </div>
        <div class="signature-section">
            <div class="signature-line">Signature of Principal</div>
        </div>
    </div>
</body>
</html>
        `;
        
        // Create and download the file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Proforma-B_Report_${selectedClass}_${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('📄 Proforma-B report exported successfully!', 'success');
    } else {
        showNotification('❌ No Proforma-B report found to export', 'error');
    }
}

// Save Proforma-B function
function saveProformaB() {
    showNotification('💾 Save functionality will be implemented soon', 'info');
}

// Generate marks progress content
async function generateMarksProgressContent() {
    try {
        // Setup real-time Firebase listener for marks
        setupMarksRealtimeListener();
        
        const teachers = await getTeachersFromFirebase();
        const students = await getStudentsFromFirebase();
        
        // Get all saved marks from Firebase
        const savedMarks = await getMarksFromFirebase();
        
        // Migrate rollNo to enrollmentNo in saved marks
        const migratedMarks = savedMarks.map(mark => {
            if (mark.rollNo && !mark.enrollmentNo) {
                mark.enrollmentNo = mark.rollNo;
                delete mark.rollNo;
            }
            return mark;
        });
        
        // Update localStorage with migrated data
        localStorage.setItem('studentMarks', JSON.stringify(migratedMarks));
        
        // Calculate progress for each department
        const departments = [...new Set(teachers.map(t => t.department).filter(d => d))];
        const progressData = departments.map(dept => {
            const deptStudents = students.filter(s => s.department === dept);
            const deptTeachers = teachers.filter(t => t.department === dept);
            
            // Calculate actual progress based on marks entries
            const deptMarks = migratedMarks.filter(mark => {
                const student = students.find(s => s.enrollmentNo === mark.enrollmentNo);
                return student && student.department === dept;
            });
            
            // Get unique students with marks in this department
            const studentsWithMarks = [...new Set(deptMarks.map(mark => mark.enrollmentNo))];
            const progress = deptStudents.length > 0 ? Math.round((studentsWithMarks.length / deptStudents.length) * 100) : 0;
            
            let status = 'pending';
            if (progress >= 100) status = 'completed';
            else if (progress > 0) status = 'in-progress';
            
            return {
                department: dept,
                students: deptStudents.length,
                teachers: deptTeachers.length,
                studentsWithMarks: studentsWithMarks.length,
                totalMarksEntries: deptMarks.length,
                progress: progress,
                status: status
            };
        });
        
        return `
            <div class="marks-progress">
                <div class="management-header">
                    <div class="header-info">
                        <h2><i class="fas fa-tasks"></i> Marks Entry Progress</h2>
                        <p>Monitor and track marks entry progress across all departments</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" onclick="refreshProgress()">
                            <i class="fas fa-sync-alt"></i>
                            Refresh Data
                        </button>
                        <button class="btn btn-success" onclick="sendReminders()">
                            <i class="fas fa-bell"></i>
                            Send Reminders
                        </button>
                    </div>
                </div>

                <div class="progress-overview">
                    <div class="overview-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clipboard-check"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${progressData.filter(d => d.status === 'completed').length}</h3>
                                <p>Completed Departments</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-hourglass-half"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${progressData.filter(d => d.status === 'in-progress').length}</h3>
                                <p>In Progress</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-clock"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${progressData.filter(d => d.status === 'pending').length}</h3>
                                <p>Pending</p>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i class="fas fa-percentage"></i>
                            </div>
                            <div class="stat-info">
                                <h3>${Math.round(progressData.reduce((sum, d) => sum + d.progress, 0) / progressData.length)}%</h3>
                                <p>Overall Progress</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="progress-departments">
                    ${progressData.map(dept => `
                        <div class="department-progress-card">
                            <div class="dept-header">
                                <div class="dept-info">
                                    <h3>${dept.department}</h3>
                                    <p>${dept.students} Students • ${dept.teachers} Teachers • ${dept.studentsWithMarks} with Marks</p>
                                    <small class="text-muted">Total Marks Entries: ${dept.totalMarksEntries}</small>
                                </div>
                                <div class="dept-status">
                                    <span class="status-badge ${dept.status}">
                                        <i class="fas fa-${dept.status === 'completed' ? 'check-circle' : dept.status === 'in-progress' ? 'clock' : 'exclamation-circle'}"></i>
                                        ${dept.status === 'completed' ? 'Completed' : dept.status === 'in-progress' ? 'In Progress' : 'Pending'}
                                    </span>
                                </div>
                            </div>
                            <div class="progress-details">
                                <div class="progress-stats">
                                    <div class="stat-item">
                                        <span class="stat-label">Students with Marks:</span>
                                        <span class="stat-value">${dept.studentsWithMarks}/${dept.students}</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-label">Completion Rate:</span>
                                        <span class="stat-value">${dept.progress}%</span>
                                    </div>
                                </div>
                                <div class="progress-bar-container">
                                    <div class="progress-bar">
                                        <div class="progress-fill ${dept.status}" style="width: ${dept.progress}%"></div>
                                    </div>
                                    <span class="progress-percentage">${dept.progress}%</span>
                                </div>
                                <div class="progress-actions">
                                    <button class="btn btn-sm btn-outline-primary" onclick="viewDepartmentDetails('${dept.department}')">
                                        <i class="fas fa-eye"></i>
                                        View Details
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" onclick="generateProforma('${dept.department}')">
                                        <i class="fas fa-file-alt"></i>
                                        Generate Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Comprehensive Marks Table with Filters -->
                <div class="marks-table-section">
                    <div class="table-header">
                        <h3>📊 Comprehensive Marks Table</h3>
                        <div class="filter-controls">
                            <select class="form-control filter-select" id="departmentFilterSelect" onchange="loadFilteredMarksData()">
                                <option value="">Select Department</option>
                                <option value="Mechanical Engineering">Mechanical Engineering</option>
                                <option value="Computer Engineering">Computer Engineering</option>
                                <option value="Electrical Engineering">Electrical Engineering</option>
                                <option value="Civil Engineering">Civil Engineering</option>
                                <option value="Electronics Engineering">Electronics Engineering</option>
                            </select>
                            <select class="form-control filter-select" id="classFilterSelect" onchange="loadFilteredMarksData()">
                                <option value="">Select Class</option>
                                <option value="ME5K">ME5K</option>
                                <option value="CE5K">CE5K</option>
                                <option value="EE5K">EE5K</option>
                                <option value="CV5K">CV5K</option>
                                <option value="EC5K">EC5K</option>
                                <option value="ME6K">ME6K</option>
                                <option value="CE6K">CE6K</option>
                                <option value="EE6K">EE6K</option>
                            </select>
                            <button class="btn btn-sm btn-success" onclick="loadAllMarksData()" title="Load All Data">
                                <i class="fas fa-list"></i> All Data
                            </button>
                        </div>
                    </div>
                    
                    <div class="simple-table-container">
                        <table class="simple-marks-table" id="simpleMarksTable">
                            <tbody>
                                <tr>
                                    <td style="text-align: center; padding: 30px; font-size: 1.1rem;">
                                        <i class="fas fa-filter"></i><br>
                                        Select Department and Class to load marks data<br>
                                        <small>Or click "All Data" to load all students</small>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <script>
                    // Load filter options immediately when page loads
                    setTimeout(() => {
                        loadFilterOptions();
                    }, 100);
                    
                    // Also try loading after DOM is fully ready
                    document.addEventListener('DOMContentLoaded', () => {
                        setTimeout(() => {
                            loadFilterOptions();
                        }, 200);
                    });
                </script>
            </div>
        `;
    } catch (error) {
        console.error('❌ Error generating marks progress content:', error);
        return '<div class="error-message">Error loading marks progress data</div>';
    }
}

// Enhanced function to load marks table with dynamic subjects
async function loadSimpleMarksTable() {
    try {
        console.log('🔄 Loading enhanced marks table...');
        showNotification('Loading marks data...', 'info');
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        console.log(`Found ${students.length} students and ${savedMarks.length} marks`);
        
        // Get all unique subjects from marks data
        const allSubjects = [...new Set(savedMarks.map(mark => mark.subject).filter(s => s))];
        console.log(`📚 Found subjects: ${allSubjects.join(', ')}`);
        
        // Get table
        const table = document.getElementById('simpleMarksTable');
        if (!table) {
            console.error('Table not found');
            return;
        }
        
        // Create dynamic header with actual subject names
        const headerRow = `
            <thead>
                <tr>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Class</th>
                    ${allSubjects.map(subject => `<th>${subject}</th>`).join('')}
                    <th>Total Marks</th>
                    <th>Out of Marks</th>
                    <th>Percentage</th>
                    <th>Classification</th>
                </tr>
            </thead>
        `;
        
        // Create table body with data
        let tableBodyHTML = '<tbody>';
        
        students.forEach(student => {
            // Get marks for this student
            const studentMarks = savedMarks.filter(mark => mark.enrollmentNo === student.enrollmentNo);
            
            // Create subject marks map
            const marksMap = {};
            studentMarks.forEach(mark => {
                marksMap[mark.subject] = mark.marks;
            });
            
            // Calculate totals properly
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            // Calculate based on actual subjects that have marks
            allSubjects.forEach(subject => {
                const subjectMark = studentMarks.find(mark => mark.subject === subject);
                if (subjectMark) {
                    totalMarks += parseFloat(subjectMark.marks) || 0;
                    totalMaxMarks += parseFloat(subjectMark.maxMarks) || 100;
                } else {
                    // If subject has no marks, still count max marks for calculation
                    totalMaxMarks += 100; // Default max marks per subject
                }
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks * 100).toFixed(2) : 0;
            
            // Determine classification with color
            let classification = '';
            let classColor = '';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                classColor = 'gold';
            } else if (percentage >= 60) {
                classification = 'First Class';
                classColor = 'green';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                classColor = 'blue';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                classColor = 'gray';
            } else if (percentage < 35) {
                classification = 'ATKT';
                classColor = 'orange';
            } else {
                classification = 'Fail';
                classColor = 'red';
            }
            
            // Create row
            tableBodyHTML += `
                <tr>
                    <td>${student.enrollmentNo}</td>
                    <td>${student.name}</td>
                    <td>${student.department || 'N/A'}</td>
                    <td>${student.class || 'N/A'}</td>
                    ${allSubjects.map(subject => `<td>${marksMap[subject] || '-'}</td>`).join('')}
                    <td>${totalMarks.toFixed(1)}</td>
                    <td>${totalMaxMarks.toFixed(1)}</td>
                    <td>${percentage}%</td>
                    <td style="background-color: ${classColor}; color: white; font-weight: bold;">${classification}</td>
                </tr>
            `;
        });
        
        tableBodyHTML += '</tbody>';
        
        // Update entire table
        table.innerHTML = headerRow + tableBodyHTML;
        
        // Populate filter dropdowns
        populateFilterDropdowns(students);
        
        console.log(`✅ Loaded ${students.length} students with ${allSubjects.length} subjects`);
        showNotification(`✅ Loaded ${students.length} students with ${allSubjects.length} subjects`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading marks table:', error);
        showNotification('❌ Error loading data', 'error');
        
        const table = document.getElementById('simpleMarksTable');
        if (table) {
            table.innerHTML = `
                <tbody>
                    <tr>
                        <td colspan="10" style="text-align: center; color: red; padding: 20px;">
                            Error loading data. Please try again.
                        </td>
                    </tr>
                </tbody>
            `;
        }
    }
}

// Load filter options only (departments and classes)
async function loadFilterOptions() {
    try {
        console.log('🔄 Loading filter options...');
        showNotification('Loading filter options...', 'info');
        
        // Check if elements exist
        const deptSelect = document.getElementById('departmentFilterSelect');
        const classSelect = document.getElementById('classFilterSelect');
        
        console.log('🔍 Department select element:', deptSelect ? 'Found' : 'NOT FOUND');
        console.log('🔍 Class select element:', classSelect ? 'Found' : 'NOT FOUND');
        
        if (!deptSelect || !classSelect) {
            console.error('❌ Filter select elements not found in DOM');
            setTimeout(() => loadFilterOptions(), 1000); // Retry after 1 second
            return;
        }
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        console.log(`👥 Found ${students.length} students from Firebase`);
        
        if (students.length === 0) {
            console.warn('⚠️ No students found in Firebase');
            showNotification('⚠️ No students found in database', 'warning');
            return;
        }
        
        // Debug first few students
        console.log('📊 Sample students:', students.slice(0, 3).map(s => ({
            name: s.name,
            department: s.department,
            class: s.class
        })));
        
        // Get unique departments and classes
        const departments = [...new Set(students.map(s => s.department).filter(d => d))];
        const classes = [...new Set(students.map(s => s.class).filter(c => c))];
        
        console.log('🏢 Departments found:', departments);
        console.log('📚 Classes found:', classes);
        
        // Update department dropdown with Firebase data (keep existing + add new)
        const existingDepts = Array.from(deptSelect.options).map(opt => opt.value).filter(v => v);
        const newDepts = departments.filter(dept => !existingDepts.includes(dept));
        
        newDepts.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });
        
        // Update class dropdown with Firebase data (keep existing + add new)
        const existingClasses = Array.from(classSelect.options).map(opt => opt.value).filter(v => v);
        const newClasses = classes.filter(cls => !existingClasses.includes(cls));
        
        newClasses.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            classSelect.appendChild(option);
        });
        
        console.log(`✅ Loaded filter options: ${departments.length} departments, ${classes.length} classes`);
        showNotification(`✅ Loaded ${departments.length} departments, ${classes.length} classes`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading filter options:', error);
        showNotification('❌ Error loading filter options', 'error');
        
        // Retry after 2 seconds
        setTimeout(() => loadFilterOptions(), 2000);
    }
}

// Load filtered marks data based on selected department and class
async function loadFilteredMarksData() {
    try {
        const deptFilter = document.getElementById('departmentFilterSelect')?.value;
        const classFilter = document.getElementById('classFilterSelect')?.value;
        
        // Only load data if both department and class are selected
        if (!deptFilter || !classFilter) {
            console.log('⏳ Waiting for both department and class selection...');
            return;
        }
        
        console.log(`🔄 Loading data for ${deptFilter} - ${classFilter}...`);
        showNotification(`Loading data for ${deptFilter} - ${classFilter}...`, 'info');
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        // Filter students by department and class
        const filteredStudents = students.filter(student => 
            student.department === deptFilter && student.class === classFilter
        );
        
        if (filteredStudents.length === 0) {
            const table = document.getElementById('simpleMarksTable');
            if (table) {
                table.innerHTML = `
                    <tbody>
                        <tr>
                            <td style="text-align: center; padding: 30px; color: #dc3545;">
                                <i class="fas fa-exclamation-triangle"></i><br>
                                No students found for ${deptFilter} - ${classFilter}<br>
                                <small>Try selecting different department or class</small>
                            </td>
                        </tr>
                    </tbody>
                `;
            }
            return;
        }
        
        // Load marks table with filtered data
        await loadMarksTableWithData(filteredStudents, savedMarks);
        
        showNotification(`✅ Loaded ${filteredStudents.length} students from ${deptFilter} - ${classFilter}`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading filtered data:', error);
        showNotification('❌ Error loading filtered data', 'error');
    }
}

// Load all marks data
async function loadAllMarksData() {
    try {
        console.log('🔄 Loading all marks data...');
        showNotification('Loading all marks data...', 'info');
        
        // Get data from Firebase
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        // Load marks table with all data
        await loadMarksTableWithData(students, savedMarks);
        
        // Reset filter selections
        const deptSelect = document.getElementById('departmentFilterSelect');
        const classSelect = document.getElementById('classFilterSelect');
        if (deptSelect) deptSelect.value = '';
        if (classSelect) classSelect.value = '';
        
        showNotification(`✅ Loaded all ${students.length} students`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading all data:', error);
        showNotification('❌ Error loading all data', 'error');
    }
}

// Common function to load marks table with given data
async function loadMarksTableWithData(students, savedMarks) {
    try {
        // Get all unique subjects from marks data
        const allSubjects = [...new Set(savedMarks.map(mark => mark.subject).filter(s => s))];
        console.log(`📚 Found subjects: ${allSubjects.join(', ')}`);
        
        // Get table
        const table = document.getElementById('simpleMarksTable');
        if (!table) {
            console.error('Table not found');
            return;
        }
        
        // Create dynamic header with actual subject names
        const headerRow = `
            <thead>
                <tr>
                    <th>Enrollment No</th>
                    <th>Student Name</th>
                    <th>Department</th>
                    <th>Class</th>
                    ${allSubjects.map(subject => `<th>${subject}</th>`).join('')}
                    <th>Total Marks</th>
                    <th>Out of Marks</th>
                    <th>Percentage</th>
                    <th>Classification</th>
                </tr>
            </thead>
        `;
        
        // Create table body with data
        let tableBodyHTML = '<tbody>';
        
        students.forEach(student => {
            // Get marks for this student
            const studentMarks = savedMarks.filter(mark => mark.enrollmentNo === student.enrollmentNo);
            
            // Create subject marks map
            const marksMap = {};
            studentMarks.forEach(mark => {
                marksMap[mark.subject] = mark.marks;
            });
            
            // Calculate totals properly
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            // Calculate based on actual subjects that have marks
            allSubjects.forEach(subject => {
                const subjectMark = studentMarks.find(mark => mark.subject === subject);
                if (subjectMark) {
                    totalMarks += parseFloat(subjectMark.marks) || 0;
                    totalMaxMarks += parseFloat(subjectMark.maxMarks) || 100;
                } else {
                    // If subject has no marks, still count max marks for calculation
                    totalMaxMarks += 100; // Default max marks per subject
                }
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks * 100).toFixed(2) : 0;
            
            // Determine classification with color
            let classification = '';
            let classColor = '';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                classColor = 'gold';
            } else if (percentage >= 60) {
                classification = 'First Class';
                classColor = 'green';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                classColor = 'blue';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                classColor = 'gray';
            } else if (percentage < 35) {
                classification = 'ATKT';
                classColor = 'orange';
            } else {
                classification = 'Fail';
                classColor = 'red';
            }
            
            // Create row
            tableBodyHTML += `
                <tr>
                    <td>${student.enrollmentNo}</td>
                    <td>${student.name}</td>
                    <td>${student.department || 'N/A'}</td>
                    <td>${student.class || 'N/A'}</td>
                    ${allSubjects.map(subject => `<td>${marksMap[subject] || '-'}</td>`).join('')}
                    <td>${totalMarks.toFixed(1)}</td>
                    <td>${totalMaxMarks.toFixed(1)}</td>
                    <td>${percentage}%</td>
                    <td style="background-color: ${classColor}; color: white; font-weight: bold;">${classification}</td>
                </tr>
            `;
        });
        
        tableBodyHTML += '</tbody>';
        
        // Update entire table
        table.innerHTML = headerRow + tableBodyHTML;
        
        console.log(`✅ Loaded ${students.length} students with ${allSubjects.length} subjects`);
        
    } catch (error) {
        console.error('❌ Error loading marks table:', error);
        throw error;
    }
}

// Populate filter dropdowns with departments and classes (old function - keeping for compatibility)
function populateFilterDropdowns(students) {
    try {
        // Get unique departments and classes
        const departments = [...new Set(students.map(s => s.department).filter(d => d))];
        const classes = [...new Set(students.map(s => s.class).filter(c => c))];
        
        // Populate department dropdown
        const deptSelect = document.getElementById('departmentFilterSelect');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="all">All Departments</option>';
            departments.forEach(dept => {
                deptSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
            });
        }
        
        // Populate class dropdown
        const classSelect = document.getElementById('classFilterSelect');
        if (classSelect) {
            classSelect.innerHTML = '<option value="all">All Classes</option>';
            classes.forEach(cls => {
                classSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
            });
        }
        
        console.log(`📋 Populated filters: ${departments.length} departments, ${classes.length} classes`);
        
    } catch (error) {
        console.error('❌ Error populating filters:', error);
    }
}

// Filter marks data based on selected department and class
function filterMarksData() {
    try {
        const deptFilter = document.getElementById('departmentFilterSelect')?.value || 'all';
        const classFilter = document.getElementById('classFilterSelect')?.value || 'all';
        
        const table = document.getElementById('simpleMarksTable');
        if (!table) return;
        
        const rows = table.querySelectorAll('tbody tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 4) return; // Skip header or empty rows
            
            const department = cells[2]?.textContent?.trim() || '';
            const studentClass = cells[3]?.textContent?.trim() || '';
            
            const showDept = (deptFilter === 'all' || department === deptFilter);
            const showClass = (classFilter === 'all' || studentClass === classFilter);
            
            if (showDept && showClass) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        const filterText = [];
        if (deptFilter !== 'all') filterText.push(deptFilter);
        if (classFilter !== 'all') filterText.push(classFilter);
        
        const filterMsg = filterText.length > 0 
            ? `Showing ${visibleCount} students from ${filterText.join(' - ')}`
            : `Showing all ${visibleCount} students`;
            
        showNotification(`📊 ${filterMsg}`, 'info');
        console.log(`🔍 Filter applied: ${filterMsg}`);
        
    } catch (error) {
        console.error('❌ Error filtering data:', error);
    }
}

// Old complex function (keeping for reference)
async function loadComprehensiveMarksData() {
    try {
        console.log('🔄 Loading comprehensive marks data...');
        
        const students = await getStudentsFromFirebase();
        const savedMarks = await getMarksFromFirebase();
        
        console.log(`📊 Found ${students.length} students and ${savedMarks.length} marks entries`);
        
        // Get department data for subjects
        const departmentData = JSON.parse(localStorage.getItem('departmentData') || '{}');
        const classSubjects = JSON.parse(localStorage.getItem('classSubjects') || '{}');
        
        // Get all subjects across all departments
        const departments = [...new Set(students.map(s => s.department).filter(d => d))];
        console.log(`🏢 Available departments: ${departments.join(', ')}`);
        let allSubjects = [];
        
        departments.forEach(dept => {
            if (departmentData[dept]?.subjects) {
                allSubjects = [...allSubjects, ...departmentData[dept].subjects];
            }
            
            // Also get class-specific subjects
            Object.keys(classSubjects).forEach(classKey => {
                if (classKey.startsWith(dept)) {
                    allSubjects = [...allSubjects, ...classSubjects[classKey]];
                }
            });
        });
        
        // Remove duplicates and get more subjects for display
        allSubjects = [...new Set(allSubjects)];
        
        // If no subjects found, get from saved marks or use defaults
        if (allSubjects.length === 0) {
            // Get subjects from saved marks
            const marksSubjects = [...new Set(savedMarks.map(mark => mark.subject).filter(s => s))];
            if (marksSubjects.length > 0) {
                allSubjects = marksSubjects.slice(0, 6); // Take up to 6 subjects
            } else {
                allSubjects = ['MESK', 'PER', 'AEN', 'MOM', 'TOM', 'CAED']; // Default engineering subjects
            }
        }
        
        // Limit to 6 subjects for table display
        allSubjects = allSubjects.slice(0, 6);
        
        console.log(`📚 Using subjects: ${allSubjects.join(', ')}`);
        
        // Group marks by student and subject
        const studentMarksMap = {};
        savedMarks.forEach(mark => {
            if (!studentMarksMap[mark.enrollmentNo]) {
                studentMarksMap[mark.enrollmentNo] = {};
            }
            studentMarksMap[mark.enrollmentNo][mark.subject] = {
                marks: parseFloat(mark.marks) || 0,
                maxMarks: parseFloat(mark.maxMarks) || 100,
                teacher: mark.teacherName || 'Unknown'
            };
        });
        
        // Calculate statistics for each student
        const calculateStudentStats = (enrollmentNo) => {
            const studentMarks = studentMarksMap[enrollmentNo] || {};
            const subjects = Object.keys(studentMarks);
            
            if (subjects.length === 0) {
                return {
                    totalMarks: 0,
                    totalMaxMarks: 0,
                    percentage: 0,
                    classification: 'No Data',
                    status: 'No Marks'
                };
            }
            
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            subjects.forEach(subject => {
                totalMarks += studentMarks[subject].marks;
                totalMaxMarks += studentMarks[subject].maxMarks;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
            
            let classification = 'Fail';
            let status = 'Fail';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                status = 'Pass';
            } else if (percentage >= 60) {
                classification = 'First Class';
                status = 'Pass';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                status = 'Pass';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                status = 'Pass';
            }
            
            return {
                totalMarks: totalMarks.toFixed(1),
                totalMaxMarks: totalMaxMarks.toFixed(1),
                percentage: percentage.toFixed(2),
                classification,
                status
            };
        };
        
        // Generate table rows
        const tableBody = document.getElementById('marksTableBody');
        if (!tableBody) {
            console.error('❌ Table body not found');
            return;
        }
        
        let rowsHTML = '';
        
        students.forEach((student, index) => {
            const stats = calculateStudentStats(student.enrollmentNo);
            const studentMarks = studentMarksMap[student.enrollmentNo] || {};
            
            // Debug logging for first few students
            if (index < 5) {
                console.log(`Student ${index}: ${student.name}, Department: "${student.department}"`);
            }
            
            // Get subject marks for display (up to 6 subjects)
            const subject1 = allSubjects[0] ? (studentMarks[allSubjects[0]]?.marks || '-') : '-';
            const subject2 = allSubjects[1] ? (studentMarks[allSubjects[1]]?.marks || '-') : '-';
            const subject3 = allSubjects[2] ? (studentMarks[allSubjects[2]]?.marks || '-') : '-';
            const subject4 = allSubjects[3] ? (studentMarks[allSubjects[3]]?.marks || '-') : '-';
            const subject5 = allSubjects[4] ? (studentMarks[allSubjects[4]]?.marks || '-') : '-';
            const subject6 = allSubjects[5] ? (studentMarks[allSubjects[5]]?.marks || '-') : '-';
            
            // Determine classification flags
            const isPassClass = stats.classification === 'Pass Class' ? '✓' : '';
            const isFirstClass = stats.classification === 'First Class' ? '✓' : '';
            const isSecondClass = stats.classification === 'Second Class' ? '✓' : '';
            const isDistinction = stats.classification === 'Distinction' ? '✓' : '';
            const isATKT = (stats.status === 'No Marks' || parseFloat(stats.percentage) < 35) ? '✓' : '';
            const isFail = (stats.status === 'Fail' && parseFloat(stats.percentage) >= 35) ? '✓' : '';
            
            rowsHTML += `
                <tr class="student-row ${stats.status.toLowerCase()}" data-department="${student.department}">
                    <td class="sticky-col enrollment-no">${student.enrollmentNo}</td>
                    <td class="sticky-col student-name">${student.name}</td>
                    <td class="class-name">${student.class || 'N/A'}</td>
                    <td class="subject-marks">${subject1}</td>
                    <td class="subject-marks">${subject2}</td>
                    <td class="subject-marks">${subject3}</td>
                    <td class="subject-marks">${subject4}</td>
                    <td class="subject-marks">${subject5}</td>
                    <td class="subject-marks">${subject6}</td>
                    <td class="total-marks ${stats.status.toLowerCase()}">${stats.totalMarks}</td>
                    <td class="total-max-marks">${stats.totalMaxMarks}</td>
                    <td class="percentage ${stats.status.toLowerCase()}">${stats.percentage}%</td>
                    <td class="classification-cell pass-class">${isPassClass}</td>
                    <td class="classification-cell first-class">${isFirstClass}</td>
                    <td class="classification-cell second-class">${isSecondClass}</td>
                    <td class="classification-cell distinction">${isDistinction}</td>
                    <td class="classification-cell atkt">${isATKT}</td>
                    <td class="classification-cell fail">${isFail}</td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = rowsHTML;
        
        console.log(`✅ Loaded ${students.length} student records into comprehensive marks table`);
        showNotification(`✅ Loaded ${students.length} student records`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading comprehensive marks data:', error);
        showNotification('❌ Error loading marks data', 'error');
        
        // Show error in table
        const tableBody = document.getElementById('marksTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="18" style="text-align: center; padding: 20px; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error loading marks data. Please refresh the page.
                    </td>
                </tr>
            `;
        }
    }
}

// Generate comprehensive marks table HTML for main view
async function generateComprehensiveMarksTableHTML(students, savedMarks, departments) {
    try {
        // Get department data for subjects
        const departmentData = JSON.parse(localStorage.getItem('departmentData') || '{}');
        const classSubjects = JSON.parse(localStorage.getItem('classSubjects') || '{}');
        
        // Get all subjects across all departments
        let allSubjects = [];
        departments.forEach(dept => {
            if (departmentData[dept]?.subjects) {
                allSubjects = [...allSubjects, ...departmentData[dept].subjects];
            }
            
            // Also get class-specific subjects
            Object.keys(classSubjects).forEach(classKey => {
                if (classKey.startsWith(dept)) {
                    allSubjects = [...allSubjects, ...classSubjects[classKey]];
                }
            });
        });
        
        // Remove duplicates and limit to first 3 subjects for display
        allSubjects = [...new Set(allSubjects)].slice(0, 3);
        
        // If no subjects found, use default subjects
        if (allSubjects.length === 0) {
            allSubjects = ['Subject 1', 'Subject 2', 'Subject 3'];
        }
        
        // Group marks by student and subject
        const studentMarksMap = {};
        savedMarks.forEach(mark => {
            if (!studentMarksMap[mark.enrollmentNo]) {
                studentMarksMap[mark.enrollmentNo] = {};
            }
            studentMarksMap[mark.enrollmentNo][mark.subject] = {
                marks: parseFloat(mark.marks) || 0,
                maxMarks: parseFloat(mark.maxMarks) || 100,
                teacher: mark.teacherName || 'Unknown'
            };
        });
        
        // Calculate statistics for each student
        const calculateStudentStats = (enrollmentNo) => {
            const studentMarks = studentMarksMap[enrollmentNo] || {};
            const subjects = Object.keys(studentMarks);
            
            if (subjects.length === 0) {
                return {
                    totalMarks: 0,
                    totalMaxMarks: 0,
                    percentage: 0,
                    classification: 'No Data',
                    status: 'No Marks'
                };
            }
            
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            subjects.forEach(subject => {
                totalMarks += studentMarks[subject].marks;
                totalMaxMarks += studentMarks[subject].maxMarks;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
            
            let classification = 'Fail';
            let status = 'Fail';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                status = 'Pass';
            } else if (percentage >= 60) {
                classification = 'First Class';
                status = 'Pass';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                status = 'Pass';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                status = 'Pass';
            }
            
            return {
                totalMarks: totalMarks.toFixed(1),
                totalMaxMarks: totalMaxMarks.toFixed(1),
                percentage: percentage.toFixed(2),
                classification,
                status
            };
        };
        
        // Create table headers
        const headerRow = `
            <thead>
                <tr>
                    <th rowspan="2" class="sticky-col">Enrollment No</th>
                    <th rowspan="2" class="sticky-col">Name Of Student</th>
                    <th rowspan="2">Department</th>
                    <th rowspan="2">Class</th>
                    ${allSubjects.map(subject => `<th colspan="2">${subject}</th>`).join('')}
                    <th rowspan="2">Total Marks</th>
                    <th rowspan="2">Out of</th>
                    <th rowspan="2">Percentage</th>
                    <th rowspan="2">Classification</th>
                    <th rowspan="2">Status</th>
                </tr>
                <tr>
                    ${allSubjects.map(() => `<th>Marks</th><th>Max</th>`).join('')}
                </tr>
            </thead>
        `;
        
        // Create table body
        const dataRows = students.map(student => {
            const stats = calculateStudentStats(student.enrollmentNo);
            const studentMarks = studentMarksMap[student.enrollmentNo] || {};
            
            return `
                <tr class="student-row ${stats.status.toLowerCase()}" data-department="${student.department}">
                    <td class="sticky-col enrollment-no">${student.enrollmentNo}</td>
                    <td class="sticky-col student-name">${student.name}</td>
                    <td class="department-name">${student.department || 'N/A'}</td>
                    <td class="class-name">${student.class || 'N/A'}</td>
                    ${allSubjects.map(subject => {
                        const subjectData = studentMarks[subject];
                        if (subjectData) {
                            return `
                                <td class="marks-cell">${subjectData.marks}</td>
                                <td class="max-marks-cell">${subjectData.maxMarks}</td>
                            `;
                        } else {
                            return `
                                <td class="marks-cell no-data">-</td>
                                <td class="max-marks-cell no-data">-</td>
                            `;
                        }
                    }).join('')}
                    <td class="total-marks ${stats.status.toLowerCase()}">${stats.totalMarks}</td>
                    <td class="total-max-marks">${stats.totalMaxMarks}</td>
                    <td class="percentage ${stats.status.toLowerCase()}">${stats.percentage}%</td>
                    <td class="classification ${stats.classification.toLowerCase().replace(' ', '-')}">${stats.classification}</td>
                    <td class="status ${stats.status.toLowerCase()}">
                        <span class="status-badge ${stats.status.toLowerCase()}">
                            <i class="fas fa-${stats.status === 'Pass' ? 'check-circle' : 'times-circle'}"></i>
                            ${stats.status}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
        
        return headerRow + '<tbody>' + dataRows + '</tbody>';
        
    } catch (error) {
        console.error('❌ Error generating comprehensive marks table:', error);
        return `
            <thead>
                <tr><th>Error</th></tr>
            </thead>
            <tbody>
                <tr><td>Error loading marks data</td></tr>
            </tbody>
        `;
    }
}

// Filter table by department
function filterByDepartment(department) {
    try {
        const tableBody = document.getElementById('marksTableBody');
        if (!tableBody) {
            console.error('❌ Table body not found');
            return;
        }
        
        const rows = tableBody.querySelectorAll('tr.student-row');
        let visibleCount = 0;
        
        console.log(`🔍 Filtering by department: "${department}"`);
        console.log(`📊 Total rows found: ${rows.length}`);
        
        rows.forEach((row, index) => {
            const deptCell = row.getAttribute('data-department');
            console.log(`Row ${index}: data-department="${deptCell}"`);
            
            // Case-insensitive and trimmed comparison
            const normalizedDeptCell = (deptCell || '').trim().toLowerCase();
            const normalizedDepartment = (department || '').trim().toLowerCase();
            
            if (department === 'all' || normalizedDeptCell === normalizedDepartment) {
                row.style.display = '';
                visibleCount++;
                console.log(`✅ Row ${index} shown (${deptCell})`);
            } else {
                row.style.display = 'none';
                console.log(`❌ Row ${index} hidden (${deptCell} != ${department})`);
            }
        });
        
        console.log(`📊 Final visible count: ${visibleCount}`);
        showNotification(`📊 Showing ${visibleCount} students from ${department === 'all' ? 'all departments' : department}`, 'info');
        
    } catch (error) {
        console.error('❌ Error filtering by department:', error);
        showNotification('❌ Error filtering table', 'error');
    }
}

// Export all marks data
async function exportAllMarks() {
    try {
        showNotification(`📊 Preparing comprehensive marks export for all departments...`, 'info');
        
        const students = await getStudentsFromFirebase();
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        const departmentData = JSON.parse(localStorage.getItem('departmentData') || '{}');
        const classSubjects = JSON.parse(localStorage.getItem('classSubjects') || '{}');
        
        // Get all subjects
        let allSubjects = [];
        const departments = [...new Set(students.map(s => s.department).filter(d => d))];
        
        departments.forEach(dept => {
            if (departmentData[dept]?.subjects) {
                allSubjects = [...allSubjects, ...departmentData[dept].subjects];
            }
            
            Object.keys(classSubjects).forEach(classKey => {
                if (classKey.startsWith(dept)) {
                    allSubjects = [...allSubjects, ...classSubjects[classKey]];
                }
            });
        });
        
        allSubjects = [...new Set(allSubjects)];
        if (allSubjects.length === 0) {
            allSubjects = ['Subject 1', 'Subject 2', 'Subject 3'];
        }
        
        // Group marks by student
        const studentMarksMap = {};
        savedMarks.forEach(mark => {
            if (!studentMarksMap[mark.enrollmentNo]) {
                studentMarksMap[mark.enrollmentNo] = {};
            }
            studentMarksMap[mark.enrollmentNo][mark.subject] = {
                marks: parseFloat(mark.marks) || 0,
                maxMarks: parseFloat(mark.maxMarks) || 100
            };
        });
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Headers
        const headers = [
            'Enrollment No', 'Name Of Student', 'Department', 'Class',
            ...allSubjects.flatMap(subject => [`${subject} Marks`, `${subject} Max`]),
            'Total Marks', 'Out of', 'Percentage', 'Classification', 'Status'
        ];
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        students.forEach(student => {
            const studentMarks = studentMarksMap[student.enrollmentNo] || {};
            
            // Calculate totals
            let totalMarks = 0;
            let totalMaxMarks = 0;
            const subjects = Object.keys(studentMarks);
            
            subjects.forEach(subject => {
                totalMarks += studentMarks[subject].marks;
                totalMaxMarks += studentMarks[subject].maxMarks;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
            
            let classification = 'Fail';
            let status = 'Fail';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                status = 'Pass';
            } else if (percentage >= 60) {
                classification = 'First Class';
                status = 'Pass';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                status = 'Pass';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                status = 'Pass';
            }
            
            const row = [
                student.enrollmentNo,
                `"${student.name}"`, // Quoted to handle commas in names
                student.department || 'N/A',
                student.class || 'N/A',
                ...allSubjects.flatMap(subject => {
                    const subjectData = studentMarks[subject];
                    return subjectData ? [subjectData.marks, subjectData.maxMarks] : ['-', '-'];
                }),
                totalMarks.toFixed(1),
                totalMaxMarks.toFixed(1),
                percentage.toFixed(2) + '%',
                classification,
                status
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Create and download file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `All_Departments_Comprehensive_Marks_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`✅ Comprehensive marks exported successfully for all departments`, 'success');
        
    } catch (error) {
        console.error('❌ Error exporting all marks:', error);
        showNotification('❌ Error exporting comprehensive marks', 'error');
    }
}

// Refresh progress data
async function refreshProgress() {
    try {
        showNotification('🔄 Refreshing progress data...', 'info');
        
        // Reload the marks progress content
        const contentArea = document.getElementById('adminContent');
        if (contentArea) {
            contentArea.innerHTML = await generateMarksProgressContent();
            showNotification('✅ Progress data refreshed successfully', 'success');
        }
    } catch (error) {
        console.error('❌ Error refreshing progress:', error);
        showNotification('❌ Error refreshing progress data', 'error');
    }
}

// View department details with comprehensive marks table
async function viewDepartmentDetails(department) {
    try {
        showNotification(`📊 Loading comprehensive marks data for ${department} department...`, 'info');
        
        const teachers = await getTeachersFromFirebase();
        const students = await getStudentsFromFirebase();
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        
        // Get department data for subjects
        const departmentData = JSON.parse(localStorage.getItem('departmentData') || '{}');
        const classSubjects = JSON.parse(localStorage.getItem('classSubjects') || '{}');
        
        // Migrate rollNo to enrollmentNo
        const migratedMarks = savedMarks.map(mark => {
            if (mark.rollNo && !mark.enrollmentNo) {
                mark.enrollmentNo = mark.rollNo;
                delete mark.rollNo;
            }
            return mark;
        });
        
        // Filter data for this department
        const deptStudents = students.filter(s => s.department === department);
        const deptTeachers = teachers.filter(t => t.department === department);
        const deptMarks = migratedMarks.filter(mark => {
            const student = students.find(s => s.enrollmentNo === mark.enrollmentNo);
            return student && student.department === department;
        });
        
        // Get all subjects for this department
        let allSubjects = [];
        if (departmentData[department]?.subjects) {
            allSubjects = departmentData[department].subjects;
        }
        
        // Also get class-specific subjects
        const classSpecificSubjects = new Set();
        Object.keys(classSubjects).forEach(classKey => {
            if (classKey.startsWith(department)) {
                classSubjects[classKey].forEach(subject => classSpecificSubjects.add(subject));
            }
        });
        
        // Combine all subjects
        allSubjects = [...new Set([...allSubjects, ...Array.from(classSpecificSubjects)])];
        
        // Group marks by student and subject
        const studentMarksMap = {};
        deptMarks.forEach(mark => {
            if (!studentMarksMap[mark.enrollmentNo]) {
                studentMarksMap[mark.enrollmentNo] = {};
            }
            studentMarksMap[mark.enrollmentNo][mark.subject] = {
                marks: parseFloat(mark.marks) || 0,
                maxMarks: parseFloat(mark.maxMarks) || 100,
                teacher: mark.teacherName || 'Unknown'
            };
        });
        
        // Calculate statistics for each student
        const calculateStudentStats = (enrollmentNo) => {
            const studentMarks = studentMarksMap[enrollmentNo] || {};
            const subjects = Object.keys(studentMarks);
            
            if (subjects.length === 0) {
                return {
                    totalMarks: 0,
                    totalMaxMarks: 0,
                    percentage: 0,
                    classification: 'No Data',
                    status: 'No Marks'
                };
            }
            
            let totalMarks = 0;
            let totalMaxMarks = 0;
            
            subjects.forEach(subject => {
                totalMarks += studentMarks[subject].marks;
                totalMaxMarks += studentMarks[subject].maxMarks;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
            
            let classification = 'Fail';
            let status = 'Fail';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                status = 'Pass';
            } else if (percentage >= 60) {
                classification = 'First Class';
                status = 'Pass';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                status = 'Pass';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                status = 'Pass';
            }
            
            return {
                totalMarks: totalMarks.toFixed(1),
                totalMaxMarks: totalMaxMarks.toFixed(1),
                percentage: percentage.toFixed(2),
                classification,
                status
            };
        };
        
        // Create comprehensive marks table
        const createMarksTable = () => {
            const headerRow = `
                <tr>
                    <th rowspan="2" class="sticky-col">Enrollment No</th>
                    <th rowspan="2" class="sticky-col">Name Of Student</th>
                    <th rowspan="2">Class</th>
                    ${allSubjects.map(subject => `<th colspan="2">${subject}</th>`).join('')}
                    <th rowspan="2">Total Marks</th>
                    <th rowspan="2">Out of</th>
                    <th rowspan="2">Percentage</th>
                    <th rowspan="2">Classification</th>
                    <th rowspan="2">Status</th>
                </tr>
                <tr>
                    ${allSubjects.map(() => `<th>Marks</th><th>Max</th>`).join('')}
                </tr>
            `;
            
            const dataRows = deptStudents.map(student => {
                const stats = calculateStudentStats(student.enrollmentNo);
                const studentMarks = studentMarksMap[student.enrollmentNo] || {};
                
                return `
                    <tr class="student-row ${stats.status.toLowerCase()}">
                        <td class="sticky-col enrollment-no">${student.enrollmentNo}</td>
                        <td class="sticky-col student-name">${student.name}</td>
                        <td class="class-name">${student.class || 'N/A'}</td>
                        ${allSubjects.map(subject => {
                            const subjectData = studentMarks[subject];
                            if (subjectData) {
                                return `
                                    <td class="marks-cell">${subjectData.marks}</td>
                                    <td class="max-marks-cell">${subjectData.maxMarks}</td>
                                `;
                            } else {
                                return `
                                    <td class="marks-cell no-data">-</td>
                                    <td class="max-marks-cell no-data">-</td>
                                `;
                            }
                        }).join('')}
                        <td class="total-marks ${stats.status.toLowerCase()}">${stats.totalMarks}</td>
                        <td class="total-max-marks">${stats.totalMaxMarks}</td>
                        <td class="percentage ${stats.status.toLowerCase()}">${stats.percentage}%</td>
                        <td class="classification ${stats.classification.toLowerCase().replace(' ', '-')}">${stats.classification}</td>
                        <td class="status ${stats.status.toLowerCase()}">
                            <span class="status-badge ${stats.status.toLowerCase()}">
                                <i class="fas fa-${stats.status === 'Pass' ? 'check-circle' : 'times-circle'}"></i>
                                ${stats.status}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
            
            return headerRow + dataRows;
        };
        
        // Calculate department statistics
        const deptStats = {
            totalStudents: deptStudents.length,
            studentsWithMarks: Object.keys(studentMarksMap).length,
            totalSubjects: allSubjects.length,
            totalMarksEntries: deptMarks.length
        };
        
        // Count classifications
        const classifications = { distinction: 0, firstClass: 0, secondClass: 0, passClass: 0, fail: 0 };
        deptStudents.forEach(student => {
            const stats = calculateStudentStats(student.enrollmentNo);
            const classification = stats.classification.toLowerCase().replace(' ', '');
            if (classifications.hasOwnProperty(classification)) {
                classifications[classification]++;
            } else if (stats.classification === 'Distinction') {
                classifications.distinction++;
            } else if (stats.classification === 'First Class') {
                classifications.firstClass++;
            } else if (stats.classification === 'Second Class') {
                classifications.secondClass++;
            } else if (stats.classification === 'Pass Class') {
                classifications.passClass++;
            } else {
                classifications.fail++;
            }
        });
        
        // Create detailed modal with comprehensive table
        const modalHtml = `
            <div class="modal-overlay" id="departmentDetailsModal" onclick="closeDepartmentDetails()">
                <div class="modal-content department-details-modal large-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-chart-bar"></i> ${department} - Comprehensive Marks Analysis</h2>
                        <button class="modal-close" onclick="closeDepartmentDetails()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <!-- Department Statistics -->
                        <div class="dept-summary">
                            <div class="summary-cards">
                                <div class="summary-card">
                                    <div class="card-icon blue">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    <div class="card-info">
                                        <h3>${deptStats.totalStudents}</h3>
                                        <p>Total Students</p>
                                    </div>
                                </div>
                                <div class="summary-card">
                                    <div class="card-icon green">
                                        <i class="fas fa-check-circle"></i>
                                    </div>
                                    <div class="card-info">
                                        <h3>${deptStats.studentsWithMarks}</h3>
                                        <p>Students with Marks</p>
                                    </div>
                                </div>
                                <div class="summary-card">
                                    <div class="card-icon orange">
                                        <i class="fas fa-book"></i>
                                    </div>
                                    <div class="card-info">
                                        <h3>${deptStats.totalSubjects}</h3>
                                        <p>Total Subjects</p>
                                    </div>
                                </div>
                                <div class="summary-card">
                                    <div class="card-icon purple">
                                        <i class="fas fa-edit"></i>
                                    </div>
                                    <div class="card-info">
                                        <h3>${deptStats.totalMarksEntries}</h3>
                                        <p>Marks Entries</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Classification Statistics -->
                        <div class="classification-stats">
                            <h3><i class="fas fa-trophy"></i> Classification Statistics</h3>
                            <div class="classification-cards">
                                <div class="classification-card distinction">
                                    <div class="class-icon"><i class="fas fa-star"></i></div>
                                    <div class="class-info">
                                        <h4>${classifications.distinction}</h4>
                                        <p>Distinction</p>
                                    </div>
                                </div>
                                <div class="classification-card first-class">
                                    <div class="class-icon"><i class="fas fa-medal"></i></div>
                                    <div class="class-info">
                                        <h4>${classifications.firstClass}</h4>
                                        <p>First Class</p>
                                    </div>
                                </div>
                                <div class="classification-card second-class">
                                    <div class="class-icon"><i class="fas fa-award"></i></div>
                                    <div class="class-info">
                                        <h4>${classifications.secondClass}</h4>
                                        <p>Second Class</p>
                                    </div>
                                </div>
                                <div class="classification-card pass-class">
                                    <div class="class-icon"><i class="fas fa-check"></i></div>
                                    <div class="class-info">
                                        <h4>${classifications.passClass}</h4>
                                        <p>Pass Class</p>
                                    </div>
                                </div>
                                <div class="classification-card fail">
                                    <div class="class-icon"><i class="fas fa-times"></i></div>
                                    <div class="class-info">
                                        <h4>${classifications.fail}</h4>
                                        <p>Fail</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Comprehensive Marks Table -->
                        <div class="comprehensive-marks-section">
                            <div class="section-header">
                                <h3><i class="fas fa-table"></i> Comprehensive Marks Table</h3>
                                <div class="table-actions">
                                    <button class="btn btn-sm btn-outline-primary" onclick="filterMarksTable('all')">
                                        <i class="fas fa-list"></i> All Students
                                    </button>
                                    <button class="btn btn-sm btn-outline-success" onclick="filterMarksTable('pass')">
                                        <i class="fas fa-check"></i> Pass Only
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="filterMarksTable('fail')">
                                        <i class="fas fa-times"></i> Fail Only
                                    </button>
                                </div>
                            </div>
                            
                            <div class="table-container comprehensive-table">
                                <table class="marks-table" id="comprehensiveMarksTable">
                                    <thead>
                                        ${createMarksTable()}
                                    </thead>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeDepartmentDetails()">
                            <i class="fas fa-times"></i> Close
                        </button>
                        <button class="btn btn-success" onclick="exportComprehensiveMarks('${department}')">
                            <i class="fas fa-file-excel"></i> Export to Excel
                        </button>
                        <button class="btn btn-primary" onclick="generateDepartmentReport('${department}')">
                            <i class="fas fa-file-alt"></i> Generate Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        showNotification(`✅ Comprehensive marks data loaded for ${department} department`, 'success');
        
    } catch (error) {
        console.error('❌ Error loading comprehensive marks data:', error);
        showNotification('❌ Error loading comprehensive marks data', 'error');
    }
}

// Close department details modal
function closeDepartmentDetails() {
    const modal = document.getElementById('departmentDetailsModal');
    if (modal) {
        modal.remove();
    }
}

// Filter marks table by status
function filterMarksTable(filter) {
    try {
        const tableBody = document.getElementById('marksTableBody');
        if (!tableBody) {
            console.error('❌ Table body not found');
            return;
        }
        
        const rows = tableBody.querySelectorAll('tr.student-row');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const statusCell = row.querySelector('.status');
            const status = statusCell ? statusCell.textContent.toLowerCase().trim() : '';
            
            let shouldShow = false;
            
            switch (filter) {
                case 'all':
                    shouldShow = true;
                    break;
                case 'pass':
                    shouldShow = status.includes('pass');
                    break;
                case 'fail':
                    shouldShow = status.includes('fail') || status.includes('no marks');
                    break;
                default:
                    shouldShow = true;
            }
            
            if (shouldShow) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Update button states
        document.querySelectorAll('.table-actions .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[onclick="filterMarksTable('${filter}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        showNotification(`📊 Showing ${visibleCount} ${filter === 'all' ? 'students' : filter + ' students'}`, 'info');
        
    } catch (error) {
        console.error('❌ Error filtering marks table:', error);
        showNotification('❌ Error filtering table', 'error');
    }
}

// Export comprehensive marks to Excel
async function exportComprehensiveMarks(department) {
    try {
        showNotification(`📊 Preparing comprehensive marks export for ${department}...`, 'info');
        
        const students = await getStudentsFromFirebase();
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        const departmentData = JSON.parse(localStorage.getItem('departmentData') || '{}');
        const classSubjects = JSON.parse(localStorage.getItem('classSubjects') || '{}');
        
        // Filter data for this department
        const deptStudents = students.filter(s => s.department === department);
        const deptMarks = savedMarks.filter(mark => {
            const student = students.find(s => s.enrollmentNo === mark.enrollmentNo);
            return student && student.department === department;
        });
        
        // Get all subjects
        let allSubjects = [];
        if (departmentData[department]?.subjects) {
            allSubjects = departmentData[department].subjects;
        }
        
        const classSpecificSubjects = new Set();
        Object.keys(classSubjects).forEach(classKey => {
            if (classKey.startsWith(department)) {
                classSubjects[classKey].forEach(subject => classSpecificSubjects.add(subject));
            }
        });
        allSubjects = [...new Set([...allSubjects, ...Array.from(classSpecificSubjects)])];
        
        // Group marks by student
        const studentMarksMap = {};
        deptMarks.forEach(mark => {
            if (!studentMarksMap[mark.enrollmentNo]) {
                studentMarksMap[mark.enrollmentNo] = {};
            }
            studentMarksMap[mark.enrollmentNo][mark.subject] = {
                marks: parseFloat(mark.marks) || 0,
                maxMarks: parseFloat(mark.maxMarks) || 100
            };
        });
        
        // Create CSV content
        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Headers
        const headers = [
            'Enrollment No', 'Name Of Student', 'Class',
            ...allSubjects.flatMap(subject => [`${subject} Marks`, `${subject} Max`]),
            'Total Marks', 'Out of', 'Percentage', 'Classification', 'Status'
        ];
        csvContent += headers.join(',') + '\n';
        
        // Data rows
        deptStudents.forEach(student => {
            const studentMarks = studentMarksMap[student.enrollmentNo] || {};
            
            // Calculate totals
            let totalMarks = 0;
            let totalMaxMarks = 0;
            const subjects = Object.keys(studentMarks);
            
            subjects.forEach(subject => {
                totalMarks += studentMarks[subject].marks;
                totalMaxMarks += studentMarks[subject].maxMarks;
            });
            
            const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
            
            let classification = 'Fail';
            let status = 'Fail';
            
            if (percentage >= 75) {
                classification = 'Distinction';
                status = 'Pass';
            } else if (percentage >= 60) {
                classification = 'First Class';
                status = 'Pass';
            } else if (percentage >= 50) {
                classification = 'Second Class';
                status = 'Pass';
            } else if (percentage >= 40) {
                classification = 'Pass Class';
                status = 'Pass';
            }
            
            const row = [
                student.enrollmentNo,
                `"${student.name}"`, // Quoted to handle commas in names
                student.class || 'N/A',
                ...allSubjects.flatMap(subject => {
                    const subjectData = studentMarks[subject];
                    return subjectData ? [subjectData.marks, subjectData.maxMarks] : ['-', '-'];
                }),
                totalMarks.toFixed(1),
                totalMaxMarks.toFixed(1),
                percentage.toFixed(2) + '%',
                classification,
                status
            ];
            
            csvContent += row.join(',') + '\n';
        });
        
        // Create and download file
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${department}_Comprehensive_Marks_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`✅ Comprehensive marks exported successfully for ${department}`, 'success');
        
    } catch (error) {
        console.error('❌ Error exporting comprehensive marks:', error);
        showNotification('❌ Error exporting comprehensive marks', 'error');
    }
}

// Generate department report
async function generateDepartmentReport(department) {
    try {
        showNotification(`📄 Generating comprehensive report for ${department}...`, 'info');
        
        const students = await getStudentsFromFirebase();
        const teachers = await getTeachersFromFirebase();
        const savedMarks = JSON.parse(localStorage.getItem('studentMarks') || '[]');
        
        // Filter data for this department
        const deptStudents = students.filter(s => s.department === department);
        const deptTeachers = teachers.filter(t => t.department === department);
        const deptMarks = savedMarks.filter(mark => {
            const student = students.find(s => s.enrollmentNo === mark.enrollmentNo);
            return student && student.department === department;
        });
        
        // Calculate statistics
        const totalStudents = deptStudents.length;
        const studentsWithMarks = new Set(deptMarks.map(m => m.enrollmentNo)).size;
        const completionRate = totalStudents > 0 ? (studentsWithMarks / totalStudents * 100).toFixed(1) : 0;
        
        // Count classifications
        const classifications = { distinction: 0, firstClass: 0, secondClass: 0, passClass: 0, fail: 0 };
        
        deptStudents.forEach(student => {
            const studentMarks = deptMarks.filter(m => m.enrollmentNo === student.enrollmentNo);
            
            if (studentMarks.length > 0) {
                let totalMarks = 0;
                let totalMaxMarks = 0;
                
                studentMarks.forEach(mark => {
                    totalMarks += parseFloat(mark.marks) || 0;
                    totalMaxMarks += parseFloat(mark.maxMarks) || 100;
                });
                
                const percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
                
                if (percentage >= 75) {
                    classifications.distinction++;
                } else if (percentage >= 60) {
                    classifications.firstClass++;
                } else if (percentage >= 50) {
                    classifications.secondClass++;
                } else if (percentage >= 40) {
                    classifications.passClass++;
                } else {
                    classifications.fail++;
                }
            } else {
                classifications.fail++;
            }
        });
        
        // Create report modal
        const reportHtml = `
            <div class="modal-overlay" id="departmentReportModal" onclick="closeDepartmentReport()">
                <div class="modal-content report-modal" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h2><i class="fas fa-file-alt"></i> ${department} - Department Report</h2>
                        <button class="modal-close" onclick="closeDepartmentReport()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div class="modal-body">
                        <div class="report-header">
                            <div class="report-title">
                                <h1>BVIT Result Analysis System</h1>
                                <h2>Department Performance Report</h2>
                                <h3>${department}</h3>
                                <p>Generated on: ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div class="report-summary">
                            <h3>Executive Summary</h3>
                            <div class="summary-grid">
                                <div class="summary-item">
                                    <strong>Total Students:</strong> ${totalStudents}
                                </div>
                                <div class="summary-item">
                                    <strong>Students with Marks:</strong> ${studentsWithMarks}
                                </div>
                                <div class="summary-item">
                                    <strong>Completion Rate:</strong> ${completionRate}%
                                </div>
                                <div class="summary-item">
                                    <strong>Total Teachers:</strong> ${deptTeachers.length}
                                </div>
                            </div>
                        </div>
                        
                        <div class="report-classifications">
                            <h3>Performance Distribution</h3>
                            <div class="classification-grid">
                                <div class="class-item distinction">
                                    <div class="class-count">${classifications.distinction}</div>
                                    <div class="class-label">Distinction (75%+)</div>
                                    <div class="class-percentage">${totalStudents > 0 ? (classifications.distinction / totalStudents * 100).toFixed(1) : 0}%</div>
                                </div>
                                <div class="class-item first-class">
                                    <div class="class-count">${classifications.firstClass}</div>
                                    <div class="class-label">First Class (60-74%)</div>
                                    <div class="class-percentage">${totalStudents > 0 ? (classifications.firstClass / totalStudents * 100).toFixed(1) : 0}%</div>
                                </div>
                                <div class="class-item second-class">
                                    <div class="class-count">${classifications.secondClass}</div>
                                    <div class="class-label">Second Class (50-59%)</div>
                                    <div class="class-percentage">${totalStudents > 0 ? (classifications.secondClass / totalStudents * 100).toFixed(1) : 0}%</div>
                                </div>
                                <div class="class-item pass-class">
                                    <div class="class-count">${classifications.passClass}</div>
                                    <div class="class-label">Pass Class (40-49%)</div>
                                    <div class="class-percentage">${totalStudents > 0 ? (classifications.passClass / totalStudents * 100).toFixed(1) : 0}%</div>
                                </div>
                                <div class="class-item fail">
                                    <div class="class-count">${classifications.fail}</div>
                                    <div class="class-label">Fail (<40%)</div>
                                    <div class="class-percentage">${totalStudents > 0 ? (classifications.fail / totalStudents * 100).toFixed(1) : 0}%</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="report-teachers">
                            <h3>Department Faculty</h3>
                            <div class="teachers-list">
                                ${deptTeachers.map(teacher => `
                                    <div class="teacher-item">
                                        <strong>${teacher.name}</strong> - ${teacher.role || 'Teacher'}
                                        <br><small>Class: ${teacher.class || 'Not Assigned'}</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="closeDepartmentReport()">
                            <i class="fas fa-times"></i> Close
                        </button>
                        <button class="btn btn-primary" onclick="printDepartmentReport()">
                            <i class="fas fa-print"></i> Print Report
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', reportHtml);
        showNotification(`✅ Department report generated for ${department}`, 'success');
        
    } catch (error) {
        console.error('❌ Error generating department report:', error);
        showNotification('❌ Error generating department report', 'error');
    }
}

// Close department report modal
function closeDepartmentReport() {
    const modal = document.getElementById('departmentReportModal');
    if (modal) {
        modal.remove();
    }
}

// Print department report
function printDepartmentReport() {
    window.print();
}

// Export department data (legacy function)
function exportDepartmentData(department) {
    exportComprehensiveMarks(department);
}

// Generate proforma for department (legacy function)
function generateProforma(department) {
    generateDepartmentReport(department);
}

// Generate settings content
async function generateSettingsContent() {
    return `
        <div class="settings">
            <div class="management-header">
                <div class="header-info">
                    <h2><i class="fas fa-cog"></i> System Settings</h2>
                    <p>Essential system configuration and information</p>
                </div>
            </div>

            <div class="settings-grid">
                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-server"></i> System Status</h3>
                    </div>
                    <div class="settings-card">
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Firebase Connection</label>
                                <p>Real-time database connection status</p>
                            </div>
                            <div class="setting-control">
                                <span class="status-badge ${window.firebasePermissionDenied ? 'warning' : 'success'}" id="firebaseStatus">
                                    <i class="fas fa-${window.firebasePermissionDenied ? 'exclamation-triangle' : 'check-circle'}"></i>
                                    ${window.firebasePermissionDenied ? 'Offline Mode' : 'Connected'}
                                </span>
                            </div>
                        </div>
                        ${window.firebasePermissionDenied ? `
                        <div class="setting-item">
                            <div class="setting-info">
                                <label>Deployment Mode</label>
                                <p>Running on GitHub Pages with localStorage fallback</p>
                            </div>
                            <div class="setting-control">
                                <span class="status-badge info">
                                    <i class="fas fa-info-circle"></i>
                                    GitHub Pages
                                </span>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="settings-section">
                    <div class="section-header">
                        <h3><i class="fas fa-database"></i> Data Management</h3>
                    </div>
                    <div class="settings-card">
                        <div class="data-actions">
                            <div class="action-item">
                                <div class="action-info">
                                    <h4>Export Data</h4>
                                    <p>Download all system data as backup</p>
                                </div>
                                <button class="btn btn-success" onclick="exportAllData()">
                                    <i class="fas fa-download"></i>
                                    Export
                                </button>
                            </div>
                            <div class="action-item">
                                <div class="action-info">
                                    <h4>Clear Cache</h4>
                                    <p>Clear temporary data and cache</p>
                                </div>
                                <button class="btn btn-warning" onclick="clearCache()">
                                    <i class="fas fa-trash-alt"></i>
                                    Clear
                                </button>
                            </div>
                            ${window.firebasePermissionDenied ? `
                            <div class="action-item">
                                <div class="action-info">
                                    <h4>Create Sample Data</h4>
                                    <p>Add sample teachers and departments for testing</p>
                                </div>
                                <button class="btn btn-info" onclick="createSampleDataForGitHubPages()">
                                    <i class="fas fa-plus"></i>
                                    Create
                                </button>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="system-info">
                <div class="info-header">
                    <h3><i class="fas fa-info-circle"></i> System Information</h3>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Version</span>
                        <span class="info-value">v2.1.0</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Last Updated</span>
                        <span class="info-value">${new Date().toLocaleDateString()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Database</span>
                        <span class="info-value">Firebase Realtime DB</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Students</span>
                        <span class="info-value" id="totalStudentsCount">Loading...</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Teachers</span>
                        <span class="info-value" id="totalTeachersCount">Loading...</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Departments</span>
                        <span class="info-value" id="totalDepartmentsCount">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update settings page counts
async function updateSettingsCounts() {
    try {
        // Get counts from Firebase
        const students = await getStudentsFromFirebase();
        const teachers = await getTeachersFromFirebase();
        const departments = await getDepartmentsFromFirebase();
        
        // Update DOM elements
        const studentsCount = document.getElementById('totalStudentsCount');
        const teachersCount = document.getElementById('totalTeachersCount');
        const departmentsCount = document.getElementById('totalDepartmentsCount');
        
        if (studentsCount) studentsCount.textContent = students?.length || 0;
        if (teachersCount) teachersCount.textContent = teachers?.length || 0;
        if (departmentsCount) departmentsCount.textContent = departments?.length || 0;
        
        console.log('✅ Settings counts updated');
    } catch (error) {
        console.error('❌ Error updating settings counts:', error);
    }
}

// ===================================
// PLACEHOLDER FUNCTIONS
// ===================================

function viewTeacher(id) {
    showNotification(`View teacher: ${id}`, 'info');
}

async function editTeacher(id) {
    try {
        console.log(`✏️ Opening edit form for teacher: ${id}`);
        
        // Get teacher data
        const teachers = await getTeachersFromFirebase();
        console.log(`🔍 Total teachers loaded: ${teachers.length}`);
        console.log(`🔍 Looking for teacher with ID: ${id}`);
        console.log(`🔍 Available teacher IDs:`, teachers.map(t => t.id));
        
        const teacher = teachers.find(t => t.id === id);
        console.log(`🔍 Found teacher:`, teacher);
        
        if (!teacher) {
            showNotification(`Teacher ${id} not found!`, 'error');
            console.error(`❌ Teacher ${id} not found in teachers list`);
            return;
        }
        
        // Check if modal already exists
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        console.log('🔧 Creating edit teacher modal...');
        
        // Safely get teacher values with defaults
        const teacherName = teacher.name || '';
        const teacherEmail = teacher.email || '';
        const teacherPhone = teacher.phone || '';
        const teacherDept = teacher.department || '';
        const teacherRole = teacher.role || '';
        
        console.log('📝 Teacher data for form:', {
            id: teacher.id,
            name: teacherName,
            email: teacherEmail,
            department: teacherDept,
            role: teacherRole
        });
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3><i class="fas fa-user-edit"></i> Edit Teacher - ${teacherName}</h3>
                    <button class="modal-close" onclick="closeEditTeacherModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <form id="editTeacherForm" onsubmit="handleEditTeacher(event, '${id}')">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="editTeacherId">Teacher ID *</label>
                                <input type="text" id="editTeacherId" name="teacherId" required 
                                       value="${teacher.id}" maxlength="10" readonly>
                                <small>Teacher ID cannot be changed</small>
                            </div>
                            <div class="form-group">
                                <label for="editTeacherName">Full Name *</label>
                                <input type="text" id="editTeacherName" name="teacherName" required 
                                       value="${teacherName}" maxlength="100">
                            </div>
                            <div class="form-group">
                                <label for="editTeacherEmail">Email Address *</label>
                                <input type="email" id="editTeacherEmail" name="teacherEmail" required 
                                       value="${teacherEmail}">
                                <small>Used for login</small>
                            </div>
                            <div class="form-group">
                                <label for="editTeacherPhone">Phone Number</label>
                                <input type="tel" id="editTeacherPhone" name="teacherPhone" 
                                       value="${teacherPhone}" maxlength="15">
                            </div>
                            <div class="form-group">
                                <label for="editTeacherDepartment">Department *</label>
                                <select id="editTeacherDepartment" name="teacherDepartment" required>
                                    <option value="">Select Department</option>
                                    <option value="Computer Technology" ${teacherDept === 'Computer Technology' ? 'selected' : ''}>Computer Technology</option>
                                    <option value="Mechanical Engineering" ${teacherDept === 'Mechanical Engineering' ? 'selected' : ''}>Mechanical Engineering</option>
                                    <option value="Electronics & Telecom" ${teacherDept === 'Electronics & Telecom' ? 'selected' : ''}>Electronics & Telecom</option>
                                    <option value="Civil Engineering" ${teacherDept === 'Civil Engineering' ? 'selected' : ''}>Civil Engineering</option>
                                    <option value="Information Technology" ${teacherDept === 'Information Technology' ? 'selected' : ''}>Information Technology</option>
                                    <option value="Electrical Engineering" ${teacherDept === 'Electrical Engineering' ? 'selected' : ''}>Electrical Engineering</option>
                                    <option value="Administration" ${teacherDept === 'Administration' ? 'selected' : ''}>Administration</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editTeacherRole">Role *</label>
                                <select id="editTeacherRole" name="teacherRole" required>
                                    <option value="">Select Role</option>
                                    <option value="Class Teacher" ${teacherRole === 'Class Teacher' ? 'selected' : ''}>Class Teacher</option>
                                    <option value="Subject Teacher" ${teacherRole === 'Subject Teacher' ? 'selected' : ''}>Subject Teacher</option>
                                    <option value="HOD" ${teacherRole === 'HOD' ? 'selected' : ''}>Head of Department</option>
                                    <option value="Admin" ${teacherRole === 'Admin' ? 'selected' : ''}>Administrator</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="editTeacherClass">Assigned Class</label>
                                <select id="editTeacherClass" name="teacherClass">
                                    <option value="">Select Class (for Class Teachers)</option>
                                </select>
                                <small>Required for Class Teachers - shows classes from selected department</small>
                            </div>
                            <div class="form-group">
                                <label for="editTeacherSubjects">Assigned Subjects</label>
                                <div id="editSubjectsContainer" class="subjects-container">
                                    <p class="no-subjects">Loading subjects...</p>
                                </div>
                                <small>Select subjects this teacher will teach</small>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="closeEditTeacherModal()">
                                <i class="fas fa-times"></i>
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i>
                                Update Teacher
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        console.log('📋 Adding modal to DOM...');
        document.body.appendChild(modal);
        console.log('✅ Modal added to DOM successfully');
        
        // Verify modal is in DOM
        const addedModal = document.querySelector('.modal-overlay');
        console.log('🔍 Modal in DOM:', addedModal ? 'Found' : 'Not found');
        
        // Add event listener for department change
        console.log('🔗 Adding department change listener...');
        const deptSelect = document.getElementById('editTeacherDepartment');
        if (deptSelect) {
            deptSelect.addEventListener('change', async function() {
                console.log('🔄 Department changed to:', this.value);
                await updateEditClassesAndSubjects(this.value, teacher);
            });
            console.log('✅ Department listener added');
        } else {
            console.error('❌ Department select not found');
        }
        
        // Load initial classes and subjects for current department
        if (teacher.department) {
            console.log('📚 Loading initial classes and subjects for:', teacher.department);
            await updateEditClassesAndSubjects(teacher.department, teacher);
        }
        
        // Focus on name input
        setTimeout(() => {
            const nameInput = document.getElementById('editTeacherName');
            if (nameInput) {
                nameInput.focus();
                console.log('✅ Focus set on name input');
            } else {
                console.error('❌ Name input not found for focus');
            }
        }, 100);
        
    } catch (error) {
        console.error('❌ Error opening edit teacher form:', error);
        showNotification('Error loading teacher data', 'error');
    }
}


function viewStudent(id) {
    showNotification(`View student: ${id}`, 'info');
}

function editStudent(id) {
    showNotification(`Edit student: ${id}`, 'info');
}

async function deleteStudent(id) {
    if (confirm(`Are you sure you want to delete student ${id}? This action cannot be undone.`)) {
        try {
            showNotification('Deleting student...', 'info');
            
            if (window.firebaseDB && window.firebaseDB.isConnected) {
                // Delete from Firebase
                const result = await window.firebaseDB.deleteStudent(id);
                if (result) {
                    console.log(`✅ Student ${id} deleted from Firebase`);
                    showNotification(`Student ${id} deleted successfully from Firebase`, 'success');
                    
                    // Refresh the student management view to show updated data
                    if (window.currentAdminSection === 'student-management') {
                        await loadAdminContent('student-management');
                    }
                } else {
                    throw new Error('Failed to delete from Firebase');
                }
            } else {
                throw new Error('Firebase not connected');
            }
        } catch (error) {
            console.error('❌ Error deleting student:', error);
            showNotification(`Error deleting student: ${error.message}`, 'error');
        }
    }
}

function viewStudentMarks(id) {
    showNotification(`View marks for student: ${id}`, 'info');
}

// Filter student table function
function filterStudentTable(searchTerm) {
    const rows = document.querySelectorAll('#studentsTable tbody tr');
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchLower)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Export students function
function exportStudents() {
    showNotification('Export students functionality - Coming soon', 'info');
}

// Teacher action functions
function viewTeacher(id) {
    showNotification(`View teacher details: ${id}`, 'info');
}

// editTeacher function is implemented above (async version with full functionality)

function assignTeacher(id) {
    showNotification(`Assign class to teacher: ${id}`, 'info');
}

function deleteTeacher(id) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        showNotification(`Teacher ${id} deleted successfully`, 'success');
        // Refresh the teacher management view
        if (window.currentAdminSection === 'teacher-management') {
            loadAdminContent('teacher-management');
        }
    }
}

async function importTeachers() {
    try {
        // Create file input for CSV/JSON import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.style.display = 'none';
        
        input.onchange = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                showNotification('Processing import file...', 'info');
                
                const text = await file.text();
                let teachersData = [];
                
                if (file.name.endsWith('.json')) {
                    teachersData = JSON.parse(text);
                } else if (file.name.endsWith('.csv')) {
                    // Simple CSV parsing (you can enhance this)
                    const lines = text.split('\n');
                    const headers = lines[0].split(',');
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',');
                            const teacher = {};
                            headers.forEach((header, index) => {
                                teacher[header.trim()] = values[index]?.trim();
                            });
                            teachersData.push(teacher);
                        }
                    }
                }
                
                if (teachersData.length === 0) {
                    showNotification('No valid teacher data found in file', 'error');
                    return;
                }
                
                // Show confirmation dialog
                const confirmed = confirm(`Import ${teachersData.length} teachers with Firebase authentication?\n\nThis will create login accounts for all teachers.`);
                if (!confirmed) return;
                
                showNotification('Creating Firebase authentication for teachers...', 'info');
                
                // Import with authentication
                const result = await importTeachersWithAuth(teachersData);
                
                if (result.successful > 0) {
                    // Save successful teachers to Firebase database
                    const successfulTeachers = result.results
                        .filter(r => r.status === 'success')
                        .map(r => r.teacher);
                    
                    const existingTeachers = await getTeachersFromFirebase();
                    const allTeachers = [...existingTeachers, ...successfulTeachers];
                    await saveTeachersToFirebase(allTeachers);
                    
                    showNotification(`Successfully imported ${result.successful} teachers with authentication!`, 'success');
                    
                    // Refresh teacher management view
                    if (window.currentAdminSection === 'teacher-management') {
                        loadAdminContent('teacher-management');
                    }
                } else {
                    showNotification('No teachers were imported successfully', 'error');
                }
                
                if (result.failed > 0) {
                    console.log('Failed imports:', result.results.filter(r => r.status === 'failed'));
                }
                
            } catch (error) {
                console.error('❌ Import error:', error);
                showNotification('Import failed: ' + error.message, 'error');
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        
    } catch (error) {
        console.error('❌ Import setup error:', error);
        showNotification('Import setup failed: ' + error.message, 'error');
    }
}

function exportTeachers() {
    showNotification('Export teachers functionality - Coming soon', 'info');
}

// Firebase Teacher Login Function
async function loginTeacherWithFirebase(email, password) {
    try {
        console.log('🔐 Attempting Firebase teacher login for:', email);
        
        // Sign in with Firebase Authentication
        const authResult = await signInWithEmail(email, password);
        
        if (!authResult.success) {
            console.error('❌ Firebase authentication failed:', authResult.error);
            return { success: false, error: authResult.error };
        }

        console.log('✅ Firebase authentication successful');
        
        // Get teacher data from Firebase
        const teachers = await getTeachersFromFirebase();
        const teacher = teachers.find(t => t.email.toLowerCase() === email.toLowerCase());
        
        if (!teacher) {
            console.error('❌ Teacher not found in database');
            return { success: false, error: 'Teacher not found in database' };
        }

        console.log('✅ Teacher login successful:', teacher.name);
        return { success: true, teacher: teacher, user: authResult.user };
        
    } catch (error) {
        console.error('❌ Teacher login error:', error);
        return { success: false, error: error.message };
    }
}

// Bulk Import Teachers with Firebase Authentication
async function importTeachersWithAuth(teachersData) {
    try {
        console.log('🔄 Starting bulk teacher import with authentication...');
        const results = [];
        
        for (const teacherData of teachersData) {
            try {
                console.log(`🔐 Creating authentication for: ${teacherData.email}`);
                
                // Create Firebase authentication
                const authResult = await signUpWithEmail(teacherData.email, teacherData.password, {
                    name: teacherData.name,
                    role: 'teacher',
                    department: teacherData.department,
                    teacherId: teacherData.id,
                    class: teacherData.class
                });

                if (authResult.success) {
                    results.push({ teacher: teacherData, status: 'success' });
                    console.log(`✅ Authentication created for: ${teacherData.name}`);
                } else {
                    results.push({ teacher: teacherData, status: 'failed', error: authResult.error });
                    console.log(`❌ Authentication failed for: ${teacherData.name} - ${authResult.error}`);
                }
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                results.push({ teacher: teacherData, status: 'failed', error: error.message });
                console.log(`❌ Error processing: ${teacherData.name} - ${error.message}`);
            }
        }
        
        const successful = results.filter(r => r.status === 'success').length;
        const failed = results.filter(r => r.status === 'failed').length;
        
        console.log(`🔄 Import completed: ${successful} successful, ${failed} failed`);
        return { successful, failed, results };
        
    } catch (error) {
        console.error('❌ Bulk import error:', error);
        return { successful: 0, failed: teachersData.length, error: error.message };
    }
}

// Save students to Firebase with fallback to localStorage
async function saveStudentsToFirebase(students) {
    try {
        // First, always save to localStorage as backup
        localStorage.setItem('students', JSON.stringify(students));
        console.log('✅ Students saved to localStorage as backup');

        // Try to save to Firebase
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const result = await window.firebaseDB.saveStudents(students);
            if (result) {
                console.log('✅ Students saved to Firebase successfully');
                return true;
            } else {
                console.log('⚠️ Firebase save failed, using localStorage backup');
                return true; // Still return true since localStorage worked
            }
        } else if (window.database) {
            // Fallback: try direct Firebase database access
            const studentsRef = window.database.ref('students');
            await studentsRef.set(students);
            console.log('✅ Students saved to Firebase successfully (direct)');
            return true;
        } else {
            console.log('⚠️ Firebase not available, using localStorage only');
            return true; // localStorage already saved above
        }
    } catch (error) {
        console.error('⚠️ Firebase error, but localStorage backup successful:', error.message);
        // Don't throw error since localStorage backup worked
        return true;
    }
}

// Get department classes and subjects from Firebase
async function getDepartmentDataFromGoogleSheets() {
    try {
        console.log('📊 Loading department classes and subjects from Firebase...');
        
        // Try Firebase direct access
        if (window.database) {
            try {
                const snapshot = await window.database.ref('departmentData').once('value');
                const data = snapshot.val();
                if (data && Object.keys(data).length > 0) {
                    localStorage.setItem('departmentData', JSON.stringify(data));
                    console.log('✅ Department classes and subjects loaded from Firebase');
                    return data;
                }
            } catch (error) {
                console.log('⚠️ Firebase error:', error.message);
            }
        }
        
        // Fallback to localStorage
        const localData = localStorage.getItem('departmentData');
        if (localData) {
            const data = JSON.parse(localData);
            console.log('✅ Department data loaded from localStorage');
            return data;
        }
        
        // Return empty object - only departments with classes/subjects will be added
        console.log('📝 No department data found, will create when admin adds classes/subjects');
        return {};
        
    } catch (error) {
        console.error('❌ Error loading department data:', error);
        return {};
    }
}

// Save department data to Firebase with localStorage backup
async function saveDepartmentDataToGoogleSheets(departmentData) {
    return await saveDepartmentDataToFirebase(departmentData);
}

// Save department data to Firebase - only classes and subjects
async function saveDepartmentDataToFirebase(departmentData) {
    try {
        console.log('💾 Saving department classes and subjects to Firebase...');
        
        // Save to localStorage as backup
        localStorage.setItem('departmentData', JSON.stringify(departmentData));
        
        // Save only classes and subjects to Firebase
        if (window.database) {
            try {
                await window.database.ref('departmentData').set(departmentData);
                console.log('✅ Department classes and subjects saved to Firebase');
                return true;
            } catch (error) {
                console.log('⚠️ Firebase save failed:', error.message);
                return false;
            }
        } else {
            console.log('⚠️ Firebase not available');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error saving department data:', error);
        return false;
    }
}

// Expose functions globally
window.loginTeacherWithFirebase = loginTeacherWithFirebase;
window.importTeachersWithAuth = importTeachersWithAuth;
window.saveStudentsToFirebase = saveStudentsToFirebase;
window.getDepartmentDataFromGoogleSheets = getDepartmentDataFromGoogleSheets;
window.saveDepartmentDataToGoogleSheets = saveDepartmentDataToGoogleSheets;
window.saveDepartmentDataToFirebase = saveDepartmentDataToFirebase;

// Search and filter functionality for teachers
function initializeTeacherFilters() {
    // Search functionality
    const searchInput = document.getElementById('teacherSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterTeacherCards(this.value, getActiveFilter());
        });
    }

    // Filter buttons functionality
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            const filterType = this.getAttribute('data-filter');
            const searchTerm = searchInput ? searchInput.value : '';
            filterTeacherCards(searchTerm, filterType);
        });
    });
}

function getActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    return activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
}

function filterTeacherCards(searchTerm, filterType) {
    const cards = document.querySelectorAll('.teacher-card');
    const searchLower = searchTerm.toLowerCase();
    
    cards.forEach(card => {
        const teacherName = card.querySelector('.teacher-name')?.textContent.toLowerCase() || '';
        const teacherEmail = card.querySelector('.teacher-email')?.textContent.toLowerCase() || '';
        const teacherDept = card.querySelector('.teacher-department')?.textContent.toLowerCase() || '';
        const teacherRole = card.querySelector('.role-badge')?.textContent.toLowerCase() || '';
        
        // Check search term match
        const matchesSearch = !searchTerm || 
            teacherName.includes(searchLower) || 
            teacherEmail.includes(searchLower) || 
            teacherDept.includes(searchLower);
        
        // Check filter type match
        let matchesFilter = true;
        if (filterType === 'admin') {
            matchesFilter = teacherRole.includes('admin');
        } else if (filterType === 'teacher') {
            matchesFilter = !teacherRole.includes('admin');
        }
        
        // Show/hide card based on both criteria
        if (matchesSearch && matchesFilter) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Table filter function
function filterTeacherTable(searchTerm) {
    const rows = document.querySelectorAll('#teachersTable tbody tr');
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchLower)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Initialize filters when teacher management loads
window.initializeTeacherFilters = initializeTeacherFilters;
window.filterTeacherTable = filterTeacherTable;

function showAddTeacherForm() {
    console.log('🔧 Opening Add Teacher form...');
    
    // Check if modal already exists
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container scrollable">
            <div class="modal-header">
                <h3><i class="fas fa-user-plus"></i> Add New Teacher</h3>
                <button class="modal-close" onclick="closeAddTeacherModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <form id="addTeacherForm" onsubmit="handleAddTeacher(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="teacherId">Teacher ID *</label>
                            <input type="text" id="teacherId" name="teacherId" required 
                                   placeholder="e.g., T001, ME001" maxlength="10">
                            <small>Unique identifier for the teacher</small>
                        </div>
                        <div class="form-group">
                            <label for="teacherName">Full Name *</label>
                            <input type="text" id="teacherName" name="teacherName" required 
                                   placeholder="Enter full name" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="teacherEmail">Email Address *</label>
                            <input type="email" id="teacherEmail" name="teacherEmail" required 
                                   placeholder="teacher@bvit.edu">
                            <small>Will be used for login</small>
                        </div>
                        <div class="form-group">
                            <label for="teacherPhone">Phone Number</label>
                            <input type="tel" id="teacherPhone" name="teacherPhone" 
                                   placeholder="10-digit mobile number" maxlength="15">
                        </div>
                        <div class="form-group">
                            <label for="teacherDepartment">Department *</label>
                            <select id="teacherDepartment" name="teacherDepartment" required onchange="handleTeacherDepartmentChange()">
                                <option value="">Select Department</option>
                                ${generateDepartmentOptions()}
                                <option value="Administration">Administration</option>
                            </select>
                        </div>
                        <div class="form-group" id="teacherDivisionGroup" style="display: none;">
                            <label for="teacherDivision">Division *</label>
                            <select id="teacherDivision" name="teacherDivision">
                                <option value="">Select Division</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                            <small>Required for Computer Technology department</small>
                        </div>
                        <div class="form-group">
                            <label for="teacherRole">Role *</label>
                            <select id="teacherRole" name="teacherRole" required>
                                <option value="">Select Role</option>
                                <option value="Class Teacher">Class Teacher</option>
                                <option value="Subject Teacher">Subject Teacher</option>
                                <option value="HOD">Head of Department</option>
                                <option value="Admin">Administrator</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="teacherClass">Assigned Class</label>
                            <select id="teacherClass" name="teacherClass">
                                <option value="">Select Class (for Class Teachers)</option>
                            </select>
                            <small>Required for Class Teachers - shows classes from selected department</small>
                        </div>
                        <div class="form-group">
                            <label for="teacherSubjects">Assigned Subjects</label>
                            <div id="subjectsContainer" class="subjects-container">
                                <p class="no-subjects">Select department first to see available subjects</p>
                            </div>
                            <small>Select subjects this teacher will teach</small>
                        </div>
                        <div class="form-group">
                            <label for="teacherPassword">Password *</label>
                            <input type="password" id="teacherPassword" name="teacherPassword" required 
                                   placeholder="Minimum 6 characters" minlength="6">
                            <small>Teacher will use this to login</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeAddTeacherModal()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Add Teacher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listener for department change
    document.getElementById('teacherDepartment').addEventListener('change', async function() {
        await updateClassesAndSubjects(this.value);
    });
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('teacherId').focus();
    }, 100);
    
    // Add event listener for ESC key
    document.addEventListener('keydown', handleModalEscape);
}

// Update classes and subjects based on department selection
async function updateClassesAndSubjects(department) {
    if (!department) {
        // Clear classes and subjects if no department selected
        document.getElementById('teacherClass').innerHTML = '<option value="">Select Class (for Class Teachers)</option>';
        document.getElementById('subjectsContainer').innerHTML = '<p class="no-subjects">Select department first to see available subjects</p>';
        return;
    }
    
    try {
        console.log(`🔄 Loading classes and subjects for department: ${department}`);
        
        // Get department data from Firebase
        const departmentData = await getDepartmentDataFromGoogleSheets();
        const deptData = departmentData[department];
        
        // Update classes dropdown
        const classSelect = document.getElementById('teacherClass');
        classSelect.innerHTML = '<option value="">Select Class (for Class Teachers)</option>';
        
        if (deptData && deptData.classes && deptData.classes.length > 0) {
            deptData.classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                classSelect.appendChild(option);
            });
            console.log(`✅ Loaded ${deptData.classes.length} classes for ${department}`);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No classes available - Add classes in Department Management';
            option.disabled = true;
            classSelect.appendChild(option);
        }
        
        // Update subjects container
        const subjectsContainer = document.getElementById('subjectsContainer');
        
        if (deptData && deptData.subjects && deptData.subjects.length > 0) {
            let subjectsHTML = '<div class="subjects-checkboxes">';
            deptData.subjects.forEach(subject => {
                subjectsHTML += `
                    <label class="subject-checkbox">
                        <input type="checkbox" name="teacherSubjects" value="${subject}">
                        <span class="checkmark"></span>
                        ${subject}
                    </label>
                `;
            });
            subjectsHTML += '</div>';
            subjectsContainer.innerHTML = subjectsHTML;
            console.log(`✅ Loaded ${deptData.subjects.length} subjects for ${department}`);
        } else {
            subjectsContainer.innerHTML = '<p class="no-subjects">No subjects available - Add subjects in Department Management</p>';
        }
        
    } catch (error) {
        console.error('❌ Error loading department data:', error);
        document.getElementById('teacherClass').innerHTML = '<option value="">Error loading classes</option>';
        document.getElementById('subjectsContainer').innerHTML = '<p class="no-subjects">Error loading subjects</p>';
    }
}

// Update classes and subjects for edit teacher form
async function updateEditClassesAndSubjects(department, teacher) {
    if (!department) {
        document.getElementById('editTeacherClass').innerHTML = '<option value="">Select Class (for Class Teachers)</option>';
        document.getElementById('editSubjectsContainer').innerHTML = '<p class="no-subjects">Select department first to see available subjects</p>';
        return;
    }
    
    try {
        console.log(`🔄 Loading classes and subjects for edit form - department: ${department}`);
        
        // Get department data from Firebase
        const departmentData = await getDepartmentDataFromGoogleSheets();
        const deptData = departmentData[department];
        
        // Update classes dropdown
        const classSelect = document.getElementById('editTeacherClass');
        classSelect.innerHTML = '<option value="">Select Class (for Class Teachers)</option>';
        
        if (deptData && deptData.classes && deptData.classes.length > 0) {
            deptData.classes.forEach(className => {
                const option = document.createElement('option');
                option.value = className;
                option.textContent = className;
                // Select current teacher's class if it matches
                if (teacher.class === className) {
                    option.selected = true;
                }
                classSelect.appendChild(option);
            });
            console.log(`✅ Loaded ${deptData.classes.length} classes for edit form`);
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No classes available - Add classes in Department Management';
            option.disabled = true;
            classSelect.appendChild(option);
        }
        
        // Update subjects container
        const subjectsContainer = document.getElementById('editSubjectsContainer');
        
        if (deptData && deptData.subjects && deptData.subjects.length > 0) {
            let subjectsHTML = '<div class="subjects-checkboxes">';
            deptData.subjects.forEach(subject => {
                // Check if teacher currently has this subject assigned
                const isChecked = teacher.subjects && teacher.subjects.includes(subject) ? 'checked' : '';
                subjectsHTML += `
                    <label class="subject-checkbox">
                        <input type="checkbox" name="editTeacherSubjects" value="${subject}" ${isChecked}>
                        <span class="checkmark"></span>
                        ${subject}
                    </label>
                `;
            });
            subjectsHTML += '</div>';
            subjectsContainer.innerHTML = subjectsHTML;
            console.log(`✅ Loaded ${deptData.subjects.length} subjects for edit form`);
        } else {
            subjectsContainer.innerHTML = '<p class="no-subjects">No subjects available - Add subjects in Department Management</p>';
        }
        
    } catch (error) {
        console.error('❌ Error loading department data for edit form:', error);
        document.getElementById('editTeacherClass').innerHTML = '<option value="">Error loading classes</option>';
        document.getElementById('editSubjectsContainer').innerHTML = '<p class="no-subjects">Error loading subjects</p>';
    }
}

// Handle edit teacher form submission
async function handleEditTeacher(event, teacherId) {
    event.preventDefault();
    console.log(`🔧 Handling Edit Teacher form submission for: ${teacherId}`);
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        
        // Get selected subjects
        const selectedSubjects = [];
        const subjectCheckboxes = document.querySelectorAll('input[name="editTeacherSubjects"]:checked');
        subjectCheckboxes.forEach(checkbox => {
            selectedSubjects.push(checkbox.value);
        });
        
        const updatedTeacherData = {
            id: teacherId, // Keep original ID
            name: formData.get('teacherName').trim(),
            email: formData.get('teacherEmail').trim().toLowerCase(),
            phone: formData.get('teacherPhone').trim(),
            department: formData.get('teacherDepartment'),
            role: formData.get('teacherRole'),
            class: formData.get('teacherClass').trim(),
            subjects: selectedSubjects, // Updated assigned subjects
            username: formData.get('teacherEmail').trim().toLowerCase(),
            updatedAt: new Date().toISOString()
        };
        
        // Validate required fields
        if (!updatedTeacherData.name || !updatedTeacherData.email || 
            !updatedTeacherData.department || !updatedTeacherData.role) {
            showNotification('Please fill all required fields!', 'error');
            return;
        }
        
        // Validate Class Teacher has assigned class
        if (updatedTeacherData.role === 'Class Teacher' && !updatedTeacherData.class) {
            showNotification('Class Teachers must have an assigned class!', 'error');
            return;
        }
        
        // Get existing teachers
        const teachers = await getTeachersFromFirebase();
        const teacherIndex = teachers.findIndex(t => t.id === teacherId);
        
        if (teacherIndex === -1) {
            showNotification('Teacher not found!', 'error');
            return;
        }
        
        // Preserve original data and update with new data
        const originalTeacher = teachers[teacherIndex];
        teachers[teacherIndex] = {
            ...originalTeacher,
            ...updatedTeacherData,
            password: originalTeacher.password, // Keep original password
            createdAt: originalTeacher.createdAt, // Keep original creation date
            isActive: originalTeacher.isActive // Keep original status
        };
        
        // Save updated teachers list
        await saveTeachersToFirebase(teachers);
        
        showNotification(`Teacher ${updatedTeacherData.name} updated successfully!`, 'success');
        console.log(`✅ Teacher ${teacherId} updated successfully`);
        
        // Close modal and refresh teacher management
        closeEditTeacherModal();
        
        // Refresh teacher management if currently viewing it
        if (window.currentAdminSection === 'teacher-management') {
            loadAdminContent('teacher-management');
        }
        
    } catch (error) {
        console.error('❌ Error updating teacher:', error);
        showNotification('Error updating teacher. Please try again.', 'error');
    }
}

// Close edit teacher modal
function closeEditTeacherModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Close add teacher modal
function closeAddTeacherModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleModalEscape);
}

// Handle ESC key for modal
function handleModalEscape(event) {
    if (event.key === 'Escape') {
        closeAddTeacherModal();
    }
}

// Handle add teacher form submission
async function handleAddTeacher(event) {
    event.preventDefault();
    console.log('🔧 Handling Add Teacher form submission...');
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        
        // Get selected subjects
        const selectedSubjects = [];
        const subjectCheckboxes = document.querySelectorAll('input[name="teacherSubjects"]:checked');
        subjectCheckboxes.forEach(checkbox => {
            selectedSubjects.push(checkbox.value);
        });
        
        const teacherData = {
            id: formData.get('teacherId').trim(),
            name: formData.get('teacherName').trim(),
            email: formData.get('teacherEmail').trim().toLowerCase(),
            phone: formData.get('teacherPhone').trim(),
            department: formData.get('teacherDepartment'),
            division: formData.get('teacherDivision') || null,
            role: formData.get('teacherRole'),
            class: formData.get('teacherClass').trim(),
            subjects: selectedSubjects, // Add assigned subjects
            password: formData.get('teacherPassword'),
            username: formData.get('teacherEmail').trim().toLowerCase(),
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Validate required fields
        if (!teacherData.id || !teacherData.name || !teacherData.email || 
            !teacherData.department || !teacherData.role || !teacherData.password) {
            showNotification('Please fill all required fields!', 'error');
            return;
        }
        
        // Validate division for Computer Technology
        if (teacherData.department === 'Computer Technology' && !teacherData.division) {
            showNotification('Division is required for Computer Technology department!', 'error');
            return;
        }
        
        // Validate Class Teacher has assigned class
        if (teacherData.role === 'Class Teacher' && !teacherData.class) {
            showNotification('Class Teachers must have an assigned class!', 'error');
            return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(teacherData.email)) {
            showNotification('Please enter a valid email address!', 'error');
            return;
        }
        
        // Check for duplicate ID or email
        console.log('🔍 Checking for duplicate teachers...');
        let existingTeachers = [];
        try {
            existingTeachers = await getTeachersFromFirebase();
            console.log(`📊 Found ${existingTeachers.length} existing teachers`);
        } catch (error) {
            console.log('⚠️ Error loading teachers, using localStorage fallback');
            existingTeachers = JSON.parse(localStorage.getItem('teachers') || '[]');
        }
        
        const duplicateId = existingTeachers.find(t => t.id === teacherData.id);
        const duplicateEmail = existingTeachers.find(t => t.email === teacherData.email);
        
        if (duplicateId) {
            showNotification(`Teacher ID '${teacherData.id}' already exists!`, 'error');
            return;
        }
        
        if (duplicateEmail) {
            showNotification(`Email '${teacherData.email}' already exists!`, 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;
        
        // Create Firebase authentication for the teacher
        console.log('🔐 Creating Firebase authentication for teacher...');
        const authResult = await signUpWithEmail(teacherData.email, teacherData.password, {
            name: teacherData.name,
            role: 'teacher',
            department: teacherData.department,
            teacherId: teacherData.id,
            class: teacherData.class
        });

        if (!authResult.success) {
            console.error('❌ Firebase authentication creation failed:', authResult.error);
            showNotification(`Authentication setup failed: ${authResult.error}`, 'error');
            return;
        }

        console.log('✅ Firebase authentication created successfully');

        // Save teacher to Firebase (with localStorage fallback)
        const updatedTeachers = [...existingTeachers, teacherData];
        await saveTeachersToFirebase(updatedTeachers);
        
        // Close modal and show success
        closeAddTeacherModal();
        showNotification(`Teacher '${teacherData.name}' added successfully!`, 'success');
        
        // Refresh teacher management view if currently active
        if (window.currentAdminSection === 'teacher-management') {
            loadAdminContent('teacher-management');
        }
        
    } catch (error) {
        console.error('❌ Error adding teacher:', error);
        showNotification('Failed to add teacher. Please try again.', 'error');
        
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Teacher';
            submitBtn.disabled = false;
        }
    }
}

function showAddStudentForm() {
    console.log('🔧 Opening Add Student form...');
    
    // Check if modal already exists
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container scrollable">
            <div class="modal-header">
                <h3><i class="fas fa-user-graduate"></i> Add New Student</h3>
                <button class="modal-close" onclick="closeAddStudentModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <form id="addStudentForm" onsubmit="handleAddStudent(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="studentEnrollment">Enrollment Number *</label>
                            <input type="text" id="studentEnrollment" name="studentEnrollment" required 
                                   placeholder="e.g., 2023001, EN001" maxlength="20">
                            <small>Unique enrollment number for the student</small>
                        </div>
                        <div class="form-group">
                            <label for="studentName">Full Name *</label>
                            <input type="text" id="studentName" name="studentName" required 
                                   placeholder="Enter student's full name" maxlength="100">
                        </div>
                        <div class="form-group">
                            <label for="studentDepartment">Department *</label>
                            <select id="studentDepartment" name="studentDepartment" required onchange="generateStudentClass()">
                                <option value="">Select Department</option>
                                ${generateDepartmentOptions()}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="studentSemester">Semester *</label>
                            <select id="studentSemester" name="studentSemester" required onchange="generateStudentClass()">
                                <option value="">Select Semester</option>
                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">3rd Semester</option>
                                <option value="4">4th Semester</option>
                                <option value="5">5th Semester</option>
                                <option value="6">6th Semester</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="studentScheme">Scheme *</label>
                            <select id="studentScheme" name="studentScheme" required onchange="generateStudentClass()">
                                <option value="">Select Scheme</option>
                                <option value="I">I Scheme</option>
                                <option value="K">K Scheme</option>
                                <option value="A">A Scheme</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="studentClass">Class (Auto-generated)</label>
                            <input type="text" id="studentClass" name="studentClass" readonly
                                   placeholder="Will be generated automatically">
                            <small>Generated from Department + Semester + Scheme</small>
                        </div>
                        <div class="form-group">
                            <label for="studentDivision">Division <span id="divisionRequired" style="color: red; display: none;">*</span></label>
                            <select id="studentDivision" name="studentDivision">
                                <option value="">Select Division</option>
                                <option value="A">Division A</option>
                                <option value="B">Division B</option>
                                <option value="C">Division C</option>
                            </select>
                            <small id="divisionHelp">Required for Computer Technology department</small>
                        </div>
                        <div class="form-group">
                            <label for="studentAcademicYear">Academic Year *</label>
                            <select id="studentAcademicYear" name="studentAcademicYear" required>
                                <option value="">Select Academic Year</option>
                                <option value="2023-24">2023-24</option>
                                <option value="2024-25">2024-25</option>
                                <option value="2025-26">2025-26</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeAddStudentModal()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Add Student
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus on first input
    setTimeout(() => {
        document.getElementById('studentEnrollment').focus();
    }, 100);
    
    // Add event listener for ESC key
    document.addEventListener('keydown', handleStudentModalEscape);
}

// Close add student modal
function closeAddStudentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    document.removeEventListener('keydown', handleStudentModalEscape);
}

// Handle ESC key for student modal
function handleStudentModalEscape(event) {
    if (event.key === 'Escape') {
        closeAddStudentModal();
    }
}

// Generate student class based on department, semester, and scheme
function generateStudentClass() {
    const department = document.getElementById('studentDepartment').value;
    const semester = document.getElementById('studentSemester').value;
    const scheme = document.getElementById('studentScheme').value;
    const classField = document.getElementById('studentClass');
    const divisionRequired = document.getElementById('divisionRequired');
    const divisionHelp = document.getElementById('divisionHelp');
    const divisionField = document.getElementById('studentDivision');
    
    // Show/hide division requirement based on department
    const deptCode = DEPARTMENTS.find(d => d.name === department)?.code;
    if (deptCode === 'CM' || department === 'Computer Technology') {
        divisionRequired.style.display = 'inline';
        divisionHelp.textContent = 'Required for Computer Technology department';
        divisionHelp.style.color = '#e53e3e';
        divisionField.setAttribute('required', 'required');
    } else {
        divisionRequired.style.display = 'none';
        divisionHelp.textContent = 'Optional for this department';
        divisionHelp.style.color = '#718096';
        divisionField.removeAttribute('required');
    }
    
    if (department && semester && scheme) {
        // Department abbreviations - using DEPARTMENTS array
        const deptAbbr = {};
        DEPARTMENTS.forEach(dept => {
            deptAbbr[dept.name] = dept.code;
        });
        
        // Add legacy mappings for backward compatibility
        deptAbbr['Computer Technology'] = 'CM';
        deptAbbr['Information Technology'] = 'IF';
        deptAbbr['Electronics & Telecom'] = 'EJ';
        deptAbbr['Electronics & Telecommunication'] = 'EJ';
        
        const abbr = deptAbbr[department] || 'XX';
        const className = `${abbr}${semester}${scheme}`;
        classField.value = className;
        
        console.log('🎓 Generated class:', className);
    } else {
        classField.value = '';
    }
}

// Handle add student form submission
async function handleAddStudent(event) {
    event.preventDefault();
    console.log('🔧 Handling Add Student form submission...');
    
    try {
        // Get form data
        const formData = new FormData(event.target);
        const studentData = {
            enrollmentNo: formData.get('studentEnrollment').trim(),
            name: formData.get('studentName').trim(),
            department: formData.get('studentDepartment'),
            semester: formData.get('studentSemester'),
            scheme: formData.get('studentScheme'),
            class: formData.get('studentClass').trim(),
            division: formData.get('studentDivision'),
            academicYear: formData.get('studentAcademicYear'),
            status: 'Active', // Default status
            createdAt: new Date().toISOString(),
            isActive: true
        };
        
        // Validate required fields
        if (!studentData.enrollmentNo || !studentData.name || !studentData.department || 
            !studentData.semester || !studentData.scheme || !studentData.academicYear) {
            showNotification('Please fill all required fields!', 'error');
            return;
        }
        
        // Check division requirement for Computer Technology
        if (studentData.department === 'Computer Technology' && !studentData.division) {
            showNotification('Division is required for Computer Technology department!', 'error');
            return;
        }
        
        // Check for duplicate enrollment number
        console.log('🔍 Checking for duplicate enrollment numbers...');
        let existingStudents = [];
        try {
            existingStudents = await getStudentsFromFirebase();
            console.log(`📊 Found ${existingStudents.length} existing students`);
        } catch (error) {
            console.log('⚠️ Error loading students, using localStorage fallback');
            existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
        }
        
        const duplicateEnrollment = existingStudents.find(s => s.enrollmentNo === studentData.enrollmentNo);
        
        if (duplicateEnrollment) {
            showNotification(`Enrollment number '${studentData.enrollmentNo}' already exists!`, 'error');
            return;
        }
        
        // Show loading state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;
        
        // Save student to Firebase (with localStorage fallback)
        const updatedStudents = [...existingStudents, studentData];
        await saveStudentsToFirebase(updatedStudents);
        
        // Close modal and show success
        closeAddStudentModal();
        showNotification(`Student '${studentData.name}' added successfully!`, 'success');
        
        // Refresh student management view if currently active
        if (window.currentAdminSection === 'student-management') {
            loadAdminContent('student-management');
        }
        
    } catch (error) {
        console.error('❌ Error adding student:', error);
        showNotification('Failed to add student. Please try again.', 'error');
        
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Student';
            submitBtn.disabled = false;
        }
    }
}

function showAddDepartmentForm() {
    console.log('🔧 Opening Add Department form...');
    
    // Check if modal already exists
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container scrollable">
            <div class="modal-header">
                <h3><i class="fas fa-building"></i> Add New Department</h3>
                <button class="modal-close" onclick="closeAddDepartmentModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <form id="addDepartmentForm" onsubmit="handleAddDepartment(event)">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="deptName">Department Name *</label>
                            <select id="deptName" name="deptName" required onchange="handleDepartmentChange()">
                                <option value="">Select Department</option>
                                ${generateDepartmentOptions()}
                            </select>
                            <small>Select from available departments</small>
                        </div>
                        <div class="form-group" id="divisionGroup" style="display: none;">
                            <label for="deptDivision">Division *</label>
                            <select id="deptDivision" name="deptDivision">
                                <option value="">Select Division</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                            <small>Required for Computer Technology department</small>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="closeAddDepartmentModal()">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary">
                            <i class="fas fa-save"></i>
                            Add Department
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    console.log('✅ Add Department form opened');
}

// Handle department change to show/hide division field
function handleDepartmentChange() {
    const deptSelect = document.getElementById('deptName');
    const divisionGroup = document.getElementById('divisionGroup');
    const divisionSelect = document.getElementById('deptDivision');
    
    if (deptSelect && divisionGroup && divisionSelect) {
        const selectedDept = deptSelect.value;
        
        // Show division field only for Computer Technology
        if (selectedDept === 'Computer Technology') {
            divisionGroup.style.display = 'block';
            divisionSelect.required = true;
            console.log('📋 Division field shown for Computer Technology');
        } else {
            divisionGroup.style.display = 'none';
            divisionSelect.required = false;
            divisionSelect.value = ''; // Clear selection
            console.log('📋 Division field hidden for other departments');
        }
    }
}

// Handle teacher department change to show/hide division field
function handleTeacherDepartmentChange() {
    const deptSelect = document.getElementById('teacherDepartment');
    const divisionGroup = document.getElementById('teacherDivisionGroup');
    const divisionSelect = document.getElementById('teacherDivision');
    
    if (deptSelect && divisionGroup && divisionSelect) {
        const selectedDept = deptSelect.value;
        
        // Show division field only for Computer Technology
        if (selectedDept === 'Computer Technology') {
            divisionGroup.style.display = 'block';
            divisionSelect.required = true;
            console.log('📋 Teacher Division field shown for Computer Technology');
        } else {
            divisionGroup.style.display = 'none';
            divisionSelect.required = false;
            divisionSelect.value = ''; // Clear selection
            console.log('📋 Teacher Division field hidden for other departments');
        }
    }
    
    // Also call existing department change logic if it exists
    if (typeof handleDepartmentChangeForTeacher === 'function') {
        handleDepartmentChangeForTeacher();
    }
}

// Load teachers for HOD dropdown
async function loadTeachersForHOD() {
    try {
        const teachers = await getTeachersFromFirebase();
        const hodSelect = document.getElementById('deptHOD');
        
        if (hodSelect && teachers.length > 0) {
            // Clear existing options except first one
            hodSelect.innerHTML = '<option value="">Select HOD (Optional)</option>';
            
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id || teacher.teacherId;
                option.textContent = `${teacher.name} (${teacher.department || 'N/A'})`;
                hodSelect.appendChild(option);
            });
            
            console.log(`✅ Loaded ${teachers.length} teachers for HOD selection`);
        }
    } catch (error) {
        console.error('❌ Error loading teachers for HOD:', error);
    }
}

// Close add department modal
function closeAddDepartmentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
        console.log('🔒 Add Department modal closed');
    }
}

// Handle add department form submission
async function handleAddDepartment(event) {
    event.preventDefault();
    console.log('🔧 Handling Add Department form submission...');
    
    try {
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
        submitBtn.disabled = true;
        
        const formData = new FormData(event.target);
        const selectedDeptName = formData.get('deptName');
        
        // Find the selected department from DEPARTMENTS array
        const selectedDept = DEPARTMENTS.find(dept => dept.name === selectedDeptName);
        
        if (!selectedDept) {
            showNotification('Please select a valid department!', 'error');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Department';
            submitBtn.disabled = false;
            return;
        }
        
        const division = formData.get('deptDivision');
        
        // Validate division for Computer Technology
        if (selectedDept.name === 'Computer Technology' && !division) {
            showNotification('Division is required for Computer Technology department!', 'error');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Department';
            submitBtn.disabled = false;
            return;
        }
        
        const deptData = {
            code: selectedDept.code,
            name: selectedDept.name,
            division: division || null,
            createdAt: Date.now(),
            status: 'active'
        };
        
        // Validate department uniqueness (check both code and name+division combination)
        const existingDepts = await getDepartmentsFromFirebase();
        
        // For Computer Technology, check code + division combination
        let deptExists = false;
        if (deptData.division) {
            deptExists = existingDepts.some(dept => 
                dept.code && dept.code.toUpperCase() === deptData.code.toUpperCase() &&
                dept.division === deptData.division
            );
            if (deptExists) {
                showNotification(`Department "${deptData.name} - Division ${deptData.division}" already exists!`, 'error');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Department';
                submitBtn.disabled = false;
                return;
            }
        } else {
            // For other departments, check only code
            deptExists = existingDepts.some(dept => 
                dept.code && dept.code.toUpperCase() === deptData.code.toUpperCase() &&
                !dept.division // Only match departments without division
            );
            if (deptExists) {
                showNotification(`Department "${deptData.name}" already exists!`, 'error');
                submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Department';
                submitBtn.disabled = false;
                return;
            }
        }
        
        // Add to DEPARTMENTS array if not exists
        const existsInArray = DEPARTMENTS.some(dept => dept.code === deptData.code);
        if (!existsInArray) {
            DEPARTMENTS.push({
                code: deptData.code,
                name: deptData.name
            });
        }
        
        // Save to Firebase departmentData collection
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            // Create unique key for department (code + division if exists)
            const deptKey = deptData.division ? `${deptData.code}_${deptData.division}` : deptData.code;
            const deptRef = window.firebaseDB.db.ref(`departmentData/${deptKey}`);
            await deptRef.set(deptData);
            console.log(`✅ Department saved to Firebase departmentData with key: ${deptKey}`);
        }
        
        // Save to localStorage as backup
        const departments = JSON.parse(localStorage.getItem('departments') || '[]');
        departments.push(deptData);
        localStorage.setItem('departments', JSON.stringify(departments));
        
        showNotification(`Department "${deptData.name}" added successfully!`, 'success');
        closeAddDepartmentModal();
        
        // Refresh departments content if we're on that section
        if (window.currentAdminSection === 'departments') {
            await loadAdminContent('departments');
        }
        
        console.log('✅ Department added successfully:', deptData);
        
    } catch (error) {
        console.error('❌ Error adding department:', error);
        showNotification('Error adding department. Please try again.', 'error');
        
        // Reset button state
        const submitBtn = event.target.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Add Department';
            submitBtn.disabled = false;
        }
    }
}

// Delete department function
async function deleteDepartment(deptName, deptCode, deptDivision) {
    try {
        console.log('🗑️ Attempting to delete department:', { deptName, deptCode, deptDivision });
        
        // Show confirmation dialog
        const divisionText = deptDivision ? ` - Division ${deptDivision}` : '';
        const confirmMessage = `Are you sure you want to delete "${deptName}${divisionText}"?\n\nThis action cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            console.log('❌ Department deletion cancelled by user');
            return;
        }
        
        // Check if department has associated teachers or students
        const teachers = await getTeachersFromFirebase();
        const students = await getStudentsFromFirebase();
        
        const deptTeachers = teachers.filter(t => t.department === deptName);
        const deptStudents = students.filter(s => s.department === deptName);
        
        if (deptTeachers.length > 0 || deptStudents.length > 0) {
            const warningMessage = `Cannot delete "${deptName}${divisionText}"!\n\nThis department has:\n- ${deptTeachers.length} teachers\n- ${deptStudents.length} students\n\nPlease reassign or remove them first.`;
            alert(warningMessage);
            showNotification('Cannot delete department with existing teachers or students!', 'error');
            return;
        }
        
        // Delete from Firebase departmentData collection
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            // Use the same key format as when saving (code + division)
            const deptKey = deptDivision ? `${deptCode}_${deptDivision}` : deptCode;
            const deptRef = window.firebaseDB.db.ref(`departmentData/${deptKey}`);
            await deptRef.remove();
            console.log(`✅ Department deleted from Firebase departmentData with key: ${deptKey}`);
            
            // Also clean up localStorage to ensure consistency
            const localDepts = JSON.parse(localStorage.getItem('departments') || '[]');
            const updatedDepts = localDepts.filter(dept => 
                !(dept.name === deptName && dept.code === deptCode && (dept.division || '') === deptDivision)
            );
            localStorage.setItem('departments', JSON.stringify(updatedDepts));
            console.log('🧹 Department also removed from localStorage for consistency');
        } else {
            // Delete from localStorage as fallback
            const localDepts = JSON.parse(localStorage.getItem('departments') || '[]');
            const updatedDepts = localDepts.filter(dept => 
                !(dept.name === deptName && dept.code === deptCode && (dept.division || '') === deptDivision)
            );
            localStorage.setItem('departments', JSON.stringify(updatedDepts));
            console.log('✅ Department deleted from localStorage');
        }
        
        // Show success message
        showNotification(`Department "${deptName}${divisionText}" deleted successfully!`, 'success');
        
        // Refresh departments display
        await refreshDepartmentsDisplay();
        
        console.log('✅ Department deleted successfully:', { deptName, deptCode, deptDivision });
        
    } catch (error) {
        console.error('❌ Error deleting department:', error);
        showNotification('Error deleting department. Please try again.', 'error');
    }
}

// Refresh departments display after adding new department
async function refreshDepartmentsDisplay() {
    try {
        console.log('🔄 Refreshing departments display...');
        if (window.currentAdminSection === 'departments') {
            await loadAdminContent('departments');
            console.log('✅ Departments display refreshed');
        }
    } catch (error) {
        console.error('❌ Error refreshing departments display:', error);
    }
}

// Get departments from Firebase with localStorage fallback
async function getDepartmentsFromFirebase() {
    try {
        // Try Firebase first (unless we know permissions are denied)
        if (window.firebaseDB && window.firebaseDB.isConnected && !window.firebasePermissionDenied) {
            try {
                const deptRef = window.firebaseDB.db.ref('departmentData');
                const snapshot = await deptRef.once('value');
                const deptData = snapshot.val();
                
                if (deptData) {
                    const departments = Object.keys(deptData).map(key => ({
                        id: key,
                        ...deptData[key]
                    }));
                    console.log(`✅ Loaded ${departments.length} departments from Firebase`);
                    // Save to localStorage as backup
                    localStorage.setItem('departments', JSON.stringify(departments));
                    return departments;
                }
            } catch (error) {
                console.log('⚠️ Firebase permission error (GitHub Pages deployment), using localStorage fallback:', error.message);
                if (error.message.includes('permission_denied')) {
                    window.firebasePermissionDenied = true;
                    console.log('🔒 Firebase permissions denied - running in offline mode');
                }
            }
        }
        
        // Fallback to localStorage
        const departments = JSON.parse(localStorage.getItem('departments') || '[]');
        console.log(`📦 Loaded ${departments.length} departments from localStorage`);
        return departments;
        
    } catch (error) {
        console.error('❌ Error loading departments:', error);
        return [];
    }
}

function importTeachers() {
    showNotification('Import teachers - Implementation needed', 'info');
}

// Generate sample import templates
function generateSampleTemplates() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3><i class="fas fa-download"></i> Download Sample Import Templates</h3>
                <button class="modal-close" onclick="closeSampleTemplateModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-content">
                <div class="template-options">
                    <div class="template-card">
                        <div class="template-icon">
                            <i class="fas fa-file-csv"></i>
                        </div>
                        <h4>CSV Template</h4>
                        <p>Excel/Google Sheets compatible format</p>
                        <button class="btn btn-primary" onclick="downloadCSVTemplate()">
                            <i class="fas fa-download"></i>
                            Download CSV
                        </button>
                    </div>
                    <div class="template-card">
                        <div class="template-icon">
                            <i class="fas fa-file-code"></i>
                        </div>
                        <h4>JSON Template</h4>
                        <p>Structured data format</p>
                        <button class="btn btn-success" onclick="downloadJSONTemplate()">
                            <i class="fas fa-download"></i>
                            Download JSON
                        </button>
                    </div>
                </div>
                <div class="template-info">
                    <h4><i class="fas fa-info-circle"></i> Required Fields</h4>
                    <ul>
                        <li><strong>enrollmentNo</strong> - Unique student enrollment number</li>
                        <li><strong>name</strong> - Full name of the student</li>
                        <li><strong>department</strong> - Academic department</li>
                        <li><strong>semester</strong> - Current semester (1-6)</li>
                        <li><strong>scheme</strong> - Academic scheme (I/K/A)</li>
                        <li><strong>academicYear</strong> - Academic year (e.g., 2023-24)</li>
                        <li><strong>division</strong> - Division (A/B/C) - <span style="color: #e53e3e;">Required for Computer Technology</span>, Optional for others</li>
                    </ul>
                    <div class="note">
                        <i class="fas fa-lightbulb"></i>
                        <strong>Note:</strong> Class will be auto-generated from Department + Semester + Scheme
                    </div>
                    <div class="note" style="background: #fff5f5; border-color: #e53e3e;">
                        <i class="fas fa-exclamation-triangle" style="color: #e53e3e;"></i>
                        <strong>Important:</strong> Division is mandatory for Computer Technology department students
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeSampleTemplateModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function downloadCSVTemplate() {
    const csvContent = `enrollmentNo,name,department,semester,scheme,academicYear,division
2023001,John Doe,Computer Technology,1,I,2023-24,A
2023002,Jane Smith,Computer Technology,2,K,2023-24,B
2023003,Bob Johnson,Computer Technology,3,A,2023-24,C
2023004,Alice Brown,Mechanical Engineering,1,I,2023-24,
2023005,Charlie Wilson,Information Technology,2,K,2023-24,
2023006,Diana Davis,Electronics & Telecom,3,A,2023-24,
2023007,Eve Miller,Civil Engineering,1,I,2023-24,
2023008,Frank Wilson,Electrical Engineering,2,K,2023-24,
2023009,Grace Lee,Artificial Intelligence,3,A,2023-24,`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV template downloaded successfully!', 'success');
    closeSampleTemplateModal();
}

function downloadJSONTemplate() {
    const jsonData = [
        {
            "enrollmentNo": "2023001",
            "name": "John Doe",
            "department": "Computer Technology",
            "semester": "1",
            "scheme": "I",
            "academicYear": "2023-24",
            "division": "A"
        },
        {
            "enrollmentNo": "2023002",
            "name": "Jane Smith",
            "department": "Computer Technology",
            "semester": "2",
            "scheme": "K",
            "academicYear": "2023-24",
            "division": "B"
        },
        {
            "enrollmentNo": "2023003",
            "name": "Bob Johnson",
            "department": "Mechanical Engineering",
            "semester": "3",
            "scheme": "A",
            "academicYear": "2023-24",
            "division": ""
        },
        {
            "enrollmentNo": "2023004",
            "name": "Alice Brown",
            "department": "Information Technology",
            "semester": "1",
            "scheme": "I",
            "academicYear": "2023-24",
            "division": ""
        },
        {
            "enrollmentNo": "2023005",
            "name": "Charlie Wilson",
            "department": "Electronics & Telecom",
            "semester": "2",
            "scheme": "K",
            "academicYear": "2023-24",
            "division": ""
        }
    ];

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_import_template.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('JSON template downloaded successfully!', 'success');
    closeSampleTemplateModal();
}

async function importStudents() {
    try {
        // Show options: Import or Download Template
        const choice = confirm('Choose an option:\n\nOK = Import Students File\nCancel = Download Sample Template');
        
        if (!choice) {
            // User chose to download template
            generateSampleTemplates();
            return;
        }
        
        // Create file input for CSV/JSON import
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.json';
        input.style.display = 'none';
        
        input.onchange = async function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                showNotification('Processing import file...', 'info');
                
                const text = await file.text();
                let studentsData = [];
                
                if (file.name.endsWith('.json')) {
                    // Parse JSON file
                    studentsData = JSON.parse(text);
                } else if (file.name.endsWith('.csv')) {
                    // Parse CSV file
                    const lines = text.split('\n');
                    if (lines.length < 2) {
                        showNotification('CSV file must have at least a header row and one data row', 'error');
                        return;
                    }
                    
                    const headers = lines[0].split(',').map(h => h.trim());
                    console.log('📊 CSV Headers:', headers);
                    
                    for (let i = 1; i < lines.length; i++) {
                        if (lines[i].trim()) {
                            const values = lines[i].split(',').map(v => v.trim());
                            const student = {};
                            
                            headers.forEach((header, index) => {
                                const value = values[index] ? values[index].trim() : '';
                                
                                // Map common header variations to standard field names
                                const fieldMap = {
                                    'enrollment': 'enrollmentNo',
                                    'enrollmentno': 'enrollmentNo',
                                    'enrollment_no': 'enrollmentNo',
                                    'enrollment_number': 'enrollmentNo',
                                    'student_id': 'enrollmentNo',
                                    'id': 'enrollmentNo',
                                    'fullname': 'name',
                                    'full_name': 'name',
                                    'student_name': 'name',
                                    'dept': 'department',
                                    'sem': 'semester',
                                    'academic_year': 'academicYear',
                                    'academicyear': 'academicYear',
                                    'year': 'academicYear',
                                    'div': 'division'
                                };
                                
                                // Use exact header name if no mapping found, but convert camelCase properly
                                let fieldName = fieldMap[header.toLowerCase()];
                                if (!fieldName) {
                                    fieldName = header.toLowerCase();
                                    // Handle camelCase headers like 'academicYear'
                                    if (header === 'academicYear') {
                                        fieldName = 'academicYear';
                                    }
                                }
                                
                                student[fieldName] = value;
                                
                                // Debug: Log field mapping for first row
                                if (i === 1) {
                                    console.log(`🔍 Field mapping: "${header}" -> "${fieldName}" = "${value}"`);
                                }
                            });
                            
                            // Generate class if not provided
                            if (student.department && student.semester && student.scheme && !student.class) {
                                const deptAbbr = {
                                    'Computer Technology': 'CM',
                                    'Mechanical Engineering': 'ME',
                                    'Electronics & Telecom': 'ET',
                                    'Civil Engineering': 'CE',
                                    'Information Technology': 'IT',
                                    'Electrical Engineering': 'EE',
                                    'Artificial Intelligence': 'AI'
                                };
                                const abbr = deptAbbr[student.department] || 'XX';
                                student.class = `${abbr}${student.semester}${student.scheme}`;
                            }
                            
                            // Set defaults
                            student.status = student.status || 'Active';
                            student.isActive = true;
                            student.createdAt = new Date().toISOString();
                            
                            // Debug: Log first few students to check field mapping
                            if (i <= 3) {
                                console.log(`🔍 Student ${i} parsed:`, student);
                            }
                            
                            studentsData.push(student);
                        }
                    }
                }
                
                if (studentsData.length === 0) {
                    showNotification('No valid student data found in file', 'error');
                    return;
                }
                
                console.log('📊 Parsed students data:', studentsData);
                
                // Validate required fields
                const invalidStudents = studentsData.filter(student => 
                    !student.enrollmentNo || !student.name || !student.department || 
                    !student.semester || !student.scheme || !student.academicYear
                );
                
                if (invalidStudents.length > 0) {
                    // Debug: Check what fields are missing for first invalid student
                    const firstInvalid = invalidStudents[0];
                    console.log('🔍 First invalid student fields check:');
                    console.log('   enrollmentNo:', firstInvalid.enrollmentNo, '(exists:', !!firstInvalid.enrollmentNo, ')');
                    console.log('   name:', firstInvalid.name, '(exists:', !!firstInvalid.name, ')');
                    console.log('   department:', firstInvalid.department, '(exists:', !!firstInvalid.department, ')');
                    console.log('   semester:', firstInvalid.semester, '(exists:', !!firstInvalid.semester, ')');
                    console.log('   scheme:', firstInvalid.scheme, '(exists:', !!firstInvalid.scheme, ')');
                    console.log('   academicYear:', firstInvalid.academicYear, '(exists:', !!firstInvalid.academicYear, ')');
                    console.log('   All fields:', Object.keys(firstInvalid));
                    
                    showNotification(`${invalidStudents.length} students have missing required fields (enrollmentNo, name, department, semester, scheme, academicYear)`, 'error');
                    console.log('❌ Invalid students:', invalidStudents);
                    return;
                }
                
                // Validate division requirement for Computer Technology
                const computerStudentsWithoutDivision = studentsData.filter(student => 
                    student.department === 'Computer Technology' && !student.division
                );
                
                if (computerStudentsWithoutDivision.length > 0) {
                    showNotification(`${computerStudentsWithoutDivision.length} Computer Technology students are missing required division field`, 'error');
                    console.log('❌ Computer Technology students without division:', computerStudentsWithoutDivision);
                    return;
                }
                
                // Check for duplicates within the import file
                const enrollmentNumbers = studentsData.map(s => s.enrollmentNo);
                const duplicateEnrollments = enrollmentNumbers.filter((item, index) => enrollmentNumbers.indexOf(item) !== index);
                
                if (duplicateEnrollments.length > 0) {
                    showNotification(`Duplicate enrollment numbers found in file: ${duplicateEnrollments.join(', ')}`, 'error');
                    return;
                }
                
                // Show confirmation dialog
                const confirmed = confirm(`Import ${studentsData.length} students?\n\nThis will add all students to the database.`);
                if (!confirmed) return;
                
                showNotification('Importing students...', 'info');
                
                // Get existing students to check for duplicates
                let existingStudents = [];
                try {
                    existingStudents = await getStudentsFromFirebase();
                } catch (error) {
                    console.log('⚠️ Error loading existing students, using localStorage fallback');
                    existingStudents = JSON.parse(localStorage.getItem('students') || '[]');
                }
                
                // Filter out students with existing enrollment numbers
                const existingEnrollments = existingStudents.map(s => s.enrollmentNo);
                const newStudents = studentsData.filter(student => !existingEnrollments.includes(student.enrollmentNo));
                const skippedStudents = studentsData.filter(student => existingEnrollments.includes(student.enrollmentNo));
                
                if (skippedStudents.length > 0) {
                    console.log(`⚠️ Skipping ${skippedStudents.length} students with existing enrollment numbers:`, skippedStudents.map(s => s.enrollmentNo));
                }
                
                if (newStudents.length === 0) {
                    showNotification('All students already exist in the database', 'warning');
                    return;
                }
                
                // Save new students to Firebase
                const allStudents = [...existingStudents, ...newStudents];
                await saveStudentsToFirebase(allStudents);
                
                // Show success message
                let message = `Successfully imported ${newStudents.length} students!`;
                if (skippedStudents.length > 0) {
                    message += `\n${skippedStudents.length} students were skipped (already exist).`;
                }
                
                showNotification(message, 'success');
                
                // Refresh student management view if currently active
                if (window.currentAdminSection === 'student-management') {
                    loadAdminContent('student-management');
                }
                
                // Log import summary
                console.log('📊 Import Summary:');
                console.log(`✅ Imported: ${newStudents.length} students`);
                console.log(`⚠️ Skipped: ${skippedStudents.length} students`);
                console.log(`📋 Total in database: ${allStudents.length} students`);
                
            } catch (error) {
                console.error('❌ Import error:', error);
                showNotification('Import failed: ' + error.message, 'error');
            }
        };
        
        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
        
    } catch (error) {
        console.error('❌ Import setup error:', error);
        showNotification('Import setup failed: ' + error.message, 'error');
    }
}

function viewMyStudents() {
    showNotification('My Students view - Firebase implementation needed', 'info');
}

function enterMarks() {
    showNotification('Enter Marks - Firebase implementation needed', 'info');
}

function viewReports() {
    showNotification('View Reports - Firebase implementation needed', 'info');
}

// Additional placeholder functions for new features
function assignTeacher(id) {
    showNotification(`Assign teacher: ${id}`, 'info');
}

function exportTeachers() {
    showNotification('Export teachers data - Implementation needed', 'info');
}

function exportStudents() {
    showNotification('Export students data - Implementation needed', 'info');
}

function generateReports() {
    showNotification('Generate reports - Implementation needed', 'info');
}

function viewStudentMarks(id) {
    showNotification(`View marks for student: ${id}`, 'info');
}

function manageDepartment(dept) {
    showNotification(`Manage department: ${dept}`, 'info');
}

async function manageClasses(dept) {
    try {
        console.log(`🏫 Managing classes for department: ${dept}`);
        
        // Get department data from Google Sheets
        const departmentData = await getDepartmentDataFromGoogleSheets();
        const classes = departmentData[dept]?.classes || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-users"></i> Manage Classes - ${dept}</h3>
                    <button class="modal-close" onclick="closeDepartmentModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="add-class-section">
                        <h4><i class="fas fa-plus"></i> Add New Class</h4>
                        <div class="form-row">
                            <select id="semesterSelect" style="margin-right: 10px;">
                                <option value="">Select Semester</option>
                                <option value="1">1st Semester</option>
                                <option value="2">2nd Semester</option>
                                <option value="3">3rd Semester</option>
                                <option value="4">4th Semester</option>
                                <option value="5">5th Semester</option>
                                <option value="6">6th Semester</option>
                            </select>
                            <select id="schemeSelect" style="margin-right: 10px;">
                                <option value="">Select Scheme</option>
                                <option value="I">I Scheme</option>
                                <option value="K">K Scheme</option>
                                <option value="A">A Scheme</option>
                            </select>
                            <button class="btn btn-primary" onclick="addClassToDepartment('${dept}')">
                                <i class="fas fa-plus"></i> Add Class
                            </button>
                        </div>
                    </div>
                    
                    <div class="classes-list">
                        <h4><i class="fas fa-list"></i> Current Classes</h4>
                        <div class="classes-grid" id="classesGrid">
                            ${classes.length === 0 ? 
                                '<p class="no-data">No classes found for this department</p>' :
                                classes.map(cls => `
                                    <div class="class-item">
                                        <span class="class-name">${cls}</span>
                                        <button class="btn btn-sm btn-danger" onclick="removeClassFromDepartment('${dept}', '${cls}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('❌ Error managing classes:', error);
        showNotification('Error loading classes data', 'error');
    }
}

async function manageSubjects(dept) {
    try {
        console.log(`📚 Managing subjects for department: ${dept}`);
        
        // Get department data from Google Sheets
        const departmentData = await getDepartmentDataFromGoogleSheets();
        const subjects = departmentData[dept]?.subjects || [];
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-book"></i> Manage Subjects - ${dept}</h3>
                    <button class="modal-close" onclick="closeDepartmentModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="add-subject-section">
                        <h4><i class="fas fa-plus"></i> Add New Subject</h4>
                        <div class="form-row">
                            <input type="text" id="subjectName" placeholder="Subject Name (e.g., Mathematics, Physics)" style="flex: 1; margin-right: 10px;">
                            <button class="btn btn-primary" onclick="addSubjectToDepartment('${dept}')">
                                <i class="fas fa-plus"></i> Add Subject
                            </button>
                        </div>
                    </div>
                    
                    <div class="subjects-list">
                        <h4><i class="fas fa-list"></i> Current Subjects</h4>
                        <div class="subjects-grid" id="subjectsGrid">
                            ${subjects.length === 0 ? 
                                '<p class="no-data">No subjects found for this department</p>' :
                                subjects.map(subject => `
                                    <div class="subject-item">
                                        <span class="subject-name">${subject}</span>
                                        <button class="btn btn-sm btn-danger" onclick="removeSubjectFromDepartment('${dept}', '${subject}')">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('❌ Error managing subjects:', error);
        showNotification('Error loading subjects data', 'error');
    }
}

async function viewDepartmentReports(dept) {
    try {
        console.log(`📊 Viewing reports for department: ${dept}`);
        
        // Get students and teachers data
        const students = await getStudentsFromFirebase();
        const teachers = await getTeachersFromFirebase();
        
        // Filter data for this department
        const deptStudents = students.filter(s => s.department === dept);
        const deptTeachers = teachers.filter(t => t.department === dept);
        
        // Calculate statistics
        const totalStudents = deptStudents.length;
        const totalTeachers = deptTeachers.length;
        const classes = [...new Set(deptStudents.map(s => s.class).filter(c => c))];
        const semesters = [...new Set(deptStudents.map(s => s.semester).filter(s => s))];
        
        // Group students by class
        const studentsByClass = {};
        deptStudents.forEach(student => {
            const className = student.class || 'Unassigned';
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            studentsByClass[className].push(student);
        });
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 800px;">
                <div class="modal-header">
                    <h3><i class="fas fa-chart-bar"></i> Department Reports - ${dept}</h3>
                    <button class="modal-close" onclick="closeDepartmentModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-content">
                    <div class="report-stats">
                        <div class="stat-card">
                            <div class="stat-icon blue">
                                <i class="fas fa-user-graduate"></i>
                            </div>
                            <div class="stat-details">
                                <span class="stat-number">${totalStudents}</span>
                                <span class="stat-label">Total Students</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon green">
                                <i class="fas fa-chalkboard-teacher"></i>
                            </div>
                            <div class="stat-details">
                                <span class="stat-number">${totalTeachers}</span>
                                <span class="stat-label">Total Teachers</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon purple">
                                <i class="fas fa-users"></i>
                            </div>
                            <div class="stat-details">
                                <span class="stat-number">${classes.length}</span>
                                <span class="stat-label">Active Classes</span>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon orange">
                                <i class="fas fa-calendar"></i>
                            </div>
                            <div class="stat-details">
                                <span class="stat-number">${semesters.length}</span>
                                <span class="stat-label">Semesters</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="class-breakdown">
                        <h4><i class="fas fa-chart-pie"></i> Class-wise Student Distribution</h4>
                        <div class="class-stats">
                            ${Object.keys(studentsByClass).map(className => `
                                <div class="class-stat-item">
                                    <span class="class-name">${className}</span>
                                    <span class="student-count">${studentsByClass[className].length} students</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="teachers-list">
                        <h4><i class="fas fa-users"></i> Department Faculty</h4>
                        <div class="teachers-summary">
                            ${deptTeachers.map(teacher => `
                                <div class="teacher-summary-item">
                                    <span class="teacher-name">${teacher.name}</span>
                                    <span class="teacher-role">${teacher.role}</span>
                                    <span class="teacher-class">${teacher.class || 'Not Assigned'}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('❌ Error viewing department reports:', error);
        showNotification('Error loading department reports', 'error');
    }
}

function manageDepartmentStructure() {
    showNotification('Manage department structure - Implementation needed', 'info');
}

function assignHODs() {
    showNotification('Assign HODs - Implementation needed', 'info');
}

// Helper functions for department management
function closeDepartmentModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

async function addClassToDepartment(dept) {
    const semester = document.getElementById('semesterSelect').value;
    const scheme = document.getElementById('schemeSelect').value;
    
    if (!semester || !scheme) {
        showNotification('Please select both semester and scheme', 'error');
        return;
    }
    
    try {
        // Generate class name
        const deptAbbr = {
            'Computer Technology': 'CM',
            'Mechanical Engineering': 'ME',
            'Electronics & Telecom': 'ET',
            'Civil Engineering': 'CE',
            'Information Technology': 'IT',
            'Electrical Engineering': 'EE',
            'Artificial Intelligence': 'AI'
        };
        
        const abbr = deptAbbr[dept] || 'XX';
        const className = `${abbr}${semester}${scheme}`;
        
        // Get current department data
        const departmentData = await getDepartmentDataFromGoogleSheets();
        
        // Create department only when admin adds something
        if (!departmentData[dept]) {
            departmentData[dept] = { classes: [], subjects: [] };
        }
        
        // Ensure classes array exists
        if (!departmentData[dept].classes) {
            departmentData[dept].classes = [];
        }
        
        if (!departmentData[dept].classes.includes(className)) {
            departmentData[dept].classes.push(className);
            
            // Save only this department to Firebase
            await saveDepartmentDataToGoogleSheets(departmentData);
            
            showNotification(`Class ${className} added successfully to Firebase!`, 'success');
            
            // Refresh the modal
            closeDepartmentModal();
            setTimeout(() => manageClasses(dept), 100);
        } else {
            showNotification(`Class ${className} already exists!`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error adding class:', error);
        showNotification('Error adding class', 'error');
    }
}

async function removeClassFromDepartment(dept, className) {
    if (!confirm(`Are you sure you want to remove class ${className}?`)) {
        return;
    }
    
    try {
        // Get current department data
        const departmentData = await getDepartmentDataFromGoogleSheets();
        
        if (departmentData[dept] && departmentData[dept].classes && Array.isArray(departmentData[dept].classes)) {
            departmentData[dept].classes = departmentData[dept].classes.filter(cls => cls !== className);
            
            // Save to Google Sheets
            await saveDepartmentDataToGoogleSheets(departmentData);
            
            showNotification(`Class ${className} removed successfully!`, 'success');
            
            // Refresh the modal
            closeDepartmentModal();
            setTimeout(() => manageClasses(dept), 100);
        }
        
    } catch (error) {
        console.error('❌ Error removing class:', error);
        showNotification('Error removing class', 'error');
    }
}

async function addSubjectToDepartment(dept) {
    const subjectName = document.getElementById('subjectName').value.trim();
    
    if (!subjectName) {
        showNotification('Please enter a subject name', 'error');
        return;
    }
    
    try {
        // Get current department data
        const departmentData = await getDepartmentDataFromGoogleSheets();
        
        // Create department only when admin adds something
        if (!departmentData[dept]) {
            departmentData[dept] = { classes: [], subjects: [] };
        }
        
        // Ensure subjects array exists
        if (!departmentData[dept].subjects) {
            departmentData[dept].subjects = [];
        }
        
        if (!departmentData[dept].subjects.includes(subjectName)) {
            departmentData[dept].subjects.push(subjectName);
            
            // Save only this department to Firebase
            await saveDepartmentDataToGoogleSheets(departmentData);
            
            showNotification(`Subject "${subjectName}" added successfully to Firebase!`, 'success');
            
            // Refresh the modal
            closeDepartmentModal();
            setTimeout(() => manageSubjects(dept), 100);
        } else {
            showNotification(`Subject "${subjectName}" already exists!`, 'warning');
        }
        
    } catch (error) {
        console.error('❌ Error adding subject:', error);
        showNotification('Error adding subject', 'error');
    }
}

async function removeSubjectFromDepartment(dept, subjectName) {
    if (!confirm(`Are you sure you want to remove subject "${subjectName}"?`)) {
        return;
    }
    
    try {
        // Get current department data
        const departmentData = await getDepartmentDataFromGoogleSheets();
        
        if (departmentData[dept] && departmentData[dept].subjects && Array.isArray(departmentData[dept].subjects)) {
            departmentData[dept].subjects = departmentData[dept].subjects.filter(subject => subject !== subjectName);
            
            // Save to Google Sheets
            await saveDepartmentDataToGoogleSheets(departmentData);
            
            showNotification(`Subject "${subjectName}" removed successfully!`, 'success');
            
            // Refresh the modal
            closeDepartmentModal();
            setTimeout(() => manageSubjects(dept), 100);
        }
        
    } catch (error) {
        console.error('❌ Error removing subject:', error);
        showNotification('Error removing subject', 'error');
    }
}

function generateNewReport() {
    showNotification('Generate new report - Implementation needed', 'info');
}

function exportAllReports() {
    showNotification('Export all reports - Implementation needed', 'info');
}

function viewProformaAReports() {
    showNotification('View Proforma-A reports - Implementation needed', 'info');
}

function viewProformaBReports() {
    showNotification('View Proforma-B reports - Implementation needed', 'info');
}

function createProformaA() {
    showNotification('Create Proforma-A - Implementation needed', 'info');
}

function createProformaB() {
    showNotification('Create Proforma-B - Implementation needed', 'info');
}

function refreshProgress() {
    showNotification('Refreshing progress data...', 'info');
    setTimeout(() => {
        loadAdminContent('marks-progress');
        showNotification('Progress data refreshed!', 'success');
    }, 1000);
}

function sendReminders() {
    showNotification('Sending reminders to teachers...', 'info');
}

function viewDepartmentDetails(dept) {
    showNotification(`View details for: ${dept}`, 'info');
}

function sendDepartmentReminder(dept) {
    showNotification(`Reminder sent to: ${dept}`, 'success');
}

// Settings functions (simplified)
function clearCache() {
    localStorage.clear();
    showNotification('Cache cleared successfully!', 'success');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Create sample data for GitHub Pages deployment
function createSampleDataForGitHubPages() {
    console.log('🎯 Creating sample data for GitHub Pages deployment...');
    
    // Create sample teachers
    const sampleTeachers = [
        {
            id: 'ME001',
            name: 'Prof. Rajesh Kumar',
            email: 'rajesh.kumar@bvit.edu',
            username: 'rajesh.kumar@bvit.edu',
            password: 'teacher123',
            phone: '9876543210',
            department: 'Mechanical Engineering',
            role: 'Subject Teacher',
            class: 'ME2K',
            subjects: ['Thermodynamics', 'Mechanics'],
            assignedSubjects: ['Thermodynamics', 'Mechanics'],
            isActive: true,
            createdAt: new Date().toISOString()
        },
        {
            id: 'CM001',
            name: 'Prof. Priya Sharma',
            email: 'priya.sharma@bvit.edu',
            username: 'priya.sharma@bvit.edu',
            password: 'teacher123',
            phone: '9876543211',
            department: 'Computer Technology',
            role: 'Class Teacher',
            class: 'CM1I',
            subjects: ['Programming', 'Database', 'Networks'],
            assignedSubjects: ['Programming', 'Database'],
            isActive: true,
            createdAt: new Date().toISOString()
        }
    ];
    
    // Create sample departments
    const sampleDepartments = [
        {
            code: 'ME',
            name: 'Mechanical Engineering',
            division: null,
            status: 'active',
            createdAt: Date.now()
        },
        {
            code: 'CM',
            name: 'Computer Technology',
            division: 'A',
            status: 'active',
            createdAt: Date.now()
        }
    ];
    
    // Save to localStorage
    localStorage.setItem('teachers', JSON.stringify(sampleTeachers));
    localStorage.setItem('departments', JSON.stringify(sampleDepartments));
    localStorage.setItem('students', JSON.stringify([])); // Empty students array
    
    console.log('✅ Sample data created for GitHub Pages');
    showNotification('Sample data created successfully!', 'success');
    
    // Refresh the page to load new data
    setTimeout(() => {
        location.reload();
    }, 1500);
}

function exportAllData() {
    showNotification('Exporting all data...', 'info');
}

function importData() {
    showNotification('Import data - Implementation needed', 'info');
}

function resetSystem() {
    if (confirm('Are you sure you want to reset the entire system? This action cannot be undone.')) {
        showNotification('System reset initiated...', 'warning');
    }
}

// ===================================
// INITIALIZATION
// ===================================

// Initialize the application when DOM is loaded
// Create sample teacher data for testing
// Test teacher login function - call from console
async function testTeacherLogin() {
    console.log('🧪 Testing teacher login system...');
    
    // Check Firebase first
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            console.log('🔥 Checking Firebase teachers...');
            const firebaseTeachers = await window.firebaseDB.getTeachers();
            console.log('✅ Firebase teachers found:', firebaseTeachers.length);
            firebaseTeachers.forEach((t, index) => {
                console.log(`   Firebase Teacher ${index + 1}:`, {
                    id: t.id || 'NO ID',
                    username: t.username || 'NO USERNAME', 
                    name: t.name || 'NO NAME',
                    email: t.email || 'NO EMAIL',
                    password: t.password ? '***' : 'NO PASSWORD'
                });
            });
        } else {
            console.log('⚠️ Firebase not connected');
        }
    } catch (error) {
        console.log('❌ Firebase error:', error.message);
    }
    
    // Check localStorage
    const teachers = localStorage.getItem('teachers');
    if (teachers) {
        const teacherData = JSON.parse(teachers);
        console.log('✅ Teachers found in localStorage:', teacherData.length);
        teacherData.forEach(t => {
            console.log(`   - ID: ${t.id}, Username: ${t.username}, Name: ${t.name}, Password: ${t.password}`);
        });
    } else {
        console.log('❌ No teachers in localStorage, creating demo data...');
        createSampleTeacherData();
    }
    
    console.log('💡 Try logging in with:');
    console.log('   Username: ME001, Password: teacher123');
    console.log('   Username: CM001, Password: teacher123');
    console.log('   Username: teacher, Password: [your Firebase password]');
}

// Quick Firebase teacher check
async function checkFirebaseTeachers() {
    try {
        if (window.firebaseDB && window.firebaseDB.isConnected) {
            const teachers = await window.firebaseDB.getTeachers();
            console.log('🔥 Firebase Teachers:', teachers);
            return teachers;
        } else {
            console.log('⚠️ Firebase not connected');
            return [];
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
        return [];
    }
}

// Test CSS loading
function testCSS() {
    console.log('🎨 Testing CSS...');
    const testCard = document.querySelector('.simple-card');
    if (testCard) {
        const styles = window.getComputedStyle(testCard);
        console.log('Card background:', styles.background);
        console.log('Card border-radius:', styles.borderRadius);
        console.log('✅ CSS is loading');
    } else {
        console.log('❌ No .simple-card found');
    }
}

// Force refresh dashboard
function forceRefreshDashboard() {
    console.log('🔄 Force refreshing dashboard...');
    if (window.currentUser && window.currentUserType === 'teacher') {
        showTeacherDashboard();
        console.log('✅ Dashboard refreshed');
    } else {
        console.log('❌ No teacher user found');
    }
}

// Debug dashboard display
function debugDashboard() {
    console.log('🔍 Dashboard Debug Info:');
    console.log('Current User:', window.currentUser);
    console.log('Current User Type:', window.currentUserType);
    
    const loginPage = document.getElementById('loginPage');
    const adminPage = document.getElementById('adminPage');
    const teacherPage = document.getElementById('teacherPage');
    
    console.log('Page Elements:');
    console.log('  Login Page:', loginPage ? 'Found' : 'NOT FOUND');
    console.log('  Admin Page:', adminPage ? 'Found' : 'NOT FOUND');
    console.log('  Teacher Page:', teacherPage ? 'Found' : 'NOT FOUND');
    
    console.log('Page Classes:');
    console.log('  Login Page classes:', loginPage?.className);
    console.log('  Admin Page classes:', adminPage?.className);
    console.log('  Teacher Page classes:', teacherPage?.className);
    
    const teacherContent = document.getElementById('teacherContent');
    console.log('Teacher Content Element:', teacherContent ? 'Found' : 'NOT FOUND');
    
    if (teacherContent) {
        console.log('Teacher Content HTML length:', teacherContent.innerHTML.length);
    }
}

function createSampleTeacherData() {
    // Use safe storage functions for GitHub Pages compatibility
    let existingTeachers = getStorageData('teachers');
    
    if (!existingTeachers) {
        const sampleTeachers = [
            {
                id: 'ME001',
                name: 'Prof. Rajesh Kumar',
                email: 'rajesh.kumar@bvit.edu',
                username: 'rajesh.kumar@bvit.edu',
                password: 'teacher123',
                phone: '9876543210',
                department: 'Mechanical Engineering',
                role: 'Subject Teacher',
                class: 'ME2K',
                subjects: ['Thermodynamics', 'Mechanics'],
                assignedSubjects: ['Thermodynamics', 'Mechanics'],
                isActive: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 'CM001',
                name: 'Prof. Priya Sharma',
                email: 'priya.sharma@bvit.edu',
                username: 'priya.sharma@bvit.edu',
                password: 'teacher123',
                phone: '9876543211',
                department: 'Computer Technology',
                role: 'Class Teacher',
                class: 'CM1I',
                subjects: ['Programming', 'Database', 'Networks'],
                assignedSubjects: ['Programming', 'Database'],
                isActive: true,
                createdAt: new Date().toISOString()
            }
        ];
        
        // Use safe storage function
        setStorageData('teachers', JSON.stringify(sampleTeachers));
        console.log('✅ Sample teacher data created for testing');
        
        console.log('🔑 Login credentials:');
        console.log('   Admin: admin / admin123');
        console.log('   Teacher ID: ME001, Password: teacher123');
        console.log('   Teacher ID: CM001, Password: teacher123');
    }
}

// Department data for dropdowns
const DEPARTMENTS = [
    { code: 'ME', name: 'Mechanical Engineering' },
    { code: 'CM', name: 'Computer Technology' },
    { code: 'IF', name: 'Information Technology' },
    { code: 'EE', name: 'Electrical Engineering' },
    { code: 'EJ', name: 'Electronics & Telecommunication' },
    { code: 'CE', name: 'Civil Engineering' },
    { code: 'AI', name: 'Artificial Intelligence' }
];

// Function to generate department dropdown options
function generateDepartmentOptions(selectedDept = '') {
    return DEPARTMENTS.map(dept => 
        `<option value="${dept.name}" ${selectedDept === dept.name ? 'selected' : ''}>
            ${dept.code} - ${dept.name}
        </option>`
    ).join('');
}

// Test function to verify departments
function testDepartments() {
    console.log('🏫 Available Departments:');
    DEPARTMENTS.forEach(dept => {
        console.log(`   ${dept.code} - ${dept.name}`);
    });
    console.log('\n📋 Generated dropdown options:');
    console.log(generateDepartmentOptions());
}

// Enhanced Mobile Responsiveness Function
function initializeMobileEnhancements() {
    console.log('📱 Initializing mobile enhancements...');
    
    // Detect mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isMobile || isTouch) {
        document.body.classList.add('mobile-device', 'touch-device');
        console.log('📱 Mobile device detected, applying mobile optimizations');
    }
    
    // Add mobile-specific event listeners
    addMobileEventListeners();
    
    // Optimize for mobile performance
    optimizeMobilePerformance();
    
    // Enhance mobile UI
    enhanceMobileUI();
    
    console.log('✅ Mobile enhancements initialized successfully');
}

function addMobileEventListeners() {
    // Prevent double-tap zoom on buttons
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('.btn, .nav-link, .tab-btn')) {
            e.target.style.touchAction = 'manipulation';
        }
    });
    
    // Add haptic feedback for mobile
    document.addEventListener('touchstart', function(e) {
        if (e.target.matches('.btn')) {
            // Add visual feedback
            e.target.style.transform = 'scale(0.98)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 150);
        }
    });
}

function optimizeMobilePerformance() {
    // Reduce animations on low-end devices
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
        document.body.classList.add('reduced-motion');
        console.log('📱 Low-end device detected, reducing animations');
    }
    
    // Optimize images for mobile
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.loading = 'lazy';
        img.decoding = 'async';
    });
}

function enhanceMobileUI() {
    // Add mobile-specific classes to elements
    const tables = document.querySelectorAll('.table');
    tables.forEach(table => {
        if (!table.closest('.table-responsive')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-responsive';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
    
    // Enhance form inputs for mobile
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
    });
}

// Robust initialization function
async function initializeApplication() {
    console.log('🔥 Firebase-only Student Management System starting...');
    
    // Wait for document.body to be available
    let bodyWaitAttempts = 0;
    while (!document.body && bodyWaitAttempts < 100) {
        console.log(`⏳ Waiting for document.body at initialization... attempt ${bodyWaitAttempts + 1}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        bodyWaitAttempts++;
    }
    
    if (!document.body) {
        console.error('❌ CRITICAL: document.body never became available');
        alert('Critical Error: Page failed to load properly. Please refresh.');
        return;
    }
    
    console.log('🔍 DOM state at initialization:', {
        readyState: document.readyState,
        bodyExists: !!document.body,
        adminPageExists: !!document.getElementById('adminPage'),
        teacherPageExists: !!document.getElementById('teacherPage'),
        loginPageExists: !!document.getElementById('loginPage')
    });
    
    // Store references to critical elements before they might disappear
    window.originalHTML = document.documentElement.innerHTML;
    window.bodyContent = document.body.innerHTML;
    console.log('💾 Stored original HTML content as backup');
    
    // Set up DOM monitoring to detect corruption
    setupDOMMonitoring();
    
    try {
        // Initialize GitHub Pages compatibility
        initializeFallbackData();
        
        // Initialize mobile responsiveness
        initializeMobileResponsiveness();
        console.log('📱 Mobile responsiveness initialized');
        
        // Firebase-only authentication - no sample data creation
        console.log('🔥 Firebase-only authentication enabled');
        console.log('📝 To login, ensure you have admin/teacher data in Firebase:');
        console.log('   - Admin: Firebase > admins collection with username/password');
        console.log('   - Teacher: Firebase > teachers collection with id/username/password');
        
        // Initialize mobile enhancements
        initializeMobileEnhancements();
        
        // Debug Firebase data structure and add admin helper
        setTimeout(async () => {
            if (window.firebaseDB && window.firebaseDB.isConnected) {
                console.log('🔍 DEBUG: Checking Firebase data structure...');
                try {
                    const rootRef = window.firebaseDB.db.ref('/');
                    const rootSnapshot = await rootRef.once('value');
                    const rootData = rootSnapshot.val();
                    
                    if (rootData) {
                        console.log('📊 Firebase root keys:', Object.keys(rootData));
                        
                        // Check for admin data anywhere
                        Object.keys(rootData).forEach(key => {
                            const item = rootData[key];
                            if (item && typeof item === 'object' && 
                                (item.role === 'admin' || item.role === 'Admin' || 
                                 item.email === 'admin@bvit.edu' || item.name === 'Admin')) {
                                console.log('🎯 Found potential admin data at:', key, item);
                            }
                        });
                    }
                    
                    // Helper function to add admin to Firebase
                    console.log('💡 To add admin to Firebase, run this in console:');
                    console.log('addAdminToFirebase()');
                    
                    window.addAdminToFirebase = async function() {
                        try {
                            const adminData = {
                                username: 'admin@bvit.edu',
                                email: 'admin@bvit.edu',
                                name: 'Admin',
                                password: 'admin123',
                                role: 'admin',
                                department: 'Administration',
                                createdAt: Date.now()
                            };
                            
                            // Add to admins collection with specific key
                            const adminsRef = window.firebaseDB.db.ref('admins/admin_user');
                            await adminsRef.set(adminData);
                            
                            // Also add to users collection with specific key
                            const usersRef = window.firebaseDB.db.ref('users/admin_user');
                            await usersRef.set(adminData);
                            
                            console.log('✅ Admin added to Firebase successfully!');
                            console.log('📝 Login with: email="admin@bvit.edu" password="admin123"');
                            console.log('🎯 Ready for Firebase authentication!');
                            
                        } catch (error) {
                            console.error('❌ Error adding admin to Firebase:', error);
                        }
                    };
                    
                    // Auto-add admin if not exists
                    setTimeout(async () => {
                        try {
                            // Check if admin already exists
                            const adminRef = window.firebaseDB.db.ref('admins/admin_user');
                            const snapshot = await adminRef.once('value');
                            
                            if (!snapshot.exists()) {
                                console.log('🔧 Auto-adding admin to Firebase...');
                                await window.addAdminToFirebase();
                            } else {
                                console.log('✅ Admin already exists in Firebase');
                                console.log('📝 Login with: email="admin@bvit.edu" password="admin123"');
                            }
                        } catch (error) {
                            console.log('⚠️ Could not auto-add admin:', error.message);
                            console.log('💡 Run addAdminToFirebase() manually in console');
                        }
                    }, 3000);
                    
                } catch (error) {
                    console.error('❌ Error checking Firebase structure:', error);
                }
            }
        }, 2000);
        
        // Initialize Firebase
        await initializeFirebaseAuth();
        
        // Expose test function globally
        window.testDepartments = testDepartments;
        
        // Expose department functions globally
        window.showAddDepartmentForm = showAddDepartmentForm;
        window.closeAddDepartmentModal = closeAddDepartmentModal;
        window.handleAddDepartment = handleAddDepartment;
        window.handleDepartmentChange = handleDepartmentChange;
        window.handleTeacherDepartmentChange = handleTeacherDepartmentChange;
        window.deleteDepartment = deleteDepartment;
        window.refreshDepartmentsDisplay = refreshDepartmentsDisplay;
        
        // Check for existing login session
        await checkLoginStatus();
        
        console.log('✅ Application initialized successfully with Firebase');
    } catch (error) {
        console.error('❌ Error initializing application:', error);
        console.log('🔄 Attempting to show login page as fallback...');
        try {
            showLoginPage();
        } catch (loginError) {
            console.error('❌ Error showing login page:', loginError);
            alert('Critical Error: Application failed to initialize. Please refresh the page.');
        }
    }
}

// Multiple initialization strategies
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApplication);
} else if (document.readyState === 'interactive' || document.readyState === 'complete') {
    // DOM is already ready
    setTimeout(initializeApplication, 100);
} else {
    // Fallback
    window.addEventListener('load', initializeApplication);
}

// Clear cached email data function (simplified and safe)
function clearCachedEmailData() {
    // Clear localStorage items that might contain email
    const keysToCheck = [
        'currentUser',
        'currentTeacher', 
        'teacherData',
        'userProfile',
        'loginData'
    ];
    
    keysToCheck.forEach(key => {
        const data = localStorage.getItem(key);
        if (data && data.includes('suraj@bvit.edu')) {
            try {
                const parsed = JSON.parse(data);
                if (parsed.email === 'suraj@bvit.edu') {
                    localStorage.removeItem(key);
                    console.log('🗑️ Removed cached data with suraj email:', key);
                }
            } catch (e) {
                // If not JSON, check if it's the email string
                if (data === 'suraj@bvit.edu') {
                    localStorage.removeItem(key);
                    console.log('🗑️ Removed cached email string:', key);
                }
            }
        }
    });
}

// Call the cleanup function once on load
clearCachedEmailData();

console.log('🔥 Firebase-only script loaded successfully - Google Sheets integration completely removed');
