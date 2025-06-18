// Import Firebase from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBs5ShkSyNnMafF8fyXEbGv3r7-egnDM9c",
  authDomain: "crypto-platform-c8c0d.firebaseapp.com",
  projectId: "crypto-platform-c8c0d",
  storageBucket: "crypto-platform-c8c0d.appspot.com",
  messagingSenderId: "1082842752655",
  appId: "1:1082842752655:web:c0c5c9c4c5c9c4c5c9c4c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Verificăm dacă suntem în development
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    console.log("Running in development mode");
}

// Make auth globally available
window.firebaseAuth = auth;

// Log the initialization status
console.log("Firebase initialized:", app);
console.log("Auth initialized:", auth);

// Add auth state change listener
auth.onAuthStateChanged(function(user) {
    console.log("Auth state changed:", user ? "user logged in" : "user logged out");
    if (user) {
        console.log("User is signed in with email:", user.email);
    }
});

export { auth, app }; 