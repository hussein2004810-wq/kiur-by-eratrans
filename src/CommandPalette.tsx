import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  ClipboardList,
  HeartPulse,
  History,
  Trophy,
  UserRound,
  Settings2,
  X,
  ChevronLeft,
  GraduationCap
} from 'lucide-react';
import type { MainView, Test, Catalog } from './RealAppV2';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: MainView) => void;
  onSelectTest: (testId: string) => void;
  tests: Test[];
  catalog: Catalog | null;
  userRole?: string;
}

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onSelectTest,
  tests,
  catalog,
  userRole
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        }
      }
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const navItems = [
      { id: 'home', title: 'الرئيسية (لوحة المذاكرة الطبية)', category: 'التنقل', icon: BookOpen, action: () => onNavigate('home') },
      { id: 'tests', title: 'المواد والاختبارات', category: 'التنقل', icon: ClipboardList, action: () => onNavigate('tests') },
      { id: 'glimpses', title: 'اللمحات السريرية الطبية', category: 'التنقل', icon: HeartPulse, action: () => onNavigate('glimpses') },
      { id: 'history', title: 'سجل النتائج والشهادات', category: 'التنقل', icon: History, action: () => onNavigate('history') },
      ...(userRole === 'student' ? [{ id: 'points', title: 'لوحة نقاطي والرتبة السريرية', category: 'التنقل', icon: Trophy, action: () => onNavigate('points') }] : []),
      { id: 'profile', title: 'الملف الشخصي والحساب', category: 'التنقل', icon: UserRound, action: () => onNavigate('profile') },
      ...(['owner', 'admin', 'teacher'].includes(userRole || '') ? [{ id: 'admin', title: 'لوحة الإشراف وإدارة المنصة', category: 'الإدارة', icon: Settings2, action: () => onNavigate('admin') }] : [])
    ];

    const matchedNav = q ? navItems.filter(item => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) : navItems;

    const matchedTests = q
      ? tests
          .filter(t => t.title.toLowerCase().includes(q) || (t.subjectName || t.subject || '').toLowerCase().includes(q) || (t.lectureName || t.lecture || '').toLowerCase().includes(q))
          .slice(0, 5)
          .map(t => ({
            id: `test-${t.id}`,
            title: t.title,
            category: t.subjectName || t.subject || 'اختبار',
            icon: ClipboardList,
            action: () => onSelectTest(t.id)
          }))
      : [];

    const matchedSubjects = q && catalog
      ? catalog.subjects
          .filter(s => s.name.toLowerCase().includes(q))
          .slice(0, 4)
          .map(s => ({
            id: `subject-${s.id}`,
            title: s.name,
            category: 'مادة دراسية',
            icon: GraduationCap,
            action: () => {
              onNavigate('tests');
            }
          }))
      : [];

    return [...matchedNav, ...matchedTests, ...matchedSubjects];
  }, [query, tests, catalog, userRole, onNavigate, onSelectTest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (items.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + (items.length || 1)) % (items.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
        onClose();
      }
    }
  };

  if (!open) return null;

  return (
    <div className="commandPaletteBackdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="أوامر المنصة السريعة">
      <div className="commandPaletteModal" onClick={e => e.stopPropagation()}>
        <div className="commandInputWrap">
          <Search className="commandSearchIcon" size={20} />
          <input
            ref={inputRef}
            className="commandInput"
            type="text"
            placeholder="ابحث عن اختبار، مادة، أو تنقل سريعًا... (Esc للإغلاق)"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <span className="commandKbd">ESC</span>
          <button type="button" className="commandCloseBtn" onClick={onClose} aria-label="إغلاق">
            <X size={18} />
          </button>
        </div>

        <div className="commandResults">
          {items.length === 0 ? (
            <div className="commandEmpty">
              <Search size={28} />
              <p>لم نجد نتائج مطابقة لـ "{query}"</p>
            </div>
          ) : (
            items.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`commandItem ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <span className="commandItemIcon">
                    <Icon size={18} />
                  </span>
                  <div className="commandItemContent">
                    <span className="commandItemTitle">{item.title}</span>
                    <small className="commandItemCategory">{item.category}</small>
                  </div>
                  <ChevronLeft className="commandItemArrow" size={16} />
                </button>
              );
            })
          )}
        </div>

        <footer className="commandFooter">
          <span>
            استخدم <kbd>↑</kbd> <kbd>↓</kbd> للتنقل، و <kbd>Enter</kbd> للاختيار
          </span>
          <span>منصة KIUR الطبية</span>
        </footer>
      </div>
    </div>
  );
}
