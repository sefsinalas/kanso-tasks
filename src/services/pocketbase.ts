import PocketBase from 'pocketbase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import type { Task, DailySelection, UserSession } from '../types';

const defaultUrl = import.meta.env.VITE_POCKETBASE_URL || 'https://pleasant-pelican-present.ngrok-free.app';
export const pb = new PocketBase(defaultUrl);
pb.autoCancellation(false);

// Bypass Ngrok browser warning for all API requests
pb.beforeSend = function (url, options) {
  options.headers = Object.assign({}, options.headers, {
    'ngrok-skip-browser-warning': 'true',
  });
  return { url, options };
};

export const pocketbaseService = {
  // --- Auth ---
  getCurrentUser(): UserSession | null {
    if (pb.authStore.isValid && pb.authStore.record) {
      return {
        id: pb.authStore.record.id,
        email: pb.authStore.record.email,
        name: pb.authStore.record.name,
        token: pb.authStore.token,
        isGuest: false
      };
    }
    return null;
  },

  async login(email: string, password: string): Promise<UserSession> {
    const authData = await pb.collection('users').authWithPassword(email, password);
    return {
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
      token: authData.token,
      isGuest: false
    };
  },

  async register(email: string, password: string): Promise<UserSession> {
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm: password
    });
    return this.login(email, password);
  },

  async loginWithGoogle(): Promise<UserSession> {
    const isNative = Capacitor.isNativePlatform();
    const authData = await pb.collection('users').authWithOAuth2({
      provider: 'google',
      urlCallback: isNative
        ? async (url: string) => {
            await Browser.open({ url, windowName: '_system' });
          }
        : undefined
    });

    if (isNative) {
      await Browser.close().catch(() => {});
    }

    return {
      id: authData.record.id,
      email: authData.record.email,
      name: authData.record.name,
      token: authData.token,
      isGuest: false
    };
  },

  logout(): void {
    pb.authStore.clear();
  },

  // --- Remote Tasks ---
  async fetchTasks(): Promise<Task[]> {
    if (!pb.authStore.isValid) return [];
    try {
      const records = await pb.collection('tasks').getFullList({
        sort: 'sort_order',
      });
      return records.map(r => ({
        id: r.id,
        userId: r.user,
        title: r.title,
        notes: r.notes || '',
        dueDate: r.due_date || undefined,
        isSomeday: !!r.is_someday,
        sortOrder: r.sort_order ?? 0,
        completedAt: r.completed_at || null,
        createdAt: r.created,
        updatedAt: r.updated,
        deletedAt: r.deleted_at || null
      }));
    } catch (err) {
      console.warn('PocketBase fetchTasks failed:', err);
      return [];
    }
  },

  async upsertTask(task: Task): Promise<void> {
    if (!pb.authStore.isValid) return;
    const data = {
      id: task.id,
      user: task.userId,
      title: task.title,
      notes: task.notes || '',
      due_date: task.dueDate || '',
      is_someday: task.isSomeday,
      sort_order: task.sortOrder,
      completed_at: task.completedAt || '',
      deleted_at: task.deletedAt || ''
    };

    try {
      // Try update first
      await pb.collection('tasks').update(task.id, data);
    } catch (err: any) {
      if (err.status === 404) {
        // Create if doesn't exist
        await pb.collection('tasks').create(data);
      } else {
        throw err;
      }
    }
  },

  // --- Remote Daily Selections ---
  async fetchDailySelections(): Promise<DailySelection[]> {
    if (!pb.authStore.isValid) return [];
    try {
      const records = await pb.collection('daily_selections').getFullList({
        sort: 'sort_order',
      });
      return records.map(r => ({
        id: r.id,
        userId: r.user,
        taskId: r.task_id,
        selectedDate: r.selected_date,
        sortOrder: r.sort_order ?? 0,
        createdAt: r.created,
        deletedAt: r.deleted_at || null
      }));
    } catch (err) {
      console.warn('PocketBase fetchDailySelections failed:', err);
      return [];
    }
  },

  async upsertDailySelection(selection: DailySelection): Promise<void> {
    if (!pb.authStore.isValid) return;
    const data = {
      id: selection.id,
      user: selection.userId,
      task_id: selection.taskId,
      selected_date: selection.selectedDate,
      sort_order: selection.sortOrder,
      deleted_at: selection.deletedAt || ''
    };

    try {
      await pb.collection('daily_selections').update(selection.id, data);
    } catch (err: any) {
      if (err.status === 404) {
        await pb.collection('daily_selections').create(data);
      } else {
        throw err;
      }
    }
  }
};
