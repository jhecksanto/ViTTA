# Especificação Técnica de Implementações Restantes
**Arquivo de Referência:** `analytics/report.md`  
**Escopo:** Somente o necessário para fechar frentes abertas (Telemedicina, Offline Sync, Vitta Coins).  

---

## 1. Módulo: Telemedicina (Integração de Vídeo Atendimento)

### A. Component (Componente Visual)
* **Status:** O componente da sala em si (`TelemedicineRoom`) já está escrito. Nenhum componente visual independente adicional precisa ser feito do zero.
* **Modificação no Componente Existente:** Ajustar pequenas amarrações internas de imports de ícones, se houver, mas primordialmente integrá-lo na hierarquia.

### B. Page / Shell View (Transição de Página)
* **Tratamento de Estado no `App.tsx`:**
  * Declarar o estado `activeTelemedicineApt` do tipo `any | null` na raiz do componente `App`.
  * Na renderização condicional do switch principal do `App` (onde estão as visualizações de Abas de Paciente e Painéis do Médico), realizar a seguinte interceptação:
    ```typescript
    if (activeTelemedicineApt) {
      return (
        <TelemedicineRoom 
          user={user}
          userData={userData}
          appointment={activeTelemedicineApt}
          onLeave={() => setActiveTelemedicineApt(null)}
        />
      );
    }
    ```
  * O retorno de `onLeave` limpa o estado, fazendo o usuário voltar de forma instantânea e natural à aba que estava antes, preservando o estado do aplicativo.

### C. Behavior (Comportamentos Esperados)
* **Fluxo do Paciente:**
  * Dentro da `AppointmentsView` (Aba de Consultas), os cards de consulta marcados para hoje que pertençam à especialidade elegível de teleatendimento ganham um botão adicional estilizado com o ícone `Video` de Lucide e o texto **"Entrar na Teleconsulta"**.
  * Ao clicar no botão, dispara: `setActiveTelemedicineApt(appointment)`.
* **Fluxo do Médico:**
  * Na `ProfessionalDashboardView` (Fila/Agenda do Dia do profissional), para cada agendamento com status `upcoming` ou `in_progress`, adicionar além do botão "Iniciar" um botão estilizado com o ícone `Video` e texto **"Atendimento em Vídeo"**.
  * Ao clicar no botão, o médico entra na sala virtual, disparando o fluxo em tempo real. O estado altera o status do agendamento para `in_progres` e altera as variáveis do Firestore: `doctorJoined: true`.

---

## 2. Módulo: Sincronização em Segundo Plano (Fila Local Offline)

### A. Component (Componentes Relacionados)
* **`OfflineIndicatorBanner.tsx`:** Atualizar o banner existente para que ele emita um sinal (via evento ou callback) avisando as funções do app que o estado mudou para `online`.

### B. Behavior (Comportamentos de Buffer e Enfileiramento)
* **Salvamento Condicional (Integração com Métricas):**
  * Toda ação de registro, edição ou remoção de:
    * Métricas de Saúde (Passos, Hidratação, Sono, Peso)
    * Metas de Saúde (Health Goals)
    * Lembretes de Medicamentos (Medications)
  * Deve verificar o estado de conexão utilizando `navigator.onLine`.
  * Se `false`:
    * Salvar os dados na coleção correspondente com um flag `isOfflinePending: true`.
    * Gravar uma referência das alterações necessárias em uma fila hospedada no `localStorage` sob a chave `"vitta_offline_sync_queue"`.
    * Exibir um toast informativo para o usuário: `"Salvando offline. Seus dados serão sincronizados ao reestabelecer a conexão."`
  * Se `true`: Realiza a gravação diretamente no Firestore (comportamento padrão).
* **Processamento de Fila de Retorno (Online Event Buffer):**
  * Na classe de inicialização do `App` ou em um `useEffect` principal que escuta a transição de rede:
    ```typescript
    window.addEventListener('online', handleNetworkRestore);
    ```
  * Ao ser disparado o evento:
    1. Ler toda a fila `"vitta_offline_sync_queue"`.
    2. Enviar sequencialmente os dados pendentes para o Firestore.
    3. Remover a chave do `localStorage`.
    4. Atualizar o estado visual do cliente (re-render) para que mostre os dados mais recentes.
    5. Emitir uma notificação toast unificada informando que a sincronização offline foi bem-sucedida.

---

## 3. Módulo: Polimento Visual do Fluxo Vitta Coins

### A. Component (Layout de Exibição de Vouchers Resgatados)
* **Lista de Benefícios Ativos:**
  * Garantir que as recompensas adquiridas pelo sistema de transações com Coins apareçam junto às ofertas tradicionais do plano que o usuário já possuía sob "Meus Benefícios" ou área correspondente na carteira.
  * O voucher derivado de moedas deve exibir uma tag distintiva dourada: `🪙 Resgatado via Vitta Coins` e um botão para abrir o código identificador (Simulado para resgate no parceiro).

### B. Behavior (Consumo de Vouchers de Telemedicina / Exames)
* **Comportamento Integrado:**
  * Quando o usuário visualizar o cupom resgatado, permitir simular o consumo marcando o voucher como "Utilizado" no Firestore, alterando seu status de `active` para `redeemed`, e gerando um registro no histórico.
