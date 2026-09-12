import React from 'react';
import { HeartPulse, ClipboardList, BookOpen, Brain, History, Trophy, UserRound, LogOut, Settings2, FileText, Activity, Calendar, BookMarked } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchSidebar() {
  const { user, view, setView, tests, logout, openSmartReview } = useStitch();

  const isStaff = ['admin', 'owner', 'teacher'].includes(user.role);

  return (
    <aside className="stitchSidebar">
      {/* Brand Header */}
      <div className="stitchBrand">
        <div className="stitchBrandIcon">
          <HeartPulse size={22} />
        </div>
        <div className="stitchBrandTitle">
          <h2>KIUR Academic</h2>
          <small>BY ERATRANS • STITCH UI</small>
        </div>
      </div>

      {/* Target Examination Context Pill */}
      <div className="stitchTargetExamPill">
        <span>الاختبار المستهدف</span>
        <strong>{user.phaseName || 'SMLE 2025'}</strong>
      </div>

      {/* Navigation */}
      <nav className="stitchNav">
        <p className="stitchNavLabel">بيئة التعلم والتدريب</p>

        <button
          type="button"
          className={`stitchNavItem ${view === 'home' ? 'active' : ''}`}
          onClick={() => setView('home')}
        >
          <div className="stitchNavItemInner">
            <BookOpen size={18} />
            <span>لوحة المتابعة</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'qbank' || view === 'tests' ? 'active' : ''}`}
          onClick={() => setView('qbank')}
        >
          <div className="stitchNavItemInner">
            <ClipboardList size={18} />
            <span>بنك الأسئلة الطبي (Q-Bank)</span>
          </div>
          {tests.length > 0 && <span className="stitchNavBadge">{tests.length}</span>}
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'tutor-player' ? 'active' : ''}`}
          onClick={() => setView('tutor-player')}
        >
          <div className="stitchNavItemInner">
            <Brain size={18} />
            <span>مشغل الأسئلة (وضع التدريب)</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'exam-player' ? 'active' : ''}`}
          onClick={() => setView('exam-player')}
        >
          <div className="stitchNavItemInner">
            <Activity size={18} />
            <span>محاكاة SMLE الموقوتة</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'review-center' ? 'active' : ''}`}
          onClick={() => setView('review-center')}
        >
          <div className="stitchNavItemInner">
            <RotateCcw size={18} />
            <span>مركز المراجعة والتعافي</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'analytics' ? 'active' : ''}`}
          onClick={() => setView('analytics')}
        >
          <div className="stitchNavItemInner">
            <BarChart3 size={18} />
            <span>تحليلات الأداء والجاهزية</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'study-plan' ? 'active' : ''}`}
          onClick={() => setView('study-plan')}
        >
          <div className="stitchNavItemInner">
            <Calendar size={18} />
            <span>خطة المذاكرة اليومية</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'notes' ? 'active' : ''}`}
          onClick={() => setView('notes')}
        >
          <div className="stitchNavItemInner">
            <BookMarked size={18} />
            <span>اللآلئ السريرية (Pearls)</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'glimpses' ? 'active' : ''}`}
          onClick={() => setView('glimpses')}
        >
          <div className="stitchNavItemInner">
            <HeartPulse size={18} />
            <span>اللمحات السريرية 3D</span>
          </div>
        </button>

        <p className="stitchNavLabel" style={{ marginTop: '8px' }}>الاشتراكات والسجل</p>

        <button
          type="button"
          className={`stitchNavItem ${view === 'pricing' ? 'active' : ''}`}
          onClick={() => setView('pricing')}
        >
          <div className="stitchNavItemInner">
            <Sparkles size={18} />
            <span>باقات الاشتراك والترخيص</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'history' ? 'active' : ''}`}
          onClick={() => setView('history')}
        >
          <div className="stitchNavItemInner">
            <History size={18} />
            <span>سجل النتائج والشهادات</span>
          </div>
        </button>

        {user.role === 'student' && (
          <button
            type="button"
            className={`stitchNavItem ${view === 'points' ? 'active' : ''}`}
            onClick={() => setView('points')}
          >
            <div className="stitchNavItemInner">
              <Trophy size={18} />
              <span>نقاطي والتحصيل</span>
            </div>
          </button>
        )}

        <button
          type="button"
          className={`stitchNavItem ${view === 'profile' ? 'active' : ''}`}
          onClick={() => setView('profile')}
        >
          <div className="stitchNavItemInner">
            <UserRound size={18} />
            <span>الهوية الأكاديمية</span>
          </div>
        </button>

        {isStaff && (
          <>
            <p className="stitchNavLabel" style={{ marginTop: '8px' }}>العمليات السريرية</p>
            <button
              type="button"
              className={`stitchNavItem ${view === 'admin' ? 'active' : ''}`}
              onClick={() => setView('admin')}
            >
              <div className="stitchNavItemInner">
                <Settings2 size={18} />
                <span>مركز الإشراف والكادر</span>
              </div>
            </button>
          </>
        )}
      </nav>

      {/* Exam Timer Widget */}
      <div className="stitchSidebarTimer">
        <div className="stitchSidebarTimerHeader">
          <span>مؤقت الجلسة النشطة</span>
          <strong>جلسة تدريبية</strong>
        </div>
        <div className="stitchSidebarTimerBar">
          <div className="stitchSidebarTimerBarFill" />
        </div>
        <div className="stitchSidebarTimerTime">
          <span>الوقت المتبقي</span>
          <b>01:14:22</b>
        </div>
      </div>

      {/* Mini Profile Footer */}
      <div className="stitchMiniProfile">
        <button
          type="button"
          className="stitchMiniAvatar"
          onClick={() => setView('profile')}
          title="فتح حسابي"
        >
          {user.name.slice(0, 2)}
        </button>
        <div className="stitchMiniInfo">
          <b>{user.name}</b>
          <small>{user.role === 'student' ? (user.phaseName || 'طالب سريري') : 'كادر أكاديمي'}</small>
        </div>
        <button
          type="button"
          className="stitchLogoutBtn"
          onClick={() => logout()}
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

export default StitchSidebar;
