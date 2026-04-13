# Issue 4: Cálculo Dinâmico de Variação de Saúde

## Descrição
Substituir os valores estáticos de variação (`change`) no dashboard do paciente por cálculos reais baseados no histórico.

## Requisitos
- Buscar dados de `health_metrics` dos últimos 14 dias.
- Comparar a média da semana atual com a semana anterior.
- Calcular a porcentagem de variação.
- Atualizar os cards de estatísticas.

## Localização
`PatientDashboardView` em `src/App.tsx`.
