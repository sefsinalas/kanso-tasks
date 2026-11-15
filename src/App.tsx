import React, { useState } from 'react';
import { useTasks } from './context/TaskContext';
import { Header } from './components/Header';
import { BacklogView } from './components/BacklogView';
import { TodayView } from './components/TodayView';
import { HistoryView } from './components/HistoryView';
import { MobileNavigation } from './components/MobileNavigation';
import { CheckCheck, Columns, Plus } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { mobileTab, setMobileTab } = useTasks();
  const [desktopView, setDesktopView] = useState<'split' | 'history'>('split');
  const [isDesktop, setIsDesktop] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 640 : true;
  });

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-paper-light dark:bg-paper-dark transition-colors duration-200">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 mb-16 sm:mb-0">
        {isDesktop ? (
          <>
            {/* Desktop View Switcher */}
            <div className="flex items-center justify-end mb-4">
              <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
                <button
                  onClick={() => setDesktopView('split')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    desktopView === 'split'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  Vista Dividida (Backlog + Hoy)
                </button>
                <button
                  onClick={() => setDesktopView('history')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    desktopView === 'history'
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Historial
                </button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="h-[calc(100vh-140px)]">
              {desktopView === 'history' ? (
                <div className="h-full max-w-3xl mx-auto bg-white/70 dark:bg-paper-darkcard/70 border border-zinc-200/70 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm overflow-hidden">
                  <HistoryView />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-6 h-full">
                  {/* Columna Izquierda: Lista Maestra (Backlog) */}
                  <div data-testid="backlog-column" className="bg-white/50 dark:bg-paper-darkcard/40 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col">
                    <BacklogView />
                  </div>

                  {/* Columna Derecha: Mi Día (Today) */}
                  <div data-testid="today-column" className="bg-white/80 dark:bg-paper-darkcard/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm overflow-hidden flex flex-col">
                    <TodayView />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Mobile Layout (Tabs: Hoy, Backlog, Historial) */
          <div className="min-h-[calc(100vh-160px)]">
            {mobileTab === 'today' && <TodayView />}
            {mobileTab === 'backlog' && <BacklogView />}
            {mobileTab === 'history' && <HistoryView />}
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation (only rendered on mobile) */}
      {!isDesktop && <MobileNavigation />}
    </div>
  );
};
