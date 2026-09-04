# Issue 03: Normalização de Modalidade e Persistência de IDs Duplos em Agendamentos
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Agendamentos & Agenda Médica  
**Componente Principal:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
Existem variações no cadastro e consulta de modalidade de atendimento (e.g. `"telemedicine"`, `"telemedicina"`, `"online"`) e inconsistências nas chaves de identificação do paciente (`userId` vs `patientId`) e médico (`professionalUserId` vs `professionalId`), o que pode ocultar consultas em certas queries do Firestore ou bloquear o botão de entrada na teleconsulta.

---

## 2. Tarefas de Implementação
- [ ] Criar função helper utilitária `isTelemedicineModality(modality: string): boolean` para normalizar todas as checagens no frontend.
- [ ] Garantir que na criação de novo agendamento sejam gravados simultaneamente os campos `userId`, `patientId`, `professionalUserId` e `professionalId`.
- [ ] Atualizar as queries de busca do paciente e do profissional para aceitar ambos os campos de UID.
- [ ] Adicionar fluxo de estorno automático do valor da consulta para a carteira digital do paciente em cancelamentos solicitados antes do limite de tolerância.

---

## 3. Critérios de Aceite
1. Todas as consultas marcadas como telemedicina exibem o botão "Entrar na Consulta" no horário agendado de forma consistente.
2. Nenhuma consulta deixa de aparecer na listagem do médico ou paciente por discrepância de nomenclatura de ID.
3. Consultas canceladas com antecedência creditam o reembolso integral na carteira do paciente com registro em extrato.
