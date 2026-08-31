# Issue 03: Consultas Globais, Logs de Auditoria e Chat de Suporte Admin
**Data e Hora de Geração:** 30 de Agosto de 2026 às 20:40:00 (Horário de Brasília - BRT / UTC-3)  
**Módulo:** Administração Master & Ecossistema  
**Páginas:** `admin-appointments` (`AdminAppointmentsView`), `admin-audit` (`AuditLogsList`), `admin-chat` (`AdminSupportChatView`)

---

## 1. Escopo & Objetivos
Finalizar o reagendamento e cancelamento administrativo com estorno, visualizador de payload em auditoria, exportação de logs e encerramento formal de tickets de suporte no chat admin.

## 2. Tarefas Detalhadas
- [ ] **Reagendamento de Consultas pelo Admin:** Modal com seletor de nova data/horário na agenda do profissional e disparo de notificações automáticas para ambas as partes.
- [ ] **Cancelamento com Estorno:** Exigir justificativa e executar estorno automático de créditos caso a consulta tenha sido paga com ViTTA Coins.
- [ ] **Busca Combinada de Agendamentos:** Filtro simultâneo por paciente, médico, CRM e ID.
- [ ] **Drawer de Payload em Auditoria:** Visualizador formatado com destaque para campos alterados em formato JSON.
- [ ] **Exportação de Logs de Auditoria:** Download de relatório em CSV/JSON para compliance.
- [ ] **Encerramento de Chamado no Chat Admin:** Botão para finalizar atendimento com alteração do status para `resolved` e envio de mensagem de encerramento.
- [ ] **Templates de Respostas Rápidas:** Menu dropdown com mensagens padronizadas de atendimento.

## 3. Critérios de Aceite
- Ao cancelar consulta pré-paga, o saldo do paciente é estornado imediatamente no Firestore.
- O drawer de auditoria renderiza o payload completo sem quebras de layout.
- O encerramento de ticket atualiza a listagem de chamados em tempo real.
