import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const OfflineIndicatorBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000); // Hide "back online" after 5s
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
          {isOffline ? <WifiOff size={18} /> : <Wifi size={18} />}
          <span className="text-sm font-bold tracking-tight">
            {isOffline 
              ? 'Você está offline. Algumas informações podem estar desatualizadas.' 
              : 'Conexão restabelecida! Sincronizando dados...'}
          </span>
          {!isOffline && (
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
