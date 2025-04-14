document.addEventListener('DOMContentLoaded', () => {
  console.log("Forgot Password specific script loaded.");

  const forgotForm = document.getElementById('forgot-password-form');
  const forgotMessage = document.getElementById('forgot-message');
  
  if (forgotForm && forgotMessage) {
      forgotForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const emailInput = document.getElementById('forgot-email');
          const email = emailInput ? emailInput.value : '';

          forgotMessage.textContent = 'Processing...';
          forgotMessage.style.color = 'var(--text-secondary)';

          if (!email || !/\S+@\S+\.\S+/.test(email)) {
              forgotMessage.textContent = 'Please enter a valid email address.';
              forgotMessage.style.color = 'red';
              return;
          }
          
          setTimeout(() => {
              console.log('Simulating sending reset link to:', email);
              forgotMessage.textContent = 'If an account exists for this email, a password reset link has been sent.';
              forgotMessage.style.color = 'green';
              forgotForm.reset(); 
          }, 1500);
      });
  }
});
