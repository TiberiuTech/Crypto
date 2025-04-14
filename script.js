function setupPasswordToggle(inputId, toggleIconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(toggleIconId);
    if (passwordInput && toggleIcon) {
        toggleIcon.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleIcon.classList.toggle('fa-eye');
            toggleIcon.classList.toggle('fa-eye-slash');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'dark') {
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            if (themeToggleBtn) themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
            if (themeToggleBtnMobile) themeToggleBtnMobile.innerHTML = '<i class="fas fa-moon"></i>';
        }
    }
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
    if (themeToggleBtnMobile) {
        themeToggleBtnMobile.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
    const initialTheme = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(initialTheme);

    const currentPagePath = window.location.pathname;
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const signupBtnMobile = document.getElementById('signupBtnMobile');
    if(loginBtn) loginBtn.classList.remove('active');
    if(loginBtnMobile) loginBtnMobile.classList.remove('active');
    if(signupBtn) signupBtn.classList.remove('active');
    if(signupBtnMobile) signupBtnMobile.classList.remove('active');
    if (currentPagePath.includes('login.html')) {
        if(loginBtn) loginBtn.classList.add('active');
        if(loginBtnMobile) loginBtnMobile.classList.add('active');
    } else if (currentPagePath.includes('signup.html')) {
        if(signupBtn) signupBtn.classList.add('active');
        if(signupBtnMobile) signupBtnMobile.classList.add('active');
    }

    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('signup-password', 'toggle-signup-password');
    setupPasswordToggle('signup-confirm-password', 'toggle-signup-confirm-password');
    setupPasswordToggle('reset-new-password', 'toggle-reset-password');
    setupPasswordToggle('reset-confirm-password', 'toggle-reset-confirm-password');


});