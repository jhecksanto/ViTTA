/**
 * Firebase Error Codes to Portuguese translations
 */
export const firebaseErrorMap: Record<string, string> = {
  // Auth
  'auth/invalid-email': 'O endereço de e-mail não é válido.',
  'auth/user-not-found': 'Não encontramos nenhuma conta com este e-mail.',
  'auth/wrong-password': 'A senha informada está incorreta.',
  'auth/email-already-in-use': 'Este e-mail já está sendo utilizado por outra conta.',
  'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
  'auth/popup-closed-by-user': 'A janela de autenticação foi fechada antes de concluir.',
  'auth/cancelled-popup-request': 'A autenticação foi cancelada por uma nova solicitação.',
  'auth/too-many-requests': 'Muitas tentativas bloqueadas temporariamente. Tente mais tarde.',
  'auth/operation-not-allowed': 'Este método de autenticação não está habilitado.',
  'auth/network-request-failed': 'Falha na conexão de rede. Verifique seu sinal.',
  'auth/requires-recent-login': 'Esta ação exige que você faça login novamente para confirmar sua identidade.',
  'auth/user-disabled': 'Esta conta de usuário foi desativada por um administrador.',
  
  // Firestore
  'permission-denied': 'Você não tem permissão para realizar esta operação.',
  'unavailable': 'O serviço está temporariamente indisponível. Tente novamente em breve.',
  'not-found': 'O documento solicitado não foi encontrado.',
  'already-exists': 'O documento que você está tentando criar já existe.',
  'deadline-exceeded': 'O tempo da solicitação expirou. Tente novamente.',
  'resource-exhausted': 'Limite de cota excedido. Contate o suporte.',
  'failed-precondition': 'A operação foi rejeitada devido ao estado atual do sistema.',
  'aborted': 'A operação foi cancelada devido a um conflito.',
  'out-of-range': 'A operação foi além do intervalo permitido.',
  'unimplemented': 'Esta funcionalidade ainda não foi implementada.',
  'internal': 'Ocorreu um erro interno no servidor.',
  'data-loss': 'Houve uma perda de dados irrecuperável.',
};

/**
 * Mercado Pago Error Codes to Portuguese translations
 */
export const mercadoPagoErrorMap: Record<string, string> = {
  'bad_request': 'Houve um problema com a sua solicitação. Verifique os dados.',
  'unauthorized': 'Token de acesso inválido ou expirado.',
  'forbidden': 'Acesso negado ao recurso solicitado.',
  'not_found': 'O pagamento ou plano não foi encontrado.',
  'method_not_allowed': 'Método de solicitação não permitido.',
  'too_many_requests': 'Muitas solicitações em pouco tempo. Aguarde um momento.',
  'internal_server_error': 'Erro interno no gateway de pagamento.',
  
  // Custom logic errors
  'cc_rejected_bad_filled_card_number': 'Confira o número do cartão.',
  'cc_rejected_bad_filled_date': 'Confira a data de validade.',
  'cc_rejected_bad_filled_other': 'Confira os dados do cartão.',
  'cc_rejected_bad_filled_security_code': 'Confira o código de segurança do cartão.',
  'cc_rejected_blacklist': 'Não conseguimos processar seu cartão.',
  'cc_rejected_call_for_authorize': 'Você deve autorizar o pagamento junto à operadora do cartão.',
  'cc_rejected_card_disabled': 'Ative seu cartão antes de tentar novamente.',
  'cc_rejected_card_error': 'Não conseguimos processar seu pagamento.',
  'cc_rejected_duplicated_payment': 'Você já efetuou um pagamento com esse valor. Se precisar pagar novamente, utilize outro cartão ou outro meio de pagamento.',
  'cc_rejected_high_risk': 'Seu pagamento foi recusado por motivos de segurança.',
  'cc_rejected_insufficient_amount': 'Seu cartão não possui saldo suficiente.',
  'cc_rejected_invalid_installments': 'O cartão não processa pagamentos em parcelas selecionadas.',
  'cc_rejected_max_attempts': 'Você atingiu o limite de tentativas. Use outro cartão.',
  'cc_rejected_other_reason': 'Não conseguimos processar o pagamento.',
};

/**
 * Main translation function
 */
export function translateError(error: any): string {
  if (!error) return 'Ocorreu um erro inesperado.';

  const message = error.message || String(error);
  const code = error.code || '';

  // Try mapping by code
  if (code && firebaseErrorMap[code]) {
    return firebaseErrorMap[code];
  }
  
  if (code && mercadoPagoErrorMap[code]) {
    return mercadoPagoErrorMap[code];
  }

  // Fallback pattern matching for common strings in messages
  if (message.includes('permission-denied') || message.includes('insufficient permissions')) {
    return firebaseErrorMap['permission-denied'];
  }
  
  if (message.includes('quota exceeded')) {
    return firebaseErrorMap['resource-exhausted'];
  }

  if (message.includes('network error') || message.includes('failed to fetch')) {
    return firebaseErrorMap['auth/network-request-failed'];
  }

  return message; // Return original if no translation found
}
