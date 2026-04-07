'use client';
import { useState } from 'react';

export default function HSCourseAdvisor({ accent = '#8b5cf6', primaryColor = '#6366f1' }) {
  const [careerGoal, setCareerGoal] = useState('');
  const [courses, setCourses] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async function() {
    if (!careerGoal.trim() || !courses.trim()) {
      alert('Please fill in both fields');
      return;
    }
    
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/hs-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ careerGoal: careerGoal.trim(), courses: courses.trim() }),
      });
      
      if (!response.ok) throw new Error('Failed to get recommendations');
      
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert('Could not get recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: '#0a0a0f', 
      border: '1px solid #1e1e32', 
      borderRadius: 16, 
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      zIndex: 1000,
      maxWidth: 420,
      width: '90vw'
    }}>
      <div style={{ 
        background: `linear-gradient(135deg, ${primaryColor}44, #111122)`, 
        borderBottom: '1px solid #1e1e32',
        padding: '14px 18px',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}>
        <span style={{ fontSize: 20 }}>🎓</span>
        <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: 0, flex: 1 }}>
          High School Course Advisor
        </h3>
      </div>

      <div style={{ padding: '16px 18px' }}>
        {!result ? (
          <>
            <p style={{ color: '#aaa', fontSize: 13, marginTop: 0, marginBottom: 14, lineHeight: 1.5 }}>
              Not sure which courses to take senior year? Get personalized recommendations based on your career goals.
            </p>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: '#ccc', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                What do you want to study in college?
              </label>
              <input
                type="text"
                placeholder="e.g., Dentistry, Computer Science, Business"
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111122',
                  border: '1px solid #1e1e32',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = accent}
                onBlur={(e) => e.target.style.borderColor = '#1e1e32'}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: '#ccc', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                Which courses are you choosing between?
              </label>
              <textarea
                placeholder="e.g., AP Statistics vs Honors Physics"
                value={courses}
                onChange={(e) => setCourses(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  background: '#111122',
                  border: '1px solid #1e1e32',
                  borderRadius: 8,
                  padding: '10px 12px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = accent}
                onBlur={(e) => e.target.style.borderColor = '#1e1e32'}
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#333' : accent,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 16px',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Analyzing...' : 'Get Recommendations'}
            </button>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                background: `${accent}22`, 
                borderLeft: `3px solid ${accent}`,
                borderRadius: 6,
                padding: '12px 14px',
                marginBottom: 14
              }}>
                <div style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' }}>
                  Recommendation
                </div>
                <div style={{ color: '#fff', fontSize: 15, fontWeight: 600 }}>
                  {result.recommendation}
                </div>
              </div>

              <div style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                {result.reasoning}
              </div>

              {result.details && result.details.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ color: '#aaa', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
                    Why this matters:
                  </div>
                  {result.details.map((detail, i) => (
                    <div key={i} style={{ 
                      color: '#8a8a9a', 
                      fontSize: 12, 
                      marginBottom: 6,
                      paddingLeft: 16,
                      position: 'relative'
                    }}>
                      <span style={{ position: 'absolute', left: 0 }}>•</span>
                      {detail}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => { setResult(null); setCareerGoal(''); setCourses(''); }}
              style={{
                width: '100%',
                background: 'transparent',
                color: accent,
                border: `1px solid ${accent}44`,
                borderRadius: 8,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Get Another Recommendation
            </button>
          </>
        )}
      </div>
    </div>
  );
}
