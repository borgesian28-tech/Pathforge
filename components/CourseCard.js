'use client';
import { TYPE_COLORS } from '@/lib/constants';

export default function CourseCard({ course, semIdx, cIdx, completed, onToggle, accent }) {
  const tc = TYPE_COLORS[course.type] || '#444';
  return (
    <div style={{ background: completed ? '#0d1a12' : '#111122', border: completed ? '1px solid #1a3a24' : '1px solid #1e1e32', borderRadius: 12, padding: '14px 16px', transition: 'all 0.3s', opacity: completed ? 0.7 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{course.code}</span>
            <span style={{ background: `${tc}33`, color: tc, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
          </div>
          <div style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>{course.title}</div>
          <div style={{ color: '#6a6a7a', fontSize: 12, marginTop: 4 }}>{course.desc}</div>
          {course.url && (
            <a href={course.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              style={{ color: accent, fontSize: 12, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none', fontWeight: 600 }}>
              View in catalog ↗
            </a>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ color: '#6a6a7a', fontSize: 12 }}>{course.credits} cr</span>
          <div onClick={() => onToggle(semIdx, cIdx)}
            style={{ width: 22, height: 22, borderRadius: 6, border: completed ? 'none' : '2px solid #3a3a4e', background: completed ? '#0A5C36' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', cursor: 'pointer' }}>
            {completed && '✓'}
          </div>
        </div>
      </div>
    </div>
  );
}
