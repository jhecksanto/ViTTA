# Issue 01: Telemedicina - Compartilhamento de Tela e Encerramento Sincronizado
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Telemedicina / Sala Virtual  
**Prioridade:** P0 (Crítica)  
**Arquivos Alvo:** `src/components/TelemedicineRoom.tsx`, `src/App.tsx`, `src/components/ReviewModal.tsx`

---

## 1. Descrição e Contexto
Na sala de telemedicina (`TelemedicineRoom.tsx`), o botão de compartilhamento de tela necessita substituir dinamicamente a track de vídeo no objeto `RTCPeerConnection` (`replaceTrack`) para que o paciente visualize a tela do médico e vice-versa, além de restaurar o feed da webcam quando o compartilhamento for interrompido. Além disso, ao encerrar o atendimento, a sala deve ser marcada como encerrada no Firestore (`telemedicineStatus: 'closed'`), encerrando os streams e redirecionando o paciente automaticamente para o modal de avaliação.

---

## 2. Requisitos Técnicos
1. **Screen Sharing (`replaceTrack`):**
   - Obter fluxo de vídeo de tela via `navigator.mediaDevices.getDisplayMedia({ video: true })`.
   - Localizar o sender de vídeo no `peerConnection` e chamar `sender.replaceTrack(screenTrack)`.
   - Escutar o evento `screenTrack.onended` para retornar automaticamente para a câmera através de `sender.replaceTrack(cameraTrack)`.
2. **Encerramento Sincronizado:**
   - Ao médico clicar em "Encerrar Atendimento", atualizar `appointments/{appointmentId}` com `{ status: 'completed', telemedicineStatus: 'closed', completedAt: serverTimestamp() }`.
   - Interromper todas as tracks locais de mídia (`track.stop()`).
   - O listener de status no paciente detecta `closed` e abre o `ReviewModal`.

---

## 3. Critérios de Aceite
- [ ] O compartilhamento de tela transmite o vídeo ao vivo para a outra ponta.
- [ ] Interromper o compartilhamento restaura a câmera sem travar a chamada.
- [ ] O encerramento pelo médico finaliza a conexão e abre o modal de avaliação para o paciente.
