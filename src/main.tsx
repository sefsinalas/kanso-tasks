import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaskProvider } from './context/TaskContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TaskProvider>
      <AppContent />
    </TaskProvider>
  </React.StrictMode>
);
