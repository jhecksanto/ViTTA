# Especificação Técnica de Finalização do Sistema - ViTTA Health
**Data e Hora de Geração:** 28 de agosto de 2026, 18:10:39 (Horário de Brasília)

---

## 🎯 1. Escopo e Objetivos da Especificação
Esta especificação descreve com precisão **apenas o que resta finalizar e consolidar** no sistema **ViTTA Health**, conforme detalhado no relatório `analytics/report.md`. Não abrange novas telas ou funcionalidades não iniciadas, restringindo-se ao fechamento das pontas soltas nos componentes e fluxos existentes.

---

## 📑 2. Especificação por Componente e Módulo

---

### 📦 2.1. Módulo Administrativo: Padronização de Wrappers Firestore
- **Arquivos-Alvo**:
  - `src/components/Admin/AdminLiberalConfigView.tsx`
  - `src/components/Admin/AdminVoucherManagementView.tsx`
  - `src/components/Admin/SubscriptionManagementView.tsx`
  - `src/components/NotificationCenter.tsx`
- **Comportamento Esperado**:
  - Todas as chamadas de mutação no Firestore (`addDoc`, `setDoc`, `updateDoc`, `deleteDoc`) devem ser importadas exclusivamente de `../../lib/firestore-wrappers` (ou `../lib/firestore-wrappers`).
  - Nenhum objeto com propriedades com valor `undefined` deve ser enviado ao Firestore; o wrapper `sanitizeData` deve filtrar e normalizar valores antes do envio.
  - As operações que utilizam `Timestamp`, `increment` ou `FieldValue` nativos do Firebase devem manter suas instâncias preservadas.
- **Critérios de Aceite**:
  - Remoção de 100% dos imports diretos de mutação de `'firebase/firestore'` nesses arquivos.
  - Gravação bem-sucedida de profissionais liberais, vouchers e planos contendo campos opcionais vazios sem gerar exceções de `FirebaseError: Function updateDoc() called with invalid data. Unsupported field value: undefined`.

---

### 🛡 2.2. Registro Atômico de Auditoria Administrativa (Audit Trail)
- **Arquivos-Alvo**:
  - `src/components/Admin/AdminLiberalConfigView.tsx`
  - `src/components/Admin/AdminVoucherManagementView.tsx`
  - `src/components/Admin/SubscriptionManagementView.tsx`
  - `src/components/Admin/AuditLogsList.tsx`
- **Comportamento Esperado**:
  - Ao criar, atualizar ou excluir qualquer registro crítico (Voucher, Categoria, Profissional Liberal ou Plano de Assinatura), a aplicação deve disparar a gravação de um documento na coleção `audit_logs`.
  - Estrutura do documento de auditoria:
    ```typescript
    interface AuditLogEntry {
      adminId: string;
      adminName: string;
      action: 'CREATE_CATEGORY' | 'UPDATE_CATEGORY' | 'DELETE_CATEGORY' |
              'CREATE_PROFESSIONAL' | 'UPDATE_PROFESSIONAL' | 'DELETE_PROFESSIONAL' |
              'UPDATE_VOUCHER_CONFIG' | 'CREATE_VOUCHER' | 'DELETE_VOUCHER' |
              'CREATE_PLAN' | 'UPDATE_PLAN' | 'DELETE_PLAN';
      description: string;
      before?: any;
      after?: any;
      timestamp: Timestamp;
    }
    ```
  - As operações de gravação de log devem utilizar `addDoc` via wrapper sanitizado e nunca impedir a ação principal caso ocorra falha de rede/permissão (encapsulamento em `try/catch` seguro).
- **Critérios de Aceite**:
  - Todas as ações administrativas produzem entradas auditáveis visíveis no modal e listagem de `AuditLogsList.tsx`.
  - O visualizador de diffs do `ChangeInspector` em `AuditLogsList.tsx` exibe os valores anteriores (`before`) e posteriores (`after`) corretamente formatados.

---

### 🔔 2.3. Centro de Notificações: Operações em Lote e Sanitização
- **Arquivos-Alvo**:
  - `src/components/NotificationCenter.tsx`
- **Comportamento Esperado**:
  - Ação "Marcar todas como lidas" (`markAllAsRead`):
    - Obter os IDs das notificações não lidas (`read == false`).
    - Agrupar em lotes de até 500 operações por `writeBatch` (limite da API do Firestore).
    - Executar o `batch.commit()` e emitir feedback no estado local.
  - Ação "Limpar notificações" (`clearAll`):
    - Executar a exclusão de notificações lidas ou selecionadas utilizando `writeBatch`.
- **Critérios de Aceite**:
  - Não há vazamento de memória ou travamento da UI ao interagir com o dropdown de notificações.
  - As notificações são marcadas como lidas de forma instantânea e persistente.

---

### 💳 2.4. Gestão de Planos de Assinatura e Sincronização Híbrida
- **Arquivos-Alvo**:
  - `src/components/Admin/SubscriptionManagementView.tsx`
- **Comportamento Esperado**:
  - No modo local (quando a chave do Mercado Pago não estiver configurada ou a API retornar indisponibilidade), a coleção `subscription_plans` do Firestore deve ser a fonte primária da verdade.
  - A criação e edição de planos locais deve gravar campos normalizados:
    ```typescript
    {
      name: string;
      price: number;
      frequency: number;
      frequencyType: 'months' | 'years' | 'days';
      status: 'active' | 'inactive';
      isLocal: boolean;
      createdAt: Timestamp;
      updatedAt: Timestamp;
    }
    ```
  - A exclusão de planos locais deve invocar o `deleteDoc` sanitizado e fechar os listeners ativos de snapshot no desmonte do componente.
- **Critérios de Aceite**:
  - Planos locais podem ser criados, editados e excluídos sem inconsistências visuais ou dados órfãos no Firestore.
  - Limpeza estrita dos listeners no hook de ciclo de vida (`useEffect`).

---

### 📍 2.5. Integração ViaCEP com Timeout e Resiliência de Erros
- **Arquivos-Alvo**:
  - `src/lib/utils.ts`
  - `src/components/Admin/AdminLiberalConfigView.tsx`
- **Comportamento Esperado**:
  - A função `fetchAddressByCep` deve:
    - Normalizar a string removendo caracteres não numéricos.
    - Interromper a busca se o CEP não possuir exatamente 8 dígitos.
    - Utilizar `AbortController` com timeout de 6 segundos para evitar travamento em redes lentas.
    - Tratar a resposta da API do ViaCEP quando retornar `{ "erro": true }` ou status HTTP não-200, retornando `null` de maneira previsível.
  - No componente `AdminLiberalConfigView.tsx`, exibir indicador de carregamento discreto enquanto a busca de CEP é processada e auto-preencher logradouro, bairro, cidade e estado sem travar os campos manuais.
- **Critérios de Aceite**:
  - Digitação de CEP válido preenche os campos automaticamente.
  - Digitação de CEP inexistente ou sem conexão não bloqueia o preenchimento manual do endereço pelo administrador.

---

### 📡 2.6. Robustez de Reconexão e Eventos WebRTC na Telemedicina
- **Arquivos-Alvo**:
  - `src/components/TelemedicineRoom.tsx`
- **Comportamento Esperado**:
  - Monitorar os eventos `peerConnection.oniceconnectionstatechange` e `peerConnection.onconnectionstatechange`.
  - Caso o estado mude para `'disconnected'` ou `'failed'`, acionar tentativa de recuperação de sinalização com notificação toast informativa ao usuário ("Reconectando chamada de vídeo...").
  - Ao reestabelecer (`'connected'`), restaurar os seletores de mídia sem duplicar os nós de `AudioContext` ou ouvintes de áudio.
- **Critérios de Aceite**:
  - Em oscilações de rede temporárias, a chamada tenta recuperar a sessão automaticamente antes de acionar o encerramento forçado.
  - Todos os recursos de hardware continuam sendo imediatamente destruídos ao clicar em "Encerrar Atendimento".
