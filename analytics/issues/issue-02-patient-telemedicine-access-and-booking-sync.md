# Issue 02: Detecção de Telemedicina e Entrada na Sala pelo Paciente
**Data e Hora de Atualização:** 02/09/2026 às 20:34 (Horário de Brasília - UTC-3)  
**Status:** Concluída  
**Escopo:** Portal do Paciente / Agendamento e Acesso à Telemedicina

---

## 1. Contexto e Problema
1. No componente `MyAppointmentsView.tsx` (e na seção de consultas do `PatientDashboardView`), o cálculo para verificar se uma consulta é telemedicina utilizava exclusivamente `apt.type === 'telemedicine' || apt.isTelemedicine || apt.roomType === 'telemedicine'`.
2. No componente `ProfessionalsView.tsx`, ao confirmar o agendamento, o registro omitia `userId: user.uid`, `isTelemedicine: true`, `telemedicineRoomId` e `telemedicineUrl`.

---

## 2. Escopo de Alteração Realizado
* **Arquivos Alvo:**
  * `src/components/Patient/MyAppointmentsView.tsx`
  * `src/components/Patient/ProfessionalsView.tsx`
  * `src/App.tsx` (`PatientDashboardView`)
* Condição `isTelemedicine` expandida para reconhecer `modality === 'telemedicine'`, `'telemedicina'` e `'online'`.
* Inserção dos metadados de telemedicina e indexação `userId: user.uid` no agendamento em `ProfessionalsView.tsx`.
* Botão "Entrar na Sala" renderizado no dashboard e nas consultas do paciente.

---

## 3. Critérios de Aceite
- [x] Ao agendar uma teleconsulta em `ProfessionalsView`, o registro no Firestore contém `userId`, `modality: "telemedicine"` e `isTelemedicine: true`.
- [x] O paciente visualiza a consulta em `Minhas Consultas` e vê o botão verde **"Entrar na Sala"**.
- [x] Ao clicar no botão, o modal `TelemedicineRoom` é aberto com o agendamento correto.
