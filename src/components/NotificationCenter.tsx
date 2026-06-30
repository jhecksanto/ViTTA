
import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Info, Calendar, ClipboardList, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'exam' | 'appointment' | 'system';
  read: boolean;
  createdAt: any;
}

const NotificationCenter = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      notifications.filter(n => !n.read).forEach(n => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'exam': return <ClipboardList className="text-vitta-accent" size={18} />;
      case 'appointment': return <Calendar className="text-vitta-green" size={18} />;
      case 'system': return <Info className="text-vitta-accent" size={18} />;
      default: return <Bell size={18} />;
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative">
      <button 
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all relative ${isOpen ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'text-vitta-text-secondary hover:bg-vitta-surface-2'}`}
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-vitta-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-vitta-border overflow-hidden z-50 origin-top-right"
            >
              <div className="p-4 border-b border-vitta-border flex items-center justify-between bg-vitta-surface-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-vitta-text-primary">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-vitta-accent/10 text-vitta-accent text-[10px] font-bold rounded-full">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs text-vitta-accent font-bold hover:underline py-1 px-2 rounded-lg hover:bg-vitta-accent/5"
                  >
                    Marcar todas lidas
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto no-scrollbar">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-vitta-border">
                    {notifications.map((n) => (
                      <div 
                        key={n.id}
                        onClick={() => !n.read && markAsRead(n.id)}
                        className={`p-4 hover:bg-vitta-surface-1 transition-colors cursor-pointer group flex gap-3 ${!n.read ? 'bg-vitta-accent/[0.02]' : ''}`}
                      >
                        <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                          n.type === 'exam' ? 'bg-vitta-accent/10' : 
                          n.type === 'appointment' ? 'bg-vitta-green/10' : 
                          'bg-vitta-accent/10'
                        }`}>
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between gap-2">
                            <h4 className={`text-sm font-bold truncate ${!n.read ? 'text-vitta-text-primary' : 'text-vitta-text-secondary'}`}>
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-vitta-text-muted whitespace-nowrap pt-0.5">
                              {getTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-vitta-text-secondary leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            {!n.read && (
                              <span className="text-[10px] text-vitta-accent font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-vitta-accent rounded-full" />
                                Não lida
                              </span>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(n.id);
                              }}
                              className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 text-vitta-text-muted hover:text-vitta-danger hover:bg-vitta-danger/5 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 bg-vitta-surface-2 rounded-full flex items-center justify-center text-vitta-text-muted">
                      <Bell size={32} />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-vitta-text-primary">Tudo em dia!</p>
                      <p className="text-xs text-vitta-text-secondary">Você não tem notificações recentes.</p>
                    </div>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-3 bg-vitta-surface-1 border-t border-vitta-border text-center">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-xs font-bold text-vitta-text-muted hover:text-vitta-text-primary transition-colors py-1 px-3"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
