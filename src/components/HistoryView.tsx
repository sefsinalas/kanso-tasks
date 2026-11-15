import React from 'react';
import { useTasks } from '../context/TaskContext';
import { RotateCcw, CheckCheck, Trash2, Calendar } from 'lucide-react';
import { formatCompletedAt } from '../utils/date';

export const HistoryView: React.FC = () => {
  const { completedTasks, toggleCompleteTask, deleteTask } = useTasks();

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCheck className="w-5 h-5 text-emerald-500" />
              Historial
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {completedTasks.length} completadas
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Registro simple de tareas finalizadas. Puedes restaurar cualquiera si es necesario.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {completedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-400 dark:text-zinc-600">
            <CheckCheck className="w-8 h-8 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-sm font-light">Aún no hay tareas completadas.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Las tareas que vayas completando en Hoy o en la Lista Maestra aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="group flex items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-paper-darkcard border border-zinc-200/70 dark:border-zinc-800/80 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-normal text-zinc-500 dark:text-zinc-400 line-through truncate">
                    {task.title}
                  </div>
                  {task.completedAt && (
                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatCompletedAt(task.completedAt)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleCompleteTask(task.id)}
                    title="Restaurar a pendientes"
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restaurar</span>
                  </button>

                  <button
                    onClick={() => deleteTask(task.id)}
                    title="Eliminar permanentemente"
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
