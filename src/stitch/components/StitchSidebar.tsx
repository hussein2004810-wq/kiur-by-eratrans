import { HeartPulse, ClipboardList, BookOpen, Brain, History, Trophy, UserRound, LogOut, Settings2, FileText, Activity, Calendar, BookMarked, X, LayoutDashboard, RotateCcw, BarChart3 } from 'lucide-react';
import { useStitch } from '../StitchContext';

export function StitchSidebar() {
  const { user, view, setView, tests, logout, sidebarOpen, setSidebarOpen } = useStitch();

  const isStaff = ['admin', 'owner', 'teacher'].includes(user.role);

  const handleNavigate = (targetView: string) => {
    setView(targetView);
    if (setSidebarOpen) setSidebarOpen(false);
  };

  return (
    <>
      <aside className={`stitchSidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="stitchBrand">
          <div className="stitchBrandIcon">
            <HeartPulse size={22} />
          </div>
          <div className="stitchBrandTitle">
            <h2>KIUR Academic</h2>
            <small>BY ERATRANS • STITCH UI</small>
          </div>
          {setSidebarOpen && (
            <button
              type="button"
              className="stitchSidebarCloseBtn"
              onClick={() => setSidebarOpen(false)}
              aria-label="إغلاق القائمة"
            >
              <X size={20} />
            </button>
          )}
        </div>

      {/* Target Examination Context Pill */}
      <div className="stitchTargetExamPill">
        <span>الاختبار المستهدف</span>
        <strong>{user.phaseName || 'البورد العراقي والامتحان التقويمي'}</strong>
      </div>

      {/* Navigation */}
      <nav className="stitchNav">
        <p className="stitchNavLabel">بيئة التعلم والتدريب</p>

        <button
          type="button"
          className={`stitchNavItem ${view === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigate('home')}
        >
          <div className="stitchNavItemInner">
            <LayoutDashboard size={18} />
            <span>لوحة المتابعة الرئيسية</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'qbank' || view === 'tests' ? 'active' : ''}`}
          onClick={() => handleNavigate('tests')}
        >
          <div className="stitchNavItemInner">
            <ClipboardList size={18} />
            <span>بنك الاختبارات والمحاضرات</span>
          </div>
          {tests.length > 0 && <span className="stitchNavBadge">{tests.length}</span>}
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'review-center' ? 'active' : ''}`}
          onClick={() => handleNavigate('review-center')}
        >
          <div className="stitchNavItemInner">
            <RotateCcw size={18} />
            <span>مركز المراجعة والتعافي</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'study-plan' ? 'active' : ''}`}
          onClick={() => handleNavigate('study-plan')}
        >
          <div className="stitchNavItemInner">
            <Calendar size={18} />
            <span>خطة المذاكرة اليومية</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'notes' || view === 'glimpses' ? 'active' : ''}`}
          onClick={() => handleNavigate('glimpses')}
        >
          <div className="stitchNavItemInner">
            <BookMarked size={18} />
            <span>اللآلئ واللمحات السريرية</span>
          </div>
        </button>

        <button
          type="button"
          className={`stitchNavItem ${view === 'analytics' ? 'active' : ''}`}
          onClick={() => handleNavigate('analytics')}
        >
          <div className="stitchNavItemInner">
            <BarChart3 size={18} />
            <span>تحليلات الأداء والجاهزية</span>
          </div>
        </button>

        <p className="stitchNavLabel" style={{ marginTop: '12px' }}>الإنجاز والحساب</p>

        <button
          type="button"
          className={`stitchNavItem ${view === 'history' ? 'active' : ''}`}
          onClick={() => handleNavigate('history')}
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
            onClick={() => handleNavigate('points')}
          >
            <div className="stitchNavItemInner">
              <Trophy size={18} />
              <span>نقاطي والتنافس</span>
            </div>
          </button>
        )}

        <button
          type="button"
          className={`stitchNavItem ${view === 'profile' ? 'active' : ''}`}
          onClick={() => handleNavigate('profile')}
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
              onClick={() => handleNavigate('admin')}
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
          onClick={() => handleNavigate('profile')}
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
    {sidebarOpen && (
      <div
        className="stitchScrim"
        onClick={() => setSidebarOpen?.(false)}
        aria-label="إغلاق القائمة الجانبية"
        role="button"
        tabIndex={0}
      />
    )}
  </>
  );
}

export default StitchSidebar;
