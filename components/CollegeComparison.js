'use client';
import { useState } from 'react';

export default function CollegeComparison({ darkMode, accent, primaryColor }) {
  var [college1, setCollege1] = useState('');
  var [college2, setCollege2] = useState('');
  var [loading, setLoading] = useState(false);
  var [result, setResult] = useState(null);

  var dm = darkMode;
  var bg = dm ? '#09090b' : '#fafafa';
  var bgCard = dm ? '#131318' : '#ffffff';
  var bgSec = dm ? '#19191f' : '#f0f0f4';
  var bdr = dm ? '#1e1e28' : '#e2e2e8';
  var tx = dm ? '#f0f0f2' : '#111118';
  var txSub = dm ? '#a0a0b0' : '#444450';
  var txMut = dm ? '#606070' : '#777784';

  var compare = function() {
    if (!college1.trim() || !college2.trim() || loading) return;
    setLoading(true);
    setResult(null);

    var prompt = 'Compare these two colleges side by side: "' + college1.trim() + '" vs "' + college2.trim() + '".\n\n' +
      'Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:\n' +
      '{"college1":{"name":"Full Name","location":"City, State","type":"Private/Public","founded":"Year","enrollment":"XX,XXX","acceptanceRate":"XX%","avgGPA":"X.XX","satRange":"XXXX-XXXX","actRange":"XX-XX","ranking":"#XX National","tuition":"$XX,XXX/year","financialAid":"XX% receive aid","topMajors":["Major1","Major2","Major3","Major4","Major5"],"studentFaculty":"XX:1","setting":"Urban/Suburban/Rural","athletics":"Division X","notableAlumni":"Name1, Name2, Name3"},"college2":{same fields}}\n\nCRITICAL: notableAlumni must be a comma-separated string of 3 real well-known alumni (e.g. "Elon Musk, Bill Gates, Sheryl Sandberg"). All stats must be accurate and consistent — use real published data.';

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        context: 'You are a college admissions data expert. Return ONLY raw JSON, no markdown, no explanation. All data must be accurate.'
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      var reply = (data.reply || '').trim();
      reply = reply.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
      var startIdx = reply.indexOf('{');
      var endIdx = reply.lastIndexOf('}');
      if (startIdx !== -1 && endIdx > startIdx) {
        reply = reply.substring(startIdx, endIdx + 1);
      }
      try {
        var parsed = JSON.parse(reply);
        setResult(parsed);
      } catch(e) {
        try {
          var fixed = reply.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
          setResult(JSON.parse(fixed));
        } catch(e2) {
          console.error('Parse failed:', e2);
          setResult(null);
        }
      }
      setLoading(false);
    })
    .catch(function() { setLoading(false); });
  };

  var rows = [
    { label: 'Location', key: 'location' },
    { label: 'Type', key: 'type' },
    { label: 'Founded', key: 'founded' },
    { label: 'Enrollment', key: 'enrollment' },
    { label: 'Acceptance Rate', key: 'acceptanceRate', highlight: true },
    { label: 'Avg GPA', key: 'avgGPA', highlight: true },
    { label: 'SAT Range', key: 'satRange', highlight: true },
    { label: 'ACT Range', key: 'actRange' },
    { label: 'Ranking', key: 'ranking', highlight: true },
    { label: 'Tuition', key: 'tuition' },
    { label: 'Financial Aid', key: 'financialAid' },
    { label: 'Student:Faculty', key: 'studentFaculty' },
    { label: 'Setting', key: 'setting' },
    { label: 'Athletics', key: 'athletics' },
    { label: 'Notable Alumni', key: 'notableAlumni' },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
        <h3 style={{ color: tx, fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>College Comparison</h3>
        <p style={{ color: txMut, fontSize: 14, margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>Compare two colleges side by side — admissions, academics, cost, and more.</p>
      </div>

      {!result && !loading && (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: txSub, fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>College 1</label>
            <input type="text" placeholder="e.g. MIT, Stanford, NYU..." value={college1}
              onChange={function(e) { setCollege1(e.target.value); }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ textAlign: 'center', color: txMut, fontSize: 13, fontWeight: 700, margin: '8px 0' }}>VS</div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: txSub, fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>College 2</label>
            <input type="text" placeholder="e.g. Harvard, UCLA, Georgetown..." value={college2}
              onChange={function(e) { setCollege2(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') compare(); }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={compare} disabled={!college1.trim() || !college2.trim()}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: college1.trim() && college2.trim() ? 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')' : bgSec, color: college1.trim() && college2.trim() ? '#fff' : txMut, fontWeight: 700, fontSize: 15, cursor: college1.trim() && college2.trim() ? 'pointer' : 'default' }}>
            ⚖️ Compare Colleges
          </button>

          <div style={{ marginTop: 20 }}>
            <div style={{ color: txMut, fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Popular Comparisons</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[['MIT', 'Stanford'], ['Harvard', 'Yale'], ['NYU', 'Columbia'], ['UCLA', 'USC'], ['Duke', 'UNC']].map(function(pair, i) {
                return (<button key={i} onClick={function() { setCollege1(pair[0]); setCollege2(pair[1]); }}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>{pair[0]} vs {pair[1]}</button>);
              })}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accent, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: tx, fontSize: 15, fontWeight: 600 }}>Comparing {college1} vs {college2}...</p>
        </div>
      )}

      {result && result.college1 && result.college2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={function() { setResult(null); setCollege1(''); setCollege2(''); }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', color: txSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← New Comparison</button>
          </div>

          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 0, marginBottom: 2 }}>
            <div style={{ padding: '14px 12px' }} />
            <div style={{ padding: '14px 16px', background: accent + '15', borderRadius: '12px 0 0 0', textAlign: 'center' }}>
              <div style={{ color: accent, fontSize: 16, fontWeight: 700 }}>{result.college1.name}</div>
            </div>
            <div style={{ padding: '14px 16px', background: primaryColor + '15', borderRadius: '0 12px 0 0', textAlign: 'center' }}>
              <div style={{ color: primaryColor, fontSize: 16, fontWeight: 700 }}>{result.college2.name}</div>
            </div>
          </div>

          {/* Data rows */}
          {rows.map(function(row, i) {
            var v1 = result.college1[row.key] || 'N/A';
            var v2 = result.college2[row.key] || 'N/A';
            var isLast = i === rows.length - 1;
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 0, borderBottom: isLast ? 'none' : '1px solid ' + bdr }}>
                <div style={{ padding: '10px 12px', color: txMut, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center' }}>{row.label}</div>
                <div style={{ padding: '10px 16px', background: row.highlight ? (accent + '08') : 'transparent', textAlign: 'center' }}>
                  <span style={{ color: row.highlight ? tx : txSub, fontSize: 13, fontWeight: row.highlight ? 600 : 400 }}>{v1}</span>
                </div>
                <div style={{ padding: '10px 16px', background: row.highlight ? (primaryColor + '08') : 'transparent', textAlign: 'center' }}>
                  <span style={{ color: row.highlight ? tx : txSub, fontSize: 13, fontWeight: row.highlight ? 600 : 400 }}>{v2}</span>
                </div>
              </div>
            );
          })}

          {/* Top Majors */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', gap: 0, borderTop: '1px solid ' + bdr, paddingTop: 2 }}>
            <div style={{ padding: '10px 12px', color: txMut, fontSize: 12, fontWeight: 600 }}>Top Majors</div>
            <div style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(result.college1.topMajors || []).map(function(m, j) { return <span key={j} style={{ background: accent + '12', color: accent, padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>{m}</span>; })}
              </div>
            </div>
            <div style={{ padding: '10px 16px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(result.college2.topMajors || []).map(function(m, j) { return <span key={j} style={{ background: primaryColor + '12', color: primaryColor, padding: '3px 8px', borderRadius: 6, fontSize: 11 }}>{m}</span>; })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
