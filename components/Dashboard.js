'use client';
import { useState, useEffect, useRef } from 'react';
import CourseCard from './CourseCard';
import BeyondClassroom from './BeyondClassroom';

export default function Dashboard({ profile, onReset }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [activeSemester, setActiveSemester] = useState(0);
  const [completedCourses, setCompletedCourses] = useState({});
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [showMajors, setShowMajors] = useState(false);
  const semRef = useRef(null);
  const { courseData, careerObj } = profile;
  const semesters = courseData.semesters || [];
  const clubs = courseData.clubs || [];
  const milestones = courseData.milestones || [];
  const skills = courseData.skills || [];
  const recommendedMajors = courseData.recommendedMajors || [];

  const semesterLabels = ['Fall - Freshman','Spring - Freshman','Fall - Sophomore','Spring - Sophomore','Fall - Junior','Spring - Junior','Fall - Senior','Spring - Senior'];

  const toggleCourse = function(si, ci) { var k = si + '-' + ci; setCompletedCourses(function(p) { var n = {}; for (var x in p) n[x] = p[x]; n[k] = !p[k]; return n; }); };
  const totalCourses = semesters.reduce(function(a, s) { return a + (s.courses ? s.courses.length : 0); }, 0);
  const completedCount = Object.values(completedCourses).filter(Boolean).length;
  const progress = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
  const totalCredits = semesters.reduce(function(a, s) { return a + (s.courses ? s.courses.reduce(function(b, c) { return b + (c.credits || 3); }, 0) : 0); }, 0);
  const completedCredits = semesters.reduce(function(a, s, si) { return a + (s.courses ? s.courses.reduce(function(b, c, ci) { return b + (completedCourses[si + '-' + ci] ? (c.credits || 3) : 0); }, 0) : 0); }, 0);

  useEffect(function() {
    if (semRef.current && semRef.current.children[activeSemester]) {
      var el = semRef.current.children[activeSemester];
      semRef.current.scrollTo({ left: el.offsetLeft - semRef.current.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [activeSemester]);

  var tabs = [
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'beyond', label: 'Beyond Class', icon: '⚡' },
    { id: 'timeline', label: 'Timeline', icon: '📍' },
    { id: 'clubs', label: 'Clubs', icon: '🏛️' },
    { id: 'overview', label: 'Overview', icon: '📊' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#08080f' }}>
      <div style={{ background: 'linear-gradient(135deg, ' + careerObj.color + 'cc, #08080f)', padding: '24px 20px 20px', borderBottom: '1px solid #1e1e32' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span style={{ fontSize: 22 }}>🎓</span><span style={{ color: careerObj.accent, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>PATHFORGE</span></div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 'clamp(20px, 4vw, 28px)', margin: '4px 0 2px' }}>{profile.name}'s Roadmap</h1>
              <p style={{ color: '#aaa', fontSize: 13, margin: 0 }}>{careerObj.icon} {profile.careerLabel} • {courseData.major || profile.major} @ {courseData.schoolFullName || profile.school}</p>
            </div>
            <button onClick={onReset} style={{ background: '#ffffff11', border: '1px solid #ffffff22', borderRadius: 8, color: '#888', fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>↻ New</button>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0A5C3622', border: '1px solid #0A5C3644', borderRadius: 20, padding: '4px 12px', marginTop: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
            <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>LIVE DATA</span>
            <span style={{ color: '#6a7a6a', fontSize: 11 }}>from {profile.school}</span>
          </div>
          {recommendedMajors.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={function() { setShowMajors(!showMajors); }} style={{ background: '#ffffff0a', border: '1px solid #ffffff15', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <span style={{ fontSize: 14 }}>🎓</span>
                <span style={{ color: '#aaa', fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>Recommended Majors at {profile.school}</span>
                <span style={{ color: '#6a6a7a', fontSize: 14, transform: showMajors ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {showMajors && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {recommendedMajors.map(function(m, i) {
                    var isCurrent = m === (courseData.major || profile.major);
                    return (
                      <span key={i} style={{ padding: '6px 14px', borderRadius: 20, background: isCurrent ? careerObj.accent : '#1a1a2e', color: isCurrent ? '#000' : '#aaa', fontSize: 12, fontWeight: 600, border: isCurrent ? 'none' : '1px solid #2a2a3e' }}>
                        {isCurrent ? '✓ ' : ''}{m}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          <div style={{ marginTop: 14, background: '#ffffff0a', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#aaa', fontSize: 12 }}>{completedCount}/{totalCourses} courses • {completedCredits}/{totalCredits} credits</span>
              <span style={{ color: careerObj.accent, fontSize: 13, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg, ' + careerObj.accent + ', ' + careerObj.color + ')', borderRadius: 3, transition: 'width 0.5s ease' }} /></div>
          </div>
        </div>
      </div>

      <div style={{ background: '#0c0c18', borderBottom: '1px solid #1a1a2e', position: 'sticky', top: 0, zIndex: 10 }}>
        <div className="hide-scrollbar" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', overflow: 'auto' }}>
          {tabs.map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                style={{ flex: '0 0 auto', padding: '12px 14px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid ' + (tab.id === 'beyond' ? '#ff6400' : careerObj.accent) : '2px solid transparent', color: activeTab === tab.id ? (tab.id === 'beyond' ? '#ff6400' : '#fff') : '#6a6a7a', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px 40px' }}>
        {activeTab === 'courses' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ position: 'relative', marginBottom: 4 }}>
              <button onClick={function() { if (semRef.current) semRef.current.scrollBy({ left: -150, behavior: 'smooth' }); }} style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: '1px solid #2a2a3e', background: '#0c0c18ee', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>‹</button>
              <div ref={semRef} className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 32px 12px', scrollBehavior: 'smooth' }}>
                {semesters.map(function(sem, i) {
                  var done = sem.courses && sem.courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
                  return (<button key={i} onClick={function() { setActiveSemester(i); }} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: activeSemester === i ? careerObj.accent : done ? '#1a3a24' : '#1a1a2e', color: activeSemester === i ? '#000' : done ? '#4ade80' : '#aaa', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{done ? '✓ ' : ''}{sem.name}</button>);
                })}
              </div>
              <button onClick={function() { if (semRef.current) semRef.current.scrollBy({ left: 150, behavior: 'smooth' }); }} style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: '1px solid #2a2a3e', background: '#0c0c18ee', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>›</button>
            </div>
            {semesters[activeSemester] && (<>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ color: '#fff', fontSize: 18, fontFamily: "'Playfair Display', serif", margin: '8px 0 4px' }}>{semesters[activeSemester].name}</h3>
                <p style={{ color: '#6a6a7a', fontSize: 13, margin: 0 }}>{semesters[activeSemester].courses ? semesters[activeSemester].courses.reduce(function(a, c) { return a + (c.credits || 3); }, 0) : 0} credits • {semesters[activeSemester].courses ? semesters[activeSemester].courses.filter(function(_, ci) { return completedCourses[activeSemester + '-' + ci]; }).length : 0}/{semesters[activeSemester].courses ? semesters[activeSemester].courses.length : 0} completed</p>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {semesters[activeSemester].courses && semesters[activeSemester].courses.map(function(c, ci) { return <CourseCard key={ci} course={c} semIdx={activeSemester} cIdx={ci} completed={!!completedCourses[activeSemester + '-' + ci]} onToggle={toggleCourse} accent={careerObj.accent} />; })}
              </div>
              {milestones[activeSemester] && (
                <div style={{ marginTop: 16, background: careerObj.accent + '15', border: '1px solid ' + careerObj.accent + '33', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <div><div style={{ color: careerObj.accent, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>MILESTONE</div><div style={{ color: '#fff', fontSize: 14 }}>{milestones[activeSemester].label}</div></div>
                </div>
              )}
            </>)}
          </div>
        )}

        {activeTab === 'beyond' && <BeyondClassroom data={courseData.beyondClassroom} accent={careerObj.accent} color={careerObj.color} />}

        {activeTab === 'timeline' && (
          <div style={{ marginTop: 24, position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, ' + careerObj.accent + ', ' + careerObj.color + ', transparent)' }} />
            {milestones.map(function(ms, i) {
              var done = semesters[i] && semesters[i].courses && semesters[i].courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
              return (
                <div key={i} onClick={function() { setExpandedMilestone(expandedMilestone === i ? null : i); }} style={{ position: 'relative', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', left: -23, top: 14, width: 14, height: 14, borderRadius: '50%', background: done ? '#4ade80' : i === 0 ? careerObj.accent : '#2a2a3e', border: '2px solid ' + (done ? '#166534' : '#08080f') }} />
                  <div style={{ background: expandedMilestone === i ? '#151528' : '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ color: '#6a6a7a', fontSize: 11, fontWeight: 600 }}>Semester {i + 1} • {semesterLabels[i] || semesters[i]?.name || ''}</span>
                        <div style={{ color: done ? '#4ade80' : '#fff', fontSize: 15, fontWeight: 600, marginTop: 2 }}>{done ? '✓ ' : ''}{ms.label}</div>
                      </div>
                      <span style={{ color: '#6a6a7a', fontSize: 18, transform: expandedMilestone === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                    {expandedMilestone === i && semesters[i] && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e1e32' }}>
                        {semesters[i].courses && semesters[i].courses.map(function(c, ci) {
                          return (
                            <div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}>
                              <span style={{ color: completedCourses[i + '-' + ci] ? '#4ade80' : '#ccc', fontSize: 13 }}>{completedCourses[i + '-' + ci] ? '✓ ' : ''}{c.code} — {c.title}</span>
                              <span style={{ color: '#6a6a7a', fontSize: 12 }}>{c.credits} cr</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'clubs' && (
          <div style={{ marginTop: 20, display: 'grid', gap: 12 }}>
            <p style={{ color: '#8a8a9a', fontSize: 14, margin: '0 0 8px' }}>Organizations at {profile.school} for your {profile.careerLabel} path.</p>
            {clubs.map(function(club, i) {
              var pc = { Essential: '#ef4444', Recommended: '#C9A84C', Helpful: '#3b82f6' };
              return (
                <div key={i} style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{club.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: '#1a1a2e', color: '#aaa', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{club.type}</span>
                    <span style={{ background: (pc[club.priority] || '#888') + '22', color: pc[club.priority] || '#888', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{club.priority}</span>
                  </div>
                  <p style={{ color: '#8a8a9a', fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{club.desc}</p>
                  {club.url && club.url.length > 0 && <a href={club.url} target="_blank" rel="noopener noreferrer" style={{ color: careerObj.accent, fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8 }}>Visit club page ↗</a>}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, ' + careerObj.color + '44, #111122)', border: '1px solid #1e1e32', borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>{careerObj.icon}</div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: '#fff', fontSize: 22, margin: '0 0 6px' }}>{profile.careerLabel}</h3>
              <p style={{ color: '#aaa', fontSize: 14, margin: 0 }}>{courseData.major} major at {courseData.schoolFullName || profile.school}</p>
              {courseData.departmentUrl && courseData.departmentUrl.length > 0 && <a href={courseData.departmentUrl} target="_blank" rel="noopener noreferrer" style={{ color: careerObj.accent, fontSize: 13, display: 'inline-block', marginTop: 8, fontWeight: 600 }}>View Department Page ↗</a>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[{ l: 'Major', v: courseData.major }, { l: 'School', v: profile.school }, { l: 'Credits', v: totalCredits }, { l: 'Semesters', v: semesters.length }].map(function(x, i) {
                return (
                  <div key={i} style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ color: '#6a6a7a', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{x.l}</div>
                    <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginTop: 4 }}>{x.v}</div>
                  </div>
                );
              })}
            </div>
            {skills.length > 0 && (
              <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 14, padding: '16px 18px' }}>
                <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Key Skills</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{skills.map(function(s, i) { return <span key={i} style={{ background: careerObj.accent + '22', color: careerObj.accent, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{s}</span>; })}</div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}'}</style>
    </div>
  );
}
