document.addEventListener('DOMContentLoaded', () => {
  console.log("Login page specific script loaded.");
  const form = document.getElementById('login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      // Utilizăm noua implementare simplificată
      await auth.signInWithEmailAndPassword(email, password);
      
      // Afișăm un mesaj de succes
      if (window.showCenterAlert) {
        window.showCenterAlert('Logare reușită!');
      } else {
        alert('Logare reușită!');
      }
      
      // Redirecționăm către pagina principală după o scurtă întârziere
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
    } catch (error) {
      console.error("Eroare la autentificare:", error);
      alert('Eroare la logare: ' + (error.message || 'Verificați email și parola'));
    }
  });
});
