
import React, { useState } from 'react';
import { Star, X, Check, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  Timestamp,
  runTransaction 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useToast } from '../contexts/ToastContext.tsx';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  professionalId: string;
  professionalName: string;
  appointmentId: string;
  onSuccess?: () => void;
}

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  userId, 
  userName, 
  professionalId, 
  professionalName, 
  appointmentId,
  onSuccess 
}: ReviewModalProps) => {
  const { addToast } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      addToast('Por favor, selecione uma nota de 1 a 5 estrelas.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use a transaction to update the review and the professional's aggregate rating
      await runTransaction(db, async (transaction) => {
        const profRef = doc(db, 'professionals', professionalId);
        const profDoc = await transaction.get(profRef);
        
        if (!profDoc.exists()) {
          throw new Error('Profissional não encontrado.');
        }

        const currentData = profDoc.data();
        const currentTotalRating = (currentData.rating || 0) * (currentData.reviews || 0);
        const newReviewsCount = (currentData.reviews || 0) + 1;
        const newAverageRating = (currentTotalRating + rating) / newReviewsCount;

        // 1. Create the review document
        const reviewRef = doc(collection(db, 'reviews'));
        transaction.set(reviewRef, {
          userId,
          userName,
          professionalId,
          appointmentId,
          rating,
          comment,
          createdAt: Timestamp.now()
        });

        // 2. Update the professional document
        transaction.update(profRef, {
          rating: newAverageRating,
          reviews: newReviewsCount
        });

        // 3. Mark the appointment as reviewed (optional, if we adding isReviewed field)
        const appointmentRef = doc(db, 'appointments', appointmentId);
        transaction.update(appointmentRef, {
          isReviewed: true
        });
      });

      addToast('Obrigado pela sua avaliação!', 'success');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error submitting review:', err);
      addToast('Erro ao enviar avaliação. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-vitta-text-primary/10 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-vitta-border"
      >
        <div className="p-8 text-center space-y-6">
          <div className="flex justify-between items-center mb-2">
            <div className="w-10 h-10" /> {/* Spacer */}
            <h2 className="text-xl font-bold text-vitta-text-primary">Avaliar Atendimento</h2>
            <button onClick={onClose} className="p-2 hover:bg-vitta-surface-1 rounded-xl transition-colors">
              <X size={20} className="text-vitta-text-muted" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-vitta-text-secondary">Como foi sua experiência com</p>
            <h3 className="text-2xl font-bold text-vitta-accent">{professionalName}</h3>
          </div>

          {/* Star Rating */}
          <div className="flex items-center justify-center gap-1.5 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`transition-all transform hover:scale-110 active:scale-95 ${
                  (hover || rating) >= star ? 'text-vitta-amber' : 'text-vitta-surface-3'
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <Star 
                  size={44} 
                  fill={(hover || rating) >= star ? "currentColor" : "none"} 
                  strokeWidth={1.5}
                />
              </button>
            ))}
          </div>

          {/* Feedback Text */}
          <div className="space-y-2 text-left">
            <label className="text-[10px] font-bold text-vitta-text-muted uppercase tracking-widest px-1">Comentário (Opcional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Conte-nos o que achou do profissional..."
              rows={4}
              className="w-full px-5 py-4 bg-vitta-surface-2 border border-vitta-border rounded-3xl text-sm focus:ring-4 focus:ring-vitta-accent/10 focus:border-vitta-accent/50 outline-none transition-all resize-none placeholder:text-vitta-text-muted/50"
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || rating === 0}
              className={`w-full py-4 text-white rounded-2xl font-bold font-lg transition-all flex items-center justify-center gap-2 shadow-xl ${
                rating === 0 
                  ? 'bg-vitta-surface-3 cursor-not-allowed' 
                  : 'bg-vitta-accent hover:bg-vitta-accent/90 shadow-vitta-accent/20'
              }`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={20} />
                  Enviar Avaliação
                </>
              )}
            </button>
          </div>
          
          <p className="text-[10px] text-vitta-text-muted font-bold uppercase tracking-wider">
            Sua opinião ajuda outros pacientes a escolherem melhor
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ReviewModal;
