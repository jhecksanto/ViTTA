# Issue 03: Prescrições Médicas - Histórico do Paciente e Download de Receitas
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Prescrições / Paciente  
**Prioridade:** P0 (Crítica)  
**Arquivos Alvo:** `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Patient/PatientPrescriptionModal.tsx`

---

## 1. Descrição e Contexto
Após o término de uma consulta médica em que uma receita digital foi emitida, o paciente deve conseguir visualizar, imprimir e baixar a receita médica digital diretamente pelo seu painel de consultas (`MyAppointmentsView.tsx`), contendo as instruções de uso, CRM do médico e QR Code para validação em farmácias.

---

## 2. Requisitos Técnicos
1. **Botão de Visualização no Card de Consulta:**
   - No componente `MyAppointmentsView.tsx`, para consultas finalizadas (`status === 'completed'`) com dados de receita registrados, renderizar o botão `"Ver Receita Médica"`.
2. **Modal de Receita do Paciente (`PatientPrescriptionModal.tsx`):**
   - Receber a receita vinculada ou buscar pelo `prescriptionId` no Firestore.
   - Renderizar cabeçalho médico, dados do paciente, lista de medicamentos com posologia, orientações gerais e data de validade.
   - Disponibilizar botão de download em PDF e impressão formatada.

---

## 3. Critérios de Aceite
- [ ] Botão visível nas consultas que possuem prescrição emitida.
- [ ] O modal abre com todos os medicamentos e dados do profissional preenchidos.
- [ ] Botão de download do PDF e impressão funcionando perfeitamente.
