export const enqueueOfflineAction = (actionType: 'CREATE_METRIC' | 'CREATE_GOAL' | 'CREATE_MED', payload: any) => {
  const queue = JSON.parse(localStorage.getItem('vitta_offline_sync_queue') || '[]');
  queue.push({
    id: Math.random().toString(36).substring(7),
    type: actionType,
    payload,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('vitta_offline_sync_queue', JSON.stringify(queue));
};
