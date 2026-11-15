import React, { useState, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, Calendar, FileText, Sun, Archive, X } from 'lucide-react';
import { getTodayDateString } from '../utils/date';

interface TaskInputProps {
  placeholder?: string;
  defaultAddToToday?: boolean;
  onAdded?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  placeholder = 'Añadir nueva tarea... (Presiona Enter)',
  defaultAddToToday = false,
  onAdded
}) => {
  const { createTask } = useTasks();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSomeday, setIsSomeday] = useState(false);
  const [addToToday, setAddToToday] = useState(defaultAddToToday);
  const [showNotes, setShowNotes] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await createTask(trimmed, {
        notes: notes.trim() || undefined,
        dueDate: dueDate || undefined,
        isSomeday,
        addToToday
      });

      // Reset
      setTitle('');
      setNotes('');
      setDueDate('');
      setIsSomeday(false);
      setAddToToday(defaultAddToToday);
      setShowNotes(false);
      setIsExpanded(false);

      if (onAdded) onAdded();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setShowNotes(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-paper-darkcard rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all duration-200 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:shadow-md">
      <form onSubmit={handleSubmit} className="p-2 sm:p-2.5">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            aria-label="Agregar tarea"
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            data-testid="task-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />

          {!isExpanded && (
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1"
            >
              Opciones
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2 animate-in fade-in duration-100">
            {/* Quick Action Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Add to today toggle */}
                <button
                  type="button"
                  onClick={() => setAddToToday(!addToToday)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    addToToday
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  {addToToday ? 'En Hoy' : '+ Hoy'}
                </button>

                {/* Due Date picker */}
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <input
                    type="date"
                    value={dueDate}
                    min={getTodayDateString()}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="p-0.5 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Someday toggle */}
                <button
                  type="button"
                  onClick={() => setIsSomeday(!isSomeday)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isSomeday
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  {isSomeday ? 'En Algún día' : 'Algún día'}
                </button>

                {/* Optional Note toggle */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showNotes || notes
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showNotes || notes ? 'Con Nota' : '+ Nota'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setShowNotes(false);
                  }}
                  className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-3 py-1 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Notes textarea: ONLY rendered if user explicitly clicked '+ Nota' or has notes text */}
            {(showNotes || notes) && (
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                rows={2}
                autoFocus
                className="w-full p-2 text-xs bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 animate-in fade-in duration-100"
              />
            )}
          </div>
        )}
      </form>
    </div>
  );
};
