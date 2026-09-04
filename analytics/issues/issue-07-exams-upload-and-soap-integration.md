# Issue 07: Upload de Exames com Progresso e Integração ao Prontuário SOAP
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Exames Laboratoriais & Prontuário SOAP  
**Componente Principal:** `src/components/Patient/PatientExamsView.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
O paciente anexa exames complementares e laudos médicos que precisam ser consultados com facilidade pelo médico durante o atendimento na teleconsulta, diretamente no modal de prontuário SOAP.

---

## 2. Tarefas de Implementação
- [ ] Adicionar indicador visual de progresso e validação de tamanho (até 15MB) no upload de exames pelo paciente.
- [ ] Na janela de atendimento SOAP do médico (`SOAPConsultationModal.tsx`), incluir aba lateral "Exames Anexados do Paciente".
- [ ] Renderizar miniaturas e links de download seguro dos exames históricos do paciente para consulta clínica em tempo real.

---

## 3. Critérios de Aceite
1. O upload de exames exibe barra percentual de carregamento e trata limites de tamanho.
2. O médico consegue abrir e analisar os laudos e exames anexados pelo paciente durante a consulta sem sair do prontuário.
