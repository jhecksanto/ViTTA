# Relatório de Diagnóstico e Pendências de Finalização: Módulo de Telemedicina
**Data e Hora de Geração:** 02/09/2026 às 19:46 (Horário de Brasília - UTC-3)  
**Escopo:** Mapeamento exclusivo do que falta terminar nas funções de Telemedicina (sem criação de novas funcionalidades, focado estritamente na finalização do ecossistema existente).

---

## 1. Sumário Executivo do Módulo de Telemedicina

A plataforma ViTTA possui uma arquitetura de telemedicina avançada com sala virtual própria (`TelemedicineRoom.tsx`), sinalização WebRTC ponto a ponto com áudio/vídeo, chat criptografado em tempo real, analisadores de frequência vocal (Web Audio API), prontuário SOAP integrado (`SOAPConsultationModal.tsx`), emissão de receitas digitais (`PrescriptionModal.tsx`) e encerramento sincronizado com repasse financeiro.

Após uma auditoria detalhada de ponta a ponta (regras de segurança no Firestore, componentes de agendamento de pacientes, visão profissional, parâmetros de link de sala e painel administrativo), identificamos que o núcleo da videoconferência está construído, porém existem **pontos de desconexão e lacunas de finalização** que impedem o fluxo completo de operar de forma 100% íntegra na prática.

---

## 2. Diagnóstico Detalhado: O Que Falta Terminar na Telemedicina

### 2.1. Regras de Segurança do Firestore (`firestore.rules`)
* **Problema Identificado:** No Firestore Rules v2, as regras não se propagam automaticamente para subcoleções. As subcoleções essenciais de telemedicina (`appointments/{id}/webrtc/signal`, `appointments/{id}/doctorCandidates`, `appointments/{id}/patientCandidates` e `appointments/{id}/messages`) e as coleções de encerramento (`patient_records` e `prescriptions`) caem na regra de bloqueio global (`match /{document=**} { allow read, write: if false; }`).
* **Impacto:** O handshake WebRTC (oferta/resposta SDP e ICE candidates), o envio de mensagens no chat da teleconsulta e o salvamento das receitas/prontuários sofrem `permission-denied` no ambiente real.
* **O que falta terminar:** Declarar regras explícitas para as subcoleções de `appointments/{id}` permitindo leitura/escrita para o paciente do agendamento, o profissional responsável e administradores. Permitir gravação/leitura segura nas coleções `patient_records` e `prescriptions`.

---

### 2.2. Detecção e Acesso à Sala na Visão do Paciente (`MyAppointmentsView.tsx` e `PatientDashboardView`)
* **Problema Identificado:** Os cards de agendamento do paciente verificam apenas `apt.type === 'telemedicine' || apt.isTelemedicine || apt.roomType === 'telemedicine'` para exibir o botão **"Entrar na Sala"**. Entretanto, o fluxo de agendamento grava `modality: "telemedicine"`. Além disso, em `ProfessionalsView.tsx`, o agendamento gravava apenas `patientId: user.uid` (faltando `userId: user.uid`, que é o campo usado pela query principal do paciente) e não preenchia os metadados de sala (`telemedicineRoomId`, `telemedicineUrl`).
* **Impacto:** O paciente agenda uma teleconsulta, mas o botão para ingressar na sala virtual não aparece na lista de consultas nem no dashboard do paciente.
* **O que falta terminar:**
  1. Atualizar a condição em `MyAppointmentsView.tsx` e `PatientDashboardView` para reconhecer `apt.modality === 'telemedicine' || apt.modality === 'telemedicina' || apt.modality === 'online'`.
  2. Padronizar o agendamento em `ProfessionalsView.tsx` para persistir `userId: user.uid`, `modality: 'telemedicine'`, `isTelemedicine: true`, `telemedicineRoomId` e `telemedicineUrl`.

---

### 2.3. Roteamento e Acesso Direto via Link de Convite (`/?room={appointmentId}`)
* **Problema Identificado:** Tanto na sala de telemedicina quanto na agenda profissional, o sistema gera o link `${window.location.origin}/?room=${apt.id}` com botões de "Convidar" e "Copiar Link". Porém, `App.tsx` não realiza a leitura de `window.location.search` (`URLSearchParams`).
* **Impacto:** Quando um médico ou paciente recebe e clica no link direto da sala, ele é redirecionado para a home sem que a sala de telemedicina correspondente seja carregada.
* **O que falta terminar:**
  1. Em `App.tsx`, capturar o parâmetro `room` da URL ao inicializar.
  2. Buscar a consulta correspondente no Firestore e abrir a sala via `setActiveTelemedicineApt`.
  3. Ao fechar a sala (`onLeave`), limpar o parâmetro de busca da URL (`window.history.replaceState`) para evitar loops ao recarregar a página.

---

### 2.4. Visualização e Download de Prescrições e Atestados pelo Paciente (`MyAppointmentsView.tsx`)
* **Problema Identificado:** Durante e ao final da teleconsulta, o médico registra condutas, prescrições e atestados médicos (armazenados em `appointment.prescriptions` e na coleção `prescriptions`). A notificação in-app avisa o paciente: *"Sua consulta foi concluída. Prontuário e receitas estão disponíveis nos seus registros de saúde"*. Porém, em `MyAppointmentsView.tsx`, os cards de consultas concluídas exibem apenas o botão "Avaliar Atendimento", sem forma de abrir ou baixar a receita médica emitida.
* **Impacto:** O paciente não consegue obter a receita digital prescrita na teleconsulta finalizada.
* **O que falta terminar:** Adicionar nos agendamentos concluídos que possuam receitas (`apt.prescriptions` ou coleção `prescriptions`) a ação de **"Ver Prescrição Digital"**, exibindo modal com os itens prescritos e botão de download em PDF formatado.

---

### 2.5. Ajustes de Conexão e Experiência em Chamada (`TelemedicineRoom.tsx`)
* **Problema Identificado:**
  1. **Encerramento da Chamada:** No método `handleHangUp`, ao desconectar, o status é alterado para `completed`, mas não é enviado `telemedicineStatus: 'closed'`.
  2. **Compartilhamento de Tela:** O botão de compartilhamento de tela atualmente exibe apenas toast simulado, em vez de capturar `navigator.mediaDevices.getDisplayMedia` e alternar o track de vídeo na conexão WebRTC.
  3. **Anexos Reais no Chat:** O chat possui apenas atalhos estáticos pré-definidos (`exame_sangue.pdf`), sem seletor de arquivos (`<input type="file" />`) para o paciente ou médico enviar exames reais em PDF/imagem durante a chamada.
* **O que falta terminar:**
  1. Atualizar `handleHangUp` para incluir `telemedicineStatus: 'closed'` e `completedAt: Timestamp.now()`.
  2. Implementar captura real de tela via `navigator.mediaDevices.getDisplayMedia` com substituição dinâmica de track de vídeo e fallback gracioso.
  3. Integrar botão de anexo com seletor de arquivos no formulário de envio de mensagens do chat.

---

### 2.6. Consistência da Modalidade no Painel de Agendamentos do Administrador (`AdminAppointmentsView.tsx`)
* **Problema Identificado:** A tabela de agendamentos no painel admin checa estritamente `apt.modality === "telemedicina"`, enquanto agendamentos e registros utilizam `"telemedicine"`.
* **Impacto:** Consultas de telemedicina são exibidas incorretamente como "Presencial" com ícone de pin no painel de governança.
* **O que falta terminar:** Adequar a checagem para aceitar `"telemedicine" || "telemedicina" || "online"`, e no modal de reagendamento gravar `"telemedicine"` de forma padronizada.

---

## 3. Matriz de Finalização da Telemedicina

| # | Item de Finalização | Componente / Arquivo | O que já existe | O que falta finalizar | Complexidade |
|---|---------------------|----------------------|-----------------|-----------------------|--------------|
| **1** | Regras de Segurança WebRTC, Chat e Prescrições | `firestore.rules` | Regra básica de `appointments` sem subcoleções. | Adicionar regras para subcoleções de `appointments` (`webrtc`, `doctorCandidates`, `patientCandidates`, `messages`) e coleções `patient_records` e `prescriptions`. | Baixa |
| **2** | Detecção da Modalidade no Paciente e Agendamento | `MyAppointmentsView.tsx`, `PatientDashboardView.tsx`, `ProfessionalsView.tsx` | Botão "Entrar na Sala" existente, mas com predicado restritivo. | Incluir `modality === 'telemedicine'` nas condições de visualização e salvar `userId` e metadados de sala no agendamento. | Baixa |
| **3** | Acesso Direto por Link de Sala (`/?room=id`) | `App.tsx` | Geração de link `${origin}/?room=${id}` implementada. | Ler `URLSearchParams`, carregar agendamento ativo e limpar parâmetro ao sair. | Média |
| **4** | Visualização/Download de Receitas pelo Paciente | `MyAppointmentsView.tsx` | Geração de PDF e salvamento de prescrições pelo médico operacionais. | Adicionar botão "Ver Receita" e modal de visualização/download de PDF nos agendamentos concluídos do paciente. | Média |
| **5** | Ajustes da Sala (Encerramento, Screen Share e Anexos) | `TelemedicineRoom.tsx` | Sala WebRTC, vídeo, áudio, SOAP e prescrições funcionais. | Sincronizar `telemedicineStatus: 'closed'`, captura real de tela via `getDisplayMedia` e anexo de arquivos no chat. | Média |
| **6** | Normalização da Modalidade no Admin | `AdminAppointmentsView.tsx` | Listagem e filtros de agendamentos operacionais. | Aceitar `telemedicine` na exibição da modalidade e padronizar reagendamentos. | Baixa |

---

## 4. Conclusão do Diagnóstico
Não há necessidade de novas páginas ou arquiteturas inéditas. A finalização da Telemedicina requer exclusivamente a **ligação dos fluxos ponta a ponta**, garantindo que o paciente consiga acessar a sala que agendou, que o link direto funcione, que as permissões de rede/banco sejam cumpridas e que o paciente possa visualizar o resultado clínico (receitas) pós-consulta.
