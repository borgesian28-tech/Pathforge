'use client';
import { useState, useEffect } from 'react';
import { CAREER_OPTIONS } from '@/lib/constants';

export default function LoadingScreen({ status, career, onRetry, error }) {
  const c = CAREER_OPTIONS.find(function(o) { return o.id === career; }) || CAREER_OPTIONS[0];
  var [dots, setDots] = useState('');
  var [factIdx, setFactIdx] = useState(0);
  var [progress, setProgress] = useState(0);

  var funFacts = {
    investment_banking: [
      'The average IB analyst works 80-100 hours per week during their first two years.',
      'Goldman Sachs was founded in 1869 — it started as a commercial paper business.',
      'The term "IPO" was first used in the 1970s, but companies have been going public since the 1600s.',
      'JPMorgan Chase processes over $6 trillion in payments daily.',
      'The first leveraged buyout happened in 1955 when McLean Industries bought Pan-Atlantic Steamship.',
    ],
    software_engineering: [
      'The first computer programmer was Ada Lovelace, who wrote algorithms for Charles Babbage\'s machine in the 1840s.',
      'There are roughly 700 programming languages in existence today.',
      'The average software engineer at a FAANG company earns $200K+ in total compensation.',
      'Git was created by Linus Torvalds in just 10 days.',
      'Stack Overflow gets over 100 million monthly visitors — most of them copy-pasting code.',
    ],
    management_consulting: [
      'McKinsey, BCG, and Bain (MBB) accept only about 1% of applicants.',
      'The consulting industry generates over $300 billion in annual revenue globally.',
      'Case interviews were pioneered by McKinsey in the 1950s.',
      'The average MBB consultant visits 3-4 cities per month.',
      'Most consulting firms promote on an "up or out" timeline of 2-3 years per level.',
    ],
    data_science: [
      '90% of the world\'s data was created in just the last two years.',
      'The term "data scientist" was coined in 2008 by DJ Patil and Jeff Hammerbacher.',
      'Netflix saves $1 billion per year through its recommendation algorithm.',
      'Python overtook R as the most popular data science language in 2018.',
      'A data scientist spends about 80% of their time cleaning and preparing data.',
    ],
    medicine: [
      'The average medical school graduate has over $200,000 in student debt.',
      'It takes 11-16 years of training after high school to become a practicing physician.',
      'The Hippocratic Oath dates back to the 5th century BCE in ancient Greece.',
      'There are over 120 medical specialties and subspecialties to choose from.',
      'The MCAT is one of the longest standardized tests at 7.5 hours.',
    ],
    law: [
      'Abraham Lincoln was a self-taught lawyer who never went to law school.',
      'The LSAT has been a law school admission requirement since 1948.',
      'There are 1.3 million active lawyers in the United States.',
      'The Bar exam passage rate on the first attempt averages about 68%.',
      'The highest-paid law firm partners can earn over $10 million per year.',
    ],
    custom: [
      'Students who plan their career path early are 3x more likely to land jobs in their target field.',
      'Networking accounts for up to 85% of jobs filled, according to LinkedIn.',
      'The average college student changes their major 3 times before graduating.',
      'Internship experience is the #1 factor employers consider when hiring new graduates.',
      'Students with a clear career plan complete their degrees 1.5 years faster on average.',
    ],
  };

  var facts = funFacts[career] || funFacts.custom;

  var steps = [
    { label: 'Searching course catalog', icon: '🔍' },
    { label: 'Finding advanced courses', icon: '📚' },
    { label: 'Building your roadmap', icon: '🗺️' },
    { label: 'Gathering career data', icon: '💼' },
    { label: 'Finalizing your plan', icon: '✨' },
  ];

  useEffect(function() {
    var d = setInterval(function() { setDots(function(p) { return p.length >= 3 ? '' : p + '.'; }); }, 400);
    var f = setInterval(function() { setFactIdx(function(p) { return (p + 1) % facts.length; }); }, 5000);
    return function() { clearInterval(d); clearInterval(f); };
  }, []);

  useEffect(function() {
    if (error) return;
    var targets = [
      { time: 500, val: 10 },
      { time: 2000, val: 25 },
      { time: 5000, val: 45 },
      { time: 8000, val: 60 },
      { time: 12000, val: 75 },
      { time: 16000, val: 85 },
      { time: 20000, val: 92 },
    ];
    var timers = targets.map(function(t) {
      return setTimeout(function() { setProgress(t.val); }, t.time);
    });
    return function() { timers.forEach(clearTimeout); };
  }, [error]);

  // Determine current step from progress
  var currentStep = progress < 20 ? 0 : progress < 40 ? 1 : progress < 60 ? 2 : progress < 80 ? 3 : 4;

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #08080f 0%, #0c0c1a 50%, #08080f 100%)', padding: 20 }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }} className="fade-in">
          <div style={{ fontSize: 56, marginBottom: 20 }}>⚡</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 24, margin: '0 0 12px' }}>Hit a Snag</h2>
          <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>Our AI is processing a lot of data right now. This happens sometimes — it doesn't mean anything is wrong with your request.</p>
          <p style={{ color: '#6a6a7a', fontSize: 13, lineHeight: 1.5, marginBottom: 28 }}>The retry usually works on the first try. We're searching through thousands of real courses to build your personalized roadmap.</p>
          <button onClick={onRetry} style={{ padding: '14px 40px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, ' + c.accent + ', ' + c.color + ')', color: '#000', fontWeight: 700, fontSize: 16, cursor: 'pointer', width: '100%', marginBottom: 12, transition: 'all 0.3s' }}>
            🔄 Retry — Build My Roadmap
          </button>
          <p style={{ color: '#4a4a5a', fontSize: 12 }}>Takes about 15-20 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #08080f 0%, #0c0c1a 50%, #08080f 100%)', padding: 20 }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center' }} className="fade-in">
        {/* Spinner */}
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid ' + c.accent + '22' }} />
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: c.accent, animation: 'spin 1s linear infinite' }} />
          <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '3px solid transparent', borderTopColor: c.color, animation: 'spin 1.5s linear infinite reverse' }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>{c.icon}</div>
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 'clamp(20px, 4vw, 26px)', margin: '0 0 8px' }}>Building Your Roadmap</h2>
        <p style={{ color: c.accent, fontSize: 14, fontWeight: 500, marginBottom: 24 }}>{status}{dots}</p>

        {/* Progress bar */}
        <div style={{ width: '100%', maxWidth: 320, margin: '0 auto 24px', background: '#1a1a2e', borderRadius: 6, height: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg, ' + c.accent + ', ' + c.color + ')', borderRadius: 6, transition: 'width 1s ease' }} />
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28, maxWidth: 300, margin: '0 auto 28px' }}>
          {steps.map(function(s, i) {
            var isDone = i < currentStep;
            var isCurrent = i === currentStep;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isDone ? 0.5 : isCurrent ? 1 : 0.25, transition: 'opacity 0.5s' }}>
                <span style={{ fontSize: 14, width: 22, textAlign: 'center' }}>{isDone ? '✓' : s.icon}</span>
                <span style={{ color: isDone ? '#4ade80' : isCurrent ? '#fff' : '#4a4a5a', fontSize: 13, fontWeight: isCurrent ? 600 : 400 }}>{s.label}</span>
                {isCurrent && <div style={{ width: 4, height: 4, borderRadius: '50%', background: c.accent, animation: 'pulse 1.5s infinite', marginLeft: 'auto' }} />}
              </div>
            );
          })}
        </div>

        {/* Fun fact */}
        <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '14px 18px', maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
          <div style={{ color: c.accent, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>DID YOU KNOW?</div>
          <p style={{ color: '#8a8a9a', fontSize: 13, margin: 0, lineHeight: 1.6, minHeight: 40 }}>{facts[factIdx]}</p>
        </div>
      </div>
    </div>
  );
}
