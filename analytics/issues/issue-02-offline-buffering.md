# Issue 02: Sincronização em Segundo Plano (Offline Queue) para Métricas de Saúde
**ID:** `issue-02-offline-buffering`  
**Prioridade:** Média-Alta  
**Status:** Pronto para Planejamento  

---

## 1. Descrição do Problema
O aplicativo possui o componente `OfflineIndicatorBanner.tsx` para detectar falta de conexão visualmente, mas não há um comportamento de persistência tolerante a falhas na hora de registrar dados de saúde (passos, ingestão de água, horas de sono, registro de peso), programar medicamentos ou marcar metas de saúde quando o associado está desconectado. O aplicativo tenta falar direto com o Firebase e gera silenciosamente falhas de rede ou bloqueia o salvamento de dados importantes.

---

## 2. Abordagem / Planejamento Técnico Detalhado

### A. Criação do Mecanismo de Fila Local (`LocalStorage`)
1. Implementar uma função auxiliar de enfileiramento em `src/lib/offlineQueue.ts` ou diretamente em um helper:
   ```typescript
   export const enqueueOfflineAction = (actionType: 'CREATE_METRIC' | 'CREATE_GOAL' | 'CREATE_MED', payload: any) => {
     const queue = JSON.parse(localStorage.getItem('vitta_offline_sync_queue') || '[]');
     queue.push({
       id: Math.random().toString(36).substring(7),
       type: actionType,
       payload,
       timestamp: new Date().toISOString()
     });
     localStorage.setItem('vitta_offline_sync_queue', JSON.stringify(queue));
   };
   ```

### B. Modificação do fluxo de Gravação do Cliente
1. Em locais onde informações de métricas são persistidas (ex: no modal de métricas, modal de medicação e modal de metas em `src/App.tsx`), interceptar o comportamento normal do Firebase com uma verificação condicional:
   ```typescript
   if (!navigator.onLine) {
     // Modo Offline
     enqueueOfflineAction('CREATE_METRIC', metricData);
     // Adicionar localmente ao estado do React para que o usuário sinta que salvou
     setMetricsHistory(prev => [mockMetric, ...prev]); 
     addToast('Você está offline. Alterações salvas no seu celular e serão enviadas quando a internet voltar.', 'info');
     return;
   }
   ```

### C. Criação do Listener de Processamento Automático no Retorno de Rede
1. No `useEffect` raiz do `App.tsx` (ou monitorando o evento em um componente de escuta centralizado), adicionar o callback de rede reestabelecida:
   ```typescript
   useEffect(() => {
     const processOfflineQueue = async () => {
       if (!navigator.onLine) return;
       const queue = JSON.parse(localStorage.getItem('vitta_offline_sync_queue') || '[]');
       if (queue.length === 0) return;

       addToast('Conexão detectada! Sincronizando dados offline...', 'info');

       try {
         for (const item of queue) {
           if (item.type === 'CREATE_METRIC') {
             await addDoc(collection(db, 'health_metrics'), item.payload);
           } else if (item.type === 'CREATE_GOAL') {
             await addDoc(collection(db, 'health_goals'), item.payload);
           } else if (item.type === 'CREATE_MED') {
             await addDoc(collection(db, 'medications'), item.payload);
           }
         }
         
         // Limpa fila após processar todos
         localStorage.removeItem('vitta_offline_sync_queue');
         addToast('Todas as atualizações locais foram sincronizadas com o servidor!', 'success');
       } catch (error) {
         console.error("Erro ao sincronizar fila offline:", error);
         addToast('Erro ao sincronizar algumas métricas offline. Tentando na próxima reconexão.', 'error');
       }
     };

     window.addEventListener('online', processOfflineQueue);
     return () => window.removeEventListener('online', processOfflineQueue);
   }, []);
   ```

---

## 3. Critérios de Aceitação
- [ ] O usuário consegue abrir o modal de métricas de passos ou água, digitar uma mudança e clicar em Salvar enquanto simula estar em modo offline.
- [ ] O sistema não aborta o fluxo com erro do console Firebase e em vez disso exibe um toast amigável que salvou o dado localmente.
- [ ] Ao religar a conexão (estado online detectado), o sistema chama o processador de fila, envia os registros para o Firestore de forma silenciosa e limpa e atualiza a tela do usuário com sucesso.
