# Especificação Técnica das Pendências do Sistema ViTTA
**Data e Hora de Geração:** 01/09/2026 às 16:59 (Horário de Brasília - UTC-3)  
**Documento Base:** `analytics/report.md`  
**Objetivo:** Especificar exclusivamente o que resta para finalizar no sistema existente (Páginas, Comportamentos e Componentes), sem inclusão de novas funcionalidades.

---

## 1. Especificação de Componentes e Telas

### 1.1 Modal de Cancelamento de Consulta pelo Paciente (`PatientCancelAppointmentModal.tsx`)
*   **Contexto / Página:** Aba de Consultas do Paciente (`MyAppointments` / `PatientView`).
*   **Comportamento Requerido:**
    *   Exibir botão de "Cancelar Consulta" para agendamentos com status `"upcoming"`.
    *   Ao clicar, abrir modal solicitando confirmação e motivo do cancelamento (opcional).
    *   Verificar o valor pago na consulta (campo `price` ou ViTTA Coins).
    *   Atualizar o documento da consulta em `appointments` para `status: "cancelled"`, `cancelledBy: "patient"`, `cancelledAt: Timestamp.now()`, `cancelReason: string`.
    *   Efetuar o estorno do valor na carteira do paciente via `increment(price)` no documento `users/{userId}`.
    *   Registrar documento na coleção `transactions` com tipo `"refund"`, descrevendo o reembolso da consulta desmarcada.
    *   Disparar notificação in-app para o profissional informando o cancelamento do paciente.

### 1.2 Encerramento Automático da Sala de Telemedicina (`SOAPConsultationModal.tsx` e `TelemedicineView.tsx`)
*   **Contexto / Página:** Atendimento Telemedicina e Modal SOAP do Profissional de Saúde.
*   **Comportamento Requerido:**
    *   Ao finalizar o atendimento clínico e clicar em "Concluir Atendimento" no `SOAPConsultationModal.tsx`, atualizar a consulta para `status: "completed"`, `telemedicineStatus: "closed"`, `completedAt: Timestamp.now()`.
    *   No componente de Telemedicina (`TelemedicineView`), verificar em tempo real se a sala foi fechada pelo médico e redirecionar o paciente com modal de conclusão de atendimento.

### 1.3 Filtro Avançado e Ordenação na Central de Exames (`ExamsView`)
*   **Contexto / Página:** Painel de Exames do Paciente (`ExamsView`).
*   **Comportamento Requerido:**
    *   Adicionar seletor de status ("Todos", "Pronto / Disponível", "Aguardando Resultado").
    *   Adicionar campo de busca por nome do exame e laboratório em tempo real.
    *   Adicionar ordenação rápida por data (mais recente / mais antigo).

### 1.4 Higienização e Modularização das Views em `src/App.tsx`
*   **Contexto / Arquitetura:** `src/App.tsx`.
*   **Comportamento Requerido:**
    *   Garantir que a renderização dos painéis no `App.tsx` delegue totalmente para os módulos extraídos em `src/components/Admin/`, `src/components/Professional/`, `src/components/Patient/` e `src/components/System/`.
    *   Remover duplicidades de modais já migrados para componentes dedicados.

---

## 2. Tabela Resumo das Especificações

| Componente / Área | Arquivo Alvo | Ação / Comportamento |
| :--- | :--- | :--- |
| **Cancelamento de Consulta** | `src/components/Patient/PatientAppointmentsView.tsx` ou `src/App.tsx` | Cancelamento com estorno em carteira e registro de transação `refund`. |
| **Fechamento de Telemedicina**| `src/components/Professional/SOAPConsultationModal.tsx` & Telemedicina | Fechamento de sala e bloqueio de reentrada após conclusão da consulta. |
| **Filtros de Exames** | `src/App.tsx` (`ExamsView`) | Filtros por status, busca por texto e ordenação temporal. |
| **Limpeza de Código** | `src/App.tsx` | Redução de duplicidade e desacoplamento de rotas. |
