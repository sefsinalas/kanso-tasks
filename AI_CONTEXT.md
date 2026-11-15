# AI_CONTEXT — Kanso Tasks Codebase Architecture

> **Notice for AI Assistants**: This repository is a strictly minimalist personal task manager inspired by Autofocus (Mark Forster), FVP (Final Version Perfected), Ugmonk Analog, and Maybe (`maybe.do`).
> **DO NOT** suggest or implement: projects, subtasks, tags, color-coded priority matrices, pomodoro timers, calendar integrations, AI summaries/features, gamification or productivity scoring. Simplicity is the core feature.

---

## 1. Stack & System Overview

- **Language & Runtime**: TypeScript 5.7, Node.js 20+, React 19.
- **Bundler & Dev Server**: Vite 6. Fixed dev port is **`5180`** (`vite.config.ts`).
- **Styling**: Tailwind CSS 3.4 with custom paper palette (`#fbfbfb`, `#ffffff`, `#0c0d0e`, `#16171a`) and dark mode class strategy.
- **Drag & Drop**: `@dnd-kit/core` and `@dnd-kit/sortable` (touch and pointer sensors).
- **Mobile Container**: Capacitor 7 (`@capacitor/android`, `@capacitor/core`).
- **Offline / Local-First Database**: IndexedDB via `idb` library (`kanso_tasks_db`).
- **Primary Backend**: PocketBase 0.25 (running on Orange Pi Zero 3 via Ngrok at `https://pleasant-pelican-present.ngrok-free.app`).
- **Alternative Backend**: Supabase SQL with Row Level Security in `supabase-schema.sql`.
- **E2E Testing**: Playwright (`e2e/tasks.spec.ts`).

---

## 2. Directory Structure

```text
/Users/fede/Development/MinimalistToDoList/
├── android/                   # Native Android Capacitor wrapper
│   ├── app/build/outputs/apk/debug/app-debug.apk
│   └── local.properties       # Points to sdk.dir=/opt/homebrew/share/android-commandlinetools
├── e2e/
│   └── tasks.spec.ts          # Playwright test suite for all 10 acceptance criteria
├── public/
│   ├── favicon.svg
│   ├── manifest.json          # PWA Web App Manifest
│   └── sw.js                  # Service Worker for offline asset caching
├── scripts/
│   └── setup-pocketbase.js    # Superuser script to verify/create PocketBase collections
├── src/
│   ├── components/
│   │   ├── AuthModal.tsx      # Email auth dialog for cross-device sync
│   │   ├── BacklogView.tsx    # Master backlog list (search, DnD, someday toggle)
│   │   ├── Header.tsx         # Responsive header, sync indicator, theme toggle
│   │   ├── HistoryView.tsx    # Simple completed task list with restore action
│   │   ├── MobileNavigation.tsx # Bottom navigation bar for mobile view
│   │   ├── TaskInput.tsx      # Instant capture input (Enter key handler)
│   │   ├── TaskItem.tsx       # Task row with discrete badges and actions
│   │   └── TodayView.tsx      # Focus chain ("Mi Día") with progress counter
│   ├── context/
│   │   └── TaskContext.tsx    # Root React context, optimistic mutations, midnight rollover
│   ├── services/
│   │   ├── db.ts              # Local-first IndexedDB repository
│   │   ├── pocketbase.ts      # PocketBase client & CRUD operations
│   │   └── sync.ts            # Outbox sync queue & background pull engine
│   ├── types/
│   │   └── index.ts           # Type definitions (Task, DailySelection, SyncMutation)
│   └── utils/
│       ├── date.ts            # Local YYYY-MM-DD formatting, rollover & relative dates
│       └── id.ts              # 15-char lowercase alphanumeric ID generator [a-z0-9]{15}
├── capacitor.config.ts        # Capacitor configuration (appId: com.kanso.tasks)
├── playwright.config.ts       # Playwright E2E configuration on port 5180
├── supabase-schema.sql        # Supabase schema + RLS policies
└── vite.config.ts             # Vite configuration on port 5180
```

---

## 3. Data Entities & Invariants

### `tasks`
- `id`: `string` (`[a-z0-9]{15}`)
- `userId`: `string`
- `title`: `string` (required)
- `notes`: `string` (optional)
- `dueDate`: `string` (optional local `YYYY-MM-DD`)
- `isSomeday`: `boolean` (default `false`)
- `sortOrder`: `number` (numeric ordering in Backlog)
- `completedAt`: `string | null` (ISO timestamp when completed)
- `deletedAt`: `string | null` (soft delete for sync)

### `daily_selections`
- `id`: `string` (`[a-z0-9]{15}`)
- `userId`: `string`
- `taskId`: `string` (references `tasks.id`)
- `selectedDate`: `string` (local `YYYY-MM-DD`)
- `sortOrder`: `number` (ordering inside "Mi Día")
- `deletedAt`: `string | null`

### Key Business Invariants
1. **Never duplicate a task**: Selecting a task for Today creates a `daily_selection` record. The task remains in the Backlog.
2. **Removing from Today**: Calls `removeFromToday(taskId)`, which deletes the daily selection for today's date. The task stays in Backlog.
3. **Midnight Rollover**: Today's view query filters by `selectedDate === getTodayDateString()`. When the calendar rolls over to tomorrow, Today begins fresh and empty with 0 items; backlog tasks remain intact.
4. **Offline First**: All UI reads and writes hit IndexedDB immediately. Network calls happen asynchronously via `syncService`.

---

## 4. Build & Run Commands

```bash
# Web Development
npm run dev                  # Starts Vite at http://localhost:5180

# Build Web Bundle
npm run build                # Generates dist/

# E2E Tests (Playwright)
npx playwright test          # Runs 14 test cases (Desktop + Mobile)

# Sync with Native Android
npm run cap:sync

# Compile Android Debug APK
cd android && JAVA_HOME=/opt/homebrew/opt/openjdk@21 ./gradlew assembleDebug
# Generated APK: android/app/build/outputs/apk/debug/app-debug.apk

# Install to Android device via ADB
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
