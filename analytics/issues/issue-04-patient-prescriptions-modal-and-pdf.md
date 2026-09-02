# Issue 04: Visualização e Download de Prescrições e Atestados pelo Paciente
**Data e Hora de Atualização:** 02/09/2026 às 20:37 (Horário de Brasília - UTC-3)  
**Status:** Concluída  
**Escopo:** Portal do Paciente / Prontuário e Documentos Digitais

---

## 1. Contexto e Problema
Durante o atendimento de telemedicina, o médico utiliza o `SOAPConsultationModal` ou o `PrescriptionModal` para emitir receitas de medicamentos e atestados. Esses dados são salvos no documento da consulta (`appointment.prescriptions`) e na coleção `prescriptions`. Contudo, na tela de `MyAppointmentsView.tsx`, o paciente não tinha uma forma de visualizar as prescrições médicas ou baixar o PDF gerado.

---

## 2. Escopo de Alteração Realizado
* **Arquivos Criados/Alterados:**
  * `src/components/Patient/PatientPrescriptionModal.tsx`: Modal completo para visualização de medicamentos, atestados, validação ICP-Brasil e download de PDF oficial com jsPDF.
  * `src/components/Patient/MyAppointmentsView.tsx`: Botão "Receita Digital" adicionado aos cards de consultas concluídas ou com prescrições, disparando o `PatientPrescriptionModal`.

---

## 3. Critérios de Aceite
- [x] Cards de consultas concluídas com receitas exibem o botão "Ver Receita Digital".
- [x] O paciente consegue abrir o modal e ler todos os itens da prescrição com clareza.
- [x] O botão de download gera e baixa o arquivo PDF com formatação visual limpa e dados corretos.
