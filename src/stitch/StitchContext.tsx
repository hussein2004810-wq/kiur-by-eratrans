import React, { createContext, useContext } from 'react';
import type { Catalog, Test } from '../RealAppV2';

export interface StitchUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'admin' | 'owner';
  universityName?: string | null;
  collegeName?: string | null;
  departmentName?: string | null;
  phaseName?: string | null;
  sectionName?: string | null;
  permissions?: string[];
}

export interface StitchHistoryItem {
  id: string;
  title: string;
  subject: string;
  percentage: number;
  finishedAt: string;
  passed: number;
}

export interface StitchContextValue {
  user: StitchUser;
  catalog: Catalog;
  tests: Test[];
  history: StitchHistoryItem[];
  summary: { completed: number; passed: number; averagePercentage: number };
  view: string;
  setView: (view: string) => void;
  search: string;
  setSearch: (query: string) => void;
  startExam: (testId: string) => void;
  startingId: string | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  notifications: Array<{ id: string; title: string; message: string; createdAt: string; readAt?: string | null }>;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  openSmartReview: (tab?: 'flashcards' | 'quiz' | 'stats') => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  logout: () => Promise<void>;
  notify: (message: string) => void;
}

const StitchContext = createContext<StitchContextValue | null>(null);

export function useStitch(): StitchContextValue {
  const context = useContext(StitchContext);
  if (!context) {
    throw new Error('useStitch must be used within a StitchProvider');
  }
  return context;
}

export const StitchProvider = StitchContext.Provider;
export default StitchContext;
