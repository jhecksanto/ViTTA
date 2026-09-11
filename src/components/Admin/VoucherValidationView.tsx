import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  Tag, 
  Calendar,
  Lock,
  Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  runTransaction, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useToast } from '../../contexts/ToastContext';

interface VoucherValidationViewProps {
  adminUser?: any;
}

export const VoucherValidationView: React.FC<VoucherValidationViewProps> = ({ adminUser }) => {
  const { addToast } = useToast();

  // Mode: "camera" | "manual"
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    status: 'success' | 'already_used' | 'not_found' | 'expired';
    message: string;
    voucher?: any;
  } | null>(null);

  // Camera state
  const [cameraPermission, setCameraPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play audio chime on successful redemption
  const playRedeemSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, audioCtx.currentTime + 0.35); // D6

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio feedback not available:', e);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraPermission('granted');
      setMode('camera');
    } catch (err: any) {
      console.warn('Erro ao acessar a câmera:', err);
      setCameraPermission('denied');
      setCameraError('Permissão para acessar a câmera negada ou câmera indisponível no dispositivo. Utilize a validação manual por código.');
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Atomic validation with runTransaction to prevent double redemption (Issue 06)
  const validateVoucherCode = async (codeToValidate: string) => {
    const cleanCode = codeToValidate.trim().toUpperCase();
    if (!cleanCode) {
      addToast('Informe o código do voucher para validar.', 'error');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      // 1. Search in vouchers and vouchers_catalog collections
      let targetVoucherDoc: any = null;
      let targetCollectionName = 'vouchers';

      // Check vouchers collection
      const q1 = query(collection(db, 'vouchers'), where('code', '==', cleanCode));
      const snap1 = await getDocs(q1);
      if (!snap1.empty) {
        targetVoucherDoc = snap1.docs[0];
        targetCollectionName = 'vouchers';
      } else {
        // Check vouchers_catalog
        const q2 = query(collection(db, 'vouchers_catalog'), where('code', '==', cleanCode));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          targetVoucherDoc = snap2.docs[0];
          targetCollectionName = 'vouchers_catalog';
        }
      }

      if (!targetVoucherDoc) {
        setValidationResult({
          status: 'not_found',
          message: `O voucher com código "${cleanCode}" não foi localizado na base de dados.`
        });
        addToast('Voucher não encontrado no sistema.', 'error');
        setIsValidating(false);
        return;
      }

      const voucherRef = doc(db, targetCollectionName, targetVoucherDoc.id);

      // 2. Perform atomic transaction
      await runTransaction(db, async (transaction) => {
        const voucherSnap = await transaction.get(voucherRef);
        if (!voucherSnap.exists()) {
          throw new Error('Voucher inexistente.');
        }

        const data = voucherSnap.data();

        // Check if already used
        if (data.used === true || data.status === 'used' || data.redeemed === true) {
          const usedDate = data.redeemedAt || data.usedAt || 'Data não registrada';
          throw new Error(`ALREADY_USED:${usedDate}`);
        }

        // Check expiration if set
        if (data.expiresAt) {
          const exp = new Date(data.expiresAt).getTime();
          if (exp < Date.now()) {
            throw new Error('EXPIRED');
          }
        }

        // Atomic mark as redeemed
        transaction.update(voucherRef, {
          used: true,
          status: 'used',
          redeemed: true,
          redeemedAt: new Date().toISOString(),
          redeemedBy: adminUser?.email || adminUser?.uid || 'admin_validator',
          updatedAt: Timestamp.now()
        });

        // Set result
        setValidationResult({
          status: 'success',
          message: `Voucher validado com sucesso! Desconto de ${data.discount || 'benefício'} aplicado.`,
          voucher: { ...data, id: targetVoucherDoc.id }
        });
      });

      playRedeemSound();
      addToast('Voucher baixado e validado com sucesso!', 'success');
      setManualCode('');
    } catch (err: any) {
      if (err.message?.startsWith('ALREADY_USED:')) {
        const date = err.message.split(':')[1];
        setValidationResult({
          status: 'already_used',
          message: `Atenção: Este voucher já foi utilizado anteriormente em ${date}. Não é possível reutilizá-lo.`
        });
        addToast('Atenção: Voucher já utilizado anteriormente!', 'warning');
      } else if (err.message === 'EXPIRED') {
        setValidationResult({
          status: 'expired',
          message: 'Este voucher expirou e não possui mais validade.'
        });
        addToast('Este voucher está expirado.', 'error');
      } else {
        console.error('Erro ao validar voucher:', err);
        addToast('Erro ao validar voucher: ' + (err.message || 'Falha na transação'), 'error');
      }
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-vitta-accent/10 to-vitta-surface-2 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <QrCode size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-vitta-text-primary">
              Validador de Vouchers & Cupons de Desconto
            </h3>
            <p className="text-xs text-vitta-text-secondary mt-0.5">
              Leitura de QR Code ou inserção manual protegida por transação atômica contra uso duplicado.
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center bg-vitta-surface border border-vitta-border rounded-2xl p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setMode('manual');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'manual'
                ? 'bg-vitta-accent text-white shadow-sm'
                : 'text-vitta-text-muted hover:text-vitta-text-primary'
            }`}
          >
            Código Manual
          </button>
          <button
            type="button"
            onClick={() => startCamera()}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              mode === 'camera'
                ? 'bg-vitta-accent text-white shadow-sm'
                : 'text-vitta-text-muted hover:text-vitta-text-primary'
            }`}
          >
            <Camera size={14} />
            Escanear Câmera
          </button>
        </div>
      </div>

      {/* Main Validation Area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Input / Scanner */}
        <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm space-y-4">
          <h4 className="text-sm font-black text-vitta-text-primary flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Entrada de Validação
          </h4>

          {mode === 'camera' ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-vitta-border">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <div className="absolute inset-0 border-2 border-dashed border-emerald-500/70 m-8 rounded-2xl pointer-events-none flex items-center justify-center">
                  <span className="text-[11px] text-white/80 bg-black/50 px-2 py-1 rounded-md font-bold">
                    Aponte para o QR Code do Paciente
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setMode('manual');
                }}
                className="w-full py-2.5 bg-vitta-surface-2 hover:bg-vitta-border text-vitta-text-secondary text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Alternar para Digitação Manual
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                validateVoucherCode(manualCode);
              }}
              className="space-y-3"
            >
              {cameraError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-vitta-text-secondary block">
                  Digite o código do Voucher (Ex: VITTAPASS ou UUID):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Ex: MED50OFF"
                    className="flex-1 px-4 py-3 bg-vitta-surface-2 border border-vitta-border rounded-xl text-sm font-mono font-bold text-vitta-text-primary tracking-wider uppercase outline-none focus:border-vitta-accent"
                  />
                  <button
                    type="submit"
                    disabled={isValidating || !manualCode.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    {isValidating ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    <span>Validar</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="p-3 bg-vitta-surface-2 border border-vitta-border rounded-2xl text-[11px] text-vitta-text-muted space-y-1">
            <span className="font-bold text-vitta-text-primary block flex items-center gap-1.5">
              <Lock size={12} className="text-emerald-500" />
              Proteção contra uso duplicado ativa
            </span>
            <p>
              A operação utiliza <code>runTransaction</code> para garantir que cada voucher só possa ser resgatado uma única vez.
            </p>
          </div>
        </div>

        {/* Right: Validation Result Feedback */}
        <div className="bg-vitta-surface border border-vitta-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-vitta-text-primary mb-4 flex items-center gap-2">
              <Tag size={18} className="text-vitta-accent" />
              Resultado da Validação
            </h4>

            {validationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border space-y-3 ${
                  validationResult.status === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                    : validationResult.status === 'already_used'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {validationResult.status === 'success' ? (
                    <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                  ) : validationResult.status === 'already_used' ? (
                    <AlertCircle size={24} className="text-amber-500 shrink-0" />
                  ) : (
                    <XCircle size={24} className="text-rose-500 shrink-0" />
                  )}
                  <strong className="text-sm font-black">
                    {validationResult.status === 'success'
                      ? 'Voucher Válido & Baixado!'
                      : validationResult.status === 'already_used'
                      ? 'Voucher Já Utilizado!'
                      : 'Voucher Inválido'}
                  </strong>
                </div>

                <p className="text-xs leading-relaxed">
                  {validationResult.message}
                </p>

                {validationResult.voucher && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="opacity-75">Título:</span>
                      <span className="font-bold">{validationResult.voucher.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Desconto:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {validationResult.voucher.discount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-75">Parceiro:</span>
                      <span className="font-bold">{validationResult.voucher.partnerName || 'ViTTA'}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="p-8 text-center border border-dashed border-vitta-border rounded-2xl text-vitta-text-muted space-y-2">
                <QrCode size={36} className="mx-auto opacity-30" />
                <p className="text-xs">
                  Nenhum código escaneado no momento. Digite o código ou abra a câmera para ler o QR Code do paciente.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-vitta-border text-[11px] text-vitta-text-muted flex items-center justify-between">
            <span>Terminal Autorizado: ViTTA Admin</span>
            <span className="font-bold text-emerald-600">Status: Conectado</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherValidationView;
