# Plano de Implementação de Telemedicina Avançada (telemedicine-plan.md)
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

Este plano detalha a pesquisa técnica prévia e os passos sequenciais para a implementação das especificações presentes em `/analytics/issues/` sem realizar qualquer modificação no código ativo do sistema Vitta nesta etapa.

---

## 🔬 1. Pesquisa Técnica e Mitigação de Riscos

### A. Roteamento SPA e Manipulação de Parâmetros de URL
* **Desafio:** Como o sistema é uma SPA (Single Page Application) montada por abas interativas, a inserção de caminhos na URL (`/sala`) pode causar mal comportamento se o servidor nginx não possuir roteamento curinga estático ou se causar quebras em assets.
* **Solução Planificada:** Utilizar o formato seguro de query string na própria raiz do sistema: `?room={id}`. É interpretável no carregamento global em qualquer ambiente e facilmente limpo utilizando a History API do navegador sem forçar um refresh:
  ```ts
  window.history.replaceState({}, document.title, window.location.pathname);
  ```

### B. Invalidação de Transmissão de Mídia Segura
* **Desafio:** Garantir que após a finalização da teleconsulta, os recursos locais do usuário (câmera e microfone) sejam encerrados em baixo nível no navegador do paciente e do doutor, liberando os dispositivos de mídia.
* **Solução Planificada:** Adicionar limpeza ativa quando a consulta transita para `completed`. No `useEffect` do `TelemedicineRoom`, guardar uma referência para o `localStream` e iterar em todas as faixas chamando `.stop()` antes de desmontar o componente e exibir a tela de links expirados.

### C. Escuta em Tempo Real do Firestore e Vazamento de Memória
* **Desafio:** Manter listeners de snapshots do Firestore sem causar memory leak ou re-rendereização circular do app.
* **Solução Planificada:** Retornar a função de desinscrição do snapshot (`unsubscribe`) de dentro do `useEffect` correspondente do `TelemedicineRoom` ou do roteador principal para limpar os listeners de forma limpa nos ciclos normais de vida do React.

---

## 🚀 2. Cronograma de Implementação (Fases Recomendadas)

O desenvolvimento deve seguir uma ordem pragmática baseada em dependências mútuas, minimizando retrabalhos:

### Fase 1: Geração, Persistência e UI de Cópia (Foco: Issue #2)
1. **Modelagem de Dados:** Garantir que toda e qualquer consulta com chave de teleconsulta gere um ID randômico ou use o próprio `doc.id` do agendamento como o token da sala.
2. **Escrita no Firestore:** Atualizar handlers de agendamento de consultas na raiz e nos modais para incluir:
   * `telemedicineRoomId`
   * `telemedicineUrl` (computado como `${window.location.origin}/?room=${id}`)
3. **Botão In-App de Links:** Adicionar botão de cópia com ícone de link e toast de feedback nos cards de agendameto do paciente e do doutor.

### Fase 2: Interceptador Deep-linking e Roteamento Direto (Foco: Issue #1)
1. **Detecção Global:** Adicionar lógica de interceptação na raiz do app (`App.tsx`).
2. **Processamento do Link Único:**
   * Ler `?room=XYZ` e buscar correspondência no Firestore.
   * Se correspondente, setar o estado `activeTelemedicineApt`.
3. **Limpeza Inteligente do Path:** Limpar a URL removendo a query string para deixar o visual impecável.

### Fase 3: Monitor de Ciclo de Vida e Expiração (Foco: Issue #3)
1. **Proteção Reativa:** Modificar o componente `TelemedicineRoom` para ler em tempo real o status no snapshot.
2. **Renderizador de Conclusão:** Se status mudar para `completed` ou `cancelled`, encerrar fluxos WebRTC e renderizar a tela de encerramento bonita, impedindo acessos posteriores.

### Fase 4: Proteções de Acesso e Convidados (Foco: Issue #4)
1. **Guarda de Sessão:** Validar se o usuário autenticado atual corresponde ao médico ou paciente do agendamento.
2. **Login no Loop:** Se um participante não autenticado tentar acessar, reter a query string, direcioná-lo ao login simplificado e redirecionar de volta à sala após sucesso.

---

## 🧪 3. Plano de Teste e Validação

Para certificar as implementações pós-codificação:
- **Caso de Teste 1 (Geração):** Agendar uma teleconsulta e verificar se o link único é gerado, e se o botão copia e formata a URL perfeitamente.
- **Caso de Teste 2 (Inicialização por URL):** Abrir uma nova janela anônima e acessar o link gerado com `?room=XYZ`. Validar o login obrigatório e o encaminhamento automático à sala de vídeo.
- **Caso de Teste 3 (Invalidação Progressiva):** Manter médico e pacientes com a chamada aberta. O médico clica em finalizar. Testar se o feed do paciente congela e redireciona reativamente para a tela de finalização.
- **Caso de Teste 4 (Sanidade após Finalização):** Tentar re-acessar o link de uma consulta que já consta como `completed`. Conferir se de fato o sistema bloqueia o acesso, notificando sobre a expiração.
---
