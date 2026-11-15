export interface Task {
  id: string;
  userId: string;
  title: string;
  notes?: string;
  dueDate?: string; // YYYY-MM-DD local
  isSomeday: boolean;
  sortOrder: number;
  completedAt?: string | null; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt?: string | null;
}

export interface DailySelection {
  id: string;
  userId: string;
  taskId: string;
  selectedDate: string; // YYYY-MM-DD local
  sortOrder: number;
  createdAt: string;
  deletedAt?: string | null;
}

export interface SyncMutation {
  id: string;
  entity: 'task' | 'daily_selection';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export interface UserSession {
  id: string;
  email: string;
  name?: string;
  token?: string;
  isGuest?: boolean;
}

export type ViewFilter = 'pending' | 'someday';
export type MobileTab = 'today' | 'backlog' | 'history';
