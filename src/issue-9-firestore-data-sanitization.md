# Issue 9: Saneamento de Dados no Firestore

## Descrição
Implementar uma camada de segurança e limpeza de dados antes de realizar escritas no Firestore.

## Requisitos
- Validar tipos de dados.
- Limpar campos nulos ou indefinidos que possam causar erros de serialização.
- Integrar nos wrappers de escrita existentes.

## Localização
`handleFirestoreError` e funções de escrita em `src/App.tsx`.
