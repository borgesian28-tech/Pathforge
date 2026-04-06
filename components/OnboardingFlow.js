'use client';
import { useState } from 'react';
import { CAREER_OPTIONS } from '@/lib/constants';

export default function OnboardingFlow({ onComplete, onLoading }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [school, setSchool] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');
  const [customGoal, setCustomGoal] = useState('');

  const handleBuild = async () => {
    if (!school.trim() || !selectedCareer) return;
    const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
    const isCustom = selectedCareer === 'custom';
    const major = isCustom ? '' : (selectedMajor || career.majors[0]);

    onLoading(true, selectedCareer, 'Searching ' + school + '\'s course catalog...');

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: school,
          careerPath: isCustom ? customGoal : career.label,
          majorName: major,
          customGoal: isCustom ? customGoal : null,
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
          courseData: data,
          careerObj: isCustom ? { ...career, label: data.careerTitle || 'Custom Path' } : career,
        });
      } else {
        throw new Error('Invalid data');
      }
    } catch (err) {
      console.error(err);
      onLoading(false);
      alert('Couldn\'t fetch data. Please try again.');
    }
  };

  const inp = { width: '100%', padding: '14px 20px', borderRadius: 12, border: '1px solid #2a2a3e', background: '#111122', color: '#fff', fontSize: 16, outline: 'none', boxSizing: 'border-box' };
  const btn = (ok, a = '#C9A84C', bg = '#8B6914') => ({ marginTop: 16, padding: '13px 40px', borderRadius: 10, border: 'none', background: ok ? `linear-gradient(135deg, ${a}, ${bg})` : '#2a2a3e', color: ok ? '#000' : '#555', fontWeight: 700, fontSize: 15, cursor: ok ? 'pointer' : 'default', width: '100%', transition: 'all 0.3s' });

  if (step === 0) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }} className="fade-in">
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px, 5vw, 42px)', color: '#fff', margin: '0 0 6px' }}>PathForge</h1>
        <p style={{ color: '#C9A84C', fontSize: 13, fontWeight: 600, letterSpacing: 2, marginBottom: 6 }}>AI-POWERED COLLEGE ADVISING</p>
        <p style={{ color: '#8a8a9a', fontSize: 'clamp(14px, 2.5vw, 16px)', lineHeight: 1.6, marginBottom: 32 }}>Real courses. Real clubs. Career prep college won't teach you.<br />Personalized to your school.</p>
        <input type="text" placeholder="What's your first name?" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(1)} style={{ ...inp, maxWidth: 340, textAlign: 'center' }} /><br />
        <button onClick={() => name.trim() && setStep(1)} disabled={!name.trim()} style={btn(!!name.trim())}>Get Started →</button>
      </div>
    </div>
  );

  if (step === 1) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 600, width: '100%' }} className="fade-in">
        <p style={{ color: '#C9A84C', fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP 1 OF 2</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>Hey {name}, where do you want to go?</h2>
        <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 24 }}>Pick a career path — or describe your own.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {CAREER_OPTIONS.map((c) => {
            const sel = selectedCareer === c.id;
            return (
              <button key={c.id} onClick={() => { setSelectedCareer(c.id); if (c.majors.length) setSelectedMajor(c.majors[0]); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', borderRadius: 14, border: sel ? `2px solid ${c.accent}` : '1px solid #2a2a3e', background: sel ? `${c.color}22` : '#111122', cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left' }}>
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
        <button onClick={() => { if (selectedCareer === 'custom' && !customGoal.trim()) return; if (selectedCareer) setStep(2); }} disabled={!selectedCareer || (selectedCareer === 'custom' && !customGoal.trim())} style={btn(selectedCareer && (selectedCareer !== 'custom' || customGoal.trim()), CAREER_OPTIONS.find(c => c.id === selectedCareer)?.accent, CAREER_OPTIONS.find(c => c.id === selectedCareer)?.color)}>Continue →</button>
      </div>
    </div>
  );

  const career = CAREER_OPTIONS.find((c) => c.id === selectedCareer);
  const isCustom = selectedCareer === 'custom';
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%)', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%' }} className="fade-in">
        <p style={{ color: career.accent, fontSize: 14, fontWeight: 600, letterSpacing: 2, marginBottom: 8 }}>STEP 2 OF 2</p>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 4vw, 34px)', color: '#fff', margin: '0 0 8px' }}>Which school are you attending?</h2>
        <p style={{ color: '#8a8a9a', fontSize: 15, marginBottom: 20 }}>We'll find real courses, clubs, AND everything your school won't teach you.</p>
        <input type="text" placeholder="e.g. Williams College, NYU, Stanford..." value={school} onChange={(e) => setSchool(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && school.trim() && handleBuild()} style={{ ...inp, marginBottom: 16 }} />
        {!isCustom && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#8a8a9a', fontSize: 13, display: 'block', marginBottom: 8 }}>Preferred major:</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {career.majors.map((m) => (<button key={m} onClick={() => setSelectedMajor(m)} style={{ padding: '8px 16px', borderRadius: 20, border: 'none', background: selectedMajor === m ? career.accent : '#1a1a2e', color: selectedMajor === m ? '#000' : '#aaa', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{m}</button>))}
            </div>
          </div>
        )}
        {isCustom && <div style={{ background: '#111122', border: '1px solid #fbbf2433', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}><div style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>YOUR CUSTOM GOAL</div><p style={{ color: '#ccc', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{customGoal}</p></div>}
        <div style={{ background: '#0A5C3615', border: '1px solid #0A5C3633', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, marginTop: 1 }}>🚀</span>
          <p style={{ color: '#8a8a9a', fontSize: 13, margin: 0, lineHeight: 1.5 }}>Your roadmap includes <strong style={{ color: '#4ade80' }}>what college won't teach you</strong> — technical skills, networking playbooks, interview prep, and insider tips.</p>
        </div>
        <button onClick={handleBuild} disabled={!school.trim()} style={btn(!!school.trim(), career.accent, career.color)}>🚀 Search & Build My Roadmap</button>
      </div>
    </div>
  );
}
