import React, { useState, useCallback } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Info, 
  AlertCircle,
  Shield,
  User,
  CreditCard,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext';

interface KYCWizardProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  userData: any;
  onSuccess: (updatedData: any) => void;
}

type Step = 'intro' | 'front' | 'back' | 'selfie' | 'review';

const KYCWizard = ({ isOpen, onClose, user, userData, onSuccess }: KYCWizardProps) => {
  const { addToast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{
    front: string | null;
    back: string | null;
    selfie: string | null;
  }>({
    front: userData?.documentFrontUrl || null,
    back: userData?.documentBackUrl || null,
    selfie: userData?.photoURL || null
  });

  const steps: Step[] = ['intro', 'front', 'back', 'selfie', 'review'];
  const currentIndex = steps.indexOf(currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  const handleFileChange = (type: 'front' | 'back' | 'selfie') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      addToast('Por favor, selecione um arquivo de imagem.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast('O arquivo é muito grande (máx 5MB).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFiles(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => {
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx < steps.length - 1) {
      setCurrentStep(steps[currentIdx + 1]);
    }
  };

  const prevStep = () => {
    const currentIdx = steps.indexOf(currentStep);
    if (currentIdx > 0) {
      setCurrentStep(steps[currentIdx - 1]);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      const updatedData = {
        ...userData,
        documentFrontUrl: files.front,
        documentBackUrl: files.back,
        photoURL: files.selfie,
        kycStatus: 'under_review',
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
      
      addToast('Documentos enviados com sucesso! Estamos analisando.', 'success');
      onSuccess(updatedData);
      onClose();
    } catch (error) {
      console.error('Error submitting KYC:', error);
      addToast('Erro ao enviar documentos. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'intro':
        return (
          <div className="space-y-6 text-center">
            <div className="w-20 h-20 bg-vitta-accent/10 text-vitta-accent rounded-3xl flex items-center justify-center mx-auto">
              <Shield size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-vitta-text-primary">Verificação de Identidade</h3>
              <p className="text-vitta-text-secondary">
                Para garantir a segurança de todos os usuários e liberar benefícios exclusivos, 
                precisamos verificar sua identidade.
              </p>
            </div>
            
            <div className="bg-vitta-surface-2 p-6 rounded-2xl space-y-4 text-left">
              <h4 className="font-bold text-sm text-vitta-text-primary">O que você vai precisar:</h4>
              <ul className="space-y-3">
                {[
                  { icon: CreditCard, text: "RG ou CNH original" },
                  { icon: Camera, text: "Um ambiente bem iluminado" },
                  { icon: User, text: "Uma selfie clara e nítida" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-xs text-vitta-text-secondary">
                    <item.icon size={16} className="text-vitta-accent" />
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <button 
                onClick={nextStep}
                className="w-full py-4 bg-vitta-accent text-white rounded-2xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2"
              >
                Começar Agora
                <ChevronRight size={20} />
              </button>
            </div>
            <p className="text-[10px] text-vitta-text-muted font-medium">
              Seus dados são protegidos por criptografia de ponta a ponta.
            </p>
          </div>
        );

      case 'front':
      case 'back':
      case 'selfie':
        const type = currentStep;
        const labels = {
          front: { title: "Frente do Documento", desc: "A foto deve mostrar claramente todos os dados e sua foto.", icon: CreditCard },
          back: { title: "Verso do Documento", desc: "Se for RG, mostre o verso. Se for CNH, mostre a parte das observações.", icon: CreditCard },
          selfie: { title: "Sua Melhor Selfie", desc: "Tire uma foto do seu rosto em um ambiente iluminado, sem óculos ou boné.", icon: User }
        };
        const currentData = labels[type];

        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-vitta-text-primary">{currentData.title}</h3>
              <p className="text-sm text-vitta-text-secondary">{currentData.desc}</p>
            </div>

            <div 
              className={`relative h-64 bg-vitta-surface-2 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer ${
                files[type] ? 'border-vitta-accent' : 'border-vitta-border hover:border-vitta-accent/50 group'
              }`}
            >
              {files[type] ? (
                <>
                  <img src={files[type]!} alt={currentData.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold text-sm">Clique para alterar</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-vitta-text-muted group-hover:text-vitta-accent transition-colors text-center p-6">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                    <currentData.icon size={32} />
                  </div>
                  <p className="font-bold">Arraste ou clique para enviar</p>
                  <p className="text-[10px] mt-1">PNG, JPG ou JPEG até 5MB</p>
                </div>
              )}
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                accept="image/*" 
                onChange={handleFileChange(type)}
              />
            </div>

            <div className="bg-vitta-amber/5 border border-vitta-amber/20 p-4 rounded-xl flex gap-3">
              <Info className="text-vitta-amber shrink-0" size={18} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-vitta-text-primary">Dica para o sucesso:</p>
                <p className="text-xs text-vitta-text-secondary">
                  Certifique-se de que não haja reflexos de luz e que o texto esteja legível.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={prevStep}
                className="flex-1 py-4 bg-vitta-surface-2 text-vitta-text-secondary rounded-2xl font-bold hover:bg-vitta-border transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Voltar
              </button>
              <button 
                onClick={nextStep}
                disabled={!files[type]}
                className="flex-[2] py-4 bg-vitta-accent text-white rounded-2xl font-bold shadow-lg shadow-vitta-accent/20 hover:bg-vitta-accent/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo Passo
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-vitta-text-primary">Revisar e Enviar</h3>
              <p className="text-sm text-vitta-text-secondary">Confira se as fotos estão nítidas antes de enviar para análise.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { type: 'front' as const, label: 'Frente' },
                { type: 'back' as const, label: 'Verso' },
                { type: 'selfie' as const, label: 'Selfie' }
              ].map((item, i) => (
                <div key={i} className={`relative rounded-2xl border border-vitta-border overflow-hidden h-32 ${item.type === 'selfie' ? 'col-span-2' : ''}`}>
                  <img src={files[item.type]!} alt={item.label} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-bold text-white uppercase">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={prevStep}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-vitta-surface-2 text-vitta-text-secondary rounded-2xl font-bold hover:bg-vitta-border transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Voltar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-vitta-green text-white rounded-2xl font-bold shadow-lg shadow-vitta-green/20 hover:bg-vitta-green/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Check size={20} />
                    Finalizar Verificação
                  </>
                )}
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-vitta-text-primary/20 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-vitta-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border flex flex-col max-h-[90vh]"
      >
        <div className="p-8 pb-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-vitta-accent rounded-xl flex items-center justify-center text-white">
              <Shield size={20} />
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest">Verificação KYC</p>
              <div className="h-1 w-32 bg-vitta-surface-2 rounded-full mt-1 overflow-hidden">
                <motion.div 
                  className="h-full bg-vitta-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-vitta-surface-2 rounded-2xl transition-colors"
          >
            <X size={24} className="text-vitta-text-muted" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderCurrentStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default KYCWizard;
