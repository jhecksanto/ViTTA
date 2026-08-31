# Issue 07: Busca Avançada de Profissionais, Pagamento com ViTTA Coins e Google Calendar
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Módulo Paciente & Benefícios  
**Páginas:** `professionals` (`ProfessionalsView`)

---

## 1. Escopo & Objetivos
Finalizar a busca combinada de especialistas, fluxo de confirmação e pagamento com débito de ViTTA Coins, validação de saldo insuficiente e integração com o Google Calendar.

## 2. Tarefas Detalhadas
- [ ] **Filtro Combinado Avançado:** Permitir filtrar simultaneamente por especialidade médica, cidade/bairro, modalidade (Presencial vs Telemedicina) e ordenação por preço ou avaliação.
- [ ] **Pagamento com Débito de Carteira:** Validar se o saldo em ViTTA Coins do paciente é suficiente para cobrir a consulta; se insuficiente, exibir aviso com link direto para recarga.
- [ ] **Sincronização com Google Calendar:** Botão "Adicionar à Google Agenda" na tela de sucesso gerando link com data, horário, médico e link de telemedicina.

## 3. Critérios de Aceite
- Filtros por modalidade exibem apenas médicos que atendem naquele formato.
- Débito da consulta desconta o valor exato da carteira do paciente e cria agendamento com status `upcoming`.
- O link do Google Calendar preenche todos os parâmetros corretamente no navegador.
