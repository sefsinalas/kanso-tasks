import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import {
  Sun,
  ListTodo,
  Archive,
  Search,
  X,
  Sparkles,
  Compass,
  CheckCircle2
} from 'lucide-react';
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
    todayCount,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    reorderToday,
    reorderBacklog
  } = useTasks();

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
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-20 sm:pb-12 animate-in fade-in duration-150">
      {/* Top Filter and Search Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Tabs: Pendientes vs Algún Día */}
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

          {/* Search Bar (Discreet) */}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar tareas..."
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white/70 dark:bg-paper-darkcard/70 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Instant Task Capture */}
        <TaskInput
          placeholder={filter === 'someday' ? 'Añadir a Algún día... (Enter)' : 'Añadir nueva tarea... (Enter)'}
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
              No tienes tareas guardadas en «Algún día».
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
              <div className="py-6 px-4 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/20">
                <p className="text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
                  Hoy amanece con la mente despejada. Pulsa <span className="font-semibold text-zinc-600 dark:text-zinc-300">+ Hoy</span> en cualquier tarea de abajo para traerla aquí.
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
          <div className="relative py-2">
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
                {searchQuery
                  ? 'No se encontraron tareas con esa búsqueda.'
                  : todayTasks.length > 0
                  ? 'Todas tus tareas pendientes están seleccionadas para Hoy.'
                  : 'Tu lista maestra está vacía. Añade tus tareas arriba con Enter.'}
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
    </div>
  );
};
