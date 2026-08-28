import { collection } from 'firebase/firestore';
import { db } from '../firebase';
import { addDoc } from './firestore-wrappers';

export interface OfflineAction {
  id: string;
  type: 'CREATE_METRIC' | 'CREATE_GOAL' | 'CREATE_MED' | string;
  payload: any;
  timestamp: string;
}

const STORAGE_KEY = 'vitta_offline_sync_queue';

export const enqueueOfflineAction = (
  actionType: 'CREATE_METRIC' | 'CREATE_GOAL' | 'CREATE_MED' | string,
  payload: any
) => {
  try {
    const queue: OfflineAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    queue.push({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      type: actionType,
      payload,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Enqueued action ${actionType}. Queue size: ${queue.length}`);
  } catch (err) {
    console.error('[OfflineQueue] Failed to enqueue offline action:', err);
  }
};

export const getOfflineQueueSize = (): number => {
  try {
    const queue: OfflineAction[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return queue.length;
  } catch {
    return 0;
  }
};

/**
 * Processa e drena as ações pendentes gravadas no armazenamento local
 * quando a conexão com o Firebase estiver restabelecida.
 */
export const processOfflineQueue = async (): Promise<{ successCount: number; failureCount: number }> => {
  if (!navigator.onLine) {
    return { successCount: 0, failureCount: 0 };
  }

  let queue: OfflineAction[] = [];
  try {
    queue = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (err) {
    console.error('[OfflineQueue] Error reading offline sync queue:', err);
    return { successCount: 0, failureCount: 0 };
  }

  if (!queue.length) {
    return { successCount: 0, failureCount: 0 };
  }

  console.log(`[OfflineQueue] Draining ${queue.length} pending offline actions...`);

  let successCount = 0;
  const remainingItems: OfflineAction[] = [];

  for (const item of queue) {
    try {
      let targetCollection = '';
      if (item.type === 'CREATE_METRIC') {
        targetCollection = 'health_metrics';
      } else if (item.type === 'CREATE_GOAL') {
        targetCollection = 'health_goals';
      } else if (item.type === 'CREATE_MED') {
        targetCollection = 'medications';
      } else if (item.payload && item.payload._targetCollection) {
        targetCollection = item.payload._targetCollection;
      }

      if (targetCollection) {
        const cleanPayload = { ...item.payload };
        delete cleanPayload._targetCollection;
        await addDoc(collection(db, targetCollection), cleanPayload);
        successCount++;
      } else {
        console.warn(`[OfflineQueue] Unknown action type or collection for item:`, item);
      }
    } catch (error) {
      console.error(`[OfflineQueue] Failed to sync action ${item.type} (${item.id}):`, error);
      remainingItems.push(item);
    }
  }

  try {
    if (remainingItems.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingItems));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('[OfflineQueue] Error updating storage queue:', err);
  }

  console.log(`[OfflineQueue] Sync completed. Success: ${successCount}, Remaining: ${remainingItems.length}`);
  return { successCount, failureCount: remainingItems.length };
};
