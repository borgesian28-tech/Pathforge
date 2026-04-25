'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState({ tier: 'free', status: null });
  const [subLoading, setSubLoading] = useState(false);

  useEffect(function() {
    var unsubscribe = onAuthStateChanged(auth, function(u) {
      setUser(u);
      setLoading(false);
    });
    return function() { unsubscribe(); };
  }, []);

  // Fetch subscription status when user changes
  useEffect(function() {
    if (user) {
      setSubLoading(true);
      fetch('/api/subscription-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        setSubscription(data);
        setSubLoading(false);
      })
      .catch(function() {
        setSubscription({ tier: 'free', status: null });
        setSubLoading(false);
      });
    } else {
      setSubscription({ tier: 'free', status: null });
    }
  }, [user]);

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
      setSubscription({ tier: 'free', status: null });
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

  // Clear the user's saved roadmap from Firestore. Preserves the user doc itself
  // (and its subscription field) by using updateDoc with field deletions, rather than
  // deleting the whole doc — that way subscription state survives a "start over".
  var deleteRoadmap = async function() {
    if (!user) return false;
    try {
      var ref = doc(db, 'users', user.uid);
      var snap = await getDoc(ref);
      if (!snap.exists()) return true;
      var existing = snap.data() || {};
      // If the doc only holds a roadmap (no subscription), just delete it cleanly.
      if (!existing.subscription) {
        await deleteDoc(ref);
        return true;
      }
      // Otherwise overwrite with a doc that keeps subscription + identity but drops the roadmap.
      var preserved = {
        name: existing.name || (user && user.displayName) || null,
        email: existing.email || (user && user.email) || null,
        subscription: existing.subscription,
        createdAt: existing.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(ref, preserved);
      return true;
    } catch (err) {
      console.error('Delete roadmap error:', err);
      return false;
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

  var startCheckout = async function(plan, billing) {
    if (!user) return;
    try {
      var res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan,
          billing: billing,
          userId: user ? user.uid : null,
          userEmail: user ? user.email : null,
        }),
      });
      var data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  var openPortal = async function() {
    if (!subscription.customerId) return;
    try {
      var res = await fetch('/api/create-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: subscription.customerId }),
      });
      var data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    }
  };

  var refreshSubscription = function() {
    if (!user) return;
    fetch('/api/subscription-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.uid }),
    })
    .then(function(res) { return res.json(); })
    .then(function(data) { setSubscription(data); })
    .catch(function() {});
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      saveRoadmap, loadRoadmap, deleteRoadmap, saveProgress,
      subscription, subLoading, startCheckout, openPortal, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
