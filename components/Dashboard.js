'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import CourseCard from './CourseCard';
import BeyondClassroom from './BeyondClassroom';
import AiAdvisor from './AiAdvisor';
import InterviewSimulator from './InterviewSimulator';
import CareerComparison from './CareerComparison';
import { useAuth } from './AuthContext';

export default function Dashboard({ profile, onReset, savedProgress, isDemo, onUnlock, subscription }) {
  const { user, login, logout, saveRoadmap, saveProgress } = useAuth();
  const [activeTab, setActiveTab] = useState('courses');
  const [activeSemester, setActiveSemester] = useState(0);
  const [completedCourses, setCompletedCourses] = useState(savedProgress || {});
  const [expandedMilestone, setExpandedMilestone] = useState(null);
  const [showMajors, setShowMajors] = useState(false);
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [switchingMajor, setSwitchingMajor] = useState('');
  // setSwitchingMajor('') = not loading, setSwitchingMajor('some text') = loading with message
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
  const [showWelcome, setShowWelcome] = useState(!!savedProgress && Object.keys(savedProgress).length > 0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentSemesterIdx, setCurrentSemesterIdx] = useState(-1);
  const [courseGrades, setCourseGrades] = useState({});
  const semRef = useRef(null);
  const saveTimer = useRef(null);
  const settingsRef = useRef(null);

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
  // Ensure colors are always readable against dark/light backgrounds
  var ensureReadable = function(hex, isDark) {
    if (!hex || hex.length < 4) return isDark ? '#C9A84C' : '#0A5C36';
    // Parse hex
    var r, g, b;
    var h = hex.replace('#', '');
    if (h.length === 3) { r = parseInt(h[0]+h[0],16); g = parseInt(h[1]+h[1],16); b = parseInt(h[2]+h[2],16); }
    else { r = parseInt(h.substring(0,2),16); g = parseInt(h.substring(2,4),16); b = parseInt(h.substring(4,6),16); }
    if (isNaN(r)) return isDark ? '#C9A84C' : '#0A5C36';
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (isDark && luminance < 0.35) {
      // Too dark for dark mode — lighten it
      var factor = 1.8;
      r = Math.min(255, Math.round(r * factor + 60));
      g = Math.min(255, Math.round(g * factor + 60));
      b = Math.min(255, Math.round(b * factor + 60));
      return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
    }
    if (!isDark && luminance > 0.7) {
      // Too light for light mode — darken it
      r = Math.round(r * 0.5); g = Math.round(g * 0.5); b = Math.round(b * 0.5);
      return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
    }
    return hex;
  };
  const rawAccent = schoolBranding ? schoolBranding.secondaryColor : careerObj.accent;
  const rawPrimary = schoolBranding ? schoolBranding.primaryColor : careerObj.color;
  const accentColor = ensureReadable(rawAccent, darkMode);
  const primaryColor = ensureReadable(rawPrimary, darkMode);
  const logoUrl = schoolBranding ? schoolBranding.logoUrl : '';

  // ===== THEME =====
  var bg = darkMode ? '#0a0a0a' : '#ffffff';
  var bgCard = darkMode ? '#141414' : '#f7f7fa';
  var bgSec = darkMode ? '#1e1e1e' : '#ededf3';
  var bdr = darkMode ? '#2a2a2a' : '#d5d5e0';
  var bdrL = darkMode ? '#333333' : '#c5c5d0';
  var tx = darkMode ? '#fff' : '#111111';
  var txSub = darkMode ? '#aaa' : '#333333';
  var txMut = darkMode ? '#6a6a7a' : '#666666';
  var txDim = darkMode ? '#8a8a9a' : '#555555';
  var headerBg = darkMode ? 'linear-gradient(135deg, ' + primaryColor + '44, #08080f)' : 'linear-gradient(135deg, ' + primaryColor + '20, #f8f8fa)';
  var tabBg = darkMode ? '#0d0d0d' : '#ffffff';
  var overlayBg = darkMode ? '#0a0a0add' : '#ffffffdd';
  var cardHov = darkMode ? '#151528' : '#f0f0f8';
  var progBg = darkMode ? '#222222' : '#d5d5e0';
  var glassBg = darkMode ? '#ffffff08' : '#00000008';
  // High-contrast button styles — always readable
  var btnBg = darkMode ? '#1e1e1e' : '#ffffff';
  var btnTx = darkMode ? '#ffffff' : '#111111';
  var btnBdr = darkMode ? '#333333' : '#c5c5d0';

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
    setSwitchingMajor("Switching major...");
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
    setSwitchingMajor("");
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
    setSwitchingMajor("Changing school...");
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
    setSwitchingMajor("");
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

  var [isMobileState, setIsMobileState] = useState(false);
  useEffect(function() {
    function checkMobile() { setIsMobileState(window.innerWidth < 768); if (window.innerWidth < 768) setSidebarOpen(false); }
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return function() { window.removeEventListener('resize', checkMobile); };
  }, []);
  useEffect(function() {
    function handleClick(e) { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);
  useEffect(function() { setMobileMenuOpen(false); }, [activeTab]);

  var isMobile = isMobileState;
  var sidebarW = sidebarOpen ? 240 : 64;

  var tabs = [
    { id: 'courses', label: 'Courses', icon: '📚' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'beyond', label: 'Beyond Class', icon: '⚡' },
    { id: 'interview', label: 'Interview', icon: '🎯' },
    { id: 'outcomes', label: 'Outcomes', icon: '💰' },
    { id: 'career-compare', label: 'Compare Careers', icon: '⚖️' },
    { id: 'timeline', label: 'Timeline', icon: '📍' },
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'advisor', label: 'AI Advisor', icon: '💬' },
  ];
  var sidebarBg = darkMode ? '#0d0d0d' : '#ffffff';
  var sidebarBdr = darkMode ? '#222222' : '#e8e8ee';

  var handleExport = function() {
    var html = '<html><head><title>' + currentProfile.name + ' Roadmap</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:22px;margin-bottom:4px}h2{font-size:13px;color:#666;margin-bottom:20px}h3{font-size:15px;margin:18px 0 6px;padding-top:10px;border-top:1px solid #ddd}.c{display:flex;justify-content:space-between;padding:3px 0;font-size:12px}.b{font-weight:600}.cr{color:#888}.f{margin-top:24px;padding-top:12px;border-top:1px solid #ddd;color:#888;font-size:10px}</style></head><body>';
    html += '<h1>' + currentProfile.name + "'s " + currentProfile.careerLabel + ' Roadmap</h1><h2>' + (courseData.major || '') + ' @ ' + (courseData.schoolFullName || currentProfile.school) + '</h2>';
    semesters.forEach(function(sem) { html += '<h3>' + sem.name + '</h3>'; if (sem.courses) sem.courses.forEach(function(c) { html += '<div class="c"><span><span class="b">' + c.code + '</span> — ' + c.title + '</span><span class="cr">' + (c.credits||3) + ' cr</span></div>'; }); });
    html += '<div class="f">Generated by PathForge</div></body></html>';
    var w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(function(){ w.print(); }, 500);
  };

  var handleShare = function() {
    var t = currentProfile.name + "'s " + currentProfile.careerLabel + ' Roadmap\n' + (courseData.major||'') + ' @ ' + (courseData.schoolFullName||currentProfile.school) + '\n\n';
    semesters.forEach(function(s){ t += '--- '+s.name+' ---\n'; if(s.courses) s.courses.forEach(function(c){ t += c.code+' - '+c.title+' ('+(c.credits||3)+' cr)\n'; }); t+='\n'; });
    navigator.clipboard.writeText(t).then(function(){ setSaveStatus('Copied!'); setTimeout(function(){ setSaveStatus(''); },2000); });
  };

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', transition: 'background 0.3s', overflow: 'hidden', height: '100dvh', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {switchingMajor && (
        <div style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accentColor, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: tx, fontSize: 15, fontWeight: 600 }}>{switchingMajor}</p>
        </div>
      )}

      {mobileMenuOpen && <div onClick={function() { setMobileMenuOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 89, backdropFilter: 'blur(4px)' }} />}
      <aside style={{ position: isMobile ? 'fixed' : 'sticky', top: 0, left: isMobile ? (mobileMenuOpen ? 0 : -260) : 0, width: isMobile ? 240 : sidebarW, height: '100dvh', background: sidebarBg, borderRight: '1px solid ' + sidebarBdr, display: 'flex', flexDirection: 'column', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 90, flexShrink: 0, overflow: 'hidden' }}>
        <div onClick={onReset} style={{ padding: sidebarOpen || isMobile ? '16px 16px 12px' : '16px 12px 12px', borderBottom: '1px solid ' + sidebarBdr, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, cursor: 'pointer' }}>
          {(sidebarOpen || isMobile) ? (<>{logoUrl ? <img src={logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 8, background: '#fff' }} onError={function(e){e.target.style.display='none';}} /> : <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, ' + accentColor + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎓</div>}<span style={{ color: tx, fontWeight: 700, fontSize: 15 }}>PathForge</span></>) : (<div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, ' + accentColor + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>🎓</div>)}
        </div>
        {(sidebarOpen || isMobile) && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke={darkMode ? '#1e1e28' : '#e2e2e8'} strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={2 * Math.PI * 20} strokeDashoffset={2 * Math.PI * 20 * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: tx }}>{progress}%</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: txSub, fontSize: 12, fontWeight: 600 }}>{currentProfile.name}'s Roadmap</div>
                <div style={{ color: txMut, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseData.major || currentProfile.major}</div>
                <div style={{ color: txMut, fontSize: 10, marginTop: 2 }}>{completedCount}/{totalCourses} courses • {completedCredits}/{totalCredits} cr</div>
              </div>
            </div>
          </div>
        )}
        <nav className="hide-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab.id;
            var premiumTabs = ['interview', 'outcomes', 'career-compare', 'progress'];
            var isPremiumTab = premiumTabs.indexOf(tab.id) !== -1;
            var userTier = subscription && subscription.tier || 'free';
            var isLocked = false;
            var lockLabel = '';
            if (isDemo && tab.id !== 'courses') {
              isLocked = true;
              lockLabel = 'Sign up to unlock';
            } else if (!isDemo && isPremiumTab && userTier === 'student') {
              isLocked = true;
              lockLabel = 'Premium feature';
            }
            return (<button key={tab.id} onClick={function() { if (isLocked) return; setActiveTab(tab.id); if (isMobile) setMobileMenuOpen(false); }} title={isLocked ? lockLabel : !sidebarOpen && !isMobile ? tab.label : undefined} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen || isMobile ? '9px 12px' : '10px 0', justifyContent: sidebarOpen || isMobile ? 'flex-start' : 'center', borderRadius: 8, border: 'none', background: isActive && !isLocked ? accentColor + '15' : 'transparent', color: isLocked ? (darkMode ? '#3a3a4e' : '#c0c0c8') : isActive ? accentColor : txMut, fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: isLocked ? 'default' : 'pointer', transition: 'all 0.15s', marginBottom: 2, position: 'relative', opacity: isLocked ? 0.5 : 1 }}><span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{isLocked ? '🔒' : tab.icon}</span>{(sidebarOpen || isMobile) && <span>{tab.label}{isLocked && lockLabel === 'Premium feature' ? ' ✦' : ''}</span>}{isActive && !isLocked && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 2, background: accentColor }} />}</button>);
          })}
        </nav>
        <div style={{ padding: '8px', borderTop: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
          {!isMobile && (<button onClick={function() { setSidebarOpen(!sidebarOpen); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, border: 'none', background: 'transparent', color: txMut, fontSize: 13, cursor: 'pointer' }}><span style={{ fontSize: 14 }}>{sidebarOpen ? '◀' : '▶'}</span>{sidebarOpen && <span>Collapse</span>}</button>)}
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 56, background: sidebarBg, borderBottom: '1px solid ' + bdr, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12, backdropFilter: 'blur(12px)' }}>
          {isMobile && (<button onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }} style={{ background: 'none', border: 'none', color: tx, fontSize: 20, cursor: 'pointer', padding: '4px', marginRight: 4 }}>☰</button>)}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: tx, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentProfile.name}'s Roadmap</h1>
            <span style={{ color: accentColor, fontSize: 12, fontWeight: 500, flexShrink: 0 }}>• {currentProfile.careerLabel}</span>
            {saveStatus && <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>✓ {saveStatus}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button onClick={function() { setSettingsOpen(!settingsOpen); }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋮</button>
              {settingsOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 220, background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 100 }}>
                  {[
                    { label: '📄 Export as PDF', action: function() { setSettingsOpen(false); handleExport(); } },
                    { label: '📋 Copy to Clipboard', action: function() { setSettingsOpen(false); handleShare(); } },
                    { label: '🏫 Change School', action: function() { setSettingsOpen(false); changeSchool(); } },
                    { label: '🔗 Link Catalog', action: async function() { setSettingsOpen(false); var url = await showModal('Link Course Catalog', "Paste your school's course catalog URL", 'input'); if (url && url.trim()) { setCatalogUrl(url.trim()); setSwitchingMajor("Scanning course catalog..."); fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: url.trim(), clubsUrl: clubsUrl || '' }) }).then(function(r){return r.json();}).then(function(d){ if(d.semesters){var np={...currentProfile,courseData:d};setCurrentProfile(np);setMajors([np]);setActiveMajorIndex(0);setCompletedCourses({});setActiveSemester(0);setActiveTab('courses');if(user)saveRoadmap(np,{});}setSwitchingMajor("");}).catch(function(){setSwitchingMajor('');}); } } },
                    { label: '↻ New Roadmap', action: function() { setSettingsOpen(false); onReset(); } },
                  ].map(function(item, i) {
                    return (<button key={i} onClick={item.action} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < 4 ? '1px solid ' + bdr : 'none', color: txSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>{item.label}</button>);
                  })}
                </div>
              )}
            </div>
            {user && user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} referrerPolicy="no-referrer" />}
            <button onClick={function() { setDarkMode(!darkMode); }} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{darkMode ? '☀️' : '🌙'}</button>
          </div>
        </header>

        <main className="hide-scrollbar" style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '20px 16px 40px' : '24px 32px 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

        {isDemo && (
          <div style={{ marginBottom: 16, background: 'linear-gradient(135deg, #6c5ce722, ' + bgCard + ')', border: '1px solid #6c5ce744', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 200 }}>
              <span style={{ fontSize: 24 }}>🔓</span>
              <div>
                <div style={{ color: tx, fontSize: 15, fontWeight: 700 }}>You're viewing a demo</div>
                <div style={{ color: txDim, fontSize: 13, marginTop: 2 }}>Freshman & sophomore courses are unlocked. Sign up free to access your full roadmap, AI advisor, interviews, and more.</div>
              </div>
            </div>
            <button onClick={onUnlock} style={{ padding: '10px 24px', borderRadius: 100, border: 'none', background: '#6c5ce7', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>Unlock Full Access →</button>
          </div>
        )}

        {showWelcome && (
          <div className="welcome-banner" style={{ marginBottom: 16 }}>
            <div style={{ background: accentColor + '12', border: '1px solid ' + accentColor + '33', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span style={{ fontSize: 24 }}>👋</span><div><div style={{ color: tx, fontSize: 15, fontWeight: 700 }}>Welcome back, {currentProfile.name}!</div><div style={{ color: txSub, fontSize: 13, marginTop: 2 }}>You're {progress}% through — {completedCount}/{totalCourses} courses done.</div></div></div>
              <button onClick={function() { setShowWelcome(false); }} style={{ background: 'none', border: 'none', color: txMut, fontSize: 16, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 }}>✕</button>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ color: txMut, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Majors</div>
            {majors.length === 2 && (<button onClick={function() { setCombinedView(!combinedView); }} style={{ background: combinedView ? accentColor + '22' : 'transparent', border: '1px solid ' + accentColor + '44', borderRadius: 6, color: accentColor, fontSize: 11, fontWeight: 600, padding: '4px 10px', cursor: 'pointer' }}>{combinedView ? '✓ Combined' : 'Combine'}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {majors.length > 1 && majors.map(function(maj, idx) { var isActive = idx === activeMajorIndex; return (<div key={idx} style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={function() { setHoveredMajor(idx); }} onMouseLeave={function() { setHoveredMajor(-1); }}><button onClick={function() { switchToMajor(idx); }} style={{ background: isActive ? accentColor : bgSec, border: '1px solid ' + (isActive ? accentColor : bdrL), color: isActive ? '#000' : txSub, padding: '8px 24px 8px 14px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 700 : 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>{maj.courseData.major || maj.major}</button>{hoveredMajor === idx && (<button onClick={function(e) { e.stopPropagation(); removeMajor(idx); }} style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', border: 'none', background: '#ff444488', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>)}</div>); })}
            {majors.length < 2 && (<button onClick={async function() { var n = await showModal('Add Major', 'e.g. Economics, Psychology...', 'input'); if (n) addNewMajor(n); }} disabled={addingMajor} style={{ background: bgSec, border: '2px dashed ' + bdrL, color: accentColor, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: addingMajor ? 'not-allowed' : 'pointer', opacity: addingMajor ? 0.5 : 1 }}>{addingMajor ? 'Adding...' : '+ Add Major'}</button>)}
          </div>
        </div>

        {recommendedMajors.length > 0 && (<div style={{ marginBottom: 16 }}><button onClick={function() { setShowMajors(!showMajors); }} style={{ background: glassBg, border: '1px solid ' + bdr, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}><span style={{ fontSize: 14 }}>🎓</span><span style={{ color: txSub, fontSize: 12, fontWeight: 600, flex: 1, textAlign: 'left' }}>Recommended Majors at {currentProfile.school}</span><span style={{ color: txMut, fontSize: 14, transform: showMajors ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span></button>{showMajors && (<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>{recommendedMajors.map(function(m, i) { var isCurrent = m === (courseData.major || currentProfile.major); return (<button key={i} onClick={function() { if (!isCurrent && !switchingMajor) handleMajorSwitch(m); }} style={{ padding: '6px 14px', borderRadius: 20, background: isCurrent ? accentColor : bgSec, color: isCurrent ? '#000' : txSub, fontSize: 12, fontWeight: 600, border: isCurrent ? 'none' : '1px solid ' + bdrL, cursor: isCurrent ? 'default' : 'pointer', opacity: switchingMajor ? 0.5 : 1 }}>{isCurrent ? '✓ ' : ''}{m}</button>); })}</div>)}</div>)}

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
                  var isCurrent = currentSemesterIdx === i;
                  var semLocked = isDemo && i >= 4;
                  return (<button key={i} onClick={function() { if (semLocked) return; setActiveSemester(i); }} onDoubleClick={function() { if (!semLocked) setCurrentSemesterIdx(i); }} title={semLocked ? 'Sign up to unlock' : isCurrent ? 'Current semester' : 'Double-click to set as current'} style={{ padding: '8px 14px', borderRadius: 20, border: isCurrent && !semLocked ? '2px solid ' + accentColor : 'none', background: semLocked ? (darkMode ? '#1a1a22' : '#e8e8ee') : activeSemester === i ? accentColor : done ? '#1a3a24' : bgSec, color: semLocked ? (darkMode ? '#3a3a4e' : '#b0b0b8') : activeSemester === i ? '#000' : done ? '#4ade80' : txSub, fontSize: 12, fontWeight: 600, cursor: semLocked ? 'default' : 'pointer', whiteSpace: 'nowrap', flexShrink: 0, position: 'relative', opacity: semLocked ? 0.6 : 1 }}>{semLocked ? '🔒 ' : done ? '✓ ' : ''}{isCurrent && !semLocked ? '📍 ' : ''}{sem.name}</button>);
                })}
              </div>
              <button onClick={function() { if (semRef.current) semRef.current.scrollBy({ left: 150, behavior: 'smooth' }); }} style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 28, height: 28, borderRadius: '50%', border: '1px solid ' + bdrL, background: tabBg + 'ee', color: txSub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>›</button>
            </div>
            {semesters[activeSemester] && (<>
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ color: tx, fontSize: 18, fontFamily: "'Playfair Display', serif", margin: '8px 0 4px' }}>{semesters[activeSemester].name}</h3>
                    {currentSemesterIdx === activeSemester && <span style={{ background: accentColor + '22', color: accentColor, padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700 }}>📍 CURRENT</span>}
                    {currentSemesterIdx !== activeSemester && <button onClick={function() { setCurrentSemesterIdx(activeSemester); }} style={{ background: 'none', border: '1px solid ' + bdrL, borderRadius: 10, color: txMut, padding: '2px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Set as current</button>}
                  </div>
                  {(function() {
                    var semCredits = semesters[activeSemester].courses ? semesters[activeSemester].courses.reduce(function(a, c) { return a + (c.credits || 3); }, 0) : 0;
                    var numCourses = semesters[activeSemester].courses ? semesters[activeSemester].courses.length : 0;
                    var coreCount = semesters[activeSemester].courses ? semesters[activeSemester].courses.filter(function(c) { return c.type === 'Core' || c.type === 'Prerequisite'; }).length : 0;
                    var intensity = semCredits >= 18 || numCourses >= 6 ? 'Heavy' : semCredits >= 15 || coreCount >= 3 ? 'Moderate' : 'Light';
                    var iColors = { Heavy: '#ef4444', Moderate: '#f59e0b', Light: '#4ade80' };
                    var iIcons = { Heavy: '🔥', Moderate: '⚡', Light: '🌿' };
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: iColors[intensity] + '18', border: '1px solid ' + iColors[intensity] + '33', color: iColors[intensity], padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                        {iIcons[intensity]} {intensity} Workload
                      </span>
                    );
                  })()}
                </div>
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

        {activeTab === 'progress' && (
          <div>
            {/* Animated Progress Ring */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '24px 28px', flex: '1 1 200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 12 }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke={darkMode ? '#1e1e28' : '#e2e2e8'} strokeWidth="8" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke={accentColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - progress / 100)} style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: tx }}>{progress}%</div>
                    <div style={{ fontSize: 10, color: txMut, fontWeight: 600 }}>COMPLETE</div>
                  </div>
                </div>
                <div style={{ color: txSub, fontSize: 13, textAlign: 'center' }}>{completedCount} of {totalCourses} courses</div>
                <div style={{ color: txMut, fontSize: 12 }}>{completedCredits} of {totalCredits} credits</div>
              </div>

              {/* Course Type Breakdown */}
              <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '20px 24px', flex: '1 1 260px' }}>
                <h3 style={{ color: tx, fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>Degree Audit</h3>
                {(function() {
                  var types = {};
                  var typesCompleted = {};
                  semesters.forEach(function(sem, si) {
                    if (sem.courses) sem.courses.forEach(function(c, ci) {
                      var t = c.type || 'Other';
                      types[t] = (types[t] || 0) + 1;
                      if (completedCourses[si + '-' + ci]) typesCompleted[t] = (typesCompleted[t] || 0) + 1;
                    });
                  });
                  var typeColors = { Core: accentColor, Prerequisite: '#f59e0b', Elective: '#3b82f6', 'Gen Ed': '#8b5cf6', Other: '#6b7280' };
                  return Object.keys(types).map(function(t) {
                    var total = types[t];
                    var done = typesCompleted[t] || 0;
                    var pct = Math.round((done / total) * 100);
                    return (
                      <div key={t} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ color: txSub, fontSize: 12, fontWeight: 600 }}>{t}</span>
                          <span style={{ color: txMut, fontSize: 11 }}>{done}/{total}</span>
                        </div>
                        <div style={{ height: 6, background: darkMode ? '#1e1e28' : '#e2e2e8', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: typeColors[t] || '#6b7280', borderRadius: 3, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    );
                  });
                })()}
                {(function() {
                  var remaining = totalCourses - completedCount;
                  if (remaining > 0) return <div style={{ color: txDim, fontSize: 12, marginTop: 8 }}>{remaining} course{remaining !== 1 ? 's' : ''} remaining to complete your degree</div>;
                  return <div style={{ color: '#4ade80', fontSize: 13, fontWeight: 600, marginTop: 8 }}>🎉 All courses complete!</div>;
                })()}
              </div>
            </div>

            {/* GPA Calculator */}
            <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 16, padding: '20px 24px' }}>
              <h3 style={{ color: tx, fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>GPA Calculator</h3>
              <p style={{ color: txMut, fontSize: 12, margin: '0 0 14px' }}>Select grades for your completed courses to calculate your GPA.</p>
              {(function() {
                var gradePoints = { 'A+': 4.0, 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0 };
                var gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
                var totalPoints = 0;
                var totalGradedCredits = 0;
                var gradedCourses = [];
                semesters.forEach(function(sem, si) {
                  if (sem.courses) sem.courses.forEach(function(c, ci) {
                    var key = si + '-' + ci;
                    if (completedCourses[key]) {
                      var grade = courseGrades[key];
                      var credits = c.credits || 3;
                      if (grade && gradePoints[grade] !== undefined) {
                        totalPoints += gradePoints[grade] * credits;
                        totalGradedCredits += credits;
                      }
                      gradedCourses.push({ sem: sem.name, code: c.code, title: c.title, credits: credits, key: key, grade: grade });
                    }
                  });
                });
                var gpa = totalGradedCredits > 0 ? (totalPoints / totalGradedCredits).toFixed(2) : '—';
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '14px 18px', background: darkMode ? '#0c0c14' : '#f5f5f8', borderRadius: 12 }}>
                      <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
                        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="32" cy="32" r="28" fill="none" stroke={darkMode ? '#1e1e28' : '#e2e2e8'} strokeWidth="5" />
                          <circle cx="32" cy="32" r="28" fill="none" stroke={gpa === '—' ? (darkMode ? '#2a2a38' : '#d5d5dd') : parseFloat(gpa) >= 3.5 ? '#4ade80' : parseFloat(gpa) >= 3.0 ? '#f59e0b' : parseFloat(gpa) >= 2.0 ? '#f97316' : '#ef4444'} strokeWidth="5" strokeLinecap="round" strokeDasharray={2 * Math.PI * 28} strokeDashoffset={gpa === '—' ? 2 * Math.PI * 28 : 2 * Math.PI * 28 * (1 - Math.min(parseFloat(gpa), 4.0) / 4.0)} style={{ transition: 'stroke-dashoffset 1s ease' }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: tx }}>{gpa}</div>
                      </div>
                      <div>
                        <div style={{ color: tx, fontSize: 14, fontWeight: 700 }}>Cumulative GPA</div>
                        <div style={{ color: txMut, fontSize: 12 }}>{totalGradedCredits} credits graded</div>
                      </div>
                    </div>
                    {gradedCourses.length === 0 && <div style={{ color: txDim, fontSize: 13, textAlign: 'center', padding: 20 }}>Complete and grade courses in the Courses tab to see your GPA here.</div>}
                    <div style={{ display: 'grid', gap: 6 }}>
                      {gradedCourses.map(function(gc) {
                        return (
                          <div key={gc.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: darkMode ? '#0c0c14' : '#f8f8fa', borderRadius: 8, border: '1px solid ' + bdr }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ color: tx, fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gc.code} — {gc.title}</div>
                              <div style={{ color: txMut, fontSize: 10 }}>{gc.credits} credits</div>
                            </div>
                            <select value={gc.grade || ''} onChange={function(e) { var v = e.target.value; setCourseGrades(function(p) { var n = {}; for (var k in p) n[k] = p[k]; n[gc.key] = v || undefined; return n; }); }}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid ' + bdr, background: darkMode ? '#1a1a28' : '#fff', color: tx, fontSize: 12, fontWeight: 600, cursor: 'pointer', width: 60 }}>
                              <option value="">—</option>
                              {gradeOptions.map(function(g) { return <option key={g} value={g}>{g}</option>; })}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'beyond' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, #ff640012, ' + bgCard + ')', border: '1px solid #ff640033', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#ff640022', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>⚡</div>
              <div>
                <h2 style={{ color: tx, fontSize: 17, fontWeight: 700, margin: '0 0 3px' }}>Beyond the Classroom</h2>
                <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.4 }}>The skills, habits, and connections that separate top candidates. This is what {currentProfile.school} won't teach you.</p>
              </div>
            </div>
            <BeyondClassroom data={courseData.beyondClassroom} accent={accentColor} color={primaryColor} darkMode={darkMode} />
          </div>
        )}
        {activeTab === 'interview' && (
          <div>
            <div style={{ background: 'linear-gradient(135deg, ' + accentColor + '12, ' + bgCard + ')', border: '1px solid ' + accentColor + '33', borderRadius: 14, padding: '16px 18px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: accentColor + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>🎯</div>
              <div>
                <h2 style={{ color: tx, fontSize: 17, fontWeight: 700, margin: '0 0 3px' }}>Interview Simulator</h2>
                <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.4 }}>Practice real {currentProfile.careerLabel} interview questions. Technical, behavioral, and case — with AI feedback.</p>
              </div>
            </div>
            <InterviewSimulator profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} />
          </div>
        )}

        {activeTab === 'advisor' && <AiAdvisor profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} inline={true} />}

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

        {activeTab === 'career-compare' && (
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <CareerComparison darkMode={darkMode} accent={accentColor} primaryColor={primaryColor} />
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
        </main>
      </div>

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

