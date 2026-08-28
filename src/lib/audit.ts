import { collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { addDoc } from './firestore-wrappers';

export interface AuditLogPayload {
  adminId?: string;
  adminName?: string;
  action: string;
  description: string;
  before?: any;
  after?: any;
}

/**
 * Registra uma entrada na coleção 'audit_logs' para rastreabilidade administrativa
 * de criação, atualização e exclusão de recursos.
 */
export const recordAuditLog = async (payload: AuditLogPayload): Promise<void> => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      adminId: payload.adminId || 'admin',
      adminName: payload.adminName || 'Administrador ViTTA',
      action: payload.action,
      description: payload.description,
      before: payload.before || null,
      after: payload.after || null,
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.warn('[AuditLog] Erro ao gravar log de auditoria:', error);
  }
};
