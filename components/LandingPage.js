'use client';
import { useState, useEffect, useRef } from 'react';
import PricingSection from '@/components/PricingSection';
import { useAuth } from '@/components/AuthContext';

export default function LandingPage({ onGetStarted, onDemo, onDevLogin, user, onLogin }) {
  var { startCheckout } = useAuth();
  var [visible, setVisible] = useState(new Set());
  var [dark, setDark] = useState(true);
  var [showDevCode, setShowDevCode] = useState(false);
  var [devCode, setDevCode] = useState('');
  var [devError, setDevError] = useState('');
  var observerRef = useRef(null);

  useEffect(function() {
    observerRef.current = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          setVisible(function(prev) {
            var next = new Set(prev);
            next.add(e.target.dataset.reveal);
            return next;
          });
          observerRef.current.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-reveal]').forEach(function(el) {
      observerRef.current.observe(el);
    });
    return function() { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  var revealStyle = function(id, delay) {
    var d = delay || 0;
    var base = { transition: 'opacity 0.7s ease ' + d + 's, transform 0.7s ease ' + d + 's' };
    if (visible.has(id)) return Object.assign({}, base, { opacity: 1, transform: 'translateY(0)' });
    return Object.assign({}, base, { opacity: 0, transform: 'translateY(32px)' });
  };

  var handleDevSubmit = function() {
    if (devCode.trim() === '348145') {
      if (onDevLogin) onDevLogin(devCode.trim());
    } else {
      setDevError('Invalid code');
      setTimeout(function() { setDevError(''); }, 3000);
    }
  };

  var accent = '#C9A84C';
  var accentLight = dark ? '#C9A84C' : '#a07830';
  var accentSoft = dark ? 'rgba(201,168,76,0.25)' : '#ede9fe';
  var green = dark ? '#00e676' : '#16a34a';
  var greenDim = dark ? 'rgba(0,230,118,0.15)' : 'rgba(22,163,74,0.1)';
  var bg = dark ? '#0a0a0c' : '#ffffff';
  var bgCard = dark ? '#111115' : '#f8f8fb';
  var tx = dark ? '#f0eff4' : '#111111';
  var txDim = dark ? '#9896a6' : '#555555';
  var txMut = dark ? '#5f5d6e' : '#888888';
  var bdr = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  var navBg = dark ? 'rgba(10,10,12,0.82)' : 'rgba(255,255,255,0.82)';
  var radius = 18;
  var serif = "'Instrument Serif', Georgia, serif";
  var sans = "'DM Sans', system-ui, sans-serif";
  var starColor = dark ? '#ffc107' : '#f59e0b';

  var features = [
    { icon: '🎯', title: 'Real Course Plans', desc: 'AI-generated roadmaps with actual courses from your school\'s catalog — semester by semester, year by year.' },
    { icon: '🤖', title: 'AI Career Advisor', desc: 'Chat with an AI advisor that knows your school, your major, and your career goals.' },
    { icon: '🏆', title: 'Beyond the Classroom', desc: 'Clubs, organizations, competitions, and experiences that actually matter for your career.' },
    { icon: '💰', title: 'Career Outcomes', desc: 'Real salary data, top employers, job placement rates, and career growth outlook.' },
    { icon: '🎓', title: 'High School Planning', desc: 'AP and honors course recommendations tailored to your dream major — freshman through senior year.' },
    { icon: '🎤', title: 'Mock Interviews', desc: 'Practice behavioral, technical, and case study interviews with AI feedback and scoring.' },
  ];

  var steps = [
    { num: '1', title: 'Tell Us Your Goals', desc: 'Pick your dream career, choose your school, and select a major.' },
    { num: '2', title: 'AI Builds Your Plan', desc: 'Our AI researches your school\'s real courses, clubs, and opportunities.' },
    { num: '3', title: 'Track & Adapt', desc: 'Check off courses, chat with your AI advisor, and practice interviews.' },
  ];

  var testimonials = [
    { text: 'I had no idea what courses to take for investment banking. PathForge gave me a full 4-year plan in minutes — with real course codes.', name: 'Jason T.', role: 'Economics Major, Sophomore', initial: 'J' },
    { text: 'My sister used the high school advisor to choose between AP Stats and Honors Physics for pre-dent. The recommendation was spot-on.', name: 'Maria K.', role: 'High School Senior', initial: 'M' },
    { text: 'The mock interview feature helped me prep for consulting cases. I walked into my first round feeling way more confident.', name: 'Derek L.', role: 'Business Admin, Junior', initial: 'D' },
  ];

  return (
    <div style={{ background: bg, color: tx, fontFamily: sans, overflowX: 'clip', WebkitFontSmoothing: 'antialiased', transition: 'background 0.3s, color 0.3s', minHeight: '100vh' }}>
      <style>{[
        "@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');",
        "@keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }",
        "@keyframes fadeUpHero { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }",
        ".lp-btn-primary { transition: all 0.25s !important; }",
        ".lp-btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 32px rgba(201,168,76,0.25) !important; }",
        ".lp-btn-demo { transition: all 0.25s !important; }",
        ".lp-btn-demo:hover { transform: translateY(-1px) !important; opacity: 0.9 !important; }",
        ".lp-feature-card { transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s !important; }",
        ".lp-feature-card:hover { transform: translateY(-3px) !important; }",
        ".lp-nav-cta { transition: transform 0.2s, box-shadow 0.2s !important; }",
        ".lp-nav-cta:hover { transform: translateY(-1px) !important; box-shadow: 0 6px 24px rgba(201,168,76,0.25) !important; }",
        "@media (max-width: 860px) { .lp-features-grid { grid-template-columns: 1fr !important; } .lp-steps-row { grid-template-columns: 1fr !important; } .lp-steps-line { display: none !important; } .lp-proof-grid { grid-template-columns: 1fr !important; } .lp-mock-row { flex-direction: column !important; } .lp-mock-sidebar { width: 100% !important; flex-direction: row !important; flex-wrap: wrap !important; } .lp-mock-grid { grid-template-columns: 1fr !important; } .lp-hero-h1 { font-size: 42px !important; } .lp-nav { padding: 10px 14px !important; } .lp-hero-buttons { flex-direction: column !important; align-items: stretch !important; } .lp-nav-links { gap: 6px !important; } }"
      ].join('\n') + '\n.lp-gradient-text { background: ' + (dark ? 'linear-gradient(135deg, #C9A84C, #e8c97a)' : 'linear-gradient(135deg, #C9A84C, #C9A84C)') + '; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; color: transparent; }'}</style>

      {/* NAV */}
      <nav className="lp-nav" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: navBg, backdropFilter: 'blur(24px) saturate(1.4)',
        borderBottom: '1px solid ' + bdr, transition: 'background 0.3s',
      }}>
        <div style={{ fontFamily: serif, fontSize: 24, letterSpacing: -0.5, color: tx, flexShrink: 0 }}>
          Path<span style={{ color: accentLight }}>Forge</span>
        </div>
        <div className="lp-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          <button onClick={function() { setDark(!dark); }} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr,
            background: 'transparent', color: tx, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0,
          }}>{dark ? '☀️' : '🌙'}</button>
          <a href="/waitlist" style={{ color: tx, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Waitlist</a>
          <a href="/pricing" style={{ color: tx, fontSize: 13, fontWeight: 500, cursor: 'pointer', textDecoration: 'none', padding: '6px 14px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>Pricing</a>
          <button className="lp-nav-cta" onClick={function() { setShowDevCode(false); onDemo(); }} style={{
            padding: '6px 16px', borderRadius: 8, border: '1px solid ' + accent,
            background: accent, color: '#000', fontFamily: sans,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}>Try Demo</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '140px 24px 80px', position: 'relative', background: bg,
        transition: 'background 0.3s',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px 6px 8px', borderRadius: 100,
          background: greenDim, border: '1px solid ' + (dark ? 'rgba(0,230,118,0.2)' : 'rgba(22,163,74,0.2)'),
          fontSize: 13, color: green, fontWeight: 600, marginBottom: 32,
          animation: 'fadeUpHero 0.8s ease both',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: green, display: 'inline-block', animation: 'pulseDot 2s infinite' }} />
          AI-Powered Academic Advising
        </div>

        <h1 className="lp-hero-h1" style={{
          fontFamily: serif, fontWeight: 400, fontSize: 'clamp(48px, 7vw, 88px)',
          lineHeight: 1.05, letterSpacing: -2, maxWidth: 780, color: tx,
          animation: 'fadeUpHero 0.8s ease 0.1s both',
        }}>
          Your roadmap from{' '}
          <em className="lp-gradient-text" style={{ fontStyle: 'italic' }}>first class</em>{' '}
          to first offer.
        </h1>

        <p style={{
          marginTop: 24, fontSize: 18, color: txDim, maxWidth: 520, lineHeight: 1.65,
          animation: 'fadeUpHero 0.8s ease 0.2s both',
        }}>
          PathForge builds a personalized academic plan — real courses, real clubs, real career prep — tailored to your school, your major, and where you want to end up.
        </p>

        <div className="lp-hero-buttons" style={{
          marginTop: 40, display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center',
          animation: 'fadeUpHero 0.8s ease 0.3s both',
        }}>
          <button className="lp-btn-demo" onClick={function() { setShowDevCode(false); onDemo(); }} style={{
            padding: '16px 36px', borderRadius: 100, border: 'none',
            background: dark ? 'linear-gradient(135deg, #C9A84C, #8B6914)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: dark ? '#000' : '#fff', fontFamily: sans,
            fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}>Try a Demo →</button>
        </div>

        {/* PRODUCT MOCK */}
        <div style={{
          marginTop: 48, width: '100%', maxWidth: 900, borderRadius: radius,
          overflow: 'hidden', border: '1px solid ' + (dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)'),
          background: '#111115',
          boxShadow: dark ? '0 40px 120px rgba(0,0,0,0.5)' : '0 40px 120px rgba(0,0,0,0.15)',
          animation: 'fadeUpHero 0.8s ease 0.45s both',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px',
            background: '#18181e', borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#28ca42' }} />
            <div style={{
              flex: 1, marginLeft: 12, padding: '6px 14px', borderRadius: 8,
              background: 'rgba(255,255,255,0.04)', fontSize: 12, color: '#5f5d6e',
            }}>pathforge-omega.vercel.app</div>
          </div>
          <div style={{ padding: 32 }}>
            <div className="lp-mock-row" style={{ display: 'flex', gap: 20 }}>
              <div className="lp-mock-sidebar" style={{ width: 200, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['📚 Courses', '🏆 Beyond Class', '💰 Outcomes', '🤖 AI Advisor', '🎯 Interviews'].map(function(item, i) {
                  var isActive = i === 0;
                  return (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10, fontSize: 13,
                      color: isActive ? '#C9A84C' : '#5f5d6e',
                      background: isActive ? 'rgba(201,168,76,0.25)' : 'transparent',
                      fontWeight: isActive ? 600 : 400,
                    }}>{item}</div>
                  );
                })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: 22, marginBottom: 4, color: '#f0eff4' }}>Investment Banking · Harvard</div>
                <div style={{ fontSize: 13, color: '#5f5d6e', marginBottom: 20 }}>Economics · Freshman Year · Fall Semester</div>
                <div className="lp-mock-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'CORE', badge: 'Required', isGreen: true, course: 'Principles of Economics', code: 'ECON 10A', progress: 100 },
                    { label: 'CORE', badge: 'Required', isGreen: true, course: 'Expository Writing', code: 'EXPOS 20', progress: 65 },
                    { label: 'QUANT', badge: 'Recommended', isGreen: false, course: 'Multivariable Calculus', code: 'MATH 21A', progress: 40 },
                    { label: 'ELECTIVE', badge: 'Suggested', isGreen: false, course: 'Financial Accounting', code: 'ECON 1723', progress: 20 },
                  ].map(function(c, i) {
                    return (
                      <div key={i} style={{ padding: 16, borderRadius: 12, background: '#18181e', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#9896a6' }}>{c.label}</span>
                          <span style={{
                            fontSize: 10, padding: '2px 8px', borderRadius: 100, fontWeight: 600,
                            background: c.isGreen ? 'rgba(0,230,118,0.15)' : 'rgba(255,189,46,0.15)',
                            color: c.isGreen ? '#00e676' : '#ffbd2e',
                          }}>{c.badge}</span>
                        </div>
                        <div style={{ fontSize: 14, color: '#f0eff4', fontWeight: 500, marginBottom: 4 }}>{c.course}</div>
                        <div style={{ fontSize: 11, color: '#5f5d6e', marginBottom: 8 }}>{c.code}</div>
                        <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 4, background: '#C9A84C', width: c.progress + '%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: '100px 24px', background: bg, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal="feat-head" style={revealStyle('feat-head')}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>Features</div>
            <div style={{ fontFamily: serif, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, maxWidth: 600, color: tx }}>Everything your academic advisor should be.</div>
            <p style={{ marginTop: 16, fontSize: 17, color: txDim, maxWidth: 520, lineHeight: 1.7 }}>PathForge doesn't just list courses — it builds a complete strategy from freshman year to your first job offer.</p>
          </div>
          <div className="lp-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 56 }}>
            {features.map(function(f, i) {
              var id = 'feat-' + i;
              return (
                <div key={i} className="lp-feature-card" data-reveal={id} style={Object.assign({}, revealStyle(id, i * 0.08), {
                  padding: '36px 30px', borderRadius: radius, background: bgCard,
                  border: '1px solid ' + bdr, cursor: 'default', position: 'relative', overflow: 'hidden',
                })}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, marginBottom: 20, background: accentSoft,
                  }}>{f.icon}</div>
                  <h3 style={{ fontFamily: serif, fontSize: 22, marginBottom: 10, letterSpacing: -0.3, color: tx }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: txDim, lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="lp-how" style={{ padding: '100px 24px', background: bgCard, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal="how-head" style={Object.assign({}, revealStyle('how-head'), { textAlign: 'center' })}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>How It Works</div>
            <div style={{ fontFamily: serif, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto', color: tx }}>Three steps. Five minutes. Full roadmap.</div>
          </div>
          <div className="lp-steps-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 40, marginTop: 56, position: 'relative' }}>
            <div className="lp-steps-line" style={{
              position: 'absolute', top: 36, left: '15%', right: '15%', height: 1,
              background: 'linear-gradient(90deg, transparent, ' + bdr + ', ' + bdr + ', transparent)',
            }} />
            {steps.map(function(s, i) {
              var id = 'step-' + i;
              return (
                <div key={i} data-reveal={id} style={Object.assign({}, revealStyle(id, i * 0.12), { textAlign: 'center', position: 'relative' })}>
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: serif, fontSize: 28, fontWeight: 400,
                    background: bg, border: '1px solid ' + bdr, color: accentLight,
                    position: 'relative', zIndex: 1,
                    boxShadow: dark ? 'none' : '0 4px 16px rgba(0,0,0,0.04)',
                  }}>{s.num}</div>
                  <h3 style={{ fontFamily: serif, fontSize: 22, marginBottom: 10, letterSpacing: -0.3, color: tx }}>{s.title}</h3>
                  <p style={{ fontSize: 14, color: txDim, lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ padding: '100px 24px', background: bg, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal="proof-head" style={Object.assign({}, revealStyle('proof-head'), { textAlign: 'center' })}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>What Students Say</div>
            <div style={{ fontFamily: serif, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto', color: tx }}>Built by students, for students.</div>
          </div>
          <div className="lp-proof-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
            {testimonials.map(function(t, i) {
              var id = 'proof-' + i;
              return (
                <div key={i} data-reveal={id} style={Object.assign({}, revealStyle(id, i * 0.1), {
                  padding: 32, borderRadius: radius, background: bgCard, border: '1px solid ' + bdr,
                })}>
                  <div style={{ color: starColor, fontSize: 14, letterSpacing: 2, marginBottom: 14 }}>★★★★★</div>
                  <p style={{ fontSize: 15, color: txDim, lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700,
                      background: accent, color: '#fff',
                    }}>{t.initial}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: tx }}>{t.name}</div>
                      <div style={{ fontSize: 12, color: txMut }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="lp-pricing" style={{ padding: '100px 24px', background: bgCard, transition: 'background 0.3s' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div data-reveal="pricing-head" style={Object.assign({}, revealStyle('pricing-head'), { textAlign: 'center', marginBottom: 16 })}>
            <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>Pricing</div>
            <div style={{ fontFamily: serif, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto', color: tx }}>Invest in your future.</div>
            <p style={{ color: txDim, fontSize: 17, maxWidth: 520, margin: '16px auto 0', lineHeight: 1.7 }}>Cancel anytime. No hidden fees.</p>
          </div>
          <PricingSection onSelectPlan={function(priceId) { startCheckout(priceId); }} user={user} onLogin={onLogin} darkMode={dark} />
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{
        textAlign: 'center', padding: '120px 24px', position: 'relative', background: bg,
        transition: 'background 0.3s',
      }}>
        <div data-reveal="cta-final" style={revealStyle('cta-final')}>
          <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, color: accentLight, fontWeight: 600, marginBottom: 16 }}>Ready?</div>
          <div style={{ fontFamily: serif, fontSize: 'clamp(36px, 4.5vw, 56px)', lineHeight: 1.1, letterSpacing: -1, margin: '0 auto 16px', maxWidth: 600, color: tx }}>Your future doesn't plan itself.</div>
          <p style={{ margin: '0 auto 40px', fontSize: 17, color: txDim, maxWidth: 520, lineHeight: 1.7 }}>Join students who are already using AI to navigate college smarter. It's free — no credit card, no sign-up wall.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="lp-btn-demo" onClick={onDemo} style={{
              padding: '16px 36px', borderRadius: 100, border: 'none',
              background: dark ? 'linear-gradient(135deg, #C9A84C, #8B6914)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: dark ? '#000' : '#fff', fontFamily: sans,
              fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>Try a Demo →</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid ' + bdr, textAlign: 'center', background: bg, transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
          <a href="/terms" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/pricing" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Pricing</a>
          <a href="/waitlist" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Waitlist</a>
          <a href="/contact" style={{ color: txMut, fontSize: 13, textDecoration: 'none' }}>Contact</a>
          <button onClick={function() { setShowDevCode(!showDevCode); setDevError(''); }} style={{ background: 'none', border: 'none', color: txMut, fontSize: 13, cursor: 'pointer', fontFamily: sans, padding: 0 }}>Beta Access</button>
        </div>
        {showDevCode && (
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
            <input type="text" placeholder="Enter access code" value={devCode}
              onChange={function(e) { setDevCode(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') handleDevSubmit(); }}
              style={{ padding: '8px 14px', borderRadius: 8, fontSize: 13, border: '1px solid ' + (devError ? '#ef4444' : bdr), background: dark ? '#111115' : '#f8f8fb', color: tx, outline: 'none', width: 160, fontFamily: sans }} />
            <button onClick={handleDevSubmit} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: sans }}>→</button>
          </div>
        )}
        {devError && <p style={{ color: '#ef4444', fontSize: 11, marginBottom: 8 }}>{devError}</p>}
        <p style={{ fontSize: 13, color: txMut }}>© 2026 PathForge · Built with AI, designed for ambition.</p>
      </footer>
    </div>
  );
}
