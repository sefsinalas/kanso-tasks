-- Esquema SQL y Políticas RLS para Supabase
-- Aplicación Minimalista de Tareas (Autofocus / FVP / Ugmonk Analog)

-- 1. Tabla de Tareas (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT DEFAULT '',
    due_date TEXT DEFAULT NULL, -- Formato YYYY-MM-DD
    is_someday BOOLEAN DEFAULT FALSE,
    sort_order BIGINT DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Índices para búsquedas rápidas y sincronización
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON public.tasks(completed_at);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON public.tasks(sort_order);

-- 2. Tabla de Selecciones Diarias (daily_selections)
-- Una tarea seleccionada para hoy continúa existiendo en Backlog sin duplicarse
CREATE TABLE IF NOT EXISTS public.daily_selections (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    selected_date TEXT NOT NULL, -- Formato YYYY-MM-DD en zona horaria local
    sort_order BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Prevenir duplicados de la misma tarea en el mismo día por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_user_task_date 
ON public.daily_selections(user_id, task_id, selected_date)
WHERE deleted_at IS NULL;

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_selections ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS para `tasks` (cada usuario accede exclusivamente a sus datos)
CREATE POLICY "Usuarios pueden ver sus propias tareas"
ON public.tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus propias tareas"
ON public.tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus propias tareas"
ON public.tasks FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus propias tareas"
ON public.tasks FOR DELETE
USING (auth.uid() = user_id);

-- 5. Políticas RLS para `daily_selections`
CREATE POLICY "Usuarios pueden ver sus selecciones diarias"
ON public.daily_selections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden insertar sus selecciones diarias"
ON public.daily_selections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar sus selecciones diarias"
ON public.daily_selections FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden eliminar sus selecciones diarias"
ON public.daily_selections FOR DELETE
USING (auth.uid() = user_id);
