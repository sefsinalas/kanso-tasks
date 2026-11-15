import React from 'react';
import { useTasks } from '../context/TaskContext';
import { TaskItem } from './TaskItem';
import { TaskInput } from './TaskInput';
import { Sun, CheckCircle2, ArrowLeftRight, Check, Compass } from 'lucide-react';
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

export const TodayView: React.FC = () => {
  const {
    todayTasks,
    todayCount,
    reorderToday,
    setMobileTab
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderToday(String(active.id), String(over.id));
    }
  };

  const allCompleted = todayCount.total > 0 && todayCount.completed === todayCount.total;

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Today Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              Mi Día
            </h2>
            {todayCount.total > 0 && (
              <span data-testid="today-counter" className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {todayCount.completed} de {todayCount.total}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Solo lo que decidiste hacer hoy. Sin sobrecarga.
          </p>
        </div>

        {/* Small subtle visual indicator if all done */}
        {allCompleted && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ¡Día completado!
          </div>
        )}
      </div>

      {/* Instant capture directly to Today */}
      <TaskInput
        placeholder="Añadir tarea directamente a Hoy... (Enter)"
        defaultAddToToday={true}
      />

      {/* Task List (DnD) */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {todayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-paper-darkcard/40 my-auto">
            <Compass className="w-9 h-9 stroke-[1.2] text-zinc-400 dark:text-zinc-600 mb-3 opacity-60" />
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Hoy inicia con la mente despejada
            </h3>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Elige 3 a 5 tareas de tu lista maestra pulsando el botón <span className="font-semibold text-zinc-600 dark:text-zinc-300">+ Hoy</span> o escribe una arriba.
            </p>
            <button
              onClick={() => setMobileTab('backlog')}
              className="mt-4 inline-flex sm:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium"
            >
              Ir a la Lista Maestra
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
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
    </div>
  );
};
