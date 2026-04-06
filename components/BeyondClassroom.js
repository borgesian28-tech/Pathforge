'use client';
import { useState } from 'react';

export default function BeyondClassroom({ data, accent, color }) {
  const [openSection, setOpenSection] = useState('technical');

  if (!data) return (
    <div style={{ marginTop: 20, padding: 20, background: '#111122', borderRadius: 14, border: '1px solid #1e1e32', textAlign: 'center' }}>
      <p style={{ color: '#8a8a9a' }}>Beyond the Classroom data not available. Try regenerating your roadmap.</p>
    </div>
  );

  var isValidUrl = function(url) {
    if (!url || typeof url !== 'string') return false;
    url = url.trim();
    if (url === '' || url === '#') return false;
    if (url.indexOf('example.com') !== -1) return false;
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return false;
    return true;
  };

  var ResourceLink = function({ r }) {
    var hasLink = isValidUrl(r.url);
    if (hasLink) {
      return (
        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#111122', borderRadius: 8, textDecoration: 'none', border: '1px solid #1e1e32' }}>
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.name}</div>
            <div style={{ color: '#6a6a7a', fontSize: 11, marginTop: 2 }}>{r.type} • {r.time}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ color: r.cost === 'Free' ? '#4ade80' : accent, fontSize: 12, fontWeight: 600 }}>{r.cost}</span>
            <span style={{ color: accent, fontSize: 14 }}>↗</span>
          </div>
        </a>
      );
    }
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#111122', borderRadius: 8, border: '1px solid #1e1e32' }}>
        <div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.name} <span style={{ color: '#6a6a7a', fontSize: 11 }}>(search online)</span></div>
          <div style={{ color: '#6a6a7a', fontSize: 11, marginTop: 2 }}>{r.type} • {r.time}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ color: r.cost === 'Free' ? '#4ade80' : accent, fontSize: 12, fontWeight: 600 }}>{r.cost}</span>
        </div>
      </div>
    );
  };

  var InterviewLink = function({ r }) {
    var hasLink = isValidUrl(r.url);
    if (hasLink) {
      return (
        <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 14px', background: '#0a0a18', borderRadius: 8, textDecoration: 'none', border: '1px solid #1e1e32' }}>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.name} <span style={{ color: accent }}>↗</span></div>
          <div style={{ color: '#8a8a9a', fontSize: 12, marginTop: 2 }}>{r.desc}</div>
        </a>
      );
    }
    return (
      <div style={{ display: 'block', padding: '10px 14px', background: '#0a0a18', borderRadius: 8, border: '1px solid #1e1e32' }}>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{r.name} <span style={{ color: '#6a6a7a', fontSize: 11 }}>(search online)</span></div>
        <div style={{ color: '#8a8a9a', fontSize: 12, marginTop: 2 }}>{r.desc}</div>
      </div>
    );
  };

  const Section = ({ id, icon, title, children }) => {
    const open = openSection === id;
    return (
      <div style={{ background: '#111122', border: open ? `1px solid ${accent}44` : '1px solid #1e1e32', borderRadius: 14, overflow: 'hidden', transition: 'all 0.3s' }}>
        <button onClick={() => setOpenSection(open ? null : id)} style={{ width: '100%', padding: '16px 18px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>{icon}</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{title}</span>
          </div>
          <span style={{ color: '#6a6a7a', fontSize: 18, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
        </button>
        {open && <div style={{ padding: '0 18px 18px' }}>{children}</div>}
      </div>
    );
  };

  return (
    <div style={{ marginTop: 20 }}>
      {data.intro && (
        <div style={{ background: 'linear-gradient(135deg, #ff640022, #111122)', border: '1px solid #ff640044', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ color: '#ff6400', fontSize: 12, fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>WHY THIS MATTERS</div>
            <p style={{ color: '#ccc', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{data.intro}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        <Section id="technical" icon="🛠️" title="Technical Skills to Self-Teach">
          <div style={{ display: 'grid', gap: 12 }}>
            {data.technicalSkills?.map((s, i) => (
              <div key={i} style={{ background: '#0a0a18', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{s.skill}</div>
                <p style={{ color: '#8a8a9a', fontSize: 12, margin: '6px 0 10px', lineHeight: 1.5 }}>{s.why}</p>
                {s.semester && <div style={{ color: accent, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>📅 Best timing: {s.semester}</div>}
                <div style={{ display: 'grid', gap: 6 }}>
                  {s.resources?.map((r, j) => (
                    <ResourceLink key={j} r={r} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="networking" icon="🤝" title="Networking Playbook">
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${accent}, transparent)` }} />
            {data.networkingPlaybook?.map((p, i) => (
              <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -17, top: 4, width: 10, height: 10, borderRadius: '50%', background: accent, border: '2px solid #08080f' }} />
                <div style={{ color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>{p.phase}</div>
                <div style={{ color: '#6a6a7a', fontSize: 11, marginBottom: 6 }}>{p.semester}</div>
                {p.actions?.map((a, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
                    <span style={{ color: accent, fontSize: 10, marginTop: 5, flexShrink: 0 }}>●</span>
                    <span style={{ color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>{a}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Section id="interview" icon="🎯" title="Interview Prep Guide">
          {data.interviewPrep?.map((cat, i) => (
            <div key={i} style={{ marginBottom: i < data.interviewPrep.length - 1 ? 14 : 0 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{cat.category}</div>
              <div style={{ color: accent, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>📅 Start: {cat.timeline}</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {cat.resources?.map((r, j) => (
                  <InterviewLink key={j} r={r} />
                ))}
              </div>
            </div>
          ))}
        </Section>

        <Section id="habits" icon="📆" title="Weekly Habits & Routines">
          <div style={{ display: 'grid', gap: 8 }}>
            {data.weeklyHabits?.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 14px', background: '#0a0a18', borderRadius: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, border: '2px solid #3a3a4e', flexShrink: 0, marginTop: 1 }} />
                <span style={{ color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>{h}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="insider" icon="💎" title="Insider Tips Most Students Miss">
          <div style={{ display: 'grid', gap: 8 }}>
            {data.careerInsiderTips?.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 14px', background: `${accent}08`, borderRadius: 8, borderLeft: `3px solid ${accent}` }}>
                <span style={{ color: accent, fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
                <span style={{ color: '#ccc', fontSize: 13, lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
