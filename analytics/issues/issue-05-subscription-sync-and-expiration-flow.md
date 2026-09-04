# Issue 05: Sincronização de Expiração de Assinaturas e Cancelamento Programado
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Assinaturas & Planos ViTTA  
**Componente Principal:** `src/components/Patient/SubscriptionsView.tsx`, `src/components/Patient/SubscriptionPlansView.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
Assinaturas de planos de saúde/benefícios precisam ter seu ciclo de validade verificado automaticamente (`currentPeriodEnd`), atualizando o status do paciente para expirado caso não ocorra renovação, e permitindo o cancelamento programado mantendo os benefícios até o encerramento do ciclo pago.

---

## 2. Tarefas de Implementação
- [ ] Adicionar rotina de checagem de vigência da assinatura no carregamento das visões do paciente.
- [ ] Caso a data atual seja posterior a `currentPeriodEnd` e a assinatura não esteja renovada, marcar status como `expired` e desativar o cálculo de desconto ViTTA em consultas.
- [ ] Implementar fluxo de cancelamento programado (`cancelAtPeriodEnd: true`) informando ao paciente a data exata até quando os benefícios permanecem ativos.

---

## 3. Critérios de Aceite
1. Assinaturas vencidas bloqueiam automaticamente os descontos exclusivos ViTTA de forma transparente.
2. O cancelamento programado mantém o plano ativo até o último dia do período faturado.
