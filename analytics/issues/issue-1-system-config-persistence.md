# Issue 1: Persistência de Configurações do Sistema

## Descrição
Atualmente, as alterações nos níveis de acesso (`accessLevels`) no painel administrativo são feitas apenas no estado local do componente. É necessário integrar com o Firestore para garantir a persistência real desses dados.

## Page / Component
- **Page**: AdminView
- **Component**: `UserConfigView`

## Comportamentos Esperados (Behaviors)
1. **Carregamento**: Adicionar um `useEffect` para buscar os `accessLevels` de uma coleção no Firestore (ex: `system_configs`) ao inicializar o componente, utilizando `onSnapshot` ou `getDoc`.
2. **Salvamento**: Atualizar a função `handleSaveEdit` para fazer um `setDoc` ou `updateDoc` no Firestore, persistindo as alterações feitas pelo administrador, em vez de apenas atualizar o estado local.
