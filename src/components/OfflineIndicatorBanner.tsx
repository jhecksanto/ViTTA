import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processOfflineQueue, getOfflineQueueSize } from '../lib/offlineQueue';

const OfflineIndicatorBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const triggerSync = async () => {
    const queueSize = getOfflineQueueSize();
    if (queueSize > 0) {
      setIsSyncing(true);
      setSyncMessage(`Sincronizando ${queueSize} ${queueSize === 1 ? 'registro pendente' : 'registros pendentes'}...`);
      try {
        const result = await processOfflineQueue();
        if (result.successCount > 0) {
          setSyncMessage(`${result.successCount} ${result.successCount === 1 ? 'registro sincronizado' : 'registros sincronizados'} com sucesso!`);
        } else {
          setSyncMessage('Conexão restabelecida!');
        }
      } catch (e) {
        console.error('Error syncing offline queue:', e);
        setSyncMessage('Conexão restabelecida!');
      } finally {
        setIsSyncing(false);
        setTimeout(() => setShowStatus(false), 5000);
      }
    } else {
      setSyncMessage('Conexão restabelecida!');
      setTimeout(() => setShowStatus(false), 4000);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowStatus(true);
      triggerSync();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowStatus(true);
    } else {
      // Check if there are un-synced items from a previous session
      if (getOfflineQueueSize() > 0) {
        setShowStatus(true);
        triggerSync();
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showStatus && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className={`fixed top-0 left-0 right-0 z-[10000] p-3 text-center flex items-center justify-center gap-3 shadow-lg backdrop-blur-md ${
            isOffline ? 'bg-vitta-danger/90 text-white' : 'bg-vitta-green/90 text-white'
          }`}
        >
          {isOffline ? (
            <WifiOff size={18} />
          ) : isSyncing ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Wifi size={18} />
          )}
          <span className="text-sm font-bold tracking-tight">
            {isOffline 
              ? 'Você está offline. As alterações serão salvas localmente e sincronizadas quando a conexão retornar.' 
              : syncMessage || 'Conexão restabelecida!'}
          </span>
          {!isOffline && !isSyncing && (
            <button 
              onClick={() => setShowStatus(false)}
              className="ml-auto p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicatorBanner;

