='use client';
import { useState } from 'react';
import { CAREER_OPTIONS } from '@/lib/constants';

export default function OnboardingFlow({ onComplete, onLoading, onError, onSaveRetry, user, onLogin, onBack }) {
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState('right');
  const [animKey, setAnimKey] = useState(0);
  const [name, setName] = useState(user ? (user.displayName || '').split(' ')[0] : '');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [programLevel, setProgramLevel] = useState(null);
  const [school, setSchool] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [customMajor, setCustomMajor] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  var goTo = function(s) { setSlideDir(s > step ? 'right' : 'left'); setAnimKey(function(k) { return k + 1; }); setStep(s); };
  var goBack = function(s) { setSlideDir('left'); setAnimKey(function(k) { return k + 1; }); setStep(s); };
  var slideClass = slideDir === 'right' ? 'slide-in-right' : 'slide-in-left';
  const handleBuild = async () => {
    if (!school.trim() && programLevel !== 'highschool') return;
    if (!selectedCareer) return;
    
    const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
    const isCustom = selectedCareer === 'custom';
    const major = customMajor.trim() || selectedMajor || '';

    if (programLevel === 'highschool') {
      var hsCareer = career || { id: selectedCareer, label: selectedCareer, icon: '🎯', color: '#1e1e1e', accent: '#C9A84C', majors: [] };
      var hsCareerGoal = isCustom ? customGoal : hsCareer.label;
      onLoading(true, selectedCareer, 'Building your high school roadmap...');

      var doHsFetch = function() {
        fetch('/api/generate-hs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ careerGoal: hsCareerGoal }),
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data && data.years && data.years.length > 0) {
            onComplete({
              name: name,
              career: selectedCareer,
              careerLabel: data.careerField || hsCareerGoal,
              programLevel: 'highschool',
              hsRoadmap: data,
              careerObj: hsCareer,
            });
          } else {
            console.error('HS: No years in response', Object.keys(data || {}));
            if (onError) onError();
          }
        })
        .catch(function(err) {
          console.error('HS fetch failed:', err);
          if (onError) onError();
        });
      };

      if (onSaveRetry) onSaveRetry(doHsFetch);
      doHsFetch();
      return;
    }

    onLoading(true, selectedCareer, 'Searching ' + school + "'s course catalog...");
    
    var doFetch = async function() {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schoolName: school,
            careerPath: isCustom ? customGoal : career.label,
            majorName: major,
            customGoal: isCustom ? customGoal : null,
            programLevel: programLevel,
          }),
        });
        if (!res.ok) throw new Error('API error');
        onLoading(true, selectedCareer, 'Building your roadmap...');
        const data = await res.json();
        if (data.semesters) {
          onComplete({
            name, career: selectedCareer,
            careerLabel: data.careerTitle || career.label,
            school, major: data.major || major,
            courseData: data, programLevel: programLevel,
            careerObj: isCustom ? { ...career, label: data.careerTitle || 'Custom Path' } : career,
          });
        } else { throw new Error('Invalid data'); }
      } catch (err) { console.error(err); if (onError) onError(); else { onLoading(false); } }
    };
    
    if (onSaveRetry) onSaveRetry(doFetch);
    doFetch();
  };

  const inp = { width: '100%', padding: '14px 20px', borderRadius: 12, border: '1px solid #333333', background: '#141414', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box' };
  const btn = (ok, a = '#C9A84C', bg = '#8B6914') => ({ marginTop: 16, padding: '13px 40px', borderRadius: 10, border: 'none', background: ok ? 'linear-gradient(135deg, ' + a + ', ' + bg + ')' : '#333333', color: ok ? '#000' : '#555', fontWeight: 700, fontSize: 15, cursor: ok ? 'pointer' : 'default', width: '100%', transition: 'all 0.3s' });
  const backBtn = { padding: '8px 16px', borderRadius: 8, border: '1px solid #333333', background: 'transparent', color: '#8a8a9a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 };

  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1e1e1e 50%, #0a0a0a 100%)', padding: 20, position: 'relative' }}>
      {onBack && <button onClick={onBack} style={{ position: 'fixed', top: 20, left: 20, zIndex: 50, padding: '8px 16px', borderRadius: 8, border: '1px solid #333333', background: 'rgba(20,20,20,0.8)', backdropFilter: 'blur(8px)', color: '#8a8a9a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>← Back</button>}
      <div style={{ maxWidth: 520, textAlign: 'center' }} className={slideClass} key={animKey}>
        
        <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(28px, 5vw, 42px)', color: '#fff', margin: '0 0 6px' }}>PathForge</h1>
        <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6 }}>AI-POWERED ACADEMIC ADVISING</p>
        <p style={{ color: '#8a8a9a', fontSize: 'clamp(14px, 2.5vw, 16px)', lineHeight: 1.6, marginBottom: 32 }}>Real courses. Real clubs. Career prep school won't teach you.<br />From high school to master's — personalized to you.</p>
        {user ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20, background: '#141414', border: '1px solid #333333', borderRadius: 12, padding: '10px 16px' }}>
              {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />}
              <span style={{ color: '#aaa', fontSize: 13 }}>Signed in as <strong style={{ color: '#fff' }}>{user.displayName}</strong></span>
            </div>
            <input type="text" placeholder="What's your first name?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && goTo(1)} style={{ ...inp, maxWidth: 340, textAlign: 'center' }} /><br />
            <button onClick={() => name.trim() && goTo(1)} disabled={!name.trim()} style={btn(!!name.trim())}>Get Started →</button>
          </div>
        ) : (
          <div>
            <input type="text" placeholder="What's your first name?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && goTo(1)} style={{ ...inp, maxWidth: 340, textAlign: 'center' }} /><br />
            <button onClick={() => name.trim() && goTo(1)} disabled={!name.trim()} style={btn(!!name.trim())}>Get Started →</button>
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ flex: 1, height: 1, background: '#333333' }} /><span style={{ color: '#6a6a7a', fontSize: 12 }}>or</span><div style={{ flex: 1, height: 1, background: '#333333' }} /></div>
            <button onClick={async function() { var u = await onLogin(); if (u) { setName((u.displayName || '').split(' ')[0]); } }} style={{ marginTop: 16, padding: '12px 40px', borderRadius: 10, border: '1px solid #333333', background: '#141414', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.3s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google to save progress
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1e1e1e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 600, width: '100%' }} className={slideClass} key={animKey}>
        <button onClick={() => goBack(0)} style={backBtn}>← Back</button>
        <p style={{ color: '#C9A84C', fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP 1 OF 4</p>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>Hey {name}, where do you want to go?</h2>
        <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 24 }}>Pick a career path — or describe your own.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {CAREER_OPTIONS.map((c) => {
            const sel = selectedCareer === c.id;
            return (
              <button key={c.id} onClick={() => { setSelectedCareer(c.id); if (c.majors.length) setSelectedMajor(c.majors[0]); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: sel ? '2px solid ' + c.accent : '1px solid #333333', background: sel ? c.color + '22' : '#141414', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left' }}>
                <span style={{ fontSize: 28 }}>{c.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{c.label}</div>
                  <div style={{ color: '#6a6a7a', fontSize: 12, marginTop: 2 }}>{c.id === 'custom' ? "Describe any career — we'll build your plan" : c.majors.join(' / ')}</div>
                </div>
                {sel && <span style={{ color: c.accent, fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>
        {selectedCareer === 'custom' && (
          <div style={{ marginTop: 16 }}>
            <label style={{ color: '#fbbf24', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Describe your dream career:</label>
            <textarea placeholder="e.g. I want to work in sports analytics for an NBA team..." value={customGoal} onChange={(e) => setCustomGoal(e.target.value)} rows={4} style={{ ...inp, resize: 'vertical', fontSize: 14, minHeight: 100, lineHeight: 1.5 }} />
          </div>
        )}
        <button onClick={() => { if (selectedCareer === 'custom' && !customGoal.trim()) return; if (selectedCareer) goTo(2); }} disabled={!selectedCareer || (selectedCareer === 'custom' && !customGoal.trim())} style={btn(selectedCareer && (selectedCareer !== 'custom' || customGoal.trim()), CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color)}>Continue →</button>
      </div>
    </div>
  );

  if (step === 2) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1e1e1e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%' }} className={slideClass} key={animKey}>
        <button onClick={() => goBack(1)} style={backBtn}>← Back</button>
        <p style={{ color: CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent || '#C9A84C', fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP 2 OF 4</p>
        <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>What level are you?</h2>
        <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 24 }}>This helps us tailor the roadmap to your program.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { id: 'highschool', label: 'High School', icon: '', desc: "Preparing for college applications" },
            { id: 'undergraduate', label: 'Undergraduate', icon: '', desc: "4-year bachelor's degree program" },
            { id: 'masters', label: "Master's / Graduate", icon: '', desc: 'Graduate-level degree program' },
          ].map((p) => {
            const sel = programLevel === p.id;
            const ac = CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent || '#C9A84C';
            const co = CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color || '#0A5C36';
            return (
              <button key={p.id} onClick={() => setProgramLevel(p.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 14, border: sel ? '2px solid ' + ac : '1px solid #333333', background: sel ? co + '22' : '#141414', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left' }}>
                {p.icon ? <span style={{ fontSize: 32 }}>{p.icon}</span> : null}
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{p.label}</div>
                  <div style={{ color: '#6a6a7a', fontSize: 13, marginTop: 2 }}>{p.desc}</div>
                </div>
                {sel && <span style={{ color: ac, fontSize: 18 }}>✓</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => { if (!programLevel) return; if (programLevel === 'highschool') goTo(4); else goTo(3); }} disabled={!programLevel} style={btn(!!programLevel, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color)}>Continue →</button>
      </div>
    </div>
  );

  const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
  const isCustom = selectedCareer === 'custom';
  const accent = career?.accent || '#C9A84C';
  const clr = career?.color || '#0A5C36';

  if (step === 3) {
    var suggestedMajors = career?.majors || [];
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1e1e1e 50%, #0a0a0a 100%)', padding: 20 }}>
        <div style={{ maxWidth: 520, width: '100%' }} className={slideClass} key={animKey}>
          <button onClick={() => goBack(2)} style={backBtn}>← Back</button>
          <p style={{ color: accent, fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP 3 OF 4</p>
          <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>What's your intended major?</h2>
          <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 20 }}>Pick a suggested major or type your own. You can always change or add more later.</p>
          {suggestedMajors.length > 0 && (
            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {suggestedMajors.map(function(m) {
                var sel = selectedMajor === m && !customMajor.trim();
                return (
                  <button key={m} onClick={function() { setSelectedMajor(m); setCustomMajor(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 12, border: sel ? '2px solid ' + accent : '1px solid #333333', background: sel ? clr + '22' : '#141414', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left' }}>
                    <span style={{ fontSize: 20 }}>📘</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 15, flex: 1 }}>{m}</span>
                    {sel && <span style={{ color: accent, fontSize: 18 }}>✓</span>}
                  </button>
                );
              })}
            </div>
          )}
          <div>
            <div style={{ color: '#6a6a7a', fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Or type your own</div>
            <input type="text" placeholder="e.g. Neuroscience, Public Policy, Art History..." value={customMajor} onChange={function(e) { setCustomMajor(e.target.value); if (e.target.value.trim()) setSelectedMajor(''); }} style={inp} />
          </div>
          <button onClick={() => goTo(4)} disabled={!selectedMajor && !customMajor.trim()} style={btn(!!(selectedMajor || customMajor.trim()), accent, clr)}>Continue →</button>
          <button onClick={function() { setSelectedMajor(''); setCustomMajor(''); goTo(4); }} style={{ marginTop: 8, padding: '10px 20px', borderRadius: 8, border: '1px solid #333333', background: 'transparent', color: '#6a6a7a', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%' }}>Skip — let AI recommend a major</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1e1e1e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%' }} className={slideClass} key={animKey}>
        <button onClick={() => goBack(programLevel === 'highschool' ? 2 : 3)} style={backBtn}>← Back</button>
        <p style={{ color: accent, fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP {programLevel === 'highschool' ? '3 OF 3' : '4 OF 4'}</p>
        {programLevel === 'highschool' ? (
          <>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>Ready to build your plan!</h2>
            <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 20 }}>We'll create a personalized 4-year high school roadmap to prepare you for top colleges in {isCustom ? customGoal : career.label}.</p>
            {isCustom && <div style={{ background: '#141414', border: '1px solid #fbbf2433', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}><div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>YOUR CUSTOM GOAL</div><p style={{ color: '#ccc', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{customGoal}</p></div>}
            <div style={{ background: '#0A5C3615', border: '1px solid #0A5C3633', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}><p style={{ color: '#8a8a9a', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Your roadmap includes <strong style={{ color: '#4ade80' }}>AP/Honors course recommendations</strong>, extracurriculars, top colleges, and a complete timeline for college applications.</p></div>
            <button onClick={handleBuild} style={btn(true, accent, clr)}>Build My High School Roadmap</button>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>Which school are you attending?</h2>
            <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 20 }}>We'll find real courses, clubs, AND everything your school won't teach you.</p>
            {(selectedMajor || customMajor.trim()) && (
              <div style={{ background: clr + '15', border: '1px solid ' + accent + '33', borderRadius: 12, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16 }}>📘</span>
                <span style={{ color: '#ccc', fontSize: 13 }}>Major: <strong style={{ color: accent }}>{customMajor.trim() || selectedMajor}</strong></span>
              </div>
            )}
            <input type="text" placeholder="e.g. Williams College, NYU, Stanford..." value={school} onChange={(e) => setSchool(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && school.trim() && handleBuild()} style={{ ...inp, marginBottom: 16 }} />
            {isCustom && <div style={{ background: '#141414', border: '1px solid #fbbf2433', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}><div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>YOUR CUSTOM GOAL</div><p style={{ color: '#ccc', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{customGoal}</p></div>}
            <div style={{ background: '#0A5C3615', border: '1px solid #0A5C3633', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}><p style={{ color: '#8a8a9a', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Your roadmap includes <strong style={{ color: '#4ade80' }}>what school won't teach you</strong> — technical skills, networking playbooks, interview prep, and insider tips.</p></div>
            <button onClick={handleBuild} disabled={!school.trim()} style={btn(!!school.trim(), accent, clr)}>Build My Roadmap</button>
          </>
        )}
      </div>
    </div>
  );
}
