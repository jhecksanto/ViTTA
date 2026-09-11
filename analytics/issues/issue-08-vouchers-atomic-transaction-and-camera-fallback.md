# Issue 08: Vouchers - Validação Atômica no Firestore e Fallback de Câmera
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Vouchers & Scanner de QR Code  
**Prioridade:** P1 (Alta)  
**Arquivos Alvo:** `src/components/Admin/VoucherValidationView.tsx`

---

## 1. Descrição e Contexto
No painel do conveniado e do administrador (`VoucherValidationView.tsx`), a validação de vouchers por QR Code ou digitação manual deve ser protegida contra resgate duplo simultâneo (concorrência de cliques) através de transações atômicas no Firestore. Adicionalmente, caso o navegador do parceiro restrinja o acesso à câmera por permissões de iframe, o leitor de QR Code deve apresentar mensagem clara e posicionar o foco no campo de digitação manual do código.

---

## 2. Requisitos Técnicos
1. **Transação Atômica de Validação (`runTransaction`):**
   - Executar `runTransaction` lendo o documento `vouchers/{voucherCode}`.
   - Conferir se `voucher.status === 'active'`. Se for `'used'`, abortar a transação e exibir mensagem: `"Voucher já utilizado em DD/MM/AAAA às HH:mm"`.
   - Se ativo, atualizar para:
     ```typescript
     {
       status: 'used',
       usedAt: serverTimestamp(),
       validatedBy: currentUser.uid,
       validatedByName: currentUser.displayName,
       partnerId: partner.id
     }
     ```
2. **Fallback de Câmera:**
   - Tratar erros no `getUserMedia` (`NotAllowedError`, `SecurityError`, etc.) com feedback amigável sem quebrar o componente.
   - Focar automaticamente no input de texto de código alfanumérico.

---

## 3. Critérios de Aceite
- [ ] O mesmo voucher não pode ser validado duas vezes sob nenhuma circunstância.
- [ ] Em caso de falha de permissão de câmera, o sistema orienta o usuário e permite validação manual instantânea.
- [ ] Modal de sucesso exibe o resumo do desconto e dados da oferta.
