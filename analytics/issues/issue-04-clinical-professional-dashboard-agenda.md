# Issue 04: Dashboard Clínico, Prontuário Eletrônico e Agenda Médica
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Clínico & Médico  
**Páginas:** `professional-dashboard` (`ProfessionalDashboardView`), `professional-agenda` (Agenda View)

---

## 1. Escopo & Objetivos
Finalizar a conclusão formal de consultas no prontuário SOAP, visualização de histórico biométrico/exames durante o atendimento e o modal de bloqueio de horários na agenda médica.

## 2. Tarefas Detalhadas
- [ ] **Conclusão de Consulta com Split Automático:** Ação de finalizar consulta que atualiza status para `completed`, registra evolução clínica no prontuário (`patient_records`) e credita o valor líquido na carteira do médico.
- [ ] **Histórico Biométrico Integrado:** Painel lateral na consulta exibindo evolução de peso, IMC, pressão e exames anteriores do paciente.
- [ ] **Bloqueio de Horários e Ausências:** Modal para cadastrar períodos bloqueados na agenda com validação de consultas conflitantes e opção de remanejamento.
- [ ] **Configuração de Intervalos de Consulta:** Seletor de duração padrão (15, 30, 45, 60 min) recalculando a grade de slots.

## 3. Critérios de Aceite
- Finalizar a consulta atualiza simultaneamente o prontuário, a carteira do médico e o status do agendamento.
- Horários bloqueados não ficam disponíveis para novos agendamentos por pacientes.
- O médico visualiza os dados biométricos do paciente sem sair da tela do prontuário.
