# Issue 07: Assinaturas - Sincronização de Vencimento e Controle de Acesso a Benefícios
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Assinaturas & Benefícios  
**Prioridade:** P1 (Alta)  
**Arquivos Alvo:** `src/components/Patient/SubscriptionsView.tsx`, `src/components/Patient/OffersView.tsx`, `src/components/Patient/ProfessionalsView.tsx`, `src/App.tsx`

---

## 1. Descrição e Contexto
O status do plano do usuário deve refletir rigorosamente o período de validade da assinatura (`currentPeriodEnd`). Caso a assinatura tenha expirado sem renovação, o sistema deve marcar o plano como inativo/expirado, desabilitar o resgate de vouchers no clube de benefícios e calcular os preços de consultas com os valores normais sem desconto.

---

## 2. Requisitos Técnicos
1. **Verificação de Vencimento no Boot:**
   - Na inicialização da sessão do usuário, comparar a data `currentPeriodEnd` com `new Date()`.
   - Se vencida e o status ainda for `active`, atualizar o documento do usuário no Firestore para `{ plan: 'free', 'subscription.status': 'expired' }`.
   - Exibir alerta amigável na tela de assinaturas incentivando a renovação do plano.
2. **Controle de Acesso em `OffersView` e `ProfessionalsView`:**
   - Em `OffersView.tsx`, caso o usuário não tenha plano ativo, desabilitar o botão `"Resgatar Voucher"` e exibir modal de convite para adesão a um plano ViTTA.
   - Em `ProfessionalsView.tsx`, aplicar os valores padrão aos serviços caso o plano esteja inativo.

---

## 3. Critérios de Aceite
- [ ] Usuários com assinaturas expiradas perdem temporariamente os benefícios de desconto até a renovação.
- [ ] A tela de ofertas impede a emissão indevida de vouchers por não-assinantes.
- [ ] Renovação de assinatura restabelece imediatamente os benefícios.
