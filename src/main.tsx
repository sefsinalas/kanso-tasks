import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { TaskProvider } from './context/TaskContext';
import { AppContent } from './App';
import './index.css';

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  </React.StrictMode>
);
