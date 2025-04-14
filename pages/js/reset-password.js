document.addEventListener('DOMContentLoaded', () => {
  console.log("Reset Password specific script loaded.");

  const resetForm = document.getElementById('reset-password-form');
  const resetMessage = document.getElementById('reset-message');
  const tokenInput = document.getElementById('reset-token');
  const newPasswordInput = document.getElementById('reset-new-password');
  const confirmPasswordInput = document.getElementById('reset-confirm-password');

  try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      if (token && tokenInput) {
          tokenInput.value = token;
          console.log('Token found in URL:', token);
      } else {
           console.log('No token found in URL.');
           if(resetMessage) {
               resetMessage.textContent = 'Invalid or missing password reset token.';
               resetMessage.style.color = 'red';
           }
           if(resetForm) resetForm.querySelector('button[type="submit"]').disabled = true;
      }
  } catch (e) {
       console.error('Error reading token from URL:', e);
       if(resetMessage) {
           resetMessage.textContent = 'Error processing reset link.';
           resetMessage.style.color = 'red';
       }
        if(resetForm) resetForm.querySelector('button[type="submit"]').disabled = true;
  }

  if (resetForm && resetMessage && newPasswordInput && confirmPasswordInput) {
      resetForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const newPassword = newPasswordInput.value;
          const confirmPassword = confirmPasswordInput.value;
          const token = tokenInput ? tokenInput.value : ''; 

          resetMessage.textContent = 'Processing...';
          resetMessage.style.color = 'var(--text-secondary)';

          if (!token) { 
              resetMessage.textContent = 'Invalid or missing password reset token. Cannot proceed.';
              resetMessage.style.color = 'red';
              return;
          }

          if (newPassword !== confirmPassword) {
              resetMessage.textContent = 'Passwords do not match.';
              resetMessage.style.color = 'red';
              return;
          }
          
          if (newPassword.length < 6) { 
               resetMessage.textContent = 'Password must be at least 6 characters long.';
               resetMessage.style.color = 'red';
               return;
          }

          setTimeout(() => {
              console.log('Simulating password reset for token:', token, 'with new password:', newPassword);
              resetMessage.textContent = 'Password has been successfully reset. You can now login.';
              resetMessage.style.color = 'green';
              resetForm.reset(); 
              resetForm.querySelector('button[type="submit"]').disabled = true;
              newPasswordInput.disabled = true;
              confirmPasswordInput.disabled = true;
              setTimeout(() => { window.location.href = 'login.html'; }, 3000);
          }, 1500);
      });
  }

  //    setupPasswordToggle('reset-new-password', 'toggle-reset-password');
  // setupPasswordToggle('reset-confirm-password', 'toggle-reset-confirm-password');
});
