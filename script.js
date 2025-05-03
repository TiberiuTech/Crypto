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

    window.checkLocalAlerts();
});

// Funcție globală pentru alertă centrală, folosită pe orice pagină
window.showCenterAlert = function(message) {
    let alertDiv = document.getElementById('centerScreenAlert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.id = 'centerScreenAlert';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '50%';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translate(-50%, -50%)';
        alertDiv.style.background = 'var(--card-background)';
        alertDiv.style.color = 'var(--text-color)';
        alertDiv.style.padding = '24px 32px';
        alertDiv.style.borderRadius = '12px';
        alertDiv.style.fontSize = '1.1rem';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.boxShadow = '0 8px 32px rgba(0,0,0,0.1)';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.minWidth = '300px';
        alertDiv.style.maxWidth = '90vw';
        alertDiv.style.pointerEvents = 'auto';
        alertDiv.style.border = '1px solid var(--border-color)';
        alertDiv.style.fontFamily = 'inherit';
        alertDiv.style.opacity = '0';
        alertDiv.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        alertDiv.style.backdropFilter = 'blur(8px)';
        alertDiv.style.display = 'flex';
        alertDiv.style.alignItems = 'center';
        alertDiv.style.gap = '16px';
        // Icon de alertă
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-color); font-size: 1.5rem;"></i>';
        // Buton X
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '12px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'var(--secondary-text-color)';
        closeBtn.style.fontSize = '1rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '4px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.transition = 'all 0.2s ease';
        closeBtn.onmouseover = () => {
            closeBtn.style.color = 'var(--accent-color)';
            closeBtn.style.transform = 'rotate(90deg)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.color = 'var(--secondary-text-color)';
            closeBtn.style.transform = 'rotate(0deg)';
        };
        closeBtn.onclick = () => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 300);
        };
        alertDiv.appendChild(closeBtn);
        alertDiv.appendChild(icon);
        document.body.appendChild(alertDiv);
    } else {
        alertDiv.innerHTML = '';
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fas fa-bell" style="color: var(--accent-color); font-size: 1.5rem;"></i>';
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '12px';
        closeBtn.style.right = '12px';
        closeBtn.style.background = 'transparent';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'var(--secondary-text-color)';
        closeBtn.style.fontSize = '1rem';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.padding = '4px';
        closeBtn.style.borderRadius = '50%';
        closeBtn.style.transition = 'all 0.2s ease';
        closeBtn.onmouseover = () => {
            closeBtn.style.color = 'var(--accent-color)';
            closeBtn.style.transform = 'rotate(90deg)';
        };
        closeBtn.onmouseout = () => {
            closeBtn.style.color = 'var(--secondary-text-color)';
            closeBtn.style.transform = 'rotate(0deg)';
        };
        closeBtn.onclick = () => {
            alertDiv.style.opacity = '0';
            alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
            setTimeout(() => {
                alertDiv.style.display = 'none';
            }, 300);
        };
        alertDiv.appendChild(closeBtn);
        alertDiv.appendChild(icon);
    }
    // Mesajul
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    msgSpan.style.flex = '1';
    alertDiv.appendChild(msgSpan);
    // Animație de intrare
    alertDiv.style.display = 'flex';
    alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
    setTimeout(() => {
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
};

// Verifică la încărcarea paginii dacă există vreo alertă de preț declanșată (doar pe baza localStorage)
window.checkLocalAlerts = function() {
    const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
    if (!alerts.length) return;
    // Pentru demo: dacă există vreo alertă, o afișăm (poți adapta logica după nevoie)
    alerts.forEach(alert => {
        // Dacă vrei să marchezi alerta ca declanșată, poți folosi un flag suplimentar în localStorage
        if (alert.triggered) return;
        // Exemplu: doar mesaj generic, poți adapta să verifici prețul dacă ai date locale
        window.showCenterAlert(`Alerta: ${alert.symbol} a atins pragul de $${alert.price}!`);
        // Marchează alerta ca declanșată (opțional)
        alert.triggered = true;
    });
    // Salvează înapoi cu flag-ul triggered (opțional)
    localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
};

// Rulează și la modificarea localStorage (ex: din alt tab)
window.addEventListener('storage', () => {
    window.checkLocalAlerts();
});

// --- ALERTĂ PREȚ GLOBALĂ PE TOATE PAGINILE ---
const COINGECKO_API = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=';

function fetchAndCheckAlerts() {
    const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
    if (!alerts.length) return;
    // Filtrăm doar alertele ne-triggered
    const activeAlerts = alerts.filter(a => !a.triggered);
    if (!activeAlerts.length) return;
    // Construim lista de monede unică
    const coinIds = [...new Set(activeAlerts.map(a => a.symbol.toLowerCase()))];
    if (!coinIds.length) return;
    // Fetch la prețuri pentru monedele cu alertă
    fetch(COINGECKO_API + coinIds.join(','))
        .then(r => r.json())
        .then(data => {
            let changed = false;
            let alertsToTrigger = [];
            activeAlerts.forEach(alert => {
                const coin = data.find(c => c.symbol.toLowerCase() === alert.symbol.toLowerCase());
                if (!coin) return;
                const price = coin.current_price;
                if ((alert.condition === 'above' && price >= alert.price) ||
                    (alert.condition === 'below' && price <= alert.price)) {
                    alertsToTrigger.push({
                        id: alert.id,
                        message: `Alerta: ${coin.name} (${coin.symbol.toUpperCase()}) a atins pragul de $${alert.price}!`
                    });
                    alert.triggered = true;
                    changed = true;
                }
            });
            if (changed) {
                // Marchez alertele ca triggered
                const newAlerts = alerts.map(a => {
                    const found = activeAlerts.find(x => x.id === a.id);
                    return found ? { ...a, triggered: true } : a;
                });
                localStorage.setItem('cryptoAlerts', JSON.stringify(newAlerts));
                // Afișează alerta doar ACUM, nu la fiecare refresh
                alertsToTrigger.forEach(a => window.showCenterAlert(a.message));
            }
        })
        .catch(e => { /* ignoră erorile de rețea */ });
}

// Rulează la fiecare 15 secunde pe orice pagină
setInterval(fetchAndCheckAlerts, 15000);
// Rulează și la încărcare
window.addEventListener('DOMContentLoaded', fetchAndCheckAlerts);

// --- BADGE & DROPDOWN ALERT IDENTIC CU PRICES ---
window.updateAlertBadgeAndDropdown = function() {
    const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
    const count = alerts.length;
    document.querySelectorAll('.notification-btn').forEach(btn => {
        let badge = btn.querySelector('.alert-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'alert-badge';
            btn.appendChild(badge);
        }
        badge.textContent = count > 0 ? count : '';
        badge.style.display = count > 0 ? 'flex' : 'none';
    });
    // Dropdown unic
    let dropdown = document.getElementById('alertDropdown');
    if (!dropdown) {
        dropdown = document.createElement('div');
        dropdown.className = 'alert-dropdown';
        dropdown.id = 'alertDropdown';
        document.body.appendChild(dropdown);
    }
    if (count === 0) {
        dropdown.innerHTML = `<h4>Active Alerts</h4><div class='no-alerts'>No alerts set yet.</div>`;
    } else {
        dropdown.innerHTML = `<h4>Active Alerts</h4><div class='alert-list'>${alerts.map(a => `
            <div class='alert-row'>
                <span class='alert-symbol'>${a.symbol}</span>
                <span class='alert-condition'>${a.condition === 'above' ? 'Above' : 'Below'}</span>
                <span class='alert-price'>$${a.price}</span>
                <button class='remove-alert-btn' data-id='${a.id}' title='Remove'>&times;</button>
            </div>`).join('')}</div>`;
        dropdown.querySelectorAll('.remove-alert-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const newAlerts = alerts.filter(a => a.id !== id);
                localStorage.setItem('cryptoAlerts', JSON.stringify(newAlerts));
                updateAlertBadgeAndDropdown();
            };
        });
    }
    // Aplica tema pe dropdown
    if (dropdown) {
        dropdown.classList.remove('light-theme', 'dark-theme');
        const theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'light') {
            dropdown.classList.add('light-theme');
        } else {
            dropdown.classList.add('dark-theme');
        }
    }
}

window.setupAlertDropdownEvents = function() {
    document.querySelectorAll('.notification-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('alertDropdown');
            if (!dropdown) return;
            // Poziționează sub clopoțel, dar mai spre stânga
            const rect = btn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY + 6) + 'px';
            dropdown.style.left = (rect.right - 320) + 'px'; // ca pe prices
            dropdown.classList.toggle('active');
            // Închide la click în afara dropdown-ului
            function closeDropdown(ev) {
                if (!dropdown.contains(ev.target) && ev.target !== btn) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeDropdown);
                }
            }
            setTimeout(() => document.addEventListener('click', closeDropdown), 10);
        };
    });
}

// Actualizez badge și dropdown la încărcare și la orice modificare alertă
window.addEventListener('DOMContentLoaded', () => {
    window.updateAlertBadgeAndDropdown();
    window.setupAlertDropdownEvents();
});
window.addEventListener('storage', () => {
    window.updateAlertBadgeAndDropdown();
    window.setupAlertDropdownEvents();
});