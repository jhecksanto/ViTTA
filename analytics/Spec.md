# Especificação Técnica de Finalização (Spec) - ViTTA Health
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Base do Documento:** `analytics/report.md`  
**Objetivo:** Especificar tecnicamente (Page, Behavior, Component) **somente o que falta finalizar e amarrar** nos módulos já existentes no sistema.

---

## 1. Módulo de Telemedicina & Sala Virtual

### 1.1. Compartilhamento de Tela na Teleconsulta
* **Page / View:** Sala de Telemedicina (`TelemedicineRoom`).
* **Component:** `src/components/TelemedicineRoom.tsx`.
* **Behavior:**
  - Ao clicar no botão de compartilhamento de tela (`toggleScreenShare`), chamar `navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })`.
  - Percorrer os senders de `RTCPeerConnection` (`peerConnection.getSenders()`) e aplicar `replaceTrack(screenTrack)` no sender de vídeo.
  - No evento `screenTrack.onended` ou ao desativar no botão, obter novamente a câmera com `navigator.mediaDevices.getUserMedia` e restaurar o track original via `replaceTrack`.
  - Manter indicador visual no grid do vídeo mostrando que a tela está sendo transmitida.

### 1.2. Envio de Arquivos e Anexos no Chat da Teleconsulta
* **Page / View:** Chat da Sala de Telemedicina (`TelemedicineRoom`).
* **Component:** `src/components/TelemedicineRoom.tsx`.
* **Behavior:**
  - Adicionar botão de anexo (ícone `Paperclip`) no rodapé do chat.
  - Ao selecionar imagem ou PDF, fazer upload para o Firebase Storage em `telemedicine_chats/{appointmentId}/{fileName}` com barra de progresso.
  - Gravar a mensagem na subcoleção `telemedicine_rooms/{appointmentId}/messages` com `{ fileUrl, fileName, fileType, text }`.
  - Renderizar thumbnail para imagem ou preview com link para download para PDFs no balão da mensagem.

### 1.3. Encerramento Sincronizado e Redirecionamento para Avaliação
* **Page / View:** Sala de Telemedicina (`TelemedicineRoom`) & Histórico de Consultas (`MyAppointmentsView`).
* **Component:** `src/components/TelemedicineRoom.tsx`, `src/components/ReviewModal.tsx`, `src/App.tsx`.
* **Behavior:**
  - Quando o profissional clica em "Encerrar Atendimento", atualizar o documento `appointments/{appointmentId}` para `{ status: 'completed', telemedicineStatus: 'closed', completedAt: serverTimestamp() }`.
  - No lado do paciente, o listener `onSnapshot` detecta `telemedicineStatus === 'closed'` e abre automaticamente o modal de avaliação (`ReviewModal`) com opções de 1 a 5 estrelas e comentário.
  - Encerrar todos os tracks locais (`stream.getTracks().forEach(t => t.stop())`) e fechar o `RTCPeerConnection`.

### 1.4. Visualização de Receita Médica no Histórico do Paciente
* **Page / View:** Minhas Consultas (`MyAppointmentsView`).
* **Component:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`.
* **Behavior:**
  - Nos cards com `status === 'completed'` que possuem `prescriptionId` ou `prescriptionData`, exibir botão "Ver Receita Médica" com ícone de documento.
  - Ao clicar, abrir `PatientPrescriptionModal` carregando os dados da receita (medicamentos, posologia, orientações, assinatura digital e QR Code para validação).
  - Permitir download do PDF assinado pelo paciente.

---

## 2. Módulo de Agendamentos & Agenda Médica

### 2.1. Normalização de Modalidades de Atendimento
* **Page / View:** Agendamentos (`ProfessionalsView`, `MyAppointmentsView`, `AdminAppointmentsView`).
* **Component:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/types.ts`.
* **Behavior:**
  - Padronizar o valor salvo de modalidade para `"telemedicine"` ou `"presential"`.
  - Adicionar função helper utilitária `isTelemedicineModality(modality: string): boolean` que reconhece com segurança `"telemedicine"`, `"telemedicina"`, `"online"` e `"virtual"`.
  - Exibir o badge correto e habilitar o botão "Acessar Sala Virtual" 15 minutos antes do horário agendado.

### 2.2. Consistência de Identificadores Duplos
* **Page / View:** Criação e Listagem de Agendamentos.
* **Component:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`.
* **Behavior:**
  - Na gravação de novo agendamento, persistir sempre:
    - Paciente: `userId: user.uid` e `patientId: user.uid`.
    - Profissional: `professionalUserId: prof.userId || prof.id` e `professionalId: prof.id`.
  - Nas queries do Firestore, utilizar queries com filtro OR ou recuperar de forma transparente para suportar legados sem falha de renderização.

### 2.3. Estorno Automático no Cancelamento de Agendamento
* **Page / View:** Cancelamento de Consulta em `MyAppointmentsView`.
* **Component:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`.
* **Behavior:**
  - Ao solicitar cancelamento com antecedência válida, executar transação atômica (`runTransaction`):
    1. Atualizar agendamento para `{ status: 'cancelled', cancelledAt: serverTimestamp(), refundIssued: true }`.
    2. Incrementar o saldo da carteira do paciente (`wallets/{userId}`) com o valor pago (`balance += appointment.price`).
    3. Criar registro no extrato em `transactions` com `{ type: 'refund', category: 'appointment_refund', amount: appointment.price, status: 'completed' }`.
  - Exibir toast e feedback visual com o comprovante do estorno.

---

## 3. Módulo Financeiro & Conciliação Pix

### 3.1. Validação Estrutural de Chaves Pix
* **Page / View:** Painel Financeiro do Profissional (`ProfessionalFinanceView`).
* **Component:** `src/components/Professional/ProfessionalFinanceView.tsx`.
* **Behavior:**
  - Ao solicitar saque, selecionar o tipo de chave: `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM` (EVP).
  - Aplicar máscara e validação em tempo real:
    - CPF: 11 dígitos com cálculo de dígitos verificadores.
    - CNPJ: 14 dígitos com cálculo de validação.
    - E-mail: Regex RFC 5322.
    - Telefone: Formato brasileiro `+55 (XX) 9XXXX-XXXX`.
    - Aleatória: UUID v4 (formato `8-4-4-4-12`).
  - Desabilitar botão "Confirmar Solicitação de Saque" enquanto o campo estiver inválido.

### 3.2. Comprovante de Liquidação Bancária (Recibo de Payout)
* **Page / View:** Painel Financeiro do Profissional (`ProfessionalFinanceView`).
* **Component:** `src/components/Professional/PayoutReceiptModal.tsx`, `src/components/Professional/ProfessionalFinanceView.tsx`.
* **Behavior:**
  - Nos itens de saque com `status === 'completed'` ou `'paid'`, adicionar botão "Ver Comprovante".
  - Ao clicar, abrir `PayoutReceiptModal` exibindo: código de liquidação E2E bancário, data/hora da transferência, chave Pix de destino, valor bruto, taxa de serviço e valor líquido.
  - Opção de exportar/imprimir o recibo em formato PDF/impressão.

---

## 4. Módulo de Assinaturas & Planos ViTTA

### 4.1. Verificação Automática de Vencimento de Assinatura
* **Page / View:** Inicialização do Usuário & Painel de Assinaturas (`SubscriptionsView`).
* **Component:** `src/components/Patient/SubscriptionsView.tsx`, `src/App.tsx`.
* **Behavior:**
  - Ao carregar a sessão do usuário, checar se `subscription.currentPeriodEnd` é anterior a `new Date()`.
  - Se vencido e não renovado, atualizar no Firestore `subscription.status = 'expired'` e `userData.plan = 'free'`.
  - Exibir banner amigável informando sobre o vencimento com botão de renovação em 1 clique.

### 4.2. Bloqueio de Vouchers e Descontos Médicos para Assinaturas Inativas
* **Page / View:** `OffersView`, `ProfessionalsView`.
* **Component:** `src/components/Patient/OffersView.tsx`, `src/components/Patient/ProfessionalsView.tsx`.
* **Behavior:**
  - Na tela de ofertas/vouchers, se o plano do usuário não for ativo (`status !== 'active'`), bloquear o botão de emissão de voucher e exibir modal convidando para ativar um plano ViTTA.
  - Na tela de agendamentos, aplicar o valor regular sem desconto ViTTA caso a assinatura não esteja ativa.

---

## 5. Módulo de Vouchers & Validação por QR Code

### 5.1. Validação Atômica Anti-Duplicidade
* **Page / View:** Validação de Voucher pelo Parceiro (`VoucherValidationView`).
* **Component:** `src/components/Admin/VoucherValidationView.tsx`.
* **Behavior:**
  - Ao submeter o código lido ou digitado, executar `runTransaction(db, async (transaction) => ...)`:
    1. Ler o documento `vouchers/{voucherCode}`.
    2. Verificar se `voucher.status === 'active'`. Se for `'used'`, lançar erro: `"Voucher já foi utilizado em DD/MM/AAAA às HH:mm"`.
    3. Atualizar para `{ status: 'used', usedAt: serverTimestamp(), validatedBy: currentUserId, partnerId: partner.id }`.
  - Exibir modal de sucesso com dados do cliente e resumo do desconto concedido.

### 5.2. Tratamento de Permissão de Câmera no Leitor de QR Code
* **Page / View:** Validação de Voucher (`VoucherValidationView`).
* **Component:** `src/components/Admin/VoucherValidationView.tsx`.
* **Behavior:**
  - Caso `navigator.mediaDevices.getUserMedia` retorne `NotAllowedError` ou `NotFoundError` (ou bloqueio em iframe), não travar a tela.
  - Exibir alerta explicativo: *"Acesso à câmera bloqueado. Utilize o campo abaixo para validar digitando o código do voucher."* e focar automaticamente no campo de texto.

---

## 6. Módulo de Exames & Laudos Laboratoriais

### 6.1. Visualização de Exames no Atendimento SOAP
* **Page / View:** Modal de Atendimento SOAP (`SOAPConsultationModal`).
* **Component:** `src/components/Professional/SOAPConsultationModal.tsx`.
* **Behavior:**
  - Incluir aba/seção "Exames do Paciente" no drawer lateral do prontuário SOAP.
  - Fazer query na coleção `patient_exams` filtrando por `patientId == appointment.patientId`.
  - Permitir que o médico visualize laudos em PDF e imagens de exames sem precisar sair da sala ou fechar o prontuário.

### 6.2. Indicador Visual de Upload e Validação de Arquivos
* **Page / View:** Meus Exames (`ExamsView`).
* **Component:** `src/components/Patient/ExamsView.tsx`.
* **Behavior:**
  - Validação pré-upload: tipos permitidos (`application/pdf`, `image/png`, `image/jpeg`), tamanho máximo 15MB.
  - Exibir barra de progresso linear animada durante o upload para o Firebase Storage.

---

## 7. Módulo de Suporte & Atendimento ao Cliente

### 7.1. Rolagem Automática e Contadores em Tempo Real
* **Page / View:** Chat de Suporte (`SupportChat`, `AdminSupportChatView`).
* **Component:** `src/components/SupportChat.tsx`, `src/components/Admin/AdminSupportChatView.tsx`.
* **Behavior:**
  - Utilizar `useRef` atrelado a um `messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })` disparado a cada nova mensagem recebida no `onSnapshot`.
  - Atualizar badge de mensagens não lidas no menu do Administrador Master quando houver novas mensagens com o chat minimizado.

---

## 8. Módulo de Segurança, KYC & Resiliência Offline

### 8.1. Cooldown de 60s no Reenvio de 2FA
* **Page / View:** Modal de Autenticação em Duas Etapas (`TwoFactorModal`).
* **Component:** `src/components/TwoFactorModal.tsx`.
* **Behavior:**
  - Ao disparar o código 2FA, iniciar contagem regressiva de 60 segundos com botão de reenvio desabilitado e texto *"Reenviar código em XXs"*.
  - Habilitar o botão somente após zerar o temporizador.

### 8.2. Disparo Automático da Fila de Sincronização Offline
* **Page / View:** Global / Applet Core (`offlineQueue`).
* **Component:** `src/lib/offlineQueue.ts`, `src/components/OfflineIndicatorBanner.tsx`.
* **Behavior:**
  - Escutar o evento `window.addEventListener('online', () => offlineQueue.processQueue())`.
  - Processar as mutações pendentes salvas no `IndexedDB`/`localStorage` com deduplicação e feedback visual através do `OfflineIndicatorBanner`.
