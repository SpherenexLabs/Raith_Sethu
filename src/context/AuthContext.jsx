import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { auth, database } from '../config/firebase';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for admin user in localStorage first
    const adminUser = localStorage.getItem('adminUser');
    if (adminUser) {
      try {
        setUser(JSON.parse(adminUser));
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('adminUser');
      }
    }

    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user data from Realtime Database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          const snapshot = await get(userRef);

          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...userData
            });
          } else {
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to load user profile from database:', error);
        // Still set user so they aren't stuck in a permanent loading state
        if (firebaseUser) {
          setUser({ uid: firebaseUser.uid, email: firebaseUser.email });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, additionalData) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Save additional user data to Realtime Database
      const userData = {
        email: email,
        password: password,
        name: additionalData.name || '',
        role: additionalData.role || 'farmer',
        phone: additionalData.phone || '',
        location: additionalData.location || '',
        latitude: additionalData.latitude || '',
        longitude: additionalData.longitude || '',
        createdAt: new Date().toISOString(),
      };

      await set(ref(database, `users/${firebaseUser.uid}`), userData);

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        ...userData
      });

      return { success: true, user: firebaseUser };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      // Check for admin credentials first
      if (email === 'admin@farmmanagement.com' && password === 'admin123') {
        const adminUser = {
          uid: 'admin-001',
          email: 'admin@farmmanagement.com',
          name: 'Admin',
          role: 'admin'
        };
        setUser(adminUser);
        localStorage.setItem('adminUser', JSON.stringify(adminUser));
        return { success: true, user: adminUser };
      }

      // Regular Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Fetch user data from Realtime Database
      const userRef = ref(database, `users/${firebaseUser.uid}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const userData = snapshot.val();
        const fullUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          ...userData
        };
        setUser(fullUser);
        return { success: true, user: fullUser };
      }

      return { success: true, user: { uid: firebaseUser.uid, email: firebaseUser.email } };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      // Check if admin user
      if (user?.uid === 'admin-001') {
        localStorage.removeItem('adminUser');
        setUser(null);
        return { success: true };
      }
      
      // Regular Firebase logout
      await signOut(auth);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    signup,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
