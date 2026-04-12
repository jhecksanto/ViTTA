# Plano de Implementação: Issue 2 - Upload de Documentos

## 1. Análise Atual
O componente `SettingsView` (em `src/App.tsx`) atualmente permite a edição de dados do perfil do usuário e o upload da foto de perfil. No entanto, não há campos para o upload da frente e do verso do documento de identidade, conforme solicitado na Issue 2.

## 2. Estrutura de Dados (Firestore)
Precisamos adicionar dois novos campos à entidade `User` no arquivo `firebase-blueprint.json` para armazenar as URLs dos documentos:
- `documentFrontUrl`: URL da imagem da frente do documento.
- `documentBackUrl`: URL da imagem do verso do documento.

## 3. Passos para Implementação

### Passo 3.1: Atualizar `firebase-blueprint.json`
- Adicionar `documentFrontUrl` (tipo string) e `documentBackUrl` (tipo string) na entidade `User`.

### Passo 3.2: Atualizar `SettingsView` em `src/App.tsx`
- **Estado**: 
  - Atualizar o estado `profileData` para incluir `documentFrontUrl` e `documentBackUrl`.
  - Adicionar estados para os arquivos selecionados: `selectedFrontFile` e `selectedBackFile`.
  - Adicionar estados de loading específicos para os documentos (opcional, mas recomendado para melhor UX) ou usar o `isSaving` geral.
- **Manipuladores de Evento**:
  - Criar funções `handleFrontFileChange` e `handleBackFileChange` (semelhantes a `handleFileChange` da foto de perfil) para ler os arquivos selecionados e gerar um preview local (DataURL) para exibição imediata.
- **Upload (Firebase Storage)**:
  - Atualizar a função `handleSave` para fazer o upload dos documentos selecionados para o Firebase Storage.
  - Caminhos sugeridos: `users/${user.uid}/documents/front_id` e `users/${user.uid}/documents/back_id`.
  - Obter as URLs de download (`getDownloadURL`) após o upload.
- **Salvamento (Firestore)**:
  - Incluir as novas URLs (`documentFrontUrl`, `documentBackUrl`) no objeto `updatedData` que é salvo no Firestore via `setDoc`.
- **Interface (UI)**:
  - Na seção "Documentos" do `SettingsView`, adicionar a interface para upload.
  - Criar dois blocos visuais (um para frente, outro para verso) que mostrem o preview da imagem (se houver) ou um ícone de placeholder.
  - Adicionar inputs do tipo `file` (ocultos) acionados por botões ou clicando na área de preview.

## 4. Próximos Passos
Após a aprovação deste plano, iniciarei a modificação dos arquivos `firebase-blueprint.json` e `src/App.tsx`.
