# Issue #4: Fluxo de Acesso de Convidados e Segurança de Acesso à Telemedicina
**Data e Hora de Geração:** 15 de junho de 2026, 20:03:29 (Horário de Brasília)

---

## 📌 Descrição
Garantir o tratamento correto para usuários que entram via link único de telemedicina mas não estão autenticados no sistema, ou usuários autenticados que tentam entrar em chamadas que não lhes pertencem.

## 🛠 Requisitos de Implementação
1. **Verificação de Permissão Básica:**
   * No interceptador de roteamento deep-linking (Issue #1), comparar o identificador do usuário ativo logado (`user.uid`) com os dados recuperados no agendamento (`professionalId` e `userId`).
   * No caso de não correspondência (usuário logado tentando espionar outra sala), lançar um alerta vermelho informando que o acesso é confidencial e restaurar a página inicial sem conceder o `activeTelemedicineApt`.

2. **Fluxo Simples para Logout / Usuário Convidado:**
   * Caso o link de telemedicina seja aberto por um navegador não logado (ex: o paciente abriu no computador do irmão ou o médico compartilhou o link rápido para um doutor supervisor que não tem login rápido):
     * Exibir uma tela de login rápido ou modal intuitivo.
     * Mensagem: *"Para acessar esta transmissão médica segura, por favor realize o login com as credenciais cadastradas na Vitta."*
     * Apresentar o formulário simplificado de login conectado ao provedor e, após o login bem-sucedido, redirecioná-lo diretamente àquela chamada correspondente à query string inicial sem interrupção.

## ✅ Critérios de Aceite
- Usuários autenticados que não possuem ligação direta com o agendamento correspondente ao ID da sala são impedidos de ingressar na sala com mensagem de erro amigável.
- Usuários não-autenticados que clicam no link único são convidados a realizar login simplificado antes de prosseguir e, após autenticar, caem direto dentro do `TelemedicineRoom` ativo.
---
