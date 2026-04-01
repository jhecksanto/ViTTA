import React, { useState, useEffect } from 'react';
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
  FileText,
  Download,
  Filter,
  Plus,
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
  Scissors
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MOCK_APPOINTMENTS, MOCK_STATS, MOCK_OFFERS, MOCK_PROFESSIONALS, MOCK_EXAMS, MOCK_PARTNERS, MOCK_CATEGORIES } from './constants';
import { auth, db, googleProvider } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  onSnapshot, 
  query, 
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDocFromServer
} from 'firebase/firestore';

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 text-center space-y-4">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${variant === 'danger' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'}`}>
            {variant === 'danger' ? <Trash2 size={32} /> : <Info size={32} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold dark:text-white">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => { onConfirm(); onClose(); }}
              className={`flex-1 py-3 text-white rounded-2xl font-bold shadow-lg transition-all ${variant === 'danger' ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20' : 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/20'}`}
            >
              {confirmText}
            </button>
          </div>
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
  const handleConfirm = () => {
    if (!user || !professional) return;
    
    const phoneNumber = '5528999881386';
    const message = `Olá! Gostaria de agendar um atendimento.\n\n*Meus dados:*\nNome: ${user.displayName || 'Usuário'}\nEmail: ${user.email}\n\n*Profissional selecionado:*\nNome: ${professional.name}\nEspecialidade: ${professional.specialty}`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold dark:text-white">Confirmar Atendimento</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Você será redirecionado para o nosso WhatsApp para finalizar o agendamento com o profissional abaixo:
          </p>
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <img src={professional.imageUrl || 'https://picsum.photos/seed/prof/400/300'} alt={professional.name} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <h4 className="font-bold dark:text-white">{professional.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{professional.specialty}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} />
              Confirmar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
      active 
        ? 'bg-blue-500 text-white font-medium shadow-md shadow-blue-500/20' 
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
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
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    rose: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
    amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  const colorClass = colors[stat.color] || colors.emerald;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass}`}>
          {Icon && <Icon size={22} />}
        </div>
        {stat.change !== undefined && (
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            stat.change > 0 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}>
            {stat.change > 0 ? '+' : ''}{stat.change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{stat.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
          <span className="text-slate-400 dark:text-slate-500 text-xs">{stat.unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

const AdminView = ({ user }: { user: any }) => {
  const [subTab, setSubTab] = useState<'overview' | 'users' | 'partnerships' | 'professionals' | 'exams' | 'offers' | 'config'>('overview');
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

  const handleDeleteApt = async (id: string) => {
    if (window.confirm('Tem certeza que deseja cancelar esta consulta?')) {
      try {
        await deleteDoc(doc(db, 'appointments', id));
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
      setEditingApt(null);
    } catch (err) {
      console.error('Erro ao salvar agendamento:', err);
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {editingApt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Remarcar Consulta</h3>
                <button onClick={() => setEditingApt(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveApt} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Data</label>
                  <input 
                    type="date" 
                    value={editingApt.date}
                    onChange={(e) => setEditingApt({ ...editingApt, date: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Horário</label>
                  <input 
                    type="time" 
                    value={editingApt.time}
                    onChange={(e) => setEditingApt({ ...editingApt, time: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingApt(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
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
          <h1 className="text-3xl font-bold mb-1 dark:text-white">Painel Administrativo</h1>
          <p className="text-slate-500 dark:text-slate-400">Gestão centralizada do ecossistema ViTTA</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'overview' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <LayoutGrid size={18} />
          Visão Geral
        </button>
        <button 
          onClick={() => setSubTab('users')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'users' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users size={18} />
          Usuários
        </button>
        <button 
          onClick={() => setSubTab('partnerships')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'partnerships' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Store size={18} />
          Convênios
        </button>
        <button 
          onClick={() => setSubTab('professionals')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'professionals' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Stethoscope size={18} />
          Profissionais
        </button>
        <button 
          onClick={() => setSubTab('exams')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'exams' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={18} />
          Exames
        </button>
        <button 
          onClick={() => setSubTab('config')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === 'config' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
                <h2 className="text-2xl font-bold mb-2 dark:text-white">Olá, Administrador! 👋</h2>
                <p className="text-slate-500 dark:text-slate-400">Aqui está o resumo do sistema hoje.</p>
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
                    <h2 className="text-xl font-bold dark:text-white">Próximas Consultas</h2>
                    <button className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Ver todas</button>
                  </div>
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <motion.div 
                        key={apt.id}
                        whileHover={{ x: 4 }}
                        className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 group"
                      >
                        <img src={apt.imageUrl} alt={apt.professionalName} className="w-14 h-14 rounded-xl object-cover" />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{apt.professionalName}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{apt.specialty}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium text-sm mb-1">
                            <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                            {new Date(apt.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs justify-end">
                            <Clock size={14} />
                            {apt.time}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingApt(apt)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteApt(apt.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    <button 
                      onClick={() => setBookingProfessional(professionals[0])}
                      className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-medium hover:border-emerald-200 dark:hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Calendar size={18} />
                      Agendar nova consulta
                    </button>
                  </div>
                </section>

                {/* Quick Professionals Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold dark:text-white">Profissionais</h2>
                    <button onClick={() => setSubTab('professionals')} className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Explorar</button>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    {professionals.length > 0 ? professionals.map((prof, idx) => (
                      <div key={prof.id} className={`p-4 flex items-center gap-3 ${idx !== professionals.length - 1 ? 'border-b border-slate-50 dark:border-slate-800' : ''}`}>
                        <img src={prof.imageUrl} alt={prof.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate dark:text-white">{prof.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{prof.specialty}</p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-bold">{prof.rating}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-sm">Nenhum profissional cadastrado</div>
                    )}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50">
                      <button onClick={() => setSubTab('professionals')} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20">
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
                    <h2 className="text-xl font-bold dark:text-white">Benefícios Exclusivos</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Ofertas de parceiros selecionados para você.</p>
                  </div>
                  <button onClick={() => setSubTab('partnerships')} className="text-emerald-600 dark:text-emerald-400 text-sm font-bold hover:underline">Ver todos</button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 lg:-mx-10 lg:px-10">
                  {partners.length > 0 ? partners.map((offer) => (
                    <motion.div 
                      key={offer.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden"
                    >
                      <div className="relative h-40">
                        <img src={offer.imageUrl} alt={offer.name} className="w-full h-full object-cover" />
                        <div className="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          {offer.category}
                        </div>
                        <div className="absolute bottom-3 right-3 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          {offer.discount}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-lg mb-1 dark:text-white">{offer.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">{offer.description || 'Aproveite esta oferta exclusiva.'}</p>
                        <button 
                          onClick={() => alert('Benefício resgatado com sucesso! Apresente este código no estabelecimento: VITTA-' + Math.random().toString(36).substring(7).toUpperCase())}
                          className="w-full py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors dark:text-white"
                        >
                          Resgatar Benefício
                        </button>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="w-full p-8 text-center text-slate-400 text-sm">Nenhum parceiro cadastrado</div>
                  )}
                </div>
              </section>
            </div>
          )}
          {subTab === 'users' && <UsersView />}
          {subTab === 'partnerships' && <PartnershipsView setSubTab={setSubTab} />}
          {subTab === 'professionals' && <ProfessionalsManagementView />}
          {subTab === 'exams' && <ExamsManagementView />}
          {subTab === 'config' && <UserConfigView />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const ExamsView = () => (
  <div className="space-y-8">
    <section>
      <h1 className="text-3xl font-bold mb-2 dark:text-white">Meus Exames</h1>
      <p className="text-slate-500 dark:text-slate-400">Acompanhe seus resultados e histórico de exames.</p>
    </section>

    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium">Todos</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Prontos</button>
        <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Pendentes</button>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <Filter size={16} />
        Filtrar
      </button>
    </div>

    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Exame</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Local</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {MOCK_EXAMS.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <span className="font-bold text-sm dark:text-white">{exam.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {new Date(exam.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                  {exam.location}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    exam.status === 'ready' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    exam.status === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {exam.status === 'ready' ? 'Pronto' :
                     exam.status === 'pending' ? 'Pendente' : 'Agendado'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {exam.status === 'ready' ? (
                    <button className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-sm flex items-center gap-1 ml-auto transition-colors">
                      <Download size={16} />
                      Baixar
                    </button>
                  ) : (
                    <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-bold text-sm transition-colors">
                      Detalhes
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ProfessionalsManagementView = () => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'categories'>('list');
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<'professional' | 'category' | null>(null);
  const [newItem, setNewItem] = useState({ name: '', specialty: 'Médico', vittaHealthDiscount: '' });

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
      } catch (err) {
        console.error('Erro ao excluir categoria:', err);
      }
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        await deleteDoc(doc(db, 'professionals', id));
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
          rating: 5.0,
          reviews: 0,
          imageUrl: 'https://picsum.photos/seed/prof/400/300',
          createdAt: new Date().toISOString()
        });
      } else if (isCreating === 'category') {
        await addDoc(collection(db, 'categories'), {
          name: newItem.name,
          slug: newItem.name.toLowerCase().replace(/\s+/g, '-'),
          type: 'professional',
          createdAt: new Date().toISOString()
        });
      }
      setIsCreating(null);
      setNewItem({ name: '', specialty: 'Médico', vittaHealthDiscount: '' });
    } catch (err) {
      console.error('Erro ao criar item:', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit/Create Modal */}
      <AnimatePresence>
        {(editingItem || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">
                  {editingItem ? `Editar ${editingItem.type === 'professional' ? 'Profissional' : 'Categoria'}` : `Novo ${isCreating === 'professional' ? 'Profissional' : 'Categoria'}`}
                </h3>
                <button onClick={() => { setEditingItem(null); setIsCreating(null); }} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                    autoFocus
                  />
                </div>
                {(isCreating === 'professional' || (editingItem && editingItem.type === 'professional')) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Especialidade</label>
                      <input 
                        type="text" 
                        required
                        value={editingItem ? editingItem.specialty : newItem.specialty}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, specialty: e.target.value })
                          : setNewItem({ ...newItem, specialty: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Desconto ViTTA Health</label>
                      <input 
                        type="text" 
                        placeholder="Ex: 20% OFF"
                        value={editingItem ? editingItem.vittaHealthDiscount : newItem.vittaHealthDiscount}
                        onChange={(e) => editingItem 
                          ? setEditingItem({ ...editingItem, vittaHealthDiscount: e.target.value })
                          : setNewItem({ ...newItem, vittaHealthDiscount: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
                      />
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setEditingItem(null); setIsCreating(null); }}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all"
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gerenciar Profissionais</h1>
          <p className="text-slate-500 dark:text-slate-400">Cadastre especialistas e gerencie categorias</p>
        </div>
        <button 
          onClick={() => setIsCreating(activeSubTab === 'list' ? 'professional' : 'category')}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20"
        >
          <Plus size={20} />
          {activeSubTab === 'list' ? 'Novo Profissional' : 'Nova Categoria'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'list' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Users size={18} />
          Profissionais ({professionals.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'categories' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img src={prof.imageUrl} alt={prof.name} className="w-14 h-14 rounded-xl object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">{prof.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{prof.specialty}</p>
                    {prof.vittaHealthDiscount && (
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
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
                    className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProfessional(prof.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-1 text-amber-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{prof.rating}</span>
                </div>
                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-lg">
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
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center group"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{category.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{category.slug}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => setEditingItem({ type: 'category', id: category.id, name: category.name })}
                  className="p-1.5 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
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

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'professionals'), (snapshot) => {
      setProfessionals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'professionals');
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Nossos Profissionais</h1>
        <p className="text-slate-500 dark:text-slate-400">Encontre os melhores especialistas para cuidar de você.</p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou especialidade..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all dark:text-white"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium whitespace-nowrap">Todos</button>
          <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Psicologia</button>
          <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Nutrição</button>
          <button className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap">Cardiologia</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {professionals.map((prof) => (
          <motion.div 
            key={prof.id}
            whileHover={{ y: -4 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
          >
              <div className="flex items-center gap-4">
                <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-2xl object-cover" />
                <div>
                  <h3 className="font-bold text-lg dark:text-white">{prof.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{prof.specialty}</p>
                  {prof.vittaHealthDiscount && (
                    <div className="mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold inline-block">
                      ViTTA Health: {prof.vittaHealthDiscount}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{prof.rating} ({prof.reviews} avaliações)</span>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Disponibilidade</p>
              <div className="flex gap-2">
                {(prof.availability || ['Seg', 'Qua', 'Sex']).map((day: string) => (
                  <span key={day} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold">
                    {day}
                  </span>
                ))}
              </div>
            </div>
            <button 
              onClick={() => setBookingProfessional(prof)}
              className="w-full py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              Agendar Consulta
            </button>
          </motion.div>
        ))}
      </div>

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
      console.log('DEBUG: PartnersView - Parceiros carregados:', data.length);
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

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || partner.category === selectedCategory.name;
    return matchesSearch && matchesCategory;
  });

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
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors dark:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{selectedCategory.name}</h1>
            <p className="text-slate-500 dark:text-slate-400">Veja todos os parceiros nesta categoria</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map((partner) => (
            <motion.div 
              key={partner.id}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex items-center gap-4">
                <img src={partner.imageUrl || "https://picsum.photos/seed/partner/100/100"} alt={partner.name} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg dark:text-white truncate">{partner.name}</h3>
                  <p className="text-sm text-emerald-600 font-bold">{partner.discount}</p>
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold">{partner.rating || '5.0'}</span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
                <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                  <span>{partner.address || 'Endereço não informado'}</span>
                </div>
                {partner.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Phone size={14} className="flex-shrink-0" />
                    <span>{partner.phone}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => handleGetDiscount(partner)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  Obter Desconto
                </button>
                <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <Info size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 rounded-[2.5rem] p-10 lg:p-16 text-white shadow-xl shadow-blue-500/20">
        <div className="relative z-10 max-w-2xl">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
            <Store size={32} />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">Convênios ViTTA</h1>
          <p className="text-lg text-cyan-50 opacity-90 leading-relaxed">
            Descontos exclusivos em centenas de estabelecimentos parceiros em diversas categorias.
          </p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
      </section>

      {/* ViTTA Health Section */}
      <section className="bg-emerald-50 dark:bg-emerald-900/10 rounded-[2.5rem] p-8 border border-emerald-100 dark:border-emerald-800/30">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
            <Stethoscope size={48} className="text-white" />
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">ViTTA Health</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Acesse nossa rede exclusiva de profissionais de saúde com descontos especiais para afiliados ViTTA.
            </p>
          </div>
          <button 
            onClick={() => setActiveTab?.('professionals')}
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 whitespace-nowrap"
          >
            Ver Profissionais
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Categorias Disponíveis', value: categories.length, color: 'text-emerald-500' },
          { label: 'Estabelecimentos Parceiros', value: partners.length + '+', color: 'text-blue-500' },
          { label: 'De Desconto para Afiliados', value: 'Até 50%', color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-1">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar categoria de convênio..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-6 py-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] text-lg shadow-sm focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
        />
      </div>

      {/* Categories Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{filteredCategories.length} Categorias</h2>
            <p className="text-slate-500 dark:text-slate-400">Explore todos os convênios disponíveis para afiliados ViTTA</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((cat) => (
              <motion.div 
                key={cat.id}
                whileHover={{ y: -8 }}
                onClick={() => setSelectedCategory(cat)}
                className="group cursor-pointer bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full"
              >
                <div className={`h-32 ${cat.color || 'bg-slate-500'} relative flex items-center justify-center transition-transform group-hover:scale-105 duration-500`}>
                  {getIcon(cat.icon)}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                    {getPartnersCount(cat.name)} parceiros
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{cat.description || 'Descontos exclusivos para afiliados'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const OffersView = ({ user }: { user?: any }) => {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleRedeem = (offer: any) => {
    if (!user) return;
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Benefícios e Ofertas</h1>
        <p className="text-slate-500 dark:text-slate-400">Aproveite descontos exclusivos em nossa rede de parceiros.</p>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {offers.map((offer) => (
          <motion.div 
            key={offer.id}
            whileHover={{ scale: 1.02 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="relative h-48">
              <img src={offer.imageUrl || 'https://picsum.photos/seed/offer/400/300'} alt={offer.title} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 shadow-sm">
                {offer.partner}
              </div>
              <div className="absolute bottom-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl">
                {offer.discount}
              </div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="font-bold text-xl mb-2 dark:text-white">{offer.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">{offer.description || 'Aproveite esta oferta exclusiva para membros.'}</p>
              <button 
                onClick={() => handleRedeem(offer)}
                className="w-full py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors"
              >
                Resgatar Cupom
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const SettingsView = ({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (v: boolean) => void }) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleDeleteAccount = async () => {
    if (window.confirm('TEM CERTEZA? Esta ação é irreversível e todos os seus dados serão apagados permanentEMENTE.')) {
      try {
        const user = auth.currentUser;
        if (user) {
          await deleteDoc(doc(db, 'users', user.uid));
          await user.delete();
          window.location.reload();
        }
      } catch (err) {
        console.error('Erro ao excluir conta:', err);
        alert('Para excluir sua conta, você precisa ter feito login recentemente. Por favor, saia e entre novamente antes de tentar excluir.');
      }
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  return (
    <div className="max-w-4xl space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Meu Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerencie suas informações pessoais e segurança.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold dark:text-white">Informações Pessoais</h2>
              <User className="text-emerald-600" size={20} />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-8">
              <div className="relative group">
                <img src="https://picsum.photos/seed/user/200/200" alt="Profile" className="w-32 h-32 rounded-[2rem] object-cover border-4 border-slate-50 dark:border-slate-800 shadow-lg" />
                <button className="absolute -bottom-2 -right-2 p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg border-4 border-white dark:border-slate-900 hover:scale-110 transition-transform">
                  <Edit size={16} />
                </button>
              </div>
              
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
                  <input type="text" defaultValue="João Silva" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">E-mail</label>
                  <input type="email" defaultValue="joao.silva@email.com" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Telefone</label>
                  <input type="tel" defaultValue="(11) 98765-4321" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Cidade</label>
                  <input type="text" defaultValue="São Paulo, SP" className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm dark:text-white focus:ring-2 focus:ring-emerald-500/20 transition-all" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Salvar Alterações
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pb-4">
              <h2 className="text-lg font-bold dark:text-white">Segurança</h2>
              <Lock className="text-blue-500" size={20} />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm dark:text-white">Autenticação em Duas Etapas</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Adicione uma camada extra de segurança.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white hover:bg-slate-50 transition-colors">Ativar</button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm dark:text-white">Alterar Senha</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Última alteração há 3 meses.</p>
                  </div>
                </div>
                <button className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold dark:text-white hover:bg-slate-50 transition-colors">Alterar</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Preferences */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <h2 className="text-lg font-bold border-b border-slate-50 dark:border-slate-800 pb-4 dark:text-white">Preferências</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm dark:text-white">Notificações</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Alertas de consultas</p>
                </div>
                <div className="w-10 h-5 bg-emerald-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm dark:text-white">Modo Escuro</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Interface noturna</p>
                </div>
                <div 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
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
          <div className="bg-rose-50/50 dark:bg-rose-500/5 p-8 rounded-3xl border border-rose-100 dark:border-rose-500/20 space-y-4">
            <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest">Zona de Perigo</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Uma vez excluída, sua conta não poderá ser recuperada.</p>
            <button 
              onClick={handleDeleteAccount}
              className="w-full py-3 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
            >
              Excluir Minha Conta
            </button>
          </div>
        </div>
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
      } catch (err) {
        console.error('Erro ao excluir exame:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Gestão de Exames</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          Novo Exame
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Nome do Exame"
                required
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
              <input 
                type="text" 
                placeholder="Preço (ex: R$ 150,00)"
                required
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
            <textarea 
              placeholder="Descrição"
              value={newItem.description}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white min-h-[100px]"
            />
            <div className="flex gap-3">
              <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">Salvar</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Exame</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Preço</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {exams.map((exam) => (
              <tr key={exam.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm dark:text-white">{exam.name}</span>
                    <span className="text-xs text-slate-400 line-clamp-1">{exam.description}</span>
                  </div>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm font-bold text-emerald-600">{exam.price}</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button onClick={() => handleDelete(exam.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
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
  const [newItem, setNewItem] = useState({ title: '', discount: '', partner: '', imageUrl: '', description: '' });

  useEffect(() => {
    const unsubscribeOffers = onSnapshot(collection(db, 'offers'), (snapshot) => {
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
    try {
      await addDoc(collection(db, 'offers'), {
        ...newItem,
        createdAt: new Date().toISOString()
      });
      setIsCreating(false);
      setNewItem({ title: '', discount: '', partner: '', imageUrl: '', description: '' });
    } catch (err) {
      console.error('Erro ao criar oferta:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir esta oferta?')) {
      try {
        await deleteDoc(doc(db, 'offers', id));
      } catch (err) {
        console.error('Erro ao excluir oferta:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Gestão de Ofertas</h2>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          Nova Oferta
        </button>
      </div>

      {isCreating && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Título da Oferta"
                required
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
              <input 
                type="text" 
                placeholder="Desconto (ex: 20% OFF)"
                required
                value={newItem.discount}
                onChange={(e) => setNewItem({ ...newItem, discount: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
              <select 
                required
                value={newItem.partner}
                onChange={(e) => setNewItem({ ...newItem, partner: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              >
                <option value="" disabled>Selecione um Parceiro/Profissional</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="URL da Imagem (Opcional)"
                value={newItem.imageUrl}
                onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
              <input 
                type="text" 
                placeholder="Descrição (Opcional)"
                value={newItem.description}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all">Salvar</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all">Cancelar</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Oferta</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Parceiro</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Desconto</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {offers.map((offer) => (
              <tr key={offer.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                <td className="px-8 py-4">
                  <span className="font-bold text-sm dark:text-white">{offer.title}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="text-sm text-slate-500 dark:text-slate-400">{offer.partner}</span>
                </td>
                <td className="px-8 py-4">
                  <span className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-lg">{offer.discount}</span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button onClick={() => handleDelete(offer.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
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
    color: 'bg-emerald-500',
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
      } catch (err) {
        console.error('Erro ao excluir parceiro:', err);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
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
        color: 'bg-emerald-500',
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">
                  {editingItem ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
                </h3>
                <button onClick={() => { setEditingItem(null); setIsCreating(null); }} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={editingItem ? handleSaveEdit : handleCreate} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) => editingItem 
                      ? setEditingItem({ ...editingItem, name: e.target.value })
                      : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Categoria</label>
                  <select 
                    value={editingItem ? editingItem.category : newItem.category}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, category: e.target.value })
                      : setNewItem({ ...newItem, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Desconto</label>
                  <input 
                    type="text" 
                    value={editingItem ? editingItem.discount : newItem.discount}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, discount: e.target.value })
                      : setNewItem({ ...newItem, discount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Telefone</label>
                  <input 
                    type="text" 
                    value={editingItem ? (editingItem.phone || '') : newItem.phone}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, phone: e.target.value })
                      : setNewItem({ ...newItem, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Endereço</label>
                  <input 
                    type="text" 
                    value={editingItem ? (editingItem.address || '') : newItem.address}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, address: e.target.value })
                      : setNewItem({ ...newItem, address: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">URL da Logomarca (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="https://exemplo.com/logo.png"
                    value={editingItem ? (editingItem.imageUrl || '') : newItem.imageUrl}
                    onChange={(e) => editingItem
                      ? setEditingItem({ ...editingItem, imageUrl: e.target.value })
                      : setNewItem({ ...newItem, imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => { setEditingItem(null); setIsCreating(null); }}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestão de Convênios</h1>
          <p className="text-slate-500 dark:text-slate-400">Cadastre e gerencie estabelecimentos conveniados</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveSubTab('establishments')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'establishments' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Store size={18} />
          Empresas
        </button>
        <button 
          onClick={() => setActiveSubTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'categories' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Tag size={18} />
          Categorias
        </button>
        <button 
          onClick={() => setActiveSubTab('offers')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'offers' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          <Tag size={18} />
          Ofertas
        </button>
        <button 
          onClick={() => setActiveSubTab('vitta-health')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === 'vitta-health' 
              ? 'border-emerald-500 text-emerald-500' 
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={20} />
              Novo Estabelecimento
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar estabelecimento..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
            <div className="relative w-full md:w-64">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm appearance-none focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              >
                <option>Todas as Categorias</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPartners.map((partner) => (
              <motion.div 
                key={partner.id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative"
              >
                <div className="flex justify-between items-start mb-6">
                  <img src={partner.imageUrl || 'https://picsum.photos/seed/partner/400/300'} alt={partner.name} className="w-12 h-12 rounded-xl object-cover" />
                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Ativo
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{partner.name}</h3>
                    <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg mt-1">
                      {partner.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-slate-600 dark:text-slate-400">
                      <span className="font-bold">Desconto:</span> {partner.discount}
                    </p>
                    {partner.address && (
                      <p className="text-slate-600 dark:text-slate-400">
                        <span className="font-bold">Endereço:</span> {partner.address}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => setEditingItem({ type: 'partner', ...partner })}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeletePartner(partner.id)}
                      className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
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
              className={`flex items-center gap-2 px-6 py-3 ${isCreating === 'category' ? 'bg-blue-500' : 'bg-blue-500'} hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20`}
            >
              {isCreating === 'category' ? <Plus size={20} className="rotate-45" /> : <Plus size={20} />}
              {isCreating === 'category' ? 'Cancelar' : 'Nova Categoria'}
            </button>
          </div>

          {isCreating === 'category' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold dark:text-white">Nova Categoria</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome</label>
                    <input 
                      type="text" 
                      placeholder="Nome da Categoria"
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Slug</label>
                    <input 
                      type="text" 
                      placeholder="slug"
                      value={newItem.slug}
                      onChange={(e) => setNewItem({ ...newItem, slug: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white text-slate-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ícone (Lucide Name)</label>
                    <select 
                      value={newItem.icon}
                      onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Cor (Tailwind Class)</label>
                    <select 
                      value={newItem.color}
                      onChange={(e) => setNewItem({ ...newItem, color: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    >
                      <option value="bg-emerald-500">Esmeralda</option>
                      <option value="bg-blue-500">Azul</option>
                      <option value="bg-rose-500">Rosa</option>
                      <option value="bg-amber-500">Âmbar</option>
                      <option value="bg-indigo-500">Índigo</option>
                      <option value="bg-violet-500">Violeta</option>
                      <option value="bg-orange-500">Laranja</option>
                      <option value="bg-cyan-500">Ciano</option>
                      <option value="bg-slate-500">Cinza</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    placeholder="Breve descrição da categoria"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
                  >
                    Salvar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsCreating(null)}
                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
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
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold dark:text-white">Editar Categoria</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Nome</label>
                    <input 
                      type="text" 
                      required
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Slug</label>
                    <input 
                      type="text" 
                      value={editingItem.slug}
                      onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white text-slate-400"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Ícone (Lucide Name)</label>
                    <select 
                      value={editingItem.icon || 'Heart'}
                      onChange={(e) => setEditingItem({ ...editingItem, icon: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
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
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Cor (Tailwind Class)</label>
                    <select 
                      value={editingItem.color || 'bg-emerald-500'}
                      onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    >
                      <option value="bg-emerald-500">Esmeralda</option>
                      <option value="bg-blue-500">Azul</option>
                      <option value="bg-rose-500">Rosa</option>
                      <option value="bg-amber-500">Âmbar</option>
                      <option value="bg-indigo-500">Índigo</option>
                      <option value="bg-violet-500">Violeta</option>
                      <option value="bg-orange-500">Laranja</option>
                      <option value="bg-cyan-500">Ciano</option>
                      <option value="bg-slate-500">Cinza</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    placeholder="Breve descrição da categoria"
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white h-24 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
                  >
                    Atualizar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Nome da Categoria</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Slug</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">Empresas</th>
                  <th className="px-8 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 ${category.color || 'bg-slate-100'} rounded-lg flex items-center justify-center text-white`}>
                          {getIcon(category.icon, 16)}
                        </div>
                        <span className="font-bold text-sm dark:text-white">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs text-slate-400 font-mono">{category.slug}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-sm text-slate-500 dark:text-slate-400">{getPartnersCountByCategory(category.name)}</span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setEditingItem({ type: 'category', ...category })}
                          className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
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
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
            >
              <Stethoscope size={20} />
              Gerenciar Profissionais
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar profissional na rede ViTTA Health..." 
                value={profSearchQuery}
                onChange={(e) => setProfSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProfessionals.map((prof) => (
              <motion.div 
                key={prof.id}
                whileHover={{ y: -4 }}
                className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-center gap-4">
                  <img src={prof.imageUrl} alt={prof.name} className="w-16 h-16 rounded-2xl object-cover" />
                  <div>
                    <h3 className="font-bold text-lg dark:text-white">{prof.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{prof.specialty}</p>
                    <div className="mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold inline-block">
                      ViTTA Health: {prof.vittaHealthDiscount}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">{prof.rating}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {prof.reviews} avaliações
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                    Ver Detalhes
                  </button>
                  <button className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Calendar size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
            
            {filteredProfessionals.length === 0 && (
              <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Activity className="text-slate-300" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Nenhum profissional encontrado</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Tente ajustar sua busca ou adicione descontos ViTTA Health aos profissionais.</p>
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#00b894] via-[#00cec9] to-[#0984e3] rounded-[2.5rem] p-10 md:p-20 text-center text-white shadow-2xl shadow-emerald-500/20">
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
          <button className="flex items-center gap-3 px-10 py-5 bg-white text-[#00b894] rounded-2xl font-bold shadow-xl hover:bg-emerald-50 transition-all transform hover:scale-105 active:scale-95 group">
            <MessageSquare size={24} className="group-hover:rotate-12 transition-transform" />
            Iniciar Chat de Suporte
          </button>
        </div>
        
        {/* Decorative elements to match the "blobs" in the image */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-emerald-300/10 rounded-full blur-2xl"></div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { 
            icon: Heart, 
            title: "Saúde Integrada", 
            desc: "Acesso a profissionais qualificados em diversas especialidades", 
            color: "bg-gradient-to-br from-emerald-400 to-teal-500",
            shadow: "shadow-emerald-200 dark:shadow-emerald-900/20"
          },
          { 
            icon: Tag, 
            title: "Descontos Exclusivos", 
            desc: "Cupons e ofertas especiais dos nossos parceiros", 
            color: "bg-gradient-to-br from-purple-400 to-indigo-500",
            shadow: "shadow-purple-200 dark:shadow-purple-900/20"
          },
          { 
            icon: Wallet, 
            title: "Carteira Digital", 
            desc: "Gerencie seus créditos e pagamentos com facilidade", 
            color: "bg-gradient-to-br from-orange-400 to-rose-500",
            shadow: "shadow-orange-200 dark:shadow-orange-900/20"
          }
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            whileHover={{ y: -8 }}
            className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none text-center space-y-5"
          >
            <div className={`w-16 h-16 ${item.color} rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg ${item.shadow}`}>
              <item.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8 pt-4">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white px-4">Perguntas Frequentes</h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details key={idx} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <summary className="flex items-center justify-between p-7 cursor-pointer list-none">
                <span className="font-bold text-lg text-slate-800 dark:text-slate-200">{faq.question}</span>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-open:bg-blue-50 dark:group-open:bg-blue-500/10 transition-colors">
                  <ChevronDown size={20} className="text-slate-400 group-open:text-blue-500 group-open:rotate-180 transition-all" />
                </div>
              </summary>
              <div className="px-7 pb-7 text-slate-600 dark:text-slate-400 text-base leading-relaxed border-t border-slate-50 dark:border-slate-800 pt-6">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* Developer Footer */}
      <div className="bg-[#0f172a] dark:bg-slate-900 rounded-2xl p-6 text-center space-y-2 border border-slate-800">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-sm">
          <Code size={18} className="text-blue-400" />
          <span>Sistema PowerControl - Versão 1.0</span>
        </div>
        <p className="text-slate-500 text-[10px]">
          © 2026 ViTTA. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

const UsersView = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);

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
      setEditingUser(null);
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Editar Usuário</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome</label>
                  <input 
                    type="text" 
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">E-mail</label>
                  <input 
                    type="email" 
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Status</label>
                    <select 
                      value={editingUser.status}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Plano</label>
                    <select 
                      value={editingUser.plan}
                      onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
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
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
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
        <h2 className="text-2xl font-bold dark:text-white">Gestão de Usuários</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition-colors">
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Plano</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={user.img} className="w-10 h-10 rounded-full object-cover" alt="" />
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                    user.status === 'Ativo' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 font-medium">{user.plan}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
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

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessLevels(accessLevels.map(al => al.id === editingLevel.id ? editingLevel : al));
    setEditingLevel(null);
  };

  return (
    <div className="space-y-10">
      <AnimatePresence>
        {editingLevel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Configurar Nível de Acesso</h3>
                <button onClick={() => setEditingLevel(null)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome do Nível</label>
                  <input 
                    type="text" 
                    value={editingLevel.role}
                    onChange={(e) => setEditingLevel({ ...editingLevel, role: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Descrição</label>
                  <textarea 
                    value={editingLevel.desc}
                    onChange={(e) => setEditingLevel({ ...editingLevel, desc: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingLevel(null)}
                    className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all"
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
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-[2.5rem] p-8 md:p-16 text-center text-white shadow-2xl shadow-blue-500/20">
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
            <UserCog size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Configurações de Usuário</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Gerencie permissões, acessos e preferências do sistema
          </p>
          <button className="flex items-center gap-2 px-8 py-4 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105 active:scale-95">
            <ShieldCheck size={20} />
            Verificar Permissões
          </button>
        </div>
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
      </div>

      {/* Config Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Access Levels */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Níveis de Acesso</h3>
          </div>
          <div className="space-y-4">
            {accessLevels.map((item) => (
              <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-blue-200 dark:hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm dark:text-white">{item.role}</span>
                  <button 
                    onClick={() => setEditingLevel(item)}
                    className="text-xs font-bold text-blue-500 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    Configurar
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Global Preferences */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-2xl">
              <Settings size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Preferências Globais</h3>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Auto-aprovação</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Novos usuários são aprovados automaticamente</p>
              </div>
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Logs de Auditoria</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Registrar todas as ações administrativas</p>
              </div>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold dark:text-white">Manutenção</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ativar modo de manutenção do sistema</p>
              </div>
              <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-2xl">
              <Lock size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Segurança</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold dark:text-white mb-1">Autenticação em Duas Etapas (2FA)</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Obrigatório para administradores</p>
              <button className="px-4 py-2 bg-rose-500 text-white rounded-xl text-xs font-bold">Gerenciar</button>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <p className="text-sm font-bold dark:text-white mb-1">Política de Senhas</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Mínimo 8 caracteres, letras e números</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-2xl">
              <Bell size={24} />
            </div>
            <h3 className="text-xl font-bold dark:text-white">Notificações</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium dark:text-slate-300">Alertas de novos usuários</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium dark:text-slate-300">Relatórios semanais</span>
              <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 dark:text-white">Meus Agendamentos</h1>
        <p className="text-slate-500 dark:text-slate-400">Gerencie suas consultas e horários marcados.</p>
      </section>

      <div className="space-y-4">
        {appointments.length > 0 ? appointments.map((apt) => (
          <motion.div 
            key={apt.id}
            whileHover={{ x: 4 }}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="flex items-center gap-4 flex-1">
              <img src={apt.imageUrl} alt={apt.professionalName} className="w-16 h-16 rounded-2xl object-cover" />
              <div>
                <h3 className="font-bold text-lg dark:text-white">{apt.professionalName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{apt.specialty}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 items-center">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data e Hora</p>
                <div className="flex items-center gap-2 text-sm font-bold dark:text-white">
                  <Calendar size={16} className="text-emerald-600" />
                  {new Date(apt.date).toLocaleDateString('pt-BR')} às {apt.time}
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                  Confirmado
                </span>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-all">
                  <Edit size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Você ainda não tem agendamentos.</p>
            <button className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
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
          <h1 className="text-3xl font-bold mb-1 dark:text-white">Rádio ViTTA</h1>
          <p className="text-slate-500 dark:text-slate-400">Música e entretenimento para o seu bem-estar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 p-1 rounded-[2.5rem] shadow-2xl shadow-blue-500/20">
            <div className="bg-white dark:bg-slate-900 rounded-[2.3rem] p-8 md:p-12 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div className={`w-32 h-32 md:w-48 md:h-48 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 transition-all duration-500 ${isPlaying ? 'scale-110 shadow-2xl shadow-emerald-500/20' : ''}`}>
                  <Radio className={`text-blue-500 transition-all duration-500 ${isPlaying ? 'animate-pulse scale-110' : ''}`} size={64} />
                </div>
                {isPlaying && (
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900"
                  />
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl md:text-3xl font-bold dark:text-white">
                  {isPlaying ? 'Transmitindo ao Vivo' : 'Rádio Pausada'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  {isPlaying 
                    ? 'Curta a melhor seleção musical preparada especialmente para você.' 
                    : 'Clique no botão abaixo para iniciar a transmissão da Rádio ViTTA.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                    isPlaying 
                      ? 'bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
                  }`}
                >
                  {isPlaying ? <X size={24} /> : <Radio size={24} />}
                  {isPlaying ? 'Pausar Rádio' : 'Ouvir Rádio'}
                </button>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setVolume(volume > 0 ? 0 : 0.5)} className="text-slate-400 hover:text-blue-500 transition-colors">
                      {volume === 0 ? <X size={20} /> : <Radio size={20} />}
                    </button>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.01" 
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                <Clock size={24} />
              </div>
              <div>
                <h4 className="font-bold dark:text-white">Programação 24h</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Música sem interrupções</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                <Star size={24} />
              </div>
              <div>
                <h4 className="font-bold dark:text-white">Alta Qualidade</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Áudio cristalino em HD</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600">
                  <Settings size={20} />
                </div>
                <h3 className="font-bold text-lg dark:text-white">Configuração Admin</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">URL da Transmissão</label>
                  <input 
                    type="text" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  disabled={isSaving || newUrl === config.url}
                  className="w-full py-3 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save size={18} />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          )}

          <div className="bg-blue-600 p-8 rounded-[2rem] text-white space-y-4 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <Radio size={120} />
            </div>
            <h3 className="text-xl font-bold relative z-10">Dica ViTTA</h3>
            <p className="text-blue-100 text-sm leading-relaxed relative z-10">
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
      className="fixed bottom-6 right-6 z-[60] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex items-center gap-4 min-w-[280px]"
    >
      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white animate-pulse shadow-lg shadow-blue-500/20">
        <Radio size={24} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rádio ViTTA</p>
        <p className="text-sm font-bold dark:text-white truncate">Ao Vivo</p>
        <div className="flex items-center gap-2 mt-1">
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setIsPlaying(false)}
          className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all"
        >
          <X size={20} />
        </button>
      </div>
    </motion.div>
  );
};

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold dark:text-white">{title}</h1>
    <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500">
        <LayoutGrid size={48} />
      </div>
      <div>
        <h3 className="text-xl font-bold dark:text-white">Página em Desenvolvimento</h3>
        <p className="text-slate-500 dark:text-slate-400">Estamos trabalhando para trazer o melhor conteúdo de {title} para você.</p>
      </div>
    </div>
  </div>
);

const LoginView = () => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-xl shadow-blue-500/20 mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {view === 'login' ? 'Bem-vindo ao ViTTA' : 'Crie sua conta'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {view === 'login' ? 'Entre na sua conta para continuar' : 'Junte-se a nós e cuide da sua saúde'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm rounded-2xl border border-rose-100 dark:border-rose-800 font-medium">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {view === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
                />
              </div>
            </div>

            {view === 'login' && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-blue-500 focus:ring-blue-500/20" />
                  <span className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">Lembrar de mim</span>
                </label>
                <button type="button" className="text-xs font-bold text-blue-500 hover:underline">Esqueceu a senha?</button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-blue-500 text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
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
                <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500">ou</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-sm disabled:opacity-70"
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

          <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {view === 'login' ? (
                <>Não tem uma conta? <button onClick={() => setView('signup')} className="text-blue-500 font-bold hover:underline">Cadastre-se</button></>
              ) : (
                <>Já tem uma conta? <button onClick={() => setView('login')} className="text-blue-500 font-bold hover:underline">Entre aqui</button></>
              )}
            </p>
          </div>
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

  // Radio Global State
  const [radioConfig, setRadioConfig] = useState({ url: 'https://icecast.portalviva.com.br/viva_fm_vitoria' });
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.5);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'config', 'radio'), (snapshot) => {
      if (snapshot.exists()) {
        setRadioConfig(snapshot.data() as any);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/radio');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = radioVolume;
    }
  }, [radioVolume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isRadioPlaying) {
        audioRef.current.play().catch(err => console.error('Erro ao tocar rádio:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRadioPlaying, radioConfig.url]);

  useEffect(() => {
    const seedPartners = async () => {
      console.log('DEBUG: Iniciando seedPartners...');
      
      const categoriesData = [
        { name: 'Saúde', icon: 'Heart', color: 'bg-rose-500', description: 'Encontre profissionais de saúde' },
        { name: 'Farmácias', icon: 'Store', color: 'bg-emerald-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Óticas', icon: 'Glasses', color: 'bg-blue-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Supermercados', icon: 'ShoppingCart', color: 'bg-violet-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Masculina', icon: 'Shirt', color: 'bg-indigo-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Feminina', icon: 'Shirt', color: 'bg-pink-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Moda Infantil', icon: 'Baby', color: 'bg-amber-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Calçados', icon: 'Footprints', color: 'bg-orange-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Suplementos', icon: 'Heart', color: 'bg-red-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Estética', icon: 'Heart', color: 'bg-fuchsia-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Eletrodomésticos', icon: 'Zap', color: 'bg-cyan-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Móveis', icon: 'Armchair', color: 'bg-yellow-600', description: 'Descontos exclusivos para afiliados' },
        { name: 'Salão de Beleza', icon: 'Scissors', color: 'bg-purple-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Material de Construção', icon: 'Hammer', color: 'bg-slate-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Padaria', icon: 'Coffee', color: 'bg-orange-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Lanchonete', icon: 'Coffee', color: 'bg-orange-500', description: 'Descontos exclusivos para afiliados' },
        { name: 'Restaurante', icon: 'Coffee', color: 'bg-rose-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Pizzaria', icon: 'Pizza', color: 'bg-orange-600', description: 'Descontos exclusivos para afiliados' },
        { name: 'Sorveteria', icon: 'IceCream', color: 'bg-sky-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Posto de Combustíveis', icon: 'Fuel', color: 'bg-slate-600', description: 'Descontos exclusivos para afiliados' },
        { name: 'Pet Shop', icon: 'PawPrint', color: 'bg-emerald-400', description: 'Descontos exclusivos para afiliados' },
        { name: 'Contador', icon: 'Calculator', color: 'bg-blue-600', description: 'Descontos exclusivos para afiliados' },
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
    }
  }, [isAuthReady, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          // Fallback or create if missing (though LoginView should handle it)
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
      } else {
        setUserData(null);
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Erro ao sair:', err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  const isAdmin = userData?.role === 'admin' || user?.email === 'jhecksanto@gmail.com';

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return isAdmin ? <AdminView user={user} /> : <PlaceholderView title="Dashboard Paciente" />;
      case 'professionals': return <ProfessionalsView user={user} />;
      case 'appointments': return <AppointmentsView user={user} />;
      case 'plans': return isAdmin ? <PartnershipsView setActiveTab={setActiveTab} /> : <PartnersView setActiveTab={setActiveTab} user={user} />;
      case 'wallets': return <PlaceholderView title="Carteiras" />;
      case 'voucher': return <PlaceholderView title="Compra Voucher" />;
      case 'pharmacies': return <PlaceholderView title="Farmácias de Plantão" />;
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
      case 'profile': return <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />;
      case 'support': return <SupportView />;
      case 'exams': return <ExamsView />;
      case 'offers': return <OffersView user={user} />;
      default: return isAdmin ? <AdminView user={user} /> : <PlaceholderView title="Dashboard Paciente" />;
    }
  };

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ViTTA</h2>
                <p className="text-xs font-medium text-slate-400">{isAdmin ? 'Admin' : 'Paciente'}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            <div>
              <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Navegação</p>
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
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  <LogOut size={18} />
                  <span className="text-sm">Sair</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 p-2">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.displayName?.charAt(0) || 'U'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.displayName || 'Usuário'}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg dark:text-white"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar exames, médicos..." 
                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-blue-500/20 transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold dark:text-white">{user.displayName || 'Usuário'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{userData?.plan || 'Membro Free'}</p>
              </div>
              <img 
                src={user.photoURL || "https://picsum.photos/seed/user/100/100"} 
                alt="Profile" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-white dark:border-slate-800 shadow-sm"
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
        src={radioConfig.url.includes(':') && !radioConfig.url.includes(';') ? (radioConfig.url.endsWith('/') ? `${radioConfig.url};` : `${radioConfig.url}/;`) : radioConfig.url} 
        crossOrigin="anonymous"
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
