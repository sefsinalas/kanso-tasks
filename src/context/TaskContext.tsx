import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import type { Task, DailySelection, UserSession, ViewFilter, MobileTab } from '../types';
import { localDb } from '../services/db';
import { pocketbaseService, pb } from '../services/pocketbase';
import { syncService } from '../services/sync';
import { generateId } from '../utils/id';
import { getTodayDateString } from '../utils/date';

interface TaskContextType {
  tasks: Task[];
  backlogTasks: Task[];
  somedayTasks: Task[];
  completedTasks: Task[];
  todayTasks: Task[];
  todaySelections: DailySelection[];
  todayCount: { completed: number; total: number };
  filter: ViewFilter;
  setFilter: (f: ViewFilter) => void;
  mobileTab: MobileTab;
  setMobileTab: (tab: MobileTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  user: UserSession | null;
  syncStatus: string;
  todayDate: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isTodaySelection: (taskId: string) => boolean;
  createTask: (title: string, options?: { notes?: string; dueDate?: string; isSomeday?: boolean; addToToday?: boolean }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleCompleteTask: (id: string) => Promise<void>;
  addToToday: (taskId: string) => Promise<void>;
  removeFromToday: (taskId: string) => Promise<void>;
  reorderBacklog: (activeId: string, overId: string) => Promise<void>;
  reorderToday: (activeId: string, overId: string) => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  syncNow: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [dailySelections, setDailySelections] = useState<DailySelection[]>([]);
  const [filter, setFilter] = useState<ViewFilter>('pending');
  const [mobileTab, setMobileTab] = useState<MobileTab>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<UserSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('idle');
  const [todayDate, setTodayDate] = useState<string>(getTodayDateString());
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mobileRedirectUrl, setMobileRedirectUrl] = useState<string | null>(null);

  // Load initial theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('kanso-theme') as 'light' | 'dark' | null;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemDark ? 'dark' : 'light');
    setTheme(initialTheme);
    applyThemeClass(initialTheme);
  }, []);

  const applyThemeClass = (t: 'light' | 'dark') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#0c0d0e');
    } else {
      document.documentElement.classList.remove('dark');
      const meta = document.getElementById('theme-color-meta');
      if (meta) meta.setAttribute('content', '#ffffff');
    }
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('kanso-theme', next);
    applyThemeClass(next);
  };

  // Ensure current user or guest user ID
  const effectiveUserId = useMemo(() => {
    if (user && user.id) return user.id;
    let guestId = localStorage.getItem('kanso-guest-id');
    if (!guestId) {
      guestId = 'guest_' + generateId();
      localStorage.setItem('kanso-guest-id', guestId);
    }
    return guestId;
  }, [user]);

  // Load local data
  const loadData = useCallback(async () => {
    const loadedTasks = await localDb.getAllTasks();
    const loadedSelections = await localDb.getAllDailySelections();
    setAllTasks(loadedTasks);
    setDailySelections(loadedSelections);
  }, []);

  // Check midnight rollover periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getTodayDateString();
      if (current !== todayDate) {
        setTodayDate(current);
        loadData();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [todayDate, loadData]);

  // Init auth & sync
  useEffect(() => {
    // Check OAuth2 redirect code
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (code) {
      if (state && state.startsWith('mobile_')) {
        const appUrl = `com.kanso.tasks://oauth?code=${encodeURIComponent(code)}`;
        setMobileRedirectUrl(appUrl);
        window.location.href = appUrl;
        return;
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      pocketbaseService.handleOAuthCallback(code).then(async (session) => {
        if (session) {
          setUser(session);
          await syncService.syncAll();
          await loadData();
        }
      }).catch(err => {
        console.error('Failed to complete OAuth callback:', err);
      });
    }

    const currentPbUser = pocketbaseService.getCurrentUser();
    if (currentPbUser) {
      setUser(currentPbUser);
    } else {
      setUser({
        id: effectiveUserId,
        email: 'local@device',
        isGuest: true
      });
    }

    loadData();

    // Subscribe to sync service
    const unsubscribe = syncService.subscribe(status => {
      setSyncStatus(status);
      if (status === 'idle') {
        loadData();
      }
    });

    syncService.startPeriodicSync();

    return () => {
      unsubscribe();
      syncService.stopPeriodicSync();
    };
  }, [effectiveUserId, loadData]);

  // Handle native deep link callback from OAuth
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handleOAuthUrl = async (rawUrl: string) => {
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol === 'com.kanso.tasks:' && (parsed.host === 'oauth' || parsed.pathname.includes('oauth'))) {
          const code = parsed.searchParams.get('code');
          if (code) {
            await Browser.close().catch(() => {});
            const session = await pocketbaseService.handleOAuthCallback(code);
            if (session) {
              setUser(session);
              await syncService.syncAll();
              await loadData();
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse OAuth URL on native app:', err);
      }
    };

    CapApp.getLaunchUrl().then(launch => {
      if (launch?.url) handleOAuthUrl(launch.url);
    });

    const sub = CapApp.addListener('appUrlOpen', data => {
      if (data?.url) handleOAuthUrl(data.url);
    });

    return () => {
      sub.then(h => h.remove()).catch(() => {});
    };
  }, [loadData]);

  // Derived task collections
  const tasks = useMemo(() => {
    return allTasks
      .filter(t => !t.isSomeday && !t.completedAt && !t.deletedAt)
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allTasks, searchQuery]);

  const somedayTasks = useMemo(() => {
    return allTasks
      .filter(t => t.isSomeday && !t.completedAt && !t.deletedAt)
      .filter(t => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [allTasks, searchQuery]);

  const completedTasks = useMemo(() => {
    return allTasks
      .filter(t => !!t.completedAt && !t.deletedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
  }, [allTasks]);

  // Today selections & tasks
  const todaySelections = useMemo(() => {
    return dailySelections
      .filter(s => s.selectedDate === todayDate && !s.deletedAt)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [dailySelections, todayDate]);

  const backlogTasks = useMemo(() => {
    const todayTaskIds = new Set(todaySelections.map(s => s.taskId));
    return tasks.filter(t => !todayTaskIds.has(t.id));
  }, [tasks, todaySelections]);

  const todayTasks = useMemo(() => {
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    const result: Task[] = [];
    for (const s of todaySelections) {
      const task = taskMap.get(s.taskId);
      if (task && !task.deletedAt) {
        result.push(task);
      }
    }
    return result;
  }, [todaySelections, allTasks]);

  const todayCount = useMemo(() => {
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => !!t.completedAt).length;
    return { completed, total };
  }, [todayTasks]);

  const isTodaySelection = useCallback((taskId: string) => {
    return todaySelections.some(s => s.taskId === taskId && !s.deletedAt);
  }, [todaySelections]);

  // Actions
  const createTask = async (
    title: string,
    options?: { notes?: string; dueDate?: string; isSomeday?: boolean; addToToday?: boolean }
  ): Promise<Task> => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) throw new Error('Title cannot be empty');

    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateId(),
      userId: effectiveUserId,
      title: trimmedTitle,
      notes: options?.notes || '',
      dueDate: options?.dueDate || undefined,
      isSomeday: !!options?.isSomeday,
      sortOrder: Date.now(),
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };

    // Optimistic local update
    setAllTasks(prev => [...prev, newTask]);
    await localDb.saveTask(newTask);
    await syncService.recordTaskMutation(newTask, 'create');

    if (options?.addToToday) {
      await addToToday(newTask.id);
    }

    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
    const existing = allTasks.find(t => t.id === id);
    if (!existing) return;

    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setAllTasks(prev => prev.map(t => t.id === id ? updated : t));
    await localDb.saveTask(updated);
    await syncService.recordTaskMutation(updated, 'update');
  };

  const deleteTask = async (id: string): Promise<void> => {
    const existing = allTasks.find(t => t.id === id);
    if (!existing) return;

    const deleted: Task = {
      ...existing,
      deletedAt: new Date().toISOString()
    };

    setAllTasks(prev => prev.filter(t => t.id !== id));
    await localDb.deleteTask(id);
    await syncService.recordTaskMutation(deleted, 'delete');

    // Also remove from daily selections
    const selection = dailySelections.find(s => s.taskId === id && !s.deletedAt);
    if (selection) {
      await removeFromToday(id);
    }
  };

  const toggleCompleteTask = async (id: string): Promise<void> => {
    const existing = allTasks.find(t => t.id === id);
    if (!existing) return;

    const isCompleting = !existing.completedAt;
    const completedAt = isCompleting ? new Date().toISOString() : null;

    const updated: Task = {
      ...existing,
      completedAt,
      updatedAt: new Date().toISOString()
    };

    setAllTasks(prev => prev.map(t => t.id === id ? updated : t));
    await localDb.saveTask(updated);
    await syncService.recordTaskMutation(updated, 'update');
  };

  const addToToday = async (taskId: string): Promise<void> => {
    // Check if already in today
    const exists = todaySelections.some(s => s.taskId === taskId && !s.deletedAt);
    if (exists) return;

    const now = new Date().toISOString();
    const newSelection: DailySelection = {
      id: generateId(),
      userId: effectiveUserId,
      taskId,
      selectedDate: todayDate,
      sortOrder: todaySelections.length,
      createdAt: now,
      deletedAt: null
    };

    setDailySelections(prev => [...prev, newSelection]);
    await localDb.saveDailySelection(newSelection);
    await syncService.recordDailySelectionMutation(newSelection, 'create');
  };

  const removeFromToday = async (taskId: string): Promise<void> => {
    const target = dailySelections.find(s => s.taskId === taskId && s.selectedDate === todayDate && !s.deletedAt);
    if (!target) return;

    const deletedTarget: DailySelection = {
      ...target,
      deletedAt: new Date().toISOString()
    };

    setDailySelections(prev => prev.filter(s => s.id !== target.id));
    await localDb.deleteDailySelection(target.id);
    await syncService.recordDailySelectionMutation(deletedTarget, 'delete');
  };

  const reorderBacklog = async (activeId: string, overId: string): Promise<void> => {
    if (activeId === overId) return;

    const activeIndex = tasks.findIndex(t => t.id === activeId);
    const overIndex = tasks.findIndex(t => t.id === overId);
    if (activeIndex < 0 || overIndex < 0) return;

    const reordered = [...tasks];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    // Re-assign sort orders
    const updatedTasks: Task[] = reordered.map((t, idx) => ({
      ...t,
      sortOrder: idx * 10,
      updatedAt: new Date().toISOString()
    }));

    setAllTasks(prev => {
      const map = new Map(updatedTasks.map(t => [t.id, t]));
      return prev.map(t => map.get(t.id) || t);
    });

    for (const t of updatedTasks) {
      await localDb.saveTask(t);
      await syncService.recordTaskMutation(t, 'update');
    }
  };

  const reorderToday = async (activeId: string, overId: string): Promise<void> => {
    if (activeId === overId) return;

    const activeIndex = todaySelections.findIndex(s => s.taskId === activeId);
    const overIndex = todaySelections.findIndex(s => s.taskId === overId);
    if (activeIndex < 0 || overIndex < 0) return;

    const reordered = [...todaySelections];
    const [moved] = reordered.splice(activeIndex, 1);
    reordered.splice(overIndex, 0, moved);

    const updatedSelections: DailySelection[] = reordered.map((s, idx) => ({
      ...s,
      sortOrder: idx * 10
    }));

    setDailySelections(prev => {
      const map = new Map(updatedSelections.map(s => [s.id, s]));
      return prev.map(s => map.get(s.id) || s);
    });

    for (const s of updatedSelections) {
      await localDb.saveDailySelection(s);
      await syncService.recordDailySelectionMutation(s, 'update');
    }
  };

  const login = async (email: string, pass: string): Promise<void> => {
    const session = await pocketbaseService.login(email, pass);
    setUser(session);
    await syncService.syncAll();
    await loadData();
  };

  const loginWithGoogle = async (): Promise<void> => {
    await pocketbaseService.loginWithGoogle();
  };

  const register = async (email: string, pass: string): Promise<void> => {
    const session = await pocketbaseService.register(email, pass);
    setUser(session);
    await syncService.syncAll();
    await loadData();
  };

  const logout = () => {
    pocketbaseService.logout();
    setUser({
      id: 'guest_' + generateId(),
      email: 'local@device',
      isGuest: true
    });
  };

  const syncNow = async () => {
    await syncService.syncAll();
    await loadData();
  };

  if (mobileRedirectUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-paper-light dark:bg-paper-dark text-center select-none">
        <div className="w-10 h-10 border-2 border-stone-300 border-t-stone-800 dark:border-stone-700 dark:border-t-stone-200 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-medium text-stone-900 dark:text-stone-100 mb-2 font-serif">
          Abriendo Kanso Tasks...
        </h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-6 max-w-xs leading-relaxed">
          Redirigiendo a la app para completar tu inicio de sesión con Google.
        </p>
        <a
          href={mobileRedirectUrl}
          className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Toca aquí si no se abre automáticamente
        </a>
      </div>
    );
  }

  return (
    <TaskContext.Provider
      value={{
        tasks,
        backlogTasks,
        somedayTasks,
        completedTasks,
        todayTasks,
        todaySelections,
        todayCount,
        filter,
        setFilter,
        mobileTab,
        setMobileTab,
        searchQuery,
        setSearchQuery,
        user,
        syncStatus,
        todayDate,
        theme,
        toggleTheme,
        isTodaySelection,
        createTask,
        updateTask,
        deleteTask,
        toggleCompleteTask,
        addToToday,
        removeFromToday,
        reorderBacklog,
        reorderToday,
        login,
        loginWithGoogle,
        register,
        logout,
        syncNow
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within a TaskProvider');
  return context;
}
