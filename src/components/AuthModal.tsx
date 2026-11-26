import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { X, Lock, Mail, Check, LogOut, Server } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { user, login, loginWithGoogle, register, logout } = useTasks();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al autenticar con Google.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al autenticar. Verifica las credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const pbUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pleasant-pelican-present.ngrok-free.app';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto"
      style={{
        paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))',
        paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))'
      }}
    >
      <div className="w-full max-w-sm bg-white dark:bg-paper-darkcard rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-full"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
          {user && !user.isGuest ? 'Cuenta Sincronizada' : 'Sincronización'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
          {user && !user.isGuest
            ? 'Tus tareas se sincronizan en tiempo real entre la web y Android.'
            : 'Inicia sesión o crea una cuenta para sincronizar tus tareas en todos tus dispositivos.'}
        </p>

        {user && !user.isGuest ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
              <div className="text-zinc-400 dark:text-zinc-500 mb-1">Correo electrónico</div>
              <div className="font-medium text-zinc-800 dark:text-zinc-200 break-all">{user.email}</div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Server className="w-3.5 h-3.5" />
              <span className="truncate">Servidor: {pbUrl}</span>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar sesión
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {error}
              </div>
            )}

            {/* Botón Google */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-sm disabled:opacity-50 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
            </button>

            {/* Separador */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200/80 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-paper-darkcard px-2 text-zinc-400 dark:text-zinc-500 font-medium">
                  o con correo
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Procesando...' : isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 underline"
              >
                {isRegister
                  ? '¿Ya tienes una cuenta? Inicia sesión'
                  : '¿No tienes cuenta? Regístrate aquí'}
              </button>
            </div>
          </form>
        </div>
        )}
      </div>
    </div>
  );
};
