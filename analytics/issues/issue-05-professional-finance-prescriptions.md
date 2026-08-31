# Issue 05: Prescrição Médica Digital em PDF e Finanças/Repasses Médicos
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Clínico & Médico  
**Páginas:** `professional-dashboard` (Prescrição), `professional-finance` (`ProfessionalFinanceView`)

---

## 1. Escopo & Objetivos
Finalizar o gerador de receita médica e atestado em PDF formatado para impressão, e o formulário com validação de chave Pix e extrato detalhado de repasses médicos.

## 2. Tarefas Detalhadas
- [ ] **Prescrição Médica e Atestado em PDF:** Modal de emissão de receita com medicamentos, posologia, orientações, cabeçalho padronizado do médico, CRM/UF e suporte à impressão direta via `@media print`.
- [ ] **Validação de Chave Pix no Saque:** Verificação de formatos válidos (CPF, CNPJ, E-mail, Celular com DDD, Chave EVP) antes de autorizar o envio da solicitação.
- [ ] **Extrato Detalhado de Consultas:** Tabela discriminando data da consulta, nome do paciente, valor bruto faturado, taxa ViTTA retida e valor líquido creditado.
- [ ] **Comprovante de Repasse:** Modal para visualização e download de recibo dos saques efetivados.

## 3. Critérios de Aceite
- A receita médica é impressa com layout médico padronizado e limpo, sem botões ou elementos de interface.
- Chaves Pix inválidas são bloqueadas com mensagem explicativa antes da submissão.
- O extrato reflete fielmente o histórico de atendimentos e os saques solicitados.
