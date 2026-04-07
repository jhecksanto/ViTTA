# Especificação Técnica - Funcionalidades Pendentes (ViTTA Health)

Esta especificação detalha os componentes, comportamentos e fluxos que ainda precisam ser implementados no sistema ViTTA Health, conforme identificado no `report.md`.

## 1. Componentes (Components)

### 1.1. Modal de Criação de Usuário (`CreateUserModal`)
- **Localização:** `src/components/CreateUserModal.tsx` (ou interno à `UsersView`).
- **Campos:** Nome completo, E-mail, Senha inicial, Status (Ativo/Inativo), Plano (Básico/Premium), Foto (Upload).
- **Comportamento:**
    - Validar campos obrigatórios.
    - Integrar com `createUserWithEmailAndPassword` (Firebase Auth).
    - Salvar metadados na coleção `users` do Firestore após criação no Auth.
    - Gerar notificação de boas-vindas para o novo usuário.

### 1.2. Capturador de Erros Global (`ErrorBoundary`)
- **Localização:** `src/components/ErrorBoundary.tsx`.
- **Funcionalidade:** Envolver o componente `App` no `main.tsx`.
- **Interface:** Exibir uma tela de erro personalizada com o logo da ViTTA, mensagem amigável ("Algo deu errado, mas estamos cuidando disso") e um botão de "Recarregar Página".

### 1.3. Seção de Logs de Auditoria (`AuditLogsList`)
- **Localização:** `src/components/Admin/AuditLogsList.tsx` (dentro de `UserConfigView`).
- **Funcionalidade:** Listar ações administrativas (ex: "Admin X alterou o plano do Usuário Y").
- **Dados:** Timestamp, ID do Admin, Ação, Descrição.

## 2. Comportamentos e Lógica (Behaviors)

### 2.1. Cálculo Dinâmico de Variação de Saúde
- **Localização:** `PatientDashboardView`.
- **Lógica:**
    - Buscar os últimos 14 dias de `health_metrics`.
    - Dividir em dois períodos de 7 dias (Atual vs. Anterior).
    - Calcular a média de cada período.
    - Fórmula: `((Média_Atual - Média_Anterior) / Média_Anterior) * 100`.
    - Atualizar a prop `change` nos cards de estatísticas.

### 2.2. Persistência de Configurações de Acesso
- **Localização:** `UserConfigView`.
- **Lógica:**
    - Criar coleção `system_configs` no Firestore.
    - Implementar `onSnapshot` para carregar `accessLevels`.
    - Atualizar a função `handleSaveEdit` para usar `setDoc` ou `updateDoc` no Firestore em vez de apenas atualizar o state local.

### 2.3. Fluxo de Desafio 2FA (Login)
- **Localização:** `LoginView` / `AuthFlow`.
- **Lógica:**
    - Após o login bem-sucedido com e-mail/senha, verificar no documento do usuário (`users/{uid}`) se `twoFactorEnabled` é `true`.
    - Se `true`, interromper o acesso e exibir um campo para código de verificação (enviado via e-mail ou SMS, dependendo da implementação futura).
    - Liberar o acesso ao dashboard apenas após validação do código.

### 2.4. Gatilhos de Notificação Adicionais
- **Eventos:**
    - **Cancelamento de Consulta:** Disparar quando um admin ou profissional exclui um agendamento.
    - **Resgate de Oferta:** Disparar quando o usuário clica em "Resgatar" em uma oferta.
    - **Alteração de Senha:** Disparar após sucesso no `ChangePasswordModal`.
- **Lógica:** Adicionar documento à coleção `notifications` com `userId`, `title`, `message`, `type` e `createdAt`.

## 3. Integrações e Dados (Data)

### 3.1. Upload de Documentos na Configuração
- **Localização:** `SettingsView` (Seção de Documentos).
- **Funcionalidade:**
    - Adicionar inputs de arquivo para "Frente do Documento" e "Verso do Documento".
    - Salvar arquivos no Firebase Storage em `users/{uid}/documents/`.
    - Salvar as URLs resultantes no documento do usuário no Firestore.

### 3.2. Saneamento de Dados no Firestore
- **Localização:** `handleFirestoreError` e wrappers de escrita.
- **Funcionalidade:** Implementar uma camada de validação/limpeza antes de `addDoc` ou `setDoc` para garantir que objetos complexos não causem erros de serialização no SDK do Firestore.

---
*Documento gerado em: 07 de Abril de 2026*
