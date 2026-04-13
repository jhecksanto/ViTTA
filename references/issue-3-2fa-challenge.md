# Issue 3: Fluxo de Desafio 2FA (Autenticação de Dois Fatores)

## Descrição
A interface permite ativar/desativar o 2FA nas configurações, mas o fluxo de desafio real (exigir um código de verificação após o login com e-mail/senha) no momento do login ainda não foi implementado.

## Page / Component
- **Page**: LoginView
- **Component**: `LoginView`

## Comportamentos Esperados (Behaviors)
1. **Verificação Inicial**: Após a validação de e-mail e senha, verificar se a flag `twoFactorEnabled` é `true` no documento do usuário no Firestore.
2. **Controle de Estado**: Se for `true`, não redirecionar imediatamente para o dashboard. Adicionar um novo estado para controlar a etapa do login (ex: `step: 'credentials' | '2fa'`).
3. **Interface 2FA**: Exibir uma interface solicitando o código 2FA.
4. **Validação**: Implementar a lógica de verificação do código 2FA antes de concluir a autenticação e redirecionar o usuário (pode ser simulada inicialmente ou integrada a um serviço real de envio de código).
