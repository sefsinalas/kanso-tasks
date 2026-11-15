/**
 * Natural Language Date & Tag Parser for Kanso Tasks
 * Zero dependencies, commercial-friendly (MIT compatible).
 * Supports human Spanish & English date expressions.
 */

export interface ParsedTaskInput {
  title: string;
  dueDate?: string; // YYYY-MM-DD
  addToToday: boolean;
  isSomeday: boolean;
  notes?: string;
}

export interface TagSuggestion {
  tag: string;
  label: string;
  description: string;
  type: 'today' | 'someday' | 'date' | 'note';
}

const MONTHS: Record<string, number> = {
  ene: 0, enero: 0, jan: 0, january: 0,
  feb: 1, febrero: 1, february: 1,
  mar: 2, marzo: 2, march: 2,
  abr: 3, abril: 3, apr: 3, april: 3,
  may: 4, mayo: 4,
  jun: 5, junio: 5, june: 5,
  jul: 6, julio: 6, july: 6,
  ago: 7, agosto: 7, aug: 7, august: 7,
  sep: 8, sept: 8, septiembre: 8, september: 8,
  oct: 9, octubre: 9, october: 9,
  nov: 10, noviembre: 10, november: 10,
  dic: 11, diciembre: 11, dec: 11, december: 11
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0, dom: 0, sunday: 0, sun: 0,
  lunes: 1, lun: 1, monday: 1, mon: 1,
  martes: 2, mar: 2, tuesday: 2, tue: 2,
  miercoles: 3, miércoles: 3, mie: 3, mié: 3, wednesday: 3, wed: 3,
  jueves: 4, jue: 4, thursday: 4, thu: 4,
  viernes: 5, vie: 5, friday: 5, fri: 5,
  sabado: 6, sábado: 6, sab: 6, sáb: 6, saturday: 6, sat: 6
};

export function formatYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a natural language date expression.
 * Returns a YYYY-MM-DD string or null if not recognized.
 */
export function parseNaturalDate(expr: string, refDate = new Date()): string | null {
  const clean = expr.toLowerCase().trim().replace(/^#/, '');
  const y = refDate.getFullYear();
  const m = refDate.getMonth();
  const d = refDate.getDate();

  // 1. Hoy / Today
  if (clean === 'hoy' || clean === 'today') {
    return formatYYYYMMDD(refDate);
  }

  // 2. Mañana / Tomorrow
  if (clean === 'mañana' || clean === 'manana' || clean === 'tomorrow') {
    return formatYYYYMMDD(new Date(y, m, d + 1));
  }

  // 3. Pasado mañana
  if (clean === 'pasado mañana' || clean === 'pasadomañana' || clean === 'pasadomanana' || clean === 'pasado manana') {
    return formatYYYYMMDD(new Date(y, m, d + 2));
  }

  // 4. en X dias / in X days
  const inDaysMatch = clean.match(/^en\s+(\d+)\s*(?:dias|días|d)$/) || clean.match(/^in\s+(\d+)\s*days?$/);
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1], 10);
    return formatYYYYMMDD(new Date(y, m, d + days));
  }

  // 5. en X semanas / in X weeks
  const inWeeksMatch = clean.match(/^en\s+(\d+)\s*(?:semanas?|sem)$/) || clean.match(/^in\s+(\d+)\s*weeks?$/);
  if (inWeeksMatch) {
    const weeks = parseInt(inWeeksMatch[1], 10);
    return formatYYYYMMDD(new Date(y, m, d + weeks * 7));
  }

  // 6. la otra semana / proxima semana
  if (
    clean === 'la otra semana' ||
    clean === 'laotrasemana' ||
    clean === 'proxima semana' ||
    clean === 'próxima semana' ||
    clean === 'proximasemana' ||
    clean === 'next week'
  ) {
    return formatYYYYMMDD(new Date(y, m, d + 7));
  }

  // 7. finde / fin de semana
  if (clean === 'este fin de semana' || clean === 'finde' || clean === 'fin de semana' || clean === 'el finde' || clean === 'weekend') {
    const dayOfWeek = refDate.getDay();
    const diff = (6 - dayOfWeek + 7) % 7 || 7;
    return formatYYYYMMDD(new Date(y, m, d + diff));
  }

  // 8. Dia de la semana: lunes, el viernes, etc.
  const strippedDay = clean.replace(/^(el|on)\s+/, '');
  if (WEEKDAYS[strippedDay] !== undefined) {
    const targetDay = WEEKDAYS[strippedDay];
    const currentDay = refDate.getDay();
    let diff = (targetDay - currentDay + 7) % 7;
    if (diff === 0) diff = 7; // Next occurrence
    return formatYYYYMMDD(new Date(y, m, d + diff));
  }

  // 9. Formatos numericos: DD/MM o DD/MM/YYYY o DD-MM
  const dateMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (dateMatch) {
    const day = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : y;
    if (year < 100) year += 2000;
    if (!dateMatch[3]) {
      const candidate = new Date(y, month, day);
      if (candidate.getTime() < new Date(y, m, d).getTime()) {
        year = y + 1;
      }
    }
    return formatYYYYMMDD(new Date(year, month, day));
  }

  // 10. Formato texto: "15 nov", "23 de diciembre", etc.
  const textDateMatch = clean.match(/^(\d{1,2})\s*(?:de\s+)?([a-záéíóúñ]+)$/);
  if (textDateMatch) {
    const day = parseInt(textDateMatch[1], 10);
    const monthName = textDateMatch[2].toLowerCase();
    if (MONTHS[monthName] !== undefined) {
      const month = MONTHS[monthName];
      let year = y;
      const candidate = new Date(y, month, day);
      if (candidate.getTime() < new Date(y, m, d).getTime()) {
        year = y + 1;
      }
      return formatYYYYMMDD(new Date(year, month, day));
    }
  }

  return null;
}

/**
 * Parses full user input and extracts smart tags like:
 * - #hoy / #today
 * - #someday / #later / #algun dia
 * - #mañana, #23/11, #en 15 dias, #la otra semana
 * - #nota: mi nota o cualquier #texto_largo
 */
export function parseTaskInput(input: string, refDate = new Date()): ParsedTaskInput {
  let text = input.trim();
  let addToToday = false;
  let isSomeday = false;
  let dueDate: string | undefined = undefined;
  const notesList: string[] = [];

  // Match all tags starting with # up to next # or end of string
  // Tags can be #tag or #tag with spaces if enclosed or before another tag
  // We use regex to identify #tokens
  const tagRegex = /#([a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\/\-]+(?:\s+[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\/\-]+)*)/g;

  let match: RegExpExecArray | null;
  const matchedSpans: { full: string; content: string }[] = [];

  while ((match = tagRegex.exec(input)) !== null) {
    matchedSpans.push({ full: match[0], content: match[1].trim() });
  }

  for (const item of matchedSpans) {
    const rawContent = item.content;
    const lowerContent = rawContent.toLowerCase();

    // Check 1: Today
    if (lowerContent === 'hoy' || lowerContent === 'today') {
      addToToday = true;
      text = text.replace(item.full, ' ');
      continue;
    }

    // Check 2: Someday
    if (
      lowerContent === 'someday' ||
      lowerContent === 'later' ||
      lowerContent === 'algundia' ||
      lowerContent === 'algun dia' ||
      lowerContent === 'algún día' ||
      lowerContent === 'algun-dia'
    ) {
      isSomeday = true;
      text = text.replace(item.full, ' ');
      continue;
    }

    // Check 3: Note prefix #nota: ... or #nota ... or #n: ...
    const notePrefix = rawContent.match(/^(?:nota|note|n)[\s:](.+)$/i);
    if (notePrefix) {
      notesList.push(notePrefix[1].trim());
      text = text.replace(item.full, ' ');
      continue;
    }

    // Check 4: Natural Date
    const parsedDate = parseNaturalDate(rawContent, refDate);
    if (parsedDate) {
      dueDate = parsedDate;
      text = text.replace(item.full, ' ');
      continue;
    }

    // Check 5: If it's a multi-word or custom note tag, treat as note!
    // E.g. #llamar antes de las 5 y pedir presupuesto
    if (rawContent.length > 3) {
      notesList.push(rawContent);
      text = text.replace(item.full, ' ');
    }
  }

  // Clean extra spaces from title
  const cleanTitle = text.replace(/\s+/g, ' ').trim();

  return {
    title: cleanTitle,
    dueDate,
    addToToday,
    isSomeday,
    notes: notesList.length > 0 ? notesList.join('\n') : undefined
  };
}

/**
 * Returns instant hashtag suggestions based on what user has typed so far.
 */
export function getTagSuggestions(currentWord: string, refDate = new Date()): TagSuggestion[] {
  const query = currentWord.replace(/^#/, '').toLowerCase().trim();

  // Next week date
  const nextWeek = new Date(refDate);
  nextWeek.setDate(refDate.getDate() + 7);

  // Tomorrow date
  const tomorrow = new Date(refDate);
  tomorrow.setDate(refDate.getDate() + 1);

  const baseSuggestions: TagSuggestion[] = [
    {
      tag: '#hoy',
      label: '#hoy',
      description: 'Marcar para Mi Día',
      type: 'today'
    },
    {
      tag: '#mañana',
      label: `#mañana (${formatYYYYMMDD(tomorrow)})`,
      description: 'Fecha límite: mañana',
      type: 'date'
    },
    {
      tag: '#en 15 dias',
      label: '#en 15 dias',
      description: 'Fecha límite: en 15 días',
      type: 'date'
    },
    {
      tag: '#la otra semana',
      label: `#la otra semana (${formatYYYYMMDD(nextWeek)})`,
      description: 'Fecha límite: próxima semana',
      type: 'date'
    },
    {
      tag: '#el viernes',
      label: '#el viernes',
      description: 'Fecha límite: próximo viernes',
      type: 'date'
    },
    {
      tag: '#someday',
      label: '#someday / #algundia',
      description: 'Guardar en Algún Día',
      type: 'someday'
    },
    {
      tag: '#nota: ',
      label: '#nota: [texto]',
      description: 'Añadir nota o detalle a la tarea',
      type: 'note'
    }
  ];

  if (!query) return baseSuggestions;

  // Filter matching suggestions
  const filtered = baseSuggestions.filter(s =>
    s.tag.toLowerCase().includes(query) ||
    s.description.toLowerCase().includes(query)
  );

  // Check if user is typing a custom date like #23/11 or #en 3 dias
  const customDate = parseNaturalDate(query, refDate);
  if (customDate) {
    filtered.unshift({
      tag: `#${query}`,
      label: `#${query} → ${customDate}`,
      description: 'Fecha límite detectada',
      type: 'date'
    });
  }

  // If user typed custom text like #llamar a pedro
  if (filtered.length === 0 && query.length > 1) {
    filtered.push({
      tag: `#nota: ${query}`,
      label: `#nota: ${query}`,
      description: 'Guardar como nota',
      type: 'note'
    });
  }

  return filtered;
}
