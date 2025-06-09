// Funcție pentru verificarea stării de autentificare
window.isAuthenticated = function() {
    return localStorage.getItem('userToken') !== null;
}

// Funcție pentru protejarea rutelor
function protectRoute() {
    if (!isAuthenticated()) {
        // Salvăm pagina curentă pentru a reveni după autentificare
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        // Redirecționăm către pagina de login
        window.location.href = '/pages/login.html';
    }
}

// Funcție pentru setarea token-ului după autentificare
function setAuthToken(token) {
    localStorage.setItem('userToken', token);
}

// Funcție pentru ștergerea token-ului la delogare
function logout() {
    localStorage.removeItem('userToken');
    window.location.href = '/pages/login.html';
} 