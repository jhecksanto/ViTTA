# Relatório de Pendências - Sistema ViTTA Health

Este relatório detalha as funcionalidades e melhorias que ainda precisam ser implementadas ou finalizadas no sistema ViTTA Health, com base na análise atual do código-fonte.

## 1. Painel Administrativo (AdminView)

### Configurações do Sistema (`UserConfigView`)
- **Persistência de Dados**: As alterações nos níveis de acesso (`accessLevels`) são feitas apenas no estado local. É necessário integrar com o Firestore (ex: criar uma coleção `system_configs`) para persistência real.

## 2. Configurações e Perfil (`SettingsView`)

### Segurança
- **Autenticação de Dois Fatores (2FA)**: A interface permite ativar/desativar o 2FA e salva essa preferência no Firestore. No entanto, o fluxo de desafio real (exigir um código de verificação após o login com e-mail/senha) no `LoginView` ainda não foi implementado.

### Upload de Documentos
- **Envio de Imagens**: A funcionalidade de upload de imagens (Frente e Verso do Documento) para o Firebase Storage e o salvamento das URLs resultantes no documento do usuário no Firestore não foi implementada.

## 3. Sistema de Notificações

### Gatilhos (Triggers)
- Faltam os gatilhos para gerar notificações automáticas em eventos importantes, como:
    - Cancelamento de consultas.
    - Resgate de ofertas.
    - Alteração de senha.

## 4. Arquitetura e Qualidade de Código

### Saneamento de Dados
- **Validação antes do Firestore**: A camada de validação/limpeza de dados antes de enviar ao Firestore (ex: no `handleFirestoreError` ou em wrappers de escrita) não foi implementada. É importante para evitar erros de serialização com objetos complexos.

### Mock Data
- **Remoção de `constants.ts`**: O arquivo `src/constants.ts` ainda contém dados mockados (`MOCK_CATEGORIES`, `MOCK_PARTNERS`, `MOCK_EXAMS`, `MOCK_APPOINTMENTS`, `MOCK_STATS`, `MOCK_OFFERS`, `MOCK_PROFESSIONALS`) que precisam ser substituídos por buscas reais no banco de dados.

---
*Relatório gerado em: 11 de Abril de 2026*
