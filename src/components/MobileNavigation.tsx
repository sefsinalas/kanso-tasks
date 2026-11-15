import React from 'react';
import { useTasks } from '../context/TaskContext';
import { Sun, ListTodo, CheckCheck } from 'lucide-react';
import type { MobileTab } from '../types';

export const MobileNavigation: React.FC = () => {
  const { mobileTab, setMobileTab, todayCount, tasks } = useTasks();

  const tabs: { id: MobileTab; label: string; icon: React.FC<{ className?: string }>; count?: string | number }[] = [
    {
      id: 'today',
      label: 'Hoy',
      icon: Sun,
      count: todayCount.total > 0 ? `${todayCount.completed}/${todayCount.total}` : undefined
    },
    {
      id: 'backlog',
      label: 'Backlog',
      icon: ListTodo,
      count: tasks.length > 0 ? tasks.length : undefined
    },
    {
      id: 'history',
      label: 'Historial',
      icon: CheckCheck
    }
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-paper-darkcard/90 backdrop-blur-lg border-t border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = mobileTab === tab.id;
          return (
            <button
              key={tab.id}
              data-testid={`tab-${tab.id}`}
              onClick={() => setMobileTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all ${
                isActive
                  ? 'text-zinc-950 dark:text-zinc-50 font-semibold'
                  : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.count !== undefined && (
                  <span className="absolute -top-1 -right-3 text-[9px] font-bold px-1 py-0.2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full min-w-[14px] text-center">
                    {tab.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
