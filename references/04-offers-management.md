# Issue 04: CRUD Completo de Ofertas no Painel Admin (`OffersManagementView`)

**Descrição:**
Finalizar a implementação da gestão de ofertas para que administradores possam cadastrar, editar e excluir promoções de parceiros.

**Tarefas:**
1.  Implementar as funções `handleCreate`, `handleEdit` e `handleDelete` no componente `OffersManagementView`.
2.  Criar/Ajustar o formulário modal para capturar: Título, Parceiro, Desconto (%), Descrição e URL da Imagem.
3.  Garantir que as alterações sejam refletidas em tempo real na coleção `offers`.
4.  Adicionar validações básicas nos campos do formulário.

**Critérios de Aceite:**
*   Admin deve conseguir criar uma nova oferta e vê-la na lista imediatamente.
*   Admin deve conseguir editar uma oferta existente.
*   Admin deve conseguir excluir uma oferta após confirmação.
