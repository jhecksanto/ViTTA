# Issue 07: Refinamentos de UI/UX e Notificações

**Descrição:**
Melhorar a experiência do usuário com estados de carregamento, buscas eficientes e notificações em tempo real.

**Tarefas:**
1.  **Skeletons:** Implementar componentes de Skeleton para as listas de Profissionais, Parceiros e Exames.
2.  **Busca Otimizada:** Garantir que os inputs de busca filtrem os dados localmente de forma performática.
3.  **Notificações:** Implementar um listener na coleção `notifications` e exibir um indicador visual (badge) no ícone de sino.
4.  **Tratamento de Erros:** Revisar todos os blocos `try/catch` de operações Firebase para garantir que usem `handleFirestoreError`.

**Critérios de Aceite:**
*   O usuário não deve ver telas brancas ou vazias durante o carregamento inicial.
*   O sistema de notificações deve mostrar alertas quando novos exames forem liberados (simular via Firestore).
