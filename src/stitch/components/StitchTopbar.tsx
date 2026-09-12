import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useStitch } from '../StitchContext';
import { ThemeToggle } from '../../theme-preference';

export function StitchTopbar() {
  const {
    user,
    search,
    setSearch,
    setView,
    setCommandPaletteOpen,
    notifications,
    notificationsOpen,
    setNotificationsOpen,
  } = useStitch();

  const unreadCount = notifications.filter(n => !n.readAt).length;

  return (
    <header className="stitchTopbar">
      <div
        className="stitchSearch"
        onClick={() => setCommandPaletteOpen(true)}
      >
        <Search />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setView('tests');
          }}
          placeholder="ابحث في المواد أو اضغط ⌘K..."
          aria-label="البحث العام"
        />
        <kbd
          style={{
            position: 'absolute',
            left: '12px',
            padding: '2px 6px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--stitch-border)',
            fontSize: '10px',
            color: 'var(--stitch-text-muted)'
          }}
        >
          ⌘K
        </kbd>
      </div>

      <div className="stitchTopbarActions">
        <ThemeToggle />

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="bell"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="الإشعارات"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              border: '1px solid var(--stitch-border)',
              background: 'var(--stitch-bg-surface)',
              color: 'var(--stitch-text-primary)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444'
                }}
              />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setView('profile')}
          aria-label="فتح حسابي"
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--stitch-primary), var(--stitch-secondary))',
            border: 0,
            color: '#fff',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
          }}
        >
          {user.name.slice(0, 2)}
        </button>
      </div>
    </header>
  );
}

export default StitchTopbar;
