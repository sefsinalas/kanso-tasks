import React, { useState } from 'react';
import { useTasks } from './context/TaskContext';
import { Header } from './components/Header';
import { UnifiedTaskView } from './components/UnifiedTaskView';
import { HistoryView } from './components/HistoryView';
import { ListTodo, CheckCheck } from 'lucide-react';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'tasks' | 'history'>('tasks');
  const { completedTasks } = useTasks();

  return (
    <div className="min-h-screen flex flex-col bg-paper-light dark:bg-paper-dark transition-colors duration-200">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Navigation Switcher: Tareas vs Historial */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
            <button
              onClick={() => setCurrentView('tasks')}
              data-testid="tab-tasks"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium transition-colors ${
                currentView === 'tasks'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Tareas
            </button>
            <button
              onClick={() => setCurrentView('history')}
              data-testid="tab-history"
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium transition-colors ${
                currentView === 'history'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Historial
              {completedTasks.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-200 dark:bg-zinc-600 text-zinc-700 dark:text-zinc-200">
                  {completedTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* View Content */}
        {currentView === 'tasks' ? (
          <UnifiedTaskView />
        ) : (
          <div className="bg-white/70 dark:bg-paper-darkcard/70 border border-zinc-200/70 dark:border-zinc-800/80 rounded-2xl p-6 shadow-sm">
            <HistoryView />
          </div>
        )}
      </main>
    </div>
  );
};
