# Issue 3: Implementar Seção de Logs de Auditoria

## Descrição
Criar uma lista para visualizar ações administrativas realizadas no sistema.

## Requisitos
- Criar o componente `AuditLogsList`.
- Exibir: Timestamp, ID do Admin, Ação realizada, Descrição.
- Integrar com uma coleção `audit_logs` no Firestore.

## Localização
`src/components/Admin/AuditLogsList.tsx` (exibir dentro de `UserConfigView`).
