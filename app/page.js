'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import LandingPage from '@/components/LandingPage';
import OnboardingFlow from '@/components/OnboardingFlow';
import LoadingScreen from '@/components/LoadingScreen';
import Dashboard from '@/components/Dashboard';
import HighSchoolDashboard from '@/components/HighSchoolDashboard';

export default function Home() {
  const { user, loading: authLoading, login, logout, saveRoadmap, loadRoadmap } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [loadingError, setLoadingError] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const lastRequest = useRef(null);

  // If user is logged in and has a saved roadmap, skip landing page
  useEffect(function() {
    if (user && !profile) {
      setCheckingSaved(true);
      loadRoadmap().then(function(data) {
        if (data && data.profile && data.profile.courseData) {
          setProfile(data.profile);
          setSavedProgress(data.completedCourses || {});
          setShowLanding(false);
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
    if (user) saveRoadmap(p, {});
  };

  const handleError = function() {
    setLoadingError(true);
  };

  const handleRetry = function() {
    if (lastRequest.current) {
      setLoadingError(false);
      setLoading(true);
      setLoadingStatus('Retrying — searching course catalog...');
      lastRequest.current();
    }
  };

  const handleReset = function() {
    setProfile(null);
    setSavedProgress(null);
    setLoadingError(false);
    setShowLanding(true);
  };

  const handleGetStarted = function() {
    setShowLanding(false);
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
    return profile.programLevel === 'highschool' ? (
      <HighSchoolDashboard roadmap={profile.hsRoadmap} onReset={handleReset} />
    ) : (
      <Dashboard profile={profile} onReset={handleReset} savedProgress={savedProgress} />
    );
  }

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} user={user} onLogin={login} />;
  }

  return (
    <OnboardingFlow
      onComplete={handleComplete}
      onLoading={handleLoading}
      onError={handleError}
      onSaveRetry={function(fn) { lastRequest.current = fn; }}
      user={user}
      onLogin={login}
      onBack={function() { setShowLanding(true); }}
    />
  );
}
