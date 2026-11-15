import React, { useState } from 'react';
import type { Task } from '../types';
import { useTasks } from '../context/TaskContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Check,
  Sun,
  MinusCircle,
  FileText,
  Calendar,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
  Archive
} from 'lucide-react';
import { formatDueDateLabel, formatCompletedAt, getTodayDateString } from '../utils/date';

interface TaskItemProps {
  task: Task;
  isTodayView?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, isTodayView = false }) => {
  const {
    toggleCompleteTask,
    addToToday,
    removeFromToday,
    isTodaySelection,
    updateTask,
    deleteTask
  } = useTasks();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.notes || '');
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const [editIsSomeday, setEditIsSomeday] = useState(task.isSomeday);
  const [showNotes, setShowNotes] = useState(false);

  // DnD sortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  const isCompleted = !!task.completedAt;
  const inToday = isTodaySelection(task.id);
  const dueInfo = formatDueDateLabel(task.dueDate);

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editTitle.trim()) return;

    await updateTask(task.id, {
      title: editTitle.trim(),
      notes: editNotes.trim() || undefined,
      dueDate: editDueDate || undefined,
      isSomeday: editIsSomeday
    });
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl transition-all duration-150 border ${
        isDragging
          ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-400 dark:border-zinc-500 shadow-lg'
          : 'bg-white dark:bg-paper-darkcard border-zinc-200/70 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm'
      }`}
    >
      <div className="flex items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-2.5">
        {/* Drag Handle */}
        {!isCompleted && (
          <button
            {...attributes}
            {...listeners}
            aria-label="Reordenar tarea"
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-1 text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-400 rounded transition-colors touch-none mt-0.5 sm:mt-0"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Checkbox */}
        <button
          onClick={() => toggleCompleteTask(task.id)}
          data-testid="btn-toggle-complete"
          aria-label={isCompleted ? 'Desmarcar tarea' : 'Completar tarea'}
          className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-150 mt-0.5 sm:mt-0 ${
            isCompleted
              ? 'bg-emerald-600 dark:bg-emerald-500 text-white border-transparent'
              : 'border border-zinc-300 dark:border-zinc-600 hover:border-zinc-500 dark:hover:border-zinc-400 text-transparent hover:text-zinc-400'
          }`}
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        {/* Title & info or Edit Form */}
        <div className="flex-1 min-w-0 pr-1">
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="space-y-2 py-1">
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                autoFocus
                className="w-full text-xs sm:text-sm font-medium bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-800/60 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={e => setEditDueDate(e.target.value)}
                    className="text-xs bg-zinc-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-zinc-700 dark:text-zinc-300"
                  />
                  <label className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <input
                      type="checkbox"
                      checked={editIsSomeday}
                      onChange={e => setEditIsSomeday(e.target.checked)}
                      className="rounded"
                    />
                    Algún día
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded text-xs font-medium"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  onClick={() => setIsEditing(true)}
                  className={`text-xs sm:text-sm font-normal cursor-pointer select-text transition-all duration-150 break-words ${
                    isCompleted
                      ? 'line-through text-zinc-400 dark:text-zinc-500'
                      : 'text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {task.title}
                </span>

                {/* Due Date Badge */}
                {dueInfo && !isCompleted && (
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md ${dueInfo.color}`}
                    title={`Fecha límite: ${task.dueDate}`}
                  >
                    <Calendar className="w-2.5 h-2.5" />
                    {dueInfo.label}
                  </span>
                )}

                {/* Someday Badge */}
                {task.isSomeday && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Archive className="w-2.5 h-2.5" />
                    Algún día
                  </span>
                )}

                {/* Discrete "Hoy" badge in Backlog view if task is selected for today */}
                {!isTodayView && inToday && !isCompleted && (
                  <span
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                    title="Esta tarea está seleccionada para hoy"
                  >
                    <Sun className="w-2.5 h-2.5" />
                    Hoy
                  </span>
                )}
              </div>

              {/* Completed timestamp in history view */}
              {isCompleted && task.completedAt && (
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Completada: {formatCompletedAt(task.completedAt)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Notes preview toggle button if notes exist */}
            {task.notes && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                title="Ver u ocultar notas"
                className={`p-1 rounded text-xs transition-colors ${
                  showNotes
                    ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800'
                    : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}

            {/* In Today View: Button to remove from Today WITHOUT deleting from Backlog */}
            {isTodayView && !isCompleted && (
              <button
                onClick={() => removeFromToday(task.id)}
                data-testid="btn-remove-today"
                title="Sacar de Hoy (permanece en Backlog)"
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quitar</span>
              </button>
            )}

            {/* In Backlog View: Button "+ Hoy" */}
            {!isTodayView && !isCompleted && (
              <button
                onClick={() => inToday ? removeFromToday(task.id) : addToToday(task.id)}
                data-testid="btn-add-today"
                title={inToday ? 'Quitar de Hoy' : 'Añadir a Hoy'}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  inToday
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{inToday ? 'En Hoy' : '+ Hoy'}</span>
              </button>
            )}

            {/* Edit button */}
            <button
              onClick={() => setIsEditing(true)}
              title="Editar tarea"
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-opacity"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            {/* Delete button */}
            <button
              onClick={() => deleteTask(task.id)}
              title="Eliminar tarea"
              className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Expandable Notes display */}
      {showNotes && task.notes && (
        <div className="px-3 pb-3 pt-1 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-b-xl whitespace-pre-wrap font-sans">
          {task.notes}
        </div>
      )}
    </div>
  );
};
