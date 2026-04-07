# Issue 1: Implementar Modal de Criação de Usuário (Admin)

## Descrição
Implementar a funcionalidade de criação de novos usuários no painel administrativo (`UsersView`).

## Requisitos
- Criar o componente `CreateUserModal`.
- Campos: Nome completo, E-mail, Senha inicial, Status (Ativo/Inativo), Plano (Básico/Premium).
- Integrar com `createUserWithEmailAndPassword` do Firebase Auth.
- Salvar dados adicionais na coleção `users` do Firestore.
- Disparar notificação de boas-vindas.

## Localização
`src/components/CreateUserModal.tsx` ou interno à `UsersView` em `src/App.tsx`.
