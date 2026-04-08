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
      'JPMorgan Chase processes over $6 trillion in payments daily.',
      'The first leveraged buyout happened in 1955 when McLean Industries bought Pan-Atlantic Steamship.',
      'Warren Buffett was rejected by Harvard Business School. He went to Columbia instead.',
      'The term "bull market" dates back to the 1700s and refers to how a bull attacks — thrusting upward.',
      'Morgan Stanley was created in 1935 after the Glass-Steagall Act forced JP Morgan to split.',
      'The average first-year IB analyst bonus is $50,000-$100,000 on top of base salary.',
      'Excel keyboard shortcuts can save an IB analyst up to 2 hours per day.',
      'The largest M&A deal in history was Vodafone\'s $183 billion acquisition of Mannesmann in 2000.',
      'Most investment banks require a minimum of 400 hours of community service for analyst classes.',
      'The "2 and 20" fee structure in private equity means 2% management fee and 20% of profits.',
      'Bloomberg terminals cost about $24,000 per year per user — and there are 325,000 active globally.',
      'The average IPO takes 6-12 months to complete from start to listing.',
      'Superday interviews at top banks can include 8-12 back-to-back 30-minute interviews.',
    ],
    software_engineering: [
      'The first computer programmer was Ada Lovelace in the 1840s.',
      'There are roughly 700 programming languages in existence today.',
      'The average SWE at a FAANG company earns $200K+ in total compensation.',
      'Git was created by Linus Torvalds in just 10 days.',
      'Stack Overflow gets over 100 million monthly visitors.',
      'The first computer bug was an actual moth found in Harvard\'s Mark II computer in 1947.',
      'JavaScript was created in just 10 days by Brendan Eich at Netscape in 1995.',
      'Google processes over 8.5 billion searches per day — about 99,000 every second.',
      'The average software engineer changes jobs every 2-3 years.',
      'NASA\'s Apollo 11 computer had less processing power than a modern calculator.',
      'The first website ever created is still online at info.cern.ch.',
      'Python was named after Monty Python, not the snake.',
      'About 50% of software engineering work involves reading and understanding existing code.',
      'The global developer population is estimated at 28.7 million and growing fast.',
      'The "Hello, World!" program tradition was started by Brian Kernighan in 1972.',
    ],
    management_consulting: [
      'McKinsey, BCG, and Bain (MBB) accept only about 1% of applicants.',
      'The consulting industry generates over $300 billion in annual revenue globally.',
      'Case interviews were pioneered by McKinsey in the 1950s.',
      'The average MBB consultant visits 3-4 cities per month.',
      'Most consulting firms promote on an "up or out" timeline of 2-3 years per level.',
      'McKinsey was founded in 1926 by James O. McKinsey, an accounting professor.',
      'BCG\'s founder, Bruce Henderson, started the firm with just one employee — himself.',
      'The phrase "80/20 rule" (Pareto Principle) is a favorite tool of management consultants.',
      'Top consulting firms spend $10,000-$15,000 per employee on training each year.',
      'Bain & Company has been named #1 on Glassdoor\'s Best Places to Work multiple times.',
      'The average MBB partner earns $1-3 million per year.',
      'Consulting decks (PowerPoints) at MBB firms can have 100+ slides for a single project.',
      'About 30% of Fortune 500 CEOs have consulting backgrounds.',
      'The "MECE" framework (Mutually Exclusive, Collectively Exhaustive) is the backbone of consulting.',
      'Exit opportunities from consulting include PE, VC, corporate strategy, and startups.',
    ],
    data_science: [
      '90% of the world\'s data was created in just the last two years.',
      'The term "data scientist" was coined in 2008 by DJ Patil and Jeff Hammerbacher.',
      'Netflix saves $1 billion per year through its recommendation algorithm.',
      'Python overtook R as the most popular data science language in 2018.',
      'A data scientist spends about 80% of their time cleaning and preparing data.',
      'The global datasphere is expected to reach 175 zettabytes by 2025.',
      'Spotify\'s Discover Weekly playlist uses ML on 100 million+ users\' listening habits.',
      'The term "machine learning" was coined by Arthur Samuel at IBM in 1959.',
      'Data science job postings grew 650% between 2012 and 2022.',
      'Amazon\'s recommendation engine drives 35% of all purchases on the platform.',
      'The first neural network was created in 1943 by McCulloch and Pitts.',
      'Kaggle, the data science competition platform, has over 15 million registered users.',
      'A single self-driving car generates about 1 TB of data per day.',
      'The average data scientist salary in the US is $120,000-$160,000.',
      'ChatGPT reached 100 million users in just 2 months — the fastest growing app ever at the time.',
    ],
    medicine: [
      'The average medical school graduate has over $200,000 in student debt.',
      'It takes 11-16 years of training after high school to become a physician.',
      'The Hippocratic Oath dates back to the 5th century BCE.',
      'There are over 120 medical specialties and subspecialties to choose from.',
      'The MCAT is one of the longest standardized tests at 7.5 hours.',
      'Surgeons in the Middle Ages were also barbers — hence the red and white barber pole.',
      'The human body contains about 60,000 miles of blood vessels.',
      'Medical students learn approximately 13,000 new words in their first year — like learning a language.',
      'The stethoscope was invented in 1816 because a doctor felt awkward pressing his ear to a woman\'s chest.',
      'Dermatology is the most competitive residency — acceptance rates under 5%.',
      'Doctors in the US write about 4 billion prescriptions per year.',
      'The first successful human heart transplant was performed in 1967 by Dr. Christiaan Barnard.',
      'Gray\'s Anatomy (the textbook) has been in print since 1858 — over 165 years.',
      'Emergency medicine physicians see an average of 2.5 patients per hour.',
      'About 60% of physicians report experiencing burnout at some point in their career.',
    ],
    law: [
      'Abraham Lincoln was a self-taught lawyer who never went to law school.',
      'The LSAT has been a law school admission requirement since 1948.',
      'There are 1.3 million active lawyers in the United States.',
      'The Bar exam passage rate on the first attempt averages about 68%.',
      'The highest-paid law firm partners can earn over $10 million per year.',
      'The first female lawyer in the US was Arabella Mansfield, admitted to the Iowa Bar in 1869.',
      'Supreme Court justices serve for life — the longest tenure was 36 years.',
      'The Constitution has only been amended 27 times in over 230 years.',
      'Harvard Law School was founded in 1817 and is the oldest continuously operating law school in the US.',
      'BigLaw first-year associate salaries start at $225,000 at top firms.',
      'The average law school graduate takes the bar exam about 2-3 months after graduation.',
      'There are approximately 200 ABA-accredited law schools in the United States.',
      'Public interest lawyers earn about $50,000-$70,000 starting salary — less than half of BigLaw.',
      'The longest trial in US history lasted 3.5 years.',
      'About 40% of US presidents have been lawyers.',
    ],
    custom: [
      'Students who plan their career path early are 3x more likely to land target jobs.',
      'Networking accounts for up to 85% of jobs filled, according to LinkedIn.',
      'The average college student changes their major 3 times before graduating.',
      'Internship experience is the #1 factor employers consider for new graduates.',
      'Students with a clear career plan complete their degrees 1.5 years faster on average.',
      'The average American works 12 different jobs in their lifetime.',
      'Soft skills like communication and teamwork are rated more important than technical skills by 93% of employers.',
      'College graduates earn about $1.2 million more over their lifetime than those with just a high school diploma.',
      'The most regretted college majors are journalism, sociology, and liberal arts.',
      'Only about 27% of college graduates work in a field related to their major.',
      'The average recruiter spends just 7.4 seconds looking at a resume.',
      'LinkedIn profiles with a professional photo get 14x more views.',
      'Remote work opportunities have increased by 300% since 2020.',
      'The gig economy now represents 36% of the US workforce.',
      'People who set specific career goals are 10x more likely to achieve them.',
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
