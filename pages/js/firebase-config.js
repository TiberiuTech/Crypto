// pages/js/firebase-config.js
// Implementăm o versiune simulată a Firebase Auth pentru demo
console.log("Inițializare Firebase Auth simplificat...");

class SimpleAuth {
  constructor() {
    this.currentUser = null;
    this._listeners = [];
    this._checkLocalStorage();
    
    // Adăugăm un verificator la fiecare 2 secunde pentru a menține sincronizarea
    // între taburi/ferestre
    setInterval(() => this._checkLocalStorage(), 2000);
    
    // Adăugăm un listener pentru storage events pentru a sincroniza între taburi
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        this._checkLocalStorage();
      }
    });
  }
  
  _checkLocalStorage() {
    // Verificăm dacă există un utilizator în localStorage
    const savedUser = localStorage.getItem('user');
    const currentUserStr = this.currentUser ? JSON.stringify(this.currentUser) : null;
    
    if (savedUser && (!this.currentUser || savedUser !== currentUserStr)) {
      try {
        this.currentUser = JSON.parse(savedUser);
        // Notificăm toți ascultătorii despre schimbarea stării
        this._notifyListeners(this.currentUser);
        console.log("Utilizator restaurat din localStorage:", this.currentUser.email);
      } catch (e) {
        console.error("Eroare la parsarea utilizatorului din localStorage", e);
        localStorage.removeItem('user');
      }
    } else if (!savedUser && this.currentUser) {
      // Utilizatorul a fost delogat în alt tab
      this.currentUser = null;
      this._notifyListeners(null);
      console.log("Utilizator delogat (localStorage gol)");
    }
  }
  
  _notifyListeners(user) {
    this._listeners.forEach(listener => {
      try {
        listener(user);
      } catch (e) {
        console.error("Eroare în listener auth", e);
      }
    });
  }
  
  onAuthStateChanged(listener) {
    this._listeners.push(listener);
    // Apelăm imediat listener-ul cu starea curentă
    listener(this.currentUser);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }
  
  async signInWithEmailAndPassword(email, password) {
    // Simulăm verificarea credențialelor
    // Într-o implementare reală, acestea ar fi verificate pe server
    
    console.log("Încercare de autentificare cu:", email);
    
    // Pentru demo, autentificăm orice user/password
    const user = {
      uid: 'user_' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
    };
    
    // Salvăm în localStorage
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser = user;
    
    // Notificăm toți ascultătorii
    this._notifyListeners(user);
    
    return user;
  }
  
  async signOut() {
    localStorage.removeItem('user');
    this.currentUser = null;
    this._notifyListeners(null);
  }
  
  async createUserWithEmailAndPassword(email, password) {
    // Simulăm crearea unui cont nou
    console.log("Creare cont nou pentru:", email);
    
    const user = {
      uid: 'user_' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: false,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
    };
    
    // Salvăm în localStorage
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser = user;
    
    // Notificăm toți ascultătorii
    this._notifyListeners(user);
    
    return { user };
  }
}

// Creăm instanța simplificată a autentificării
const auth = new SimpleAuth();

// Simulăm variabile și funcții Firebase
const firebase = {
  auth: () => auth
};

// Expunem instanța de autentificare
window.firebaseAuth = auth;

// Expunem funcții pentru a actualiza profilul utilizatorului
function updateUserProfile(displayName, photoURL) {
  if (auth.currentUser) {
    auth.currentUser.displayName = displayName || auth.currentUser.displayName;
    auth.currentUser.photoURL = photoURL || auth.currentUser.photoURL;
    
    // Actualizăm în localStorage
    localStorage.setItem('user', JSON.stringify(auth.currentUser));
    
    // Notificăm ascultătorii
    auth._notifyListeners(auth.currentUser);
    
    return Promise.resolve();
  }
  return Promise.resolve();
}

window.updateUserProfile = updateUserProfile; 