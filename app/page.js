'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import LandingPage from '@/components/LandingPage';
import OnboardingFlow from '@/components/OnboardingFlow';
import LoadingScreen from '@/components/LoadingScreen';
import Dashboard from '@/components/Dashboard';
import HighSchoolDashboard from '@/components/HighSchoolDashboard';

export default function Home() {
  const { user, loading: authLoading, login, logout, saveRoadmap, loadRoadmap, subscription, refreshSubscription } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [loadingError, setLoadingError] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const lastRequest = useRef(null);

  // Handle Stripe checkout redirect
  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Refresh subscription status after successful checkout
      setTimeout(function() { refreshSubscription(); }, 2000);
      window.history.replaceState({}, '', '/');
    }
    if (params.get('canceled') === 'true') {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // If user is logged in and has a saved roadmap, skip landing page
  useEffect(function() {
    if (user && !profile) {
      setCheckingSaved(true);
      loadRoadmap().then(function(data) {
        if (data && data.profile && data.profile.courseData) {
          setProfile(data.profile);
          setSavedProgress(data.completedCourses || {});
          setShowLanding(false);
          setIsDemo(false);
        }
        setCheckingSaved(false);
      });
    }
  }, [user]);

  const handleLoading = function(isLoading, career, status) {
    setLoading(isLoading);
    setLoadingCareer(career || null);
    setLoadingStatus(status || 'Initializing...');
    if (isLoading) setLoadingError(false);
  };

  const handleComplete = function(p) {
    setLoading(false);
    setLoadingError(false);
    setProfile(p);
    setSavedProgress(null);
    if (user && !isDemo) saveRoadmap(p, {});
  };

  const handleError = function() {
    setLoadingError(true);
  };

  const handleRetry = function() {
    if (lastRequest.current) {
      setLoadingError(false);
      setLoading(true);
      setLoadingStatus('Retrying — building your roadmap...');
      lastRequest.current();
    }
  };

  const handleReset = function() {
    setProfile(null);
    setSavedProgress(null);
    setLoadingError(false);
    setShowLanding(true);
    setIsDemo(false);
  };

  const handleGetStarted = function() {
    setShowLanding(false);
    setIsDemo(false);
  };

  const handleDemo = function() {
    setShowLanding(false);
    setIsDemo(true);
  };

  const handleUnlock = function() {
    // User wants to upgrade from demo — go back to landing to enter dev code
    setProfile(null);
    setSavedProgress(null);
    setIsDemo(false);
    setShowLanding(true);
  };

  if (authLoading || checkingSaved) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #08080f 0%, #0c0c1a 50%, #08080f 100%)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#C9A84C', animation: 'spin 1s linear infinite', marginBottom: 16 }} />
        <p style={{ color: '#aaa', fontSize: 14 }}>Loading...</p>
        <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
      </div>
    );
  }

  if (loading || loadingError) {
    return <LoadingScreen status={loadingStatus} career={loadingCareer} error={loadingError} onRetry={handleRetry} />;
  }

  if (profile) {
    // Full access if: paid subscription, dev code used, or not in demo mode
    var hasAccess = !isDemo || subscription.tier === 'student' || subscription.tier === 'premium';
    var effectiveDemo = !hasAccess;
    return profile.programLevel === 'highschool' ? (
      <HighSchoolDashboard roadmap={profile.hsRoadmap} onReset={handleReset} isDemo={effectiveDemo} onUnlock={handleUnlock} subscription={subscription} />
    ) : (
      <Dashboard profile={profile} onReset={handleReset} savedProgress={savedProgress} isDemo={effectiveDemo} onUnlock={handleUnlock} subscription={subscription} />
    );
  }

  var handleDevLogin = function(code) {
    if (code === '348145') {
      setShowLanding(false);
      setIsDemo(false);
      return true;
    }
    return false;
  };

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} onDemo={handleDemo} onDevLogin={handleDevLogin} user={user} onLogin={login} />;
  }

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      onLoading={handleLoading}
      onError={handleError}
      onSaveRetry={function(fn) { lastRequest.current = fn; }}
      user={user}
      onLogin={login}
      onBack={function() { setShowLanding(true); setIsDemo(false); }}
    />
  );
}
