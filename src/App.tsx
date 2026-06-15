// Force refresh - 2026-04-07 23:32
import React, { useState, useEffect, useMemo, useRef } from "react";
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
  CheckCircle2,
  Receipt,
  FileQuestion,
  SkipForward,
  Eye,
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
} from "firebase/firestore";
import { Medication, HealthGoal } from "./types";
import AuditLogsList from "./components/Admin/AuditLogsList";
import SubscriptionManagementView from "./components/Admin/SubscriptionManagementView";
import AdminAnalytics from "./components/Admin/AnalyticsView";
import NotificationCenter from "./components/NotificationCenter";
import HelpCenter from "./components/HelpCenter";
import ReviewModal from "./components/ReviewModal";
import KYCWizard from "./components/KYCWizard";
import TelemedicineRoom from "./components/TelemedicineRoom";
import { enqueueOfflineAction } from "./lib/offlineQueue";

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
  throw new Error(JSON.stringify(errInfo));
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

async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
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
}: {
  isOpen: boolean;
  onClose: () => void;
  professional: any;
  user: any;
  userData?: any;
  googleToken?: string | null;
}) => {
  const [modalTab, setModalTab] = useState<"profile" | "booking">("profile");
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

    setAvailableSlots(slots);
    if (!slots.includes(selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, professional]);

  const handleConfirm = async () => {
    if (!user || !professional || !selectedTime) return;

    setIsBooking(true);
    try {
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
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

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

      // 2. Open WhatsApp - Dirigido pelo campo cadastrado no profissional ou fallback geral
      const phoneNumber = professional.whatsapp
        ? professional.whatsapp.replace(/\D/g, "")
        : "5528999881386";
      const formattedDate = formatDateForDisplay(selectedDate);
      const message = `Olá! Gostaria de agendar um atendimento.\n\n*Meus dados:*\nNome: ${user.displayName || "Usuário"}\nEmail: ${user.email}\n\n*Profissional selecionado:*\nNome: ${professional.name}\nEspecialidade: ${professional.specialty}\n\n*Data e Hora:*\n${formattedDate} às ${selectedTime}`;

      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");

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
                  {isLoadingSlots ? (
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
}: {
  user: any;
  userData: any;
  setActiveTab: (tab: string) => void;
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
      orderBy("updatedAt", "desc"),
      limit(2),
    );

    const unsubscribeExams = onSnapshot(
      examsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentExams(data);
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

    return () => {
      unsubscribeMetrics();
      unsubscribeAppointments();
      unsubscribeExams();
      unsubscribeWallet();
      unsubscribeMeds();
      unsubscribeGoals();
    };
  }, [user]);

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
                <h3 className="text-lg font-bold text-vitta-text-primary">
                  Próximas Consultas
                </h3>
                <Calendar size={20} className="text-vitta-accent" />
              </div>
              <div className="space-y-4">
                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border"
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
                      <div className="text-right">
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
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-vitta-text-secondary text-center py-4">
                    Nenhuma consulta agendada.
                  </p>
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
                      <p className="text-[10px] text-vitta-text-muted">
                        {currentVal} / {goal.targetValue} {goal.unit}
                      </p>
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
                    <div className="text-right">
                      <p className="text-xs font-bold text-vitta-accent">
                        {med.times[0]}
                      </p>
                      <p className="text-[9px] text-vitta-text-muted">
                        Próxima
                      </p>
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
}: {
  user: any;
  userData: any;
  setActiveTab: (tab: string) => void;
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
              onClick={() => setActiveTab("professionals")}
              className="px-5 py-3 bg-white text-vitta-accent font-bold text-sm rounded-xl shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-200 active:scale-95"
            >
              Agendar Nova Consulta
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

const AdminSupportChatView = ({ adminUser }: { adminUser: any }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [chatRooms, setChatRooms] = useState<{ [key: string]: any }>({});
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userTyping, setUserTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<any>(null);
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const qUsers = query(collection(db, "users"), orderBy("name", "asc"));
    const unsubscribeUsers = onSnapshot(
      qUsers,
      (snapshot) => {
        const allUsers = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as any,
        );
        setUsers(allUsers.filter((u) => u.role !== "admin"));
        setLoadingUsers(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, "users");
      },
    );

    const qRooms = collection(db, "chats");
    const unsubscribeRooms = onSnapshot(qRooms, (snapshot) => {
      const rooms: { [key: string]: any } = {};
      snapshot.docs.forEach((doc) => {
        rooms[doc.id] = doc.data();
      });
      setChatRooms(rooms);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRooms();
    };
  }, []);

  useEffect(() => {
    if (!selectedUser) return;
    setLoadingMessages(true);
    const userId = selectedUser.uid || selectedUser.id;
    const q = query(
      collection(db, "chats", userId, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data);
        setLoadingMessages(false);
        setTimeout(scrollToBottom, 100);

        // Auto-read user messages
        snapshot.docs.forEach((docSnap) => {
          const msg = docSnap.data();
          if (msg.senderRole === "user" && !msg.read) {
            updateDoc(doc(db, "chats", userId, "messages", docSnap.id), {
              read: true,
            });
          }
        });

        // Reset unread counter
        updateDoc(doc(db, "chats", userId), { unreadCount: 0 });
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `chats/${userId}/messages`,
        );
      },
    );

    const unsubscribeRoom = onSnapshot(doc(db, "chats", userId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setUserTyping(!!data.userTyping);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [selectedUser]);

  const handleTyping = () => {
    if (!selectedUser || !adminUser) return;
    const userId = selectedUser.uid || selectedUser.id;
    setDoc(
      doc(db, "chats", userId),
      { adminTyping: true, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(doc(db, "chats", userId), { adminTyping: false }, { merge: true });
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !adminUser) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    const userId = selectedUser.uid || selectedUser.id;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDoc(doc(db, "chats", userId), { adminTyping: false }, { merge: true });

    try {
      await addDoc(collection(db, "chats", userId, "messages"), {
        text: messageText,
        senderId: adminUser.uid,
        senderRole: "admin",
        createdAt: new Date().toISOString(),
        read: false,
      });

      await setDoc(
        doc(db, "chats", userId),
        {
          userId,
          lastMessage: messageText,
          lastMessageAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      scrollToBottom();
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `chats/${userId}/messages`,
      );
      addToast("Erro ao enviar mensagem.", "error");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
      <div className="md:col-span-1 bg-vitta-surface border border-vitta-border shadow-sm rounded-2xl flex flex-col overflow-hidden h-full">
        <div className="p-4 border-b border-vitta-border bg-vitta-surface-2">
          <h2 className="text-sm font-bold text-vitta-text-primary mb-3">
            Chats de Pacientes
          </h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente..."
              className="w-full bg-vitta-surface border border-vitta-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-vitta-accent text-vitta-text-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <MessageSquare
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-secondary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingUsers ? (
            <div className="p-4 flex justify-center">
              <div className="w-5 h-5 border-2 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center text-vitta-text-secondary text-xs p-4">
              Nenhum paciente encontrado
            </p>
          ) : (
            filteredUsers.map((u) => {
              const room = chatRooms[u.uid || u.id];
              const unreadCount = room?.unreadCount || 0;
              const isTyping = room?.userTyping || false;

              return (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center gap-3 p-3 text-left rounded-xl transition-colors relative ${selectedUser?.id === u.id ? "bg-vitta-accent-bg text-vitta-accent" : "hover:bg-vitta-surface-2 text-vitta-text-primary"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${selectedUser?.id === u.id ? "bg-vitta-accent text-white" : "bg-vitta-surface-3 text-vitta-text-secondary"}`}
                  >
                    {u.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-sm truncate">{u.name}</p>
                      {unreadCount > 0 && (
                        <span className="bg-vitta-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center gap-2">
                      <p
                        className={`text-xs truncate flex-1 ${isTyping ? "text-vitta-green font-bold animate-pulse" : selectedUser?.id === u.id ? "text-vitta-accent/80" : "text-vitta-text-muted"}`}
                      >
                        {isTyping
                          ? "Digitando..."
                          : room?.lastMessage || u.email}
                      </p>
                      {room?.lastMessageAt && !isTyping && (
                        <span className="text-[9px] text-vitta-text-muted whitespace-nowrap">
                          {new Date(room.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="md:col-span-3 bg-vitta-surface border border-vitta-border shadow-sm rounded-2xl flex flex-col overflow-hidden h-full">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-vitta-text-secondary p-6">
            <div className="w-20 h-20 bg-vitta-surface-2 rounded-full flex items-center justify-center mb-6 text-vitta-border">
              <MessageSquare size={40} />
            </div>
            <p className="text-xl font-bold text-vitta-text-primary mb-2">
              Central de Suporte em Tempo Real
            </p>
            <p className="text-sm max-w-sm text-center">
              Inicie um atendimento selecionando um paciente ao lado. Você verá
              o status de digitação e confirmação de leitura em tempo real.
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-vitta-border bg-vitta-surface-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-vitta-accent text-white flex items-center justify-center font-bold shrink-0">
                  {selectedUser.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-vitta-text-primary text-sm">
                    {selectedUser.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${userTyping ? "bg-vitta-green animate-pulse" : "bg-vitta-text-muted"}`}
                    />
                    <p className="text-[10px] text-vitta-text-secondary uppercase font-bold tracking-wider">
                      {userTyping ? "Digitando..." : "Online"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors">
                  <Phone size={18} />
                </button>
                <button className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-vitta-surface-2/10">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-vitta-text-secondary">
                  <p className="text-sm font-medium">
                    Nenhuma mensagem trocada ainda.
                  </p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isAdminMsg = msg.senderRole === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isAdminMsg ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex gap-3 max-w-[80%] ${isAdminMsg ? "flex-row-reverse" : "flex-row"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                              isAdminMsg
                                ? "bg-vitta-surface-3 text-vitta-text-secondary"
                                : "bg-vitta-accent text-white"
                            }`}
                          >
                            {isAdminMsg
                              ? "ADM"
                              : selectedUser.name?.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`p-4 rounded-2xl relative ${
                              isAdminMsg
                                ? "bg-vitta-surface-3 text-vitta-text-primary rounded-tr-none border border-vitta-border"
                                : "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/10 rounded-tl-none"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">
                              {msg.text}
                            </p>
                            <div
                              className={`flex items-center gap-1 mt-2 justify-end ${isAdminMsg ? "text-vitta-text-muted" : "text-white/70"}`}
                            >
                              <span className="text-[10px]">
                                {new Date(msg.createdAt).toLocaleTimeString(
                                  [],
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                              {isAdminMsg && (
                                <div className="flex">
                                  {msg.read ? (
                                    <div className="flex -space-x-1">
                                      <Check size={10} strokeWidth={3} />
                                      <Check size={10} strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <Check size={10} strokeWidth={3} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {userTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-vitta-accent text-white flex items-center justify-center shrink-0">
                          {selectedUser.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="bg-vitta-surface-3 p-3 rounded-2xl border border-vitta-border flex items-center gap-1">
                          <div
                            className="w-1.5 h-1.5 bg-vitta-accent rounded-full animate-bounce"
                            style={{ animationDelay: "0s" }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-vitta-accent rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-1.5 h-1.5 bg-vitta-accent rounded-full animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-4 border-t border-vitta-border bg-vitta-surface">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Digite sua resposta..."
                  className="flex-1 bg-vitta-surface-2 border border-vitta-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-vitta-accent text-vitta-text-primary placeholder:text-vitta-text-muted transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-12 h-12 shrink-0 bg-vitta-accent text-white rounded-xl flex items-center justify-center hover:bg-vitta-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-vitta-accent/20"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
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
  const [modalTab, setModalTab] = useState<"clinical" | "history">("clinical");
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

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
}: {
  isOpen: boolean;
  onClose: () => void;
  professional: any;
  user: any;
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

    setAvailableSlots(slots);
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

const ProfessionalFinanceView = ({ user }: { user: any }) => {
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (!user) return;

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

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [user]);

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
        <div className="relative overflow-hidden bg-gradient-to-br from-vitta-accent to-vitta-accent/80 p-8 rounded-3xl shadow-xl shadow-vitta-accent/20 text-white md:col-span-1">
          <div className="absolute top-0 right-0 p-6 opacity-20">
            <Wallet size={80} />
          </div>
          <div className="relative z-10 space-y-6">
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
              className="w-full py-3 bg-white text-vitta-accent rounded-xl text-sm font-bold shadow-sm hover:bg-white/90 transition-all"
            >
              Solicitar Saque
            </button>
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

  useEffect(() => {
    if (professional) {
      setOfficeLocation(professional.officeLocation || "");
      setIsPresencialEnabled(professional.isPresencialEnabled !== false);
      setIsTelemedicineEnabled(professional.isTelemedicineEnabled !== false);
      setSchedule(professional.schedule || { weekly: {}, blockedDates: [] });
    }
  }, [professional]);

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
        </div>
      </div>
    </div>
  );
};

const ProfessionalDashboardView = ({
  user,
  setActiveTelemedicineApt,
  overrideProfessionalId,
}: {
  user: any;
  setActiveTelemedicineApt: (apt: any) => void;
  overrideProfessionalId?: string;
}) => {
  const [professionalProfile, setProfessionalProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"agenda" | "profile" | "finance" | "settings">(
    "agenda",
  );
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isManualBookingModalOpen, setIsManualBookingModalOpen] =
    useState(false);
  const { addToast } = useToast();

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
          .filter((p) => !p.userId); // only profiles not yet claimed
        setAvailableUnlinkedProfs(list);
      } catch (err) {
        console.error("Error fetching unlinked professionals:", err);
      } finally {
        setLoadingUnlinked(false);
      }
    };
    fetchUnlinked();
  }, [professionalProfile, user.uid, overrideProfessionalId]);

  const handleLinkProfile = async (profId: string) => {
    setIsLinkingInProcess(true);
    try {
      await updateDoc(doc(db, "professionals", profId), {
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
      });
      addToast("Perfil profissional criado e vinculado com sucesso!", "success");
    } catch (err) {
      console.error("Error creating and linking profile:", err);
      addToast("Erro ao criar perfil profissional.", "error");
    } finally {
      setIsLinkingInProcess(false);
    }
  };

  useEffect(() => {
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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      addToast(
        `Agendamento atualizado para: ${newStatus === "in_progress" ? "Em Atendimento" : "Finalizado"}`,
        "success",
      );

      const apt = appointments.find((a) => a.id === id);
      if (apt && apt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Atualização de Consulta",
          message: `Sua consulta com ${professionalProfile.name} está ${newStatus === "in_progress" ? "EM ATENDIMENTO" : "FINALIZADA"}.`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }
    } catch (err) {
      console.error(err);
      addToast("Erro ao atualizar status.", "error");
    }
  };

  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [editingApt, setEditingApt] = useState<any>(null);

  const handleReschedule = async (newDate: string, newTime: string) => {
    if (!editingApt) return;
    try {
      await updateDoc(doc(db, "appointments", editingApt.id), {
        date: newDate,
        time: newTime,
        status: "upcoming",
        updatedAt: Timestamp.now(),
      });

      // Send notification to patient
      await addDoc(collection(db, "notifications"), {
        userId: editingApt.userId,
        title: "Consulta Remarcada",
        message: `Sua consulta com ${professionalProfile.name} foi remarcada para o dia ${formatDateForDisplay(newDate)} às ${newTime}.`,
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
                  Se um administrador já cadastrou seu nome, selecione seu perfil abaixo para associá-lo definitivamente ao seu usuário.
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
            onClose={() => setIsManualBookingModalOpen(false)}
            user={user}
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
              onClick={() => setSubTab("agenda")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all text-center ${subTab === "agenda" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              📋 Agenda-Dia
            </button>
            <button
              onClick={() => setSubTab("profile")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all text-center ${subTab === "profile" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              👤 Perfil
            </button>
            <button
              onClick={() => setSubTab("finance")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all text-center ${subTab === "finance" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              💰 Financeiro
            </button>
            <button
              onClick={() => setSubTab("settings")}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap transition-all text-center ${subTab === "settings" ? "bg-vitta-surface shadow-sm text-vitta-accent" : "text-vitta-text-secondary hover:text-vitta-text-primary"}`}
            >
              ⚙️ Grade
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
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "appointments", apt.id), {
                                status: "cancelled",
                                updatedAt: Timestamp.now(),
                              });
                              await addDoc(collection(db, "notifications"), {
                                userId: apt.userId,
                                title: "Consulta Rejeitada",
                                message: `Sua solicitação de consulta com ${professionalProfile.name} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi rejeitada pelo profissional.`,
                                type: "appointment",
                                read: false,
                                createdAt: Timestamp.now(),
                              });
                              addToast(
                                "Agendamento rejeitado com sucesso.",
                                "info",
                              );
                            } catch (err) {
                              console.error(err);
                              addToast(
                                "Erro ao atualizar agendamento.",
                                "error",
                              );
                            }
                          }}
                          className="px-4 py-2 bg-vitta-danger/10 text-vitta-danger hover:bg-vitta-danger hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Rejeitar Solicitação"
                        >
                          <X size={14} />
                          Rejeitar
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "appointments", apt.id), {
                                status: "cancelled",
                                updatedAt: Timestamp.now(),
                              });
                              await addDoc(collection(db, "notifications"), {
                                userId: apt.userId,
                                title: "Consulta Cancelada",
                                message: `Sua solicitação de consulta com ${professionalProfile.name} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                                type: "appointment",
                                read: false,
                                createdAt: Timestamp.now(),
                              });
                              addToast(
                                "Agendamento cancelado com sucesso.",
                                "info",
                              );
                            } catch (err) {
                              console.error(err);
                              addToast(
                                "Erro ao cancelar agendamento.",
                                "error",
                              );
                            }
                          }}
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
                                onClick={async () => {
                                  try {
                                    await updateDoc(
                                      doc(db, "appointments", apt.id),
                                      {
                                        status: "cancelled",
                                        updatedAt: Timestamp.now(),
                                      },
                                    );
                                    await addDoc(
                                      collection(db, "notifications"),
                                      {
                                        userId: apt.userId,
                                        title: "Consulta Cancelada",
                                        message: `Sua consulta com ${professionalProfile.name} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                                        type: "appointment",
                                        read: false,
                                        createdAt: Timestamp.now(),
                                      },
                                    );
                                    addToast(
                                      "Agendamento cancelado com sucesso.",
                                      "info",
                                    );
                                  } catch (err) {
                                    console.error(err);
                                    addToast(
                                      "Erro ao cancelar agendamento.",
                                      "error",
                                    );
                                  }
                                }}
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
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "appointments", apt.id), {
                                status: "cancelled",
                                updatedAt: Timestamp.now(),
                              });
                              await addDoc(collection(db, "notifications"), {
                                userId: apt.userId,
                                title: "Consulta Cancelada",
                                message: `Sua consulta com ${professionalProfile.name} para o dia ${formatDateForDisplay(apt.date)} às ${apt.time} foi cancelada pelo profissional.`,
                                type: "appointment",
                                read: false,
                                createdAt: Timestamp.now(),
                              });
                              addToast(
                                "Agendamento cancelado com sucesso.",
                                "info",
                              );
                            } catch (err) {
                              console.error(err);
                              addToast(
                                "Erro ao cancelar agendamento.",
                                "error",
                              );
                            }
                          }}
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

      {subTab === "settings" && <ProfessionalAgendaSettingsView professional={professionalProfile} />}

      {subTab === "finance" && <ProfessionalFinanceView user={user} />}

      {/* Patient Details Modal */}
      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-lg rounded-2xl shadow-2xl border border-vitta-border overflow-hidden"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-vitta-accent-bg rounded-xl text-vitta-accent">
                    <User size={20} />
                  </div>
                  <h3 className="text-xl font-bold text-vitta-text-primary">
                    Ficha do Paciente
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-2xl border border-vitta-border">
                  <div className="w-16 h-16 bg-vitta-accent rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-vitta-accent/20">
                    {selectedPatient.name?.charAt(0) || "P"}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-vitta-text-primary">
                      {selectedPatient.name}
                    </h4>
                    <p className="text-sm text-vitta-text-secondary">
                      ID: {selectedPatient.id}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 rounded-xl bg-vitta-surface border border-vitta-border">
                    <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-2">
                      Informações Críticas
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-vitta-text-secondary">
                          Tipo de Plano:
                        </span>
                        <span className="font-bold text-vitta-text-primary">
                          Vitta Premium
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-vitta-text-secondary">
                          Última Consulta:
                        </span>
                        <span className="font-bold text-vitta-text-primary">
                          15/04/2026
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-vitta-text-secondary">
                          Alergias:
                        </span>
                        <span className="font-bold text-vitta-danger">
                          Nenhuma relatada
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-vitta-border bg-vitta-surface-2">
                <button
                  onClick={() => setSelectedPatient(null)}
                  className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-all shadow-lg shadow-vitta-accent/20"
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
      const url = await uploadWithProgress(
        file,
        `banners/${Date.now()}_${file.name}`,
        "image",
      );
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

const AdminView = ({ user }: { user: any }) => {
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
    | "appointments"
    | "deletion-requests"
    | "audit-logs"
    | "subscriptions"
    | "content"
    | "medical-panel"
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

  const handleSaveReschedule = async (newDate: string, newTime: string) => {
    if (!editingApt) return;
    try {
      const oldData = { ...editingApt };
      const newData = {
        date: newDate,
        time: newTime,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(doc(db, "appointments", editingApt.id), newData);

      // Notify user about rescheduling
      if (editingApt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: editingApt.userId,
          title: "Consulta Remarcada",
          message: `Sua consulta com ${editingApt.professionalName} foi remarcada pelo administrador para ${formatDateForDisplay(newDate)} às ${newTime}.`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      await logAdminAction(
        "RESCHEDULE_APPOINTMENT",
        `Remarcou agendamento ID: ${editingApt.id} para ${newDate} ${newTime}`,
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
                          src={apt.imageUrl}
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
                    {professionals.length > 0 ? (
                      professionals.map((prof, idx) => (
                        <div
                          key={prof.id}
                          className={`p-4 flex items-center gap-3 ${idx !== professionals.length - 1 ? "border-b border-vitta-border" : ""}`}
                        >
                          <img
                            src={prof.imageUrl}
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
                            src={offer.imageUrl}
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
          {subTab === "users" && <UsersView />}
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
            <PartnershipsView setSubTab={setSubTab} />
          )}
          {subTab === "professionals" && <ProfessionalsManagementView />}
          {subTab === "exams" && <ExamsManagementView />}
          {subTab === "user-exams" && <UserExamsManagementView />}
          {subTab === "appointments" && <AdminAppointmentsView />}
          {subTab === "config" && <UserConfigView />}
          {subTab === "content" && <ContentManagerView />}
          {subTab === "chat" && <AdminSupportChatView adminUser={user} />}
          {subTab === "transactions" && <AdminFinancialView adminUser={user} />}
          {subTab === "audit-logs" && <AuditLogsList />}
          {subTab === "subscriptions" && <SubscriptionManagementView />}
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

const AdminAppointmentsView = () => {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "upcoming" | "completed" | "cancelled"
  >("all");
  const [editingApt, setEditingApt] = useState<any>(null);
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

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: appointments.length,
      pending: appointments.filter((a) => a.status === "pending").length,
      today: appointments.filter((a) => a.date === today).length,
      upcoming: appointments.filter((a) => a.status === "upcoming").length,
    };
  }, [appointments]);

  useEffect(() => {
    const q = query(collection(db, "appointments"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAppointments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
      },
    );
    return () => unsubscribe();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), {
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
      addToast(`Status atualizado para ${newStatus}.`, "success");
      await logAdminAction(
        "UPDATE_APPOINTMENT_STATUS",
        `Atualizou status da consulta ${id} para ${newStatus}`,
      );

      // Notify patient
      const apt = appointments.find((a) => a.id === id);
      if (apt && apt.userId) {
        await addDoc(collection(db, "notifications"), {
          userId: apt.userId,
          title: "Status de Consulta Atualizado",
          message: `Sua consulta com ${apt.professionalName} foi marcada como ${newStatus}.`,
          type: "appointment",
          read: false,
          createdAt: Timestamp.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `appointments/${id}`);
      addToast("Erro ao atualizar.", "error");
    }
  };

  const handleSaveReschedule = async (newDate: string, newTime: string) => {
    if (!editingApt) return;
    try {
      await updateDoc(doc(db, "appointments", editingApt.id), {
        date: newDate,
        time: newTime,
        updatedAt: Timestamp.now(),
      });
      await addDoc(collection(db, "notifications"), {
        userId: editingApt.userId,
        title: "Consulta Reagendada pelo Admin",
        message: `Sua consulta com ${editingApt.professionalName} foi alterada para o dia ${formatDateForDisplay(newDate)} às ${newTime}.`,
        type: "appointment",
        read: false,
        createdAt: Timestamp.now(),
      });
      await logAdminAction(
        "RESCHEDULE_APPOINTMENT",
        `Reagendou consulta ${editingApt.id} para ${newDate} ${newTime}`,
      );
      addToast("Consulta reagendada com sucesso.", "success");
      setEditingApt(null);
    } catch (err) {
      addToast("Erro ao reagendar.", "error");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Agendamento",
      message:
        "Tem certeza que deseja excluir permanentemente este agendamento?",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "appointments", id));
          addToast("Agendamento excluído com sucesso.", "success");
          await logAdminAction(
            "DELETE_APPOINTMENT",
            `Excluiu a consulta ${id}`,
          );
        } catch (error) {
          addToast("Erro ao excluir agendamento.", "error");
        }
      },
    });
  };

  const filteredAppointments = appointments.filter(
    (a) => filter === "all" || a.status === filter,
  );

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
      </AnimatePresence>

      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
          Agendamentos Globais
        </h1>
        <p className="text-vitta-text-secondary">
          Gerencia o fluxo de consultas em todo o sistema.
        </p>
      </section>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total",
            value: stats.total,
            icon: Calendar,
            color: "text-vitta-accent",
            bg: "bg-vitta-accent-bg",
          },
          {
            label: "Pendentes",
            value: stats.pending,
            icon: Clock,
            color: "text-vitta-amber",
            bg: "bg-vitta-amber-bg",
          },
          {
            label: "Para Hoje",
            value: stats.today,
            icon: LayoutGrid,
            color: "text-vitta-green",
            bg: "bg-vitta-green-bg",
          },
          {
            label: "Confirmados",
            value: stats.upcoming,
            icon: CheckCircle,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="p-6 bg-vitta-surface border border-vitta-border rounded-2xl shadow-sm space-y-4"
          >
            <div className="flex justify-between items-center">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
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

      <div className="flex gap-2 flex-wrap pb-2 border-b border-vitta-border">
        {(
          ["all", "pending", "upcoming", "completed", "cancelled"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20" : "bg-vitta-surface-2 text-vitta-text-secondary hover:bg-vitta-border"}`}
          >
            {f === "all"
              ? "Todos"
              : f === "pending"
                ? "Pendentes"
                : f === "upcoming"
                  ? "Agendados"
                  : f === "completed"
                    ? "Concluídos"
                    : "Cancelados"}
          </button>
        ))}
      </div>

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-vitta-surface-2 border-b border-vitta-border">
                  <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Profissional / Info
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Paciente
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Data / Hora
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vitta-border">
                {filteredAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className="hover:bg-vitta-surface-2/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            apt.imageUrl ||
                            "https://picsum.photos/seed/prof/400/300"
                          }
                          alt={apt.professionalName}
                          className="w-10 h-10 rounded-full object-cover shrink-0 border border-vitta-border"
                        />
                        <div>
                          <p className="font-bold text-sm text-vitta-text-primary">
                            {apt.professionalName}
                          </p>
                          <p className="text-[10px] text-vitta-accent font-bold uppercase tracking-wider">
                            {apt.specialty}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-vitta-surface-2 flex items-center justify-center text-vitta-text-muted border border-vitta-border">
                          <User size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-vitta-text-primary">
                            {apt.patientName || "Paciente"}
                          </p>
                          <p className="text-[10px] font-mono text-vitta-text-secondary">
                            {apt.userId?.substring(0, 8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-vitta-text-primary">
                          {formatDateForDisplay(apt.date)}
                        </span>
                        <span className="text-xs text-vitta-text-secondary">
                          {apt.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          apt.status === "pending"
                            ? "bg-vitta-amber-bg text-vitta-amber"
                            : apt.status === "upcoming"
                              ? "bg-blue-500/10 text-blue-500"
                              : apt.status === "completed"
                                ? "bg-vitta-green-bg text-vitta-green"
                                : "bg-vitta-danger/10 text-vitta-danger"
                        }`}
                      >
                        {apt.status === "pending"
                          ? "Pendente"
                          : apt.status === "upcoming"
                            ? "Agendado"
                            : apt.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {apt.status === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(apt.id, "upcoming")
                            }
                            className="p-2 text-vitta-green hover:bg-vitta-green-bg rounded-lg transition-colors"
                            title="Aceitar Agendamento"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {(apt.status === "upcoming" ||
                          apt.status === "pending") && (
                          <>
                            <button
                              onClick={() => setEditingApt(apt)}
                              className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-lg transition-colors"
                              title="Editar Data/Hora"
                            >
                              <Edit size={18} />
                            </button>
                            {apt.status === "upcoming" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(apt.id, "completed")
                                }
                                className="p-2 text-vitta-green hover:bg-vitta-green-bg rounded-lg transition-colors"
                                title="Marcar como Concluído"
                              >
                                <Check size={18} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleUpdateStatus(apt.id, "cancelled")
                              }
                              className="p-2 text-vitta-danger hover:bg-vitta-danger/10 rounded-lg transition-colors"
                              title="Cancelar Totalmente"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="p-2 text-vitta-text-muted hover:text-vitta-danger hover:bg-vitta-danger/10 rounded-lg transition-colors"
                          title="Excluir do Sistema"
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
        ) : (
          <div className="p-12 text-center text-vitta-text-muted text-sm">
            Nenhum agendamento encontrado para este filtro.
          </div>
        )}
      </div>

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

const ExamsView = ({ user }: { user: any }) => {
  const [exams, setExams] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "ready" | "pending">("all");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "user_exams"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setExams(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "user_exams");
      },
    );

    return () => unsubscribe();
  }, [user]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const matchesFilter = filter === "all" || exam.status === filter;
      const matchesSearch =
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exam.lab &&
          exam.lab.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesFilter && matchesSearch;
    });
  }, [exams, filter, searchQuery]);

  const handleDownload = (url: string | undefined) => {
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
          Meus Exames
        </h1>
        <p className="text-vitta-text-secondary">
          Acompanhe seus resultados e histórico de exames.
        </p>
      </section>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === "all" ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20" : "bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter("ready")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === "ready" ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20" : "bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2"}`}
          >
            Prontos
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === "pending" ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20" : "bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2"}`}
          >
            Pendentes
          </button>
        </div>

        <div className="relative w-full lg:w-80 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted group-focus-within:text-vitta-accent transition-colors"
            size={18}
          />
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
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
                  Exame
                </th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
                  Local
                </th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-vitta-text-muted uppercase tracking-wider text-right">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-28" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredExams.length > 0 ? (
                filteredExams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-vitta-surface-2 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-vitta-green-bg text-vitta-green rounded-lg">
                          <FileText size={18} />
                        </div>
                        <span className="font-bold text-sm text-vitta-text-primary">
                          {exam.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                      {exam.createdAt
                        ? new Date(
                            exam.createdAt.seconds * 1000,
                          ).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-vitta-text-secondary">
                      {exam.lab || "Laboratório ViTTA"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          exam.status === "ready"
                            ? "bg-vitta-green-bg text-vitta-green"
                            : exam.status === "pending"
                              ? "bg-vitta-amber-bg text-vitta-amber"
                              : "bg-vitta-surface-2 text-vitta-text-muted"
                        }`}
                      >
                        {exam.status === "ready"
                          ? "Pronto"
                          : exam.status === "pending"
                            ? "Pendente"
                            : "Agendado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {exam.status === "ready" && (
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-vitta-text-muted"
                  >
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

const AvailabilityPlannerModal = ({ isOpen, onClose, professional }: any) => {
  const [schedule, setSchedule] = useState<{
    weekly: Record<string, Array<{ start: string; end: string }>>;
    blockedDates: string[];
  }>(professional.schedule || { weekly: {}, blockedDates: [] });
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

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

const ProfessionalsManagementView = () => {
  const { addToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<"list" | "categories">(
    "list",
  );
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [agendaProfessional, setAgendaProfessional] = useState<any>(null);
  const [isCreating, setIsCreating] = useState<
    "professional" | "category" | null
  >(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    specialty: "Médico",
    vittaHealthDiscount: "",
    registrationNumber: "",
    availableDays: "",
    price: "",
    city: "",
    imageUrl: "",
    whatsapp: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    localidade: "",
    uf: "",
  });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      processFile(files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast("Por favor, selecione um arquivo de imagem válido.", "error");
      return;
    }
    // Set a higher raw limit for upload before compression (e.g., 10MB) to be more user-friendly, since we compress anyway
    if (file.size > 10 * 1024 * 1024) {
      addToast("A imagem de origem deve ter menos de 10MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with JPEG format at 0.8 quality to significantly shrink storage footprint
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);

            if (editingItem) {
              setEditingItem((prev: any) => ({
                ...prev,
                imageUrl: compressedBase64,
              }));
            } else {
              setNewItem((prev) => ({ ...prev, imageUrl: compressedBase64 }));
            }
            addToast("Imagem de perfil carregada e otimizada!", "success");
          } else {
            addToast("Erro ao otimizar a imagem.", "error");
          }
        };
        img.onerror = () => {
          addToast("Erro ao processar imagem para otimização.", "error");
        };
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => {
      addToast("Erro ao ler o arquivo de imagem.", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleCepChange = async (cepValue: string) => {
    const cleaned = cepValue.replace(/\D/g, "");

    if (editingItem) {
      setEditingItem((prev: any) => ({ ...prev, cep: cepValue }));
    } else {
      setNewItem((prev: any) => ({ ...prev, cep: cepValue }));
    }

    if (cleaned.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(
          `https://viacep.com.br/ws/${cleaned}/json/`,
        );
        const data = await response.json();
        if (!data.erro) {
          if (editingItem) {
            setEditingItem((prev: any) => ({
              ...prev,
              logradouro: data.logradouro || "",
              bairro: data.bairro || "",
              localidade: data.localidade || "",
              uf: data.uf || "",
              city: data.localidade || prev.city || "",
            }));
          } else {
            setNewItem((prev: any) => ({
              ...prev,
              logradouro: data.logradouro || "",
              bairro: data.bairro || "",
              localidade: data.localidade || "",
              uf: data.uf || "",
              city: data.localidade || prev.city || "",
            }));
          }
          addToast("CEP localizado com sucesso!", "success");
        } else {
          addToast("CEP não encontrado.", "error");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
        addToast("Erro ao buscar CEP.", "error");
      } finally {
        setLoadingCep(false);
      }
    }
  };
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
    const unsubscribeProfs = onSnapshot(
      collection(db, "professionals"),
      (snapshot) => {
        setProfessionals(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "professionals");
      },
    );
    const unsubscribeCats = onSnapshot(
      query(collection(db, "categories"), where("type", "==", "professional")),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "categories");
      },
    );
    return () => {
      unsubscribeProfs();
      unsubscribeCats();
    };
  }, []);

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Categoria",
      message:
        "Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "categories", id));
          await logAdminAction(
            "DELETE_CATEGORY",
            `Excluiu a categoria de profissional ID: ${id}`,
          );
          addToast("Categoria excluída com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir categoria:", err);
          addToast("Erro ao excluir categoria.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteProfessional = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Profissional",
      message:
        "Tem certeza que deseja excluir este profissional? Todos os dados vinculados serão perdidos.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "professionals", id));
          await logAdminAction(
            "DELETE_PROFESSIONAL",
            `Excluiu o profissional ID: ${id}`,
          );
          addToast("Profissional excluído com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir profissional:", err);
          addToast("Erro ao excluir profissional.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, type, ...data } = editingItem;
      const collectionName =
        type === "professional" ? "professionals" : "categories";
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      await logAdminAction(
        `UPDATE_${type.toUpperCase()}`,
        `Editou o ${type === "professional" ? "profissional" : "categoria"}: ${editingItem.name}`,
      );
      setEditingItem(null);
      addToast(
        `${type === "professional" ? "Profissional" : "Categoria"} atualizado com sucesso.`,
        "success",
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `professionals/${editingItem.id}`,
      );
      addToast(
        `Erro ao atualizar ${editingItem.type === "professional" ? "profissional" : "categoria"}.`,
        "error",
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === "professional") {
        await addDoc(collection(db, "professionals"), {
          name: newItem.name,
          specialty: newItem.specialty,
          vittaHealthDiscount: newItem.vittaHealthDiscount || "0%",
          registrationNumber: newItem.registrationNumber,
          availableDays: newItem.availableDays,
          price: newItem.price,
          city: newItem.city,
          rating: 5.0,
          reviews: 0,
          imageUrl:
            newItem.imageUrl || "https://picsum.photos/seed/prof/400/300",
          whatsapp: newItem.whatsapp || "",
          email: newItem.email || "",
          cep: newItem.cep || "",
          logradouro: newItem.logradouro || "",
          numero: newItem.numero || "",
          complemento: newItem.complemento || "",
          bairro: newItem.bairro || "",
          localidade: newItem.localidade || "",
          uf: newItem.uf || "",
          createdAt: new Date().toISOString(),
        });
        await logAdminAction(
          "CREATE_PROFESSIONAL",
          `Criou o profissional: ${newItem.name}`,
        );
      } else if (isCreating === "category") {
        await addDoc(collection(db, "categories"), {
          name: newItem.name,
          slug: newItem.name.toLowerCase().replace(/\s+/g, "-"),
          type: "professional",
          createdAt: new Date().toISOString(),
        });
        await logAdminAction(
          "CREATE_CATEGORY",
          `Criou a categoria de profissional: ${newItem.name}`,
        );
      }
      setIsCreating(null);
      setNewItem({
        name: "",
        specialty: "Médico",
        vittaHealthDiscount: "",
        registrationNumber: "",
        availableDays: "",
        price: "",
        city: "",
        imageUrl: "",
        whatsapp: "",
        email: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        localidade: "",
        uf: "",
      });
      addToast(
        `${isCreating === "professional" ? "Profissional" : "Categoria"} criado com sucesso.`,
        "success",
      );
    } catch (err) {
      console.error("Erro ao criar item:", err);
      addToast("Erro ao criar item.", "error");
    }
  };

  return (
    <div className="space-y-8">
      {/* Edit/Create Modal */}
      <AnimatePresence>
        {agendaProfessional && (
          <AvailabilityPlannerModal
            isOpen={!!agendaProfessional}
            professional={agendaProfessional}
            onClose={() => setAgendaProfessional(null)}
          />
        )}
        {(editingItem || isCreating) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingItem
                    ? `Editar ${editingItem.type === "professional" ? "Profissional" : "Categoria"}`
                    : `Novo ${isCreating === "professional" ? "Profissional" : "Categoria"}`}
                </h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(null);
                  }}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form
                onSubmit={editingItem ? handleSaveEdit : handleCreate}
                className="p-6 space-y-4 overflow-y-auto"
              >
                {(isCreating === "professional" ||
                  (editingItem && editingItem.type === "professional")) && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1 mr-2">
                      Foto de Perfil do Profissional
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() =>
                        document.getElementById("prof-img-file-input")?.click()
                      }
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                        isDragging
                          ? "border-vitta-green bg-vitta-green/5"
                          : "border-vitta-border bg-vitta-surface-2 hover:border-vitta-green/40 hover:bg-vitta-surface-3"
                      }`}
                    >
                      <input
                        id="prof-img-file-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />

                      {editingItem?.imageUrl || newItem.imageUrl ? (
                        <div className="relative group/img">
                          <img
                            src={
                              editingItem
                                ? editingItem.imageUrl
                                : newItem.imageUrl
                            }
                            alt="Preview do Profissional"
                            className="w-20 h-20 rounded-xl object-cover border border-vitta-border shadow-md"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                            <Upload size={16} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-vitta-surface border border-vitta-border flex items-center justify-center text-vitta-text-muted">
                          <User size={24} />
                        </div>
                      )}

                      <div className="text-center">
                        <p className="text-xs font-bold text-vitta-text-primary">
                          Arraste ou clique para enviar
                        </p>
                        <p className="text-[10px] text-vitta-text-muted mt-0.5">
                          Formatos PNG, JPG ou WEBP até 2MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            name: e.target.value,
                          })
                        : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                    autoFocus
                  />
                </div>
                {(isCreating === "professional" ||
                  (editingItem && editingItem.type === "professional")) && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        Especialidade
                      </label>
                      <input
                        type="text"
                        required
                        value={
                          editingItem
                            ? editingItem.specialty
                            : newItem.specialty
                        }
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({
                                ...editingItem,
                                specialty: e.target.value,
                              })
                            : setNewItem({
                                ...newItem,
                                specialty: e.target.value,
                              })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        Desconto ViTTA Health
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 20% OFF"
                        value={
                          editingItem
                            ? editingItem.vittaHealthDiscount
                            : newItem.vittaHealthDiscount
                        }
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({
                                ...editingItem,
                                vittaHealthDiscount: e.target.value,
                              })
                            : setNewItem({
                                ...newItem,
                                vittaHealthDiscount: e.target.value,
                              })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        Número do Registro
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: CRM 12345"
                        value={
                          editingItem
                            ? editingItem.registrationNumber
                            : newItem.registrationNumber
                        }
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({
                                ...editingItem,
                                registrationNumber: e.target.value,
                              })
                            : setNewItem({
                                ...newItem,
                                registrationNumber: e.target.value,
                              })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        E-mail do Profissional (para Vínculo de Conta)
                      </label>
                      <input
                        type="email"
                        placeholder="Ex: profissional@email.com"
                        value={
                          editingItem
                            ? editingItem.email || ""
                            : newItem.email || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          editingItem
                            ? setEditingItem({ ...editingItem, email: val })
                            : setNewItem({ ...newItem, email: val });
                        }}
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        WhatsApp de Direcionamento (com DDD)
                      </label>
                      <input
                        id="professional-whatsapp-input"
                        type="text"
                        placeholder="Ex: 5528999881386"
                        value={
                          editingItem
                            ? editingItem.whatsapp || ""
                            : newItem.whatsapp || ""
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          editingItem
                            ? setEditingItem({ ...editingItem, whatsapp: val })
                            : setNewItem({ ...newItem, whatsapp: val });
                        }}
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                        Dias de Atendimento
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Seg, Qua, Sex"
                        value={
                          editingItem
                            ? editingItem.availableDays
                            : newItem.availableDays
                        }
                        onChange={(e) =>
                          editingItem
                            ? setEditingItem({
                                ...editingItem,
                                availableDays: e.target.value,
                              })
                            : setNewItem({
                                ...newItem,
                                availableDays: e.target.value,
                              })
                        }
                        className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                          Valor (Opcional)
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 150,00"
                          value={
                            editingItem ? editingItem.price : newItem.price
                          }
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({
                                  ...editingItem,
                                  price: e.target.value,
                                })
                              : setNewItem({
                                  ...newItem,
                                  price: e.target.value,
                                })
                          }
                          className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                          Cidade Principal
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: São Paulo"
                          value={editingItem ? editingItem.city : newItem.city}
                          onChange={(e) =>
                            editingItem
                              ? setEditingItem({
                                  ...editingItem,
                                  city: e.target.value,
                                })
                              : setNewItem({ ...newItem, city: e.target.value })
                          }
                          className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                        />
                      </div>
                    </div>

                    {/* Complete Address Fields - Prefilled through CEP */}
                    <div className="space-y-4 pt-4 border-t border-vitta-border mt-3">
                      <p className="text-xs font-bold text-vitta-text-primary px-1">
                        Endereço de Atendimento
                      </p>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1 space-y-2">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            CEP
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="00000-000"
                              value={
                                editingItem
                                  ? editingItem.cep || ""
                                  : newItem.cep || ""
                              }
                              onChange={(e) => handleCepChange(e.target.value)}
                              className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                            />
                            {loadingCep && (
                              <div className="absolute right-2.5 top-3.5">
                                <div className="w-4 h-4 border-2 border-vitta-green border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Rua / Logradouro
                          </label>
                          <input
                            type="text"
                            placeholder="Rua, Avenida..."
                            value={
                              editingItem
                                ? editingItem.logradouro || ""
                                : newItem.logradouro || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              editingItem
                                ? setEditingItem({
                                    ...editingItem,
                                    logradouro: val,
                                  })
                                : setNewItem({ ...newItem, logradouro: val });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Número
                          </label>
                          <input
                            type="text"
                            placeholder="Nº"
                            value={
                              editingItem
                                ? editingItem.numero || ""
                                : newItem.numero || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              editingItem
                                ? setEditingItem({
                                    ...editingItem,
                                    numero: val,
                                  })
                                : setNewItem({ ...newItem, numero: val });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Complemento
                          </label>
                          <input
                            type="text"
                            placeholder="Apt, Bloco..."
                            value={
                              editingItem
                                ? editingItem.complemento || ""
                                : newItem.complemento || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              editingItem
                                ? setEditingItem({
                                    ...editingItem,
                                    complemento: val,
                                  })
                                : setNewItem({ ...newItem, complemento: val });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2 col-span-1">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Bairro
                          </label>
                          <input
                            type="text"
                            placeholder="Bairro"
                            value={
                              editingItem
                                ? editingItem.bairro || ""
                                : newItem.bairro || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              editingItem
                                ? setEditingItem({
                                    ...editingItem,
                                    bairro: val,
                                  })
                                : setNewItem({ ...newItem, bairro: val });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>

                        <div className="space-y-2 col-span-1">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Cidade
                          </label>
                          <input
                            type="text"
                            placeholder="Cidade"
                            value={
                              editingItem
                                ? editingItem.city || ""
                                : newItem.city || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              editingItem
                                ? setEditingItem({
                                    ...editingItem,
                                    city: val,
                                    localidade: val,
                                  })
                                : setNewItem({
                                    ...newItem,
                                    city: val,
                                    localidade: val,
                                  });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>

                        <div className="space-y-2 col-span-1">
                          <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                            Estado (UF)
                          </label>
                          <input
                            type="text"
                            placeholder="UF"
                            maxLength={2}
                            value={
                              editingItem
                                ? editingItem.uf || ""
                                : newItem.uf || ""
                            }
                            onChange={(e) => {
                              const val = e.target.value.toUpperCase();
                              editingItem
                                ? setEditingItem({ ...editingItem, uf: val })
                                : setNewItem({ ...newItem, uf: val });
                            }}
                            className="w-full px-3 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreating(null);
                    }}
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
          <h1 className="text-3xl font-bold text-vitta-text-primary">
            Gerenciar Profissionais
          </h1>
          <p className="text-vitta-text-secondary">
            Cadastre especialistas e gerencie categorias
          </p>
        </div>
        <button
          onClick={() =>
            setIsCreating(activeSubTab === "list" ? "professional" : "category")
          }
          className="flex items-center gap-2 px-6 py-3 bg-vitta-green text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-green/20"
        >
          <Plus size={20} />
          {activeSubTab === "list" ? "Novo Profissional" : "Nova Categoria"}
        </button>
      </div>

      <div className="flex gap-4 border-b border-vitta-border">
        <button
          onClick={() => setActiveSubTab("list")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "list"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"
          }`}
        >
          <Users size={18} />
          Profissionais ({professionals.length})
        </button>
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "categories"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"
          }`}
        >
          <LayoutGrid size={18} />
          Categorias ({categories.length})
        </button>
      </div>

      {activeSubTab === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {professionals.map((prof) => (
            <motion.div
              key={prof.id}
              whileHover={{ y: -4 }}
              className="bg-vitta-surface p-6 rounded-2xl border border-vitta-border shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img
                    src={prof.imageUrl}
                    alt={prof.name}
                    className="w-14 h-14 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-vitta-text-primary">
                      {prof.name}
                    </h3>
                    <p className="text-xs text-vitta-text-secondary">
                      {prof.specialty}
                    </p>
                    {prof.registrationNumber && (
                      <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mt-1">
                        {prof.registrationNumber}
                      </p>
                    )}
                    {prof.price && (
                      <p className="text-xs font-bold text-vitta-text-primary mt-1">
                        Valor:{" "}
                        <span className="text-vitta-green font-extrabold">
                          {prof.price}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setAgendaProfessional(prof)}
                    title="Configurar Agenda"
                    className="p-2 text-vitta-text-muted hover:text-vitta-accent transition-colors"
                  >
                    <CalendarClock size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setEditingItem({
                        type: "professional",
                        id: prof.id,
                        name: prof.name,
                        specialty: prof.specialty,
                        vittaHealthDiscount: prof.vittaHealthDiscount || "",
                        registrationNumber: prof.registrationNumber || "",
                        price: prof.price || "",
                        city: prof.city || "",
                        availableDays: prof.availableDays || "",
                        imageUrl: prof.imageUrl || "",
                        whatsapp: prof.whatsapp || "",
                        email: prof.email || "",
                        cep: prof.cep || "",
                        logradouro: prof.logradouro || "",
                        numero: prof.numero || "",
                        complemento: prof.complemento || "",
                        bairro: prof.bairro || "",
                        localidade: prof.localidade || "",
                        uf: prof.uf || "",
                      })
                    }
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

              <div className="border-t border-vitta-border pt-3 space-y-2 text-xs">
                {prof.city && (
                  <div className="flex items-center gap-2 text-vitta-text-secondary">
                    <MapPin
                      size={14}
                      className="text-vitta-text-muted shrink-0"
                    />
                    <span>{prof.city}</span>
                  </div>
                )}
                {prof.availableDays && (
                  <div className="flex items-center gap-2 text-vitta-text-secondary">
                    <Calendar
                      size={14}
                      className="text-vitta-text-muted shrink-0"
                    />
                    <span>{prof.availableDays}</span>
                  </div>
                )}
                {prof.whatsapp && (
                  <div className="flex items-center gap-2 text-vitta-text-secondary">
                    <Phone size={14} className="text-vitta-green shrink-0" />
                    <span>
                      WhatsApp:{" "}
                      <strong className="font-medium text-vitta-text-primary">
                        {prof.whatsapp}
                      </strong>
                    </span>
                  </div>
                )}
                {prof.vittaHealthDiscount && (
                  <div className="flex items-center gap-2 text-vitta-text-secondary">
                    <Tag size={14} className="text-vitta-accent shrink-0" />
                    <span>
                      Desconto Assinante:{" "}
                      <span className="font-bold text-vitta-accent">
                        {prof.vittaHealthDiscount}
                      </span>
                    </span>
                  </div>
                )}
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
                <h3 className="font-bold text-vitta-text-primary">
                  {category.name}
                </h3>
                <p className="text-[10px] text-vitta-text-muted uppercase font-bold tracking-widest">
                  {category.slug}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    setEditingItem({
                      type: "category",
                      id: category.id,
                      name: category.name,
                    })
                  }
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

const ProfessionalsView = ({
  user,
  userData,
  googleToken,
}: {
  user: any;
  userData?: any;
  googleToken?: string | null;
}) => {
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingProfessional, setBookingProfessional] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("Todos");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "professionals"),
      (snapshot) => {
        setProfessionals(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "professionals");
      },
    );
    return () => unsubscribe();
  }, []);

  const filteredProfessionals = useMemo(() => {
    return professionals.filter((prof) => {
      const matchesSearch =
        prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prof.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSpecialty =
        selectedSpecialty === "Todos" || prof.specialty === selectedSpecialty;
      return matchesSearch && matchesSpecialty;
    });
  }, [professionals, searchQuery, selectedSpecialty]);

  const specialties = useMemo(() => {
    const specs = new Set(professionals.map((p) => p.specialty));
    return ["Todos", ...Array.from(specs)];
  }, [professionals]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
          Nossos Profissionais
        </h1>
        <p className="text-vitta-text-secondary">
          Encontre os melhores especialistas para cuidar de você.
        </p>
      </section>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
            size={18}
          />
          <input
            type="text"
            placeholder="Buscar por nome ou especialidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-green/20 transition-all text-vitta-text-primary"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                selectedSpecialty === spec
                  ? "bg-vitta-green text-white"
                  : "bg-vitta-surface text-vitta-text-secondary border border-vitta-border hover:bg-vitta-surface-2"
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
                <img
                  src={prof.imageUrl}
                  alt={prof.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg text-vitta-text-primary">
                    {prof.name}
                  </h3>
                  <p className="text-sm text-vitta-text-secondary">
                    {prof.specialty}
                  </p>
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
                  {prof.whatsapp && (
                    <div className="flex items-center gap-1 text-[10px] text-vitta-text-muted mt-1">
                      <Phone size={10} className="text-vitta-green" />
                      <span>WhatsApp (Direto)</span>
                    </div>
                  )}
                  {prof.vittaHealthDiscount && (
                    <div className="mt-1 px-2 py-0.5 bg-vitta-green-bg text-vitta-green rounded-lg text-[10px] font-bold inline-block">
                      ViTTA Health: {prof.vittaHealthDiscount}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-vitta-amber mt-1">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs font-bold">
                      {prof.rating} ({prof.reviews} avaliações)
                    </span>
                  </div>
                  {prof.price && (
                    <p className="text-sm font-bold text-vitta-green mt-1">
                      {prof.price}
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-vitta-border">
                <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-wider mb-2">
                  Disponibilidade
                </p>
                <div className="flex flex-wrap gap-2">
                  {(prof.availableDays
                    ? typeof prof.availableDays === "string"
                      ? prof.availableDays
                          .split(",")
                          .map((s: string) => s.trim())
                      : prof.availableDays
                    : ["Seg", "Qua", "Sex"]
                  ).map((day: string) => (
                    <span
                      key={day}
                      className="px-2 py-1 bg-vitta-surface-2 text-vitta-text-secondary rounded-lg text-[10px] font-bold"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setBookingProfessional(prof)}
                className="w-full py-3 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors shadow-lg shadow-vitta-green/20"
              >
                Ver Perfil e Agendar
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-vitta-surface rounded-3xl border border-dashed border-vitta-border">
          <Search size={48} className="mx-auto text-vitta-text-muted mb-4" />
          <p className="text-vitta-text-secondary font-medium">
            Nenhum profissional encontrado para sua busca.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedSpecialty("Todos");
            }}
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
        userData={userData}
        googleToken={googleToken}
      />
    </div>
  );
};

const getIcon = (iconName: string, size = 24, className = "text-white") => {
  const icons: { [key: string]: any } = {
    Heart,
    Store,
    Glasses,
    ShoppingCart,
    Shirt,
    Baby,
    Footprints,
    Zap,
    Armchair,
    Hammer,
    Coffee,
    Pizza,
    IceCream,
    Fuel,
    PawPrint,
    Calculator,
    Scissors,
    Wrench,
    Pill,
    ShoppingBag,
    Utensils,
    Car,
    GraduationCap,
    Dumbbell,
    Stethoscope,
    Gamepad2,
    Book,
    Music,
    Camera,
    Plane,
    Home,
    Smartphone,
  };
  const IconComp = icons[iconName] || HelpCircle;
  return <IconComp size={size} className={className} />;
};

const PartnersView = ({
  setActiveTab,
  user,
}: {
  setActiveTab?: (tab: string) => void;
  user?: any;
}) => {
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  useEffect(() => {
    const unsubscribePartners = onSnapshot(
      collection(db, "partners"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPartners(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "partners");
      },
    );

    const unsubscribeCategories = onSnapshot(
      query(collection(db, "categories"), where("type", "==", "partner")),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "categories");
      },
    );

    return () => {
      unsubscribePartners();
      unsubscribeCategories();
    };
  }, []);

  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  const filteredPartners = useMemo(() => {
    return partners.filter((partner) => {
      const matchesSearch = partner.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || partner.category === selectedCategory.name;
      return matchesSearch && matchesCategory;
    });
  }, [partners, searchQuery, selectedCategory]);

  const getPartnersCount = (categoryName: string) => {
    return partners.filter((p) => p.category === categoryName).length;
  };

  const handleGetDiscount = (partner: any) => {
    if (!user) return;
    const phoneNumber = "5528999881386";
    const message = `Olá! Sou afiliado ViTTA e gostaria de obter o desconto no parceiro.\n\n*Meus dados:*\nNome: ${user.displayName || "Usuário"}\nEmail: ${user.email}\n\n*Parceiro:*\nNome: ${partner.name}\nDesconto: ${partner.discount}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
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
            <h1 className="text-3xl font-bold text-vitta-text-primary">
              {selectedCategory.name}
            </h1>
            <p className="text-vitta-text-secondary">
              Veja todos os parceiros nesta categoria
            </p>
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
                  <img
                    src={
                      partner.imageUrl ||
                      "https://picsum.photos/seed/partner/100/100"
                    }
                    alt={partner.name}
                    className="w-16 h-16 rounded-2xl object-cover border border-vitta-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-vitta-text-primary truncate">
                      {partner.name}
                    </h3>
                    <p className="text-sm text-vitta-green font-bold">
                      {partner.discount}
                    </p>
                    <div className="flex items-center gap-1 text-vitta-amber mt-1">
                      <Star size={14} fill="currentColor" />
                      <span className="text-xs font-bold">
                        {partner.rating || "5.0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-vitta-border space-y-2">
                  <div className="flex items-start gap-2 text-xs text-vitta-text-secondary">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{partner.address || "Endereço não informado"}</span>
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
            <p className="text-vitta-text-secondary font-medium">
              Nenhum parceiro encontrado nesta categoria.
            </p>
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
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            Convênios ViTTA
          </h1>
          <p className="text-lg text-vitta-surface opacity-90 leading-relaxed">
            Descontos exclusivos em centenas de estabelecimentos parceiros em
            diversas categorias.
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
            <h2 className="text-2xl font-bold text-vitta-text-primary">
              ViTTA Health
            </h2>
            <p className="text-vitta-text-secondary">
              Acesse nossa rede exclusiva de profissionais de saúde com
              descontos especiais para afiliados ViTTA.
            </p>
          </div>
          <button
            onClick={() => setActiveTab?.("professionals")}
            className="px-8 py-4 bg-vitta-green text-white rounded-2xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20 whitespace-nowrap"
          >
            Ver Profissionais
          </button>
        </div>
      </section>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            label: "Categorias Disponíveis",
            value: categories.length,
            color: "text-vitta-green",
          },
          {
            label: "Estabelecimentos Parceiros",
            value: partners.length + "+",
            color: "text-vitta-accent",
          },
          {
            label: "De Desconto para Afiliados",
            value: "Até 50%",
            color: "text-vitta-danger",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm text-center space-y-1"
          >
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className="absolute left-6 top-1/2 -translate-y-1/2 text-vitta-text-muted"
          size={20}
        />
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
            <h2 className="text-2xl font-bold text-vitta-text-primary">
              {filteredCategories.length} Categorias
            </h2>
            <p className="text-vitta-text-secondary">
              Explore todos os convênios disponíveis para afiliados ViTTA
            </p>
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
                <div
                  className={`h-32 ${cat.color || "bg-vitta-text-muted"} relative flex items-center justify-center transition-transform group-hover:scale-105 duration-500`}
                >
                  {getIcon(cat.icon)}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider">
                    {getPartnersCount(cat.name)} parceiros
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-vitta-text-primary mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-vitta-text-secondary line-clamp-2">
                    {cat.description || "Descontos exclusivos para afiliados"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-vitta-surface rounded-xl border border-dashed border-vitta-border">
            <Search size={48} className="mx-auto text-vitta-text-muted mb-4" />
            <p className="text-vitta-text-secondary font-medium">
              Nenhuma categoria encontrada para sua busca.
            </p>
            <button
              onClick={() => setSearchQuery("")}
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
  const [activeTab, setActiveTab] = useState<"all" | "my-vouchers">("all");
  const [offers, setOffers] = useState<any[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  const generateVoucherCode = () => {
    return `VITTA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  };

  const handleRedeem = async (offer: any) => {
    if (!user) return;

    setRedeeming(offer.id);
    try {
      const voucherCode = generateVoucherCode();
      const voucherData = {
        userId: user.uid,
        offerId: offer.id,
        offerTitle: offer.title,
        offerPartner: offer.partner,
        offerDiscount: offer.discount,
        code: voucherCode,
        status: "active",
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, "vouchers"), voucherData);

      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Cupom Gerado!",
        message: `Você gerou o cupom para "${offer.title}". Código: ${voucherCode}`,
        type: "offer",
        read: false,
        createdAt: Timestamp.now(),
      });

      setSelectedVoucher({ id: docRef.id, ...voucherData });
      setShowVoucherModal(true);
    } catch (err) {
      console.error("Erro ao resgatar oferta:", err);
      handleFirestoreError(err, OperationType.CREATE, "vouchers");
    } finally {
      setRedeeming(null);
    }
  };

  useEffect(() => {
    const unsubscribeOffers = onSnapshot(
      collection(db, "offers"),
      (snapshot) => {
        setOffers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        if (activeTab === "all") setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "offers");
      },
    );

    return () => unsubscribeOffers();
  }, [activeTab]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "vouchers"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsubscribeVouchers = onSnapshot(
      q,
      (snapshot) => {
        setMyVouchers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        if (activeTab === "my-vouchers") setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "vouchers");
      },
    );

    return () => unsubscribeVouchers();
  }, [user, activeTab]);

  const filteredOffers = useMemo(() => {
    return offers.filter(
      (offer) =>
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (offer.description &&
          offer.description.toLowerCase().includes(searchQuery.toLowerCase())),
    );
  }, [offers, searchQuery]);

  const filteredVouchers = useMemo(() => {
    return myVouchers.filter(
      (v) =>
        v.offerTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.offerPartner.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [myVouchers, searchQuery]);

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black mb-2 text-vitta-text-primary tracking-tight">
            Benefícios e Ofertas
          </h1>
          <p className="text-vitta-text-secondary text-lg">
            Aproveite descontos exclusivos em nossa rede de parceiros.
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted group-focus-within:text-vitta-accent transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder={
              activeTab === "all"
                ? "Buscar ofertas ou parceiros..."
                : "Buscar nos meus cupons..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-vitta-surface border-2 border-vitta-border rounded-2xl text-sm focus:ring-4 focus:ring-vitta-accent/10 focus:border-vitta-accent outline-none transition-all text-vitta-text-primary shadow-sm"
          />
        </div>
      </section>

      <div className="flex gap-4 p-1.5 bg-vitta-surface-2 rounded-2xl w-fit">
        <button
          onClick={() => {
            setActiveTab("all");
            setLoading(true);
          }}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === "all" ? "bg-vitta-surface text-vitta-accent shadow-md" : "text-vitta-text-muted hover:text-vitta-text-secondary"}`}
        >
          Explorar Ofertas
        </button>
        <button
          onClick={() => {
            setActiveTab("my-vouchers");
            setLoading(true);
          }}
          className={`px-8 py-3 rounded-xl font-bold text-sm transition-all relative ${activeTab === "my-vouchers" ? "bg-vitta-surface text-vitta-accent shadow-md" : "text-vitta-text-muted hover:text-vitta-text-secondary"}`}
        >
          Meus Cupons
          {myVouchers.length > 0 && activeTab !== "my-vouchers" && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-vitta-accent text-white text-[10px] flex items-center justify-center rounded-full border-2 border-vitta-surface">
              {myVouchers.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "all" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-80 bg-vitta-surface animate-pulse rounded-3xl border border-vitta-border"
              ></div>
            ))
          ) : filteredOffers.length > 0 ? (
            filteredOffers.map((offer) => (
              <motion.div
                key={offer.id}
                whileHover={{ y: -8 }}
                className="bg-vitta-surface rounded-[2rem] border-2 border-vitta-border shadow-xl hover:shadow-2xl hover:border-vitta-accent/30 transition-all overflow-hidden flex flex-col group"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={
                      offer.imageUrl ||
                      `https://picsum.photos/seed/${offer.id}/600/400`
                    }
                    alt={offer.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-vitta-text-primary shadow-xl">
                    {offer.partner}
                  </div>
                  <div className="absolute bottom-6 right-6 bg-vitta-accent text-white px-5 py-2.5 rounded-full text-base font-black shadow-2xl flex items-center gap-2">
                    <Tag size={18} />
                    {offer.discount}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="font-black text-2xl mb-3 text-vitta-text-primary leading-tight">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-vitta-text-secondary mb-8 flex-1 leading-relaxed">
                    {offer.description ||
                      "Aproveite esta oferta exclusiva para membros ViTTA."}
                  </p>

                  {offer.expiryDate && (
                    <div className="flex items-center gap-2 mb-6 text-vitta-danger font-bold text-xs bg-vitta-danger/10 px-4 py-2 rounded-xl w-fit">
                      <Clock size={14} />
                      Válido até:{" "}
                      {new Date(offer.expiryDate).toLocaleDateString()}
                    </div>
                  )}

                  <button
                    onClick={() => handleRedeem(offer)}
                    disabled={redeeming === offer.id}
                    className="w-full py-4 bg-vitta-text-primary text-white rounded-2xl text-sm font-black hover:bg-black transition-all flex items-center justify-center gap-2 shadow-xl hover:shadow-vitta-text-primary/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    {redeeming === offer.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Zap
                          size={18}
                          className="text-vitta-accent fill-vitta-accent"
                        />
                        Resgatar Agora
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-vitta-surface rounded-[3rem] border-4 border-dashed border-vitta-border">
              <div className="w-24 h-24 bg-vitta-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 text-vitta-text-muted">
                <Search size={40} />
              </div>
              <h3 className="text-2xl font-black text-vitta-text-primary mb-2">
                Nenhuma oferta encontrada
              </h3>
              <p className="text-vitta-text-secondary max-w-sm mx-auto">
                Tente buscar por outro termo ou parceiro para encontrar
                descontos incríveis.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredVouchers.length > 0 ? (
            filteredVouchers.map((v) => (
              <motion.div
                key={v.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-vitta-surface rounded-[2.5rem] border-2 border-vitta-border p-8 shadow-large flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <div
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${v.status === "active" ? "bg-vitta-green/10 text-vitta-green" : "bg-vitta-danger/10 text-vitta-danger"}`}
                  >
                    {v.status === "active" ? "Ativo" : "Utilizado"}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-vitta-accent/10 text-vitta-accent rounded-2xl flex items-center justify-center shrink-0">
                    <Ticket size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-vitta-text-primary leading-tight">
                      {v.offerTitle}
                    </h3>
                    <p className="text-xs font-bold text-vitta-text-muted uppercase tracking-widest">
                      {v.offerPartner}
                    </p>
                  </div>
                </div>

                <div className="bg-vitta-surface-2 p-6 rounded-3xl mb-8 border border-vitta-border border-dashed flex flex-col items-center">
                  <p className="text-[10px] font-black text-vitta-text-muted uppercase tracking-[0.2em] mb-2">
                    Código do Cupom
                  </p>
                  <p className="text-2xl font-black text-vitta-accent tracking-widest font-mono select-all">
                    {v.code}
                  </p>
                </div>

                <div className="flex flex-col gap-3 mt-auto">
                  <button
                    onClick={() => {
                      setSelectedVoucher(v);
                      setShowVoucherModal(true);
                    }}
                    className="w-full py-4 bg-vitta-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-vitta-accent/90 transition-all shadow-lg shadow-vitta-accent/20"
                  >
                    Ver Voucher
                  </button>
                  <p className="text-[10px] text-vitta-text-muted text-center italic">
                    Gerado em:{" "}
                    {v.createdAt && "toDate" in v.createdAt
                      ? v.createdAt.toDate().toLocaleDateString()
                      : new Date().toLocaleDateString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-vitta-surface rounded-[3rem] border-4 border-dashed border-vitta-border">
              <div className="w-24 h-24 bg-vitta-surface-2 rounded-full flex items-center justify-center mx-auto mb-6 text-vitta-text-muted">
                <Ticket size={40} />
              </div>
              <h3 className="text-2xl font-black text-vitta-text-primary mb-2">
                Você ainda não tem cupons
              </h3>
              <p className="text-vitta-text-secondary max-w-sm mx-auto mb-8">
                Resgate suas primeiras ofertas para economizar em exames,
                consultas e farmácias.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="px-8 py-3 bg-vitta-accent text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Explorar Ofertas
              </button>
            </div>
          )}
        </div>
      )}

      {/* Voucher Modal */}
      <AnimatePresence>
        {showVoucherModal && selectedVoucher && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-vitta-text-primary/40 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-vitta-surface w-full max-w-sm rounded-[3rem] shadow-2xl border-4 border-vitta-accent/20 overflow-hidden relative"
            >
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setShowVoucherModal(false)}
                  className="p-3 bg-vitta-surface/80 backdrop-blur rounded-full text-vitta-text-primary hover:bg-vitta-surface transition-colors shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-vitta-accent/10 text-vitta-accent rounded-3xl flex items-center justify-center mb-8">
                  <Ticket size={40} />
                </div>

                <div className="text-center mb-10">
                  <h3 className="text-2xl font-black text-vitta-text-primary mb-2 leading-tight">
                    {selectedVoucher.offerTitle}
                  </h3>
                  <p className="text-vitta-accent font-black uppercase tracking-widest text-sm">
                    {selectedVoucher.offerPartner}
                  </p>
                  <div className="inline-block mt-4 px-4 py-1.5 bg-vitta-green text-white rounded-full text-xs font-black shadow-lg">
                    {selectedVoucher.offerDiscount}
                  </div>
                </div>

                <div className="w-full bg-vitta-surface-2 rounded-[2rem] p-8 border-2 border-vitta-border border-dashed relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-vitta-surface rounded-full border-2 border-vitta-border -ml-3"></div>
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-vitta-surface rounded-full border-2 border-vitta-border -mr-3"></div>

                  <div className="flex flex-col items-center mb-6">
                    <div className="w-32 h-32 bg-white rounded-2xl p-2 mb-4 border border-vitta-border shadow-sm flex items-center justify-center">
                      {/* Placeholder for QR Code */}
                      <div className="w-full h-full bg-vitta-surface-3 rounded-lg flex items-center justify-center border-2 border-vitta-border border-dotted">
                        <QrCode size={48} className="text-vitta-text-muted" />
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-vitta-text-muted uppercase tracking-[0.2em] mb-2">
                      Código do Cupom
                    </p>
                    <p className="text-3xl font-black text-vitta-accent tracking-[0.3em] font-mono select-all">
                      {selectedVoucher.code}
                    </p>
                  </div>
                </div>

                <div className="mt-10 space-y-4 w-full">
                  <button
                    onClick={() => {
                      const msg = `Olá! Tenho um cupom ViTTA para resgatar.\n\n*Código: ${selectedVoucher.code}*\nOferta: ${selectedVoucher.offerTitle}\nParceiro: ${selectedVoucher.offerPartner}`;
                      window.open(
                        `https://wa.me/5528999881386?text=${encodeURIComponent(msg)}`,
                        "_blank",
                      );
                    }}
                    className="w-full py-4 bg-vitta-green text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3 shadow-xl shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all active:scale-[0.98]"
                  >
                    <Phone size={20} />
                    Falar no WhatsApp
                  </button>
                  <p className="text-[10px] text-vitta-text-secondary text-center px-6">
                    Apresente este código ou QR Code no estabelecimento parceiro
                    para validar seu desconto.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SettingsView = ({
  isDarkMode,
  setIsDarkMode,
  user,
  userData,
  googleToken,
  setGoogleToken,
}: {
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  user: FirebaseUser | null;
  userData: any;
  googleToken: string | null;
  setGoogleToken: (token: string | null) => void;
}) => {
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFrontFile, setSelectedFrontFile] = useState<File | null>(null);
  const [selectedBackFile, setSelectedBackFile] = useState<File | null>(null);
  const [profileData, setProfileData] = useState({
    name: userData?.name || user?.displayName || "",
    email: userData?.email || user?.email || "",
    phone: userData?.phone || "",
    zip: userData?.zip || "",
    street: userData?.street || "",
    number: userData?.number || "",
    complement: userData?.complement || "",
    neighborhood: userData?.neighborhood || "",
    city: userData?.city || "",
    state: userData?.state || "",
    cpf: userData?.cpf || "",
    rg: userData?.rg || "",
    birthDate: userData?.birthDate || "",
    gender: userData?.gender || "Não informado",
    motherName: userData?.motherName || "",
    kycStatus: userData?.kycStatus || "pending",
    documentFrontUrl: userData?.documentFrontUrl || "",
    documentBackUrl: userData?.documentBackUrl || "",
    photoURL:
      userData?.photoURL ||
      user?.photoURL ||
      "https://picsum.photos/seed/user/200/200",
    deletionRequested: userData?.deletionRequested || false,
    twoFactorEnabled: userData?.twoFactorEnabled || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isKYCWizardOpen, setIsKYCWizardOpen] = useState(false);

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 0.2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/jpeg",
    };
    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error("Erro ao comprimir imagem:", error);
      return file;
    }
  };

  const handleCepChange = async (cep: string) => {
    setProfileData((prev) => ({ ...prev, zip: cep }));
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setIsSearchingCep(true);
      const address = await fetchAddressByCep(cleanCep);
      if (address) {
        setProfileData((prev) => ({
          ...prev,
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        }));
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.zip;
          return newErrors;
        });
      } else {
        setErrors((prev) => ({ ...prev, zip: "CEP não encontrado" }));
      }
      setIsSearchingCep(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setProfileData((prev) => ({
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
        birthDate: userData.birthDate || prev.birthDate,
        gender: userData.gender || prev.gender,
        motherName: userData.motherName || prev.motherName,
        kycStatus: userData.kycStatus || prev.kycStatus,
        documentFrontUrl: userData.documentFrontUrl || prev.documentFrontUrl,
        documentBackUrl: userData.documentBackUrl || prev.documentBackUrl,
        photoURL: userData.photoURL || prev.photoURL,
        deletionRequested: userData.deletionRequested || false,
        twoFactorEnabled: userData.twoFactorEnabled || false,
      }));
    }
  }, [userData]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsSaving(true);
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData((prev) => ({
          ...prev,
          photoURL: reader.result as string,
        }));
      };
      reader.readAsDataURL(compressedFile);
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate CPF if present
    if (
      profileData.cpf &&
      profileData.cpf.replace(/\D/g, "").length === 11 &&
      !validateCPF(profileData.cpf)
    ) {
      setErrors((prev) => ({ ...prev, cpf: "CPF Inválido" }));
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setUploadProgress({});

    try {
      let finalPhotoURL = profileData.photoURL;
      let finalFrontUrl = profileData.documentFrontUrl;
      let finalBackUrl = profileData.documentBackUrl;

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
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress((prev) => ({ ...prev, [key]: progress }));
            },
            (error) => reject(error),
            () => {
              getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                resolve(downloadURL);
              });
            },
          );
        });
      };

      if (selectedFile) {
        finalPhotoURL = await uploadWithProgress(
          selectedFile,
          `users/${user.uid}/profile_photo`,
          "photo",
        );
      }

      if (selectedFrontFile) {
        finalFrontUrl = await uploadWithProgress(
          selectedFrontFile,
          `users/${user.uid}/documents/front_id`,
          "front",
        );
      }

      if (selectedBackFile) {
        finalBackUrl = await uploadWithProgress(
          selectedBackFile,
          `users/${user.uid}/documents/back_id`,
          "back",
        );
      }

      let currentKycStatus = profileData.kycStatus;
      if (
        (selectedFrontFile ||
          selectedBackFile ||
          profileData.documentFrontUrl ||
          profileData.documentBackUrl) &&
        (profileData.kycStatus === "pending" ||
          profileData.kycStatus === "rejected")
      ) {
        currentKycStatus = "under_review";
      }

      const updatedData = {
        ...userData,
        ...profileData,
        photoURL: finalPhotoURL,
        documentFrontUrl: finalFrontUrl,
        documentBackUrl: finalBackUrl,
        kycStatus: currentKycStatus,
        uid: user.uid,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), updatedData, { merge: true });

      if (
        profileData.name !== user.displayName ||
        finalPhotoURL !== user.photoURL
      ) {
        await updateProfile(user, {
          displayName: profileData.name,
          photoURL: finalPhotoURL,
        });
      }

      setSelectedFile(null);
      setSelectedFrontFile(null);
      setSelectedBackFile(null);
      setSaveMessage({
        type: "success",
        text: "Perfil atualizado com sucesso!",
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      setSaveMessage({
        type: "error",
        text: "Erro ao salvar perfil. Tente novamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    const newValue = !profileData.twoFactorEnabled;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          twoFactorEnabled: newValue,
        },
        { merge: true },
      );
      setProfileData((prev) => ({ ...prev, twoFactorEnabled: newValue }));
      addToast(
        newValue ? "2FA ativado com sucesso!" : "2FA desativado.",
        "success",
      );
    } catch (err) {
      console.error("Erro ao alternar 2FA:", err);
    }
  };

  const handleRequestDeletion = async () => {
    if (!user) return;
    setIsConfirmModalOpen(true);
  };

  const confirmDeletion = async () => {
    if (!user) return;
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          deletionRequested: true,
          deletionRequestedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      // Confirmation notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Solicitação de Exclusão",
        message:
          "Recebemos sua solicitação de exclusão de conta. Nossa equipe processará o pedido em breve.",
        type: "system",
        read: false,
        createdAt: Timestamp.now(),
      });

      setProfileData((prev) => ({ ...prev, deletionRequested: true }));
      setSaveMessage({
        type: "success",
        text: "Solicitação de exclusão enviada com sucesso.",
      });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err) {
      console.error("Erro ao solicitar exclusão:", err);
      setSaveMessage({
        type: "error",
        text: "Erro ao solicitar exclusão. Tente novamente.",
      });
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
            Meu Perfil
          </h1>
          <p className="text-vitta-text-secondary">
            Gerencie suas informações pessoais, endereço e documentos.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-vitta-surface px-4 py-2 rounded-2xl border border-vitta-border shadow-sm">
          <div
            className={`w-3 h-3 rounded-full animate-pulse ${
              profileData.kycStatus === "verified"
                ? "bg-vitta-green"
                : profileData.kycStatus === "under_review"
                  ? "bg-vitta-accent"
                  : profileData.kycStatus === "rejected"
                    ? "bg-vitta-danger"
                    : "bg-vitta-text-muted"
            }`}
          />
          <div>
            <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
              Status da Conta
            </p>
            <p className="text-xs font-black text-vitta-text-primary capitalize">
              {profileData.kycStatus === "verified"
                ? "Verificada"
                : profileData.kycStatus === "under_review"
                  ? "Em Análise"
                  : profileData.kycStatus === "rejected"
                    ? "Rejeitada"
                    : "Pendente"}
            </p>
          </div>
          {profileData.kycStatus === "verified" && (
            <ShieldCheck size={18} className="text-vitta-green" />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* KYC Info Box */}
          {profileData.kycStatus === "pending" && (
            <div className="bg-vitta-accent/10 border border-vitta-accent/20 p-4 rounded-xl flex gap-3">
              <Info className="text-vitta-accent shrink-0" size={20} />
              <p className="text-xs text-vitta-text-secondary leading-relaxed">
                Complete seu perfil e envie as fotos do seu documento para
                verificar sua conta e ter acesso prioritário a benefícios.
              </p>
            </div>
          )}

          {/* Personal Info */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">
                Informações Pessoais
              </h2>
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
                {uploadProgress.photo > 0 && uploadProgress.photo < 100 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 p-2.5 bg-vitta-green text-white rounded-xl shadow-lg border-4 border-vitta-surface hover:scale-110 transition-transform cursor-pointer">
                  <Camera size={16} />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-muted cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="(00) 00000-0000"
                    className={`w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all ${errors.phone ? "ring-2 ring-vitta-danger/50" : ""}`}
                  />
                  {errors.phone && (
                    <p className="text-[10px] text-vitta-danger font-bold px-1">
                      {errors.phone}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Gênero
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all appearance-none"
                  >
                    <option value="Não informado">Não informado</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome da Mãe
                  </label>
                  <input
                    type="text"
                    value={profileData.motherName}
                    onChange={(e) =>
                      setProfileData((prev) => ({
                        ...prev,
                        motherName: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-green/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">
                Endereço
              </h2>
              <MapPin className="text-vitta-accent" size={20} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileData.zip}
                    onChange={(e) => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    className={`w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all ${errors.zip ? "ring-2 ring-vitta-danger/50" : ""}`}
                  />
                  {isSearchingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-vitta-accent/30 border-t-vitta-accent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {errors.zip && (
                  <p className="text-[10px] text-vitta-danger font-bold px-1">
                    {errors.zip}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Logradouro
                </label>
                <input
                  type="text"
                  value={profileData.street}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      street: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Número
                </label>
                <input
                  type="text"
                  value={profileData.number}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      number: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Complemento
                </label>
                <input
                  type="text"
                  value={profileData.complement}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      complement: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={profileData.neighborhood}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      neighborhood: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={profileData.city}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      city: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={profileData.state}
                  onChange={(e) =>
                    setProfileData((prev) => ({
                      ...prev,
                      state: e.target.value,
                    }))
                  }
                  placeholder="UF"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-accent/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">
                Documentos
              </h2>
              <CreditCard className="text-vitta-purple" size={20} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  CPF
                </label>
                <input
                  type="text"
                  value={profileData.cpf}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfileData((prev) => ({ ...prev, cpf: val }));
                    if (val.replace(/\D/g, "").length === 11) {
                      if (!validateCPF(val)) {
                        setErrors((prev) => ({ ...prev, cpf: "CPF Inválido" }));
                      } else {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.cpf;
                          return newErrors;
                        });
                      }
                    }
                  }}
                  placeholder="000.000.000-00"
                  className={`w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-purple/20 transition-all ${errors.cpf ? "ring-2 ring-vitta-danger/50" : ""}`}
                />
                {errors.cpf && (
                  <p className="text-[10px] text-vitta-danger font-bold px-1">
                    {errors.cpf}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  RG
                </label>
                <input
                  type="text"
                  value={profileData.rg}
                  onChange={(e) =>
                    setProfileData((prev) => ({ ...prev, rg: e.target.value }))
                  }
                  placeholder="00.000.000-0"
                  className="w-full px-4 py-3 bg-vitta-surface-2 border-none rounded-xl text-sm text-vitta-text-primary focus:ring-2 focus:ring-vitta-purple/20 transition-all"
                />
              </div>
            </div>

            {/* Document Uploads via Wizard */}
            <div className="pt-4 border-t border-vitta-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-vitta-text-primary">
                  Verificação de Identidade
                </h3>
                {profileData.kycStatus === "verified" && (
                  <span className="flex items-center gap-1 text-vitta-green text-[10px] font-bold uppercase">
                    <Check size={12} /> Verificado
                  </span>
                )}
              </div>

              <div className="bg-vitta-surface-2 p-6 rounded-2xl border border-vitta-border space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0 text-vitta-accent">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-bold text-vitta-text-primary">
                      Mantenha sua conta segura
                    </p>
                    <p className="text-xs text-vitta-text-secondary leading-relaxed">
                      Complete a verificação KYC para desbloquear agendamentos
                      ilimitados e descontos exclusivos em parceiros.
                    </p>
                  </div>
                </div>

                {profileData.kycStatus !== "verified" && (
                  <button
                    onClick={() => setIsKYCWizardOpen(true)}
                    className="w-full py-3 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2"
                  >
                    {profileData.kycStatus === "pending" ||
                    profileData.kycStatus === "rejected"
                      ? "Iniciar Verificação"
                      : "Atualizar Documentos"}
                    <ChevronRight size={18} />
                  </button>
                )}

                {(profileData.documentFrontUrl ||
                  profileData.documentBackUrl) && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {profileData.documentFrontUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-vitta-border h-24">
                        <img
                          src={profileData.documentFrontUrl}
                          alt="Frente"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                          Frente
                        </div>
                      </div>
                    )}
                    {profileData.documentBackUrl && (
                      <div className="relative rounded-lg overflow-hidden border border-vitta-border h-24">
                        <img
                          src={profileData.documentBackUrl}
                          alt="Verso"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 left-1 bg-black/50 px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-widest">
                          Verso
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            {saveMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`px-4 py-2 rounded-lg text-sm font-bold ${
                  saveMessage.type === "success"
                    ? "bg-vitta-green/10 text-vitta-green"
                    : "bg-vitta-danger/10 text-vitta-danger"
                }`}
              >
                {saveMessage.text}
              </motion.div>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-10 py-4 bg-vitta-green text-white rounded-xl font-bold shadow-xl shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={20} />
                  Salvar Todas as Alterações
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary">
                Segurança
              </h2>
              <Lock className="text-vitta-accent" size={20} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-vitta-surface-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-vitta-accent-bg text-vitta-accent rounded-xl">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-vitta-text-primary">
                      Autenticação em Duas Etapas (2FA)
                    </p>
                    <p className="text-[10px] text-vitta-text-secondary leading-tight max-w-[200px]">
                      Proteja sua conta exigindo um código de verificação
                      enviado por e-mail a cada login.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleToggle2FA}
                  className={`px-3 py-1.5 border rounded-lg text-[10px] font-bold transition-colors ${
                    profileData.twoFactorEnabled
                      ? "bg-vitta-green text-white border-vitta-green hover:bg-vitta-green/90"
                      : "bg-vitta-surface border-vitta-border text-vitta-text-primary hover:bg-vitta-surface-2"
                  }`}
                >
                  {profileData.twoFactorEnabled ? "Ativo" : "Ativar"}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-vitta-surface-2 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-vitta-amber-bg text-vitta-amber rounded-xl">
                    <Key size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-vitta-text-primary">
                      Senha
                    </p>
                    <p className="text-[10px] text-vitta-text-secondary">
                      Alterar senha
                    </p>
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
            <h2 className="text-lg font-bold border-b border-vitta-border pb-4 text-vitta-text-primary">
              Preferências
            </h2>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-vitta-text-primary">
                      Notificações
                    </p>
                    <p className="text-[10px] text-vitta-text-secondary">
                      Alertas e mensagens do sistema
                    </p>
                  </div>
                  <div className="w-10 h-5 bg-vitta-green rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                <NotificationFeed user={user} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-vitta-text-primary">
                    Modo Escuro
                  </p>
                  <p className="text-[10px] text-vitta-text-muted">
                    Interface noturna
                  </p>
                </div>
                <div
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${isDarkMode ? "bg-vitta-green" : "bg-vitta-border"}`}
                >
                  <motion.div
                    animate={{ x: isDarkMode ? 20 : 4 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Google Calendar Sync */}
          <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-vitta-border pb-4">
              <h2 className="text-lg font-bold text-vitta-text-primary flex items-center gap-2">
                <Calendar className="text-vitta-green" size={20} />
                Google Calendar
              </h2>
              {googleToken ? (
                <span className="flex items-center gap-1.5 text-vitta-green text-xs font-bold uppercase tracking-wider">
                  <span className="w-2.5 h-2.5 rounded-full bg-vitta-green animate-pulse inline-block" /> Conectado
                </span>
              ) : (
                <span className="text-vitta-text-muted text-xs uppercase font-extrabold tracking-wider">Desconectado</span>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs text-vitta-text-secondary leading-relaxed">
                Ao ativar a sincronização automatizada, todas as suas consultas agendadas, remarcadas ou confirmadas serão atualizadas em tempo real no seu calendário do Google com lembretes integrados para você nunca se atrasar.
              </p>

              {googleToken ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-vitta-surface-2 rounded-xl">
                    <div className="pr-4">
                      <p className="font-bold text-sm text-vitta-text-primary">
                        Sincronização Ativa
                      </p>
                      <p className="text-[10px] text-vitta-text-secondary leading-tight mt-0.5">
                        Permitir que o aplicativo gerencie eventos de consulta no Google Calendar
                      </p>
                    </div>
                    <div
                      onClick={async () => {
                        const nextVal = !userData?.googleCalendarSyncEnabled;
                        try {
                          await setDoc(doc(db, "users", user!.uid), {
                            googleCalendarSyncEnabled: nextVal,
                          }, { merge: true });
                          addToast(
                            nextVal ? "Sincronização com o Google Calendar ativada!" : "Sincronização desativada.",
                            "success"
                          );
                        } catch (err) {
                          console.error(err);
                          addToast("Erro ao atualizar preferência de sincronização.", "error");
                        }
                      }}
                      className={`w-10 h-5 rounded-full relative cursor-pointer shrink-0 transition-colors ${userData?.googleCalendarSyncEnabled !== false ? "bg-vitta-green" : "bg-vitta-border"}`}
                    >
                      <motion.div
                        animate={{ x: userData?.googleCalendarSyncEnabled !== false ? 20 : 4 }}
                        className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={async () => {
                        try {
                          const q = query(
                            collection(db, "appointments"),
                            where("userId", "==", user!.uid)
                          );
                          const querySnapshot = await getDocs(q);
                          let count = 0;
                          for (const appointmentDoc of querySnapshot.docs) {
                            const aptData = appointmentDoc.data();
                            if (aptData.status !== "cancelado" && !aptData.googleCalendarEventId) {
                              const eventId = await createGoogleCalendarEvent({
                                professionalName: aptData.professionalName,
                                specialty: aptData.specialty,
                                date: aptData.date,
                                time: aptData.time,
                              }, googleToken);
                              if (eventId) {
                                await updateDoc(doc(db, "appointments", appointmentDoc.id), {
                                  googleCalendarEventId: eventId,
                                });
                                count++;
                              }
                            }
                          }
                          addToast(
                            count > 0 
                              ? `${count} novas consultas foram sincronizadas no seu Google Calendar!` 
                              : "Todas as suas consultas já estão sincronizadas no Google Calendar.",
                            "success"
                          );
                        } catch (err) {
                          console.error(err);
                          addToast("Erro ao sincronizar consultas.", "error");
                        }
                      }}
                      className="flex-1 py-3 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-vitta-accent/15"
                    >
                      Sincronizar Consultas Existentes
                    </button>
                    <button
                      onClick={() => {
                        setGoogleToken(null);
                        addToast("Google Calendar desconectado localmente.", "info");
                      }}
                      className="py-3 bg-vitta-surface-2 border border-vitta-border text-vitta-text-secondary rounded-xl text-xs font-bold hover:bg-vitta-border transition-all px-4"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const calendarProvider = new GoogleAuthProvider();
                      calendarProvider.addScope("https://www.googleapis.com/auth/calendar");
                      const result = await signInWithPopup(auth, calendarProvider);
                      const credential = GoogleAuthProvider.credentialFromResult(result);
                      if (credential?.accessToken) {
                        setGoogleToken(credential.accessToken);
                        // Default to enabled in user doc
                        await setDoc(doc(db, "users", user!.uid), {
                          googleCalendarSyncEnabled: true,
                        }, { merge: true });
                        addToast("Google Calendar sincronizado com sucesso!", "success");
                      } else {
                        addToast("Não foi possível adquirir credencial do Google.", "error");
                      }
                    } catch (err: any) {
                      console.error("Calendar auth error:", err);
                      addToast("Falha de autenticação com o Google Calendar.", "error");
                    }
                  }}
                  className="w-full py-3.5 bg-vitta-surface border border-vitta-border text-vitta-text-primary rounded-xl font-bold hover:bg-vitta-surface-2 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Conectar Google Calendar
                </button>
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-vitta-danger/5 p-8 rounded-xl border border-vitta-danger/20 space-y-4">
            <h2 className="text-[10px] font-bold text-vitta-danger uppercase tracking-widest">
              Zona de Perigo
            </h2>
            {profileData.deletionRequested ? (
              <div className="p-4 bg-vitta-surface rounded-xl border border-vitta-danger/30">
                <p className="text-xs font-bold text-vitta-danger">
                  Solicitação de exclusão em processamento.
                </p>
                <p className="text-[10px] text-vitta-text-muted mt-1">
                  Nossa equipe entrará em contato em breve.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-vitta-text-muted">
                  Uma vez solicitada, nossa equipe processará a exclusão dos
                  seus dados.
                </p>
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
        <ChangePasswordModal
          user={user}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Solicitar Exclusão de Conta"
        message="Tem certeza que deseja solicitar a exclusão da sua conta? Esta ação será processada pela nossa equipe e não pode ser desfeita imediatamente."
        confirmText="Confirmar Solicitação"
        cancelText="Voltar"
        type="danger"
        onConfirm={confirmDeletion}
        onCancel={() => setIsConfirmModalOpen(false)}
      />

      <AnimatePresence>
        {isKYCWizardOpen && (
          <KYCWizard
            isOpen={isKYCWizardOpen}
            onClose={() => setIsKYCWizardOpen(false)}
            user={user}
            userData={userData}
            onSuccess={(updatedData) => {
              setProfileData((prev) => ({
                ...prev,
                kycStatus: updatedData.kycStatus,
                documentFrontUrl: updatedData.documentFrontUrl,
                documentBackUrl: updatedData.documentBackUrl,
                photoURL: updatedData.photoURL,
              }));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const UserExamsManagementView = () => {
  const { addToast } = useToast();
  const [userExams, setUserExams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    userId: "",
    examId: "",
    name: "",
    lab: "Laboratório ViTTA",
    status: "pending",
    resultUrl: "",
    resultNote: "",
  });
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
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
    const unsubscribeExams = onSnapshot(
      query(collection(db, "user_exams"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setUserExams(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "user_exams");
      },
    );

    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      },
    );

    const unsubscribeExamTypes = onSnapshot(
      collection(db, "exams"),
      (snapshot) => {
        setExamTypes(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
    );

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
      setUploading("new");
      let resultUrl = newItem.resultUrl;

      if (selectedFile) {
        const storageRef = ref(
          storage,
          `exam_results/${newItem.userId}/${Date.now()}_${selectedFile.name}`,
        );
        const uploadResult = await uploadBytes(storageRef, selectedFile);
        resultUrl = await getDownloadURL(uploadResult.ref);
      }

      await addDoc(collection(db, "user_exams"), {
        ...newItem,
        resultUrl,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      await logAdminAction(
        "CREATE_USER_EXAM",
        `Registrou exame ${newItem.name} para o usuário ID: ${newItem.userId}`,
      );

      // Create notification for the user
      await addDoc(collection(db, "notifications"), {
        userId: newItem.userId,
        title: "Novo Exame Solicitado",
        message: `Um novo exame de ${newItem.name} foi registrado em sua conta.`,
        type: "exam",
        read: false,
        createdAt: Timestamp.now(),
      });

      setIsCreating(false);
      setNewItem({
        userId: "",
        examId: "",
        name: "",
        lab: "Laboratório ViTTA",
        status: "pending",
        resultUrl: "",
        resultNote: "",
      });
      setSelectedFile(null);
      setUploading(null);
      addToast("Exame registrado para o usuário com sucesso.", "success");
    } catch (err) {
      setUploading(null);
      handleFirestoreError(err, OperationType.CREATE, "user_exams");
    }
  };

  const handleFileUpload = async (
    userExamId: string,
    userId: string,
    file: File,
  ) => {
    try {
      setUploading(userExamId);
      const storageRef = ref(
        storage,
        `exam_results/${userId}/${Date.now()}_${file.name}`,
      );
      const uploadResult = await uploadBytes(storageRef, file);
      const resultUrl = await getDownloadURL(uploadResult.ref);

      await updateDoc(doc(db, "user_exams", userExamId), {
        resultUrl,
        status: "ready",
        updatedAt: Timestamp.now(),
      });

      await logAdminAction(
        "UPLOAD_EXAM_RESULT",
        `Fez upload de resultado para exame ID: ${userExamId}`,
      );

      const exam = userExams.find((e) => e.id === userExamId);
      await addDoc(collection(db, "notifications"), {
        userId,
        title: "Resultado de Exame Disponível",
        message: `O resultado do seu exame de ${exam?.name || "exame"} já está disponível.`,
        type: "exam",
        read: false,
        createdAt: Timestamp.now(),
      });

      setUploading(null);
      addToast("Arquivo enviado com sucesso.", "success");
    } catch (err) {
      console.error(err);
      setUploading(null);
      addToast("Erro ao fazer upload do arquivo.", "error");
    }
  };

  const handleUpdateStatus = async (
    id: string,
    userId: string,
    examName: string,
    newStatus: string,
  ) => {
    try {
      const oldData = userExams.find((e) => e.id === id);
      const newData = {
        status: newStatus,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(doc(db, "user_exams", id), newData);

      await logAdminAction(
        "UPDATE_USER_EXAM_STATUS",
        `Alterou status do exame ID: ${id} para ${newStatus}`,
        oldData,
        { ...oldData, ...newData },
      );

      if (newStatus === "ready") {
        await addDoc(collection(db, "notifications"), {
          userId,
          title: "Resultado de Exame Disponível",
          message: `O resultado do seu exame de ${examName} já está disponível para visualização.`,
          type: "exam",
          read: false,
          createdAt: Timestamp.now(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `user_exams/${id}`);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Registro de Exame",
      message:
        "Tem certeza que deseja excluir este registro de exame do usuário? Esta ação não pode ser desfeita e removerá o acesso do paciente ao resultado.",
      type: "danger",
      onConfirm: async () => {
        try {
          const oldData = userExams.find((e) => e.id === id);
          await deleteDoc(doc(db, "user_exams", id));
          await logAdminAction(
            "DELETE_USER_EXAM",
            `Excluiu exame de usuário ID: ${id}`,
            oldData,
            null,
          );
          addToast("Registro de exame excluído com sucesso.", "success");
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `user_exams/${id}`);
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">
          Exames de Usuários
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          {isCreating ? <X size={20} /> : <Plus size={20} />}
          {isCreating ? "Fechar" : "Registrar Exame"}
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
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Usuário
                </label>
                <select
                  required
                  value={newItem.userId}
                  onChange={(e) =>
                    setNewItem({ ...newItem, userId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>
                    Selecione um Usuário
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Tipo de Exame
                </label>
                <select
                  required
                  value={newItem.examId}
                  onChange={(e) => {
                    const selected = examTypes.find(
                      (t) => t.id === e.target.value,
                    );
                    setNewItem({
                      ...newItem,
                      examId: e.target.value,
                      name: selected?.name || "",
                    });
                  }}
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>
                    Selecione o Exame
                  </option>
                  {examTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Resultado (Opcional)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2.5 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-vitta-accent file:text-white hover:file:bg-vitta-accent/90 transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Status Inicial
                </label>
                <select
                  value={newItem.status}
                  onChange={(e) =>
                    setNewItem({ ...newItem, status: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="pending">Pendente</option>
                  <option value="ready">Pronto</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={uploading === "new"}
              className="w-full py-4 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {uploading === "new" ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                "Registrar Exame para Usuário"
              )}
            </button>
          </form>
        </motion.div>
      )}

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-vitta-surface-2 border-b border-vitta-border">
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Paciente
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Exame / Info
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">
                Data
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-6 py-4">
                    <Skeleton className="h-4 w-48" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="h-4 w-12 ml-auto" />
                  </td>
                </tr>
              ))
            ) : userExams.length > 0 ? (
              userExams.map((exam) => (
                <tr
                  key={exam.id}
                  className="hover:bg-vitta-surface-2 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-vitta-text-muted" />
                      <span className="font-bold text-xs text-vitta-text-primary">
                        {users.find((u) => u.id === exam.userId)?.name ||
                          "Removido"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-vitta-text-primary">
                        {exam.name}
                      </span>
                      <span className="text-[10px] text-vitta-text-muted uppercase tracking-wider">
                        {exam.lab}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs text-vitta-text-secondary">
                      {exam.createdAt?.toDate
                        ? exam.createdAt.toDate().toLocaleDateString("pt-BR")
                        : "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={exam.status}
                      onChange={(e) =>
                        handleUpdateStatus(
                          exam.id,
                          exam.userId,
                          exam.name,
                          e.target.value,
                        )
                      }
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border-none focus:ring-2 focus:ring-vitta-accent/20 outline-none cursor-pointer ${
                        exam.status === "ready"
                          ? "bg-vitta-green-bg text-vitta-green"
                          : "bg-vitta-amber-bg text-vitta-amber"
                      }`}
                    >
                      <option value="pending">Pendente</option>
                      <option value="ready">Pronto</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 text-vitta-text-muted">
                      <div className="relative">
                        <input
                          type="file"
                          id={`file-${exam.id}`}
                          className="hidden"
                          accept=".pdf,image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleFileUpload(exam.id, exam.userId, file);
                          }}
                        />
                        <label
                          htmlFor={`file-${exam.id}`}
                          className={`p-2 flex items-center justify-center hover:text-vitta-accent hover:bg-vitta-accent-bg rounded-lg transition-colors cursor-pointer ${uploading === exam.id ? "animate-pulse" : ""}`}
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
                          onClick={() => window.open(exam.resultUrl, "_blank")}
                          className="p-2 text-vitta-green hover:bg-vitta-green-bg rounded-lg transition-colors"
                          title="Ver Resultado"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(exam.id)}
                        className="p-2 hover:text-vitta-danger hover:bg-vitta-danger/10 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-vitta-text-muted text-sm"
                >
                  Nenhum exame de usuário registrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

const ExamsManagementView = () => {
  const { addToast } = useToast();
  const [exams, setExams] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    priceVitta: "",
    priceParticular: "",
    description: "",
  });
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
    const unsubscribe = onSnapshot(
      collection(db, "exams"),
      (snapshot) => {
        setExams(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "exams");
      },
    );
    return () => unsubscribe();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "exams"), {
        ...newItem,
        createdAt: Timestamp.now(),
      });
      await logAdminAction(
        "CREATE_EXAM_TYPE",
        `Criou o tipo de exame: ${newItem.name}`,
      );
      setIsCreating(false);
      setNewItem({
        name: "",
        priceVitta: "",
        priceParticular: "",
        description: "",
      });
      addToast("Tipo de exame criado com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao criar exame:", err);
      addToast("Erro ao criar tipo de exame.", "error");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Tipo de Exame",
      message:
        "Tem certeza que deseja excluir este tipo de exame? Isso não afetará os exames já realizados pelos usuários.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "exams", id));
          await logAdminAction(
            "DELETE_EXAM_TYPE",
            `Excluiu o tipo de exame ID: ${id}`,
          );
          addToast("Tipo de exame excluído com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir exame:", err);
          addToast("Erro ao excluir tipo de exame.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">
          Gestão de Exames
        </h2>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nome do Exame"
                required
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
              <input
                type="text"
                placeholder="Preço Vitta"
                required
                value={newItem.priceVitta}
                onChange={(e) =>
                  setNewItem({ ...newItem, priceVitta: e.target.value })
                }
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
              <input
                type="text"
                placeholder="Preço Particular"
                required
                value={newItem.priceParticular}
                onChange={(e) =>
                  setNewItem({ ...newItem, priceParticular: e.target.value })
                }
                className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
              />
            </div>
            <textarea
              placeholder="Descrição"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
              className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary min-h-[100px]"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all shadow-lg shadow-vitta-green/20"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-8 py-3 bg-vitta-surface-2 border border-vitta-border text-vitta-text-secondary rounded-xl font-bold hover:bg-vitta-border transition-all"
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
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Exame
              </th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">
                Preço Vitta
              </th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">
                Particular
              </th>
              <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-vitta-border">
            {exams.map((exam) => (
              <tr
                key={exam.id}
                className="hover:bg-vitta-surface-2 transition-colors"
              >
                <td className="px-8 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-vitta-text-primary">
                      {exam.name}
                    </span>
                    <span className="text-xs text-vitta-text-muted line-clamp-1">
                      {exam.description}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="text-sm font-bold text-vitta-green">
                    {exam.priceVitta}
                  </span>
                </td>
                <td className="px-8 py-4 text-center">
                  <span className="text-sm font-bold text-vitta-text-secondary">
                    {exam.priceParticular}
                  </span>
                </td>
                <td className="px-8 py-4 text-right">
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

const OffersManagementView = () => {
  const { addToast } = useToast();
  const [offers, setOffers] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newItem, setNewItem] = useState({
    title: "",
    discount: "",
    partner: "",
    imageUrl: "",
    description: "",
    expiryDate: "",
    isBanner: false,
  });
  const [isSaving, setIsSaving] = useState(false);
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
    const unsubscribeOffers = onSnapshot(
      query(collection(db, "offers"), orderBy("createdAt", "desc")),
      (snapshot) => {
        setOffers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "offers");
      },
    );

    const unsubscribeProfessionals = onSnapshot(
      collection(db, "professionals"),
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
      collection(db, "partners"),
      (snapshot) => {
        setPartners(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "partners");
      },
    );

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
        await setDoc(doc(db, "offers", editingItem.id), {
          ...newItem,
          updatedAt: Timestamp.now(),
        }, { merge: true });
        await logAdminAction(
          "UPDATE_OFFER",
          `Editou a oferta: ${newItem.title}`,
        );
      } else {
        const offerRef = await addDoc(collection(db, "offers"), {
          ...newItem,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        await logAdminAction(
          "CREATE_OFFER",
          `Criou a oferta: ${newItem.title}`,
        );

        // Broadcast notification to all users for new offer
        try {
          const usersSnap = await getDocs(collection(db, "users"));
          const notificationPromises = usersSnap.docs.map((userDoc) =>
            addDoc(collection(db, "notifications"), {
              userId: userDoc.id,
              title: "Nova Oferta Disponível!",
              message: `${newItem.partner} adicionou uma nova oferta: ${newItem.title}. Aproveite!`,
              type: "offer",
              read: false,
              createdAt: Timestamp.now(),
            }),
          );
          await Promise.all(notificationPromises);
        } catch (notifyErr) {
          console.error("Erro ao enviar notificações de broadcast:", notifyErr);
        }
      }
      setIsCreating(false);
      setEditingItem(null);
      setNewItem({
        title: "",
        discount: "",
        partner: "",
        imageUrl: "",
        description: "",
        expiryDate: "",
        isBanner: false,
      });
      addToast(
        `Oferta ${editingItem ? "atualizada" : "criada"} com sucesso.`,
        "success",
      );
    } catch (error) {
      handleFirestoreError(
        error,
        editingItem ? OperationType.UPDATE : OperationType.CREATE,
        "offers",
      );
      addToast(
        `Erro ao ${editingItem ? "atualizar" : "criar"} oferta.`,
        "error",
      );
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
      imageUrl: offer.imageUrl || "",
      description: offer.description || "",
      expiryDate: offer.expiryDate || "",
      isBanner: offer.isBanner || false,
    });
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Oferta",
      message:
        "Tem certeza que deseja excluir esta oferta permanentemente? Esta ação não pode ser desfeita.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "offers", id));
          await logAdminAction("DELETE_OFFER", `Excluiu a oferta ID: ${id}`);
          if (editingItem?.id === id) {
            setIsCreating(false);
            setEditingItem(null);
          }
          addToast("Oferta excluída com sucesso.", "success");
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, "offers");
          addToast("Erro ao excluir oferta.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-vitta-text-primary">
          Gestão de Ofertas
        </h2>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            setEditingItem(null);
            setNewItem({
              title: "",
              discount: "",
              partner: "",
              imageUrl: "",
              description: "",
              expiryDate: "",
              isBanner: false,
            });
          }}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          {isCreating ? <X size={20} /> : <Plus size={20} />}
          {isCreating ? "Fechar" : "Nova Oferta"}
        </button>
      </div>

      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
        >
          <h3 className="text-lg font-bold text-vitta-text-primary">
            {editingItem ? "Editar Oferta" : "Nova Oferta"}
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Título
                </label>
                <input
                  type="text"
                  placeholder="Título da Oferta"
                  required
                  value={newItem.title}
                  onChange={(e) =>
                    setNewItem({ ...newItem, title: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Desconto
                </label>
                <input
                  type="text"
                  placeholder="Ex: 20% OFF"
                  required
                  value={newItem.discount}
                  onChange={(e) =>
                    setNewItem({ ...newItem, discount: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Parceiro
                </label>
                <select
                  required
                  value={newItem.partner}
                  onChange={(e) =>
                    setNewItem({ ...newItem, partner: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                >
                  <option value="" disabled>
                    Selecione um Parceiro
                  </option>
                  <optgroup label="Profissionais">
                    {professionals.map((prof) => (
                      <option key={prof.id} value={prof.name}>
                        {prof.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Estabelecimentos">
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.name}>
                        {partner.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  URL da Imagem
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newItem.imageUrl}
                  onChange={(e) =>
                    setNewItem({ ...newItem, imageUrl: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Breve descrição da oferta"
                  value={newItem.description}
                  onChange={(e) =>
                    setNewItem({ ...newItem, description: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Data de Validade
                </label>
                <input
                  type="date"
                  value={newItem.expiryDate}
                  onChange={(e) =>
                    setNewItem({ ...newItem, expiryDate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <input
                  type="checkbox"
                  id="isBanner"
                  checked={newItem.isBanner}
                  onChange={(e) =>
                    setNewItem({ ...newItem, isBanner: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent/20"
                />
                <label
                  htmlFor="isBanner"
                  className="text-sm font-medium text-vitta-text-primary"
                >
                  Destacar como Banner
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 bg-vitta-green text-white rounded-xl font-bold hover:bg-vitta-green/90 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingItem ? "Salvar Alterações" : "Criar Oferta"}
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
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Oferta
                </th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Parceiro
                </th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Desconto
                </th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                  Status/Validade
                </th>
                <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vitta-border">
              {offers.length > 0 ? (
                offers.map((offer) => (
                  <tr
                    key={offer.id}
                    className="hover:bg-vitta-surface-2 transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        {offer.imageUrl && (
                          <img
                            src={offer.imageUrl}
                            alt=""
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-vitta-text-primary">
                            {offer.title}
                          </span>
                          {offer.isBanner && (
                            <span className="text-[9px] font-black uppercase text-vitta-accent">
                              Banner Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm text-vitta-text-secondary">
                        {offer.partner}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-2 py-1 bg-vitta-danger/10 text-vitta-danger text-xs font-bold rounded-lg">
                        {offer.discount}
                      </span>
                    </td>
                    <td className="px-8 py-4">
                      {offer.expiryDate ? (
                        <span className="text-xs text-vitta-text-secondary">
                          Expira:{" "}
                          {new Date(offer.expiryDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-xs text-vitta-text-muted italic">
                          Sem expiração
                        </span>
                      )}
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
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-8 py-12 text-center text-vitta-text-muted text-sm"
                  >
                    Nenhuma oferta cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

const PartnershipsView = ({
  setSubTab,
  setActiveTab,
}: {
  setSubTab?: (tab: any) => void;
  setActiveTab?: (tab: string) => void;
}) => {
  const { addToast } = useToast();

  const handleLogoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      addToast("Por favor, selecione um arquivo de imagem válido.", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      addToast("A imagem deve ser menor que 10MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);

            if (editingItem) {
              setEditingItem((prev: any) => ({
                ...prev,
                imageUrl: compressedBase64,
              }));
            } else {
              setNewItem((prev: any) => ({
                ...prev,
                imageUrl: compressedBase64,
              }));
            }
            addToast("Logomarca carregada e otimizada com sucesso!", "success");
          } else {
            addToast("Erro ao processar imagem.", "error");
          }
        };
        img.onerror = () => {
          addToast("Erro ao carregar a imagem.", "error");
        };
        img.src = event.target.result as string;
      }
    };
    reader.onerror = () => {
      addToast("Erro ao ler o arquivo.", "error");
    };
    reader.readAsDataURL(file);
  };

  const [activeSubTab, setActiveSubTab] = useState<
    "establishments" | "categories" | "offers" | "vitta-health"
  >("establishments");
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [profSearchQuery, setProfSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState<"partner" | "category" | null>(
    null,
  );
  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    discount: "10% OFF",
    slug: "",
    address: "",
    phone: "",
    imageUrl: "",
    icon: "Heart",
    color: "bg-vitta-green",
    description: "",
  });
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
    const unsubscribePartners = onSnapshot(
      collection(db, "partners"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(
          "DEBUG: PartnershipsView - Parceiros carregados:",
          data.length,
        );
        setPartners(data);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "partners");
      },
    );
    const unsubscribeCategories = onSnapshot(
      query(collection(db, "categories"), where("type", "==", "partner")),
      (snapshot) => {
        setCategories(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "categories");
      },
    );
    const unsubscribeProfessionals = onSnapshot(
      collection(db, "professionals"),
      (snapshot) => {
        setProfessionals(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "professionals");
      },
    );
    return () => {
      unsubscribePartners();
      unsubscribeCategories();
      unsubscribeProfessionals();
    };
  }, []);

  const handleDeletePartner = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Estabelecimento",
      message:
        "Tem certeza que deseja excluir este estabelecimento parceiro? Esta ação não pode ser desfeita.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "partners", id));
          await logAdminAction(
            "DELETE_PARTNER",
            `Excluiu o parceiro ID: ${id}`,
          );
          addToast("Parceiro excluído com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir parceiro:", err);
          addToast("Erro ao excluir parceiro.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteCategory = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Categoria",
      message: "Tem certeza que deseja excluir esta categoria de parceiro?",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "categories", id));
          await logAdminAction(
            "DELETE_CATEGORY",
            `Excluiu a categoria de parceiro ID: ${id}`,
          );
          addToast("Categoria excluída com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao excluir categoria:", err);
          addToast("Erro ao excluir categoria.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    "Todas as Categorias",
  );

  const filteredPartners = partners.filter((partner) => {
    const matchesSearch = partner.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Todas as Categorias" ||
      partner.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredProfessionals = professionals.filter((prof) => {
    const matchesSearch =
      prof.name.toLowerCase().includes(profSearchQuery.toLowerCase()) ||
      prof.specialty.toLowerCase().includes(profSearchQuery.toLowerCase());
    return (
      matchesSearch &&
      prof.vittaHealthDiscount &&
      prof.vittaHealthDiscount !== "0%"
    );
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    try {
      const { id, type, ...data } = editingItem;
      const collectionName = type === "partner" ? "partners" : "categories";
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      await logAdminAction(
        `UPDATE_${type.toUpperCase()}`,
        `Editou o ${type === "partner" ? "parceiro" : "categoria"}: ${editingItem.name}`,
      );
      setEditingItem(null);
      addToast(
        `${type === "partner" ? "Parceiro" : "Categoria"} atualizado com sucesso.`,
        "success",
      );
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.WRITE,
        `partners/${editingItem.id}`,
      );
      addToast(
        `Erro ao atualizar ${editingItem.type === "partner" ? "parceiro" : "categoria"}.`,
        "error",
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isCreating === "partner") {
        await addDoc(collection(db, "partners"), {
          name: newItem.name,
          category:
            newItem.category ||
            (categories.length > 0 ? categories[0].name : "Geral"),
          discount: newItem.discount,
          address: newItem.address || "",
          phone: newItem.phone || "",
          rating: 5.0,
          reviews: 0,
          imageUrl:
            newItem.imageUrl || "https://picsum.photos/seed/partner/400/300",
          createdAt: new Date().toISOString(),
        });
        await logAdminAction(
          "CREATE_PARTNER",
          `Criou o parceiro: ${newItem.name}`,
        );
      } else if (isCreating === "category") {
        await addDoc(collection(db, "categories"), {
          name: newItem.name,
          slug:
            newItem.slug ||
            newItem.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/\s+/g, "-"),
          type: "partner",
          icon: newItem.icon,
          color: newItem.color,
          description: newItem.description,
          createdAt: new Date().toISOString(),
        });
        await logAdminAction(
          "CREATE_CATEGORY",
          `Criou a categoria de parceiro: ${newItem.name}`,
        );
      }
      setIsCreating(null);
      setNewItem({
        name: "",
        category: "",
        discount: "10% OFF",
        slug: "",
        address: "",
        phone: "",
        imageUrl: "",
        icon: "Heart",
        color: "bg-vitta-green",
        description: "",
      });
      addToast(
        `${isCreating === "partner" ? "Parceiro" : "Categoria"} criado com sucesso.`,
        "success",
      );
    } catch (err) {
      console.error("Erro ao criar item:", err);
      addToast("Erro ao criar item.", "error");
    }
  };

  const getPartnersCountByCategory = (categoryName: string) => {
    return partners.filter((p) => p.category === categoryName).length;
  };

  return (
    <div className="space-y-8">
      {/* Partner Create/Edit Modal */}
      <AnimatePresence>
        {(isCreating === "partner" ||
          (editingItem && editingItem.type === "partner")) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingItem
                    ? "Editar Estabelecimento"
                    : "Novo Estabelecimento"}
                </h3>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsCreating(null);
                  }}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form
                onSubmit={editingItem ? handleSaveEdit : handleCreate}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem ? editingItem.name : newItem.name}
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            name: e.target.value,
                          })
                        : setNewItem({ ...newItem, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Categoria
                  </label>
                  <select
                    value={
                      editingItem ? editingItem.category : newItem.category
                    }
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            category: e.target.value,
                          })
                        : setNewItem({ ...newItem, category: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Desconto
                  </label>
                  <input
                    type="text"
                    value={
                      editingItem ? editingItem.discount : newItem.discount
                    }
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            discount: e.target.value,
                          })
                        : setNewItem({ ...newItem, discount: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={
                      editingItem ? editingItem.phone || "" : newItem.phone
                    }
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            phone: e.target.value,
                          })
                        : setNewItem({ ...newItem, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={
                      editingItem ? editingItem.address || "" : newItem.address
                    }
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            address: e.target.value,
                          })
                        : setNewItem({ ...newItem, address: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    URL da Logomarca (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://exemplo.com/logo.png"
                    value={
                      editingItem
                        ? editingItem.imageUrl || ""
                        : newItem.imageUrl
                    }
                    onChange={(e) =>
                      editingItem
                        ? setEditingItem({
                            ...editingItem,
                            imageUrl: e.target.value,
                          })
                        : setNewItem({ ...newItem, imageUrl: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary mb-2"
                  />
                  <div className="flex gap-2 items-center">
                    <label className="cursor-pointer shrink-0 flex items-center justify-center px-4 py-2 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl transition-all gap-2 text-xs font-bold shadow-md shadow-vitta-accent/10">
                      <Upload size={14} />
                      <span>Fazer Upload da Imagem</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleLogoUpload(file);
                          }
                        }}
                      />
                    </label>
                    {(editingItem ? editingItem.imageUrl : newItem.imageUrl) && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-vitta-surface-2 border border-vitta-border rounded-xl">
                        <img
                          src={editingItem ? editingItem.imageUrl : newItem.imageUrl}
                          alt="Preview"
                          className="w-6 h-6 rounded-md object-cover bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editingItem) {
                              setEditingItem({ ...editingItem, imageUrl: "" });
                            } else {
                              setNewItem({ ...newItem, imageUrl: "" });
                            }
                          }}
                          className="text-[10px] font-bold text-vitta-danger hover:underline"
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(null);
                      setIsCreating(null);
                    }}
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
          <h1 className="text-3xl font-bold text-vitta-text-primary">
            Gestão de Convênios
          </h1>
          <p className="text-vitta-text-secondary">
            Cadastre e gerencie estabelecimentos conveniados
          </p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-vitta-border">
        <button
          onClick={() => setActiveSubTab("establishments")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "establishments"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-muted hover:text-vitta-text-secondary"
          }`}
        >
          <Store size={18} />
          Empresas
        </button>
        <button
          onClick={() => setActiveSubTab("categories")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "categories"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-muted hover:text-vitta-text-secondary"
          }`}
        >
          <Tag size={18} />
          Categorias
        </button>
        <button
          onClick={() => setActiveSubTab("offers")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "offers"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-muted hover:text-vitta-text-secondary"
          }`}
        >
          <Tag size={18} />
          Ofertas
        </button>
        <button
          onClick={() => setActiveSubTab("vitta-health")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold ${
            activeSubTab === "vitta-health"
              ? "border-vitta-green text-vitta-green"
              : "border-transparent text-vitta-text-muted hover:text-vitta-text-secondary"
          }`}
        >
          <Activity size={18} />
          ViTTA Health
        </button>
      </div>

      {activeSubTab === "establishments" && (
        <>
          <div className="flex justify-between items-center">
            <button
              onClick={() => setIsCreating("partner")}
              className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
            >
              <Plus size={20} />
              Novo Estabelecimento
            </button>
          </div>

          <div className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                size={18}
              />
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
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-vitta-text-muted pointer-events-none"
                size={18}
              />
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
                  <img
                    src={
                      partner.imageUrl ||
                      "https://picsum.photos/seed/partner/400/300"
                    }
                    alt={partner.name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <span className="px-2.5 py-1 bg-vitta-green-bg text-vitta-green text-[10px] font-bold uppercase tracking-wider rounded-lg">
                    Ativo
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-vitta-text-primary">
                      {partner.name}
                    </h3>
                    <span className="inline-block px-3 py-1 bg-vitta-accent-bg text-vitta-accent text-xs font-bold rounded-lg mt-1">
                      {partner.category}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-vitta-text-secondary">
                      <span className="font-bold">Desconto:</span>{" "}
                      {partner.discount}
                    </p>
                    {partner.address && (
                      <p className="text-vitta-text-secondary">
                        <span className="font-bold">Endereço:</span>{" "}
                        {partner.address}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() =>
                        setEditingItem({ type: "partner", ...partner })
                      }
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

      {activeSubTab === "categories" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() =>
                setIsCreating(isCreating === "category" ? null : "category")
              }
              className={`flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20`}
            >
              {isCreating === "category" ? (
                <Plus size={20} className="rotate-45" />
              ) : (
                <Plus size={20} />
              )}
              {isCreating === "category" ? "Cancelar" : "Nova Categoria"}
            </button>
          </div>

          {isCreating === "category" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Nova Categoria
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      placeholder="Nome da Categoria"
                      required
                      value={newItem.name}
                      onChange={(e) =>
                        setNewItem({ ...newItem, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      placeholder="slug"
                      value={newItem.slug}
                      onChange={(e) =>
                        setNewItem({ ...newItem, slug: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Ícone (Lucide Name)
                    </label>
                    <select
                      value={newItem.icon}
                      onChange={(e) =>
                        setNewItem({ ...newItem, icon: e.target.value })
                      }
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
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Cor (Tailwind Class)
                    </label>
                    <select
                      value={newItem.color}
                      onChange={(e) =>
                        setNewItem({ ...newItem, color: e.target.value })
                      }
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
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Breve descrição da categoria"
                    value={newItem.description}
                    onChange={(e) =>
                      setNewItem({ ...newItem, description: e.target.value })
                    }
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

          {editingItem && editingItem.type === "category" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6"
            >
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Editar Categoria
              </h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Nome
                    </label>
                    <input
                      type="text"
                      required
                      value={editingItem.name}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editingItem.slug}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, slug: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-muted"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Ícone (Lucide Name)
                    </label>
                    <select
                      value={editingItem.icon || "Heart"}
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, icon: e.target.value })
                      }
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
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Cor (Tailwind Class)
                    </label>
                    <select
                      value={editingItem.color || "bg-vitta-green"}
                      onChange={(e) =>
                        setEditingItem({
                          ...editingItem,
                          color: e.target.value,
                        })
                      }
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
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Descrição
                  </label>
                  <textarea
                    placeholder="Breve descrição da categoria"
                    value={editingItem.description || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        description: e.target.value,
                      })
                    }
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
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Nome da Categoria
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Slug
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-center">
                    Empresas
                  </th>
                  <th className="px-8 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vitta-border">
                {categories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-vitta-surface-2 transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 ${category.color || "bg-vitta-surface-2 text-vitta-text-primary"} rounded-lg flex items-center justify-center text-white`}
                        >
                          {getIcon(category.icon, 16)}
                        </div>
                        <span className="font-bold text-sm text-vitta-text-primary">
                          {category.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs text-vitta-text-muted font-mono">
                        {category.slug}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <span className="text-sm text-vitta-text-secondary">
                        {getPartnersCountByCategory(category.name)}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            setEditingItem({ type: "category", ...category })
                          }
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

      {activeSubTab === "offers" && <OffersManagementView />}

      {activeSubTab === "vitta-health" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                if (setSubTab) setSubTab("professionals");
                if (setActiveTab) setActiveTab("professionals");
              }}
              className="flex items-center gap-2 px-6 py-3 bg-vitta-green hover:bg-vitta-green/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-green/20"
            >
              <Stethoscope size={20} />
              Gerenciar Profissionais
            </button>
          </div>

          <div className="bg-vitta-surface p-4 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                size={18}
              />
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
                  <img
                    src={prof.imageUrl}
                    alt={prof.name}
                    className="w-16 h-16 rounded-xl object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-lg text-vitta-text-primary">
                      {prof.name}
                    </h3>
                    <p className="text-sm text-vitta-text-secondary">
                      {prof.specialty}
                    </p>
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
                <h3 className="text-lg font-bold text-vitta-text-primary mb-1">
                  Nenhum profissional encontrado
                </h3>
                <p className="text-vitta-text-secondary text-sm">
                  Tente ajustar sua busca ou adicione descontos ViTTA Health aos
                  profissionais.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

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

const ChatView = ({ user }: { user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [adminTyping, setAdminTyping] = useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const typingTimeoutRef = React.useRef<any>(null);
  const { addToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "chats", user.uid, "messages"),
      orderBy("createdAt", "asc"),
    );

    const unsubscribeMessages = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(data);
        setLoading(false);
        setTimeout(scrollToBottom, 100);

        // Mark admin messages as read
        snapshot.docs.forEach((docSnap) => {
          const msg = docSnap.data();
          if (msg.senderRole === "admin" && !msg.read) {
            updateDoc(doc(db, "chats", user.uid, "messages", docSnap.id), {
              read: true,
            });
          }
        });
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          `chats/${user.uid}/messages`,
        );
      },
    );

    const unsubscribeRoom = onSnapshot(
      doc(db, "chats", user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setAdminTyping(!!data.adminTyping);
        }
      },
    );

    return () => {
      unsubscribeMessages();
      unsubscribeRoom();
    };
  }, [user]);

  const handleTyping = () => {
    if (!user) return;
    setDoc(
      doc(db, "chats", user.uid),
      { userTyping: true, updatedAt: new Date().toISOString() },
      { merge: true },
    );
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setDoc(
        doc(db, "chats", user.uid),
        { userTyping: false },
        { merge: true },
      );
    }, 3000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setDoc(doc(db, "chats", user.uid), { userTyping: false }, { merge: true });

    try {
      await addDoc(collection(db, "chats", user.uid, "messages"), {
        text: messageText,
        senderId: user.uid,
        senderRole: "user",
        createdAt: new Date().toISOString(),
        read: false,
      });

      await setDoc(
        doc(db, "chats", user.uid),
        {
          userId: user.uid,
          lastMessage: messageText,
          lastMessageAt: new Date().toISOString(),
          unreadCount: increment(1),
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      );

      scrollToBottom();
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.CREATE,
        `chats/${user.uid}/messages`,
      );
      addToast("Erro ao enviar mensagem.", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-vitta-surface rounded-2xl border border-vitta-border shadow-sm overflow-hidden">
      <div className="p-6 border-b border-vitta-border bg-vitta-surface-2 flex items-center gap-4">
        <div className="w-12 h-12 bg-vitta-accent text-white rounded-xl flex items-center justify-center">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-vitta-text-primary">
            Chat de Suporte
          </h2>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-vitta-green animate-pulse" />
            <p className="text-xs text-vitta-text-secondary">Equipe Online</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-vitta-surface-2/30">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-vitta-text-secondary space-y-4">
            <MessageSquare size={48} className="opacity-20" />
            <p className="font-medium text-center px-6">
              Olá! Alguma dúvida? Nossa equipe está pronta para te ajudar.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => {
              const isUser = msg.senderRole === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                        isUser
                          ? "bg-vitta-accent text-white"
                          : "bg-vitta-green text-white"
                      }`}
                    >
                      {isUser ? <User size={20} /> : <ShieldCheck size={20} />}
                    </div>
                    <div
                      className={`p-4 rounded-2xl relative ${
                        isUser
                          ? "bg-vitta-accent text-white rounded-tr-none"
                          : "bg-vitta-surface text-vitta-text-primary border border-vitta-border rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      <div
                        className={`flex items-center gap-1 mt-2 justify-end ${isUser ? "text-white/70" : "text-vitta-text-muted"}`}
                      >
                        <p className="text-[10px]">
                          {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {isUser && (
                          <div className="flex">
                            {msg.read ? (
                              <div className="flex -space-x-1">
                                <Check size={10} strokeWidth={3} />
                                <Check size={10} strokeWidth={3} />
                              </div>
                            ) : (
                              <Check size={10} strokeWidth={3} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {adminTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-vitta-green text-white flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="bg-vitta-surface p-3 rounded-2xl border border-vitta-border flex items-center gap-1">
                    <div
                      className="w-1.5 h-1.5 bg-vitta-green rounded-full animate-bounce"
                      style={{ animationDelay: "0s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-vitta-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-1.5 h-1.5 bg-vitta-green rounded-full animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 bg-vitta-surface border-t border-vitta-border">
        <form onSubmit={handleSendMessage} className="flex gap-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl focus:outline-none focus:border-vitta-accent text-vitta-text-primary"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={20} />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const SupportView = ({
  setActiveTab,
}: {
  setActiveTab: (tab: string) => void;
}) => {
  const faqs = [
    {
      question: "O ViTTA cobra alguma taxa dos usuários?",
      answer:
        "Não, o ViTTA é um benefício gratuito para afiliados de empresas parceiras.",
    },
    {
      question: "Como cancelo um agendamento?",
      answer:
        "Você pode cancelar seus agendamentos diretamente na aba 'Agendamentos' com até 24h de antecedência.",
    },
    {
      question: "Onde vejo meus descontos?",
      answer:
        "Todos os descontos disponíveis estão na aba 'Convênios' e 'Ofertas'.",
    },
    {
      question: "Como atualizar meus dados?",
      answer:
        "Acesse a aba 'Perfil' para editar suas informações pessoais e de contato.",
    },
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
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Central de Suporte ViTTA
            </h1>
            <p className="text-lg md:text-xl text-white/90 font-medium max-w-2xl mx-auto">
              Aproveite ao máximo todas as vantagens de ser um afiliado ViTTA
            </p>
          </div>
          <button
            onClick={() => setActiveTab("chat")}
            className="flex items-center gap-3 px-10 py-5 bg-white text-vitta-green rounded-xl font-bold shadow-xl hover:bg-vitta-surface-2 transition-all transform hover:scale-105 active:scale-95 group"
          >
            <MessageSquare
              size={24}
              className="group-hover:rotate-12 transition-transform"
            />
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
            shadow: "shadow-vitta-green/20",
          },
          {
            icon: Tag,
            title: "Descontos Exclusivos",
            desc: "Cupons e ofertas especiais dos nossos parceiros",
            color: "bg-vitta-accent",
            shadow: "shadow-vitta-accent/20",
          },
          {
            icon: Wallet,
            title: "Carteira Digital",
            desc: "Gerencie seus créditos e pagamentos com facilidade",
            color: "bg-vitta-amber",
            shadow: "shadow-vitta-amber/20",
          },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -8 }}
            className="bg-vitta-surface p-10 rounded-xl border border-vitta-border shadow-sm text-center space-y-5"
          >
            <div
              className={`w-16 h-16 ${item.color} rounded-xl mx-auto flex items-center justify-center text-white shadow-lg ${item.shadow}`}
            >
              <item.icon size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-vitta-text-primary">
                {item.title}
              </h3>
              <p className="text-vitta-text-secondary text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="space-y-8 pt-4">
        <h2 className="text-3xl font-bold text-vitta-text-primary px-4">
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-vitta-surface rounded-xl border border-vitta-border shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <summary className="flex items-center justify-between p-7 cursor-pointer list-none">
                <span className="font-bold text-lg text-vitta-text-primary">
                  {faq.question}
                </span>
                <div className="w-10 h-10 rounded-full bg-vitta-surface-2 flex items-center justify-center group-open:bg-vitta-accent-bg transition-colors">
                  <ChevronDown
                    size={20}
                    className="text-vitta-text-muted group-open:text-vitta-accent group-open:rotate-180 transition-all"
                  />
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

const KYCDocumentViewer = ({
  user,
  onClose,
  onUpdateStatus,
}: {
  user: any;
  onClose: () => void;
  onUpdateStatus: (status: string) => Promise<void>;
}) => {
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (status: string) => {
    setIsUpdating(true);
    await onUpdateStatus(status);
    setIsUpdating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-vitta-text-primary/40 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-6xl h-[85vh] rounded-[2.5rem] shadow-2xl border border-vitta-border overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-vitta-accent-bg text-vitta-accent rounded-2xl">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-vitta-text-primary">
                Auditoria de Identidade (KYC)
              </h3>
              <p className="text-xs text-vitta-text-muted">
                Verificação de documentos para o usuário:{" "}
                <span className="text-vitta-text-primary font-bold">
                  {user.name}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-border rounded-xl transition-all"
          >
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* User Data Panel */}
          <div className="w-full md:w-1/3 border-r border-vitta-border flex flex-col p-8 space-y-8 overflow-y-auto bg-vitta-surface-2/30">
            <div className="space-y-6">
              <h4 className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-[0.2em]">
                Dados Cadastrais
              </h4>
              <div className="space-y-4">
                {[
                  { label: "E-mail", value: user.email },
                  { label: "CPF", value: user.cpf },
                  { label: "Data de Nascimento", value: user.birthDate },
                  {
                    label: "Status Atual",
                    value: user.kycStatus || "Pendente",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">
                      {item.label}
                    </p>
                    <div className="px-4 py-2.5 bg-vitta-surface border border-vitta-border rounded-xl text-sm text-vitta-text-primary font-medium">
                      {item.value || "Não informado"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-vitta-border">
              <h4 className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-[0.2em]">
                Decisão de Auditoria
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdate("verified")}
                  className="w-full py-3.5 bg-vitta-green text-white rounded-xl font-bold text-sm shadow-lg shadow-vitta-green/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={18} />
                  Aprovar Documentação
                </button>
                <button
                  disabled={isUpdating}
                  onClick={() => handleUpdate("rejected")}
                  className="w-full py-3.5 bg-vitta-danger text-white rounded-xl font-bold text-sm shadow-lg shadow-vitta-danger/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  <XCircle size={18} />
                  Rejeitar / Solicitar Novo
                </button>
              </div>
            </div>
          </div>

          {/* Document Viewer Panel */}
          <div className="flex-1 bg-vitta-surface-2 flex flex-col p-8 overflow-hidden">
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setActiveSide("front")}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSide === "front"
                    ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
                    : "bg-vitta-surface border border-vitta-border text-vitta-text-muted"
                }`}
              >
                Frente do Documento
              </button>
              <button
                onClick={() => setActiveSide("back")}
                className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeSide === "back"
                    ? "bg-vitta-accent text-white shadow-lg shadow-vitta-accent/20"
                    : "bg-vitta-surface border border-vitta-border text-vitta-text-muted"
                }`}
              >
                Verso do Documento
              </button>
            </div>

            <div className="flex-1 relative flex items-center justify-center min-h-0 bg-vitta-text-primary/5 rounded-3xl border-2 border-dashed border-vitta-border p-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSide}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  {activeSide === "front" ? (
                    user.documentFrontUrl ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                        <img
                          src={user.documentFrontUrl}
                          alt="Frente"
                          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-4 ring-white"
                        />
                        <a
                          href={user.documentFrontUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-vitta-accent text-xs font-bold hover:underline"
                        >
                          Abrir em tela cheia
                        </a>
                      </div>
                    ) : (
                      <div className="text-center space-y-2 opacity-40">
                        <FileQuestion size={48} className="mx-auto" />
                        <p className="text-sm font-bold">Frente não enviada</p>
                      </div>
                    )
                  ) : user.documentBackUrl ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                      <img
                        src={user.documentBackUrl}
                        alt="Verso"
                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl ring-4 ring-white"
                      />
                      <a
                        href={user.documentBackUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-vitta-accent text-xs font-bold hover:underline"
                      >
                        Abrir em tela cheia
                      </a>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 opacity-40">
                      <FileQuestion size={48} className="mx-auto" />
                      <p className="text-sm font-bold">Verso não enviado</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const UsersView = () => {
  const { addToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [auditingUser, setAuditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("Todos");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    status: "Ativo",
    plan: "Básico",
    role: "user",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin Master";
      case "professional":
        return "Profissional";
      case "conveniado":
        return "Conveniado";
      case "user":
      default:
        return "Cliente/Paciente";
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "professional":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "conveniado":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "user":
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
    }
  };

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("name"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "users");
      },
    );
    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.cpf?.includes(searchTerm);

      const matchesPlan = filterPlan === "Todos" || user.plan === filterPlan;
      const matchesStatus =
        filterStatus === "Todos" || user.status === filterStatus;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, searchTerm, filterPlan, filterStatus]);

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Usuário",
      message:
        "Tem certeza que deseja excluir este usuário? Esta ação é irreversível e removerá todos os dados vinculados.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "users", id));
          await logAdminAction("DELETE_USER", `Excluiu o usuário ID: ${id}`);
          addToast("Usuário excluído com sucesso.", "success");
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `users/${id}`);
          addToast("Erro ao excluir usuário.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingUser;
      await updateDoc(doc(db, "users", id), data);
      await logAdminAction(
        "UPDATE_USER",
        `Editou o usuário: ${data.email || id}`,
      );
      setEditingUser(null);
      addToast("Usuário atualizado com sucesso.", "success");
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `users/${editingUser.id}`,
      );
      addToast("Erro ao atualizar usuário.", "error");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create user in Auth using a secondary app instance to avoid signing out current admin
      const secondaryApp =
        getApps().find((app) => app.name === "SecondaryApp") ||
        initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);
      const result = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password,
      );
      const user = result.user;

      // 2. Update profile
      await updateProfile(user, { displayName: newUser.name });

      // 3. Create Firestore document
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: newUser.name,
        email: newUser.email,
        status: newUser.status,
        plan: newUser.plan,
        role: newUser.role,
        createdAt: Timestamp.now(),
      });

      // 4. Create welcome notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Bem-vindo à ViTTA Health!",
        message: `Olá ${newUser.name}, seu cadastro foi realizado com sucesso. Explore nossos serviços!`,
        type: "info",
        read: false,
        createdAt: Timestamp.now(),
      });

      // 5. Sign out from secondary app
      await signOut(secondaryAuth);

      // 6. Log action
      await logAdminAction("CREATE_USER", `Criou o usuário: ${newUser.email}`);

      setIsCreatingUser(false);
      setNewUser({
        name: "",
        email: "",
        password: "",
        status: "Ativo",
        plan: "Básico",
        role: "user",
      });
      addToast("Usuário criado com sucesso.", "success");
    } catch (err: any) {
      console.error("Erro ao criar usuário:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setError("Falha ao criar usuário. Tente novamente.");
      }
      addToast("Erro ao criar usuário.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuditStatusUpdate = async (status: string) => {
    if (!auditingUser) return;
    try {
      await updateDoc(doc(db, "users", auditingUser.id), {
        kycStatus: status,
        updatedAt: Timestamp.now(),
      });
      await logAdminAction(
        "KYC_AUDIT",
        `Usuário ${auditingUser.email}: Status alterado para ${status}`,
      );
      addToast(`Status de auditoria atualizado para: ${status}`, "success");
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.UPDATE,
        `users/${auditingUser.id}`,
      );
      addToast("Erro ao atualizar auditoria.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {auditingUser && (
          <KYCDocumentViewer
            user={auditingUser}
            onClose={() => setAuditingUser(null)}
            onUpdateStatus={handleAuditStatusUpdate}
          />
        )}
        {isCreatingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  Novo Usuário
                </h3>
                <button
                  onClick={() => setIsCreatingUser(false)}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form
                onSubmit={handleCreateUser}
                className="p-6 space-y-4 overflow-y-auto"
              >
                {error && (
                  <div className="p-4 bg-vitta-danger/10 text-vitta-danger text-sm rounded-xl border border-vitta-danger/20">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser({ ...newUser, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="joao@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Senha Inicial
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nível de Acesso (Cargo)
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({ ...newUser, role: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  >
                    <option value="user">Cliente/Paciente</option>
                    <option value="professional">Profissional</option>
                    <option value="conveniado">Conveniado</option>
                    <option value="admin">Admin Master</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Status
                    </label>
                    <select
                      value={newUser.status}
                      onChange={(e) =>
                        setNewUser({ ...newUser, status: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Plano
                    </label>
                    <select
                      value={newUser.plan}
                      onChange={(e) =>
                        setNewUser({ ...newUser, plan: e.target.value })
                      }
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
                    {isSubmitting ? "Criando..." : "Criar Usuário"}
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
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  Editar Usuário
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form
                onSubmit={handleSaveEdit}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) =>
                      setEditingUser({ ...editingUser, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Status
                    </label>
                    <select
                      value={editingUser.status}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          status: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Plano
                    </label>
                    <select
                      value={editingUser.plan}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, plan: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="Free">Free</option>
                      <option value="Básico">Básico</option>
                      <option value="Premium">Premium</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Nível de Acesso (Cargo)
                    </label>
                    <select
                      value={editingUser.role || "user"}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, role: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="user">Cliente/Paciente</option>
                      <option value="professional">Profissional</option>
                      <option value="conveniado">Conveniado</option>
                      <option value="admin">Admin Master</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Status KYC
                    </label>
                    <select
                      value={editingUser.kycStatus || "pending"}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          kycStatus: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    >
                      <option value="pending">Pendente</option>
                      <option value="under_review">Em Análise</option>
                      <option value="verified">Verificado</option>
                      <option value="rejected">Rejeitado</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      value={editingUser.cpf || ""}
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, cpf: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Saldo em Carteira
                    </label>
                    <input
                      type="number"
                      value={editingUser.walletBalance || 0}
                      onChange={(e) =>
                        setEditingUser({
                          ...editingUser,
                          walletBalance: Number(e.target.value),
                        })
                      }
                      className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                    />
                  </div>
                </div>

                {/* KYC Documents Preview for Admin */}
                {(editingUser.documentFrontUrl ||
                  editingUser.documentBackUrl) && (
                  <div className="space-y-3 pt-4 border-t border-vitta-border">
                    <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                      Documentos KYC
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {editingUser.documentFrontUrl && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">
                            Frente
                          </p>
                          <a
                            href={editingUser.documentFrontUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block relative group rounded-xl overflow-hidden border border-vitta-border h-32"
                          >
                            <img
                              src={editingUser.documentFrontUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              Ver Ampliado
                            </div>
                          </a>
                        </div>
                      )}
                      {editingUser.documentBackUrl && (
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-vitta-text-muted uppercase px-1">
                            Verso
                          </p>
                          <a
                            href={editingUser.documentBackUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block relative group rounded-xl overflow-hidden border border-vitta-border h-32"
                          >
                            <img
                              src={editingUser.documentBackUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              Ver Ampliado
                            </div>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h2 className="text-2xl font-bold text-vitta-text-primary">
          Gestão de Usuários
        </h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
              size={16}
            />
            <input
              type="text"
              placeholder="Nome, e-mail ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all min-w-[240px]"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-3 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all"
          >
            <option value="Todos">Todos os Planos</option>
            <option value="Free">Free</option>
            <option value="Básico">Básico</option>
            <option value="Premium">Premium</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 bg-vitta-surface border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all"
          >
            <option value="Todos">Todos Status</option>
            <option value="Ativo">Ativos</option>
            <option value="Inativo">Inativos</option>
          </select>
          <button
            onClick={() => setIsCreatingUser(true)}
            className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
          >
            <Plus size={20} />
            Novo
          </button>
        </div>
      </div>

      <div className="bg-vitta-surface rounded-xl border border-vitta-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-vitta-surface-2 border-b border-vitta-border">
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Usuário
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Nível de Acesso
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                KYC
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
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-vitta-surface-2 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          user.photoURL ||
                          `https://picsum.photos/seed/${user.id}/100/100`
                        }
                        className="w-10 h-10 rounded-full object-cover"
                        alt=""
                      />
                      <div>
                        <p className="font-bold text-vitta-text-primary text-sm">
                          {user.name}
                        </p>
                        <p className="text-xs text-vitta-text-secondary">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-bold ${getRoleBadgeClass(user.role)}`}
                    >
                      {getRoleLabel(user.role || "user")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        user.status === "Ativo"
                          ? "bg-vitta-green-bg text-vitta-green"
                          : "bg-vitta-surface-2 text-vitta-text-muted"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.kycStatus === "verified"
                            ? "bg-vitta-green"
                            : user.kycStatus === "under_review"
                              ? "bg-vitta-accent"
                              : user.kycStatus === "rejected"
                                ? "bg-vitta-danger"
                                : "bg-vitta-text-muted"
                        }`}
                      />
                      <span className="text-[10px] font-bold text-vitta-text-primary capitalize">
                        {user.kycStatus === "under_review"
                          ? "Análise"
                          : user.kycStatus || "Pendente"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-vitta-text-secondary font-medium">
                    {user.plan}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {(user.kycStatus === "pending" ||
                        user.kycStatus === "under_review" ||
                        user.documentFrontUrl) && (
                        <button
                          onClick={() => setAuditingUser(user)}
                          title="Auditar documentos"
                          className="p-2 text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-colors"
                        >
                          <ShieldCheck size={18} />
                        </button>
                      )}

                      {/* Alterar Status (Desativar / Ativar) Shortcut */}
                      {user.status === "Ativo" ? (
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "users", user.id), {
                                status: "Inativo",
                              });
                              await logAdminAction(
                                "DEACTIVATE_USER",
                                `Desativou o usuário: ${user.email || user.id}`,
                              );
                              addToast(
                                "Usuário desativado com sucesso.",
                                "success",
                              );
                            } catch (err) {
                              handleFirestoreError(
                                err,
                                OperationType.UPDATE,
                                `users/${user.id}`,
                              );
                              addToast("Erro ao desativar usuário.", "error");
                            }
                          }}
                          title="Desativar Usuário"
                          className="p-2 text-vitta-text-muted hover:text-vitta-danger transition-colors hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl"
                        >
                          <UserX size={16} />
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, "users", user.id), {
                                status: "Ativo",
                              });
                              await logAdminAction(
                                "ACTIVATE_USER",
                                `Ativou o usuário: ${user.email || user.id}`,
                              );
                              addToast(
                                "Usuário ativado com sucesso.",
                                "success",
                              );
                            } catch (err) {
                              handleFirestoreError(
                                err,
                                OperationType.UPDATE,
                                `users/${user.id}`,
                              );
                              addToast("Erro ao ativar usuário.", "error");
                            }
                          }}
                          title="Ativar Usuário"
                          className="p-2 text-vitta-text-muted hover:text-vitta-green transition-colors hover:bg-green-50 dark:hover:bg-green-950/20 rounded-xl"
                        >
                          <UserCheck size={16} />
                        </button>
                      )}

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
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-10 text-center text-vitta-text-muted"
                >
                  Nenhum usuário encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

const UserConfigView = () => {
  const { addToast } = useToast();
  const [accessLevels, setAccessLevels] = useState([
    {
      id: 1,
      role: "Administrador",
      desc: "Acesso total ao sistema e configurações",
    },
    { id: 2, role: "Moderador", desc: "Gerenciamento de usuários e conteúdos" },
    {
      id: 3,
      role: "Usuário Padrão",
      desc: "Acesso às funcionalidades básicas",
    },
  ]);
  const [globalConfigs, setGlobalConfigs] = useState({
    autoApproval: false,
    auditLogs: true,
    maintenanceMode: false,
    twoFactorMandatory: false,
    systemAlerts: true,
    weeklyReports: false,
  });
  const [editingLevel, setEditingLevel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sync Access Levels
    const accessRef = doc(db, "system_configs", "access_levels");
    const unsubscribeAccess = onSnapshot(
      accessRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setAccessLevels(snapshot.data().levels || []);
        }
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(
          error,
          OperationType.GET,
          "system_configs/access_levels",
        );
        setIsLoading(false);
      },
    );

    // Sync Global Configs
    const globalRef = doc(db, "system_configs", "global");
    const unsubscribeGlobal = onSnapshot(
      globalRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setGlobalConfigs((prev) => ({ ...prev, ...snapshot.data() }));
        } else {
          setDoc(globalRef, globalConfigs).catch(console.error);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "system_configs/global");
      },
    );

    return () => {
      unsubscribeAccess();
      unsubscribeGlobal();
    };
  }, []);

  const handleToggleSetting = async (key: keyof typeof globalConfigs) => {
    const newValue = !globalConfigs[key];
    try {
      await setDoc(
        doc(db, "system_configs", "global"),
        { [key]: newValue },
        { merge: true },
      );
      await logAdminAction(
        "UPDATE_GLOBAL_CONFIG",
        `Configuração ${key} alterada para ${newValue ? "Ativado" : "Desativado"}`,
      );
      addToast("Configuração atualizada com sucesso.", "success");
    } catch (error) {
      console.error("Error updating config:", error);
      addToast("Erro ao atualizar configuração.", "error");
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newAccessLevels = accessLevels.map((al) =>
      al.id === editingLevel.id ? editingLevel : al,
    );

    try {
      await setDoc(
        doc(db, "system_configs", "access_levels"),
        { levels: newAccessLevels },
        { merge: true },
      );
      await logAdminAction(
        "UPDATE_ACCESS_LEVELS",
        "Atualizou as configurações de níveis de acesso",
      );
      setEditingLevel(null);
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        "system_configs/access_levels",
      );
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
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  Configurar Nível de Acesso
                </h3>
                <button
                  onClick={() => setEditingLevel(null)}
                  className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
                >
                  <X size={20} className="text-vitta-text-muted" />
                </button>
              </div>
              <form
                onSubmit={handleSaveEdit}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome do Nível
                  </label>
                  <input
                    type="text"
                    value={editingLevel.role}
                    onChange={(e) =>
                      setEditingLevel({ ...editingLevel, role: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Descrição
                  </label>
                  <textarea
                    value={editingLevel.desc}
                    onChange={(e) =>
                      setEditingLevel({ ...editingLevel, desc: e.target.value })
                    }
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Configurações de Usuário
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl">
            Gerencie permissões, acessos e preferências do sistema
          </p>
          <button
            onClick={() =>
              addToast(
                "Integridade de permissões verificada. Sistema seguro.",
                "info",
              )
            }
            className="flex items-center gap-2 px-8 py-4 bg-white text-vitta-accent rounded-xl font-bold shadow-lg hover:bg-vitta-surface-2 transition-all transform hover:scale-105 active:scale-95"
          >
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
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Níveis de Acesso
            </h3>
          </div>
          <div className="space-y-4">
            {accessLevels.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border group hover:border-vitta-accent/30 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-vitta-text-primary">
                    {item.role}
                  </span>
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
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Preferências Globais
            </h3>
          </div>
          <div className="space-y-6">
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handleToggleSetting("autoApproval")}
            >
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">
                  Auto-aprovação
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Novos usuários são aprovados automaticamente
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${globalConfigs.autoApproval ? "bg-vitta-green" : "bg-vitta-border"}`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.autoApproval ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
              </div>
            </div>
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handleToggleSetting("auditLogs")}
            >
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">
                  Logs de Auditoria
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Registrar todas as ações administrativas
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${globalConfigs.auditLogs ? "bg-vitta-green" : "bg-vitta-border"}`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.auditLogs ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
              </div>
            </div>
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handleToggleSetting("maintenanceMode")}
            >
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">
                  Manutenção
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Ativar modo de manutenção do sistema
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${globalConfigs.maintenanceMode ? "bg-vitta-danger" : "bg-vitta-border"}`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.maintenanceMode ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
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
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Segurança
            </h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-bold text-vitta-text-primary mb-1">
                  2FA Obrigatório (Todos)
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Exigir autenticação em duas etapas para todos os usuários
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 cursor-pointer ${globalConfigs.twoFactorMandatory ? "bg-vitta-green" : "bg-vitta-border"}`}
                onClick={() => handleToggleSetting("twoFactorMandatory")}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.twoFactorMandatory ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
              </div>
            </div>
            <div className="p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-sm font-bold text-vitta-text-primary mb-1">
                    Autenticação em Duas Etapas (2FA)
                  </p>
                  <p className="text-xs text-vitta-text-secondary">
                    Obrigatório para administradores
                  </p>
                </div>
                <button
                  onClick={() =>
                    addToast("Módulo de gestão 2FA aberto.", "info")
                  }
                  className="px-4 py-2 bg-vitta-danger text-white rounded-xl text-xs font-bold hover:bg-vitta-danger/90 transition-colors shadow-sm"
                >
                  Gerenciar
                </button>
              </div>
              <div className="pt-3 border-t border-vitta-border">
                <p className="text-sm font-bold text-vitta-text-primary mb-1">
                  Política de Senhas
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Mínimo 8 caracteres, letras e números
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-sm space-y-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-vitta-amber-bg text-vitta-amber rounded-xl">
              <Bell size={24} />
            </div>
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Notificações
            </h3>
          </div>
          <div className="space-y-4">
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handleToggleSetting("systemAlerts")}
            >
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">
                  Alertas de Sistema
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Receber notificações críticas
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${globalConfigs.systemAlerts ? "bg-vitta-green" : "bg-vitta-border"}`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.systemAlerts ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
              </div>
            </div>
            <div
              className="flex items-center justify-between group cursor-pointer"
              onClick={() => handleToggleSetting("weeklyReports")}
            >
              <div>
                <p className="text-sm font-bold text-vitta-text-primary">
                  Relatórios Semanais
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  Receber resumo de atividades
                </p>
              </div>
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${globalConfigs.weeklyReports ? "bg-vitta-green" : "bg-vitta-border"}`}
              >
                <motion.div
                  initial={false}
                  animate={{ x: globalConfigs.weeklyReports ? 20 : 0 }}
                  className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                />
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

const RescheduleModal = ({
  appointment,
  onClose,
  onConfirm,
}: {
  appointment: any;
  onClose: () => void;
  onConfirm: (date: string, time: string) => Promise<void>;
}) => {
  const [date, setDate] = useState(appointment.date);
  const [time, setTime] = useState(appointment.time);
  const [isSaving, setIsSaving] = useState(false);
  const [professional, setProfessional] = useState<any>(null);
  const [isLoadingProf, setIsLoadingProf] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (!appointment.professionalId) {
      setIsLoadingProf(false);
      return;
    }
    const fetchProf = async () => {
      try {
        const snap = await getDoc(doc(db, "professionals", appointment.professionalId));
        if (snap.exists()) {
          setProfessional({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching professional for rescheduling:", err);
      } finally {
        setIsLoadingProf(false);
      }
    };
    fetchProf();
  }, [appointment.professionalId]);

  useEffect(() => {
    if (!professional || !date) return;

    const fetchBooked = async () => {
      setIsLoadingSlots(true);
      try {
        const q = query(
          collection(db, "appointments"),
          where("professionalId", "==", professional.id),
          where("date", "==", date),
        );
        const snapshot = await getDocs(q);
        const booked = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter(
            (data: any) =>
              data.status !== "cancelled" && data.id !== appointment.id
          )
          .map((data: any) => data.time);
        setBookedSlots(booked);
      } catch (err) {
        console.error("Error fetching booked slots for reschedule:", err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchBooked();
  }, [date, professional, appointment.id]);

  useEffect(() => {
    if (!date || !professional) return;

    let slots: string[] = [];

    if (professional.schedule?.weekly) {
      const dateObj = new Date(date + "T00:00:00");
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

    setAvailableSlots(slots);
  }, [date, professional]);

  const handleConfirm = async () => {
    if (!time) return;
    setIsSaving(true);
    await onConfirm(date, time);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-vitta-text-primary/20 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-vitta-surface w-full max-w-md rounded-3xl shadow-2xl border border-vitta-border overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <div>
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Remarcar Consulta
            </h3>
            <p className="text-[11px] text-vitta-text-secondary mt-0.5">
              Escolha uma nova data e horário disponível.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-vitta-surface-2 rounded-xl transition-colors"
          >
            <X size={20} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto no-scrollbar">
          {/* Resumo Profissional */}
          <div className="p-3.5 bg-vitta-surface-2 border border-vitta-border rounded-2xl flex items-center gap-3">
            <img
              src={appointment.imageUrl || "https://picsum.photos/seed/prof/100/100"}
              alt={appointment.professionalName}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="text-left">
              <p className="text-xs font-bold text-vitta-text-primary">
                {appointment.professionalName}
              </p>
              <p className="text-[10px] text-vitta-text-secondary mt-0.5">
                {appointment.specialty}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
              Data Desejada
            </label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
              }}
              className="w-full px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-xs focus:ring-1 focus:ring-vitta-accent/30 outline-none text-vitta-text-primary transition-all font-sans font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
              Sessões Disponíveis
            </label>
            {isLoadingSlots ? (
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-vitta-surface-2 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar pt-1">
                {availableSlots.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setTime(slot)}
                      className={`py-2 text-[11px] font-bold rounded-lg border transition-all ${
                        time === slot
                          ? "bg-vitta-accent border-vitta-accent text-white shadow-md shadow-vitta-accent/20 scale-[1.02]"
                          : isBooked
                            ? "bg-vitta-surface-2 border-vitta-border text-vitta-text-muted cursor-not-allowed opacity-40"
                            : "bg-vitta-surface border-vitta-border text-vitta-text-primary hover:border-vitta-accent/40"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-vitta-danger/5 rounded-xl border border-dashed border-vitta-danger/20 text-center">
                <p className="text-[10px] font-bold text-vitta-danger uppercase tracking-wider">
                  Nenhum turno disponível para esta data
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-vitta-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 py-3 bg-vitta-surface-2 text-vitta-text-secondary rounded-xl font-bold text-xs hover:bg-vitta-border transition-all disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSaving || !time}
              className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold text-xs shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Remarcar Consulta"
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const AppointmentsView = ({
  user,
  setActiveTab,
  setReviewingAppointment,
  setActiveTelemedicineApt,
  googleToken,
}: {
  user: any;
  setActiveTab: (tab: string) => void;
  setReviewingAppointment: (apt: any) => void;
  setActiveTelemedicineApt: (apt: any) => void;
  googleToken: string | null;
}) => {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingApt, setEditingApt] = useState<any>(null);
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
    if (!user) return;
    const q = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort client-side to avoid index requirement for now
        data.sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setAppointments(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "appointments");
      },
    );
    return () => unsubscribe();
  }, [user]);

  const handleCancelApt = (apt: any) => {
    setConfirmModal({
      isOpen: true,
      title: "Cancelar Consulta",
      message: `Tem certeza que deseja cancelar sua consulta com ${apt.professionalName}?`,
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "appointments", apt.id));

          // Auto-Sync to Google Calendar
          if (googleToken && apt.googleCalendarEventId) {
            await deleteGoogleCalendarEvent(apt.googleCalendarEventId, googleToken);
          }

          await addDoc(collection(db, "notifications"), {
            userId: user.uid,
            title: "Consulta Cancelada",
            message: `Sua consulta com ${apt.professionalName} foi cancelada.`,
            type: "appointment",
            read: false,
            createdAt: Timestamp.now(),
          });
          addToast("Consulta cancelada com sucesso.", "success");
        } catch (err) {
          console.error("Erro ao cancelar agendamento:", err);
          addToast("Erro ao cancelar consulta.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleSaveReschedule = async (newDate: string, newTime: string) => {
    if (!editingApt) return;
    try {
      const aptRef = doc(db, "appointments", editingApt.id);
      await updateDoc(aptRef, {
        date: newDate,
        time: newTime,
        updatedAt: Timestamp.now(),
      });

      // Auto-Sync to Google Calendar
      if (googleToken && editingApt.googleCalendarEventId) {
        await updateGoogleCalendarEvent(editingApt.googleCalendarEventId, {
          professionalName: editingApt.professionalName,
          specialty: editingApt.specialty,
          date: newDate,
          time: newTime,
        }, googleToken);
      }

      // Notify user
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Consulta Remarcada",
        message: `Sua consulta com ${editingApt.professionalName} foi remarcada para ${formatDateForDisplay(newDate)} às ${newTime}.`,
        type: "appointment",
        read: false,
        createdAt: Timestamp.now(),
      });

      addToast("Consulta remarcada com sucesso.", "success");
      setEditingApt(null);
    } catch (err) {
      console.error("Erro ao remarcar consulta:", err);
      addToast("Erro ao remarcar consulta.", "error");
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
      </AnimatePresence>
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-vitta-text-primary">
            Meus Agendamentos
          </h1>
          <p className="text-vitta-text-secondary">
            Gerencie suas consultas e horários marcados.
          </p>
        </div>
        <button
          onClick={() => setActiveTab("professionals")}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-green hover:bg-vitta-green/95 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-green/20 self-start sm:self-auto shrink-0"
        >
          <Plus size={18} />
          Agendar Nova Consulta
        </button>
      </section>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <motion.div
              key={apt.id}
              whileHover={{ x: 4 }}
              className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm flex flex-col md:flex-row md:items-center gap-6"
            >
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={apt.imageUrl}
                  alt={apt.professionalName}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg text-vitta-text-primary">
                    {apt.professionalName}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-sm text-vitta-text-secondary">
                      {apt.specialty}
                    </p>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
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

              <div className="flex flex-wrap gap-6 items-center">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Data e Hora
                  </p>
                  <div className="flex items-center gap-2 text-sm font-bold text-vitta-text-primary">
                    <Calendar size={16} className="text-vitta-green" />
                    {formatDateForDisplay(apt.date)} às{" "}
                    {apt.time}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Status
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      apt.status === "upcoming"
                        ? "bg-blue-500/10 text-blue-500"
                        : apt.status === "pending"
                          ? "bg-vitta-amber-bg text-vitta-amber"
                          : apt.status === "completed"
                            ? "bg-vitta-green-bg text-vitta-green"
                            : "bg-vitta-danger/10 text-vitta-danger"
                    }`}
                  >
                    {apt.status === "upcoming"
                      ? "Agendado"
                      : apt.status === "pending"
                        ? "Aguardando"
                        : apt.status === "completed"
                          ? "Finalizado"
                          : "Cancelado"}
                  </span>
                </div>

                <div className="flex gap-2 items-center flex-wrap">
                  {(apt.status === "upcoming" ||
                    apt.status === "in_progress") &&
                    (apt.modality === "telemedicine" ||
                      apt.modality === "online" ||
                      apt.specialty?.toLowerCase().includes("tele") ||
                      !apt.modality) && (
                      <>
                        <button
                          onClick={() => setActiveTelemedicineApt(apt)}
                          className="px-4 py-2 bg-vitta-accent text-white rounded-xl text-xs font-bold hover:bg-vitta-accent/95 transition-all flex items-center gap-1.5 shadow-md shadow-vitta-accent/10"
                        >
                          <Video size={14} />
                          Acessar Teleconsulta
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
                  {apt.status === "completed" && !apt.isReviewed && (
                    <button
                      onClick={() => setReviewingAppointment(apt)}
                      className="flex items-center gap-2 px-4 py-2 bg-vitta-amber/10 text-vitta-amber hover:bg-vitta-amber hover:text-white rounded-xl transition-all font-bold text-xs shadow-sm"
                    >
                      <Star size={16} fill="currentColor" />
                      Avaliar
                    </button>
                  )}
                  <button
                    onClick={() => setEditingApt(apt)}
                    className="p-2 text-vitta-text-muted hover:text-vitta-accent hover:bg-vitta-accent-bg rounded-xl transition-all"
                  >
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
          ))
        ) : (
          <div className="p-12 text-center bg-vitta-surface rounded-xl border border-dashed border-vitta-border">
            <Calendar
              size={48}
              className="mx-auto text-vitta-text-muted mb-4"
            />
            <p className="text-vitta-text-secondary font-medium">
              Você ainda não tem agendamentos.
            </p>
            <button
              onClick={() => setActiveTab("professionals")}
              className="mt-4 px-6 py-2 bg-vitta-green text-white rounded-xl text-sm font-bold hover:bg-vitta-green/90 transition-colors"
            >
              Agendar Agora
            </button>
          </div>
        )}
      </div>

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

const RadioView = ({
  isPlaying,
  setIsPlaying,
  volume,
  setVolume,
  config,
  isAdmin,
}: {
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  config: { url: string; currentShow?: string; upNextMessage?: string };
  isAdmin: boolean;
}) => {
  const [newUrl, setNewUrl] = useState(config.url);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNewUrl(config.url);
  }, [config.url]);

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "config", "radio"), { url: newUrl });
      await logAdminAction(
        "UPDATE_RADIO_CONFIG",
        `Atualizou a URL da rádio para: ${newUrl}`,
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "config/radio");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1 text-vitta-text-primary">
            Rádio ViTTA
          </h1>
          <p className="text-vitta-text-secondary">
            Música e entretenimento para o seu bem-estar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gradient-to-br from-vitta-green via-vitta-accent to-vitta-purple p-1 rounded-xl shadow-2xl shadow-vitta-accent/20">
            <div className="bg-vitta-surface rounded-xl p-8 md:p-12 flex flex-col items-center text-center space-y-8">
              <div className="relative">
                <div
                  className={`w-32 h-32 md:w-48 md:h-48 rounded-full bg-vitta-surface-2 flex items-center justify-center border-4 border-vitta-border transition-all duration-500 ${isPlaying ? "scale-110 shadow-2xl shadow-vitta-green/20" : ""}`}
                >
                  <Radio
                    className={`text-vitta-accent transition-all duration-500 ${isPlaying ? "animate-pulse scale-110" : ""}`}
                    size={64}
                  />
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
                  {isPlaying
                    ? config.currentShow || "Transmitindo ao Vivo"
                    : "Rádio Pausada"}
                </h2>
                <p className="text-vitta-text-secondary max-w-md">
                  {isPlaying
                    ? config.upNextMessage ||
                      "Curta a melhor seleção musical preparada especialmente para você."
                    : "Clique no botão abaixo para iniciar a transmissão da Rádio ViTTA."}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
                    isPlaying
                      ? "bg-vitta-danger text-white hover:bg-vitta-danger/90 shadow-vitta-danger/20"
                      : "bg-vitta-accent text-white hover:bg-vitta-accent/90 shadow-vitta-accent/20"
                  }`}
                >
                  {isPlaying ? <X size={24} /> : <Radio size={24} />}
                  {isPlaying ? "Pausar Rádio" : "Ouvir Rádio"}
                </button>

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    <span>Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 0.5)}
                      className="text-vitta-text-muted hover:text-vitta-accent transition-colors"
                    >
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
                <h4 className="font-bold text-vitta-text-primary">
                  Programação 24h
                </h4>
                <p className="text-sm text-vitta-text-secondary">
                  Música sem interrupções
                </p>
              </div>
            </div>
            <div className="bg-vitta-surface p-6 rounded-xl border border-vitta-border shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-vitta-accent-bg rounded-xl flex items-center justify-center text-vitta-accent">
                <Star size={24} />
              </div>
              <div>
                <h4 className="font-bold text-vitta-text-primary">
                  Alta Qualidade
                </h4>
                <p className="text-sm text-vitta-text-secondary">
                  Áudio cristalino em HD
                </p>
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
                <h3 className="font-bold text-lg text-vitta-text-primary">
                  Configuração Admin
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    URL da Transmissão
                  </label>
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
                  ) : (
                    <Save size={18} />
                  )}
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
              A rádio continuará tocando mesmo que você navegue por outras
              páginas do aplicativo. Use o mini-player que aparecerá no canto
              inferior.
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
        <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
          Rádio ViTTA
        </p>
        <p className="text-sm font-bold text-vitta-text-primary truncate">
          Ao Vivo
        </p>
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

const AddFundsModal = ({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}) => {
  const { addToast } = useToast();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<"selection" | "pix">("selection");
  const [paymentData, setPaymentData] = useState<any>(null);
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  useEffect(() => {
    let interval: any;
    if (step === "pix" && paymentData?.id && pollingStatus !== "approved") {
      interval = setInterval(async () => {
        try {
          const response = await fetch(
            `/api/mercado-pago/payments/${paymentData.id}`,
          );
          const data = await response.json();
          if (data.status === "approved") {
            setPollingStatus("approved");
            addToast("Pagamento confirmado!", "success");
            setTimeout(() => {
              onClose();
            }, 2000);
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, paymentData, pollingStatus]);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    const code =
      paymentData?.point_of_interaction?.transaction_data?.qr_code || "";
    navigator.clipboard.writeText(code);
    addToast("Código PIX copiado!", "success");
  };

  const handleProceedToPix = async () => {
    const value = parseFloat(amount.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      addToast("Por favor, insira um valor válido.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch("/api/mercado-pago/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          email: user.email,
          userId: user.uid,
        }),
      });
      const data = await response.json();
      if (data.id) {
        setPaymentData(data);
        setStep("pix");
      } else {
        addToast(data.error || "Erro ao gerar PIX", "error");
      }
    } catch (error) {
      console.error("Error generating PIX:", error);
      addToast("Erro ao conectar com o gateway.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const predefinedValues = [50, 100, 200, 500];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <h2 className="text-xl font-bold text-vitta-text-primary">
            {step === "selection" ? "Adicionar Fundos" : "Pagamento via PIX"}
          </h2>
          <button
            onClick={onClose}
            className="text-vitta-text-secondary hover:text-vitta-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {step === "selection" ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-vitta-text-primary mb-3">
                  Selecione um valor:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {predefinedValues.map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val.toString())}
                      className={`py-3 rounded-xl font-bold border transition-all ${
                        amount === val.toString()
                          ? "bg-vitta-accent border-vitta-accent text-white shadow-md"
                          : "bg-vitta-surface-2 border-vitta-border text-vitta-text-primary hover:border-vitta-accent"
                      }`}
                    >
                      R$ {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-vitta-text-primary mb-2">
                  Ou digite outro valor:
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-vitta-text-secondary font-medium">
                      R$
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl focus:outline-none focus:border-vitta-accent text-vitta-text-primary font-bold"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <button
                onClick={handleProceedToPix}
                disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                className="w-full py-4 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-vitta-accent/20"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Prosseguir para o PIX
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center">
              {pollingStatus === "approved" ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <Check size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-vitta-text-primary">
                    Pagamento Aprovado!
                  </h3>
                  <p className="text-sm text-vitta-text-secondary text-center max-w-xs">
                    Seu saldo foi atualizado e você já pode utilizar seus
                    fundos.
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="bg-vitta-surface-2 p-6 rounded-2xl flex flex-col items-center gap-4">
                    <div className="w-48 h-48 bg-white p-2 rounded-xl border border-vitta-border flex items-center justify-center relative overflow-hidden">
                      {paymentData?.point_of_interaction?.transaction_data
                        ?.qr_code_base64 ? (
                        <img
                          src={`data:image/png;base64,${paymentData.point_of_interaction.transaction_data.qr_code_base64}`}
                          alt="QR Code PIX"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-vitta-text-muted">
                          <QrCode size={48} />
                          <span className="text-[10px]">
                            Gerando QR Code...
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-vitta-text-secondary font-medium">
                      Aguardando pagamento... O saldo será atualizado
                      automaticamente.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-vitta-text-primary">
                      Valor: R$ {parseFloat(amount).toFixed(2)}
                    </p>
                    <div className="relative">
                      <input
                        readOnly
                        value={
                          paymentData?.point_of_interaction?.transaction_data
                            ?.qr_code || ""
                        }
                        className="w-full pl-4 pr-12 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-[10px] font-mono text-vitta-text-secondary outline-none"
                        placeholder="Código PIX"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-vitta-accent hover:bg-vitta-accent/10 rounded-lg transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep("selection")}
                    className="w-full py-3 text-vitta-text-muted text-sm font-bold hover:text-vitta-text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Alterar valor ou cancelar
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-vitta-text-muted uppercase tracking-widest font-bold">
                    <div className="w-1.5 h-1.5 bg-vitta-accent rounded-full animate-pulse" />
                    Verificando status do pagamento
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const WalletsView = ({ user }: { user: any }) => {
  const { addToast } = useToast();
  const [balance, setBalance] = useState(0);
  const [vittaCoins, setVittaCoins] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"history" | "rewards">(
    "history",
  );
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

  // Exclusive rewards for Vitta Coins redemption
  const rewardOffers = [
    {
      id: "reward_telemed_vitta",
      title: "Voucher Consulta Telemedicina",
      partner: "ViTTA Convênios",
      cost: 40,
      description:
        "Resgate uma consulta por vídeo gratuita de Clínico Geral disponível 24h.",
      icon: Video,
      color: "amber",
    },
    {
      id: "reward_meds_drogapovo",
      title: "Voucher 30% Desconto Genéricos",
      partner: "Drogaria do Povo",
      cost: 15,
      description:
        "Dedução de 30% em qualquer medicamento de marca genérica participante.",
      icon: Pill,
      color: "emerald",
    },
    {
      id: "reward_checkup_exame",
      title: "Exame de Check-up Básico Grátis",
      partner: "Laboratório ViTTA Lab",
      cost: 30,
      description:
        "Hemograma completo + Perfil de glicemia sem custo de coparticipação.",
      icon: Activity,
      color: "pink",
    },
    {
      id: "reward_specialist_consult",
      title: "Desconto R$ 50 em Especialista",
      partner: "Clínica ViTTA Especialidades",
      cost: 60,
      description:
        "Desconto fixo na sua próxima consulta presencial agendada com especialista.",
      icon: Stethoscope,
      color: "indigo",
    },
  ];

  useEffect(() => {
    if (!user) return;

    // Fetch balance and Vitta Coins
    const unsubscribeWallet = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBalance(data.walletBalance || 0);
          setVittaCoins(data.vittaCoins || 0);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      },
    );

    // Fetch transactions
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      limit(50),
    );

    const unsubscribeTransactions = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "transactions");
      },
    );

    return () => {
      unsubscribeWallet();
      unsubscribeTransactions();
    };
  }, [user]);

  const handleRedeemReward = async (reward: any) => {
    if (vittaCoins < reward.cost) {
      addToast(
        "Saldo de Vitta Coins insuficiente para resgatar esta oferta.",
        "error",
      );
      return;
    }

    setIsRedeeming(reward.id);
    try {
      // 1. Deduct Vitta Coins from user document inside database
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        vittaCoins: increment(-reward.cost),
      });

      // 2. Add transaction record
      const coinTxRef = doc(collection(db, "transactions"));
      await setDoc(coinTxRef, {
        userId: user.uid,
        type: "coin_debit",
        amount: reward.cost,
        description: `Resgate de Recompensa: ${reward.title}`,
        date: new Date().toISOString(),
        status: "completed",
      });

      // 3. Insert active voucher to use later
      const userVoucherRef = doc(collection(db, "user_vouchers"));
      await setDoc(userVoucherRef, {
        userId: user.uid,
        voucherId: reward.id,
        title: reward.title,
        partner: reward.partner,
        purchaseDate: new Date().toISOString(),
        status: "active",
        isRedeemedReward: true,
      });

      // 4. Create welcome notification
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title: "Recompensa Resgatada!",
        message: `Parabéns! Você utilizou ${reward.cost} Vitta Coins para resgatar "${reward.title}". O voucher já se encontra disponível.`,
        type: "system",
        read: false,
        createdAt: Timestamp.now(),
      });

      addToast(
        `Recompensa "${reward.title}" resgatante com sucesso!`,
        "success",
      );
    } catch (err) {
      console.error(err);
      addToast("Erro ao resgatar recompensa.", "error");
    } finally {
      setIsRedeeming(null);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-vitta-text-primary">
            Carteira e Recompensas
          </h1>
          <p className="text-vitta-text-secondary">
            Gerencie seus fundos e troque suas Vitta Coins acumuladas por
            prêmios
          </p>
        </div>
        <button
          onClick={() => setIsAddFundsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-vitta-accent hover:bg-vitta-accent/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-vitta-accent/20"
        >
          <Plus size={20} />
          Adicionar Fundos
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Cards */}
        <div className="md:col-span-1 space-y-6">
          {/* Card 1: BRL Balance */}
          <div className="bg-gradient-to-br from-vitta-accent to-vitta-purple p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <Wallet size={180} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-vitta-surface text-sm font-medium mb-1">
                  Saldo Atual (BRL)
                </p>
                <h2 className="text-4xl font-extrabold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(balance)}
                </h2>
              </div>
            </div>
          </div>

          {/* Card 2: Vitta Coins Rewards Card */}
          <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-600 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-8 -bottom-8 opacity-15 rotate-12">
              <Sparkles size={160} />
            </div>
            <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Coins size={24} className="text-yellow-100" />
              </div>
              <div>
                <p className="text-amber-100 text-sm font-medium mb-1">
                  Meus Vitta Coins
                </p>
                <h2 className="text-4xl font-black tracking-tight flex items-baseline gap-1.5">
                  🪙 {vittaCoins}
                  <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Coins
                  </span>
                </h2>
                <div className="pt-4 mt-4 border-t border-white/20 text-[10px] text-amber-100/90 leading-relaxed font-medium">
                  💡 Regra de Acúmulo: Ganhe automaticamente{" "}
                  <strong className="text-white">
                    1 Vitta Coin para cada R$ 10,00 gastos
                  </strong>{" "}
                  em compras de vouchers nesta plataforma!
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tab system for History vs Rewards */}
        <div className="md:col-span-2 flex flex-col">
          <div className="flex bg-vitta-surface-2 p-1.5 rounded-2xl border border-vitta-border mb-6">
            <button
              onClick={() => setActiveSubTab("history")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeSubTab === "history"
                  ? "bg-vitta-surface text-vitta-accent shadow-sm"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              <Clock size={16} />
              Histórico de Lançamentos
            </button>
            <button
              onClick={() => setActiveSubTab("rewards")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeSubTab === "rewards"
                  ? "bg-vitta-surface text-vitta-accent shadow-sm"
                  : "text-vitta-text-secondary hover:text-vitta-text-primary"
              }`}
            >
              <Sparkles
                size={16}
                className="text-yellow-500 fill-yellow-500/25"
              />
              🎁 Central de Recompensas
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeSubTab === "history" ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-vitta-surface rounded-3xl border border-vitta-border shadow-sm overflow-hidden flex-1"
              >
                <div className="p-6 border-b border-vitta-border">
                  <h3 className="text-lg font-bold text-vitta-text-primary flex items-center gap-2">
                    <Clock size={20} className="text-vitta-accent" />
                    Histórico Bancário & Coins
                  </h3>
                </div>

                <div className="divide-y divide-vitta-border max-h-[500px] overflow-y-auto no-scrollbar">
                  {loading ? (
                    <div className="p-8 flex justify-center">
                      <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const isCoinType =
                        transaction.type === "coin_credit" ||
                        transaction.type === "coin_debit";
                      const isCredit =
                        transaction.type === "credit" ||
                        transaction.type === "coin_credit";

                      return (
                        <div
                          key={transaction.id}
                          className="p-6 flex items-center justify-between hover:bg-vitta-surface-2 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                isCoinType
                                  ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-500"
                                  : isCredit
                                    ? "bg-emerald-100 text-emerald-600"
                                    : "bg-rose-100 text-rose-600"
                              }`}
                            >
                              {isCoinType ? (
                                <Coins size={22} />
                              ) : isCredit ? (
                                <ArrowDownRight size={24} />
                              ) : (
                                <ArrowUpRight size={24} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-vitta-text-primary">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-vitta-text-secondary">
                                {new Date(transaction.date).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`text-lg font-bold ${
                              isCoinType
                                ? isCredit
                                  ? "text-amber-500"
                                  : "text-slate-500"
                                : isCredit
                                  ? "text-emerald-600"
                                  : "text-rose-600"
                            }`}
                          >
                            {isCredit ? "+" : "-"}
                            {isCoinType
                              ? `${transaction.amount} Coins`
                              : new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(transaction.amount)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-vitta-surface-2 rounded-full flex items-center justify-center mx-auto mb-4 text-vitta-text-muted">
                        <ClipboardList size={32} />
                      </div>
                      <p className="text-vitta-text-secondary font-medium">
                        Nenhum lançamento registrado
                      </p>
                      <p className="text-sm text-vitta-text-muted mt-1">
                        Seus extratos aparecerão aqui
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              // ACTIVE REWARDS STORE LIST
              <motion.div
                key="rewards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
              >
                {rewardOffers.map((reward) => {
                  const IconComp = reward.icon;
                  return (
                    <div
                      key={reward.id}
                      className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 flex flex-col h-full hover:border-amber-400/50 transition-all shadow-sm relative group overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-3 bg-amber-500/10 text-amber-500 font-extrabold text-xs rounded-bl-2xl flex items-center gap-1 border-l border-b border-vitta-border">
                        🪙 {reward.cost} Coins
                      </div>

                      <div className="flex gap-4 items-start pr-18">
                        <div
                          className={`p-3 rounded-2xl bg-slate-150 border border-slate-200/50 flex-shrink-0 text-slate-700`}
                        >
                          <IconComp size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-vitta-text-primary leading-tight group-hover:text-vitta-accent transition-colors">
                            {reward.title}
                          </h4>
                          <p className="text-[10px] text-vitta-text-muted font-bold tracking-wide uppercase mt-1">
                            {reward.partner}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-vitta-text-secondary leading-relaxed mt-4 flex-1">
                        {reward.description}
                      </p>

                      <div className="pt-6 border-t border-vitta-border/60 mt-6 shrink-0 flex items-center justify-between gap-4">
                        <div className="text-[10px] text-vitta-text-muted">
                          Elegível para associados
                        </div>
                        <button
                          onClick={() => handleRedeemReward(reward)}
                          disabled={
                            isRedeeming !== null || vittaCoins < reward.cost
                          }
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            vittaCoins >= reward.cost
                              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/10"
                              : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 cursor-not-allowed border border-vitta-border"
                          }`}
                        >
                          {isRedeeming === reward.id ? (
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Sparkles size={14} className="fill-white/10" />
                              {vittaCoins >= reward.cost
                                ? "Trocar agora"
                                : "Saldo Insuficiente"}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AddFundsModal
        isOpen={isAddFundsModalOpen}
        onClose={() => setIsAddFundsModalOpen(false)}
        user={user}
      />
    </div>
  );
};

const CheckoutModal = ({
  isOpen,
  onClose,
  user,
  voucher,
  balance,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  voucher: any;
  balance: number;
}) => {
  const { addToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !voucher) return null;

  const hasEnoughBalance = balance >= voucher.price;
  const remainingBalance = balance - voucher.price;

  const handlePurchase = async () => {
    if (!hasEnoughBalance) {
      addToast("Saldo insuficiente para esta compra.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Deduct balance and calculate Vitta Coins cashback (1 Coin per R$ 10 spent)
      const userRef = doc(db, "users", user.uid);
      const coinsEarned = Math.floor(voucher.price / 10);
      const updateData: any = {
        walletBalance: increment(-voucher.price),
      };
      if (coinsEarned > 0) {
        updateData.vittaCoins = increment(coinsEarned);
      }
      await updateDoc(userRef, updateData);

      // 2. Create transaction including cashback transaction log if earned
      const transactionRef = doc(collection(db, "transactions"));
      await setDoc(transactionRef, {
        userId: user.uid,
        type: "debit",
        amount: voucher.price,
        description: `Compra de Voucher: ${voucher.title}`,
        vittaCoinsEarned: coinsEarned,
        date: new Date().toISOString(),
        status: "completed",
      });

      if (coinsEarned > 0) {
        // Also log coin earning
        const coinTxRef = doc(collection(db, "transactions"));
        await setDoc(coinTxRef, {
          userId: user.uid,
          type: "coin_credit",
          amount: coinsEarned,
          description: `Cashback Vitta Coins: Compra de Voucher ${voucher.title}`,
          date: new Date().toISOString(),
          status: "completed",
        });
      }

      // 3. Add voucher to user's benefits
      const userVoucherRef = doc(collection(db, "user_vouchers"));
      await setDoc(userVoucherRef, {
        userId: user.uid,
        voucherId: voucher.id,
        title: voucher.title,
        partner: voucher.partner,
        purchaseDate: new Date().toISOString(),
        status: "active",
      });

      addToast("Voucher comprado com sucesso!", "success");
      onClose();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "transactions");
      addToast("Erro ao processar a compra.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-vitta-surface w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-vitta-border flex justify-between items-center bg-vitta-surface-2 shrink-0">
          <h2 className="text-xl font-bold text-vitta-text-primary">
            Confirmar Compra
          </h2>
          <button
            onClick={onClose}
            className="text-vitta-text-secondary hover:text-vitta-text-primary transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-4 p-4 bg-vitta-surface-2 rounded-xl border border-vitta-border">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${voucher.color}-100 text-${voucher.color}-600`}
            >
              <voucher.icon size={24} />
            </div>
            <div>
              <p className="font-bold text-vitta-text-primary">
                {voucher.title}
              </p>
              <p className="text-sm text-vitta-text-secondary">
                {voucher.partner}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-vitta-text-secondary">Saldo Atual</span>
              <span className="font-medium text-vitta-text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(balance)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-vitta-text-secondary">
                Valor do Voucher
              </span>
              <span className="font-medium text-rose-600">
                -{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(voucher.price)}
              </span>
            </div>
            <div className="pt-3 border-t border-vitta-border flex justify-between">
              <span className="font-bold text-vitta-text-primary">
                Saldo Restante
              </span>
              <span
                className={`font-bold ${remainingBalance < 0 ? "text-rose-600" : "text-emerald-600"}`}
              >
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(remainingBalance)}
              </span>
            </div>
          </div>

          {!hasEnoughBalance && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex gap-3">
              <AlertCircle
                size={20}
                className="text-rose-500 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm text-rose-700">
                Saldo insuficiente. Por favor, adicione fundos à sua carteira
                para continuar.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-vitta-border text-vitta-text-primary rounded-xl font-bold hover:bg-vitta-surface-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePurchase}
              disabled={isProcessing || !hasEnoughBalance}
              className="flex-1 py-3 bg-vitta-accent text-white rounded-xl font-bold hover:bg-vitta-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart size={20} />
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

const VoucherView = ({
  user,
  setActiveTab,
}: {
  user: any;
  setActiveTab: (tab: string) => void;
}) => {
  const [balance, setBalance] = useState(0);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [subTab, setSubTab] = useState<"store" | "my-vouchers">("store");
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const { addToast } = useToast();

  const VOUCHERS = [
    {
      id: "1",
      title: "Desconto 20% em Exames",
      partner: "Laboratório ViTTA",
      description: "Válido para todos os exames de sangue e imagem.",
      price: 50,
      icon: FileText,
      color: "blue",
    },
    {
      id: "2",
      title: "Consulta Nutricional",
      partner: "Clínica Bem Estar",
      description: "Uma consulta completa com avaliação de bioimpedância.",
      price: 120,
      icon: Activity,
      color: "emerald",
    },
    {
      id: "3",
      title: "Sessão de Fisioterapia",
      partner: "FisioCenter",
      description: "Sessão de 1 hora para reabilitação ou prevenção.",
      price: 80,
      icon: Activity,
      color: "purple",
    },
    {
      id: "4",
      title: "Check-up Cardiológico",
      partner: "Cardio Vida",
      description: "Eletrocardiograma + Consulta com especialista.",
      price: 150,
      icon: Heart,
      color: "rose",
    },
    {
      id: "5",
      title: "Desconto em Medicamentos",
      partner: "Farmácia Saúde",
      description: "R$ 30 de desconto em compras acima de R$ 100.",
      price: 15,
      icon: Pill,
      color: "amber",
    },
    {
      id: "6",
      title: "Avaliação Odontológica",
      partner: "Odonto Sorriso",
      description: "Avaliação completa e limpeza básica.",
      price: 90,
      icon: User,
      color: "indigo",
    },
  ];

  useEffect(() => {
    if (!user) return;

    const unsubscribeWallet = onSnapshot(
      doc(db, "users", user.uid),
      (docSnap) => {
        if (docSnap.exists()) {
          setBalance(docSnap.data().walletBalance || 0);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      },
    );

    return () => unsubscribeWallet();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingVouchers(true);
    const q = query(
      collection(db, "user_vouchers"),
      where("userId", "==", user.uid),
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setMyVouchers(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        setLoadingVouchers(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "user_vouchers");
        setLoadingVouchers(false);
      },
    );
    return () => unsubscribe();
  }, [user]);

  const handleRedeem = async (userVoucherId: string) => {
    try {
      await updateDoc(doc(db, "user_vouchers", userVoucherId), {
        status: "redeemed",
        redeemedAt: new Date().toISOString(),
      });
      addToast(
        "Benefício resgatado com sucesso! Siga as instruções do parceiro.",
        "success",
      );
    } catch (error) {
      handleFirestoreError(
        error,
        OperationType.UPDATE,
        `user_vouchers/${userVoucherId}`,
      );
      addToast("Erro ao resgatar benefício.", "error");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-vitta-text-primary">
            Vouchers
          </h1>
          <p className="text-vitta-text-secondary">
            Compre benefícios exclusivos com seu saldo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-vitta-surface px-4 py-2 rounded-xl border border-vitta-border shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 bg-vitta-accent-bg rounded-lg flex items-center justify-center text-vitta-accent">
              <Wallet size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                Saldo Disponível
              </p>
              <p className="text-sm font-bold text-vitta-text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(balance)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("wallets")}
            className="px-4 py-2 bg-vitta-surface border border-vitta-border text-vitta-text-primary rounded-xl text-sm font-bold hover:bg-vitta-surface-2 transition-colors"
          >
            Adicionar Saldo
          </button>
        </div>
      </header>

      <div className="flex gap-4 border-b border-vitta-border">
        <button
          onClick={() => setSubTab("store")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "store"
              ? "border-vitta-accent text-vitta-accent"
              : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"
          }`}
        >
          <Store size={18} />
          Catálogo Vouchers
        </button>
        <button
          onClick={() => setSubTab("my-vouchers")}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all text-sm font-bold whitespace-nowrap ${
            subTab === "my-vouchers"
              ? "border-vitta-accent text-vitta-accent"
              : "border-transparent text-vitta-text-secondary hover:text-vitta-text-primary"
          }`}
        >
          <Ticket size={18} />
          Meus Vouchers
          {myVouchers.filter((v) => v.status === "active").length > 0 && (
            <span className="bg-vitta-accent text-white px-2 py-0.5 rounded-full text-[10px]">
              {myVouchers.filter((v) => v.status === "active").length}
            </span>
          )}
        </button>
      </div>

      {subTab === "store" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {VOUCHERS.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-vitta-surface rounded-2xl border border-vitta-border shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="p-6 flex-1">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${voucher.color}-100 text-${voucher.color}-600`}
                >
                  <voucher.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-vitta-text-primary mb-2">
                  {voucher.title}
                </h3>
                <p className="text-sm font-medium text-vitta-accent mb-4">
                  {voucher.partner}
                </p>
                <p className="text-sm text-vitta-text-secondary line-clamp-3">
                  {voucher.description}
                </p>
              </div>
              <div className="p-6 border-t border-vitta-border bg-vitta-surface-2 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                    Valor
                  </p>
                  <p className="text-lg font-bold text-vitta-text-primary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(voucher.price)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVoucher(voucher)}
                  className="px-6 py-2 bg-vitta-accent text-white rounded-xl text-sm font-bold hover:bg-vitta-accent/90 transition-colors flex items-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Comprar
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingVouchers ? (
            <div className="col-span-full py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-vitta-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : myVouchers.length === 0 ? (
            <div className="col-span-full py-20 text-center text-vitta-text-secondary flex flex-col items-center">
              <Ticket size={48} className="text-vitta-border mb-4" />
              <p className="font-bold text-lg mb-1 text-vitta-text-primary">
                Você ainda não possui vouchers
              </p>
              <p className="text-sm max-w-sm mb-6">
                Acesse o catálogo e utilize seu saldo para comprar benefícios
                exclusivos.
              </p>
              <button
                onClick={() => setSubTab("store")}
                className="bg-vitta-surface-2 text-vitta-text-primary px-6 py-2 rounded-xl font-bold border border-vitta-border"
              >
                Ver Catálogo
              </button>
            </div>
          ) : (
            myVouchers
              .sort(
                (a, b) =>
                  new Date(b.purchaseDate).getTime() -
                  new Date(a.purchaseDate).getTime(),
              )
              .map((voucher) => {
                const isReward = !!voucher.isRedeemedReward;
                return (
                  <div
                    key={voucher.id}
                    className={`bg-vitta-surface rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all duration-300 ${
                      isReward
                        ? "border-amber-400 bg-amber-50/10 shadow-md ring-2 ring-amber-400/20"
                        : "border-vitta-border"
                    }`}
                  >
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            isReward
                              ? "bg-amber-100 text-amber-600 font-bold"
                              : "bg-vitta-accent-bg text-vitta-accent"
                          }`}
                        >
                          <Ticket size={24} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {voucher.status === "active" ? (
                            <span className="bg-vitta-green-bg text-vitta-green px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                              <Check size={12} /> Válido
                            </span>
                          ) : (
                            <span className="bg-vitta-surface-3 text-vitta-text-muted px-3 py-1 rounded-full text-xs font-bold border border-vitta-border">
                              Resgatado
                            </span>
                          )}
                          {isReward && (
                            <span className="bg-amber-500/15 text-amber-600 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                              🪙 Recompensa Vitta Coins
                            </span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-vitta-text-primary mb-1">
                        {voucher.title}
                      </h3>
                      <p className="text-sm font-medium text-vitta-accent mb-2">
                        {voucher.partner}
                      </p>

                      {voucher.status === "active" && (
                        <div className="mt-4 p-3 bg-vitta-surface-2 rounded-xl border border-vitta-border/60 text-center space-y-2">
                          <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">
                            Código de Resgate
                          </p>
                          <p className="font-mono text-sm font-bold text-vitta-text-primary px-3 py-1.5 bg-vitta-surface border border-vitta-border rounded-lg select-all">
                            {voucher.code ||
                              `VITTA-${voucher.id.substring(0, 5).toUpperCase()}`}
                          </p>
                          <div className="flex justify-center pt-1">
                            <div className="w-20 h-20 bg-white p-1 rounded-lg border border-vitta-border flex items-center justify-center">
                              <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-white"></div>
                                <div className="bg-black rounded-sm"></div>

                                <div className="bg-white"></div>
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-white"></div>

                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-white"></div>
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-black rounded-sm"></div>

                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-black rounded-sm"></div>
                                <div className="bg-white"></div>
                                <div className="bg-black rounded-sm"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border-t border-vitta-border bg-vitta-surface-2">
                      <p className="text-xs text-vitta-text-secondary mb-3">
                        Adquirido em{" "}
                        {new Date(voucher.purchaseDate).toLocaleDateString()}
                      </p>
                      {voucher.status === "active" ? (
                        <button
                          onClick={() => handleRedeem(voucher.id)}
                          className="w-full py-2 bg-vitta-accent text-white rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-vitta-accent/90 shadow-md shadow-vitta-accent/10"
                        >
                          <ArrowUpRight size={16} /> Ativar / Usar Voucher
                        </button>
                      ) : (
                        <div className="text-center py-2 text-xs font-semibold text-vitta-text-secondary/70">
                          Utilizado em{" "}
                          {voucher.redeemedAt
                            ? new Date(voucher.redeemedAt).toLocaleDateString(
                                "pt-BR",
                              )
                            : new Date(voucher.purchaseDate).toLocaleDateString(
                                "pt-BR",
                              )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      <CheckoutModal
        isOpen={!!selectedVoucher}
        onClose={() => setSelectedVoucher(null)}
        user={user}
        voucher={selectedVoucher}
        balance={balance}
      />
    </div>
  );
};

const PharmaciesView = ({ isAdmin }: { isAdmin: boolean }) => {
  const { addToast } = useToast();
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPharmacy, setEditingPharmacy] = useState<any>(null);
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
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    onCallDate: "",
    isActive: true,
  });

  useEffect(() => {
    const q = query(collection(db, "pharmacies"), orderBy("onCallDate", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPharmacies(data);
        setIsLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "pharmacies");
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPharmacy) {
        await updateDoc(doc(db, "pharmacies", editingPharmacy.id), formData);
        await logAdminAction(
          "UPDATE_PHARMACY",
          `Editou a farmácia: ${formData.name}`,
        );
      } else {
        await addDoc(collection(db, "pharmacies"), {
          ...formData,
          createdAt: new Date().toISOString(),
        });
        await logAdminAction(
          "CREATE_PHARMACY",
          `Criou a farmácia: ${formData.name}`,
        );
      }
      setShowAddModal(false);
      setEditingPharmacy(null);
      setFormData({
        name: "",
        address: "",
        phone: "",
        onCallDate: "",
        isActive: true,
      });
      addToast(
        `Farmácia ${editingPharmacy ? "atualizada" : "criada"} com sucesso.`,
        "success",
      );
    } catch (error) {
      console.error("Erro ao salvar farmácia:", error);
      addToast("Erro ao salvar farmácia.", "error");
    }
  };

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Excluir Farmácia",
      message:
        "Tem certeza que deseja excluir esta farmácia? Esta ação não pode ser desfeita.",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "pharmacies", id));
          await logAdminAction(
            "DELETE_PHARMACY",
            `Excluiu a farmácia ID: ${id}`,
          );
          addToast("Farmácia excluída com sucesso.", "success");
        } catch (error) {
          console.error("Erro ao excluir farmácia:", error);
          addToast("Erro ao excluir farmácia.", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const toggleActive = async (pharmacy: any) => {
    try {
      await updateDoc(doc(db, "pharmacies", pharmacy.id), {
        isActive: !pharmacy.isActive,
      });
      await logAdminAction(
        "TOGGLE_PHARMACY_STATUS",
        `Alterou status da farmácia ${pharmacy.name} para ${!pharmacy.isActive ? "Ativo" : "Inativo"}`,
      );
      addToast(
        `Farmácia ${!pharmacy.isActive ? "ativada" : "desativada"} com sucesso.`,
        "success",
      );
    } catch (error) {
      console.error("Erro ao alterar status da farmácia:", error);
      addToast("Erro ao alterar status da farmácia.", "error");
    }
  };

  const today = new Date().toISOString().split("T")[0];

  // Logic for sorting and filtering
  const sortedPharmacies = [...pharmacies].sort((a, b) => {
    // If one is today, it comes first
    if (a.onCallDate === today) return -1;
    if (b.onCallDate === today) return 1;
    return a.onCallDate.localeCompare(b.onCallDate);
  });

  const displayPharmacies = isAdmin
    ? sortedPharmacies
    : sortedPharmacies.filter((p) => p.isActive && p.onCallDate >= today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">
            Farmácias de Plantão
          </h1>
          <p className="text-vitta-text-secondary">
            Confira as farmácias abertas hoje e nos próximos dias.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingPharmacy(null);
              setFormData({
                name: "",
                address: "",
                phone: "",
                onCallDate: "",
                isActive: true,
              });
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
                    ? "border-vitta-accent shadow-xl shadow-vitta-accent/10"
                    : "border-vitta-border"
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
                              ? "text-vitta-green bg-vitta-green-bg"
                              : "text-vitta-text-muted bg-vitta-surface-2"
                          }`}
                          title={pharmacy.isActive ? "Desativar" : "Ativar"}
                        >
                          {pharmacy.isActive ? (
                            <CheckCircle size={18} />
                          ) : (
                            <XCircle size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setEditingPharmacy(pharmacy);
                            setFormData({
                              name: pharmacy.name,
                              address: pharmacy.address,
                              phone: pharmacy.phone,
                              onCallDate: pharmacy.onCallDate,
                              isActive: pharmacy.isActive,
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
                    <h3 className="text-xl font-bold text-vitta-text-primary">
                      {pharmacy.name}
                    </h3>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <Calendar size={16} className="text-vitta-accent" />
                        <span className="text-sm">
                          {formatDateForDisplay(pharmacy.onCallDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <MapPin size={16} className="text-vitta-accent" />
                        <span className="text-sm line-clamp-1">
                          {pharmacy.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-vitta-text-secondary">
                        <Phone size={16} className="text-vitta-accent" />
                        <span className="text-sm">{pharmacy.phone}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      window.open(`tel:${pharmacy.phone.replace(/\D/g, "")}`)
                    }
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
            <h3 className="text-xl font-bold text-vitta-text-primary">
              Nenhuma Farmácia de Plantão
            </h3>
            <p className="text-vitta-text-secondary">
              Não há farmácias de plantão cadastradas para hoje ou para os
              próximos dias.
            </p>
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
              className="bg-vitta-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-vitta-border flex items-center justify-between bg-vitta-surface-2 shrink-0">
                <h3 className="text-xl font-bold text-vitta-text-primary">
                  {editingPharmacy ? "Editar Farmácia" : "Nova Farmácia"}
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-vitta-text-muted hover:text-vitta-text-primary"
                >
                  <X size={24} />
                </button>
              </div>
              <form
                onSubmit={handleSave}
                className="p-6 space-y-4 overflow-y-auto"
              >
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">
                    Nome da Farmácia
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="Ex: Farmácia São João"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">
                    Endereço
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="Rua, Número, Bairro"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">
                    Telefone
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-vitta-text-primary">
                    Data do Plantão
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.onCallDate}
                    onChange={(e) =>
                      setFormData({ ...formData, onCallDate: e.target.value })
                    }
                    className="w-full p-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm focus:ring-2 focus:ring-vitta-accent/20 outline-none text-vitta-text-primary"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent/20"
                  />
                  <label
                    htmlFor="isActive"
                    className="text-sm font-bold text-vitta-text-primary cursor-pointer"
                  >
                    Farmácia Ativa
                  </label>
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

const PlaceholderView = ({ title }: { title: string }) => (
  <div className="space-y-6">
    <h1 className="text-3xl font-bold text-vitta-text-primary">{title}</h1>
    <div className="bg-vitta-surface p-10 rounded-xl border border-vitta-border shadow-sm flex flex-col items-center justify-center text-center space-y-4">
      <div className="p-4 bg-vitta-surface-2 rounded-full text-vitta-text-muted">
        <LayoutGrid size={48} />
      </div>
      <div>
        <h3 className="text-xl font-bold text-vitta-text-primary">
          Página em Desenvolvimento
        </h3>
        <p className="text-vitta-text-secondary">
          Estamos trabalhando para trazer o melhor conteúdo de {title} para
          você.
        </p>
      </div>
    </div>
  </div>
);

const LoginView = ({
  pendingUser,
  userData,
  onVerify2FA,
  onCancel2FA,
}: {
  pendingUser?: FirebaseUser | null;
  userData?: any;
  onVerify2FA?: () => void;
  onCancel2FA?: () => void;
} = {}) => {
  const { addToast } = useToast();
  const [view, setView] = useState<"login" | "signup" | "2fa">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devNote, setDevNote] = useState<string | null>(null);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    // 2FA desativado temporariamente
    /*
    if (pendingUser && userData?.twoFactorEnabled) {
      setView('2fa');
      sendVerificationCode();
    }
    */
  }, [pendingUser, userData]);

  const sendVerificationCode = async () => {
    if (!pendingUser) return;
    setIsLoading(true);
    setError(null);
    setDevNote(null);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pendingUser.uid,
          email: pendingUser.email,
          phoneNumber: userData?.phone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Falha ao enviar código");
      if (data.devNote) setDevNote(data.devNote);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro ao enviar código de verificação.");
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
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pendingUser.uid, code: twoFactorCode }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        addToast("Verificação concluída com sucesso.", "success");
        if (onVerify2FA) onVerify2FA();
      } else {
        setError(data.error || "Código inválido ou expirado.");
        addToast("Código inválido ou expirado.", "error");
      }
    } catch (err: any) {
      console.error(err);
      setError("Erro na verificação. Tente novamente.");
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
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || "Usuário",
          email: user.email,
          role: "user",
          status: "Ativo",
          plan: "Free",
          createdAt: Timestamp.now(),
        });
      }
      addToast("Login realizado com sucesso!", "success");
    } catch (err: any) {
      console.error(err);
      setError("Falha ao entrar com Google. Tente novamente.");
      addToast("Falha ao entrar com Google.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      if (view === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        addToast("Bem-vindo de volta!", "success");
      } else {
        const result = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const user = result.user;

        // Update profile with name
        await updateProfile(user, { displayName: name });

        // Create user in Firestore
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: name || "Usuário",
          email: user.email,
          role: "user",
          status: "Ativo",
          plan: "Free",
          createdAt: Timestamp.now(),
        });
        addToast("Conta criada com sucesso! Bem-vindo.", "success");
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("Este e-mail já está em uso.");
      } else if (err.code === "auth/invalid-email") {
        setError("E-mail inválido.");
      } else if (err.code === "auth/weak-password") {
        setError("A senha deve ter pelo menos 6 caracteres.");
      } else if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/invalid-credential"
      ) {
        setError("E-mail ou senha incorretos.");
      } else {
        setError("Ocorreu um erro. Tente novamente.");
      }
      addToast("Falha na autenticação.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-vitta-bg p-6">
      <div className="w-full max-w-md space-y-8">
        {new URLSearchParams(window.location.search).get("room") && (
          <div className="mb-4 p-5 bg-vitta-accent/10 border border-vitta-accent/20 rounded-2xl flex items-start gap-3.5 text-left shadow-lg shadow-vitta-accent/[0.03]">
            <Video className="text-vitta-accent shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-xs font-bold text-vitta-accent uppercase tracking-wider mb-1">
                Acesso Seguro à Telemedicina
              </h4>
              <p className="text-xs text-vitta-text-secondary leading-relaxed">
                Para acessar esta transmissão médica segura, por favor realize o login ou cadastro com as credenciais vinculadas a sua consulta na Vitta.
              </p>
            </div>
          </div>
        )}

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-vitta-accent rounded-xl shadow-xl shadow-vitta-accent/20 mb-4">
            <Heart className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-vitta-text-primary">
            {view === "login"
              ? "Bem-vindo ao ViTTA"
              : view === "signup"
                ? "Crie sua conta"
                : "Verificação em Duas Etapas"}
          </h1>
          <p className="text-vitta-text-secondary">
            {view === "login"
              ? "Entre na sua conta para continuar"
              : view === "signup"
                ? "Junte-se a nós e cuide da sua saúde"
                : "Digite o código de 6 dígitos enviado para você"}
          </p>
        </div>

        <div className="bg-vitta-surface p-8 rounded-xl border border-vitta-border shadow-xl shadow-vitta-accent/5">
          {error && (
            <div className="mb-6 p-4 bg-vitta-danger/10 text-vitta-danger text-sm rounded-xl border border-vitta-danger/20 font-medium">
              {error}
            </div>
          )}

          {view === "2fa" ? (
            <div className="space-y-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-vitta-accent/10 text-vitta-accent rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck size={32} />
                </div>
                <p className="text-vitta-text-secondary text-sm text-center">
                  Enviamos um código para o e-mail: <br />
                  <span className="font-bold text-vitta-text-primary">
                    {pendingUser?.email}
                  </span>
                </p>
              </div>

              {devNote && (
                <div className="bg-vitta-accent/5 border border-vitta-accent/20 p-4 rounded-xl flex items-start gap-3">
                  <Info className="text-vitta-accent shrink-0" size={18} />
                  <p className="text-xs text-vitta-text-secondary leading-relaxed">
                    <span className="font-bold text-vitta-accent">
                      Nota de Desenvolvimento:
                    </span>
                    <br />
                    {devNote} <br />
                    <span className="font-medium">
                      O código atual foi registrado nos logs do console do
                      servidor AI Studio.
                    </span>
                  </p>
                </div>
              )}

              <div className="flex justify-between gap-2">
                {[...Array(6)].map((_, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    maxLength={1}
                    value={twoFactorCode[i] || ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val) {
                        const newCode = twoFactorCode.split("");
                        newCode[i] = val;
                        setTwoFactorCode(newCode.join("").slice(0, 6));
                        if (i < 5) inputRefs[i + 1].current?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !twoFactorCode[i] && i > 0) {
                        const newCode = twoFactorCode.split("");
                        newCode[i - 1] = "";
                        setTwoFactorCode(newCode.join(""));
                        inputRefs[i - 1].current?.focus();
                      }
                    }}
                    className="w-12 h-14 text-center text-xl font-bold bg-vitta-surface-2 border border-vitta-border rounded-xl focus:ring-2 focus:ring-vitta-accent/20 outline-none transition-all text-vitta-text-primary"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVerify2FA}
                  disabled={isLoading || twoFactorCode.length !== 6}
                  className="w-full py-4 bg-vitta-accent text-white rounded-xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all transform active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Verificar Código"
                  )}
                </button>
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={isLoading}
                  className="text-vitta-accent text-xs font-bold hover:underline py-2 disabled:opacity-50"
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
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {view === "signup" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                      size={18}
                    />
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
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  E-mail
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                    size={18}
                  />
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
                <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                    size={18}
                  />
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

              {view === "login" && (
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-vitta-border text-vitta-accent focus:ring-vitta-accent/20"
                    />
                    <span className="text-xs text-vitta-text-secondary group-hover:text-vitta-text-primary transition-colors">
                      Lembrar de mim
                    </span>
                  </label>
                  <button
                    type="button"
                    className="text-xs font-bold text-vitta-accent hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
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
                    {view === "login" ? "Entrar" : "Criar Conta"}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-vitta-border"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
                  <span className="bg-vitta-surface px-4 text-vitta-text-muted">
                    ou
                  </span>
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

          {view !== "2fa" && (
            <div className="mt-8 pt-8 border-t border-vitta-border text-center">
              <p className="text-sm text-vitta-text-secondary">
                {view === "login" ? (
                  <>
                    Não tem uma conta?{" "}
                    <button
                      onClick={() => setView("signup")}
                      className="text-vitta-accent font-bold hover:underline"
                    >
                      Cadastre-se
                    </button>
                  </>
                ) : (
                  <>
                    Já tem uma conta?{" "}
                    <button
                      onClick={() => setView("login")}
                      className="text-vitta-accent font-bold hover:underline"
                    >
                      Entre aqui
                    </button>
                  </>
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
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("home");
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  const [isHelpCenterOpen, setIsHelpCenterOpen] = useState(false);
  const [reviewingAppointment, setReviewingAppointment] = useState<any>(null);
  const [activeTelemedicineApt, setActiveTelemedicineApt] = useState<
    any | null
  >(null);

  // Radio Global State
  const [radioConfig, setRadioConfig] = useState({
    url: "https://icecast.portalviva.com.br/viva_fm_vitoria",
    currentShow: "Música ViTTA",
    upNextMessage: "A seguir: Dicas de Saúde",
  });
  const [isRadioPlaying, setIsRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.5);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const unsubscribe = onSnapshot(
      doc(db, "config", "radio"),
      (snapshot) => {
        if (snapshot.exists()) {
          setRadioConfig(snapshot.data() as any);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "config/radio");
      },
    );
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
        audioRef.current.play().catch((err) => {
          console.error("Erro ao tocar rádio:", err);
          setIsRadioPlaying(false);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRadioPlaying, radioConfig.url, setIsRadioPlaying]);

  useEffect(() => {
    const processOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(
        localStorage.getItem("vitta_offline_sync_queue") || "[]",
      );
      if (queue.length === 0) return;

      addToast(
        "Conexão detectada! Sincronizando dados gravados offline...",
        "info",
      );

      try {
        for (const item of queue) {
          const payload = { ...item.payload };
          payload.createdAt = Timestamp.now();
          if (item.type === "CREATE_METRIC") {
            await addDoc(collection(db, "health_metrics"), payload);
          } else if (item.type === "CREATE_GOAL") {
            await addDoc(collection(db, "health_goals"), payload);
          } else if (item.type === "CREATE_MED") {
            await addDoc(collection(db, "medications"), payload);
          }
        }

        localStorage.removeItem("vitta_offline_sync_queue");
        addToast(
          "Todas as atualizações locais foram sincronizadas com sucesso com a nuvem!",
          "success",
        );
      } catch (error) {
        console.error("Erro ao sincronizar fila offline:", error);
        addToast(
          "Erro ao sincronizar algumas métricas offline. Tentando na próxima reconexão.",
          "error",
        );
      }
    };

    window.addEventListener("online", processOfflineQueue);
    processOfflineQueue();
    return () => window.removeEventListener("online", processOfflineQueue);
  }, [addToast]);

  useEffect(() => {
    const seedPartners = async () => {
      console.log("DEBUG: Iniciando seedPartners...");

      const categoriesData = [
        {
          name: "Saúde",
          icon: "Heart",
          color: "bg-vitta-danger",
          description: "Encontre profissionais de saúde",
        },
        {
          name: "Farmácias",
          icon: "Store",
          color: "bg-vitta-green",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Óticas",
          icon: "Glasses",
          color: "bg-vitta-accent",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Supermercados",
          icon: "ShoppingCart",
          color: "bg-violet-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Moda Masculina",
          icon: "Shirt",
          color: "bg-indigo-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Moda Feminina",
          icon: "Shirt",
          color: "bg-pink-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Moda Infantil",
          icon: "Baby",
          color: "bg-vitta-amber",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Calçados",
          icon: "Footprints",
          color: "bg-orange-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Suplementos",
          icon: "Heart",
          color: "bg-vitta-danger",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Estética",
          icon: "Heart",
          color: "bg-fuchsia-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Eletrodomésticos",
          icon: "Zap",
          color: "bg-cyan-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Móveis",
          icon: "Armchair",
          color: "bg-yellow-600",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Salão de Beleza",
          icon: "Scissors",
          color: "bg-purple-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Material de Construção",
          icon: "Hammer",
          color: "bg-vitta-text-muted",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Padaria",
          icon: "Coffee",
          color: "bg-orange-400",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Lanchonete",
          icon: "Coffee",
          color: "bg-orange-500",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Restaurante",
          icon: "Coffee",
          color: "bg-vitta-danger",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Pizzaria",
          icon: "Pizza",
          color: "bg-orange-600",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Sorveteria",
          icon: "IceCream",
          color: "bg-sky-400",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Posto de Combustíveis",
          icon: "Fuel",
          color: "bg-vitta-text-muted",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Pet Shop",
          icon: "PawPrint",
          color: "bg-vitta-green",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Contador",
          icon: "Calculator",
          color: "bg-vitta-accent",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Cabeleireiro",
          icon: "Scissors",
          color: "bg-pink-400",
          description: "Descontos exclusivos para afiliados",
        },
        {
          name: "Pintor",
          icon: "Wrench",
          color: "bg-cyan-400",
          description: "Descontos exclusivos para afiliados",
        },
      ];

      const oticas = [
        {
          name: "A C R Viana em Centro",
          address:
            "Rua Convívio Sebastião Moraes, 0 lj 36, Centro - Castelo - ES",
          phone: "(28) 3542-2812",
        },
        {
          name: "Ótica Visual em Centro",
          address: "Praça 3 Irmãos, 208, Centro - Castelo - ES",
          phone: "(28) 3542-3269",
        },
        {
          name: "Oticas 3d em Centro",
          address:
            "Rua Bernadino Monteiro, 15 loja 02-03-04, Centro - Castelo - ES",
          phone: "(28) 3542-5068",
        },
        {
          name: "Óticas Capixaba em Centro",
          address: "Rua Aristeu Borges Aguiar, 10, Centro - Castelo - ES",
          phone: "(28) 3542-1375",
        },
      ];

      try {
        console.log("DEBUG: Cadastrando categorias...");
        for (const cat of categoriesData) {
          const slug = cat.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-");
          await setDoc(
            doc(db, "categories", slug),
            {
              ...cat,
              slug,
              type: "partner",
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }

        for (const otica of oticas) {
          const slug = otica.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-");
          console.log(
            `DEBUG: Cadastrando ótica: ${otica.name} (slug: ${slug})`,
          );
          await setDoc(
            doc(db, "partners", slug),
            {
              ...otica,
              category: "Óticas",
              discount: "10% OFF",
              rating: 5.0,
              reviews: 0,
              imageUrl: `https://picsum.photos/seed/${slug}/400/300`,
              createdAt: new Date().toISOString(),
            },
            { merge: true },
          );
        }

        console.log("DEBUG: Óticas e categorias cadastradas com sucesso!");
      } catch (err) {
        console.error("DEBUG: Erro ao cadastrar óticas:", err);
      }
    };

    if (isAuthReady && user) {
      console.log(
        "DEBUG: App pronto e usuário logado, chamando seedPartners...",
      );
      seedPartners();

      // Seed health metrics history if empty
      const seedMetrics = async () => {
        try {
          const q = query(
            collection(db, "health_metrics"),
            where("userId", "==", user.uid),
            limit(1),
          );
          const snapshot = await getDocs(q);
          if (snapshot.empty) {
            console.log("DEBUG: Semeando histórico de métricas...");
            const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
            const promises = days.map((day, idx) => {
              return addDoc(collection(db, "health_metrics"), {
                userId: user.uid,
                date: day,
                steps: Math.floor(Math.random() * 5000) + 2000,
                createdAt: Timestamp.now(),
              });
            });
            await Promise.all(promises);
          }
        } catch (err) {
          console.error("DEBUG: Erro ao semear métricas:", err);
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
        unsubscribeUserData = onSnapshot(
          doc(db, "users", firebaseUser.uid),
          async (snapshot) => {
            if (snapshot.exists()) {
              const data = snapshot.data();
              setUserData(data);

              // Check if user's email belongs to a registered professional
              if (data.email) {
                try {
                  const qProf = query(
                    collection(db, "professionals"),
                    where("email", "==", data.email),
                  );
                  const profSnap = await getDocs(qProf);
                  if (!profSnap.empty) {
                    const profDoc = profSnap.docs[0];
                    // If role is not professional or userId is not matched, link them in background
                    if (data.role !== "professional") {
                      await updateDoc(doc(db, "users", firebaseUser.uid), {
                        role: "professional",
                      });
                    }
                    if (profDoc.data().userId !== firebaseUser.uid) {
                      await updateDoc(doc(db, "professionals", profDoc.id), {
                        userId: firebaseUser.uid,
                      });
                    }
                  }
                } catch (err) {
                  console.error(
                    "Erro ao verificar vinculo de profissional:",
                    err,
                  );
                }
              }
            } else {
              // Create if missing
              const newData = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || "Usuário",
                email: firebaseUser.email,
                role: "user",
                status: "Ativo",
                plan: "Free",
                createdAt: Timestamp.now(),
              };

              // Also check on initial creation if this user is a professional by email
              if (firebaseUser.email) {
                try {
                  const qProf = query(
                    collection(db, "professionals"),
                    where("email", "==", firebaseUser.email),
                  );
                  const profSnap = await getDocs(qProf);
                  if (!profSnap.empty) {
                    newData.role = "professional";
                    const profDoc = profSnap.docs[0];
                    setTimeout(async () => {
                      try {
                        await updateDoc(doc(db, "professionals", profDoc.id), {
                          userId: firebaseUser.uid,
                        });
                      } catch (e) {
                        console.error(
                          "Erro ao vincular id do profissional na criacao:",
                          e,
                        );
                      }
                    }, 1000);
                  }
                } catch (err) {
                  console.error(err);
                }
              }
              await setDoc(doc(db, "users", firebaseUser.uid), newData);
              setUserData(newData);
            }
            setIsAuthReady(true);
          },
          (error) => {
            handleFirestoreError(
              error,
              OperationType.GET,
              `users/${firebaseUser.uid}`,
            );
            setIsAuthReady(true);
          },
        );
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

  useEffect(() => {
    if (!isAuthReady || !user || !userData) return;

    const checkRoomDeepLink = async () => {
      const roomParam = new URLSearchParams(window.location.search).get("room");
      if (!roomParam) return;

      try {
        const aptDoc = await getDoc(doc(db, "appointments", roomParam));
        if (aptDoc.exists()) {
          const aptData = { id: aptDoc.id, ...aptDoc.data() } as any;

          // 1. Check completed/cancelled status
          if (aptData.status === "completed" || aptData.status === "cancelled") {
            addToast("Esta consulta de telemedicina já foi encerrada ou expirou.", "error");
          } else {
            // 2. Clearances or security check
            const isPatient = aptData.userId === user.uid || (aptData.patientEmail && aptData.patientEmail === user.email);
            const isProfessional = aptData.professionalUserId === user.uid || (userData.role === "professional" && userData.id === aptData.professionalId) || (aptData.professionalEmail && aptData.professionalEmail === user.email);

            if (isPatient || isProfessional) {
              setActiveTelemedicineApt(aptData);
              addToast("Bem-vindo(a) à sala de telemedicina segura!", "success");
            } else {
              addToast("Acesso negado: você não tem permissão para acessar esta consulta médica confidencial.", "error");
            }
          }
        } else {
          addToast("Erro: Sala de telemedicina não localizada ou inválida.", "error");
        }
      } catch (error) {
        console.error("Error processing deep link room:", error);
        addToast("Erro ao processar convite de telemedicina.", "error");
      } finally {
        // Clean up URL parameter to maintain elegant state and routing
        const url = new URL(window.location.href);
        url.searchParams.delete("room");
        window.history.replaceState({}, document.title, url.pathname + url.search);
      }
    };

    checkRoomDeepLink();
  }, [isAuthReady, user, userData]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIs2FAVerified(false);
      setGoogleToken(null);
    } catch (err) {
      console.error("Erro ao sair:", err);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-vitta-bg">
        <div className="w-12 h-12 border-4 border-vitta-accent/20 border-t-vitta-accent rounded-full animate-spin" />
      </div>
    );
  }

  const needs2FA = false; // Desativado temporariamente a pedido do usuário

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

  const isAdmin =
    userData?.role === "admin" || user?.email === "jhecksanto@gmail.com";
  const isProfessional = userData?.role === "professional";

  const renderContent = () => {
    if (activeTelemedicineApt) {
      return (
        <TelemedicineRoom
          user={user}
          userData={userData}
          appointment={activeTelemedicineApt}
          onLeave={() => setActiveTelemedicineApt(null)}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <HomeView
            user={user}
            userData={userData}
            setActiveTab={setActiveTab}
          />
        );
      case "dashboard":
        if (isAdmin) return <AdminView user={user} />;
        if (isProfessional)
          return (
            <ProfessionalDashboardView
              user={user}
              setActiveTelemedicineApt={setActiveTelemedicineApt}
            />
          );
        return (
          <PatientDashboardView
            user={user}
            userData={userData}
            setActiveTab={setActiveTab}
          />
        );
      case "professionals":
        return <ProfessionalsView user={user} userData={userData} googleToken={googleToken} />;
      case "appointments":
        return (
          <AppointmentsView
            user={user}
            setActiveTab={setActiveTab}
            setReviewingAppointment={setReviewingAppointment}
            setActiveTelemedicineApt={setActiveTelemedicineApt}
            googleToken={googleToken}
          />
        );
      case "plans":
        return isAdmin ? (
          <PartnershipsView setActiveTab={setActiveTab} />
        ) : (
          <PartnersView setActiveTab={setActiveTab} user={user} />
        );
      case "wallets":
        return <WalletsView user={user} />;
      case "voucher":
        return <VoucherView user={user} setActiveTab={setActiveTab} />;
      case "pharmacies":
        return <PharmaciesView isAdmin={isAdmin} />;
      case "radio":
        return (
          <RadioView
            isPlaying={isRadioPlaying}
            setIsPlaying={setIsRadioPlaying}
            volume={radioVolume}
            setVolume={setRadioVolume}
            config={radioConfig}
            isAdmin={isAdmin}
          />
        );
      case "chat":
        return <ChatView user={user} />;
      case "profile":
        return (
          <SettingsView
            isDarkMode={isDarkMode}
            setIsDarkMode={setIsDarkMode}
            user={user}
            userData={userData}
            googleToken={googleToken}
            setGoogleToken={setGoogleToken}
          />
        );
      case "support":
        return <SupportView setActiveTab={setActiveTab} />;
      case "exams":
        return <ExamsView user={user} />;
      case "offers":
        return <OffersView user={user} />;
      default:
        return isAdmin ? (
          <AdminView user={user} />
        ) : (
          <PlaceholderView title="Dashboard Paciente" />
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? "dark bg-vitta-bg text-vitta-text-primary" : "bg-vitta-bg text-vitta-text-primary"}`}
    >
      <OfflineIndicatorBanner />
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-vitta-sidebar border-r border-vitta-border transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-vitta-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-vitta-accent rounded-2xl flex items-center justify-center shadow-lg shadow-vitta-accent/30">
                <Heart className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-vitta-text-primary">
                  ViTTA
                </h2>
                <p className="text-xs font-medium text-vitta-text-muted">
                  {isAdmin
                    ? "Admin"
                    : userData?.role === "professional"
                      ? "Profissional"
                      : "Paciente"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
            <div>
              <p className="px-4 text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest mb-4">
                Navegação
              </p>
              <nav className="space-y-1">
                <SidebarItem
                  icon={Home}
                  label="Página Inicial"
                  active={activeTab === "home"}
                  onClick={() => {
                    setActiveTab("home");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={LayoutGrid}
                  label={
                    isAdmin
                      ? "Painel Admin"
                      : userData?.role === "professional"
                        ? "Painel Médico"
                        : "Dashboard"
                  }
                  active={activeTab === "dashboard"}
                  onClick={() => {
                    setActiveTab("dashboard");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Users}
                  label="Profissionais"
                  active={activeTab === "professionals"}
                  onClick={() => {
                    setActiveTab("professionals");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Clock}
                  label="Agendamentos"
                  active={activeTab === "appointments"}
                  onClick={() => {
                    setActiveTab("appointments");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={ShieldCheck}
                  label="Convênios"
                  active={activeTab === "plans"}
                  onClick={() => {
                    setActiveTab("plans");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Wallet}
                  label="Carteiras"
                  active={activeTab === "wallets"}
                  onClick={() => {
                    setActiveTab("wallets");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={CreditCard}
                  label="Compra Voucher"
                  active={activeTab === "voucher"}
                  onClick={() => {
                    setActiveTab("voucher");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Stethoscope}
                  label="Farmácias de Plantão"
                  active={activeTab === "pharmacies"}
                  onClick={() => {
                    setActiveTab("pharmacies");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Radio}
                  label="Rádio ViTTA"
                  active={activeTab === "radio"}
                  onClick={() => {
                    setActiveTab("radio");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={Tag}
                  label="Ofertas e Descontos"
                  active={activeTab === "offers"}
                  onClick={() => {
                    setActiveTab("offers");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={MessageSquare}
                  label="Chat Suporte"
                  active={activeTab === "chat"}
                  onClick={() => {
                    setActiveTab("chat");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={User}
                  label="Perfil"
                  active={activeTab === "profile"}
                  onClick={() => {
                    setActiveTab("profile");
                    setIsSidebarOpen(false);
                  }}
                />
                <SidebarItem
                  icon={HelpCircle}
                  label="Suporte"
                  active={activeTab === "support"}
                  onClick={() => {
                    setActiveTab("support");
                    setIsSidebarOpen(false);
                  }}
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
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.displayName?.charAt(0) || "U"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-vitta-text-primary truncate">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-[10px] text-vitta-text-secondary truncate">
                  {user.email}
                </p>
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
              className="p-2 hover:bg-vitta-surface-2 rounded-lg text-vitta-text-primary transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="relative hidden md:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-vitta-text-muted"
                size={18}
              />
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsHelpCenterOpen(true)}
                className="p-2.5 bg-vitta-surface-2 text-vitta-text-secondary border border-vitta-border rounded-lg hover:bg-vitta-border hover:text-vitta-accent transition-all"
                title="Central de Ajuda"
              >
                <HelpCircle size={20} />
              </button>

              {user && <NotificationCenter userId={user.uid} />}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-vitta-border">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-vitta-text-primary">
                  {user.displayName || "Usuário"}
                </p>
                <p className="text-xs text-vitta-text-secondary">
                  {userData?.plan || "Membro Free"}
                </p>
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
        src={
          radioConfig.url
            ? radioConfig.url.includes(":") && !radioConfig.url.includes(";")
              ? radioConfig.url.endsWith("/")
                ? `${radioConfig.url};`
                : `${radioConfig.url}/;`
              : radioConfig.url
            : undefined
        }
        onError={(e) => {
          const target = e.target as HTMLAudioElement;
          if (target.error) {
            console.error(
              "Erro no elemento de áudio:",
              target.error.code,
              target.error.message,
            );
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

      <ReviewModal
        isOpen={!!reviewingAppointment}
        onClose={() => setReviewingAppointment(null)}
        userId={user?.uid || ""}
        userName={user?.displayName || "Usuário"}
        professionalId={reviewingAppointment?.professionalId || ""}
        professionalName={reviewingAppointment?.professionalName || ""}
        appointmentId={reviewingAppointment?.id || ""}
      />

      <HelpCenter
        isOpen={isHelpCenterOpen}
        onClose={() => setIsHelpCenterOpen(false)}
        userEmail={user?.email || null}
      />
    </div>
  );
}
