# Issue 01: Finalização do Painel Geral ViTTA, KYC e Analytics Master
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Administração Master & Ecossistema  
**Páginas:** `admin` (`AdminView`), `admin-analytics` (`AnalyticsView`)

---

## 1. Escopo & Objetivos
Finalizar a gestão de parceiros, aprovação em lote de profissionais (KYC), exportação de relatórios em CSV e o filtro dinâmico temporal do módulo de Analytics.

## 2. Tarefas Detalhadas
- [ ] **Desativação Segura de Parceiros:** Integrar diálogo de confirmação com contagem de cupons ativos vinculados e batch de desativação.
- [ ] **Validação de Documentos de Profissionais (KYC):** Salvar status `approved` ou `rejected`, disparar notificação no Firestore para o médico e registrar evento em `audit_logs`.
- [ ] **Exportador de Relatórios em CSV:** Implementar função para download de arquivo CSV contendo os dados tabulares de usuários cadastrados e parceiros.
- [ ] **Filtro de Período no Analytics:** Conectar seletor temporal (`today`, `7d`, `30d`, `month`, `custom`) às queries do Firestore nas coleções `transactions` e `appointments`.
- [ ] **Cálculo de Conversão:** Exibir percentual de consultas concluídas versus canceladas no período selecionado.

## 3. Critérios de Aceite
- Ao desativar um parceiro, vouchers ativos são cancelados automaticamente e o admin recebe toast de confirmação.
- Profissionais aprovados recebem notificação imediata em seu painel.
- O CSV exportado é gerado com formatação UTF-8 e delimitador correto.
- Os gráficos de Analytics atualizam instantaneamente conforme o período selecionado.
