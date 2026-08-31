# Especificação Técnica de Finalização - ViTTA Convênios (`Spec.md`)
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Documento Base:** `analytics/report.md`  
**Objetivo:** Especificar tecnicamente apenas as pendências de implementação e finalização dos fluxos do Menu Lateral (páginas, comportamentos, componentes e contratos de dados), sem adicionar novas funcionalidades não solicitadas.

---

## 1. Módulo de Administração Master & Ecossistema

### 1.1 Painel Geral ViTTA (`admin` / `AdminView`)
* **Componentes Envolvidos:** `AdminView`, `PartnershipManagerModal`, `ProfessionalApprovalModal`, `ConfirmationModal`.
* **Comportamentos a Implementar:**
  1. **Desativação Segura de Estabelecimentos:**
     - Ao clicar em "Desativar Parceiro", acionar `ConfirmationModal` exibindo a contagem de vouchers ativos vinculados.
     - Executar batch no Firestore alterando o status do parceiro para `inactive` e cancelando vouchers não resgatados.
  2. **Aprovação/Rejeição de Profissionais (KYC):**
     - Na validação de documentos, atualizar `kycStatus: "approved" | "rejected"` em `users/{uid}`.
     - Criar documento em `notifications/{notifId}` para o profissional informando o resultado da análise cadastral.
     - Gravar registro em `audit_logs` com categoria `kyc_approval`.
  3. **Exportação de Usuários e Parceiros:**
     - Função utilitária para gerar e baixar arquivo CSV estruturado com colunas: `Nome, E-mail, Papel, CPF, Telefone, Status KYC, Saldo Carteira, Data Criação`.

### 1.2 Analytics ViTTA (`admin-analytics` / `AnalyticsView`)
* **Componentes Envolvidos:** `AdminAnalytics`, `DateRangeFilter`, `StatsMetricCard`.
* **Comportamentos a Implementar:**
  1. **Filtro de Intervalo Temporal:**
     - Estados de filtro: `today` (Hoje), `7d` (Últimos 7 dias), `30d` (Últimos 30 dias), `month` (Mês Atual), `custom` (Data Inicial e Final).
     - Aplicar constraints `where("createdAt", ">=", startTimestamp)` e `where("createdAt", "<=", endTimestamp)` nas coleções `transactions` e `appointments`.
  2. **Cálculo de Conversão:**
     - Métricas computadas: `Taxa de Conclusão = (Consultas Concluídas / Total de Consultas) * 100`.
     - `Taxa de Cancelamento = (Consultas Canceladas / Total de Consultas) * 100`.
  3. **Skeleton Loading:**
     - Exibir blocos com pulsação visual enquanto os agregados do Firestore são processados.

### 1.3 Consultas Globais (`admin-appointments` / `AdminAppointmentsView`)
* **Componentes Envolvidos:** `AdminAppointmentsView`, `AdminRescheduleModal`, `AdminCancelAppointmentModal`.
* **Comportamentos a Implementar:**
  1. **Reagendamento Administrativo:**
     - Modal com seleção de nova data e horário livre na agenda do médico.
     - Atualização atômica em `appointments/{aptId}` com `date`, `time`, `updatedAt`, `rescheduledBy: "admin"`.
     - Criação de notificações automáticas para o paciente e o profissional.
  2. **Cancelamento com Estorno de ViTTA Coins:**
     - Campo obrigatório de texto `justificativa`.
     - Se `paymentMethod === "vitta_coins" || paymentMethod === "wallet"`, executar transação Firestore incrementando o saldo do paciente em `users/{patientId}.walletBalance` e criando registro de estorno em `transactions`.
  3. **Busca Textual Combinada:**
     - Filtro local em tempo real por `patientName`, `professionalName`, `professionalCrm` e `appointmentId`.

### 1.4 Gestão de Carteiras & Saldos (`admin-wallet` / `AdminWalletManagementView`)
* **Componentes Envolvidos:** `AdminWalletManagementView`, `WalletAdjustModal`, `UserWalletHistoryDrawer`.
* **Comportamentos a Implementar:**
  1. **Auditoria de Ajuste Manual:**
     - Ao adicionar ou debitar saldo, exigir campo `motivo`.
     - Gravar em `audit_logs`: `{ action: "manual_balance_adjustment", adminId, targetUserId, amount, previousBalance, newBalance, reason, timestamp }`.
  2. **Congelamento Preventivo:**
     - Adicionar toggle `isWalletFrozen: boolean` no documento do usuário, bloqueando pagamentos ou saques imediatos se ativado.
  3. **Histórico do Usuário no Drawer:**
     - Consulta de `transactions` filtrada por `userId == targetUserId` ordenada por `date desc` limitada a 10 registros.

### 1.5 Planos de Assinatura (`admin-subscriptions` / `SubscriptionManagementView`)
* **Componentes Envolvidos:** `SubscriptionManagementView`, `PlanFormModal`, `PlanMembersModal`.
* **Comportamentos a Implementar:**
  1. **Validação de Exclusão de Planos:**
     - Antes de excluir um plano, verificar se existem documentos em `users` com `planId == currentPlanId`. Se houver, impedir a exclusão e orientar a desativação ou migração.
  2. **Cálculo de MRR (Receita Recorrente Mensal):**
     - `MRR = Soma(Preço do Plano * Quantidade de Assinantes Ativos)`.
  3. **Drawer de Assinantes:**
     - Exibir lista de usuários ativos vinculados ao plano com nome, CPF, data de adesão e status de pagamento.

### 1.6 Gestão Financeira & Split (`admin-financial` / `AdminFinancialView`)
* **Componentes Envolvidos:** `AdminFinancialView`, `PayoutApprovalModal`, `ReceiptModal`.
* **Comportamentos a Implementar:**
  1. **Aprovação de Saque Pix com Comprovante:**
     - Modal de confirmação com inserção do código de autenticação bancária ou upload de comprovante em PDF/imagem.
     - Atualização do status da solicitação para `paid` e baixa definitiva do valor pendente no usuário.
  2. **Discriminação Visual do Split:**
     - Colunas na tabela financeira: `Valor Bruto`, `Taxa ViTTA (R$ e %)`, `Repasse Líquido`, `Status do Split`.
  3. **Filtro de Tipos de Transação:**
     - Segmentação por abas ou dropdown: `Todas`, `Consultas`, `Recargas`, `Mensalidades`, `Saques`, `Estornos`.

### 1.7 Gestão de Vouchers (`admin-vouchers` / `AdminVoucherManagementView`)
* **Componentes Envolvidos:** `AdminVoucherManagementView`, `VoucherScannerModal`, `VoucherStatsCard`.
* **Comportamentos a Implementar:**
  1. **Scanner e Baixa Manual:**
     - Campo de busca para digitar código alfanumérico (ex: `VITTA-SAOJOAO-10`) ou leitor de QR Code.
     - Ao validar, verificar se `status === "active"`, se a data de validade é `>= hoje` e alterar para `status: "redeemed"`, preenchendo `redeemedAt` e `redeemedBy`.
  2. **Controle de Resgate Único:**
     - Impedir resgate duplicado por um mesmo CPF caso a regra do cupom seja `one_per_user`.

### 1.8 Configurações de Liberais & Taxas (`admin-liberal-config` / `AdminLiberalConfigView`)
* **Componentes Envolvidos:** `AdminLiberalConfigView`, `SplitSimulatorCard`.
* **Comportamentos a Implementar:**
  1. **Simulador Interativo de Split:**
     - Inputs para valor simulado de consulta (ex: R$ 150,00) exibindo em tempo real: valor retido pela ViTTA e valor líquido recebido pelo médico conforme a especialidade selecionada.
  2. **Histórico de Alterações de Taxas:**
     - Gravar em `system_configs/liberal_rates_history` cada modificação de taxa percentual.

### 1.9 Auditoria & Logs de Segurança (`admin-audit` / `AuditLogsList`)
* **Componentes Envolvidos:** `AuditLogsList`, `LogDetailDrawer`, `ExportAuditButton`.
* **Comportamentos a Implementar:**
  1. **Drawer de Inspeção de Payload:**
     - Renderizador de JSON formatado com sintaxe destacada mostrando os campos alterados.
  2. **Exportação de Logs:**
     - Exportação dos logs filtrados para arquivo JSON/CSV estruturado para compliance.

### 1.10 Central de Atendimento Admin (`admin-chat` / `AdminSupportChatView`)
* **Componentes Envolvidos:** `AdminSupportChatView`, `TicketResolutionModal`, `QuickRepliesDropdown`.
* **Comportamentos a Implementar:**
  1. **Encerramento de Ticket de Atendimento:**
     - Botão "Encerrar Atendimento" que altera o status do chamado para `resolved` e envia mensagem automática de finalização no chat.
  2. **Templates de Respostas Rápidas:**
     - Menu com opções: "Boas-vindas", "Instruções de Agendamento", "Dúvidas sobre Carteira", "Envio de Exames".

---

## 2. Módulo Clínico & Médico

### 2.1 Dashboard Clínico (`professional-dashboard` / `ProfessionalDashboardView`)
* **Componentes Envolvidos:** `ProfessionalDashboardView`, `PrescriptionGeneratorModal`, `PatientBiometricsSummary`.
* **Comportamentos a Implementar:**
  1. **Prescrição Médica e Atestado em PDF:**
     - Modal com formulário de Receita / Atestado / Pedido de Exames.
     - Impressão formatada via `window.print()` / layout CSS `@media print` contendo: cabeçalho com nome do médico, especialidade, CRM/UF, dados do paciente, data e prescrição clara.
  2. **Conclusão Formal de Consulta:**
     - Botão "Finalizar Consulta" que:
       - Altera status do agendamento para `completed`.
       - Salva evolução médica no prontuário eletrônico (`patient_records`).
       - Credita automaticamente o valor líquido da consulta no saldo da carteira do médico (`users/{medicoId}.walletBalance`).
  3. **Visualizador de Histórico Biométrico:**
     - Card lateral na consulta exibindo os últimos registros de peso, IMC, pressão arterial e exames anteriores do paciente.

### 2.2 Minha Agenda & Horários (`professional-agenda` / Agenda View)
* **Componentes Envolvidos:** `ProfessionalAgendaView`, `BlockTimeSlotModal`, `SlotDurationConfig`.
* **Comportamentos a Implementar:**
  1. **Bloqueio de Horários e Ausências:**
     - Modal para selecionar data e período a ser bloqueado.
     - Verificar se há consultas agendadas no período e solicitar confirmação com aviso de reagendamento.
     - Salvar bloqueio na coleção `professional_schedules/{scheduleId}` com `status: "blocked"`.
  2. **Configuração de Intervalos de Consulta:**
     - Opções de 15, 30, 45 ou 60 minutos por atendimento.
     - Recalcular dinamicamente a grade de slots disponíveis para o paciente.

### 2.3 Finanças & Repasses Médicos (`professional-finance` / `ProfessionalFinanceView`)
* **Componentes Envolvidos:** `ProfessionalFinanceView`, `PayoutRequestModal`, `PayoutReceiptModal`.
* **Comportamentos a Implementar:**
  1. **Validação de Chave Pix:**
     - Validação de formato para CPF (`000.000.000-00`), CNPJ (`00.000.000/0000-00`), E-mail, Telefone celular (`+55...`) ou Chave EVP aleatória.
     - Impedir envio de solicitação caso o saldo solicitado seja superior ao saldo disponível.
  2. **Extrato Detalhado por Atendimento:**
     - Listagem de consultas pagas com discriminação de data, paciente, valor bruto e repasse líquido.

---

## 3. Módulo Paciente & Benefícios

### 3.1 Início & Feed ViTTA (`home` / `HomeView`)
* **Componentes Envolvidos:** `HomeView`, `NextAppointmentBanner`, `SpecialtyQuickFilter`.
* **Comportamentos a Implementar:**
  1. **Banner de Próxima Consulta:**
     - Se o paciente tiver consulta agendada para as próximas 48h, exibir card em destaque com botão direto para "Acessar Telemedicina" ou "Ver no Mapa".
  2. **Filtro Rápido por Especialidade:**
     - Ao clicar no chip de uma especialidade (ex: "Cardiologia", "Dermatologia"), redirecionar para `professionals` com o filtro já selecionado.

### 3.2 Meu Painel de Saúde (`patient-dashboard` / `PatientDashboardView`)
* **Componentes Envolvidos:** `PatientDashboardView`, `PatientCancelModal`, `DigitalCardModal`, `ReviewModal`.
* **Comportamentos a Implementar:**
  1. **Cancelamento Autônomo com Estorno:**
     - Permitir cancelamento pelo paciente com até 2h de antecedência.
     - Estornar créditos de ViTTA Coins imediatamente no saldo da carteira caso a consulta tenha sido pré-paga.
  2. **Carteirinha Digital com QR Code de Validação:**
     - Visualização da carteirinha do titular e dependentes com QR Code contendo `uid`, `planId`, `cpf` e `validade`.
  3. **Disparo de Avaliação Pós-Consulta:**
     - Abrir `ReviewModal` se existir consulta concluída nos últimos 7 dias sem avaliação correspondente em `reviews`.

### 3.3 Profissionais & Especialistas (`professionals` / `ProfessionalsView`)
* **Componentes Envolvidos:** `ProfessionalsView`, `BookingModal`, `GoogleCalendarSyncButton`.
* **Comportamentos a Implementar:**
  1. **Filtros Combinados:**
     - Busca simultânea por nome, especialidade, cidade e modalidade (Presencial / Online).
  2. **Pagamento com Débito de Carteira:**
     - Verificar saldo de ViTTA Coins antes de confirmar agendamento. Se insuficiente, exibir aviso com botão de recarga imediata.
  3. **Sincronização com Google Calendar:**
     - Botão "Adicionar ao Google Agenda" gerando link universal do Google Calendar com data, hora, descrição e link de telemedicina.

### 3.4 Rede Credenciada & Parceiros (`partners` / `PartnersView`)
* **Componentes Envolvidos:** `PartnersView`, `PartnerCard`, `PartnerDetailsModal`.
* **Comportamentos a Implementar:**
  1. **Filtro por Categorias de Parceiros:**
     - Abas/chips: `Todas`, `Farmácias`, `Laboratórios`, `Clínicas Odontológicas`, `Academias`, `Óticas`.
  2. **Atalhos de Contato e Rota:**
     - Botão "Como Chegar" abrindo rota no Google Maps.
     - Botão "Falar no WhatsApp" abrindo `https://wa.me/55...` com mensagem pré-formatada.

### 3.5 Ofertas & Descontos Exclusivos (`offers` / `OffersView`)
* **Componentes Envolvidos:** `OffersView`, `VoucherDisplayModal`, `VoucherShareButton`.
* **Comportamentos a Implementar:**
  1. **Visualizador de Voucher Resgatado:**
     - Modal em tela cheia com código alfanumérico em fonte display grande, código de barras/QR Code e prazo de validade para apresentação presencial no caixa do estabelecimento parceiro.
  2. **Arquivamento de Vouchers:**
     - Opção de ocultar/arquivar vouchers resgatados que já foram utilizados.

### 3.6 Central de Exames & Laudos (`exams` / `ExamsView`)
* **Componentes Envolvidos:** `ExamsView`, `ExamViewerModal`, `UploadExamModal`.
* **Comportamentos a Implementar:**
  1. **Visualizador Integrado de Laudos:**
     - Modal para visualização direta de arquivos PDF e imagens de exames sem necessidade de download externo.
  2. **Filtro por Status do Exame:**
     - Segmentação por: `Todos`, `Laudo Pronto`, `Aguardando Coleta`, `Em Análise`.

---

## 4. Módulo de Comunicação & Sistema

### 4.1 Configurações da Conta (`settings` / Settings View)
* **Componentes Envolvidos:** `SettingsView`, `ChangePasswordModal`, `AddressAutocomplete`.
* **Comportamentos a Implementar:**
  1. **Alteração de Senha no Firebase Auth:**
     - Fluxo com reautenticação do usuário (senha atual) e definição de nova senha segura.
  2. **Preferências de Notificação:**
     - Toggles para E-mail, WhatsApp e Notificações no Navegador salvos em `users/{uid}.notificationPreferences`.
  3. **Autopreenchimento de Endereço via CEP:**
     - Integração com a API do ViaCEP preenchendo automaticamente Logradouro, Bairro, Cidade e UF.

### 4.2 Central de Notificações (`notifications` / Notifications View)
* **Componentes Envolvidos:** `NotificationCenter`, `NotificationsListView`.
* **Comportamentos a Implementar:**
  1. **Ações em Lote e Exclusão:**
     - Botão "Marcar todas como lidas" atualizando `read: true` em todos os documentos do usuário.
     - Botão para excluir notificação individual.
  2. **Deep Linking:**
     - Redirecionamento correto da aba ativa conforme o `type` da notificação (`appointment` -> `patient-dashboard` ou `professional-dashboard`, `wallet` -> `patient-dashboard`, etc.).

### 4.3 Mensagens & Chat (`chat` / `ChatView`)
* **Componentes Envolvidos:** `ChatView`, `ChatMessageBubble`, `ChatInputBar`.
* **Comportamentos a Implementar:**
  1. **Envio por Teclado:**
     - Envio da mensagem ao pressionar `Enter` (sem `Shift`) e salto de linha com `Shift + Enter`.
  2. **Indicadores de Status:**
     - Ícones de status na mensagem: relógio (enviando), check simples (enviada), check duplo (lida).

### 4.4 Central de Suporte & FAQ (`support` / `SupportView`)
* **Componentes Envolvidos:** `SupportView`, `FaqSearchInput`, `OpenTicketButton`.
* **Comportamentos a Implementar:**
  1. **Busca Dinâmica no FAQ:**
     - Campo de busca que filtra as perguntas e respostas do accordion em tempo real.
  2. **Atalho para o Chat:**
     - Botão "Falar com Atendente" redirecionando imediatamente para a aba `chat`.

### 4.5 Termos & Privacidade (`terms` / `TermsAndPrivacyView`)
* **Componentes Envolvidos:** `TermsAndPrivacyView`, `LgpdRequestModal`, `PrintTermsButton`.
* **Comportamentos a Implementar:**
  1. **Formulário de Direitos do Titular (LGPD):**
     - Modal para registrar pedido de exportação ou exclusão de dados pessoais gravado em `lgpd_requests`.
  2. **Impressão Formatada:**
     - Botão para acionar impressão limpa e estilizada dos termos de uso.
