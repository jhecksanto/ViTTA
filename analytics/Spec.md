# Especificação Técnica de Pendências (Spec) - ViTTA Health

Este documento detalha as especificações técnicas estritamente para as funcionalidades e melhorias que ainda faltam ser implementadas no sistema, com base no relatório de pendências (`analytics/report.md`).

## 1. Pages (Páginas)

### 1.1. AdminView (Painel Administrativo)
- **Seção**: Configurações do Sistema (`UserConfigView`).
- **Objetivo**: Garantir que as configurações do sistema sejam salvas e carregadas do banco de dados em tempo real.

### 1.2. SettingsView (Configurações e Perfil)
- **Seção**: Segurança e Upload de Documentos.
- **Objetivo**: Permitir o upload de documentos de identificação e gerenciar as preferências de segurança do usuário.

### 1.3. LoginView (Autenticação)
- **Seção**: Fluxo de Login.
- **Objetivo**: Implementar a etapa de verificação de dois fatores (2FA) para usuários que ativaram essa opção.

## 2. Behaviors (Comportamentos)

### 2.1. Persistência de Configurações do Sistema
- **Ação**: Salvar alterações nos níveis de acesso (`accessLevels`).
- **Implementação**: 
    - Criar/atualizar documentos em uma coleção `system_configs` no Firestore sempre que o administrador salvar as edições. 
    - Carregar esses dados ao inicializar o componente utilizando `onSnapshot` ou `getDoc`.

### 2.2. Fluxo de Desafio 2FA (Autenticação de Dois Fatores)
- **Ação**: Exigir código de verificação após login bem-sucedido com e-mail e senha.
- **Implementação**:
    - Após a validação de e-mail e senha, verificar se `twoFactorEnabled` é `true` no documento do usuário no Firestore.
    - Se for `true`, não redirecionar imediatamente para o dashboard.
    - Exibir uma interface solicitando o código 2FA.
    - Validar o código (requer implementação de lógica de envio/validação de código, possivelmente simulada ou via integração com serviço de e-mail/SMS).

### 2.3. Upload de Documentos (Firebase Storage)
- **Ação**: Fazer upload das imagens da Frente e Verso do documento de identidade.
- **Implementação**:
    - Utilizar a API do Firebase Storage (`uploadBytes`, `getDownloadURL`).
    - Salvar as imagens em um caminho seguro e estruturado (ex: `users/{userId}/documents/frente.jpg`).
    - Atualizar o documento do usuário no Firestore com as URLs geradas (`documentFrontUrl`, `documentBackUrl`).

### 2.4. Gatilhos de Notificação (Triggers)
- **Ação**: Disparar notificações no sistema para eventos específicos.
- **Implementação**: Adicionar chamadas para a função de criação de notificações (inserção na coleção `notifications`) nos seguintes fluxos:
    - Ao cancelar uma consulta.
    - Ao resgatar uma oferta.
    - Ao alterar a senha com sucesso.

### 2.5. Saneamento de Dados (Data Sanitization)
- **Ação**: Limpar e validar dados antes de enviá-los ao Firestore.
- **Implementação**: Criar funções utilitárias ou wrappers para as chamadas do Firestore que removam campos `undefined`, garantam tipos corretos e evitem erros de serialização de objetos complexos.

### 2.6. Substituição de Mock Data
- **Ação**: Remover dados estáticos do arquivo `src/constants.ts`.
- **Implementação**: Implementar hooks ou chamadas diretas ao Firestore (`getDocs`, `onSnapshot`) para buscar categorias, parceiros, exames, consultas, estatísticas de saúde, ofertas e profissionais reais, integrando-os aos respectivos componentes.

## 3. Components (Componentes)

### 3.1. `UserConfigView`
- **Modificações**:
    - Adicionar `useEffect` para buscar `accessLevels` do Firestore.
    - Atualizar `handleSaveEdit` para fazer um `setDoc` ou `updateDoc` no Firestore em vez de apenas atualizar o estado local.

### 3.2. `SettingsView`
- **Modificações**:
    - Adicionar inputs do tipo `file` para "Frente do Documento" e "Verso do Documento".
    - Implementar a função de manipulação do upload (`handleFileUpload`) integrando com o Firebase Storage.
    - Exibir feedback visual de upload em andamento (loading state) e sucesso/erro.

### 3.3. `LoginView`
- **Modificações**:
    - Adicionar novo estado para controlar a etapa do login (ex: `step: 'credentials' | '2fa'`).
    - Criar a interface de input para o código 2FA.
    - Implementar a lógica de verificação do código 2FA antes de concluir a autenticação e redirecionar o usuário.
