# Especificação Técnica de Finalização do Sistema ViTTA Health (Spec.md)
**Data e Hora de Geração:** 04/09/2026 às 15:32 (Horário de Brasília - UTC-3)  
**Escopo:** Especificação técnica detalhada das páginas, comportamentos e componentes que necessitam estritamente de finalização e consolidação no sistema ViTTA Health, derivados do relatório de diagnóstico (`analytics/report.md`).

---

## 1. Módulo de Telemedicina, Prontuário SOAP e Receitas Digitais

### 1.1. Página / Componente: `TelemedicineRoom.tsx`
* **Localização:** `src/components/TelemedicineRoom.tsx`
* **Comportamento Esperado:**
  1. **Substituição Dinâmica de Tracks no Compartilhamento de Tela:**
     - Ao clicar no botão de compartilhamento de tela, invocar `navigator.mediaDevices.getDisplayMedia({ video: true, audio: false })`.
     - Localizar o track de vídeo na conexão `RTCPeerConnection` (`peerConnection.getSenders()`) e chamar `sender.replaceTrack(screenTrack)`.
     - Registrar o evento `screenTrack.onended` para restaurar automaticamente o track de vídeo original da câmera do usuário sem interromper a chamada.
  2. **Upload e Envio de Documentos no Chat da Sala:**
     - Inserir botão com ícone de anexo no formulário do chat lateral da sala.
     - Permitir seleção de arquivos (PDF, PNG, JPG até 10MB), realizar upload para o Firebase Storage (`telemedicine-attachments/{roomId}/{file}`) e enviar como mensagem contendo link de download direto e preview.
  3. **Encerramento Sincronizado do Atendimento:**
     - Ao acionar "Encerrar Atendimento" pelo profissional, atualizar o documento da sala no Firestore com `{ status: 'closed', completedAt: serverTimestamp(), doctorJoined: false, patientJoined: false }`.
     - O listener do paciente deve detectar a alteração de status e redirecionar imediatamente para a tela de avaliação da consulta (`ReviewModal`), encerrando as faixas locais de mídia (áudio e vídeo).
  4. **Entrada Direta via Parâmetro de URL:**
     - No componente raiz `App.tsx`, interceptar o parâmetro `?room=ID` na montagem inicial (`useEffect`), validar a existência da sala e abrir o modal da sala correspondente.
     - Ao fechar a sala, executar `window.history.replaceState({}, '', window.location.pathname)` para limpar a URL de forma transparente.

### 1.2. Página / Componente: `MyAppointmentsView.tsx` & `PatientPrescriptionModal.tsx`
* **Localização:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`
* **Comportamento Esperado:**
  - Para consultas com status `'completed'` que possuam `prescriptionId` ou `prescriptionData`, renderizar o botão com ícone "Visualizar Receita Médica".
  - Ao clicar, abrir o modal `PatientPrescriptionModal` exibindo os medicamentos prescritos, posologia, orientações gerais, identificação do médico (com CRM/UF) e botão para baixar o PDF assinado digitalmente.

---

## 2. Módulo de Agendamentos & Agenda Profissional

### 2.1. Página / Componente: `ProfessionalsView.tsx`, `MyAppointmentsView.tsx`, `AdminAppointmentsView.tsx`
* **Localização:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`
* **Comportamento Esperado:**
  1. **Padronização e Normalização de Modalidade:**
     - Criar função utilitária `isTelemedicineModality(modality: string): boolean` que reconheça uniformemente `"telemedicine"`, `"telemedicina"`, `"online"` e `"remoto"`.
     - Assegurar que a sinalização de "Entrar na Consulta" apareça de maneira consistente em todas as visões (paciente, profissional e admin).
  2. **Persistência de Identificadores Duplos:**
     - No ato da criação do agendamento, persistir simultaneamente no documento da coleção `appointments`:
       - `userId` e `patientId` (ambos apontando para o UID do paciente).
       - `professionalUserId` e `professionalId` (ambos apontando para o UID do profissional).
     - Atualizar as queries de consulta para buscar tanto por `userId` / `patientId` quanto por `professionalUserId` / `professionalId`.
  3. **Cancelamento com Estorno de Carteira:**
     - No cancelamento de consulta com mais de 2 horas de antecedência pelo paciente, verificar se a consulta foi paga via carteira/saldo e executar estorno automático (`increment(appointment.price)`) no documento `users/{userId}`.
     - Gravar transação do tipo `refund` no histórico financeiro com a descrição `Estorno de cancelamento da consulta #ID`.

---

## 3. Módulo de Validação de Vouchers por QR Code

### 3.1. Página / Componente: `VoucherValidationView.tsx`
* **Localização:** `src/components/Conveniado/VoucherValidationView.tsx`
* **Comportamento Esperado:**
  1. **Tratamento de Permissão e Resiliência do Leitor de Câmera:**
     - Ao iniciar o scanner de QR Code, capturar exceções do tipo `NotAllowedError` ou `NotFoundError` e exibir banner instrutivo claro, orientando o usuário a liberar o acesso ou alternar para validação manual.
  2. **Resgate Atômico via `runTransaction`:**
     - A validação do código do voucher deve ser realizada dentro de `runTransaction(db, async (transaction) => ...)`:
       - Ler o documento do voucher;
       - Verificar se `status === 'active'` e se não está expirado;
       - Atualizar para `status: 'used'`, `usedAt: serverTimestamp()`, `validatedBy: conveniadoId`;
       - Caso já esteja utilizado, abortar com mensagem explicativa contendo a data do resgate anterior.
  3. **Comprovante de Validação:**
     - Exibir modal de sucesso com dados do paciente, percentual de desconto concedido e botão para impressão ou nova validação.

---

## 4. Módulo Financeiro & Solicitações de Saque Pix

### 4.1. Página / Componente: `ProfessionalFinanceView.tsx` & `PayoutReceiptModal.tsx`
* **Localização:** `src/components/Professional/ProfessionalFinanceView.tsx`, `src/components/Professional/PayoutReceiptModal.tsx`
* **Comportamento Esperado:**
  1. **Validação de Chaves Pix:**
     - Implementar validação regex de chaves Pix antes de habilitar o botão de saque:
       - CPF (11 dígitos), CNPJ (14 dígitos), E-mail, Telefone (+55...) e Chave Aleatória EVP (formato UUID).
  2. **Visualização de Comprovante de Liquidação:**
     - Na tabela de histórico de saques do profissional, para solicitações com status `'approved'` / `'completed'`, exibir botão "Ver Comprovante".
     - O modal `PayoutReceiptModal` deve exibir o código bancário de liquidação E2E fornecido pelo administrador, data da liquidação e valor líquido creditado.

---

## 5. Módulo de Assinaturas & Ciclo de Cobrança

### 5.1. Página / Componente: `SubscriptionsView.tsx` & `SubscriptionPlansView.tsx`
* **Localização:** `src/components/Patient/SubscriptionsView.tsx`, `src/components/Patient/SubscriptionPlansView.tsx`
* **Comportamento Esperado:**
  1. **Verificação Automática de Vencimento:**
     - Ao carregar a tela do paciente, comparar a data atual com `subscription.currentPeriodEnd`.
     - Caso vencido e não renovado, atualizar o status da assinatura do usuário para `'expired'` e notificar o paciente sobre a necessidade de renovação.
  2. **Cancelamento Programado:**
     - Ao solicitar cancelamento, manter o status como ativo com a flag `cancelAtPeriodEnd: true`, permitindo usufruir dos descontos e clube de vouchers até a data final do ciclo atual.

---

## 6. Módulo de Suporte, Exames e Resiliência Offline

### 6.1. Página / Componente: `SupportChat.tsx` & `AdminSupportView.tsx`
* **Comportamento Esperado:**
  - Auto-scroll automático e suave (`scrollIntoView({ behavior: 'smooth' })`) ao receber novas mensagens no chat de suporte.
  - Sincronização em tempo real de contagem de mensagens não lidas no badge do menu administrativo.

### 6.2. Página / Componente: `PatientExamsView.tsx` & `SOAPConsultationModal.tsx`
* **Comportamento Esperado:**
  - Barra de progresso de upload no envio de exames pelo paciente e visualização dos laudos anexados na aba "Exames do Paciente" dentro do modal de prontuário SOAP do médico.

### 6.3. Página / Componente: `offlineQueue.ts`
* **Comportamento Esperado:**
  - Listener global do evento `window.addEventListener('online', ...)` para disparar a sincronização imediata de ações pendentes da fila local.
