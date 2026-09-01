/**
 * Valida um número de CPF
 * @param cpf String do CPF (com ou sem máscara)
 * @returns boolean
 */
export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11) return false;

  // Bloqueia CPFs conhecidos como inválidos (todos os dígitos iguais)
  if (/^(\d)\1+$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }

  remainder = (sum * 10) % 11;

  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
};

/**
 * Valida um número de CNPJ
 * @param cnpj String do CNPJ (com ou sem máscara)
 * @returns boolean
 */
export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
};

/**
 * Valida formato de e-mail
 * @param email 
 * @returns boolean
 */
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Valida formatos aceitos de chave PIX (CPF, CNPJ, E-mail, Celular, EVP/Aleatória)
 */
export const validatePixKey = (key: string): { valid: boolean; type?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'evp'; message?: string } => {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: 'A chave PIX não pode ser vazia.' };
  }

  // 1. EVP / Chave Aleatória (UUID v4)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (uuidRegex.test(trimmed)) {
    return { valid: true, type: 'evp' };
  }

  // 2. Email
  if (trimmed.includes('@')) {
    if (validateEmail(trimmed)) {
      return { valid: true, type: 'email' };
    }
    return { valid: false, message: 'Formato de e-mail inválido para chave PIX.' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  // 3. CPF (11 digits)
  if (digitsOnly.length === 11 && !trimmed.startsWith('+')) {
    if (validateCPF(digitsOnly)) {
      return { valid: true, type: 'cpf' };
    }
  }

  // 4. Phone (10 or 11 digits, or starting with +55)
  if (trimmed.startsWith('+55') || (digitsOnly.length >= 10 && digitsOnly.length <= 13)) {
    const phoneDigits = digitsOnly.startsWith('55') && digitsOnly.length >= 12 ? digitsOnly.slice(2) : digitsOnly;
    if (phoneDigits.length === 10 || phoneDigits.length === 11) {
      return { valid: true, type: 'phone' };
    }
  }

  // 5. CNPJ (14 digits)
  if (digitsOnly.length === 14) {
    if (validateCNPJ(digitsOnly)) {
      return { valid: true, type: 'cnpj' };
    }
    return { valid: false, message: 'CNPJ informado para chave PIX é inválido.' };
  }

  return { 
    valid: false, 
    message: 'Chave PIX inválida. Informe um CPF, CNPJ, E-mail, Celular com DDD ou Chave Aleatória (UUID).' 
  };
};

/**
 * Formata data ISO ou string YYYY-MM-DD para formato de exibição pt-BR
 */
export const formatDateForDisplay = (
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

/**
 * Busca endereço pelo CEP usando a API ViaCEP com timeout e controle de resiliência
 * @param cep 
 * @returns {Promise<{ street: string; neighborhood: string; city: string; state: string } | null>}
 */
export const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[ViaCEP] Erro ou timeout ao consultar CEP:', error);
    return null;
  }
};
