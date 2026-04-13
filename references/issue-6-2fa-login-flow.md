# Issue 6: Fluxo de Desafio 2FA no Login

## Descrição
Implementar a verificação de segundo fator durante o processo de login.

## Requisitos
- Verificar se o usuário tem 2FA ativo após o login inicial.
- Se ativo, exibir tela para inserção do código de verificação.
- Bloquear acesso ao dashboard até que o código seja validado.

## Localização
`LoginView` / `AuthFlow` em `src/App.tsx`.
