# Issue 06: Padronização da Modalidade no Painel de Agendamentos Administrativo
**Data e Hora de Atualização:** 02/09/2026 às 20:35 (Horário de Brasília - UTC-3)  
**Status:** Concluída  
**Escopo:** Painel Administrativo / Gestão de Agendamentos

---

## 1. Contexto e Problema
No componente `AdminAppointmentsView.tsx`, a tabela de consultas conferia a modalidade com comparação restritiva e o reagendamento salvava apenas a string sem os metadados de telemedicina.

---

## 2. Escopo de Alteração Realizado
* **Arquivo Alvo:** `src/components/Admin/AdminAppointmentsView.tsx`
* Normalizada a verificação de modalidade para contemplar `"telemedicine"`, `"telemedicina"`, `isTelemedicine` e `type === "telemedicine"`.
* Normalizado o modal de reagendamento para reconhecer o status atual e salvar `modality: isTele ? "telemedicine" : "presencial"` junto aos campos `isTelemedicine`, `telemedicineRoomId` e `telemedicineUrl`.

---

## 3. Critérios de Aceite
- [x] Consultas de telemedicina são exibidas com o ícone de vídeo e rótulo "Telemedicina" na tabela do administrador.
- [x] O reagendamento para telemedicina mantém a consistência dos dados com o portal do paciente e do médico.
