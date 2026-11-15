# Kanso Tasks — Minimalist Focus (Web & Android)

Aplicación personal de gestión de tareas con versión Web (PWA instalable) y aplicación nativa Android, desarrollada sobre una única base de código.

Inspirada en la filosofía de **Autofocus** (Mark Forster), **Final Version Perfected (FVP)**, **Ugmonk Analog** y la pureza visual de **Maybe (`app.maybe.do`)**, **Things 3** y **Linear**.

---

## 🎯 Filosofía y Flujo de Trabajo

1. **Captura sin fricción**: Anota absolutamente todo lo que tienes en la cabeza en la **Lista Maestra (Backlog)** escribiendo y presionando `Enter`. Una tarea puede esperar meses aquí sin que nadie te presione ni te culpe.
2. **Selección consciente matutina**: Cada mañana recorre la lista y elige intuitivamente unas pocas tareas (3 a 5) con un solo clic en **+ Hoy**.
3. **Enfoque en Mi Día**: Concéntrate exclusivamente en las tareas seleccionadas para el día actual con un contador discreto (ej. `2 de 5`).
4. **Completar sin culpa**: Marca lo que logres hacer; las completadas van al **Historial**.
5. **Amanecer limpio**: Al día siguiente, la vista de **Hoy** inicia vacía. Las tareas pendientes de ayer siguen intactas en la Lista Maestra sin reprogramaciones automáticas forzadas.

> **Sin sobreingeniería**: No hay proyectos, subtareas, etiquetas, pomodoro, estimaciones de tiempo, IA invasiva ni gamificación.

---

## 🚀 Stack Tecnológico

- **Frontend**: React 19, TypeScript, Vite.
- **Estilos**: Tailwind CSS con paleta inspirada en diseño japonés y soporte completo de modo claro/oscuro.
- **Interacciones Táctiles y DnD**: `@dnd-kit` para reordenamiento fluido por arrastre tanto en web como en Android.
- **Almacenamiento Local-First**: IndexedDB (`idb`) para persistencia inmediata y funcionamiento offline 100% garantizado.
- **Backend & Sincronización**: **PocketBase** (activo en Orange Pi Zero 3 con túnel Ngrok) con cola de mutaciones offline idempotente y resolución de conflictos.
- **Alternativa Supabase**: Archivo `supabase-schema.sql` con tablas e índices y políticas RLS completas.
- **Aplicación Móvil**: **Capacitor 7** para generar la aplicación nativa Android.
- **PWA**: Manifiesto web y Service Worker para instalación en escritorio y móviles.
- **Testing**: Playwright para pruebas end-to-end de todos los criterios de aceptación.

---

## 📂 Estructura del Proyecto

```text
├── android/                   # Proyecto nativo Android generado por Capacitor
│   └── app/build/outputs/apk/ # APK generado (app-debug.apk)
├── e2e/                       # Pruebas End-to-End con Playwright
│   └── tasks.spec.ts
├── public/                    # Assets estáticos, manifest.json y sw.js
├── scripts/
│   └── setup-pocketbase.js    # Script de inicialización de colecciones en PocketBase
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx      # Modal de inicio de sesión / sincronización
│   │   ├── BacklogView.tsx    # Lista Maestra con búsqueda, filtros y DnD
│   │   ├── Header.tsx         # Barra superior con estado de sync y tema
│   │   ├── HistoryView.tsx    # Historial de completadas con restauración
│   │   ├── MobileNavigation.tsx # Barra inferior fluida para Android/móvil
│   │   ├── TaskInput.tsx      # Entrada instantánea de captura rápida
│   │   ├── TaskItem.tsx       # Fila de tarea con checkbox, badges y acciones
│   │   └── TodayView.tsx      # Vista de "Mi Día" con contador y focus chain
│   ├── context/
│   │   └── TaskContext.tsx    # Estado global, rollovers y lógica de negocio
│   ├── services/
│   │   ├── db.ts              # Repositorio Local-First en IndexedDB
│   │   ├── pocketbase.ts      # Cliente API para PocketBase
│   │   └── sync.ts            # Motor de sincronización y outbox offline
│   ├── types/
│   │   └── index.ts           # Definiciones TypeScript
│   └── utils/
│       ├── date.ts            # Formateo y cálculo de fechas locales YYYY-MM-DD
│       └── id.ts              # Generador de IDs alfanuméricos de 15 caracteres
├── capacitor.config.ts        # Configuración de Capacitor
├── supabase-schema.sql        # Esquema SQL y políticas RLS para Supabase
└── README.md
```

---

## 🛠️ Ejecución Local (Desarrollo)

### 1. Requisitos
- Node.js 18+ (recomendado Node 20+)
- npm

### 2. Instalación de dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

Contenido de `.env`:
```env
# Tipo de backend: "pocketbase" (predeterminado) o "supabase"
VITE_BACKEND_TYPE=pocketbase

# URL de PocketBase (Orange Pi con Ngrok o IP local)
VITE_POCKETBASE_URL=https://pleasant-pelican-present.ngrok-free.app

# Supabase (opcional si se usa como backend alternativo)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador `http://localhost:5173`.

---

## 📡 Configuración del Backend

### Opción A: PocketBase (Orange Pi Zero 3)
La base de datos se encuentra alojada en una Orange Pi Zero 3 con SQLite y expuesta mediante túnel estático de Ngrok:
- URL pública: `https://pleasant-pelican-present.ngrok-free.app`
- Las colecciones `tasks` y `daily_selections` ya fueron creadas y configuradas con reglas de seguridad por usuario (`@request.auth.id != "" && user = @request.auth.id`).
- Para re-ejecutar la creación de colecciones en una nueva instancia de PocketBase:
  ```bash
  node scripts/setup-pocketbase.js
  ```

### Opción B: Supabase (Alternativa)
Si prefieres utilizar Supabase:
1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve al **SQL Editor** y ejecuta todo el script [supabase-schema.sql](file:///Users/fede/Development/MinimalistToDoList/.worktrees/agent-mwi2jyi9/supabase-schema.sql).
3. Configura `VITE_BACKEND_TYPE=supabase`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en tu `.env`.

---

## 📱 Compilación y Generación del APK Android

El proyecto utiliza Capacitor con el SDK de Android configurado.

### 1. Sincronizar el build web con el proyecto Android
```bash
npm run cap:sync
```

### 2. Compilar el APK de depuración (Debug APK)
Asegúrate de tener `JAVA_HOME` apuntando a OpenJDK 21 y la ruta del Android SDK en `android/local.properties`:

```bash
cd android
JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug
```

El APK compilado queda disponible en:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### 3. Instalar el APK en un dispositivo conectado por ADB
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🧪 Pruebas End-to-End (Playwright)

Se han implementado pruebas automáticas que validan los 10 criterios de aceptación del flujo fundamental:

```bash
npx playwright test
```

Para ver el reporte interactivo:
```bash
npx playwright show-report
```

---

## 🌐 Despliegue Web (PWA)

1. Generar la carpeta de producción:
   ```bash
   npm run build
   ```
2. La carpeta `dist/` contiene la aplicación estática lista para desplegar en Netlify, Vercel, Cloudflare Pages o un servidor local Nginx.
3. Al visitar el sitio desde Google Chrome, Edge o navegadores móviles, se habilitará el botón **Instalar aplicación** para instalarla como PWA independiente con acceso offline.
