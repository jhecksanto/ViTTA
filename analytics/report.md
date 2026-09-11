# Relatório Geral de Diagnóstico e Pendências de Finalização do Sistema ViTTA Health
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Status do Ecossistema:** Em Produção / Ajustes e Finalizações de Módulos Existentes  
**Diretriz:** Levantamento estritamente focado no fechamento de fluxos, amarração de ponta a ponta e refinamento dos módulos já implementados, sem inclusão de novos escopos ou arquiteturas não solicitadas.

---

## 1. Visão Geral da Arquitetura e Estado Atual

A plataforma **ViTTA Health & Convênios** opera sobre uma arquitetura **React 18 + TypeScript + Vite + Tailwind CSS**, integrando **Firebase Firestore (com persistência e suporte a operações offline), Firebase Authentication, Firebase Storage** e servidor backend **Express / Node.js** para liquidações Pix e automações.

O sistema atende a 4 perfis operacionais integrados:
1. **Paciente / Assinante:** Agendamento de consultas presenciais e online (Telemedicina), prontuário e histórico de exames/laudos, download de receitas médicas digitais com QR Code de autenticação, carteira digital (BRL e ViTTA Coins), clube de benefícios/vouchers de parceiros e acesso à Rádio ViTTA FM.
2. **Profissional de Saúde (Médicos e Especialistas):** Configuração de agenda e bloqueio de horários, sala de teleconsulta com sinalização WebRTC, prontuário eletrônico SOAP integrado com CID-10, emissor de receitas médicas digitais, acompanhamento de histórico biométrico e painel financeiro de repasses.
3. **Profissional Liberal / Conveniado:** Gestão de ofertas e catálogo de benefícios, leitor de QR Code para validação atômica de vouchers, extrato de comissões e acompanhamento de parceiros.
4. **Administrador Master:** Governança geral de usuários, moderação de documentos KYC, gestão de planos de assinatura, aprovação e conciliação bancária de saques Pix com código E2E, gestão de vouchers, logs de auditoria e atendimento ao cliente via suporte integrado.

---

## 2. Diagnóstico Detalhado por Módulo Existente

### 2.1. Telemedicina & Sala Virtual de Consulta
* **Componentes Envolvidos:** `src/components/TelemedicineRoom.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`, `src/components/Professional/PrescriptionModal.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`, `src/components/Patient/MyAppointmentsView.tsx`.
* **Estado Atual:**
  - Sinalização ponto a ponto WebRTC implementada para áudio e vídeo com troca de SDP e ICE Candidates via Firestore.
  - Painel de anotações médicas SOAP integrado ao atendimento clínico.
  - Geração de receita médica digital com download em PDF.
* **O Que Falta Terminar / Refinar:**
  1. **Compartilhamento de Tela (`getDisplayMedia`):** Garantir o envio correto do track de vídeo para a conexão WebRTC (`replaceTrack`) durante a conferência e o restabelecimento imediato da câmera quando o compartilhamento for pausado ou cancelado.
  2. **Envio de Anexos no Chat da Teleconsulta:** Habilitar envio de arquivos/documentos complementares (imagens/PDFs de exames) diretamente no chat lateral da sala de telemedicina.
  3. **Encerramento Sincronizado da Sala:** Ao clicar em "Encerrar Atendimento", atualizar o documento no Firestore para `telemedicineStatus: 'closed'`, registrar o carimbo de data/hora (`completedAt`) e redirecionar automaticamente o paciente para a avaliação de atendimento (`ReviewModal`).
  4. **Entrada Direta por URL (`/?room=ID`):** Garantir a inicialização direta da sala correta quando o link é acessado externamente com limpeza limpa da URL via `history.replaceState`.
  5. **Visualização de Receitas no Histórico do Paciente:** Vincular o botão "Ver Receita" nos cards de consultas concluídas em `MyAppointmentsView.tsx` abrindo o `PatientPrescriptionModal`.

---

### 2.2. Agendamentos & Agenda Profissional
* **Componentes Envolvidos:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Professional/ProfessionalAgendaSettingsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`, `src/App.tsx`.
* **Estado Atual:**
  - Listagem de profissionais com busca, especialidades e cálculo de valores (com e sem desconto de assinante).
  - Seleção de datas e horários disponíveis com bloqueio de datas na agenda.
* **O Que Falta Terminar / Refinar:**
  1. **Normalização de Modalidade (`modality`):** Unificar a checagem entre `"telemedicine"`, `"telemedicina"` e `"online"` em todos os componentes para evitar inconsistência de renderização de botões de entrada na sala.
  2. **Consistência de Identificadores Duplos:** Padronizar a gravação de agendamentos contendo simultaneamente `userId`/`patientId` e `professionalUserId`/`professionalId` para garantir que nenhuma consulta deixe de ser listada por discrepância de chaves.
  3. **Estorno Automático no Cancelamento:** Ao cancelar consulta dentro das regras de tolerância, processar o reembolso automático no saldo da carteira do paciente com registro de transação do tipo `refund`.
  4. **Notificação em Tempo Real de Alteração de Status:** Disparar notificações in-app quando o agendamento tiver seu status alterado pelo profissional ou pelo administrador.

---

### 2.3. Financeiro, Conciliação Pix & Carteira Digital
* **Componentes Envolvidos:** `src/components/Admin/AdminFinancialView.tsx`, `src/components/AdminWalletManagementView.tsx`, `src/components/Professional/ProfessionalFinanceView.tsx`, `src/components/Professional/PayoutReceiptModal.tsx`, `server.ts`.
* **Estado Atual:**
  - Painel de conciliação de saques com aprovação/rejeição e estorno em caso de recusa.
  - Extrato financeiro com saldo em BRL e ViTTA Coins.
* **O Que Falta Terminar / Refinar:**
  1. **Validação Rigorosa de Chave Pix no Envio:** Adicionar validação de formato (CPF/CNPJ, E-mail, Telefone, Chave Aleatória EVP) antes de permitir a submissão de nova solicitação de saque pelo profissional.
  2. **Recibo de Liquidação para o Profissional:** Permitir que o profissional consulte o comprovante com o código de liquidação bancária informado pelo administrador diretamente no seu painel financeiro.
  3. **Sincronização de Transações Offline:** Garantir que lançamentos financeiros criados em modo offline sejam validados de forma idempotente ao reconectar, evitando duplicidade de débitos.

---

### 2.4. Assinaturas & Planos ViTTA
* **Componentes Envolvidos:** `src/components/Admin/SubscriptionManagementView.tsx`, `src/components/Patient/SubscriptionsView.tsx`, `src/components/Patient/SubscriptionPlansView.tsx`, `server.ts`.
* **Estado Atual:**
  - Catálogo de planos com benefícios, preços e checkout integrado.
  - Gestão administrativa de planos.
* **O Que Falta Terminar / Refinar:**
  1. **Sincronização de Status de Expiração:** Implementar verificação automática de vencimento da assinatura (`currentPeriodEnd`), atualizando o status do usuário para `expired` caso não haja renovação.
  2. **Bloqueio de Benefícios para Assinatura Inativa:** Assegurar que o desconto em consultas e acesso ao clube de vouchers fiquem suspensos enquanto a assinatura constar como inativa ou cancelada.
  3. **Cancelamento com Manutenção até o Fim do Ciclo:** Permitir o cancelamento da assinatura pelo paciente mantendo o acesso ativo até o término do ciclo já quitado (`cancelAtPeriodEnd: true`).

---

### 2.5. Vouchers, Clube de Benefícios & Validação por QR Code
* **Componentes Envolvidos:** `src/components/Patient/OffersView.tsx`, `src/components/Admin/VoucherValidationView.tsx`, `src/components/Admin/AdminVoucherManagementView.tsx`.
* **Estado Atual:**
  - Emissão de vouchers de desconto para assinantes com QR Code.
  - Validação manual de código alfanumérico e leitura por câmera pelo parceiro.
* **O Que Falta Terminar / Refinar:**
  1. **Tratamento de Permissão da Câmera no Scanner:** Melhorar o fluxo de captura no `VoucherValidationView.tsx` com tratamento de erro amigável caso a câmera seja bloqueada pelo navegador/iframe e fallback imediato para digitação manual.
  2. **Validação Atômica contra Uso Duplo:** Assegurar que a validação do voucher utilize transação do Firestore (`runTransaction`) para impedir que o mesmo voucher seja resgatado duas vezes em cliques simultâneos.
  3. **Comprovante de Resgate do Conveniado:** Exibir modal de confirmação de validação com resumo da oferta e valor do desconto concedido após o escaneamento com sucesso.

---

### 2.6. Exames & Laudos Laboratoriais
* **Componentes Envolvidos:** `src/components/Patient/ExamsView.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`.
* **Estado Atual:**
  - Consulta de catálogo de exames e orientações de preparo.
  - Upload de arquivos de exames e visualização em modal.
* **O Que Falta Terminar / Refinar:**
  1. **Visualização de Exames no Atendimento SOAP:** Permitir que o médico visualize o histórico de exames anexados pelo paciente diretamente na aba lateral do prontuário durante a teleconsulta.
  2. **Progresso de Upload e Validação de Formatos:** Adicionar barra de progresso visual no upload de arquivos de exames (PDF, PNG, JPEG) e validação de tamanho máximo (até 15MB).

---

### 2.7. Suporte & Chat em Tempo Real
* **Componentes Envolvidos:** `src/components/SupportChat.tsx`, `src/components/Admin/AdminSupportChatView.tsx`, `src/App.tsx`.
* **Estado Atual:**
  - Chat entre usuário e suporte com subcoleções no Firestore.
  - Notificação de novas mensagens.
* **O Que Falta Terminar / Refinar:**
  1. **Auto-Scroll Suave em Novas Mensagens:** Garantir que a rolagem do container de chat desça suavemente para a última mensagem recebida em ambas as pontas.
  2. **Contador de Mensagens Não Lidas em Tempo Real:** Atualizar dinamicamente o badge de suporte no header/menu do administrador ao receber nova mensagem com o chat fechado.
  3. **Encerramento Formal de Chamado de Suporte:** Permitir que o administrador encerre o ticket com envio de mensagem automática de conclusão e coleta de nota de satisfação (1 a 5 estrelas).

---

### 2.8. Segurança, KYC & Resiliência Offline
* **Componentes Envolvidos:** `src/components/KYCWizard.tsx`, `src/components/Admin/AdminKYCModerationView.tsx`, `src/components/TwoFactorModal.tsx`, `src/lib/offlineQueue.ts`, `src/lib/firestore-wrappers.ts`.
* **Estado Atual:**
  - Fluxo de envio de documentos de identidade e selfie (KYC).
  - Painel administrativo de moderação e aprovação/rejeição de verificação de identidade.
  - Fila de sincronização offline (`offlineQueue`) para persistência local durante quedas de conexão.
* **O Que Falta Terminar / Refinar:**
  1. **Cooldown e Tratamento de Erros no 2FA:** Adicionar temporizador de reenvio de código SMS/E-mail (60 segundos) nas configurações de segurança em duas etapas para evitar múltiplos disparos.
  2. **Notificação Imediata de Resultado de KYC:** Ao aprovar ou rejeitar o KYC no painel administrativo, gravar notificação no Firestore para o usuário informando o status e, em caso de recusa, o motivo detalhado.
  3. **Disparo Automático da Fila Offline no Evento `online`:** Garantir que o listener de conectividade (`window.addEventListener('online', ...)`) processe imediatamente os itens enfileirados sem necessidade de recarregar a página.

---

## 3. Conclusão do Diagnóstico

O sistema possui uma base sólida e ampla cobertura funcional. A finalização concentrada nestas 8 áreas garantirá a robustez operacional de ponta a ponta, sem regressões ou inconsistências de dados.
