# Issue 4: Gatilhos de Notificação (Triggers)

## Descrição
Faltam os gatilhos no sistema para gerar notificações automáticas em eventos importantes para o usuário.

## Page / Component
- Vários componentes onde as ações ocorrem (ex: AppointmentsView, OffersView, SettingsView).

## Comportamentos Esperados (Behaviors)
1. **Implementação**: Adicionar chamadas para a função de criação de notificações (inserção de documentos na coleção `notifications` no Firestore) nos seguintes fluxos:
    - Ao cancelar uma consulta com sucesso.
    - Ao resgatar uma oferta com sucesso.
    - Ao alterar a senha com sucesso.
