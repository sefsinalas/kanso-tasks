import React from 'react';
import { Header } from './components/Header';
import { UnifiedTaskView } from './components/UnifiedTaskView';

export const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-paper-light dark:bg-paper-dark transition-colors duration-200">
      <Header />

      {/* Main Content Area: Single Clean Stream */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <UnifiedTaskView />
      </main>
    </div>
  );
};
