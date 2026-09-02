# Especificação Técnica de Finalização do Sistema ViTTA (Spec.md)
**Data e Hora de Geração:** 02/09/2026 às 07:36 (Horário de Brasília - UTC-3)  
**Objetivo:** Especificar estritamente os comportamentos, conexões e componentes que faltam ser finalizados com base no `analytics/report.md`.

---

## 1. Módulo: Avaliação de Consultas Concluídas (Patient Review Flow)

### 1.1. Contexto & Localização
*   **Página / View:** `MyAppointmentsView` (`src/components/Patient/MyAppointmentsView.tsx`).
*   **Componente Existente:** `ReviewModal` (`src/components/ReviewModal.tsx`).

### 1.2. Comportamento Esperado (Behavior)
1.  **Exibição Condicional da Ação:**
    *   Para cada consulta com status `status === "completed"`:
        *   Se `apt.isReviewed === true`: exibir badge ou texto sutil *"Avaliado ⭐ {apt.rating}"*.
        *   Se `apt.isReviewed !== true`: exibir botão destacado *"Avaliar Atendimento"* com ícone de estrela (`Star`).
2.  **Abertura do Modal de Avaliação:**
    *   Ao clicar no botão, definir o estado `selectedAppointmentForReview` com o objeto da consulta e abrir o `ReviewModal`.
3.  **Execução da Transação e Feedback:**
    *   O modal grava a avaliação na coleção `reviews`, atualiza a média e contagem de avaliações do médico em `professionals/{id}` e marca `isReviewed: true` em `appointments/{id}`.
    *   Ao concluir com sucesso, atualizar o card da consulta instantaneamente na tela do paciente e exibir notificação toast de agradecimento.

---

## 2. Módulo: Sincronização Unificada do Catálogo e Trava de Vouchers

### 2.1. Contexto & Localização
*   **Página / View:** `OffersView` (`src/components/Patient/OffersView.tsx`) e `AdminVoucherManagementView` (`src/components/Admin/AdminVoucherManagementView.tsx`).
*   **Entidades Firestore:** `vouchers_catalog` (ou `vouchers`), `system_configs/vouchers`.

### 2.2. Comportamento Esperado (Behavior)
1.  **Respeito à Trava Global de Vouchers:**
    *   Em `OffersView.tsx`, adicionar listener em tempo real para `doc(db, "system_configs", "vouchers")`.
    *   Se `vouchersEnabled === false`, exibir banner informativo amigável: *"O Clube de Vouchers está temporariamente em manutenção para atualização de benefícios. Volte em breve!"* desativando a listagem de resgate.
2.  **Fonte Unificada de Dados de Ofertas:**
    *   Garantir que a visão do paciente leia a mesma coleção alimentada e gerenciada pelo módulo administrativo (`vouchers` / `vouchers_catalog`).
    *   Exibir badges de desconto formatados, parceiro responsável e validade.

---

## 3. Módulo: Disparo de Notificação no Ciclo de Aprovação de KYC

### 3.1. Contexto & Localização
*   **Página / View:** `ProfessionalsManagementView` (`src/components/Admin/ProfessionalsManagementView.tsx`).
*   **Entidades Firestore:** `professionals/{profId}`, `notifications`.

### 3.2. Comportamento Esperado (Behavior)
1.  **Feedback Instantâneo de Aprovação:**
    *   Ao acionar `handleApproveKYC(prof, true)`:
        *   Atualizar documento do profissional (`kycStatus: "approved"`, `status: "active"`).
        *   Criar documento na coleção `notifications` com:
            ```json
            {
              "userId": "prof.userId || prof.id",
              "title": "Documentação Aprovada!",
              "message": "Seu cadastro profissional foi validado com sucesso pela equipe ViTTA. Sua agenda já está disponível para pacientes.",
              "type": "kyc_approved",
              "read": false,
              "createdAt": "Timestamp.now()"
            }
            ```
2.  **Feedback Instantâneo de Reprovação com Instrução:**
    *   Ao acionar `handleApproveKYC(prof, false)`:
        *   Atualizar documento (`kycStatus: "rejected"`, `status: "pending"`).
        *   Criar notificação in-app informando que os documentos precisam ser reenviados pelo painel do profissional.

---

## 4. Módulo: Validação e Higienização de Tipagem TypeScript

### 4.1. Contexto & Localização
*   **Arquivos:** `src/App.tsx`, `src/components/Patient/*`, `src/components/Professional/*`, `src/components/Admin/*`.

### 4.2. Comportamento Esperado (Behavior)
1.  **Verificação Estática:** Garantir que todas as props passadas aos componentes modulares atendam às interfaces TypeScript sem uso de `any` desnecessário ou propriedades ausentes.
2.  **Compilação Limpa:** Zero erros durante a execução de `lint_applet` e `compile_applet`.
