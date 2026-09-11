# Issue 11: Segurança & Resiliência - Cooldown de 2FA e Auto-Sync da Fila Offline
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Segurança & Infraestrutura Offline  
**Prioridade:** P2 (Média)  
**Arquivos Alvo:** `src/components/TwoFactorModal.tsx`, `src/lib/offlineQueue.ts`, `src/components/OfflineIndicatorBanner.tsx`

---

## 1. Descrição e Contexto
No modal de verificação em duas etapas (`TwoFactorModal.tsx`), o botão de reenvio de código de segurança deve conter uma trava de segurança com contagem regressiva de 60 segundos para evitar abusos e custos excessivos de SMS/E-mail. Na camada de resiliência offline (`offlineQueue.ts`), a recuperação da conexão com a internet deve disparar automaticamente o processamento dos itens pendentes da fila sem a necessidade de recarregamento manual da aplicação.

---

## 2. Requisitos Técnicos
1. **Cooldown de 60s no 2FA:**
   - Adicionar estado `cooldown: number` iniciado em 60 ao enviar código.
   - Utilizar `useEffect` com `setInterval` para decrementar até 0.
   - Desabilitar o botão `"Reenviar código"` e exibir `"Reenviar em Xs"` enquanto `cooldown > 0`.
2. **Auto-Sync da Fila Offline no Evento `online`:**
   - Adicionar listener global `window.addEventListener('online', async () => { await offlineQueue.processQueue(); })`.
   - Exibir no `OfflineIndicatorBanner` o status `"Sincronizando dados pendentes..."` e mudar para `"Sincronizado com sucesso"` ao concluir.

---

## 3. Critérios de Aceite
- [ ] O botão de reenvio do 2FA aguarda 60 segundos antes de permitir novo disparo.
- [ ] Ao reconectar à internet, a fila offline processa as mutações automaticamente e notifica o usuário.
