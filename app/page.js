'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthContext';
import LandingPage from '@/components/LandingPage';
import OnboardingFlow from '@/components/OnboardingFlow';
import LoadingScreen from '@/components/LoadingScreen';
import Dashboard from '@/components/Dashboard';
import HighSchoolDashboard from '@/components/HighSchoolDashboard';

export default function Home() {
  const { user, loading: authLoading, login, logout, saveRoadmap, loadRoadmap, deleteRoadmap, subscription, refreshSubscription } = useAuth();
  const [profile, setProfile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');
  const [loadingError, setLoadingError] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(null); // null | { skipLanding: bool }
  const lastRequest = useRef(null);
  // Tracks whether we've already attempted to rehydrate the saved roadmap for the current user.
  // Prevents the rehydration effect from re-firing within a session.
  const rehydratedForUid = useRef(null);
  // Set to true after a confirmed reset so the rehydration effect can't immediately
  // re-load the data we just deleted (race against Firestore eventual consistency).
  const suppressRehydration = useRef(false);

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

  // Reset rehydration tracker when user logs out so a future login re-attempts hydration
  useEffect(function() {
    if (!user) {
      rehydratedForUid.current = null;
      suppressRehydration.current = false;
    }
  }, [user]);

  // If user is logged in and has a saved roadmap, auto-load it.
  // Runs once per uid; resilient to either college (courseData) or high-school (hsRoadmap) shapes,
  // and falls through cleanly on Firestore errors so the user never gets stuck.
  useEffect(function() {
    if (!user) return;
    if (profile) return;
    if (suppressRehydration.current) return;
    if (rehydratedForUid.current === user.uid) return;

    rehydratedForUid.current = user.uid;
    setCheckingSaved(true);

    loadRoadmap()
      .then(function(data) {
        if (!data || !data.profile) return;
        // If a reset happened mid-flight, don't re-apply stale data.
        if (suppressRehydration.current) return;

        var p = data.profile;
        // A profile is "valid" if it has either college course data OR a high-school roadmap.
        var hasCollegeData = !!p.courseData;
        var hasHighSchoolData = !!p.hsRoadmap;

        if (hasCollegeData || hasHighSchoolData) {
          setProfile(p);
          setSavedProgress(data.completedCourses || {});
          setShowLanding(false);
          setIsDemo(false);
        }
      })
      .catch(function(err) {
        console.error('Failed to load saved roadmap:', err);
        // Swallow the error — user falls through to landing page, which is the safe default.
      })
      .finally(function() {
        setCheckingSaved(false);
      });
  }, [user, profile, loadRoadmap]);

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
    // A successful generation re-establishes a saved roadmap, so allow rehydration again next session.
    suppressRehydration.current = false;
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

  // Reset is gated by a confirmation modal whenever the user has a logged-in saved roadmap,
  // because confirming will delete it from Firestore.
  // The skipLanding arg from the dashboard's reset button is ignored on confirmed reset —
  // "start over" should always send the user straight into onboarding, not back to the marketing page.
  const handleReset = function(skipLanding) {
    var hasSavedRoadmap = !!user && !isDemo && !!profile;
    if (hasSavedRoadmap) {
      setResetConfirm({ skipLanding: !!skipLanding });
      return;
    }
    performLocalReset(skipLanding);
  };

  // Pure local reset (no Firestore mutation). Used for demo resets and not-logged-in resets.
  const performLocalReset = function(skipLanding) {
    setProfile(null);
    setSavedProgress(null);
    setLoadingError(false);
    setIsDemo(false);
    rehydratedForUid.current = null;
    suppressRehydration.current = false;
    if (skipLanding) {
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  };

  const handleConfirmReset = function() {
    setResetConfirm(null);
    // Lock out rehydration BEFORE we kick off the delete, so any in-flight loadRoadmap
    // resolving late can't write the data back into state.
    suppressRehydration.current = true;
    // Optimistically clear local state and route into onboarding.
    setProfile(null);
    setSavedProgress(null);
    setLoadingError(false);
    setIsDemo(false);
    setShowLanding(false);
    // Delete the Firestore record. Fire-and-forget — the UI doesn't block on this.
    if (user && deleteRoadmap) {
      deleteRoadmap().catch(function(err) {
        console.error('Reset: deleteRoadmap failed:', err);
      });
    }
  };

  const handleCancelReset = function() {
    setResetConfirm(null);
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
    // Demo users go to pricing page to subscribe
    if (typeof window !== 'undefined') window.location.href = '/pricing';
  };

  if (authLoading || checkingSaved) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #0d0d0d 50%, #0a0a0a 100%)' }}>
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
    // Dev code users get full premium access
    // Demo users see locked tabs
    // Paid users get access based on their tier
    var hasAccess = !isDemo || subscription.tier === 'student' || subscription.tier === 'premium';
    var effectiveDemo = !hasAccess;
    // Dev code users (isDemo=false, no subscription) get premium-equivalent access
    var effectiveSub = !isDemo && subscription.tier === 'free' ? { tier: 'premium', status: 'active' } : subscription;

    var dashboardEl = profile.programLevel === 'highschool' ? (
      <HighSchoolDashboard roadmap={profile.hsRoadmap} onReset={handleReset} isDemo={effectiveDemo} onUnlock={handleUnlock} subscription={effectiveSub} isBetaUser={!isDemo && !user && subscription.tier === 'free'} />
    ) : (
      <Dashboard profile={profile} onReset={handleReset} savedProgress={savedProgress} isDemo={effectiveDemo} onUnlock={handleUnlock} subscription={effectiveSub} isBetaUser={!isDemo && !user && subscription.tier === 'free'} />
    );

    return (
      <>
        {dashboardEl}
        {resetConfirm ? <ResetConfirmModal onConfirm={handleConfirmReset} onCancel={handleCancelReset} /> : null}
      </>
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

// Confirmation modal shown before a reset deletes a saved roadmap.
// Inline so this fix is a single-file change.
function ResetConfirmModal(props) {
  return (
    <div
      onClick={props.onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'rcm-fade 0.18s ease-out',
      }}
    >
      <div
        onClick={function(e) { e.stopPropagation(); }}
        style={{
          background: '#111115',
          border: '1px solid #2a2a30',
          borderRadius: 16,
          padding: 28,
          maxWidth: 440,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          animation: 'rcm-pop 0.22s ease-out',
        }}
      >
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: '#f0eff4', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>
          Start over?
        </h2>
        <p style={{ color: '#9896a6', fontSize: 14, lineHeight: 1.55, margin: '0 0 24px' }}>
          This will permanently delete your saved roadmap and any completed-course progress.
          You&apos;ll be sent to onboarding to build a new one. This can&apos;t be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={props.onCancel}
            style={{
              background: 'transparent',
              color: '#f0eff4',
              border: '1px solid #2a2a30',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Keep my roadmap
          </button>
          <button
            onClick={props.onConfirm}
            style={{
              background: '#C9A84C',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: 10,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Yes, start over
          </button>
        </div>
        <style>{
          '@keyframes rcm-fade{from{opacity:0}to{opacity:1}}' +
          '@keyframes rcm-pop{from{transform:scale(0.96);opacity:0}to{transform:scale(1);opacity:1}}'
        }</style>
      </div>
    </div>
  );
}
