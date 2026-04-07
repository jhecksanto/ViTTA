# Issue 06: Finalizar Configurações de Perfil e Segurança (`SettingsView`)

**Descrição:**
Implementar as funcionalidades de segurança e persistência de mídia que atualmente são apenas visuais.

**Tarefas:**
1.  **Upload de Foto:** Integrar com Firebase Storage para salvar a foto de perfil e atualizar o `photoURL` no Firestore e no Auth.
2.  **Alterar Senha:** Implementar o fluxo de troca de senha usando `updatePassword` do Firebase Auth.
3.  **2FA:** Implementar a interface e lógica básica para ativação de autenticação em duas etapas.
4.  **Exclusão de Conta:** Conectar o botão de solicitação de exclusão a um fluxo que marque o usuário para revisão (campo `deletionRequested: true`).

**Critérios de Aceite:**
*   A foto de perfil deve persistir após o refresh da página.
*   O fluxo de alteração de senha deve funcionar (validando requisitos de segurança).
