import { doc, getDoc, setDoc, onSnapshot, collection, query, where, getDocs, increment, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { updateDoc, addDoc } from './firestore-wrappers';
import { recordAuditLog } from './audit';

export interface PlatformPixConfig {
  keyType: 'cnpj' | 'cpf' | 'email' | 'phone' | 'evp';
  key: string;
  beneficiaryName: string;
  bankName: string;
  city: string;
  instructions?: string;
  active: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_PLATFORM_PIX_CONFIG: PlatformPixConfig = {
  keyType: 'cnpj',
  key: '48.912.834/0001-92',
  beneficiaryName: 'ViTTA Saúde & Benefícios Brasil LTDA',
  bankName: 'Banco Cora SCD (403)',
  city: 'São Paulo',
  instructions: 'Pagamento institucional de faturas e taxas de intermediação ViTTA via PIX. A baixa do saldo ocorre diretamente no sistema.',
  active: true,
};

/**
 * Normaliza e formata a chave PIX para exibição amigável
 */
export function formatPixKeyDisplay(key: string, keyType: string): string {
  if (!key) return '';
  const clean = key.trim();
  if (keyType === 'cnpj') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 14) {
      return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    }
  } else if (keyType === 'cpf') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
  } else if (keyType === 'phone') {
    const digits = clean.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
  }
  return clean;
}

/**
 * Helper para formatar campos no padrão EMV (ID + Tamanho 2 dígitos + Conteúdo)
 */
function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Calcula CRC16-CCITT (0xFFFF) no padrão do Banco Central do Brasil para PIX
 */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Gera o payload PIX Copia e Cola padrão EMV QRCPS-MPM do Banco Central do Brasil
 */
export function generatePixBrcode(
  pixKey: string,
  beneficiaryName: string,
  city: string,
  amount?: number,
  txId: string = '***'
): string {
  // Limpeza de chave PIX conforme tipo
  let formattedKey = pixKey.trim();
  if (formattedKey.includes('@')) {
    formattedKey = formattedKey.toLowerCase();
  } else if (formattedKey.startsWith('+')) {
    // Keep phone as is
  } else if (formattedKey.replace(/\D/g, '').length === 11 || formattedKey.replace(/\D/g, '').length === 14) {
    // Se for CPF ou CNPJ, remover formatação
    if (!formattedKey.includes('-') || formattedKey.length <= 18) {
      formattedKey = formattedKey.replace(/\D/g, '');
    }
  }

  // Normalização do nome e cidade (sem acentos para conformidade EMV)
  const normName = beneficiaryName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25) || 'VITTA SAUDE';

  const normCity = city
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15) || 'SAO PAULO';

  // 00: Payload Format Indicator (01)
  const f00 = formatEmvField('00', '01');

  // 26: Merchant Account Information - PIX
  const gui = formatEmvField('00', 'br.gov.bcb.pix');
  const keyField = formatEmvField('01', formattedKey);
  const f26 = formatEmvField('26', `${gui}${keyField}`);

  // 52: Merchant Category Code (0000)
  const f52 = formatEmvField('52', '0000');

  // 53: Transaction Currency (986 = BRL)
  const f53 = formatEmvField('53', '986');

  // 54: Transaction Amount (opcional)
  let f54 = '';
  if (amount && amount > 0) {
    f54 = formatEmvField('54', amount.toFixed(2));
  }

  // 58: Country Code (BR)
  const f58 = formatEmvField('58', 'BR');

  // 59: Merchant Name
  const f59 = formatEmvField('59', normName);

  // 60: Merchant City
  const f60 = formatEmvField('60', normCity);

  // 62: Additional Data Field (TxID)
  const safeTxId = txId.replace(/[^A-Za-z0-9]/g, '').substring(0, 25) || '***';
  const f62_05 = formatEmvField('05', safeTxId);
  const f62 = formatEmvField('62', f62_05);

  // Concatenação antes do CRC
  const rawPayload = `${f00}${f26}${f52}${f53}${f54}${f58}${f59}${f60}${f62}6304`;
  const checksum = crc16(rawPayload);

  return `${rawPayload}${checksum}`;
}

/**
 * Busca a configuração da Chave PIX da Plataforma no Firestore
 */
export async function fetchPlatformPixConfig(): Promise<PlatformPixConfig> {
  try {
    const docRef = doc(db, 'system_configs', 'platform_pix');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { ...DEFAULT_PLATFORM_PIX_CONFIG, ...snap.data() } as PlatformPixConfig;
    }
    // Fallback: verificar em system_settings/platform_pix
    const fallbackRef = doc(db, 'system_settings', 'platform_pix');
    const fallbackSnap = await getDoc(fallbackRef);
    if (fallbackSnap.exists()) {
      return { ...DEFAULT_PLATFORM_PIX_CONFIG, ...fallbackSnap.data() } as PlatformPixConfig;
    }
  } catch (err) {
    console.warn('[fetchPlatformPixConfig] Erro ao buscar configuração da Chave PIX da plataforma:', err);
  }
  return DEFAULT_PLATFORM_PIX_CONFIG;
}

/**
 * Salva ou atualiza a Chave PIX da Plataforma no Firestore
 */
export async function savePlatformPixConfig(
  config: PlatformPixConfig,
  adminUser?: { uid?: string; email?: string; name?: string }
): Promise<void> {
  const payload = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy: adminUser?.email || adminUser?.uid || 'admin',
  };

  await setDoc(doc(db, 'system_configs', 'platform_pix'), payload, { merge: true });
  try {
    await setDoc(doc(db, 'system_settings', 'platform_pix'), payload, { merge: true });
  } catch (e) {
    // Ignorar se não existir permissão em system_settings
  }

  await recordAuditLog({
    action: 'UPDATE_PLATFORM_PIX_CONFIG',
    adminId: adminUser?.uid || 'admin',
    adminName: adminUser?.email || adminUser?.name || 'Administrador Financeiro',
    description: `Atualização da Chave PIX Institucional da Plataforma: ${config.key} (${config.keyType}) - Favorecido: ${config.beneficiaryName}`,
    after: config,
  });
}

/**
 * Realiza a quitação/pagamento de fatura de taxas de intermediação:
 * - Debita o saldo da carteira (se especificado)
 * - Registra pagamento via PIX da plataforma (se especificado)
 * - Dá baixa nas taxas pendentes (transações e invoices)
 * - Registra os lançamentos contábeis de débito/pagamento
 */
export async function processInvoicePayment({
  userId,
  userEmail,
  userName,
  totalUnpaidAmount,
  walletAmountToUse,
  pixAmountToPay,
  paymentMethod,
  pixProofInfo,
}: {
  userId: string;
  userEmail?: string;
  userName?: string;
  totalUnpaidAmount: number;
  walletAmountToUse: number;
  pixAmountToPay: number;
  paymentMethod: 'wallet_only' | 'pix_only' | 'wallet_and_pix';
  pixProofInfo?: string;
}): Promise<{
  success: boolean;
  totalPaid: number;
  remainingUnpaid: number;
  message: string;
}> {
  if (!userId) {
    throw new Error('ID do usuário profissional não informado.');
  }

  const nowIso = new Date().toISOString();
  const totalPaid = (walletAmountToUse || 0) + (pixAmountToPay || 0);

  if (totalPaid <= 0) {
    throw new Error('O valor do pagamento deve ser superior a R$ 0,00.');
  }

  // 1. Debitar da carteira do usuário caso utilize saldo em conta
  if (walletAmountToUse > 0) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      walletBalance: increment(-walletAmountToUse),
    });

    // Registrar transação de débito do saldo em conta
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'debit',
      category: 'Pagamento de Fatura',
      title: 'Pagamento de Fatura de Taxas - Saldo da Carteira',
      description: `Débito em conta para liquidação de taxas de intermediação de consultas presenciais ViTTA.`,
      amount: -walletAmountToUse,
      date: nowIso,
      status: 'completed',
      paymentMethod: 'wallet_balance',
      paidVia: 'wallet',
    });
  }

  // 2. Se houver pagamento via PIX institucional da plataforma
  if (pixAmountToPay > 0) {
    await addDoc(collection(db, 'transactions'), {
      userId,
      type: 'invoice_payment_pix',
      category: 'Pagamento de Fatura PIX',
      title: 'Pagamento de Fatura via PIX Institucional',
      description: `Pagamento de taxas ViTTA efetuado com chave PIX da plataforma.${pixProofInfo ? ` Ref/Comprovante: ${pixProofInfo}` : ''}`,
      amount: pixAmountToPay,
      date: nowIso,
      status: 'completed',
      paymentMethod: 'pix_platform',
      paidVia: 'pix',
      proofInfo: pixProofInfo || null,
    });
  }

  // 3. Obter transações e faturas pendentes para dar baixa proporcional ou integral
  const txQuery = query(
    collection(db, 'transactions'),
    where('userId', '==', userId)
  );
  const txSnap = await getDocs(txQuery);
  const unpaidTxs = txSnap.docs
    .map((d) => ({ id: d.id, ...d.data() } as any))
    .filter((t) => t.isCash === true && t.invoicePaid !== true && (t.feeCharged || 0) > 0)
    .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

  let remainingToDistribute = totalPaid;

  for (const t of unpaidTxs) {
    if (remainingToDistribute <= 0) break;
    const fee = t.feeCharged || 0;

    if (remainingToDistribute >= fee) {
      await updateDoc(doc(db, 'transactions', t.id), {
        invoicePaid: true,
        status: 'paid',
        paidAt: nowIso,
        paidWithMethod: paymentMethod,
        paidWalletPortion: walletAmountToUse > 0 ? Math.min(walletAmountToUse, fee) : 0,
        paidPixPortion: pixAmountToPay > 0 ? Math.min(pixAmountToPay, fee) : 0,
      });
      remainingToDistribute -= fee;
    } else {
      // Baixa parcial: atualiza o montante pago
      await updateDoc(doc(db, 'transactions', t.id), {
        partialPaidAmount: (t.partialPaidAmount || 0) + remainingToDistribute,
        lastPaymentAt: nowIso,
        paidWithMethod: paymentMethod,
      });
      remainingToDistribute = 0;
    }
  }

  // 4. Também dar baixa nos documentos da coleção 'invoices'
  try {
    const invQuery = query(
      collection(db, 'invoices'),
      where('professionalUserId', '==', userId)
    );
    const invSnap = await getDocs(invQuery);
    const unpaidInvoices = invSnap.docs
      .map((d) => ({ id: d.id, ...d.data() } as any))
      .filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled')
      .sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());

    let invDistribute = totalPaid;
    for (const inv of unpaidInvoices) {
      if (invDistribute <= 0) break;
      const invAmount = inv.amount || inv.feeCharged || 0;
      if (invDistribute >= invAmount) {
        await updateDoc(doc(db, 'invoices', inv.id), {
          status: 'paid',
          invoicePaid: true,
          paidAt: nowIso,
          paymentMethod,
        });
        invDistribute -= invAmount;
      }
    }
  } catch (err) {
    console.warn('[processInvoicePayment] Aviso ao atualizar collection invoices:', err);
  }

  // 5. Notificação para o profissional
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: 'invoice_payment',
      title: 'Fatura de Taxas Paga com Sucesso',
      message: `Pagamento de ${totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} registrado com sucesso via ${
        paymentMethod === 'wallet_only'
          ? 'Saldo em Conta'
          : paymentMethod === 'pix_only'
          ? 'PIX Institucional'
          : 'Saldo em Conta + PIX'
      }.`,
      read: false,
      createdAt: nowIso,
    });
  } catch (err) {
    // Silently continue
  }

  const remainingUnpaid = Math.max(0, totalUnpaidAmount - totalPaid);

  return {
    success: true,
    totalPaid,
    remainingUnpaid,
    message:
      remainingUnpaid === 0
        ? 'Fatura integralmente quitada com sucesso!'
        : `Pagamento de ${totalPaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} processado. Saldo restante em aberto: ${remainingUnpaid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
  };
}
