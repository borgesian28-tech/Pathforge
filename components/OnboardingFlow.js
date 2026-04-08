'use client';
import { useState } from 'react';
import { CAREER_OPTIONS } from '@/lib/constants';

export default function OnboardingFlow({ onComplete, onLoading, onError, onSaveRetry, user, onLogin }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user ? (user.displayName || '').split(' ')[0] : '');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [programLevel, setProgramLevel] = useState(null);
  const [school, setSchool] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  const handleBuild = async () => {
    if (!school.trim() && programLevel !== 'highschool') return;
    if (!selectedCareer) return;
    const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
    const isCustom = selectedCareer === 'custom';
    const major = customMajor.trim() || selectedMajor || '';
    if (programLevel === 'highschool') {
      onLoading(true, selectedCareer, 'Building your high school roadmap...');
      var doHsFetch = async function() {
        try {
          const res = await fetch('/api/generate-hs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ careerGoal: isCustom ? customGoal : career.label }) });
          if (!res.ok) throw new Error('API error');
          const data = await res.json();
          if (data.years) {
            onComplete({ name, career: selectedCareer, careerLabel: data.careerField || career.label, programLevel: 'highschool', hsRoadmap: data, careerObj: isCustom ? { ...career, label: data.careerField || 'Custom Path' } : career });
          } else { throw new Error('Invalid data'); }
        } catch (err) { console.error(err); if (onError) onError(); else { onLoading(false); } }
      };
      if (onSaveRetry) onSaveRetry(doHsFetch);
      doHsFetch();
      return;
    }
    onLoading(true, selectedCareer, 'Searching ' + school + "'s course catalog...");
    var doFetch = async function() {
      try {
        const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolName: school, careerPath: isCustom ? customGoal : career.label, majorName: major, customGoal: isCustom ? customGoal : null, programLevel: programLevel }) });
        if (!res.ok) throw new Error('API error');
        onLoading(true, selectedCareer, 'Building your roadmap...');
        const data = await res.json();
        if (data.semesters) {
          onComplete({ name, career: selectedCareer, careerLabel: data.careerTitle || career.label, school, major: data.major || major, courseData: data, programLevel: programLevel, careerObj: isCustom ? { ...career, label: data.careerTitle || 'Custom Path' } : career });
        } else { throw new Error('Invalid data'); }
      } catch (err) { console.error(err); if (onError) onError(); else { onLoading(false); } }
    };
    if (onSaveRetry) onSaveRetry(doFetch);
    doFetch();
  };

  var bg = 'linear-gradient(160deg, #09090b 0%, #0f0f1a 40%, #09090b 100%)';
  var cardBg = '#131318';
  var borderC = '#1e1e28';
  var inp = { width: '100%', padding: '14px 20px', borderRadius: 10, border: '1px solid ' + borderC, background: cardBg, color: '#f0f0f2', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };
  var btn = (ok, a = '#C9A84C', bg2 = '#8B6914') => ({ marginTop: 16, padding: '13px 40px', borderRadius: 10, border: 'none', background: ok ? a : '#1c1c24', color: ok ? '#000' : '#555', fontWeight: 700, fontSize: 15, cursor: ok ? 'pointer' : 'default', width: '100%', transition: 'all 0.3s' });
  var backBtn = { padding: '8px 16px', borderRadius: 8, border: '1px solid #1e1e28', background: 'transparent', color: '#606070', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 };

  // ===== STEP 0: LANDING =====
  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 20 }}>
      <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }} className="fade-in">
        {/* Logo */}
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #C9A84C, #8B6914)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px #C9A84C33' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14.5 3L10.5 7H13V11L9 7L5 11V7.5L2 10.5V17L5 14V17.5L9 13.5L13 17.5V14L16 17V10.5L19.5 7L22 9.5V4L18.5 7.5L14.5 3Z" fill="white" opacity="0.9"/>
            <path d="M7 18L4 21H20L17 18H7Z" fill="white" opacity="0.7"/>
          </svg>
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 6vw, 48px)', color: '#f0f0f2', margin: '0 0 8px', fontWeight: 800, letterSpacing: -1 }}>PathForge</h1>
        <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>AI-Powered Academic Advising</p>
        <p style={{ color: '#606070', fontSize: 15, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, marginLeft: 'auto', marginRight: 'auto' }}>Real courses. Real clubs. Career prep school won't teach you. From high school to master's — personalized to you.</p>

        {/* Feature cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32, textAlign: 'left' }}>
          {[
            { icon: '📚', title: 'Real Courses', desc: 'Actual classes from your school catalog' },
            { icon: '🧭', title: 'Career Path', desc: 'Skills, networking, and insider tips' },
            { icon: '🎯', title: 'Interview Prep', desc: 'AI-powered mock interviews with feedback' },
          ].map(function(f, i) {
            return (
              <div key={i} style={{ background: cardBg, border: '1px solid ' + borderC, borderRadius: 12, padding: '14px 14px 16px', animation: 'fadeIn 0.5s ease forwards', animationDelay: (i * 0.1) + 's', opacity: 0 }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ color: '#f0f0f2', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{f.title}</div>
                <div style={{ color: '#606070', fontSize: 11, lineHeight: 1.5 }}>{f.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Login/Name */}
        {user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16, background: cardBg, border: '1px solid ' + borderC, borderRadius: 10, padding: '10px 16px' }}>
              {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />}
              <span style={{ color: '#a0a0b0', fontSize: 13 }}>Signed in as <strong style={{ color: '#f0f0f2' }}>{user.displayName}</strong></span>
            </div>
            <input type="text" placeholder="What's your first name?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)} style={{ ...inp, maxWidth: 360, textAlign: 'center', margin: '0 auto', display: 'block' }} /><br />
            <button onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={btn(!!name.trim())}>Get Started →</button>
          </div>
        ) : (
          <div>
            <input type="text" placeholder="What's your first name?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)} style={{ ...inp, maxWidth: 360, textAlign: 'center', margin: '0 auto', display: 'block' }} /><br />
            <button onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={btn(!!name.trim())}>Get Started →</button>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ flex: 1, height: 1, background: '#1e1e28' }} /><span style={{ color: '#404050', fontSize: 12 }}>or</span><div style={{ flex: 1, height: 1, background: '#1e1e28' }} /></div>
            <button onClick={onLogin} style={{ marginTop: 16, padding: '12px 24px', borderRadius: 10, border: '1px solid #1e1e28', background: cardBg, color: '#a0a0b0', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ===== STEP 1: CAREER GOAL =====
  if (step === 1) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 20 }}>
      <div style={{ maxWidth: 560, width: '100%' }} className="fade-in">
        <button onClick={() => setStep(0)} style={backBtn}>← Back</button>
        <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>Step 1</p>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#f0f0f2', margin: '0 0 6px', fontWeight: 700 }}>Hey {name}, what's your career goal?</h2>
        <p style={{ color: '#606070', fontSize: 14, marginBottom: 20 }}>Pick the path that excites you most. Don't worry — you can always change it.</p>
        <div style={{ display: 'grid', gap: 8 }}>
          {CAREER_OPTIONS.map((career) => {
            const sel = selectedCareer === career.id;
            return (
              <button key={career.id} onClick={() => { setSelectedCareer(career.id); if (career.id !== 'custom') setTimeout(() => setStep(2), 200); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, border: sel ? '2px solid ' + career.accent : '1px solid #1e1e28', background: sel ? career.color + '22' : cardBg, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                <span style={{ fontSize: 28 }}>{career.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f0f0f2', fontWeight: 600, fontSize: 15 }}>{career.label}</div>
                </div>
                {sel && <span style={{ color: career.accent, fontSize: 16 }}>✓</span>}
              </button>
            );
          })}
        </div>
        {selectedCareer === 'custom' && (
          <div style={{ marginTop: 12 }}>
            <input type="text" placeholder="Describe your career goal..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} style={inp} />
            <button onClick={() => customGoal.trim() && setStep(2)} disabled={!customGoal.trim()} style={btn(!!customGoal.trim())}>Continue →</button>
          </div>
        )}
      </div>
    </div>
  );

  // ===== STEP 2: PROGRAM LEVEL =====
  if (step === 2) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 20 }}>
      <div style={{ maxWidth: 560, width: '100%' }} className="fade-in">
        <button onClick={() => setStep(1)} style={backBtn}>← Back</button>
        <p style={{ color: CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent || '#C9A84C', fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>Step 2</p>
        <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#f0f0f2', margin: '0 0 6px', fontWeight: 700 }}>What level are you?</h2>
        <p style={{ color: '#606070', fontSize: 14, marginBottom: 20 }}>This helps us tailor the roadmap to your program.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {[
            { id: 'highschool', label: 'High School', icon: '📖', desc: "Preparing for college applications" },
            { id: 'undergraduate', label: 'Undergraduate', icon: '🎓', desc: "4-year bachelor's degree program" },
            { id: 'masters', label: "Master's / Graduate", icon: '📚', desc: 'Graduate-level degree program' },
          ].map((p) => {
            const sel = programLevel === p.id;
            const ac = CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent || '#C9A84C';
            const co = CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color || '#0A5C36';
            return (
              <button key={p.id} onClick={() => setProgramLevel(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 12, border: sel ? '2px solid ' + ac : '1px solid #1e1e28', background: sel ? co + '22' : cardBg, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                <span style={{ fontSize: 28 }}>{p.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f0f0f2', fontWeight: 600, fontSize: 15 }}>{p.label}</div>
                  <div style={{ color: '#606070', fontSize: 12, marginTop: 2 }}>{p.desc}</div>
                </div>
                {sel && <span style={{ color: ac, fontSize: 16 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => { if (!programLevel) return; if (programLevel === 'highschool') setStep(4); else setStep(3); }} disabled={!programLevel} style={btn(!!programLevel, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color)}>Continue →</button>
      </div>
    </div>
  );

  const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
  const isCustom = selectedCareer === 'custom';
  const accent = career?.accent || '#C9A84C';
  const clr = career?.color || '#0A5C36';

  // ===== STEP 3: MAJOR =====
  if (step === 3) {
    var suggestedMajors = career?.majors || [];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 20 }}>
        <div style={{ maxWidth: 560, width: '100%' }} className="fade-in">
          <button onClick={() => setStep(2)} style={backBtn}>← Back</button>
          <p style={{ color: accent, fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>Step 3</p>
          <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#f0f0f2', margin: '0 0 6px', fontWeight: 700 }}>What's your intended major?</h2>
          <p style={{ color: '#606070', fontSize: 14, marginBottom: 20 }}>Pick a suggested major or type your own. You can change or add more later.</p>
          {suggestedMajors.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {suggestedMajors.map(function(m) {
                var sel = selectedMajor === m && !customMajor.trim();
                return (
                  <button key={m} onClick={function() { setSelectedMajor(m); setCustomMajor(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: sel ? '2px solid ' + accent : '1px solid #1e1e28', background: sel ? clr + '22' : cardBg, cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                    <span style={{ fontSize: 18 }}>📘</span>
                    <span style={{ color: '#f0f0f2', fontWeight: 600, fontSize: 14, flex: 1 }}>{m}</span>
                    {sel && <span style={{ color: accent, fontSize: 16 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <div style={{ color: '#404050', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Or type your own</div>
            <input type="text" placeholder="e.g. Neuroscience, Public Policy, Art History..." value={customMajor} onChange={function(e) { setCustomMajor(e.target.value); if (e.target.value.trim()) setSelectedMajor(''); }} style={inp} />
          </div>
          <button onClick={() => setStep(4)} disabled={!selectedMajor && !customMajor.trim()} style={btn(!!(selectedMajor || customMajor.trim()), accent, clr)}>Continue →</button>
          <button onClick={function() { setSelectedMajor(''); setCustomMajor(''); setStep(4); }} style={{ marginTop: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid #1e1e28', background: 'transparent', color: '#606070', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Skip — let AI recommend</button>
        </div>
      </div>
    );
  }

  // ===== STEP 4: SCHOOL / FINAL =====
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 20 }}>
      <div style={{ maxWidth: 560, width: '100%' }} className="fade-in">
        <button onClick={() => setStep(programLevel === 'highschool' ? 2 : 3)} style={backBtn}>← Back</button>
        <p style={{ color: accent, fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase' }}>Final Step</p>
        {programLevel === 'highschool' ? (
          <>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#f0f0f2', margin: '0 0 6px', fontWeight: 700 }}>Ready to build your plan!</h2>
            <p style={{ color: '#606070', fontSize: 14, marginBottom: 20 }}>We'll create a personalized 4-year high school roadmap to prepare you for top colleges in {isCustom ? customGoal : career.label}.</p>
            {isCustom && <div style={{ background: cardBg, border: '1px solid #fbbf2433', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}><div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your Custom Goal</div><p style={{ color: '#a0a0b0', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{customGoal}</p></div>}
            <div style={{ background: '#16a34a0a', border: '1px solid #16a34a22', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 16, marginTop: 1 }}>🎓</span><p style={{ color: '#606070', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Your roadmap includes <strong style={{ color: '#4ade80' }}>AP/Honors course recommendations</strong>, extracurriculars, top colleges, and a complete timeline for college applications.</p></div>
            <button onClick={handleBuild} style={btn(true, accent, clr)}>Build My High School Roadmap →</button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 'clamp(24px, 4vw, 32px)', color: '#f0f0f2', margin: '0 0 6px', fontWeight: 700 }}>Which school are you attending?</h2>
            <p style={{ color: '#606070', fontSize: 14, marginBottom: 20 }}>We'll find real courses, clubs, and everything your school won't teach you.</p>
            {(selectedMajor || customMajor.trim()) && (
              <div style={{ background: clr + '12', border: '1px solid ' + accent + '22', borderRadius: 10, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14 }}>📘</span>
                <span style={{ color: '#a0a0b0', fontSize: 13 }}>Major: <strong style={{ color: accent }}>{customMajor.trim() || selectedMajor}</strong></span>
              </div>
            )}
            <input type="text" placeholder="e.g. Williams College, NYU, Stanford..." value={school} onChange={(e) => setSchool(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && school.trim() && handleBuild()} style={{ ...inp, marginBottom: 16 }} />
            {isCustom && <div style={{ background: cardBg, border: '1px solid #fbbf2433', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}><div style={{ color: '#fbbf24', fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Your Custom Goal</div><p style={{ color: '#a0a0b0', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{customGoal}</p></div>}
            <div style={{ background: '#16a34a0a', border: '1px solid #16a34a22', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}><span style={{ fontSize: 16, marginTop: 1 }}>⚡</span><p style={{ color: '#606070', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Your roadmap includes <strong style={{ color: '#4ade80' }}>what school won't teach you</strong> — technical skills, networking playbooks, interview prep, and insider tips.</p></div>
            <button onClick={handleBuild} disabled={!school.trim()} style={btn(!!school.trim(), accent, clr)}>Search & Build My Roadmap →</button>
          </>
        )}
      </div>
    </div>
  );
}
