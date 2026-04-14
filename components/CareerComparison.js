'use client';
import { useState } from 'react';

export default function CareerComparison({ darkMode, accent, primaryColor }) {
  var [career1, setCareer1] = useState('');
  var [career2, setCareer2] = useState('');
  var [loading, setLoading] = useState(false);
  var [result, setResult] = useState(null);

  var dm = darkMode;
  var bgCard = dm ? '#131318' : '#ffffff';
  var bgSec = dm ? '#19191f' : '#f0f0f4';
  var bdr = dm ? '#1e1e28' : '#e2e2e8';
  var tx = dm ? '#f0f0f2' : '#111118';
  var txSub = dm ? '#a0a0b0' : '#444450';
  var txMut = dm ? '#606070' : '#777784';

  var compare = function() {
    if (!career1.trim() || !career2.trim() || loading) return;
    setLoading(true);
    setResult(null);

    var prompt = 'Compare these two careers side by side: "' + career1.trim() + '" vs "' + career2.trim() + '".\n\n' +
      'Return ONLY a valid JSON object (no markdown, no backticks) with this exact structure:\n' +
      '{"career1":{"title":"Job Title","description":"1-2 sentence description of what they do","entrySalary":"$XX,XXX-$XX,XXX","midSalary":"$XXX,XXX-$XXX,XXX","seniorSalary":"$XXX,XXX-$XXX,XXX+","education":"Typical degree/path","avgHours":"XX-XX hrs/week","workLifeBalance":"X/10","stressLevel":"Low/Medium/High/Very High","travelRequired":"None/Minimal/Moderate/Heavy","remoteOptions":"Full/Hybrid/Office","growthOutlook":"X% growth next 10yr","topCompanies":["Company1","Company2","Company3","Company4","Company5"],"dayInLife":"2-3 sentences describing typical day","prosAndCons":"1 sentence on biggest pro and con"},"career2":{same fields}}';

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        context: 'You are a career expert. Return ONLY raw JSON, no markdown, no explanation. All salary and career data should be accurate for the US market in 2025. CRITICAL: workLifeBalance must always be a score out of 10 in the format "X/10" (e.g. "7/10"). Use consistent, research-backed data.'
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
        setResult(JSON.parse(reply));
      } catch(e) {
        try { setResult(JSON.parse(reply.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']'))); } catch(e2) { console.error('Parse failed'); }
      }
      setLoading(false);
    })
    .catch(function() { setLoading(false); });
  };

  var rows = [
    { label: 'What They Do', key: 'description', wide: true },
    { label: 'Entry Salary', key: 'entrySalary', highlight: true },
    { label: 'Mid-Career', key: 'midSalary', highlight: true },
    { label: 'Senior Salary', key: 'seniorSalary', highlight: true },
    { label: 'Education', key: 'education' },
    { label: 'Avg Hours/Week', key: 'avgHours' },
    { label: 'Work-Life Balance', key: 'workLifeBalance' },
    { label: 'Stress Level', key: 'stressLevel' },
    { label: 'Travel', key: 'travelRequired' },
    { label: 'Remote Options', key: 'remoteOptions' },
    { label: 'Growth Outlook', key: 'growthOutlook' },
    { label: 'Day in the Life', key: 'dayInLife', wide: true },
    { label: 'Pros & Cons', key: 'prosAndCons', wide: true },
  ];

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>⚖️</div>
        <h3 style={{ color: tx, fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Career Comparison</h3>
        <p style={{ color: txMut, fontSize: 14, margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>Compare two career paths — salary, lifestyle, growth, and more.</p>
      </div>

      {!result && !loading && (
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ color: txSub, fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Career 1</label>
            <input type="text" placeholder="e.g. Software Engineer, Doctor..." value={career1}
              onChange={function(e) { setCareer1(e.target.value); }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ textAlign: 'center', color: txMut, fontSize: 13, fontWeight: 700, margin: '8px 0' }}>VS</div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ color: txSub, fontSize: 12, fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: 1 }}>Career 2</label>
            <input type="text" placeholder="e.g. Investment Banker, Lawyer..." value={career2}
              onChange={function(e) { setCareer2(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter') compare(); }}
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <button onClick={compare} disabled={!career1.trim() || !career2.trim()}
            style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: career1.trim() && career2.trim() ? 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')' : bgSec, color: career1.trim() && career2.trim() ? '#fff' : txMut, fontWeight: 700, fontSize: 15, cursor: career1.trim() && career2.trim() ? 'pointer' : 'default' }}>
            ⚖️ Compare Careers
          </button>

          <div style={{ marginTop: 20 }}>
            <div style={{ color: txMut, fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Popular Comparisons</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[['Software Engineer', 'Data Scientist'], ['Doctor', 'Lawyer'], ['Investment Banker', 'Consultant'], ['UX Designer', 'Product Manager'], ['Accountant', 'Financial Analyst']].map(function(pair, i) {
                return (<button key={i} onClick={function() { setCareer1(pair[0]); setCareer2(pair[1]); }}
                  style={{ padding: '6px 12px', borderRadius: 20, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>{pair[0]} vs {pair[1]}</button>);
              })}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accent, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: tx, fontSize: 15, fontWeight: 600 }}>Comparing {career1} vs {career2}...</p>
        </div>
      )}

      {result && result.career1 && result.career2 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <button onClick={function() { setResult(null); setCareer1(''); setCareer2(''); }}
              style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', color: txSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← New Comparison</button>
          </div>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 0, marginBottom: 2 }}>
            <div style={{ padding: '14px 10px' }} />
            <div style={{ padding: '14px 16px', background: accent + '15', borderRadius: '12px 0 0 0', textAlign: 'center' }}>
              <div style={{ color: accent, fontSize: 15, fontWeight: 700 }}>{result.career1.title}</div>
            </div>
            <div style={{ padding: '14px 16px', background: primaryColor + '15', borderRadius: '0 12px 0 0', textAlign: 'center' }}>
              <div style={{ color: primaryColor, fontSize: 15, fontWeight: 700 }}>{result.career2.title}</div>
            </div>
          </div>

          {/* Rows */}
          {rows.map(function(row, i) {
            var v1 = result.career1[row.key] || 'N/A';
            var v2 = result.career2[row.key] || 'N/A';
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 0, borderBottom: '1px solid ' + bdr }}>
                <div style={{ padding: '10px 10px', color: txMut, fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'flex-start', paddingTop: 12 }}>{row.label}</div>
                <div style={{ padding: '10px 14px', background: row.highlight ? (accent + '08') : 'transparent', textAlign: row.wide ? 'left' : 'center' }}>
                  <span style={{ color: row.highlight ? tx : txSub, fontSize: row.wide ? 12 : 13, fontWeight: row.highlight ? 600 : 400, lineHeight: 1.5 }}>{v1}</span>
                </div>
                <div style={{ padding: '10px 14px', background: row.highlight ? (primaryColor + '08') : 'transparent', textAlign: row.wide ? 'left' : 'center' }}>
                  <span style={{ color: row.highlight ? tx : txSub, fontSize: row.wide ? 12 : 13, fontWeight: row.highlight ? 600 : 400, lineHeight: 1.5 }}>{v2}</span>
                </div>
              </div>
            );
          })}

          {/* Top Companies */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 0, paddingTop: 2 }}>
            <div style={{ padding: '10px 10px', color: txMut, fontSize: 11, fontWeight: 600 }}>Top Companies</div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(result.career1.topCompanies || []).map(function(c, j) { return <span key={j} style={{ background: accent + '12', color: accent, padding: '3px 8px', borderRadius: 6, fontSize: 10 }}>{c}</span>; })}
              </div>
            </div>
            <div style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(result.career2.topCompanies || []).map(function(c, j) { return <span key={j} style={{ background: primaryColor + '12', color: primaryColor, padding: '3px 8px', borderRadius: 6, fontSize: 10 }}>{c}</span>; })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
