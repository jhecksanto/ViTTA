# Issue 05: Agendamentos - Cancelamento com Estorno Automático na Carteira
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Agendamentos & Carteira Digital  
**Prioridade:** P1 (Alta)  
**Arquivos Alvo:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`

---

## 1. Descrição e Contexto
Quando um paciente ou administrador cancela uma consulta confirmada (dentro da política de cancelamento com antecedência de até 2 horas do horário agendado), o sistema deve processar o estorno imediato do valor pago diretamente no saldo da carteira do paciente, gerando o extrato financeiro correspondente.

---

## 2. Requisitos Técnicos
1. **Transação Atômica de Cancelamento e Reembolso:**
   - Em `MyAppointmentsView.tsx`, ao confirmar o cancelamento no modal de confirmação:
     - Executar `runTransaction` no Firestore:
       - Verificar se `status === 'pending'` ou `status === 'confirmed'`.
       - Atualizar o agendamento para `status: 'cancelled'`, `cancelledAt: serverTimestamp()` e `refundIssued: true`.
       - Obter a referência da carteira `wallets/{patientId}`.
       - Incrementar o campo `balance: increment(appointment.price)`.
       - Adicionar registro na coleção `transactions` com `{ userId: patientId, type: 'refund', category: 'appointment_refund', amount: appointment.price, description: `Reembolso de consulta cancelada (${appointment.professionalName})`, status: 'completed', createdAt: serverTimestamp() }`.
2. **Feedback ao Usuário:**
   - Exibir toast e modal informando que o valor foi creditado na carteira digital.

---

## 3. Critérios de Aceite
- [ ] O cancelamento atualiza o status do agendamento para cancelado.
- [ ] O saldo da carteira do paciente é incrementado exatamente com o valor pago.
- [ ] Uma transação de estorno é criada no extrato financeiro.
