import { AdminAppointmentsView } from "./components/Admin/AdminAppointmentsView";
import { AdminSupportChatView } from "./components/Admin/AdminSupportChatView";
// Force refresh - 2026-04-07 23:32

import { ProfessionalsManagementView } from "./components/Admin/ProfessionalsManagementView";
import { PartnershipManager } from "./components/Admin/PartnershipManager";
import { UserConfigView } from "./components/Admin/UserConfigView";
import { ProfessionalsView } from "./components/Patient/ProfessionalsView";
import { PartnersView } from "./components/Patient/PartnersView";
import { OffersView } from "./components/Patient/OffersView";
import { MyAppointmentsView } from "./components/Patient/MyAppointmentsView";
import { ExamsView } from "./components/Patient/ExamsView";
import { SupportView } from "./components/System/SupportView";
import { TermsAndPrivacyView } from "./components/System/TermsAndPrivacyView";
import { ChatView } from "./components/System/ChatView";
import { NotificationsView } from "./components/System/NotificationsView";
import { SettingsView } from "./components/System/SettingsView";
import { MobileBottomNav } from "./components/Navigation/MobileBottomNav";
import AnalyticsView from "./components/Admin/AnalyticsView";

import React, { useState, useEffect, useMemo, useRef } from "react";
import healthIcon from "./assets/images/category_health_icon_1781741323843.jpg";
import pharmacyIcon from "./assets/images/category_pharmacy_icon_1781741335670.jpg";
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
  Crown,
  Package,
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
  MessageCircle,
  User,
  UserX,
  UserCheck,
  UserMinus,
  HelpCircle,
  QrCode,
  Copy,
  ChevronLeft,
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
  MoreVertical,
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
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  DollarSign,
  AlertCircle,
  Send,
  CalendarClock,
  PlusCircle,
  MinusCircle,
  CalendarCheck,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Receipt,
  FileQuestion,
  SkipForward,
  Eye,
  EyeOff,
  MonitorPlay,
  Images,
  TrendingUp,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Coins,
  Sparkles,
  Landmark,
  Percent,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Briefcase,
  UserPlus,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { motion, AnimatePresence } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { auth, db, storage, googleProvider } from "./firebase";
import { useToast } from "./contexts/ToastContext.tsx";
import { GoogleAuthProvider } from "firebase/auth";
import {
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "./utils/googleCalendar";
import { validateCPF, validateEmail, fetchAddressByCep } from "./lib/utils";
import ConfirmationModal from "./components/ConfirmationModal";
import OfflineIndicatorBanner from "./components/OfflineIndicatorBanner";
import {
  addDoc,
  setDoc,
  updateDoc,
  sanitizeData,
} from "./lib/firestore-wrappers";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import imageCompression from "browser-image-compression";
import { initializeApp, getApps } from "firebase/app";
import firebaseConfig from "../firebase-applet-config.json";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  getAuth,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  deleteDoc,
  Timestamp,
  serverTimestamp,
  getDocFromServer,
  getDocFromCache,
  increment,
  writeBatch,
} from "firebase/firestore";
import { Medication, HealthGoal } from "./types";
import AuditLogsList from "./components/Admin/AuditLogsList";
import SubscriptionManagementView from "./components/Admin/SubscriptionManagementView";
import AdminAnalytics from "./components/Admin/AnalyticsView";
import { AdminVoucherManagementView } from "./components/Admin/AdminVoucherManagementView";
import { AdminLiberalConfigView } from "./components/Admin/AdminLiberalConfigView";
import NotificationCenter from "./components/NotificationCenter";
import HelpCenter from "./components/HelpCenter";
import ReviewModal from "./components/ReviewModal";
import KYCWizard from "./components/KYCWizard";
import TelemedicineRoom from "./components/TelemedicineRoom";
import { AdminWalletManagementView } from "./components/AdminWalletManagementView";
import { enqueueOfflineAction } from "./lib/offlineQueue";
import { galExams } from "./data/galExams";

const Skeleton = ({
  className,
  ...props
}: {
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`animate-pulse bg-vitta-surface-2 rounded-xl ${className}`}
    {...props}
  />
);

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
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
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  // Throw for critical mutations so catch blocks can handle failures.
  // Avoid throwing for standard queries/snapshots to prevent unhandled React/background runtime crashes.
  if (
    operationType === OperationType.CREATE ||
    operationType === OperationType.UPDATE ||
    operationType === OperationType.DELETE ||
    operationType === OperationType.WRITE
  ) {
    throw new Error(JSON.stringify(errInfo));
  }
}

const formatDateForDisplay = (
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
) => {
  if (!dateStr) return "";
  let d: Date;
  if (dateStr.includes("T")) {
    d = new Date(dateStr);
  } else {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // 0-indexed month
      const day = parseInt(parts[2], 10);
      d = new Date(year, month, day);
    } else {
      d = new Date(dateStr);
    }
  }
  return d.toLocaleDateString("pt-BR", options);
};

const logAdminAction = async (
  action: string,
  description: string,
  before?: any,
  after?: any,
) => {
  try {
    await addDoc(collection(db, "audit_logs"), {
      adminId: auth.currentUser?.uid,
      adminName:
        auth.currentUser?.displayName || auth.currentUser?.email || "Admin",
      action,
      description,
      before: before ? before : null,
      after: after ? after : null,
      timestamp: Timestamp.now(),
    });
  } catch (err) {
    console.error("Error logging admin action:", err);
  }
};

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Excluir",
  cancelText = "Cancelar",
  variant = "danger",
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-sm rounded-3xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 text-center space-y-4 overflow-y-auto">
          <div
            className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${variant === "danger" ? "bg-vitta-danger/10 text-vitta-danger" : "bg-vitta-accent/10 text-vitta-accent"}`}
          >
            {variant === "danger" ? <Trash2 size={32} /> : <Info size={32} />}
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-vitta-text-primary">
              {title}
            </h3>
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
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-3 text-white rounded-2xl font-bold shadow-lg transition-all ${variant === "danger" ? "bg-vitta-danger hover:bg-vitta-danger/90 shadow-vitta-danger/20" : "bg-vitta-accent hover:bg-vitta-accent/90 shadow-vitta-accent/20"}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const ChangePasswordModal = ({
  user,
  onClose,
}: {
  user: FirebaseUser | null;
  onClose: () => void;
}) => {
  const { addToast } = useToast();
  const [passwords, setPasswords] = useState({
    new: "",
    confirm: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const handleUpdate = async () => {
    if (!user) return;
    if (passwords.new.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await updatePassword(user, passwords.new);

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Senha Alterada",
        message: "Sua senha foi alterada com sucesso.",
        type: "system",
        read: false,
        createdAt: Timestamp.now(),
      });

      addToast("Senha atualizada com sucesso!", "success");
      onClose();
    } catch (err: any) {
      console.error("Erro ao atualizar senha:", err);
      if (err.code === "auth/requires-recent-login") {
        setError(
          "Esta operação requer um login recente. Por favor, saia e entre novamente.",
        );
      } else {
        setError("Erro ao atualizar senha. Tente novamente.");
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
        className="bg-vitta-surface w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border max-h-[90vh] flex flex-col"
      >
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-vitta-text-primary">
              Alterar Senha
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
            >
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
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Nova Senha
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
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

const HealthMetricsInputModal = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState({
    weight: "",
    height: "",
    bloodPressure: "",
    glucose: "",
    sleepHours: "",
    steps: "",
    waterIntake: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const data: any = {
        userId: user.uid,
        date: today,
        createdAt: Timestamp.now(),
      };
      if (metrics.weight) data.weight = Number(metrics.weight);
      if (metrics.height) data.height = Number(metrics.height);
      if (metrics.bloodPressure) data.bloodPressure = metrics.bloodPressure;
      if (metrics.glucose) data.glucose = Number(metrics.glucose);
      if (metrics.sleepHours) data.sleepHours = Number(metrics.sleepHours);
      if (metrics.steps) data.steps = Number(metrics.steps);
      if (metrics.waterIntake) data.waterIntake = Number(metrics.waterIntake);

      if (!navigator.onLine) {
        enqueueOfflineAction("CREATE_METRIC", data);
        addToast(
          "Você está offline. Suas métricas foram salvas no celular e serão sincronizadas quando a internet voltar.",
          "info",
        );
        onClose();
        return;
      }

      await addDoc(collection(db, "health_metrics"), data);
      await updateDoc(doc(db, "users", user.uid), {
        healthMetrics: {
          ...(metrics.weight ? { weight: Number(metrics.weight) } : {}),
          ...(metrics.height ? { height: Number(metrics.height) } : {}),
          ...(metrics.bloodPressure ? { bloodPressure: metrics.bloodPressure } : {}),
          ...(metrics.glucose ? { glucose: Number(metrics.glucose) } : {}),
          ...(metrics.sleepHours ? { sleepHours: Number(metrics.sleepHours) } : {}),
          ...(metrics.steps ? { steps: Number(metrics.steps) } : {}),
          ...(metrics.waterIntake ? { waterIntake: Number(metrics.waterIntake) } : {}),
          updatedAt: new Date().toISOString(),
        },
      });
      addToast("Métricas de saúde salvas com sucesso!", "success");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "health_metrics");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border max-h-[90vh] flex flex-col"
      >
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-vitta-text-primary">
              Registrar Saúde
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
            >
              <X size={20} className="text-vitta-text-muted" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Peso (kg)
              </label>
              <input
                type="number"
                value={metrics.weight}
                onChange={(e) =>
                  setMetrics({ ...metrics, weight: e.target.value })
                }
                placeholder="0.0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Altura (cm)
              </label>
              <input
                type="number"
                value={metrics.height}
                onChange={(e) =>
                  setMetrics({ ...metrics, height: e.target.value })
                }
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Pressão (mmHg)
              </label>
              <input
                type="text"
                value={metrics.bloodPressure}
                onChange={(e) =>
                  setMetrics({ ...metrics, bloodPressure: e.target.value })
                }
                placeholder="120/80"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Glicose (mg/dL)
              </label>
              <input
                type="number"
                value={metrics.glucose}
                onChange={(e) =>
                  setMetrics({ ...metrics, glucose: e.target.value })
                }
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Sono (horas)
              </label>
              <input
                type="number"
                value={metrics.sleepHours}
                onChange={(e) =>
                  setMetrics({ ...metrics, sleepHours: e.target.value })
                }
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Passos
              </label>
              <input
                type="number"
                value={metrics.steps}
                onChange={(e) =>
                  setMetrics({ ...metrics, steps: e.target.value })
                }
                placeholder="0"
                className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-2xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Água (ml)
              </label>
              <input
                type="number"
                value={metrics.waterIntake}
                onChange={(e) =>
                  setMetrics({ ...metrics, waterIntake: e.target.value })
                }
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
  user,
  userData,
  googleToken,
  setActiveTab,
}: {
  isOpen: boolean;
  onClose: () => void;
  professional: any;
  user: any;
  userData?: any;
  googleToken?: string | null;
  setActiveTab?: (tab: string) => void;
}) => {
  const [modalTab, setModalTab] = useState<"profile" | "booking">("profile");
  const { addToast } = useToast();
  const [isBooking, setIsBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [modality, setModality] = useState<"presencial" | "telemedicine">(
    "presencial",
  );

  const parseDiscountPercentage = (discountStr: string | undefined): number => {
    if (!discountStr) return 0;
    const match = discountStr.match(/(\d+)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  };

  const rawPriceNumeric = parseFloat(String(professional?.price || "R$ 150,00").replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
  const discountPct = parseDiscountPercentage(professional?.vittaHealthDiscount);
  const discountAmount = (rawPriceNumeric * discountPct) / 100;
  const finalConvenioPrice = rawPriceNumeric - discountAmount;

  useEffect(() => {
    if (professional) {
      if (professional.isPresencialEnabled === false && professional.isTelemedicineEnabled !== false) {
        setModality("telemedicine");
      } else {
        setModality("presencial");
      }
    }
  }, [professional]);

  const [isModalityConfirmed, setIsModalityConfirmed] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "cash_presencial">("wallet");

  useEffect(() => {
    if (modality !== "presencial" && paymentMethod !== "wallet") {
      setPaymentMethod("wallet");
    }
  }, [modality, paymentMethod]);

  useEffect(() => {
    if (!isOpen || !professional || !selectedDate) return;

    const fetchBooked = async () => {
      setIsLoadingSlots(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("professionalId", "==", professional.id),
          where("date", "==", selectedDate),
        );
        const snapshot = await getDocs(q);
        const booked = snapshot.docs
          .map((doc) => doc.data())
          .filter((data) => data.status !== "cancelled")
          .map((data) => data.time);
        setBookedSlots(booked);
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBooked();
  }, [selectedDate, professional, isOpen]);

  useEffect(() => {
    if (!selectedDate || !professional) return;

    let slots: string[] = [];

    const blockedDates: string[] = professional.schedule?.blockedDates || [];
    if (blockedDates.includes(selectedDate)) {
      setAvailableSlots([]);
      setSelectedTime("");
      return;
    }

    if (professional.schedule?.weekly) {
      const dateObj = new Date(selectedDate + "T00:00:00");
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayName = dayNames[dateObj.getDay()];
      const daySchedule = professional.schedule.weekly[dayName] || [];

      daySchedule.forEach((period: { start: string; end: string }) => {
        let current = new Date(`2000-01-01T${period.start}:00`);
        const stop = new Date(`2000-01-01T${period.end}:00`);
        while (current < stop) {
          slots.push(current.toTimeString().substring(0, 5));
          current = new Date(current.getTime() + 30 * 60000);
        }
      });
    } else {
      // Fallback/Legacy: availableDays might be a string like "Seg, Qua, Sex"
      // For now, let's just provide some default business hours if no structured schedule
      slots = [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
      ];
    }

    setAvailableSlots(Array.from(new Set(slots)));
    if (!slots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, professional]);

  const handleConfirm = async () => {
    if (!user || !professional || !selectedTime) return;

    if (professional.schedule?.blockedDates?.includes(selectedDate)) {
      addToast("Não é possível agendar nesta data pois o profissional está de folga global.", "error");
      return;
    }

    // Use finalConvenioPrice computed at component-level
    const priceNumeric = finalConvenioPrice; 
    const formattedPriceStr = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceNumeric);

    if (paymentMethod === "wallet") {
      const clientBalance = userData?.walletBalance || 0;
      if (clientBalance < priceNumeric) {
        addToast("Saldo insuficiente na sua carteira ViTTA para realizar este agendamento.", "error");
        return;
      }
    }

    setIsBooking(true);
    try {
      // 0. Concurrency slot check
      const slotQuery = query(
        collection(db, "appointments"),
        where("professionalId", "==", professional.id),
        where("date", "==", selectedDate),
        where("time", "==", selectedTime)
      );
      const slotSnapshot = await getDocs(slotQuery);
      const isSlotTaken = slotSnapshot.docs.some(
        (d) => d.data().status !== "cancelled"
      );
      if (isSlotTaken) {
        addToast(
          "Este horário acabou de ser reservado por outro paciente. Por favor, selecione outro horário disponível.",
          "warning"
        );
        setIsBooking(false);
        setSelectedTime("");
        return;
      }

      const payStatus = paymentMethod === "wallet" ? "paid" : "pending";
      // 1. Save to Firestore
      const aptRef = await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        patientName: userData?.name || user.displayName || user.email,
        professionalId: professional.id,
        professionalName: professional.name,
        specialty: professional.specialty,
        professionalUserId: professional.userId || "",
        imageUrl:
          professional.imageUrl || "https://picsum.photos/seed/prof/400/300",
        date: selectedDate,
        time: selectedTime,
        status: "pending",
        modality,
        price: formattedPriceStr,
        priceNumeric: priceNumeric,
        paymentMethod: paymentMethod,
        paymentStatus: payStatus,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      if (paymentMethod === "wallet") {
        // Deduct from client
        await updateDoc(doc(db, "users", user.uid), {
          walletBalance: increment(-priceNumeric),
        });
        await addDoc(collection(db, "transactions"), {
          userId: user.uid,
          type: "debit",
          category: "Consulta",
          description: `Agendamento de consulta (${professional.name} - ${professional.specialty})`,
          amount: priceNumeric,
          date: new Date().toISOString(),
          status: "completed",
          referenceId: aptRef.id,
          createdAt: Timestamp.now(),
        });
      }

      if (modality === "telemedicine") {
        await updateDoc(doc(db, "appointments", aptRef.id), {
          telemedicineRoomId: aptRef.id,
          telemedicineUrl: `${window.location.origin}/?room=${aptRef.id}`,
        });
      }

      // Auto-Sync to Google Calendar
      if (googleToken && userData?.googleCalendarSyncEnabled !== false) {
        const eventId = await createGoogleCalendarEvent({
          professionalName: professional.name,
          specialty: professional.specialty,
          date: selectedDate,
          time: selectedTime,
        }, googleToken);
        if (eventId) {
          await updateDoc(doc(db, "appointments", aptRef.id), {
            googleCalendarEventId: eventId,
          });
        }
      }

      // 1.1 Create Notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Solicitação de Consulta Enviada",
        message: `Sua solicitação de consulta com ${professional.name} para o dia ${formatDateForDisplay(selectedDate)} às ${selectedTime} foi enviada. Aguardando confirmação do profissional.`,
        type: "appointment",
        read: false,
        createdAt: Timestamp.now(),
      });

      if (professional.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: professional.userId,
          title: "Nova Solicitação de Consulta",
          message: `${userData?.name || user.displayName || "Paciente"} solicitou agendamento para o dia ${formatDateForDisplay(selectedDate)} às ${selectedTime} (${modality === "telemedicine" ? "Telemedicina" : "Presencial"}).`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      // 1.2 Save savings to economies
      const savingsAmount = rawPriceNumeric - priceNumeric;
      if (savingsAmount > 0) {
        await addDoc(collection(db, "economies"), {
          userId: user.uid,
          title: `Consulta com ${professional.name}`,
          description: `Serviço de ${professional.specialty} (${modality === "telemedicine" ? "Telemedicina" : "Presencial"})`,
          originalPrice: rawPriceNumeric,
          paidPrice: priceNumeric,
          savedAmount: savingsAmount,
          type: "appointment",
          referenceId: aptRef.id,
          createdAt: Timestamp.now(),
        });
      }

      // 2. Open WhatsApp - Dirigido pelo campo cadastrado no profissional ou fallback geral
      const phoneNumber = professional.whatsapp
        ? professional.whatsapp.replace(/\D/g, "")
        : "5528999881386";
      const formattedDate = formatDateForDisplay(selectedDate);
      const message = `Olá! Gostaria de agendar um atendimento.\n\n*Meus dados:*\nNome: ${user.displayName || "Usuário"}\nEmail: ${user.email}\n\n*Profissional selecionado:*\nNome: ${professional.name}\nEspecialidade: ${professional.specialty}\n\n*Data e Hora:*\n${formattedDate} às ${selectedTime}`;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

      addToast("Consulta solicitada com sucesso!", "success");

      // Redirection to 'Meus Agendamentos'
      if (setActiveTab) {
        setActiveTab("appointments");
      }

      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "appointments");
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
        className="bg-vitta-surface w-full max-w-2xl rounded-3xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <div className="flex items-center gap-4">
            <img
              src={
                professional.imageUrl ||
                "https://picsum.photos/seed/prof/400/300"
              }
              alt={professional.name}
              className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white"
            />
            <div>
              <h4 className="font-bold text-vitta-text-primary text-xl">
                Dr(a). {professional.name}
              </h4>
              <p className="text-sm text-vitta-text-secondary">
                {professional.specialty}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="flex border-b border-vitta-border bg-vitta-surface shrink-0 px-6 pt-4 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setModalTab("profile")}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${modalTab === "profile" ? "border-vitta-accent text-vitta-accent" : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"}`}
          >
            👤 Sobre o Profissional
          </button>
          <button
            onClick={() => setModalTab("booking")}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${modalTab === "booking" ? "border-vitta-green text-vitta-green" : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"}`}
          >
            📅 Agendar Consulta
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 no-scrollbar">
          {modalTab === "profile" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-1">
                    Avaliação
                  </p>
                  <p className="font-bold text-vitta-text-primary flex items-center gap-1">
                    ⭐ {professional.rating || "N/A"}{" "}
                    <span className="text-xs font-normal text-vitta-text-secondary">
                      ({professional.reviews || 0} avaliações)
                    </span>
                  </p>
                </div>
                <div className="bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-1">
                    CRM / Registro
                  </p>
                  <p className="font-bold text-vitta-text-primary">
                    {professional.registrationNumber || "Não informado"}
                  </p>
                </div>
                <div className="bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-1">
                    Valor da Consulta
                  </p>
                  <p className="font-bold text-vitta-text-primary">
                    R$ {professional.price || "À Combinar"}
                  </p>
                </div>
                <div className="bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-1">
                    ViTTA Health Partner
                  </p>
                  <p className="font-bold text-vitta-green">
                    {professional.vittaHealthDiscount || "Sem desconto ativo"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-vitta-text-primary mb-2 border-b border-vitta-border pb-2">
                  Sobre Mim / Currículo
                </h3>
                {professional.curriculum ? (
                  <div className="text-sm text-vitta-text-secondary whitespace-pre-wrap">
                    {professional.curriculum}
                  </div>
                ) : (
                  <p className="text-sm text-vitta-text-muted italic">
                    Este profissional ainda não disponibilizou um currículo ou
                    apresentação detalhada.
                  </p>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setModalTab("booking")}
                  className="px-6 py-3 bg-vitta-green text-white rounded-xl font-bold shadow-lg shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center justify-center gap-2"
                >
                  Prosseguir para Agendamento
                </button>
              </div>
            </div>
          )}

          {modalTab === "booking" && (
            <div className="space-y-6">
              <p className="text-vitta-text-secondary text-sm">
                Selecione a data e hora desejada. Após a confirmação, entraremos
                em contato via WhatsApp para finalizações, se aplicável.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Selecione a Data
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 outline-none text-vitta-text-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Tipo de Atendimento
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {professional?.isPresencialEnabled !== false && (
                      <button
                        type="button"
                        onClick={() => {
                          setModality("presencial");
                          setIsModalityConfirmed(false);
                        }}
                        className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                          modality === "presencial"
                            ? "border-vitta-green bg-vitta-green/10 text-vitta-green"
                            : "border-vitta-border bg-vitta-surface hover:border-vitta-text-secondary text-vitta-text-primary"
                        }`}
                      >
                        🏥 Presencial
                      </button>
                    )}
                    {professional?.isTelemedicineEnabled !== false && (
                      <button
                        type="button"
                        onClick={() => {
                          setModality("telemedicine");
                          setIsModalityConfirmed(false);
                        }}
                        className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                          modality === "telemedicine"
                            ? "border-vitta-green bg-vitta-green/10 text-vitta-green"
                            : "border-vitta-border bg-vitta-surface hover:border-vitta-text-secondary text-vitta-text-primary"
                        }`}
                      >
                        💻 Telemedicina (Vídeo)
                      </button>
                    )}
                  </div>

                  {modality === "presencial" && professional?.officeLocation && (
                    <div className="p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs space-y-1 mt-2">
                      <p className="font-bold text-vitta-text-primary">📍 Local de Atendimento:</p>
                      <p className="text-vitta-text-secondary">{professional.officeLocation}</p>
                    </div>
                  )}

                  {/* Confirmação exigida do tipo de atendimento */}
                  <label className="flex items-start gap-2.5 mt-3 p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl cursor-pointer select-none hover:border-vitta-green/30 transition-colors">
                    <input
                      type="checkbox"
                      id="confirm-modality-checkbox"
                      checked={isModalityConfirmed}
                      onChange={(e) => setIsModalityConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-vitta-border text-vitta-green focus:ring-vitta-green"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-vitta-text-primary">
                        Confirmo que desejo atendimento{" "}
                        {modality === "presencial"
                          ? "Presencial"
                          : "por Telemedicina"}
                      </p>
                      <p className="text-vitta-text-muted mt-0.5 font-normal">
                        É necessário confirmar o Tipo de Atendimento antes de
                        prosseguir com a solicitação.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Horários Disponíveis
                  </label>
                  {professional.schedule?.blockedDates?.includes(selectedDate) ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                        <CalendarX size={20} className="text-amber-600 shrink-0" />
                        <span>Profissional de Folga Global</span>
                      </div>
                      <p className="text-xs text-amber-700/90 dark:text-amber-300 leading-relaxed">
                        O profissional definiu o dia <strong className="font-semibold">{formatDateForDisplay(selectedDate)}</strong> como folga global. Não há horários para agendamento nesta data.
                      </p>
                    </div>
                  ) : isLoadingSlots ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div
                          key={i}
                          className="h-10 bg-vitta-surface-2 rounded-lg animate-pulse"
                        />
                      ))}
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                      {availableSlots.map((time) => {
                        const isBooked = bookedSlots.includes(time);
                        return (
                          <button
                            key={time}
                            disabled={isBooked}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                              selectedTime === time
                                ? "bg-vitta-green border-vitta-green text-white shadow-md"
                                : isBooked
                                  ? "bg-vitta-surface-2 border-vitta-border text-vitta-text-muted cursor-not-allowed opacity-50"
                                  : "bg-vitta-surface border-vitta-border text-vitta-text-primary hover:border-vitta-green transition-colors"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 bg-vitta-danger/5 rounded-xl border border-dashed border-vitta-danger/20 text-center">
                      <p className="text-[10px] font-bold text-vitta-danger uppercase">
                        Sem horários para este dia
                      </p>
                    </div>
                  )}
                </div>

                {/* Seção Forma de Pagamento */}
                <div className="space-y-3 p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border mt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">Valor do Atendimento</span>
                      <span className="text-sm font-semibold text-vitta-text-muted line-through font-mono">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(rawPriceNumeric)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-t border-vitta-border/40 pt-2 pb-1">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">Valor do Convênio</span>
                        {discountPct > 0 && (
                          <span className="text-[10px] text-vitta-green font-bold uppercase tracking-wide">
                            Desconto ViTTA Health: {professional?.vittaHealthDiscount || `${discountPct}%`}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-black text-vitta-green font-mono">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(finalConvenioPrice)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2 border-t border-vitta-border/60">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1 block mb-1">
                      Selecione a Forma de Pagamento
                    </label>
                    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("wallet")}
                        className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                          paymentMethod === "wallet"
                            ? "bg-vitta-green/5 border-vitta-green text-vitta-text-primary"
                            : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:border-vitta-green/35"
                        } ${modality !== "presencial" ? "sm:col-span-2 text-center items-center" : ""}`}
                      >
                        <span className="font-bold">🎫 Carteira Digital</span>
                        <span className="text-[10px] text-vitta-text-muted">
                          Saldo: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(userData?.walletBalance || 0)}
                        </span>
                      </button>
                      
                      {modality === "presencial" && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("cash_presencial")}
                          className={`p-3 rounded-xl border text-left text-xs transition-all flex flex-col gap-1 ${
                            paymentMethod === "cash_presencial"
                              ? "bg-vitta-amber/5 border-vitta-amber text-vitta-text-primary"
                              : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:border-vitta-amber/35"
                          }`}
                        >
                          <span className="font-bold font-sans">💵 Pagamento Presencial</span>
                          <span className="text-[10px] text-vitta-text-muted">Presencialmente no consultório</span>
                        </button>
                      )}
                    </div>
                    
                    {paymentMethod === "wallet" && (userData?.walletBalance || 0) < finalConvenioPrice && (
                      <p className="text-[10px] font-bold text-vitta-danger mt-1">
                        ⚠️ Saldo insuficiente na sua carteira ViTTA. Por favor, adicione fundos{modality === "presencial" ? " ou escolha Pagamento Presencial." : "."}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 border-t border-vitta-border">
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
                  disabled={isBooking || !selectedTime || !isModalityConfirmed}
                  className="flex-1 py-3 bg-vitta-green text-white rounded-xl font-bold shadow-lg shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBooking ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <MessageSquare size={18} />
                      Solicitar Agendamento
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const NotificationFeed = ({ user }: { user: any }) => {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(10),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      );
    });
    return () => unsubscribe();
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error(error);
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm text-center">
        <Bell className="mx-auto text-vitta-text-muted mb-3" size={32} />
        <h3 className="font-bold text-vitta-text-primary">
          Nenhuma Notificação
        </h3>
        <p className="text-xs text-vitta-text-secondary mt-1">
          Você está em dia com seus alertas.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden flex flex-col max-h-[400px]">
      <div className="p-6 border-b border-vitta-border shrink-0 flex items-center justify-between">
        <h3 className="text-lg font-bold text-vitta-text-primary">
          Timeline de Notificações
        </h3>
        <Bell className="text-vitta-accent" size={20} />
      </div>
      <div className="overflow-y-auto no-scrollbar flex-1 divide-y divide-vitta-border">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 hover:bg-vitta-surface-2 transition-colors relative group ${!n.read ? "bg-vitta-accent-bg/30" : ""}`}
          >
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === "exam"
                    ? "bg-vitta-green-bg text-vitta-green"
                    : n.type === "appointment"
                      ? "bg-vitta-accent-bg text-vitta-accent"
                      : "bg-vitta-purple-bg text-vitta-purple"
                }`}
              >
                {n.type === "exam" ? (
                  <FileText size={18} />
                ) : n.type === "appointment" ? (
                  <Calendar size={18} />
                ) : (
                  <Bell size={18} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`text-sm ${!n.read ? "font-bold text-vitta-text-primary" : "font-medium text-vitta-text-secondary"} truncate`}
                  >
                    {n.title}
                  </p>
                </div>
                <p
                  className={`text-xs mt-0.5 line-clamp-2 ${!n.read ? "text-vitta-text-primary" : "text-vitta-text-muted"}`}
                >
                  {n.message}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-vitta-text-muted font-medium">
                    {n.createdAt?.toDate
                      ? n.createdAt
                          .toDate()
                          .toLocaleDateString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                      : "Agora"}
                  </span>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] font-bold text-vitta-accent hover:underline"
                    >
                      Marcar Lida
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const HeroCarousel = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "hero_banners"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBanners(
          (data.items || []).sort((a: any, b: any) => a.order - b.order),
        );
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[200px] md:h-[300px] lg:h-[400px] rounded-3xl overflow-hidden shadow-xl group">
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={banners[currentIndex].imageUrl}
            alt={banners[currentIndex].title || "Banner"}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-10">
            {banners[currentIndex].title && (
              <h2 className="text-white text-2xl md:text-4xl font-bold mb-2">
                {banners[currentIndex].title}
              </h2>
            )}
            {banners[currentIndex].link && (
              <a
                href={banners[currentIndex].link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-6 py-2 bg-vitta-accent text-white font-bold rounded-xl hover:bg-vitta-accent/90 transition-colors w-max"
              >
                Saber mais
              </a>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${
                idx === currentIndex
                  ? "bg-vitta-accent scale-125"
                  : "bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const AddMedicationModal = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [times, setTimes] = useState(["08:00"]);
  const [category, setCategory] = useState("Geral");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;

    setLoading(true);
    try {
      const data = {
        userId: user.uid,
        name,
        dosage,
        times,
        category,
        isActive: true,
        startDate: new Date().toISOString(),
      };

      if (!navigator.onLine) {
        enqueueOfflineAction("CREATE_MED", data);
        addToast(
          "Você está offline. Medicamento salvo localmente e será enviado ao reconectar.",
          "info",
        );
        onClose();
        return;
      }

      await addDoc(collection(db, "medications"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      addToast("Medicamento cadastrado com sucesso!", "success");
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "medications");
      addToast("Erro ao cadastrar medicamento.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl p-8 border border-vitta-border shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-vitta-text-primary">
            Registrar Medicamento
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleAddMedication} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none"
              placeholder="Ex: Amoxicilina"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Dosagem
            </label>
            <input
              type="text"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none"
              placeholder="Ex: 500mg"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none appearance-none"
            >
              <option value="Geral">Geral</option>
              <option value="Antibiótico">Antibiótico</option>
              <option value="Vitaminas">Vitaminas</option>
              <option value="Controle Especial">Controle Especial</option>
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
                Horários
              </label>
              <button
                type="button"
                onClick={() => setTimes([...times, ""])}
                className="text-xs font-bold text-vitta-accent"
              >
                + Adicionar
              </button>
            </div>
            {times.map((time, idx) => (
              <input
                key={idx}
                type="time"
                value={time}
                onChange={(e) => {
                  const newTimes = [...times];
                  newTimes[idx] = e.target.value;
                  setTimes(newTimes);
                }}
                className="w-full p-4 mb-2 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none"
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold mt-4 disabled:opacity-50 transition-all"
          >
            {loading ? "Cadastrando..." : "Salvar Medicamento"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AddGoalModal = ({
  user,
  onClose,
}: {
  user: any;
  onClose: () => void;
}) => {
  const [type, setType] = useState<"steps" | "weight" | "water" | "sleep">(
    "steps",
  );
  const [target, setTarget] = useState(0);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (target <= 0) return;

    setLoading(true);
    try {
      const data = {
        userId: user.uid,
        type,
        targetValue: target,
        currentValue: 0,
        unit:
          type === "steps"
            ? "passos"
            : type === "weight"
              ? "kg"
              : type === "water"
                ? "ml"
                : "horas",
        deadline,
        status: "active",
      };

      if (!navigator.onLine) {
        enqueueOfflineAction("CREATE_GOAL", data);
        addToast(
          "Você está offline. Meta cadastrada localmente e será enviada ao reconectar.",
          "info",
        );
        onClose();
        return;
      }

      await addDoc(collection(db, "health_goals"), {
        ...data,
        createdAt: serverTimestamp(),
      });
      addToast("Meta definida com sucesso!", "success");
      onClose();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.CREATE, "health_goals");
      addToast("Erro ao definir meta.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl p-8 border border-vitta-border shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-vitta-text-primary">
            Definir Nova Meta
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleAddGoal} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Tipo de Meta
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none appearance-none"
            >
              <option value="steps">Passos Diários</option>
              <option value="water">Ingestão de Água (ml)</option>
              <option value="weight">Meta de Peso (kg)</option>
              <option value="sleep">Horas de Sono</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Valor Alvo
            </label>
            <input
              type="number"
              value={target || ""}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none"
              placeholder="Ex: 10000"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
              Data Limite (Opcional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full p-4 rounded-xl bg-vitta-surface-2 border border-vitta-border focus:border-vitta-accent outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full p-4 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold mt-4 disabled:opacity-50 transition-all shadow-lg shadow-vitta-accent/20"
          >
            {loading ? "Salvando..." : "Ativar Meta"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const PatientDashboardView = ({
  user,
  userData,
  setActiveTab,
  setActiveTelemedicineApt,
}: {
  user: any;
  userData: any;
  setActiveTab: (tab: string) => void;
  setActiveTelemedicineApt?: (apt: any) => void;
}) => {
  const { addToast } = useToast();
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isMetricsModalOpen, setIsMetricsModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch Health Metrics History
    const metricsQuery = query(
      collection(db, "health_metrics"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(14),
    );

    const unsubscribeMetrics = onSnapshot(
      metricsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMetricsHistory([...data].reverse());
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "health_metrics");
      },
    );

    // 2. Fetch Upcoming Appointments
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      where("status", "==", "upcoming"),
      orderBy("date", "asc"),
      limit(3),
    );

    const unsubscribeAppointments = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUpcomingAppointments(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
      },
    );

    // 3. Fetch Recent Exams
    const examsQuery = query(
      collection(db, "user_exams"),
      where("userId", "==", user.uid),
      where("status", "==", "ready"),
    );

    const unsubscribeExams = onSnapshot(
      examsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort by updatedAt desc and limit to 2 on client side safely
        data.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.seconds || 0;
          const timeB = b.updatedAt?.seconds || 0;
          return timeB - timeA;
        });
        setRecentExams(data.slice(0, 2));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "user_exams");
      },
    );

    // 4. Fetch Wallet Balance
    const unsubscribeWallet = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setWalletBalance(docSnap.data().walletBalance || 0);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      },
    );

    // 5. Fetch Medications
    const medQuery = query(
      collection(db, "medications"),
      where("userId", "==", user.uid),
      where("isActive", "==", true),
    );
    const unsubscribeMeds = onSnapshot(medQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Medication[];
      setMedications(data);
    });

    // 6. Fetch Goals
    const goalsQuery = query(
      collection(db, "health_goals"),
      where("userId", "==", user.uid),
      where("status", "==", "active"),
    );
    const unsubscribeGoals = onSnapshot(goalsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HealthGoal[];
      setGoals(data);
    });

    // 7. Fetch Economies for total savings
    let unsubscribeSavings = () => {};
    if (user?.uid) {
      unsubscribeSavings = onSnapshot(
        query(collection(db, "economies"), where("userId", "==", user.uid)),
        (snapshot) => {
          const savings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          const total = savings.reduce((acc: number, curr: any) => acc + (parseFloat(curr.savedAmount) || 0), 0);
          setTotalSaved(total);
        },
        (error) => {
          console.error("Error fetching economies for dashboard", error);
        }
      );
    }

    return () => {
      unsubscribeMetrics();
      unsubscribeAppointments();
      unsubscribeExams();
      unsubscribeWallet();
      unsubscribeMeds();
      unsubscribeGoals();
      unsubscribeSavings();
    };
  }, [user]);

  const handleTakeMedication = async (med: any) => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      await updateDoc(doc(db, "medications", med.id), {
        lastTakenAt: Timestamp.now(),
        lastTakenTime: timeStr,
        takenCount: (med.takenCount || 0) + 1,
        updatedAt: Timestamp.now(),
      });
      addToast(`Dose de ${med.name} registrada às ${timeStr}!`, "success");
    } catch (err) {
      console.error("Error taking med:", err);
      addToast("Erro ao registrar dose.", "error");
    }
  };

  const handleArchiveMedication = async (med: any) => {
    try {
      await updateDoc(doc(db, "medications", med.id), {
        isActive: false,
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      addToast(`Medicamento ${med.name} concluído/arquivado.`, "info");
    } catch (err) {
      console.error("Error archiving med:", err);
      addToast("Erro ao arquivar medicamento.", "error");
    }
  };

  const handleUpdateGoal = async (goal: any, incrementVal: number) => {
    try {
      const newCurrent = Math.max(0, (goal.currentValue || 0) + incrementVal);
      const isCompleted = newCurrent >= goal.targetValue;
      await updateDoc(doc(db, "health_goals", goal.id), {
        currentValue: newCurrent,
        ...(isCompleted ? { status: "completed", completedAt: Timestamp.now() } : {}),
        updatedAt: Timestamp.now(),
      });
      if (isCompleted) {
        addToast(`Parabéns! Você concluiu sua meta de ${goal.title || goal.type}!`, "success");
      } else {
        addToast(`Meta atualizada (+ ${incrementVal} ${goal.unit || ""})`, "success");
      }
    } catch (err) {
      console.error("Error updating goal:", err);
      addToast("Erro ao atualizar meta.", "error");
    }
  };

  const handleCompleteGoal = async (goal: any) => {
    try {
      await updateDoc(doc(db, "health_goals", goal.id), {
        status: "completed",
        currentValue: goal.targetValue,
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      addToast(`Meta ${goal.title || goal.type} concluída com sucesso!`, "success");
    } catch (err) {
      console.error("Error completing goal:", err);
      addToast("Erro ao concluir meta.", "error");
    }
  };

  const latestMetric =
    metricsHistory.length > 0
      ? metricsHistory[metricsHistory.length - 1]
      : null;

  // Calculate dynamic changes
  const calculateChange = (current: any[], previous: any[], key: string) => {
    if (previous.length === 0) return 0;
    const currentAvg =
      current.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) /
      (current.length || 1);
    const previousAvg =
      previous.reduce((acc, curr) => acc + (Number(curr[key]) || 0), 0) /
      (previous.length || 1);
    if (previousAvg === 0) return currentAvg > 0 ? 100 : 0;
    return Math.round(((currentAvg - previousAvg) / previousAvg) * 100);
  };

  // metricsHistory is reversed (asc), so the last 7 are the current week
  const currentWeek = metricsHistory.slice(-7);
  const previousWeek = metricsHistory.slice(
    0,
    Math.max(0, metricsHistory.length - 7),
  );

  const metrics = {
    steps: latestMetric?.steps || userData?.healthMetrics?.steps || 0,
    heartRate:
      latestMetric?.heartRate || userData?.healthMetrics?.heartRate || 0,
    waterIntake:
      latestMetric?.waterIntake || userData?.healthMetrics?.waterIntake || 0,
    sleepHours:
      latestMetric?.sleepHours || userData?.healthMetrics?.sleepHours || 0,
    weight: latestMetric?.weight || userData?.healthMetrics?.weight || 0,
    bloodPressure:
      latestMetric?.bloodPressure ||
      userData?.healthMetrics?.bloodPressure ||
      "--/--",
    glucose: latestMetric?.glucose || userData?.healthMetrics?.glucose || 0,
  };

  const stats = [
    {
      label: "Passos",
      value: metrics.steps.toLocaleString(),
      icon: Footprints,
      color: "emerald",
      change: calculateChange(currentWeek, previousWeek, "steps"),
    },
    {
      label: "Sono",
      value: `${metrics.sleepHours}h`,
      icon: Moon,
      color: "indigo",
      change: calculateChange(currentWeek, previousWeek, "sleepHours"),
    },
    {
      label: "Peso",
      value: `${metrics.weight}kg`,
      icon: Scale,
      color: "amber",
      change: calculateChange(currentWeek, previousWeek, "weight"),
    },
    {
      label: "Pressão",
      value: metrics.bloodPressure,
      icon: Activity,
      color: "rose",
    },
    {
      label: "Glicose",
      value: `${metrics.glucose}mg/dL`,
      icon: Thermometer,
      color: "blue",
      change: calculateChange(currentWeek, previousWeek, "glucose"),
    },
    {
      label: "Hidratação",
      value: `${metrics.waterIntake}ml`,
      icon: Droplets,
      color: "blue",
      change: calculateChange(currentWeek, previousWeek, "waterIntake"),
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-vitta-text-primary">
            Olá, {userData?.name?.split(" ")[0] || "Usuário"}!
          </h1>
          <p className="text-vitta-text-secondary">
            Como está o seu bem-estar hoje?
          </p>
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
              <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Status Geral
              </p>
              <p className="text-sm font-bold text-vitta-text-primary">
                Excelente
              </p>
            </div>
          </div>
        </div>
      </header>

      <HeroCarousel />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("professionals")}
          className="flex items-center gap-4 p-4 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:border-vitta-accent transition-colors text-left"
        >
          <div className="w-12 h-12 bg-vitta-accent-bg rounded-xl flex items-center justify-center text-vitta-accent">
            <Calendar size={24} />
          </div>
          <div>
            <p className="font-bold text-vitta-text-primary">
              Agendar Consulta
            </p>
            <p className="text-xs text-vitta-text-secondary">
              Encontre profissionais
            </p>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("voucher")}
          className="flex items-center gap-4 p-4 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:border-vitta-green transition-colors text-left"
        >
          <div className="w-12 h-12 bg-vitta-green-bg rounded-xl flex items-center justify-center text-vitta-green">
            <Ticket size={24} />
          </div>
          <div>
            <p className="font-bold text-vitta-text-primary">Comprar Voucher</p>
            <p className="text-xs text-vitta-text-secondary">
              Benefícios exclusivos
            </p>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("exams")}
          className="flex items-center gap-4 p-4 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:border-vitta-blue transition-colors text-left"
        >
          <div className="w-12 h-12 bg-vitta-blue-bg rounded-xl flex items-center justify-center text-vitta-blue">
            <FileText size={24} />
          </div>
          <div>
            <p className="font-bold text-vitta-text-primary">Meus Exames</p>
            <p className="text-xs text-vitta-text-secondary">
              Resultados e laudos
            </p>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("offers")}
          className="flex items-center gap-4 p-4 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:border-vitta-accent transition-colors text-left"
        >
          <div className="w-12 h-12 bg-vitta-accent/10 rounded-xl flex items-center justify-center text-vitta-accent">
            <Tag size={24} />
          </div>
          <div>
            <p className="font-bold text-vitta-text-primary">Ver Ofertas</p>
            <p className="text-xs text-vitta-text-secondary">
              Descontos Farmácia
            </p>
          </div>
        </button>
      </div>

      {/* Economia Conquistada no Sistema ViTTA */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-emerald-500/10 via-vitta-accent/5 to-vitta-purple/10 border border-vitta-green/20 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm"
      >
        <div className="flex items-start md:items-center gap-5">
          <div className="w-14 h-14 bg-vitta-green text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-vitta-green/20">
            <TrendingUp size={28} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-vitta-green uppercase">Economia Conquistada</span>
            <h2 className="text-3xl font-black text-vitta-text-primary mt-1 font-mono">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalSaved)}
            </h2>
            <p className="text-xs text-vitta-text-secondary mt-1">
              Sua economia total acumulada utilizando cupons, convênios e agendamentos no ecossistema ViTTA.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5 w-full md:w-auto shrink-0">
          <button
            onClick={() => setActiveTab("plans")}
            className="flex-1 md:flex-none px-5 py-3 bg-vitta-green text-white text-xs font-black rounded-xl hover:bg-vitta-green/90 transition-all shadow-md shadow-vitta-green/15 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck size={16} /> Ver Rede Credenciada
          </button>
          <button
            onClick={() => setActiveTab("offers")}
            className="flex-1 md:flex-none px-5 py-3 bg-white border border-vitta-border text-vitta-text-primary text-xs font-black rounded-xl hover:bg-vitta-surface transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Tag size={16} /> Ver Ofertas & Parcerias
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-vitta-green/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-24 h-24 bg-vitta-accent/5 rounded-full blur-xl pointer-events-none" />
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {stats.map((stat, idx) => (
          <StatCard key={idx} stat={stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  Evolução de Passos
                </h3>
                <p className="text-sm text-vitta-text-secondary">
                  Seu desempenho nos últimos 7 dias
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-vitta-accent rounded-full"></span>
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Passos
                </span>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={
                    metricsHistory.length > 0
                      ? metricsHistory
                      : [
                          { date: "Seg", steps: 4000 },
                          { date: "Ter", steps: 3000 },
                          { date: "Qua", steps: 2000 },
                          { date: "Qui", steps: 2780 },
                          { date: "Sex", steps: 1890 },
                          { date: "Sáb", steps: 2390 },
                          { date: "Dom", steps: 3490 },
                        ]
                  }
                >
                  <defs>
                    <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "16px",
                      border: "none",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
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
                <div>
                  <h3 className="text-lg font-bold text-vitta-text-primary">
                    Próximas Consultas
                  </h3>
                  <button
                    onClick={() => setActiveTab("appointments")}
                    className="text-[11px] font-bold text-vitta-accent hover:underline flex items-center gap-1 mt-0.5 cursor-pointer"
                  >
                    Ver todas as consultas <ChevronRight size={12} />
                  </button>
                </div>
                <Calendar size={20} className="text-vitta-accent" />
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border hover:border-vitta-accent/40 transition-colors"
                    >
                      <img
                        src={
                          apt.imageUrl ||
                          "https://picsum.photos/seed/prof/100/100"
                        }
                        alt={apt.professionalName}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-vitta-text-primary truncate">
                          {apt.professionalName}
                        </p>
                        <p className="text-xs text-vitta-text-secondary truncate">
                          {apt.specialty}
                        </p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <div>
                          <p className="text-xs font-bold text-vitta-accent">
                            {formatDateForDisplay(apt.date, {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                          <p className="text-[10px] text-vitta-text-muted">
                            {apt.time}
                          </p>
                        </div>
                        {(apt.type === "telemedicine" || apt.isTelemedicine || apt.roomType === "telemedicine") && setActiveTelemedicineApt && (
                          <button
                            onClick={() => setActiveTelemedicineApt(apt)}
                            className="px-2 py-0.5 bg-vitta-green/10 text-vitta-green hover:bg-vitta-green hover:text-white rounded-lg text-[10px] font-bold transition-all border border-vitta-green/20 flex items-center gap-1 cursor-pointer"
                          >
                            <Video size={10} /> Entrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-sm text-vitta-text-secondary">
                      Nenhuma consulta agendada.
                    </p>
                    <button
                      onClick={() => setActiveTab("professionals")}
                      className="text-xs font-bold text-vitta-accent hover:underline cursor-pointer"
                    >
                      Agendar uma consulta agora
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  Exames Recentes
                </h3>
                <FileText size={20} className="text-vitta-green" />
              </div>
              <div className="space-y-4">
                {recentExams.length > 0 ? (
                  recentExams.map((exam) => (
                    <div
                      key={exam.id}
                      className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border"
                    >
                      <div className="w-10 h-10 bg-vitta-green-bg rounded-xl flex items-center justify-center text-vitta-green">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-vitta-text-primary truncate">
                          {exam.name}
                        </p>
                        <p className="text-xs text-vitta-text-secondary truncate">
                          {exam.lab || "Laboratório ViTTA"}
                        </p>
                      </div>
                      <button className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all">
                        <Download size={18} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-vitta-text-secondary text-center py-4">
                    Nenhum exame pronto.
                  </p>
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
              <Wallet size={180} />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <h3 className="text-2xl font-bold">Sua Carteira</h3>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(walletBalance)}
              </p>
              <button
                onClick={() => setActiveTab("wallets")}
                className="px-6 py-2 bg-white text-vitta-accent rounded-xl text-sm font-bold hover:bg-vitta-surface transition-colors"
              >
                Ver Carteira
              </button>
            </div>
          </div>

          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-vitta-text-primary">
                Minhas Metas
              </h3>
              <button
                onClick={() => setIsGoalModalOpen(true)}
                className="text-xs font-bold text-vitta-accent hover:underline"
              >
                + Nova Meta
              </button>
            </div>
            <div className="space-y-6">
              {goals.length > 0 ? (
                goals.map((goal) => {
                  const currentVal =
                    goal.type === "steps"
                      ? metrics.steps
                      : goal.type === "water"
                        ? metrics.waterIntake
                        : goal.type === "sleep"
                          ? metrics.sleepHours
                          : goal.type === "weight"
                            ? metrics.weight
                            : 0;
                  const progress = Math.min(
                    (currentVal / goal.targetValue) * 100,
                    100,
                  );

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-vitta-text-secondary capitalize">
                          {goal.type === "steps"
                            ? "Passos"
                            : goal.type === "water"
                              ? "Água"
                              : goal.type === "sleep"
                                ? "Sono"
                                : "Peso"}
                        </span>
                        <span className="font-bold text-vitta-text-primary">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="h-2 bg-vitta-surface-2 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full ${
                            goal.type === "steps"
                              ? "bg-vitta-green"
                              : goal.type === "water"
                                ? "bg-vitta-accent"
                                : goal.type === "sleep"
                                  ? "bg-vitta-purple"
                                  : "bg-amber-500"
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[10px] text-vitta-text-muted font-medium">
                          {currentVal} / {goal.targetValue} {goal.unit}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateGoal(goal, goal.type === "steps" ? 500 : goal.type === "water" ? 250 : 1)}
                            className="px-2 py-0.5 bg-vitta-surface-2 hover:bg-vitta-accent/10 hover:text-vitta-accent text-vitta-text-secondary rounded text-[10px] font-bold border border-vitta-border transition-colors"
                            title="Adicionar progresso"
                          >
                            +{goal.type === "steps" ? "500" : goal.type === "water" ? "250ml" : "1"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCompleteGoal(goal)}
                            className="p-1 hover:bg-emerald-50 text-vitta-text-muted hover:text-emerald-600 rounded transition-colors"
                            title="Concluir Meta"
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-vitta-text-secondary mb-2">
                    Sem metas ativas.
                  </p>
                  <button
                    onClick={() => setIsGoalModalOpen(true)}
                    className="text-xs font-bold text-vitta-accent"
                  >
                    Começar agora
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-vitta-text-primary">
                Medicamentos
              </h3>
              <button
                onClick={() => setIsMedicationModalOpen(true)}
                className="text-xs font-bold text-vitta-accent hover:underline"
              >
                + Registrar
              </button>
            </div>
            <div className="space-y-4">
              {medications.length > 0 ? (
                medications.map((med) => (
                  <div
                    key={med.id}
                    className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border"
                  >
                    <div className="w-10 h-10 bg-vitta-accent/10 rounded-xl flex items-center justify-center text-vitta-accent">
                      <Pill size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-vitta-text-primary truncate">
                        {med.name}
                      </p>
                      <p className="text-[10px] text-vitta-text-secondary uppercase tracking-wider">
                        {med.dosage} • {med.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-vitta-accent">
                          {med.times[0]}
                        </p>
                        <p className="text-[9px] text-vitta-text-muted">
                          {med.lastTakenTime ? `Tomado às ${med.lastTakenTime}` : "Próxima"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTakeMedication(med)}
                          className="p-2 bg-vitta-accent/10 hover:bg-vitta-accent hover:text-white text-vitta-accent rounded-xl transition-all"
                          title="Registrar dose tomada"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleArchiveMedication(med)}
                          className="p-2 hover:bg-red-50 text-vitta-text-muted hover:text-red-500 rounded-xl transition-all"
                          title="Concluir/Arquivar medicamento"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-vitta-text-secondary text-center py-4">
                  Nenhum medicamento registrado.
                </p>
              )}
            </div>
          </div>

          <div className="bg-vitta-surface-2 p-6 rounded-3xl border-2 border-dashed border-vitta-border group hover:border-vitta-accent transition-colors">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-vitta-surface rounded-2xl shadow-sm">
                <Smartphone size={24} className="text-vitta-text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-vitta-text-primary">
                  Integrar Saúde
                </h4>
                <p className="text-xs text-vitta-text-secondary">
                  Conecte seus dispositivos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="px-3 py-1 bg-vitta-green/10 text-vitta-green text-[10px] font-bold rounded-full">
                Google Fit
              </div>
              <div className="px-3 py-1 bg-vitta-blue/10 text-vitta-blue text-[10px] font-bold rounded-full">
                Apple Health
              </div>
            </div>
            <button
              onClick={() =>
                addToast(
                  "Funcionalidade de integração em desenvolvimento!",
                  "info",
                )
              }
              className="w-full py-3 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-bold hover:bg-vitta-accent hover:text-white hover:border-vitta-accent transition-all"
            >
              Configurar Sincronização
            </button>
          </div>

          <NotificationFeed user={user} />
          {isMedicationModalOpen && (
            <AddMedicationModal
              user={user}
              onClose={() => setIsMedicationModalOpen(false)}
            />
          )}
          {isGoalModalOpen && (
            <AddGoalModal
              user={user}
              onClose={() => setIsGoalModalOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const HomeView = ({
  user,
  userData,
  setActiveTab,
  setPartnershipSubTab,
}: {
  user: any;
  userData: any;
  setActiveTab: (tab: string) => void;
  setPartnershipSubTab?: (subTab: any) => void;
}) => {
  const resources = [
    {
      id: "professionals",
      title: "Profissionais de Saúde",
      description:
        "Encontre especialistas experientes, consulte avaliações reais e agende consultas presenciais ou online por telemedicina.",
      icon: Users,
      badge: "Telemedicina",
      color: "accent",
    },
    {
      id: "appointments",
      title: "Meus Agendamentos",
      description:
        "Gerencie suas consultas marcadas, acesse salas virtuais de atendimento e confira o histórico detalhado.",
      icon: Clock,
      badge: "Consultas",
      color: "purple",
    },
    {
      id: "exams",
      title: "Meus Exames",
      description:
        "Monitore seus exames laboratoriais e de imagem, com visualização de laudos digitais rápidos e práticos.",
      icon: ClipboardList,
      badge: "Laudos",
      color: "emerald",
    },
    {
      id: "plans",
      title: "Plano de Benefícios",
      description:
        "Conheça seu plano de saúde ViTTA, coberturas completas e a ampla rede de parceiros credenciados na sua região.",
      icon: ShieldCheck,
      badge: "Parcerias",
      color: "accent",
    },
    {
      id: "wallets",
      title: "Carteira Digital",
      description:
        "Controle seu saldo de moedas ViTTA Coins, realize recargas com segurança e verifique extratos de forma transparente.",
      icon: Wallet,
      badge: "Financeiro",
      color: "amber",
    },
    {
      id: "voucher",
      title: "Compra de Vouchers",
      description:
        "Adquira pacotes e vouchers promocionais exclusivos com descontos imperdíveis para exames e consultas médicas.",
      icon: CreditCard,
      badge: "Descontos",
      color: "purple",
    },
    {
      id: "pharmacies",
      title: "Farmácias de Plantão",
      description:
        "Localize instantaneamente farmácias em regime de plantão hoje na sua cidade, com telefones e rotas de localização.",
      icon: Stethoscope,
      badge: "Plantão 24h",
      color: "emerald",
    },
    {
      id: "radio",
      title: "Rádio ViTTA FM",
      description:
        "Fique sintonizado com excelente seleção musical, podcasts inovadores de saúde e informações de bem-estar ao vivo.",
      icon: Radio,
      badge: "Sintonize",
      color: "amber",
    },
    {
      id: "offers",
      title: "Clube de Ofertas",
      description:
        "Desfrute de ofertas exclusivas e cupons de marcas líderes do mercado em bem-estar, cosméticos e nutrição.",
      icon: Tag,
      badge: "Parceiros",
      color: "accent",
    },
    {
      id: "dashboard",
      title: "Métricas & Saúde",
      description:
        "Acompanhe dados vitais de bioimpedância, pressão, controle de medicamentos recorrentes e cumprimento de metas.",
      icon: Activity,
      badge: "Painel Vital",
      color: "emerald",
    },
    {
      id: "chat",
      title: "Chat Suporte",
      description:
        "Fale diretamente com nossa equipe especializada para solucionar dúvidas cadastrais e pedir assistência médica.",
      icon: MessageSquare,
      badge: "Online",
      color: "purple",
    },
    {
      id: "profile",
      title: "Perfil & Segurança",
      description:
        "Edite suas fotos de perfil, altere senhas, cadastre dados adicionais e ative verificação em dois fatores (2FA).",
      icon: User,
      badge: "Configurações",
      color: "amber",
    },
  ];

  const colorStyles: Record<
    string,
    { bg: string; text: string; border: string; hover: string }
  > = {
    accent: {
      bg: "bg-vitta-accent-bg dark:bg-vitta-accent/10",
      text: "text-vitta-accent",
      border: "hover:border-vitta-accent/50",
      hover: "group-hover:bg-vitta-accent group-hover:text-white",
    },
    purple: {
      bg: "bg-vitta-purple-bg dark:bg-vitta-purple/10",
      text: "text-vitta-purple",
      border: "hover:border-vitta-purple/50",
      hover: "group-hover:bg-vitta-purple group-hover:text-white",
    },
    emerald: {
      bg: "bg-vitta-green-bg dark:bg-vitta-green/10",
      text: "text-vitta-green",
      border: "hover:border-vitta-green/50",
      hover: "group-hover:bg-vitta-green group-hover:text-white",
    },
    amber: {
      bg: "bg-vitta-amber-bg dark:bg-vitta-amber/10",
      text: "text-vitta-amber",
      border: "hover:border-vitta-amber/50",
      hover: "group-hover:bg-vitta-amber group-hover:text-white",
    },
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-vitta-accent to-vitta-purple p-8 md:p-12 text-white shadow-xl shadow-vitta-accent/15 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold tracking-wider uppercase">
            <Sparkles
              size={12}
              className="text-vitta-amber animate-spin"
              style={{ animationDuration: "3s" }}
            />{" "}
            Portal de Recursos ViTTA
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            Olá,{" "}
            <span className="text-white bg-gradient-to-r from-white to-vitta-amber-bg bg-clip-text text-transparent">
              {user?.displayName?.split(" ")[0] || "Bem-vindo"}
            </span>
            ! 🌟
          </h1>
          <p className="text-white/80 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            Sua saúde e bem-estar integrados em um ecossistema completo e
            inteligente. Explore recursos avançados, consulte médicos
            experientes, gerencie vouchers e acompanhe suas metas diárias.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <button
              id="home-cta-schedule"
              onClick={() => {
                if (userData?.role === "professional") {
                  setActiveTab("dashboard");
                } else {
                  setActiveTab("professionals");
                }
              }}
              className="px-5 py-3 bg-white text-vitta-accent font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-200 active:scale-95"
            >
              {userData?.role === "professional" ? "Painel Médico" : "Agendar Nova Consulta"}
            </button>
            <button
              id="home-cta-plans"
              onClick={() => {
                if (setPartnershipSubTab) setPartnershipSubTab("establishments");
                setActiveTab("plans");
              }}
              className="px-5 py-3 bg-white/15 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl backdrop-blur-sm hover:scale-102 transition-all duration-200"
            >
              Convênios
            </button>
            <button
              id="home-cta-vitta-health"
              onClick={() => {
                if (setPartnershipSubTab) setPartnershipSubTab("vitta-health");
                setActiveTab("plans");
              }}
              className="px-5 py-3 bg-white/15 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl backdrop-blur-sm hover:scale-102 transition-all duration-200"
            >
              ViTTA Health
            </button>
            <button
              id="home-cta-radio"
              onClick={() => setActiveTab("radio")}
              className="px-5 py-3 bg-white/15 hover:bg-white/20 text-white border border-white/20 font-bold text-sm rounded-xl backdrop-blur-sm hover:scale-102 transition-all duration-200"
            >
              Ouvir Rádio ViTTA
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Navigation Cards */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary tracking-tight">
            Recursos & Benefícios Exclusivos
          </h2>
          <p className="text-xs text-vitta-text-secondary mt-0.5">
            Clique em um dos cartões abaixo para navegar de forma rápida e
            intuitiva pela plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {resources.map((resource) => {
            const IconComp = resource.icon;
            const style = colorStyles[resource.color];
            return (
              <motion.div
                key={resource.id}
                id={`home-resource-card-${resource.id}`}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setActiveTab(resource.id)}
                className={`group bg-vitta-surface p-6 rounded-2xl border border-vitta-border ${style.border} shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between h-[230px]`}
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div
                      className={`p-3 rounded-xl ${style.bg} ${style.text} transition-colors duration-300`}
                    >
                      <IconComp size={22} />
                    </div>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${style.bg} ${style.text}`}
                    >
                      {resource.badge}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-vitta-text-primary group-hover:text-vitta-accent transition-colors text-sm md:text-base leading-snug">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-vitta-text-secondary line-clamp-3 leading-relaxed">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-vitta-accent group-hover:translate-x-1 transition-transform self-start mt-2">
                  <span>Acessar</span>
                  <ChevronRight size={14} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 mx-2 my-0.5 ${
      active
        ? "bg-vitta-nav-active-bg text-vitta-nav-active font-medium"
        : "text-vitta-text-secondary hover:text-vitta-text-primary"
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </button>
);

const StatCard = ({ stat }: any) => {
  const Icon =
    typeof stat.icon === "string"
      ? ({
          Footprints,
          Moon,
          Heart,
          Droplets,
        }[stat.icon] as any)
      : stat.icon;

  const colors: Record<string, string> = {
    emerald: "bg-vitta-green-bg text-vitta-green",
    indigo: "bg-vitta-purple-bg text-vitta-purple",
    rose: "bg-vitta-accent-bg text-vitta-accent",
    blue: "bg-vitta-accent-bg text-vitta-accent",
    purple: "bg-vitta-purple-bg text-vitta-purple",
    amber: "bg-vitta-amber-bg text-vitta-amber",
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
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              stat.change > 0
                ? "bg-vitta-green-bg text-vitta-green"
                : "bg-vitta-danger/10 text-vitta-danger"
            }`}
          >
            {stat.change > 0 ? "+" : ""}
            {stat.change}%
          </span>
        )}
      </div>
      <div>
        <p className="text-vitta-text-muted text-[10px] font-bold uppercase tracking-widest mb-1">
          {stat.label}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-vitta-text-primary">
            {stat.value}
          </span>
          <span className="text-vitta-text-secondary text-xs">{stat.unit}</span>
        </div>
      </div>
    </motion.div>
  );
};

const AdminFinancialView = ({ adminUser }: { adminUser: any }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [users, setUsers] = useState<{ [key: string]: string }>({});
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState<"history" | "payouts">("history");
  const { addToast } = useToast();

  useEffect(() => {
    // Escutar por transações (apenas as mais recentes)
    const qTransactions = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      limit(100),
    );
    const unsubscribeTransactions = onSnapshot(
      qTransactions,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(data);
        setLoadingTransactions(false);

        // Montar dicionário de usuários envolvidos nas transações se não houver caching robusto
        const userIds = [...new Set(data.map((t: any) => t.userId))].filter(
          Boolean,
        ) as string[];
        userIds.forEach((uid) => {
          if (!users[uid]) {
            getDocFromCache(doc(db, "users", uid))
              .then((docSnap) => {
                if (docSnap.exists()) {
                  setUsers((prev) => ({
                    ...prev,
                    [uid]:
                      docSnap.data().name ||
                      docSnap.data().email ||
                      "Usuário Desconhecido",
                  }));
                } else {
                  getDocFromServer(doc(db, "users", uid))
                    .then((docSnap) => {
                      if (docSnap.exists()) {
                        setUsers((prev) => ({
                          ...prev,
                          [uid]:
                            docSnap.data().name ||
                            docSnap.data().email ||
                            "Usuário Desconhecido",
                        }));
                      }
                    })
                    .catch((err) =>
                      console.error("Error fetching user data", err),
                    );
                }
              })
              .catch((err) => console.error("Error fetching user cache", err));
          }
        });
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "transactions");
      },
    );

    return () => unsubscribeTransactions();
  }, []);

  const handleApprovePayout = async (tx: any) => {
    try {
      await updateDoc(doc(db, "transactions", tx.id), {
        status: "completed",
        handledBy: adminUser.uid,
        handledAt: new Date().toISOString(),
      });
      addToast("Saque marcado como finalizado.", "success");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `transactions/${tx.id}`);
      addToast("Erro ao aprovar saque.", "error");
    }
  };

  const handleRejectPayout = async (tx: any) => {
    try {
      const userRef = doc(db, "users", tx.userId);
      await updateDoc(userRef, {
        walletBalance: increment(tx.amount),
      });
      await updateDoc(doc(db, "transactions", tx.id), {
        status: "rejected",
        handledBy: adminUser.uid,
        handledAt: new Date().toISOString(),
      });
      await addDoc(collection(db, "transactions"), {
        userId: tx.userId,
        type: "refund",
        amount: tx.amount,
        description: `Estorno de Saque Recusado`,
        date: new Date().toISOString(),
        status: "completed",
      });
      addToast("Saque recusado e valor estornado.", "success");
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `transactions/${tx.id}`);
      addToast("Erro ao recusar saque.", "error");
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (tab === "payouts") {
      return t.type === "withdraw_request";
    }
    const userName = users[t.userId]?.toLowerCase() || "";
    const desc = t.description?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return userName.includes(term) || desc.includes(term);
  });

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, curr) => {
        if (
          curr.type === "credit" ||
          curr.type === "admin_adjustment" ||
          curr.type === "refund"
        ) {
          if (curr.amount > 0) acc.credited += curr.amount;
          else acc.debited += Math.abs(curr.amount || 0);
        } else {
          if (curr.type !== "withdraw_request" || curr.status === "completed") {
            acc.debited += curr.amount || 0;
          }
        }
        return acc;
      },
      { credited: 0, debited: 0 },
    );
  }, [transactions]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-vitta-text-primary">
            Gestão Financeira
          </h2>
          <p className="text-sm text-vitta-text-secondary">
            Visão global e ajustes de fundos em contas de pacientes.
          </p>
        </div>
        <button
          onClick={() => setIsAdjustModalOpen(true)}
          className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-vitta-accent/90 transition-colors shadow-md shadow-vitta-accent/20"
        >
          <DollarSign size={16} />
          <span>Ajustar Saldo Manualmente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-vitta-surface p-6 rounded-2xl border border-vitta-border flex items-center gap-4">
          <div className="w-12 h-12 bg-vitta-green/10 text-vitta-green rounded-xl flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-vitta-text-muted tracking-wider">
              Total Creditado
            </p>
            <p className="text-2xl font-bold text-vitta-text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.credited)}
            </p>
          </div>
        </div>
        <div className="bg-vitta-surface p-6 rounded-2xl border border-vitta-border flex items-center gap-4">
          <div className="w-12 h-12 bg-vitta-danger/10 text-vitta-danger rounded-xl flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-vitta-text-muted tracking-wider">
              Total Debitado
            </p>
            <p className="text-2xl font-bold text-vitta-text-primary">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totals.debited)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-vitta-surface rounded-2xl border border-vitta-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-vitta-border bg-vitta-surface-2 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("history")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "history" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              📊 Histórico
            </button>
            <button
              onClick={() => setTab("payouts")}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === "payouts" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              💸 Saques (Payouts)
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por usuário ou desc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs focus:ring-2 focus:ring-vitta-accent/20 outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {loadingTransactions ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center text-vitta-text-secondary">
              Nenhuma transação encontrada.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-vitta-surface-3 text-vitta-text-muted uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-4">Data</th>
                  <th className="p-4">Usuário</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4 text-right">Valor</th>
                  {tab === "payouts" && (
                    <th className="p-4 text-center">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-vitta-border bg-vitta-surface">
                {filteredTransactions.map((rx) => {
                  const isPositive =
                    rx.type === "credit" ||
                    rx.type === "admin_adjustment" ||
                    rx.type === "refund";
                  return (
                    <tr
                      key={rx.id}
                      className="hover:bg-vitta-surface-2 transition-colors group"
                    >
                      <td className="p-4 whitespace-nowrap text-vitta-text-secondary">
                        {new Date(rx.date).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="p-4 font-medium text-vitta-text-primary">
                        {users[rx.userId] || "Carregando..."}
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-vitta-text-primary">
                          {rx.description || "Transação"}
                        </div>
                        {rx.type === "admin_adjustment" && (
                          <div className="text-xs text-vitta-accent mt-0.5">
                            Ajuste Manual do Administrador
                          </div>
                        )}
                        {rx.type === "withdraw_request" && (
                          <div className="text-xs mt-1">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold ${
                                rx.status === "completed"
                                  ? "bg-vitta-green/10 text-vitta-green"
                                  : rx.status === "rejected"
                                    ? "bg-vitta-danger/10 text-vitta-danger"
                                    : "bg-vitta-amber/10 text-vitta-amber"
                              }`}
                            >
                              Status:{" "}
                              {rx.status === "completed"
                                ? "Aprovado"
                                : rx.status === "rejected"
                                  ? "Recusado"
                                  : "Pendente"}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${isPositive ? "text-vitta-green" : "text-vitta-danger"}`}
                        >
                          {isPositive ? "+" : "-"}
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(rx.amount)}
                        </span>
                      </td>
                      {tab === "payouts" && (
                        <td className="p-4 text-center">
                          {rx.status === "pending" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleApprovePayout(rx)}
                                className="p-1 px-3 bg-vitta-green/10 text-vitta-green rounded-lg text-xs font-bold hover:bg-vitta-green hover:text-white transition-colors"
                              >
                                Aprovar (Pago)
                              </button>
                              <button
                                onClick={() => handleRejectPayout(rx)}
                                className="p-1 px-3 bg-vitta-danger/10 text-vitta-danger rounded-lg text-xs font-bold hover:bg-vitta-danger hover:text-white transition-colors"
                              >
                                Recusar (Estorno)
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAdjustModalOpen && (
        <AdminAdjustBalanceModal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          adminUser={adminUser}
        />
      )}
    </div>
  );
};

const AdminAdjustBalanceModal = ({
  isOpen,
  onClose,
  adminUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  adminUser: any;
}) => {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"credit" | "debit">(
    "credit",
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      getDocs(query(collection(db, "users"), orderBy("name", "asc")))
        .then((snapshot) => {
          const usr = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((u: any) => u.role !== "admin");
          setUsersList(usr);
        })
        .catch((err) => console.error("Erro ao carregar usuários:", err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      addToast("Selecione um paciente", "error");
      return;
    }
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      addToast("Insira um valor numérico válido", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const modifier =
        adjustmentType === "credit" ? numericAmount : -numericAmount;

      const userRef = doc(db, "users", selectedUserId);
      await updateDoc(userRef, {
        walletBalance: increment(modifier),
      });

      const transactionRef = doc(collection(db, "transactions"));
      await setDoc(transactionRef, {
        userId: selectedUserId,
        type: "admin_adjustment",
        amount: numericAmount,
        description:
          description ||
          `Ajuste manual de saldo (${adjustmentType === "credit" ? "Adição" : "Remoção"})`,
        date: new Date().toISOString(),
        status: "completed",
        handledBy: adminUser.uid,
      });

      addToast("Saldo ajustado com sucesso", "success");
      onClose();
    } catch (error) {
      console.error(error);
      addToast("Houve um erro no processamento do ajuste", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-vitta-surface w-full max-w-md rounded-2xl border border-vitta-border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 whitespace-nowrap">
          <h2 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
            <DollarSign size={20} className="text-vitta-accent" /> Ajuste Manual
            de Saldo
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-vitta-text-secondary hover:bg-vitta-surface-3 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div>
            <label className="block text-sm font-bold text-vitta-text-primary mb-2">
              Paciente Destino
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vitta-accent text-vitta-text-primary appearance-none"
              required
            >
              <option value="" disabled>
                Selecione o paciente
              </option>
              {usersList.map((user: any) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-vitta-text-primary mb-2">
              Tipo de Ajuste
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType("credit")}
                className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${adjustmentType === "credit" ? "bg-vitta-green-bg border-vitta-green text-vitta-green" : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"}`}
              >
                <Plus size={16} /> Crédito
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType("debit")}
                className={`py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-colors ${adjustmentType === "debit" ? "bg-vitta-danger/10 border-vitta-danger text-vitta-danger" : "border-vitta-border bg-vitta-surface-2 text-vitta-text-secondary"}`}
              >
                <Trash2 size={16} /> Débito
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-vitta-text-primary mb-2">
              Valor do Ajuste (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vitta-accent text-vitta-text-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-vitta-text-primary mb-2">
              Motivo / Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a razão (ex: Estorno da consulta cancelada)"
              className="w-full bg-vitta-surface-2 border border-vitta-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vitta-accent text-vitta-text-primary min-h-[80px]"
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-primary rounded-xl text-sm font-bold border border-vitta-border hover:bg-vitta-surface-3 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 bg-vitta-accent text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/20 transition-colors disabled:opacity-50"
            >
              {isProcessing ? "Processando..." : "Aplicar Ajuste"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDeletionRequestsView = () => {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("deletionRequested", "==", true),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRequests(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      },
    );
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      // In a real app, we'd also delete from Auth using a cloud function
      await deleteDoc(doc(db, "users", id));
      await logAdminAction(
        "PERMANENT_DELETE_USER",
        `Excluiu permanentemente o usuário ID: ${id} (Solicitação LGPD)`,
      );
      addToast("Usuário excluído permanentemente do sistema.", "success");
      setConfirmModal(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-vitta-text-primary">
            Pedidos de Exclusão (LGPD)
          </h2>
          <p className="text-sm text-vitta-text-secondary">
            Usuários que solicitaram a remoção definitiva de seus dados.
          </p>
        </div>
      </div>

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-20 text-center">
            <ShieldCheck
              size={48}
              className="mx-auto text-vitta-green mb-4 opacity-20"
            />
            <p className="text-vitta-text-secondary font-medium">
              Nenhuma solicitação de exclusão pendente.
            </p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-vitta-surface-2 border-b border-vitta-border">
                <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Usuário
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  E-mail
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Plano
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {requests.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-vitta-surface-2 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-vitta-danger/10 text-vitta-danger rounded-full flex items-center justify-center font-bold text-xs">
                        {user.name?.charAt(0)}
                      </div>
                      <span className="font-bold text-sm text-vitta-text-primary">
                        {user.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                    {user.plan}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        setConfirmModal({
                          isOpen: true,
                          userId: user.id,
                          userName: user.name,
                        })
                      }
                      className="px-4 py-2 bg-vitta-danger text-white rounded-lg text-xs font-bold hover:bg-vitta-danger/90 transition-colors flex items-center gap-2 ml-auto"
                    >
                      <Trash2 size={14} />
                      Excluir Definitivamente
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-vitta-text-primary/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-2xl shadow-2xl border border-vitta-border p-8 text-center space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-16 h-16 bg-vitta-danger/10 text-vitta-danger rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  Confirmar Exclusão Definitiva
                </h3>
                <p className="text-sm text-vitta-text-secondary leading-relaxed">
                  Você está prestes a excluir permanentemente todos os dados do
                  usuário <strong>{confirmModal.userName}</strong>. Esta ação
                  cumpre o requisito de exclusão da LGPD e não pode ser
                  desfeita.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 border border-vitta-border rounded-xl font-bold text-vitta-text-secondary hover:bg-vitta-surface-2 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmModal.userId)}
                  className="flex-1 py-3 bg-vitta-danger text-white rounded-xl font-bold shadow-lg shadow-vitta-danger/20 hover:bg-vitta-danger/90 transition-all"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ClinicalRecordModal = ({
  isOpen,
  onClose,
  appointment,
  professional,
}: any) => {
  const [clinicalNotes, setClinicalNotes] = useState(
    appointment.clinicalNotes || "",
  );
  const [anamnesis, setAnamnesis] = useState(appointment.anamnesis || "");
  const [prescriptions, setPrescriptions] = useState<any[]>(
    appointment.prescriptions || [],
  );
  const [patientHistory, setPatientHistory] = useState<any[]>([]);
  const [modalTab, setModalTab] = useState<"clinical" | "certificate" | "history">("clinical");
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const [hasCertificate, setHasCertificate] = useState(
    appointment.hasCertificate || false,
  );
  const [certificateDays, setCertificateDays] = useState(
    appointment.certificateDays || "1",
  );
  const [certificateCid, setCertificateCid] = useState(
    appointment.certificateCid || "",
  );
  const [certificateReason, setCertificateReason] = useState(
    appointment.certificateReason || "",
  );
  const [certificateStartDate, setCertificateStartDate] = useState(
    appointment.certificateStartDate || appointment.date || new Date().toISOString().split("T")[0],
  );
  const [certificateType, setCertificateType] = useState<"repouso" | "comparecimento" | "aptidao">(
    appointment.certificateType || "repouso",
  );
  const [certificateCidConsent, setCertificateCidConsent] = useState(
    appointment.certificateCidConsent !== undefined ? appointment.certificateCidConsent : true,
  );
  const [certificateStartTime, setCertificateStartTime] = useState(
    appointment.certificateStartTime || appointment.time || "09:00",
  );
  const [certificateEndTime, setCertificateEndTime] = useState(
    appointment.certificateEndTime || "",
  );
  const [certificatePatientDocument, setCertificatePatientDocument] = useState(
    appointment.certificatePatientDocument || appointment.patientCpf || "",
  );

  useEffect(() => {
    if (!appointment.userId) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", appointment.userId),
          where("status", "==", "completed"),
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((a: any) => a.id !== appointment.id);
        data.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setPatientHistory(data);
      } catch (e) {
        console.error("Failed to load patient history", e);
      }
    };
    fetchHistory();
  }, [appointment.userId, appointment.id]);

  const handleAddPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      { medicine: "", dosage: "", instructions: "" },
    ]);
  };

  const handleRemovePrescription = (index: number) => {
    const next = [...prescriptions];
    next.splice(index, 1);
    setPrescriptions(next);
  };

  const handleUpdatePrescription = (
    index: number,
    field: string,
    value: string,
  ) => {
    const next = [...prescriptions];
    next[index] = { ...next[index], [field]: value };
    setPrescriptions(next);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        clinicalNotes,
        anamnesis,
        prescriptions,
        hasCertificate,
        certificateDays,
        certificateCid,
        certificateReason,
        certificateStartDate,
        certificateType,
        certificateCidConsent,
        certificateStartTime,
        certificateEndTime,
        certificatePatientDocument,
        updatedAt: Timestamp.now(),
      });
      addToast("Registro clínico salvo com sucesso.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar registro.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Vitta Blue
    doc.text("ViTTA - Prescrição Digital", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 105, 28, {
      align: "center",
    });

    doc.setDrawColor(200);
    doc.line(20, 35, pageWidth - 20, 35);

    // Patient & Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(appointment.patientName || "Não informado", 45, 50);

    doc.setFont("helvetica", "bold");
    doc.text("Médico:", 20, 58);
    doc.setFont("helvetica", "normal");
    doc.text(professional.name, 45, 58);
    doc.text(
      `${professional.specialty} - ${professional.registrationNumber || ""}`,
      45,
      64,
    );

    doc.line(20, 75, pageWidth - 20, 75);

    // Prescriptions
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Receituário", 105, 90, { align: "center" });

    let y = 105;
    prescriptions.forEach((p, i) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${p.medicine}`, 25, y);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Dosagem: ${p.dosage}`, 30, y + 6);
      doc.text(`Orientações: ${p.instructions}`, 30, y + 12);

      y += 25;
    });

    // Footer - Simple signature area
    const footerY = 270;
    doc.line(60, footerY, 150, footerY);
    doc.setFontSize(9);
    doc.text("Assinatura Dr(a). " + professional.name, 105, footerY + 5, {
      align: "center",
    });

    doc.save(
      `receita_${appointment.patientName.replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
    addToast("PDF gerado com sucesso.", "success");
  };

  const generateCertificatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Vitta Blue
    doc.text("ViTTA - Atestado Médico", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Emissão: ${new Date().toLocaleDateString("pt-BR")}`, 105, 33, {
      align: "center",
    });

    doc.setDrawColor(200);
    doc.line(20, 40, pageWidth - 20, 40);

    // Patient & Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, 52);
    doc.setFont("helvetica", "normal");
    doc.text(appointment.patientName || "Não informado", 45, 52);

    if (certificatePatientDocument.trim()) {
      doc.setFont("helvetica", "bold");
      doc.text("CPF/Doc:", 20, 58);
      doc.setFont("helvetica", "normal");
      doc.text(certificatePatientDocument.trim(), 45, 58);
    }

    doc.setFont("helvetica", "bold");
    doc.text("Médico:", 20, 66);
    doc.setFont("helvetica", "normal");
    doc.text(professional.name, 45, 66);
    doc.text(
      `${professional.specialty} - ${professional.registrationNumber || ""}`,
      45,
      72,
    );

    doc.line(20, 80, pageWidth - 20, 80);

    // Atestado Content
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 150, 243);
    
    let title = "ATESTADO MÉDICO";
    if (certificateType === "comparecimento") {
      title = "ATESTADO DE COMPARECIMENTO";
    } else if (certificateType === "aptidao") {
      title = "ATESTADO DE APTIDÃO FÍSICA";
    }
    doc.text(title, 105, 100, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    const formattedStartDate = certificateStartDate 
      ? new Date(certificateStartDate + "T00:00:00").toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR");

    const docText = certificatePatientDocument.trim() ? `, inscrito(a) sob o CPF/Documento nº ${certificatePatientDocument.trim()},` : "";

    let textContent = "";
    if (certificateType === "repouso") {
      textContent = `Atesto para os devidos fins de direito que o(a) paciente ${appointment.patientName}${docText} foi atendido(a) sob meus cuidados profissionais no dia de hoje e necessita de ${certificateDays} dia(s) de repouso para recuperação de sua saúde, a partir da data de ${formattedStartDate}.`;
    } else if (certificateType === "comparecimento") {
      const startT = certificateStartTime.trim() || appointment.time || "09:00";
      const periodText = certificateEndTime.trim()
        ? `no período das ${startT} às ${certificateEndTime.trim()} horas`
        : `às ${startT} horas`;
      textContent = `Atesto para os devidos fins de comparecimento que o(a) paciente ${appointment.patientName}${docText} esteve em consulta médica sob meus cuidados profissionais no dia de hoje, ${periodText}.`;
    } else if (certificateType === "aptidao") {
      textContent = `Atesto para os devidos fins que o(a) paciente ${appointment.patientName}${docText} foi submetido(a) a exame físico clínico e de anamnese no dia de hoje, encontrando-se em perfeitas condições de saúde física e mental, estando APTO(A) para a realização de atividades físicas, laborais, práticas esportivas ou concursos, não apresentando contraindicações no momento.`;
    }

    if (certificateReason.trim()) {
      textContent += `\n\nMotivo/Observação complementar: ${certificateReason}`;
    }

    if (certificateCid.trim() && certificateCidConsent) {
      textContent += `\n\nCID-10 informado (com autorização expressa do paciente): ${certificateCid}`;
    }

    // Wrap text for pdf
    const splitText = doc.splitTextToSize(textContent, pageWidth - 40);
    doc.text(splitText, 20, 115);

    // Footer - Simple signature area
    const footerY = 220;
    doc.setDrawColor(200);
    doc.line(60, footerY, 150, footerY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Dr(a). " + professional.name, 105, footerY + 6, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${professional.specialty} - ${professional.registrationNumber || ""}`, 105, footerY + 12, {
      align: "center",
    });

    doc.save(
      `atestado_${appointment.patientName.replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
    addToast("Atestado Médico PDF gerado com sucesso.", "success");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-4xl rounded-2xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vitta-accent-bg rounded-xl text-vitta-accent">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Registro Clínico
              </h3>
              <p className="text-xs text-vitta-text-secondary">
                Paciente: {appointment.patientName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generatePDF}
              className="px-4 py-2 bg-vitta-surface border border-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all flex items-center gap-2"
              disabled={prescriptions.length === 0}
            >
              <Download size={14} />
              Exportar Receita
            </button>
            {hasCertificate && (
              <button
                onClick={generateCertificatePDF}
                className="px-4 py-2 bg-vitta-accent-bg text-vitta-accent border border-vitta-accent/20 rounded-xl text-xs font-bold hover:bg-vitta-accent hover:text-white transition-all flex items-center gap-2"
              >
                <Download size={14} />
                Exportar Atestado
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
            >
              <X size={20} className="text-vitta-text-muted" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-vitta-border bg-vitta-surface shrink-0 px-6 pt-4 gap-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setModalTab("clinical")}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${modalTab === "clinical" ? "border-vitta-accent text-vitta-accent" : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"}`}
          >
            📋 Anamnese e Receita
          </button>
          <button
            onClick={() => setModalTab("certificate")}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${modalTab === "certificate" ? "border-vitta-accent text-vitta-accent" : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"}`}
          >
            📄 Atestado Médico
          </button>
          <button
            onClick={() => setModalTab("history")}
            className={`pb-4 text-sm font-bold transition-all border-b-2 ${modalTab === "history" ? "border-vitta-accent text-vitta-accent" : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"}`}
          >
            🕰️ Histórico do Paciente
          </button>
        </div>

        <div className="p-6 overflow-y-auto no-scrollbar flex-1 bg-vitta-surface-2">
          {modalTab === "clinical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-vitta-text-primary flex items-center gap-2 uppercase tracking-widest">
                    <FileText size={16} className="text-vitta-accent" />
                    Anamnese / Histórico Atual
                  </h4>
                  <textarea
                    value={anamnesis}
                    onChange={(e) => setAnamnesis(e.target.value)}
                    placeholder="Descreva a queixa principal, histórico da moléstia atual, histórico familiar..."
                    className="w-full h-[150px] p-4 bg-vitta-surface border border-vitta-border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-vitta-accent/20 transition-all resize-none shadow-sm"
                    disabled={appointment.status === "completed"}
                  />
                </div>
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-vitta-text-primary flex items-center gap-2 uppercase tracking-widest">
                    <Stethoscope size={16} className="text-vitta-accent" />
                    Evolução Clínica
                  </h4>
                  <textarea
                    value={clinicalNotes}
                    onChange={(e) => setClinicalNotes(e.target.value)}
                    placeholder="Descreva o quadro clínico, exame físico e evolução..."
                    className="w-full h-[150px] p-4 bg-vitta-surface border border-vitta-border rounded-2xl text-sm outline-none focus:ring-2 focus:ring-vitta-accent/20 transition-all resize-none shadow-sm"
                    disabled={appointment.status === "completed"}
                  />
                </div>
              </div>

              <div className="space-y-4 bg-vitta-surface p-6 rounded-2xl border border-vitta-border shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-vitta-text-primary flex items-center gap-2 uppercase tracking-widest">
                    <Pill size={16} className="text-vitta-accent" />
                    Prescrição
                  </h4>
                  {appointment.status !== "completed" && (
                    <button
                      onClick={handleAddPrescription}
                      className="text-xs font-bold text-vitta-accent hover:bg-vitta-accent-bg px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <Plus size={14} />
                      Adicionar
                    </button>
                  )}
                </div>

                <div className="space-y-3 pb-4">
                  {prescriptions.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-vitta-surface-2 border border-vitta-border rounded-xl space-y-3 relative group animate-in slide-in-from-right-4"
                    >
                      {appointment.status !== "completed" && (
                        <button
                          onClick={() => handleRemovePrescription(idx)}
                          className="absolute top-2 right-2 p-1.5 text-vitta-text-muted hover:text-vitta-danger transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Medicamento"
                          value={p.medicine}
                          onChange={(e) =>
                            handleUpdatePrescription(
                              idx,
                              "medicine",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs font-bold text-vitta-text-primary focus:ring-1 focus:ring-vitta-accent transition-all"
                          disabled={appointment.status === "completed"}
                        />
                        <input
                          type="text"
                          placeholder="Dosagem (ex: 500mg, 1 comprimido)"
                          value={p.dosage}
                          onChange={(e) =>
                            handleUpdatePrescription(
                              idx,
                              "dosage",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs text-vitta-text-secondary focus:ring-1 focus:ring-vitta-accent transition-all"
                          disabled={appointment.status === "completed"}
                        />
                        <textarea
                          placeholder="Instruções de uso..."
                          value={p.instructions}
                          onChange={(e) =>
                            handleUpdatePrescription(
                              idx,
                              "instructions",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs text-vitta-text-secondary focus:ring-1 focus:ring-vitta-accent transition-all h-16 resize-none"
                          disabled={appointment.status === "completed"}
                        />
                      </div>
                    </div>
                  ))}
                  {prescriptions.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-vitta-border rounded-2xl bg-vitta-surface-2">
                      <Pill
                        size={32}
                        className="mx-auto text-vitta-text-muted mb-2 opacity-50"
                      />
                      <p className="text-xs text-vitta-text-muted italic">
                        Nenhuma prescrição adicionada.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {modalTab === "certificate" && (
            <div className="space-y-6 max-w-2xl mx-auto bg-vitta-surface p-6 rounded-2xl border border-vitta-border shadow-sm">
              <div className="flex items-center justify-between border-b border-vitta-border pb-4">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-vitta-accent" />
                  <div>
                    <h4 className="font-bold text-vitta-text-primary text-sm md:text-base">
                      Atestado Médico
                    </h4>
                    <p className="text-xs text-vitta-text-secondary">
                      Gere atestados médicos de repouso ou comparecimento
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={hasCertificate}
                    onChange={(e) => setHasCertificate(e.target.checked)}
                    className="sr-only peer"
                    disabled={appointment.status === "completed"}
                  />
                  <div className="w-11 h-6 bg-vitta-surface-3 rounded-full peer peer-focus:ring-2 peer-focus:ring-vitta-accent/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-vitta-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-vitta-accent"></div>
                  <span className="ml-2 text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                    {hasCertificate ? "Ativado" : "Desativado"}
                  </span>
                </label>
              </div>

              {hasCertificate ? (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  {/* Patient Document Field */}
                  <div className="space-y-1.5 bg-vitta-surface-2 p-4 rounded-xl border border-vitta-border">
                    <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider flex items-center gap-1">
                      👤 CPF ou Documento de Identificação do Paciente
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 123.456.789-00 ou RG 12.345.678-9"
                      value={certificatePatientDocument}
                      onChange={(e) => setCertificatePatientDocument(e.target.value)}
                      className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                      disabled={appointment.status === "completed"}
                    />
                    <p className="text-[10px] text-vitta-text-muted">
                      Se informado, o documento constará formalmente no corpo e no cabeçalho do atestado.
                    </p>
                  </div>

                  {/* Certificate Type Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                      Tipo de Atestado
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => setCertificateType("repouso")}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          certificateType === "repouso"
                            ? "bg-vitta-accent/10 border-vitta-accent text-vitta-accent"
                            : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                        }`}
                        disabled={appointment.status === "completed"}
                      >
                        <span className="font-bold text-xs md:text-sm">🏡 Repouso</span>
                        <span className="text-[10px] opacity-80">Recomenda dias de afastamento laboral/atividades</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificateType("comparecimento")}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          certificateType === "comparecimento"
                            ? "bg-vitta-accent/10 border-vitta-accent text-vitta-accent"
                            : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                        }`}
                        disabled={appointment.status === "completed"}
                      >
                        <span className="font-bold text-xs md:text-sm">🏥 Comparecimento</span>
                        <span className="text-[10px] opacity-80">Comprova presença em consulta médica</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCertificateType("aptidao")}
                        className={`p-4 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          certificateType === "aptidao"
                            ? "bg-vitta-accent/10 border-vitta-accent text-vitta-accent"
                            : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                        }`}
                        disabled={appointment.status === "completed"}
                      >
                        <span className="font-bold text-xs md:text-sm">💪 Aptidão Física</span>
                        <span className="text-[10px] opacity-80">Atesta condições para atividade física/prática esportiva</span>
                      </button>
                    </div>
                  </div>

                  {certificateType === "repouso" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                          Quantidade de Dias
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={certificateDays}
                          onChange={(e) => setCertificateDays(e.target.value)}
                          className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                          disabled={appointment.status === "completed"}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                          A partir de (Data)
                        </label>
                        <input
                          type="date"
                          value={certificateStartDate}
                          onChange={(e) => setCertificateStartDate(e.target.value)}
                          className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                          disabled={appointment.status === "completed"}
                        />
                      </div>
                    </div>
                  )}

                  {certificateType === "comparecimento" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                          Horário de Início
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 14:00"
                          value={certificateStartTime}
                          onChange={(e) => setCertificateStartTime(e.target.value)}
                          className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                          disabled={appointment.status === "completed"}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                          Horário de Término (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 15:30"
                          value={certificateEndTime}
                          onChange={(e) => setCertificateEndTime(e.target.value)}
                          className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                          disabled={appointment.status === "completed"}
                        />
                      </div>
                    </div>
                  )}

                  {/* CID and Consent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                        CID-10 (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: J11, M54.5"
                        value={certificateCid}
                        onChange={(e) => setCertificateCid(e.target.value)}
                        className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15 uppercase placeholder-vitta-text-muted"
                        disabled={appointment.status === "completed"}
                      />
                    </div>
                    {certificateCid.trim() && (
                      <div className="sm:pt-8 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cidConsent"
                          checked={certificateCidConsent}
                          onChange={(e) => setCertificateCidConsent(e.target.checked)}
                          className="rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent"
                          disabled={appointment.status === "completed"}
                        />
                        <label htmlFor="cidConsent" className="text-xs text-vitta-text-secondary font-medium cursor-pointer">
                          Paciente autoriza inclusão do CID no atestado
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Reason / Observation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-vitta-text-secondary uppercase tracking-wider">
                      Observações / Justificativa (Opcional)
                    </label>
                    <textarea
                      value={certificateReason}
                      onChange={(e) => setCertificateReason(e.target.value)}
                      placeholder="Alguma observação complementar ou motivo do atestado..."
                      className="w-full h-[100px] p-4 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-vitta-accent/20 transition-all resize-none shadow-sm"
                      disabled={appointment.status === "completed"}
                    />
                  </div>

                  {/* Immediate Download Button */}
                  <div className="pt-4 border-t border-vitta-border/40 flex justify-end">
                    <button
                      type="button"
                      onClick={generateCertificatePDF}
                      className="px-4 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/15 transition-all flex items-center gap-2"
                    >
                      <Download size={14} />
                      Exportar Atestado (PDF)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center border-2 border-dashed border-vitta-border rounded-2xl bg-vitta-surface-2 space-y-3">
                  <FileText className="mx-auto text-vitta-text-muted opacity-40" size={44} />
                  <p className="text-sm font-medium text-vitta-text-secondary">
                    Nenhum atestado médico ativado para esta consulta.
                  </p>
                  <p className="text-xs text-vitta-text-muted">
                    Ative o atestado usando a chave acima para preencher os dados de afastamento ou comparecimento.
                  </p>
                </div>
              )}
            </div>
          )}

          {modalTab === "history" && (
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-vitta-text-primary mb-4">
                Consultas Anteriores
              </h3>
              {patientHistory.length === 0 ? (
                <div className="bg-vitta-surface p-12 text-center rounded-2xl border border-vitta-border">
                  <Calendar
                    size={48}
                    className="mx-auto text-vitta-text-muted mb-4 opacity-50"
                  />
                  <p className="text-vitta-text-secondary">
                    Nenhum histórico encontrado para este paciente.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {patientHistory.map((hist, i) => (
                    <div
                      key={i}
                      className="bg-vitta-surface border border-vitta-border rounded-2xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-vitta-border pb-4 mb-4">
                        <div>
                          <p className="text-xs font-bold text-vitta-accent mb-1">
                            {hist.date} às {hist.time}
                          </p>
                          <p className="font-bold text-vitta-text-primary flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-vitta-surface-2 flex items-center justify-center text-xs">
                              {hist.professionalName?.charAt(0)}
                            </span>
                            Dr(a). {hist.professionalName}
                          </p>
                        </div>
                        <span className="text-xs bg-vitta-green-bg text-vitta-green px-3 py-1 rounded-full font-bold">
                          Concluído
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {hist.anamnesis && (
                          <div>
                            <h5 className="text-[10px] font-bold tracking-widest text-vitta-text-muted uppercase mb-2">
                              Anamnese
                            </h5>
                            <p className="text-sm text-vitta-text-secondary bg-vitta-surface-2 p-3 rounded-xl border border-vitta-border">
                              {hist.anamnesis}
                            </p>
                          </div>
                        )}
                        {hist.clinicalNotes && (
                          <div>
                            <h5 className="text-[10px] font-bold tracking-widest text-vitta-text-muted uppercase mb-2">
                              Evolução
                            </h5>
                            <p className="text-sm text-vitta-text-secondary bg-vitta-surface-2 p-3 rounded-xl border border-vitta-border">
                              {hist.clinicalNotes}
                            </p>
                          </div>
                        )}
                        {hist.hasCertificate && (
                          <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-vitta-border/30">
                            <h5 className="text-[10px] font-bold tracking-widest text-vitta-text-muted uppercase mb-2 flex items-center gap-1">
                              <FileText size={12} className="text-vitta-accent" />
                              Atestado Médico ({hist.certificateType === "repouso" ? "Repouso" : "Comparecimento"})
                            </h5>
                            <div className="text-xs text-vitta-text-secondary bg-vitta-surface-2 p-3 rounded-xl border border-vitta-border space-y-1">
                              <p>
                                <strong>Período/Modo:</strong> {hist.certificateType === "repouso" ? `${hist.certificateDays} dia(s) a partir de ${hist.certificateStartDate ? new Date(hist.certificateStartDate + "T00:00:00").toLocaleDateString("pt-BR") : ""}` : "Horário da consulta"}
                              </p>
                              {hist.certificateCid && hist.certificateCidConsent && (
                                <p><strong>CID-10:</strong> {hist.certificateCid}</p>
                              )}
                              {hist.certificateReason && (
                                <p><strong>Observações:</strong> {hist.certificateReason}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-vitta-border bg-vitta-surface flex justify-between shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-vitta-surface text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Salvar Atendimento
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfessionalManualBookingModal = ({
  isOpen,
  onClose,
  professional,
  user,
  initialUserId,
  initialPatientName,
}: {
  isOpen: boolean;
  onClose: () => void;
  professional: any;
  user: any;
  initialUserId?: string;
  initialPatientName?: string;
}) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientSource, setSelectedPatientSource] = useState<
    "registered" | "external"
  >("registered");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [externalPatientName, setExternalPatientName] = useState("");
  const [externalPatientEmail, setExternalPatientEmail] = useState("");
  const [externalPatientPhone, setExternalPatientPhone] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialUserId && initialUserId !== "external") {
        setSelectedUserId(initialUserId);
        setSelectedPatientSource("registered");
      } else if (initialPatientName) {
        setExternalPatientName(initialPatientName);
        setSelectedPatientSource("external");
      } else {
        setSelectedUserId("");
        setExternalPatientName("");
      }
    }
  }, [isOpen, initialUserId, initialPatientName]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [isTimeCustom, setIsTimeCustom] = useState(false);
  const [modality, setModality] = useState<"presencial" | "telemedicine">(
    "presencial",
  );
  const [notes, setNotes] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const { addToast } = useToast();

  // Load registered patients
  useEffect(() => {
    if (!isOpen) return;
    const fetchPatients = async () => {
      try {
        const q = query(collection(db, "users"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        // Exclude admin and professional users to prevent scheduling doctor-to-doctor consultations
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((u: any) => u.role !== "admin" && u.role !== "professional");
        setPatients(list);
      } catch (err) {
        console.error("Erro ao buscar pacientes:", err);
      }
    };
    fetchPatients();
  }, [isOpen]);

  // Fetch booked slots for the chosen professional and date
  useEffect(() => {
    if (!isOpen || !professional || !selectedDate) return;
    const fetchBooked = async () => {
      setIsLoadingSlots(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("professionalId", "==", professional.id),
          where("date", "==", selectedDate),
        );
        const snapshot = await getDocs(q);
        const booked = snapshot.docs
          .map((doc) => doc.data())
          .filter((data) => data.status !== "cancelled")
          .map((data) => data.time);
        setBookedSlots(booked);
      } catch (err) {
        console.error("Error fetching booked slots:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchBooked();
  }, [selectedDate, professional, isOpen]);

  // Generate available slots on selectedDate
  useEffect(() => {
    if (!selectedDate || !professional) return;
    let slots: string[] = [];

    const blockedDates: string[] = professional.schedule?.blockedDates || [];
    if (blockedDates.includes(selectedDate)) {
      setAvailableSlots([]);
      if (!isTimeCustom) {
        setSelectedTime("");
      }
      return;
    }

    if (professional.schedule?.weekly) {
      const dateObj = new Date(selectedDate + "T00:00:00");
      const dayNames = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayName = dayNames[dateObj.getDay()];
      const daySchedule = professional.schedule.weekly[dayName] || [];

      daySchedule.forEach((period: { start: string; end: string }) => {
        let current = new Date(`2000-01-01T${period.start}:00`);
        const stop = new Date(`2000-01-01T${period.end}:00`);
        while (current < stop) {
          slots.push(current.toTimeString().substring(0, 5));
          current = new Date(current.getTime() + 30 * 60000);
        }
      });
    } else {
      slots = [
        "08:00",
        "08:30",
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "11:30",
        "13:00",
        "13:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
      ];
    }

    setAvailableSlots(Array.from(new Set(slots)));
    if (!slots.includes(selectedTime) && !isTimeCustom) {
      setSelectedTime("");
    }
  }, [selectedDate, professional, isTimeCustom]);

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleBooking = async () => {
    let finalPatientName = "";
    let finalUserId = "";
    let finalPatientEmail = "";
    let finalPatientPhone = "";

    if (selectedPatientSource === "registered") {
      const patient = patients.find((p) => p.id === selectedUserId);
      if (!patient) {
        addToast("Por favor, selecione um paciente cadastrado.", "error");
        return;
      }
      finalPatientName = patient.name || patient.email;
      finalUserId = patient.id;
      finalPatientEmail = patient.email || "";
      finalPatientPhone = patient.phone || "";
    } else {
      if (!externalPatientName.trim()) {
        addToast("Por favor, informe o nome do paciente.", "error");
        return;
      }
      finalPatientName = externalPatientName.trim() + " (Offline)";
      finalUserId = "external";
      finalPatientEmail = externalPatientEmail.trim();
      finalPatientPhone = externalPatientPhone.trim();
    }

    if (!selectedDate) {
      addToast("Selecione uma data.", "error");
      return;
    }

    if (!selectedTime) {
      addToast("Selecione um horário.", "error");
      return;
    }

    setIsBooking(true);
    try {
      const aptRef = await addDoc(collection(db, "appointments"), {
        userId: finalUserId,
        patientName: finalPatientName,
        patientEmail: finalPatientEmail,
        patientPhone: finalPatientPhone,
        professionalId: professional.id,
        professionalName: professional.name,
        specialty: professional.specialty,
        professionalUserId: professional.userId || user?.uid || "",
        imageUrl:
          professional.imageUrl || "https://picsum.photos/seed/prof/400/300",
        date: selectedDate,
        time: selectedTime,
        status: "upcoming", // Manual booking immediately scheduled
        modality,
        notes,
        isManual: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      if (modality === "telemedicine") {
        await updateDoc(doc(db, "appointments", aptRef.id), {
          telemedicineRoomId: aptRef.id,
          telemedicineUrl: `${window.location.origin}/?room=${aptRef.id}`,
        });
      }

      // Send notification to patient if registered
      if (finalUserId !== "external") {
        await addDoc(collection(db, "notifications"), {
          userId: finalUserId,
          title: "Nova Consulta Agendada",
          message: `O Dr(a). ${professional.name} agendou uma consulta com você para o dia ${formatDateForDisplay(selectedDate)} às ${selectedTime} (${modality === "telemedicine" ? "Telemedicina" : "Presencial"}).`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      await logAdminAction(
        "CREATE_MANUAL_APPOINTMENT",
        `Profissional ${professional.name} inseriu agendamento manual para ${finalPatientName} em ${selectedDate} ${selectedTime}`,
      );

      addToast("Agendamento manual inserido com sucesso!", "success");
      onClose();
      // Reset form states
      setSelectedUserId("");
      setExternalPatientName("");
      setExternalPatientEmail("");
      setExternalPatientPhone("");
      setSelectedTime("");
      setNotes("");
      setIsTimeCustom(false);
    } catch (err) {
      console.error(err);
      addToast("Erro ao criar agendamento manual.", "error");
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
        className="bg-vitta-surface w-full max-w-xl rounded-2xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vitta-accent-bg rounded-xl text-vitta-accent">
              <PlusCircle size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Novo Agendamento Manual
              </h3>
              <p className="text-xs text-vitta-text-secondary">
                Insira uma consulta diretamente na sua agenda
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto no-scrollbar">
          {/* Patient Source Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
              Origem do Paciente
            </label>
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedPatientSource("registered")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${selectedPatientSource === "registered" ? "bg-vitta-accent/10 text-vitta-accent border-vitta-accent/30" : "bg-vitta-surface-2 border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-3"}`}
              >
                Paciente Cadastrado
              </button>
              <button
                type="button"
                onClick={() => setSelectedPatientSource("external")}
                className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${selectedPatientSource === "external" ? "bg-vitta-accent/10 text-vitta-accent border-vitta-accent/30" : "bg-vitta-surface-2 border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-3"}`}
              >
                Paciente Externo / Novo
              </button>
            </div>
          </div>

          {selectedPatientSource === "registered" ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                  Pesquisar Paciente Cadastrado
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nome ou e-mail do paciente..."
                    className="w-full pl-9 pr-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                  />
                </div>
              </div>

              <div className="border border-vitta-border rounded-xl max-h-40 overflow-y-auto p-1.5 bg-vitta-surface-2 space-y-1">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUserId(u.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex justify-between items-center transition-colors ${selectedUserId === u.id ? "bg-vitta-accent text-white font-bold" : "hover:bg-vitta-surface"}`}
                    >
                      <div>
                        <p className="font-bold">{u.name || "Sem nome"}</p>
                        <p
                          className={`text-[10px] ${selectedUserId === u.id ? "text-white/80" : "text-vitta-text-muted"}`}
                        >
                          {u.email || "Sem e-mail"}
                        </p>
                      </div>
                      {selectedUserId === u.id && <Check size={14} />}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-vitta-text-muted text-center py-4">
                    Nenhum paciente cadastrado encontrado.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-full space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={externalPatientName}
                  onChange={(e) => setExternalPatientName(e.target.value)}
                  placeholder="Nome do Paciente"
                  className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                  E-mail (Opcional)
                </label>
                <input
                  type="email"
                  value={externalPatientEmail}
                  onChange={(e) => setExternalPatientEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                  Telefone (Opcional)
                </label>
                <input
                  type="text"
                  value={externalPatientPhone}
                  onChange={(e) => setExternalPatientPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                />
              </div>
            </div>
          )}

          {/* Date and Time selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                Escolha a Data
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                  Horário
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTimeCustom}
                    onChange={(e) => {
                      setIsTimeCustom(e.target.checked);
                      setSelectedTime("");
                    }}
                    className="sr-only peer"
                  />
                  <div className="relative w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-vitta-accent"></div>
                  <span className="text-[10px] font-bold text-vitta-text-secondary">
                    Forçar horário
                  </span>
                </label>
              </div>

              {isTimeCustom ? (
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                />
              ) : (
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
                >
                  <option value="">Selecione o horário...</option>
                  {availableSlots.map((time) => {
                    const isBooked = bookedSlots.includes(time);
                    return (
                      <option key={time} value={time} disabled={isBooked}>
                        {time} {isBooked ? "(Ocupado)" : ""}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          </div>

          {/* Modality & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-full">
              <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                Modalidade de Atendimento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModality("presencial")}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${modality === "presencial" ? "bg-vitta-accent/10 text-vitta-accent border-vitta-accent/30" : "bg-vitta-surface-2 border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-3"}`}
                >
                  🏥 Presencial
                </button>
                <button
                  type="button"
                  onClick={() => setModality("telemedicine")}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${modality === "telemedicine" ? "bg-vitta-accent/10 text-vitta-accent border-vitta-accent/30" : "bg-vitta-surface-2 border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-3"}`}
                >
                  💻 Telemedicina
                </button>
              </div>
            </div>

            <div className="col-span-full space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-vitta-text-secondary block">
                Observações / Queixa Principal (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Obs: Motivo da consulta, acompanhamento, queixa principal..."
                rows={3}
                className="w-full px-4 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-sm outline-none focus:ring-1 focus:ring-vitta-accent/30"
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-vitta-border bg-vitta-surface-2 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-vitta-surface text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleBooking}
            disabled={isBooking}
            className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isBooking ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Confirmar Agendamento
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const ProfessionalFinanceView = ({ user, setActiveTab }: { user: any; setActiveTab?: (tab: string) => void }) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!user || !user.uid) return;

    setLoading(true);

    const unsubscribeWallet = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setWalletBalance(docSnap.data().walletBalance || 0);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      },
    );

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(20),
    );
    const unsubscribeTransactions = onSnapshot(
      q,
      (snapshot) => {
        setTransactions(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `transactions`);
      },
    );

    const qAll = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid)
    );
    const unsubscribeAll = onSnapshot(
      qAll,
      (snapshot) => {
        const allDocs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const cashTxs = allDocs.filter((t: any) => t.isCash === true && (t.feeCharged !== undefined || t.feeCharged > 0));
        setCashTransactions(cashTxs);
      },
      (error) => {
        console.error("Error fetching cash transactions for invoice summary:", error);
      }
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
      unsubscribeAll();
    };
  }, [user?.uid]);

  const handleRequestPayout = async () => {
    const numAmount = parseFloat(payoutAmount.replace(",", "."));
    if (!numAmount || numAmount <= 0) {
      addToast("Valor inválido.", "error");
      return;
    }
    if (numAmount > walletBalance) {
      addToast("Saldo insuficiente.", "error");
      return;
    }
    if (!pixKey.trim()) {
      addToast("Chave PIX obrigatória.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct from wallet
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        walletBalance: increment(-numAmount),
      });

      // 2. Create withdraw request
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "withdraw_request",
        amount: numAmount,
        description: `Solicitação de Saque - PIX: ${pixKey}`,
        pixKey: pixKey,
        date: new Date().toISOString(),
        status: "pending", // Admin needs to approve
      });

      addToast("Solicitação de saque enviada com sucesso.", "success");
      setIsPayoutModalOpen(false);
      setPayoutAmount("");
      setPixKey("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `transactions`);
      addToast("Erro ao solicitar saque.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

      const totalUnpaidFees = cashTransactions
        .filter((t) => t.invoicePaid !== true)
        .reduce((sum, t) => sum + (t.feeCharged || 0), 0);

      const totalPaidFees = cashTransactions
        .filter((t) => t.invoicePaid === true)
        .reduce((sum, t) => sum + (t.feeCharged || 0), 0);

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          {isPayoutModalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-300">
              <div className="bg-vitta-surface w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-vitta-border animate-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-vitta-text-primary">
                    Solicitar Saque
                  </h3>
                  <button
                    onClick={() => setIsPayoutModalOpen(false)}
                    className="text-vitta-text-muted hover:bg-vitta-surface-2 p-2 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Valor (R$)
                    </label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary"
                    />
                    <p className="text-xs text-vitta-text-secondary mt-1 ml-1">
                      Disponível: R$ {walletBalance.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      placeholder="CPF, E-mail, Telefone..."
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleRequestPayout}
                      disabled={isProcessing}
                      className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                    >
                      {isProcessing ? "Processando..." : "Confirmar Saque"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Wallet and Invoice Cards */}
            <div className="md:col-span-1 space-y-6 flex flex-col">
              {/* Card 1: Wallet Balance */}
              <div className="relative overflow-hidden bg-gradient-to-br from-vitta-accent to-vitta-accent/80 p-8 rounded-3xl shadow-xl shadow-vitta-accent/20 text-white flex-1 min-h-[180px]">
                <div className="absolute top-0 right-0 p-6 opacity-20">
                  <Wallet size={80} />
                </div>
                <div className="relative z-10 space-y-6 flex flex-col justify-between h-full">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1">
                      Saldo em Conta
                    </p>
                    <h2 className="text-4xl font-bold tracking-tight">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(walletBalance)}
                    </h2>
                  </div>

                  <button
                    onClick={() => setIsPayoutModalOpen(true)}
                    className="w-full py-3 mt-4 bg-white text-vitta-accent rounded-xl text-sm font-bold shadow-sm hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Solicitar Saque
                  </button>
                </div>
              </div>

              {/* Card 2: Invoice Summary (Resumo de Fatura de Coparticipação) */}
              <div className="bg-vitta-surface border border-vitta-border p-6 rounded-3xl shadow-sm space-y-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-vitta-text-primary uppercase tracking-wider">
                        Resumo da Fatura
                      </h4>
                      <p className="text-[10px] text-vitta-text-muted mt-0.5">
                        Consultas presenciais no consultório
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        totalUnpaidFees > 0
                          ? "bg-vitta-amber/10 text-vitta-amber border border-vitta-amber/20"
                          : "bg-vitta-green/10 text-vitta-green border border-vitta-green/20"
                      }`}
                    >
                      {totalUnpaidFees > 0 ? "Fatura em Aberto" : "Em Dia"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-vitta-border/50">
                    <div>
                      <span className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest block">
                        Fatura Aberta
                      </span>
                      <span className="text-lg font-bold text-vitta-text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(totalUnpaidFees)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest block">
                        Taxas Pagas
                      </span>
                      <span className="text-sm font-bold text-vitta-text-secondary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(totalPaidFees)}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-vitta-text-secondary leading-relaxed">
                    Atendimentos agendados como <span className="font-semibold text-vitta-text-primary">"Pago presencialmente no consultório"</span> geram faturas com o valor da Taxa Fee da plataforma sobre cada movimentação.
                  </p>
                </div>

                {setActiveTab && (
                  <button
                    onClick={() => setActiveTab("wallets")}
                    className="w-full py-2.5 bg-vitta-accent/10 hover:bg-vitta-accent/20 text-vitta-accent rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💳 Ver Detalhes na Carteira</span>
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2 bg-vitta-surface border border-vitta-border rounded-3xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-vitta-text-primary mb-6 flex items-center gap-2">
            <ArrowRightLeft className="text-vitta-text-muted" size={20} />
            Histórico Financeiro
          </h3>

          <div className="space-y-3">
            {loading ? (
              <p className="text-sm text-vitta-text-secondary">Carregando...</p>
            ) : transactions.length > 0 ? (
              transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border hover:shadow-md transition-shadow gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        t.type === "credit" ||
                        t.type === "refund" ||
                        (t.type === "admin_adjustment" && t.amount > 0)
                          ? "bg-vitta-green/10 text-vitta-green"
                          : t.type === "withdraw_request" &&
                              t.status === "completed"
                            ? "bg-vitta-green/10 text-vitta-green"
                            : t.type === "withdraw_request" &&
                                t.status === "pending"
                              ? "bg-vitta-amber/10 text-vitta-amber"
                              : "bg-vitta-danger/10 text-vitta-danger"
                      }`}
                    >
                      {t.type === "credit" ? (
                        <ArrowDownRight size={18} />
                      ) : t.type === "withdraw_request" &&
                        t.status === "completed" ? (
                        <CheckCircle2 size={18} />
                      ) : t.type === "withdraw_request" &&
                        t.status === "pending" ? (
                        <Clock size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-vitta-text-primary">
                        {t.description}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-vitta-text-secondary mt-0.5">
                        <Calendar size={12} />
                        {new Date(t.date).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}

                        {t.status === "pending" && (
                          <span className="text-vitta-amber bg-vitta-amber/10 px-2 py-0.5 rounded-full font-medium">
                            Em análise
                          </span>
                        )}
                        {t.status === "rejected" && (
                          <span className="text-vitta-danger bg-vitta-danger/10 px-2 py-0.5 rounded-full font-medium">
                            Recusado
                          </span>
                        )}
                        {t.status === "completed" && (
                          <span className="text-vitta-green bg-vitta-green/10 px-2 py-0.5 rounded-full font-medium">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p
                      className={`font-bold ${
                        t.type === "credit" ||
                        t.type === "refund" ||
                        (t.type === "admin_adjustment" && t.amount > 0)
                          ? "text-vitta-green"
                          : "text-vitta-danger"
                      }`}
                    >
                      {t.type === "credit" ||
                      t.type === "refund" ||
                      (t.type === "admin_adjustment" && t.amount > 0)
                        ? "+"
                        : "-"}{" "}
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Math.abs(t.amount))}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-vitta-text-muted bg-vitta-surface-2 rounded-2xl border border-dashed border-vitta-border">
                <Receipt className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">Nenhuma transação encontrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalAgendaSettingsView = ({ professional }: { professional: any }) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [officeLocation, setOfficeLocation] = useState(professional.officeLocation || "");
  const [isPresencialEnabled, setIsPresencialEnabled] = useState(
    professional.isPresencialEnabled !== false
  );
  const [isTelemedicineEnabled, setIsTelemedicineEnabled] = useState(
    professional.isTelemedicineEnabled !== false
  );
  const [schedule, setSchedule] = useState<{
    weekly: Record<string, Array<{ start: string; end: string }>>;
    blockedDates: string[];
  }>(
    professional.schedule || { weekly: {}, blockedDates: [] }
  );
  const [newBlockedDate, setNewBlockedDate] = useState("");

  useEffect(() => {
    if (professional) {
      setOfficeLocation(professional.officeLocation || "");
      setIsPresencialEnabled(professional.isPresencialEnabled !== false);
      setIsTelemedicineEnabled(professional.isTelemedicineEnabled !== false);
      setSchedule(professional.schedule || { weekly: {}, blockedDates: [] });
    }
  }, [professional]);

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) {
      addToast("Selecione uma data para marcar como folga global.", "warning");
      return;
    }
    const currentBlocked = schedule.blockedDates || [];
    if (currentBlocked.includes(newBlockedDate)) {
      addToast("Esta data já está bloqueada como folga global.", "warning");
      return;
    }
    const updatedBlocked = [...currentBlocked, newBlockedDate].sort();
    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
    });
    setNewBlockedDate("");
    addToast(`Data ${formatDateForDisplay(newBlockedDate)} marcada como folga global. Lembre-se de salvar as configurações.`, "info");
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    const updatedBlocked = (schedule.blockedDates || []).filter((d) => d !== dateToRemove);
    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
    });
    addToast(`Folga do dia ${formatDateForDisplay(dateToRemove)} removida.`, "info");
  };

  const handleAddSlot = (day: string) => {
    const currentDaySchedule = schedule.weekly[day] || [];
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: [...currentDaySchedule, { start: "08:00", end: "12:00" }],
      },
    });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule.splice(index, 1);
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleUpdateSlot = (
    day: string,
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule[index] = {
      ...currentDaySchedule[index],
      [field]: value,
    };
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleSaveSettings = async () => {
    if (!isPresencialEnabled && !isTelemedicineEnabled) {
      addToast("Ative ao menos um Tipo de Atendimento (Presencial ou Telemedicina).", "error");
      return;
    }
    if (isPresencialEnabled && !officeLocation.trim()) {
      addToast("Informe o Local de Atendimento para o atendimento Presencial.", "error");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "professionals", professional.id), {
        officeLocation: officeLocation.trim(),
        isPresencialEnabled,
        isTelemedicineEnabled,
        schedule,
        updatedAt: Timestamp.now(),
      });
      await logAdminAction(
        "UPDATE_PROFESSIONAL_AGENDA_SETTINGS",
        `Atualizou as configurações completas de agenda do profissional: ${professional.name}`
      );
      addToast("Configurações da agenda atualizadas com sucesso!", "success");
    } catch (err) {
      console.error("Erro ao salvar configurações da agenda:", err);
      addToast("Erro ao salvar as configurações.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const daysInfo = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };

  return (
    <div className="bg-vitta-surface border border-vitta-border rounded-2xl p-6 md:p-8 space-y-8 animate-in fade-in duration-300 shadow-sm">
      <div className="border-b border-vitta-border pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
            ⚙️ Configurações Completas da Agenda
          </h2>
          <p className="text-xs text-vitta-text-secondary mt-1">
            Configure seu local físico, modalidades e turnos de atendimento disponíveis para os pacientes.
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2.5 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm whitespace-nowrap self-end md:self-auto"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Check className="text-white" size={18} />
              Salvar Configurações
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-5">
            <h3 className="text-sm font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
              🏥 Modalidades de Atendimento
            </h3>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Escolha quais formas de consulta você deseja disponibilizar em seu perfil público da ViTTA.
            </p>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border hover:border-vitta-accent/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPresencialEnabled}
                  onChange={(e) => setIsPresencialEnabled(e.target.checked)}
                  className="mt-1 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent"
                />
                <div className="text-xs">
                  <p className="font-bold text-vitta-text-primary flex items-center gap-1.5">
                    🏥 Atendimento Presencial
                  </p>
                  <p className="text-vitta-text-muted mt-1 leading-relaxed">
                    Consultas físicas realizadas presencialmente na clínica ou endereço do consultório.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-vitta-surface rounded-xl border border-vitta-border hover:border-vitta-accent/30 transition-all cursor-pointer">
                <input
                  type="checkbox"
                  checked={isTelemedicineEnabled}
                  onChange={(e) => setIsTelemedicineEnabled(e.target.checked)}
                  className="mt-1 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent"
                />
                <div className="text-xs">
                  <p className="font-bold text-vitta-text-primary flex items-center gap-1.5">
                    💻 Telemedicina (Vídeo)
                  </p>
                  <p className="text-vitta-text-muted mt-1 leading-relaxed">
                    Consultas online por videoconferência com sala de vídeo integrada na ViTTA.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
            <h3 className="text-sm font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
              📍 Endereço do Consultório / Local
            </h3>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Insira o endereço físico ou identificador da sua sala para orientar seus pacientes presenciais.
            </p>

            <div className="space-y-2">
              <textarea
                value={officeLocation}
                onChange={(e) => setOfficeLocation(e.target.value)}
                placeholder="Ex: Av. Paulista, 1000 - Conjunto 121, Bela Vista, São Paulo - SP"
                rows={3}
                disabled={!isPresencialEnabled}
                className="w-full px-4 py-3 bg-vitta-surface border border-vitta-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30 disabled:opacity-50 disabled:bg-vitta-surface-2 disabled:cursor-not-allowed placeholder:text-vitta-text-muted transition-all text-vitta-text-primary"
              />
              {!isPresencialEnabled && (
                <p className="text-[10px] text-vitta-text-muted italic">
                  * Habilite Atendimento Presencial para definir a localização física.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-vitta-border">
              <h3 className="text-sm font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
                📅 Turnos e Horários de Atendimento Semanal
              </h3>
            </div>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Defina os turnos semanais que deseja que fiquem abertos para novos agendamentos pela plataforma.
            </p>

            <div className="space-y-4 divide-y divide-vitta-border/30 pt-2 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              {Object.entries(daysInfo).map(([key, label], index) => {
                const daySlots = schedule.weekly[key] || [];
                return (
                  <div
                    key={key}
                    className={`pt-4 ${index === 0 ? "pt-0 border-none" : ""} space-y-3`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-vitta-text-primary flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-vitta-accent/50" />
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddSlot(key)}
                        className="text-[11px] font-bold text-vitta-accent hover:underline flex items-center gap-1 bg-vitta-accent/10 px-2.5 py-1 rounded-lg"
                      >
                        <PlusCircle size={14} />
                        Adicionar Turno
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {daySlots.length > 0 ? (
                        daySlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1"
                          >
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-vitta-text-muted font-bold block mb-1 px-1">
                                  Início
                                </label>
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) =>
                                    handleUpdateSlot(
                                      key,
                                      idx,
                                      "start",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-vitta-text-muted font-bold block mb-1 px-1">
                                  Fim
                                </label>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) =>
                                    handleUpdateSlot(
                                      key,
                                      idx,
                                      "end",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(key, idx)}
                              className="p-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-lg transition-all self-end mb-[2px]"
                              title="Remover Turno"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-3 px-4 bg-vitta-surface border border-dashed border-vitta-border/80 rounded-xl text-center text-xs text-vitta-text-muted italic select-none">
                          Sem atendimentos agendados (Folga)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bloqueio de Folga Global no Calendário */}
          <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-5 md:p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-vitta-border">
              <h3 className="text-sm font-bold text-vitta-text-primary uppercase tracking-wider flex items-center gap-2">
                <CalendarX size={18} className="text-vitta-danger" />
                🏖️ Dias de Folga Global (Férias e Bloqueios)
              </h3>
              {schedule.blockedDates && schedule.blockedDates.length > 0 && (
                <span className="px-2.5 py-1 bg-vitta-danger/10 text-vitta-danger border border-vitta-danger/20 rounded-lg text-xs font-bold">
                  {schedule.blockedDates.length} {schedule.blockedDates.length === 1 ? "dia bloqueado" : "dias bloqueados"}
                </span>
              )}
            </div>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Marque datas específicas no calendário (como feriados, férias ou folgas pessoais). O sistema bloqueará automaticamente qualquer tentativa de agendamento nessas datas.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <div className="flex-1">
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-vitta-accent/20 text-vitta-text-primary"
                />
              </div>
              <button
                type="button"
                onClick={handleAddBlockedDate}
                className="px-4 py-2.5 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shrink-0 border border-vitta-danger/20 shadow-sm"
              >
                <Plus size={16} />
                Marcar Folga Global
              </button>
            </div>

            <div className="space-y-2 pt-2">
              {schedule.blockedDates && schedule.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1 no-scrollbar pt-1">
                  {schedule.blockedDates.map((blockedDate) => (
                    <div
                      key={blockedDate}
                      className="flex items-center gap-2 px-3.5 py-2 bg-vitta-surface border border-vitta-danger/30 rounded-xl text-xs font-bold text-vitta-text-primary shadow-sm group hover:border-vitta-danger transition-all"
                    >
                      <CalendarX size={15} className="text-vitta-danger shrink-0" />
                      <span>{formatDateForDisplay(blockedDate)}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-vitta-danger/10 text-vitta-danger rounded-md font-extrabold uppercase tracking-wider">
                        Folga
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedDate(blockedDate)}
                        className="ml-1 p-1 text-vitta-text-muted hover:text-vitta-danger hover:bg-vitta-danger/10 rounded-lg transition-colors"
                        title="Remover folga e desbloquear data"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 px-4 bg-vitta-surface border border-dashed border-vitta-border/80 rounded-xl text-center text-xs text-vitta-text-muted italic select-none">
                  Nenhuma data de folga global cadastrada. Utilize o seletor de data acima para bloquear.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProfessionalDashboardView = ({
  user,
  setActiveTelemedicineApt,
  overrideProfessionalId,
  setActiveTab,
}: {
  user: any;
  setActiveTelemedicineApt: (apt: any) => void;
  overrideProfessionalId?: string;
  setActiveTab?: (tab: string) => void;
}) => {
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"agenda" | "historico" | "profile" | "finance" | "settings" | "users">(
    "agenda",
  );
  const [historySearchPatient, setHistorySearchPatient] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<string>("all");
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] =
    useState(false);
  const [manualBookingInitialPatient, setManualBookingInitialPatient] = useState<{
    userId?: string;
    patientName?: string;
  } | null>(null);

  const handleOpenManualBookingForPatient = (userId?: string, patientName?: string) => {
    setManualBookingInitialPatient({ userId, patientName });
    setIsManualBookingModalOpen(true);
  };
  const { addToast } = useToast();

  const filteredHistoryAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      // 1. Filter by Patient Name
      if (historySearchPatient.trim()) {
        const patientName = (apt.patientName || "").toLowerCase();
        if (!patientName.includes(historySearchPatient.toLowerCase().trim())) {
          return false;
        }
      }

      // 2. Filter by Date range
      if (!apt.date) return false;
      const aptDate = new Date(apt.date + "T00:00:00");
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (historyDateFilter === "semana") {
        const weekAgo = new Date(todayDate);
        weekAgo.setDate(todayDate.getDate() - 7);
        if (aptDate < weekAgo) {
          return false;
        }
      } else if (historyDateFilter === "mes") {
        const startOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        if (aptDate < startOfMonth) {
          return false;
        }
      } else if (historyDateFilter === "30dias") {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - 30);
        if (aptDate < d) return false;
      } else if (historyDateFilter === "60dias") {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - 60);
        if (aptDate < d) return false;
      } else if (historyDateFilter === "90dias") {
        const d = new Date(todayDate);
        d.setDate(todayDate.getDate() - 90);
        if (aptDate < d) return false;
      } else if (historyDateFilter === "personalizado") {
        if (historyStartDate) {
          const start = new Date(historyStartDate + "T00:00:00");
          if (aptDate < start) return false;
        }
        if (historyEndDate) {
          const end = new Date(historyEndDate + "T23:59:59");
          if (aptDate > end) return false;
        }
      }

      return true;
    });
  }, [appointments, historySearchPatient, historyDateFilter, historyStartDate, historyEndDate]);

  const [chartGroupMode, setChartGroupMode] = useState<"dia" | "semana" | "mes">("dia");

  const productivityChartData = useMemo(() => {
    const sourceData = filteredHistoryAppointments;
    if (sourceData.length === 0) return [];

    const counts: Record<string, { total: number; completed: number; key: string; dateObj: Date }> = {};

    sourceData.forEach((apt) => {
      if (!apt.date) return;
      
      const dateParts = apt.date.split("-");
      if (dateParts.length !== 3) return;
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);
      const dateObj = new Date(year, month, day);

      let groupKey = "";
      let label = "";

      if (chartGroupMode === "dia") {
        groupKey = apt.date;
        label = `${String(day).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}`;
      } else if (chartGroupMode === "semana") {
        const dayOfWeek = dateObj.getDay();
        const startOfWeek = new Date(dateObj);
        startOfWeek.setDate(dateObj.getDate() - dayOfWeek);
        
        const sy = startOfWeek.getFullYear();
        const sm = startOfWeek.getMonth() + 1;
        const sd = startOfWeek.getDate();
        
        groupKey = `${sy}-${String(sm).padStart(2, "0")}-${String(sd).padStart(2, "0")}`;
        label = `Sem. ${String(sd).padStart(2, "0")}/${String(sm).padStart(2, "0")}`;
      } else {
        const monthNames = [
          "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", 
          "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];
        groupKey = `${year}-${String(month + 1).padStart(2, "0")}`;
        label = `${monthNames[month]}/${String(year).substring(2)}`;
      }

      const isCompleted = apt.status === "completed";

      if (!counts[groupKey]) {
        counts[groupKey] = {
          total: 0,
          completed: 0,
          key: label,
          dateObj,
        };
      }

      counts[groupKey].total += 1;
      if (isCompleted) {
        counts[groupKey].completed += 1;
      }
    });

    const sortedKeys = Object.keys(counts).sort();
    return sortedKeys.map((k) => ({
      name: counts[k].key,
      total: counts[k].total,
      completed: counts[k].completed,
    }));
  }, [filteredHistoryAppointments, chartGroupMode]);

  const totalChartAppointments = useMemo(() => {
    return productivityChartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [productivityChartData]);

  const completedChartAppointments = useMemo(() => {
    return productivityChartData.reduce((acc, curr) => acc + curr.completed, 0);
  }, [productivityChartData]);

  const completionRate = useMemo(() => {
    if (totalChartAppointments === 0) return 0;
    return Math.round((completedChartAppointments / totalChartAppointments) * 100);
  }, [totalChartAppointments, completedChartAppointments]);

  const sortedHistoryAppointments = useMemo(() => {
    return [...filteredHistoryAppointments].sort((a, b) => {
      const dateComp = (b.date || "").localeCompare(a.date || "");
      if (dateComp !== 0) return dateComp;
      return (b.time || "").localeCompare(a.time || "");
    });
  }, [filteredHistoryAppointments]);

  const [availableUnlinkedProfs, setAvailableUnlinkedProfs] = useState<any[]>([]);
  const [loadingUnlinked, setLoadingUnlinked] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // New profile form states
  const [newProfName, setNewProfName] = useState("Dr(a). " + (user?.displayName || ""));
  const [newProfSpecialty, setNewProfSpecialty] = useState("Clínico Geral");
  const [newProfCRM, setNewProfCRM] = useState("");
  const [newProfPrice, setNewProfPrice] = useState("150");
  const [newProfPhone, setNewProfPhone] = useState("");
  const [isLinkingInProcess, setIsLinkingInProcess] = useState(false);

  useEffect(() => {
    if (professionalProfile || overrideProfessionalId) return;
    const fetchUnlinked = async () => {
      setLoadingUnlinked(true);
      try {
        const snap = await getDocs(collection(db, "professionals"));
        const list = snap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() as any }))
          .filter(
            (p) =>
              !p.userId &&
              p.email &&
              user?.email &&
              p.email.toLowerCase().trim() === user.email.toLowerCase().trim()
          ); // only profiles not yet claimed and matching user's email
        setAvailableUnlinkedProfs(list);
      } catch (err) {
        console.error("Error fetching unlinked professionals:", err);
      } finally {
        setLoadingUnlinked(false);
      }
    };
    fetchUnlinked();
  }, [professionalProfile, user.uid, overrideProfessionalId, user.email]);

  const handleLinkProfile = async (profId: string) => {
    setIsLinkingInProcess(true);
    try {
      const docRef = doc(db, "professionals", profId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        addToast("Perfil não encontrado.", "error");
        return;
      }
      const profData = docSnap.data();
      if (profData?.userId) {
        addToast("Este perfil já está vinculado a outro usuário.", "error");
        return;
      }
      const profEmail = (profData?.email || "").toLowerCase().trim();
      const userEmail = (user?.email || "").toLowerCase().trim();
      if (!profEmail || profEmail !== userEmail) {
        addToast("Você só pode vincular um perfil que possua o mesmo e-mail de seu cadastro.", "error");
        return;
      }

      await updateDoc(docRef, {
        userId: user.uid,
        email: user.email,
        updatedAt: Timestamp.now(),
      });
      addToast("Perfil vinculado com sucesso!", "success");
    } catch (err) {
      console.error("Error linking profile:", err);
      addToast("Erro ao vincular perfil.", "error");
    } finally {
      setIsLinkingInProcess(false);
    }
  };

  const handleCreateAndLinkProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfName.trim() || !newProfCRM.trim() || !newProfSpecialty.trim()) {
      addToast("Por favor, preencha todos os campos obrigatórios.", "error");
      return;
    }
    setIsLinkingInProcess(true);
    try {
      await addDoc(collection(db, "professionals"), {
        name: newProfName,
        specialty: newProfSpecialty,
        registrationNumber: newProfCRM,
        price: parseFloat(newProfPrice) || 150,
        whatsapp: newProfPhone || "5528999881386",
        email: user.email,
        userId: user.uid,
        vittaHealthDiscount: "20%",
        availableDays: "Seg, Ter, Qua, Qui, Sex",
        rating: 5.0,
        reviews: 0,
        imageUrl: `https://picsum.photos/seed/${newProfCRM || user.uid}/400/300`,
        schedule: {
          weekly: {
            monday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
            tuesday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
            wednesday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
            thursday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
            friday: [{ start: "08:00", end: "12:00" }, { start: "14:00", end: "18:00" }],
          }
        },
        createdAt: new Date().toISOString(),
        isApproved: false,
        status: "Pendente",
      });
      addToast("Perfil profissional criado com sucesso! Aguarde a aprovação de um Usuário Admin.", "success");
    } catch (err) {
      console.error("Error creating and linking profile:", err);
      addToast("Erro ao criar perfil profissional.", "error");
    } finally {
      setIsLinkingInProcess(false);
    }
  };

  useEffect(() => {
    setProfessionalProfile(null);
    setLoading(true);
    if (overrideProfessionalId) {
      const unsubPro = onSnapshot(
        doc(db, "professionals", overrideProfessionalId),
        (snapshot) => {
          if (snapshot.exists()) {
            setProfessionalProfile({
              id: snapshot.id,
              ...snapshot.data(),
            });
          } else {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          setLoading(false);
        },
      );
      return () => unsubPro();
    } else {
      const q = query(
        collection(db, "professionals"),
        where("userId", "==", user.uid),
      );
      const unsubPro = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            setProfessionalProfile({
              id: snapshot.docs[0].id,
              ...snapshot.docs[0].data(),
            });
          } else {
            setLoading(false);
          }
        },
        (error) => {
          console.error(error);
          setLoading(false);
        },
      );
      return () => unsubPro();
    }
  }, [user.uid, overrideProfessionalId]);

  useEffect(() => {
    if (!professionalProfile) return;

    const qApt = query(
      collection(db, "appointments"),
      where("professionalId", "==", professionalProfile.id),
    );

    const unsubApt = onSnapshot(
      qApt,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as any[];
        data.sort((a: any, b: any) => {
          const dateComp = (a.date || "").localeCompare(b.date || "");
          if (dateComp !== 0) return dateComp;
          return (a.time || "").localeCompare(b.time || "");
        });
        setAppointments(data);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      },
    );

    return () => unsubApt();
  }, [professionalProfile]);

  const handleCancelAppointment = async (
    apt: any,
    customTitle: string = "Consulta Cancelada",
    customMsg?: string,
    toastMsg: string = "Agendamento cancelado com sucesso."
  ) => {
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        status: "cancelled",
        updatedAt: Timestamp.now(),
      });

      // Refund patient's wallet if it was paid with wallet and NOT yet finalized
      if (apt.paymentMethod === "wallet" && apt.paymentStatus === "paid" && apt.userId) {
        const refundAmt = apt.priceNumeric || 0;
        if (refundAmt > 0) {
          // Refund client balance
          await updateDoc(doc(db, "users", apt.userId), {
            walletBalance: increment(refundAmt),
          });

          // Log client refund transaction
          await addDoc(collection(db, "transactions"), {
            userId: apt.userId,
            type: "refund",
            amount: refundAmt,
            title: `Reembolso - ${customTitle} - ${professionalProfile?.name || apt.professionalName}`,
            description: `Reembolso de consulta cancelada/rejeitada para o dia ${formatDateForDisplay(apt.date)} às ${apt.time}`,
            category: "Reembolso",
            date: new Date().toISOString(),
            appointmentId: apt.id,
          });
        }
      }

      await addDoc(collection(db, "notifications"), {
        userId: apt.userId,
        title: customTitle,
        message: customMsg || `Sua consulta com ${professionalProfile?.name || apt.professionalName} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
        type: "appointment",
        read: false,
        createdAt: Timestamp.now(),
      });

      addToast(toastMsg, "info");
    } catch (err) {
      console.error(err);
      addToast("Erro ao cancelar agendamento.", "error");
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const apt = appointments.find((a) => a.id === id);
      if (!apt) {
        addToast("Agendamento não encontrado.", "error");
        return;
      }

      if (newStatus === "completed" && apt.status === "completed") {
        addToast("Esta consulta já foi finalizada.", "info");
        return;
      }

      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });

      addToast(
        `Agendamento atualizado para: ${newStatus === "in_progress" ? "Em Atendimento" : "Finalizado"}`,
        "success",
      );

      if (apt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Atualização de Consulta",
          message: `Sua consulta com ${professionalProfile?.name || apt.professionalName} está ${newStatus === "in_progress" ? "EM ATENDIMENTO" : "FINALIZADA"}.`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      // If status is completed, process the transaction (only now it will appear in the financial history)
      if (newStatus === "completed") {
        const profUserId = professionalProfile?.userId || apt.professionalUserId;
        const profFeeRate = professionalProfile?.feeRate !== undefined ? professionalProfile.feeRate : 0;
        const priceNumeric = apt.priceNumeric || 0;
        const feeAmount = (priceNumeric * profFeeRate) / 100;
        const netAmount = priceNumeric - feeAmount;

        if (apt.paymentMethod === "wallet") {
          // 1. Credit the professional's wallet balance
          if (profUserId) {
            await updateDoc(doc(db, "users", profUserId), {
              walletBalance: increment(netAmount),
            });

            // 2. Log credit transaction for the professional
            await addDoc(collection(db, "transactions"), {
              userId: profUserId,
              type: "credit",
              amount: netAmount,
              title: `Recebimento - Consulta de ${apt.patientName}`,
              description: `Pago via Carteira Digital (Desconto de Taxa Fee de ${profFeeRate}%)`,
              category: "Rendimento",
              date: new Date().toISOString(),
              feeRatio: profFeeRate,
              feeCharged: feeAmount,
              appointmentId: id,
            });
          }

          // 3. Log debit transaction for the patient
          if (apt.userId) {
            await addDoc(collection(db, "transactions"), {
              userId: apt.userId,
              type: "debit",
              amount: priceNumeric,
              title: `Pagamento Consulta - ${professionalProfile?.name || apt.professionalName}`,
              description: `Consulta realizada em ${formatDateForDisplay(apt.date)} às ${apt.time}`,
              category: "Consulta",
              date: new Date().toISOString(),
              appointmentId: id,
            });
          }
        } else {
          // Cash/Presencial payment
          if (profUserId) {
            // 1. Log credit transaction for the professional (marked as isCash)
            await addDoc(collection(db, "transactions"), {
              userId: profUserId,
              type: "credit",
              amount: netAmount,
              title: `Recebimento Presencial (Pagamento Presencial) - Consulta de ${apt.patientName}`,
              description: `Pago presencialmente (Desconto de Taxa Fee de ${profFeeRate}%)`,
              category: "Rendimento",
              date: new Date().toISOString(),
              isCash: true,
              feeRatio: profFeeRate,
              feeCharged: feeAmount,
              appointmentId: id,
            });
          }

          // 2. Log debit transaction for the patient (marked as isCash)
          if (apt.userId) {
            await addDoc(collection(db, "transactions"), {
              userId: apt.userId,
              type: "debit",
              amount: priceNumeric,
              title: `Consulta em Pagamento Presencial - ${professionalProfile?.name || apt.professionalName}`,
              description: `Pago presencialmente no consultório`,
              category: "Consulta",
              date: new Date().toISOString(),
              isCash: true,
              appointmentId: id,
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar status.", "error");
    }
  };

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [patientApts, setPatientApts] = useState<any[]>([]);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [patientModalTab, setPatientModalTab] = useState<"info" | "history" | "prescriptions" | "certificates">("info");

  useEffect(() => {
    if (!selectedPatient) {
      setPatientDetails(null);
      setPatientApts([]);
      return;
    }
    const fetchPatientData = async () => {
      setLoadingPatientDetails(true);
      try {
        if (selectedPatient.id) {
          const userDoc = await getDoc(doc(db, "users", selectedPatient.id));
          if (userDoc.exists()) {
            setPatientDetails({ id: userDoc.id, ...userDoc.data() });
          } else {
            setPatientDetails({ name: selectedPatient.name, id: selectedPatient.id });
          }
        } else {
          setPatientDetails({ name: selectedPatient.name });
        }

        let list: any[] = [];
        if (selectedPatient.id) {
          const q = query(
            collection(db, "appointments"),
            where("userId", "==", selectedPatient.id)
          );
          const snap = await getDocs(q);
          list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else if (selectedPatient.name) {
          const q = query(
            collection(db, "appointments"),
            where("patientName", "==", selectedPatient.name)
          );
          const snap = await getDocs(q);
          list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        list.sort((a: any, b: any) => {
          const dateComp = (b.date || "").localeCompare(a.date || "");
          if (dateComp !== 0) return dateComp;
          return (b.time || "").localeCompare(a.time || "");
        });
        setPatientApts(list);
      } catch (err) {
        console.error("Erro ao buscar dados completos do paciente:", err);
      } finally {
        setLoadingPatientDetails(false);
      }
    };
    fetchPatientData();
    setPatientModalTab("info");
  }, [selectedPatient]);

  const downloadPatientPrescriptionPDF = (apt: any) => {
    if (!apt.prescriptions || apt.prescriptions.length === 0) {
      addToast("Nenhuma receita encontrada para esta consulta.", "info");
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Vitta Blue
    doc.text("ViTTA - Prescrição Digital", 105, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Data: ${apt.date ? new Date(apt.date + "T00:00:00").toLocaleDateString("pt-BR") : ""}`, 105, 28, {
      align: "center",
    });

    doc.setDrawColor(200);
    doc.line(20, 35, pageWidth - 20, 35);

    // Patient & Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(apt.patientName || "Não informado", 45, 50);

    doc.setFont("helvetica", "bold");
    doc.text("Médico:", 20, 58);
    doc.setFont("helvetica", "normal");
    doc.text(professionalProfile?.name || "Dr(a). " + (user?.displayName || ""), 45, 58);
    doc.text(
      `${professionalProfile?.specialty || "Clínico Geral"} - ${professionalProfile?.registrationNumber || ""}`,
      45,
      64,
    );

    doc.line(20, 75, pageWidth - 20, 75);

    // Prescriptions
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Receituário", 105, 90, { align: "center" });

    let y = 105;
    apt.prescriptions.forEach((p: any, i: number) => {
      if (y > 250) {
        doc.addPage();
        y = 30;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${p.medicine}`, 25, y);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Dosagem: ${p.dosage}`, 30, y + 6);
      doc.text(`Orientações: ${p.instructions}`, 30, y + 12);

      y += 25;
    });

    // Footer - Simple signature area
    const footerY = 270;
    doc.line(60, footerY, 150, footerY);
    doc.setFontSize(9);
    doc.text("Assinatura Dr(a). " + (professionalProfile?.name || ""), 105, footerY + 5, {
      align: "center",
    });

    doc.save(
      `receita_${(apt.patientName || "paciente").replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
    addToast("PDF gerado com sucesso.", "success");
  };

  const downloadPatientCertificatePDF = (apt: any) => {
    if (!apt.hasCertificate) {
      addToast("Nenhum atestado encontrado para esta consulta.", "info");
      return;
    }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Vitta Blue
    doc.text("ViTTA - Atestado Médico", 105, 25, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Emissão: ${apt.date ? new Date(apt.date + "T00:00:00").toLocaleDateString("pt-BR") : ""}`, 105, 33, {
      align: "center",
    });

    doc.setDrawColor(200);
    doc.line(20, 40, pageWidth - 20, 40);

    // Patient & Doctor Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Paciente:", 20, 52);
    doc.setFont("helvetica", "normal");
    doc.text(apt.patientName || "Não informado", 45, 52);

    if (apt.certificatePatientDocument) {
      doc.setFont("helvetica", "bold");
      doc.text("CPF/Doc:", 20, 58);
      doc.setFont("helvetica", "normal");
      doc.text(apt.certificatePatientDocument, 45, 58);
    }

    doc.setFont("helvetica", "bold");
    doc.text("Médico:", 20, 66);
    doc.setFont("helvetica", "normal");
    doc.text(professionalProfile?.name || "Dr(a). " + (user?.displayName || ""), 45, 66);
    doc.text(
      `${professionalProfile?.specialty || "Clínico Geral"} - ${professionalProfile?.registrationNumber || ""}`,
      45,
      72,
    );

    doc.line(20, 80, pageWidth - 20, 80);

    // Atestado Content
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(33, 150, 243);

    let title = "ATESTADO MÉDICO";
    if (apt.certificateType === "comparecimento") {
      title = "ATESTADO DE COMPARECIMENTO";
    } else if (apt.certificateType === "aptidao") {
      title = "ATESTADO DE APTIDÃO FÍSICA";
    }
    doc.text(title, 105, 100, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");

    const formattedStartDate = apt.certificateStartDate 
      ? new Date(apt.certificateStartDate + "T00:00:00").toLocaleDateString("pt-BR")
      : (apt.date ? new Date(apt.date + "T00:00:00").toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR"));

    const docText = apt.certificatePatientDocument ? `, inscrito(a) sob o CPF/Documento nº ${apt.certificatePatientDocument},` : "";

    let textContent = "";
    if (apt.certificateType === "repouso" || !apt.certificateType) {
      textContent = `Atesto para os devidos fins de direito que o(a) paciente ${apt.patientName}${docText} foi atendido(a) sob meus cuidados profissionais no dia de hoje e necessita de ${apt.certificateDays || 1} dia(s) de repouso para recuperação de sua saúde, a partir da data de ${formattedStartDate}.`;
    } else if (apt.certificateType === "comparecimento") {
      const startT = apt.certificateStartTime || apt.time || "09:00";
      const periodText = apt.certificateEndTime
        ? `no período das ${startT} às ${apt.certificateEndTime} horas`
        : `às ${startT} horas`;
      textContent = `Atesto para os devidos fins de comparecimento que o(a) paciente ${apt.patientName}${docText} esteve em consulta médica sob meus cuidados profissionais no dia de hoje, ${periodText}.`;
    } else if (apt.certificateType === "aptidao") {
      textContent = `Atesto para os devidos fins que o(a) paciente ${apt.patientName}${docText} foi submetido(a) a exame físico clínico e de anamnese no dia de hoje, encontrando-se em perfeitas condições de saúde física e mental, estando APTO(A) para a realização de atividades físicas, laborais, práticas esportivas ou concursos, não apresentando contraindicações no momento.`;
    }

    if (apt.certificateReason) {
      textContent += `\n\nMotivo/Observação complementar: ${apt.certificateReason}`;
    }

    if (apt.certificateCid && (apt.certificateCidConsent !== false)) {
      textContent += `\n\nCID-10 informado (com autorização expressa do paciente): ${apt.certificateCid}`;
    }

    // Wrap text for pdf
    const splitText = doc.splitTextToSize(textContent, pageWidth - 40);
    doc.text(splitText, 20, 115);

    // Footer - Simple signature area
    const footerY = 220;
    doc.line(60, footerY, 150, footerY);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Dr(a). " + (professionalProfile?.name || ""), 105, footerY + 6, {
      align: "center",
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${professionalProfile?.specialty || "Clínico Geral"} - ${professionalProfile?.registrationNumber || ""}`, 105, footerY + 12, {
      align: "center",
    });

    doc.save(
      `atestado_${(apt.patientName || "paciente").replace(/\s+/g, "_").toLowerCase()}.pdf`,
    );
    addToast("Atestado PDF gerado com sucesso.", "success");
  };

  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [editingApt, setEditingApt] = useState<any>(null);

  const handleReschedule = async (newDate: string, newTime: string, newModality?: string) => {
    if (!editingApt) return;
    try {
      await updateDoc(doc(db, "appointments", editingApt.id), {
        date: newDate,
        time: newTime,
        ...(newModality ? { modality: newModality } : {}),
        status: "upcoming",
        updatedAt: Timestamp.now(),
      });

      // Send notification to patient
      const modLabel = newModality === "presencial" ? "Presencial" : "Telemedicina";
      await addDoc(collection(db, "notifications"), {
        userId: editingApt.userId,
        title: "Consulta Remarcada",
        message: `Sua consulta com ${professionalProfile.name} foi remarcada para o dia ${formatDateForDisplay(newDate)} às ${newTime} (${modLabel}).`,
        type: "appointment",
        read: false,
        createdAt: Timestamp.now(),
      });

      addToast("Agendamento remarcado com sucesso.", "success");
      setEditingApt(null);
    } catch (err) {
      console.error("Erro ao remarcar agendamento:", err);
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `appointments/${editingApt.id}`,
      );
      addToast("Erro ao remarcar agendamento.", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-vitta-accent/20 border-t-vitta-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!professionalProfile) {
    return (
      <div className="flex-1 p-4 md:p-10 flex flex-col items-center justify-center font-sans">
        <div className="max-w-3xl w-full bg-vitta-surface border border-vitta-border rounded-3xl p-6 md:p-10 space-y-8 shadow-xl">
          <div className="text-center space-y-4">
            <div className="inline-flex p-4 bg-vitta-amber/10 text-vitta-amber rounded-full shadow-lg shadow-vitta-amber/5">
              <AlertCircle size={36} className="animate-bounce" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-vitta-text-primary">
              Seja bem-vindo(a) à ViTTA Medical!
            </h2>
            <p className="text-sm text-vitta-text-secondary leading-relaxed max-w-lg mx-auto">
              Sua conta está identificada como <span className="font-bold text-vitta-accent">Profissional de Saúde</span>, mas seu usuário ainda não possui um perfil clínico de atendimento vinculado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left Box: Claim / Link to an existing profile */}
            <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-6 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-vitta-accent/10 rounded-xl flex items-center justify-center text-vitta-accent font-bold">
                  <User size={20} />
                </div>
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  Vincular Perfil Existente
                </h3>
                <p className="text-xs text-vitta-text-secondary leading-relaxed">
                  Se um administrador já cadastrou seu nome, selecione seu perfil abaixo para associá-lo definitivamente ao seu usuário. <span className="font-semibold text-vitta-accent">Apenas perfis cadastrados com o seu e-mail ({user?.email}) são exibidos e podem ser vinculados.</span>
                </p>
              </div>

              {loadingUnlinked ? (
                <div className="py-4 text-center text-xs text-vitta-text-secondary">
                  Carregando perfis livres...
                </div>
              ) : availableUnlinkedProfs.length > 0 ? (
                <div className="space-y-2 mt-4 max-h-[220px] overflow-y-auto pr-1">
                  {availableUnlinkedProfs.map((prof) => (
                    <div
                      key={prof.id}
                      className="p-3 bg-vitta-surface border border-vitta-border rounded-xl flex items-center justify-between gap-3 group hover:border-vitta-accent transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-vitta-text-primary truncate">
                          {prof.name}
                        </p>
                        <p className="text-[10px] text-vitta-text-secondary">
                          {prof.specialty} • {prof.registrationNumber || "Sem CRM"}
                        </p>
                      </div>
                      <button
                        onClick={() => handleLinkProfile(prof.id)}
                        disabled={isLinkingInProcess}
                        className="px-2.5 py-1.5 bg-vitta-accent text-white text-[10px] font-bold rounded-lg hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/10 whitespace-nowrap disabled:opacity-55"
                      >
                        Vincular
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-vitta-surface-3 border border-vitta-border rounded-xl text-center text-[11px] text-vitta-text-muted italic">
                  Nenhum cadastro sem vínculo encontrado.
                </div>
              )}
            </div>

            {/* Right Box: Create New Profile */}
            <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-6 flex flex-col justify-between space-y-4 text-left">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-vitta-green/10 text-vitta-green rounded-xl flex items-center justify-center font-bold">
                  <Plus size={20} />
                </div>
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  Criar Novo Perfil Médico
                </h3>
                <p className="text-xs text-vitta-text-secondary leading-relaxed">
                  Não possui um perfil na plataforma? Crie agora mesmo de forma autônoma para habilitar e liberar todo o seu Painel de Consulta.
                </p>
              </div>

              {!isCreatingProfile ? (
                <button
                  onClick={() => setIsCreatingProfile(true)}
                  className="w-full mt-4 py-3 bg-vitta-green text-white hover:bg-vitta-green/90 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md shadow-vitta-green/10 text-center"
                >
                  Configurar Meu Perfil Agora
                </button>
              ) : (
                <button
                  onClick={() => setIsCreatingProfile(false)}
                  className="w-full mt-4 py-2 bg-vitta-border text-vitta-text-primary hover:bg-vitta-border-2 rounded-xl font-bold text-xs transition-all text-center"
                >
                  Voltar
                </button>
              )}
            </div>
          </div>

          {isCreatingProfile && (
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateAndLinkProfile}
              className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-6 md:p-8 text-left space-y-5"
            >
              <h4 className="font-bold text-base text-vitta-text-primary border-b border-vitta-border pb-2 flex items-center gap-2">
                <Stethoscope size={18} className="text-vitta-accent" />
                DADOS CLÍNICOS DO SEU PERFIL
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    Nome Completo (Profissional) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProfName}
                    onChange={(e) => setNewProfName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                    placeholder="Ex: Dr. Lucas Medeiros"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    Especialidade Clínica *
                  </label>
                  <select
                    required
                    value={newProfSpecialty}
                    onChange={(e) => setNewProfSpecialty(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary h-[38px]"
                  >
                    <option value="Clínico Geral">Clínico Geral</option>
                    <option value="Cardiologia">Cardiologia</option>
                    <option value="Dermatologia">Dermatologia</option>
                    <option value="Ginecologia">Ginecologia</option>
                    <option value="Nutrição">Nutrição</option>
                    <option value="Psicologia">Psicologia</option>
                    <option value="Pediatria">Pediatria</option>
                    <option value="Ortopedia">Ortopedia</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    CRM / Registro Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProfCRM}
                    onChange={(e) => setNewProfCRM(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                    placeholder="Ex: CRM/UF 123456"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    Preço da Consulta (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProfPrice}
                    onChange={(e) => setNewProfPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                    placeholder="150"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    WhatsApp para Recebimento de Alertas
                  </label>
                  <input
                    type="tel"
                    value={newProfPhone}
                    onChange={(e) => setNewProfPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
                    placeholder="Ex: 5528999999999"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-vitta-border/50">
                <button
                  type="button"
                  onClick={() => setIsCreatingProfile(false)}
                  className="px-5 py-2.5 border border-vitta-border hover:bg-vitta-surface-3 text-vitta-text-primary rounded-xl text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLinkingInProcess}
                  className="px-6 py-2.5 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-vitta-accent/10 disabled:opacity-55"
                >
                  {isLinkingInProcess ? "Criando e Vinculando..." : "Criar Meu Perfil Clínico"}
                </button>
              </div>
            </motion.form>
          )}
        </div>
      </div>
    );
  }

  if (professionalProfile.isApproved === false) {
    return (
      <div className="flex-1 p-4 md:p-10 flex flex-col items-center justify-center font-sans">
        <div className="max-w-xl w-full bg-vitta-surface border border-vitta-border rounded-3xl p-6 md:p-10 space-y-6 shadow-xl text-center">
          <div className="inline-flex p-4 bg-vitta-amber/10 text-vitta-amber rounded-full shadow-lg shadow-vitta-amber/5">
            <Clock size={36} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-vitta-text-primary">
            Cadastro em Análise!
          </h2>
          <p className="text-sm text-vitta-text-secondary leading-relaxed">
            Olá, <span className="font-semibold text-vitta-text-primary">{professionalProfile.name}</span>. Seu perfil profissional está cadastrado com sucesso e foi enviado para aprovação de um administrador da plataforma.
          </p>
          <div className="p-4 bg-vitta-surface-2 rounded-xl text-left border border-vitta-border space-y-2">
            <p className="text-xs text-vitta-text-secondary"><strong className="text-vitta-text-primary">CRM/Registro:</strong> {professionalProfile.registrationNumber}</p>
            <p className="text-xs text-vitta-text-secondary"><strong className="text-vitta-text-primary">Especialidade:</strong> {professionalProfile.specialty}</p>
            <p className="text-xs text-vitta-text-secondary"><strong className="text-vitta-text-primary">Status:</strong> <span className="px-2 py-0.5 bg-vitta-amber/10 text-vitta-amber rounded font-bold text-[10px]">Aguardando Aprovação</span></p>
          </div>
          <p className="text-xs text-vitta-text-muted">
            Você receberá uma notificação assim que seu perfil for aprovado por um Usuário Admin e liberado para atendimento.
          </p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const stats = {
    todayCount: appointments.filter(
      (a) =>
        a.date === today && a.status !== "cancelled" && a.status !== "pending",
    ).length,
    completedToday: appointments.filter(
      (a) => a.date === today && a.status === "completed",
    ).length,
    pendingToday: appointments.filter((a) => a.status === "pending").length,
    averageRating: professionalProfile.rating || 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AnimatePresence>
        {selectedApt && (
          <ClinicalRecordModal
            isOpen={!!selectedApt}
            appointment={selectedApt}
            professional={professionalProfile}
            onClose={() => setSelectedApt(null)}
          />
        )}
        {isScheduleModalOpen && (
          <AvailabilityPlannerModal
            isOpen={isScheduleModalOpen}
            professional={professionalProfile}
            onClose={() => setIsScheduleModalOpen(false)}
          />
        )}
        {editingApt && (
          <RescheduleModal
            appointment={editingApt}
            onClose={() => setEditingApt(null)}
            onConfirm={handleReschedule}
          />
        )}
        {isManualBookingModalOpen && (
          <ProfessionalManualBookingModal
            isOpen={isManualBookingModalOpen}
            professional={professionalProfile}
            onClose={() => {
              setIsManualBookingModalOpen(false);
              setManualBookingInitialPatient(null);
            }}
            user={user}
            initialUserId={manualBookingInitialPatient?.userId}
            initialPatientName={manualBookingInitialPatient?.patientName}
          />
        )}
      </AnimatePresence>
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 w-full pb-4 border-b border-vitta-border/50">
        <div className="w-full xl:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-vitta-text-primary break-words w-full leading-tight">
            Olá, Dr(a). {professionalProfile.name}
          </h1>
          <p className="text-vitta-text-secondary mt-1 break-words w-full text-sm md:text-base">
            Gerencie seus atendimentos de hoje,{" "}
            {new Date().toLocaleDateString("pt-BR")}.
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-3 w-full xl:w-auto flex-wrap">
          <div className="flex flex-wrap bg-vitta-surface-2 p-1 rounded-xl shadow-inner w-full md:w-auto gap-1">
            <button
              id="prof-tab-agenda"
              onClick={() => setSubTab("agenda")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] ${subTab === "agenda" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              <span>📋 Agenda-Dia</span>
              {appointments.filter((a) => a.status === "pending").length > 0 && (
                <span className="bg-vitta-amber text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm animate-pulse">
                  {appointments.filter((a) => a.status === "pending").length}
                </span>
              )}
            </button>
            <button
              id="prof-tab-historico"
              onClick={() => setSubTab("historico")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] ${subTab === "historico" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              📜 Histórico
            </button>
            <button
              id="prof-tab-profile"
              onClick={() => setSubTab("profile")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] ${subTab === "profile" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              👤 Perfil
            </button>
            <button
              id="prof-tab-finance"
              onClick={() => setSubTab("finance")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] ${subTab === "finance" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              💰 Financeiro
            </button>
            <button
              id="prof-tab-settings"
              onClick={() => setSubTab("settings")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] ${subTab === "settings" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              ⚙️ Grade
            </button>
            <button
              id="prof-tab-users"
              onClick={() => setSubTab("users")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-200 text-center hover:scale-[1.02] active:scale-[0.98] ${subTab === "users" ? "bg-vitta-surface shadow-sm text-vitta-accent border border-vitta-border/30" : "text-vitta-text-secondary hover:text-vitta-text-primary hover:bg-vitta-surface/50"}`}
            >
              👥 Usuários
            </button>
          </div>
          {subTab === "agenda" && (
            <div className="flex flex-wrap bg-vitta-surface-2 p-1 rounded-xl shadow-inner gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-vitta-border text-vitta-text-primary rounded-xl font-bold hover:bg-vitta-border-2 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-xs md:text-sm"
              >
                <Calendar size={16} />
                Gerenciar Grade
              </button>
              <button
                onClick={() => setIsManualBookingModalOpen(true)}
                className="flex-1 md:flex-none px-4 py-2.5 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/95 transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-md shadow-vitta-accent/10 text-xs md:text-sm"
              >
                <Plus size={16} />
                Inserir Agendamento
              </button>
            </div>
          )}
        </div>
      </header>

      {subTab === "agenda" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: "Total Hoje",
              value: stats.todayCount,
              icon: Calendar,
              color: "text-vitta-accent",
              bg: "bg-vitta-accent-bg",
            },
            {
              label: "Aguardando",
              value: stats.pendingToday,
              icon: Clock,
              color: "text-vitta-amber",
              bg: "bg-vitta-amber-bg",
            },
            {
              label: "Concluídos",
              value: stats.completedToday,
              icon: CheckCircle2,
              color: "text-vitta-green",
              bg: "bg-vitta-green-bg",
            },
            {
              label: "Avaliação",
              value: stats.averageRating,
              icon: Star,
              color: "text-yellow-500",
              bg: "bg-yellow-500/10",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="p-6 bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center">
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <span className="text-2xl font-bold text-vitta-text-primary">
                  {stat.value}
                </span>
              </div>
              <p className="text-sm font-medium text-vitta-text-secondary">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      )}

      {subTab === "agenda" && (
        <section className="space-y-6">
          {/* Section 1: Pending requests awaiting professional confirmation */}
          {appointments.filter((a) => a.status === "pending").length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-vitta-amber flex items-center gap-2">
                <Clock className="text-vitta-amber animate-pulse" size={20} />
                Solicitações de Agendamento (Aguardando Sua Confirmação)
              </h2>
              <div className="bg-vitta-surface border border-vitta-amber/20 rounded-2xl shadow-sm overflow-hidden divide-y divide-vitta-border">
                {appointments
                  .filter((a) => a.status === "pending")
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-vitta-amber/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-vitta-amber/10 rounded-full flex items-center justify-center text-vitta-amber font-bold text-lg">
                          {apt.patientName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <h3 className="font-bold text-vitta-text-primary">
                            {apt.patientName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-vitta-text-secondary mt-1">
                            <span className="font-bold text-vitta-text-primary bg-vitta-surface-3 border border-vitta-border px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar
                                size={12}
                                className="text-vitta-green"
                              />
                              {formatDateForDisplay(apt.date)}{" "}
                              às {apt.time}
                            </span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                apt.modality === "telemedicine" ||
                                apt.modality === "online"
                                  ? "bg-vitta-accent-bg text-vitta-accent"
                                  : "bg-vitta-surface-3 text-vitta-text-secondary border border-vitta-border"
                              }`}
                            >
                              {apt.modality === "telemedicine" ||
                              apt.modality === "online"
                                ? "💻 Telemedicina"
                                : "🏥 Presencial"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 md:mt-0">
                        <button
                          onClick={() =>
                            setSelectedPatient({
                              name: apt.patientName,
                              id: apt.userId,
                            })
                          }
                          className="p-2.5 text-vitta-text-muted hover:text-vitta-accent rounded-xl hover:bg-vitta-accent-bg transition-all"
                          title="Ver Ficha do Paciente"
                        >
                          <User size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "appointments", apt.id), {
                                status: "upcoming",
                                updatedAt: Timestamp.now(),
                              });
                              await addDoc(collection(db, "notifications"), {
                                userId: apt.userId,
                                title: "Consulta Confirmada",
                                message: `Sua consulta com ${professionalProfile.name} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi confirmada com sucesso!`,
                                type: "appointment",
                                read: false,
                                createdAt: Timestamp.now(),
                              });
                              addToast(
                                "Agendamento confirmado com sucesso.",
                                "success",
                              );
                            } catch (err) {
                              console.error(err);
                              addToast(
                                "Erro ao confirmar agendamento.",
                                "error",
                              );
                            }
                          }}
                          className="px-4 py-2 bg-vitta-green text-white hover:bg-vitta-green/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-vitta-green/10"
                          title="Confirmar Agendamento"
                        >
                          <Check size={14} />
                          Confirmar
                        </button>
                        <button
                          onClick={() => setEditingApt(apt)}
                          className="px-4 py-2 bg-vitta-accent/10 text-vitta-accent hover:bg-vitta-accent hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Remarcar Consulta"
                        >
                          <Clock size={14} />
                          Remarcar
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(
                            apt,
                            "Consulta Rejeitada",
                            `Sua solicitação de consulta com ${professionalProfile?.name || apt.professionalName} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi rejeitada pelo profissional.`,
                            "Agendamento rejeitado com sucesso."
                          )}
                          className="px-4 py-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Rejeitar Solicitação"
                        >
                          <X size={14} />
                          Rejeitar
                        </button>
                        <button
                          onClick={() => handleCancelAppointment(
                            apt,
                            "Consulta Cancelada",
                            `Sua solicitação de consulta com ${professionalProfile?.name || apt.professionalName} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                            "Agendamento cancelado com sucesso."
                          )}
                          className="px-4 py-2 border border-vitta-danger/30 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Cancelar Solicitação"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Section 2: Today's schedule */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
              <ClipboardList className="text-vitta-accent" size={20} />
              Agenda de Hoje
            </h2>

            <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm overflow-hidden">
              {appointments.filter(
                (a) =>
                  a.date === today &&
                  a.status !== "pending" &&
                  a.status !== "cancelled",
              ).length > 0 ? (
                <div className="divide-y divide-vitta-border">
                  {appointments
                    .filter(
                      (a) =>
                        a.date === today &&
                        a.status !== "pending" &&
                        a.status !== "cancelled",
                    )
                    .map((apt) => (
                      <div
                        key={apt.id}
                        className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-vitta-surface-2 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-vitta-accent-bg rounded-full flex items-center justify-center text-vitta-accent font-bold text-lg">
                            {apt.patientName?.charAt(0) || "P"}
                          </div>
                          <div>
                            <h3 className="font-bold text-vitta-text-primary">
                              {apt.patientName}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-vitta-text-secondary">
                              <span className="font-mono bg-vitta-border px-1.5 py-0.5 rounded">
                                {apt.time}
                              </span>
                              <span>•</span>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  apt.modality === "telemedicine" ||
                                  apt.modality === "online"
                                    ? "bg-vitta-accent-bg text-vitta-accent"
                                    : "bg-vitta-surface-3 text-vitta-text-secondary border border-vitta-border"
                                }`}
                              >
                                {apt.modality === "telemedicine" ||
                                apt.modality === "online"
                                  ? "💻 Telemedicina"
                                  : "🏥 Presencial"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 md:mt-0">
                          <button
                            onClick={() =>
                              setSelectedPatient({
                                name: apt.patientName,
                                id: apt.userId,
                              })
                            }
                            className="p-2 text-vitta-text-muted hover:text-vitta-accent rounded-lg hover:bg-vitta-accent-bg transition-all"
                            title="Ver Ficha do Paciente"
                          >
                            <User size={18} />
                          </button>
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              apt.status === "upcoming"
                                ? "bg-blue-500/10 text-blue-500"
                                : apt.status === "in_progress"
                                  ? "bg-vitta-accent-bg text-vitta-accent animate-pulse"
                                  : apt.status === "completed"
                                    ? "bg-vitta-green-bg text-vitta-green"
                                    : "bg-vitta-danger/10 text-vitta-danger"
                            }`}
                          >
                            {apt.status === "upcoming"
                              ? "Agendado"
                              : apt.status === "in_progress"
                                ? "Em Atendimento"
                                : apt.status === "completed"
                                  ? "Finalizado"
                                  : "Cancelado"}
                          </span>

                          {(apt.status === "upcoming" ||
                            apt.status === "in_progress") &&
                            (apt.modality === "telemedicine" ||
                              apt.modality === "online" ||
                              !apt.modality) && (
                              <>
                                <button
                                  onClick={async () => {
                                    if (apt.status === "upcoming") {
                                      await handleUpdateStatus(
                                        apt.id,
                                        "in_progress",
                                      );
                                    }
                                    setActiveTelemedicineApt(apt);
                                  }}
                                  className="px-4 py-2 bg-vitta-green text-white hover:bg-vitta-green/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-vitta-green/10"
                                  title="Atendimento por Vídeo"
                                >
                                  <Video size={14} />
                                  Atender em Vídeo
                                </button>
                                <button
                                  onClick={() => {
                                    const link = `${window.location.origin}/?room=${apt.id}`;
                                    navigator.clipboard.writeText(link);
                                    addToast("Link da teleconsulta copiado com sucesso!", "success");
                                  }}
                                  className="px-4 py-2 bg-vitta-surface-3 border border-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold hover:bg-vitta-surface hover:border-vitta-text-primary transition-all flex items-center gap-1.5"
                                  title="Copiar Link de Convite"
                                >
                                  <Share2 size={14} />
                                  Copiar Link
                                </button>
                              </>
                            )}

                          {apt.status === "upcoming" && (
                            <>
                              <button
                                onClick={() =>
                                  handleUpdateStatus(apt.id, "in_progress")
                                }
                                className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all flex items-center gap-2"
                              >
                                <SkipForward size={14} />
                                Iniciar
                              </button>
                              <button
                                onClick={() => setEditingApt(apt)}
                                className="px-4 py-2 bg-vitta-accent/10 text-vitta-accent hover:bg-vitta-accent hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Remarcar Consulta"
                              >
                                <Clock size={14} />
                                Remarcar
                              </button>
                              <button
                                onClick={() => handleCancelAppointment(
                                  apt,
                                  "Consulta Cancelada",
                                  `Sua consulta com ${professionalProfile?.name || apt.professionalName} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                                  "Agendamento cancelado com sucesso."
                                )}
                                className="px-4 py-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                                title="Cancelar Consulta"
                              >
                                <X size={14} />
                                Cancelar
                              </button>
                            </>
                          )}

                          {apt.status === "in_progress" && (
                            <button
                              onClick={() => setSelectedApt(apt)}
                              className="px-4 py-2 bg-vitta-border text-vitta-text-primary rounded-xl text-xs font-bold hover:bg-vitta-border-2 transition-all flex items-center gap-2"
                            >
                              <Stethoscope size={14} />
                              Registro Clínico
                            </button>
                          )}

                          {apt.status === "in_progress" && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(apt.id, "completed")
                              }
                              className="px-4 py-2 bg-vitta-green text-white rounded-xl text-xs font-bold hover:bg-vitta-green/90 transition-all flex items-center gap-2"
                            >
                              <Check size={14} />
                              Finalizar
                            </button>
                          )}

                          {apt.status === "completed" && (
                            <button
                              onClick={() => setSelectedApt(apt)}
                              className="px-4 py-2 bg-vitta-surface border border-vitta-border text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all flex items-center gap-2"
                            >
                              <FileText size={14} />
                              Ver Prontuário
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="p-12 text-center text-vitta-text-secondary">
                  <Calendar
                    size={48}
                    className="mx-auto text-vitta-text-muted mb-4"
                  />
                  <p className="font-medium">Nenhum agendamento para hoje.</p>
                  <p className="text-xs">
                    Aproveite o tempo livre ou confira sua agenda de amanhã.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Future upcoming appointments */}
          {appointments.filter((a) => a.date > today && a.status === "upcoming")
            .length > 0 && (
            <div className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
                <Calendar className="text-vitta-accent" size={20} />
                Próximas Consultas Agendadas
              </h2>
              <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm overflow-hidden divide-y divide-vitta-border">
                {appointments
                  .filter((a) => a.date > today && a.status === "upcoming")
                  .map((apt) => (
                    <div
                      key={apt.id}
                      className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-vitta-surface-2 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-vitta-accent-bg rounded-full flex items-center justify-center text-vitta-accent font-bold text-lg">
                          {apt.patientName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <h3 className="font-bold text-vitta-text-primary">
                            {apt.patientName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-vitta-text-secondary mt-1">
                            <span className="font-bold text-vitta-text-primary bg-vitta-surface-3 border border-vitta-border px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar
                                size={12}
                                className="text-vitta-green"
                              />
                              {formatDateForDisplay(apt.date)}{" "}
                              às {apt.time}
                            </span>
                            <span>•</span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                apt.modality === "telemedicine" ||
                                apt.modality === "online"
                                  ? "bg-vitta-accent-bg text-vitta-accent"
                                  : "bg-vitta-surface-3 text-vitta-text-secondary border border-vitta-border"
                              }`}
                            >
                              {apt.modality === "telemedicine" ||
                              apt.modality === "online"
                                ? "💻 Telemedicina"
                                : "🏥 Presencial"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 md:mt-0">
                        <button
                          onClick={() =>
                            setSelectedPatient({
                              name: apt.patientName,
                              id: apt.userId,
                            })
                          }
                          className="p-2.5 text-vitta-text-muted hover:text-vitta-accent rounded-xl hover:bg-vitta-accent-bg transition-all"
                          title="Ver Ficha do Paciente"
                        >
                          <User size={18} />
                        </button>

                        <button
                          onClick={() => setEditingApt(apt)}
                          className="px-4 py-2 bg-vitta-accent/10 text-vitta-accent hover:bg-vitta-accent hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Remarcar Consulta"
                        >
                          <Clock size={14} />
                          Remarcar
                        </button>

                        <button
                          onClick={() => handleCancelAppointment(
                            apt,
                            "Consulta Cancelada",
                            `Sua consulta com ${professionalProfile?.name || apt.professionalName} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                            "Agendamento cancelado com sucesso."
                          )}
                          className="px-4 py-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Cancelar Consulta"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>
      )}

      {subTab === "profile" && (
        <section className="space-y-4">
          <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm overflow-hidden p-6 gap-6 flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 space-y-4">
              <h3 className="font-bold text-lg text-vitta-text-primary border-b border-vitta-border pb-2">
                Informações Iniciais
              </h3>
              <p className="text-sm text-vitta-text-secondary">
                <strong className="text-vitta-text-primary">
                  Especialidade:
                </strong>{" "}
                {professionalProfile.specialty}
              </p>
              <p className="text-sm text-vitta-text-secondary">
                <strong className="text-vitta-text-primary">
                  CRM/Registro:
                </strong>{" "}
                {professionalProfile.registrationNumber}
              </p>
              <p className="text-sm text-vitta-text-secondary">
                <strong className="text-vitta-text-primary">Valor Base:</strong>{" "}
                R$ {professionalProfile.price}
              </p>
              <p className="text-sm text-vitta-text-secondary">
                <strong className="text-vitta-text-primary">
                  Avaliação Média:
                </strong>{" "}
                ⭐ {professionalProfile.rating || 0}
              </p>
              <p className="text-xs text-vitta-text-muted italic mt-4">
                Para atualizar campos imutáveis, entre em contato com a
                administração.
              </p>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="font-bold text-lg text-vitta-text-primary border-b border-vitta-border pb-2 mb-4">
                Currículo Extenso / Apresentação
              </h3>
              {professionalProfile.curriculum ? (
                <div className="text-sm text-vitta-text-secondary whitespace-pre-wrap">
                  {professionalProfile.curriculum}
                </div>
              ) : (
                <div className="text-sm text-vitta-amber bg-vitta-amber-bg p-4 rounded-xl border border-vitta-amber/30">
                  Você ainda não adicionou um currículo profissional. Adicione-o
                  para melhorar seu perfil público e atrair mais pacientes. Esta
                  ação deve ser solicitada à administração atualmente.
                </div>
              )}
            </div>
          </div>

          {/* Visual Weekly Schedule Panel */}
          <div className="w-full bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vitta-border pb-3">
              <div className="flex items-center gap-2">
                <Clock className="text-vitta-accent" size={20} />
                <h3 className="font-bold text-base text-vitta-text-primary">
                  Definições da Grade de Atendimento Semanal
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(true)}
                className="px-3 py-1.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Calendar size={14} />
                Configurar Turnos
              </button>
            </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries({
                  monday: "Segunda-feira",
                  tuesday: "Terça-feira",
                  wednesday: "Quarta-feira",
                  thursday: "Quinta-feira",
                  friday: "Sexta-feira",
                  saturday: "Sábado",
                  sunday: "Domingo",
                }).map(([key, label]) => {
                  const slots = professionalProfile.schedule?.weekly?.[key] || [];
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border flex flex-col justify-between min-h-[110px] transition-all ${
                        slots.length > 0
                          ? "bg-vitta-accent-bg/40 border-vitta-accent/15"
                          : "bg-vitta-surface-2 border-vitta-border opacity-70"
                      }`}
                    >
                      <span className="text-xs font-black text-vitta-text-primary uppercase tracking-wide block border-b border-vitta-border pb-1 mb-2 text-center">
                        {label.split("-")[0]}
                      </span>
                      <div className="space-y-1.5 flex-1 flex flex-col justify-center">
                        {slots.length > 0 ? (
                          slots.map((s: any, idx: number) => (
                            <div
                              key={idx}
                              className="text-[10px] font-mono font-bold bg-vitta-surface px-1.5 py-0.5 rounded border border-vitta-border text-vitta-accent shadow-sm text-center"
                            >
                              {s.start} - {s.end}
                            </div>
                          ))
                        ) : (
                          <span className="text-[10px] text-vitta-text-muted italic block py-2 text-center bg-vitta-surface/30 rounded border border-dashed border-vitta-border">
                            Folga
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </section>
      )}

      {subTab === "historico" && (
        <section className="space-y-6">
          {/* Productivity Chart Card */}
          <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="text-vitta-accent animate-pulse" size={20} />
                  <h3 className="text-lg font-bold text-vitta-text-primary">
                    Produtividade e Desempenho Clínico
                  </h3>
                </div>
                <p className="text-xs text-vitta-text-secondary">
                  Acompanhe a volumetria e taxa de conclusão dos atendimentos realizados.
                </p>
              </div>

              {/* Chart Mode Toggle */}
              <div className="flex bg-vitta-surface-2 p-1 rounded-xl shadow-inner gap-1 self-start sm:self-center">
                <button
                  onClick={() => setChartGroupMode("dia")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartGroupMode === "dia"
                      ? "bg-vitta-surface text-vitta-accent shadow-sm"
                      : "text-vitta-text-secondary hover:text-vitta-text-primary"
                  }`}
                >
                  Dia
                </button>
                <button
                  onClick={() => setChartGroupMode("semana")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartGroupMode === "semana"
                      ? "bg-vitta-surface text-vitta-accent shadow-sm"
                      : "text-vitta-text-secondary hover:text-vitta-text-primary"
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={() => setChartGroupMode("mes")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    chartGroupMode === "mes"
                      ? "bg-vitta-surface text-vitta-accent shadow-sm"
                      : "text-vitta-text-secondary hover:text-vitta-text-primary"
                  }`}
                >
                  Mês
                </button>
              </div>
            </div>

            {/* Performance Indicators Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-vitta-surface-2 border border-vitta-border rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-text-secondary uppercase tracking-wider block">
                  Total de Consultas
                </span>
                <span className="text-2xl font-black text-vitta-text-primary mt-1 block">
                  {totalChartAppointments}
                </span>
              </div>
              <div className="p-4 bg-vitta-green-bg/50 border border-vitta-green/10 rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-green uppercase tracking-wider block">
                  Consultas Concluídas
                </span>
                <span className="text-2xl font-black text-vitta-green mt-1 block">
                  {completedChartAppointments}
                </span>
              </div>
              <div className="p-4 bg-vitta-accent-bg/50 border border-vitta-accent/10 rounded-2xl">
                <span className="text-[10px] font-bold text-vitta-accent uppercase tracking-wider block">
                  Taxa de Resolução
                </span>
                <span className="text-2xl font-black text-vitta-accent mt-1 block">
                  {completionRate}%
                </span>
              </div>
            </div>

            {/* Recharts Render Area */}
            {productivityChartData.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center bg-vitta-surface-2/40 border border-dashed border-vitta-border rounded-2xl text-center p-6">
                <TrendingUp className="text-vitta-text-muted mb-2 opacity-50" size={32} />
                <p className="text-sm font-bold text-vitta-text-secondary">Sem dados para plotagem</p>
                <p className="text-xs text-vitta-text-muted mt-1">
                  Não há consultas registradas para os filtros de busca aplicados.
                </p>
              </div>
            ) : (
              <div className="w-full h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={productivityChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B6EF8" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#3B6EF8" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#059669" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-vitta-border/50" opacity={0.4} />
                    <XAxis 
                      dataKey="name" 
                      stroke="currentColor" 
                      className="text-vitta-text-secondary" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="currentColor" 
                      className="text-vitta-text-secondary" 
                      fontSize={11} 
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--vitta-surface)', 
                        borderColor: 'var(--vitta-border)', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        fontSize: '12px',
                        color: 'var(--vitta-text-primary)'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#3B6EF8" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorTotal)" 
                      name="Total de Consultas"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="completed" 
                      stroke="#059669" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#colorCompleted)" 
                      name="Consultas Concluídas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vitta-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="text-vitta-accent" size={20} />
                <h2 className="text-lg font-bold text-vitta-text-primary">
                  Histórico Completo de Atendimentos
                </h2>
              </div>
              <span className="text-xs font-semibold text-vitta-text-secondary bg-vitta-surface-2 border border-vitta-border px-3 py-1.5 rounded-xl">
                Total Filtrado: <strong className="text-vitta-accent font-bold">{sortedHistoryAppointments.length}</strong> {sortedHistoryAppointments.length === 1 ? "atendimento" : "atendimentos"}
              </span>
            </div>

            {/* Filters Area */}
            <div className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Search Patient Name */}
                <div className="col-span-1 md:col-span-7 space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    Filtrar por Cliente/Paciente
                  </label>
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-3 text-vitta-text-muted" />
                    <input
                      type="text"
                      placeholder="Buscar por nome do paciente..."
                      value={historySearchPatient}
                      onChange={(e) => setHistorySearchPatient(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs md:text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15 placeholder-vitta-text-muted"
                    />
                    {historySearchPatient && (
                      <button
                        onClick={() => setHistorySearchPatient("")}
                        className="absolute right-3.5 top-3 text-vitta-text-muted hover:text-vitta-text-primary"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date Filter Dropdown */}
                <div className="col-span-1 md:col-span-5 space-y-1.5">
                  <label className="text-xs font-bold text-vitta-text-secondary">
                    Período de Data
                  </label>
                  <select
                    value={historyDateFilter}
                    onChange={(e) => {
                      setHistoryDateFilter(e.target.value);
                      if (e.target.value !== "personalizado") {
                        setHistoryStartDate("");
                        setHistoryEndDate("");
                      }
                    }}
                    className="w-full px-3 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-xs md:text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15 h-[42px]"
                  >
                    <option value="all">Todas as Datas</option>
                    <option value="semana">Semana (Últimos 7 dias)</option>
                    <option value="mes">Mês Atual</option>
                    <option value="30dias">Últimos 30 Dias</option>
                    <option value="60dias">Últimos 60 Dias</option>
                    <option value="90dias">Últimos 90 Dias</option>
                    <option value="personalizado">Personalizado...</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Inputs if selected */}
              {historyDateFilter === "personalizado" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-vitta-border/30">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs md:text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs md:text-sm text-vitta-text-primary focus:outline-none focus:ring-2 focus:ring-vitta-accent/15"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Results Area */}
            {sortedHistoryAppointments.length === 0 ? (
              <div className="p-12 text-center bg-vitta-surface border border-dashed border-vitta-border rounded-2xl space-y-3">
                <ClipboardList className="mx-auto text-vitta-text-muted" size={44} />
                <p className="font-medium text-vitta-text-primary">
                  Nenhum registro de atendimento encontrado.
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Ajuste os filtros de busca ou altere o período selecionado.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {sortedHistoryAppointments.map((apt) => {
                  return (
                    <div
                      key={apt.id}
                      className="p-5 bg-vitta-surface border border-vitta-border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-vitta-accent/25 hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-vitta-accent-bg rounded-xl flex items-center justify-center text-vitta-accent font-bold text-lg">
                          {apt.patientName?.charAt(0) || "P"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-vitta-text-primary text-sm md:text-base">
                              {apt.patientName}
                            </h3>
                            {/* Modality Badge */}
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold ${
                              apt.modality === "telemedicine" || apt.modality === "online"
                                ? "bg-vitta-accent-bg text-vitta-accent border border-vitta-accent/10"
                                : "bg-vitta-surface-3 text-vitta-text-secondary border border-vitta-border"
                            }`}>
                              {apt.modality === "telemedicine" || apt.modality === "online"
                                ? "💻 Telemedicina"
                                : "🏥 Presencial"}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-vitta-text-secondary mt-1.5">
                            <span className="font-bold text-vitta-text-primary bg-vitta-surface-2 border border-vitta-border px-2 py-0.5 rounded flex items-center gap-1">
                              <Calendar size={12} className="text-vitta-accent" />
                              {formatDateForDisplay(apt.date)} às {apt.time}
                            </span>
                            {/* Phone number if available */}
                            {apt.patientPhone && (
                              <span className="text-vitta-text-muted text-[11px]">
                                • {apt.patientPhone}
                              </span>
                            )}
                            {/* Email if available */}
                            {apt.patientEmail && (
                              <span className="text-vitta-text-muted text-[11px] hidden sm:inline">
                                • {apt.patientEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:self-center">
                        {/* Status badge */}
                        <div className="mr-2">
                          {apt.status === "completed" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-green-bg text-vitta-green border border-vitta-green/10">
                              ✓ Concluído
                            </span>
                          )}
                          {apt.status === "upcoming" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-accent-bg text-vitta-accent border border-vitta-accent/10">
                              ⏳ Confirmado
                            </span>
                          )}
                          {apt.status === "in_progress" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-green-bg text-vitta-green animate-pulse border border-vitta-green/20">
                              ● Em Atendimento
                            </span>
                          )}
                          {apt.status === "pending" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-amber-bg text-vitta-amber border border-vitta-amber/10">
                              ☕ Aguardando
                            </span>
                          )}
                          {apt.status === "cancelled" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-danger/10 text-vitta-danger border border-vitta-danger/10">
                              ✕ Cancelado
                            </span>
                          )}
                          {apt.status === "rejected" && (
                            <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-danger/10 text-vitta-danger border border-vitta-danger/10">
                              ✕ Rejeitado
                            </span>
                          )}
                        </div>

                        {/* View Clinical Record (Prontuário) button */}
                        {apt.status === "completed" && (
                          <button
                            onClick={() => handleOpenManualBookingForPatient(apt.userId, apt.patientName)}
                            className="px-3.5 py-2 bg-vitta-green/10 text-vitta-green hover:bg-vitta-green hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-vitta-green/20"
                            title="Agendar nova consulta / retorno para este paciente"
                          >
                            <CalendarPlus size={14} />
                            Agendar agora
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedApt(apt)}
                          className="px-3.5 py-2 bg-vitta-accent/10 text-vitta-accent hover:bg-vitta-accent hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Acessar Prontuário / Evolução Clínica"
                        >
                          <ClipboardList size={14} />
                          Prontuário
                        </button>

                        {/* View Patient Details button */}
                        <button
                          onClick={() =>
                            setSelectedPatient({
                              name: apt.patientName,
                              id: apt.userId,
                            })
                          }
                          className="p-2.5 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all"
                          title="Visualizar Ficha Completa do Paciente"
                        >
                          <User size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {subTab === "settings" && <ProfessionalAgendaSettingsView professional={professionalProfile} />}

      {subTab === "finance" && (
        overrideProfessionalId && !professionalProfile ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <ProfessionalFinanceView
            user={
              overrideProfessionalId
                ? { ...user, uid: professionalProfile?.userId || "no-linked-user" }
                : user
            }
            setActiveTab={setActiveTab}
          />
        )
      )}

      {subTab === "users" && <UsersView isAdmin={false} />}

      {/* Patient Details Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-4xl h-[85vh] md:h-[80vh] flex flex-col rounded-3xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-vitta-accent/10 text-vitta-accent rounded-xl">
                    <User size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-vitta-text-primary flex items-center gap-2">
                      Ficha Integrada do Paciente
                    </h3>
                    <p className="text-xs text-vitta-text-muted">
                      Acesso completo ao prontuário, receitas e atestados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-vitta-surface-3 rounded-xl transition-all"
                >
                  <X size={20} className="text-vitta-text-muted hover:text-vitta-text-primary" />
                </button>
              </div>

              {/* Patient Basic Info Strip */}
              <div className="px-6 py-4 bg-vitta-surface-2/50 border-b border-vitta-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-vitta-accent rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-md shadow-vitta-accent/15">
                    {selectedPatient.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-vitta-text-primary leading-tight">
                      {selectedPatient.name}
                    </h4>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-1 rounded-full text-[10px] font-extrabold bg-vitta-green-bg text-vitta-green border border-vitta-green/20">
                      <span className="w-1.5 h-1.5 bg-vitta-green rounded-full animate-ping" />
                      Paciente Ativo
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setPatientModalTab("info")}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      patientModalTab === "info"
                        ? "bg-vitta-accent text-white border-vitta-accent shadow-sm"
                        : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                    }`}
                  >
                    <User size={14} />
                    Ficha Cadastral
                  </button>
                  <button
                    onClick={() => setPatientModalTab("history")}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      patientModalTab === "history"
                        ? "bg-vitta-accent text-white border-vitta-accent shadow-sm"
                        : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                    }`}
                  >
                    <ClipboardList size={14} />
                    Prontuários & Consultas ({patientApts.length})
                  </button>
                  <button
                    onClick={() => setPatientModalTab("prescriptions")}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      patientModalTab === "prescriptions"
                        ? "bg-vitta-accent text-white border-vitta-accent shadow-sm"
                        : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                    }`}
                  >
                    <Pill size={14} />
                    Receitas ({patientApts.filter(a => a.prescriptions?.length > 0).length})
                  </button>
                  <button
                    onClick={() => setPatientModalTab("certificates")}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border ${
                      patientModalTab === "certificates"
                        ? "bg-vitta-accent text-white border-vitta-accent shadow-sm"
                        : "bg-vitta-surface border-vitta-border text-vitta-text-secondary hover:bg-vitta-surface-2"
                    }`}
                  >
                    <FileText size={14} />
                    Atestados ({patientApts.filter(a => a.hasCertificate).length})
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-vitta-surface">
                {loadingPatientDetails ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-vitta-accent/20 border-t-vitta-accent rounded-full animate-spin" />
                      <p className="text-xs text-vitta-text-muted font-bold">Carregando ficha completa...</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* INFO TAB */}
                    {patientModalTab === "info" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in-50 duration-200">
                        <div className="space-y-5">
                          <h5 className="text-xs font-black text-vitta-text-secondary uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-vitta-border">
                            👤 Identificação Geral
                          </h5>
                          
                          <div className="space-y-4">
                            <div>
                              <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Nome Completo</p>
                              <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary font-bold">
                                {patientDetails?.name || selectedPatient.name}
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">E-mail de Contato</p>
                              <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary">
                                {patientDetails?.email || "Não informado"}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">CPF</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary font-mono">
                                  {patientDetails?.cpf || "Não informado"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Telefone</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary">
                                  {patientDetails?.phone || "Não informado"}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Data de Nascimento</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary">
                                  {patientDetails?.birthDate || "Não informado"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Gênero</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm text-vitta-text-primary">
                                  {patientDetails?.gender || "Não informado"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <h5 className="text-xs font-black text-vitta-text-secondary uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-vitta-border">
                            🩺 Prontuário & Informações Clínicas
                          </h5>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Tipo Sanguíneo</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm font-bold text-vitta-accent">
                                  {patientDetails?.bloodType || "Não informado"}
                                </div>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Plano / Convênio</p>
                                <div className="px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm font-bold text-vitta-text-primary">
                                  {patientDetails?.planType || "Vitta Premium"}
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">Alergias Conhecidas</p>
                              <div className={`px-4 py-2.5 border rounded-xl text-sm font-bold ${
                                patientDetails?.allergies 
                                  ? "bg-vitta-danger/5 border-vitta-danger/25 text-vitta-danger"
                                  : "bg-vitta-surface-2 border-vitta-border text-vitta-text-secondary"
                              }`}>
                                {patientDetails?.allergies || "Nenhuma alergia conhecida relatada"}
                              </div>
                            </div>

                            <div className="p-4 bg-vitta-accent/5 rounded-2xl border border-vitta-accent/10 space-y-2">
                              <p className="text-xs font-bold text-vitta-accent uppercase tracking-wider flex items-center gap-1">
                                📊 Resumo de Atendimento
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="text-vitta-text-muted block">Consultas Realizadas:</span>
                                  <span className="font-bold text-vitta-text-primary text-sm">{patientApts.filter(a => a.status === "completed").length}</span>
                                </div>
                                <div>
                                  <span className="text-vitta-text-muted block">Prescrições Ativas:</span>
                                  <span className="font-bold text-vitta-text-primary text-sm">{patientApts.filter(a => a.prescriptions?.length > 0).length}</span>
                                </div>
                                <div>
                                  <span className="text-vitta-text-muted block">Atestados Emitidos:</span>
                                  <span className="font-bold text-vitta-text-primary text-sm">{patientApts.filter(a => a.hasCertificate).length}</span>
                                </div>
                                <div>
                                  <span className="text-vitta-text-muted block">Último Acesso:</span>
                                  <span className="font-bold text-vitta-text-primary text-sm">
                                    {patientApts[0]?.date ? formatDateForDisplay(patientApts[0].date) : "Nenhum"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CLINICAL HISTORY TAB */}
                    {patientModalTab === "history" && (
                      <div className="space-y-4 animate-in fade-in-50 duration-200">
                        <h5 className="text-xs font-black text-vitta-text-secondary uppercase tracking-widest pb-1 border-b border-vitta-border">
                          📋 Linha do Tempo e Evolução Clínica
                        </h5>

                        {patientApts.length === 0 ? (
                          <div className="p-8 text-center bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                            <ClipboardList className="mx-auto text-vitta-text-muted mb-2 opacity-55" size={32} />
                            <p className="text-sm font-bold text-vitta-text-secondary">Nenhuma consulta registrada</p>
                            <p className="text-xs text-vitta-text-muted mt-1">Este paciente ainda não possui consultas finalizadas ou agendadas.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {patientApts.map((apt) => (
                              <div key={apt.id} className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl flex flex-col gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vitta-border/50 pb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-vitta-surface-3 border border-vitta-border rounded-xl text-vitta-text-secondary">
                                      <Calendar size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-vitta-text-primary">
                                        Consulta em {formatDateForDisplay(apt.date)} às {apt.time}
                                      </p>
                                      <p className="text-xs text-vitta-text-muted">
                                        Modalidade: {apt.modality === "telemedicine" ? "💻 Telemedicina" : "🏥 Presencial"}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    {apt.status === "completed" && (
                                      <>
                                        <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-green-bg text-vitta-green border border-vitta-green/20">
                                          ✓ Concluída
                                        </span>
                                        <button
                                          onClick={() => {
                                            setSelectedPatient(null);
                                            handleOpenManualBookingForPatient(apt.userId, apt.patientName);
                                          }}
                                          className="px-3 py-1 bg-vitta-accent text-white hover:opacity-95 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm shadow-vitta-accent/15"
                                          title="Agendar retorno de consulta para este paciente"
                                        >
                                          <CalendarPlus size={12} />
                                          Agendar agora
                                        </button>
                                      </>
                                    )}
                                    {apt.status === "upcoming" && (
                                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-accent-bg text-vitta-accent border border-vitta-accent/20">
                                        ⏳ Confirmada
                                      </span>
                                    )}
                                    {apt.status === "in_progress" && (
                                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-green-bg text-vitta-green border border-vitta-green/20 animate-pulse">
                                        ● Em Atendimento
                                      </span>
                                    )}
                                    {apt.status === "pending" && (
                                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-amber-bg text-vitta-amber border border-vitta-amber/20">
                                        ☕ Aguardando
                                      </span>
                                    )}
                                    {apt.status === "cancelled" && (
                                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-vitta-danger/10 text-vitta-danger border border-vitta-danger/25">
                                        ✕ Cancelada
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Anamnesis / Evolution section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3.5 bg-vitta-surface rounded-xl border border-vitta-border/85 space-y-1.5">
                                    <p className="text-[10px] font-extrabold text-vitta-text-secondary uppercase tracking-wider">
                                      🧠 Anamnese / Queixa Principal
                                    </p>
                                    <p className="text-xs text-vitta-text-primary leading-relaxed whitespace-pre-line">
                                      {apt.anamnesis || "Nenhum dado de anamnese registrado nesta consulta."}
                                    </p>
                                  </div>

                                  <div className="p-3.5 bg-vitta-surface rounded-xl border border-vitta-border/85 space-y-1.5">
                                    <p className="text-[10px] font-extrabold text-vitta-text-secondary uppercase tracking-wider">
                                      📝 Diagnóstico & Evolução Clínica
                                    </p>
                                    <p className="text-xs text-vitta-text-primary leading-relaxed whitespace-pre-line">
                                      {apt.clinicalNotes || "Nenhuma anotação de evolução clínica registrada."}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* PRESCRIPTIONS TAB */}
                    {patientModalTab === "prescriptions" && (
                      <div className="space-y-4 animate-in fade-in-50 duration-200">
                        <h5 className="text-xs font-black text-vitta-text-secondary uppercase tracking-widest pb-1 border-b border-vitta-border">
                          💊 Histórico de Receitas Emitidas
                        </h5>

                        {patientApts.filter(a => a.prescriptions?.length > 0).length === 0 ? (
                          <div className="p-8 text-center bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                            <Pill className="mx-auto text-vitta-text-muted mb-2 opacity-55" size={32} />
                            <p className="text-sm font-bold text-vitta-text-secondary">Nenhuma receita prescrita</p>
                            <p className="text-xs text-vitta-text-muted mt-1">Este paciente ainda não recebeu receitas farmacológicas digitais.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {patientApts.filter(a => a.prescriptions?.length > 0).map((apt) => (
                              <div key={apt.id} className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-vitta-border pb-3">
                                  <div>
                                    <p className="text-xs font-black text-vitta-accent uppercase tracking-wider">
                                      Receita Digital
                                    </p>
                                    <p className="text-sm font-bold text-vitta-text-primary">
                                      Emitida em {formatDateForDisplay(apt.date)}
                                    </p>
                                  </div>
                                  
                                  <button
                                    onClick={() => downloadPatientPrescriptionPDF(apt)}
                                    className="px-3.5 py-1.5 bg-vitta-accent text-white text-xs font-bold rounded-xl hover:bg-vitta-accent/90 transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Download size={13} />
                                    Exportar Receita (PDF)
                                  </button>
                                </div>

                                <div className="space-y-3">
                                  {apt.prescriptions.map((p: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-vitta-surface rounded-xl border border-vitta-border flex items-start gap-3">
                                      <div className="p-2 bg-vitta-accent-bg text-vitta-accent rounded-xl">
                                        <Pill size={14} />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-sm font-bold text-vitta-text-primary">
                                          {p.medicine}
                                        </p>
                                        <p className="text-xs text-vitta-text-secondary">
                                          <span className="font-extrabold text-vitta-text-muted uppercase text-[9px] tracking-wider block">Dosagem</span>
                                          {p.dosage || "Não informado"}
                                        </p>
                                        <p className="text-xs text-vitta-text-secondary">
                                          <span className="font-extrabold text-vitta-text-muted uppercase text-[9px] tracking-wider block">Instruções de Uso</span>
                                          {p.instructions || "Não informado"}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* CERTIFICATES TAB */}
                    {patientModalTab === "certificates" && (
                      <div className="space-y-4 animate-in fade-in-50 duration-200">
                        <h5 className="text-xs font-black text-vitta-text-secondary uppercase tracking-widest pb-1 border-b border-vitta-border">
                          📄 Histórico de Atestados Emitidos
                        </h5>

                        {patientApts.filter(a => a.hasCertificate).length === 0 ? (
                          <div className="p-8 text-center bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                            <FileText className="mx-auto text-vitta-text-muted mb-2 opacity-55" size={32} />
                            <p className="text-sm font-bold text-vitta-text-secondary">Nenhum atestado emitido</p>
                            <p className="text-xs text-vitta-text-muted mt-1">Nenhum atestado médico foi emitido para este paciente.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {patientApts.filter(a => a.hasCertificate).map((apt) => (
                              <div key={apt.id} className="p-5 bg-vitta-surface-2 border border-vitta-border rounded-2xl space-y-4">
                                <div className="flex items-center justify-between border-b border-vitta-border pb-3">
                                  <div>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-vitta-accent-bg text-vitta-accent border border-vitta-accent/15 uppercase">
                                      {apt.certificateType === "comparecimento" ? "🏥 Comparecimento" : apt.certificateType === "aptidao" ? "💪 Aptidão Física" : "🏡 Repouso"}
                                    </span>
                                    <p className="text-sm font-bold text-vitta-text-primary mt-1">
                                      Emitido em {formatDateForDisplay(apt.date)}
                                    </p>
                                  </div>

                                  <button
                                    onClick={() => downloadPatientCertificatePDF(apt)}
                                    className="px-3.5 py-1.5 bg-vitta-accent text-white text-xs font-bold rounded-xl hover:bg-vitta-accent/90 transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <Download size={13} />
                                    Exportar Atestado (PDF)
                                  </button>
                                </div>

                                <div className="p-4 bg-vitta-surface rounded-xl border border-vitta-border space-y-3">
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    {apt.certificateType === "repouso" || !apt.certificateType ? (
                                      <div>
                                        <span className="text-vitta-text-muted block">Duração do Repouso:</span>
                                        <span className="font-bold text-vitta-text-primary">{apt.certificateDays || 1} dia(s)</span>
                                      </div>
                                    ) : null}

                                    {apt.certificateType === "comparecimento" ? (
                                      <div>
                                        <span className="text-vitta-text-muted block">Período registrado:</span>
                                        <span className="font-bold text-vitta-text-primary">
                                          {apt.certificateStartTime || apt.time || "09:00"} {apt.certificateEndTime ? `às ${apt.certificateEndTime}` : ""}
                                        </span>
                                      </div>
                                    ) : null}

                                    <div>
                                      <span className="text-vitta-text-muted block">Data de Início:</span>
                                      <span className="font-bold text-vitta-text-primary">
                                        {apt.certificateStartDate ? formatDateForDisplay(apt.certificateStartDate) : formatDateForDisplay(apt.date)}
                                      </span>
                                    </div>

                                    {apt.certificateCid && (apt.certificateCidConsent !== false) ? (
                                      <div>
                                        <span className="text-vitta-text-muted block">CID-10 Informado:</span>
                                        <span className="font-bold text-vitta-text-primary">{apt.certificateCid}</span>
                                      </div>
                                    ) : null}
                                  </div>

                                  {apt.certificateReason && (
                                    <div className="pt-2 border-t border-vitta-border/50">
                                      <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">Observações / Motivos:</span>
                                      <p className="text-xs text-vitta-text-secondary mt-0.5 whitespace-pre-line">{apt.certificateReason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-vitta-border bg-vitta-surface-2 flex items-center justify-between gap-4">
                <p className="text-[10px] text-vitta-text-muted">
                  Registro sincronizado de forma segura com o prontuário eletrônico.
                </p>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="px-6 py-2.5 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all shadow-md shadow-vitta-accent/15"
                >
                  Fechar Ficha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContentManagerView = () => {
  const [radioUrl, setRadioUrl] = useState("");
  const [currentShow, setCurrentShow] = useState("Música ViTTA");
  const [upNextMessage, setUpNextMessage] = useState(
    "A seguir: Dicas de Saúde",
  );
  const [isSavingRadio, setIsSavingRadio] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "config", "radio"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRadioUrl(data.url || "");
        setCurrentShow(data.currentShow || "");
        setUpNextMessage(data.upNextMessage || "");
      }
    });

    const unsubBanners = onSnapshot(
      doc(db, "config", "hero_banners"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBanners(data.items || []);
        }
      },
    );

    return () => {
      unsub();
      unsubBanners();
    };
  }, []);

  const handleSaveRadio = async () => {
    setIsSavingRadio(true);
    try {
      await setDoc(
        doc(db, "config", "radio"),
        { url: radioUrl, currentShow, upNextMessage },
        { merge: true },
      );
      await logAdminAction(
        "UPDATE_RADIO_CONFIG",
        `Atualizou informações da rádio`,
      );
      addToast("Configurações da rádio salvas!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "config/radio");
      addToast("Erro ao salvar config da rádio.", "error");
    } finally {
      setIsSavingRadio(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadWithProgress = (
      file: File,
      path: string,
      key: string,
    ): Promise<string> => {
      return new Promise((resolve, reject) => {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => getDownloadURL(uploadTask.snapshot.ref).then(resolve),
        );
      });
    };

    setIsUploadingBanner(true);
    try {
      let url = "";
      try {
        url = await uploadWithProgress(
          file,
          `banners/${Date.now()}_${file.name}`,
          "image",
        );
      } catch (storageErr) {
        console.warn("Banner storage upload failed, falling back to data URL:", storageErr);
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(file);
        });
      }
      const newBanner = {
        id: Date.now().toString(),
        imageUrl: url,
        title: "",
        link: "",
        order: banners.length,
      };
      const updatedBanners = [...banners, newBanner];
      await setDoc(
        doc(db, "config", "hero_banners"),
        { items: updatedBanners },
        { merge: true },
      );
      await logAdminAction("CREATE_BANNER", `Adicionou um novo banner`);
      addToast("Banner adicionado com sucesso", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao enviar banner", "error");
    } finally {
      setIsUploadingBanner(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    const updatedBanners = banners.filter((b) => b.id !== bannerId);
    try {
      await setDoc(
        doc(db, "config", "hero_banners"),
        { items: updatedBanners },
        { merge: true },
      );
      await logAdminAction("DELETE_BANNER", `Removeu o banner ${bannerId}`);
      addToast("Banner removido.", "success");
    } catch (err) {
      addToast("Erro ao remover banner.", "error");
    }
  };

  const handleUpdateBanner = async (
    bannerId: string,
    field: string,
    value: string,
  ) => {
    const updatedBanners = banners.map((b) =>
      b.id === bannerId ? { ...b, [field]: value } : b,
    );
    try {
      await setDoc(
        doc(db, "config", "hero_banners"),
        { items: updatedBanners },
        { merge: true },
      );
    } catch (err) {
      addToast("Erro ao atualizar banner.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-vitta-accent-bg rounded-2xl text-vitta-accent shadow-sm">
          <MonitorPlay size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-vitta-text-primary">
            Gestor de Conteúdo
          </h2>
          <p className="text-vitta-text-secondary text-sm">
            Gerencie a Rádio ViTTA e os Banners do Aplicativo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Radio size={20} className="text-vitta-accent" />
            <h3 className="font-bold text-lg text-vitta-text-primary">
              Configurações da Rádio
            </h3>
          </div>
          <div className="space-y-4 flex-1">
            <div>
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                URL da Transmissão
              </label>
              <input
                type="text"
                value={radioUrl}
                onChange={(e) => setRadioUrl(e.target.value)}
                placeholder="https://icecast..."
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                Em Exibição
              </label>
              <input
                type="text"
                value={currentShow}
                onChange={(e) => setCurrentShow(e.target.value)}
                placeholder="Ex: Música ViTTA"
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                A Seguir
              </label>
              <input
                type="text"
                value={upNextMessage}
                onChange={(e) => setUpNextMessage(e.target.value)}
                placeholder="Ex: A seguir: Dicas de Saúde"
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-1 focus:ring-vitta-accent transition-all text-vitta-text-primary"
              />
            </div>
          </div>
          <button
            onClick={handleSaveRadio}
            disabled={isSavingRadio}
            className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all disabled:opacity-50 mt-6"
          >
            {isSavingRadio ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>

        <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Images size={20} className="text-vitta-blue" />
              <h3 className="font-bold text-lg text-vitta-text-primary">
                Hero Banners
              </h3>
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUploadBanner}
                className="hidden"
                accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="px-4 py-2 bg-vitta-blue/10 text-vitta-blue hover:bg-vitta-blue hover:text-white rounded-lg text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isUploadingBanner ? (
                  "Enviando..."
                ) : (
                  <>
                    <Plus size={16} /> Adicionar Banner
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4 flex-1 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {banners.length === 0 ? (
              <div className="text-center py-10 text-vitta-text-muted bg-vitta-surface-2 rounded-2xl border border-dashed border-vitta-border">
                <Images className="mx-auto mb-2 opacity-50" size={32} />
                <p className="text-sm">Nenhum banner cadastrado.</p>
              </div>
            ) : (
              banners
                .sort((a, b) => a.order - b.order)
                .map((banner, index) => (
                  <div
                    key={banner.id}
                    className="flex flex-col sm:flex-row gap-4 p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border relative group"
                  >
                    <div className="w-full sm:w-32 h-20 rounded-xl overflow-hidden bg-vitta-surface shrink-0 relative">
                      <img
                        src={banner.imageUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={banner.title}
                        onChange={(e) =>
                          handleUpdateBanner(banner.id, "title", e.target.value)
                        }
                        placeholder="Título (Opcional)"
                        className="w-full bg-transparent border-b border-vitta-border px-1 py-1 text-sm text-vitta-text-primary focus:border-vitta-accent outline-none font-bold"
                      />
                      <input
                        type="text"
                        value={banner.link}
                        onChange={(e) =>
                          handleUpdateBanner(banner.id, "link", e.target.value)
                        }
                        placeholder="Link de Destino (Opcional)"
                        className="w-full bg-transparent border-b border-vitta-border px-1 py-1 text-xs text-vitta-text-secondary focus:border-vitta-accent outline-none"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm shadow-sm rounded-lg text-vitta-danger hover:bg-vitta-danger hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminView = ({ user, userData }: { user: any; userData?: any }) => {
  const { addToast } = useToast();
  const [subTab, setSubTab] = useState<
    | "overview"
    | "analytics"
    | "users"
    | "partnerships"
    | "professionals"
    | "exams"
    | "user-exams"
    | "offers"
    | "config"
    | "chat"
    | "transactions"
    | "wallet-management"
    | "appointments"
    | "deletion-requests"
    | "audit-logs"
    | "subscriptions"
    | "content"
    | "medical-panel"
    | "vouchers-management"
    | "liberal-config"
  >("overview");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [allProfessionalsForAdmin, setAllProfessionalsForAdmin] = useState<any[]>([]);
  const [selectedAdminProfId, setSelectedAdminProfId] = useState<string>("");

  useEffect(() => {
    const q = query(collection(db, "professionals"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllProfessionalsForAdmin(list);
        if (list.length > 0 && !selectedAdminProfId) {
          setSelectedAdminProfId(list[0].id);
        }
      },
      (error) => {
        console.error("Erro ao carregar todos os profissionais:", error);
      }
    );
    return () => unsubscribe();
  }, [selectedAdminProfId]);

  const [editingApt, setEditingApt] = useState<any>(null);
  const [bookingProfessional, setBookingProfessional] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: "danger" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info",
  });

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const unsubscribeApts = onSnapshot(
      q,
      (snapshot) => {
        setAppointments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
      },
    );
    const unsubscribeProfs = onSnapshot(
      query(collection(db, "professionals"), limit(5)),
      (snapshot) => {
        setProfessionals(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "professionals");
      },
    );
    const unsubscribePartners = onSnapshot(
      query(collection(db, "partners"), limit(5)),
      (snapshot) => {
        setPartners(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "partners");
      },
    );
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsersCount(snapshot.size);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      },
    );
    return () => {
      unsubscribeApts();
      unsubscribeProfs();
      unsubscribePartners();
      unsubscribeUsers();
    };
  }, []);

  const handleDeleteApt = (apt: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancelar Consulta",
      message: `Tem certeza que deseja cancelar a consulta de ${apt.userName || "Usuário"} com ${apt.professionalName}? Esta ação notificará o paciente.`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "appointments", apt.id));

          if (apt.userId) {
            await addDoc(collection(db, "notifications"), {
              userId: apt.userId,
              title: "Consulta Cancelada",
              message: `Sua consulta com ${apt.professionalName} foi cancelada pelo administrador.`,
              type: "appointment",
              read: false,
              createdAt: Timestamp.now(),
            });
          }

          await logAdminAction(
            "CANCEL_APPOINTMENT",
            `Cancelou agendamento ID: ${apt.id} de ${apt.professionalName}`,
            apt,
            null,
          );
          addToast("Agendamento cancelado com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir agendamento:", err);
          addToast("Erro ao cancelar agendamento.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveReschedule = async (newDate: string, newTime: string, newModality?: string) => {
    if (!editingApt) return;
    try {
      const oldData = { ...editingApt };
      const newData = {
        date: newDate,
        time: newTime,
        ...(newModality ? { modality: newModality } : {}),
        updatedAt: Timestamp.now(),
      };
      await updateDoc(doc(db, "appointments", editingApt.id), newData);

      // Notify user about rescheduling
      if (editingApt.userId) {
        const modLabel = newModality === "presencial" ? "Presencial" : "Telemedicina";
        await addDoc(collection(db, "notifications"), {
          userId: editingApt.userId,
          title: "Consulta Remarcada",
          message: `Sua consulta com ${editingApt.professionalName} foi remarcada pelo administrador para ${formatDateForDisplay(newDate)} às ${newTime} (${modLabel}).`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      await logAdminAction(
        "RESCHEDULE_APPOINTMENT",
        `Remarcou agendamento ID: ${editingApt.id} para ${newDate} ${newTime}${newModality ? " (" + newModality + ")" : ""}`,
        oldData,
        { ...oldData, ...newData },
      );
      setEditingApt(null);
      addToast("Agendamento remarcado com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao salvar agendamento:", err);
      addToast("Erro ao remarcar agendamento.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {editingApt && (
          <RescheduleModal
            appointment={editingApt}
            onClose={() => setEditingApt(null)}
            onConfirm={handleSaveReschedule}
          />
        )}
        <BookingModal
          isOpen={!!bookingProfessional}
          onClose={() => setBookingProfessional(null)}
          professional={bookingProfessional}
          user={user}
          userData={{ name: "Admin (Tele-agendamento)" }}
        />
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-vitta-text-primary">
            Painel Administrativo
          </h1>
          <p className="text-vitta-text-secondary">
            Gestão centralizada do ecossistema ViTTA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 border-b border-vitta-border pb-4">
        <button
          onClick={() => setSubTab("overview")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "overview"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <LayoutGrid size={18} />
          Visão Geral
        </button>
        <button
          onClick={() => setSubTab("analytics")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "analytics"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <TrendingUp size={18} />
          Analytics
        </button>
        <button
          onClick={() => setSubTab("appointments")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "appointments"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Calendar size={18} />
          Agendamentos
        </button>
        <button
          onClick={() => setSubTab("medical-panel")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "medical-panel"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Stethoscope size={18} />
          Painel Médico
        </button>
        <button
          onClick={() => setSubTab("users")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "users"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Users size={18} />
          Usuários
        </button>
        <button
          onClick={() => setSubTab("partnerships")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "partnerships"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Store size={18} />
          Convênios
        </button>
        <button
          onClick={() => setSubTab("professionals")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "professionals"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Stethoscope size={18} />
          Profissionais
        </button>
        <button
          onClick={() => setSubTab("exams")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "exams"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <FileText size={18} />
          Tipos de Exames
        </button>
        <button
          onClick={() => setSubTab("user-exams")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "user-exams"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <ClipboardList size={18} />
          Exames de Usuários
        </button>
        <button
          onClick={() => setSubTab("transactions")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "transactions"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <DollarSign size={18} />
          Financeiro
        </button>
        <button
          onClick={() => setSubTab("wallet-management")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "wallet-management"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Wallet size={18} />
          Gestão de Carteiras
        </button>
        <button
          onClick={() => setSubTab("subscriptions")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "subscriptions"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <CreditCard size={18} />
          Assinaturas
        </button>
        <button
          onClick={() => setSubTab("chat")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "chat"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <MessageSquare size={18} />
          Suporte
        </button>
        <button
          onClick={() => setSubTab("audit-logs")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "audit-logs"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Activity size={18} />
          Auditoria
        </button>
        <button
          onClick={() => setSubTab("deletion-requests")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "deletion-requests"
              ? "bg-vitta-danger text-white shadow-lg shadow-vitta-danger/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <UserX size={18} />
          LGPD
        </button>
        <button
          onClick={() => setSubTab("config")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "config"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Settings size={18} />
          Ajustes
        </button>
        <button
          onClick={() => setSubTab("content")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "content"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <MonitorPlay size={18} />
          Conteúdo
        </button>
        <button
          onClick={() => setSubTab("vouchers-management")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "vouchers-management"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Ticket size={18} />
          Gestão de Vouchers
        </button>
        <button
          onClick={() => setSubTab("liberal-config")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "liberal-config"
              ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
              : "bg-vitta-surface-2 text-vitta-text-secondary hover:text-vitta-text-primary border border-vitta-border"
          }`}
        >
          <Briefcase size={18} />
          Profissionais Liberais
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
          {subTab === "overview" && (
            <div className="space-y-10">
              {/* Welcome Section */}
              <section>
                <h2 className="text-2xl font-bold mb-2 text-vitta-text-primary">
                  Olá, Administrador! 👋
                </h2>
                <p className="text-vitta-text-secondary">
                  Aqui está o resumo do sistema hoje.
                </p>
              </section>

              {/* Stats Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                  {
                    label: "Total de Usuários",
                    value: usersCount.toString(),
                    unit: "usuários",
                    icon: User,
                    color: "blue",
                  },
                  {
                    label: "Agendamentos",
                    value: appointments.length.toString(),
                    unit: "consultas",
                    icon: Calendar,
                    color: "emerald",
                  },
                  {
                    label: "Profissionais",
                    value: professionals.length.toString(),
                    unit: "ativos",
                    icon: Stethoscope,
                    color: "purple",
                  },
                  {
                    label: "Parceiros",
                    value: partners.length.toString(),
                    unit: "empresas",
                    icon: ShieldCheck,
                    color: "amber",
                  },
                  {
                    label: "Assinaturas",
                    value: "12",
                    unit: "recidivas",
                    icon: CreditCard,
                    color: "indigo",
                  },
                ].map((stat, idx) => (
                  <StatCard key={idx} stat={stat} />
                ))}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Appointments Section */}
                <section className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-vitta-text-primary">
                      Próximas Consultas
                    </h2>
                    <button
                      onClick={() => setSubTab("appointments")}
                      className="text-vitta-accent text-sm font-bold hover:underline"
                    >
                      Ver todas
                    </button>
                  </div>
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <motion.div
                        key={apt.id}
                        whileHover={{ x: 4 }}
                        className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex items-center gap-4 group"
                      >
                        <img
                          src={apt.imageUrl || "https://picsum.photos/seed/prof/100/100"}
                          alt={apt.professionalName}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-vitta-text-primary">
                            {apt.professionalName}
                          </h3>
                          <p className="text-sm text-vitta-text-secondary">
                            {apt.specialty}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 text-vitta-text-primary font-medium text-sm mb-1">
                            <Calendar size={14} className="text-vitta-green" />
                            {formatDateForDisplay(apt.date, {
                              day: "2-digit",
                              month: "short",
                            })}
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
                    <h2 className="text-xl font-bold text-vitta-text-primary">
                      Profissionais
                    </h2>
                    <button
                      onClick={() => setSubTab("professionals")}
                      className="text-vitta-green text-sm font-bold hover:underline"
                    >
                      Explorar
                    </button>
                  </div>
                  <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
                    {professionals.filter((p) => p.isApproved !== false).length > 0 ? (
                      professionals.filter((p) => p.isApproved !== false).map((prof, idx) => (
                        <div
                          key={prof.id}
                          className={`p-4 flex items-center gap-3 ${idx !== professionals.length - 1 ? "border-b border-vitta-border" : ""}`}
                        >
                          <img
                            src={prof.imageUrl || "https://picsum.photos/seed/doc/100/100"}
                            alt={prof.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm truncate text-vitta-text-primary">
                              {prof.name}
                            </h4>
                            <p className="text-xs text-vitta-text-secondary">
                              {prof.specialty}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 text-vitta-amber">
                            <Star size={14} fill="currentColor" />
                            <span className="text-xs font-bold">
                              {prof.rating}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-vitta-text-muted text-sm">
                        Nenhum profissional cadastrado
                      </div>
                    )}
                    <div className="p-4 bg-vitta-surface-2">
                      <button
                        onClick={() => setSubTab("professionals")}
                        className="w-full py-2.5 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors shadow-lg shadow-vitta-green/20"
                      >
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
                    <h2 className="text-xl font-bold text-vitta-text-primary">
                      Benefícios Exclusivos
                    </h2>
                    <p className="text-sm text-vitta-text-secondary">
                      Ofertas de parceiros selecionados para você.
                    </p>
                  </div>
                  <button
                    onClick={() => setSubTab("partnerships")}
                    className="text-vitta-accent text-sm font-bold hover:underline"
                  >
                    Ver todos
                  </button>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 lg:-mx-10 lg:px-10">
                  {partners.length > 0 ? (
                    partners.map((offer) => (
                      <motion.div
                        key={offer.id}
                        whileHover={{ scale: 1.02 }}
                        className="flex-shrink-0 w-80 bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden"
                      >
                        <div className="relative h-40">
                          <img
                            src={offer.imageUrl || "https://picsum.photos/seed/partner/100/100"}
                            alt={offer.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 left-3 bg-vitta-surface/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-vitta-text-secondary">
                            {offer.category}
                          </div>
                          <div className="absolute bottom-3 right-3 bg-vitta-green text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            {offer.discount}
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="font-bold text-lg mb-1 text-vitta-text-primary">
                            {offer.name}
                          </h3>
                          <p className="text-sm text-vitta-text-secondary line-clamp-2 mb-4">
                            {offer.description ||
                              "Aproveite esta oferta exclusiva."}
                          </p>
                          <button
                            onClick={() =>
                              addToast(
                                "Benefício resgatado com sucesso! Apresente este código no estabelecimento: VITTA-" +
                                  Math.random()
                                    .toString(36)
                                    .substring(7)
                                    .toUpperCase(),
                                "success",
                              )
                            }
                            className="w-full py-2 bg-vitta-surface-2 text-vitta-text-primary rounded-xl text-sm font-bold hover:bg-vitta-border transition-colors"
                          >
                            Resgatar Benefício
                          </button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="w-full p-8 text-center text-vitta-text-muted text-sm">
                      Nenhum parceiro cadastrado
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
          {subTab === "analytics" && <AdminAnalytics />}
          {subTab === "users" && <UsersView isAdmin={true} />}
          {subTab === "medical-panel" && (
            <div className="space-y-6">
              <div className="bg-vitta-surface-2 border border-vitta-border rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-vitta-text-primary flex items-center gap-2">
                    🩺 Visualização do Painel Médico
                  </h3>
                  <p className="text-xs text-vitta-text-secondary mt-1">
                    Como Admin Master, você pode selecionar e gerenciar o perfil, a agenda, os turnos de atendimento e as finanças de qualquer profissional de saúde cadastrado na ViTTA.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <span className="text-xs font-bold text-vitta-text-secondary whitespace-nowrap font-sans">
                    Selecionar Profissional:
                  </span>
                  <select
                    value={selectedAdminProfId}
                    onChange={(e) => setSelectedAdminProfId(e.target.value)}
                    className="px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary min-w-[220px]"
                  >
                    <option value="">Selecione...</option>
                    {allProfessionalsForAdmin.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.name} ({prof.specialty})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedAdminProfId ? (
                <div className="border border-vitta-border rounded-3xl p-1 bg-vitta-surface-2">
                  <ProfessionalDashboardView
                    user={user}
                    setActiveTelemedicineApt={() => {}}
                    overrideProfessionalId={selectedAdminProfId}
                  />
                </div>
              ) : (
                <div className="p-10 text-center bg-vitta-surface border border-dashed border-vitta-border/60 rounded-2xl space-y-3">
                  <Stethoscope className="mx-auto text-vitta-text-muted animate-pulse" size={40} />
                  <h4 className="font-bold text-vitta-text-primary">Nenhum Profissional Selecionado</h4>
                  <p className="text-xs text-vitta-text-secondary max-w-sm mx-auto">
                    Por favor, selecione um profissional do menu para visualizar ou alterar suas agendas.
                  </p>
                </div>
              )}
            </div>
          )}
          {subTab === "deletion-requests" && <AdminDeletionRequestsView />}
          {subTab === "partnerships" && (
            <PartnershipsView setSubTab={setSubTab} user={user} userData={userData} />
          )}
          {subTab === "professionals" && <ProfessionalsManagementView />}
          {subTab === "exams" && <ExamsManagementView />}
          {subTab === "user-exams" && <UserExamsManagementView user={user} userData={userData} />}
          {subTab === "appointments" && <AdminAppointmentsView />}
          {subTab === "config" && <UserConfigView />}
          {subTab === "content" && <ContentManagerView />}
          {subTab === "chat" && <AdminSupportChatView adminUser={user} />}
          {subTab === "transactions" && <AdminFinancialView adminUser={user} />}
          {subTab === "wallet-management" && <AdminWalletManagementView />}
          {subTab === "audit-logs" && <AuditLogsList />}
          {subTab === "subscriptions" && <SubscriptionManagementView />}
          {subTab === "vouchers-management" && <AdminVoucherManagementView />}
          {subTab === "liberal-config" && <AdminLiberalConfigView />}
        </motion.div>
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />
    </div>
  );
};

// ExamsView is imported from ./components/Patient/ExamsView

const AvailabilityPlannerModal = ({ isOpen, onClose, professional }: any) => {
  const [schedule, setSchedule] = useState<{
    weekly: Record<string, Array<{ start: string; end: string }>>;
    blockedDates: string[];
  }>(professional.schedule || { weekly: {}, blockedDates: [] });
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) {
      addToast("Selecione uma data para marcar como folga global.", "warning");
      return;
    }
    const currentBlocked = schedule.blockedDates || [];
    if (currentBlocked.includes(newBlockedDate)) {
      addToast("Esta data já está bloqueada como folga global.", "warning");
      return;
    }
    const updatedBlocked = [...currentBlocked, newBlockedDate].sort();
    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
    });
    setNewBlockedDate("");
    addToast(`Data ${formatDateForDisplay(newBlockedDate)} marcada como folga global.`, "info");
  };

  const handleRemoveBlockedDate = (dateToRemove: string) => {
    const updatedBlocked = (schedule.blockedDates || []).filter((d) => d !== dateToRemove);
    setSchedule({
      ...schedule,
      blockedDates: updatedBlocked,
    });
    addToast(`Folga da data ${formatDateForDisplay(dateToRemove)} removida.`, "info");
  };

  const handleAddSlot = (day: string) => {
    const currentDaySchedule = schedule.weekly[day] || [];
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: [...currentDaySchedule, { start: "08:00", end: "12:00" }],
      },
    });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule.splice(index, 1);
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleUpdateSlot = (
    day: string,
    index: number,
    field: "start" | "end",
    value: string,
  ) => {
    const currentDaySchedule = [...(schedule.weekly[day] || [])];
    currentDaySchedule[index] = {
      ...currentDaySchedule[index],
      [field]: value,
    };
    setSchedule({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: currentDaySchedule,
      },
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "professionals", professional.id), {
        schedule: schedule,
      });
      await logAdminAction(
        "UPDATE_PROFESSIONAL_AGENDA",
        `Atualizou a agenda do profissional: ${professional.name}`,
      );
      addToast("Agenda atualizada com sucesso.", "success");
      onClose();
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar agenda.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-vitta-accent-bg rounded-xl text-vitta-accent">
              <CalendarClock size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Configurar Agenda
              </h3>
              <p className="text-xs text-vitta-text-secondary">
                {professional.name} - {professional.specialty}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-vitta-text-primary flex items-center gap-2">
              <Clock size={16} className="text-vitta-accent" />
              Horários Semanais
            </h4>
            <div className="space-y-3">
              {Object.entries({
                monday: "Segunda-feira",
                tuesday: "Terça-feira",
                wednesday: "Quarta-feira",
                thursday: "Quinta-feira",
                friday: "Sexta-feira",
                saturday: "Sábado",
                sunday: "Domingo",
              }).map(([key, label]) => (
                <div
                  key={key}
                  className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-vitta-text-primary">
                      {label}
                    </span>
                    <button
                      onClick={() => handleAddSlot(key)}
                      className="text-[10px] font-bold text-vitta-accent hover:underline flex items-center gap-1"
                    >
                      <PlusCircle size={14} />
                      Adicionar Turno
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(schedule.weekly[key] || []).map((slot, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1"
                      >
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) =>
                              handleUpdateSlot(
                                key,
                                idx,
                                "start",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30"
                          />
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) =>
                              handleUpdateSlot(key, idx, "end", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-vitta-surface border border-vitta-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-vitta-accent/30"
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveSlot(key, idx)}
                          className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                        >
                          <MinusCircle size={18} />
                        </button>
                      </div>
                    ))}
                    {(!schedule.weekly[key] ||
                      schedule.weekly[key].length === 0) && (
                      <p className="text-[10px] text-vitta-text-muted italic">
                        Indisponível neste dia
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção de Bloqueios e Folgas Globais */}
          <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-vitta-text-primary flex items-center gap-2">
                <CalendarX size={16} className="text-vitta-danger" />
                Dias de Folga Global (Férias / Feriados)
              </h4>
              {schedule.blockedDates && schedule.blockedDates.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-vitta-danger/10 text-vitta-danger rounded-md border border-vitta-danger/20">
                  {schedule.blockedDates.length} {schedule.blockedDates.length === 1 ? "dia" : "dias"}
                </span>
              )}
            </div>
            <p className="text-xs text-vitta-text-secondary leading-relaxed">
              Datas em que qualquer agendamento com este profissional será bloqueado automaticamente.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 px-3 py-2 bg-vitta-surface border border-vitta-border rounded-xl text-xs font-medium outline-none focus:ring-1 focus:ring-vitta-accent/30 text-vitta-text-primary"
              />
              <button
                type="button"
                onClick={handleAddBlockedDate}
                className="px-3 py-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 border border-vitta-danger/20"
              >
                <Plus size={14} />
                Marcar Folga
              </button>
            </div>

            {schedule.blockedDates && schedule.blockedDates.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto pr-1 no-scrollbar">
                {schedule.blockedDates.map((blockedDate) => (
                  <div
                    key={blockedDate}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-vitta-surface border border-vitta-danger/30 rounded-lg text-xs font-bold text-vitta-text-primary"
                  >
                    <CalendarX size={13} className="text-vitta-danger shrink-0" />
                    <span>{formatDateForDisplay(blockedDate)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedDate(blockedDate)}
                      className="ml-1 p-0.5 text-vitta-text-muted hover:text-vitta-danger rounded"
                      title="Remover folga"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-vitta-text-muted italic">
                Nenhum dia de folga global cadastrado.
              </p>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-vitta-border bg-vitta-surface-2 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-vitta-surface text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={20} />
                Salvar Agenda
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};



// Component aliases for AdminView
const PartnershipsView = ({ setSubTab, user, userData }: any) => <PartnershipManager />;
const ExamsManagementView = () => <ExamsView user={null} />;
const UserExamsManagementView = ({ user, userData }: any) => <ExamsView user={user} />;


const UsersView = (props: any) => <UserConfigView {...props} />;

const RescheduleModal = ({ appointment, onClose, onConfirm, professional }: any) => {
  const [newDate, setNewDate] = useState(appointment?.date || "");
  const [newTime, setNewTime] = useState(appointment?.time || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;
    setLoading(true);
    try {
      if (onConfirm) {
        await onConfirm(appointment?.id, newDate, newTime);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-vitta-border pb-3">
          <h3 className="font-bold text-sm text-vitta-text-primary">Reagendar Consulta</h3>
          <button onClick={onClose} className="p-1 text-vitta-text-muted hover:text-vitta-text-primary">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-vitta-text-secondary">Nova Data</label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-vitta-text-secondary">Novo Horário</label>
            <input
              type="time"
              required
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs text-vitta-text-primary"
            />
          </div>

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold shadow-md"
            >
              {loading ? "Salvando..." : "Confirmar Reagendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function App() {
  const { addToast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTelemedicineApt, setActiveTelemedicineApt] = useState<any | null>(null);
  const [selectedProfForAgenda, setSelectedProfForAgenda] = useState<any | null>(null);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState<"patient" | "professional" | "admin">("patient");
  const [authLoading, setAuthLoading] = useState(false);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Firebase auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            if (data.role === "admin" || data.role === "master") {
              // Admin master default tab
            }
          } else {
            // Create user document if it does not exist
            const initialData = {
              email: currentUser.email,
              name: currentUser.displayName || "Usuário",
              role: "patient",
              walletBalance: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(doc(db, "users", currentUser.uid), initialData);
            setUserData(initialData);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Notifications counter
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", user.uid),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setUnreadNotifsCount(snapshot.size);
    });
    return () => unsub();
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, authEmail, authPassword);
      addToast("Bem-vindo(a) ao ViTTA Convênios!", "success");
    } catch (err: any) {
      console.error(err);
      addToast("E-mail ou senha inválidos.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authPassword.length < 6) {
      addToast("A senha deve ter no mínimo 6 caracteres.", "error");
      return;
    }
    setAuthLoading(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
      await updateProfile(res.user, { displayName: authName });
      await setDoc(doc(db, "users", res.user.uid), {
        email: authEmail,
        name: authName,
        role: authRole,
        walletBalance: 100, // Welcome bonus
        createdAt: new Date().toISOString(),
        subscriptionStatus: "active",
      });
      addToast("Conta criada com sucesso com bônus de R$ 100,00!", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Erro ao criar conta. Verifique os dados e tente novamente.", "error");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", res.user.uid), {
          email: res.user.email,
          name: res.user.displayName,
          role: "patient",
          walletBalance: 100,
          createdAt: new Date().toISOString(),
          subscriptionStatus: "active",
        });
      }
      addToast("Login realizado com sucesso!", "success");
    } catch (err: any) {
      console.error(err);
      addToast("Erro no login com Google.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setActiveTab("home");
      addToast("Você saiu com segurança.", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const isAdminMaster = userData?.role === "admin" || userData?.role === "master" || user?.email?.includes("admin");
  const isProfessional = userData?.role === "professional" || isAdminMaster;

  // 23 modules menu items
  const menuSections = [
    {
      title: "Principal & Paciente",
      items: [
        { id: "home", label: "Início / Resumo", icon: Home },
        { id: "patient-dashboard", label: "Painel do Paciente", icon: LayoutDashboard },
        { id: "appointments", label: "Minhas Consultas", icon: Calendar },
        { id: "professionals", label: "Médicos & Especialistas", icon: Stethoscope },
        { id: "partners", label: "Rede de Parceiros", icon: Store },
        { id: "offers", label: "Vouchers & Benefícios", icon: Tag },
        { id: "exams", label: "Exames & Laudos", icon: FileText },
      ],
    },
    ...(isProfessional
      ? [
          {
            title: "Área Médica & Clínica",
            items: [
              { id: "professional-dashboard", label: "Painel Clínico & Agenda", icon: Activity },
              { id: "professional-finance", label: "Repasses & Finanças", icon: DollarSign },
            ],
          },
        ]
      : []),
    ...(isAdminMaster
      ? [
          {
            title: "Gestão Admin Master (Acesso Total)",
            items: [
              { id: "admin-dashboard", label: "Visão Geral Admin", icon: ShieldCheck },
              { id: "admin-financial", label: "Fluxo de Caixa Global", icon: Landmark },
              { id: "admin-appointments", label: "Gestão de Consultas", icon: Calendar },
              { id: "admin-wallet", label: "Carteiras & ViTTA Coins", icon: Wallet },
              { id: "admin-subscriptions", label: "Assinaturas & Planos", icon: Crown },
              { id: "admin-analytics", label: "Métricas & BI", icon: TrendingUp },
              { id: "admin-vouchers", label: "Gestão de Cupons", icon: Ticket },
              { id: "admin-liberal", label: "Taxas & Configurações", icon: Percent },
              { id: "admin-audit", label: "Logs de Auditoria", icon: ClipboardList },
              { id: "admin-chat", label: "Atendimento ao Cliente", icon: MessageSquare },
            ],
          },
        ]
      : []),
    {
      title: "Geral & Suporte",
      items: [
        { id: "notifications", label: "Notificações", icon: Bell, badge: unreadNotifsCount },
        { id: "chat", label: "Chat Direto", icon: MessageCircle },
        { id: "support", label: "Central de Ajuda", icon: HelpCircle },
        { id: "terms", label: "Termos & LGPD", icon: FileText },
        { id: "settings", label: "Configurações", icon: Settings },
      ],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-vitta-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-vitta-text-muted">Carregando ViTTA Convênios...</span>
        </div>
      </div>
    );
  }

  // Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Heart size={32} />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              ViTTA Convênios
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sua plataforma completa de saúde integrada, descontos e telemedicina
            </p>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setAuthMode("login")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === "login"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => setAuthMode("signup")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                authMode === "signup"
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500"
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={authMode === "login" ? handleLogin : handleSignUp} className="space-y-4">
            {authMode === "signup" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Perfil de Acesso</label>
                  <select
                    value={authRole}
                    onChange={(e) => setAuthRole(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="patient">Paciente</option>
                    <option value="professional">Médico / Especialista</option>
                    <option value="admin">Administrador Master</option>
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">E-mail</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Senha</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Mínimo 6 dígitos"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              {authLoading ? "Aguarde..." : authMode === "login" ? "Acessar Plataforma" : "Cadastrar e Ganhar R$ 100"}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
              ou
            </span>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16} className="text-emerald-500" />
            Continuar com Google
          </button>
        </div>
      </div>
    );
  }

  // Active view renderer
  const renderActiveView = () => {
    switch (activeTab) {
      case "home":
        return <HomeView setActiveTab={setActiveTab} user={user} userData={userData} />;
      case "patient-dashboard":
        return (
          <PatientDashboardView
            user={user}
            userData={userData}
            setActiveTab={setActiveTab}
            setActiveTelemedicineApt={setActiveTelemedicineApt}
          />
        );
      case "appointments":
        return (
          <MyAppointmentsView
            user={user}
            userData={userData}
            setActiveTab={setActiveTab}
            setActiveTelemedicineApt={setActiveTelemedicineApt}
          />
        );
      case "professionals":
        return <ProfessionalsView user={user} setActiveTab={setActiveTab} />;
      case "partners":
        return <PartnersView />;
      case "offers":
        return <OffersView user={user} />;
      case "exams":
        return <ExamsView user={user} />;
      case "professional-dashboard":
        return (
          <ProfessionalDashboardView
            user={user}
            setActiveTelemedicineApt={setActiveTelemedicineApt}
          />
        );
      case "professional-finance":
        return <ProfessionalFinanceView user={user} />;
      case "admin-dashboard":
        return <AdminView user={user} userData={userData} />;
      case "admin-financial":
        return <AdminFinancialView adminUser={user} />;
      case "admin-appointments":
        return <AdminAppointmentsView />;
      case "admin-wallet":
        return <AdminWalletManagementView />;
      case "admin-subscriptions":
        return <SubscriptionManagementView />;
      case "admin-analytics":
        return <AnalyticsView />;
      case "admin-vouchers":
        return <AdminVoucherManagementView />;
      case "admin-liberal":
        return <AdminLiberalConfigView />;
      case "admin-audit":
        return <AuditLogsList />;
      case "admin-chat":
        return <AdminSupportChatView adminUser={user} />;
      case "notifications":
        return <NotificationsView user={user} setActiveTab={setActiveTab} />;
      case "chat":
        return <ChatView user={user} />;
      case "support":
        return <SupportView />;
      case "terms":
        return <TermsAndPrivacyView />;
      case "settings":
        return <SettingsView user={user} darkMode={darkMode} setDarkMode={setDarkMode} />;
      default:
        return <HomeView setActiveTab={setActiveTab} user={user} userData={userData} />;
    }
  };

  return (
    <div className="min-h-screen bg-vitta-bg flex flex-col antialiased selection:bg-vitta-accent/20">
      <OfflineIndicatorBanner />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Drawer */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 bg-vitta-surface border-r border-vitta-border flex flex-col transition-all duration-300 ${
            isSidebarCollapsed ? "w-20" : "w-72"
          } ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} shadow-xl lg:shadow-none`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-vitta-border flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-vitta-accent text-white flex items-center justify-center font-black text-lg shadow-md shadow-vitta-accent/20 shrink-0">
                V
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="font-black text-sm text-vitta-text-primary tracking-tight truncate">
                    ViTTA Convênios
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-vitta-accent/10 text-vitta-accent rounded-full inline-block">
                    {isAdminMaster ? "Admin Master" : isProfessional ? "Médico Credenciado" : "Paciente Ativo"}
                  </span>
                </div>
              )}
            </div>

            <button
              id="sidebar-collapse-btn"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="hidden lg:flex p-1 ml-0 -mr-[21px] hover:bg-vitta-surface-2 rounded-xl text-vitta-text-muted transition-colors cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-vitta-text-muted hover:text-vitta-text-primary"
            >
              <X size={20} />
            </button>
          </div>

          {/* User Profile Card in Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-4 border-b border-vitta-border bg-vitta-surface-2/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vitta-surface border border-vitta-border flex items-center justify-center font-bold text-xs text-vitta-accent shadow-sm shrink-0">
                  {(userData?.name || user?.displayName || user?.email || "U")[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-vitta-text-primary truncate">
                    {userData?.name || user?.displayName || "Usuário"}
                  </p>
                  <p className="text-[10px] text-vitta-text-muted truncate">{user?.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-6">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-vitta-text-muted">
                    {section.title}
                  </h3>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      title={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-vitta-accent text-white shadow-md shadow-vitta-accent/20"
                          : "text-vitta-text-secondary hover:bg-vitta-surface-2 hover:text-vitta-text-primary"
                      } ${isSidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <Icon size={18} className="shrink-0" />
                      {!isSidebarCollapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {!isSidebarCollapsed && item.badge ? (
                        <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold">
                          {item.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 border-t border-vitta-border flex items-center justify-between">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-vitta-text-muted hover:text-vitta-text-primary hover:bg-vitta-surface-2 rounded-xl transition-all"
              title="Alternar Tema"
            >
              {darkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl text-xs font-bold transition-all"
              title="Sair da Conta"
            >
              <LogOut size={18} />
              {!isSidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Content Wrapper */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
          }`}
        >
          {/* Top Header Navbar */}
          <header className="sticky top-0 z-20 bg-vitta-surface/80 backdrop-blur-md border-b border-vitta-border px-4 lg:px-8 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-vitta-text-muted hover:text-vitta-text-primary hover:bg-vitta-surface-2 rounded-xl"
              >
                <Menu size={20} />
              </button>
              <div className="hidden sm:block">
                <span className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider block">
                  ViTTA Convênios
                </span>
                <h2 className="text-sm font-black text-vitta-text-primary capitalize">
                  {activeTab.replace(/-/g, " ")}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("notifications")}
                className="relative p-2 text-vitta-text-muted hover:text-vitta-text-primary hover:bg-vitta-surface-2 rounded-xl transition-all"
              >
                <Bell size={18} />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-vitta-surface animate-pulse" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className="flex items-center gap-2 pl-2 pr-3 py-1 bg-vitta-surface-2 hover:bg-vitta-border border border-vitta-border rounded-full text-xs font-bold text-vitta-text-primary transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-vitta-accent text-white flex items-center justify-center text-[10px] font-black">
                  {(userData?.name || user?.displayName || "U")[0].toUpperCase()}
                </div>
                <span className="max-w-[100px] truncate">{userData?.name || user?.displayName || "Perfil"}</span>
              </button>
            </div>
          </header>

          {/* Active View Container */}
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto pb-24 lg:pb-8">
            {renderActiveView()}
          </main>

          {/* Mobile & PWA Bottom Navigation Menu */}
          <MobileBottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userData={userData}
            user={user}
            unreadNotifsCount={unreadNotifsCount}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        </div>
      </div>

      {/* Telemedicine Room Modal */}
      {activeTelemedicineApt && (
        <TelemedicineRoom
          appointment={activeTelemedicineApt}
          user={user}
          userData={userData}
          onLeave={() => setActiveTelemedicineApt(null)}
        />
      )}

      {/* Agenda Planner Modal for Admin / Professional */}
      {selectedProfForAgenda && (
        <AvailabilityPlannerModal
          isOpen={!!selectedProfForAgenda}
          professional={selectedProfForAgenda}
          onClose={() => setSelectedProfForAgenda(null)}
        />
      )}
    </div>
  );
}
