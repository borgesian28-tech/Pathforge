'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  var router = useRouter();
  var [dark, setDark] = useState(true);
  var [name, setName] = useState('');
  var [email, setEmail] = useState('');
  var [subject, setSubject] = useState('');
  var [message, setMessage] = useState('');
  var [submitted, setSubmitted] = useState(false);

  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";
  var bg = dark ? '#0a0a0a' : '#ffffff';
  var tx = dark ? '#f0eff4' : '#111111';
  var txDim = dark ? '#9896a6' : '#555555';
  var txMut = dark ? '#5f5d6e' : '#888888';
  var bdr = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var bgCard = dark ? '#141414' : '#f8f8fb';
  var navBg = dark ? 'rgba(10,10,10,0.82)' : 'rgba(255,255,255,0.82)';
  var accent = '#C9A84C';
  var inputBg = dark ? '#1a1a1a' : '#ffffff';
  var inputBdr = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)';

  var canSubmit = name.trim() && email.includes('@') && message.trim();

  var [sending, setSending] = useState(false);
  var [error, setError] = useState('');

  var handleSubmit = async function() {
    if (!canSubmit || sending) return;
    setSending(true);
    setError('');
    try {
      var res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      var data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please email us directly at pathforgeapp@gmail.com');
      }
    } catch (e) {
      setError('Something went wrong. Please email us directly at pathforgeapp@gmail.com');
    }
    setSending(false);
  };

  var subjects = [
    'General question',
    'Bug report',
    'Feedback / suggestion',
    'Billing & account',
    'Partnership inquiry',
    'Other',
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: sans, transition: 'background 0.3s' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50, padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backdropFilter: 'blur(12px)', background: navBg,
        borderBottom: '1px solid ' + bdr,
      }}>
        <button onClick={function() { router.push('/'); }} style={{
          fontFamily: serif, fontSize: 20, color: tx, background: 'none',
          border: 'none', cursor: 'pointer', letterSpacing: -0.3,
        }}>PathForge</button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={function() { router.back(); }} style={{
            background: 'transparent', border: '1px solid ' + bdr, color: txMut,
            padding: '6px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontFamily: sans,
          }}>← Back</button>
          <button onClick={function() { setDark(!dark); }} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr,
            background: 'transparent', color: tx, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{dark ? 'Light mode' : 'Dark mode'}</button>
        </div>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '60px 24px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: accent, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Get in touch</div>
          <h1 style={{ fontFamily: serif, fontSize: 'clamp(36px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: -1, color: tx, margin: '0 0 16px' }}>Contact Us</h1>
          <p style={{ fontSize: 15, color: txDim, lineHeight: 1.7, margin: 0 }}>
            Have a question, found a bug, or want to share feedback? We read every message and typically respond within 1–2 business days.
          </p>
        </div>

        {/* Direct email card */}
        <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 12, color: txMut, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 }}>Email us directly</div>
            <a href="mailto:pathforgeapp@gmail.com" style={{ fontSize: 16, color: accent, textDecoration: 'none', fontWeight: 500 }}>pathforgeapp@gmail.com</a>
          </div>
          <a href="mailto:pathforgeapp@gmail.com?subject=PathForge%20Inquiry" style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid ' + accent,
            background: 'transparent', color: accent, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap',
          }}>Open in mail →</a>
        </div>

        {/* Form */}
        {!submitted ? (
          <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 14, color: txDim, marginBottom: 4 }}>Or fill out the form below and we'll reach out to your email.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: txMut, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Name</label>
                <input
                  type="text" placeholder="Your name" value={name}
                  onChange={function(e) { setName(e.target.value); }}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid ' + inputBdr, background: inputBg, color: tx, fontSize: 14, outline: 'none', fontFamily: sans, boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: txMut, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Email</label>
                <input
                  type="email" placeholder="your@email.com" value={email}
                  onChange={function(e) { setEmail(e.target.value); }}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid ' + inputBdr, background: inputBg, color: tx, fontSize: 14, outline: 'none', fontFamily: sans, boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: txMut, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Subject</label>
              <select
                value={subject} onChange={function(e) { setSubject(e.target.value); }}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid ' + inputBdr, background: inputBg, color: subject ? tx : txMut, fontSize: 14, outline: 'none', fontFamily: sans, cursor: 'pointer' }}
              >
                <option value="">Select a subject</option>
                {subjects.map(function(s) { return <option key={s} value={s}>{s}</option>; })}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, color: txMut, fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Message</label>
              <textarea
                placeholder="Tell us what's on your mind..." value={message}
                onChange={function(e) { setMessage(e.target.value); }}
                rows={5}
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid ' + inputBdr, background: inputBg, color: tx, fontSize: 14, outline: 'none', fontFamily: sans, resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
              />
            </div>

            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button
              onClick={handleSubmit} disabled={!canSubmit || sending}
              style={{
                width: '100%', padding: '13px 24px', borderRadius: 8, border: 'none',
                background: canSubmit ? accent : (dark ? '#222' : '#e5e5e5'),
                color: canSubmit ? '#000' : txMut,
                fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
                fontFamily: sans, transition: 'all 0.2s',
              }}>
{sending ? 'Sending...' : 'Send Message →'}
            </button>
          </div>
        ) : (
          <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '40px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
            <h2 style={{ fontFamily: serif, fontSize: 24, color: tx, margin: '0 0 12px' }}>Message sent</h2>
            <p style={{ fontSize: 15, color: txDim, lineHeight: 1.7, margin: '0 0 24px' }}>
              Your message has been sent. We'll get back to you at <strong style={{ color: tx }}>{email}</strong> within 1–2 business days.
            </p>
            <button onClick={function() { router.push('/'); }} style={{
              padding: '10px 24px', borderRadius: 8, border: '1px solid ' + bdr,
              background: 'transparent', color: tx, fontSize: 14, cursor: 'pointer', fontFamily: sans,
            }}>Back to Home</button>
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid ' + bdr, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
            <a href="/terms" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
            <a href="/privacy" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
            <a href="/pricing" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Pricing</a>
            <a href="/waitlist" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Waitlist</a>
          </div>
          <p style={{ fontSize: 13, color: txMut }}>© 2026 PathForge · Built with AI, designed for ambition.</p>
        </div>
      </div>
    </div>
  );
}
