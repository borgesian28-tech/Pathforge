'use client';
import { useState } from 'react';
import { PLANS } from '@/lib/stripe-config';

export default function PricingSection({ onSelectPlan, user, onLogin, darkMode }) {
  var [billing, setBilling] = useState('annual');
  var dm = darkMode !== false;

  var bg = dm ? '#0a0a0c' : '#ffffff';
  var bgCard = dm ? '#111115' : '#f8f8fb';
  var tx = dm ? '#f0eff4' : '#111111';
  var txDim = dm ? '#9896a6' : '#555555';
  var txMut = dm ? '#5f5d6e' : '#888888';
  var bdr = dm ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var accent = '#6c5ce7';
  var accentLight = dm ? '#a29bfe' : '#5a4bd1';
  var green = '#10b981';
  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";

  var handleSelect = function(planKey) {
    var plan = PLANS[planKey];
    var priceId = billing === 'annual' ? plan.annual.priceId : plan.monthly.priceId;
    if (onSelectPlan) {
      onSelectPlan(priceId, planKey, billing);
    }
  };

  return (
    <div>
      {/* Billing toggle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', background: dm ? '#19191f' : '#f0f0f4', borderRadius: 12, padding: 4, gap: 4 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 700, margin: '0 auto' }}>
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
          <button onClick={function() { if (!user && onLogin) { onLogin().then(function() { handleSelect('student'); }); } else { handleSelect('student'); } }}
            style={{ width: '100%', padding: '14px 24px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, ' + accent + ', #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: sans, transition: 'all 0.2s' }}>
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
          <button onClick={function() { if (!user && onLogin) { onLogin().then(function() { handleSelect('premium'); }); } else { handleSelect('premium'); } }}
            style={{ width: '100%', padding: '14px 24px', borderRadius: 10, border: '1px solid #f59e0b44', background: 'transparent', color: '#f59e0b', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: sans, transition: 'all 0.2s' }}>
            Go Premium →
          </button>
        </div>
      </div>
    </div>
  );
}
