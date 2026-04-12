# Plano de Implementação: Issue 1 - Persistência de Configurações do Sistema

## 1. Análise Atual
O componente `UserConfigView` (em `src/App.tsx`) gerencia os níveis de acesso (`accessLevels`) usando apenas o estado local do React (`useState`). Quando o administrador edita um nível de acesso, a função `handleSaveEdit` atualiza apenas a variável de estado, o que significa que as alterações são perdidas ao recarregar a página.

## 2. Estrutura de Dados (Firestore)
Para persistir essas configurações, criaremos uma nova coleção chamada `system_configs`.
- **Coleção**: `system_configs`
- **Documento**: `access_levels`
- **Estrutura do Documento**:
  ```json
  {
    "levels": [
      { "id": 1, "role": "Administrador", "desc": "Acesso total ao sistema e configurações" },
      { "id": 2, "role": "Moderador", "desc": "Gerenciamento de usuários e conteúdos" },
      { "id": 3, "role": "Usuário Padrão", "desc": "Acesso às funcionalidades básicas" }
    ]
  }
  ```

## 3. Passos para Implementação

### Passo 3.1: Atualizar `firebase-blueprint.json`
- Adicionar a entidade `SystemConfig` em `entities`.
- Adicionar o caminho `/system_configs/{configId}` em `firestore`.

### Passo 3.2: Atualizar `UserConfigView` em `src/App.tsx`
- **Importações**: Garantir que `doc`, `getDoc`, `setDoc`, `onSnapshot` do `firebase/firestore` e `db`, `handleFirestoreError` estejam disponíveis.
- **Estado Inicial**: Manter os valores padrão como fallback, mas adicionar um estado de `loading` (opcional).
- **Carregamento (Load)**:
  - Adicionar um `useEffect` que escuta o documento `doc(db, 'system_configs', 'access_levels')` usando `onSnapshot`.
  - Se o documento existir, atualizar o estado `accessLevels` com os dados do Firestore.
  - Se não existir, criar o documento inicial com os valores padrão usando `setDoc`.
- **Salvamento (Save)**:
  - Modificar a função `handleSaveEdit`.
  - Calcular o novo array de `accessLevels`.
  - Chamar `setDoc(doc(db, 'system_configs', 'access_levels'), { levels: newAccessLevels }, { merge: true })`.
  - Envolver a chamada do Firestore em um bloco `try...catch` e usar `handleFirestoreError` para tratamento de erros.

### Passo 3.3: Atualizar Regras de Segurança (se aplicável)
- Garantir que apenas usuários com a role `admin` possam ler e escrever na coleção `system_configs`. (Isso pode ser feito em uma etapa posterior de revisão de segurança, mas é bom ter em mente).

## 4. Próximos Passos
Após a aprovação deste plano, iniciarei a modificação dos arquivos `firebase-blueprint.json` e `src/App.tsx`.
