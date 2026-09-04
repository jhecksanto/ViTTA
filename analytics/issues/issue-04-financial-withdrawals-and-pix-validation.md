# Issue 04: Validação de Chaves Pix e Comprovante de Saque para o Profissional
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Financeiro & Repasses  
**Componente Principal:** `src/components/Professional/ProfessionalFinanceView.tsx`, `src/components/Professional/PayoutReceiptModal.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
Na solicitação de saque Pix pelo profissional de saúde ou parceiro liberal, é necessário validar o formato da chave informada (CPF, CNPJ, E-mail, Telefone ou Chave Aleatória EVP) antes da submissão para prevenir erros operacionais na liquidação bancária, além de permitir a consulta do comprovante bancário da liquidação processada pelo administrador.

---

## 2. Tarefas de Implementação
- [ ] Implementar validação regex no formulário de solicitação de saque em `ProfessionalFinanceView.tsx` para cada tipo de chave Pix.
- [ ] Bloquear a submissão caso a chave Pix não esteja em formato válido e exibir feedback em tempo real.
- [ ] Integrar modal de comprovante de saque `PayoutReceiptModal` na listagem de saques finalizados do profissional, exibindo o código de liquidação bancária E2E, data e valor líquido recebido.

---

## 3. Critérios de Aceite
1. O profissional só consegue solicitar saques com chaves Pix estritamente válidas.
2. O histórico financeiro do profissional disponibiliza a visualização do comprovante bancário com o código de liquidação informado pelo admin.
