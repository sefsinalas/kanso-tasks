export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDueDateLabel(dateStr?: string): { label: string; color: string } | null {
  if (!dateStr) return null;

  const today = getTodayDateString();
  if (dateStr === today) {
    return { label: 'Hoy', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10' };
  }

  // Calculate day difference
  const targetDate = new Date(`${dateStr}T00:00:00`);
  const todayDate = new Date(`${today}T00:00:00`);
  const diffDays = Math.round((targetDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return { label: 'Mañana', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10' };
  }

  if (diffDays < 0) {
    return { label: `Vencida (${Math.abs(diffDays)}d)`, color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10' };
  }

  // Future date
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const formatted = `${targetDate.getDate()} ${monthNames[targetDate.getMonth()]}`;
  return { label: formatted, color: 'text-zinc-500 dark:text-zinc-400 bg-zinc-500/10' };
}

export function formatCompletedAt(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const day = d.getDate();
    const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = monthNames[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month}, ${hours}:${mins}`;
  } catch {
    return '';
  }
}
