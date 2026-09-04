# Relatório de Diagnóstico e Pendências de Finalização do Sistema ViTTA Health
**Data e Hora de Geração:** 04/09/2026 às 15:32 (Horário de Brasília - UTC-3)  
**Escopo:** Análise técnica minuciosa do ecossistema ViTTA Health, mapeando estritamente os fluxos, páginas e componentes já existentes que necessitam de finalização, consolidação e resolução de pendências operacionais (sem inserção de funcionalidades ou escopos novos).

---

## 1. Sumário Executivo do Sistema

A plataforma **ViTTA Health & Convênios** é uma solução full-stack construída em **React 18 + TypeScript + Vite + Tailwind CSS**, sustentada por **Firebase Firestore (com suporte a modo offline e wrappers de resiliência), Firebase Authentication e Firebase Storage**, além de servidor **Express / Node.js** com integrações para liquidação Pix e webhooks.

O sistema atende a 4 perfis de usuários integrados:
1. **Paciente / Assinante**: Agendamentos presenciais e por telemedicina, carteira digital (BRL e ViTTA Coins), clube de benefícios e vouchers com QR Code, histórico de exames laboratoriais e receitas médicas digitais.
2. **Profissional de Saúde (Médicos/Especialistas)**: Agenda configurável, sala virtual de teleconsulta integrada com prontuário SOAP, prescrição digital em PDF com assinatura/carimbo, e gestão de repasses financeiros.
3. **Profissional Liberal / Parceiro Conveniado**: Emissão e validação de vouchers via leitor de QR Code/câmera, configuração de ofertas/descontos e extrato de comissões.
4. **Administrador Master**: Governança global, auditoria de ações (audit logs), gestão de planos de assinatura, conciliação e liquidação bancária de saques Pix com código E2E, moderação de KYC e suporte via chat em tempo real.

O diagnóstico técnico revela que o núcleo arquitetural está amplamente construído. As pendências concentram-se na **finalização da amarração entre módulos, tratamento de estados intermediários, sincronização em tempo real e fechamento de ponta a ponta dos fluxos operacionais**.

---

## 2. Diagnóstico Detalhado por Módulo do Sistema

### 2.1. Módulo de Telemedicina & Sala Virtual
* **Arquivos e Componentes:** `src/components/TelemedicineRoom.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`, `src/components/Professional/PrescriptionModal.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/App.tsx`.
* **Status Atual:**
  - Sinalização WebRTC ponto a ponto funcional com canais de áudio/vídeo e controle de tracks.
  - Medidor de nível de áudio (VU Meter) e chat da sala em tempo real via Firestore subcollection.
  - Registro de prontuário SOAP integrado à consulta com salvamento de CID-10 e conduta médica.
  - Geração e download de receitas médicas digitais em PDF com QR Code de autenticação.
* **Pendências a Finalizar:**
  1. **Compartilhamento de Tela (`getDisplayMedia`):** Garantir a substituição contínua do track de vídeo no `RTCPeerConnection` (`replaceTrack`) durante a conferência e restauração imediata do feed da câmera ao interromper o compartilhamento.
  2. **Envio de Anexos no Chat da Teleconsulta:** Habilitar envio de arquivos/documentos complementares (imagens/PDFs de exames) diretamente no chat lateral da sala de telemedicina.
  3. **Encerramento Sincronizado da Sala:** No clique de "Encerrar Atendimento" pelo médico, propagar a atualização de `telemedicineStatus: 'closed'`, registrar `completedAt` e redirecionar automaticamente o paciente para a tela de avaliação da consulta.
  4. **Entrada Direta por URL (`/?room=ID`):** Garantir a inicialização direta da sala correta quando o link é acessado com limpeza limpa da URL via `history.replaceState`.
  5. **Visualização de Receitas no Histórico do Paciente:** Vincular o botão "Ver Receita" nos cards de consultas concluídas em `MyAppointmentsView.tsx` abrindo o `PatientPrescriptionModal`.

---

### 2.2. Módulo de Agendamentos & Agenda Profissional
* **Arquivos e Componentes:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Professional/ProfessionalAgendaSettingsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`, `src/App.tsx`.
* **Status Atual:**
  - Catálogo de profissionais com cálculo correto de preços normais e com desconto ViTTA.
  - Seleção de data/horário e bloqueios dinâmicos de agenda médica.
  - Visualização em abas filtradas de consultas agendadas, em andamento e concluídas.
* **Pendências a Finalizar:**
  1. **Normalização de Modalidade (`modality`):** Unificar a checagem entre `"telemedicine"`, `"telemedicina"` e `"online"` em todos os componentes para evitar inconsistência de renderização de botões de entrada na sala.
  2. **Consistência de Identificadores Duplos:** Padronizar a gravação de agendamentos contendo simultaneamente `userId`/`patientId` e `professionalUserId`/`professionalId` para garantir que nenhuma consulta deixe de ser listada por discrepância de chaves.
  3. **Estorno Automático no Cancelamento:** Ao cancelar consulta dentro das regras de tolerância, processar o reembolso automático no saldo da carteira do paciente com registro de transação do tipo `refund`.
  4. **Notificação em Tempo Real de Alteração de Status:** Disparar notificações in-app quando o agendamento tiver seu status alterado pelo profissional ou pelo administrador.

---

### 2.3. Módulo Financeiro, Conciliação de Saques & Carteira Digital
* **Arquivos e Componentes:** `src/components/Admin/AdminFinancialView.tsx`, `src/components/AdminWalletManagementView.tsx`, `src/components/Professional/ProfessionalFinanceView.tsx`, `src/components/Professional/PayoutReceiptModal.tsx`, `server.ts`.
* **Status Atual:**
  - Painel de conciliação administrativa com separação entre Saques Pendentes e Saques Liquidados/Recusados.
  - Fluxo de liquidação com código bancário E2E e recusa com estorno automático de saldo.
  - Carteira digital com saldo em BRL, ViTTA Coins e exportação de extrato em CSV.
* **Pendências a Finalizar:**
  1. **Validação Rigorosa de Chave Pix no Envio:** Adicionar validação de formato (CPF/CNPJ, E-mail, Telefone, Chave Aleatória EVP) antes de permitir a submissão de nova solicitação de saque pelo profissional.
  2. **Recibo de Liquidação para o Profissional:** Permitir que o profissional consulte o comprovante com o código de liquidação bancária informado pelo administrador diretamente no seu painel financeiro.
  3. **Sincronização de Transações Offline:** Garantir que lançamentos financeiros criados em modo offline sejam validados de forma idempotente ao reconectar, evitando duplicidade de débitos.

---

### 2.4. Módulo de Assinaturas & Planos ViTTA
* **Arquivos e Componentes:** `src/components/Admin/SubscriptionManagementView.tsx`, `src/components/Patient/SubscriptionsView.tsx`, `src/components/Patient/SubscriptionPlansView.tsx`, `server.ts`.
* **Status Atual:**
  - CRUD completo de planos de assinatura pelo Administrador Master.
  - Exibição comparativa de planos (Individual, Familiar, Premium) para o paciente.
  - Checkout integrado para adesão com split de benefícios.
* **Pendências a Finalizar:**
  1. **Sincronização de Status de Expiração:** Implementar verificação automática de vencimento da assinatura (`currentPeriodEnd`), atualizando o status do usuário para `expired` caso não haja renovação.
  2. **Bloqueio de Benefícios para Assinatura Inativa:** Assegurar que o desconto em consultas e acesso ao clube de vouchers fiquem suspensos enquanto a assinatura constar como inativa ou cancelada.
  3. **Cancelamento com Manutenção até o Fim do Ciclo:** Permitir o cancelamento da assinatura pelo paciente mantendo o acesso ativo até o término do ciclo já quitado (`cancelAtPeriodEnd: true`).

---

### 2.5. Módulo de Vouchers & Validação por QR Code
* **Arquivos e Componentes:** `src/components/Patient/VouchersView.tsx`, `src/components/Conveniado/VoucherValidationView.tsx`, `src/components/Admin/AdminVoucherManagementView.tsx`.
* **Status Atual:**
  - Geração de vouchers com código alfanumérico e QR Code dinâmico.
  - Painel do conveniado com input manual de código de validação e leitor por câmera.
  - Controle administrativo de vouchers emitidos e utilizados.
* **Pendências a Finalizar:**
  1. **Tratamento de Permissão da Câmera no Scanner:** Melhorar o fluxo de captura no `VoucherValidationView.tsx` com tratamento de erro amigável caso a câmera seja bloqueada pelo navegador/iframe e fallback imediato para digitação manual.
  2. **Validação Atômica contra Uso Duplo:** Assegurar que a validação do voucher utilize transação do Firestore (`runTransaction`) para impedir que o mesmo voucher seja resgatado duas vezes em cliques simultâneos.
  3. **Comprovante de Resgate do Conveniado:** Exibir modal de confirmação de validação com resumo da oferta e valor do desconto concedido após o escaneamento com sucesso.

---

### 2.6. Módulo de Exames & Laudos Laboratoriais
* **Arquivos e Componentes:** `src/components/Patient/PatientExamsView.tsx`, `src/components/Professional/PatientDetailsModal.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`.
* **Status Atual:**
  - Catálogo de exames com consulta de orientações e preparação laboratorial.
  - Upload de arquivos de exames realizados pelo paciente com visualização em modal.
* **Pendências a Finalizar:**
  1. **Visualização de Exames no Atendimento SOAP:** Permitir que o médico visualize o histórico de exames anexados pelo paciente diretamente na aba lateral do prontuário durante a teleconsulta.
  2. **Progresso de Upload e Validação de Formatos:** Adicionar barra de progresso visual no upload de arquivos de exames (PDF, PNG, JPEG) e validação de tamanho máximo (até 15MB).

---

### 2.7. Módulo de Suporte & Chat Administrativo
* **Arquivos e Componentes:** `src/components/SupportChat.tsx`, `src/components/Admin/AdminSupportView.tsx`, `src/App.tsx`.
* **Status Atual:**
  - Central de suporte com canais abertos entre paciente/profissional e equipe de atendimento.
  - Notificações de mensagens não lidas e visualização de atendimentos ativos pelo administrador.
* **Pendências a Finalizar:**
  1. **Auto-Scroll Suave em Novas Mensagens:** Garantir que a rolagem do container de chat desça suavemente para a última mensagem recebida em ambas as pontas.
  2. **Contador de Mensagens Não Lidas em Tempo Real:** Atualizar dinamicamente o badge de suporte no header/menu do administrador ao receber nova mensagem com o chat fechado.
  3. **Encerramento Formal de Chamado de Suporte:** Permitir que o administrador encerre o ticket com envio de mensagem automática de conclusão e coleta de nota de satisfação (1 a 5 estrelas).

---

### 2.8. Módulo de Segurança, KYC & Resiliência Offline
* **Arquivos e Componentes:** `src/components/KYCWizard.tsx`, `src/components/Admin/AdminKYCModerationView.tsx`, `src/components/SecuritySettingsModal.tsx`, `src/lib/offlineQueue.ts`, `src/lib/firestore-wrappers.ts`.
* **Status Atual:**
  - Fluxo de envio de documentos de identidade e selfie (KYC).
  - Painel administrativo de moderação e aprovação/rejeição de verificação de identidade.
  - Fila de sincronização offline (`offlineQueue`) para persistência local durante quedas de conexão.
* **Pendências a Finalizar:**
  1. **Cooldown e Tratamento de Erros no 2FA:** Adicionar temporizador de reenvio de código SMS/E-mail (60 segundos) nas configurações de segurança em duas etapas para evitar múltiplos disparos.
  2. **Notificação Imediata de Resultado de KYC:** Ao aprovar ou rejeitar o KYC no painel administrativo, gravar notificação no Firestore para o usuário informando o status e, em caso de recusa, o motivo detalhado.
  3. **Disparo Automático da Fila Offline no Evento `online`:** Garantir que o listener de conectividade (`window.addEventListener('online', ...)`) processe imediatamente os itens enfileirados sem necessidade de recarregar a página.

---

## 3. Matriz de Priorização Técnica

| Prioridade | Módulo | Foco Principal | Impacto Operacional |
| :--- | :--- | :--- | :--- |
| **P0 - Crítica** | Telemedicina & Receitas | Tela compartilhada, encerramento sincronizado e download de receitas pelo paciente | Integridade da consulta médica |
| **P0 - Crítica** | Agendamentos | Normalização de modalidade e persistência de IDs duplos | Prevenção de erros em listagens e salas |
| **P1 - Alta** | Vouchers & Scanner | Validação atômica anti-duplicidade e tratamento de permissão de câmera | Confiabilidade do parceiro conveniado |
| **P1 - Alta** | Financeiro & Pix | Validação rigorosa de chave Pix e consulta de comprovante pelo profissional | Segurança e transparência financeira |
| **P1 - Alta** | Assinaturas & Planos | Sincronização de vencimento de ciclo e bloqueio de benefícios vencidos | Gestão de receita recorrente |
| **P2 - Média** | Exames & Suporte | Exames no SOAP, auto-scroll do chat e contadores em tempo real | Usabilidade clínica e de suporte |
| **P2 - Média** | KYC & Offline Queue | Cooldown de 2FA e auto-sync de ações offline | Resiliência e segurança de acesso |
