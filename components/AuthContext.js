'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    var unsubscribe = onAuthStateChanged(auth, function(u) {
      setUser(u);
      setLoading(false);
    });
    return function() { unsubscribe(); };
  }, []);

  var login = async function() {
    try {
      var result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (err) {
      console.error('Login error:', err);
      return null;
    }
  };

  var logout = async function() {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  var saveRoadmap = async function(profile, completedCourses) {
    if (!user) return;
    try {
      var ref = doc(db, 'users', user.uid);
      var data = {
        name: user.displayName,
        email: user.email,
        profile: JSON.parse(JSON.stringify(profile)),
        completedCourses: completedCourses || {},
        updatedAt: new Date().toISOString(),
      };
      var existing = await getDoc(ref);
      if (existing.exists()) {
        await updateDoc(ref, data);
      } else {
        data.createdAt = new Date().toISOString();
        await setDoc(ref, data);
      }
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  var loadRoadmap = async function() {
    if (!user) return null;
    try {
      var ref = doc(db, 'users', user.uid);
      var snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      console.error('Load error:', err);
      return null;
    }
  };

  var saveProgress = async function(completedCourses) {
    if (!user) return;
    try {
      var ref = doc(db, 'users', user.uid);
      await updateDoc(ref, {
        completedCourses: completedCourses,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Save progress error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, saveRoadmap, loadRoadmap, saveProgress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
