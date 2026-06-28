# Plano de Execução Técnica - Pendências de Telemedicina
**Data e Hora de Geração:** 27 de junho de 2026, 21:49:18 (Horário de Brasília)

---

Este documento apresenta a estratégia de planejamento, pesquisa e passos de desenvolvimento para sanar cada uma das quatro issues mapeadas na pasta `/analytics/issues`, mantendo estrito alinhamento com a arquitetura de produção do **ViTTA** e evitando novas implementações de escopo.

---

## 📅 Cronograma e Sequência de Trabalho Recomendada

```
+-------------------------------------------------------------+
|  1. Interrupção Instantânea de Mídia Física (Issue 1)       |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  2. Limpeza de Ouvintes e Evitar Memory Leaks (Issue 2)     |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  3. Desconexão e Limpeza de Analisadores de Áudio (Issue 3) |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|  4. Responsividade e Footer em Telas Estreitas (Issue 4)    |
+-------------------------------------------------------------+
```

---

## 🔬 Pesquisa e Planejamento por Issue

### 🛠 Issue 1: Interrupção Instantânea de Mídia Física no Fechamento
- **Análise Técnico-Estrutural**: No `TelemedicineRoom.tsx`, o estado `isSessionClosed` dita quando a sala foi encerrada. Quando ele se torna `true`, o hardware (câmera/microfone) ainda pode permanecer ativo por 2.5 segundos devido aos efeitos visuais de transição de fade-out do Framer Motion.
- **Passos para Resolução**:
  1. No efeito que escuta a mudança de `isSessionClosed`, adicionar um gatilho de interrupção síncrona imediata das tracks antes de qualquer transição visual.
  2. Executar o loop de parada de forma síncrona:
     ```typescript
     if (localStream) {
       localStream.getTracks().forEach(track => {
         track.stop();
         console.log(`[Hardware] Parando faixa física: ${track.kind}`);
       });
       setLocalStream(null);
     }
     ```
  3. Garantir que as referências das tracks nos elementos HTML `<video>` sejam limpas definindo `.srcObject = null`.

---

### 🛠 Issue 2: Garantia Antimemory-Leak dos Ouvintes Globais (Autoplay Bypass)
- **Análise Técnico-Estrutural**: O ouvinte global para contornar políticas de autoplay do navegador está acoplado ao ciclo do `useEffect` de `remoteStream` e `isSessionClosed`.
- **Passos para Resolução**:
  1. Certificar que as funções de callback (`unlockAutoplay`) sejam estáveis e não criem múltiplos listeners indesejados caso o efeito seja re-executado repetidamente por mudanças de stream.
  2. Implementar uma remoção agressiva e preventiva antes de adicionar novos listeners no ciclo do effect.
  3. Auditar todas as referências de ouvintes de eventos da janela em `TelemedicineRoom.tsx`.

---

### 🛠 Issue 3: Desconexão e Limpeza de Analisadores de Áudio (Web Audio API)
- **Análise Técnico-Estrutural**: O áudio síncrono é decodificado via `AudioContext`. Se o contexto permanecer aberto ou os analisadores conectados, o navegador continuará processando áudio silencioso no background.
- **Passos para Resolução**:
  1. Interromper o loop do `requestAnimationFrame` limpando a ID salva no estado (`cancelAnimationFrame(animId)`).
  2. Chamar `.disconnect()` em todas as fontes e nós de análise de áudio.
  3. Fechar explicitamente o contexto de áudio:
     ```typescript
     if (audioCtx && audioCtx.state !== 'closed') {
       audioCtx.close().then(() => console.log("[Audio] AudioContext encerrado com sucesso."));
     }
     ```

---

### 🛠 Issue 4: Responsividade e Layout Compacto em Telas < 360px
- **Análise Técnico-Estrutural**: Menus, modais e a barra de controle flutuante inferior (`footer`) utilizam padding fixo que espreme os controles em larguras de tela de 320px-360px.
- **Passos para Resolução**:
  1. Mapear o grid de controles no footer e aplicar paddings menores usando seletores responsivos (por exemplo: `gap-2 sm:gap-6 px-2 sm:px-10` e classes como `max-xs:px-1.5 max-xs:gap-1`).
  2. Ajustar os tamanhos de ícones e botões de controle para se adaptarem de `w-12 h-12` para `w-10 h-10` em dispositivos ultra-compactos, preservando a área de clique de 44px com margem mínima de segurança.
  3. Revisar o tamanho da fonte das abas clínicas do prontuário para reduzir de `text-sm` para `text-xs` ou `text-[10px]` dinamicamente no mobile para evitar colapso visual do grid lateral do médico.
