import { createUserWithEmailAndPassword, updateProfile } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Signup page initialized");
  console.log("Auth object available:", !!auth);
  
  const form = document.getElementById('signup-form');
  if (!form) {
    console.error("Signup form not found!");
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    console.log("Attempting signup with email:", email);
    
    // Validare extinsă
    if (!username) {
      alert('Te rugăm să introduci un nume de utilizator!');
      return;
    }
    
    if (!email) {
      alert('Te rugăm să introduci o adresă de email!');
      return;
    }
    
    if (!email.includes('@')) {
      alert('Te rugăm să introduci o adresă de email validă!');
      return;
    }
    
    if (!password) {
      alert('Te rugăm să introduci o parolă!');
      return;
    }
    
    if (password !== confirmPassword) {
      alert('Parolele nu corespund!');
      return;
    }
    
    if (password.length < 6) {
      alert('Parola trebuie să aibă cel puțin 6 caractere!');
      return;
    }
    
    try {
      console.log("Starting user creation process...");
      
      if (!auth) {
        throw new Error("Firebase Auth nu este inițializat!");
      }
      
      // Creăm contul nou în Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User created successfully:", userCredential);
      
      const user = userCredential.user;
      
      // Actualizăm profilul cu numele de utilizator și o poză generată
      console.log("Updating user profile...");
      await updateProfile(user, {
        displayName: username,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`
      });
      console.log("Profile updated successfully!");
      
      // Afișăm mesaj de succes
      if (window.showCenterAlert) {
        window.showCenterAlert('Cont creat cu succes!');
      } else {
        alert('Cont creat cu succes!');
      }
      
      // Redirecționăm către pagina principală
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
      
    } catch (error) {
      console.error("Detailed error:", error);
      let errorMessage = 'A apărut o eroare la crearea contului.';
      
      if (error.code) {
        console.log("Firebase error code:", error.code);
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Există deja un cont cu acest email.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Adresa de email este invalidă.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Înregistrarea cu email și parolă nu este permisă.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Parola este prea slabă.';
            break;
          case 'auth/network-request-failed':
            errorMessage = 'Eroare de rețea. Verificați conexiunea la internet.';
            break;
          case 'auth/api-key-not-valid':
            errorMessage = 'Eroare de configurare Firebase. Vă rugăm contactați administratorul.';
            console.error("API Key invalid. Verificați configurația Firebase.");
            break;
          default:
            errorMessage = `Eroare: ${error.message}`;
        }
      } else {
        console.error("Non-Firebase error:", error);
        errorMessage = `Eroare neașteptată: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  });
  
  // Toggle password visibility
  const togglePassword = document.getElementById('toggle-signup-password');
  const toggleConfirmPassword = document.getElementById('toggle-signup-confirm-password');
  const passwordInput = document.getElementById('signup-password');
  const confirmPasswordInput = document.getElementById('signup-confirm-password');
  
  function setupPasswordToggle(toggleBtn, input) {
    if (toggleBtn && input) {
      toggleBtn.addEventListener('click', () => {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        toggleBtn.classList.toggle('fa-eye');
        toggleBtn.classList.toggle('fa-eye-slash');
      });
    }
  }
  
  setupPasswordToggle(togglePassword, passwordInput);
  setupPasswordToggle(toggleConfirmPassword, confirmPasswordInput);
});
