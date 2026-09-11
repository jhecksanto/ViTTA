# Issue 06: Financeiro - Validação de Chaves Pix e Comprovante de Liquidação
**Data e Hora de Geração:** 11/09/2026 às 19:35 (Horário de Brasília - UTC-3)  
**Módulo:** Financeiro / Saques Pix & Recibos  
**Prioridade:** P1 (Alta)  
**Arquivos Alvo:** `src/components/Professional/ProfessionalFinanceView.tsx`, `src/components/Professional/PayoutReceiptModal.tsx`

---

## 1. Descrição e Contexto
O formulário de solicitação de saque Pix no painel financeiro do profissional de saúde precisa validar a estrutura da chave Pix (CPF, CNPJ, E-mail, Telefone celular ou Chave Aleatória EVP) para prevenir solicitações com dados incorretos. Adicionalmente, quando o administrador liquida o saque e insere o código E2E bancário, o profissional deve conseguir visualizar e imprimir o recibo detalhado de liquidação (`PayoutReceiptModal.tsx`).

---

## 2. Requisitos Técnicos
1. **Validador de Chaves Pix:**
   - Implementar funções de validação por tipo de chave selecionada:
     - `CPF`: Validação matemática de 11 dígitos com cálculo de módulo 11.
     - `CNPJ`: Validação de 14 dígitos.
     - `EMAIL`: Validação por expressão regular RFC 5322.
     - `PHONE`: Validação de número de telefone celular brasileiro com DDD.
     - `RANDOM`: Validação de padrão UUIDv4.
   - Bloquear a submissão com aviso explicativo enquanto o valor for inválido.
2. **Visualização do Recibo de Liquidação (`PayoutReceiptModal`):**
   - No extrato do profissional, para saques com `status === 'completed'` ou `status === 'approved'`, adicionar o botão `"Ver Comprovante"`.
   - Abrir o modal exibindo: ID da transação, End-to-End ID do Pix, data da liquidação, dados da chave e valores (bruto, taxa e líquido recebido).

---

## 3. Critérios de Aceite
- [ ] Chaves Pix inválidas são rejeitadas com indicação visual no campo.
- [ ] O profissional consegue abrir o recibo com o código E2E bancário e dados completos da liquidação.
