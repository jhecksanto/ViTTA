# Especificação Técnica de Telemedicina - Escopo de Finalização (Spec.md)
**Data e Hora de Geração:** 15 de junho de 2026, 21:34:25 (Horário de Brasília)

---

Este documento define os critérios de especificação técnica para os comportamentos, páginas e componentes que faltam refinar no sistema de telemedicina do **Vitta**, baseando-se estritamente no relatório de diagnóstico geral.

---

## 🧭 1. Comportamentos do Sistema (Behaviors)

### ⚙️ B1: Liberação Absoluta de Recursos de Mídia (Media Stream & Audio Context Cleanup)
- **Objetivo**: Garantir que as mídias (webcam/mic) e recursos de áudio sejam interrompidos e removidos de memória imediatamente após a saída da videoconferência.
- **Fluxo Técnico**:
  1. No gancho de encerramento do componente ou no retorno do `useEffect` de montagem de `TelemedicineRoom.tsx`:
     - Percorrer todas as faixas ativas do fluxo local (`localStream`) e invocar o método `.stop()`.
     - Definir os estados de fluxo local como `null`.
     - Invocar o fechamento seguro do analisador de áudio (`audioCtx.close()`) caso esteja inicializado.
  2. Impedir que timers do sinal sonoro da chamada continuem sendo invocados após a remoção ou desconexão.

### ⚙️ B2: Propagação Síncrona de Término de Sessão (Safe Exit and Redirect Sync)
- **Objetivo**: Forçar a desconexão automática imediata e redirecionamento de ambos os participantes assim que a consulta for encerrada.
- **Fluxo Técnico**:
  1. O ouvinte em tempo real do Firestore (`onSnapshot`) monitora o campo `status` da consulta correspondente.
  2. Ao detectar o status igual a `completed` ou `cancelled`:
     - Interromper a reprodução de áudios de chamada ou chimes.
     - Destruir o objeto local `localStream` (liberando a câmera).
     - Exibir suavemente na tela ativa a transição visual de encerramento por 2.5 segundos, encaminhando o paciente para o painel de histórico de agendamentos e o médico profissional para o dashboard de consultas.

### ⚙️ B3: Inclusão de Comentários de Arquitetura WebRTC real (Roadmap)
- **Objetivo**: Esclarecer no código onde as simulações governadas pelo Firestore conectam-se conceitualmente com uma infraestrutura WebRTC física (como servidores de sinalização via WebSockets / Socket.io e servidores de mídia STUN/TURN).

---

## 🧱 2. Componentes e Telas (Pages & Components)

### 📱 C1: Refinamento Responsivo Bento Grid (Mobile Resiliência < 360px)
- **Onde se localiza**: Área principal do componente `TelemedicineRoom.tsx`.
- **Requisitos de Layout**:
  - Ajustar o container de vídeo remoto e vídeo local para usar flex-direction vertical e reduzir altura mínima do vídeo lateral em telas com menos de 360px de largura (`max-sm:h-28`).
  - Adaptar a barra inferior de botões de controle para se alinhar em grid compacto (`grid grid-cols-4 gap-1 p-2 rounded-lg bg-slate-900`), evitando texto ou truncamentos severos de ícones para manter todos os controles acessíveis com áreas de toque seguras (mínimo de 44px).
  - O painel lateral de chat deve colapsar por completo em dispositivos pequenos, sobrepondo-se em formato modal quando aberto ativamente pelo usuário para evitar que estrangule a exibição da videoconferência.
