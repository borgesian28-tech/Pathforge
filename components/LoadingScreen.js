'use client';
import { useState, useEffect } from 'react';
import { CAREER_OPTIONS } from '@/lib/constants';

export default function LoadingScreen({ status, career }) {
  const c = CAREER_OPTIONS.find((o) => o.id === career) || CAREER_OPTIONS[0];
  const [dots, setDots] = useState('');
  const [tip, setTip] = useState(0);
  const tips = [
    'Scanning course catalogs...',
    'Finding what college won\'t teach you...',
    'Building your networking playbook...',
    'Mapping career milestones...',
    'Gathering insider tips...',
    'Almost there...',
  ];

  useEffect(() => {
    const d = setInterval(() => setDots((p) => (p.length >= 3 ? '' : p + '.')), 400);
    const t = setInterval(() => setTip((p) => (p + 1) % tips.length), 3500);
    return () => { clearInterval(d); clearInterval(t); };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #08080f 0%, #0c0c1a 50%, #08080f 100%)', padding: 20 }}>
      <div style={{ position: 'relative', width: 80, height: 80, marginBottom: 32 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `3px solid ${c.accent}22` }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: c.accent, animation: 'spin 1s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '3px solid transparent', borderTopColor: c.color, animation: 'spin 1.5s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.icon}</div>
      </div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 'clamp(20px, 4vw, 28px)', textAlign: 'center', margin: '0 0 12px' }}>Building Your Roadmap</h2>
      <p style={{ color: c.accent, fontSize: 15, fontWeight: 500, textAlign: 'center', maxWidth: 360 }}>{status}{dots}</p>
      <p style={{ color: '#4a4a5a', fontSize: 12, marginTop: 20, textAlign: 'center', maxWidth: 320, minHeight: 36 }}>{tips[tip]}</p>
    </div>
  );
}
