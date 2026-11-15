import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task, DailySelection, SyncMutation } from '../types';

interface AppDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: {
      'by_user': string;
      'by_completed': string;
      'by_sort': number;
    };
  };
  daily_selections: {
    key: string;
    value: DailySelection;
    indexes: {
      'by_user_date': [string, string];
      'by_task': string;
    };
  };
  sync_queue: {
    key: string;
    value: SyncMutation;
    indexes: {
      'by_timestamp': number;
    };
  };
  metadata: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'kanso_tasks_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDb(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by_user', 'userId');
          taskStore.createIndex('by_completed', 'completedAt');
          taskStore.createIndex('by_sort', 'sortOrder');
        }

        // Daily selections store
        if (!db.objectStoreNames.contains('daily_selections')) {
          const dailyStore = db.createObjectStore('daily_selections', { keyPath: 'id' });
          dailyStore.createIndex('by_user_date', ['userId', 'selectedDate']);
          dailyStore.createIndex('by_task', 'taskId');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by_timestamp', 'timestamp');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata');
        }
      },
    });
  }
  return dbPromise;
}

export const localDb = {
  // --- Tasks ---
  async getAllTasks(): Promise<Task[]> {
    const db = await getDb();
    const tasks = await db.getAll('tasks');
    return tasks.filter(t => !t.deletedAt);
  },

  async getTask(id: string): Promise<Task | undefined> {
    const db = await getDb();
    const t = await db.get('tasks', id);
    return t && !t.deletedAt ? t : undefined;
  },

  async saveTask(task: Task): Promise<void> {
    const db = await getDb();
    await db.put('tasks', task);
  },

  async bulkSaveTasks(tasks: Task[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('tasks', 'readwrite');
    for (const t of tasks) {
      await tx.store.put(t);
    }
    await tx.done;
  },

  async deleteTask(id: string): Promise<void> {
    const db = await getDb();
    const task = await db.get('tasks', id);
    if (task) {
      task.deletedAt = new Date().toISOString();
      await db.put('tasks', task);
    }
  },

  // --- Daily Selections ---
  async getDailySelectionsForDate(date: string, userId: string): Promise<DailySelection[]> {
    const db = await getDb();
    const all = await db.getAllFromIndex('daily_selections', 'by_user_date', [userId, date]);
    return all.filter(s => !s.deletedAt).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async getAllDailySelections(): Promise<DailySelection[]> {
    const db = await getDb();
    const all = await db.getAll('daily_selections');
    return all.filter(s => !s.deletedAt);
  },

  async saveDailySelection(selection: DailySelection): Promise<void> {
    const db = await getDb();
    await db.put('daily_selections', selection);
  },

  async bulkSaveDailySelections(selections: DailySelection[]): Promise<void> {
    const db = await getDb();
    const tx = db.transaction('daily_selections', 'readwrite');
    for (const s of selections) {
      await tx.store.put(s);
    }
    await tx.done;
  },

  async deleteDailySelection(id: string): Promise<void> {
    const db = await getDb();
    const item = await db.get('daily_selections', id);
    if (item) {
      item.deletedAt = new Date().toISOString();
      await db.put('daily_selections', item);
    }
  },

  async removeTaskFromDay(taskId: string, date: string, userId: string): Promise<string | null> {
    const selections = await this.getDailySelectionsForDate(date, userId);
    const target = selections.find(s => s.taskId === taskId && !s.deletedAt);
    if (target) {
      await this.deleteDailySelection(target.id);
      return target.id;
    }
    return null;
  },

  // --- Sync Queue ---
  async enqueueMutation(mutation: SyncMutation): Promise<void> {
    const db = await getDb();
    await db.put('sync_queue', mutation);
  },

  async getPendingMutations(): Promise<SyncMutation[]> {
    const db = await getDb();
    const mutations = await db.getAllFromIndex('sync_queue', 'by_timestamp');
    return mutations;
  },

  async removeMutation(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('sync_queue', id);
  },

  // --- Metadata ---
  async getMeta(key: string): Promise<any> {
    const db = await getDb();
    return await db.get('metadata', key);
  },

  async setMeta(key: string, value: any): Promise<void> {
    const db = await getDb();
    await db.put('metadata', value, key);
  },

  async clearAll(): Promise<void> {
    const db = await getDb();
    await db.clear('tasks');
    await db.clear('daily_selections');
    await db.clear('sync_queue');
  }
};
