# Issue 03: Integração Real da Visualização de Exames (`ExamsView`)

**Descrição:**
A visualização de exames do paciente ainda utiliza dados mockados. É necessário conectar à coleção real do Firestore e habilitar o download dos resultados.

**Tarefas:**
1.  Substituir o uso de `MOCK_EXAMS` no componente `ExamsView` por uma consulta real ao Firestore.
2.  Usar `onSnapshot` na coleção `exams` filtrando por `userId == auth.currentUser.uid`.
3.  Implementar a funcionalidade do botão "Baixar": deve abrir o link contido em `resultUrl` em uma nova aba.
4.  Implementar a lógica de filtragem funcional para os botões de status (Todos, Prontos, Pendentes).

**Critérios de Aceite:**
*   A lista de exames deve refletir os documentos reais do usuário no Firestore.
*   O botão de download deve funcionar para exames com status 'ready'.
