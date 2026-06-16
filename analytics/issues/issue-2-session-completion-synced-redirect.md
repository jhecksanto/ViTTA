# Issue #2: Propagação Síncrona de Término de Sessão (Safe Exit and Redirect Sync)
**Data e Hora de Geração:** 15 de junho de 2026, 21:34:25 (Horário de Brasília)

---

## 📌 Descrição
Garantir total sincronização na finalização da chamada. Ao disparar o encerramento do atendimento (seja pelo médico clicando em "Finalizar" ou pelo respectivo status do agendamento mudar para `completed` no Firestore), ambos os participantes (Paciente e Médico) devem ser notificados imediatamente, fechando seus fluxos e sendo redirecionados sem atrasos para suas telas de origem.

## 🛠 Critérios de Aceite e Métricas
1. **Sincronia baseada no Firestore**:
   - O `onSnapshot` que monitora as atualizações da consulta deve ler a transição de `status` para `completed`.
2. **Ciclo de Saída**:
   - Desativar transmissões de áudio e fechar streams locais.
   - Mostrar uma tela de agradecimento ("Sessão Finalizada") com um timer sutil (ex: 2.5s) e fazer o redirecionamento.
   - **Paciente**: Retorna para a aba de histórico de agendamentos.
   - **Médico**: Retorna para o Dashboard Clínico correspondente.
