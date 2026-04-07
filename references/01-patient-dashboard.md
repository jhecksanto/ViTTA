# Issue 01: Implementar Dashboard do Paciente (`PatientDashboardView`)

**Descrição:**
Substituir o `PlaceholderView` atual da dashboard do paciente por uma implementação real que exiba métricas de saúde e resumos de atividades.

**Tarefas:**
1.  Criar o componente `PatientDashboardView` em `src/components/PatientDashboardView.tsx` (ou dentro de `App.tsx` se seguir o padrão atual).
2.  Implementar cards de métricas (Passos, Sono, Batimentos, Hidratação).
3.  Integrar com a coleção `health_metrics` do Firestore, filtrando pelo `userId` do usuário logado.
4.  Adicionar seção "Próximas Consultas" buscando os 3 agendamentos mais próximos com status 'upcoming'.
5.  Adicionar seção "Exames Recentes" buscando os 2 últimos exames com status 'ready'.
6.  Integrar `recharts` para exibir um gráfico de evolução semanal de uma métrica (ex: passos).

**Critérios de Aceite:**
*   A dashboard não deve mais exibir a mensagem de "Página em Desenvolvimento".
*   Dados reais do Firestore devem ser exibidos.
*   O layout deve ser responsivo e seguir a identidade visual do ViTTA Health.
