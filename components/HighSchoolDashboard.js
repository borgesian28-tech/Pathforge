'use client';
import { useState, useRef, useEffect } from 'react';

function HSChatbot({ careerField, accent, primaryColor, darkMode, inline }) {
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var messagesEnd = useRef(null);
  var inputRef = useRef(null);
  var dm = darkMode;

  useEffect(function() { if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);
  useEffect(function() { if (inputRef.current) setTimeout(function() { inputRef.current.focus(); }, 100); }, []);

  var sendMessage = async function(text) {
    var userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    var newMessages = messages.concat([{ role: 'user', text: userMsg }]);
    setMessages(newMessages);
    setLoading(true);
    try {
      var history = newMessages.map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });
      var context = 'You are an expert high school guidance counselor helping a student prepare for a career in ' + careerField + '.\nThe student is in high school and wants to get into top colleges for ' + careerField + '.\nHelp with: course selection, extracurriculars, college applications, test prep, and career preparation.\nBe specific, actionable, and encouraging. Keep responses concise (2-3 paragraphs max).';
      var res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context: context }) });
      if (res.ok) { var data = await res.json(); setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: data.reply || 'Sorry, I could not generate a response.' }]); }); }
      else { setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: 'Something went wrong. Please try again.' }]); }); }
    } catch(err) { setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: 'Connection error. Please try again.' }]); }); }
    setLoading(false);
  };

  var suggestions = ['What AP classes should I take for ' + careerField + '?', 'How can I strengthen my college application?', 'What extracurriculars look best for this career?', 'When should I start SAT/ACT prep?'];

  var chatBg = dm ? '#0c0c0f' : '#ffffff';
  var chatBdr = dm ? '#1e1e28' : '#e2e2e8';
  var chatCardBg = dm ? '#131318' : '#f7f7fa';
  var chatTx = dm ? '#f0f0f2' : '#111118';
  var chatTxSub = dm ? '#a0a0b0' : '#444450';
  var chatTxMut = dm ? '#606070' : '#777784';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: inline ? '100%' : 'min(560px, calc(100vh - 40px))', background: chatBg, border: inline ? 'none' : ('1px solid ' + chatBdr), borderRadius: inline ? 0 : 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, ' + primaryColor + (dm ? '66' : '33') + ', ' + chatBg + ')', borderBottom: '1px solid ' + chatBdr, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
        <div>
          <div style={{ color: chatTx, fontSize: 14, fontWeight: 700 }}>AI Guidance Counselor</div>
          <div style={{ color: chatTxMut, fontSize: 11 }}>Personalized advice for {careerField}</div>
        </div>
      </div>
      <div className="thin-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>📚</div>
              <div style={{ color: chatTx, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Hi there!</div>
              <div style={{ color: chatTxMut, fontSize: 13, lineHeight: 1.5 }}>Ask me anything about preparing for {careerField}.</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {suggestions.map(function(s, i) {
                return (<button key={i} onClick={function() { sendMessage(s); }} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCardBg, color: chatTxSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>{s}</button>);
              })}
            </div>
          </div>
        )}
        {messages.map(function(msg, i) {
          var isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 10 }}>
              <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isUser ? accent + '33' : chatCardBg, border: '1px solid ' + (isUser ? accent + '44' : chatBdr), color: chatTxSub, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{msg.text}</div>
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
          <input ref={inputRef} type="text" value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') sendMessage(); }} placeholder="Ask anything about your path..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCardBg, color: chatTx, fontSize: 13, outline: 'none' }} />
          <button onClick={function() { sendMessage(); }} disabled={!input.trim() || loading} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: input.trim() && !loading ? accent : (dm ? '#1c1c24' : '#e2e2e8'), color: input.trim() && !loading ? '#fff' : '#555', fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? 'pointer' : 'default' }}>↑</button>
        </div>
      </div>
    </div>
  );
}

export default function HighSchoolDashboard({ roadmap, onReset, isDemo, onUnlock }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [activeYear, setActiveYear] = useState(0);
  const [expandedCollege, setExpandedCollege] = useState(null);
  const [darkMode, setDarkMode] = useState(true);
  const [catalogUrl, setCatalogUrl] = useState('');
  const [currentRoadmap, setCurrentRoadmap] = useState(roadmap);
  const [regenerating, setRegenerating] = useState(false);
  const [currentYearIdx, setCurrentYearIdx] = useState(-1);
  const [hsModal, setHsModal] = useState(null);
  const [hsModalInput, setHsModalInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [careerExplorerSearch, setCareerExplorerSearch] = useState('');
  const [careerExplorerResult, setCareerExplorerResult] = useState(null);
  const [careerExplorerLoading, setCareerExplorerLoading] = useState(false);
  const [collegeSearchStep, setCollegeSearchStep] = useState(0);
  const [collegeSearchPrefs, setCollegeSearchPrefs] = useState({ major: '', size: '', setting: '', region: '', focus: '' });
  const [collegeSearchResults, setCollegeSearchResults] = useState(null);
  const [collegeSearchLoading, setCollegeSearchLoading] = useState(false);
  const [expandedSearchCollege, setExpandedSearchCollege] = useState(null);
  const settingsRef = useRef(null);

  useEffect(function() {
    function handleClick(e) { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);
  useEffect(function() { setMobileMenuOpen(false); }, [activeTab]);
  useEffect(function() {
    function handleResize() { if (window.innerWidth < 768) setSidebarOpen(false); }
    handleResize();
    window.addEventListener('resize', handleResize);
    return function() { window.removeEventListener('resize', handleResize); };
  }, []);

  const years = currentRoadmap.years || [];
  const extracurriculars = currentRoadmap.extracurriculars || [];
  const topColleges = currentRoadmap.topColleges || [];
  const skills = currentRoadmap.skills || [];
  const summerActivities = currentRoadmap.summerActivities || [];
  const collegeAppTimeline = currentRoadmap.collegeAppTimeline || [];
  const standardizedTests = currentRoadmap.standardizedTests || {};

  var dm = darkMode;
  var bg = dm ? '#09090b' : '#fafafa';
  var bgCard = dm ? '#131318' : '#ffffff';
  var bgSec = dm ? '#19191f' : '#f0f0f4';
  var bdr = dm ? '#1e1e28' : '#e2e2e8';
  var bdrL = dm ? '#2a2a38' : '#d5d5dd';
  var tx = dm ? '#f0f0f2' : '#111118';
  var txSub = dm ? '#a0a0b0' : '#444450';
  var txMut = dm ? '#606070' : '#777784';
  var txDim = dm ? '#8a8a9a' : '#555555';
  var accent = '#8b5cf6';
  var primaryColor = '#6366f1';
  var sidebarBg = dm ? '#0c0c0f' : '#ffffff';
  var sidebarBdr = dm ? '#1a1a22' : '#e8e8ee';
  var headerBg = dm ? '#0c0c0f' : '#ffffff';
  var overlayBg = dm ? '#09090bdd' : '#fafafadd';
  var cardHov = dm ? '#19191f' : '#f5f5f8';

  const tabs = [
    { id: 'courses', label: 'Course Plan', icon: '📚' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'colleges', label: 'Top Colleges', icon: '🎓' },
    { id: 'college-search', label: 'College Search', icon: '🔍' },
    { id: 'activities', label: 'Activities', icon: '⚡' },
    { id: 'testing', label: 'Testing', icon: '📝' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'careers', label: 'Career Explorer', icon: '🧭' },
    { id: 'advisor', label: 'AI Advisor', icon: '💬' },
  ];

  var exploreCareer = async function() {
    if (!careerExplorerSearch.trim()) return;
    setCareerExplorerLoading(true);
    setCareerExplorerResult(null);
    try {
      var res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Tell me about a career in: ' + careerExplorerSearch.trim() }],
          context: 'You are a career education expert. The user is a HIGH SCHOOL student wanting to learn about careers. Provide a detailed but concise overview in this EXACT format:\n\nJOB TITLE: [title]\n\nWHAT THEY DO:\n[2-3 sentences about daily responsibilities]\n\nEDUCATION NEEDED:\n[Degree requirements, certifications, typical path]\n\nSALARY RANGE:\nEntry: $XX,XXX - $XX,XXX\nMid-Career: $XX,XXX - $XX,XXX\nSenior: $XXX,XXX - $XXX,XXX\n\nTOP SKILLS:\n- Skill 1\n- Skill 2\n- Skill 3\n- Skill 4\n- Skill 5\n\nDAY IN THE LIFE:\n[3-4 sentences describing a typical workday]\n\nGROWTH OUTLOOK:\n[1-2 sentences about job market and future prospects]\n\nHOW TO GET STARTED IN HIGH SCHOOL:\n[3 concrete actionable steps a high school student can take now]'
        })
      });
      if (res.ok) { var data = await res.json(); setCareerExplorerResult(data.reply); }
    } catch(e) { console.error(e); }
    setCareerExplorerLoading(false);
  };

  var handleExport = function() {
    var html = '<html><head><title>High School Roadmap - PathForge</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:24px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:24px}h3{font-size:16px;margin:20px 0 8px;padding-top:12px;border-top:1px solid #ddd}.course{padding:4px 0;font-size:13px}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #ddd;color:#888;font-size:11px}</style></head><body>';
    html += '<h1>High School Roadmap — ' + currentRoadmap.careerField + '</h1>';
    years.forEach(function(y) { html += '<h3>' + y.year + '</h3><p style="color:#666;font-size:13px">' + (y.focus || '') + '</p>'; if (y.courses) y.courses.forEach(function(c) { html += '<div class="course"><strong>' + (c.type || '') + ':</strong> ' + c.name + '</div>'; }); });
    html += '<div class="footer">Generated by PathForge</div></body></html>';
    var w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(function() { w.print(); }, 500);
  };

  var handleShare = function() {
    var text = 'High School Roadmap — ' + currentRoadmap.careerField + '\n\n';
    years.forEach(function(y) { text += '--- ' + y.year + ' ---\n'; if (y.courses) y.courses.forEach(function(c) { text += '• ' + (c.type || '') + ': ' + c.name + '\n'; }); text += '\n'; });
    navigator.clipboard.writeText(text);
  };

  var collegeSearchQuestions = [
    { key: 'major', label: 'What do you want to study?', placeholder: 'e.g. Computer Science, Biology, Business...', type: 'text' },
    { key: 'size', label: 'What school size do you prefer?', options: ['Small (under 5,000)', 'Medium (5,000–15,000)', 'Large (15,000+)', 'No preference'] },
    { key: 'setting', label: 'What kind of campus setting?', options: ['Urban (big city)', 'Suburban', 'Rural / College town', 'No preference'] },
    { key: 'region', label: 'Any region preference?', options: ['Northeast', 'Southeast', 'Midwest', 'West Coast', 'Southwest', 'Anywhere in the US'] },
    { key: 'focus', label: 'What matters most to you?', options: ['Strong academics & rankings', 'Research opportunities', 'Campus life & community', 'Affordability & financial aid', 'Career placement & internships'] },
  ];

  var searchColleges = async function() {
    setCollegeSearchLoading(true);
    setCollegeSearchResults(null);
    try {
      var prefs = collegeSearchPrefs;
      var prompt = 'Find 5 real colleges/universities that match these student preferences:\n' +
        '- Intended major: ' + (prefs.major || currentRoadmap.careerField) + '\n' +
        '- School size: ' + (prefs.size || 'No preference') + '\n' +
        '- Setting: ' + (prefs.setting || 'No preference') + '\n' +
        '- Region: ' + (prefs.region || 'Anywhere in the US') + '\n' +
        '- Priority: ' + (prefs.focus || 'Strong academics') + '\n\n' +
        'Respond ONLY with a valid JSON array (no markdown, no backticks, no explanation). Each object must have exactly these fields:\n' +
        '{\n"name": "Full University Name",\n"location": "City, State",\n"size": "X,XXX students",\n"setting": "Urban/Suburban/Rural",\n"acceptanceRate": "XX%",\n"topMajors": ["Major 1", "Major 2", "Major 3"],\n"avgGPA": "X.XX",\n"avgSAT": "XXXX-XXXX",\n"tuition": "$XX,XXX/year",\n"financialAid": "XX% of students receive aid",\n"whyGoodFit": "2 sentences explaining why this school matches the student preferences",\n"website": "https://www.school.edu"\n}';
      var res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'You are a college admissions expert. Return ONLY a raw JSON array with no extra text, no markdown code fences, and no explanation. Just the JSON array. Make sure all data is factually accurate and up-to-date. Only recommend real accredited US colleges and universities.'
        })
      });
      if (res.ok) {
        var data = await res.json();
        var reply = (data.reply || '').trim();
        // Strip markdown fences if present
        reply = reply.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        try {
          var parsed = JSON.parse(reply);
          setCollegeSearchResults(Array.isArray(parsed) ? parsed : [parsed]);
        } catch(e) {
          console.error('Failed to parse college results:', e, reply);
          setCollegeSearchResults([]);
        }
      }
    } catch(e) { console.error(e); setCollegeSearchResults([]); }
    setCollegeSearchLoading(false);
  };

  var isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  var sidebarW = sidebarOpen ? 240 : 64;

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', transition: 'background 0.3s', overflow: 'hidden', height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {regenerating && (
        <div style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accent, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: tx, fontSize: 15, fontWeight: 600 }}>Scanning your catalog...</p>
        </div>
      )}

      {/* SIDEBAR */}
      {mobileMenuOpen && <div onClick={function() { setMobileMenuOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 89, backdropFilter: 'blur(4px)' }} />}
      <aside style={{
        position: isMobile ? 'fixed' : 'sticky', top: 0, left: isMobile ? (mobileMenuOpen ? 0 : -260) : 0,
        width: isMobile ? 240 : sidebarW, height: '100dvh', background: sidebarBg, borderRight: '1px solid ' + sidebarBdr,
        display: 'flex', flexDirection: 'column', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 90, flexShrink: 0, overflow: 'hidden',
      }}>
        <div onClick={onReset} style={{ padding: sidebarOpen || isMobile ? '16px 16px 12px' : '16px 12px 12px', borderBottom: '1px solid ' + sidebarBdr, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }}>
          {(sidebarOpen || isMobile) ? (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                🎓
              </div>
              <span style={{ color: tx, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>PathForge</span>
            </>
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              🎓
            </div>
          )}
        </div>
        {(sidebarOpen || isMobile) && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                <svg width="44" height="44" viewBox="0 0 44 44" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="22" cy="22" r="18" fill="none" stroke={dm ? '#1e1e28' : '#e2e2e8'} strokeWidth="4" />
                  <circle cx="22" cy="22" r="18" fill="none" stroke={accent} strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 18} strokeDashoffset={2 * Math.PI * 18 * (1 - (activeYear + 1) / years.length)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: tx }}>{Math.round(((activeYear + 1) / years.length) * 100)}%</div>
              </div>
              <div>
                <div style={{ color: txSub, fontSize: 12, fontWeight: 600 }}>High School Roadmap</div>
                <div style={{ color: txMut, fontSize: 10 }}>Preparing for {currentRoadmap.careerField}</div>
              </div>
            </div>
          </div>
        )}
        <nav className="thin-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab.id;
            var isLocked = isDemo && tab.id !== 'courses';
            return (
              <button key={tab.id} onClick={function() { if (isLocked) return; setActiveTab(tab.id); if (isMobile) setMobileMenuOpen(false); }}
                title={isLocked ? 'Sign up to unlock' : !sidebarOpen && !isMobile ? tab.label : undefined}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen || isMobile ? '9px 12px' : '10px 0', justifyContent: sidebarOpen || isMobile ? 'flex-start' : 'center', borderRadius: 8, border: 'none', background: isActive && !isLocked ? accent + '15' : 'transparent', color: isLocked ? (darkMode ? '#3a3a4e' : '#c0c0c8') : isActive ? accent : txMut, fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: isLocked ? 'default' : 'pointer', transition: 'all 0.15s', marginBottom: 2, position: 'relative', opacity: isLocked ? 0.5 : 1 }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{isLocked ? '🔒' : tab.icon}</span>
                {(sidebarOpen || isMobile) && <span>{tab.label}</span>}
                {isActive && !isLocked && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 2, background: accent }} />}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: '8px', borderTop: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
          {!isMobile && (
            <button onClick={function() { setSidebarOpen(!sidebarOpen); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, border: 'none', background: 'transparent', color: txMut, fontSize: 13, cursor: 'pointer' }}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center', transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}>◂</span>
              {sidebarOpen && <span>Collapse</span>}
            </button>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, background: headerBg, borderBottom: '1px solid ' + bdr, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, backdropFilter: 'blur(12px)' }}>
          {isMobile && (
            <button onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }} style={{ background: 'none', border: 'none', color: tx, fontSize: 20, cursor: 'pointer', padding: '4px', marginRight: 4 }}>☰</button>
          )}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: tx, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>High School Roadmap</h1>
            <span style={{ color: accent, fontSize: 12, fontWeight: 500 }}>• {currentRoadmap.careerField}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button onClick={function() { setSettingsOpen(!settingsOpen); }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋮</button>
              {settingsOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 200, background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 100 }}>
                  {[
                    { label: '📄 Export as PDF', action: function() { setSettingsOpen(false); handleExport(); } },
                    { label: '📋 Copy to Clipboard', action: function() { setSettingsOpen(false); handleShare(); } },
                    { label: '🔗 Link Catalog', action: function() { setSettingsOpen(false); setHsModalInput(''); setHsModal({ title: 'Link Course Catalog', placeholder: "Paste your school's course catalog URL" }); } },
                    { label: '↻ New Roadmap', action: function() { setSettingsOpen(false); onReset(); } },
                  ].map(function(item, i) {
                    return (<button key={i} onClick={item.action} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < 3 ? '1px solid ' + bdr : 'none', color: txSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>{item.label}</button>);
                  })}
                </div>
              )}
            </div>
            <button onClick={function() { setDarkMode(!darkMode); }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="thin-scrollbar" style={{ flex: 1, overflow: activeTab === 'advisor' ? 'hidden' : 'auto', WebkitOverflowScrolling: 'touch', padding: activeTab === 'advisor' ? 0 : (isMobile ? '20px 16px 40px' : '24px 32px 40px') }}>
          <div style={{ maxWidth: activeTab === 'advisor' ? 'none' : 820, margin: '0 auto', height: activeTab === 'advisor' ? '100%' : 'auto' }}>

            {isDemo && (
              <div style={{ marginBottom: 16, background: 'linear-gradient(135deg, #6c5ce722, ' + bgCard + ')', border: '1px solid #6c5ce744', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
                  <span style={{ fontSize: 24 }}>🔓</span>
                  <div>
                    <div style={{ color: tx, fontSize: 15, fontWeight: 700 }}>You're viewing a demo</div>
                    <div style={{ color: txDim, fontSize: 13, marginTop: 2 }}>Freshman & sophomore years are unlocked. Sign up free to see your full 4-year plan, activities, test prep, and more.</div>
                  </div>
                </div>
                <button onClick={onUnlock} style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Unlock Full Access →</button>
              </div>
            )}

            {activeTab === 'courses' && (
              <div>
                <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>These recommendations may not exactly match what your school offers. Use the settings menu to link your school's course catalog for personalized results.</p>
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
                  {years.map(function(y, i) {
                    var isActive = activeYear === i;
                    var isCurrent = currentYearIdx === i;
                    var yearLocked = isDemo && i >= 2;
                    return (<button key={i} onClick={function() { if (yearLocked) return; setActiveYear(i); }} onDoubleClick={function() { if (!yearLocked) setCurrentYearIdx(i); }} title={yearLocked ? 'Sign up to unlock' : isCurrent ? 'Current year' : 'Double-click to set as current'} style={{ padding: '6px 16px', borderRadius: 20, border: yearLocked ? '1px solid ' + bdr : isCurrent ? '2px solid ' + accent : (isActive ? '1px solid ' + accent + '44' : '1px solid ' + bdr), background: yearLocked ? (darkMode ? '#1a1a22' : '#e8e8ee') : isActive ? accent + '15' : bgCard, color: yearLocked ? (darkMode ? '#3a3a4e' : '#b0b0b8') : isActive ? accent : txSub, fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: yearLocked ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s', opacity: yearLocked ? 0.6 : 1 }}>{yearLocked ? '🔒 ' : isCurrent ? '📍 ' : ''}{y.year}</button>);
                  })}
                </div>
                {years[activeYear] && (<>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {currentYearIdx === activeYear && <span style={{ background: accent + '22', color: accent, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>📍 CURRENT YEAR</span>}
                      {currentYearIdx !== activeYear && <button onClick={function() { setCurrentYearIdx(activeYear); }} style={{ background: 'none', border: '1px solid ' + bdr, borderRadius: 10, color: txMut, padding: '2px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Set as current</button>}
                    </div>
                    {(function() {
                      var numCourses = years[activeYear].courses ? years[activeYear].courses.length : 0;
                      var apCount = years[activeYear].courses ? years[activeYear].courses.filter(function(c) { return c.type === 'AP'; }).length : 0;
                      var intensity = apCount >= 4 || numCourses >= 8 ? 'Heavy' : apCount >= 2 || numCourses >= 6 ? 'Moderate' : 'Light';
                      var iColors = { Heavy: '#ef4444', Moderate: '#f59e0b', Light: '#4ade80' };
                      var iIcons = { Heavy: '🔥', Moderate: '⚡', Light: '🌿' };
                      return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: iColors[intensity] + '18', border: '1px solid ' + iColors[intensity] + '33', color: iColors[intensity], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{iIcons[intensity]} {intensity} Load</span>);
                    })()}
                  </div>
                  <div style={{ background: accent + '0a', border: '1px solid ' + accent + '22', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                    <h3 style={{ color: accent, fontSize: 11, fontWeight: 700, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 }}>Focus This Year</h3>
                    <p style={{ color: txSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{years[activeYear].focus}</p>
                  </div>
                  <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Courses</h3>
                  <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                    {years[activeYear].courses && years[activeYear].courses.map(function(course, i) {
                      var typeColors = { AP: '#ef4444', Honors: '#f59e0b', Standard: '#3b82f6' };
                      return (
                        <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <div style={{ color: tx, fontSize: 14, fontWeight: 600 }}>{course.name}</div>
                            <span style={{ background: (typeColors[course.type] || '#888') + '15', color: typeColors[course.type] || '#888', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{course.type}</span>
                          </div>
                          <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{course.why}</p>
                        </div>
                      );
                    })}
                  </div>
                  {years[activeYear].milestones && years[activeYear].milestones.length > 0 && (<>
                    <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Key Milestones</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {years[activeYear].milestones.map(function(m, i) {
                        return (<div key={i} style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 14, color: accent }}>✓</span><span style={{ color: txSub, fontSize: 13 }}>{m}</span></div>);
                      })}
                    </div>
                  </>)}
                </>)}
              </div>
            )}

            {activeTab === 'progress' && (
              <div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
                  {/* Progress Ring */}
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '24px 28px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 12 }}>
                      <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="60" cy="60" r="52" fill="none" stroke={dm ? '#1e1e28' : '#e2e2e8'} strokeWidth="8" />
                        <circle cx="60" cy="60" r="52" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - (activeYear + 1) / years.length)} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: tx }}>{Math.round(((activeYear + 1) / years.length) * 100)}%</div>
                        <div style={{ fontSize: 10, color: txMut, fontWeight: 600 }}>YEAR {activeYear + 1} OF {years.length}</div>
                      </div>
                    </div>
                    <div style={{ color: txSub, fontSize: 13, textAlign: 'center' }}>{years[activeYear] ? years[activeYear].year : ''}</div>
                  </div>

                  {/* Course Breakdown */}
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '20px 24px', flex: '1 1 260px' }}>
                    <h3 style={{ color: tx, fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Course Breakdown</h3>
                    {(function() {
                      var types = { AP: 0, Honors: 0, Standard: 0 };
                      years.forEach(function(y) {
                        if (y.courses) y.courses.forEach(function(c) {
                          var t = c.type || 'Standard';
                          types[t] = (types[t] || 0) + 1;
                        });
                      });
                      var total = Object.values(types).reduce(function(a, b) { return a + b; }, 0);
                      var typeColors = { AP: '#ef4444', Honors: '#f59e0b', Standard: '#3b82f6' };
                      return Object.keys(types).filter(function(t) { return types[t] > 0; }).map(function(t) {
                        var pct = total > 0 ? Math.round((types[t] / total) * 100) : 0;
                        return (
                          <div key={t} style={{ marginBottom: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ color: txSub, fontSize: 12, fontWeight: 600 }}>{t}</span>
                              <span style={{ color: txMut, fontSize: 11 }}>{types[t]} courses ({pct}%)</span>
                            </div>
                            <div style={{ height: 6, background: dm ? '#1e1e28' : '#e2e2e8', borderRadius: 3, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: pct + '%', background: typeColors[t] || '#6b7280', borderRadius: 3, transition: 'width 0.8s ease' }} />
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div style={{ color: txDim, fontSize: 12, marginTop: 8 }}>
                      {(function() {
                        var totalCourses = 0;
                        years.forEach(function(y) { if (y.courses) totalCourses += y.courses.length; });
                        return totalCourses + ' total courses across ' + years.length + ' years';
                      })()}
                    </div>
                  </div>
                </div>

                {/* Year-by-Year Summary */}
                <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '20px 24px' }}>
                  <h3 style={{ color: tx, fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Year-by-Year Summary</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {years.map(function(y, i) {
                      var apCount = y.courses ? y.courses.filter(function(c) { return c.type === 'AP'; }).length : 0;
                      var honorsCount = y.courses ? y.courses.filter(function(c) { return c.type === 'Honors'; }).length : 0;
                      var total = y.courses ? y.courses.length : 0;
                      var isCurrent = currentYearIdx === i;
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: dm ? '#0c0c14' : '#f8f8fa', borderRadius: 10, border: isCurrent ? '2px solid ' + accent : '1px solid ' + bdr }}>
                          <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
                            <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                              <circle cx="20" cy="20" r="16" fill="none" stroke={dm ? '#1e1e28' : '#e2e2e8'} strokeWidth="3" />
                              <circle cx="20" cy="20" r="16" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round" strokeDasharray={2 * Math.PI * 16} strokeDashoffset={2 * Math.PI * 16 * (1 - (i + 1) / years.length)} />
                            </svg>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: tx, fontSize: 13, fontWeight: 600 }}>{isCurrent ? '📍 ' : ''}{y.year}</div>
                            <div style={{ color: txMut, fontSize: 11 }}>{total} courses{apCount > 0 ? ' • ' + apCount + ' AP' : ''}{honorsCount > 0 ? ' • ' + honorsCount + ' Honors' : ''}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'colleges' && (
              <div>
                <p style={{ color: txSub, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>These colleges are known for strong programs in {currentRoadmap.careerField}. Research each school's specific requirements and culture.</p>
                <div style={{ display: 'grid', gap: 10 }}>
                  {topColleges.map(function(college, i) {
                    var isExpanded = expandedCollege === i;
                    var selectivityColors = { 'Highly Selective': '#ef4444', 'Selective': '#f59e0b', 'Moderately Selective': '#10b981' };
                    return (
                      <div key={i} onClick={function() { setExpandedCollege(isExpanded ? null : i); }} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ color: tx, fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{college.name}</div>
                            <span style={{ background: (selectivityColors[college.selectivity] || '#888') + '15', color: selectivityColors[college.selectivity] || '#888', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{college.selectivity}</span>
                          </div>
                          <span style={{ color: txMut, fontSize: 14, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                        </div>
                        {isExpanded && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + bdr }}>
                            {college.whyGood && <p style={{ color: txSub, fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{college.whyGood}</p>}
                            {college.notablePrograms && <div style={{ color: txDim, fontSize: 12, marginBottom: 4 }}>Notable: {Array.isArray(college.notablePrograms) ? college.notablePrograms.join(', ') : college.notablePrograms}</div>}
                            {college.admissionTip && <div style={{ color: accent, fontSize: 12, fontWeight: 600, marginTop: 4 }}>Tip: {college.admissionTip}</div>}
                            {!college.whyGood && !college.notablePrograms && !college.admissionTip && <p style={{ color: txDim, fontSize: 13, margin: 0, lineHeight: 1.5 }}>A strong option for {currentRoadmap.careerField}. Visit their admissions website for details.</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'college-search' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
                  <h3 style={{ color: tx, fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>College Search</h3>
                  <p style={{ color: txMut, fontSize: 14, margin: 0, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>Tell us what you're looking for and we'll find colleges that match your preferences.</p>
                </div>

                {!collegeSearchResults && !collegeSearchLoading && (
                  <div>
                    {collegeSearchQuestions.map(function(q, qIdx) {
                      var isActive = collegeSearchStep === qIdx;
                      var isCompleted = q.type === 'text' ? collegeSearchPrefs[q.key].trim() !== '' : collegeSearchPrefs[q.key] !== '';
                      var isPast = qIdx < collegeSearchStep;
                      var isFuture = qIdx > collegeSearchStep;

                      return (
                        <div key={q.key} onClick={function() { if (isPast || isActive) setCollegeSearchStep(qIdx); }}
                          style={{ background: isActive ? (dm ? '#16161e' : '#f0eeff') : bgCard, border: '1px solid ' + (isActive ? accent + '44' : bdr), borderRadius: 14, padding: isActive ? '18px 20px' : '14px 20px', marginBottom: 10, cursor: isPast ? 'pointer' : 'default', transition: 'all 0.2s', opacity: isFuture && !isCompleted ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isActive ? 12 : 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: isCompleted ? accent + '22' : (dm ? '#1e1e28' : '#e8e8ee'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: isCompleted ? accent : txMut, fontWeight: 700, flexShrink: 0 }}>
                                {isCompleted ? '✓' : qIdx + 1}
                              </div>
                              <div>
                                <div style={{ color: isActive ? tx : txSub, fontSize: 14, fontWeight: isActive ? 600 : 500 }}>{q.label}</div>
                                {!isActive && isCompleted && <div style={{ color: accent, fontSize: 12, marginTop: 2 }}>{collegeSearchPrefs[q.key]}</div>}
                              </div>
                            </div>
                            {isPast && <span style={{ color: txMut, fontSize: 12 }}>edit</span>}
                          </div>

                          {isActive && q.type === 'text' && (
                            <div>
                              <input type="text" placeholder={q.placeholder} value={collegeSearchPrefs[q.key]}
                                onChange={function(e) { setCollegeSearchPrefs(function(prev) { var n = Object.assign({}, prev); n[q.key] = e.target.value; return n; }); }}
                                onKeyDown={function(e) { if (e.key === 'Enter' && collegeSearchPrefs[q.key].trim()) setCollegeSearchStep(qIdx + 1); }}
                                autoFocus
                                style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdrL, background: dm ? '#0c0c0f' : '#ffffff', color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
                              <button onClick={function(e) { e.stopPropagation(); if (collegeSearchPrefs[q.key].trim()) setCollegeSearchStep(qIdx + 1); }}
                                disabled={!collegeSearchPrefs[q.key].trim()}
                                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: collegeSearchPrefs[q.key].trim() ? accent : bgSec, color: collegeSearchPrefs[q.key].trim() ? '#fff' : txMut, fontWeight: 600, fontSize: 13, cursor: collegeSearchPrefs[q.key].trim() ? 'pointer' : 'default' }}>
                                Next →
                              </button>
                            </div>
                          )}

                          {isActive && !q.type && (
                            <div style={{ display: 'grid', gap: 6, gridTemplateColumns: q.options.length > 4 ? '1fr 1fr' : '1fr' }}>
                              {q.options.map(function(opt, oi) {
                                var isSelected = collegeSearchPrefs[q.key] === opt;
                                return (
                                  <button key={oi} onClick={function(e) {
                                    e.stopPropagation();
                                    setCollegeSearchPrefs(function(prev) { var n = Object.assign({}, prev); n[q.key] = opt; return n; });
                                    if (qIdx < collegeSearchQuestions.length - 1) setTimeout(function() { setCollegeSearchStep(qIdx + 1); }, 200);
                                  }}
                                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid ' + (isSelected ? accent + '66' : bdr), background: isSelected ? accent + '18' : bgCard, color: isSelected ? accent : txSub, fontSize: 13, fontWeight: isSelected ? 600 : 400, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Search button */}
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                      <button onClick={searchColleges}
                        disabled={!collegeSearchPrefs.major.trim()}
                        style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: collegeSearchPrefs.major.trim() ? 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')' : bgSec, color: collegeSearchPrefs.major.trim() ? '#fff' : txMut, fontWeight: 700, fontSize: 15, cursor: collegeSearchPrefs.major.trim() ? 'pointer' : 'default', boxShadow: collegeSearchPrefs.major.trim() ? '0 4px 20px ' + accent + '33' : 'none', transition: 'all 0.2s' }}>
                        🔍 Find My Colleges
                      </button>
                      {!collegeSearchPrefs.major.trim() && <p style={{ color: txMut, fontSize: 12, marginTop: 8 }}>Enter a major to get started</p>}
                    </div>
                  </div>
                )}

                {collegeSearchLoading && (
                  <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accent, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: tx, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Searching colleges...</p>
                    <p style={{ color: txMut, fontSize: 13 }}>Finding the best matches for {collegeSearchPrefs.major || 'your interests'}</p>
                  </div>
                )}

                {collegeSearchResults && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div>
                        <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, margin: 0 }}>Your Matches</h3>
                        <p style={{ color: txMut, fontSize: 12, margin: '4px 0 0' }}>Based on: {collegeSearchPrefs.major} • {collegeSearchPrefs.size || 'Any size'} • {collegeSearchPrefs.setting || 'Any setting'}</p>
                      </div>
                      <button onClick={function() { setCollegeSearchResults(null); setCollegeSearchStep(0); }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', color: txSub, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        ← New Search
                      </button>
                    </div>

                    {collegeSearchResults.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 20px', background: bgCard, border: '1px solid ' + bdr, borderRadius: 14 }}>
                        <p style={{ color: txSub, fontSize: 14 }}>Couldn't find matches. Try adjusting your preferences and searching again.</p>
                      </div>
                    )}

                    <div style={{ display: 'grid', gap: 12 }}>
                      {collegeSearchResults.map(function(college, i) {
                        var isExpanded = expandedSearchCollege === i;
                        return (
                          <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, overflow: 'hidden', transition: 'all 0.2s' }}>
                            <div onClick={function() { setExpandedSearchCollege(isExpanded ? null : i); }}
                              style={{ padding: '16px 18px', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{college.name}</div>
                                  <div style={{ color: txMut, fontSize: 12 }}>📍 {college.location}</div>
                                </div>
                                <span style={{ color: txMut, fontSize: 14, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', marginTop: 4 }}>▾</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                <span style={{ background: accent + '15', color: accent, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Acceptance: {college.acceptanceRate}</span>
                                <span style={{ background: bgSec, color: txSub, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{college.size}</span>
                                <span style={{ background: bgSec, color: txSub, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{college.setting}</span>
                              </div>
                            </div>

                            {isExpanded && (
                              <div style={{ padding: '0 18px 18px', borderTop: '1px solid ' + bdr, paddingTop: 14 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                                  <div style={{ background: bgSec, borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ color: txMut, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Avg GPA</div>
                                    <div style={{ color: tx, fontSize: 16, fontWeight: 700 }}>{college.avgGPA || 'N/A'}</div>
                                  </div>
                                  <div style={{ background: bgSec, borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ color: txMut, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>SAT Range</div>
                                    <div style={{ color: tx, fontSize: 16, fontWeight: 700 }}>{college.avgSAT || 'N/A'}</div>
                                  </div>
                                  <div style={{ background: bgSec, borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ color: txMut, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Tuition</div>
                                    <div style={{ color: tx, fontSize: 14, fontWeight: 700 }}>{college.tuition || 'N/A'}</div>
                                  </div>
                                  <div style={{ background: bgSec, borderRadius: 10, padding: '12px 14px' }}>
                                    <div style={{ color: txMut, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Financial Aid</div>
                                    <div style={{ color: tx, fontSize: 13, fontWeight: 600 }}>{college.financialAid || 'N/A'}</div>
                                  </div>
                                </div>

                                {college.topMajors && college.topMajors.length > 0 && (
                                  <div style={{ marginBottom: 14 }}>
                                    <div style={{ color: txMut, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Top Majors</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                      {college.topMajors.map(function(m, mi) { return <span key={mi} style={{ background: accent + '12', color: accent, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{m}</span>; })}
                                    </div>
                                  </div>
                                )}

                                {college.whyGoodFit && (
                                  <div style={{ background: accent + '0a', border: '1px solid ' + accent + '22', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
                                    <div style={{ color: accent, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Why It's a Good Fit</div>
                                    <p style={{ color: txSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{college.whyGoodFit}</p>
                                  </div>
                                )}

                                {college.website && (
                                  <a href={college.website} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid ' + accent + '44', background: accent + '0a', color: accent, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                                    Visit Website ↗
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activities' && (
              <div>
                <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Extracurriculars</h3>
                <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                  {extracurriculars.map(function(activity, i) {
                    return (
                      <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ color: tx, fontSize: 14, fontWeight: 600 }}>{activity.activity}</div>
                          <span style={{ background: bgSec, color: txSub, padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{activity.type}</span>
                        </div>
                        <p style={{ color: txDim, fontSize: 12, margin: '0 0 6px', lineHeight: 1.5 }}>{activity.relevance}</p>
                        <div style={{ color: txMut, fontSize: 11 }}>⏱️ {activity.commitment}</div>
                      </div>
                    );
                  })}
                </div>
                {summerActivities.length > 0 && (<>
                  <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Summer Planning</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {summerActivities.map(function(summer, i) {
                      return (
                        <div key={i} style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '14px 16px' }}>
                          <div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{summer.year}</div>
                          <ul style={{ color: txSub, fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                            {summer.activities.map(function(act, j) { return <li key={j}>{act}</li>; })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </>)}
              </div>
            )}

            {activeTab === 'testing' && (
              <div>
                {standardizedTests.sat && (
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                    <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>SAT</h3>
                    <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>When to Take</div><div style={{ color: txSub, fontSize: 13 }}>{standardizedTests.sat.when}</div></div>
                    <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Target Score</div><div style={{ color: txSub, fontSize: 13 }}>{standardizedTests.sat.target}</div></div>
                    <div style={{ marginBottom: 14 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Preparation</div><div style={{ color: txDim, fontSize: 12, lineHeight: 1.6 }}>{standardizedTests.sat.prep}</div></div>
                    <div><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Study Resources</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {[{ name: 'Khan Academy SAT Prep', desc: 'Free official College Board partner', url: 'https://www.khanacademy.org/SAT' }, { name: 'College Board Official Practice', desc: 'Free full-length practice tests', url: 'https://satsuite.collegeboard.org/sat/practice-preparation' }, { name: 'Bluebook App', desc: 'Official digital SAT practice app', url: 'https://bluebook.collegeboard.org/' }].map(function(r, i) {
                          return (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: bgSec, borderRadius: 8, border: '1px solid ' + bdrL, textDecoration: 'none' }}><div><div style={{ color: tx, fontSize: 13, fontWeight: 600 }}>{r.name}</div><div style={{ color: txMut, fontSize: 11, marginTop: 2 }}>{r.desc}</div></div><span style={{ color: accent, fontSize: 14, flexShrink: 0, marginLeft: 8 }}>↗</span></a>);
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {standardizedTests.act && (
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                    <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 10 }}>ACT</h3>
                    <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>When to Take</div><div style={{ color: txSub, fontSize: 13 }}>{standardizedTests.act.when}</div></div>
                    <div style={{ marginBottom: 10 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Target Score</div><div style={{ color: txSub, fontSize: 13 }}>{standardizedTests.act.target}</div></div>
                    <div style={{ marginBottom: 14 }}><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Preparation</div><div style={{ color: txDim, fontSize: 12, lineHeight: 1.6 }}>{standardizedTests.act.prep}</div></div>
                    <div><div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Study Resources</div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        {[{ name: 'ACT Academy', desc: 'Free official ACT practice', url: 'https://academy.act.org/' }, { name: 'ACT Official Practice Tests', desc: 'Full-length practice tests', url: 'https://www.act.org/content/act/en/products-and-services/the-act/test-preparation.html' }, { name: 'CrackACT', desc: 'Free real past ACT tests', url: 'https://www.crackact.com/' }].map(function(r, i) {
                          return (<a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: bgSec, borderRadius: 8, border: '1px solid ' + bdrL, textDecoration: 'none' }}><div><div style={{ color: tx, fontSize: 13, fontWeight: 600 }}>{r.name}</div><div style={{ color: txMut, fontSize: 11, marginTop: 2 }}>{r.desc}</div></div><span style={{ color: accent, fontSize: 14, flexShrink: 0, marginLeft: 8 }}>↗</span></a>);
                        })}
                      </div>
                    </div>
                  </div>
                )}
                {standardizedTests.ap && standardizedTests.ap.length > 0 && (
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '16px 18px' }}>
                    <h3 style={{ color: tx, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended AP Exams</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{standardizedTests.ap.map(function(exam, i) { return <span key={i} style={{ background: accent + '12', color: accent, padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500 }}>{exam}</span>; })}</div>
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
                      <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                        <div style={{ position: 'absolute', left: -23, top: 14, width: 12, height: 12, borderRadius: '50%', background: accent, border: '2px solid ' + bg }} />
                        <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ color: accent, fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{item.when}</div>
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
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{skills.map(function(skill, i) { return <span key={i} style={{ background: accent + '12', color: accent, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{skill}</span>; })}</div>
                  </div>
                )}
              </div>
            )}

            {/* CAREER EXPLORER */}
            {activeTab === 'careers' && (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🧭</div>
                  <h3 style={{ color: tx, fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Career Explorer</h3>
                  <p style={{ color: txMut, fontSize: 14, margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>Discover what different careers look like — salary, daily life, required skills, and how to get started as a high school student.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input type="text" placeholder="Search any career — e.g. Surgeon, UX Designer, Architect..." value={careerExplorerSearch} onChange={function(e) { setCareerExplorerSearch(e.target.value); }} onKeyDown={function(e) { if (e.key === 'Enter') exploreCareer(); }} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none' }} />
                  <button onClick={exploreCareer} disabled={!careerExplorerSearch.trim() || careerExplorerLoading} style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: careerExplorerSearch.trim() && !careerExplorerLoading ? accent : bgSec, color: careerExplorerSearch.trim() && !careerExplorerLoading ? '#fff' : txMut, fontWeight: 700, fontSize: 14, cursor: careerExplorerSearch.trim() && !careerExplorerLoading ? 'pointer' : 'default' }}>{careerExplorerLoading ? '...' : 'Explore'}</button>
                </div>
                {!careerExplorerResult && !careerExplorerLoading && (
                  <div>
                    <div style={{ color: txMut, fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Popular Searches</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Software Engineer', 'Doctor', 'Lawyer', 'Investment Banker', 'Architect', 'Data Scientist', 'Psychologist', 'Entrepreneur', 'Veterinarian', 'Film Director', 'Pharmacist', 'Mechanical Engineer'].map(function(c, i) {
                        return (<button key={i} onClick={function() { setCareerExplorerSearch(c); }} style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>{c}</button>);
                      })}
                    </div>
                  </div>
                )}
                {careerExplorerLoading && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accent, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: txMut, fontSize: 14 }}>Researching {careerExplorerSearch}...</p>
                  </div>
                )}
                {careerExplorerResult && (
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '20px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    <div style={{ color: tx, fontSize: 14 }}>{careerExplorerResult}</div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + bdr }}>
                      <button onClick={function() { setCareerExplorerResult(null); setCareerExplorerSearch(''); }} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', color: txSub, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>← Explore Another</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'advisor' && (
              <div style={{ height: '100%' }}>
                <HSChatbot careerField={currentRoadmap.careerField} accent={accent} primaryColor={primaryColor} darkMode={darkMode} inline={true} />
              </div>
            )}

          </div>
        </main>
      </div>

      {/* MODAL */}
      {hsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={function() { setHsModal(null); setHsModalInput(''); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: dm ? '#131318' : '#ffffff', border: '1px solid ' + bdr, borderRadius: 14, padding: '24px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: tx, fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>{hsModal.title}</h3>
            <input type="text" placeholder={hsModal.placeholder} value={hsModalInput} onChange={function(e) { setHsModalInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && hsModalInput.trim()) { var url = hsModalInput.trim(); setCatalogUrl(url); setHsModal(null); setHsModalInput(''); setRegenerating(true); fetch('/api/generate-hs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ careerGoal: currentRoadmap.careerField, catalogUrl: url }) }).then(function(res) { return res.json(); }).then(function(data) { if (data.years) { setCurrentRoadmap(data); setActiveYear(0); setActiveTab('courses'); } setRegenerating(false); }).catch(function() { setRegenerating(false); }); } }}
              autoFocus style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdrL, background: dm ? '#09090b' : '#f5f5f8', color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={function() { setHsModal(null); setHsModalInput(''); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid ' + bdrL, background: 'transparent', color: txSub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={function() { if (!hsModalInput.trim()) return; var url = hsModalInput.trim(); setCatalogUrl(url); setHsModal(null); setHsModalInput(''); setRegenerating(true); fetch('/api/generate-hs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ careerGoal: currentRoadmap.careerField, catalogUrl: url }) }).then(function(res) { return res.json(); }).then(function(data) { if (data.years) { setCurrentRoadmap(data); setActiveYear(0); setActiveTab('courses'); } setRegenerating(false); }).catch(function() { setRegenerating(false); }); }} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: hsModalInput.trim() ? 'pointer' : 'default', opacity: hsModalInput.trim() ? 1 : 0.5 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
