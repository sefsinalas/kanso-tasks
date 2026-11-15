import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import { Search, X, ListTodo, Archive, Sparkles } from 'lucide-react';
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

export const BacklogView: React.FC = () => {
  const {
    tasks,
    somedayTasks,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
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

  const displayedTasks = filter === 'pending' ? tasks : somedayTasks;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderBacklog(String(active.id), String(over.id));
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Backlog Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Lista Maestra
            </h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {displayedTasks.length}
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Anota todo sin presiones. Las tareas pueden esperar aquí meses.
          </p>
        </div>

        {/* Filter Toggle: Pendientes vs Algún Día */}
        <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 self-start sm:self-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Pendientes ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('someday')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === 'someday'
                ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Algún día ({somedayTasks.length})
          </button>
        </div>
      </div>

      {/* Instant Task Capture */}
      <TaskInput
        placeholder="Añadir a la lista maestra... (Enter)"
        defaultAddToToday={false}
      />

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar tareas en la lista maestra..."
          className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-paper-darkcard text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Task List (DnD) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {displayedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-400 dark:text-zinc-600">
            <Sparkles className="w-8 h-8 stroke-[1.2] mb-2 opacity-50" />
            <p className="text-sm font-light">
              {searchQuery
                ? 'No se encontraron tareas con esa búsqueda.'
                : filter === 'pending'
                ? 'No hay tareas pendientes en la lista maestra.'
                : 'No tienes tareas en "Algún día".'}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
              Escribe una tarea arriba y presiona Enter para capturarla al instante.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayedTasks.map(t => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {displayedTasks.map(task => (
                  <TaskItem key={task.id} task={task} isTodayView={false} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
};
