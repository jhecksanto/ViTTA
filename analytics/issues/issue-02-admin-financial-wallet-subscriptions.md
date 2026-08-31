# Issue 02: Gestão Financeira Master, Carteiras e Planos de Assinatura
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Administração Master & Ecossistema  
**Páginas:** `admin-financial` (`AdminFinancialView`), `admin-wallet` (`AdminWalletManagementView`), `admin-subscriptions` (`SubscriptionManagementView`)

---

## 1. Escopo & Objetivos
Finalizar o fluxo de aprovação de saques Pix, registro de auditoria em ajustes manuais de saldo, bloqueio preventivo de carteiras e integridade na exclusão/cálculo de MRR de planos.

## 2. Tarefas Detalhadas
- [ ] **Aprovação de Saque Pix:** Modal para inserção de código de liquidação bancária, atualização do status da solicitação para `paid` e baixa definitiva do valor pendente.
- [ ] **Discriminação de Split:** Exibir colunas de valor bruto, taxa ViTTA retida e valor líquido repassado nas transações.
- [ ] **Auditoria de Ajuste de Saldo:** Exigir justificativa textual ao alterar saldo de usuário e gravar registro em `audit_logs`.
- [ ] **Congelamento Preventivo de Carteira:** Adicionar toggle `isWalletFrozen` no documento do usuário impedindo novas movimentações caso ativado.
- [ ] **Histórico do Usuário no Drawer:** Consulta das últimas transações do usuário selecionado dentro do modal de carteira.
- [ ] **Integridade de Planos:** Bloquear exclusão de planos com assinantes ativos vinculados e calcular MRR real baseado em usuários no Firestore.

## 3. Critérios de Aceite
- Ao aprovar um saque, o saldo pendente do profissional é zerado e uma notificação é enviada.
- Não é possível ajustar saldo sem preencher o motivo da alteração.
- Carteiras congeladas rejeitam transações de débito ou recarga com mensagem explicativa.
- O cálculo do MRR reflete exatamente os planos ativos dos usuários cadastrados.
