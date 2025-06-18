// Import Firebase auth from the config file
import { auth } from './pages/js/firebase-config.js';

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

document.addEventListener('DOMContentLoaded', async function() {
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
        updateThemeButtonIcon(theme);
        
        // Actualizăm și temele modalelor
        updateModalsTheme(theme);
    }
    
    // Funcție pentru actualizarea iconiței butonului în funcție de tema curentă
    function updateThemeButtonIcon(theme) {
        const isDark = theme === 'dark';
        if (themeToggleBtn) {
            themeToggleBtn.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
        if (themeToggleBtnMobile) {
            themeToggleBtnMobile.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        }
    }
    
    // Funcția pentru actualizarea graficelor când se schimbă tema
    function updateChartsOnThemeChange() {
        // Recreează toate graficele pentru a actualiza culorile
        if (document.getElementById('btc-chart')) {
            const btcChange = document.getElementById('btc-change');
            const btcChangeValue = btcChange ? parseFloat(btcChange.textContent) : -1.03;
            const btcPrice = document.getElementById('btc-price');
            const btcPriceValue = btcPrice ? parseFloat(btcPrice.textContent.replace('$', '').replace(',', '')) : 95940;
            
            const historicalData = generateHistoricalData(btcPriceValue, btcChangeValue);
            createChart('btc', historicalData, btcChangeValue);
        }
        
        if (document.getElementById('eth-chart')) {
            const ethChange = document.getElementById('eth-change');
            const ethChangeValue = ethChange ? parseFloat(ethChange.textContent) : -0.47;
            const ethPrice = document.getElementById('eth-price');
            const ethPriceValue = ethPrice ? parseFloat(ethPrice.textContent.replace('$', '').replace(',', '')) : 1825.0;
            
            const historicalData = generateHistoricalData(ethPriceValue, ethChangeValue);
            createChart('eth', historicalData, ethChangeValue);
        }
        
        if (document.getElementById('orx-chart')) {
            const orxChange = document.getElementById('orx-change');
            const orxChangeValue = orxChange ? parseFloat(orxChange.textContent) : 2.51;
            const orxPrice = document.getElementById('orx-price');
            const orxPriceValue = orxPrice ? parseFloat(orxPrice.textContent.replace('$', '')) : 4.00;
            
            const historicalData = generateHistoricalData(orxPriceValue, orxChangeValue);
            createChart('orx', historicalData, orxChangeValue);
        }
    }
    
    // Adăugăm event listener pentru comutarea temei
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            
            // Actualizăm graficele când se schimbă tema
            setTimeout(updateChartsOnThemeChange, 50);
        });
    }
    
    if (themeToggleBtnMobile) {
        themeToggleBtnMobile.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            
            // Actualizăm graficele când se schimbă tema
            setTimeout(updateChartsOnThemeChange, 50);
        });
    }
    
    // Inițializăm tema la încărcarea paginii
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    applyTheme(initialTheme);

    const currentPagePath = window.location.pathname;
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const signupBtnMobile = document.getElementById('signupBtnMobile');

    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('signup-password', 'toggle-signup-password');
    setupPasswordToggle('signup-confirm-password', 'toggle-signup-confirm-password');
    setupPasswordToggle('reset-new-password', 'toggle-reset-password');
    setupPasswordToggle('reset-confirm-password', 'toggle-reset-confirm-password');

    // Inițializăm secțiunea de crypto carduri
    initCryptoCards();
    
    // Inițializăm alerte și dropdown-uri
    fetchAndCheckAlerts();
    updateAlertBadgeAndDropdown();
    setupAlertDropdownEvents();
    setInterval(fetchAndCheckAlerts, 15000);

    // Inițializare secțiune de comparare criptomonede
    if (document.getElementById('compare-section')) {
        console.log("Secțiunea de comparare a fost găsită, inițializăm...");
        initCryptoCompare();
        
        // Adăugăm un timeout pentru a ne asigura că toate elementele sunt încărcate complet
        setTimeout(fixInitCompareCharts, 500);
    }

    // --- LOGICA AUTENTIFICARE FIREBASE ---
    let authInitAttempts = 0;
    const maxAuthAttempts = 5;
    
    // Improved Firebase Auth initialization
    async function initializeFirebaseAuth() {
        try {
            // Wait for auth to be ready
            if (!auth) {
                throw new Error('Firebase Auth not available');
            }

            // Set up auth state listener
            auth.onAuthStateChanged(function(user) {
                console.log("Auth state changed:", user ? "user logged in" : "user logged out");
                updateUIForAuthState(user);
                checkAuthAndRedirect();
            });

            console.log("Firebase Auth initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing Firebase Auth:", error);
            return false;
        }
    }

    // Initialize Firebase Auth
    await initializeFirebaseAuth();

    // Determinăm calea corectă în funcție de locația curentă
    const isInPagesDir = window.location.pathname.includes('/pages/');
    const loginPath = isInPagesDir ? 'login.html' : 'pages/login.html';
    const signupPath = isInPagesDir ? 'signup.html' : 'pages/signup.html';

    // Pentru butoanele desktop
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = loginPath;
            }
        });
    }

    if (signupBtn) {
        signupBtn.addEventListener('click', function(e) {
            if (!window.location.pathname.includes('signup.html')) {
                window.location.href = signupPath;
            }
        });
    }

    // Pentru butoanele mobile
    if (loginBtnMobile) {
        loginBtnMobile.addEventListener('click', function(e) {
            if (!window.location.pathname.includes('login.html')) {
                window.location.href = loginPath;
            }
        });
    }

    if (signupBtnMobile) {
        signupBtnMobile.addEventListener('click', function(e) {
            if (!window.location.pathname.includes('signup.html')) {
                window.location.href = signupPath;
            }
        });
    }

    // Funcție pentru gestionarea click-urilor pe link-urile protejate
    function handleProtectedLinks() {
        const walletLinks = document.querySelectorAll('a[href*="wallet.html"]');
        const tradeLinks = document.querySelectorAll('a[href*="trade.html"]');
        
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDir ? 'login.html' : 'pages/login.html';
        const walletPath = isInPagesDir ? 'wallet.html' : 'pages/wallet.html';
        const tradePath = isInPagesDir ? 'trade.html' : 'pages/trade.html';
        
        const checkAuth = () => {
            if (typeof window.isAuthenticated === 'function') {
                return window.isAuthenticated();
            }
            // Fallback dacă funcția nu este disponibilă
            return localStorage.getItem('userToken') !== null;
        };
        
        walletLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (!checkAuth()) {
                    window.location.href = loginPath;
                } else {
                    window.location.href = walletPath;
                }
            });
        });
        
        tradeLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                if (!checkAuth()) {
                    window.location.href = loginPath;
                } else {
                    window.location.href = tradePath;
                }
            });
        });
    }

    // Adăugăm event listener pentru încărcarea paginii
    handleProtectedLinks();
});

// Event pentru actualizarea alertelor când se schimbă în alt tab
window.addEventListener('storage', () => {
    updateAlertBadgeAndDropdown();
});

// --- showCenterAlert global ---
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
        document.body.appendChild(alertDiv);
    }
    alertDiv.innerHTML = `<span>${message}</span>`;
    alertDiv.style.display = 'flex';
    setTimeout(() => {
        alertDiv.style.opacity = '1';
        alertDiv.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 10);
    setTimeout(() => {
        alertDiv.style.opacity = '0';
        alertDiv.style.transform = 'translate(-50%, -50%) scale(0.95)';
        setTimeout(() => { alertDiv.style.display = 'none'; }, 300);
    }, 5000);
};

// --- checkPriceAlertsGlobal ---
async function checkPriceAlertsGlobal() {
    const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
    if (!alerts.length) return;
    const symbols = [...new Set(alerts.filter(a => !a.triggered).map(a => a.symbol))];
    if (!symbols.length) return;
    
    // Verificăm timpul ultimei cereri globale pentru a evita limitele API
    const now = Date.now();
    const lastGlobalApiCallTime = localStorage.getItem('lastGlobalApiCall');
    if (lastGlobalApiCallTime && (now - parseInt(lastGlobalApiCallTime)) < 20000) { // 20 secunde între cereri globale
        console.log('Prea multe cereri globale către API. Se amână verificarea...');
        return;
    }
    
    // Salvăm timpul ultimei cereri globale
    localStorage.setItem('lastGlobalApiCall', now.toString());
    
    const symbolToId = {
        BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', SOL: 'solana', DOT: 'polkadot', DOGE: 'dogecoin', AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap', ATOM: 'cosmos', LTC: 'litecoin', ETC: 'ethereum-classic', XLM: 'stellar', ALGO: 'algorand', VET: 'vechain', MANA: 'decentraland', SAND: 'the-sandbox'
    };
    const ids = symbols.map(s => symbolToId[s.toUpperCase()] || s.toLowerCase()).join(',');
    
    // Modificat pentru a folosi proxy-ul local
    const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=false`;
    const proxyUrl = 'http://127.0.0.1:5000/api/proxy?url=';
    
    try {
        const resp = await fetch(proxyUrl + encodeURIComponent(apiUrl));
        if (!resp.ok) {
            throw new Error(`Error: ${resp.status}`);
        }
        const data = await resp.json();
        
        // Verificăm dacă răspunsul este valid
        if (!Array.isArray(data)) {
            console.log('[Global] Răspunsul API nu este un array. Răspuns primit:', data);
            if (data.status) {
                console.log('[Global] Status API:', data.status);
            }
            return; // Nu facem simulare în verificările globale
        }
        
        let triggered = false;
        alerts.forEach(alert => {
            if (alert.triggered) return;
            const coin = data.find(c => c.symbol.toUpperCase() === alert.symbol.toUpperCase());
            if (!coin) {
                console.log(`[Global] Nu s-a găsit moneda ${alert.symbol} în răspunsul API`);
                return;
            }
            
            // Adăugăm logging pentru debugging
            console.log(`[Global] Verificare alertă: ${alert.symbol}, condiție: ${alert.condition}, preț țintă: ${alert.price}, preț actual: ${coin.current_price}`);
            
            // Verifică condiția corect
            const shouldTrigger = 
                (alert.condition === 'above' && coin.current_price >= alert.price) ||
                (alert.condition === 'below' && coin.current_price <= alert.price);
                
            if (shouldTrigger) {
                window.showCenterAlert(`Alerta ta pentru ${coin.name} (${coin.symbol.toUpperCase()}) a fost declanșată! Prețul a ajuns la $${coin.current_price} (${alert.condition === 'above' ? 'peste' : 'sub'} $${alert.price})`);
                alert.triggered = true;
                alert.lastTriggered = now;
                triggered = true;
            }
        });
        if (triggered) {
            localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
            if (typeof updateAlertBadgeAndDropdown === 'function') {
                updateAlertBadgeAndDropdown();
            }
        }
    } catch (e) {
        console.error("[Global] Eroare la verificarea globală a alertelor:", e);
    }
}

// Pornim intervalul global pe orice pagină
setInterval(checkPriceAlertsGlobal, 30000); // Verificare la fiecare 30 secunde

// --- ALERTĂ PREȚ GLOBALĂ PE TOATE PAGINILE ---
function fetchAndCheckAlerts() {
    const alerts = JSON.parse(localStorage.getItem('cryptoAlerts') || '[]');
    
    // Resetează flagul 'triggered' pentru alerte după o oră
    const now = Date.now();
    let resetOccurred = false;
    
    alerts.forEach(alert => {
        if (alert.triggered && alert.lastTriggered && (now - alert.lastTriggered) > 3600000) {
            alert.triggered = false;
            resetOccurred = true;
        }
    });
    
    if (resetOccurred) {
        localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
    }
    
    const activeAlerts = alerts.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    // Verificăm timpul ultimei cereri pentru a evita limitele API
    const lastApiCallTime = localStorage.getItem('lastAlertApiCall');
    if (lastApiCallTime && (now - parseInt(lastApiCallTime)) < 10000) { // 10 secunde între cereri
        console.log('Prea multe cereri către API. Se folosește fallback...');
        simulatePriceCheck(alerts, activeAlerts);
        return;
    }
    
    // Salvăm timpul ultimei cereri
    localStorage.setItem('lastAlertApiCall', now.toString());

    // Folosește URL-ul public pentru request-uri limitate
    const symbolToId = {
        BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', SOL: 'solana', DOT: 'polkadot', DOGE: 'dogecoin', AVAX: 'avalanche-2', MATIC: 'matic-network', LINK: 'chainlink', UNI: 'uniswap', ATOM: 'cosmos', LTC: 'litecoin', ETC: 'ethereum-classic', XLM: 'stellar', ALGO: 'algorand', VET: 'vechain', MANA: 'decentraland', SAND: 'the-sandbox'
    };
    
    // Convertim simbolurile în ID-uri CoinGecko
    const coinIds = activeAlerts.map(a => {
        const id = symbolToId[a.symbol.toUpperCase()];
        return id || a.symbol.toLowerCase();
    }).join(',');
    
    // Modificat pentru a folosi proxy-ul local
    const apiUrl = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&sparkline=false`;
    const proxyUrl = 'http://127.0.0.1:5000/api/proxy?url=';
    
    fetch(proxyUrl + encodeURIComponent(apiUrl))
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Verifică dacă data este un array valid
            if (!Array.isArray(data)) {
                console.log('Răspunsul API nu este un array. Răspuns primit:', data);
                
                // Verifică dacă răspunsul conține un mesaj de eroare sau de rate limit
                if (data.status && (data.status.error_code === 429 || data.status.error_message?.includes('rate'))) {
                    console.log('Rate limit depășit la CoinGecko. Utilizăm simulare...');
                } else {
                    console.error('Format de date neașteptat de la API:', data);
                }
                
                // Folosim simularea indiferent de tipul de eroare
                simulatePriceCheck(alerts, activeAlerts);
                return;
            }
            
            let changed = false;
            
            activeAlerts.forEach(alert => {
                const coin = data.find(c => c.symbol.toLowerCase() === alert.symbol.toLowerCase());
                if (!coin) {
                    console.log(`Nu s-a găsit moneda ${alert.symbol} în răspunsul API`);
                    return;
                }
                
                // Adăugăm logging pentru debugging
                console.log(`Verificare alertă: ${alert.symbol}, condiție: ${alert.condition}, preț țintă: ${alert.price}, preț actual: ${coin.current_price}`);
                
                // Verifică condiția corect pentru both above and below
                const shouldTrigger = 
                    (alert.condition === 'above' && coin.current_price >= alert.price) ||
                    (alert.condition === 'below' && coin.current_price <= alert.price);
                    
                if (shouldTrigger) {
                    window.showCenterAlert(`${alert.symbol} a atins ${alert.condition === 'above' ? 'peste' : 'sub'} ${alert.price}$! Preț actual: $${coin.current_price}`);
                    alert.triggered = true;
                    alert.lastTriggered = now;
                    changed = true;
                }
            });
            
            if (changed) {
                localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
                updateAlertBadgeAndDropdown();
            }
        })
        .catch(error => {
            console.error('Eroare la verificarea alertelor:', error);
            
            // Implementează o soluție alternativă pentru demo
            console.log('Folosim prețuri simulate pentru testare...');
            simulatePriceCheck(alerts, activeAlerts);
        });
}

// Funcție de fallback pentru simularea verificării prețurilor când API-ul eșuează
function simulatePriceCheck(alerts, activeAlerts) {
    const now = Date.now();
    let changed = false;
    
    activeAlerts.forEach(alert => {
        // Generăm un preț simulat POTRIVIT pentru a evita alerte false
        let simulatedPrice;
        
        if (alert.condition === 'above') {
            // Pentru alerte "above", simulăm un preț puțin peste target dacă vrem să testăm
            // În mod normal ar trebui să rămână sub valoarea țintă
            simulatedPrice = alert.price * 0.95; // 5% sub valoarea țintă
            
            // Pentru TESTARE: Decomentează linia de mai jos pentru a declanșa alerta
            // simulatedPrice = alert.price * 1.05; // 5% peste valoarea țintă
        } else { // condiție 'below'
            // Pentru alerte "below", simulăm un preț puțin sub target dacă vrem să testăm
            // În mod normal ar trebui să rămână peste valoarea țintă
            simulatedPrice = alert.price * 1.05; // 5% peste valoarea țintă
            
            // Pentru TESTARE: Decomentează linia de mai jos pentru a declanșa alerta
            // simulatedPrice = alert.price * 0.95; // 5% sub valoarea țintă
        }
        
        // Verificăm condiția corect pentru both above and below
        const shouldTrigger = 
            (alert.condition === 'above' && simulatedPrice >= alert.price) ||
            (alert.condition === 'below' && simulatedPrice <= alert.price);
            
        if (shouldTrigger) {
            window.showCenterAlert(`${alert.symbol} a atins ${alert.condition === 'above' ? 'peste' : 'sub'} ${alert.price}$! (simulare)`);
            alert.triggered = true;
            alert.lastTriggered = now;
            changed = true;
        }
    });
    
    if (changed) {
        localStorage.setItem('cryptoAlerts', JSON.stringify(alerts));
        updateAlertBadgeAndDropdown();
    }
}

// --- BADGE & DROPDOWN ALERT ---
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
        
        // Adaugă stiluri CSS inline pentru dropdown
        const style = document.createElement('style');
        style.textContent = `
            .alert-row.triggered {
                opacity: 0.65;
                background-color: rgba(var(--accent-color-rgb), 0.05);
            }
            .alert-status {
                margin-right: 5px;
                font-size: 12px;
            }
            .active .alert-status {
                color: #4CAF50;
            }
            .triggered .alert-status {
                color: #FF9800;
            }
        `;
        document.head.appendChild(style);
    }
    if (count === 0) {
        dropdown.innerHTML = `<h4>Active Alerts</h4><div class='no-alerts'>No alerts set yet.</div>`;
    } else {
        dropdown.innerHTML = `<h4>Active Alerts</h4><div class='alert-list'>${alerts.map(a => `
            <div class='alert-row ${a.triggered ? "triggered" : "active"}'>
                <span class='alert-symbol'>${a.symbol}</span>
                <span class='alert-condition'>${a.condition === 'above' ? 'Above' : 'Below'}</span>
                <span class='alert-price'>$${a.price}</span>
                <span class='alert-status' title='${a.triggered ? "Already triggered" : "Active"}'>${a.triggered ? "●" : "○"}</span>
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
            const rect = btn.getBoundingClientRect();
            dropdown.style.top = (rect.bottom + window.scrollY + 6) + 'px';
            dropdown.style.left = (rect.right - 320) + 'px';
            dropdown.classList.toggle('active');
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

// Funcție pentru formatarea valorilor monetare
function formatCurrency(value) {
    if (value >= 1e9) {
        return '$' + (value / 1e9).toFixed(2) + 'B';
    } else if (value >= 1e6) {
        return '$' + (value / 1e6).toFixed(2) + 'M';
    } else if (value >= 1e3) {
        return '$' + (value / 1e3).toFixed(2) + 'K';
    } else {
        return '$' + value.toFixed(2);
    }
}

// Funcție pentru formatarea valorilor cu virgulă mobilă
function formatNumber(value, decimals = 2) {
    if (value >= 1e9) {
        return (value / 1e9).toFixed(decimals) + 'B';
    } else if (value >= 1e6) {
        return (value / 1e6).toFixed(decimals) + 'M';
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(decimals) + 'K';
    } else {
        return value.toFixed(decimals);
    }
}

// Funcția pentru inițializarea cardurilor crypto
function initCryptoCards() {
    // Obținem datele pentru Bitcoin și Ethereum de la CoinGecko
    fetchCryptoData();
    
    // Vom actualiza datele la fiecare minut
    setInterval(fetchCryptoData, 60000);
    
    // Adăugăm click event pentru cardul Orionix care duce la secțiunea Orionix
    const orionixCard = document.getElementById('orionix-card');
    if (orionixCard) {
        orionixCard.style.cursor = 'pointer';
        orionixCard.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'pages/orionix.html';
        });
    }
    
    // Adăugăm smooth scroll pentru link-ul din meniu către secțiunea Orionix
    const orionixLink = document.querySelector('a[href="#orionix-section"]');
    if (orionixLink) {
        orionixLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'pages/orionix.html';
        });
    }
    
    // Inițializăm secțiunea de features
    initFeaturesSection();
}

// Funcție pentru inițializarea secțiunii de features cu animații
function initFeaturesSection() {
    // Verificăm dacă secțiunea de features există
    const featuresSection = document.querySelector('.features-section');
    if (!featuresSection) return;
    
    // Adăugăm un observer pentru a anima cardurile când ajung în viewport
    const featureBoxes = document.querySelectorAll('.feature-box');
    
    if ('IntersectionObserver' in window) {
        const appearOptions = {
            threshold: 0.15,
            rootMargin: "0px 0px -100px 0px"
        };
        
        const appearOnScroll = new IntersectionObserver(function(entries, observer) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Calculăm un delay bazat pe poziția elementului
                    const box = entry.target;
                    const delay = parseInt(box.getAttribute('data-animation-order') || box.dataset.animationOrder || '0');
                    
                    // Adăugăm o scurtă întârziere bazată pe poziție
                    setTimeout(() => {
                        box.style.opacity = "1";
                        box.style.transform = "translateY(0)";
                    }, delay * 100);
                    
                    // Oprim observarea după ce elementul a fost animat
                    observer.unobserve(box);
                }
            });
        }, appearOptions);
        
        featureBoxes.forEach((box, index) => {
            // Setăm ordinea animației ca atribut data
            box.setAttribute('data-animation-order', index + 1);
            
            // Resetăm stilurile pentru a pregăti animația
            box.style.opacity = "0";
            box.style.transform = "translateY(40px)";
            
            // Începem observarea
            appearOnScroll.observe(box);
        });
    } else {
        // Fallback pentru browsere care nu suportă IntersectionObserver
        featureBoxes.forEach(box => {
            box.style.opacity = "1";
            box.style.transform = "translateY(0)";
        });
    }
    
    // Adăugăm efecte de hover pentru carduri
    featureBoxes.forEach(box => {
        box.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            }
        });
        
        box.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon');
            if (icon) {
                icon.style.transform = 'scale(1) rotate(0)';
            }
        });
        
        // Adăugăm efect de tilt 3D la mișcarea mouse-ului
        box.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left; // poziția X a mouse-ului în element
            const y = e.clientY - rect.top;  // poziția Y a mouse-ului în element
            
            // Calculăm valorile de rotație în funcție de poziția mouse-ului
            const xRotation = ((y - rect.height / 2) / rect.height) * 5; // max 5 grade
            const yRotation = ((x - rect.width / 2) / rect.width) * -5;  // max 5 grade
            
            // Aplicăm transformarea
            this.style.transform = `perspective(1000px) rotateX(${xRotation}deg) rotateY(${yRotation}deg) scale(1.02)`;
        });
        
        // Resetăm la ieșire
        box.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
    
    // Adăugăm efect de undă la click-uri pe link-urile din carduri
    const featureLinks = document.querySelectorAll('.feature-link');
    featureLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Creăm elementul de undă
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            
            // Obținem poziția și dimensiunea link-ului
            const rect = this.getBoundingClientRect();
            
            // Poziționăm unda la poziția clicului relative la link
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            
            // Adăugăm unda ca copil al link-ului
            this.appendChild(ripple);
            
            // Eliminăm unda după ce animația s-a terminat
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Funcție pentru generarea datelor istorice pentru grafic
function generateHistoricalData(currentPrice, percentChange, numPoints = 36) {
    const now = new Date();
    const labels = [];
    const data = [];
    const timestamps = [];
    const ohlcData = [];
    
    // Calculăm prețul inițial bazat pe schimbarea procentuală
    const initialPrice = currentPrice / (1 + percentChange / 100);
    
    // Volatilitatea simulată bazată pe schimbarea procentuală
    const volatility = Math.abs(percentChange / 100) * 0.5;
    
    // Generăm puncte de date pentru ultimele 24 de ore
    for (let i = 0; i < numPoints; i++) {
        // Progresul de la prețul inițial la cel curent (de la 0 la 1)
        const progress = i / (numPoints - 1);
        
        // Adăugăm un factor aleatoriu pentru a face graficul mai realist
        const randomFactor = Math.random() * 0.2 - 0.1; // +/- 10%
        const price = initialPrice + (currentPrice - initialPrice) * progress + initialPrice * randomFactor;
        
        data.push(Math.max(price, 0)); // Ne asigurăm că prețul nu este negativ
        
        // Generăm un timestamp pentru fiecare punct (mergem înapoi în timp)
        const pointTime = new Date(now);
        pointTime.setHours(now.getHours() - Math.floor((numPoints - i) * (24 / numPoints)));
        timestamps.push(pointTime);
        
        // Formatul pentru label: 'hh:mm'
        labels.push(pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        
        // Generăm date OHLC pentru fiecare interval
        const priceVariation = price * volatility * (Math.random() * 0.5 + 0.5);
        const open = Math.max(0, price - priceVariation * (Math.random() - 0.5));
        const close = price;
        const high = Math.max(open, close) + priceVariation * Math.random() * 0.3;
        const low = Math.min(open, close) - priceVariation * Math.random() * 0.3;
        
        ohlcData.push({
            x: pointTime,
            o: open,
            h: high,
            l: low,
            c: close
        });
    }
    
    return {
        labels: labels,
        data: data,
        timestamps: timestamps,
        ohlc: ohlcData
    };
}

// Funcție pentru a obține culorile din variabilele CSS
function getThemeColor(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

// Funcție pentru crearea unui grafic pentru o criptomonedă
function createChart(symbol, historicalData, percentChange) {
    const chartCanvas = document.getElementById(`${symbol}-chart`);
    if (!chartCanvas) return;
    
    // Curățăm orice grafic existent
    if (window[`${symbol}Chart`]) {
        window[`${symbol}Chart`].destroy();
    }
    
    // Obținem culorile din variabilele CSS în funcție de tema curentă
    const positiveColor = getThemeColor('--positive-color');
    const negativeColor = getThemeColor('--negative-color');
    
    // Stabilim culoarea liniei graficului în funcție de schimbarea procentuală
    const lineColor = percentChange >= 0 ? positiveColor : negativeColor;
    
    // Creăm un gradient pentru zona de sub linie
    const ctx = chartCanvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    
    if (percentChange >= 0) {
        gradient.addColorStop(0, `${positiveColor}15`); // Transparență redusă pentru aspect mai plat
        gradient.addColorStop(1, `${positiveColor}00`);
    } else {
        gradient.addColorStop(0, `${negativeColor}15`); // Transparență redusă pentru aspect mai plat
        gradient.addColorStop(1, `${negativeColor}00`);
    }
    
    // Funcție pentru formatarea valorilor în tooltip
    const formatTooltipValue = (value) => {
        if (value >= 1000) {
            return '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        } else if (value >= 1) {
            return '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        } else {
            return '$' + value.toLocaleString('en-US', {
                minimumFractionDigits: 4,
                maximumFractionDigits: 6
            });
        }
    };
    
    // Variabile pentru trasarea liniei verticale de crosshair
    let verticalLinePlugin = {
        id: 'verticalLine',
        afterDraw: (chart) => {
            if (chart.tooltip._active && chart.tooltip._active.length) {
                const activePoint = chart.tooltip._active[0];
                const ctx = chart.ctx;
                const x = activePoint.element.x;
                const topY = chart.scales.y.top;
                const bottomY = chart.scales.y.bottom;
                
                // Desenează linia verticală
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(x, topY);
                ctx.lineTo(x, bottomY);
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();
                ctx.restore();
            }
        }
    };
    
    // Configurăm și creăm graficul - folosim 'line' în loc de 'candlestick'
    window[`${symbol}Chart`] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: historicalData.labels,
            datasets: [{
                label: symbol,
                data: historicalData.data,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 1.5,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointBackgroundColor: lineColor,
                pointBorderColor: 'rgba(255, 255, 255, 0.8)',
                pointBorderWidth: 1.5,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(17, 25, 40, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: {
                        top: 8,
                        right: 12,
                        bottom: 8,
                        left: 12
                    },
                    cornerRadius: 6,
                    displayColors: false,
                    titleFont: {
                        size: 12,
                        weight: 'bold',
                        family: "'Arial', sans-serif"
                    },
                    bodyFont: {
                        size: 14,
                        weight: 'bold',
                        family: "'Arial', sans-serif"
                    },
                    callbacks: {
                        title: function(context) {
                            if (!context || !context.length) return '';
                            const tooltipData = context[0];
                            const index = tooltipData.dataIndex;
                            return historicalData.labels[index];
                        },
                        label: function(context) {
                            return 'Price: ' + formatTooltipValue(context.raw);
                        }
                    }
                },
                verticalLine: verticalLinePlugin
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                }
            }
        }
    });
}

// Funcție pentru preluarea datelor despre criptomonede de la CoinGecko
function fetchCryptoData() {
    // Folosim serverul proxy local pentru a evita problemele de rate limiting
    const localProxyUrl = 'http://127.0.0.1:5000/api/proxy?url=';
    const apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true&precision=2';
    
    // Verificăm dacă există un timestamp pentru ultima cerere API
    const lastApiCall = localStorage.getItem('lastApiCall');
    const now = Date.now();
    
    // Dacă am făcut o cerere în ultimele 60 secunde, folosim datele din cache
    if (lastApiCall && now - parseInt(lastApiCall) < 60000) {
        console.log("Folosim date din cache pentru a evita rate limiting");
        const cachedData = localStorage.getItem('cryptoData');
        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);
                processData(parsedData);
                return;
            } catch (e) {
                console.error("Eroare la parsarea datelor din cache:", e);
                // Continuăm cu cererea API
            }
        }
    }
    
    // Adăugăm un controller pentru a putea anula cererea după un timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secunde timeout
    
    // Marcăm timpul cererii API
    localStorage.setItem('lastApiCall', now.toString());
    
    console.log("Încercăm API-ul CryptoCompare prin proxy");
    
    // Încercăm întâi CryptoCompare via proxy
    fetch(localProxyUrl + encodeURIComponent('https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH&tsyms=USD'), {
        signal: controller.signal
    })
    .then(response => {
        clearTimeout(timeoutId);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Convertim datele de la CryptoCompare în formatul nostru
        if (data.RAW) {
            const btcData = data.RAW.BTC?.USD;
            const ethData = data.RAW.ETH?.USD;
            
            const processedData = [];
            
            if (btcData) {
                processedData.push({
                    id: 'bitcoin',
                    current_price: btcData.PRICE,
                    image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
                    total_volume: btcData.VOLUME24HOUR,
                    market_cap: btcData.MKTCAP,
                    price_change_percentage_24h: ((btcData.PRICE - btcData.OPEN24HOUR) / btcData.OPEN24HOUR) * 100
                });
            }
            
            if (ethData) {
                processedData.push({
                    id: 'ethereum',
                    current_price: ethData.PRICE,
                    image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
                    total_volume: ethData.VOLUME24HOUR,
                    market_cap: ethData.MKTCAP,
                    price_change_percentage_24h: ((ethData.PRICE - ethData.OPEN24HOUR) / ethData.OPEN24HOUR) * 100
                });
            }
            
            // Salvăm datele în cache
            localStorage.setItem('cryptoData', JSON.stringify(processedData));
            
            // Procesăm datele
            processData(processedData);
        } else {
            throw new Error('Format de date neașteptat de la CryptoCompare');
        }
    })
    .catch(cryptocompareError => {
        clearTimeout(timeoutId);
        console.warn("Eroare la CryptoCompare:", cryptocompareError);
        
        console.log("Încercăm CoinGecko prin proxy local");
        
        // Dacă CryptoCompare eșuează, încercăm direct endpoint-ul specific pentru prețuri din proxy
        fetch('http://127.0.0.1:5000/api/prices')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Procesăm datele direct dacă folosim endpoint-ul special pentru prețuri
            processData(data);
        })
        .catch(proxyError => {
            console.warn("Eroare la proxy-ul local:", proxyError);
            
            // Fallback la URL-ul CoinGecko prin proxy
            fetch(localProxyUrl + encodeURIComponent(apiUrl))
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Convertim datele de la CoinGecko în formatul nostru
                const processedData = [];
                
                if (data.bitcoin) {
                    processedData.push({
                        id: 'bitcoin',
                        current_price: data.bitcoin.usd,
                        image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
                        total_volume: data.bitcoin.usd_24h_vol || 0,
                        market_cap: 750000000000, // Aproximare
                        price_change_percentage_24h: data.bitcoin.usd_24h_change || 0
                    });
                }
                
                if (data.ethereum) {
                    processedData.push({
                        id: 'ethereum',
                        current_price: data.ethereum.usd,
                        image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
                        total_volume: data.ethereum.usd_24h_vol || 0,
                        market_cap: 265000000000, // Aproximare
                        price_change_percentage_24h: data.ethereum.usd_24h_change || 0
                    });
                }
                
                // Salvăm datele în cache
                localStorage.setItem('cryptoData', JSON.stringify(processedData));
                
                // Procesăm datele
                processData(processedData);
            })
            .catch(coingeckoError => {
                console.error("Eroare la CoinGecko prin proxy:", coingeckoError);
                useFallbackData();
            });
        });
    });
    
    // Funcție pentru procesarea datelor
    function processData(data) {
        if (!Array.isArray(data)) {
            console.error('Data received is not an array:', data);
            useFallbackData();
            return;
        }
        
        // Procesăm datele pentru Bitcoin
        const bitcoin = data.find(coin => coin.id === 'bitcoin');
        if (bitcoin) {
            updateCryptoCard('btc', bitcoin);
        }
        
        // Procesăm datele pentru Ethereum
        const ethereum = data.find(coin => coin.id === 'ethereum');
        if (ethereum) {
            updateCryptoCard('eth', ethereum);
        }
        
        // Orionix este tokenul nostru personalizat ERC-20 
        const orionixMockData = {
            current_price: 4.48,
            image: 'assets/orionix.jpg?v=1',
            total_volume: 138300,
            market_cap: 4480000, // 1,000,000 supply × $4.48
            price_change_percentage_24h: 2.51
        };
        updateCryptoCard('orx', orionixMockData);
    }
    
    // Funcție pentru folosirea datelor de backup în caz de eșec
    function useFallbackData() {
        // În caz de eroare, afișăm date exemplificative
        const mockBitcoin = {
            current_price: 95940,
            image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
            total_volume: 21900000000,
            market_cap: 750000000000,
            price_change_percentage_24h: -1.03
        };
        
        const mockEthereum = {
            current_price: 1825.0,
            image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
            total_volume: 462900000,
            market_cap: 265000000000,
            price_change_percentage_24h: -0.47
        };
        
        const orionixMockData = {
            current_price: 4.48,
            image: 'assets/orionix.jpg?v=1',
            total_volume: 138300,
            market_cap: 4480000, // 1,000,000 supply × $4.48
            price_change_percentage_24h: 2.51
        };
        
        updateCryptoCard('btc', mockBitcoin);
        updateCryptoCard('eth', mockEthereum);
        updateCryptoCard('orx', orionixMockData);
        
        // Afișăm o notificare pentru utilizator
        showCenterAlert("Nu am putut obține date actualizate de la API. Se folosesc date offline.", false, 5000);
    }
}

// Funcție pentru actualizarea unui card crypto
function updateCryptoCard(symbol, data) {
    // Actualizăm iconița dacă este furnizată
    const iconElement = document.getElementById(`${symbol}-icon`);
    if (iconElement && data.image) {
        iconElement.src = data.image;
    }
    
    // Actualizăm prețul
    const priceElement = document.getElementById(`${symbol}-price`);
    if (priceElement) {
        if (symbol === 'btc') {
            priceElement.textContent = '$' + Math.round(data.current_price).toLocaleString('en-US');
        } else if (symbol === 'eth') {
            priceElement.textContent = '$' + data.current_price.toLocaleString('en-US', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
            });
        } else {
            priceElement.textContent = '$' + data.current_price.toFixed(2);
        }
    }
    
    // Generăm date istorice pentru grafic
    const historicalData = generateHistoricalData(data.current_price, data.price_change_percentage_24h);
    
    // Creăm sau actualizăm graficul
    createChart(symbol, historicalData, data.price_change_percentage_24h);
    
    // Actualizăm volumul
    const volumeElement = document.getElementById(`${symbol}-volume`);
    if (volumeElement) {
        if (symbol === 'btc') {
            volumeElement.textContent = '21.6K';
        } else if (symbol === 'eth') {
            volumeElement.textContent = '9.1K';
        } else {
            volumeElement.textContent = '138.3K';
        }
    }
    
    // Actualizăm schimbarea în 24h
    const changeElement = document.getElementById(`${symbol}-change`);
    if (changeElement) {
        let changeValue, formattedChange;
        
        if (symbol === 'btc') {
            changeValue = -1.03;
            formattedChange = '-1.03%';
        } else if (symbol === 'eth') {
            changeValue = -0.47;
            formattedChange = '-0.47%';
        } else {
            changeValue = 2.51;
            formattedChange = '+2.51%';
        }
        
        changeElement.textContent = formattedChange;
        
        // Adăugăm clase pentru colorarea textului în funcție de valoare
        if (changeValue >= 0) {
            changeElement.classList.add('change-positive');
            changeElement.classList.remove('change-negative');
        } else {
            changeElement.classList.add('change-negative');
            changeElement.classList.remove('change-positive');
        }
    }
}

// Funcție pentru inițializarea funcționalității de comparare
function initCryptoCompare() {
    const cryptoSelect = document.getElementById('crypto-compare-select');
    if (!cryptoSelect) return;
    
    // Obiect cu date pentru fiecare criptomonedă, inclusiv Orionix
    const cryptoData = {
        orionix: {
            name: 'Orionix',
            symbol: 'ORX',
            price: 4.25,
            change: 1.22,
            volume: '138.32M',
            marketCap: '147,000,000',
            color: '#10b981',
            icon: 'assets/orionix.jpg?v=1'
        },
        bitcoin: {
            name: 'Bitcoin',
            symbol: 'BTC',
            price: 86037.88,
            change: 1.22,
            volume: '27.28B',
            marketCap: '1.63T',
            color: '#f7931a',
            icon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png'
        },
        ethereum: {
            name: 'Ethereum',
            symbol: 'ETH',
            price: 3401.98,
            change: 0.77,
            volume: '18.65B',
            marketCap: '409.22B',
            color: '#627eea',
            icon: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png'
        },
        litecoin: {
            name: 'Litecoin',
            symbol: 'LTC',
            price: 75.23,
            change: -1.53,
            volume: '528.46M',
            marketCap: '5.59B',
            color: '#bfbbbb',
            icon: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png'
        },
        ripple: {
            name: 'XRP',
            symbol: 'XRP',
            price: 0.59,
            change: 2.35,
            volume: '1.92B',
            marketCap: '31.93B',
            color: '#23292f',
            icon: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png'
        },
        cardano: {
            name: 'Cardano',
            symbol: 'ADA',
            price: 0.45,
            change: -0.23,
            volume: '452.21M',
            marketCap: '15.77B',
            color: '#3cc8c8',
            icon: 'https://assets.coingecko.com/coins/images/975/small/cardano.png'
        },
        solana: {
            name: 'Solana',
            symbol: 'SOL',
            price: 145.82,
            change: 3.79,
            volume: '3.21B',
            marketCap: '64.87B',
            color: '#00ffa3',
            icon: 'https://assets.coingecko.com/coins/images/4128/small/solana.png'
        }
    };
    
    // Inițializăm graficele pentru Orionix (stânga)
    updateCompareChart('orx-compare-chart', generateCompareChartData(4.25, 1.22), '#10b981');
    
    // Inițializăm graficele pentru moneda selectată din dropdown (dreapta)
    updateCompareChart('compare-coin-chart', generateCompareChartData(86037.88, 1.22), '#f7931a');
    
    // Adăugăm event listener pentru schimbarea monedei de comparație
    cryptoSelect.addEventListener('change', function() {
        const selectedCoin = this.value;
        const coinData = cryptoData[selectedCoin];
        
        if (!coinData) return;
        
        // Actualizăm iconul monedei
        const coinIcon = document.getElementById('compare-coin-icon');
        if (coinIcon) coinIcon.src = coinData.icon;
        
        // Actualizăm simbolul monedei
        const coinSymbol = document.getElementById('compare-coin-symbol');
        if (coinSymbol) coinSymbol.textContent = coinData.symbol;
        
        // Actualizăm prețul
        const coinPrice = document.getElementById('compare-coin-price');
        if (coinPrice) {
            if (coinData.price >= 1000) {
                coinPrice.textContent = '$' + coinData.price.toLocaleString();
            } else if (coinData.price >= 1) {
                coinPrice.textContent = '$' + coinData.price.toFixed(2);
            } else {
                coinPrice.textContent = '$' + coinData.price.toFixed(4);
            }
        }
        
        // Actualizăm schimbarea procentuală
        const coinChange = document.getElementById('compare-coin-change');
        if (coinChange) {
            coinChange.textContent = (coinData.change >= 0 ? '+' : '') + coinData.change.toFixed(2) + '%';
            coinChange.className = 'change-badge ' + (coinData.change >= 0 ? 'positive' : 'negative');
        }
        
        // Actualizăm volumul
        const coinVolume = document.getElementById('compare-coin-volume');
        if (coinVolume) coinVolume.textContent = '$' + coinData.volume;
        
        // Actualizăm market cap
        const coinMcap = document.getElementById('compare-coin-mcap');
        if (coinMcap) coinMcap.textContent = '$' + coinData.marketCap;
        
        // Actualizăm graficul
        updateCompareChart('compare-coin-chart', generateCompareChartData(coinData.price, coinData.change), coinData.color);
    });
}

// Funcție pentru generarea datelor de grafic pentru comparare
function generateCompareChartData(currentPrice, percentChange) {
    const hours = 24;
    const points = hours * 3; // Mai multe puncte pentru grafice mai netede
    
    // Calculăm prețul inițial pe baza schimbării procentuale
    const initialPrice = currentPrice / (1 + percentChange / 100);
    
    // Generăm datele pentru grafic
    const labels = [];
    const prices = [];
    const now = new Date();
    
    // Generăm un "seed" constant pentru a obține aceeași variație aleatorie de fiecare dată
    const seed = currentPrice * 10000;
    
    for (let i = 0; i < points; i++) {
        // Calculăm timpul pentru punctul curent (înapoi în timp)
        const pointTime = new Date(now);
        pointTime.setHours(now.getHours() - Math.floor(hours * (1 - i / points)));
        
        // Adăugăm eticheta de timp în format "HH:00"
        if (i % 3 === 0) { // Afișăm doar fiecare a 3-a etichetă pentru claritate
            labels.push(pointTime.getHours().toString().padStart(2, '0') + ':00');
        } else {
            labels.push('');
        }
        
        // Calculăm progresul (0 la început, 1 la final)
        const progress = i / (points - 1);
        
        // Folosim un pseudo-random deterministic bazat pe poziție și seed
        const pseudoRandom = Math.sin(i * seed) * 0.5 + 0.5;
        const variationFactor = pseudoRandom * 0.06 - 0.03; // ±3%
        
        // Calculăm prețul pentru acest punct cu o curbă care include volatilitate
        let basePrice = initialPrice + Math.pow(progress, 1.2) * (currentPrice - initialPrice);
        // Adăugăm o undă sinusoidală pentru a simula fluctuațiile
        let wave = Math.sin(i * 0.4) * currentPrice * 0.01;
        // Adăugăm o a doua undă sinusoidală de frecvență mai mare pentru mai multă variație
        let smallerWave = Math.sin(i * 1.5) * currentPrice * 0.005;
        
        // Combinăm totul
        let price = basePrice + wave + smallerWave;
        price = price * (1 + variationFactor);
        
        // Ne asigurăm că ultimul punct este exact prețul actual
        if (i === points - 1) {
            price = currentPrice;
        }
        
        prices.push(price);
    }
    
    return {
        labels: labels,
        prices: prices
    };
}

// Funcție pentru actualizarea graficului de comparare
function updateCompareChart(chartId, data, lineColor) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        console.error(`Elementul canvas cu id-ul ${chartId} nu există!`);
        return;
    }
    
    // Verificăm dacă Chart.js este disponibil
    if (typeof Chart === 'undefined') {
        console.error('Chart.js nu este disponibil! Încărcăm biblioteca din nou.');
        
        // Încărcăm Chart.js dinamic dacă nu este deja încărcat
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = function() {
            console.log('Chart.js a fost încărcat cu succes, inițializăm graficul.');
            setTimeout(() => createCompareChart(chartId, data, lineColor), 200);
        };
        document.head.appendChild(script);
        return;
    }
    
    // Creăm graficul
    createCompareChart(chartId, data, lineColor);
}

// Funcție separată pentru crearea graficului
function createCompareChart(chartId, data, lineColor) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    // Curățăm orice grafic existent cu verificare
    if (window[chartId] && typeof window[chartId].destroy === 'function') {
        window[chartId].destroy();
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error(`Nu s-a putut obține contextul 2D pentru canvas-ul ${chartId}`);
        return;
    }
    
    // Resetăm canvas-ul pentru a preveni probleme de redare
    canvas.width = canvas.offsetWidth || 400;
    canvas.height = canvas.offsetHeight || 200;
    
    // Creăm un gradient pentru zona de sub linie
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, `${lineColor}40`); // Mai vizibil
    gradient.addColorStop(0.7, `${lineColor}10`);
    gradient.addColorStop(1, `${lineColor}00`);
    
    // Determinăm min și max pentru axele Y pentru a avea spațiu suficient
    let minPrice = Math.min(...data.prices) * 0.995;
    let maxPrice = Math.max(...data.prices) * 1.005;
    
    try {
        // Configurăm graficul
        window[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Price',
                    data: data.prices,
                    borderColor: lineColor,
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHitRadius: 30,
                    pointHoverBackgroundColor: lineColor,
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: 5,
                        right: 5,
                        top: 10,
                        bottom: 10
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        titleFont: {
                            size: 12,
                            family: "'Arial', sans-serif"
                        },
                        bodyFont: {
                            size: 14,
                            weight: 'bold',
                            family: "'Arial', sans-serif"
                        },
                        padding: {
                            top: 10,
                            right: 15,
                            bottom: 10,
                            left: 15
                        },
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                let value = context.raw;
                                if (value >= 1000) {
                                    return '$' + value.toLocaleString('en-US', {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    });
                                } else if (value >= 1) {
                                    return '$' + value.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2
                                    });
                                } else {
                                    return '$' + value.toLocaleString('en-US', {
                                        minimumFractionDigits: 4,
                                        maximumFractionDigits: 6
                                    });
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: 'rgba(148, 163, 184, 0.7)',
                            font: {
                                size: 10,
                                family: "'Arial', sans-serif"
                            },
                            maxRotation: 0,
                            maxTicksLimit: 8,
                            padding: 5
                        }
                    },
                    y: {
                        display: true,
                        position: 'right',
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                            drawBorder: false,
                            lineWidth: 0.5
                        },
                        min: minPrice,
                        max: maxPrice,
                        ticks: {
                            color: 'rgba(148, 163, 184, 0.7)',
                            font: {
                                size: 10,
                                family: "'Arial', sans-serif"
                            },
                            padding: 8,
                            callback: function(value) {
                                if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(1) + 'k';
                                } else if (value >= 1) {
                                    return '$' + value.toFixed(0);
                                } else {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 0,
                        hitRadius: 10
                    },
                    line: {
                        borderJoinStyle: 'round'
                    }
                },
                animations: {
                    tension: {
                        duration: 1000,
                        easing: 'linear'
                    }
                }
            },
            plugins: [{
                id: 'customCanvasBackgroundColor',
                beforeDraw: (chart) => {
                    const ctx = chart.canvas.getContext('2d');
                    ctx.save();
                    ctx.globalCompositeOperation = 'destination-over';
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            }]
        });
        
        console.log(`Graficul ${chartId} a fost creat cu succes.`);
    } catch (error) {
        console.error(`A apărut o eroare la crearea graficului ${chartId}:`, error);
    }
}

// Adaug o funcție de debug pentru a ne asigura că graficele sunt inițializate corect
function fixInitCompareCharts() {
    console.log("Verificăm și inițializăm graficele de comparare...");
    
    // Verificăm dacă sunt elemente canvas în DOM
    const orxChart = document.getElementById('orx-compare-chart');
    const compareChart = document.getElementById('compare-coin-chart');
    
    if (!orxChart || !compareChart) {
        console.error("Nu s-au găsit elementele canvas pentru grafice");
        return;
    }
    
    console.log("Canvas-uri găsite, inițializăm graficele...");
    
    // Forțăm inițializarea graficelor
    const orxData = generateCompareChartData(4.25, 1.22);
    updateCompareChart('orx-compare-chart', orxData, '#10b981');
    
    const btcData = generateCompareChartData(86037.88, 1.22);
    updateCompareChart('compare-coin-chart', btcData, '#f7931a');
    
    console.log("Graficele au fost inițializate");
}

// Funcție separată pentru actualizarea UI în funcție de starea autentificării
function updateUIForAuthState(user) {
    console.log("Actualizare UI pentru starea de autentificare:", user ? "utilizator logat" : "utilizator nelogat");
    
    // --- DESKTOP ---
    const userInfo = document.getElementById('user-info-desktop');
    const userPhoto = document.getElementById('user-photo-desktop');
    const userName = document.getElementById('user-name-desktop');
    let logoutBtn = document.getElementById('logoutBtnDesktop');
    const authBtns = document.querySelector('.auth-buttons.desktop');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    // --- MOBILE ---
    // Disable mobile user info section to prevent duplication
    const authBtnsMobile = document.querySelector('.auth-buttons.mobile');
    const loginBtnMobile = document.getElementById('loginBtnMobile');
    const signupBtnMobile = document.getElementById('signupBtnMobile');
    
    // Verificăm dacă suntem pe pagina de login sau signup
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html');
    
    if (user) {
        // Utilizator logat
        console.log("Utilizator logat:", user.email, "DisplayName:", user.displayName);
        
        // Desktop
        if (userInfo) {
            userInfo.style.display = "flex";
            console.log("User info display set to flex");
        }
        if (userName) {
            userName.textContent = user.displayName || user.email.split('@')[0];
            console.log("User name set to:", userName.textContent);
        }
        if (userPhoto) {
            userPhoto.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email.split('@')[0])}&background=random`;
            userPhoto.style.display = "block";
            console.log("User photo src set to:", userPhoto.src);
        }
        if (logoutBtn) {
            // Eliminăm orice event listener existent pentru a evita duplicarea
            const newLogoutBtn = logoutBtn.cloneNode(true);
            logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
            logoutBtn = newLogoutBtn;
            logoutBtn.style.display = "block";
            
            logoutBtn.addEventListener('click', function() {
                if (window.firebaseAuth) {
                    window.firebaseAuth.signOut().then(() => {
                        window.showCenterAlert('Ai fost delogat cu succes!');
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    });
                } else {
                    console.error("firebaseAuth nu este disponibil");
                }
            });
            console.log("Logout button displayed and event listener added");
        }
        if (authBtns) {
            authBtns.style.display = "none";
            console.log("Auth buttons hidden");
        }
        
        // Hide mobile auth buttons when user is logged in
        if (authBtnsMobile) authBtnsMobile.style.display = "none";
        
        // Dacă suntem pe pagina de login sau signup, redirecționăm către pagina principală
        if (isAuthPage) {
            console.log("Suntem pe o pagină de autentificare dar utilizatorul este deja autentificat, redirecționăm...");
            setTimeout(() => {
                window.location.href = currentPath.includes('/pages/') ? '../index.html' : 'index.html';
            }, 500);
        }
    } else {
        // Utilizator nelogat
        console.log("Niciun utilizator logat");
        
        // Desktop
        if (userInfo) userInfo.style.display = "none";
        if (userPhoto) userPhoto.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "none";
        // Forțăm afișarea butoanelor de autentificare pe toate paginile
        if (authBtns) {
            authBtns.style.display = "flex";
            // Asigurăm-ne că butoanele individual sunt vizibile
            if (loginBtn) loginBtn.style.display = "inline-block";
            if (signupBtn) signupBtn.style.display = "inline-block";
        }
        
        // Show mobile auth buttons when user is logged out
        if (authBtnsMobile) {
            authBtnsMobile.style.display = "flex";
            // Asigurăm-ne că butoanele individual sunt vizibile
            if (loginBtnMobile) loginBtnMobile.style.display = "inline-block";
            if (signupBtnMobile) signupBtnMobile.style.display = "inline-block";
        }
    }
    
    // Păstrăm butoanele vizibile pe paginile de login și signup
    if (isAuthPage && !user) {
        if (authBtns) authBtns.setAttribute('style', 'display: flex !important');
        if (loginBtn) loginBtn.setAttribute('style', 'display: inline-block !important');
        if (signupBtn) signupBtn.setAttribute('style', 'display: inline-block !important');
        
        if (authBtnsMobile) authBtnsMobile.setAttribute('style', 'display: flex !important');
        if (loginBtnMobile) loginBtnMobile.setAttribute('style', 'display: inline-block !important');
        if (signupBtnMobile) signupBtnMobile.setAttribute('style', 'display: inline-block !important');
    }
}

// Funcție pentru actualizarea temei modalelor
function updateModalsTheme(theme) {
    // Actualizăm modalul de detalii criptomonedă
    const coinModal = document.getElementById('coinModal');
    if (coinModal) {
        coinModal.classList.remove('light-theme', 'dark-theme');
        coinModal.classList.add(theme + '-theme');
    }
    
    // Actualizăm și alte modale dacă există
    const alertModal = document.querySelector('.alert-modal');
    if (alertModal) {
        alertModal.classList.remove('light-theme', 'dark-theme');
        alertModal.classList.add(theme + '-theme');
    }
}

// Function to check if user is logged in and redirect if not
function checkAuthAndRedirect() {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || currentPath.includes('signup.html');
    const isWalletPage = currentPath.includes('wallet.html');
    const isTradePage = currentPath.includes('trade.html');
    
    // If we're on wallet or trade page and not logged in, redirect to login
    if ((isWalletPage || isTradePage) && !auth.currentUser) {
        const isInPagesDir = window.location.pathname.includes('/pages/');
        const loginPath = isInPagesDir ? 'login.html' : 'pages/login.html';
        window.location.href = loginPath;
    }
}