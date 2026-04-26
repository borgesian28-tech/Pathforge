'use client';
import { useState, useRef, useEffect } from 'react';
import { TYPE_COLORS } from '@/lib/constants';

// Backwards-compatible CourseCard.
// - The existing `onToggle(semIdx, cIdx)` checkbox flow is preserved exactly.
// - Optional `onAction(semIdx, cIdx, action)` is the new hook for non-toggle edits.
//   Supported actions: 'mark-in-progress', 'unmark-in-progress', 'remove', 'swap' (Pass 2).
// - `course.userStatus` is the new persistent field. Values: undefined | 'in-progress'.
//   ("completed" remains tracked via completedCourses for backwards compat with Dashboard's
//    progress/GPA logic; we don't want to break that path in Pass 1.)
export default function CourseCard({ course, semIdx, cIdx, completed, onToggle, onAction, accent, darkMode }) {
  var dm = darkMode !== false;
  var tc = TYPE_COLORS[course.type] || '#444';
  var inProgress = course && course.userStatus === 'in-progress';

  var cardBg = completed
    ? (dm ? '#0d1a12' : '#eef7f0')
    : inProgress
      ? (dm ? '#1a1505' : '#fdf6e3')
      : (dm ? '#141414' : '#f7f7fa');
  var cardBorder = completed
    ? (dm ? '1px solid #1a3a24' : '1px solid #a3d9b1')
    : inProgress
      ? (dm ? '1px solid #5c4a1a' : '1px solid #e6c98a')
      : (dm ? '1px solid #2a2a2a' : '1px solid #d5d5e0');

  var codeTx = dm ? '#fff' : '#111111';
  var titleTx = dm ? '#ccc' : '#222222';
  var descTx = dm ? '#6a6a7a' : '#555555';
  var crTx = dm ? '#6a6a7a' : '#666666';
  var checkBorder = dm ? '2px solid #444444' : '2px solid #b0b0bb';

  var menuBg = dm ? '#1a1a1a' : '#ffffff';
  var menuBdr = dm ? '#2a2a2a' : '#d5d5e0';
  var menuTx = dm ? '#e0e0e0' : '#222222';
  var menuTxMuted = dm ? '#6a6a7a' : '#888888';
  var menuHover = dm ? '#222222' : '#f0f0f4';

  var [menuOpen, setMenuOpen] = useState(false);
  var menuRef = useRef(null);

  useEffect(function() {
    if (!menuOpen) return;
    function handle(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return function() { document.removeEventListener('mousedown', handle); };
  }, [menuOpen]);

  var handleAction = function(action) {
    setMenuOpen(false);
    if (action === 'mark-completed') {
      // Reuse existing toggle pipeline so progress + saved state stay coherent.
      if (onToggle) onToggle(semIdx, cIdx);
      return;
    }
    if (onAction) onAction(semIdx, cIdx, action);
  };

  var menuItem = function(opts) {
    return (
      <button
        key={opts.action}
        onClick={function() { if (!opts.disabled) handleAction(opts.action); }}
        disabled={!!opts.disabled}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          padding: '9px 12px',
          fontSize: 13,
          color: opts.disabled ? menuTxMuted : (opts.danger ? '#ef4444' : menuTx),
          cursor: opts.disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          opacity: opts.disabled ? 0.6 : 1,
        }}
        onMouseEnter={function(e) { if (!opts.disabled) e.currentTarget.style.background = menuHover; }}
        onMouseLeave={function(e) { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ width: 16, textAlign: 'center', fontSize: 13 }}>{opts.icon}</span>
        <span style={{ flex: 1 }}>{opts.label}</span>
        {opts.note ? <span style={{ fontSize: 10, color: menuTxMuted, fontWeight: 500 }}>{opts.note}</span> : null}
      </button>
    );
  };

  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px', transition: 'all 0.3s', opacity: completed ? 0.7 : 1, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: codeTx, fontWeight: 700, fontSize: 14 }}>{course.code}</span>
            <span style={{ background: tc + '33', color: tc, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
            {inProgress && !completed && (
              <span style={{ background: '#f59e0b22', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, letterSpacing: 0.4 }}>IN PROGRESS</span>
            )}
            {course.userModified && (
              <span title="You edited this course" style={{ color: accent || '#C9A84C', fontSize: 11, fontWeight: 700 }}>•edited</span>
            )}
          </div>
          <div style={{ color: titleTx, fontSize: 13, marginTop: 4 }}>{course.title}</div>
          {course.desc ? <div style={{ color: descTx, fontSize: 12, marginTop: 4 }}>{course.desc}</div> : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: crTx, fontSize: 12 }}>{course.credits != null ? course.credits + ' cr' : ''}</span>
            {onAction ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  onClick={function() { setMenuOpen(function(v) { return !v; }); }}
                  aria-label="Course options"
                  title="Course options"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    border: '1px solid ' + (dm ? '#2a2a2a' : '#d5d5e0'),
                    background: 'transparent',
                    color: dm ? '#9a9aa0' : '#666',
                    cursor: 'pointer',
                    fontSize: 14,
                    lineHeight: 1,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >⋯</button>
                {menuOpen && (
                  <div style={{
                    position: 'absolute',
                    right: 0,
                    top: 28,
                    width: 200,
                    background: menuBg,
                    border: '1px solid ' + menuBdr,
                    borderRadius: 10,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
                    zIndex: 20,
                    overflow: 'hidden',
                  }}>
                    {menuItem({ action: 'mark-completed', icon: completed ? '✓' : '☐', label: completed ? 'Unmark completed' : 'Mark completed' })}
                    {menuItem({ action: inProgress ? 'unmark-in-progress' : 'mark-in-progress', icon: inProgress ? '◌' : '⏳', label: inProgress ? 'Clear in-progress' : 'Mark in progress', disabled: completed })}
                    {menuItem({ action: 'swap', icon: '↔', label: 'Swap course', note: 'Soon', disabled: true })}
                    <div style={{ borderTop: '1px solid ' + menuBdr }} />
                    {menuItem({ action: 'remove', icon: '✕', label: 'Remove from semester', danger: true })}
                  </div>
                )}
              </div>
            ) : null}
          </div>
          <div onClick={function() { if (onToggle) onToggle(semIdx, cIdx); }}
            style={{ width: 22, height: 22, borderRadius: 6, border: completed ? 'none' : checkBorder, background: completed ? '#0A5C36' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', cursor: 'pointer' }}>
            {completed && '✓'}
          </div>
        </div>
      </div>
    </div>
  );
}
