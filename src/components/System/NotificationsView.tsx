import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Wallet,
  Tag,
  Stethoscope,
  Info,
  Clock,
} from "lucide-react";
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
} from "firebase/firestore";
import { db } from "../../firebase";
import { useToast } from "../../contexts/ToastContext";

interface NotificationsViewProps {
  user: any;
  setActiveTab?: (tab: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  user,
  setActiveTab,
}) => {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setNotifications(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Notifications fetch error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        if (!n.read) {
          batch.update(doc(db, "notifications", n.id), { read: true });
        }
      });
      await batch.commit();
      addToast("Todas as notificações marcadas como lidas.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao marcar notificações.", "error");
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Deseja apagar todas as notificações?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        batch.delete(doc(db, "notifications", n.id));
      });
      await batch.commit();
      addToast("Notificações limpas com sucesso.", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao limpar notificações.", "error");
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await updateDoc(doc(db, "notifications", notif.id), { read: true });
      } catch (e) {
        console.error(e);
      }
    }
    if (notif.link && setActiveTab) {
      setActiveTab(notif.link);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="text-blue-500" size={18} />;
      case "wallet":
        return <Wallet className="text-emerald-500" size={18} />;
      case "voucher":
        return <Tag className="text-purple-500" size={18} />;
      case "exam":
        return <Stethoscope className="text-cyan-500" size={18} />;
      default:
        return <Info className="text-vitta-accent" size={18} />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-vitta-accent/10 text-vitta-accent flex items-center justify-center font-bold">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-vitta-text-primary">Central de Notificações</h2>
            <p className="text-xs text-vitta-text-muted">
              {notifications.filter((n) => !n.read).length} avisos não lidos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0}
            className="px-3.5 py-2 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40"
          >
            <CheckCheck size={14} />
            Marcar todas como lidas
          </button>
          <button
            onClick={handleClearAll}
            disabled={notifications.length === 0}
            className="p-2 text-vitta-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all disabled:opacity-40"
            title="Limpar todas"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="bg-vitta-surface p-6 rounded-3xl border border-vitta-border shadow-sm space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-vitta-text-muted">
            Carregando notificações...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell size={36} className="mx-auto text-vitta-text-muted opacity-40" />
            <h4 className="font-bold text-sm text-vitta-text-primary">Você não possui notificações</h4>
            <p className="text-xs text-vitta-text-muted">Avisos importantes sobre consultas, carteira e ofertas aparecerão aqui.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleNotificationClick(notif)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                notif.read
                  ? "bg-vitta-surface border-vitta-border hover:border-vitta-accent/30"
                  : "bg-vitta-accent/5 border-vitta-accent/20 hover:border-vitta-accent/40"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-vitta-surface-2 rounded-xl border border-vitta-border shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-vitta-text-primary">{notif.title || "Notificação"}</h4>
                  <p className="text-xs text-vitta-text-secondary mt-0.5">{notif.message || notif.body}</p>
                  <span className="text-[10px] text-vitta-text-muted block mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {notif.createdAt ? new Date(notif.createdAt).toLocaleString("pt-BR") : "Recentemente"}
                  </span>
                </div>
              </div>

              {!notif.read && (
                <span className="w-2.5 h-2.5 rounded-full bg-vitta-accent shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
