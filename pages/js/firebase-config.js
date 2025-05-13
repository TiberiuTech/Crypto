console.log("Initializing Firebase Auth simplified...");

class SimpleAuth {
  constructor() {
    this.currentUser = null;
    this._listeners = [];
    this._checkLocalStorage();
    
    setInterval(() => this._checkLocalStorage(), 2000);
    
    window.addEventListener('storage', (event) => {
      if (event.key === 'user') {
        this._checkLocalStorage();
      }
    });
  }
  
  _checkLocalStorage() {
    const savedUser = localStorage.getItem('user');
    const currentUserStr = this.currentUser ? JSON.stringify(this.currentUser) : null;
    
    if (savedUser && (!this.currentUser || savedUser !== currentUserStr)) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this._notifyListeners(this.currentUser);
        console.log("User restored from localStorage:", this.currentUser.email);
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
        localStorage.removeItem('user');
      }
    } else if (!savedUser && this.currentUser) {
      this.currentUser = null;
      this._notifyListeners(null);
      console.log("User logged out (localStorage empty)");
    }
  }
  
  _notifyListeners(user) {
    this._listeners.forEach(listener => {
      try {
        listener(user);
      } catch (e) {
        console.error("Error in auth listener", e);
      }
    });
  }
  
  onAuthStateChanged(listener) {
    this._listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }
  
  async signInWithEmailAndPassword(email, password) {
    console.log("Attempting to sign in with:", email);
    
    const user = {
      uid: 'user_' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: true,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser = user;
    
    this._notifyListeners(user);
    
    return user;
  }
  
  async signOut() {
    localStorage.removeItem('user');
    this.currentUser = null;
    this._notifyListeners(null);
  }
  
  async createUserWithEmailAndPassword(email, password) {
    console.log("Creating new account for:", email);
    
    const user = {
      uid: 'user_' + Date.now(),
      email: email,
      displayName: email.split('@')[0],
      emailVerified: false,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=random`
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser = user;
    
    this._notifyListeners(user);
    
    return { user };
  }
}

const auth = new SimpleAuth();

const firebase = {
  auth: () => auth
};

window.firebaseAuth = auth;

function updateUserProfile(displayName, photoURL) {
  if (auth.currentUser) {
    auth.currentUser.displayName = displayName || auth.currentUser.displayName;
    auth.currentUser.photoURL = photoURL || auth.currentUser.photoURL;
    
    localStorage.setItem('user', JSON.stringify(auth.currentUser));
    
    auth._notifyListeners(auth.currentUser);
    
    return Promise.resolve();
  }
  return Promise.resolve();
}

window.updateUserProfile = updateUserProfile; 