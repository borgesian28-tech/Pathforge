'use client';
import { useState, useRef, useEffect } from 'react';

export default function AiAdvisor({ profile, accent, primaryColor, darkMode, inline }) {
  var [open, setOpen] = useState(inline ? true : false);
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var messagesEnd = useRef(null);
  var inputRef = useRef(null);
  var dm = darkMode !== false;

  var chatBg = dm ? '#0d0d0d' : '#ffffff';
  var chatBdr = dm ? '#2a2a2a' : '#d5d5e0';
  var chatCard = dm ? '#141414' : '#f7f7fa';
  var tx = dm ? '#fff' : '#111111';
  var txSub = dm ? '#ccc' : '#222222';
  var txMut = dm ? '#6a6a7a' : '#666666';

  useEffect(function() {
    if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(function() {
    if (open && inputRef.current) setTimeout(function() { inputRef.current.focus(); }, 100);
  }, [open]);

  var buildContext = function() {
    var ctx = 'You are an expert college career advisor for ' + (profile.name || 'a student') + '.\n';
    ctx += 'School: ' + (profile.courseData.schoolFullName || profile.school) + '\n';
    ctx += 'Career goal: ' + profile.careerLabel + '\n';
    ctx += 'Major: ' + (profile.courseData.major || profile.major) + '\n';
    ctx += 'Program: ' + (profile.programLevel === 'masters' ? "Master's/Graduate" : 'Undergraduate') + '\n';
    if (profile.courseData.semesters) {
      ctx += 'Courses: ' + profile.courseData.semesters.map(function(s) {
        return s.name + ': ' + (s.courses ? s.courses.map(function(c) { return c.code; }).join(', ') : '');
      }).join(' | ') + '\n';
    }
    if (profile.courseData.skills) ctx += 'Key skills: ' + profile.courseData.skills.join(', ') + '\n';
    if (profile.courseData.outcomes && profile.courseData.outcomes.topEmployers) {
      ctx += 'Top employers: ' + profile.courseData.outcomes.topEmployers.map(function(e) { return e.name; }).join(', ') + '\n';
    }
    ctx += '\nBe specific to their school and career. Keep responses concise (2-3 paragraphs max). Be encouraging but honest.';
    return ctx;
  };

  var sendMessage = async function(text) {
    var userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput('');
    var newMessages = messages.concat([{ role: 'user', text: userMsg }]);
    setMessages(newMessages);
    setLoading(true);
    try {
      var history = newMessages.map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });
      var res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context: buildContext() }) });
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
    'What internships should I target this semester?',
    'How do I network with ' + profile.careerLabel + ' professionals?',
    'What should I do this summer?',
    'Am I on track for recruiting?',
  ];

  if (!open && !inline) {
    return (
      <button onClick={function() { setOpen(true); }}
        style={{ position: 'fixed', bottom: 20, right: 20, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, ' + accent + ', ' + primaryColor + ')', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', boxShadow: '0 4px 20px ' + accent + '44', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        💬
      </button>
    );
  }

  var containerStyle = inline ? { display: 'flex', flexDirection: 'column', minHeight: 500, maxHeight: 'calc(100vh - 140px)' } : { position: 'fixed', bottom: 20, right: 20, width: 'min(400px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 40px))', background: chatBg, border: '1px solid ' + chatBdr, borderRadius: 20, zIndex: 50, display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.3)', overflow: 'hidden' };

  return (
    <div style={containerStyle}>
      {!inline && (
      <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg, ' + primaryColor + (dm ? '88' : '33') + ', ' + chatBg + ')', borderBottom: '1px solid ' + chatBdr, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
          <div>
            <div style={{ color: tx, fontSize: 14, fontWeight: 700 }}>PathForge Advisor</div>
            <div style={{ color: txMut, fontSize: 11 }}>AI career coach • {profile.careerLabel}</div>
          </div>
        </div>
        <button onClick={function() { setOpen(false); }} style={{ background: 'none', border: 'none', color: txMut, fontSize: 18, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>✕</button>
      </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: '14px' }}>
        {messages.length === 0 && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16, paddingTop: 10 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎓</div>
              <div style={{ color: tx, fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Hi {profile.name || 'there'}!</div>
              <div style={{ color: txMut, fontSize: 13, lineHeight: 1.5 }}>Ask me anything about your {profile.careerLabel} path.</div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {suggestions.map(function(s, i) {
                return (
                  <button key={i} onClick={function() { sendMessage(s); }}
                    style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCard, color: txSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', lineHeight: 1.4 }}>
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
              <div style={{ maxWidth: '85%', padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isUser ? accent + '33' : chatCard, border: '1px solid ' + (isUser ? accent + '44' : chatBdr), color: txSub, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
            <div style={{ padding: '12px 18px', borderRadius: '14px 14px 14px 4px', background: chatCard, border: '1px solid ' + chatBdr }}>
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
            placeholder="Ask anything about your career path..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid ' + chatBdr, background: chatCard, color: tx, fontSize: 13, outline: 'none' }} />
          <button onClick={function() { sendMessage(); }} disabled={!input.trim() || loading}
            style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: input.trim() && !loading ? accent : (dm ? '#333333' : '#d5d5e0'), color: input.trim() && !loading ? '#000' : txMut, fontWeight: 700, fontSize: 14, cursor: input.trim() && !loading ? 'pointer' : 'default' }}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
