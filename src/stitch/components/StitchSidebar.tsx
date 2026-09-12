import React from 'react';
import { HeartPulse, ClipboardList, BookOpen, Brain, History, Trophy, UserRound, LogOut, Settings2 } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchSidebar() {
  const { user, view, setView, tests, logout, openSmartReview } = useStitch();

  const isStaff = ['admin', 'owner', 'teacher'].includes(user.role);

  return (
    <aside className="stitchSidebar">
      <div className="stitchBrand">
        <div className="stitchBrandIcon">
          <HeartPulse size={24} />
        </div>
        <div className="stitchBrandTitle">
          <h2>KIUR</h2>
          <small>BY ERATRANS • STITCH UI</small>
        </div>
      </div>

      <nav className="stitchNav">
        <button
          type="button"
          className={`stitchNavItem ${view === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >
          <BookOpen size={18} />
          <span>الرئيسية</span>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'tests' ? 'active' : ''}`}
          onClick={() => setView('tests')}
        >
          <ClipboardList size={18} />
          <span>الاختبارات</span>
          {tests.length > 0 && <span style={{ marginInlineStart: 'auto', opacity: 0.7 }}>{tests.length}</span>}
        </button>

        <button
          type="button"
          className="stitchNavItem"
          onClick={() => openSmartReview('flashcards')}
        >
          <Brain size={18} />
          <span>المراجعة الذكية</span>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'glimpses' ? 'active' : ''}`}
          onClick={() => setView('glimpses')}
        >
          <HeartPulse size={18} />
          <span>اللمحات السريرية</span>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          <History size={18} />
          <span>سجل النتائج</span>
        </button>

        {user.role === 'student' && (
          <button
            type="button"
            className={`stitchNavItem ${view === 'points' ? 'active' : ''}`}
            onClick={() => setView('points')}
          >
            <Trophy size={18} />
            <span>نقاطي وإنجازاتي</span>
          </button>
        )}

        <button
          type="button"
          className={`stitchNavItem ${view === 'profile' ? 'active' : ''}`}
          onClick={() => setView('profile')}
        >
          <UserRound size={18} />
          <span>حسابي</span>
        </button>

        {isStaff && (
          <button
            type="button"
            className={`stitchNavItem ${view === 'admin' ? 'active' : ''}`}
            onClick={() => setView('admin')}
            style={{ marginTop: 'auto' }}
          >
            <Settings2 size={18} />
            <span>لوحة الإشراف</span>
          </button>
        )}
      </nav>

      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--stitch-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <b style={{ fontSize: '13px', display: 'block' }}>{user.name}</b>
          <small style={{ color: 'var(--stitch-text-muted)', fontSize: '11px' }}>
            {user.role === 'student' ? 'طالب' : user.role === 'teacher' ? 'تدريسي' : 'مشرف'}
          </small>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          style={{ background: 'transparent', border: 0, color: 'var(--stitch-text-muted)', cursor: 'pointer', padding: '6px' }}
          aria-label="تسجيل الخروج"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export default StitchSidebar;
