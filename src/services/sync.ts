import { localDb } from './db';
import { pocketbaseService, pb } from './pocketbase';
import type { Task, DailySelection, SyncMutation } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';
type SyncListener = (status: SyncStatus) => void;

class SyncService {
  private status: SyncStatus = navigator.onLine ? 'idle' : 'offline';
  private listeners: Set<SyncListener> = new Set();
  private timer: any = null;
  private isProcessing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('idle');
        this.syncAll();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
          this.syncAll();
        }
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.listeners.forEach(fn => fn(status));
  }

  public startPeriodicSync(intervalMs = 30000) {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (navigator.onLine && pb.authStore.isValid) {
        this.syncAll();
      }
    }, intervalMs);
  }

  public stopPeriodicSync() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public async syncAll(): Promise<void> {
    if (this.isProcessing) return;
    if (!navigator.onLine) {
      this.setStatus('offline');
      return;
    }

    // Only sync if user is logged into remote backend
    if (!pb.authStore.isValid) {
      this.setStatus('idle');
      return;
    }

    this.isProcessing = true;
    this.setStatus('syncing');

    try {
      // 1. Process Outbox (Push local mutations)
      await this.processSyncQueue();

      // 2. Pull remote tasks and merge
      const remoteTasks = await pocketbaseService.fetchTasks();
      if (remoteTasks.length > 0) {
        await localDb.bulkSaveTasks(remoteTasks);
      }

      // 3. Pull remote daily selections and merge
      const remoteSelections = await pocketbaseService.fetchDailySelections();
      if (remoteSelections.length > 0) {
        await localDb.bulkSaveDailySelections(remoteSelections);
      }

      this.setStatus('idle');
    } catch (err) {
      console.warn('Sync failed:', err);
      this.setStatus('error');
    } finally {
      this.isProcessing = false;
    }
  }

  private async processSyncQueue(): Promise<void> {
    const mutations = await localDb.getPendingMutations();
    for (const m of mutations) {
      try {
        if (m.entity === 'task') {
          await pocketbaseService.upsertTask(m.payload);
        } else if (m.entity === 'daily_selection') {
          await pocketbaseService.upsertDailySelection(m.payload);
        }
        await localDb.removeMutation(m.id);
      } catch (err) {
        console.warn('Failed to process mutation:', m, err);
        throw err;
      }
    }
  }

  // --- Helpers to record mutations ---
  public async recordTaskMutation(task: Task, action: 'create' | 'update' | 'delete'): Promise<void> {
    const mutation: SyncMutation = {
      id: `${task.id}_${Date.now()}`,
      entity: 'task',
      action,
      payload: task,
      timestamp: Date.now()
    };
    await localDb.enqueueMutation(mutation);

    // If online, immediately attempt background sync
    if (navigator.onLine && pb.authStore.isValid) {
      this.syncAll().catch(() => {});
    }
  }

  public async recordDailySelectionMutation(selection: DailySelection, action: 'create' | 'update' | 'delete'): Promise<void> {
    const mutation: SyncMutation = {
      id: `${selection.id}_${Date.now()}`,
      entity: 'daily_selection',
      action,
      payload: selection,
      timestamp: Date.now()
    };
    await localDb.enqueueMutation(mutation);

    if (navigator.onLine && pb.authStore.isValid) {
      this.syncAll().catch(() => {});
    }
  }
}

export const syncService = new SyncService();
