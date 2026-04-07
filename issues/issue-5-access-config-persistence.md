# Issue 5: Persistência de Configurações de Acesso

## Descrição
Garantir que as alterações nos níveis de acesso no painel admin sejam salvas no Firestore.

## Requisitos
- Criar/utilizar coleção `system_configs` no Firestore.
- Implementar listener em tempo real para carregar as configurações.
- Atualizar a função de salvamento para persistir os dados no banco.

## Localização
`UserConfigView` em `src/App.tsx`.
