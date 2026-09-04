# Issue 02: Visualização e Download de Receitas Médicas pelo Paciente
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Prescrições / Paciente  
**Componente Principal:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
Após uma teleconsulta concluída com prescrição digital emitida pelo médico, o paciente precisa ter acesso imediato às suas receitas médicas no histórico de consultas, com visualização clara dos medicamentos prescritos e opção de download do PDF assinado digitalmente.

---

## 2. Tarefas de Implementação
- [ ] No card de consultas concluídas em `MyAppointmentsView.tsx`, verificar a presença de dados de prescrição médica (`prescriptionId` ou `prescriptionData`).
- [ ] Exibir botão "Visualizar Receita Médica" com ícone de documento no card da consulta correspondente.
- [ ] Integrar a abertura do `PatientPrescriptionModal.tsx` passando os dados da receita (medicamentos, posologia, orientações, CRM/UF e carimbo do médico).
- [ ] Garantir o funcionamento da exportação e download do PDF via `jspdf` com layout médico profissional e QR Code de autenticação.

---

## 3. Critérios de Aceite
1. O paciente consegue visualizar suas receitas médicas diretamente no histórico de consultas concluídas.
2. O modal exibe detalhadamente cada medicamento, quantidade e instrução de uso.
3. O download do PDF da receita médica é gerado sem erros e com formatação legível para apresentação em farmácias.
