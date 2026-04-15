'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function WaitlistPage() {
  var router = useRouter();
  var [dark, setDark] = useState(true);
  var [email, setEmail] = useState('');
  var [submitted, setSubmitted] = useState(false);
  var [loading, setLoading] = useState(false);

  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";
  var bg = dark ? '#0a0a0c' : '#ffffff';
  var tx = dark ? '#f0eff4' : '#111111';
  var txDim = dark ? '#9896a6' : '#555555';
  var txMut = dark ? '#5f5d6e' : '#888888';
  var bdr = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var bgCard = dark ? '#111115' : '#f8f8fb';
  var navBg = dark ? 'rgba(10,10,12,0.82)' : 'rgba(255,255,255,0.82)';
  var accentLight = dark ? '#C9A84C' : '#a07830';
  var accent = '#C9A84C';
  var green = '#10b981';

  var handleSubmit = function() {
    if (!email.includes('@') || loading) return;
    setLoading(true);
    fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, plan: 'general' }),
    })
    .then(function() { setSubmitted(true); setLoading(false); })
    .catch(function() { setSubmitted(true); setLoading(false); });
  };

  return (
    <div style={{ background: bg, color: tx, fontFamily: sans, minHeight: '100vh', transition: 'background 0.3s, color 0.3s' }}>
      <style>{"@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');"}</style>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg, backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottom: '1px solid ' + bdr, transition: 'background 0.3s',
      }}>
        <div onClick={function() { router.push('/'); }} style={{ fontFamily: serif, fontSize: 24, letterSpacing: -0.5, cursor: 'pointer', color: tx }}>
          Path<span style={{ color: accentLight }}>Forge</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={function() { setDark(!dark); }} style={{
            width: 36, height: 36, borderRadius: 10, border: '1px solid ' + bdr,
            background: bgCard, color: tx, fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
          }}>{dark ? '☀️' : '🌙'}</button>
          <button onClick={function() { router.push('/'); }} style={{
            padding: '10px 26px', borderRadius: 100, border: '1px solid ' + bdr,
            background: 'transparent', color: txDim, fontFamily: sans,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s',
          }}>← Back to Home</button>
        </div>
      </nav>

      {/* MAIN */}
      <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '120px 24px 80px', minHeight: 'calc(100vh - 200px)' }}>
        
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto 16px', maxWidth: 600, color: tx }}>
          Be the first to know.
        </h1>
        <p style={{ color: txDim, fontSize: 17, maxWidth: 480, margin: '0 auto 40px', lineHeight: 1.7 }}>
          PathForge is launching paid plans soon. Join the waitlist to get early access, exclusive pricing, and updates on new features.
        </p>

        {!submitted ? (
          <div style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input type="email" placeholder="your@email.com" value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                onKeyDown={function(e) { if (e.key === 'Enter') handleSubmit(); }}
                style={{ flex: 1, padding: '14px 18px', borderRadius: 12, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 15, outline: 'none', fontFamily: sans, transition: 'border-color 0.2s' }} />
              <button onClick={handleSubmit} disabled={!email.includes('@') || loading}
                style={{ padding: '14px 28px', borderRadius: 12, border: 'none', background: email.includes('@') && !loading ? accent : (dark ? '#1e1e28' : '#e2e2e8'), color: email.includes('@') && !loading ? '#fff' : txMut, fontSize: 15, fontWeight: 700, cursor: email.includes('@') && !loading ? 'pointer' : 'default', fontFamily: sans, transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
                {loading ? '...' : 'Join Waitlist'}
              </button>
            </div>
            <p style={{ color: txMut, fontSize: 13 }}>No spam. Unsubscribe anytime.</p>
          </div>
        ) : (
          <div style={{ maxWidth: 440, width: '100%' }}>
            <div style={{ background: green + '12', border: '1px solid ' + green + '33', borderRadius: 14, padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
              <h3 style={{ color: green, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>You're on the list!</h3>
              <p style={{ color: txDim, fontSize: 14, lineHeight: 1.6, margin: 0 }}>We'll email <strong style={{ color: tx }}>{email}</strong> when PathForge launches paid plans. Keep an eye on your inbox.</p>
            </div>
            <button onClick={function() { router.push('/'); }} style={{ padding: '12px 28px', borderRadius: 10, border: '1px solid ' + bdr, background: 'transparent', color: txDim, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>← Back to Home</button>
          </div>
        )}

        {/* What you'll get */}
        <div style={{ marginTop: 80, maxWidth: 600, width: '100%' }}>
          <h3 style={{ fontFamily: serif, fontSize: 24, color: tx, marginBottom: 24 }}>What's coming</h3>
          <div style={{ display: 'grid', gap: 12, textAlign: 'left' }}>
            {[
              { icon: '', text: 'AI-powered 4-year course roadmaps tailored to your school' },
              { icon: '🔍', text: 'College search tool — find schools that match your goals' },
              { icon: '💬', text: 'AI guidance counselor that knows your career path' },
              { icon: '', text: 'Interview prep and career outcomes data' },
              { icon: '', text: 'Early access pricing for waitlist members' },
            ].map(function(item, i) {
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 12, background: bgCard, border: '1px solid ' + bdr }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ color: txDim, fontSize: 14, lineHeight: 1.5 }}>{item.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid ' + bdr, textAlign: 'center', background: bg, transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/pricing" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Pricing</a>
          <a href="/waitlist" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Waitlist</a>
          <a href="/contact" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Contact</a>
        </div>
        <p style={{ fontSize: 13, color: txMut }}>© 2026 PathForge · Built with AI, designed for ambition.</p>
      </footer>
    </div>
  );
}
