'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import PricingSection from '@/components/PricingSection';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
  var { user, login, startCheckout, subscription } = useAuth();
  var router = useRouter();
  var [dark, setDark] = useState(true);

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

      {/* HEADER */}
      <section style={{ textAlign: 'center', padding: '80px 24px 20px' }}>
        <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>Pricing</div>
        <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto 16px', maxWidth: 600, color: tx }}>
          Invest in your future.
        </h1>
        <p style={{ color: txDim, fontSize: 17, maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
          Choose the plan that fits your goals. Cancel anytime.
        </p>
        {subscription && subscription.tier !== 'free' && (
          <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, background: '#10b98122', border: '1px solid #10b98144', padding: '8px 20px', borderRadius: 100 }}>
            <span style={{ color: '#10b981', fontSize: 13, fontWeight: 600 }}>✓ You're on the {subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} plan</span>
          </div>
        )}
      </section>

      {/* PRICING CARDS */}
      <section style={{ padding: '40px 24px 100px', maxWidth: 1140, margin: '0 auto' }}>
        <PricingSection user={user} onLogin={login} darkMode={dark} />
      </section>

      {/* FAQ */}
      <section style={{ padding: '60px 24px 100px', maxWidth: 700, margin: '0 auto' }}>
        <h2 style={{ fontFamily: serif, fontSize: 32, textAlign: 'center', marginBottom: 40, color: tx }}>Frequently Asked Questions</h2>
        {[
          { q: 'Can I cancel anytime?', a: 'Yes. Cancel your subscription at any time from your account settings. You\'ll keep access until the end of your billing period.' },
          { q: 'What\'s included in the free demo?', a: 'The demo gives you a sample roadmap with the Course Plan tab unlocked so you can see the quality of our AI recommendations before subscribing.' },
          { q: 'What\'s the difference between Student and Premium?', a: 'Student gives you full access to your roadmap, AI advisor, and all core planning tools. Premium adds the College Search tool, career outcomes data, interview prep, progress tracking with GPA, and priority AI responses.' },
          { q: 'Do you offer refunds?', a: 'We offer a full refund within the first 7 days if you\'re not satisfied with PathForge.' },
          { q: 'Can I switch between plans?', a: 'Yes. You can upgrade or downgrade at any time. Changes take effect at the start of your next billing cycle.' },
        ].map(function(item, i) {
          return (
            <div key={i} style={{ borderBottom: '1px solid ' + bdr, padding: '24px 0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: tx }}>{item.q}</h3>
              <p style={{ fontSize: 14, color: txDim, lineHeight: 1.7, margin: 0 }}>{item.a}</p>
            </div>
          );
        })}
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid ' + bdr, textAlign: 'center', background: bg, transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/pricing" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Pricing</a>
          <a href="/waitlist" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Waitlist</a>
          <a href="mailto:pathforgeapp@gmail.com" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Contact</a>
        </div>
        <p style={{ fontSize: 13, color: txMut }}>© 2026 PathForge · Built with AI, designed for ambition.</p>
      </footer>
    </div>
  );
}
