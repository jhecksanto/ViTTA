# Issue 2: Upload de Documentos (Firebase Storage)

## Descrição
A funcionalidade de upload de imagens (Frente e Verso do Documento de identidade) para o Firebase Storage e o salvamento das URLs resultantes no documento do usuário no Firestore ainda não foi implementada.

## Page / Component
- **Page**: SettingsView
- **Component**: `SettingsView`

## Comportamentos Esperados (Behaviors)
1. **Interface**: Adicionar inputs do tipo `file` para "Frente do Documento" e "Verso do Documento" na interface de configurações.
2. **Upload**: Implementar a função de manipulação do upload (`handleFileUpload`) utilizando a API do Firebase Storage (`uploadBytes`, `getDownloadURL`).
3. **Armazenamento**: Salvar as imagens em um caminho seguro e estruturado (ex: `users/{userId}/documents/frente.jpg`).
4. **Persistência**: Atualizar o documento do usuário no Firestore com as URLs geradas (`documentFrontUrl`, `documentBackUrl`).
5. **Feedback**: Exibir feedback visual de upload em andamento (loading state) e de sucesso ou erro para o usuário.
