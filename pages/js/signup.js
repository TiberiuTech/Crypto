document.addEventListener('DOMContentLoaded', () => {
  console.log("Signup page specific script loaded.");
  
  const form = document.getElementById('signup-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Validare de bază
    if (password !== confirmPassword) {
      alert('Parolele nu corespund!');
      return;
    }
    
    try {
      // Creăm un cont nou utilizând implementarea simplificată
      const result = await auth.createUserWithEmailAndPassword(email, password);
      
      // Actualizăm profilul cu numele de utilizator
      await updateUserProfile(username);
      
      // Afișăm un mesaj de succes
      if (window.showCenterAlert) {
        window.showCenterAlert('Cont creat cu succes!');
      } else {
        alert('Cont creat cu succes!');
      }
      
      // Redirecționăm către pagina principală după o scurtă întârziere
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
    } catch (error) {
      console.error("Eroare la crearea contului:", error);
      alert('Eroare la crearea contului: ' + (error.message || 'Verificați datele introduse'));
    }
  });
});
