'use client';
import { useState } from 'react';
import { PLANS } from '@/lib/stripe-config';

export default function PricingSection({ onSelectPlan, user, onLogin, darkMode }) {
  var [billing, setBilling] = useState('annual');
  var [showComingSoon, setShowComingSoon] = useState(false);
  var [selectedPlanName, setSelectedPlanName] = useState('');
  var [waitlistEmail, setWaitlistEmail] = useState('');
  var [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  var dm = darkMode !== false;

  var bg = dm ? '#0a0a0c' : '#ffffff';
  var bgCard = dm ? '#111115' : '#f8f8fb';
  var tx = dm ? '#f0eff4' : '#111111';
  var txDim = dm ? '#9896a6' : '#555555';
  var txMut = dm ? '#5f5d6e' : '#888888';
  var bdr = dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var accent = '#C9A84C';
  var green = '#10b981';
  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";

  var handleSelect = function(planKey) {
    var plan = PLANS[planKey];
    var name = plan.name + ' ' + (billing === 'annual' ? 'Annual' : 'Monthly');
    setSelectedPlanName(name);
    setShowComingSoon(true);
  };

  return (
    <div>
      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', background: dm ? '#1a1a1a' : '#f0f0f4', borderRadius: 12, padding: 4, gap: 4 }}>
          <button onClick={function() { setBilling('monthly'); }}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: billing === 'monthly' ? accent : 'transparent', color: billing === 'monthly' ? '#fff' : txMut, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: sans }}>
            Monthly
          </button>
          <button onClick={function() { setBilling('annual'); }}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: billing === 'annual' ? accent : 'transparent', color: billing === 'annual' ? '#fff' : txMut, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontFamily: sans, position: 'relative' }}>
            Annual
            <span style={{ position: 'absolute', top: -8, right: -8, background: green, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6 }}>Save 36%</span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="pricing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 960, margin: '0 auto' }}>
        <style>{'.pricing-grid { grid-template-columns: repeat(3, 1fr) !important; } @media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr !important; } }'}</style>
        {/* Free */}
        <div style={{ padding: '32px 28px', borderRadius: 18, background: bgCard, border: '1px solid ' + bdr }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: txMut, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Free</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
            <span style={{ fontFamily: serif, fontSize: 42, color: tx }}>$0</span>
          </div>
          <p style={{ color: txDim, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>Try PathForge with a demo roadmap</p>
          <div style={{ marginBottom: 24 }}>
            {['Demo roadmap (Course Plan only)', 'View sample recommendations', 'Limited AI features'].map(function(f, i) {
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: txDim, fontSize: 13 }}>
                <span style={{ color: txMut, fontSize: 14 }}>✓</span>{f}
              </div>;
            })}
          </div>
          <div style={{ padding: '12px 24px', borderRadius: 10, border: '1px solid ' + bdr, textAlign: 'center', color: txMut, fontSize: 14, fontWeight: 600 }}>Current Plan</div>
        </div>

        {/* Student */}
        <div style={{ padding: '32px 28px', borderRadius: 18, background: bgCard, border: '2px solid ' + accent, position: 'relative', boxShadow: '0 0 40px ' + accent + '15' }}>
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: accent, color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>Most Popular</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Student</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
            <span style={{ fontFamily: serif, fontSize: 42, color: tx }}>${billing === 'annual' ? '69' : '9'}</span>
            <span style={{ color: txMut, fontSize: 14 }}>/{billing === 'annual' ? 'year' : 'mo'}</span>
          </div>
          {billing === 'annual' && <p style={{ color: green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>$5.75/mo — save $39/year</p>}
          <p style={{ color: txDim, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>Everything you need to plan your path</p>
          <div style={{ marginBottom: 24 }}>
            {PLANS.student.features.map(function(f, i) {
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: txDim, fontSize: 13 }}>
                <span style={{ color: accent, fontSize: 14 }}>✓</span>{f}
              </div>;
            })}
          </div>
          <button onClick={function() { handleSelect('student'); }}
            style={{ width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: sans, transition: 'all 0.2s' }}>
            Get Started →
          </button>
        </div>

        {/* Premium */}
        <div style={{ padding: '32px 28px', borderRadius: 18, background: bgCard, border: '1px solid ' + bdr }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f59e0b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Premium</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
            <span style={{ fontFamily: serif, fontSize: 42, color: tx }}>${billing === 'annual' ? '99' : '19'}</span>
            <span style={{ color: txMut, fontSize: 14 }}>/{billing === 'annual' ? 'year' : 'mo'}</span>
          </div>
          {billing === 'annual' && <p style={{ color: green, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>$8.25/mo — save $129/year</p>}
          <p style={{ color: txDim, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>For students who want every advantage</p>
          <div style={{ marginBottom: 24 }}>
            {PLANS.premium.features.map(function(f, i) {
              return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', color: txDim, fontSize: 13 }}>
                <span style={{ color: '#f59e0b', fontSize: 14 }}>✓</span>{f}
              </div>;
            })}
          </div>
          <button onClick={function() { handleSelect('premium'); }}
            style={{ width: '100%', padding: '14px 24px', borderRadius: 10, border: '1px solid #f59e0b44', background: 'transparent', color: '#f59e0b', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: sans, transition: 'all 0.2s' }}>
            Go Premium →
          </button>
        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div onClick={function() { setShowComingSoon(false); setWaitlistSubmitted(false); setWaitlistEmail(''); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: dm ? '#131318' : '#ffffff', border: '1px solid ' + bdr, borderRadius: 18, padding: '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h3 style={{ fontFamily: serif, fontSize: 24, color: tx, margin: '0 0 8px' }}>Coming Soon!</h3>
            <p style={{ color: txDim, fontSize: 15, lineHeight: 1.7, marginBottom: 8 }}>The <strong style={{ color: accent }}>{selectedPlanName}</strong> plan is launching very soon.</p>
            {!waitlistSubmitted ? (
              <div>
                <p style={{ color: txMut, fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>Drop your email to join the waitlist — we'll let you know the moment subscriptions go live.</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <input type="email" placeholder="your@email.com" value={waitlistEmail}
                    onChange={function(e) { setWaitlistEmail(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter' && waitlistEmail.includes('@')) { fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: waitlistEmail, plan: selectedPlanName }) }).catch(function(){}); setWaitlistSubmitted(true); } }}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: dm ? '#09090b' : '#f5f5f8', color: tx, fontSize: 14, outline: 'none', fontFamily: sans }} />
                  <button onClick={function() { if (waitlistEmail.includes('@')) { fetch('/api/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: waitlistEmail, plan: selectedPlanName }) }).catch(function(){}); setWaitlistSubmitted(true); } }}
                    style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: waitlistEmail.includes('@') ? accent : (dm ? '#222222' : '#e2e2e8'), color: waitlistEmail.includes('@') ? '#fff' : txMut, fontSize: 14, fontWeight: 700, cursor: waitlistEmail.includes('@') ? 'pointer' : 'default', fontFamily: sans }}>
                    Join
                  </button>
                </div>
                <button onClick={function() { setShowComingSoon(false); }} style={{ background: 'none', border: 'none', color: txMut, fontSize: 13, cursor: 'pointer', fontFamily: sans }}>Maybe later</button>
              </div>
            ) : (
              <div>
                <div style={{ background: green + '15', border: '1px solid ' + green + '33', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                  <p style={{ color: green, fontSize: 14, fontWeight: 600, margin: 0 }}>✓ You're on the waitlist!</p>
                  <p style={{ color: txDim, fontSize: 13, margin: '6px 0 0', lineHeight: 1.5 }}>We'll email you at <strong style={{ color: tx }}>{waitlistEmail}</strong> when it's ready.</p>
                </div>
                <button onClick={function() { setShowComingSoon(false); setWaitlistSubmitted(false); setWaitlistEmail(''); }} style={{ padding: '12px 32px', borderRadius: 10, border: 'none', background: accent, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: sans }}>Got it →</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
