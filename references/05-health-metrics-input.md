# Issue 05: Implementar Entrada de Métricas de Saúde (`HealthMetricsInput`)

**Descrição:**
Criar uma interface para que o usuário possa registrar suas métricas de saúde (peso, pressão, etc.) manualmente.

**Tarefas:**
1.  Criar um componente `HealthMetricsInputModal`.
2.  Adicionar campos para: Peso, Altura, Pressão Arterial, Glicose e Horas de Sono.
3.  Implementar lógica para salvar esses dados na coleção `health_metrics` vinculada ao `userId`.
4.  Adicionar um botão de acesso a este modal na Dashboard ou no Perfil.

**Critérios de Aceite:**
*   O usuário deve conseguir salvar suas métricas.
*   As métricas salvas devem atualizar os cards da Dashboard automaticamente.
