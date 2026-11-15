import React, { useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import {
  Sun,
  ListTodo,
  Archive,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  RotateCcw,
  Trash2,
  Calendar
} from 'lucide-react';
import { formatCompletedAt } from '../utils/date';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

export const UnifiedTaskView: React.FC = () => {
  const {
    todayTasks,
    backlogTasks,
    somedayTasks,
    completedTasks,
    todayCount,
    filter,
    setFilter,
    reorderToday,
    reorderBacklog,
    toggleCompleteTask,
    deleteTask
  } = useTasks();

  const [showHistory, setShowHistory] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEndToday = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderToday(String(active.id), String(over.id));
    }
  };

  const handleDragEndBacklog = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderBacklog(String(active.id), String(over.id));
    }
  };

  const allTodayCompleted = todayCount.total > 0 && todayCount.completed === todayCount.total;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-16 animate-in fade-in duration-150">
      {/* Top Filter Chips: Lista vs Algún Día */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800/60 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 text-xs">
            <button
              onClick={() => setFilter('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'pending'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Lista ({todayTasks.length + backlogTasks.length})
            </button>
            <button
              onClick={() => setFilter('someday')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === 'someday'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              Algún día ({somedayTasks.length})
            </button>
          </div>
        </div>

        {/* Instant Task Capture with Smart # Tags */}
        <TaskInput
          placeholder={filter === 'someday' ? 'Añadir a Algún día... (#nota, #fecha)' : 'Añadir tarea... (Escribe # para hoy, fechas o notas)'}
          defaultAddToToday={false}
        />
      </div>

      {/* Main Single Stream List */}
      {filter === 'someday' ? (
        /* Someday View */
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Archive className="w-4 h-4 text-purple-500" />
            <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-500 dark:text-zinc-400">
              Algún Día
            </h2>
            <span className="text-xs text-zinc-400">({somedayTasks.length})</span>
          </div>

          {somedayTasks.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-600 text-xs">
              No tienes tareas guardadas en «Algún día». Puedes etiquetarlas con <span className="font-mono text-zinc-500">#someday</span> o <span className="font-mono text-zinc-500">#algundia</span>.
            </div>
          ) : (
            <div className="space-y-2">
              {somedayTasks.map(task => (
                <TaskItem key={task.id} task={task} isTodayView={false} />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Standard View: HOY ARRIBA, LISTA MAESTRA ABAJO */
        <div className="space-y-6">
          {/* SECCIÓN 1: MI DÍA (ARRIBA) */}
          <div data-testid="today-section" className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-zinc-900 dark:text-zinc-100">
                  Mi Día
                </h2>
                {todayCount.total > 0 && (
                  <span
                    data-testid="today-counter"
                    className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                  >
                    {todayCount.completed} de {todayCount.total}
                  </span>
                )}
              </div>

              {allTodayCompleted && (
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Completado
                </div>
              )}
            </div>

            {todayTasks.length === 0 ? (
              <div className="py-5 px-4 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                  Hoy amanece despejado. Pulsa <span className="font-semibold text-zinc-600 dark:text-zinc-300">+ Hoy</span> abajo o escribe <span className="font-mono text-amber-600 dark:text-amber-400">#hoy</span> para traer tareas aquí.
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndToday}
              >
                <SortableContext
                  items={todayTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {todayTasks.map(task => (
                      <TaskItem key={task.id} task={task} isTodayView={true} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* SEPARADOR ELEGANTE */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200/60 dark:border-zinc-800/60" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-paper-light dark:bg-paper-dark px-3 text-zinc-400 dark:text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
                Lista Maestra ({backlogTasks.length})
              </span>
            </div>
          </div>

          {/* SECCIÓN 2: LISTA MAESTRA (ABAJO) */}
          <div data-testid="backlog-section" className="space-y-2.5">
            {backlogTasks.length === 0 ? (
              <div className="py-8 text-center text-zinc-400 dark:text-zinc-600 text-xs">
                {todayTasks.length > 0
                  ? 'Todas tus tareas pendientes están seleccionadas para Hoy.'
                  : 'Tu lista maestra está vacía. Añade tareas arriba con Enter.'}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEndBacklog}
              >
                <SortableContext
                  items={backlogTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {backlogTasks.map(task => (
                      <TaskItem key={task.id} task={task} isTodayView={false} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN 3: HISTORIAL EN EL FONDO (Discreto y colapsable) */}
      <div className="pt-10 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            data-testid="toggle-history-btn"
            className="flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 py-1 transition-colors group"
          >
            <CheckCheck className="w-4 h-4 text-emerald-500" />
            <span>Historial ({completedTasks.length} completadas)</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showHistory ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showHistory && (
          <div data-testid="history-section" className="mt-3 space-y-2 animate-in fade-in duration-150">
            {completedTasks.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-3 text-center">
                Aún no hay tareas completadas.
              </p>
            ) : (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <div
                    key={task.id}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/70 dark:bg-paper-darkcard/70 border border-zinc-200/60 dark:border-zinc-800/70 shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-normal text-zinc-500 dark:text-zinc-400 line-through truncate">
                        {task.title}
                      </div>
                      {task.completedAt && (
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatCompletedAt(task.completedAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => toggleCompleteTask(task.id)}
                        data-testid="btn-restore-task"
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
        )}
      </div>
    </div>
  );
};
