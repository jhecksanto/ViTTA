# Issue 09: Exames Laboratoriais - Barra de Progresso e Painel Integrado ao SOAP
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Exames & Prontuário Médico  
**Prioridade:** P2 (Média)  
**Arquivos Alvo:** `src/components/Patient/ExamsView.tsx`, `src/components/Professional/SOAPConsultationModal.tsx`

---

## 1. Descrição e Contexto
O paciente realiza upload de seus laudos e exames laboratoriais em formato PDF e imagens. Durante esse processo, uma barra de progresso visual deve ser exibida. Durante a consulta médica por telemedicina, o profissional de saúde precisa consultar o histórico de exames anexados pelo paciente diretamente em uma aba lateral do prontuário SOAP, sem precisar trocar de tela.

---

## 2. Requisitos Técnicos
1. **Upload com Barra de Progresso e Validações:**
   - Em `ExamsView.tsx`, validar tipos (`application/pdf`, `image/jpeg`, `image/png`) e tamanho máximo de 15MB.
   - Utilizar o listener `uploadBytesResumable` do Firebase Storage para calcular o percentual e renderizar uma barra de progresso visual fluida durante o upload.
2. **Aba de Exames no Modal SOAP (`SOAPConsultationModal.tsx`):**
   - No drawer/painel de anotações médicas, adicionar a aba `"Exames do Paciente"`.
   - Consultar em tempo real os exames cadastrados pelo paciente (`patientId === appointment.patientId`).
   - Permitir abertura e visualização do PDF/imagem do laudo em um modal secundário sem fechar o prontuário.

---

## 3. Critérios de Aceite
- [ ] O upload de exames exibe o progresso de 0 a 100% de forma clara.
- [ ] O médico consegue consultar e abrir os laudos e imagens do paciente durante o atendimento SOAP.
