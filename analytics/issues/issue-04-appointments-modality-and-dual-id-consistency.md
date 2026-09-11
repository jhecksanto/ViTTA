# Issue 04: Agendamentos - Normalização de Modalidade e Persistência de IDs Duplos
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Agendamentos / Consistência de Dados  
**Prioridade:** P0 (Crítica)  
**Arquivos Alvo:** `src/components/Patient/ProfessionalsView.tsx`, `src/components/Patient/MyAppointmentsView.tsx`, `src/components/Admin/AdminAppointmentsView.tsx`, `src/types.ts`

---

## 1. Descrição e Contexto
Identificou-se que agendamentos antigos ou gravados em diferentes versões do sistema utilizavam variações na string de modalidade (`"telemedicine"`, `"telemedicina"`, `"online"`, `"presential"`, `"presencial"`), além de inconsistências na nomenclatura de chaves de identificação do paciente (`userId` vs `patientId`) e do profissional (`professionalUserId` vs `professionalId`).

---

## 2. Requisitos Técnicos
1. **Helper de Normalização de Modalidade:**
   - Criar e utilizar `isTelemedicineModality(modality?: string): boolean` para checagens seguras e uniformes.
   - Gravar novos agendamentos estritamente com os valores canônicos: `"telemedicine"` ou `"presential"`.
2. **Persistência de Identificadores Duplos:**
   - Ao criar o documento de agendamento na coleção `appointments`, salvar sempre:
     ```typescript
     {
       userId: user.uid,
       patientId: user.uid,
       patientName: user.displayName || user.name,
       professionalId: professional.id,
       professionalUserId: professional.userId || professional.id,
       professionalName: professional.name,
       modality: selectedModality === 'telemedicine' ? 'telemedicine' : 'presential'
     }
     ```
   - Nas listagens do paciente e do médico, recuperar os agendamentos suportando ambas as propriedades para compatibilidade total com registros anteriores.

---

## 3. Critérios de Aceite
- [ ] Todas as consultas de telemedicina exibem o badge e botão de acesso à sala sem falha de renderização.
- [ ] Consultas listadas corretamente tanto no painel do paciente quanto na agenda do médico.
