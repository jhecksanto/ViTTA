// Force refresh - 2026-04-07 23:32
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Tag, 
  Settings, 
  Bell, 
  Search, 
  ChevronRight, 
  Heart, 
  Moon, 
  Footprints, 
  Droplets,
  Star,
  Clock,
  MapPin,
  Menu,
  X,
  Upload,
  FileText,
  Download,
  ClipboardList,
  Filter,
  Plus,
  Check,
  Scale,
  Thermometer,
  ShieldCheck,
  UserCog,
  CreditCard,
  Wallet,
  Ticket,
  Stethoscope,
  Radio,
  MessageSquare,
  User,
  HelpCircle,
  LayoutGrid,
  Sun,
  Trash2,
  Edit,
  Store,
  ChevronDown,
  Lock,
  Code,
  Mail,
  Save,
  Key,
  LogOut,
  Phone,
  Info,
  Activity,
  Glasses,
  ShoppingCart,
  Shirt,
  Baby,
  Zap,
  Armchair,
  Hammer,
  Coffee,
  Pizza,
  IceCream,
  Fuel,
  PawPrint,
  Wrench,
  ArrowLeft,
  Pill,
  ShoppingBag,
  Utensils,
  Car,
  GraduationCap,
  Dumbbell,
  Gamepad2,
  Book,
  Music,
  Camera,
  Plane,
  Home,
  Smartphone,
  Calculator,
  Scissors,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { auth, db, storage, googleProvider } from './firebase';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../firebase-applet-config.json';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  getAuth,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc as firestoreSetDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  getDocs,
  addDoc as firestoreAddDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';
import AuditLogsList from './components/Admin/AuditLogsList';

const Skeleton = ({ className, ...props }: { className?: string, [key: string]: any }) => (
  <div className={`animate-pulse bg-vitta-surface-2 rounded-xl ${className}`} {...props} />
);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null) return null;
  if (data instanceof Date) return data;
  if (data instanceof Timestamp) return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeData).filter(item => item !== undefined);
  }
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
        sanitized[key] = sanitizeData(data[key]);
      }
    }
    return sanitized;
  }
  return data;
};

const addDoc = (collectionRef: any, data: any) => {
  return firestoreAddDoc(collectionRef, sanitizeData(data));
};

const setDoc = (docRef: any, data: any, options?: any) => {
  if (options && options.merge) {
    return firestoreSetDoc(docRef, sanitizeData(data), options);
  }
  return firestoreSetDoc(docRef, sanitizeData(data));
};

const updateDoc = (docRef: any, data: any) => {
  return firestoreUpdateDoc(docRef, sanitizeData(data));
};

const logAdminAction = async (action: string, description: string) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      adminId: auth.currentUser?.uid,
      adminName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
      action,
      description,
      timestamp: Timestamp.now()
    });
  } catch (err) {
    console.error('Erro ao registrar log de auditoria:', err);
  }
};

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Excluir", 
  cancelText = "Cancelar",
  variant = "danger"
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: () => void, 
  title: string, 
  message: string,
  confirmText?: string,
  cancelText?: string,
  variant?: "danger" | "primary"
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-sm rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
      >
        <div className="p-6 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-vitta-danger/10 text-vitta-danger' : 'bg-vitta-accent/10 text-vitta-accent'}`}>
            {variant === 'danger' ? <Trash2 size={32} /> : <Info size={32} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-vitta-text-primary">{title}</h3>
            <p className="text-sm text-vitta-text-secondary">{message}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border border-vitta-border rounded-2xl text-sm font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3 text-white rounded-2xl font-bold shadow-lg transition-all ${variant === 'danger' ? 'bg-vitta-danger hover:bg-vitta-danger/90 shadow-vitta-danger/20' : 'bg-vitta-accent hover:bg-vitta-accent/90 shadow-vitta-accent/20'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ChangePasswordModal = ({ user, onClose }: { user: FirebaseUser | null, onClose: () => void }) => {
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (!user) return;
    if (passwords.new.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await updatePassword(user, passwords.new);
      
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Senha Alterada',
        message: 'Sua senha foi alterada com sucesso.',
        type: 'system',
        read: false,
        createdAt: Timestamp.now()
      });

      alert('Senha atualizada com sucesso!');
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar senha:', err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Esta operação requer um login recente. Por favor, saia e entre novamente.');
      } else {
        setError('Erro ao atualizar senha. Tente novamente.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-vitta-text-primary/20 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-vitta-surface w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-vitta-text-primary">Alterar Senha</h2>
            <button onClick={onClose} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
              <X size={20} className="text-vitta-text-muted" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-vitta-danger/10 border border-vitta-danger/20 rounded-2xl flex items-center gap-3 text-vitta-danger text-sm">
              <XCircle size={18} />
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nova Senha</label>
              <input 
                type="password" 
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Confirmar Nova Senha</label>
              <input 
                type="password" 
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={isSaving}
            className="w-full py-4 bg-vitta-accent text-white rounded-2xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Atualizar Senha
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const HealthMetricsInputModal = ({ user, onClose }: { user: any, onClose: () => void }) => {
  const [metrics, setMetrics] = useState({
    weight: '',
    height: '',
    bloodPressure: '',
    glucose: '',
    sleepHours: '',
    steps: '',
    waterIntake: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const data: any = {
        userId: user.uid,
        date: today,
        createdAt: Timestamp.now()
      };
      if (metrics.weight) data.weight = Number(metrics.weight);
      if (metrics.height) data.height = Number(metrics.height);
      if (metrics.bloodPressure) data.bloodPressure = metrics.bloodPressure;
      if (metrics.glucose) data.glucose = Number(metrics.glucose);
      if (metrics.sleepHours) data.sleepHours = Number(metrics.sleepHours);
      if (metrics.steps) data.steps = Number(metrics.steps);
      if (metrics.waterIntake) data.waterIntake = Number(metrics.waterIntake);

      await addDoc(collection(db, 'health_metrics'), data);
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'health_metrics');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-vitta-text-primary">Registrar Saúde</h2>
            <button onClick={onClose} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
              <X size={20} className="text-vitta-text-muted" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Peso (kg)</label>
              <input 
                type="number" 
                value={metrics.weight}
                onChange={(e) => setMetrics({ ...metrics, weight: e.target.value })}
                placeholder="0.0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Altura (cm)</label>
              <input 
                type="number" 
                value={metrics.height}
                onChange={(e) => setMetrics({ ...metrics, height: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Pressão (mmHg)</label>
              <input 
                type="text" 
                value={metrics.bloodPressure}
                onChange={(e) => setMetrics({ ...metrics, bloodPressure: e.target.value })}
                placeholder="120/80"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Glicose (mg/dL)</label>
              <input 
                type="number" 
                value={metrics.glucose}
                onChange={(e) => setMetrics({ ...metrics, glucose: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Sono (horas)</label>
              <input 
                type="number" 
                value={metrics.sleepHours}
                onChange={(e) => setMetrics({ ...metrics, sleepHours: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Passos</label>
              <input 
                type="number" 
                value={metrics.steps}
                onChange={(e) => setMetrics({ ...metrics, steps: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">Água (ml)</label>
              <input 
                type="number" 
                value={metrics.waterIntake}
                onChange={(e) => setMetrics({ ...metrics, waterIntake: e.target.value })}
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 bg-vitta-accent text-white rounded-2xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Salvar Métricas
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BookingModal = ({ 
  isOpen, 
  onClose, 
  professional, 
  user 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  professional: any, 
  user: any 
}) => {
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('09:00');

  const handleConfirm = async () => {
    if (!user || !professional) return;
    
    setIsBooking(true);
    try {
      // 1. Save to Firestore
      await addDoc(collection(db, 'appointments'), {
        userId: user.uid,
        professionalId: professional.id,
        professionalName: professional.name,
        specialty: professional.specialty,
        imageUrl: professional.imageUrl || 'https://picsum.photos/seed/prof/400/300',
        date: selectedDate,
        time: selectedTime,
        status: 'upcoming',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 1.1 Create Notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Consulta Agendada',
        message: `Sua consulta com ${professional.name} foi agendada para ${new Date(selectedDate).toLocaleDateString('pt-BR')} às ${selectedTime}.`,
        type: 'appointment',
        read: false,
        createdAt: Timestamp.now()
      });

      // 2. Open WhatsApp
      const phoneNumber = '5528999881386';
      const formattedDate = new Date(selectedDate).toLocaleDateString('pt-BR');
      const message = `Olá! Gostaria de agendar um atendimento.\n\n*Meus dados:*\nNome: ${user.displayName || 'Usuário'}\nEmail: ${user.email}\n\n*Profissional selecionado:*\nNome: ${professional.name}\nEspecialidade: ${professional.specialty}\n\n*Data e Hora:*\n${formattedDate} às ${selectedTime}`;
      
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setIsBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center">
          <h3 className="text-xl font-bold text-vitta-text-primary">Confirmar Atendimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-vitta-text-secondary text-sm">
            Selecione a data e hora desejada. Você será redirecionado para o nosso WhatsApp para finalizar o agendamento.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Data</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 outline-none text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Hora</label>
              <input 
                type="time" 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 outline-none text-vitta-text-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
            <img src={professional.imageUrl || 'https://picsum.photos/seed/prof/400/300'} alt={professional.name} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h4 className="font-bold text-vitta-text-primary">{professional.name}</h4>
              <p className="text-xs text-vitta-text-secondary">{professional.specialty}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={isBooking}
              className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isBooking}
              className="flex-1 py-3 bg-vitta-green text-white rounded-xl font-bold shadow-lg shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBooking ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <MessageSquare size={18} />
                  Confirmar
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const PatientDashboardView = ({ user, userData }: { user: any, userData: any }) => {
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Health Metrics History (for the chart and calculations)
    // We fetch 14 to compare the current week with the previous one
    const metricsQuery = query(
      collection(db, 'health_metrics'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc'),
      limit(14)
    );

    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // For the chart, we want chronological order (asc)
      setMetricsHistory([...data].reverse());
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'health_metrics');
    });

    // 2. Fetch Upcoming Appointments
    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      where('status', '==', 'upcoming'),
      orderBy('date', 'asc'),
      limit(3)
    );

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingAppointments(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });

    // 3. Fetch Recent Exams
    const examsQuery = query(
      collection(db, 'exams'),
      where('userId', '==', user.uid),
      where('status', '==', 'ready'),
      orderBy('updatedAt', 'desc'),
      limit(2)
    );

    const unsubscribeExams = onSnapshot(examsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentExams(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeAppointments();
      unsubscribeExams();
    };
  }, [user]);

  const latestMetric = metricsHistory.length > 0 ? metricsHistory[metricsHistory.length - 1] : null;

  // Calculate dynamic changes
  const calculateChange = (current: any[], previous: any[], key: string) => {
    if (previous.length === 0) return 0;
    const currentAvg = current.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / (current.length || 1);
    const previousAvg = previous.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) / (previous.length || 1);
    if (previousAvg === 0) return currentAvg > 0 ? 100 : 0;
    return Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
  };

  // metricsHistory is reversed (asc), so the last 7 are the current week
  const currentWeek = metricsHistory.slice(-7);
  const previousWeek = metricsHistory.slice(0, Math.max(0, metricsHistory.length - 7));

  const metrics = {
    steps: latestMetric?.steps || userData?.healthMetrics?.steps || 0,
    heartRate: latestMetric?.heartRate || userData?.healthMetrics?.heartRate || 0,
    waterIntake: latestMetric?.waterIntake || userData?.healthMetrics?.waterIntake || 0,
    sleepHours: latestMetric?.sleepHours || userData?.healthMetrics?.sleepHours || 0,
    weight: latestMetric?.weight || userData?.healthMetrics?.weight || 0,
    bloodPressure: latestMetric?.bloodPressure || userData?.healthMetrics?.bloodPressure || '--/--',
    glucose: latestMetric?.glucose || userData?.healthMetrics?.glucose || 0,
  };

  const stats = [
    { label: 'Passos', value: metrics.steps.toLocaleString(), icon: Footprints, color: 'emerald', change: calculateChange(currentWeek, previousWeek, 'steps') },
    { label: 'Sono', value: `${metrics.sleepHours}h`, icon: Moon, color: 'indigo', change: calculateChange(currentWeek, previousWeek, 'sleepHours') },
    { label: 'Peso', value: `${metrics.weight}kg`, icon: Scale, color: 'amber', change: calculateChange(currentWeek, previousWeek, 'weight') },
    { label: 'Pressão', value: metrics.bloodPressure, icon: Activity, color: 'rose' },
    { label: 'Glicose', value: `${metrics.glucose}mg/dL`, icon: Thermometer, color: 'blue', change: calculateChange(currentWeek, previousWeek, 'glucose') },
    { label: 'Hidratação', value: `${metrics.waterIntake}ml`, icon: Droplets, color: 'blue', change: calculateChange(currentWeek, previousWeek, 'waterIntake') },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-vitta-text-primary">Olá, {userData?.name?.split(' ')[0] || 'Usuário'}!</h1>
          <p className="text-vitta-text-secondary">Como está o seu bem-estar hoje?</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMetricsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
          >
            <Plus size={20} />
            Registrar Saúde
          </button>
          <div className="flex items-center gap-3 bg-vitta-surface p-2 rounded-xl border border-vitta-border shadow-sm">
            <div className="w-10 h-10 bg-vitta-green-bg rounded-xl flex items-center justify-center text-vitta-green">
              <Activity size={20} />
            </div>
            <div className="pr-4">
              <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Status Geral</p>
              <p className="text-sm font-bold text-vitta-text-primary">Excelente</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-vitta-text-primary">Evolução de Passos</h3>
                <p className="text-sm text-vitta-text-secondary">Seu desempenho nos últimos 7 dias</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-vitta-accent rounded-full"></span>
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Passos</span>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metricsHistory.length > 0 ? metricsHistory : [
                  { date: 'Seg', steps: 4000 },
                  { date: 'Ter', steps: 3000 },
                  { date: 'Qua', steps: 2000 },
                  { date: 'Qui', steps: 2780 },
                  { date: 'Sex', steps: 1890 },
                  { date: 'Sáb', steps: 2390 },
                  { date: 'Dom', steps: 3490 },
                ]}>
                  <defs>
                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="steps" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSteps)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-vitta-text-primary">Próximas Consultas</h3>
                <Calendar size={20} className="text-vitta-accent" />
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? upcomingAppointments.map((apt) => (
                  <div key={apt.id} className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
                    <img src={apt.imageUrl || 'https://picsum.photos/seed/prof/100/100'} alt={apt.professionalName} className="w-10 h-10 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-vitta-text-primary truncate">{apt.professionalName}</p>
                      <p className="text-xs text-vitta-text-secondary truncate">{apt.specialty}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-vitta-accent">{new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] text-vitta-text-muted">{apt.time}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-vitta-text-secondary text-center py-4">Nenhuma consulta agendada.</p>
                )}
              </div>
            </div>

            <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-vitta-text-primary">Exames Recentes</h3>
                <FileText size={20} className="text-vitta-green" />
              </div>
              <div className="space-y-4">
                {recentExams.length > 0 ? recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
                    <div className="w-10 h-10 bg-vitta-green-bg rounded-xl flex items-center justify-center text-vitta-green">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-vitta-text-primary truncate">{exam.name}</p>
                      <p className="text-xs text-vitta-text-secondary truncate">{exam.lab || 'Laboratório ViTTA'}</p>
                    </div>
                    <button className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all">
                      <Download size={18} />
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-vitta-text-secondary text-center py-4">Nenhum exame pronto.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-8">
          {isMetricsModalOpen && (
            <HealthMetricsInputModal 
              user={user} 
              onClose={() => setIsMetricsModalOpen(false)} 
            />
          )}
          <div className="bg-gradient-to-br from-vitta-accent to-vitta-purple p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
            <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Zap size={180} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Zap size={24} />
              </div>
              <h3 className="text-2xl font-bold">Dica do Dia</h3>
              <p className="text-vitta-surface text-sm leading-relaxed">
                Beber água regularmente ajuda a manter sua energia e foco durante o dia. Tente beber pelo menos 2 litros hoje!
              </p>
              <button className="px-6 py-2 bg-white text-vitta-accent rounded-xl text-sm font-bold hover:bg-vitta-surface transition-colors">
                Saber Mais
              </button>
            </div>
          </div>

          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
            <h3 className="text-lg font-bold text-vitta-text-primary mb-6">Metas Diárias</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-vitta-text-secondary">Passos</span>
                  <span className="font-bold text-vitta-text-primary">{Math.round((metrics.steps / 8000) * 100)}%</span>
                </div>
                <div className="h-2 bg-vitta-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((metrics.steps / 8000) * 100, 100)}%` }}
                    className="h-full bg-vitta-green"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-vitta-text-secondary">Água</span>
                  <span className="font-bold text-vitta-text-primary">{Math.round((metrics.waterIntake / 2000) * 100)}%</span>
                </div>
                <div className="h-2 bg-vitta-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((metrics.waterIntake / 2000) * 100, 100)}%` }}
                    className="h-full bg-vitta-accent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-vitta-text-secondary">Sono</span>
                  <span className="font-bold text-vitta-text-primary">{Math.round((metrics.sleepHours / 8) * 100)}%</span>
                </div>
                <div className="h-2 bg-vitta-surface-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((metrics.sleepHours / 8) * 100, 100)}%` }}
                    className="h-full bg-vitta-purple"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 mx-2 my-0.5 ${
      active 
        ? 'bg-vitta-nav-active-bg text-vitta-nav-active font-medium' 
        : 'text-vitta-text-secondary hover:text-vitta-text-primary'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard = ({ stat }: any) => {
  const Icon = typeof stat.icon === 'string' ? {
    Footprints,
    Moon,
    Heart,
    Droplets
  }[stat.icon] as any : stat.icon;

  const colors: Record<string, string> = {
    emerald: 'bg-vitta-green-bg text-vitta-green',
    indigo: 'bg-vitta-purple-bg text-vitta-purple',
    rose: 'bg-vitta-accent-bg text-vitta-accent',
    blue: 'bg-vitta-accent-bg text-vitta-accent',
    purple: 'bg-vitta-purple-bg text-vitta-purple',
    amber: 'bg-vitta-amber-bg text-vitta-amber',
  };

  const colorClass = colors[stat.color] || colors.emerald;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-vitta-surface p-5 rounded-xl border border-vitta-border shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          {Icon && <Icon size={22} />}
        </div>
        {stat.change !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            stat.change > 0 ? 'bg-vitta-green-bg text-vitta-green' : 'bg-vitta-danger/10 text-vitta-danger'
          }`}>
            {stat.change > 0 ? '+' : ''}{stat.change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-vitta-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-vitta-text-primary">{stat.value}</span>
          <span className="text-vitta-text-secondary text-xs">{stat.unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

const AdminView = ({ user }: { user: any }) => {
  const [subTab, setSubTab] = useState<'overview' | 'users' | 'partnerships' | 'professionals' | 'exams' | 'user-exams' | 'offers' | 'config'>('overview');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [editingApt, setEditingApt] = useState<any>(null);
  const [bookingProfessional, setBookingProfessional] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
    const unsubscribeApts = onSnapshot(q, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });
    const unsubscribeProfs = onSnapshot(query(collection(db, 'professionals'), limit(5)), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });
    const unsubscribePartners = onSnapshot(query(collection(db, 'partners'), limit(5)), (snapshot) => {
      setPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'partners');
    });
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersCount(snapshot.size);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => {
      unsubscribeApts();
      unsubscribeProfs();
      unsubscribePartners();
      unsubscribeUsers();
    };
  }, []);

  const handleDeleteApt = async (apt: any) => {
    if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      try {
        await deleteDoc(doc(db, 'appointments', apt.id));
        
        // Notify user about admin cancellation
        if (apt.userId) {
          await addDoc(collection(db, 'notifications'), {
            userId: apt.userId,
            title: 'Consulta Cancelada',
            message: `Sua consulta com ${apt.professionalName} foi cancelada pelo administrador.`,
            type: 'appointment',
            read: false,
            createdAt: Timestamp.now()
          });
        }
        
        await logAdminAction('CANCEL_APPOINTMENT', `Cancelou agendamento ID: ${apt.id} de ${apt.professionalName}`);
      } catch (err) {
        console.error('Erro ao excluir agendamento:', err);
      }
    }
  };

  const handleSaveApt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingApt;
      await updateDoc(doc(db, 'appointments', id), data);
      
      // Notify user about rescheduling
      if (data.userId) {
        await addDoc(collection(db, 'notifications'), {
          userId: data.userId,
          title: 'Consulta Remarcada',
          message: `Sua consulta com ${data.professionalName} foi remarcada para ${new Date(data.date).toLocaleDateString('pt-BR')} às ${data.time}.`,
          type: 'appointment',
          read: false,
          createdAt: Timestamp.now()
        });
      }
      
      await logAdminAction('RESCHEDULE_APPOINTMENT', `Remarcou agendamento ID: ${id} para ${data.date} ${data.time}`);
      setEditingApt(null);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {editingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">Remarcar Consulta</h3>
                <button onClick={() => setEditingApt(null)} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={handleSaveApt} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Data</label>
                  <input 
                    type="date" 
                    value={editingApt.date}
                    onChange={(e) => setEditingApt({ ...editingApt, date: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Horário</label>
                  <input 
                    type="time" 
                    value={editingApt.time}
                    onChange={(e) => setEditingApt({ ...editingApt, time: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingApt(null)}
                    className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        <BookingModal 
          isOpen={!!bookingProfessional} 
          onClose={() => setBookingProfessional(null)} 
          professional={bookingProfessional} 
          user={user} 
        />
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-vitta-text-primary">Painel Administrativo</h1>
          <p className="text-vitta-text-secondary">Gestão centralizada do ecossistema ViTTA</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-vitta-border overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'overview' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <LayoutGrid size={18} />
          Visão Geral
        </button>
        <button 
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'users' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <Users size={18} />
          Usuários
        </button>
        <button 
          onClick={() => setSubTab('partnerships')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'partnerships' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <Store size={18} />
          Convênios
        </button>
        <button 
          onClick={() => setSubTab('professionals')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'professionals' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <Stethoscope size={18} />
          Profissionais
        </button>
        <button 
          onClick={() => setSubTab('exams')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'exams' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <FileText size={18} />
          Tipos de Exames
        </button>
        <button 
          onClick={() => setSubTab('user-exams')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'user-exams' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <ClipboardList size={18} />
          Exames de Usuários
        </button>
        <button 
          onClick={() => setSubTab('config')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'config' 
              ? 'border-vitta-accent text-vitta-accent' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <Settings size={18} />
          Configurações
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === 'overview' && (
            <div className="space-y-10">
              {/* Welcome Section */}
              <section>
                <h2 className="text-2xl font-bold mb-2 text-vitta-text-primary">Olá, Administrador! 👋</h2>
                <p className="text-vitta-text-secondary">Aqui está o resumo do sistema hoje.</p>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Total de Usuários', value: usersCount.toString(), unit: 'usuários', icon: User, color: 'blue' },
                  { label: 'Agendamentos', value: appointments.length.toString(), unit: 'consultas', icon: Calendar, color: 'emerald' },
                  { label: 'Profissionais', value: professionals.length.toString(), unit: 'ativos', icon: Stethoscope, color: 'purple' },
                  { label: 'Parceiros', value: partners.length.toString(), unit: 'empresas', icon: ShieldCheck, color: 'amber' }
                ].map((stat, idx) => (
                  <StatCard key={idx} stat={stat} />
                ))}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Appointments Section */}
                <section className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-vitta-text-primary">Próximas Consultas</h2>
                    <button className="text-vitta-accent text-sm font-bold hover:underline">Ver todas</button>
                  </div>
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <motion.div 
                        key={apt.id}
                        whileHover={{ x: 4 }}
                        className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex items-center gap-4 group"
                      >
                        <img src={apt.imageUrl} alt={apt.professionalName} className="w-14 h-14 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-bold text-vitta-text-primary">{apt.professionalName}</h3>
                          <p className="text-sm text-vitta-text-secondary">{apt.specialty}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-vitta-text-primary font-medium text-sm mb-1">
                            <Calendar size={14} className="text-vitta-green" />
                            {new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1.5 text-vitta-text-secondary text-xs justify-end">
                            <Clock size={14} />
                            {apt.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingApt(apt)}
                            className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteApt(apt)}
                            className="p-2 text-vitta-danger hover:bg-vitta-danger/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    <button 
                      onClick={() => setBookingProfessional(professionals[0])}
                      className="w-full py-4 border-2 border-dashed border-vitta-border rounded-2xl text-vitta-text-muted font-medium hover:border-vitta-green/50 hover:text-vitta-green hover:bg-vitta-green-bg transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar size={18} />
                      Agendar nova consulta
                    </button>
                  </div>
                </section>

                {/* Quick Professionals Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-vitta-text-primary">Profissionais</h2>
                    <button onClick={() => setSubTab('professionals')} className="text-vitta-green text-sm font-bold hover:underline">Explorar</button>
                  </div>
                  <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
                    {professionals.length > 0 ? professionals.map((prof, idx) => (
                      <div key={prof.id} className={`p-4 flex items-center gap-3 ${idx !== professionals.length - 1 ? 'border-b border-vitta-border' : ''}`}>
                        <img src={prof.imageUrl} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate text-vitta-text-primary">{prof.name}</h4>
                          <p className="text-xs text-vitta-text-secondary">{prof.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1 text-vitta-amber">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold">{prof.rating}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-vitta-text-muted text-sm">Nenhum profissional cadastrado</div>
                    )}
                    <div className="p-4 bg-vitta-surface-2">
                      <button onClick={() => setSubTab('professionals')} className="w-full py-2.5 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors shadow-lg shadow-vitta-green/20">
                        Ver todos profissionais
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              {/* Offers Section */}
              <section className="space-y-6 pb-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-vitta-text-primary">Benefícios Exclusivos</h2>
                    <p className="text-sm text-vitta-text-secondary">Ofertas de parceiros selecionados para você.</p>
                  </div>
                  <button onClick={() => setSubTab('partnerships')} className="text-vitta-accent text-sm font-bold hover:underline">Ver todos</button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 lg:-mx-10 lg:px-10">
                  {partners.length > 0 ? partners.map((offer) => (
                    <motion.div 
                      key={offer.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex-shrink-0 w-80 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden"
                    >
                      <div className="relative h-40">
                        <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-vitta-surface/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-vitta-text-secondary">
                          {offer.category}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-vitta-green text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {offer.discount}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-1 text-vitta-text-primary">{offer.name}</h3>
                        <p className="text-sm text-vitta-text-secondary line-clamp-2 mb-4">{offer.description || 'Aproveite esta oferta exclusiva.'}</p>
                        <button 
                          onClick={() => alert('Benefício resgatado com sucesso! Apresente este código no estabelecimento: VITTA-' + Math.random().toString(36).substring(7).toUpperCase())}
                          className="w-full py-2 bg-vitta-surface-2 text-vitta-text-primary rounded-xl text-sm font-bold hover:bg-vitta-border transition-colors"
                        >
                          Resgatar Benefício
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="w-full p-8 text-center text-vitta-text-muted text-sm">Nenhum parceiro cadastrado</div>
                  )}
                </div>
              </section>
            </div>
          )}
          {subTab === 'users' && <UsersView />}
          {subTab === 'partnerships' && <PartnershipsView setSubTab={setSubTab} />}
          {subTab === 'professionals' && <ProfessionalsManagementView />}
          {subTab === 'exams' && <ExamsManagementView />}
          {subTab === 'user-exams' && <UserExamsManagementView />}
          {subTab === 'config' && <UserConfigView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ExamsView = ({ user }: { user: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'ready' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'exams'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExams(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesFilter = filter === 'all' || exam.status === filter;
      const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (exam.lab && exam.lab.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [exams, filter, searchQuery]);

  const handleDownload = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">Meus Exames</h1>
        <p className="text-vitta-text-secondary">Acompanhe seus resultados e histórico de exames.</p>
      </section>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setFilter('ready')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'ready' ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'}`}
          >
            Prontos
          </button>
          <button 
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'pending' ? 'bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20' : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'}`}
          >
            Pendentes
          </button>
        </div>
        
        <div className="relative w-full lg:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted group-focus-within:text-vitta-accent transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar exames ou laboratórios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary shadow-sm"
          />
        </div>
      </div>

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-vitta-surface-2 border-b border-vitta-border">
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">Exame</th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">Local</th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredExams.length > 0 ? filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-vitta-surface-2 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-vitta-green-bg text-vitta-green rounded-lg">
                        <FileText size={18} />
                      </div>
                      <span className="font-bold text-sm text-vitta-text-primary">{exam.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                    {exam.scheduledAt ? new Date(exam.scheduledAt.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                    {exam.lab || 'Laboratório ViTTA'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      exam.status === 'ready' ? 'bg-vitta-green-bg text-vitta-green' :
                      exam.status === 'pending' ? 'bg-vitta-amber-bg text-vitta-amber' :
                      'bg-vitta-surface-2 text-vitta-text-muted'
                    }`}>
                      {exam.status === 'ready' ? 'Pronto' :
                       exam.status === 'pending' ? 'Pendente' : 'Agendado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {exam.status === 'ready' && (
                      <button 
                        onClick={() => handleDownload(exam.resultUrl)}
                        className="text-vitta-accent hover:text-vitta-accent/80 font-bold text-sm flex items-center gap-1 ml-auto transition-colors"
                      >
                        <Download size={16} />
                        Baixar
                      </button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-vitta-text-muted">
                    Nenhum exame encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ProfessionalsManagementView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'categories'>('list');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<'professional' | 'category' | null>(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    specialty: 'Médico', 
    vittaHealthDiscount: '',
    registrationNumber: '',
    availableDays: '',
    price: '',
    city: ''
  });

  useEffect(() => {
    const unsubscribeProfs = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });
    const unsubscribeCats = onSnapshot(query(collection(db, 'categories'), where('type', '==', 'professional')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });
    return () => {
      unsubscribeProfs();
      unsubscribeCats();
    };
  }, []);

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        await logAdminAction('DELETE_CATEGORY', `Excluiu a categoria de profissional ID: ${id}`);
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
      }
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        await deleteDoc(doc(db, 'professionals', id));
        await logAdminAction('DELETE_PROFESSIONAL', `Excluiu o profissional ID: ${id}`);
      } catch (err) {
        console.error('Erro ao excluir profissional:', err);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, type, ...data } = editingItem;
      const collectionName = type === 'professional' ? 'professionals' : 'categories';
      await updateDoc(doc(db, collectionName, id), data);
      await logAdminAction(`UPDATE_${type.toUpperCase()}`, `Editou o ${type === 'professional' ? 'profissional' : 'categoria'}: ${editingItem.name}`);
      setEditingItem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `professionals/${editingItem.id}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === 'professional') {
        await addDoc(collection(db, 'professionals'), {
          name: newItem.name,
          specialty: newItem.specialty,
          vittaHealthDiscount: newItem.vittaHealthDiscount || '0%',
          registrationNumber: newItem.registrationNumber,
          availableDays: newItem.availableDays,
          price: newItem.price,
          city: newItem.city,
          rating: 5.0,
          reviews: 0,
          imageUrl: 'https://picsum.photos/seed/prof/400/300',
          createdAt: new Date().toISOString()
        });
        await logAdminAction('CREATE_PROFESSIONAL', `Criou o profissional: ${newItem.name}`);
      } else if (isCreating === 'category') {
        await addDoc(collection(db, 'categories'), {
          name: newItem.name,
          slug: newItem.name.toLowerCase().replace(/\s+/g, '-'),
          type: 'professional',
          createdAt: new Date().toISOString()
        });
        await logAdminAction('CREATE_CATEGORY', `Criou a categoria de profissional: ${newItem.name}`);
      }
      setIsCreating(null);
      setNewItem({ 
        name: '', 
        specialty: 'Médico', 
        vittaHealthDiscount: '',
        registrationNumber: '',
        availableDays: '',
        price: '',
        city: ''
      });
    } catch (err) {
      console.error('Erro ao criar item:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit/Create Modal */}
      <AnimatePresence>
        {(editingItem || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingItem ? `Editar ${editingItem.type === 'professional' ? 'Profissional' : 'Categoria'}` : `Novo ${isCreating === 'professional' ? 'Profissional' : 'Categoria'}`}
                </h3>
                <button onClick={() => { setEditingItem(null); setIsCreating(null); }} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                    autoFocus
                  />
                </div>
                {(isCreating === 'professional' || (editingItem && editingItem.type === 'professional')) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Especialidade</label>
                      <input 
                        type="text" 
                        required
                        value={editingItem ? editingItem.specialty : newItem.specialty}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, specialty: e.target.value })
                          : setNewItem({ ...newItem, specialty: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Desconto ViTTA Health</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 20% OFF"
                        value={editingItem ? editingItem.vittaHealthDiscount : newItem.vittaHealthDiscount}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, vittaHealthDiscount: e.target.value })
                          : setNewItem({ ...newItem, vittaHealthDiscount: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Número do Registro</label>
                      <input 
                        type="text" 
                        placeholder="Ex: CRM 12345"
                        value={editingItem ? editingItem.registrationNumber : newItem.registrationNumber}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, registrationNumber: e.target.value })
                          : setNewItem({ ...newItem, registrationNumber: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Dias de Atendimento</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Seg, Qua, Sex"
                        value={editingItem ? editingItem.availableDays : newItem.availableDays}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, availableDays: e.target.value })
                          : setNewItem({ ...newItem, availableDays: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Valor (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: R$ 150,00"
                          value={editingItem ? editingItem.price : newItem.price}
                          onChange={(e) => editingItem 
                            ? setEditingItem({ ...editingItem, price: e.target.value })
                            : setNewItem({ ...newItem, price: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Cidade</label>
                        <input 
                          type="text" 
                          placeholder="Ex: São Paulo"
                          value={editingItem ? editingItem.city : newItem.city}
                          onChange={(e) => editingItem 
                            ? setEditingItem({ ...editingItem, city: e.target.value })
                            : setNewItem({ ...newItem, city: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                        />
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setEditingItem(null); setIsCreating(null); }}
                    className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-green text-white rounded-xl font-bold shadow-lg shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">Gerenciar Profissionais</h1>
          <p className="text-vitta-text-secondary">Cadastre especialistas e gerencie categorias</p>
        </div>
        <button 
          onClick={() => setIsCreating(activeSubTab === 'list' ? 'professional' : 'category')}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-green text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-green/20"
        >
          <Plus size={20} />
          {activeSubTab === 'list' ? 'Novo Profissional' : 'Nova Categoria'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-vitta-border">
        <button 
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'list' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <Users size={18} />
          Profissionais ({professionals.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'categories' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-secondary hover:text-vitta-text-primary'
          }`}
        >
          <LayoutGrid size={18} />
          Categorias ({categories.length})
        </button>
      </div>

      {activeSubTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((prof) => (
            <motion.div 
              key={prof.id}
              whileHover={{ y: -4 }}
              className="bg-vitta-surface p-6 rounded-2xl border border-vitta-border shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img src={prof.imageUrl} alt={prof.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-vitta-text-primary">{prof.name}</h3>
                    <p className="text-xs text-vitta-text-secondary">{prof.specialty}</p>
                    {prof.registrationNumber && (
                      <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mt-1">
                        {prof.registrationNumber}
                      </p>
                    )}
                    {prof.city && (
                      <p className="text-[10px] text-vitta-text-secondary mt-0.5">
                        {prof.city}
                      </p>
                    )}
                    {prof.price && (
                      <p className="text-xs font-bold text-vitta-green mt-1">
                        {prof.price}
                      </p>
                    )}
                    {prof.vittaHealthDiscount && (
                      <p className="text-[10px] font-bold text-vitta-green mt-1">
                        Desconto: {prof.vittaHealthDiscount}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setEditingItem({ 
                      type: 'professional', 
                      id: prof.id, 
                      name: prof.name, 
                      specialty: prof.specialty,
                      vittaHealthDiscount: prof.vittaHealthDiscount || ''
                    })}
                    className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProfessional(prof.id)}
                    className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-vitta-border flex justify-between items-center">
                <div className="flex items-center gap-1 text-vitta-amber">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{prof.rating}</span>
                </div>
                <span className="px-2 py-1 bg-vitta-green-bg text-vitta-green text-[10px] font-bold uppercase rounded-lg">
                  Ativo
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((category) => (
            <motion.div
              key={category.id}
              whileHover={{ y: -2 }}
              className="bg-vitta-surface p-5 rounded-2xl border border-vitta-border shadow-sm flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-vitta-text-primary">{category.name}</h3>
                <p className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest">{category.slug}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingItem({ type: 'category', id: category.id, name: category.name })}
                  className="p-1.5 text-vitta-text-muted hover:text-vitta-accent transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1.5 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfessionalsView = ({ user }: { user: any }) => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingProfessional, setBookingProfessional] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todos');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });
    return () => unsubscribe();
  }, []);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter(prof => {
      const matchesSearch = 
        prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'Todos' || prof.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [professionals, searchQuery, selectedSpecialty]);

  const specialties = useMemo(() => {
    const specs = new Set(professionals.map(p => p.specialty));
    return ['Todos', ...Array.from(specs)];
  }, [professionals]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">Nossos Profissionais</h1>
        <p className="text-vitta-text-secondary">Encontre os melhores especialistas para cuidar de você.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou especialidade..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {specialties.map(spec => (
            <button 
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSpecialty === spec 
                  ? 'bg-vitta-green text-white' 
                  : 'bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2'
              }`}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : filteredProfessionals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfessionals.map((prof) => (
            <motion.div 
              key={prof.id}
              whileHover={{ y: -4 }}
              className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm space-y-4"
            >
                <div className="flex items-center gap-4">
                  <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">{prof.name}</h3>
                    <p className="text-sm text-vitta-text-secondary">{prof.specialty}</p>
                    {prof.registrationNumber && (
                      <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mt-1">
                        {prof.registrationNumber}
                      </p>
                    )}
                    {prof.city && (
                      <div className="flex items-center gap-1 text-[10px] text-vitta-text-muted mt-1">
                        <MapPin size={10} />
                        <span>{prof.city}</span>
                      </div>
                    )}
                    {prof.vittaHealthDiscount && (
                      <div className="mt-1 px-2 py-0.5 bg-vitta-green-bg text-vitta-green rounded-lg text-[10px] font-bold inline-block">
                        ViTTA Health: {prof.vittaHealthDiscount}
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-vitta-amber mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{prof.rating} ({prof.reviews} avaliações)</span>
                    </div>
                    {prof.price && (
                      <p className="text-sm font-bold text-vitta-green mt-1">
                        {prof.price}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-vitta-border">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider mb-2">Disponibilidade</p>
                  <div className="flex flex-wrap gap-2">
                    {(prof.availableDays ? (typeof prof.availableDays === 'string' ? prof.availableDays.split(',').map((s: string) => s.trim()) : prof.availableDays) : ['Seg', 'Qua', 'Sex']).map((day: string) => (
                      <span key={day} className="px-2 py-1 bg-vitta-surface-2 text-vitta-text-secondary rounded-lg text-[10px] font-bold">
                        {day}
                      </span>
                    ))}
                  </div>
                </div>
              <button 
                onClick={() => setBookingProfessional(prof)}
                className="w-full py-3 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors shadow-lg shadow-vitta-green/20"
              >
                Agendar Consulta
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-dashed border-vitta-border">
          <Search size={48} className="mx-auto text-vitta-text-muted mb-4" />
          <p className="text-vitta-text-secondary font-medium">Nenhum profissional encontrado para sua busca.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedSpecialty('Todos'); }}
            className="mt-4 text-vitta-green font-bold hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <BookingModal 
        isOpen={!!bookingProfessional} 
        onClose={() => setBookingProfessional(null)} 
        professional={bookingProfessional} 
        user={user} 
      />
    </div>
  );
};

const getIcon = (iconName: string, size = 24, className = "text-white") => {
  const icons: { [key: string]: any } = {
    Heart, Store, Glasses, ShoppingCart, Shirt, Baby, Footprints, Zap, Armchair, Hammer, Coffee, Pizza, IceCream, Fuel, PawPrint, Calculator, Scissors, Wrench, Pill, ShoppingBag, Utensils, Car, GraduationCap, Dumbbell, Stethoscope, Gamepad2, Book, Music, Camera, Plane, Home, Smartphone
  };
  const IconComp = icons[iconName] || HelpCircle;
  return <IconComp size={size} className={className} />;
};

const PartnersView = ({ setActiveTab, user }: { setActiveTab?: (tab: string) => void, user?: any }) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const unsubscribePartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPartners(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'partners');
    });

    const unsubscribeCategories = onSnapshot(query(collection(db, 'categories'), where('type', '==', 'partner')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    return () => {
      unsubscribePartners();
      unsubscribeCategories();
    };
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const filteredPartners = useMemo(() => {
    return partners.filter(partner => {
      const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || partner.category === selectedCategory.name;
      return matchesSearch && matchesCategory;
    });
  }, [partners, searchQuery, selectedCategory]);

  const getPartnersCount = (categoryName: string) => {
    return partners.filter(p => p.category === categoryName).length;
  };

  const handleGetDiscount = (partner: any) => {
    if (!user) return;
    const phoneNumber = '5528999881386';
    const message = `Olá! Sou afiliado ViTTA e gostaria de obter o desconto no parceiro.\n\n*Meus dados:*\nNome: ${user.displayName || 'Usuário'}\nEmail: ${user.email}\n\n*Parceiro:*\nNome: ${partner.name}\nDesconto: ${partner.discount}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (selectedCategory) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSelectedCategory(null)}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors text-vitta-text-primary"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-vitta-text-primary">{selectedCategory.name}</h1>
            <p className="text-vitta-text-secondary">Veja todos os parceiros nesta categoria</p>
          </div>
        </div>

        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <motion.div 
                key={partner.id}
                whileHover={{ y: -4 }}
                className="bg-vitta-surface p-6 rounded-2xl border border-vitta-border shadow-sm space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img src={partner.imageUrl || "https://picsum.photos/seed/partner/100/100"} alt={partner.name} className="w-16 h-16 rounded-2xl object-cover border border-vitta-border" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-vitta-text-primary truncate">{partner.name}</h3>
                    <p className="text-sm text-vitta-green font-bold">{partner.discount}</p>
                    <div className="flex items-center gap-1 text-vitta-amber mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{partner.rating || '5.0'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-vitta-border space-y-2">
                  <div className="flex items-start gap-2 text-xs text-vitta-text-secondary">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{partner.address || 'Endereço não informado'}</span>
                  </div>
                  {partner.phone && (
                    <div className="flex items-center gap-2 text-xs text-vitta-text-secondary">
                      <Phone size={14} className="flex-shrink-0" />
                      <span>{partner.phone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => handleGetDiscount(partner)}
                    className="flex-1 py-2.5 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors shadow-lg shadow-vitta-green/20"
                  >
                    Obter Desconto
                  </button>
                  <button className="p-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl hover:bg-vitta-border transition-colors">
                    <Info size={20} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-dashed border-vitta-border">
            <Search size={48} className="mx-auto text-vitta-text-muted mb-4" />
            <p className="text-vitta-text-secondary font-medium">Nenhum parceiro encontrado nesta categoria.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-vitta-accent to-vitta-purple rounded-[2.5rem] p-10 lg:p-16 text-white shadow-xl shadow-vitta-accent/20">
        <div className="relative z-10 max-w-2xl">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
            <Store size={32} />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Convênios ViTTA</h1>
          <p className="text-lg text-vitta-surface opacity-90 leading-relaxed">
            Descontos exclusivos em centenas de estabelecimentos parceiros em diversas categorias.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-vitta-accent/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </section>

      {/* ViTTA Health Section */}
      <section className="bg-vitta-green-bg rounded-[2.5rem] p-8 border border-vitta-green/30">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-vitta-green rounded-3xl flex items-center justify-center shadow-lg shadow-vitta-green/20 flex-shrink-0">
            <Stethoscope size={48} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-bold text-vitta-text-primary">ViTTA Health</h2>
            <p className="text-vitta-text-secondary">
              Acesse nossa rede exclusiva de profissionais de saúde com descontos especiais para afiliados ViTTA.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab?.('professionals')}
            className="px-8 py-4 bg-vitta-green text-white rounded-2xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20 whitespace-nowrap"
          >
            Ver Profissionais
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Categorias Disponíveis', value: categories.length, color: 'text-vitta-green' },
          { label: 'Estabelecimentos Parceiros', value: partners.length + '+', color: 'text-vitta-accent' },
          { label: 'De Desconto para Afiliados', value: 'Até 50%', color: 'text-vitta-danger' },
        ].map((stat, i) => (
          <div key={i} className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm text-center space-y-1">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={20} />
        <input 
          type="text" 
          placeholder="Buscar categoria de convênio..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-vitta-surface border border-vitta-border rounded-xl text-lg shadow-sm focus:ring-2 focus:ring-vitta-accent/20 transition-all text-vitta-text-primary outline-none"
        />
      </div>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-vitta-text-primary">{filteredCategories.length} Categorias</h2>
            <p className="text-vitta-text-secondary">Explore todos os convênios disponíveis para afiliados ViTTA</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-48" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((cat) => (
              <motion.div 
                key={cat.id}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedCategory(cat)}
                className="group cursor-pointer bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden flex flex-col h-full"
              >
                <div className={`h-32 ${cat.color || 'bg-vitta-text-muted'} relative flex items-center justify-center transition-transform group-hover:scale-105 duration-500`}>
                  {getIcon(cat.icon)}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                    {getPartnersCount(cat.name)} parceiros
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-vitta-text-primary mb-1">{cat.name}</h3>
                  <p className="text-xs text-vitta-text-secondary line-clamp-2">{cat.description || 'Descontos exclusivos para afiliados'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-vitta-surface rounded-xl border border-dashed border-vitta-border">
            <Search size={48} className="mx-auto text-vitta-text-muted mb-4" />
            <p className="text-vitta-text-secondary font-medium">Nenhuma categoria encontrada para sua busca.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-4 text-vitta-accent font-bold hover:underline"
            >
              Limpar busca
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

const OffersView = ({ user }: { user?: any }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRedeem = async (offer: any) => {
    if (!user) return;
    
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Oferta Resgatada',
        message: `Você resgatou a oferta "${offer.title}" de ${offer.partner}.`,
        type: 'offer',
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (err) {
      console.error('Erro ao criar notificação de oferta:', err);
    }

    const phoneNumber = '5528999881386';
    const message = `Olá! Sou afiliado ViTTA e gostaria de resgatar uma oferta.\n\n*Meus dados:*\nNome: ${user.displayName || 'Usuário'}\nEmail: ${user.email}\n\n*Oferta:*\nTítulo: ${offer.title}\nParceiro: ${offer.partner}\nDesconto: ${offer.discount}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'offers'), (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'offers');
    });
    return () => unsubscribe();
  }, []);

  const filteredOffers = useMemo(() => {
    return offers.filter(offer => 
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description && offer.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [offers, searchQuery]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">Benefícios e Ofertas</h1>
          <p className="text-vitta-text-secondary">Aproveite descontos exclusivos em nossa rede de parceiros.</p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted group-focus-within:text-vitta-green transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar ofertas ou parceiros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 outline-none transition-all text-vitta-text-primary shadow-sm"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))
        ) : filteredOffers.length > 0 ? (
          filteredOffers.map((offer) => (
            <motion.div 
              key={offer.id}
              whileHover={{ scale: 1.02 }}
              className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden flex flex-col"
            >
              <div className="relative h-48">
                <img src={offer.imageUrl || 'https://picsum.photos/seed/offer/400/300'} alt={offer.title} className="w-full h-full object-cover" />
                <div className="absolute top-4 left-4 bg-vitta-surface/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-vitta-text-secondary shadow-sm">
                  {offer.partner}
                </div>
                <div className="absolute bottom-4 right-4 bg-vitta-green text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                  {offer.discount}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-xl mb-2 text-vitta-text-primary">{offer.title}</h3>
                <p className="text-sm text-vitta-text-secondary mb-6 flex-1">{offer.description || 'Aproveite esta oferta exclusiva para membros.'}</p>
                <button 
                  onClick={() => handleRedeem(offer)}
                  className="w-full py-3 bg-vitta-accent text-white rounded-xl text-sm font-bold hover:bg-vitta-accent/90 transition-all"
                >
                  Resgatar Cupom
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-vitta-surface rounded-3xl border border-dashed border-vitta-border">
            <Store size={48} className="mx-auto text-vitta-text-muted mb-4" />
            <p className="text-vitta-text-secondary font-medium">Nenhuma oferta disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsView = ({ isDarkMode, setIsDarkMode, user, userData }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void, user: FirebaseUser | null, userData: any }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFrontFile, setSelectedFrontFile] = useState<File | null>(null);
  const [selectedBackFile, setSelectedBackFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    name: userData?.name || user?.displayName || '',
    email: userData?.email || user?.email || '',
    phone: userData?.phone || '',
    zip: userData?.zip || '',
    street: userData?.street || '',
    number: userData?.number || '',
    complement: userData?.complement || '',
    neighborhood: userData?.neighborhood || '',
    city: userData?.city || '',
    state: userData?.state || '',
    cpf: userData?.cpf || '',
    rg: userData?.rg || '',
    documentFrontUrl: userData?.documentFrontUrl || '',
    documentBackUrl: userData?.documentBackUrl || '',
    photoURL: userData?.photoURL || user?.photoURL || 'https://picsum.photos/seed/user/200/200',
    deletionRequested: userData?.deletionRequested || false,
    twoFactorEnabled: userData?.twoFactorEnabled || false
  });

  useEffect(() => {
    if (userData) {
      setProfileData(prev => ({
        ...prev,
        name: userData.name || prev.name,
        email: userData.email || prev.email,
        phone: userData.phone || prev.phone,
        zip: userData.zip || prev.zip,
        street: userData.street || prev.street,
        number: userData.number || prev.number,
        complement: userData.complement || prev.complement,
        neighborhood: userData.neighborhood || prev.neighborhood,
        city: userData.city || prev.city,
        state: userData.state || prev.state,
        cpf: userData.cpf || prev.cpf,
        rg: userData.rg || prev.rg,
        documentFrontUrl: userData.documentFrontUrl || prev.documentFrontUrl,
        documentBackUrl: userData.documentBackUrl || prev.documentBackUrl,
        photoURL: userData.photoURL || prev.photoURL,
        deletionRequested: userData.deletionRequested || false,
        twoFactorEnabled: userData.twoFactorEnabled || false
      }));
    }
  }, [userData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        alert('A imagem deve ter menos de 1MB.');
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFrontFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('A imagem deve ter menos de 5MB.');
        return;
      }
      setSelectedFrontFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, documentFrontUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('A imagem deve ter menos de 5MB.');
        return;
      }
      setSelectedBackFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, documentBackUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      let finalPhotoURL = profileData.photoURL;
      let finalFrontUrl = profileData.documentFrontUrl;
      let finalBackUrl = profileData.documentBackUrl;

      if (selectedFile) {
        const storageRef = ref(storage, `users/${user.uid}/profile_photo`);
        await uploadBytes(storageRef, selectedFile);
        finalPhotoURL = await getDownloadURL(storageRef);
      }

      if (selectedFrontFile) {
        const frontRef = ref(storage, `users/${user.uid}/documents/front_id`);
        await uploadBytes(frontRef, selectedFrontFile);
        finalFrontUrl = await getDownloadURL(frontRef);
      }

      if (selectedBackFile) {
        const backRef = ref(storage, `users/${user.uid}/documents/back_id`);
        await uploadBytes(backRef, selectedBackFile);
        finalBackUrl = await getDownloadURL(backRef);
      }

      const updatedData = {
        ...userData,
        ...profileData,
        photoURL: finalPhotoURL,
        documentFrontUrl: finalFrontUrl,
        documentBackUrl: finalBackUrl,
        uid: user.uid,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
      
      // Also update Auth profile if name or photo changed
      if (profileData.name !== user.displayName || finalPhotoURL !== user.photoURL) {
        await updateProfile(user, {
          displayName: profileData.name,
          photoURL: finalPhotoURL
        });
      }
      
      setSelectedFile(null);
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      console.error('Erro ao salvar perfil:', err);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    const newValue = !profileData.twoFactorEnabled;
    try {
      await setDoc(doc(db, 'users', user.uid), {
        twoFactorEnabled: newValue
      }, { merge: true });
      setProfileData(prev => ({ ...prev, twoFactorEnabled: newValue }));
      alert(newValue ? '2FA ativado com sucesso!' : '2FA desativado.');
    } catch (err) {
      console.error('Erro ao alternar 2FA:', err);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja solicitar a exclusão da sua conta? Esta ação será processada pela nossa equipe.')) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          deletionRequested: true,
          deletionRequestedAt: new Date().toISOString()
        }, { merge: true });
        
        // Confirmation notification
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Solicitação de Exclusão',
          message: 'Recebemos sua solicitação de exclusão de conta. Nossa equipe processará o pedido em breve.',
          type: 'system',
          read: false,
          createdAt: Timestamp.now()
        });
        
        setProfileData(prev => ({ ...prev, deletionRequested: true }));
        alert('Solicitação de exclusão enviada com sucesso.');
      } catch (err) {
        console.error('Erro ao solicitar exclusão:', err);
      }
    }
  };

  return (
      <div className="max-w-4xl space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">Meu Perfil</h1>
        <p className="text-vitta-text-secondary">Gerencie suas informações pessoais, endereço e documentos.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">Informações Pessoais</h2>
              <User className="text-vitta-green" size={20} />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <img 
                  src={profileData.photoURL} 
                  alt="Profile" 
                  className="w-32 h-32 rounded-xl object-cover border-4 border-vitta-surface-2 shadow-lg" 
                  referrerPolicy="no-referrer"
                />
                <label className="absolute -bottom-2 -right-2 p-2.5 bg-vitta-green text-white rounded-xl shadow-lg border-4 border-vitta-surface hover:scale-110 transition-transform cursor-pointer">
                  <Camera size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={profileData.name} 
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">E-mail</label>
                  <input 
                    type="email" 
                    value={profileData.email} 
                    disabled
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-muted cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Telefone</label>
                  <input 
                    type="tel" 
                    value={profileData.phone} 
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">Endereço</h2>
              <MapPin className="text-vitta-accent" size={20} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">CEP</label>
                <input 
                  type="text" 
                  value={profileData.zip} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, zip: e.target.value }))}
                  placeholder="00000-000"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Logradouro</label>
                <input 
                  type="text" 
                  value={profileData.street} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, street: e.target.value }))}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Número</label>
                <input 
                  type="text" 
                  value={profileData.number} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, number: e.target.value }))}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Complemento</label>
                <input 
                  type="text" 
                  value={profileData.complement} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, complement: e.target.value }))}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Bairro</label>
                <input 
                  type="text" 
                  value={profileData.neighborhood} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Cidade</label>
                <input 
                  type="text" 
                  value={profileData.city} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Estado</label>
                <input 
                  type="text" 
                  value={profileData.state} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="UF"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all" 
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">Documentos</h2>
              <CreditCard className="text-vitta-purple" size={20} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">CPF</label>
                <input 
                  type="text" 
                  value={profileData.cpf} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-purple/20 transition-all" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">RG</label>
                <input 
                  type="text" 
                  value={profileData.rg} 
                  onChange={(e) => setProfileData(prev => ({ ...prev, rg: e.target.value }))}
                  placeholder="00.000.000-0"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-purple/20 transition-all" 
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div className="pt-4 border-t border-vitta-border">
              <h3 className="text-sm font-bold text-vitta-text-primary mb-4">Fotos do Documento (RG ou CNH)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Front */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Frente</label>
                  <div className="relative group w-full h-40 bg-vitta-surface-2 rounded-xl border-2 border-dashed border-vitta-border hover:border-vitta-purple/50 transition-colors overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                    {profileData.documentFrontUrl ? (
                      <img src={profileData.documentFrontUrl} alt="Frente do Documento" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center text-vitta-text-muted group-hover:text-vitta-purple transition-colors">
                        <Camera size={32} className="mb-2" />
                        <span className="text-xs font-bold">Adicionar Frente</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFrontFileChange} />
                  </div>
                </div>

                {/* Back */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Verso</label>
                  <div className="relative group w-full h-40 bg-vitta-surface-2 rounded-xl border-2 border-dashed border-vitta-border hover:border-vitta-purple/50 transition-colors overflow-hidden flex flex-col items-center justify-center cursor-pointer">
                    {profileData.documentBackUrl ? (
                      <img src={profileData.documentBackUrl} alt="Verso do Documento" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="flex flex-col items-center text-vitta-text-muted group-hover:text-vitta-purple transition-colors">
                        <Camera size={32} className="mb-2" />
                        <span className="text-xs font-bold">Adicionar Verso</span>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleBackFileChange} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-vitta-green text-white rounded-xl font-bold shadow-xl shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              Salvar Todas as Alterações
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">Segurança</h2>
              <Lock className="text-vitta-accent" size={20} />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-vitta-surface-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-vitta-accent-bg text-vitta-accent rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-vitta-text-primary">2FA</p>
                    <p className="text-[10px] text-vitta-text-secondary">Camada extra</p>
                  </div>
                </div>
                <button 
                  onClick={handleToggle2FA}
                  className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                    profileData.twoFactorEnabled 
                      ? 'bg-vitta-green text-white border-vitta-green hover:bg-vitta-green/90' 
                      : 'bg-vitta-surface border-vitta-border text-vitta-text-primary hover:bg-vitta-surface-2'
                  }`}
                >
                  {profileData.twoFactorEnabled ? 'Ativo' : 'Ativar'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-vitta-surface-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-vitta-amber-bg text-vitta-amber rounded-xl">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-vitta-text-primary">Senha</p>
                    <p className="text-[10px] text-vitta-text-secondary">Alterar senha</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-3 py-1.5 bg-vitta-surface border border-vitta-border rounded-lg text-[10px] font-bold text-vitta-text-primary hover:bg-vitta-surface-2 transition-colors"
                >
                  Alterar
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <h2 className="text-lg font-bold border-b border-vitta-border pb-4 text-vitta-text-primary">Preferências</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-vitta-text-primary">Notificações</p>
                  <p className="text-[10px] text-vitta-text-secondary">Alertas de consultas</p>
                </div>
                <div className="w-10 h-5 bg-vitta-green rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-vitta-text-primary">Modo Escuro</p>
                  <p className="text-[10px] text-vitta-text-muted">Interface noturna</p>
                </div>
                <div 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-vitta-green' : 'bg-vitta-border'}`}
                >
                  <motion.div 
                    animate={{ x: isDarkMode ? 20 : 4 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-vitta-danger/5 p-8 rounded-xl border border-vitta-danger/20 space-y-4">
            <h2 className="text-[10px] font-bold text-vitta-danger uppercase tracking-widest">Zona de Perigo</h2>
            {profileData.deletionRequested ? (
              <div className="p-4 bg-vitta-surface rounded-xl border border-vitta-danger/30">
                <p className="text-xs font-bold text-vitta-danger">Solicitação de exclusão em processamento.</p>
                <p className="text-[10px] text-vitta-text-muted mt-1">Nossa equipe entrará em contato em breve.</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-vitta-text-muted">Uma vez solicitada, nossa equipe processará a exclusão dos seus dados.</p>
                <button 
                  onClick={handleRequestDeletion}
                  className="w-full py-3 bg-vitta-surface border border-vitta-danger/30 text-vitta-danger rounded-xl text-xs font-bold hover:bg-vitta-danger/5 transition-colors"
                >
                  Solicitar Exclusão
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {isPasswordModalOpen && (
        <ChangePasswordModal user={user} onClose={() => setIsPasswordModalOpen(false)} />
      )}
    </div>
  );
};

const UserExamsManagementView = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ userId: '', name: '', lab: 'Laboratório ViTTA', status: 'pending', resultUrl: '' });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeExams = onSnapshot(query(collection(db, 'exams'), orderBy('createdAt', 'desc')), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });

    const unsubscribeExamTypes = onSnapshot(collection(db, 'exams'), (snapshot) => {
      // Filter out user-specific exams to get only the types
      // Actually, we should have a separate collection for exam types, but for now we use 'exams'
      // Wait, the previous ExamsManagementView adds to 'exams' collection too.
      // This is a bit confusing. Let's assume 'exams' collection stores both types and user exams for now,
      // but user exams have a 'userId' field.
      setExamTypes(snapshot.docs.filter(doc => !doc.data().userId).map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubscribeExams();
      unsubscribeUsers();
      unsubscribeExamTypes();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.userId || !newItem.name) return;

    try {
      setUploading('new');
      let resultUrl = newItem.resultUrl;

      if (selectedFile) {
        const storageRef = ref(storage, `exam_results/${newItem.userId}/${Date.now()}_${selectedFile.name}`);
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        resultUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, 'exams'), {
        ...newItem,
        resultUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      await logAdminAction('CREATE_USER_EXAM', `Registrou exame ${newItem.name} para o usuário ID: ${newItem.userId}`);

      // Create notification for the user
      await addDoc(collection(db, 'notifications'), {
        userId: newItem.userId,
        title: 'Novo Exame Solicitado',
        message: `Um novo exame de ${newItem.name} foi registrado em sua conta.`,
        type: 'exam',
        read: false,
        createdAt: Timestamp.now()
      });

      setIsCreating(false);
      setNewItem({ userId: '', name: '', lab: 'Laboratório ViTTA', status: 'pending', resultUrl: '' });
      setSelectedFile(null);
      setUploading(null);
    } catch (err) {
      setUploading(null);
      handleFirestoreError(err, OperationType.CREATE, 'exams');
    }
  };

  const handleFileUpload = async (examId: string, userId: string, file: File) => {
    try {
      setUploading(examId);
      const storageRef = ref(storage, `exam_results/${userId}/${Date.now()}_${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const resultUrl = await getDownloadURL(uploadResult.ref);

      await updateDoc(doc(db, 'exams', examId), {
        resultUrl,
        status: 'ready',
        updatedAt: Timestamp.now()
      });

      await logAdminAction('UPLOAD_EXAM_RESULT', `Fez upload de resultado para exame ID: ${examId}`);

      const exam = exams.find(e => e.id === examId);
      await addDoc(collection(db, 'notifications'), {
        userId,
        title: 'Resultado de Exame Disponível',
        message: `O resultado do seu exame de ${exam?.name || 'exame'} já está disponível.`,
        type: 'exam',
        read: false,
        createdAt: Timestamp.now()
      });

      setUploading(null);
    } catch (err) {
      console.error(err);
      setUploading(null);
      alert('Erro ao fazer upload do arquivo.');
    }
  };

  const handleUpdateStatus = async (id: string, userId: string, examName: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'exams', id), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });

      await logAdminAction('UPDATE_USER_EXAM_STATUS', `Alterou status do exame ID: ${id} para ${newStatus}`);

      if (newStatus === 'ready') {
        await addDoc(collection(db, 'notifications'), {
          userId,
          title: 'Resultado de Exame Disponível',
          message: `O resultado do seu exame de ${examName} já está disponível para visualização.`,
          type: 'exam',
          read: false,
          createdAt: Timestamp.now()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `exams/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este exame?')) {
      try {
        await deleteDoc(doc(db, 'exams', id));
        await logAdminAction('DELETE_USER_EXAM', `Excluiu exame de usuário ID: ${id}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `exams/${id}`);
      }
    }
  };

  const userExams = exams.filter(e => e.userId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">Exames de Usuários</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          {isCreating ? <X size={20} /> : <Plus size={20} />}
          {isCreating ? 'Fechar' : 'Registrar Exame'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Usuário</label>
                <select 
                  required
                  value={newItem.userId}
                  onChange={(e) => setNewItem({ ...newItem, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>Selecione um Usuário</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Tipo de Exame</label>
                <select 
                  required
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>Selecione o Exame</option>
                  {examTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Resultado (Opcional)</label>
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-vitta-accent file:text-white hover:file:bg-vitta-accent/90 transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Status Inicial</label>
                <select 
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="pending">Pendente</option>
                  <option value="ready">Pronto</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={uploading === 'new'}
              className="w-full py-4 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {uploading === 'new' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : 'Registrar Exame para Usuário'}
            </button>
          </form>
        </motion.div>
      )}

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-vitta-surface-2 border-b border-vitta-border">
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Usuário / Exame</th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-8 py-4"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-8 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                  <td className="px-8 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                </tr>
              ))
            ) : userExams.length > 0 ? userExams.map((exam) => (
              <tr key={exam.id} className="hover:bg-vitta-surface-2 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-vitta-text-primary">{users.find(u => u.id === exam.userId)?.name || 'Usuário Desconhecido'}</span>
                    <span className="text-xs text-vitta-text-muted">{exam.name} - {exam.lab}</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <select 
                    value={exam.status}
                    onChange={(e) => handleUpdateStatus(exam.id, exam.userId, exam.name, e.target.value)}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-vitta-accent/20 outline-none ${
                      exam.status === 'ready' ? 'bg-vitta-green-bg text-vitta-green' : 'bg-vitta-amber-bg text-vitta-amber'
                    }`}
                  >
                    <option value="pending">Pendente</option>
                    <option value="ready">Pronto</option>
                  </select>
                </td>
                <td className="px-8 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <div className="relative">
                      <input 
                        type="file" 
                        id={`file-${exam.id}`}
                        className="hidden" 
                        accept=".pdf,image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(exam.id, exam.userId, file);
                        }}
                      />
                      <label 
                        htmlFor={`file-${exam.id}`}
                        className={`p-2 flex items-center justify-center text-vitta-text-muted hover:text-vitta-accent transition-colors cursor-pointer ${uploading === exam.id ? 'animate-pulse' : ''}`}
                        title="Upload de Resultado"
                      >
                        {uploading === exam.id ? (
                          <div className="w-4 h-4 border-2 border-vitta-accent/30 border-t-vitta-accent rounded-full animate-spin" />
                        ) : (
                          <Upload size={18} />
                        )}
                      </label>
                    </div>
                    {exam.resultUrl && (
                      <button 
                        onClick={() => window.open(exam.resultUrl, '_blank')}
                        className="p-2 text-vitta-text-muted hover:text-vitta-green transition-colors"
                        title="Ver Resultado"
                      >
                        <FileText size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(exam.id)} className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors" title="Excluir">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={3} className="px-8 py-12 text-center text-vitta-text-muted text-sm">Nenhum exame de usuário registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ExamsManagementView = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'exams'), (snapshot) => {
      setExams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exams');
    });
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'exams'), {
        ...newItem,
        createdAt: new Date().toISOString()
      });
      await logAdminAction('CREATE_EXAM_TYPE', `Criou o tipo de exame: ${newItem.name}`);
      setIsCreating(false);
      setNewItem({ name: '', price: '', description: '' });
    } catch (err) {
      console.error('Erro ao criar exame:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este exame?')) {
      try {
        await deleteDoc(doc(db, 'exams', id));
        await logAdminAction('DELETE_EXAM_TYPE', `Excluiu o tipo de exame ID: ${id}`);
      } catch (err) {
        console.error('Erro ao excluir exame:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">Gestão de Exames</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          <Plus size={20} />
          Novo Exame
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Nome do Exame"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
              <input 
                type="text" 
                placeholder="Preço (ex: R$ 150,00)"
                required
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <textarea 
              placeholder="Descrição"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary min-h-[100px]"
            />
            <div className="flex gap-3">
              <button type="submit" className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20">Salvar</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 bg-vitta-surface-2 border border-vitta-border text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-vitta-surface-2 border-b border-vitta-border">
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Exame</th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Preço</th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-vitta-surface-2 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-vitta-text-primary">{exam.name}</span>
                    <span className="text-xs text-vitta-text-muted line-clamp-1">{exam.description}</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm font-bold text-vitta-green">{exam.price}</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const OffersManagementView = () => {
  const [offers, setOffers] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({ title: '', discount: '', partner: '', imageUrl: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribeOffers = onSnapshot(query(collection(db, 'offers'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOffers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'offers');
    });

    const unsubscribeProfessionals = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });

    const unsubscribePartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      setPartners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'partners');
    });

    return () => {
      unsubscribeOffers();
      unsubscribeProfessionals();
      unsubscribePartners();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.discount || !newItem.partner) return;
    
    setIsSaving(true);
    try {
      if (editingItem) {
        await updateDoc(doc(db, 'offers', editingItem.id), {
          ...newItem,
          updatedAt: Timestamp.now()
        });
        await logAdminAction('UPDATE_OFFER', `Editou a oferta: ${newItem.title}`);
      } else {
        const offerRef = await addDoc(collection(db, 'offers'), {
          ...newItem,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        await logAdminAction('CREATE_OFFER', `Criou a oferta: ${newItem.title}`);
        
        // Broadcast notification to all users for new offer
        try {
          const usersSnap = await getDocs(collection(db, 'users'));
          const notificationPromises = usersSnap.docs.map(userDoc => 
            addDoc(collection(db, 'notifications'), {
              userId: userDoc.id,
              title: 'Nova Oferta Disponível!',
              message: `${newItem.partner} adicionou uma nova oferta: ${newItem.title}. Aproveite!`,
              type: 'offer',
              read: false,
              createdAt: Timestamp.now()
            })
          );
          await Promise.all(notificationPromises);
        } catch (notifyErr) {
          console.error('Erro ao enviar notificações de broadcast:', notifyErr);
        }
      }
      setIsCreating(false);
      setEditingItem(null);
      setNewItem({ title: '', discount: '', partner: '', imageUrl: '', description: '' });
    } catch (error) {
      handleFirestoreError(error, editingItem ? OperationType.UPDATE : OperationType.CREATE, 'offers');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (offer: any) => {
    setEditingItem(offer);
    setNewItem({
      title: offer.title,
      discount: offer.discount,
      partner: offer.partner,
      imageUrl: offer.imageUrl || '',
      description: offer.description || ''
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta oferta permanentemente?')) {
      try {
        await deleteDoc(doc(db, 'offers', id));
        await logAdminAction('DELETE_OFFER', `Excluiu a oferta ID: ${id}`);
        if (editingItem?.id === id) {
          setIsCreating(false);
          setEditingItem(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'offers');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">Gestão de Ofertas</h2>
        <button 
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingItem(null);
            setNewItem({ title: '', discount: '', partner: '', imageUrl: '', description: '' });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          {isCreating ? <X size={20} /> : <Plus size={20} />}
          {isCreating ? 'Fechar' : 'Nova Oferta'}
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
        >
          <h3 className="text-lg font-bold text-vitta-text-primary">{editingItem ? 'Editar Oferta' : 'Nova Oferta'}</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Título</label>
                <input 
                  type="text" 
                  placeholder="Título da Oferta"
                  required
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Desconto</label>
                <input 
                  type="text" 
                  placeholder="Ex: 20% OFF"
                  required
                  value={newItem.discount}
                  onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Parceiro</label>
                <select 
                  required
                  value={newItem.partner}
                  onChange={(e) => setNewItem({ ...newItem, partner: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>Selecione um Parceiro</option>
                  <optgroup label="Profissionais">
                    {professionals.map(prof => (
                      <option key={prof.id} value={prof.name}>{prof.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Estabelecimentos">
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.name}>{partner.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">URL da Imagem</label>
                <input 
                  type="text" 
                  placeholder="https://..."
                  value={newItem.imageUrl}
                  onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Descrição</label>
                <input 
                  type="text" 
                  placeholder="Breve descrição da oferta"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button 
                type="submit" 
                disabled={isSaving}
                className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {editingItem ? 'Salvar Alterações' : 'Criar Oferta'}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsCreating(false);
                  setEditingItem(null);
                }} 
                className="px-8 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-vitta-surface-2 border-b border-vitta-border">
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Oferta</th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Parceiro</th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Desconto</th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {offers.length > 0 ? offers.map((offer) => (
                <tr key={offer.id} className="hover:bg-vitta-surface-2 transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      {offer.imageUrl && (
                        <img src={offer.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                      )}
                      <span className="font-bold text-sm text-vitta-text-primary">{offer.title}</span>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="text-sm text-vitta-text-secondary">{offer.partner}</span>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-2 py-1 bg-vitta-danger/10 text-vitta-danger text-xs font-bold rounded-lg">{offer.discount}</span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleEdit(offer)} 
                        className="p-2 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(offer.id)} 
                        className="p-2 text-vitta-text-muted hover:text-vitta-danger hover:bg-vitta-danger/10 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-vitta-text-muted text-sm">
                    Nenhuma oferta cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const PartnershipsView = ({ setSubTab, setActiveTab }: { setSubTab?: (tab: any) => void, setActiveTab?: (tab: string) => void }) => {
  const [activeSubTab, setActiveSubTab] = useState<'establishments' | 'categories' | 'offers' | 'vitta-health'>('establishments');
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [profSearchQuery, setProfSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState<'partner' | 'category' | null>(null);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    category: '', 
    discount: '10% OFF', 
    slug: '', 
    address: '', 
    phone: '', 
    imageUrl: '',
    icon: 'Heart',
    color: 'bg-vitta-green',
    description: ''
  });

  useEffect(() => {
    const unsubscribePartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      console.log('DEBUG: PartnershipsView - Parceiros carregados:', data.length);
      setPartners(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'partners');
    });
    const unsubscribeCategories = onSnapshot(query(collection(db, 'categories'), where('type', '==', 'partner')), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });
    const unsubscribeProfessionals = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });
    return () => {
      unsubscribePartners();
      unsubscribeCategories();
      unsubscribeProfessionals();
    };
  }, []);

  const handleDeletePartner = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este estabelecimento?')) {
      try {
        await deleteDoc(doc(db, 'partners', id));
        await logAdminAction('DELETE_PARTNER', `Excluiu o parceiro ID: ${id}`);
      } catch (err) {
        console.error('Erro ao excluir parceiro:', err);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        await logAdminAction('DELETE_CATEGORY', `Excluiu a categoria de parceiro ID: ${id}`);
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
      }
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas as Categorias');

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas as Categorias' || partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredProfessionals = professionals.filter(prof => {
    const matchesSearch = prof.name.toLowerCase().includes(profSearchQuery.toLowerCase()) || 
                          prof.specialty.toLowerCase().includes(profSearchQuery.toLowerCase());
    return matchesSearch && prof.vittaHealthDiscount && prof.vittaHealthDiscount !== '0%';
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const { id, type, ...data } = editingItem;
      const collectionName = type === 'partner' ? 'partners' : 'categories';
      await updateDoc(doc(db, collectionName, id), data);
      await logAdminAction(`UPDATE_${type.toUpperCase()}`, `Editou o ${type === 'partner' ? 'parceiro' : 'categoria'}: ${editingItem.name}`);
      setEditingItem(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `partners/${editingItem.id}`);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === 'partner') {
        await addDoc(collection(db, 'partners'), {
          name: newItem.name,
          category: newItem.category || (categories.length > 0 ? categories[0].name : 'Geral'),
          discount: newItem.discount,
          address: newItem.address || '',
          phone: newItem.phone || '',
          rating: 5.0,
          reviews: 0,
          imageUrl: newItem.imageUrl || 'https://picsum.photos/seed/partner/400/300',
          createdAt: new Date().toISOString()
        });
        await logAdminAction('CREATE_PARTNER', `Criou o parceiro: ${newItem.name}`);
      } else if (isCreating === 'category') {
        await addDoc(collection(db, 'categories'), {
          name: newItem.name,
          slug: newItem.slug || newItem.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'),
          type: 'partner',
          icon: newItem.icon,
          color: newItem.color,
          description: newItem.description,
          createdAt: new Date().toISOString()
        });
        await logAdminAction('CREATE_CATEGORY', `Criou a categoria de parceiro: ${newItem.name}`);
      }
      setIsCreating(null);
      setNewItem({ 
        name: '', 
        category: '', 
        discount: '10% OFF', 
        slug: '', 
        address: '', 
        phone: '', 
        imageUrl: '',
        icon: 'Heart',
        color: 'bg-vitta-green',
        description: ''
      });
    } catch (err) {
      console.error('Erro ao criar item:', err);
    }
  };

  const getPartnersCountByCategory = (categoryName: string) => {
    return partners.filter(p => p.category === categoryName).length;
  };

  return (
    <div className="space-y-8">
      {/* Partner Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating === 'partner' || (editingItem && editingItem.type === 'partner')) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingItem ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
                </h3>
                <button onClick={() => { setEditingItem(null); setIsCreating(null); }} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Categoria</label>
                  <select 
                    value={editingItem ? editingItem.category : newItem.category}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, category: e.target.value })
                      : setNewItem({ ...newItem, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Desconto</label>
                  <input 
                    type="text" 
                    value={editingItem ? editingItem.discount : newItem.discount}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, discount: e.target.value })
                      : setNewItem({ ...newItem, discount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Telefone</label>
                  <input 
                    type="text" 
                    value={editingItem ? (editingItem.phone || '') : newItem.phone}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, phone: e.target.value })
                      : setNewItem({ ...newItem, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Endereço</label>
                  <input 
                    type="text" 
                    value={editingItem ? (editingItem.address || '') : newItem.address}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, address: e.target.value })
                      : setNewItem({ ...newItem, address: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">URL da Logomarca (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="https://exemplo.com/logo.png"
                    value={editingItem ? (editingItem.imageUrl || '') : newItem.imageUrl}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                      : setNewItem({ ...newItem, imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setEditingItem(null); setIsCreating(null); }}
                    className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">Gestão de Convênios</h1>
          <p className="text-vitta-text-secondary">Cadastre e gerencie estabelecimentos conveniados</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-vitta-border">
        <button 
          onClick={() => setActiveSubTab('establishments')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'establishments' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-muted hover:text-vitta-text-secondary'
          }`}
        >
          <Store size={18} />
          Empresas
        </button>
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'categories' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-muted hover:text-vitta-text-secondary'
          }`}
        >
          <Tag size={18} />
          Categorias
        </button>
        <button 
          onClick={() => setActiveSubTab('offers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'offers' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-muted hover:text-vitta-text-secondary'
          }`}
        >
          <Tag size={18} />
          Ofertas
        </button>
        <button 
          onClick={() => setActiveSubTab('vitta-health')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'vitta-health' 
              ? 'border-vitta-green text-vitta-green' 
              : 'border-transparent text-vitta-text-muted hover:text-vitta-text-secondary'
          }`}
        >
          <Activity size={18} />
          ViTTA Health
        </button>
      </div>

      {activeSubTab === 'establishments' && (
        <>
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setIsCreating('partner')}
              className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
            >
              <Plus size={20} />
              Novo Estabelecimento
            </button>
          </div>

          <div className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar estabelecimento..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="relative w-full md:w-64">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm appearance-none focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              >
                <option>Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-vitta-text-muted pointer-events-none" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <motion.div 
                key={partner.id}
                whileHover={{ y: -4 }}
                className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <img src={partner.imageUrl || 'https://picsum.photos/seed/partner/400/300'} alt={partner.name} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="px-2.5 py-1 bg-vitta-green-bg text-vitta-green text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Ativo
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-vitta-text-primary">{partner.name}</h3>
                    <span className="inline-block px-3 py-1 bg-vitta-accent-bg text-vitta-accent text-xs font-bold rounded-lg mt-1">
                      {partner.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-vitta-text-secondary">
                      <span className="font-bold">Desconto:</span> {partner.discount}
                    </p>
                    {partner.address && (
                      <p className="text-vitta-text-secondary">
                        <span className="font-bold">Endereço:</span> {partner.address}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => setEditingItem({ type: 'partner', ...partner })}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-primary hover:bg-vitta-surface-2 transition-colors"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeletePartner(partner.id)}
                      className="p-2.5 bg-vitta-danger/10 text-vitta-danger rounded-xl hover:bg-vitta-danger/20 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => setIsCreating(isCreating === 'category' ? null : 'category')}
              className={`flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20`}
            >
              {isCreating === 'category' ? <Plus size={20} className="rotate-45" /> : <Plus size={20} />}
              {isCreating === 'category' ? 'Cancelar' : 'Nova Categoria'}
            </button>
          </div>

          {isCreating === 'category' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold text-vitta-text-primary">Nova Categoria</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome</label>
                    <input 
                      type="text" 
                      placeholder="Nome da Categoria"
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Slug</label>
                    <input 
                      type="text" 
                      placeholder="slug"
                      value={newItem.slug}
                      onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Ícone (Lucide Name)</label>
                    <select 
                      value={newItem.icon}
                      onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Heart">Coração (Saúde)</option>
                      <option value="Pill">Pílula (Farmácia)</option>
                      <option value="ShoppingBag">Sacola (Compras)</option>
                      <option value="Utensils">Talheres (Alimentação)</option>
                      <option value="Car">Carro (Automotivo)</option>
                      <option value="GraduationCap">Chapéu (Educação)</option>
                      <option value="Dumbbell">Haltere (Fitness)</option>
                      <option value="Scissors">Tesoura (Beleza)</option>
                      <option value="Coffee">Café (Lazer)</option>
                      <option value="Stethoscope">Estetoscópio</option>
                      <option value="Shirt">Camisa</option>
                      <option value="Footprints">Sapatos</option>
                      <option value="Baby">Bebê</option>
                      <option value="Gamepad2">Games</option>
                      <option value="Book">Livros</option>
                      <option value="Music">Música</option>
                      <option value="Camera">Câmera</option>
                      <option value="Plane">Viagem</option>
                      <option value="Home">Casa</option>
                      <option value="Smartphone">Tecnologia</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Cor (Tailwind Class)</label>
                    <select 
                      value={newItem.color}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="bg-vitta-green">Verde</option>
                      <option value="bg-vitta-accent">Azul</option>
                      <option value="bg-vitta-danger">Vermelho</option>
                      <option value="bg-vitta-amber">Âmbar</option>
                      <option value="bg-vitta-purple">Roxo</option>
                      <option value="bg-vitta-text-muted">Cinza</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    placeholder="Breve descrição da categoria"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all"
                  >
                    Salvar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreating(null)}
                    className="px-8 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {editingItem && editingItem.type === 'category' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold text-vitta-text-primary">Editar Categoria</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Slug</label>
                    <input 
                      type="text" 
                      value={editingItem.slug}
                      onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Ícone (Lucide Name)</label>
                    <select 
                      value={editingItem.icon || 'Heart'}
                      onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Heart">Coração (Saúde)</option>
                      <option value="Pill">Pílula (Farmácia)</option>
                      <option value="ShoppingBag">Sacola (Compras)</option>
                      <option value="Utensils">Talheres (Alimentação)</option>
                      <option value="Car">Carro (Automotivo)</option>
                      <option value="GraduationCap">Chapéu (Educação)</option>
                      <option value="Dumbbell">Haltere (Fitness)</option>
                      <option value="Scissors">Tesoura (Beleza)</option>
                      <option value="Coffee">Café (Lazer)</option>
                      <option value="Stethoscope">Estetoscópio</option>
                      <option value="Shirt">Camisa</option>
                      <option value="Footprints">Sapatos</option>
                      <option value="Baby">Bebê</option>
                      <option value="Gamepad2">Games</option>
                      <option value="Book">Livros</option>
                      <option value="Music">Música</option>
                      <option value="Camera">Câmera</option>
                      <option value="Plane">Viagem</option>
                      <option value="Home">Casa</option>
                      <option value="Smartphone">Tecnologia</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Cor (Tailwind Class)</label>
                    <select 
                      value={editingItem.color || 'bg-vitta-green'}
                      onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="bg-vitta-green">Verde ViTTA</option>
                      <option value="bg-vitta-accent">Azul ViTTA</option>
                      <option value="bg-vitta-danger">Vermelho</option>
                      <option value="bg-vitta-amber">Âmbar</option>
                      <option value="bg-vitta-purple">Roxo</option>
                      <option value="bg-vitta-text-muted">Cinza</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    placeholder="Breve descrição da categoria"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all"
                  >
                    Atualizar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-8 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-vitta-surface-2 border-b border-vitta-border">
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Nome da Categoria</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Slug</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">Empresas</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vitta-border">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-vitta-surface-2 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${category.color || 'bg-vitta-surface-2 text-vitta-text-primary'} rounded-lg flex items-center justify-center text-white`}>
                          {getIcon(category.icon, 16)}
                        </div>
                        <span className="font-bold text-sm text-vitta-text-primary">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs text-vitta-text-muted font-mono">{category.slug}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-sm text-vitta-text-secondary">{getPartnersCountByCategory(category.name)}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingItem({ type: 'category', ...category })}
                          className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'offers' && (
        <OffersManagementView />
      )}

      {activeSubTab === 'vitta-health' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                if (setSubTab) setSubTab('professionals');
                if (setActiveTab) setActiveTab('professionals');
              }}
              className="flex items-center gap-2 px-6 py-3 bg-vitta-green hover:bg-vitta-green/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-green/20"
            >
              <Stethoscope size={20} />
              Gerenciar Profissionais
            </button>
          </div>

          <div className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar profissional na rede ViTTA Health..." 
                value={profSearchQuery}
                onChange={(e) => setProfSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((prof) => (
              <motion.div 
                key={prof.id}
                whileHover={{ y: -4 }}
                className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">{prof.name}</h3>
                    <p className="text-sm text-vitta-text-secondary">{prof.specialty}</p>
                    <div className="mt-1 px-2 py-0.5 bg-vitta-green-bg text-vitta-green rounded-lg text-[10px] font-bold inline-block">
                      ViTTA Health: {prof.vittaHealthDiscount}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-vitta-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-vitta-amber">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{prof.rating}</span>
                    </div>
                    <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider">
                      {prof.reviews} avaliações
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-vitta-accent text-white rounded-xl text-sm font-bold hover:bg-vitta-accent/90 transition-colors shadow-lg shadow-vitta-accent/20">
                    Ver Detalhes
                  </button>
                  <button className="p-2.5 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl hover:bg-vitta-border transition-colors">
                    <Calendar size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {filteredProfessionals.length === 0 && (
              <div className="col-span-full py-20 text-center bg-vitta-surface-2 rounded-xl border-2 border-dashed border-vitta-border">
                <div className="w-16 h-16 bg-vitta-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Activity className="text-vitta-text-muted" size={32} />
                </div>
                <h3 className="text-lg font-bold text-vitta-text-primary mb-1">Nenhum profissional encontrado</h3>
                <p className="text-vitta-text-secondary text-sm">Tente ajustar sua busca ou adicione descontos ViTTA Health aos profissionais.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SupportView = () => {
  const faqs = [
    { question: "O ViTTA cobra alguma taxa dos usuários?", answer: "Não, o ViTTA é um benefício gratuito para afiliados de empresas parceiras." },
    { question: "Como cancelo um agendamento?", answer: "Você pode cancelar seus agendamentos diretamente na aba 'Agendamentos' com até 24h de antecedência." },
    { question: "Onde vejo meus descontos?", answer: "Todos os descontos disponíveis estão na aba 'Convênios' e 'Ofertas'." },
    { question: "Como atualizar meus dados?", answer: "Acesse a aba 'Perfil' para editar suas informações pessoais e de contato." }
  ];

  return (
    <div className="space-y-10 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-vitta-green via-vitta-accent to-vitta-accent rounded-xl p-10 md:p-20 text-center text-white shadow-2xl shadow-vitta-green/20">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-inner">
            <HelpCircle size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">Central de Suporte ViTTA</h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto">
              Aproveite ao máximo todas as vantagens de ser um afiliado ViTTA
            </p>
          </div>
          <button className="flex items-center gap-3 px-10 py-5 bg-white text-vitta-green rounded-xl font-bold shadow-xl hover:bg-vitta-surface-2 transition-all transform hover:scale-105 active:scale-95 group">
            <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
            Iniciar Chat de Suporte
          </button>
        </div>
        
        {/* Decorative elements to match the "blobs" in the image */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-vitta-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-vitta-green/10 rounded-full blur-2xl"></div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: Heart, 
            title: "Saúde Integrada", 
            desc: "Acesso a profissionais qualificados em diversas especialidades", 
            color: "bg-vitta-green",
            shadow: "shadow-vitta-green/20"
          },
          { 
            icon: Tag, 
            title: "Descontos Exclusivos", 
            desc: "Cupons e ofertas especiais dos nossos parceiros", 
            color: "bg-vitta-accent",
            shadow: "shadow-vitta-accent/20"
          },
          { 
            icon: Wallet, 
            title: "Carteira Digital", 
            desc: "Gerencie seus créditos e pagamentos com facilidade", 
            color: "bg-vitta-amber",
            shadow: "shadow-vitta-amber/20"
          }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -8 }}
            className="bg-vitta-surface p-10 rounded-xl border border-vitta-border shadow-sm text-center space-y-5"
          >
            <div className={`w-16 h-16 ${item.color} rounded-xl mx-auto flex items-center justify-center text-white shadow-lg ${item.shadow}`}>
              <item.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-vitta-text-primary">{item.title}</h3>
              <p className="text-vitta-text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8 pt-4">
        <h2 className="text-3xl font-bold text-vitta-text-primary px-4">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:shadow-md transition-all overflow-hidden">
              <summary className="flex items-center justify-between p-7 cursor-pointer list-none">
                <span className="font-bold text-lg text-vitta-text-primary">{faq.question}</span>
                <div className="w-10 h-10 rounded-full bg-vitta-surface-2 flex items-center justify-center group-open:bg-vitta-accent-bg transition-colors">
                  <ChevronDown size={20} className="text-vitta-text-muted group-open:text-vitta-accent group-open:rotate-180 transition-all" />
                </div>
              </summary>
              <div className="px-7 pb-7 text-vitta-text-secondary text-base leading-relaxed border-t border-vitta-border pt-6">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Developer Footer */}
      <div className="bg-vitta-text-primary rounded-xl p-6 text-center space-y-2 border border-vitta-border">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
          <Code size={18} className="text-vitta-accent" />
          <span>Sistema PowerControl - Versão 1.0</span>
        </div>
        <p className="text-vitta-text-muted text-[10px]">
          © 2026 ViTTA. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

const UsersView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    status: 'Ativo',
    plan: 'Básico'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'users');
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        await logAdminAction('DELETE_USER', `Excluiu o usuário ID: ${id}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
      }
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingUser;
      await updateDoc(doc(db, 'users', id), data);
      await logAdminAction('UPDATE_USER', `Editou o usuário: ${data.email || id}`);
      setEditingUser(null);
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
      handleFirestoreError(err, OperationType.UPDATE, `users/${editingUser.id}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create user in Auth using a secondary app instance to avoid signing out current admin
      const secondaryApp = getApps().find(app => app.name === 'SecondaryApp') || initializeApp(firebaseConfig, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(secondaryAuth, newUser.email, newUser.password);
      const user = result.user;
      
      // 2. Update profile
      await updateProfile(user, { displayName: newUser.name });
      
      // 3. Create Firestore document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        plan: newUser.plan,
        role: 'user',
        createdAt: Timestamp.now()
      });
      
      // 4. Create welcome notification
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Bem-vindo à ViTTA Health!',
        message: `Olá ${newUser.name}, seu cadastro foi realizado com sucesso. Explore nossos serviços!`,
        type: 'info',
        read: false,
        createdAt: Timestamp.now()
      });
      
      // 5. Sign out from secondary app
      await signOut(secondaryAuth);
      
      // 6. Log action
      await logAdminAction('CREATE_USER', `Criou o usuário: ${newUser.email}`);
      
      setIsCreatingUser(false);
      setNewUser({ name: '', email: '', password: '', status: 'Ativo', plan: 'Básico' });
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setError('Falha ao criar usuário. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {isCreatingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">Novo Usuário</h3>
                <button onClick={() => setIsCreatingUser(false)} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                {error && (
                  <div className="p-4 bg-vitta-danger/10 text-vitta-danger text-sm rounded-xl border border-vitta-danger/20">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Senha Inicial</label>
                  <input 
                    type="password" 
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Status</label>
                    <select 
                      value={newUser.status}
                      onChange={(e) => setNewUser({ ...newUser, status: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Plano</label>
                    <select 
                      value={newUser.plan}
                      onChange={(e) => setNewUser({ ...newUser, plan: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsCreatingUser(false)}
                    className="flex-1 py-3 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">Editar Usuário</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">E-mail</label>
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Status</label>
                    <select 
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Plano</label>
                    <select 
                      value={editingUser.plan}
                      onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Básico">Básico</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 py-3 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">Gestão de Usuários</h2>
        <button 
          onClick={() => setIsCreatingUser(true)}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          <Plus size={20} />
          Novo Usuário
        </button>
      </div>
      
      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-vitta-surface-2 border-b border-vitta-border">
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Usuário</th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Plano</th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-vitta-surface-2 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.img} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div>
                      <p className="font-bold text-vitta-text-primary text-sm">{user.name}</p>
                      <p className="text-xs text-vitta-text-secondary">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    user.status === 'Ativo' ? 'bg-vitta-green-bg text-vitta-green' : 'bg-vitta-surface-2 text-vitta-text-muted'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-vitta-text-secondary font-medium">{user.plan}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserConfigView = () => {
  const [accessLevels, setAccessLevels] = useState([
    { id: 1, role: 'Administrador', desc: 'Acesso total ao sistema e configurações' },
    { id: 2, role: 'Moderador', desc: 'Gerenciamento de usuários e conteúdos' },
    { id: 3, role: 'Usuário Padrão', desc: 'Acesso às funcionalidades básicas' }
  ]);
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'system_configs', 'access_levels');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.levels && Array.isArray(data.levels)) {
          setAccessLevels(data.levels);
        }
      } else {
        // Initialize if it doesn't exist
        setDoc(docRef, { levels: accessLevels }, { merge: true }).catch(err => {
          console.error("Failed to initialize access levels", err);
        });
      }
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_configs/access_levels');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAccessLevels = accessLevels.map(al => al.id === editingLevel.id ? editingLevel : al);
    
    try {
      await setDoc(doc(db, 'system_configs', 'access_levels'), { levels: newAccessLevels }, { merge: true });
      await logAdminAction('UPDATE_ACCESS_LEVELS', 'Atualizou as configurações de níveis de acesso');
      setEditingLevel(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'system_configs/access_levels');
    }
  };

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {editingLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center">
                <h3 className="text-xl font-bold text-vitta-text-primary">Configurar Nível de Acesso</h3>
                <button onClick={() => setEditingLevel(null)} className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors">
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome do Nível</label>
                  <input 
                    type="text" 
                    value={editingLevel.role}
                    onChange={(e) => setEditingLevel({ ...editingLevel, role: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    value={editingLevel.desc}
                    onChange={(e) => setEditingLevel({ ...editingLevel, desc: e.target.value })}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingLevel(null)}
                    className="flex-1 py-3 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero Section - Following Support Model */}
      <div className="relative overflow-hidden bg-gradient-to-br from-vitta-accent via-vitta-accent to-vitta-accent rounded-xl p-8 md:p-16 text-center text-white shadow-2xl shadow-vitta-accent/20">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <UserCog size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Configurações de Usuário</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Gerencie permissões, acessos e preferências do sistema
          </p>
          <button className="flex items-center gap-2 px-8 py-4 bg-white text-vitta-accent rounded-xl font-bold shadow-lg hover:bg-vitta-surface-2 transition-all transform hover:scale-105 active:scale-95">
            <ShieldCheck size={20} />
            Verificar Permissões
          </button>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </div>

      {/* Config Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Access Levels */}
        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-vitta-accent-bg text-vitta-accent rounded-xl">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold text-vitta-text-primary">Níveis de Acesso</h3>
          </div>
          <div className="space-y-4">
            {accessLevels.map((item) => (
              <div key={item.id} className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border group hover:border-vitta-accent/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-vitta-text-primary">{item.role}</span>
                  <button 
                    onClick={() => setEditingLevel(item)}
                    className="text-xs font-bold text-vitta-accent hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Configurar
                  </button>
                </div>
                <p className="text-xs text-vitta-text-secondary">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Preferences */}
        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-vitta-green-bg text-vitta-green rounded-xl">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold text-vitta-text-primary">Preferências Globais</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">Auto-aprovação</p>
                <p className="text-xs text-vitta-text-secondary">Novos usuários são aprovados automaticamente</p>
              </div>
              <div className="w-10 h-5 bg-vitta-border rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">Logs de Auditoria</p>
                <p className="text-xs text-vitta-text-secondary">Registrar todas as ações administrativas</p>
              </div>
              <div className="w-10 h-5 bg-vitta-green rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">Manutenção</p>
                <p className="text-xs text-vitta-text-secondary">Ativar modo de manutenção do sistema</p>
              </div>
              <div className="w-10 h-5 bg-vitta-border rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-vitta-danger/10 text-vitta-danger rounded-xl">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold text-vitta-text-primary">Segurança</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
              <p className="text-sm font-bold text-vitta-text-primary mb-1">Autenticação em Duas Etapas (2FA)</p>
              <p className="text-xs text-vitta-text-secondary mb-3">Obrigatório para administradores</p>
              <button className="px-4 py-2 bg-vitta-danger text-white rounded-xl text-xs font-bold">Gerenciar</button>
            </div>
            <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
              <p className="text-sm font-bold text-vitta-text-primary mb-1">Política de Senhas</p>
              <p className="text-xs text-vitta-text-secondary">Mínimo 8 caracteres, letras e números</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-vitta-amber-bg text-vitta-amber rounded-xl">
              <Bell size={24} />
            </div>
            <h3 className="text-xl font-bold text-vitta-text-primary">Notificações</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">Alertas de Sistema</p>
                <p className="text-xs text-vitta-text-secondary">Receber notificações críticas</p>
              </div>
              <div className="w-10 h-5 bg-vitta-green rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">Relatórios Semanais</p>
                <p className="text-xs text-vitta-text-secondary">Receber resumo de atividades</p>
              </div>
              <div className="w-10 h-5 bg-vitta-green rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Section */}
      <AuditLogsList />
    </div>
  );
};

const AppointmentsView = ({ user }: { user: any }) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'), 
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort client-side to avoid index requirement for now
      data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAppointments(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'appointments');
    });
    return () => unsubscribe();
  }, [user]);

  const handleCancelApt = async (apt: any) => {
    if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      try {
        await deleteDoc(doc(db, 'appointments', apt.id));
        await addDoc(collection(db, 'notifications'), {
          userId: user.uid,
          title: 'Consulta Cancelada',
          message: `Sua consulta com ${apt.professionalName} foi cancelada.`,
          type: 'appointment',
          read: false,
          createdAt: Timestamp.now()
        });
      } catch (err) {
        console.error('Erro ao cancelar agendamento:', err);
      }
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">Meus Agendamentos</h1>
        <p className="text-vitta-text-secondary">Gerencie suas consultas e horários marcados.</p>
      </section>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))
        ) : appointments.length > 0 ? appointments.map((apt) => (
          <motion.div 
            key={apt.id}
            whileHover={{ x: 4 }}
            className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="flex items-center gap-4 flex-1">
              <img src={apt.imageUrl} alt={apt.professionalName} className="w-16 h-16 rounded-xl object-cover" />
              <div>
                <h3 className="font-bold text-lg text-vitta-text-primary">{apt.professionalName}</h3>
                <p className="text-sm text-vitta-text-secondary">{apt.specialty}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Data e Hora</p>
                <div className="flex items-center gap-2 text-sm font-bold text-vitta-text-primary">
                  <Calendar size={16} className="text-vitta-green" />
                  {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Status</p>
                <span className="px-3 py-1 bg-vitta-green-bg text-vitta-green rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Confirmado
                </span>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all">
                  <Edit size={20} />
                </button>
                <button 
                  onClick={() => handleCancelApt(apt)}
                  className="p-2 text-vitta-text-muted hover:text-vitta-danger hover:bg-vitta-danger/10 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="p-12 text-center bg-vitta-surface rounded-xl border border-dashed border-vitta-border">
            <Calendar size={48} className="mx-auto text-vitta-text-muted mb-4" />
            <p className="text-vitta-text-secondary font-medium">Você ainda não tem agendamentos.</p>
            <button className="mt-4 px-6 py-2 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors">
              Agendar Agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RadioView = ({ 
  isPlaying, 
  setIsPlaying, 
  volume, 
  setVolume, 
  config, 
  isAdmin 
}: { 
  isPlaying: boolean, 
  setIsPlaying: (v: boolean) => void, 
  volume: number, 
  setVolume: (v: number) => void,
  config: { url: string },
  isAdmin: boolean
}) => {
  const [newUrl, setNewUrl] = useState(config.url);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewUrl(config.url);
  }, [config.url]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'config', 'radio'), { url: newUrl });
      await logAdminAction('UPDATE_RADIO_CONFIG', `Atualizou a URL da rádio para: ${newUrl}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/radio');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-vitta-text-primary">Rádio ViTTA</h1>
          <p className="text-vitta-text-secondary">Música e entretenimento para o seu bem-estar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-vitta-green via-vitta-accent to-vitta-purple p-1 rounded-xl shadow-2xl shadow-vitta-accent/20">
            <div className="bg-vitta-surface rounded-xl p-8 md:p-12 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full bg-vitta-surface-2 flex items-center justify-center border-4 border-vitta-border transition-all duration-500 ${isPlaying ? 'scale-110 shadow-2xl shadow-vitta-green/20' : ''}`}>
                  <Radio className={`text-vitta-accent transition-all duration-500 ${isPlaying ? 'animate-pulse scale-110' : ''}`} size={64} />
                </div>
                {isPlaying && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-vitta-green rounded-full border-4 border-vitta-surface"
                  />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold text-vitta-text-primary">
                  {isPlaying ? 'Transmitindo ao Vivo' : 'Rádio Pausada'}
                </h2>
                <p className="text-vitta-text-secondary max-w-md">
                  {isPlaying 
                    ? 'Curta a melhor seleção musical preparada especialmente para você.' 
                    : 'Clique no botão abaixo para iniciar a transmissão da Rádio ViTTA.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                    isPlaying 
                      ? 'bg-vitta-danger text-white hover:bg-vitta-danger/90 shadow-vitta-danger/20' 
                      : 'bg-vitta-accent text-white hover:bg-vitta-accent/90 shadow-vitta-accent/20'
                  }`}
                >
                  {isPlaying ? <X size={24} /> : <Radio size={24} />}
                  {isPlaying ? 'Pausar Rádio' : 'Ouvir Rádio'}
                </button>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setVolume(volume > 0 ? 0 : 0.5)} className="text-vitta-text-muted hover:text-vitta-accent transition-colors">
                      {volume === 0 ? <X size={20} /> : <Radio size={20} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-vitta-border rounded-lg appearance-none cursor-pointer accent-vitta-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-vitta-green-bg rounded-xl flex items-center justify-center text-vitta-green">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-bold text-vitta-text-primary">Programação 24h</h4>
                <p className="text-sm text-vitta-text-secondary">Música sem interrupções</p>
              </div>
            </div>
            <div className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-vitta-accent-bg rounded-xl flex items-center justify-center text-vitta-accent">
                <Star size={24} />
              </div>
              <div>
                <h4 className="font-bold text-vitta-text-primary">Alta Qualidade</h4>
                <p className="text-sm text-vitta-text-secondary">Áudio cristalino em HD</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-vitta-accent-bg rounded-xl text-vitta-accent">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-lg text-vitta-text-primary">Configuração Admin</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">URL da Transmissão</label>
                  <input 
                    type="text" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving || newUrl === config.url}
                  className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save size={18} />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          <div className="bg-vitta-accent p-8 rounded-xl text-white space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Radio size={120} />
            </div>
            <h3 className="text-xl font-bold relative z-10">Dica ViTTA</h3>
            <p className="text-white/80 text-sm leading-relaxed relative z-10">
              A rádio continuará tocando mesmo que você navegue por outras páginas do aplicativo. Use o mini-player que aparecerá no canto inferior.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const MiniPlayer = ({ isPlaying, setIsPlaying, volume, setVolume }: any) => {
  if (!isPlaying) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-6 right-6 z-[60] bg-vitta-surface p-4 rounded-xl shadow-2xl border border-vitta-border flex items-center gap-4 min-w-[280px]"
    >
      <div className="w-12 h-12 bg-vitta-accent rounded-xl flex items-center justify-center text-white animate-pulse shadow-lg shadow-vitta-accent/20">
        <Radio size={24} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Rádio ViTTA</p>
        <p className="text-sm font-bold text-vitta-text-primary truncate">Ao Vivo</p>
        <div className="flex items-center gap-2 mt-1">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-vitta-border rounded-lg appearance-none cursor-pointer accent-vitta-accent"
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsPlaying(false)}
          className="p-2 bg-vitta-danger/10 text-vitta-danger rounded-xl hover:bg-vitta-danger/20 transition-all"
        >
          <X size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const PharmaciesView = ({ isAdmin }: { isAdmin: boolean }) => {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    onCallDate: '',
    isActive: true
  });

  useEffect(() => {
    const q = query(collection(db, 'pharmacies'), orderBy('onCallDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPharmacies(data);
      setIsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'pharmacies');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPharmacy) {
        await updateDoc(doc(db, 'pharmacies', editingPharmacy.id), formData);
        await logAdminAction('UPDATE_PHARMACY', `Editou a farmácia: ${formData.name}`);
      } else {
        await addDoc(collection(db, 'pharmacies'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        await logAdminAction('CREATE_PHARMACY', `Criou a farmácia: ${formData.name}`);
      }
      setShowAddModal(false);
      setEditingPharmacy(null);
      setFormData({ name: '', address: '', phone: '', onCallDate: '', isActive: true });
    } catch (error) {
      console.error('Erro ao salvar farmácia:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta farmácia?')) {
      try {
        await deleteDoc(doc(db, 'pharmacies', id));
        await logAdminAction('DELETE_PHARMACY', `Excluiu a farmácia ID: ${id}`);
      } catch (error) {
        console.error('Erro ao excluir farmácia:', error);
      }
    }
  };

  const toggleActive = async (pharmacy: any) => {
    try {
      await updateDoc(doc(db, 'pharmacies', pharmacy.id), {
        isActive: !pharmacy.isActive
      });
      await logAdminAction('TOGGLE_PHARMACY_STATUS', `Alterou status da farmácia ${pharmacy.name} para ${!pharmacy.isActive ? 'Ativo' : 'Inativo'}`);
    } catch (error) {
      console.error('Erro ao alterar status da farmácia:', error);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  // Logic for sorting and filtering
  const sortedPharmacies = [...pharmacies].sort((a, b) => {
    // If one is today, it comes first
    if (a.onCallDate === today) return -1;
    if (b.onCallDate === today) return 1;
    return a.onCallDate.localeCompare(b.onCallDate);
  });

  const displayPharmacies = isAdmin 
    ? sortedPharmacies 
    : sortedPharmacies.filter(p => p.isActive && p.onCallDate >= today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">Farmácias de Plantão</h1>
          <p className="text-vitta-text-secondary">Confira as farmácias abertas hoje e nos próximos dias.</p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => {
              setEditingPharmacy(null);
              setFormData({ name: '', address: '', phone: '', onCallDate: '', isActive: true });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-all shadow-lg shadow-vitta-accent/20"
          >
            <Plus size={20} />
            Nova Farmácia
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-vitta-accent/20 border-t-vitta-accent rounded-full animate-spin" />
        </div>
      ) : displayPharmacies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPharmacies.map((pharmacy) => {
            const isToday = pharmacy.onCallDate === today;
            return (
              <motion.div 
                key={pharmacy.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative overflow-hidden bg-vitta-surface rounded-xl border-2 transition-all ${
                  isToday 
                    ? 'border-vitta-accent shadow-xl shadow-vitta-accent/10' 
                    : 'border-vitta-border'
                }`}
              >
                {isToday && (
                  <div className="absolute top-0 right-0 bg-vitta-accent text-white px-4 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider">
                    Plantão de Hoje
                  </div>
                )}
                
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-vitta-accent-bg rounded-xl text-vitta-accent">
                      <Store size={24} />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => toggleActive(pharmacy)}
                          className={`p-2 rounded-xl transition-colors ${
                            pharmacy.isActive 
                              ? 'text-vitta-green bg-vitta-green-bg' 
                              : 'text-vitta-text-muted bg-vitta-surface-2'
                          }`}
                          title={pharmacy.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {pharmacy.isActive ? <CheckCircle size={18} /> : <XCircle size={18} />}
                        </button>
                        <button 
                          onClick={() => {
                            setEditingPharmacy(pharmacy);
                            setFormData({
                              name: pharmacy.name,
                              address: pharmacy.address,
                              phone: pharmacy.phone,
                              onCallDate: pharmacy.onCallDate,
                              isActive: pharmacy.isActive
                            });
                            setShowAddModal(true);
                          }}
                          className="p-2 text-vitta-accent bg-vitta-accent-bg rounded-xl hover:bg-vitta-accent/20 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(pharmacy.id)}
                          className="p-2 text-vitta-danger bg-vitta-danger/10 rounded-xl hover:bg-vitta-danger/20 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-vitta-text-primary">{pharmacy.name}</h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <Calendar size={16} className="text-vitta-accent" />
                        <span className="text-sm">
                          {new Date(pharmacy.onCallDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <MapPin size={16} className="text-vitta-accent" />
                        <span className="text-sm line-clamp-1">{pharmacy.address}</span>
                      </div>
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <Phone size={16} className="text-vitta-accent" />
                        <span className="text-sm">{pharmacy.phone}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => window.open(`tel:${pharmacy.phone.replace(/\D/g, '')}`)}
                    className="w-full py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all flex items-center justify-center gap-2"
                  >
                    <Phone size={18} />
                    Ligar Agora
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-vitta-surface p-10 rounded-xl border border-vitta-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-4 bg-vitta-surface-2 rounded-full text-vitta-text-muted">
            <Store size={48} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-vitta-text-primary">Nenhuma Farmácia de Plantão</h3>
            <p className="text-vitta-text-secondary">Não há farmácias de plantão cadastradas para hoje ou para os próximos dias.</p>
          </div>
        </div>
      )}

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingPharmacy ? 'Editar Farmácia' : 'Nova Farmácia'}
                </h3>
                <button onClick={() => setShowAddModal(false)} className="text-vitta-text-muted hover:text-vitta-text-primary">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">Nome da Farmácia</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="Ex: Farmácia São João"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">Endereço</label>
                  <input 
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">Telefone</label>
                  <input 
                    type="text"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">Data do Plantão</label>
                  <input 
                    type="date"
                    required
                    value={formData.onCallDate}
                    onChange={e => setFormData({...formData, onCallDate: e.target.value})}
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    className="w-5 h-5 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent/20"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-vitta-text-primary cursor-pointer">Farmácia Ativa</label>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-all shadow-lg shadow-vitta-accent/20"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-vitta-text-primary">{title}</h1>
    <div className="bg-vitta-surface p-10 rounded-xl border border-vitta-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-vitta-surface-2 rounded-full text-vitta-text-muted">
        <LayoutGrid size={48} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-vitta-text-primary">Página em Desenvolvimento</h3>
        <p className="text-vitta-text-secondary">Estamos trabalhando para trazer o melhor conteúdo de {title} para você.</p>
      </div>
    </div>
  </div>
);

const LoginView = ({ 
  pendingUser, 
  userData, 
  onVerify2FA, 
  onCancel2FA 
}: { 
  pendingUser?: FirebaseUser | null, 
  userData?: any, 
  onVerify2FA?: () => void, 
  onCancel2FA?: () => void 
} = {}) => {
  const [view, setView] = useState<'login' | 'signup' | '2fa'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pendingUser && userData?.twoFactorEnabled) {
      setView('2fa');
      sendVerificationCode();
    }
  }, [pendingUser, userData]);

  const sendVerificationCode = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUser.uid, email: pendingUser.email })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar código');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao enviar código de verificação.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: pendingUser.uid, code: twoFactorCode })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        if (onVerify2FA) onVerify2FA();
      } else {
        setError(data.error || 'Código inválido ou expirado.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Erro na verificação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || 'Usuário',
          email: user.email,
          role: 'user',
          status: 'Ativo',
          plan: 'Free',
          createdAt: Timestamp.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      setError('Falha ao entrar com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        
        // Update profile with name
        await updateProfile(user, { displayName: name });
        
        // Create user in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: name || 'Usuário',
          email: user.email,
          role: 'user',
          status: 'Ativo',
          plan: 'Free',
          createdAt: Timestamp.now()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso.');
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vitta-bg p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-vitta-accent rounded-xl shadow-xl shadow-vitta-accent/20 mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">
            {view === 'login' ? 'Bem-vindo ao ViTTA' : view === 'signup' ? 'Crie sua conta' : 'Verificação em Duas Etapas'}
          </h1>
          <p className="text-vitta-text-secondary">
            {view === 'login' ? 'Entre na sua conta para continuar' : view === 'signup' ? 'Junte-se a nós e cuide da sua saúde' : 'Digite o código de 6 dígitos enviado para você'}
          </p>
        </div>

        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-xl shadow-vitta-accent/5">
          {error && (
            <div className="mb-6 p-4 bg-vitta-danger/10 text-vitta-danger text-sm rounded-xl border border-vitta-danger/20 font-medium">
              {error}
            </div>
          )}
          
          {view === '2fa' ? (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Código de Segurança</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-12 pr-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary text-center tracking-[0.5em] font-bold"
                  />
                </div>
                <p className="text-xs text-vitta-text-secondary text-center mt-2">O código foi enviado para seu e-mail (verifique o console do servidor).</p>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit"
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full py-4 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Verificar Código'
                  )}
                </button>
                <button 
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={isLoading}
                  className="w-full py-2 text-vitta-accent text-xs font-bold hover:underline disabled:opacity-50"
                >
                  Reenviar Código
                </button>
                <button 
                  type="button"
                  onClick={onCancel2FA}
                  disabled={isLoading}
                  className="w-full py-4 bg-vitta-surface text-vitta-text-secondary border border-vitta-border rounded-xl font-bold hover:bg-vitta-surface-2 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {view === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-12 pr-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
            </div>

            {view === 'login' && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent/20" />
                  <span className="text-xs text-vitta-text-secondary group-hover:text-vitta-text-primary transition-colors">Lembrar de mim</span>
                </label>
                <button type="button" className="text-xs font-bold text-vitta-accent hover:underline">Esqueceu a senha?</button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {view === 'login' ? 'Entrar' : 'Criar Conta'}
                  <ChevronRight size={18} />
                </>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-vitta-border"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-vitta-surface px-4 text-vitta-text-muted">ou</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-vitta-surface text-vitta-text-secondary border border-vitta-border rounded-xl font-bold hover:bg-vitta-surface-2 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar com Google
            </button>
          </form>
          )}

          {view !== '2fa' && (
            <div className="mt-8 pt-8 border-t border-vitta-border text-center">
              <p className="text-sm text-vitta-text-secondary">
                {view === 'login' ? (
                  <>Não tem uma conta? <button onClick={() => setView('signup')} className="text-vitta-accent font-bold hover:underline">Cadastre-se</button></>
                ) : (
                  <>Já tem uma conta? <button onClick={() => setView('login')} className="text-vitta-accent font-bold hover:underline">Entre aqui</button></>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });
    return () => unsubscribe();
  }, [isAuthReady, user]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Radio Global State
  const [radioConfig, setRadioConfig] = useState({ url: 'https://icecast.portalviva.com.br/viva_fm_vitoria' });
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.5);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const unsubscribe = onSnapshot(doc(db, 'config', 'radio'), (snapshot) => {
      if (snapshot.exists()) {
        setRadioConfig(snapshot.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/radio');
    });
    return () => unsubscribe();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = radioVolume;
    }
  }, [radioVolume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isRadioPlaying && radioConfig.url) {
        audioRef.current.play().catch(err => {
          console.error('Erro ao tocar rádio:', err);
          setIsRadioPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRadioPlaying, radioConfig.url, setIsRadioPlaying]);

  useEffect(() => {
    const seedPartners = async () => {
      console.log('DEBUG: Iniciando seedPartners...');
      
      const categoriesData = [
        { name: 'Saúde', icon: 'Heart', color: 'bg-vitta-danger', description: 'Encontre profissionais de saúde' },
        { name: 'Farmácias', icon: 'Store', color: 'bg-vitta-green', description: 'Descontos exclusivos para afiliados' },
        { name: 'Óticas', icon: 'Glasses', color: 'bg-vitta-accent', description: 'Descontos exclusivos para afiliados' },
        { name: 'Supermercados', icon: 'ShoppingCart', color: 'bg-violet-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Masculina', icon: 'Shirt', color: 'bg-indigo-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Feminina', icon: 'Shirt', color: 'bg-pink-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Infantil', icon: 'Baby', color: 'bg-vitta-amber', description: 'Descontos exclusivos para afiliados' },
        { name: 'Calçados', icon: 'Footprints', color: 'bg-orange-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Suplementos', icon: 'Heart', color: 'bg-vitta-danger', description: 'Descontos exclusivos para afiliados' },
        { name: 'Estética', icon: 'Heart', color: 'bg-fuchsia-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Eletrodomésticos', icon: 'Zap', color: 'bg-cyan-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Móveis', icon: 'Armchair', color: 'bg-yellow-600', description: 'Descontos exclusivos para afiliados' },
        { name: 'Salão de Beleza', icon: 'Scissors', color: 'bg-purple-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Material de Construção', icon: 'Hammer', color: 'bg-vitta-text-muted', description: 'Descontos exclusivos para afiliados' },
        { name: 'Padaria', icon: 'Coffee', color: 'bg-orange-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Lanchonete', icon: 'Coffee', color: 'bg-orange-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Restaurante', icon: 'Coffee', color: 'bg-vitta-danger', description: 'Descontos exclusivos para afiliados' },
        { name: 'Pizzaria', icon: 'Pizza', color: 'bg-orange-600', description: 'Descontos exclusivos para afiliados' },
        { name: 'Sorveteria', icon: 'IceCream', color: 'bg-sky-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Posto de Combustíveis', icon: 'Fuel', color: 'bg-vitta-text-muted', description: 'Descontos exclusivos para afiliados' },
        { name: 'Pet Shop', icon: 'PawPrint', color: 'bg-vitta-green', description: 'Descontos exclusivos para afiliados' },
        { name: 'Contador', icon: 'Calculator', color: 'bg-vitta-accent', description: 'Descontos exclusivos para afiliados' },
        { name: 'Cabeleireiro', icon: 'Scissors', color: 'bg-pink-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Pintor', icon: 'Wrench', color: 'bg-cyan-400', description: 'Descontos exclusivos para afiliados' },
      ];

      const oticas = [
        { name: 'A C R Viana em Centro', address: 'Rua Convívio Sebastião Moraes, 0 lj 36, Centro - Castelo - ES', phone: '(28) 3542-2812' },
        { name: 'Ótica Visual em Centro', address: 'Praça 3 Irmãos, 208, Centro - Castelo - ES', phone: '(28) 3542-3269' },
        { name: 'Oticas 3d em Centro', address: 'Rua Bernadino Monteiro, 15 loja 02-03-04, Centro - Castelo - ES', phone: '(28) 3542-5068' },
        { name: 'Óticas Capixaba em Centro', address: 'Rua Aristeu Borges Aguiar, 10, Centro - Castelo - ES', phone: '(28) 3542-1375' }
      ];

      try {
        console.log('DEBUG: Cadastrando categorias...');
        for (const cat of categoriesData) {
          const slug = cat.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
          await setDoc(doc(db, 'categories', slug), {
            ...cat,
            slug,
            type: 'partner',
            createdAt: new Date().toISOString()
          }, { merge: true });
        }

        for (const otica of oticas) {
          const slug = otica.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
          console.log(`DEBUG: Cadastrando ótica: ${otica.name} (slug: ${slug})`);
          await setDoc(doc(db, 'partners', slug), {
            ...otica,
            category: 'Óticas',
            discount: '10% OFF',
            rating: 5.0,
            reviews: 0,
            imageUrl: `https://picsum.photos/seed/${slug}/400/300`,
            createdAt: new Date().toISOString()
          }, { merge: true });
        }
        
        console.log('DEBUG: Óticas e categorias cadastradas com sucesso!');
      } catch (err) {
        console.error('DEBUG: Erro ao cadastrar óticas:', err);
      }
    };

    if (isAuthReady && user) {
      console.log('DEBUG: App pronto e usuário logado, chamando seedPartners...');
      seedPartners();
      
      // Seed health metrics history if empty
      const seedMetrics = async () => {
        try {
          const q = query(collection(db, 'health_metrics'), where('userId', '==', user.uid), limit(1));
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            console.log('DEBUG: Semeando histórico de métricas...');
            const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            const promises = days.map((day, idx) => {
              return addDoc(collection(db, 'health_metrics'), {
                userId: user.uid,
                date: day,
                steps: Math.floor(Math.random() * 5000) + 2000,
                createdAt: Timestamp.now()
              });
            });
            await Promise.all(promises);
          }
        } catch (err) {
          console.error('DEBUG: Erro ao semear métricas:', err);
        }
      };
      seedMetrics();
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    let unsubscribeUserData: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Listen to user data in real-time
        unsubscribeUserData = onSnapshot(doc(db, 'users', firebaseUser.uid), async (snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.data());
          } else {
            // Create if missing
            const newData = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email,
              role: 'user',
              status: 'Ativo',
              plan: 'Free',
              createdAt: Timestamp.now()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newData);
            setUserData(newData);
          }
          setIsAuthReady(true);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
          setIsAuthReady(true);
        });
      } else {
        setUserData(null);
        setIsAuthReady(true);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserData) unsubscribeUserData();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIs2FAVerified(false);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vitta-bg">
        <div className="w-12 h-12 border-4 border-vitta-accent/20 border-t-vitta-accent rounded-full animate-spin" />
      </div>
    );
  }

  const needs2FA = user && userData?.twoFactorEnabled && !is2FAVerified;

  if (!user || needs2FA) {
    return (
      <LoginView 
        pendingUser={user} 
        userData={userData} 
        onVerify2FA={() => setIs2FAVerified(true)} 
        onCancel2FA={handleLogout} 
      />
    );
  }

  const isAdmin = userData?.role === 'admin' || user?.email === 'jhecksanto@gmail.com';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return isAdmin ? <AdminView user={user} /> : <PatientDashboardView user={user} userData={userData} />;
      case 'professionals': return <ProfessionalsView user={user} />;
      case 'appointments': return <AppointmentsView user={user} />;
      case 'plans': return isAdmin ? <PartnershipsView setActiveTab={setActiveTab} /> : <PartnersView setActiveTab={setActiveTab} user={user} />;
      case 'wallets': return <PlaceholderView title="Carteiras" />;
      case 'voucher': return <PlaceholderView title="Compra Voucher" />;
      case 'pharmacies': return <PharmaciesView isAdmin={isAdmin} />;
      case 'radio': return (
        <RadioView 
          isPlaying={isRadioPlaying} 
          setIsPlaying={setIsRadioPlaying} 
          volume={radioVolume} 
          setVolume={setRadioVolume}
          config={radioConfig}
          isAdmin={isAdmin}
        />
      );
      case 'chat': return <PlaceholderView title="Chat Suporte" />;
      case 'profile': return <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} user={user} userData={userData} />;
      case 'support': return <SupportView />;
      case 'exams': return <ExamsView user={user} />;
      case 'offers': return <OffersView user={user} />;
      default: return isAdmin ? <AdminView user={user} /> : <PlaceholderView title="Dashboard Paciente" />;
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-vitta-bg text-vitta-text-primary' : 'bg-vitta-bg text-vitta-text-primary'}`}>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-vitta-sidebar border-r border-vitta-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-vitta-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-vitta-accent rounded-2xl flex items-center justify-center shadow-lg shadow-vitta-accent/30">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-vitta-text-primary">ViTTA</h2>
                <p className="text-xs font-medium text-vitta-text-muted">{isAdmin ? 'Admin' : 'Paciente'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            <div>
              <p className="px-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-4">Navegação</p>
              <nav className="space-y-1">
                <SidebarItem 
                  icon={LayoutGrid} 
                  label="Painel Admin" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')} 
                />
                <SidebarItem 
                  icon={Users} 
                  label="Profissionais" 
                  active={activeTab === 'professionals'} 
                  onClick={() => setActiveTab('professionals')} 
                />
                <SidebarItem 
                  icon={Clock} 
                  label="Agendamentos" 
                  active={activeTab === 'appointments'} 
                  onClick={() => setActiveTab('appointments')} 
                />
                <SidebarItem 
                  icon={ShieldCheck} 
                  label="Convênios" 
                  active={activeTab === 'plans'} 
                  onClick={() => setActiveTab('plans')} 
                />
                <SidebarItem 
                  icon={Wallet} 
                  label="Carteiras" 
                  active={activeTab === 'wallets'} 
                  onClick={() => setActiveTab('wallets')} 
                />
                <SidebarItem 
                  icon={CreditCard} 
                  label="Compra Voucher" 
                  active={activeTab === 'voucher'} 
                  onClick={() => setActiveTab('voucher')} 
                />
                <SidebarItem 
                  icon={Stethoscope} 
                  label="Farmácias de Plantão" 
                  active={activeTab === 'pharmacies'} 
                  onClick={() => setActiveTab('pharmacies')} 
                />
                <SidebarItem 
                  icon={Radio} 
                  label="Rádio ViTTA" 
                  active={activeTab === 'radio'} 
                  onClick={() => setActiveTab('radio')} 
                />
                <SidebarItem 
                  icon={MessageSquare} 
                  label="Chat Suporte" 
                  active={activeTab === 'chat'} 
                  onClick={() => setActiveTab('chat')} 
                />
                <SidebarItem 
                  icon={User} 
                  label="Perfil" 
                  active={activeTab === 'profile'} 
                  onClick={() => setActiveTab('profile')} 
                />
                <SidebarItem 
                  icon={HelpCircle} 
                  label="Suporte" 
                  active={activeTab === 'support'} 
                  onClick={() => setActiveTab('support')} 
                />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-vitta-danger hover:bg-vitta-danger/10 mx-2"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Sair</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-vitta-border bg-vitta-surface-2">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-vitta-accent to-vitta-purple flex items-center justify-center text-white font-bold shadow-md shadow-vitta-accent/20 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-vitta-text-primary truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-[10px] text-vitta-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-vitta-topbar border-b border-vitta-border px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-vitta-surface-2 rounded-lg text-vitta-text-primary"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar exames, médicos..." 
                className="pl-10 pr-4 py-2 bg-vitta-surface-2 border border-vitta-border rounded-lg text-sm w-64 focus:ring-2 focus:ring-vitta-accent/20 transition-all text-vitta-text-primary outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-vitta-surface-2 text-vitta-text-secondary border border-vitta-border rounded-lg hover:bg-vitta-border transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-lg transition-all border border-vitta-border relative ${
                  showNotifications 
                    ? 'bg-vitta-accent-bg text-vitta-accent' 
                    : 'bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-border'
                }`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-vitta-danger text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-vitta-surface animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowNotifications(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-vitta-surface rounded-xl shadow-2xl border border-vitta-border z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-vitta-border flex items-center justify-between">
                        <h3 className="font-bold text-vitta-text-primary">Notificações</h3>
                        {unreadCount > 0 && (
                          <span className="text-[10px] bg-vitta-accent-bg text-vitta-accent px-2 py-1 rounded-full font-bold">
                            {unreadCount} novas
                          </span>
                        )}
                      </div>
                      <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-4 border-b border-vitta-border last:border-0 transition-colors hover:bg-vitta-surface-2 relative group ${!notification.read ? 'bg-vitta-accent-bg/30' : ''}`}
                            >
                              <div className="flex gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  notification.type === 'exam' ? 'bg-vitta-green-bg text-vitta-green' :
                                  notification.type === 'appointment' ? 'bg-vitta-accent-bg text-vitta-accent' :
                                  'bg-vitta-surface-2 text-vitta-text-muted'
                                }`}>
                                  {notification.type === 'exam' ? <Stethoscope size={18} /> :
                                   notification.type === 'appointment' ? <Calendar size={18} /> :
                                   <Bell size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={`text-sm font-bold text-vitta-text-primary truncate ${!notification.read ? 'pr-4' : ''}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <div className="w-2 h-2 bg-vitta-accent rounded-full mt-1.5 shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-vitta-text-secondary line-clamp-2 mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-vitta-text-muted mt-2">
                                    {notification.createdAt?.toDate ? 
                                      notification.createdAt.toDate().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 
                                      'Agora'}
                                  </p>
                                </div>
                              </div>
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                {!notification.read && (
                                  <button 
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    className="p-1.5 bg-vitta-surface shadow-sm rounded-lg text-vitta-accent hover:bg-vitta-accent-bg transition-all"
                                    title="Marcar como lida"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => deleteNotification(notification.id)}
                                  className="p-1.5 bg-vitta-surface shadow-sm rounded-lg text-vitta-danger hover:bg-vitta-danger/10 transition-all"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-10 text-center space-y-3">
                            <div className="w-12 h-12 bg-vitta-surface-2 rounded-full flex items-center justify-center text-vitta-text-muted mx-auto">
                              <Bell size={24} />
                            </div>
                            <p className="text-sm text-vitta-text-secondary">Nenhuma notificação por aqui.</p>
                          </div>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="p-3 bg-vitta-surface-2 text-center">
                          <button 
                            onClick={() => {
                              notifications.forEach(n => !n.read && markNotificationAsRead(n.id));
                            }}
                            className="text-[10px] font-bold text-vitta-accent uppercase tracking-widest hover:underline"
                          >
                            Marcar todas como lidas
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-vitta-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-vitta-text-primary">{user.displayName || 'Usuário'}</p>
                <p className="text-xs text-vitta-text-secondary">{userData?.plan || 'Membro Free'}</p>
              </div>
              <img 
                src={user.photoURL || "https://picsum.photos/seed/user/100/100"} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-vitta-surface shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Global Audio Element */}
      <audio 
        ref={audioRef} 
        src={radioConfig.url ? (radioConfig.url.includes(':') && !radioConfig.url.includes(';') ? (radioConfig.url.endsWith('/') ? `${radioConfig.url};` : `${radioConfig.url}/;`) : radioConfig.url) : undefined} 
        onError={(e) => {
          const target = e.target as HTMLAudioElement;
          if (target.error) {
            console.error('Erro no elemento de áudio:', target.error.code, target.error.message);
          }
        }}
      />

      {/* Mini Player */}
      <MiniPlayer 
        isPlaying={isRadioPlaying} 
        setIsPlaying={setIsRadioPlaying} 
        volume={radioVolume} 
        setVolume={setRadioVolume} 
      />
    </div>
  );
}
