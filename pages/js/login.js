import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { auth } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Login page initialized");
  const form = document.getElementById('login-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Afișăm mesaj de succes
      if (window.showCenterAlert) {
        window.showCenterAlert('Logare reușită!');
      } else {
        alert('Logare reușită!');
      }
      
      // Redirecționăm către pagina principală
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
      
    } catch (error) {
      console.error("Eroare la autentificare:", error);
      let errorMessage = 'A apărut o eroare la autentificare.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Adresa de email este invalidă.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Acest cont a fost dezactivat.';kl
          break;
        case 'auth/user-not-found':
          errorMessage = 'Nu există niciun cont cu acest email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Parola este incorectă.';
          break;
      }
      
      alert(errorMessage);
    }
  });
  
  // Toggle password visibility
  const togglePassword = document.getElementById('toggle-login-password');
  const passwordInput = document.getElementById('login-password');
  
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassword.classList.toggle('fa-eye');
      togglePassword.classList.toggle('fa-eye-slash');
    });
  }
});
