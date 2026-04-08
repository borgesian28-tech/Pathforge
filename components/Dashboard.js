'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CourseCard from './CourseCard';
import BeyondClassroom from './BeyondClassroom';
import AiAdvisor from './AiAdvisor';
import InterviewSimulator from './InterviewSimulator';
import { useAuth } from './AuthContext';

export default function Dashboard({ profile, onReset, savedProgress }) {
  const { user, login, logout, saveRoadmap, saveProgress } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [activeSemester, setActiveSemester] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(savedProgress || {});
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [showMajors, setShowMajors] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [switchingMajor, setSwitchingMajor] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [majors, setMajors] = useState([profile]);
  const [activeMajorIndex, setActiveMajorIndex] = useState(0);
  const [addingMajor, setAddingMajor] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [combinedView, setCombinedView] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState('');
  const [clubsUrl, setClubsUrl] = useState('');
  const [hoveredMajor, setHoveredMajor] = useState(-1);
  // Modal state
  const [modal, setModal] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const semRef = useRef(null);
  const saveTimer = useRef(null);

  // Helper: show modal, returns promise resolving to input value or null
  var showModal = function(title, placeholder, type) {
    return new Promise(function(resolve) {
      setModalInput('');
      setModal({ title: title, placeholder: placeholder, type: type || 'input', resolve: resolve });
    });
  };

  var closeModal = function(val) {
    if (modal && modal.resolve) modal.resolve(val);
    setModal(null);
    setModalInput('');
  };

  // Remove major
  var removeMajor = function(idx) {
    if (majors.length <= 1) return;
    var newMajors = majors.filter(function(_, i) { return i !== idx; });
    setMajors(newMajors);
    var newIdx = idx === 0 ? 0 : idx - 1;
    setActiveMajorIndex(newIdx);
    setCurrentProfile(newMajors[newIdx]);
    setCombinedView(false);
    setActiveTab('courses');
    setActiveSemester(0);
  };

  // Filter out XXX placeholder courses from any semester data
  var filterXxxCourses = function(semesters) {
    if (!semesters) return semesters;
    return semesters.map(function(sem) {
      if (!sem.courses) return sem;
      return { ...sem, courses: sem.courses.filter(function(c) {
        if (!c.code) return true;
        return !/[Xx]{2,}/.test(c.code);
      })};
    });
  };

  const displayProfile = (combinedView && majors.length === 2) ? (function() {
    // Real double-major logic:
    // - A typical semester has 4-5 courses (12-15 credits)
    // - Double major students take ~5 courses per semester
    // - Some courses from major 1, some from major 2, some shared
    // - Universities allow 2 courses to overlap (count for both)
    var sem1 = filterXxxCourses(majors[0].courseData.semesters);
    var sem2 = filterXxxCourses(majors[1].courseData.semesters);
    var maxPerSemester = 5;
    var combined = sem1.map(function(sem, i) {
      var courses1 = sem.courses || [];
      var courses2 = (sem2[i] && sem2[i].courses) || [];
      // Start with major 1's core/prerequisite courses (these are non-negotiable)
      var core1 = courses1.filter(function(c) { return c.type === 'Core' || c.type === 'Prerequisite'; });
      var elective1 = courses1.filter(function(c) { return c.type !== 'Core' && c.type !== 'Prerequisite'; });
      var core2 = courses2.filter(function(c) { return c.type === 'Core' || c.type === 'Prerequisite'; });
      var elective2 = courses2.filter(function(c) { return c.type !== 'Core' && c.type !== 'Prerequisite'; });
      // Build merged list: prioritize cores from both, then fill with electives
      var merged = [];
      var usedCodes = {};
      var addCourse = function(c) {
        if (!c.code) return;
        var key = c.code.toUpperCase();
        if (usedCodes[key]) return;
        if (merged.length >= maxPerSemester) return;
        usedCodes[key] = true;
        merged.push(c);
      };
      // Add core courses from both majors first (these are required)
      for (var a = 0; a < core1.length; a++) addCourse(core1[a]);
      for (var b = 0; b < core2.length; b++) addCourse(core2[b]);
      // Then alternate electives from each major to fill remaining slots
      var maxElectives = Math.max(elective1.length, elective2.length);
      for (var e = 0; e < maxElectives; e++) {
        if (e < elective1.length) addCourse(elective1[e]);
        if (e < elective2.length) addCourse(elective2[e]);
      }
      return { ...sem, courses: merged };
    });
    var uniqueClubs = [];
    var clubNames = {};
    var allClubs = [...(majors[0].courseData.clubs || []), ...(majors[1].courseData.clubs || [])];
    for (var ci = 0; ci < allClubs.length; ci++) {
      if (!clubNames[allClubs[ci].name]) { clubNames[allClubs[ci].name] = true; uniqueClubs.push(allClubs[ci]); }
    }
    return {
      ...currentProfile,
      courseData: { ...currentProfile.courseData, semesters: combined, clubs: uniqueClubs, outcomes: majors[0].courseData.outcomes }
    };
  })() : currentProfile;

  const { courseData, careerObj } = displayProfile;
  const semesters = filterXxxCourses(courseData.semesters || []);
  const clubs = courseData.clubs || [];
  const milestones = courseData.milestones || [];
  const skills = courseData.skills || [];
  const recommendedMajors = courseData.recommendedMajors || [];
  const outcomes = courseData.outcomes || null;
  const schoolBranding = courseData.schoolBranding || null;
  const accentColor = schoolBranding ? schoolBranding.secondaryColor : careerObj.accent;
  const primaryColor = schoolBranding ? schoolBranding.primaryColor : careerObj.color;
  const logoUrl = schoolBranding ? schoolBranding.logoUrl : '';

  // ===== THEME =====
  var bg = darkMode ? '#08080f' : '#ffffff';
  var bgCard = darkMode ? '#111122' : '#f7f7fa';
  var bgSec = darkMode ? '#1a1a2e' : '#ededf3';
  var bdr = darkMode ? '#1e1e32' : '#d5d5e0';
  var bdrL = darkMode ? '#2a2a3e' : '#c5c5d0';
  var tx = darkMode ? '#fff' : '#111111';
  var txSub = darkMode ? '#aaa' : '#333333';
  var txMut = darkMode ? '#6a6a7a' : '#666666';
  var txDim = darkMode ? '#8a8a9a' : '#555555';
  var headerBg = darkMode ? 'linear-gradient(135deg, ' + primaryColor + 'cc, #08080f)' : 'linear-gradient(135deg, ' + primaryColor + '30, #ffffff)';
  var tabBg = darkMode ? '#0c0c18' : '#ffffff';
  var overlayBg = darkMode ? '#08080fdd' : '#ffffffdd';
  var cardHov = darkMode ? '#151528' : '#f0f0f8';
  var progBg = darkMode ? '#1a1a2e' : '#d5d5e0';
  var glassBg = darkMode ? '#ffffff0a' : '#00000008';
  var btnBg = darkMode ? '#ffffff11' : '#00000010';
  var btnTx = darkMode ? accentColor : primaryColor;

  var dailyAction = null;
  if (outcomes && outcomes.dailyActions) {
    var semActions = outcomes.dailyActions.find(function(d) { return d.semester === activeSemester + 1; });
    if (semActions && semActions.actions && semActions.actions.length > 0) {
      var dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
      dailyAction = semActions.actions[dayOfYear % semActions.actions.length];
    }
  }

  const semesterLabels = ['Fall - Freshman','Spring - Freshman','Fall - Sophomore','Spring - Sophomore','Fall - Junior','Spring - Junior','Fall - Senior','Spring - Senior'];

  var debouncedSave = useCallback(function(courses) {
    if (!user) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(function() {
      saveProgress(courses);
      setSaveStatus('Saved');
      setTimeout(function() { setSaveStatus(''); }, 2000);
    }, 1000);
  }, [user, saveProgress]);

  const toggleCourse = function(si, ci) {
    var k = si + '-' + ci;
    setCompletedCourses(function(p) {
      var n = {}; for (var x in p) n[x] = p[x];
      n[k] = !p[k];
      debouncedSave(n);
      return n;
    });
  };

  const totalCourses = semesters.reduce(function(a, s) { return a + (s.courses ? s.courses.length : 0); }, 0);
  const completedCount = Object.values(completedCourses).filter(Boolean).length;
  const progress = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
  const totalCredits = semesters.reduce(function(a, s) { return a + (s.courses ? s.courses.reduce(function(b, c) { return b + (c.credits || 3); }, 0) : 0); }, 0);
  const completedCredits = semesters.reduce(function(a, s, si) { return a + (s.courses ? s.courses.reduce(function(b, c, ci) { return b + (completedCourses[si + '-' + ci] ? (c.credits || 3) : 0); }, 0) : 0); }, 0);

  const handleMajorSwitch = async function(newMajor) {
    if (newMajor === (courseData.major || currentProfile.major)) return;
    setSwitchingMajor(true);
    try {
      var res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: newMajor, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '', clubsUrl: clubsUrl || '' }),
      });
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      if (data.semesters) {
        var newProfile = { ...currentProfile, major: data.major || newMajor, courseData: data };
        setCurrentProfile(newProfile);
        setCompletedCourses({});
        setActiveSemester(0);
        setActiveTab('courses');
        if (user) saveRoadmap(newProfile, {});
      }
    } catch (err) { console.error('Major switch failed:', err); alert('Could not switch major. Please try again.'); }
    setSwitchingMajor(false);
  };

  const switchToMajor = function(index) {
    if (index >= 0 && index < majors.length) {
      setActiveMajorIndex(index);
      setCurrentProfile(majors[index]);
      setActiveTab('courses');
      setActiveSemester(0);
    }
  };

  const addNewMajor = async function(majorName) {
    if (!majorName.trim()) return;
    if (majors.length >= 2) { alert('Maximum of 2 majors allowed.'); return; }
    setAddingMajor(true);
    try {
      var res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: majorName, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '', clubsUrl: clubsUrl || '' }),
      });
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      if (data.semesters) {
        var newProfile = { ...currentProfile, major: data.major || majorName, courseData: data };
        setMajors(function(prev) { return [...prev, newProfile]; });
        setActiveMajorIndex(majors.length);
        setCurrentProfile(newProfile);
        setActiveTab('courses');
        setActiveSemester(0);
      }
    } catch (err) { console.error('Add major failed:', err); alert('Could not add major.'); }
    setAddingMajor(false);
  };

  const changeSchool = async function() {
    var newSchool = await showModal('Change School', 'Enter the name of the new school (e.g., Stanford, MIT)', 'input');
    if (!newSchool || !newSchool.trim()) return;
    setSwitchingMajor(true);
    try {
      var res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolName: newSchool, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '', clubsUrl: clubsUrl || '' }),
      });
      if (!res.ok) throw new Error('API error');
      var data = await res.json();
      if (data.semesters) {
        var newProfile = { ...currentProfile, school: newSchool, courseData: data };
        setCurrentProfile(newProfile);
        setMajors([newProfile]);
        setActiveMajorIndex(0);
        setCompletedCourses({});
        setActiveSemester(0);
        setActiveTab('courses');
        if (user) saveRoadmap(newProfile, {});
      }
    } catch (err) { console.error('Change school failed:', err); }
    setSwitchingMajor(false);
  };

  useEffect(function() {
    if (user && currentProfile && !savedProgress) saveRoadmap(currentProfile, completedCourses);
  }, [user]);

  useEffect(function() {
    if (semRef.current && semRef.current.children[activeSemester]) {
      var el = semRef.current.children[activeSemester];
      semRef.current.scrollTo({ left: el.offsetLeft - semRef.current.offsetWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
    }
  }, [activeSemester]);

  var tabs = [
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'beyond', label: 'Beyond Class', icon: '⚡' },
    { id: 'interview', label: 'Interview', icon: '🎯' },
    { id: 'outcomes', label: 'Outcomes', icon: '💰' },
    { id: 'timeline', label: 'Timeline', icon: '📍' },
    { id: 'clubs', label: 'Clubs', icon: '🏛️' },
    { id: 'overview', label: 'Overview', icon: '📊' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: bg, transition: 'background 0.3s' }}>
      {switchingMajor && (
        <div style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid transparent', borderTopColor: accentColor, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: tx, fontSize: 16, fontWeight: 600 }}>Switching major...</p>
          <p style={{ color: txMut, fontSize: 13, marginTop: 4 }}>Rebuilding your course roadmap</p>
        </div>
      )}

      {/* HEADER */}
      <div style={{ background: headerBg, padding: '24px 20px 20px', borderBottom: '1px solid ' + bdr, transition: 'all 0.3s' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {logoUrl ? <img src={logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 4, background: '#fff' }} onError={function(e) { e.target.style.display = 'none'; }} /> : <span style={{ fontSize: 22 }}>🎓</span>}
                <span style={{ color: accentColor, fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>PATHFORGE</span>
              </div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", color: tx, fontSize: 'clamp(20px, 4vw, 28px)', margin: '4px 0 2px' }}>{currentProfile.name}'s Roadmap</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <p style={{ color: txSub, fontSize: 13, margin: 0 }}>{careerObj.icon} {currentProfile.careerLabel} • {courseData.major || currentProfile.major} @ {courseData.schoolFullName || currentProfile.school}</p>
                <button onClick={changeSchool} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 6, color: btnTx, fontSize: 11, padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>Change School</button>
                <button onClick={async function() {
                  var url = await showModal('Link Course Catalog', 'Paste a link to your school\'s course catalog', 'input');
                  if (url && url.trim()) {
                    setCatalogUrl(url.trim());
                    // Auto-regenerate with the catalog URL
                    setSwitchingMajor(true);
                    fetch('/api/generate', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: url.trim(), clubsUrl: clubsUrl || '' }),
                    }).then(function(res) { return res.json(); }).then(function(data) {
                      if (data.semesters) {
                        var newProfile = { ...currentProfile, courseData: data };
                        setCurrentProfile(newProfile);
                        setMajors([newProfile]);
                        setActiveMajorIndex(0);
                        setCompletedCourses({});
                        setActiveSemester(0);
                        setActiveTab('courses');
                        if (user) saveRoadmap(newProfile, {});
                      }
                      setSwitchingMajor(false);
                    }).catch(function() { setSwitchingMajor(false); alert('Could not scan catalog. Please try again.'); });
                  }
                }} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 6, color: btnTx, fontSize: 11, padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>{catalogUrl ? '✓ Catalog Linked' : '🔗 Link Catalog'}</button>
                <button onClick={async function() {
                  var url = await showModal('Link Clubs Directory', 'Paste a link to your school\'s student clubs directory', 'input');
                  if (url && url.trim()) {
                    setClubsUrl(url.trim());
                    // Re-fetch clubs using the URL
                    setSwitchingMajor(true);
                    fetch('/api/generate', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '', clubsUrl: url.trim() }),
                    }).then(function(res) { return res.json(); }).then(function(data) {
                      if (data.semesters) {
                        var newProfile = { ...currentProfile, courseData: { ...currentProfile.courseData, clubs: data.clubs || currentProfile.courseData.clubs } };
                        setCurrentProfile(newProfile);
                        if (majors.length > 0) {
                          setMajors(function(prev) { var n = prev.slice(); n[activeMajorIndex] = newProfile; return n; });
                        }
                        if (user) saveRoadmap(newProfile, completedCourses);
                      }
                      setSwitchingMajor(false);
                    }).catch(function() { setSwitchingMajor(false); alert('Could not scan clubs directory. Please try again.'); });
                  }
                }} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 6, color: btnTx, fontSize: 11, padding: '4px 8px', cursor: 'pointer', fontWeight: 600 }}>{clubsUrl ? '✓ Clubs Linked' : '🏛️ Link Clubs'}</button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {saveStatus && <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600 }}>✓ {saveStatus}</span>}
              <button onClick={function() { setDarkMode(!darkMode); }} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 8, color: tx, fontSize: 18, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }} title={darkMode ? 'Light Mode' : 'Dark Mode'}>
                {darkMode ? '☀️' : '🌙'}
              </button>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} referrerPolicy="no-referrer" />}
                  <button onClick={function() { onReset(); }} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 8, color: txMut, fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>↻ New</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={login} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 8, color: darkMode ? '#C9A84C' : '#92700e', fontSize: 11, padding: '6px 10px', cursor: 'pointer', fontWeight: 600 }}>Sign in to save</button>
                  <button onClick={onReset} style={{ background: btnBg, border: '1px solid ' + bdr, borderRadius: 8, color: txMut, fontSize: 12, padding: '6px 12px', cursor: 'pointer' }}>↻ New</button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: darkMode ? '#0A5C3622' : '#0A5C3612', border: '1px solid ' + (darkMode ? '#0A5C3644' : '#0A5C3633'), borderRadius: 20, padding: '4px 12px', marginTop: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
            <span style={{ color: darkMode ? '#4ade80' : '#15803d', fontSize: 11, fontWeight: 600 }}>LIVE DATA</span>
            <span style={{ color: txMut, fontSize: 11 }}>from {currentProfile.school}</span>
          </div>

          {/* Major tabs */}
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ color: txMut, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Majors</div>
              {majors.length === 2 && (
                <button onClick={function() { setCombinedView(!combinedView); }} style={{ background: combinedView ? accentColor + '22' : 'transparent', border: '1px solid ' + accentColor + '44', borderRadius: 6, color: accentColor, fontSize: 11, fontWeight: 600, padding: '4px 10px', cursor: 'pointer' }}>
                  {combinedView ? '✓ Combined View' : 'Combine Majors'}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {majors.length > 1 && majors.map(function(maj, idx) {
                var isActive = idx === activeMajorIndex;
                return (
                  <div key={idx} style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={function() { setHoveredMajor(idx); }} onMouseLeave={function() { setHoveredMajor(-1); }}>
                    <button onClick={function() { switchToMajor(idx); }}
                      style={{ background: isActive ? accentColor : bgSec, border: '1px solid ' + (isActive ? accentColor : bdrL), color: isActive ? '#000' : txSub, padding: '8px 24px 8px 14px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 700 : 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
                      {maj.courseData.major || maj.major}
                    </button>
                    {hoveredMajor === idx && (
                      <button onClick={function(e) { e.stopPropagation(); removeMajor(idx); }}
                        style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', border: 'none', background: isActive ? '#00000044' : '#ff444488', color: isActive ? '#000' : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>×</button>
                    )}
                  </div>
                );
              })}
              {majors.length < 2 && (
                <button onClick={async function() { var n = await showModal('Add Major', 'e.g. Economics, Psychology, Biology...', 'input'); if (n) addNewMajor(n); }} disabled={addingMajor}
                  style={{ background: bgSec, border: '2px dashed ' + bdrL, color: darkMode ? accentColor : '#b91c1c', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: addingMajor ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', opacity: addingMajor ? 0.5 : 1 }}>
                  {addingMajor ? 'Adding...' : '+ Add Major'}
                </button>
              )}
            </div>
          </div>

          {recommendedMajors.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <button onClick={function() { setShowMajors(!showMajors); }} style={{ background: glassBg, border: '1px solid ' + bdr, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <span style={{ fontSize: 14 }}>🎓</span>
                <span style={{ color: txSub, fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>Recommended Majors at {currentProfile.school}</span>
                <span style={{ color: txMut, fontSize: 14, transform: showMajors ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
              </button>
              {showMajors && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {recommendedMajors.map(function(m, i) {
                    var isCurrent = m === (courseData.major || currentProfile.major);
                    return (
                      <button key={i} onClick={function() { if (!isCurrent && !switchingMajor) handleMajorSwitch(m); }} style={{ padding: '6px 14px', borderRadius: 20, background: isCurrent ? accentColor : bgSec, color: isCurrent ? '#000' : txSub, fontSize: 12, fontWeight: 600, border: isCurrent ? 'none' : '1px solid ' + bdrL, cursor: isCurrent ? 'default' : 'pointer', opacity: switchingMajor ? 0.5 : 1 }}>
                        {isCurrent ? '✓ ' : ''}{m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: 14, background: glassBg, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: txSub, fontSize: 12 }}>{completedCount}/{totalCourses} courses • {completedCredits}/{totalCredits} credits</span>
              <span style={{ color: btnTx, fontSize: 13, fontWeight: 700 }}>{progress}%</span>
            </div>
            <div style={{ height: 6, background: progBg, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: progress + '%', background: 'linear-gradient(90deg, ' + accentColor + ', ' + primaryColor + ')', borderRadius: 3, transition: 'width 0.5s ease' }} /></div>
          </div>

          {dailyAction && (
            <div style={{ marginTop: 12, background: 'linear-gradient(135deg, ' + accentColor + '18, ' + primaryColor + '18)', border: '1px solid ' + accentColor + '33', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>⚡</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: btnTx, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>TODAY'S ACTION</div>
                <div style={{ color: tx, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{dailyAction}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAB NAV */}
      <div style={{ background: tabBg, borderBottom: '1px solid ' + bdr, position: 'sticky', top: 0, zIndex: 10, transition: 'all 0.3s' }}>
        <div className="hide-scrollbar" style={{ maxWidth: 800, margin: '0 auto', display: 'flex', overflow: 'auto' }}>
          {tabs.map(function(tab) {
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); }}
                style={{ flex: '0 0 auto', padding: '12px 14px', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid ' + (tab.id === 'beyond' ? '#ff6400' : accentColor) : '2px solid transparent', color: activeTab === tab.id ? (tab.id === 'beyond' ? '#ff6400' : tx) : txMut, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {tab.icon} {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 16px 40px' }}>
        {activeTab === 'courses' && (
          <div style={{ marginTop: 20 }}>
            {!user && (
              <div style={{ background: 'linear-gradient(135deg, #C9A84C22, ' + bgCard + ')', border: '1px solid #C9A84C33', borderRadius: 10, padding: '10px 14px', marginBottom: 10, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ color: darkMode ? '#C9A84C' : '#92700e', fontSize: 12, margin: 0, fontWeight: 500 }}>⚠️ Sign in to save your progress — checkboxes will reset if you leave.</p>
                <button onClick={login} style={{ background: '#C9A84C', border: 'none', borderRadius: 6, color: '#000', fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign in</button>
              </div>
            )}
            <div style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
              <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Courses are sourced from web data and may not reflect the latest catalog. <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.school + ' course catalog')} target="_blank" rel="noopener noreferrer" style={{ color: btnTx, textDecoration: 'none', fontWeight: 600 }}>Verify on your school's registrar ↗</a> or use the <strong style={{ color: btnTx }}>🔗 Link Catalog</strong> button above to scan your school's catalog directly.</p>
            </div>
            <div style={{ position: 'relative', marginBottom: 4 }}>
              <button onClick={function() { if (semRef.current) semRef.current.scrollBy({ left: -150, behavior: 'smooth' }); }} style={{ position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: '1px solid ' + bdrL, background: tabBg + 'ee', color: txSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>‹</button>
              <div ref={semRef} className="hide-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 32px 12px', scrollBehavior: 'smooth' }}>
                {semesters.map(function(sem, i) {
                  var done = sem.courses && sem.courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
                  return (<button key={i} onClick={function() { setActiveSemester(i); }} style={{ padding: '8px 14px', borderRadius: 20, border: 'none', background: activeSemester === i ? accentColor : done ? '#1a3a24' : bgSec, color: activeSemester === i ? '#000' : done ? '#4ade80' : txSub, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>{done ? '✓ ' : ''}{sem.name}</button>);
                })}
              </div>
              <button onClick={function() { if (semRef.current) semRef.current.scrollBy({ left: 150, behavior: 'smooth' }); }} style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: '1px solid ' + bdrL, background: tabBg + 'ee', color: txSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>›</button>
            </div>
            {semesters[activeSemester] && (<>
              <div style={{ marginBottom: 14 }}>
                <h3 style={{ color: tx, fontSize: 18, fontFamily: "'Playfair Display', serif", margin: '8px 0 4px' }}>{semesters[activeSemester].name}</h3>
                <p style={{ color: txMut, fontSize: 13, margin: 0 }}>{semesters[activeSemester].courses ? semesters[activeSemester].courses.reduce(function(a, c) { return a + (c.credits || 3); }, 0) : 0} credits • {semesters[activeSemester].courses ? semesters[activeSemester].courses.filter(function(_, ci) { return completedCourses[activeSemester + '-' + ci]; }).length : 0}/{semesters[activeSemester].courses ? semesters[activeSemester].courses.length : 0} completed</p>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                {semesters[activeSemester].courses && semesters[activeSemester].courses.map(function(c, ci) { return <CourseCard key={ci} course={c} semIdx={activeSemester} cIdx={ci} completed={!!completedCourses[activeSemester + '-' + ci]} onToggle={toggleCourse} accent={accentColor} darkMode={darkMode} />; })}
              </div>
              {milestones[activeSemester] && (
                <div style={{ marginTop: 16, background: accentColor + '15', border: '1px solid ' + accentColor + '33', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🎯</span>
                  <div><div style={{ color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>MILESTONE</div><div style={{ color: tx, fontSize: 14 }}>{milestones[activeSemester].label}</div></div>
                </div>
              )}
            </>)}
          </div>
        )}

        {activeTab === 'beyond' && <BeyondClassroom data={courseData.beyondClassroom} accent={accentColor} color={primaryColor} darkMode={darkMode} />}
        {activeTab === 'interview' && <InterviewSimulator profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} />}

        {activeTab === 'outcomes' && (
          <div style={{ marginTop: 20 }}>
            {outcomes ? (<>
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: tx, fontSize: 20, margin: '0 0 12px' }}>💰 Salary Outlook</h3>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[{ label: 'Entry Level', data: outcomes.entrySalary, icon: '🌱' }, { label: 'Mid Career (5-10 yrs)', data: outcomes.midSalary, icon: '📈' }, { label: 'Senior Level (10+ yrs)', data: outcomes.seniorSalary, icon: '🏆' }].map(function(tier, i) {
                    if (!tier.data) return null;
                    var low = tier.data.low || 0, high = tier.data.high || 0;
                    var median = tier.data.median || Math.round((low + high) / 2);
                    var maxSalary = outcomes.seniorSalary ? outcomes.seniorSalary.high || 200000 : 200000;
                    var barWidth = Math.min(100, Math.round((median / maxSalary) * 100));
                    return (
                      <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 18 }}>{tier.icon}</span><span style={{ color: txSub, fontSize: 13, fontWeight: 600 }}>{tier.label}</span></div>
                          <span style={{ color: accentColor, fontSize: 18, fontWeight: 700 }}>{'$' + median.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 8, background: progBg, borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}><div style={{ height: '100%', width: barWidth + '%', background: 'linear-gradient(90deg, ' + primaryColor + ', ' + accentColor + ')', borderRadius: 4 }} /></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: txMut, fontSize: 11 }}>{'$' + low.toLocaleString()}</span><span style={{ color: txMut, fontSize: 11 }}>{'$' + high.toLocaleString()}</span></div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                {outcomes.placementRate && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}><div style={{ color: '#4ade80', fontSize: 24, fontWeight: 700 }}>{outcomes.placementRate}</div><div style={{ color: txMut, fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Placement Rate</div></div>)}
                {outcomes.medianTimeToOffer && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}><div style={{ color: accentColor, fontSize: 16, fontWeight: 700 }}>{outcomes.medianTimeToOffer}</div><div style={{ color: txMut, fontSize: 11, fontWeight: 600, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Time to Offer</div></div>)}
              </div>
              {outcomes.topCities && outcomes.topCities.length > 0 && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}><h4 style={{ color: tx, fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>📍 Top Cities</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{outcomes.topCities.map(function(city, i) { return <span key={i} style={{ background: primaryColor + '33', color: accentColor, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{city}</span>; })}</div></div>)}
              {outcomes.topEmployers && outcomes.topEmployers.length > 0 && (<div style={{ marginBottom: 16 }}><h3 style={{ fontFamily: "'Playfair Display', serif", color: tx, fontSize: 20, margin: '0 0 12px' }}>🏢 Top Employers from {currentProfile.school}</h3><div style={{ display: 'grid', gap: 8 }}>{outcomes.topEmployers.map(function(emp, i) { return (<div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 36, height: 36, borderRadius: 8, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: accentColor, fontWeight: 700 }}>{(i + 1)}</div><div style={{ flex: 1 }}><div style={{ color: tx, fontWeight: 700, fontSize: 14 }}>{emp.name}</div><div style={{ color: txMut, fontSize: 12, marginTop: 2 }}>{emp.type}{emp.roles && emp.roles.length > 0 ? ' • ' + emp.roles.join(', ') : ''}</div></div></div>); })}</div></div>)}
              {outcomes.growthOutlook && (<div style={{ background: 'linear-gradient(135deg, ' + primaryColor + '33, ' + bgCard + ')', border: '1px solid ' + accentColor + '33', borderRadius: 14, padding: '16px 18px', marginBottom: 16 }}><h4 style={{ color: accentColor, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 8px', textTransform: 'uppercase' }}>Industry Outlook</h4><p style={{ color: txSub, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{outcomes.growthOutlook}</p></div>)}
              <div style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}><span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span><p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Salary data is AI-estimated. Verify with <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.careerLabel + ' salary')} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Glassdoor or Payscale ↗</a></p></div>
            </>) : (<div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💰</div><h3 style={{ color: tx, fontSize: 18, margin: '0 0 8px' }}>Outcome data unavailable</h3><p style={{ color: txMut, fontSize: 14 }}>Try regenerating your roadmap.</p></div>)}
          </div>
        )}

        {activeTab === 'timeline' && (
          <div style={{ marginTop: 24, position: 'relative', paddingLeft: 28 }}>
            <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, ' + accentColor + ', ' + primaryColor + ', transparent)' }} />
            {milestones.map(function(ms, i) {
              var done = semesters[i] && semesters[i].courses && semesters[i].courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
              return (
                <div key={i} onClick={function() { setExpandedMilestone(expandedMilestone === i ? null : i); }} style={{ position: 'relative', marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ position: 'absolute', left: -23, top: 14, width: 14, height: 14, borderRadius: '50%', background: done ? '#4ade80' : i === 0 ? accentColor : bdrL, border: '2px solid ' + bg }} />
                  <div style={{ background: expandedMilestone === i ? cardHov : bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div><span style={{ color: txMut, fontSize: 11, fontWeight: 600 }}>Semester {i + 1} • {semesterLabels[i] || semesters[i]?.name || ''}</span><div style={{ color: done ? '#4ade80' : tx, fontSize: 15, fontWeight: 600, marginTop: 2 }}>{done ? '✓ ' : ''}{ms.label}</div></div>
                      <span style={{ color: txMut, fontSize: 18, transform: expandedMilestone === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                    </div>
                    {expandedMilestone === i && semesters[i] && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid ' + bdr }}>
                        {semesters[i].courses && semesters[i].courses.map(function(c, ci) {
                          return (<div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0' }}><span style={{ color: completedCourses[i + '-' + ci] ? '#4ade80' : txSub, fontSize: 13 }}>{completedCourses[i + '-' + ci] ? '✓ ' : ''}{c.code} — {c.title}</span><span style={{ color: txMut, fontSize: 12 }}>{c.credits} cr</span></div>);
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
            <div style={{ background: bgSec, border: '1px solid ' + bdrL, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}><span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span><p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Club suggestions are AI-generated. <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.school + ' student clubs organizations directory')} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Find clubs at {currentProfile.school} ↗</a></p></div>
            {clubs.map(function(club, i) {
              var pc = { Essential: '#ef4444', Recommended: '#C9A84C', Helpful: '#3b82f6' };
              return (
                <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ color: tx, fontWeight: 700, fontSize: 15 }}>{club.name}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ background: bgSec, color: txSub, padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{club.type}</span>
                    <span style={{ background: (pc[club.priority] || '#888') + '22', color: pc[club.priority] || '#888', padding: '2px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{club.priority}</span>
                  </div>
                  <p style={{ color: txDim, fontSize: 13, marginTop: 10, lineHeight: 1.5 }}>{club.desc}</p>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'overview' && (
          <div style={{ marginTop: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, ' + primaryColor + '44, ' + bgCard + ')', border: '1px solid ' + bdr, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                {logoUrl && <img src={logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 8, background: '#fff', padding: 2 }} onError={function(e) { e.target.style.display = 'none'; }} />}
                <div style={{ fontSize: 36 }}>{careerObj.icon}</div>
              </div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: tx, fontSize: 22, margin: '0 0 6px' }}>{currentProfile.careerLabel}</h3>
              <p style={{ color: txSub, fontSize: 14, margin: 0 }}>{courseData.major} major at {courseData.schoolFullName || currentProfile.school}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[{ l: 'Major', v: courseData.major }, { l: 'School', v: currentProfile.school }, { l: 'Credits', v: totalCredits }, { l: 'Semesters', v: semesters.length }].map(function(x, i) {
                return (<div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}><div style={{ color: txMut, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{x.l}</div><div style={{ color: tx, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{x.v}</div></div>);
              })}
            </div>
            {skills.length > 0 && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '16px 18px' }}><h4 style={{ color: tx, fontSize: 14, fontWeight: 700, margin: '0 0 12px' }}>Key Skills</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{skills.map(function(s, i) { return <span key={i} style={{ background: accentColor + '22', color: accentColor, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>{s}</span>; })}</div></div>)}
          </div>
        )}
      </div>
      <AiAdvisor profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} />

      {/* INLINE MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={function() { closeModal(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: darkMode ? '#111122' : '#ffffff', border: '1px solid ' + bdr, borderRadius: 16, padding: '24px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: tx, fontSize: 18, fontWeight: 700, margin: '0 0 16px', fontFamily: "'Playfair Display', serif" }}>{modal.title}</h3>
            <input
              type="text"
              placeholder={modal.placeholder}
              value={modalInput}
              onChange={function(e) { setModalInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && modalInput.trim()) closeModal(modalInput.trim()); }}
              autoFocus
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdrL, background: darkMode ? '#0a0a18' : '#f5f5f8', color: tx, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={function() { closeModal(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid ' + bdrL, background: 'transparent', color: txSub, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={function() { if (modalInput.trim()) closeModal(modalInput.trim()); }} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, ' + accentColor + ', ' + primaryColor + ')', color: '#000', fontSize: 14, fontWeight: 700, cursor: modalInput.trim() ? 'pointer' : 'default', opacity: modalInput.trim() ? 1 : 0.5 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
