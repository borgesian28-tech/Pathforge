'use client';
import { useState, useRef, useEffect } from 'react';

function HSChatbot({ careerField, accent, primaryColor, darkMode }) {
  var [open, setOpen] = useState(false);
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var messagesEnd = useRef(null);
  var inputRef = useRef(null);
  var dm = darkMode;

  useEffect(function() {
    if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(function() {
    if (open && inputRef.current) setTimeout(function() { inputRef.current.focus(); }, 100);
  }, [open]);

  var sendMessage = async function(text) {
    var userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    var newMessages = messages.concat([{ role: 'user', text: userMsg }]);
    setMessages(newMessages);
    setLoading(true);

    try {
      var history = newMessages.map(function(m) {
        return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text };
      });

      var context = 'You are an expert high school guidance counselor helping a student prepare for a career in ' + careerField + '.\n';
      context += 'The student is in high school and wants to get into top colleges for ' + careerField + '.\n';
      context += 'Help with: course selection, extracurriculars, college applications, test prep, and career preparation.\n';
      context += 'Be specific, actionable, and encouraging. Keep responses concise (2-3 paragraphs max).';

      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, context: context }),
      });

      if (res.ok) {
        var data = await res.json();
        setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: data.reply || 'Sorry, I could not generate a response.' }]); });
      } else {
        setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: 'Something went wrong. Please try again.' }]); });
      }
    } catch(err) {
      setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: 'Connection error. Please try again.' }]); });
    }
    setLoading(false);
  };

  var suggestions = [
    'What AP classes should I take for ' + careerField + '?',
    'How can I strengthen my college application?',
    'What extracurriculars look best for this career?',
    'When should I start SAT/ACT prep?',
  ];

  var chatBg = dm ? '#0c0c18' : '#ffffff';
  var chatBdr = dm ? '#1e1e32' : '#d5d5e0';
  var chatCardBg = dm ? '#111122' : '#f7f7fa';
  var chatTx = dm ? '#fff' : '#111111';
  var chatTxSub = dm ? '#ccc' : '#222222';
  var chatTxMut = dm ? '#6a6a7a' : '#666666';

  if (!open) {
    return (
      <button onClick={function() { setOpen(true); }}
        style={{ position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 20px ' + accent + '44', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        💬
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, width: 'min(400px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 40px))', background: chatBg, border: '1px solid ' + chatBdr, borderRadius: 20, zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, ' + primaryColor + '88, ' + chatBg + ')', borderBottom: '1px solid ' + chatBdr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
          <div>
            <div style={{ color: chatTx, fontSize: 14, fontWeight: 700 }}>HS Advisor</div>
            <div style={{ color: chatTxMut, fontSize: 11 }}>AI guidance counselor • {careerField}</div>
          </div>
        </div>
        <button onClick={function() { setOpen(false); }} style={{ background: 'none', border: 'none', color: chatTxMut, fontSize: 18, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📚</div>
              <div style={{ color: chatTx, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Hi there!</div>
              <div style={{ color: chatTxMut, fontSize: 13, lineHeight: 1.5 }}>Ask me anything about preparing for {careerField}.</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {suggestions.map(function(s, i) {
                return (
                  <button key={i} onClick={function() { sendMessage(s); }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCardBg, color: chatTxSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map(function(msg, i) {
          var isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isUser ? accent + '33' : chatCardBg, border: '1px solid ' + (isUser ? accent + '44' : chatBdr), color: chatTxSub, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '12px 18px', borderRadius: '14px 14px 14px 4px', background: chatCardBg, border: '1px solid ' + chatBdr }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'pulse 1.5s infinite' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'pulse 1.5s infinite 0.3s' }} />
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'pulse 1.5s infinite 0.6s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      <div style={{ padding: '12px 14px', borderTop: '1px solid ' + chatBdr, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={inputRef} type="text" value={input} onChange={function(e) { setInput(e.target.value); }}
            onKeyDown={function(e) { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Ask anything about your path..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCardBg, color: chatTx, fontSize: 13, outline: 'none' }} />
          <button onClick={function() { sendMessage(); }} disabled={!input.trim() || loading}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: input.trim() && !loading ? accent : (dm ? '#2a2a3e' : '#d0d0dc'), color: input.trim() && !loading ? '#000' : '#555', fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? 'pointer' : 'default' }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HighSchoolDashboard({ roadmap, onReset }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [activeYear, setActiveYear] = useState(0);
  const [expandedCollege, setExpandedCollege] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const years = roadmap.years || [];
  const extracurriculars = roadmap.extracurriculars || [];
  const topColleges = roadmap.topColleges || [];
  const skills = roadmap.skills || [];
  const summerActivities = roadmap.summerActivities || [];
  const collegeAppTimeline = roadmap.collegeAppTimeline || [];
  const standardizedTests = roadmap.standardizedTests || {};

  // Theme
  var bg = darkMode ? '#08080f' : '#ffffff';
  var bgCard = darkMode ? '#111122' : '#f7f7fa';
  var bgSec = darkMode ? '#1a1a2e' : '#ededf3';
  var bdr = darkMode ? '#1e1e32' : '#d5d5e0';
  var bdrL = darkMode ? '#2a2a3e' : '#c5c5d0';
  var tx = darkMode ? '#fff' : '#111111';
  var txSub = darkMode ? '#ccc' : '#333333';
  var txMut = darkMode ? '#6a6a7a' : '#666666';
  var txDim = darkMode ? '#8a8a9a' : '#555555';
  var accent = '#8b5cf6';
  var primaryColor = '#6366f1';
  var tabBg = darkMode ? '#0a0a0f' : '#ffffff';
  var btnBg = darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  var headerBg = darkMode ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #a78bfa, #818cf8)';

  const tabs = [
    { id: 'courses', label: 'Course Plan', icon: '📚' },
    { id: 'colleges', label: 'Top Colleges', icon: '🎓' },
    { id: 'activities', label: 'Activities', icon: '⚡' },
    { id: 'testing', label: 'Testing', icon: '📝' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, transition: 'background 0.3s' }}>
      {/* Header */}
      <div style={{ background: headerBg, padding: '24px 20px 20px', transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <button onClick={onReset} style={{ background: btnBg, backdropFilter: 'blur(10px)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>← New Roadmap</button>
            <button onClick={function() { setDarkMode(!darkMode); }} style={{ background: btnBg, backdropFilter: 'blur(10px)', border: 'none', color: '#fff', fontSize: 18, width: 36, height: 36, borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 40 }}>🎓</span>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 26, fontWeight: 700, margin: 0, textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>High School Roadmap</h1>
              <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, margin: '4px 0 0', fontWeight: 500 }}>Preparing for {roadmap.careerField}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ background: tabBg, borderBottom: '1px solid ' + bdr, position: 'sticky', top: 0, zIndex: 10, transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 20px' }}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{ background: 'none', border: 'none', color: isActive ? accent : txMut, padding: '14px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: isActive ? '2px solid ' + accent : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                <span style={{ marginRight: 6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>

        {activeTab === 'courses' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
              {years.map(function(y, i) {
                var isActive = activeYear === i;
                return (
                  <button key={i} onClick={function() { setActiveYear(i); }} style={{ background: isActive ? accent : bgSec, border: '1px solid ' + (isActive ? accent : bdrL), color: isActive ? '#fff' : txSub, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    {y.year}
                  </button>
                );
              })}
            </div>

            {years[activeYear] && (
              <>
                <div style={{ background: 'linear-gradient(135deg, ' + accent + '22, ' + bgCard + ')', border: '1px solid ' + bdrL, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                  <h3 style={{ color: accent, fontSize: 13, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Focus This Year</h3>
                  <p style={{ color: txSub, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{years[activeYear].focus}</p>
                </div>

                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Courses</h3>
                <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                  {years[activeYear].courses && years[activeYear].courses.map(function(course, i) {
                    var typeColors = { AP: '#ef4444', Honors: '#f59e0b', Standard: '#3b82f6' };
                    return (
                      <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ color: tx, fontSize: 15, fontWeight: 700 }}>{course.name}</div>
                          <span style={{ background: (typeColors[course.type] || '#888') + '22', color: typeColors[course.type] || '#888', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
                        </div>
                        <p style={{ color: txDim, fontSize: 13, margin: 0, lineHeight: 1.5 }}>{course.why}</p>
                      </div>
                    );
                  })}
                </div>

                {years[activeYear].milestones && years[activeYear].milestones.length > 0 && (
                  <>
                    <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Key Milestones</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {years[activeYear].milestones.map(function(m, i) {
                        return (
                          <div key={i} style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 16 }}>✓</span>
                            <span style={{ color: txSub, fontSize: 13 }}>{m}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'colleges' && (
          <div>
            <p style={{ color: txSub, fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              These colleges are known for strong programs in {roadmap.careerField}. Research each school's specific requirements and culture.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {topColleges.map(function(college, i) {
                var isExpanded = expandedCollege === i;
                var selectivityColors = { 'Highly Selective': '#ef4444', 'Selective': '#f59e0b', 'Moderately Selective': '#10b981' };
                return (
                  <div key={i} onClick={function() { setExpandedCollege(isExpanded ? null : i); }} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: tx, fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{college.name}</div>
                        <span style={{ background: (selectivityColors[college.selectivity] || '#888') + '22', color: selectivityColors[college.selectivity] || '#888', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{college.selectivity}</span>
                      </div>
                      <span style={{ color: txMut, fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + bdr }}>
                        {college.whyGood && <p style={{ color: txSub, fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{college.whyGood}</p>}
                        {college.notablePrograms && <div style={{ color: txDim, fontSize: 12, marginBottom: 4 }}>Notable: {Array.isArray(college.notablePrograms) ? college.notablePrograms.join(', ') : college.notablePrograms}</div>}
                        {college.admissionTip && <div style={{ color: accent, fontSize: 12, fontWeight: 600, marginTop: 4 }}>Tip: {college.admissionTip}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div>
            <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Extracurriculars</h3>
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {extracurriculars.map(function(activity, i) {
                return (
                  <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ color: tx, fontSize: 15, fontWeight: 700 }}>{activity.activity}</div>
                      <span style={{ background: bgSec, color: txSub, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{activity.type}</span>
                    </div>
                    <p style={{ color: txDim, fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{activity.relevance}</p>
                    <div style={{ color: txMut, fontSize: 12 }}>⏱️ {activity.commitment}</div>
                  </div>
                );
              })}
            </div>

            {summerActivities.length > 0 && (
              <>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Summer Planning</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {summerActivities.map(function(summer, i) {
                    return (
                      <div key={i} style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{summer.year}</div>
                        <ul style={{ color: txSub, fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                          {summer.activities.map(function(act, j) { return <li key={j}>{act}</li>; })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'testing' && (
          <div>
            {standardizedTests.sat && (
              <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>SAT</h3>
                <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>WHEN TO TAKE</div><div style={{ color: txSub, fontSize: 14 }}>{standardizedTests.sat.when}</div></div>
                <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>TARGET SCORE</div><div style={{ color: txSub, fontSize: 14 }}>{standardizedTests.sat.target}</div></div>
                <div><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>PREPARATION</div><div style={{ color: txDim, fontSize: 13, lineHeight: 1.6 }}>{standardizedTests.sat.prep}</div></div>
              </div>
            )}
            {standardizedTests.act && (
              <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>ACT</h3>
                <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>WHEN TO TAKE</div><div style={{ color: txSub, fontSize: 14 }}>{standardizedTests.act.when}</div></div>
                <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>TARGET SCORE</div><div style={{ color: txSub, fontSize: 14 }}>{standardizedTests.act.target}</div></div>
                <div><div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>PREPARATION</div><div style={{ color: txDim, fontSize: 13, lineHeight: 1.6 }}>{standardizedTests.act.prep}</div></div>
              </div>
            )}
            {standardizedTests.ap && standardizedTests.ap.length > 0 && (
              <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '18px 20px' }}>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended AP Exams</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {standardizedTests.ap.map(function(exam, i) { return <span key={i} style={{ background: bgSec, color: accent, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{exam}</span>; })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div>
            <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>College Application Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, ' + accent + ', ' + primaryColor + ', transparent)' }} />
              {collegeAppTimeline.map(function(item, i) {
                return (
                  <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                    <div style={{ position: 'absolute', left: -23, top: 14, width: 14, height: 14, borderRadius: '50%', background: accent, border: '2px solid ' + bg }} />
                    <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ color: accent, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{item.when}</div>
                      <ul style={{ color: txSub, fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                        {item.tasks.map(function(task, j) { return <li key={j}>{task}</li>; })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {skills.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Key Skills to Develop</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map(function(skill, i) { return <span key={i} style={{ background: accent + '22', color: accent, padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{skill}</span>; })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <HSChatbot careerField={roadmap.careerField} accent={accent} primaryColor={primaryColor} darkMode={darkMode} />
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
