import { createContext, useEffect, useState } from "react";
import { auth, db } from "../firebase/firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export const UserContext = createContext();

const UserContextProvider = (props) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleConnectionChange = () => setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);

  // Set persistence to local on initialization
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence)
      .catch(error => console.error("Error setting persistence:", error));
  }, []);

  // Create/update user profile in Firestore
  const createUserProfile = async (user, extraData = {}) => {
    if (!user || isOffline) return null;
    
    try {
      const userRef = doc(db, "users", user.uid);
      const userData = {
        name: extraData.name || user.displayName || user.email?.split('@')[0] || "User",
        email: user.email,
        createdAt: extraData.createdAt || new Date(),
        favorites: extraData.favorites || []
      };
      
      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return null;
    }
  };

  // Register a new user
  const register = async (email, password, name) => {
    if (isOffline) throw new Error("You are offline. Please check your connection and try again.");
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user, { name });
    return userCredential.user;
  };

  // Login existing user
  const login = async (email, password) => {
    if (isOffline) throw new Error("You are offline. Please check your connection and try again.");
    return (await signInWithEmailAndPassword(auth, email, password)).user;
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    if (isOffline) throw new Error("You are offline. Please check your connection and try again.");
    
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore, create if they don't
    const userRef = doc(db, "users", result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await createUserProfile(result.user);
    }
    
    return result.user;
  };

  // Logout user
  const logout = () => signOut(auth);

  // Manage favorites with offline handling
  const manageFavorites = async (coinId, action) => {
    if (!currentUser) return false;
    if (isOffline) throw new Error("You are offline. Changes will not be saved.");
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const favorites = userData.favorites || [];
        
        let updatedFavorites = favorites;
        if (action === 'add' && !favorites.includes(coinId)) {
          updatedFavorites = [...favorites, coinId];
        } else if (action === 'remove') {
          updatedFavorites = favorites.filter(id => id !== coinId);
        } else {
          return false; // No change needed
        }
        
        await setDoc(userRef, { ...userData, favorites: updatedFavorites });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error ${action === 'add' ? 'adding to' : 'removing from'} favorites:`, error);
      throw error;
    }
  };

  // Add to favorites (wrapper function)
  const addToFavorites = (coinId) => manageFavorites(coinId, 'add');
  
  // Remove from favorites (wrapper function)
  const removeFromFavorites = (coinId) => manageFavorites(coinId, 'remove');

  // Check if a coin is in favorites
  const checkFavoriteStatus = async (coinId) => {
    if (!currentUser) return false;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const favorites = userDoc.data().favorites || [];
        return favorites.includes(coinId);
      }
      return false;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      return false;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          } else if (!isOffline) {
            // Create user profile if it doesn't exist
            const newProfile = await createUserProfile(user);
            setUserProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOffline]);

  const value = {
    currentUser,
    userProfile,
    loading,
    isOffline,
    register,
    login,
    logout,
    signInWithGoogle,
    addToFavorites,
    removeFromFavorites,
    checkFavoriteStatus
  };

  return (
    <UserContext.Provider value={value}>
      {props.children}
    </UserContext.Provider>
  );
};

export default UserContextProvider;