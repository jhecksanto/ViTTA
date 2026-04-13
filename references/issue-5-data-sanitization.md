# Issue 5: Saneamento de Dados (Data Sanitization)

## Descrição
A camada de validação e limpeza de dados antes de enviá-los ao Firestore não foi implementada. Isso é crucial para evitar erros de serialização com objetos complexos ou dados `undefined`.

## Page / Component
- Global (Utilitários / Funções de serviço do Firebase)

## Comportamentos Esperados (Behaviors)
1. **Implementação**: Criar funções utilitárias ou wrappers para as chamadas do Firestore (como `addDoc`, `setDoc`, `updateDoc`).
2. **Limpeza**: Estas funções devem remover campos `undefined`, garantir os tipos corretos dos dados e evitar erros de serialização de objetos complexos antes da escrita no banco de dados.
