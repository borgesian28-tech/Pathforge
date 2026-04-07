'use client';
import { useState } from 'react';

export default function HighSchoolDashboard({ roadmap, onReset }) {
  const [activeTab, setActiveTab] = useState('courses');
  const [activeYear, setActiveYear] = useState(0);
  const [expandedCollege, setExpandedCollege] = useState(null);

  const years = roadmap.years || [];
  const extracurriculars = roadmap.extracurriculars || [];
  const topColleges = roadmap.topColleges || [];
  const skills = roadmap.skills || [];
  const summerActivities = roadmap.summerActivities || [];
  const collegeAppTimeline = roadmap.collegeAppTimeline || [];
  const standardizedTests = roadmap.standardizedTests || {};

  const tabs = [
    { id: 'courses', label: 'Course Plan', icon: '📚' },
    { id: 'colleges', label: 'Top Colleges', icon: '🎓' },
    { id: 'activities', label: 'Activities', icon: '⚡' },
    { id: 'testing', label: 'Testing', icon: '📝' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#08080f' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', padding: '24px 20px 20px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <button onClick={onReset} style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>← New Roadmap</button>
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
      <div style={{ background: '#0a0a0f', borderBottom: '1px solid #1e1e32', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', overflowX: 'auto', padding: '0 20px' }}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }} style={{ background: 'none', border: 'none', color: isActive ? '#8b5cf6' : '#6a6a7a', padding: '14px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                <span style={{ marginRight: 6 }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px' }}>
        
        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div>
            {/* Year selector */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 8 }}>
              {years.map(function(y, i) {
                var isActive = activeYear === i;
                return (
                  <button key={i} onClick={function() { setActiveYear(i); }} style={{ background: isActive ? '#8b5cf6' : '#1a1a2e', border: '1px solid ' + (isActive ? '#8b5cf6' : '#2a2a3e'), color: isActive ? '#fff' : '#aaa', padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                    {y.year}
                  </button>
                );
              })}
            </div>

            {years[activeYear] && (
              <>
                <div style={{ background: 'linear-gradient(135deg, #8b5cf622, #111122)', border: '1px solid #2a2a3e', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                  <h3 style={{ color: '#8b5cf6', fontSize: 13, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 1 }}>Focus This Year</h3>
                  <p style={{ color: '#ccc', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{years[activeYear].focus}</p>
                </div>

                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Courses</h3>
                <div style={{ display: 'grid', gap: 12, marginBottom: 20 }}>
                  {years[activeYear].courses && years[activeYear].courses.map(function(course, i) {
                    var typeColors = { AP: '#ef4444', Honors: '#f59e0b', Standard: '#3b82f6' };
                    return (
                      <div key={i} style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{course.name}</div>
                          <span style={{ background: (typeColors[course.type] || '#888') + '22', color: typeColors[course.type] || '#888', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
                        </div>
                        <p style={{ color: '#8a8a9a', fontSize: 13, margin: 0, lineHeight: 1.5 }}>{course.why}</p>
                      </div>
                    );
                  })}
                </div>

                {years[activeYear].milestones && years[activeYear].milestones.length > 0 && (
                  <>
                    <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Key Milestones</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {years[activeYear].milestones.map(function(m, i) {
                        return (
                          <div key={i} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                            <span style={{ fontSize: 16 }}>✓</span>
                            <span style={{ color: '#ccc', fontSize: 13 }}>{m}</span>
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

        {/* Top Colleges Tab */}
        {activeTab === 'colleges' && (
          <div>
            <p style={{ color: '#aaa', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              These colleges are known for strong programs in {roadmap.careerField}. Research each school's specific requirements and culture.
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              {topColleges.map(function(college, i) {
                var isExpanded = expandedCollege === i;
                var selectivityColors = { 'Highly Selective': '#ef4444', 'Selective': '#f59e0b', 'Moderately Selective': '#10b981' };
                return (
                  <div key={i} onClick={function() { setExpandedCollege(isExpanded ? null : i); }} style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#fff', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{college.name}</div>
                        <span style={{ background: (selectivityColors[college.selectivity] || '#888') + '22', color: selectivityColors[college.selectivity] || '#888', padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{college.selectivity}</span>
                      </div>
                      <span style={{ color: '#6a6a7a', fontSize: 18, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                    {isExpanded && (
                      <p style={{ color: '#8a8a9a', fontSize: 13, marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e1e32', lineHeight: 1.5 }}>{college.strengths}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended Extracurriculars</h3>
            <p style={{ color: '#aaa', fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
              Choose 3-5 activities where you can demonstrate leadership and sustained commitment.
            </p>
            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              {extracurriculars.map(function(activity, i) {
                return (
                  <div key={i} style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{activity.activity}</div>
                      <span style={{ background: '#1a1a2e', color: '#aaa', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{activity.type}</span>
                    </div>
                    <p style={{ color: '#8a8a9a', fontSize: 13, margin: '0 0 8px', lineHeight: 1.5 }}>{activity.relevance}</p>
                    <div style={{ color: '#6a6a7a', fontSize: 12 }}>⏱️ {activity.commitment}</div>
                  </div>
                );
              })}
            </div>

            {summerActivities.length > 0 && (
              <>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Summer Planning</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {summerActivities.map(function(summer, i) {
                    return (
                      <div key={i} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: 10, padding: '14px 16px' }}>
                        <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{summer.year}</div>
                        <ul style={{ color: '#ccc', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                          {summer.activities.map(function(act, j) {
                            return <li key={j}>{act}</li>;
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Testing Tab */}
        {activeTab === 'testing' && (
          <div>
            {standardizedTests.sat && (
              <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>SAT</h3>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>WHEN TO TAKE</div>
                  <div style={{ color: '#ccc', fontSize: 14 }}>{standardizedTests.sat.when}</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>TARGET SCORE</div>
                  <div style={{ color: '#ccc', fontSize: 14 }}>{standardizedTests.sat.target}</div>
                </div>
                <div>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>PREPARATION</div>
                  <div style={{ color: '#8a8a9a', fontSize: 13, lineHeight: 1.6 }}>{standardizedTests.sat.prep}</div>
                </div>
              </div>
            )}

            {standardizedTests.act && (
              <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>ACT</h3>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>WHEN TO TAKE</div>
                  <div style={{ color: '#ccc', fontSize: 14 }}>{standardizedTests.act.when}</div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>TARGET SCORE</div>
                  <div style={{ color: '#ccc', fontSize: 14 }}>{standardizedTests.act.target}</div>
                </div>
                <div>
                  <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>PREPARATION</div>
                  <div style={{ color: '#8a8a9a', fontSize: 13, lineHeight: 1.6 }}>{standardizedTests.act.prep}</div>
                </div>
              </div>
            )}

            {standardizedTests.ap && standardizedTests.ap.length > 0 && (
              <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '18px 20px' }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Recommended AP Exams</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {standardizedTests.ap.map(function(exam, i) {
                    return (
                      <span key={i} style={{ background: '#1a1a2e', color: '#8b5cf6', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {exam}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>College Application Timeline</h3>
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, #8b5cf6, #6366f1, transparent)' }} />
              {collegeAppTimeline.map(function(item, i) {
                return (
                  <div key={i} style={{ position: 'relative', marginBottom: 20 }}>
                    <div style={{ position: 'absolute', left: -23, top: 14, width: 14, height: 14, borderRadius: '50%', background: '#8b5cf6', border: '2px solid #08080f' }} />
                    <div style={{ background: '#111122', border: '1px solid #1e1e32', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ color: '#8b5cf6', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{item.when}</div>
                      <ul style={{ color: '#ccc', fontSize: 13, margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
                        {item.tasks.map(function(task, j) {
                          return <li key={j}>{task}</li>;
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {skills.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Key Skills to Develop</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skills.map(function(skill, i) {
                    return (
                      <span key={i} style={{ background: '#8b5cf622', color: '#8b5cf6', padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
