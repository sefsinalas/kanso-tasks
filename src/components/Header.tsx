import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { Sun, Moon, Cloud, CloudOff, RefreshCw, User, CheckCircle2 } from 'lucide-react';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const { theme, toggleTheme, syncStatus, syncNow, user } = useTasks();
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Friendly date in Spanish
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <>
      <header
        className="sticky top-0 z-20 backdrop-blur-md bg-paper-light/80 dark:bg-paper-dark/80 border-b border-zinc-200/60 dark:border-zinc-800/60 px-4 sm:px-8 py-3 transition-colors"
        style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl sm:text-2xl font-light tracking-tight text-zinc-900 dark:text-zinc-50 font-sans">
              Kanso
            </h1>
            <span className="text-xs sm:text-sm font-medium text-zinc-400 dark:text-zinc-500 hidden sm:inline">
              {capitalizedDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Sync status indicator */}
            <button
              onClick={() => syncNow()}
              title={
                syncStatus === 'syncing' ? 'Sincronizando...' :
                syncStatus === 'offline' ? 'Sin conexión (modo local)' :
                syncStatus === 'error' ? 'Error al sincronizar' : 'Sincronizado'
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {syncStatus === 'syncing' ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-zinc-500 dark:text-zinc-400" />
              ) : syncStatus === 'offline' ? (
                <CloudOff className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span className="hidden md:inline text-[11px]">
                {syncStatus === 'syncing' ? 'Sincronizando' :
                 syncStatus === 'offline' ? 'Offline' :
                 user && !user.isGuest ? 'Sincronizado' : 'Local'}
              </span>
            </button>

            {/* Auth / Account button */}
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              title={user && !user.isGuest ? `Conectado como ${user.email}` : 'Iniciar sesión para sincronizar'}
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px] max-w-[120px] truncate">
                {user && !user.isGuest ? user.email.split('@')[0] : 'Cuenta'}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema claro/oscuro"
              className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
};
