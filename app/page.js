'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import OnboardingFlow from '@/components/OnboardingFlow';
import LoadingScreen from '@/components/LoadingScreen';
import Dashboard from '@/components/Dashboard';
import HSCourseAdvisor from '@/components/HSCourseAdvisor';
import HighSchoolDashboard from '@/components/HighSchoolDashboard';

export default function Home() {
  const { user, loading: authLoading, login, logout, saveRoadmap, loadRoadmap } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [checkingSaved, setCheckingSaved] = useState(false);
  const [showHSAdvisor, setShowHSAdvisor] = useState(false);

  // When user logs in, check for saved roadmap
  useEffect(function() {
    if (user && !profile) {
      setCheckingSaved(true);
      loadRoadmap().then(function(data) {
        if (data && data.profile && data.profile.courseData) {
          setProfile(data.profile);
          setSavedProgress(data.completedCourses || {});
        }
        setCheckingSaved(false);
      });
    }
  }, [user]);

  const handleLoading = function(isLoading, career, status) {
    setLoading(isLoading);
    setLoadingCareer(career || null);
    setLoadingStatus(status || 'Initializing...');
  };

  const handleComplete = function(p) {
    setLoading(false);
    setProfile(p);
    setSavedProgress(null);
    // Save to Firebase if logged in
    if (user) {
      saveRoadmap(p, {});
    }
  };

  const handleReset = function() {
    setProfile(null);
    setSavedProgress(null);
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

  if (loading) {
    return <LoadingScreen status={loadingStatus} career={loadingCareer} />;
  }

  return (
    <>
      {profile ? (
        profile.programLevel === 'highschool' ? (
          <HighSchoolDashboard roadmap={profile.hsRoadmap} onReset={handleReset} />
        ) : (
          <Dashboard profile={profile} onReset={handleReset} savedProgress={savedProgress} />
        )
      ) : (
        <OnboardingFlow
          onComplete={handleComplete}
          onLoading={handleLoading}
          user={user}
          onLogin={login}
        />
      )}
      
      {/* HS Course Advisor - floating button */}
      {!showHSAdvisor && (
        <button
          onClick={() => setShowHSAdvisor(true)}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            background: '#8b5cf6',
            border: 'none',
            borderRadius: 12,
            padding: '12px 18px',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(139, 92, 246, 0.4)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <span style={{ fontSize: 16 }}>🎓</span>
          HS Course Help
        </button>
      )}
      
      {showHSAdvisor && (
        <div style={{ position: 'relative', zIndex: 1000 }}>
          <HSCourseAdvisor />
          <button
            onClick={() => setShowHSAdvisor(false)}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 440,
              background: '#1a1a2e',
              border: '1px solid #2a2a3e',
              borderRadius: 8,
              width: 32,
              height: 32,
              color: '#888',
              fontSize: 16,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
