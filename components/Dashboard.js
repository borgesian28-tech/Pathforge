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
  const [switchingMajor, setSwitchingMajor] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [majors, setMajors] = useState([profile]);
  const [activeMajorIndex, setActiveMajorIndex] = useState(0);
  const [addingMajor, setAddingMajor] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [combinedView, setCombinedView] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState('');
  
  const [hoveredMajor, setHoveredMajor] = useState(-1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [careerExplorerSearch, setCareerExplorerSearch] = useState('');
  const [careerExplorerResult, setCareerExplorerResult] = useState(null);
  const [careerExplorerLoading, setCareerExplorerLoading] = useState(false);
  const [modal, setModal] = useState(null);
  const [modalInput, setModalInput] = useState('');
  const semRef = useRef(null);
  const saveTimer = useRef(null);
  const settingsRef = useRef(null);

  // Close settings dropdown on outside click
  useEffect(function() {
    function handleClick(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return function() { document.removeEventListener('mousedown', handleClick); };
  }, []);

  // Close mobile menu on tab change
  useEffect(function() { setMobileMenuOpen(false); }, [activeTab]);

  // Responsive sidebar
  useEffect(function() {
    function handleResize() {
      if (window.innerWidth < 768) { setSidebarOpen(false); }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return function() { window.removeEventListener('resize', handleResize); };
  }, []);

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
    var sem1 = filterXxxCourses(majors[0].courseData.semesters);
    var sem2 = filterXxxCourses(majors[1].courseData.semesters);
    var maxPerSemester = 5;
    var combined = sem1.map(function(sem, i) {
      var courses1 = sem.courses || [];
      var courses2 = (sem2[i] && sem2[i].courses) || [];
      var core1 = courses1.filter(function(c) { return c.type === 'Core' || c.type === 'Prerequisite'; });
      var elective1 = courses1.filter(function(c) { return c.type !== 'Core' && c.type !== 'Prerequisite'; });
      var core2 = courses2.filter(function(c) { return c.type === 'Core' || c.type === 'Prerequisite'; });
      var elective2 = courses2.filter(function(c) { return c.type !== 'Core' && c.type !== 'Prerequisite'; });
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
      for (var a = 0; a < core1.length; a++) addCourse(core1[a]);
      for (var b = 0; b < core2.length; b++) addCourse(core2[b]);
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

  var ensureReadable = function(hex, isDark) {
    if (!hex || hex.length < 4) return isDark ? '#C9A84C' : '#0A5C36';
    var r, g, b;
    var h = hex.replace('#', '');
    if (h.length === 3) { r = parseInt(h[0]+h[0],16); g = parseInt(h[1]+h[1],16); b = parseInt(h[2]+h[2],16); }
    else { r = parseInt(h.substring(0,2),16); g = parseInt(h.substring(2,4),16); b = parseInt(h.substring(4,6),16); }
    if (isNaN(r)) return isDark ? '#C9A84C' : '#0A5C36';
    var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    if (isDark && luminance < 0.35) {
      var factor = 1.8;
      r = Math.min(255, Math.round(r * factor + 60));
      g = Math.min(255, Math.round(g * factor + 60));
      b = Math.min(255, Math.round(b * factor + 60));
      return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
    }
    if (!isDark && luminance > 0.7) {
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
  var dm = darkMode;
  var bg = dm ? '#09090b' : '#fafafa';
  var bgCard = dm ? '#131318' : '#ffffff';
  var bgSec = dm ? '#19191f' : '#f0f0f4';
  var bgElev = dm ? '#1c1c24' : '#eeeef2';
  var bdr = dm ? '#1e1e28' : '#e2e2e8';
  var bdrL = dm ? '#2a2a38' : '#d5d5dd';
  var tx = dm ? '#f0f0f2' : '#111118';
  var txSub = dm ? '#a0a0b0' : '#444450';
  var txMut = dm ? '#606070' : '#777784';
  var txDim = dm ? '#8a8a9a' : '#555555';
  var headerBg = dm ? '#0c0c0f' : '#ffffff';
  var tabBg = dm ? '#0c0c0f' : '#ffffff';
  var overlayBg = dm ? '#09090bdd' : '#fafafadd';
  var cardHov = dm ? '#19191f' : '#f5f5f8';
  var progBg = dm ? '#1c1c24' : '#e2e2e8';
  var glassBg = dm ? '#ffffff06' : '#00000006';
  var sidebarBg = dm ? '#0c0c0f' : '#ffffff';
  var sidebarBdr = dm ? '#1a1a22' : '#e8e8ee';

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
        body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: newMajor, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '' }),
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
        body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: majorName, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '' }),
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
        body: JSON.stringify({ schoolName: newSchool, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: catalogUrl || '' }),
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

  // Career Explorer
  const exploreCareer = async function() {
    if (!careerExplorerSearch.trim()) return;
    setCareerExplorerLoading(true);
    setCareerExplorerResult(null);
    try {
      var res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Tell me about a career in: ' + careerExplorerSearch.trim() }],
          context: 'You are a career education expert. The user wants to learn about a specific career. Provide a detailed but concise overview in this EXACT format:\n\nJOB TITLE: [title]\n\nWHAT THEY DO:\n[2-3 sentences about daily responsibilities]\n\nEDUCATION NEEDED:\n[Degree requirements, certifications, typical path]\n\nSALARY RANGE:\nEntry: $XX,XXX - $XX,XXX\nMid-Career: $XX,XXX - $XX,XXX\nSenior: $XXX,XXX - $XXX,XXX\n\nTOP SKILLS:\n- Skill 1\n- Skill 2\n- Skill 3\n- Skill 4\n- Skill 5\n\nDAY IN THE LIFE:\n[3-4 sentences describing a typical workday]\n\nGROWTH OUTLOOK:\n[1-2 sentences about job market and future prospects]\n\nHOW TO GET STARTED:\n[3 concrete actionable steps for a student]'
        })
      });
      if (res.ok) {
        var data = await res.json();
        setCareerExplorerResult(data.reply);
      }
    } catch(e) { console.error(e); }
    setCareerExplorerLoading(false);
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
    { id: 'courses', label: 'Courses', icon: '📚', iconAlt: '◫' },
    { id: 'beyond', label: 'Beyond Class', icon: '⚡', iconAlt: '◈' },
    { id: 'interview', label: 'Interview Prep', icon: '🎯', iconAlt: '◉' },
    { id: 'outcomes', label: 'Outcomes', icon: '💰', iconAlt: '◇' },
    { id: 'timeline', label: 'Timeline', icon: '📍', iconAlt: '◆' },
    { id: 'clubs', label: 'Clubs', icon: '🏛️', iconAlt: '◪' },
    { id: 'careers', label: 'Career Explorer', icon: '🧭', iconAlt: '◎' },
    { id: 'overview', label: 'Overview', icon: '📊', iconAlt: '▣' },
  ];

  // ===== Export/Share helpers =====
  var handleExport = function() {
    var html = '<html><head><title>' + currentProfile.name + ' Roadmap - PathForge</title><style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#111}h1{font-size:24px;margin-bottom:4px}h2{font-size:14px;color:#666;margin-bottom:24px}h3{font-size:16px;margin:20px 0 8px;padding-top:12px;border-top:1px solid #ddd}.course{display:flex;justify-content:space-between;padding:4px 0;font-size:13px}.code{font-weight:600}.credits{color:#888}.footer{margin-top:32px;padding-top:16px;border-top:1px solid #ddd;color:#888;font-size:11px}</style></head><body>';
    html += '<h1>' + currentProfile.name + "'s " + currentProfile.careerLabel + ' Roadmap</h1>';
    html += '<h2>' + (courseData.major || '') + ' @ ' + (courseData.schoolFullName || currentProfile.school) + '</h2>';
    semesters.forEach(function(sem) {
      html += '<h3>' + sem.name + '</h3>';
      if (sem.courses) sem.courses.forEach(function(c) {
        html += '<div class="course"><span><span class="code">' + c.code + '</span> — ' + c.title + '</span><span class="credits">' + (c.credits || 3) + ' cr</span></div>';
      });
    });
    html += '<div class="footer">Generated by PathForge • pathforge-omega.vercel.app</div></body></html>';
    var w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(function() { w.print(); }, 500);
  };

  var handleShare = function() {
    var text = currentProfile.name + "'s " + currentProfile.careerLabel + ' Roadmap\n';
    text += (courseData.major || '') + ' @ ' + (courseData.schoolFullName || currentProfile.school) + '\n\n';
    semesters.forEach(function(sem) {
      text += '--- ' + sem.name + ' ---\n';
      if (sem.courses) sem.courses.forEach(function(c) { text += c.code + ' - ' + c.title + ' (' + (c.credits || 3) + ' cr)\n'; });
      text += '\n';
    });
    navigator.clipboard.writeText(text).then(function() { setSaveStatus('Copied!'); setTimeout(function() { setSaveStatus(''); }, 2000); });
  };

  var isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  var sidebarW = sidebarOpen ? 240 : 64;

  // ==================== RENDER ====================
  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', transition: 'background 0.3s' }}>
      {switchingMajor && (
        <div style={{ position: 'fixed', inset: 0, background: overlayBg, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accentColor, animation: 'spin 1s linear infinite', marginBottom: 16 }} />
          <p style={{ color: tx, fontSize: 15, fontWeight: 600 }}>{switchingMajor}</p>
          <p style={{ color: txMut, fontSize: 13, marginTop: 4 }}>This may take a moment</p>
        </div>
      )}

      {/* ========== SIDEBAR ========== */}
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div onClick={function() { setMobileMenuOpen(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 89, backdropFilter: 'blur(4px)' }} />
      )}
      <aside style={{
        position: isMobile ? 'fixed' : 'sticky',
        top: 0,
        left: isMobile ? (mobileMenuOpen ? 0 : -260) : 0,
        width: isMobile ? 240 : sidebarW,
        height: '100vh',
        background: sidebarBg,
        borderRight: '1px solid ' + sidebarBdr,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 90,
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Sidebar header */}
        <div style={{ padding: sidebarOpen || isMobile ? '16px 16px 12px' : '16px 12px 12px', borderBottom: '1px solid ' + sidebarBdr, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {(sidebarOpen || isMobile) ? (
            <>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, ' + accentColor + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                🎓
              </div>
              <span style={{ color: tx, fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>PathForge</span>
            </>
          ) : (
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, ' + accentColor + ', ' + primaryColor + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              🎓
            </div>
          )}
        </div>

        {/* School info */}
        {(sidebarOpen || isMobile) && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {logoUrl && <img src={logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4, background: '#fff' }} onError={function(e) { e.target.style.display = 'none'; }} />}
              <span style={{ color: txSub, fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{courseData.schoolFullName || currentProfile.school}</span>
            </div>
            <div style={{ color: txMut, fontSize: 11 }}>{careerObj.icon} {currentProfile.careerLabel}</div>
            {/* Progress mini */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: txMut, fontSize: 10 }}>{completedCount}/{totalCourses} courses</span>
                <span style={{ color: accentColor, fontSize: 10, fontWeight: 700 }}>{progress}%</span>
              </div>
              <div style={{ height: 3, background: progBg, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: progress + '%', background: accentColor, borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="thin-scrollbar" style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
          {tabs.map(function(tab) {
            var isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id); if (isMobile) setMobileMenuOpen(false); }}
                title={!sidebarOpen && !isMobile ? tab.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: sidebarOpen || isMobile ? '9px 12px' : '10px 0',
                  justifyContent: sidebarOpen || isMobile ? 'flex-start' : 'center',
                  borderRadius: 8,
                  border: 'none',
                  background: isActive ? (dm ? accentColor + '15' : accentColor + '12') : 'transparent',
                  color: isActive ? accentColor : txMut,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: 2,
                  position: 'relative',
                }}>
                <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{tab.icon}</span>
                {(sidebarOpen || isMobile) && <span>{tab.label}</span>}
                {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 2, background: accentColor }} />}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '8px', borderTop: '1px solid ' + sidebarBdr, flexShrink: 0 }}>
          {/* Collapse toggle - desktop only */}
          {!isMobile && (
            <button onClick={function() { setSidebarOpen(!sidebarOpen); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', justifyContent: sidebarOpen ? 'flex-start' : 'center', borderRadius: 8, border: 'none', background: 'transparent', color: txMut, fontSize: 13, cursor: 'pointer' }}>
              <span style={{ fontSize: 16, width: 22, textAlign: 'center', transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}>◂</span>
              {sidebarOpen && <span>Collapse</span>}
            </button>
          )}
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* TOP BAR */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          height: 56, background: headerBg,
          borderBottom: '1px solid ' + bdr,
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 12,
          backdropFilter: 'blur(12px)',
        }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button onClick={function() { setMobileMenuOpen(!mobileMenuOpen); }}
              style={{ background: 'none', border: 'none', color: tx, fontSize: 20, cursor: 'pointer', padding: '4px', marginRight: 4 }}>
              ☰
            </button>
          )}

          {/* Left: breadcrumb */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: tx, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentProfile.name}'s Roadmap
            </h1>
            {saveStatus && <span style={{ color: '#4ade80', fontSize: 11, fontWeight: 600, flexShrink: 0 }}>✓ {saveStatus}</span>}
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {/* Live data badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, background: dm ? '#16a34a12' : '#16a34a08', border: '1px solid ' + (dm ? '#16a34a33' : '#16a34a22') }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', animation: 'pulse 2s infinite' }} />
              <span style={{ color: dm ? '#4ade80' : '#15803d', fontSize: 10, fontWeight: 600 }}>LIVE</span>
            </div>

            {/* Settings dropdown */}
            <div ref={settingsRef} style={{ position: 'relative' }}>
              <button onClick={function() { setSettingsOpen(!settingsOpen); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ⋮
              </button>
              {settingsOpen && (
                <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 6, width: 200, background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', overflow: 'hidden', zIndex: 100 }}>
                  {[
                    { label: '📄 Export as PDF', action: handleExport },
                    { label: '📋 Copy to Clipboard', action: handleShare },
                    { label: '🔗 Link Course Catalog', action: async function() { setSettingsOpen(false); var url = await showModal('Link Course Catalog', "Paste a link to your school's course catalog", 'input'); if (url && url.trim()) { setCatalogUrl(url.trim()); setSwitchingMajor("Scanning course catalog..."); fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolName: currentProfile.school, careerPath: currentProfile.careerLabel, majorName: courseData.major, customGoal: null, programLevel: currentProfile.programLevel || 'undergraduate', catalogUrl: url.trim() }) }).then(function(r) { return r.json(); }).then(function(d) { if (d.semesters) { var np = { ...currentProfile, courseData: d }; setCurrentProfile(np); setMajors([np]); setActiveMajorIndex(0); setCompletedCourses({}); setActiveSemester(0); setActiveTab('courses'); if (user) saveRoadmap(np, {}); } setSwitchingMajor(""); }).catch(function() { setSwitchingMajor(''); }); } } },
                    { label: '🏫 Change School', action: function() { setSettingsOpen(false); changeSchool(); } },
                    { label: '↻ New Roadmap', action: function() { setSettingsOpen(false); onReset(); } },
                  ].map(function(item, i) {
                    return (
                      <button key={i} onClick={item.action}
                        style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < 5 ? '1px solid ' + bdr : 'none', color: txSub, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button onClick={function() { setDarkMode(!darkMode); }}
              style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {darkMode ? '☀️' : '🌙'}
            </button>

            {/* User */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {user.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid ' + bdr }} referrerPolicy="no-referrer" />}
              </div>
            ) : (
              <button onClick={login} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid ' + accentColor + '44', background: accentColor + '12', color: accentColor, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign in</button>
            )}
          </div>
        </header>

        {/* MAIN SCROLL AREA */}
        <main className="thin-scrollbar" style={{ flex: 1, overflow: 'auto', padding: isMobile ? '20px 16px 40px' : '24px 32px 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>

            {/* ===== MAJORS BAR (courses tab only) ===== */}
            {activeTab === 'courses' && <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1, flexWrap: 'wrap' }}>
                {majors.map(function(maj, idx) {
                  var isActive = idx === activeMajorIndex && !combinedView;
                  return (
                    <div key={idx} style={{ position: 'relative', display: 'inline-flex' }} onMouseEnter={function() { setHoveredMajor(idx); }} onMouseLeave={function() { setHoveredMajor(-1); }}>
                      <button onClick={function() { setCombinedView(false); switchToMajor(idx); }}
                        style={{ background: isActive ? accentColor + '18' : bgCard, border: '1px solid ' + (isActive ? accentColor + '44' : bdr), color: isActive ? accentColor : txSub, padding: '6px 16px 6px 12px', borderRadius: 8, fontSize: 13, fontWeight: isActive ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
                        {maj.courseData.major || maj.major}
                      </button>
                      {hoveredMajor === idx && majors.length > 1 && (
                        <button onClick={function(e) { e.stopPropagation(); removeMajor(idx); }}
                          style={{ position: 'absolute', right: -4, top: -4, width: 16, height: 16, borderRadius: '50%', border: '1px solid ' + bdr, background: bgCard, color: txMut, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, padding: 0 }}>×</button>
                      )}
                    </div>
                  );
                })}
                {majors.length < 2 && (
                  <button onClick={async function() { var n = await showModal('Add Major', 'e.g. Economics, Psychology, Biology...', 'input'); if (n) addNewMajor(n); }} disabled={addingMajor}
                    style={{ background: 'transparent', border: '1px dashed ' + bdrL, color: txMut, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500, cursor: addingMajor ? 'not-allowed' : 'pointer', opacity: addingMajor ? 0.5 : 1 }}>
                    {addingMajor ? 'Adding...' : '+ Add Major'}
                  </button>
                )}
                {majors.length === 2 && (
                  <button onClick={function() { setCombinedView(!combinedView); }}
                    style={{ background: combinedView ? accentColor + '18' : 'transparent', border: '1px solid ' + (combinedView ? accentColor + '44' : bdr), borderRadius: 8, color: combinedView ? accentColor : txMut, fontSize: 11, fontWeight: 600, padding: '6px 10px', cursor: 'pointer' }}>
                    {combinedView ? '✓ Combined' : 'Combine'}
                  </button>
                )}
              </div>
              {recommendedMajors.length > 0 && (
                <button onClick={function() { setShowMajors(!showMajors); }}
                  style={{ background: glassBg, border: '1px solid ' + bdr, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: txMut, fontWeight: 500 }}>
                  🎓 Suggested
                  <span style={{ transform: showMajors ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', fontSize: 10 }}>▾</span>
                </button>
              )}
            </div>
            {showMajors && recommendedMajors.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                {recommendedMajors.map(function(m, i) {
                  var isCurrent = m === (courseData.major || currentProfile.major);
                  return (
                    <button key={i} onClick={function() { if (!isCurrent && !switchingMajor) handleMajorSwitch(m); }}
                      style={{ padding: '5px 12px', borderRadius: 20, background: isCurrent ? accentColor + '18' : bgCard, color: isCurrent ? accentColor : txSub, fontSize: 12, fontWeight: 500, border: '1px solid ' + (isCurrent ? accentColor + '33' : bdr), cursor: isCurrent ? 'default' : 'pointer', opacity: switchingMajor ? 0.5 : 1 }}>
                      {isCurrent ? '✓ ' : ''}{m}
                    </button>
                  );
                })}
              </div>
            )}
            {/* end courses-only majors bar */}
            </>)}

            {/* ===== DAILY ACTION ===== */}
            {dailyAction && activeTab === 'courses' && (
              <div style={{ marginBottom: 16, background: accentColor + '0a', border: '1px solid ' + accentColor + '22', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>⚡</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: accentColor, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, marginBottom: 2 }}>TODAY'S ACTION</div>
                  <div style={{ color: tx, fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{dailyAction}</div>
                </div>
              </div>
            )}

            {/* ==================== TAB CONTENT ==================== */}

            {activeTab === 'courses' && (
              <div>
                {!user && (
                  <div style={{ background: accentColor + '08', border: '1px solid ' + accentColor + '22', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ color: accentColor, fontSize: 12, margin: 0, fontWeight: 500 }}>⚠️ Sign in to save progress</p>
                    <button onClick={login} style={{ background: accentColor, border: 'none', borderRadius: 6, color: '#000', fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Sign in</button>
                  </div>
                )}
                <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
                  <p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Courses are sourced from web data. <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.school + ' course catalog')} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Verify on your school's registrar ↗</a></p>
                </div>
                {/* Semester pills */}
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <div ref={semRef} className="hide-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '4px 0 12px', scrollBehavior: 'smooth' }}>
                    {semesters.map(function(sem, i) {
                      var done = sem.courses && sem.courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
                      return (<button key={i} onClick={function() { setActiveSemester(i); }} style={{ padding: '6px 14px', borderRadius: 20, border: activeSemester === i ? '1px solid ' + accentColor + '44' : '1px solid ' + bdr, background: activeSemester === i ? accentColor + '15' : done ? (dm ? '#16a34a15' : '#16a34a08') : bgCard, color: activeSemester === i ? accentColor : done ? '#4ade80' : txSub, fontSize: 12, fontWeight: activeSemester === i ? 600 : 400, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.15s' }}>{done ? '✓ ' : ''}{sem.name}</button>);
                    })}
                  </div>
                </div>
                {semesters[activeSemester] && (<>
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ color: tx, fontSize: 17, fontWeight: 700, margin: '0 0 4px' }}>{semesters[activeSemester].name}</h3>
                    <p style={{ color: txMut, fontSize: 12, margin: 0 }}>{semesters[activeSemester].courses ? semesters[activeSemester].courses.reduce(function(a, c) { return a + (c.credits || 3); }, 0) : 0} credits • {semesters[activeSemester].courses ? semesters[activeSemester].courses.filter(function(_, ci) { return completedCourses[activeSemester + '-' + ci]; }).length : 0}/{semesters[activeSemester].courses ? semesters[activeSemester].courses.length : 0} completed</p>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {semesters[activeSemester].courses && semesters[activeSemester].courses.map(function(c, ci) { return <CourseCard key={ci} course={c} semIdx={activeSemester} cIdx={ci} completed={!!completedCourses[activeSemester + '-' + ci]} onToggle={toggleCourse} accent={accentColor} darkMode={darkMode} />; })}
                  </div>
                  {milestones[activeSemester] && (
                    <div style={{ marginTop: 14, background: accentColor + '0a', border: '1px solid ' + accentColor + '22', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 16 }}>🎯</span>
                      <div><div style={{ color: accentColor, fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>MILESTONE</div><div style={{ color: tx, fontSize: 13 }}>{milestones[activeSemester].label}</div></div>
                    </div>
                  )}
                </>)}
              </div>
            )}

            {activeTab === 'beyond' && <BeyondClassroom data={courseData.beyondClassroom} accent={accentColor} color={primaryColor} darkMode={darkMode} />}
            {activeTab === 'interview' && <InterviewSimulator profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} />}

            {activeTab === 'outcomes' && (
              <div style={{ marginTop: 4 }}>
                {outcomes ? (<>
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ color: tx, fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>💰 Salary Outlook</h3>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {[{ label: 'Entry Level', data: outcomes.entrySalary, icon: '🌱' }, { label: 'Mid Career (5-10 yrs)', data: outcomes.midSalary, icon: '📈' }, { label: 'Senior Level (10+ yrs)', data: outcomes.seniorSalary, icon: '🏆' }].map(function(tier, i) {
                        if (!tier.data) return null;
                        var low = tier.data.low || 0, high = tier.data.high || 0;
                        var median = tier.data.median || Math.round((low + high) / 2);
                        var maxSalary = outcomes.seniorSalary ? outcomes.seniorSalary.high || 200000 : 200000;
                        var barWidth = Math.min(100, Math.round((median / maxSalary) * 100));
                        return (
                          <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 16 }}>{tier.icon}</span><span style={{ color: txSub, fontSize: 13, fontWeight: 500 }}>{tier.label}</span></div>
                              <span style={{ color: accentColor, fontSize: 17, fontWeight: 700 }}>{'$' + median.toLocaleString()}</span>
                            </div>
                            <div style={{ height: 6, background: progBg, borderRadius: 3, overflow: 'hidden', marginBottom: 4 }}><div style={{ height: '100%', width: barWidth + '%', background: 'linear-gradient(90deg, ' + primaryColor + ', ' + accentColor + ')', borderRadius: 3 }} /></div>
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
                  {outcomes.topCities && outcomes.topCities.length > 0 && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}><h4 style={{ color: tx, fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>📍 Top Cities</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{outcomes.topCities.map(function(city, i) { return <span key={i} style={{ background: accentColor + '12', color: accentColor, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{city}</span>; })}</div></div>)}
                  {outcomes.topEmployers && outcomes.topEmployers.length > 0 && (<div style={{ marginBottom: 16 }}><h3 style={{ color: tx, fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>🏢 Top Employers</h3><div style={{ display: 'grid', gap: 8 }}>{outcomes.topEmployers.map(function(emp, i) { return (<div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 32, height: 32, borderRadius: 8, background: accentColor + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color: accentColor, fontWeight: 700 }}>{(i + 1)}</div><div style={{ flex: 1 }}><div style={{ color: tx, fontWeight: 600, fontSize: 14 }}>{emp.name}</div><div style={{ color: txMut, fontSize: 12, marginTop: 2 }}>{emp.type}{emp.roles && emp.roles.length > 0 ? ' • ' + emp.roles.join(', ') : ''}</div></div></div>); })}</div></div>)}
                  {outcomes.growthOutlook && (<div style={{ background: accentColor + '08', border: '1px solid ' + accentColor + '22', borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}><h4 style={{ color: accentColor, fontSize: 11, fontWeight: 700, letterSpacing: 1.5, margin: '0 0 6px', textTransform: 'uppercase' }}>Industry Outlook</h4><p style={{ color: txSub, fontSize: 13, margin: 0, lineHeight: 1.6 }}>{outcomes.growthOutlook}</p></div>)}
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}><span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span><p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Salary data is AI-estimated. Verify with <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.careerLabel + ' salary')} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Glassdoor or Payscale ↗</a></p></div>
                </>) : (<div style={{ textAlign: 'center', padding: '40px 20px' }}><div style={{ fontSize: 48, marginBottom: 12 }}>💰</div><h3 style={{ color: tx, fontSize: 18, margin: '0 0 8px' }}>Outcome data unavailable</h3><p style={{ color: txMut, fontSize: 14 }}>Try regenerating your roadmap.</p></div>)}
              </div>
            )}

            {activeTab === 'timeline' && (
              <div style={{ marginTop: 4, position: 'relative', paddingLeft: 28 }}>
                <div style={{ position: 'absolute', left: 10, top: 0, bottom: 0, width: 2, background: 'linear-gradient(180deg, ' + accentColor + ', ' + primaryColor + ', transparent)' }} />
                {milestones.map(function(ms, i) {
                  var done = semesters[i] && semesters[i].courses && semesters[i].courses.every(function(_, ci) { return completedCourses[i + '-' + ci]; });
                  return (
                    <div key={i} onClick={function() { setExpandedMilestone(expandedMilestone === i ? null : i); }} style={{ position: 'relative', marginBottom: 8, cursor: 'pointer' }}>
                      <div style={{ position: 'absolute', left: -23, top: 14, width: 12, height: 12, borderRadius: '50%', background: done ? '#4ade80' : i === 0 ? accentColor : bdrL, border: '2px solid ' + bg }} />
                      <div style={{ background: expandedMilestone === i ? cardHov : bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div><span style={{ color: txMut, fontSize: 11, fontWeight: 500 }}>Semester {i + 1} • {semesterLabels[i] || semesters[i]?.name || ''}</span><div style={{ color: done ? '#4ade80' : tx, fontSize: 14, fontWeight: 600, marginTop: 2 }}>{done ? '✓ ' : ''}{ms.label}</div></div>
                          <span style={{ color: txMut, fontSize: 14, transform: expandedMilestone === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
                        </div>
                        {expandedMilestone === i && semesters[i] && (
                          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + bdr }}>
                            {semesters[i].courses && semesters[i].courses.map(function(c, ci) {
                              return (<div key={ci} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}><span style={{ color: completedCourses[i + '-' + ci] ? '#4ade80' : txSub, fontSize: 13 }}>{completedCourses[i + '-' + ci] ? '✓ ' : ''}{c.code} — {c.title}</span><span style={{ color: txMut, fontSize: 12 }}>{c.credits} cr</span></div>);
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
              <div style={{ marginTop: 4, display: 'grid', gap: 10 }}>
                <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'flex-start' }}><span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>ℹ️</span><p style={{ color: txDim, fontSize: 12, margin: 0, lineHeight: 1.5 }}>Club suggestions are AI-generated based on your career path. <a href={'https://www.google.com/search?q=' + encodeURIComponent(currentProfile.school + ' student clubs organizations')} target="_blank" rel="noopener noreferrer" style={{ color: accentColor, textDecoration: 'none', fontWeight: 600 }}>Browse all clubs at {currentProfile.school} ↗</a></p></div>
                {clubs.map(function(club, i) {
                  var pc = { Essential: '#ef4444', Recommended: '#C9A84C', Helpful: '#3b82f6' };
                  return (
                    <div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ color: tx, fontWeight: 600, fontSize: 14 }}>{club.name}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ background: bgSec, color: txSub, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{club.type}</span>
                        <span style={{ background: (pc[club.priority] || '#888') + '15', color: pc[club.priority] || '#888', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500 }}>{club.priority}</span>
                      </div>
                      <p style={{ color: txDim, fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>{club.desc}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ===== CAREER EXPLORER ===== */}
            {activeTab === 'careers' && (
              <div style={{ marginTop: 4 }}>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>🧭</div>
                  <h3 style={{ color: tx, fontSize: 22, fontWeight: 700, margin: '0 0 6px' }}>Career Explorer</h3>
                  <p style={{ color: txMut, fontSize: 14, margin: 0, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>Discover what different careers look like — salary, daily life, required skills, and how to get started.</p>
                </div>

                {/* Search */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input
                    type="text"
                    placeholder="Search any career — e.g. Product Manager, Surgeon, UX Designer..."
                    value={careerExplorerSearch}
                    onChange={function(e) { setCareerExplorerSearch(e.target.value); }}
                    onKeyDown={function(e) { if (e.key === 'Enter') exploreCareer(); }}
                    style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdr, background: bgCard, color: tx, fontSize: 14, outline: 'none' }}
                  />
                  <button onClick={exploreCareer} disabled={!careerExplorerSearch.trim() || careerExplorerLoading}
                    style={{ padding: '12px 20px', borderRadius: 10, border: 'none', background: careerExplorerSearch.trim() && !careerExplorerLoading ? accentColor : bgSec, color: careerExplorerSearch.trim() && !careerExplorerLoading ? '#000' : txMut, fontWeight: 700, fontSize: 14, cursor: careerExplorerSearch.trim() && !careerExplorerLoading ? 'pointer' : 'default' }}>
                    {careerExplorerLoading ? '...' : 'Explore'}
                  </button>
                </div>

                {/* Quick picks */}
                {!careerExplorerResult && !careerExplorerLoading && (
                  <div>
                    <div style={{ color: txMut, fontSize: 12, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Popular Searches</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {['Product Manager', 'Data Scientist', 'Surgeon', 'Investment Banker', 'UX Designer', 'Corporate Lawyer', 'Mechanical Engineer', 'Management Consultant', 'Clinical Psychologist', 'Software Architect', 'Quantitative Analyst', 'Venture Capitalist'].map(function(c, i) {
                        return (
                          <button key={i} onClick={function() { setCareerExplorerSearch(c); }}
                            style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid ' + bdr, background: bgCard, color: txSub, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' }}>
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Loading */}
                {careerExplorerLoading && (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid transparent', borderTopColor: accentColor, animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                    <p style={{ color: txMut, fontSize: 14 }}>Researching {careerExplorerSearch}...</p>
                  </div>
                )}

                {/* Result */}
                {careerExplorerResult && (
                  <div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 14, padding: '20px', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    <div style={{ color: tx, fontSize: 14 }}>{careerExplorerResult}</div>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid ' + bdr, display: 'flex', gap: 8 }}>
                      <button onClick={function() { setCareerExplorerResult(null); setCareerExplorerSearch(''); }}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid ' + bdr, background: 'transparent', color: txSub, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                        ← Explore Another
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'overview' && (
              <div style={{ marginTop: 4 }}>
                <div style={{ background: 'linear-gradient(135deg, ' + primaryColor + '22, ' + bgCard + ')', border: '1px solid ' + bdr, borderRadius: 14, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    {logoUrl && <img src={logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', padding: 2 }} onError={function(e) { e.target.style.display = 'none'; }} />}
                    <div style={{ fontSize: 32 }}>{careerObj.icon}</div>
                  </div>
                  <h3 style={{ color: tx, fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{currentProfile.careerLabel}</h3>
                  <p style={{ color: txSub, fontSize: 13, margin: 0 }}>{courseData.major} at {courseData.schoolFullName || currentProfile.school}</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  {[{ l: 'Major', v: courseData.major }, { l: 'School', v: currentProfile.school }, { l: 'Credits', v: totalCredits }, { l: 'Semesters', v: semesters.length }].map(function(x, i) {
                    return (<div key={i} style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}><div style={{ color: txMut, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{x.l}</div><div style={{ color: tx, fontSize: 17, fontWeight: 700, marginTop: 4 }}>{x.v}</div></div>);
                  })}
                </div>
                {skills.length > 0 && (<div style={{ background: bgCard, border: '1px solid ' + bdr, borderRadius: 12, padding: '14px 16px' }}><h4 style={{ color: tx, fontSize: 14, fontWeight: 600, margin: '0 0 10px' }}>Key Skills</h4><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{skills.map(function(s, i) { return <span key={i} style={{ background: accentColor + '12', color: accentColor, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{s}</span>; })}</div></div>)}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI ADVISOR (floating) */}
      <AiAdvisor profile={currentProfile} accent={accentColor} primaryColor={primaryColor} darkMode={darkMode} />

      {/* MODAL */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={function() { closeModal(null); }}>
          <div onClick={function(e) { e.stopPropagation(); }} style={{ background: dm ? '#131318' : '#ffffff', border: '1px solid ' + bdr, borderRadius: 14, padding: '24px 28px', maxWidth: 420, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: tx, fontSize: 17, fontWeight: 700, margin: '0 0 16px' }}>{modal.title}</h3>
            <input
              type="text"
              placeholder={modal.placeholder}
              value={modalInput}
              onChange={function(e) { setModalInput(e.target.value); }}
              onKeyDown={function(e) { if (e.key === 'Enter' && modalInput.trim()) closeModal(modalInput.trim()); }}
              autoFocus
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid ' + bdrL, background: dm ? '#09090b' : '#f5f5f8', color: tx, fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={function() { closeModal(null); }} style={{ padding: '10px 20px', borderRadius: 8, border: '1px solid ' + bdrL, background: 'transparent', color: txSub, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              <button onClick={function() { if (modalInput.trim()) closeModal(modalInput.trim()); }} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: accentColor, color: '#000', fontSize: 13, fontWeight: 700, cursor: modalInput.trim() ? 'pointer' : 'default', opacity: modalInput.trim() ? 1 : 0.5 }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      <style>{'@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}} @keyframes spin{to{transform:rotate(360deg)}}'}</style>
    </div>
  );
}
