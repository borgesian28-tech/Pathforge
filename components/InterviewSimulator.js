'use client';
import { useState, useRef, useEffect } from 'react';

export default function InterviewSimulator({ profile, accent, primaryColor, darkMode }) {
  var [mode, setMode] = useState(null);
  var [messages, setMessages] = useState([]);
  var [input, setInput] = useState('');
  var [loading, setLoading] = useState(false);
  var [score, setScore] = useState(null);
  var [questionCount, setQuestionCount] = useState(0);
  var messagesEnd = useRef(null);
  var inputRef = useRef(null);
  var dm = darkMode !== false;

  var bg = dm ? '#0a0a0a' : '#ffffff';
  var bgCard = dm ? '#141414' : '#f7f7fa';
  var bgSec = dm ? '#1e1e1e' : '#ededf3';
  var bdr = dm ? '#2a2a2a' : '#d5d5e0';
  var bdrL = dm ? '#333333' : '#c5c5d0';
  var tx = dm ? '#fff' : '#111111';
  var txSub = dm ? '#ddd' : '#222222';
  var txMut = dm ? '#6a6a7a' : '#666666';
  var txDim = dm ? '#8a8a9a' : '#555555';
  var inputBg = dm ? '#141414' : '#f7f7fa';

  useEffect(function() {
    if (messagesEnd.current) messagesEnd.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(function() {
    if (mode && inputRef.current) setTimeout(function() { inputRef.current.focus(); }, 100);
  }, [mode, messages]);

  var careerLabel = profile.careerLabel || 'your career';

  var interviewTypes = [
    { id: 'technical', icon: '🧠', label: 'Technical', desc: 'Industry-specific technical questions', examples: careerLabel.indexOf('Banking') !== -1 ? 'DCF, LBO, valuation, accounting' : careerLabel.indexOf('Consulting') !== -1 ? 'Market sizing, profitability, M&A' : careerLabel.indexOf('Software') !== -1 ? 'Data structures, algorithms, system design' : 'Role-specific technical skills' },
    { id: 'behavioral', icon: '💬', label: 'Behavioral', desc: 'Tell me about a time when...', examples: 'Leadership, teamwork, conflict, failure' },
    { id: 'case', icon: '📋', label: 'Case Study', desc: 'Real-world business scenarios', examples: 'Strategy, analysis, problem-solving' },
  ];

  var startInterview = async function(type) {
    setMode(type);
    setMessages([]);
    setScore(null);
    setQuestionCount(0);
    setLoading(true);
    try {
      var typeLabel = type === 'technical' ? 'technical' : type === 'behavioral' ? 'behavioral' : 'case study';
      var systemPrompt = 'You are an expert ' + careerLabel + ' interviewer conducting a ' + typeLabel + ' mock interview.\n\nStudent: ' + (profile.name || 'Student') + '\nSchool: ' + (profile.courseData.schoolFullName || profile.school) + '\nCareer: ' + careerLabel + '\nMajor: ' + (profile.courseData.major || profile.major) + '\n\nRULES:\n- Ask ONE question at a time.\n- Wait for the student to answer before asking the next question.\n- After each answer, give brief feedback (1-2 sentences) then ask the next question.\n- Make questions realistic for ' + careerLabel + ' interviews.\n- After 5 questions, provide a final score out of 100 and summary. Format: FINAL_SCORE:XX\n\nStart with a brief intro and your first question.';
      var res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'Start the ' + typeLabel + ' mock interview.' }], context: systemPrompt }) });
      if (res.ok) { var data = await res.json(); setMessages([{ role: 'assistant', text: data.reply }]); setQuestionCount(1); }
    } catch(e) { setMessages([{ role: 'assistant', text: 'Failed to start interview. Please try again.' }]); }
    setLoading(false);
  };

  var sendAnswer = async function() {
    if (!input.trim() || loading) return;
    var userMsg = input.trim();
    setInput('');
    var newMessages = messages.concat([{ role: 'user', text: userMsg }]);
    setMessages(newMessages);
    setLoading(true);
    try {
      var history = newMessages.map(function(m) { return { role: m.role === 'user' ? 'user' : 'assistant', content: m.text }; });
      var typeLabel = mode === 'technical' ? 'technical' : mode === 'behavioral' ? 'behavioral' : 'case study';
      var systemPrompt = 'You are an expert ' + careerLabel + ' interviewer conducting a ' + typeLabel + ' mock interview. Student: ' + (profile.name || 'Student') + ' at ' + (profile.school) + ' pursuing ' + careerLabel + '. Give brief feedback on their answer, then ask the next question. After question 5, give FINAL_SCORE:XX (0-100) with summary. Question count: ' + questionCount;
      var res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: history, context: systemPrompt }) });
      if (res.ok) {
        var data = await res.json();
        var reply = data.reply || '';
        var scoreMatch = reply.match(/FINAL_SCORE:(\d+)/);
        if (scoreMatch) { setScore(parseInt(scoreMatch[1])); reply = reply.replace(/FINAL_SCORE:\d+/g, '').trim(); }
        setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: reply }]); });
        setQuestionCount(function(c) { return c + 1; });
      }
    } catch(e) { setMessages(function(prev) { return prev.concat([{ role: 'assistant', text: 'Connection error.' }]); }); }
    setLoading(false);
  };

  if (!mode) {
    return (
      <div style={{ marginTop: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎯</div>
          <h3 style={{ fontFamily: "'Instrument Serif', Georgia, serif", color: tx, fontSize: 22, margin: '0 0 6px' }}>Mock Interview Simulator</h3>
          <p style={{ color: txMut, fontSize: 14, margin: 0 }}>Practice real {careerLabel} interview questions with AI feedback</p>
        </div>
        <div style={{ display: 'grid', gap: 12 }}>
          {interviewTypes.map(function(t) {
            return (
              <button key={t.id} onClick={function() { startInterview(t.id); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 14, border: '1px solid ' + bdr, background: bgCard, cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: tx, fontWeight: 700, fontSize: 16 }}>{t.label}</div>
                  <div style={{ color: txDim, fontSize: 13, marginTop: 2 }}>{t.desc}</div>
                  <div style={{ color: accent, fontSize: 11, marginTop: 4, fontWeight: 600 }}>{t.examples}</div>
                </div>
                <span style={{ color: txMut, fontSize: 18 }}>→</span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 16, background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>💡</span>
          <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Each session is 5 questions. You'll get real-time feedback and a final score out of 100.</p>
        </div>
      </div>
    );
  }

  var scoreColor = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#ef4444';

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={function() { setMode(null); setMessages([]); setScore(null); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid ' + bdrL, background: 'transparent', color: txDim, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>← Back to menu</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: txMut, fontSize: 12 }}>Q{Math.min(questionCount, 5)}/5</span>
          <div style={{ width: 80, height: 4, background: bgSec, borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: Math.min(questionCount, 5) * 20 + '%', background: accent, borderRadius: 2, transition: 'width 0.3s' }} />
          </div>
        </div>
      </div>
      {score !== null && (
        <div style={{ background: 'linear-gradient(135deg, ' + primaryColor + '44, ' + bgCard + ')', border: '1px solid ' + accent + '33', borderRadius: 16, padding: '20px', marginBottom: 16, textAlign: 'center' }}>
          <div style={{ color: scoreColor, fontSize: 48, fontWeight: 700 }}>{score}</div>
          <div style={{ color: txMut, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Interview Score</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
            <button onClick={function() { startInterview(mode); }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: accent, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Try Again</button>
            <button onClick={function() { setMode(null); setMessages([]); setScore(null); }} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid ' + bdrL, background: 'transparent', color: txSub, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Other Types</button>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {messages.map(function(msg, i) {
          var isUser = msg.role === 'user';
          return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '90%', padding: '12px 16px', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', background: isUser ? accent + '22' : bgCard, border: '1px solid ' + (isUser ? accent + '33' : bdr), color: txSub, fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '14px 20px', borderRadius: '14px 14px 14px 4px', background: bgCard, border: '1px solid ' + bdr }}>
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
      {!score && (
        <div style={{ position: 'sticky', bottom: 0, paddingTop: 12, paddingBottom: 20, background: bg }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <textarea ref={inputRef} value={input} onChange={function(e) { setInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAnswer(); } }}
              placeholder="Type your answer..." rows={3}
              style={{ flex: 1, padding: '12px 14px', borderRadius: 12, border: '1px solid ' + bdrL, background: inputBg, color: tx, fontSize: 14, outline: 'none', resize: 'none', lineHeight: 1.5 }} />
            <button onClick={sendAnswer} disabled={!input.trim() || loading}
              style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: input.trim() && !loading ? accent : bgSec, color: input.trim() && !loading ? '#000' : txMut, fontWeight: 700, fontSize: 16, cursor: input.trim() && !loading ? 'pointer' : 'default', alignSelf: 'flex-end' }}>
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
