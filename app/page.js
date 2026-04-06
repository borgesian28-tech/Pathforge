'use client';
import { useState } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import LoadingScreen from '@/components/LoadingScreen';
import Dashboard from '@/components/Dashboard';

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCareer, setLoadingCareer] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState('Initializing...');

  const handleLoading = (isLoading, career = null, status = 'Initializing...') => {
    setLoading(isLoading);
    setLoadingCareer(career);
    setLoadingStatus(status);
  };

  if (loading) {
    return <LoadingScreen status={loadingStatus} career={loadingCareer} />;
  }

  if (profile) {
    return <Dashboard profile={profile} onReset={() => setProfile(null)} />;
  }

  return (
    <OnboardingFlow
      onComplete={(p) => { setLoading(false); setProfile(p); }}
      onLoading={handleLoading}
    />
  );
}
