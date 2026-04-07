'use client';
import { useState } from 'react';
import { TYPE_COLORS } from '@/lib/constants';

export default function CourseCard({ course, semIdx, cIdx, completed, onToggle, accent }) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_COLORS[course.type] || '#444';
  const hasProf = course.professor && typeof course.professor === "string" && course.professor.length > 1 && Number(course.profRating) > 0;

  var ratingColor = function(r) {
    if (r >= 4.0) return '#4ade80';
    if (r >= 3.0) return '#fbbf24';
    return '#ef4444';
  };

  var diffColor = function(d) {
    if (d <= 2.5) return '#4ade80';
    if (d <= 3.5) return '#fbbf24';
    return '#ef4444';
  };

  return (
    <div style={{ background: completed ? '#0d1a12' : '#111122', border: completed ? '1px solid #1a3a24' : '1px solid #1e1e32', borderRadius: 12, padding: '14px 16px', transition: 'all 0.3s', opacity: completed ? 0.7 : 1 }}>
      <div onClick={function() { if (hasProf) setExpanded(!expanded); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, cursor: hasProf ? 'pointer' : 'default' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{course.code}</span>
            <span style={{ background: tc + '33', color: tc, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{course.type}</span>
            {hasProf && <span style={{ background: ratingColor(course.profRating) + '22', color: ratingColor(course.profRating), padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>★ {Number(course.profRating).toFixed(1)}</span>}
          </div>
          <div style={{ color: '#ccc', fontSize: 13, marginTop: 4 }}>{course.title}</div>
          <div style={{ color: '#6a6a7a', fontSize: 12, marginTop: 4 }}>{course.desc}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          <span style={{ color: '#6a6a7a', fontSize: 12 }}>{course.credits} cr</span>
          <div onClick={function(e) { e.stopPropagation(); onToggle(semIdx, cIdx); }}
            style={{ width: 22, height: 22, borderRadius: 6, border: completed ? 'none' : '2px solid #3a3a4e', background: completed ? '#0A5C36' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', cursor: 'pointer' }}>
            {completed && '✓'}
          </div>
        </div>
      </div>
      {expanded && hasProf && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #1e1e32' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
            <div>
              <div style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>{course.professor}</div>
              <div style={{ color: '#6a6a7a', fontSize: 11, marginTop: 1 }}>Top-rated professor for this course</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
            <div style={{ flex: 1, background: '#0a0a18', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ color: ratingColor(course.profRating), fontSize: 18, fontWeight: 700 }}>{Number(course.profRating).toFixed(1)}</div>
              <div style={{ color: '#6a6a7a', fontSize: 10, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quality</div>
            </div>
            {course.profDifficulty && (
              <div style={{ flex: 1, background: '#0a0a18', borderRadius: 8, padding: '8px 12px', textAlign: 'center' }}>
                <div style={{ color: diffColor(course.profDifficulty), fontSize: 18, fontWeight: 700 }}>{Number(course.profDifficulty).toFixed(1)}</div>
                <div style={{ color: '#6a6a7a', fontSize: 10, fontWeight: 600, marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Difficulty</div>
              </div>
            )}
          </div>
          {course.profTags && course.profTags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {course.profTags.map(function(tag, i) {
                return <span key={i} style={{ background: '#1a1a2e', color: '#aaa', padding: '3px 10px', borderRadius: 6, fontSize: 11 }}>{tag}</span>;
              })}
            </div>
          )}
          <a href={'https://www.ratemyprofessors.com/search/professors?q=' + encodeURIComponent(course.professor)} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', marginTop: 10, color: accent, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            View on RateMyProfessors ↗
          </a>
        </div>
      )}
      {hasProf && !expanded && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#6a6a7a', fontSize: 11 }}>👤 {course.professor}</span>
          <span style={{ color: '#4a4a5a', fontSize: 11 }}>•</span>
          <span style={{ color: '#6a6a7a', fontSize: 11 }}>Tap for details</span>
        </div>
      )}
    </div>
  );
}
