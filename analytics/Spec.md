# Especificação Funcional (Spec): Finalização da Telemedicina
**Data e Hora de Geração:** 02/09/2026 às 19:46 (Horário de Brasília - UTC-3)  
**Base do Documento:** `analytics/report.md`  
**Escopo:** Especificação técnica detalhada **somente do que falta implementar/conectar** para a conclusão das funções de Telemedicina da plataforma ViTTA.

---

## 1. Regras de Segurança e Comunicação no Firestore (`firestore.rules`)

### Componente / Arquivo
* `firestore.rules`

### Comportamento Esperado
1. **Subcoleções de `appointments/{appointmentId}`**:
   * As regras devem permitir leitura e escrita nas subcoleções:
     - `webrtc/signal` (oferta e resposta SDP da conexão ponto a ponto).
     - `doctorCandidates/{candidateId}` e `patientCandidates/{candidateId}` (descoberta de candidatos ICE).
     - `messages/{messageId}` (mensagens de texto e arquivos trocados durante a chamada).
   * Acesso permitido se o usuário autenticado for o paciente (`resource.data.userId == request.auth.uid`), o profissional vinculado ou administrador.
2. **Coleções de Encerramento Clínico**:
   * `patient_records`: permitir leitura para o paciente e profissional envolvidos, e criação/atualização pelo profissional ou admin.
   * `prescriptions`: permitir leitura para o paciente da receita e profissional emissor, e gravação pelo profissional.

---

## 2. Detecção e Acesso à Sala pelo Paciente

### Páginas e Componentes
* `src/components/Patient/MyAppointmentsView.tsx`
* `src/components/Patient/ProfessionalsView.tsx`
* `src/App.tsx` (`PatientDashboardView`)

### Comportamento Esperado
1. **Verificação de Modalidade no Card de Agendamentos (`MyAppointmentsView.tsx` e `PatientDashboardView`)**:
   * O predicado que identifica se uma consulta é telemedicina deve ser ampliado de:
     `apt.type === 'telemedicine' || apt.isTelemedicine || apt.roomType === 'telemedicine'`
     para contemplar também:
     `apt.modality === 'telemedicine' || apt.modality === 'telemedicina' || apt.modality === 'online'`.
   * Para consultas com status `upcoming` ou `in_progress` que sejam telemedicina, o botão verde **"Entrar na Sala"** / **"Entrar"** deve ser renderizado para o paciente, acionando `setActiveTelemedicineApt(apt)`.
2. **Consistência na Criação de Agendamento (`ProfessionalsView.tsx`)**:
   * Ao agendar consulta de telemedicina (`bookingModality === "telemedicine"`), gravar explicitamente no documento do agendamento:
     - `userId: user.uid` (em paridade com `patientId: user.uid`).
     - `isTelemedicine: true`.
     - `telemedicineRoomId: aptRef.id`.
     - `telemedicineUrl: ${window.location.origin}/?room=${aptRef.id}`.

---

## 3. Roteamento de Sala por Link Direto (`/?room={appointmentId}`)

### Páginas e Componentes
* `src/App.tsx` (Root Application & Listener de Autenticação)

### Comportamento Esperado
1. **Detecção do Parâmetro de URL na Montagem/Login**:
   * Ao inicializar a aplicação e com usuário autenticado, verificar se há parâmetro `room` na URL (`new URLSearchParams(window.location.search).get('room')`).
   * Se existir, consultar o documento correspondente em `appointments/{roomId}` no Firestore.
   * Se a consulta for válida e pertencer ao usuário (ou se for médico/admin), definir `setActiveTelemedicineApt({ id: snap.id, ...snap.data() })`, abrindo a sala imediatamente.
2. **Limpeza Transparente da URL**:
   * Quando o modal de telemedicina for fechado (`onLeave`), remover o parâmetro `?room=` da URL através de `window.history.replaceState({}, document.title, window.location.pathname)` sem disparar recarregamento de página.

---

## 4. Visualização e Download de Prescrições pelo Paciente

### Páginas e Componentes
* `src/components/Patient/MyAppointmentsView.tsx`
* Sub-componente / Modal: `PatientPrescriptionModal` (ou modal interno de prescrições)

### Comportamento Esperado
1. **Ação no Card de Consulta Concluída**:
   * Para consultas com status `completed` que possuam prescrições salvas (`apt.prescriptions && apt.prescriptions.length > 0` ou dados clínicos), renderizar o botão **"Ver Prescrição Digital"** ao lado de "Avaliar Atendimento".
2. **Exibição e Download em PDF**:
   * Ao clicar, abrir modal responsivo listando os medicamentos prescritos (nome, dosagem e posologia/instruções) e atestados/pedidos de exames.
   * Disponibilizar botão de download/impressão direta que gera o PDF assinado digitalmente com os dados do médico emissor e do paciente (utilizando `jspdf`).

---

## 5. Ajustes de Sala: Encerramento, Captura Real de Tela e Anexos no Chat

### Páginas e Componentes
* `src/components/TelemedicineRoom.tsx`

### Comportamento Esperado
1. **Sincronização de Encerramento (`handleHangUp`)**:
   * Ao finalizar a chamada pelo botão vermelho, o médico deve atualizar no Firestore `status: 'completed'`, `telemedicineStatus: 'closed'`, `doctorJoined: false`, `patientJoined: false` e `completedAt: Timestamp.now()`.
   * Isso aciona instantaneamente a tela de contagem regressiva e encerramento seguro na interface do paciente (`isSessionClosed`).
2. **Compartilhamento de Tela Real via WebRTC**:
   * O botão de compartilhar tela deve invocar `navigator.mediaDevices.getDisplayMedia({ video: true })`.
   * Substituir o track de vídeo no transmissor WebRTC (`sender.replaceTrack`) para que o interlocutor veja a tela compartilhada em tempo real.
   * Ao parar o compartilhamento (ou quando o usuário clica em "Parar compartilhamento" na barra do navegador), restaurar automaticamente o track da câmera local.
3. **Envio de Arquivos Reais no Chat**:
   * Adicionar no formulário do chat um botão de anexo com `<input type="file" accept="image/*,.pdf" />`.
   * Ao selecionar um arquivo, converter para visualização/leitura segura e enviar na coleção `appointments/{id}/messages` com `isFile: true`, `fileName`, e link/dataURL, permitindo download direto pelo receptor.

---

## 6. Padronização da Modalidade no Painel Administrativo

### Páginas e Componentes
* `src/components/Admin/AdminAppointmentsView.tsx`

### Comportamento Esperado
1. **Reconhecimento da Modalidade Telemedicina**:
   * Na tabela de agendamentos, o badge de modalidade deve verificar:
     `apt.modality === "telemedicina" || apt.modality === "telemedicine" || apt.modality === "online"`
     para renderizar o ícone de vídeo (`<Video />`) e o texto "Telemedicina".
2. **Reagendamento Consistente**:
   * No modal de reagendar consulta, salvar a modalidade no formato padronizado `"telemedicine"`.
