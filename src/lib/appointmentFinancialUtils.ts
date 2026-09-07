import { collection, query, where, getDocs, doc, getDoc, Timestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { updateDoc, addDoc } from './firestore-wrappers';

/**
 * Cancela as taxas de intermediação e faturas vinculadas a um agendamento cancelado.
 * Garante que a taxa da consulta seja isenta/zerada e a fatura não seja cobrada do profissional.
 */
export async function cancelAppointmentFeeInvoices(appointmentId: string): Promise<void> {
  if (!appointmentId) return;

  try {
    // 1. Cancelar transações de taxa / fatura de intermediação vinculadas ao agendamento
    const txQuery = query(
      collection(db, 'transactions'),
      where('appointmentId', '==', appointmentId)
    );
    const txSnap = await getDocs(txQuery);

    for (const docSnap of txSnap.docs) {
      const data = docSnap.data();
      // Apenas atualiza se não estiver cancelada previamente
      if (data.status !== 'cancelled') {
        await updateDoc(doc(db, 'transactions', docSnap.id), {
          status: 'cancelled',
          cancelled: true,
          feeCharged: 0,
          invoicePaid: false,
          cancelledAt: new Date().toISOString(),
          cancellationNote: 'Taxa da consulta cancelada na fatura devido ao cancelamento do agendamento.',
        });
      }
    }

    // 2. Cancelar documentos correspondentes na coleção 'invoices'
    const invQuery = query(
      collection(db, 'invoices'),
      where('appointmentId', '==', appointmentId)
    );
    const invSnap = await getDocs(invQuery);

    for (const docSnap of invSnap.docs) {
      const data = docSnap.data();
      if (data.status !== 'cancelled') {
        await updateDoc(doc(db, 'invoices', docSnap.id), {
          status: 'cancelled',
          cancelled: true,
          amount: 0,
          feeCharged: 0,
          invoicePaid: false,
          cancelledAt: new Date().toISOString(),
          cancellationNote: 'Fatura cancelada automaticamente por cancelamento da consulta.',
        });
      }
    }
  } catch (error) {
    console.error('[cancelAppointmentFeeInvoices] Erro ao cancelar taxas da fatura:', error);
  }
}

/**
 * Finaliza e Fatura a Consulta Médica.
 * A consulta só deve ser faturada (cobrança de taxa presencial ou repasse do split)
 * após o profissional clicar em "Concluir Consulta".
 */
export async function finalizeAndInvoiceAppointment(
  appointmentId: string,
  professionalProfile?: any,
  options?: {
    soapNotes?: any;
    prescriptions?: any[];
  }
): Promise<{ success: boolean; message: string }> {
  if (!appointmentId) {
    return { success: false, message: 'ID do agendamento inválido.' };
  }

  try {
    const aptRef = doc(db, 'appointments', appointmentId);
    const aptSnap = await getDoc(aptRef);
    if (!aptSnap.exists()) {
      return { success: false, message: 'Agendamento não encontrado.' };
    }

    const apt = aptSnap.data();
    if (apt.status === 'completed' && apt.invoiced === true) {
      return { success: true, message: 'Esta consulta já foi concluída e faturada anteriormente.' };
    }

    const now = Timestamp.now();
    const nowIso = new Date().toISOString();

    const priceNumeric =
      apt.priceNumeric !== undefined
        ? Number(apt.priceNumeric)
        : typeof apt.price === 'number'
        ? apt.price
        : parseFloat(apt.price) || 0;

    const profFeeRate =
      professionalProfile?.feeRate !== undefined
        ? Number(professionalProfile.feeRate)
        : apt.feeRate !== undefined
        ? Number(apt.feeRate)
        : 10;

    const feeAmount = (priceNumeric * profFeeRate) / 100;
    const netAmount = priceNumeric - feeAmount;

    const profUserId =
      professionalProfile?.userId ||
      professionalProfile?.id ||
      apt.professionalUserId ||
      apt.professionalId;

    // 1. Atualizar agendamento para completed e invoiced
    const updateData: any = {
      status: 'completed',
      invoiced: true,
      invoicedAt: nowIso,
      completedAt: now,
      updatedAt: now,
      telemedicineStatus: 'closed',
      splitStatus: 'released',
    };

    if (options?.soapNotes) {
      updateData.soapNotes = options.soapNotes;
    }
    if (options?.prescriptions) {
      updateData.prescriptions = options.prescriptions;
    }

    await updateDoc(aptRef, updateData);

    // 2. Processar Faturamento (Invoicing / Financial Split)
    const isOnlinePayment =
      apt.paymentMethod === 'online' ||
      apt.paymentMethod === 'wallet' ||
      apt.paymentType === 'vitta_coins';

    if (isOnlinePayment) {
      // Online / Carteira: Liberar split de repasse para o profissional
      if (profUserId && netAmount > 0) {
        // Verificar se já não existe transação de split para este agendamento para evitar duplicidade
        const existingTxQuery = query(
          collection(db, 'transactions'),
          where('appointmentId', '==', appointmentId),
          where('type', '==', 'appointment_split')
        );
        const existingTxSnap = await getDocs(existingTxQuery);

        if (existingTxSnap.empty) {
          // Creditar saldo da carteira do profissional
          try {
            await updateDoc(doc(db, 'users', profUserId), {
              walletBalance: increment(netAmount),
            });
          } catch (e) {
            console.warn('[finalizeAndInvoiceAppointment] Usuário profissional não encontrado ou erro ao incrementar:', e);
          }

          // Registrar transação de rendimento
          await addDoc(collection(db, 'transactions'), {
            userId: profUserId,
            professionalId: apt.professionalId || null,
            appointmentId: appointmentId,
            type: 'appointment_split',
            category: 'Rendimento',
            amount: netAmount,
            grossAmount: priceNumeric,
            feeCharged: feeAmount,
            feeRatio: profFeeRate,
            patientName: apt.patientName || 'Paciente',
            patientId: apt.userId || null,
            title: `Recebimento - Consulta de ${apt.patientName || 'Paciente'}`,
            description: `Rendimento líquido faturado após conclusão da consulta (${apt.modality === 'telemedicine' ? 'Telemedicina' : 'Presencial'}).`,
            date: nowIso,
            status: 'completed',
            createdAt: nowIso,
          });
        }
      }
    } else {
      // Presencial / Clínica: Gerar fatura de intermediação da taxa ViTTA para o profissional
      if (feeAmount > 0) {
        // Verificar se já não existe fatura para evitar duplicidade
        const existingInvQuery = query(
          collection(db, 'invoices'),
          where('appointmentId', '==', appointmentId)
        );
        const existingInvSnap = await getDocs(existingInvQuery);

        if (existingInvSnap.empty) {
          const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

          // Registrar transação de fatura
          await addDoc(collection(db, 'transactions'), {
            userId: profUserId,
            professionalId: apt.professionalId || null,
            professionalUserId: profUserId || null,
            appointmentId: appointmentId,
            type: 'clinic_fee_invoice',
            category: 'Taxa de Atendimento Presencial',
            title: `Fatura de Intermediação - Consulta Presencial`,
            description: `Taxa da plataforma ViTTA (${profFeeRate}%) sobre consulta de ${apt.patientName || 'Paciente'}. Faturada na conclusão do atendimento.`,
            patientName: apt.patientName || 'Paciente',
            patientId: apt.userId || null,
            consultationPrice: priceNumeric,
            grossAmount: priceNumeric,
            feeCharged: feeAmount,
            feeRatio: profFeeRate,
            amount: -feeAmount,
            isCash: true,
            invoicePaid: false,
            status: 'pending',
            dueDate: dueDate,
            date: nowIso,
            createdAt: nowIso,
          });

          // Registrar documento na coleção 'invoices'
          await addDoc(collection(db, 'invoices'), {
            userId: profUserId,
            professionalUserId: profUserId || null,
            professionalId: apt.professionalId || null,
            professionalName: professionalProfile?.name || apt.professionalName || 'Profissional',
            patientId: apt.userId || null,
            patientName: apt.patientName || 'Paciente',
            appointmentId: appointmentId,
            consultationPrice: priceNumeric,
            feeRate: profFeeRate,
            feeCharged: feeAmount,
            amount: feeAmount,
            description: `Taxa de intermediação ViTTA (${profFeeRate}%) - Consulta presencial concluída de ${apt.patientName || 'Paciente'}`,
            status: 'pending',
            invoicePaid: false,
            paymentMethod: 'in_person',
            date: nowIso,
            dueDate: dueDate,
            createdAt: nowIso,
          });
        }
      }
    }

    // 3. Notificações
    if (apt.userId) {
      await addDoc(collection(db, 'notifications'), {
        userId: apt.userId,
        title: 'Consulta Concluída',
        message: `Sua consulta com ${professionalProfile?.name || apt.professionalName} foi concluída com sucesso!`,
        type: 'appointment',
        appointmentId: appointmentId,
        read: false,
        createdAt: now,
      });
    }

    if (profUserId) {
      await addDoc(collection(db, 'notifications'), {
        userId: profUserId,
        title: 'Consulta Concluída e Faturada',
        message: `A consulta de ${apt.patientName || 'Paciente'} foi finalizada e faturada com sucesso no sistema.`,
        type: 'appointment',
        appointmentId: appointmentId,
        read: false,
        createdAt: now,
      });
    }

    return { success: true, message: 'Consulta concluída e faturada com sucesso!' };
  } catch (error: any) {
    console.error('[finalizeAndInvoiceAppointment] Erro ao finalizar e faturar:', error);
    return { success: false, message: error?.message || 'Erro ao finalizar e faturar consulta.' };
  }
}
