'use client';
import { TYPE_COLORS } from '@/lib/constants';

export default function CourseCard({ course, semIdx, cIdx, completed, onToggle, accent, darkMode }) {
  var dm = darkMode !== false; // default to dark
  var tc = TYPE_COLORS[course.type] || '#444';
  var cardBg = completed ? (dm ? '#0d1a12' : '#e8f5ec') : (dm ? '#111122' : '#ffffff');
  var cardBorder = completed ? (dm ? '1px solid #1a3a24' : '1px solid #a3d9b1') : (dm ? '1px solid #1e1e32' : '1px solid #d0d0dc');
  var codeTx = dm ? '#fff' : '#1a1a2a';
  var titleTx = dm ? '#ccc' : '#333';
  var descTx = dm ? '#6a6a7a' : '#888';
  var crTx = dm ? '#6a6a7a' : '#999';
  var checkBorder = dm ? '2px solid #3a3a4e' : '2px solid #b0b0bb';

  return (
    <div style={{ background: cardBg, border: cardBorder, borderRadius: 12, padding: '14px 16px', transition: 'all 0.3s', opacity: completed ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: codeTx, fontWeight: 700, fontSize: 14 }}>{course.code}</span>
            <span style={{ background: tc + '33', color: tc, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
          </div>
          <div style={{ color: titleTx, fontSize: 13, marginTop: 4 }}>{course.title}</div>
          <div style={{ color: descTx, fontSize: 12, marginTop: 4 }}>{course.desc}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ color: crTx, fontSize: 12 }}>{course.credits} cr</span>
          <div onClick={function() { onToggle(semIdx, cIdx); }}
            style={{ width: 22, height: 22, borderRadius: 6, border: completed ? 'none' : checkBorder, background: completed ? '#0A5C36' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', cursor: 'pointer' }}>
            {completed && '✓'}
          </div>
        </div>
      </div>
    </div>
  );
}
