# Issue 09: Cooldown no 2FA e Notificação Instantânea de Moderação KYC
**Data e Hora de Geração:** 04/09/2026 às 15:33 (Horário de Brasília - UTC-3)  
**Módulo:** Segurança & Moderação KYC  
**Componente Principal:** `src/components/SecuritySettingsModal.tsx`, `src/components/Admin/AdminKYCModerationView.tsx`

---

## 1. Descrição do Problema / Oportunidade de Finalização
No envio de códigos de autenticação em dois fatores (2FA), é necessário implementar um temporizador de cooldown (60s) para evitar disparos repetidos acidentais, além de notificar o usuário instantaneamente por notificação in-app quando sua documentação KYC for aprovada ou rejeitada pela administração.

---

## 2. Tarefas de Implementação
- [ ] Adicionar temporizador regressivo de 60 segundos no botão de reenvio de código 2FA em `SecuritySettingsModal.tsx`.
- [ ] Ao aprovar ou reprovar documentos na moderação de KYC (`AdminKYCModerationView.tsx`), gerar notificação correspondente na coleção `notifications` do Firestore para o usuário com o status e justificativa (caso reprovado).

---

## 3. Critérios de Aceite
1. O botão de reenvio de 2FA permanece desabilitado durante a contagem regressiva de 60 segundos.
2. O usuário recebe notificação em tempo real informando a conclusão da análise de sua documentação KYC.
