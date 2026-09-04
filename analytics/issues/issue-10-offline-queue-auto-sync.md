# Issue 10: Auto-Sincronização da Fila Offline no Evento de Conexão
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Resiliência & Modo Offline  
**Componente Principal:** `src/lib/offlineQueue.ts`, `src/components/OfflineIndicator.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
A fila de operações offline (`offlineQueue.ts`) armazena ações locais quando a internet oscila, mas deve disparar a sincronização imediatamente e de forma transparente assim que o evento `window.addEventListener('online', ...)` for emitido pelo navegador, sem exigir intervenção do usuário.

---

## 2. Tarefas de Implementação
- [ ] Configurar listener global no `offlineQueue.ts` para capturar a reconexão à internet.
- [ ] Executar o descarregamento idempotente das operações acumuladas no IndexedDB/LocalStorage para o Firestore.
- [ ] Atualizar o componente visual `OfflineIndicator.tsx` para sinalizar transição suave entre "Sincronizando..." e "Conexão restabelecida".

---

## 3. Critérios de Aceite
1. Ações enfileiradas offline são enviadas automaticamente ao Firestore logo que a rede retorna.
2. O indicador visual de status informa com clareza o término da sincronização dos dados pendentes.
