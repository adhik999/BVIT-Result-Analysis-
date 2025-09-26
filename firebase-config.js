// Firebase Configuration and Realtime Database Integration
// Replace with your Firebase project configuration

const firebaseConfig = {
    apiKey: "AIzaSyBCUCZ2CwtPnogb8duM4UuOGAxTlG7AFQc",
    authDomain: "result-analysis-658bc.firebaseapp.com",
    databaseURL: "https://result-analysis-658bc-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "result-analysis-658bc",
    storageBucket: "result-analysis-658bc.firebasestorage.app",
    messagingSenderId: "260928791157",
    appId: "1:260928791157:web:65d78be3bbea2c89bf0e3c",
    measurementId: "G-Z7JZNEXB09"
};

// Initialize Firebase
let app, database, auth;
let currentUser = null;

async function initializeFirebase() {
    try {
        console.log('🔥 Initializing Firebase...');
        
        // Initialize Firebase App
        app = firebase.initializeApp(firebaseConfig);
        
        // Initialize Realtime Database
        database = firebase.database();
        
        // Initialize Authentication
        auth = firebase.auth();
        
        // Setup authentication state listener
        auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                console.log('🔐 User authenticated:', user.email);
                onUserAuthenticated(user);
            } else {
                currentUser = null;
                console.log('🔐 User signed out');
                onUserSignedOut();
            }
        });
        
        console.log('✅ Firebase initialized successfully');
        
        // Test connection
        await testFirebaseConnection();
        
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        return false;
    }
}

// Firebase Authentication Functions
async function signInWithEmail(email, password) {
    try {
        console.log('🔐 Signing in with email:', email);
        
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        console.log('✅ Sign in successful:', user.email);
        return { success: true, user: user };
        
    } catch (error) {
        console.error('❌ Sign in failed:', error);
        return { success: false, error: error.message };
    }
}

async function signUpWithEmail(email, password, userData) {
    try {
        console.log('🔐 Creating account for:', email);
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Save additional user data to Realtime Database
        await database.ref('users/' + user.uid).set({
            email: email,
            name: userData.name,
            role: userData.role, // 'admin' or 'teacher'
            department: userData.department,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log('✅ Account created successfully:', user.email);
        return { success: true, user: user };
        
    } catch (error) {
        console.error('❌ Account creation failed:', error);
        return { success: false, error: error.message };
    }
}

async function signOut() {
    try {
        await auth.signOut();
        console.log('✅ Sign out successful');
        return { success: true };
    } catch (error) {
        console.error('❌ Sign out failed:', error);
        return { success: false, error: error.message };
    }
}

async function getCurrentUser() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

// User role verification
async function getUserRole(user) {
    try {
        if (!user) return null;
        
        const snapshot = await database.ref('users/' + user.uid).once('value');
        const userData = snapshot.val();
        
        return userData ? userData.role : null;
    } catch (error) {
        console.error('❌ Error getting user role:', error);
        return null;
    }
}

// Check if user is admin
async function isAdmin(user = currentUser) {
    const role = await getUserRole(user);
    return role === 'admin';
}

// Check if user is teacher
async function isTeacher(user = currentUser) {
    const role = await getUserRole(user);
    return role === 'teacher';
}

// Authentication event handlers
function onUserAuthenticated(user) {
    // Update UI for authenticated user
    updateAuthenticationUI(true, user);
    
    // Load user-specific data
    loadUserData(user);
}

function onUserSignedOut() {
    // Update UI for signed out state
    updateAuthenticationUI(false, null);
    
    // Clear user-specific data
    clearUserData();
}

function updateAuthenticationUI(isAuthenticated, user) {
    // Update login/logout buttons
    const loginButtons = document.querySelectorAll('.auth-login');
    const logoutButtons = document.querySelectorAll('.auth-logout');
    const userInfo = document.querySelectorAll('.user-info');
    
    if (isAuthenticated && user) {
        loginButtons.forEach(btn => btn.style.display = 'none');
        logoutButtons.forEach(btn => btn.style.display = 'block');
        userInfo.forEach(info => {
            info.style.display = 'block';
            info.textContent = user.email;
        });
    } else {
        loginButtons.forEach(btn => btn.style.display = 'block');
        logoutButtons.forEach(btn => btn.style.display = 'none');
        userInfo.forEach(info => info.style.display = 'none');
    }
}

async function loadUserData(user) {
    try {
        const role = await getUserRole(user);
        console.log('👤 User role:', role);
        
        // Load role-specific data
        if (role === 'admin') {
            // Admin can access all data
            console.log('🔐 Loading admin data...');
        } else if (role === 'teacher') {
            // Teacher can access their own data
            console.log('🔐 Loading teacher data...');
        }
        
    } catch (error) {
        console.error('❌ Error loading user data:', error);
    }
}

function clearUserData() {
    // Clear any user-specific data from UI
    console.log('🔐 Clearing user data...');
}

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        const testRef = database.ref('test');
        await testRef.set({
            message: 'Firebase connection successful',
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        const snapshot = await testRef.once('value');
        console.log('🔥 Firebase connection test:', snapshot.val());
        
        // Clean up test data
        await testRef.remove();
        
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
    }
}

// Firebase Database Class
class FirebaseDB {
    constructor() {
        this.db = null;
        this.isConnected = false;
    }

    async initialize() {
        try {
            if (!database) {
                await initializeFirebase();
            }
            
            this.db = database;
            this.isConnected = true;
            
            console.log('🔥 FirebaseDB class initialized');
            return true;
            
        } catch (error) {
            console.error('❌ FirebaseDB initialization failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    // Teachers CRUD Operations (Admin only)
    async saveTeachers(teachers) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            // For now, bypass authentication check for teacher management
            // TODO: Implement proper admin authentication flow
            console.log('🔥 Saving teachers to Firebase...', teachers.length);
            
            const teachersRef = this.db.ref('teachers');
            await teachersRef.set(teachers);
            
            console.log('✅ Teachers saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving teachers to Firebase:', error);
            return false;
        }
    }

    async getTeachers() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return [];
            }

            console.log('🔥 Loading teachers from Firebase...');
            
            const teachersRef = this.db.ref('teachers');
            const snapshot = await teachersRef.once('value');
            const teachers = snapshot.val() || [];
            
            console.log('✅ Loaded teachers from Firebase:', teachers.length);
            return Array.isArray(teachers) ? teachers : Object.values(teachers);
            
        } catch (error) {
            console.error('❌ Error loading teachers from Firebase:', error);
            return [];
        }
    }

    // Students CRUD Operations
    async saveStudents(students) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Saving students to Firebase...', students.length);
            
            const studentsRef = this.db.ref('students');
            await studentsRef.set(students);
            
            console.log('✅ Students saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving students to Firebase:', error);
            return false;
        }
    }

    async getStudents() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return [];
            }

            console.log('🔥 Loading students from Firebase...');
            
            const studentsRef = this.db.ref('students');
            const snapshot = await studentsRef.once('value');
            const students = snapshot.val() || [];
            
            console.log('✅ Loaded students from Firebase:', students.length);
            return Array.isArray(students) ? students : Object.values(students);
            
        } catch (error) {
            console.error('❌ Error loading students from Firebase:', error);
            return [];
        }
    }

    // Marks CRUD Operations (Teacher/Admin only)
    async saveMarks(marks) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            // For now, bypass authentication check for marks management
            // TODO: Implement proper teacher/admin authentication flow
            console.log('🔥 Saving marks to Firebase...', marks.length);
            
            const marksRef = this.db.ref('marks');
            await marksRef.set(marks);
            
            console.log('✅ Marks saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving marks to Firebase:', error);
            return false;
        }
    }

    async getMarks() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return [];
            }

            console.log('🔥 Loading marks from Firebase...');
            
            const marksRef = this.db.ref('marks');
            const snapshot = await marksRef.once('value');
            const marks = snapshot.val() || [];
            
            console.log('✅ Loaded marks from Firebase:', marks.length);
            return Array.isArray(marks) ? marks : Object.values(marks);
            
        } catch (error) {
            console.error('❌ Error loading marks from Firebase:', error);
            return [];
        }
    }

    // Department and Class Data
    async saveDepartmentData(departmentData) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Saving department data to Firebase...');
            
            const deptRef = this.db.ref('departmentData');
            await deptRef.set(departmentData);
            
            console.log('✅ Department data saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving department data to Firebase:', error);
            return false;
        }
    }

    async getDepartmentData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return {};
            }

            console.log('🔥 Loading department data from Firebase...');
            
            const deptRef = this.db.ref('departmentData');
            const snapshot = await deptRef.once('value');
            const departmentData = snapshot.val() || {};
            
            console.log('✅ Loaded department data from Firebase');
            return departmentData;
            
        } catch (error) {
            console.error('❌ Error loading department data from Firebase:', error);
            return {};
        }
    }

    async saveClassSubjects(classSubjects) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Saving class subjects to Firebase...');
            
            const classRef = this.db.ref('classSubjects');
            await classRef.set(classSubjects);
            
            console.log('✅ Class subjects saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving class subjects to Firebase:', error);
            return false;
        }
    }

    async getClassSubjects() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return {};
            }

            console.log('🔥 Loading class subjects from Firebase...');
            
            const classRef = this.db.ref('classSubjects');
            const snapshot = await classRef.once('value');
            const classSubjects = snapshot.val() || {};
            
            console.log('✅ Loaded class subjects from Firebase');
            return classSubjects;
            
        } catch (error) {
            console.error('❌ Error loading class subjects from Firebase:', error);
            return {};
        }
    }

    // Proforma Data
    async saveProformaA(proformaAData) {
        try {
            console.log('🔥 Saving Proforma-A to Firebase...');
            
            // Sanitize email keys (replace . with _)
            const sanitizedData = {};
            for (const [email, data] of Object.entries(proformaAData)) {
                const sanitizedKey = email.replace(/\./g, '_').replace(/[@#$\[\]]/g, '_');
                sanitizedData[sanitizedKey] = {
                    ...data,
                    originalEmail: email // Keep original email in data
                };
            }
            
            const proformaRef = this.db.ref('proformaA');
            await proformaRef.set(sanitizedData);
            
            console.log('✅ Proforma-A saved to Firebase successfully');
            return true;
        } catch (error) {
            console.error('❌ Error saving Proforma-A to Firebase:', error);
            return false;
        }
    }

    async getProformaA() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return {};
            }

            console.log('🔥 Loading Proforma-A from Firebase...');
            
            const proformaRef = this.db.ref('proformaA');
            const snapshot = await proformaRef.once('value');
            const proformaData = snapshot.val() || {};
            
            console.log('✅ Loaded Proforma-A from Firebase');
            return proformaData;
            
        } catch (error) {
            console.error('❌ Error loading Proforma-A from Firebase:', error);
            return {};
        }
    }

    async saveProformaB(proformaData) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Saving Proforma-B to Firebase...');
            
            const proformaRef = this.db.ref('proformaB');
            await proformaRef.set(proformaData);
            
            console.log('✅ Proforma-B saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving Proforma-B to Firebase:', error);
            return false;
        }
    }

    async getProformaB() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return {};
            }

            console.log('🔥 Loading Proforma-B from Firebase...');
            
            const proformaRef = this.db.ref('proformaB');
            const snapshot = await proformaRef.once('value');
            const proformaData = snapshot.val() || {};
            
            console.log('✅ Loaded Proforma-B from Firebase');
            return proformaData;
            
        } catch (error) {
            console.error('❌ Error loading Proforma-B from Firebase:', error);
            return {};
        }
    }

    // Session Management
    async saveSession(sessionData) {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Saving session to Firebase...');
            
            const sessionRef = this.db.ref('sessions/' + sessionData.sessionId);
            await sessionRef.set(sessionData);
            
            console.log('✅ Session saved to Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error saving session to Firebase:', error);
            return false;
        }
    }

    async clearSession() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Clearing session from Firebase...');
            
            // Clear all sessions (you might want to be more specific)
            const sessionsRef = this.db.ref('sessions');
            await sessionsRef.remove();
            
            console.log('✅ Session cleared from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error clearing session from Firebase:', error);
            return false;
        }
    }

    // Cleanup Functions - Delete unwanted data from Firebase
    async deleteStudentsData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting students data from Firebase...');
            
            const studentsRef = this.db.ref('students');
            await studentsRef.remove();
            
            console.log('✅ Students data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting students data from Firebase:', error);
            return false;
        }
    }

    async deleteDepartmentData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting department data from Firebase...');
            
            const deptRef = this.db.ref('departmentData');
            await deptRef.remove();
            
            console.log('✅ Department data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting department data from Firebase:', error);
            return false;
        }
    }

    async deleteProformaAData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting Proforma-A data from Firebase...');
            
            const proformaRef = this.db.ref('proformaA');
            await proformaRef.remove();
            
            console.log('✅ Proforma-A data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting Proforma-A data from Firebase:', error);
            return false;
        }
    }

    async deleteProformaBData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting Proforma-B data from Firebase...');
            
            const proformaRef = this.db.ref('proformaB');
            await proformaRef.remove();
            
            console.log('✅ Proforma-B data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting Proforma-B data from Firebase:', error);
            return false;
        }
    }

    async deleteClassSubjectsData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting class subjects data from Firebase...');
            
            const classRef = this.db.ref('classSubjects');
            await classRef.remove();
            
            console.log('✅ Class subjects data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting class subjects data from Firebase:', error);
            return false;
        }
    }

    async deleteMarksData() {
        try {
            if (!this.isConnected) {
                console.log('⚠️ Firebase not connected');
                return false;
            }

            console.log('🔥 Deleting marks data from Firebase...');
            
            const marksRef = this.db.ref('marks');
            await marksRef.remove();
            
            console.log('✅ Marks data deleted from Firebase successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting marks data from Firebase:', error);
            return false;
        }
    }

    // Delete all unwanted data at once
    async cleanupFirebaseData() {
        try {
            console.log('🧹 Starting Firebase cleanup...');
            
            const results = await Promise.allSettled([
                this.deleteStudentsData(),
                this.deleteDepartmentData(), 
                this.deleteProformaAData(),
                this.deleteProformaBData(),
                this.deleteClassSubjectsData(),
                this.deleteMarksData()
            ]);

            const successful = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
            const failed = results.length - successful;

            console.log(`✅ Firebase cleanup completed: ${successful} successful, ${failed} failed`);
            return { successful, failed, total: results.length };
            
        } catch (error) {
            console.error('❌ Error during Firebase cleanup:', error);
            return { successful: 0, failed: 6, total: 6 };
        }
    }

    // Real-time listeners
    onTeachersChange(callback) {
        if (!this.isConnected) return;
        
        const teachersRef = this.db.ref('teachers');
        teachersRef.on('value', (snapshot) => {
            const teachers = snapshot.val() || [];
            callback(Array.isArray(teachers) ? teachers : Object.values(teachers));
        });
    }

    onStudentsChange(callback) {
        if (!this.isConnected) return;
        
        const studentsRef = this.db.ref('students');
        studentsRef.on('value', (snapshot) => {
            const students = snapshot.val() || [];
            callback(Array.isArray(students) ? students : Object.values(students));
        });
    }

    onMarksChange(callback) {
        if (!this.isConnected) return;
        
        const marksRef = this.db.ref('marks');
        marksRef.on('value', (snapshot) => {
            const marks = snapshot.val() || [];
            callback(Array.isArray(marks) ? marks : Object.values(marks));
        });
    }
}

// Initialize global Firebase instance
window.firebaseDB = new FirebaseDB();

// Expose Firebase variables globally for compatibility
window.database = null;
window.auth = null;
window.app = null;
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔥 Auto-initializing Firebase...');
    const initialized = await initializeFirebase();
    if (initialized) {
        // Expose Firebase instances globally
        window.database = database;
        window.auth = auth;
        window.app = app;
        
        // Initialize the FirebaseDB class
        await window.firebaseDB.initialize();
    }
});

console.log('🔥 Firebase configuration loaded');
