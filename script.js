document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeToggleBtnMobile = document.getElementById('themeToggleBtnMobile');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-item, .auth-btn').forEach(element => {
        element.addEventListener('click', () => {
            if (navLinks) {
                navLinks.classList.remove('active');
            }
        });
    });

    function toggleTheme() {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    if (themeToggleBtnMobile) {
        themeToggleBtnMobile.addEventListener('click', toggleTheme);
    }

    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }
}); 