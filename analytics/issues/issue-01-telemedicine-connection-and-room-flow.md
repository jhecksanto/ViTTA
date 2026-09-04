# Issue 01: Finalização da Sala de Telemedicina e Fluxo de Chamada WebRTC
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Telemedicina / Atendimento Virtual  
**Componente Principal:** `src/components/TelemedicineRoom.tsx`, `src/App.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
A sala de telemedicina possui o fluxo básico de sinalização WebRTC funcional, mas necessita de finalizações para suportar o compartilhamento de tela com restauração suave da câmera (`replaceTrack`), upload de arquivos no chat da sala e encerramento sincronizado entre médico e paciente com limpeza de URL via `history.replaceState`.

---

## 2. Tarefas de Implementação
- [ ] Implementar `navigator.mediaDevices.getDisplayMedia` com troca dinâmica de track de vídeo no `RTCPeerConnection` (`sender.replaceTrack(screenTrack)`).
- [ ] Adicionar evento de restauração automática do feed da câmera quando o compartilhamento de tela for interrompido pelo usuário.
- [ ] Adicionar botão de anexo de arquivos no chat da sala com upload para Firebase Storage e envio de link de download direto.
- [ ] No clique de "Encerrar Atendimento" pelo médico, propagar `status: 'closed'` e `completedAt` no documento da sala, disparando o fechamento imediato da tela do paciente e abertura do modal de avaliação (`ReviewModal`).
- [ ] Processar o parâmetro `?room=ID` na inicialização do aplicativo em `App.tsx` para carregar a sala diretamente e limpar a URL via `history.replaceState` ao sair.

---

## 3. Critérios de Aceite
1. O compartilhamento de tela substitui o vídeo do médico na tela do paciente e retorna à câmera do médico quando encerrado sem travar o áudio.
2. Arquivos de imagem e PDF enviados pelo chat podem ser visualizados e baixados por ambos os participantes da sala.
3. O encerramento pelo médico desconecta a chamada do paciente instantaneamente e direciona para a tela de avaliação.
4. O link com `?room=ID` abre diretamente a sala de telemedicina e a URL é higienizada ao fechar.
