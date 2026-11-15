import React, { useState, useRef, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { Plus, Calendar, FileText, Sun, Archive, X, Sparkles, Hash } from 'lucide-react';
import { getTodayDateString } from '../utils/date';
import { parseTaskInput, getTagSuggestions, type TagSuggestion } from '../utils/naturalDate';

interface TaskInputProps {
  placeholder?: string;
  defaultAddToToday?: boolean;
  onAdded?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({
  placeholder = 'Añadir tarea... (Escribe # para hoy, fechas o notas)',
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

  // Suggestions state
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [activeHashSpan, setActiveHashSpan] = useState<{ start: number; end: number; word: string } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Detect hashtag being typed
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setTitle(val);

    // Look for # before cursor
    const textBeforeCursor = val.slice(0, cursorPos);
    const hashIndex = textBeforeCursor.lastIndexOf('#');

    if (hashIndex !== -1) {
      const charBeforeHash = hashIndex > 0 ? textBeforeCursor[hashIndex - 1] : ' ';
      // Ensure # is at start or preceded by space
      if (charBeforeHash === ' ' || charBeforeHash === '\n' || hashIndex === 0) {
        const word = textBeforeCursor.slice(hashIndex);
        // Only trigger if no other space after #
        if (!word.slice(1).includes(' ')) {
          const list = getTagSuggestions(word);
          setSuggestions(list);
          setSelectedIndex(0);
          setHasNavigated(false);
          setActiveHashSpan({ start: hashIndex, end: cursorPos, word });
          return;
        }
      }
    }

    setSuggestions([]);
    setActiveHashSpan(null);
    setHasNavigated(false);
  };

  const applySuggestion = (s: TagSuggestion) => {
    if (!activeHashSpan) return;
    const before = title.slice(0, activeHashSpan.start);
    const after = title.slice(activeHashSpan.end);
    const newTitle = `${before}${s.tag} ${after}`;
    setTitle(newTitle);
    setSuggestions([]);
    setActiveHashSpan(null);
    setHasNavigated(false);

    // If tag was a quick toggle, also reflect in UI
    if (s.type === 'today') setAddToToday(true);
    if (s.type === 'someday') setIsSomeday(true);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    // Parse natural language tags from title (#hoy, #mañana, #nota...)
    const parsed = parseTaskInput(title);

    const finalTitle = parsed.title || title.trim();
    const finalAddToToday = addToToday || parsed.addToToday;
    const finalIsSomeday = isSomeday || parsed.isSomeday;
    const finalDueDate = dueDate || parsed.dueDate;

    // Combine manual notes and parsed notes
    const combinedNotes = [notes.trim(), parsed.notes?.trim()].filter(Boolean).join('\n');

    try {
      await createTask(finalTitle, {
        notes: combinedNotes || undefined,
        dueDate: finalDueDate,
        isSomeday: finalIsSomeday,
        addToToday: finalAddToToday
      });

      // Reset
      setTitle('');
      setNotes('');
      setDueDate('');
      setIsSomeday(false);
      setAddToToday(defaultAddToToday);
      setShowNotes(false);
      setIsExpanded(false);
      setSuggestions([]);
      setActiveHashSpan(null);
      setHasNavigated(false);

      if (onAdded) onAdded();
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // If suggestions are open, handle navigation
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHasNavigated(true);
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHasNavigated(true);
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[selectedIndex]);
        return;
      }
      if (e.key === 'Enter') {
        if (hasNavigated) {
          e.preventDefault();
          applySuggestion(suggestions[selectedIndex]);
          return;
        }
        // If not navigated with arrows, close suggestion popover and submit
        setSuggestions([]);
        setActiveHashSpan(null);
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        setActiveHashSpan(null);
        setHasNavigated(false);
        return;
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setShowNotes(false);
      setSuggestions([]);
      setActiveHashSpan(null);
      setHasNavigated(false);
    }
  };

  return (
    <div className="relative w-full bg-white dark:bg-paper-darkcard rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm transition-all duration-200 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 focus-within:shadow-md">
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
            onChange={handleInputChange}
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

        {/* Instant Hashtag Suggestions Popover */}
        {suggestions.length > 0 && (
          <div className="absolute left-2 right-2 top-full mt-1.5 z-40 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-800 py-1 overflow-hidden animate-in fade-in duration-100 max-h-56 overflow-y-auto">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 border-b border-zinc-100 dark:border-zinc-800">
              Atajos con # (Usa ↑ ↓ o Enter)
            </div>
            {suggestions.map((s, idx) => (
              <button
                key={s.tag}
                type="button"
                onMouseDown={e => {
                  e.preventDefault();
                  applySuggestion(s);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
                  idx === selectedIndex
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                  {s.label}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                  {s.description}
                </span>
              </button>
            ))}
          </div>
        )}

        {isExpanded && (
          <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 space-y-2 animate-in fade-in duration-100">
            {/* Quick Action Buttons with clear tooltips */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Add to today toggle with tooltip */}
                <button
                  type="button"
                  onClick={() => setAddToToday(!addToToday)}
                  title="Añadir a Mi Día (o escribe #hoy o #today en el texto)"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    addToToday
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>{addToToday ? 'En Hoy' : '+ Hoy'}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">(#hoy)</span>
                </button>

                {/* Due Date picker with tooltip */}
                <div
                  title="Fecha límite (o escribe #mañana, #23/11, #en 15 dias, #la otra semana)"
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <input
                    type="date"
                    value={dueDate}
                    min={getTodayDateString()}
                    onChange={e => setDueDate(e.target.value)}
                    className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none"
                  />
                  {dueDate ? (
                    <button
                      type="button"
                      onClick={() => setDueDate('')}
                      className="p-0.5 hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">(#mañana)</span>
                  )}
                </div>

                {/* Someday toggle with tooltip */}
                <button
                  type="button"
                  onClick={() => setIsSomeday(!isSomeday)}
                  title="Guardar en Algún día (o escribe #someday o #algundia en el texto)"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isSomeday
                      ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{isSomeday ? 'En Algún día' : 'Algún día'}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">(#someday)</span>
                </button>

                {/* Optional Note toggle with tooltip */}
                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  title="Añadir nota o detalle (o escribe #nota tu texto en el título)"
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showNotes || notes
                      ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{showNotes || notes ? 'Con Nota' : '+ Nota'}</span>
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono hidden sm:inline">(#nota)</span>
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
